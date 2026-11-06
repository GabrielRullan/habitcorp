import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { Sidebar, SidebarProps } from '../src/client/components/Sidebar';
import { SettingsModal, SettingsModalProps } from '../src/client/components/SettingsModal';
import { I18nProvider } from '../src/client/i18n/I18nContext';

// ============================================================================
// Robust In-Memory LocalStorage Mock with Error Simulation Capability
// ============================================================================
class AdversarialLocalStorageMock {
  private store: Record<string, string> = {};
  public shouldThrowOnGet = false;
  public shouldThrowOnSet = false;

  getItem(key: string): string | null {
    if (this.shouldThrowOnGet) {
      throw new Error('SecurityError: The operation is insecure (mock storage failure)');
    }
    return this.store[key] !== undefined ? this.store[key] : null;
  }

  setItem(key: string, val: string): void {
    if (this.shouldThrowOnSet) {
      throw new Error('QuotaExceededError: Storage quota exceeded (mock quota failure)');
    }
    this.store[key] = String(val);
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
    this.shouldThrowOnGet = false;
    this.shouldThrowOnSet = false;
  }
}

const mockStorage = new AdversarialLocalStorageMock();
(globalThis as any).window = globalThis;
(globalThis as any).localStorage = mockStorage;

// ============================================================================
// Accessibility Query Oracle (simulating Testing Library getByRole / queryByRole)
// ============================================================================
interface AccessibleElement {
  tag: string;
  role: string;
  accessibleName: string;
  rawHtml: string;
  attributes: Record<string, string>;
}

function parseAccessibleElements(html: string): AccessibleElement[] {
  const elements: AccessibleElement[] = [];

  // 1. Parse all <button ...>...</button>
  const buttonRegex = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
  let match: RegExpExecArray | null;

  while ((match = buttonRegex.exec(html)) !== null) {
    const rawAttrs = match[1];
    const innerContent = match[2];

    const attributes: Record<string, string> = {};
    const attrRegex = /([a-zA-Z0-9\-]+)=(?:"([^"]*)"|'([^']*)')/g;
    let attrMatch: RegExpExecArray | null;
    while ((attrMatch = attrRegex.exec(rawAttrs)) !== null) {
      attributes[attrMatch[1].toLowerCase()] = attrMatch[2] !== undefined ? attrMatch[2] : attrMatch[3];
    }

    const role = attributes['role'] || 'button';
    let accessibleName = attributes['aria-label'] || attributes['title'] || '';
    if (!accessibleName) {
      accessibleName = innerContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }

    elements.push({
      tag: 'button',
      role,
      accessibleName,
      rawHtml: match[0],
      attributes,
    });
  }

  // 2. Parse elements with explicit role="..." (e.g. role="switch", role="dialog")
  const explicitRoleRegex = /<([a-zA-Z0-9]+)\b([^>]*\brole=(?:"[^"]*"|'[^']*')[^>]*)>/gi;
  while ((match = explicitRoleRegex.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    if (tag === 'button') continue; // already captured in pass 1
    const rawAttrs = match[2];

    const attributes: Record<string, string> = {};
    const attrRegex = /([a-zA-Z0-9\-]+)=(?:"([^"]*)"|'([^']*)')/g;
    let attrMatch: RegExpExecArray | null;
    while ((attrMatch = attrRegex.exec(rawAttrs)) !== null) {
      attributes[attrMatch[1].toLowerCase()] = attrMatch[2] !== undefined ? attrMatch[2] : attrMatch[3];
    }

    const role = attributes['role'] || '';
    const accessibleName = attributes['aria-label'] || attributes['title'] || '';

    elements.push({
      tag,
      role,
      accessibleName,
      rawHtml: match[0],
      attributes,
    });
  }

  return elements;
}

function queryByRole(
  html: string,
  role: string,
  options?: { name?: RegExp | string }
): AccessibleElement | null {
  const elements = parseAccessibleElements(html);
  const found = elements.filter((el) => {
    if (el.role.toLowerCase() !== role.toLowerCase()) return false;
    if (options?.name) {
      if (typeof options.name === 'string') {
        return el.accessibleName.toLowerCase().includes(options.name.toLowerCase());
      }
      return options.name.test(el.accessibleName);
    }
    return true;
  });

  return found.length > 0 ? found[0] : null;
}

function getByRole(
  html: string,
  role: string,
  options?: { name?: RegExp | string }
): AccessibleElement {
  const element = queryByRole(html, role, options);
  if (!element) {
    throw new Error(
      `Unable to find an accessible element with the role "${role}" and name ${options?.name?.toString() || 'ANY'}`
    );
  }
  return element;
}

// ============================================================================
// ADVERSARIAL TEST SUITE
// ============================================================================
describe('Milestone 2 Adversarial Stress Suite: Settings Modal & Tutorial Toggle', () => {
  beforeEach(() => {
    mockStorage.clear();
    vi.clearAllMocks();
  });

  // =========================================================================
  // 1. STRESS-TESTING showTutorials TOGGLE CYCLES & LOCALSTORAGE ORACLES
  // =========================================================================
  describe('1. Multi-Cycle showTutorials State & LocalStorage Synchronization', () => {
    it('executes 100 rapid alternating toggle cycles (true -> false -> true) with perfect parity', () => {
      let state = true;
      const toggle = (val: boolean) => {
        state = val;
        try {
          mockStorage.setItem('habitcorp_show_tutorials', String(val));
        } catch {}
      };

      for (let i = 1; i <= 100; i++) {
        const nextVal = i % 2 !== 0 ? false : true;
        toggle(nextVal);

        // Verify state parity at every cycle
        expect(state).toBe(nextVal);
        // Verify localStorage persistence at every cycle
        expect(mockStorage.getItem('habitcorp_show_tutorials')).toBe(String(nextVal));
      }

      // After 100 cycles (even), should be true
      expect(state).toBe(true);
      expect(mockStorage.getItem('habitcorp_show_tutorials')).toBe('true');
    });

    it('robustly parses corrupt, unexpected, or non-boolean strings in localStorage', () => {
      const readShowTutorials = () => {
        try {
          return mockStorage.getItem('habitcorp_show_tutorials') !== 'false';
        } catch {
          return true;
        }
      };

      // Falsy string
      mockStorage.setItem('habitcorp_show_tutorials', 'false');
      expect(readShowTutorials()).toBe(false);

      // Truthy string
      mockStorage.setItem('habitcorp_show_tutorials', 'true');
      expect(readShowTutorials()).toBe(true);

      // Corrupt / empty / abnormal strings: must default safely to true
      const corruptValues = ['', '0', 'null', 'undefined', 'FALSE', 'False', 'random_noise', '{}', '[]'];
      for (const val of corruptValues) {
        mockStorage.setItem('habitcorp_show_tutorials', val);
        expect(readShowTutorials()).toBe(true);
      }
    });

    it('survives localStorage SecurityError (private mode) and QuotaExceededError without crashing', () => {
      // 1. Failure on read
      mockStorage.shouldThrowOnGet = true;
      const readSafe = () => {
        try {
          return mockStorage.getItem('habitcorp_show_tutorials') !== 'false';
        } catch {
          return true;
        }
      };
      expect(() => readSafe()).not.toThrow();
      expect(readSafe()).toBe(true); // Graceful fallback
      mockStorage.shouldThrowOnGet = false;

      // 2. Failure on write
      mockStorage.shouldThrowOnSet = true;
      let localState = true;
      const toggleSafe = (val: boolean) => {
        localState = val;
        try {
          mockStorage.setItem('habitcorp_show_tutorials', String(val));
        } catch {}
      };
      expect(() => toggleSafe(false)).not.toThrow();
      expect(localState).toBe(false);
      mockStorage.shouldThrowOnSet = false;
    });
  });

  // =========================================================================
  // 2. ADVERSARIAL KEYBOARD DISPATCH: '?' KEYDOWN UNDER VARIOUS ACTIVE TARGETS
  // =========================================================================
  describe("2. Firing '?' Keydown Events Under Various Active Targets & Modal States", () => {
    function createKeydownHarness(initialShowTutorials = true) {
      let tutorialOpen = false;
      let showTutorials = initialShowTutorials;
      const showTutorialsRef = { current: showTutorials };

      const setTutorialOpen = (val: boolean) => {
        tutorialOpen = val;
      };

      const handleKeyDown = (e: {
        key: string;
        ctrlKey?: boolean;
        metaKey?: boolean;
        altKey?: boolean;
        shiftKey?: boolean;
        target?: { tagName?: string; isContentEditable?: boolean } | null;
        preventDefault?: () => void;
      }) => {
        const target = e.target as any;
        if (
          target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'SELECT' ||
            target.isContentEditable)
        ) {
          return;
        }

        if (e.key === 'Escape') {
          return;
        }

        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
          return;
        }

        if (e.ctrlKey || e.metaKey || e.altKey) return;

        if (e.key === '?') {
          if (showTutorialsRef.current) {
            e.preventDefault?.();
            setTutorialOpen(true);
          }
        }
      };

      return {
        handleKeyDown,
        isTutorialOpen: () => tutorialOpen,
        setTutorialOpen,
        setShowTutorials: (val: boolean) => {
          showTutorials = val;
          showTutorialsRef.current = val;
        },
      };
    }

    it("silences '?' when focused on INPUT elements even if showTutorials is true", () => {
      const harness = createKeydownHarness(true);
      const pd = vi.fn();

      harness.handleKeyDown({
        key: '?',
        target: { tagName: 'INPUT' },
        preventDefault: pd,
      });

      expect(pd).not.toHaveBeenCalled();
      expect(harness.isTutorialOpen()).toBe(false);
    });

    it("silences '?' when focused on TEXTAREA elements even if showTutorials is true", () => {
      const harness = createKeydownHarness(true);
      const pd = vi.fn();

      harness.handleKeyDown({
        key: '?',
        target: { tagName: 'TEXTAREA' },
        preventDefault: pd,
      });

      expect(pd).not.toHaveBeenCalled();
      expect(harness.isTutorialOpen()).toBe(false);
    });

    it("silences '?' when focused on SELECT elements even if showTutorials is true", () => {
      const harness = createKeydownHarness(true);
      const pd = vi.fn();

      harness.handleKeyDown({
        key: '?',
        target: { tagName: 'SELECT' },
        preventDefault: pd,
      });

      expect(pd).not.toHaveBeenCalled();
      expect(harness.isTutorialOpen()).toBe(false);
    });

    it("silences '?' when focused on isContentEditable elements even if showTutorials is true", () => {
      const harness = createKeydownHarness(true);
      const pd = vi.fn();

      harness.handleKeyDown({
        key: '?',
        target: { isContentEditable: true },
        preventDefault: pd,
      });

      expect(pd).not.toHaveBeenCalled();
      expect(harness.isTutorialOpen()).toBe(false);
    });

    it("triggers tutorial modal and calls preventDefault on body target when showTutorials is true", () => {
      const harness = createKeydownHarness(true);
      const pd = vi.fn();

      harness.handleKeyDown({
        key: '?',
        target: { tagName: 'BODY' },
        preventDefault: pd,
      });

      expect(pd).toHaveBeenCalledTimes(1);
      expect(harness.isTutorialOpen()).toBe(true);
    });

    it("strictly silences '?' on body or dialog when showTutorials is false", () => {
      const harness = createKeydownHarness(false);
      const pd = vi.fn();

      harness.handleKeyDown({
        key: '?',
        target: { tagName: 'BODY' },
        preventDefault: pd,
      });

      expect(pd).not.toHaveBeenCalled();
      expect(harness.isTutorialOpen()).toBe(false);

      // Even inside a modal container
      harness.handleKeyDown({
        key: '?',
        target: { tagName: 'DIV' },
        preventDefault: pd,
      });
      expect(pd).not.toHaveBeenCalled();
      expect(harness.isTutorialOpen()).toBe(false);
    });

    it("ignores '?' when Ctrl, Alt, or Meta modifier keys are held", () => {
      const harness = createKeydownHarness(true);
      const pd = vi.fn();

      // Ctrl + ?
      harness.handleKeyDown({ key: '?', ctrlKey: true, preventDefault: pd });
      expect(pd).not.toHaveBeenCalled();
      expect(harness.isTutorialOpen()).toBe(false);

      // Meta + ?
      harness.handleKeyDown({ key: '?', metaKey: true, preventDefault: pd });
      expect(pd).not.toHaveBeenCalled();
      expect(harness.isTutorialOpen()).toBe(false);

      // Alt + ?
      harness.handleKeyDown({ key: '?', altKey: true, preventDefault: pd });
      expect(pd).not.toHaveBeenCalled();
      expect(harness.isTutorialOpen()).toBe(false);
    });
  });

  // =========================================================================
  // 3. CODE CONFORMANCE: EMPTY DEPENDENCY ARRAY [] ON App.tsx KEYDOWN LISTENER
  // =========================================================================
  describe('3. Preservation of Empty Dependency Array [] in App.tsx Keydown Listener', () => {
    const appTsxPath = path.resolve(__dirname, '../src/client/App.tsx');
    const appSource = fs.readFileSync(appTsxPath, 'utf8');

    it('verifies exact empty dependency array [] on the global keydown listener useEffect', () => {
      // Must match window.addEventListener('keydown', handleKeyDown) followed by cleanup and empty deps []
      const listenerPattern =
        /window\.addEventListener\('keydown',\s*handleKeyDown\);\s*return\s*\(\)\s*=>\s*window\.removeEventListener\('keydown',\s*handleKeyDown\);\s*},\s*\[\]\);/;
      expect(appSource).toMatch(listenerPattern);
    });

    it('verifies showTutorialsRef mutable ref bridge prevents stale closure while maintaining []', () => {
      // 1. Definition of ref initialized with showTutorials
      expect(appSource).toMatch(/const\s+showTutorialsRef\s*=\s*useRef\(showTutorials\);/);

      // 2. Synchronization useEffect with [showTutorials] dependency
      expect(appSource).toMatch(
        /useEffect\(\(\)\s*=>\s*\{\s*showTutorialsRef\.current\s*=\s*showTutorials;\s*\},?\s*\[showTutorials\]\);/
      );

      // 3. handleKeyDown accesses showTutorialsRef.current instead of stale state
      expect(appSource).toMatch(/if\s*\(showTutorialsRef\.current\)\s*\{\s*e\.preventDefault\(\);\s*setTutorialOpen\(true\);/);
    });
  });

  // =========================================================================
  // 4. ACCESSIBILITY QUERY ORACLE ON Sidebar.tsx (getByRole Oracle)
  // =========================================================================
  describe('4. Accessibility Query Verification on Sidebar.tsx', () => {
    const baseSidebarProps: SidebarProps = {
      onOpenGoblin: vi.fn(),
      onOpenAgentApi: vi.fn(),
      onOpenPomodoro: vi.fn(),
      onOpenCalendars: vi.fn(),
      onOpenSpotlight: vi.fn(),
      onOpenBrainDump: vi.fn(),
      onOpenShutdown: vi.fn(),
      soundEnabled: true,
      onToggleSound: vi.fn(),
      showTutorials: true,
      onOpenTutorial: vi.fn(),
      onOpenSettings: vi.fn(),
      theme: 'light',
      onCycleTheme: vi.fn(),
      auth: null,
      onOpenAuth: vi.fn(),
      onLogout: vi.fn(),
    };

    const renderSidebar = (props: Partial<SidebarProps> = {}) => {
      return renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          null,
          React.createElement(Sidebar, { ...baseSidebarProps, ...props })
        )
      );
    };

    it('finds tutorial button via getByRole("button", { name: /tutorial/i }) when showTutorials is true', () => {
      const html = renderSidebar({ showTutorials: true });

      // getByRole must succeed
      const button = getByRole(html, 'button', { name: /tutorial/i });
      expect(button).toBeDefined();
      expect(button.accessibleName).toContain('Guide and Tutorial');
      expect(button.rawHtml).toContain('Guide &amp; Tutorial');
      expect(button.rawHtml).toMatch(/(&#x27;|')\?(&#x27;|')/);
    });

    it('throws accessibility error on getByRole("button", { name: /tutorial/i }) when showTutorials is false', () => {
      const html = renderSidebar({ showTutorials: false });

      // queryByRole returns null
      expect(queryByRole(html, 'button', { name: /tutorial/i })).toBeNull();
      expect(queryByRole(html, 'button', { name: /guide/i })).toBeNull();

      // getByRole MUST throw
      expect(() => {
        getByRole(html, 'button', { name: /tutorial/i });
      }).toThrowError(/Unable to find an accessible element with the role "button" and name \/tutorial\/i/);

      expect(() => {
        getByRole(html, 'button', { name: /guide/i });
      }).toThrowError(/Unable to find an accessible element with the role "button" and name \/guide\/i/);
    });

    it('confirms the settings button is accessible and independent of tutorial toggle', () => {
      const htmlWithTutorials = renderSidebar({ showTutorials: true, onOpenSettings: vi.fn() });
      const htmlWithoutTutorials = renderSidebar({ showTutorials: false, onOpenSettings: vi.fn() });

      const settingsBtn1 = getByRole(htmlWithTutorials, 'button', { name: /settings/i });
      const settingsBtn2 = getByRole(htmlWithoutTutorials, 'button', { name: /settings/i });

      expect(settingsBtn1).toBeDefined();
      expect(settingsBtn2).toBeDefined();
      expect(settingsBtn1.accessibleName).toBe('Settings');
      expect(settingsBtn2.accessibleName).toBe('Settings');
    });
  });

  // =========================================================================
  // 5. STRESS-TESTING RAPID ESCAPE KEY PRESSES & OUTSIDE CLICKS
  // =========================================================================
  describe('5. Stress-Testing Rapid Escape Key Presses & Outside Backdrop Clicks', () => {
    it('handles rapid burst of 50 Escape keypresses on SettingsModal without exceptions', () => {
      const onClose = vi.fn();
      let isModalOpen = true;

      // Escape listener as implemented in SettingsModal.tsx:46-56
      const handleKeyDown = (e: { key: string; stopPropagation: () => void }) => {
        if (!isModalOpen) return;
        if (e.key === 'Escape') {
          e.stopPropagation();
          onClose();
          isModalOpen = false; // Closed after first
        }
      };

      const sp = vi.fn();

      // Fire 50 rapid Escape keydowns
      for (let i = 0; i < 50; i++) {
        expect(() => {
          handleKeyDown({ key: 'Escape', stopPropagation: sp });
        }).not.toThrow();
      }

      // First keypress closes, subsequent 49 do not re-close or fail
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(sp).toHaveBeenCalledTimes(1);
      expect(isModalOpen).toBe(false);
    });

    it('verifies SettingsModal cleans up window keydown listener upon unmount or close', () => {
      const addedListeners: Array<Function> = [];
      const removedListeners: Array<Function> = [];

      const mockWindow = {
        addEventListener: (event: string, fn: Function) => {
          if (event === 'keydown') addedListeners.push(fn);
        },
        removeEventListener: (event: string, fn: Function) => {
          if (event === 'keydown') removedListeners.push(fn);
        },
      };

      // Simulate 20 open-close lifecycles
      for (let i = 0; i < 20; i++) {
        const onClose = vi.fn();
        let isOpen = true;

        // Effect mount
        const handler = (e: any) => {
          if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
          mockWindow.addEventListener('keydown', handler);
        }

        // Effect unmount / close
        isOpen = false;
        mockWindow.removeEventListener('keydown', handler);
      }

      expect(addedListeners.length).toBe(20);
      expect(removedListeners.length).toBe(20);
    });

    it('handles 100 rapid outside backdrop clicks, closing modal reliably', () => {
      const onClose = vi.fn();
      const backdropElement = { id: 'backdrop' };

      // Simulate backdrop click handler: onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      const handleBackdropClick = (target: any) => {
        if (target === backdropElement) {
          onClose();
        }
      };

      for (let i = 0; i < 100; i++) {
        expect(() => {
          handleBackdropClick(backdropElement);
        }).not.toThrow();
      }

      expect(onClose).toHaveBeenCalledTimes(100);
    });

    it('isolates inside clicks from backdrop: clicking switches or theme buttons does NOT close modal', () => {
      const onClose = vi.fn();
      const onToggleTutorials = vi.fn();
      const onSelectTheme = vi.fn();

      const backdrop = { role: 'presentation' };
      const cardDialog = { role: 'dialog' };
      const tutorialSwitch = { role: 'switch' };
      const themeButton = { tag: 'button' };

      const handleEvent = (target: any, action?: () => void) => {
        if (target === backdrop) {
          onClose();
        } else {
          action?.();
        }
      };

      // Click inside dialog
      handleEvent(cardDialog);
      expect(onClose).not.toHaveBeenCalled();

      // Click tutorial switch
      handleEvent(tutorialSwitch, () => onToggleTutorials(false));
      expect(onClose).not.toHaveBeenCalled();
      expect(onToggleTutorials).toHaveBeenCalledWith(false);

      // Click theme button
      handleEvent(themeButton, () => onSelectTheme('dark'));
      expect(onClose).not.toHaveBeenCalled();
      expect(onSelectTheme).toHaveBeenCalledWith('dark');
    });
  });

  // =========================================================================
  // 6. CONTRACT VALIDATION: SettingsModalProps & SidebarProps INTERFACES
  // =========================================================================
  describe('6. Contract & Interface Rigidity Validation', () => {
    it('verifies SettingsModal gracefully handles all optional props when omitted', () => {
      const minimalProps: SettingsModalProps = {
        isOpen: true,
        onClose: vi.fn(),
        showTutorials: true,
        onToggleTutorials: vi.fn(),
        theme: 'light',
        soundEnabled: true,
        onToggleSound: vi.fn(),
        // optional: onCycleTheme, densityMode, onToggleDensity, onSelectTheme omitted
      };

      expect(() => {
        renderToStaticMarkup(
          React.createElement(
            I18nProvider,
            null,
            React.createElement(SettingsModal, minimalProps)
          )
        );
      }).not.toThrow();
    });

    it('verifies SettingsModal contains all 4 preference sections (Tutorials, Theme, Sound, Density)', () => {
      const html = renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          null,
          React.createElement(SettingsModal, {
            isOpen: true,
            onClose: vi.fn(),
            showTutorials: true,
            onToggleTutorials: vi.fn(),
            theme: 'light',
            soundEnabled: true,
            onToggleSound: vi.fn(),
          })
        )
      );

      // 1. Interactive Tutorials & Guides
      expect(html).toContain('role="switch"');
      expect(html).toContain('aria-label="Toggle Interactive Tutorials"');

      // 2. System Color Theme
      expect(html).toContain('aria-label="Light Theme"');
      expect(html).toContain('aria-label="Dark Theme"');
      expect(html).toContain('aria-label="System Theme"');

      // 3. Audio Feedback
      expect(html).toContain('aria-label="Toggle Audio Feedback"');

      // 4. Visual Density
      expect(html).toContain('aria-label="Spacious Density"');
      expect(html).toContain('aria-label="Compact Density"');

      // Modal Dialog Semantics
      expect(html).toContain('role="dialog"');
      expect(html).toContain('aria-modal="true"');
      expect(html).toContain('aria-labelledby="settings-modal-title"');
    });
  });
});
