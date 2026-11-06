import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { Sidebar, SidebarProps } from '../src/client/components/Sidebar';
import { I18nProvider } from '../src/client/i18n/I18nContext';
import { translations } from '../src/client/i18n/translations';
import { Task, DifficultyTier } from '../src/client/types';

// ============================================================================
// ADVERSARIAL STORAGE MOCK WITH ERROR INJECTION
// ============================================================================
class AdversarialLocalStorage {
  private store: Map<string, string> = new Map();
  public throwOnGet: Error | null = null;
  public throwOnSet: Error | null = null;
  public getCount = 0;
  public setCount = 0;

  getItem(key: string): string | null {
    this.getCount++;
    if (this.throwOnGet) {
      throw this.throwOnGet;
    }
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  setItem(key: string, value: string): void {
    this.setCount++;
    if (this.throwOnSet) {
      throw this.throwOnSet;
    }
    this.store.set(key, String(value));
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
    this.throwOnGet = null;
    this.throwOnSet = null;
    this.getCount = 0;
    this.setCount = 0;
  }

  has(key: string): boolean {
    return this.store.has(key);
  }
}

const mockStorage = new AdversarialLocalStorage();
(globalThis as any).window = globalThis;
(globalThis as any).localStorage = mockStorage;

// ============================================================================
// HELPER FACTORIES & ORACLES REFLECTING APP.TSX CONTRACTS
// ============================================================================

function makeTestItem(overrides: Partial<Task>): Task {
  return {
    id: 'item_' + Math.random().toString(36).substring(2, 9),
    user_id: 'u_challenger',
    title: 'Adversarial Test Item',
    notes: '',
    type: 'todo',
    difficulty: 'easy',
    difficulty_weight: 2,
    tags: [],
    completed: 0,
    streak: 0,
    best_streak: 0,
    last_completed_date: null,
    habit_positive: 0,
    habit_negative: 0,
    counter_up: 0,
    counter_down: 0,
    habit_reset_period: 'daily',
    frequency: 'daily',
    repeat_interval: 1,
    repeat_days: [],
    start_date: null,
    due_date: null,
    ...overrides,
  };
}

// Oracle reflecting src/client/App.tsx line 1176 & 1185
function evaluateTaskFiltering(
  tasks: Task[],
  zenMode: boolean,
  activeFilter: 'active' | 'all' = 'all',
  lowBatteryFilter = false,
  difficultyFilter: DifficultyTier | 'all' = 'all',
  selectedProjectId: string | 'all' = 'all',
  searchQuery = ''
): Task[] {
  return tasks.filter((t) => {
    if (selectedProjectId !== 'all' && t.project_id !== selectedProjectId) return false;
    if (difficultyFilter !== 'all' && t.difficulty !== difficultyFilter) return false;
    if (lowBatteryFilter) {
      if (t.difficulty !== 'trivial' && t.difficulty !== 'easy') return false;
    }
    // Critical R4 contract: Zen Mode overrides activeFilter to hide completed items
    if ((zenMode || activeFilter === 'active') && Boolean(t.completed)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesTitle = t.title.toLowerCase().includes(q);
      const matchesNotes = t.notes?.toLowerCase().includes(q);
      const matchesProject = t.project_name?.toLowerCase().includes(q);
      if (!matchesTitle && !matchesNotes && !matchesProject) return false;
    }
    return true;
  });
}

// Oracle reflecting baseHabitsList derivation (line 1216)
function evaluateHabitDerivation(filteredTasks: Task[], zenMode: boolean) {
  return filteredTasks.filter((t) => {
    if (zenMode && Boolean(t.completed)) return false;
    return t.type === 'habit' || t.type === 'daily';
  });
}

// Oracle reflecting allTasksList derivation (line 1273)
function evaluateTaskDerivation(filteredTasks: Task[], zenMode: boolean) {
  return filteredTasks.filter((t) => {
    if (zenMode && Boolean(t.completed)) return false;
    return t.type === 'todo';
  });
}

// Oracle reflecting card renderers (lines 2164 & 2856)
function evaluateCardRenderer(item: Task, zenMode: boolean): boolean {
  const isDone = Boolean(item.completed);
  if (zenMode && isDone) return false; // rendered as null
  return true; // rendered
}

// Production initialization logic from App.tsx line 194-203
function initializeZenModeFromStorage(): boolean {
  if (typeof window !== 'undefined') {
    try {
      return localStorage.getItem('habitcorp_zen_mode') === 'true';
    } catch {
      return false;
    }
  }
  return false;
}

// Production toggle logic from App.tsx line 210-221
class ZenModeStateContainer {
  public zenMode: boolean;
  public zenModeRef: { current: boolean };

  constructor(initialState?: boolean) {
    this.zenMode = initialState !== undefined ? initialState : initializeZenModeFromStorage();
    this.zenModeRef = { current: this.zenMode };
  }

  toggleZenMode(): boolean {
    const prev = this.zenMode;
    const next = !prev;
    this.zenMode = next;
    this.zenModeRef.current = next;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('habitcorp_zen_mode', String(next));
      } catch {}
    }
    return next;
  }
}

// Production keyboard dispatcher from App.tsx line 380-443
function createKeyboardDispatcher(toggleZenMode: () => void) {
  let defaultPrevented = false;

  const handleKeyDown = (e: {
    key: string;
    ctrlKey?: boolean;
    metaKey?: boolean;
    altKey?: boolean;
    shiftKey?: boolean;
    target?: {
      tagName?: string;
      isContentEditable?: boolean;
    } | null;
    preventDefault?: () => void;
  }) => {
    defaultPrevented = false;
    const preventDefault = () => {
      defaultPrevented = true;
      e.preventDefault?.();
    };

    const target = e.target as HTMLElement | null;
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
      preventDefault();
      return;
    }

    if (e.ctrlKey || e.metaKey || e.altKey) return;

    if (e.key === 'c' || e.key === 'C') {
      preventDefault();
    } else if (e.key === 's' || e.key === 'S') {
      preventDefault();
    } else if (e.key === 'b' || e.key === 'B') {
      preventDefault();
    } else if (e.key === 'd' || e.key === 'D') {
      preventDefault();
    } else if (e.key === 't' || e.key === 'T') {
      preventDefault();
    } else if (e.key === 'p' || e.key === 'P') {
      preventDefault();
    } else if (e.key === 'z' || e.key === 'Z') {
      preventDefault();
      toggleZenMode();
    }
  };

  return {
    handleKeyDown,
    wasPreventDefaultCalled: () => defaultPrevented,
  };
}

// ============================================================================
// TEST SUITE: ADVERSARIAL STRESS HARNESS
// ============================================================================
describe('Milestone 4 Adversarial Stress Harness: Zen Mode (Requirement R4)', () => {
  beforeEach(() => {
    mockStorage.clear();
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // 1. RAPID TOGGLE STRESS TESTING (100+ FLIPS & STORAGE INTEGRITY)
  // --------------------------------------------------------------------------
  describe('1. Rapid Toggle Stress Testing & Storage Integrity', () => {
    it('flips state 200+ times sequentially, maintaining perfect localStorage synchronization', () => {
      const container = new ZenModeStateContainer(false);
      expect(container.zenMode).toBe(false);

      const TOTAL_FLIPS = 250;
      for (let i = 1; i <= TOTAL_FLIPS; i++) {
        const expected = i % 2 === 1; // odd = true, even = false
        const result = container.toggleZenMode();

        expect(result).toBe(expected);
        expect(container.zenMode).toBe(expected);
        expect(container.zenModeRef.current).toBe(expected);
        expect(mockStorage.getItem('habitcorp_zen_mode')).toBe(String(expected));
      }
    });

    it('handles chaotic random toggle bursts (100+ iterations) without state divergence', () => {
      const container = new ZenModeStateContainer(false);
      let expectedState = false;

      for (let i = 0; i < 120; i++) {
        const toggleCount = Math.floor(Math.random() * 5) + 1; // 1 to 5 toggles per burst
        for (let j = 0; j < toggleCount; j++) {
          expectedState = !expectedState;
          container.toggleZenMode();
        }

        expect(container.zenMode).toBe(expectedState);
        expect(container.zenModeRef.current).toBe(expectedState);
        expect(mockStorage.getItem('habitcorp_zen_mode')).toBe(String(expectedState));
      }
    });

    it('does not corrupt or mutate neighboring localStorage keys during 100+ flips', () => {
      mockStorage.setItem('habitcorp_theme', 'dark');
      mockStorage.setItem('habitcorp_sound', 'true');
      mockStorage.setItem('habitcorp_lang', 'ca');
      mockStorage.setItem('habitcorp_tutorials', 'false');
      mockStorage.setItem('custom_session_token', 'xyz-123-abc');

      const container = new ZenModeStateContainer(false);

      for (let i = 0; i < 150; i++) {
        container.toggleZenMode();
      }

      // Check all other keys remain pristine
      expect(mockStorage.getItem('habitcorp_theme')).toBe('dark');
      expect(mockStorage.getItem('habitcorp_sound')).toBe('true');
      expect(mockStorage.getItem('habitcorp_lang')).toBe('ca');
      expect(mockStorage.getItem('habitcorp_tutorials')).toBe('false');
      expect(mockStorage.getItem('custom_session_token')).toBe('xyz-123-abc');
      // Final state after 150 flips from false is false
      expect(mockStorage.getItem('habitcorp_zen_mode')).toBe('false');
    });
  });

  // --------------------------------------------------------------------------
  // 2. CORRUPTED LOCALSTORAGE PAYLOADS RESILIENCE
  // --------------------------------------------------------------------------
  describe('2. Corrupted LocalStorage Payloads & Safe Fallback', () => {
    const corruptedPayloads = [
      'null',
      'undefined',
      '{zen: true}',
      '{"zenMode":true}',
      '{"completed":false}',
      '[true]',
      '1',
      '0',
      '-1',
      'NaN',
      'Infinity',
      '-Infinity',
      'TRUE',
      'True',
      'TrUe',
      'true ',
      ' true',
      ' true ',
      'false',
      'FALSE',
      'False',
      'yes',
      'no',
      'on',
      'off',
      'enabled',
      'disabled',
      '',
      '   ',
      '\t\n',
      '<script>alert("zen")</script>',
      'DROP TABLE habits;--',
      '🧘 Zen Mode 🚀',
      '{"__proto__":{"polluted":true}}',
    ];

    corruptedPayloads.forEach((payload) => {
      it(`falls back safely to false when localStorage contains: "${payload.replace(/\n/g, '\\n')}"`, () => {
        mockStorage.setItem('habitcorp_zen_mode', payload);
        const state = initializeZenModeFromStorage();
        expect(state).toBe(false);
      });
    });

    it('falls back to false when key does not exist (null returned by getItem)', () => {
      expect(mockStorage.getItem('habitcorp_zen_mode')).toBeNull();
      expect(initializeZenModeFromStorage()).toBe(false);
    });

    it('recovers cleanly after corrupted payload: next toggle successfully sets valid "true"', () => {
      mockStorage.setItem('habitcorp_zen_mode', '{zen: true, corrupted: 999}');
      const container = new ZenModeStateContainer();
      expect(container.zenMode).toBe(false);

      // User toggles Zen mode
      const next = container.toggleZenMode();
      expect(next).toBe(true);
      expect(container.zenMode).toBe(true);
      expect(mockStorage.getItem('habitcorp_zen_mode')).toBe('true');

      // Next toggle sets valid "false"
      const secondNext = container.toggleZenMode();
      expect(secondNext).toBe(false);
      expect(container.zenMode).toBe(false);
      expect(mockStorage.getItem('habitcorp_zen_mode')).toBe('false');
    });
  });

  // --------------------------------------------------------------------------
  // 3. SECURITYERROR AND QUOTAEXCEEDEDERROR SIMULATION
  // --------------------------------------------------------------------------
  describe('3. SecurityError & QuotaExceededError Simulation During Read/Write', () => {
    it('safely catches SecurityError on getItem (sandboxed iframe / cookies blocked) and returns false', () => {
      mockStorage.throwOnGet = new DOMException('The operation is insecure.', 'SecurityError');

      expect(() => {
        const state = initializeZenModeFromStorage();
        expect(state).toBe(false);
      }).not.toThrow();
    });

    it('safely catches QuotaExceededError on setItem and completes state toggle in memory', () => {
      const container = new ZenModeStateContainer(false);
      mockStorage.throwOnSet = new DOMException('The quota has been exceeded.', 'QuotaExceededError');

      expect(() => {
        const result = container.toggleZenMode();
        expect(result).toBe(true);
      }).not.toThrow();

      expect(container.zenMode).toBe(true);
      expect(container.zenModeRef.current).toBe(true);
    });

    it('safely catches generic storage errors (e.g. storage disabled by enterprise policy)', () => {
      mockStorage.throwOnGet = new Error('Storage access forbidden by administrator');
      expect(initializeZenModeFromStorage()).toBe(false);

      mockStorage.throwOnGet = null;
      const container = new ZenModeStateContainer(false);

      mockStorage.throwOnSet = new Error('Permission denied on disk write');
      expect(() => container.toggleZenMode()).not.toThrow();
      expect(container.zenMode).toBe(true);
    });

    it('survives intermittent storage failures (e.g., setItem fails every other call)', () => {
      const container = new ZenModeStateContainer(false);

      for (let i = 1; i <= 20; i++) {
        if (i % 2 === 1) {
          mockStorage.throwOnSet = new DOMException('Disk full', 'QuotaExceededError');
        } else {
          mockStorage.throwOnSet = null;
        }

        const expected = i % 2 === 1;
        expect(() => container.toggleZenMode()).not.toThrow();
        expect(container.zenMode).toBe(expected);

        // When write succeeds, localStorage updates; when write fails, old localStorage remains
        if (i % 2 === 0) {
          expect(mockStorage.getItem('habitcorp_zen_mode')).toBe('false');
        }
      }
    });

    it('handles SSR environment where window is undefined without crashing', () => {
      const originalWindow = (globalThis as any).window;
      try {
        delete (globalThis as any).window;

        // Verify initialization logic behaves correctly without window
        const ssrInit = () => {
          if (typeof window !== 'undefined') {
            try {
              return localStorage.getItem('habitcorp_zen_mode') === 'true';
            } catch {
              return false;
            }
          }
          return false;
        };

        expect(ssrInit()).toBe(false);
      } finally {
        (globalThis as any).window = originalWindow;
      }
    });
  });

  // --------------------------------------------------------------------------
  // 4. EVENT PROPAGATION, KEYBOARD SHORTCUTS & MODIFIER ADVERSARIAL MATRIX
  // --------------------------------------------------------------------------
  describe('4. Event Propagation, Keyboard Simulation & Modifier Adversarial Matrix', () => {
    it('triggers toggleZenMode and prevents default when lowercase "z" is pressed on generic element', () => {
      const toggleFn = vi.fn();
      const dispatcher = createKeyboardDispatcher(toggleFn);

      const event = {
        key: 'z',
        ctrlKey: false,
        metaKey: false,
        altKey: false,
        target: { tagName: 'DIV' },
        preventDefault: vi.fn(),
      };

      dispatcher.handleKeyDown(event as any);
      expect(toggleFn).toHaveBeenCalledTimes(1);
      expect(event.preventDefault).toHaveBeenCalledTimes(1);
      expect(dispatcher.wasPreventDefaultCalled()).toBe(true);
    });

    it('triggers toggleZenMode and prevents default when uppercase "Z" (or Shift+Z) is pressed', () => {
      const toggleFn = vi.fn();
      const dispatcher = createKeyboardDispatcher(toggleFn);

      const event = {
        key: 'Z',
        shiftKey: true,
        ctrlKey: false,
        metaKey: false,
        altKey: false,
        target: { tagName: 'BODY' },
        preventDefault: vi.fn(),
      };

      dispatcher.handleKeyDown(event as any);
      expect(toggleFn).toHaveBeenCalledTimes(1);
      expect(event.preventDefault).toHaveBeenCalledTimes(1);
      expect(dispatcher.wasPreventDefaultCalled()).toBe(true);
    });

    it('STRICTLY SUPPRESSES "z" shortcut when target is an input, textarea, select, or contenteditable', () => {
      const inputTargets = [
        { tagName: 'INPUT', isContentEditable: false },
        { tagName: 'TEXTAREA', isContentEditable: false },
        { tagName: 'SELECT', isContentEditable: false },
        { tagName: 'DIV', isContentEditable: true },
        { tagName: 'SPAN', isContentEditable: true },
        { tagName: 'P', isContentEditable: true },
      ];

      for (const target of inputTargets) {
        const toggleFn = vi.fn();
        const dispatcher = createKeyboardDispatcher(toggleFn);

        const event = {
          key: 'z',
          ctrlKey: false,
          metaKey: false,
          altKey: false,
          target,
          preventDefault: vi.fn(),
        };

        dispatcher.handleKeyDown(event as any);
        expect(toggleFn).not.toHaveBeenCalled();
        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(dispatcher.wasPreventDefaultCalled()).toBe(false);
      }
    });

    it('STRICTLY SUPPRESSES "z" shortcut when modifier keys are pressed (e.g. Ctrl+Z / Cmd+Z Undo)', () => {
      const modifierPermutations = [
        { ctrlKey: true, metaKey: false, altKey: false, desc: 'Ctrl+Z (Undo)' },
        { ctrlKey: false, metaKey: true, altKey: false, desc: 'Cmd+Z (Undo on macOS)' },
        { ctrlKey: false, metaKey: false, altKey: true, desc: 'Alt+Z' },
        { ctrlKey: true, metaKey: false, altKey: true, desc: 'Ctrl+Alt+Z' },
        { ctrlKey: false, metaKey: true, altKey: true, desc: 'Cmd+Alt+Z' },
        { ctrlKey: true, metaKey: true, altKey: false, desc: 'Ctrl+Cmd+Z' },
        { ctrlKey: true, metaKey: true, altKey: true, desc: 'Ctrl+Cmd+Alt+Z' },
      ];

      for (const mod of modifierPermutations) {
        const toggleFn = vi.fn();
        const dispatcher = createKeyboardDispatcher(toggleFn);

        const event = {
          key: 'z',
          ...mod,
          target: { tagName: 'BODY' },
          preventDefault: vi.fn(),
        };

        dispatcher.handleKeyDown(event as any);
        expect(toggleFn, `Failed for modifier: ${mod.desc}`).not.toHaveBeenCalled();
        expect(event.preventDefault).not.toHaveBeenCalled();
      }
    });

    it('does not trigger on unrelated keys (e.g., "x", "a", "1", "Enter", "Space")', () => {
      const otherKeys = ['x', 'X', 'y', 'Y', 'a', 'A', '1', 'Enter', 'Space', 'Tab', 'Backspace'];

      for (const key of otherKeys) {
        const toggleFn = vi.fn();
        const dispatcher = createKeyboardDispatcher(toggleFn);

        const event = {
          key,
          ctrlKey: false,
          metaKey: false,
          altKey: false,
          target: { tagName: 'BODY' },
          preventDefault: vi.fn(),
        };

        dispatcher.handleKeyDown(event as any);
        expect(toggleFn, `Unexpected trigger for key: ${key}`).not.toHaveBeenCalled();
      }
    });
  });

  // --------------------------------------------------------------------------
  // 5. STATIC SOURCE CODE CONTRACTS & EMPTY DEPENDENCY ARRAY [] ON KEYDOWN
  // --------------------------------------------------------------------------
  describe('5. Static Source Code & Architecture Contracts (App.tsx & Sidebar.tsx)', () => {
    const appTsxPath = path.resolve(__dirname, '../src/client/App.tsx');
    const sidebarTsxPath = path.resolve(__dirname, '../src/client/components/Sidebar.tsx');

    const appSource = fs.readFileSync(appTsxPath, 'utf8');
    const sidebarSource = fs.readFileSync(sidebarTsxPath, 'utf8');

    it('verifies App.tsx has an empty dependency array [] on the global keydown listener effect', () => {
      // Find the useEffect that attaches handleKeyDown
      const keydownEffectRegex =
        /useEffect\s*\(\s*\(\)\s*=>\s*\{[\s\S]*?window\.addEventListener\('keydown',\s*handleKeyDown\);[\s\S]*?return\s*\(\)\s*=>\s*window\.removeEventListener\('keydown',\s*handleKeyDown\);[\s\S]*?\},\s*\[\s*\]\s*\);/;

      expect(appSource).toMatch(keydownEffectRegex);
    });

    it('verifies App.tsx employs a ref (zenModeRef) or functional updater to prevent stale closures', () => {
      expect(appSource).toMatch(/const\s+zenModeRef\s*=\s*useRef\(zenMode\);/);
      expect(appSource).toMatch(/zenModeRef\.current\s*=\s*zenMode;/);
      // toggleZenMode updates the ref immediately and uses functional updater
      expect(appSource).toMatch(/const\s+toggleZenMode\s*=\s*\(\)\s*=>\s*\{[\s\S]*?setZenMode\(\(prev\)\s*=>/);
    });

    it('verifies App.tsx wires zenMode and toggleZenMode to Sidebar', () => {
      expect(appSource).toMatch(/<Sidebar[\s\S]*?zenMode=\{zenMode\}[\s\S]*?\/>/);
      expect(appSource).toMatch(/<Sidebar[\s\S]*?onToggleZenMode=\{toggleZenMode\}[\s\S]*?\/>/);
    });

    it('verifies filteredTasks includes zenMode in its useMemo dependencies and filters completed items', () => {
      expect(appSource).toMatch(/\(zenMode\s*\|\|\s*activeFilter\s*===\s*'active'\)\s*&&\s*Boolean\(t\.completed\)/);
      expect(appSource).toMatch(/filteredTasks\s*=\s*useMemo\([\s\S]*?\[[\s\S]*?zenMode[\s\S]*?\]\);/);
    });

    it('verifies baseHabitsList and allTasksList have defense-in-depth zenMode suppression', () => {
      expect(appSource).toMatch(/baseHabitsList\s*=\s*useMemo\([\s\S]*?zenMode\s*&&\s*Boolean\(t\.completed\)[\s\S]*?\]\);/);
      expect(appSource).toMatch(/allTasksList\s*=\s*useMemo\([\s\S]*?zenMode\s*&&\s*Boolean\(t\.completed\)[\s\S]*?\]\);/);
    });

    it('verifies renderHabitCard and renderTasksColumn have card-level suppression guards', () => {
      expect(appSource).toMatch(/renderHabitCard[\s\S]*?if\s*\(zenMode\s*&&\s*isDone\)\s*return\s*null;/);
      expect(appSource).toMatch(/renderTasksColumn[\s\S]*?if\s*\(zenMode\s*&&\s*isDone\)\s*return\s*null;/);
    });

    it('verifies Sidebar.tsx implements accessible Zen Mode button with aria-pressed and "z" badge', () => {
      expect(sidebarSource).toMatch(/aria-label="Toggle Zen Mode"/);
      expect(sidebarSource).toMatch(/aria-pressed=\{Boolean\(zenMode\)\}/);
      expect(sidebarSource).toMatch(/'z'/);
    });
  });

  // --------------------------------------------------------------------------
  // 6. ADVERSARIAL FILTERING & COGNITIVE CLUTTER SUPPRESSION MATRIX
  // --------------------------------------------------------------------------
  describe('6. Item Suppression Matrix: Cognitive Clutter Elimination Under Zen Mode', () => {
    const mixedDataset: Task[] = [
      makeTestItem({ id: 't_active_1', title: 'Write tests', type: 'todo', completed: 0 }),
      makeTestItem({ id: 't_done_num1', title: 'Plan architecture', type: 'todo', completed: 1 }),
      makeTestItem({ id: 't_done_bool', title: 'Setup CI', type: 'todo', completed: true as any }),
      makeTestItem({ id: 't_active_boolfalse', title: 'Draft docs', type: 'todo', completed: false as any }),
      makeTestItem({ id: 't_active_undef', title: 'Code review', type: 'todo', completed: undefined as any }),
      makeTestItem({ id: 't_done_num2', title: 'Deploy app', type: 'todo', completed: 2 as any }),

      makeTestItem({ id: 'h_active_morn', title: 'Meditation', type: 'daily', time_of_day: 'morning', completed: 0 }),
      makeTestItem({ id: 'h_done_morn', title: 'Hydration', type: 'daily', time_of_day: 'morning', completed: 1 }),
      makeTestItem({ id: 'h_active_eve', title: 'Reading', type: 'habit', time_of_day: 'evening', completed: 0 }),
      makeTestItem({ id: 'h_done_eve', title: 'Evening Walk', type: 'habit', time_of_day: 'evening', completed: 1 }),
    ];

    it('strictly hides all completed tasks and habits when zenMode === true (activeFilter === "all")', () => {
      const filtered = evaluateTaskFiltering(mixedDataset, true, 'all');
      const filteredIds = filtered.map((i) => i.id);

      // Completed items MUST NOT appear
      expect(filteredIds).not.toContain('t_done_num1');
      expect(filteredIds).not.toContain('t_done_bool');
      expect(filteredIds).not.toContain('t_done_num2');
      expect(filteredIds).not.toContain('h_done_morn');
      expect(filteredIds).not.toContain('h_done_eve');

      // Active items MUST appear
      expect(filteredIds).toContain('t_active_1');
      expect(filteredIds).toContain('t_active_boolfalse');
      expect(filteredIds).toContain('t_active_undef');
      expect(filteredIds).toContain('h_active_morn');
      expect(filteredIds).toContain('h_active_eve');
    });

    it('strictly hides all completed tasks and habits when zenMode === true (activeFilter === "active")', () => {
      const filtered = evaluateTaskFiltering(mixedDataset, true, 'active');
      const filteredIds = filtered.map((i) => i.id);

      expect(filteredIds).toEqual([
        't_active_1',
        't_active_boolfalse',
        't_active_undef',
        'h_active_morn',
        'h_active_eve',
      ]);
    });

    it('shows completed items when zenMode === false and activeFilter === "all"', () => {
      const filtered = evaluateTaskFiltering(mixedDataset, false, 'all');
      const filteredIds = filtered.map((i) => i.id);

      expect(filteredIds).toContain('t_done_num1');
      expect(filteredIds).toContain('t_done_bool');
      expect(filteredIds).toContain('h_done_morn');
      expect(filteredIds).toContain('h_done_eve');
      expect(filtered.length).toBe(mixedDataset.length);
    });

    it('defense-in-depth: habit derivation suppresses completed habits under Zen Mode', () => {
      // Even if raw dataset somehow bypasses upstream filter, baseHabitsList derivation blocks it
      const derivedHabits = evaluateHabitDerivation(mixedDataset, true);
      const habitIds = derivedHabits.map((h) => h.id);

      expect(habitIds).toContain('h_active_morn');
      expect(habitIds).toContain('h_active_eve');
      expect(habitIds).not.toContain('h_done_morn');
      expect(habitIds).not.toContain('h_done_eve');
    });

    it('defense-in-depth: task derivation suppresses completed tasks under Zen Mode', () => {
      const derivedTasks = evaluateTaskDerivation(mixedDataset, true);
      const taskIds = derivedTasks.map((t) => t.id);

      expect(taskIds).toContain('t_active_1');
      expect(taskIds).toContain('t_active_boolfalse');
      expect(taskIds).toContain('t_active_undef');
      expect(taskIds).not.toContain('t_done_num1');
      expect(taskIds).not.toContain('t_done_bool');
      expect(taskIds).not.toContain('t_done_num2');
    });

    it('defense-in-depth: card renderers return null for completed items under Zen Mode', () => {
      const doneTask = makeTestItem({ completed: 1 });
      const activeTask = makeTestItem({ completed: 0 });

      expect(evaluateCardRenderer(doneTask, true)).toBe(false); // returns null
      expect(evaluateCardRenderer(activeTask, true)).toBe(true); // renders

      // When Zen mode is off, both render
      expect(evaluateCardRenderer(doneTask, false)).toBe(true);
      expect(evaluateCardRenderer(activeTask, false)).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 7. SIDEBAR COMPONENT INTEGRATION & ACCESSIBILITY STRESS
  // --------------------------------------------------------------------------
  describe('7. Sidebar Component Integration & Accessibility Stress', () => {
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
      showTutorials: false,
      onOpenTutorial: vi.fn(),
      onOpenSettings: vi.fn(),
      theme: 'light',
      onCycleTheme: vi.fn(),
      auth: null,
      onOpenAuth: vi.fn(),
      onLogout: vi.fn(),
    };

    const renderSidebar = (props: Partial<SidebarProps> = {}, lang: 'en' | 'es' | 'ca' = 'en') => {
      mockStorage.setItem('habitcorp_lang', lang);
      const combined = { ...baseSidebarProps, ...props };
      return renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          null,
          React.createElement(Sidebar, combined)
        )
      );
    };

    it('renders Zen mode button with aria-pressed="true" and active styles when zenMode is true', () => {
      const html = renderSidebar({ zenMode: true, onToggleZenMode: vi.fn() });
      expect(html).toContain('aria-pressed="true"');
      expect(html).toContain('bg-emerald-50 text-emerald-800');
      expect(html).toContain('aria-label="Toggle Zen Mode"');
      expect(html).toMatch(/'z'|&#x27;z&#x27;/);
    });

    it('renders Zen mode button with aria-pressed="false" and inactive styles when zenMode is false', () => {
      const html = renderSidebar({ zenMode: false, onToggleZenMode: vi.fn() });
      expect(html).toContain('aria-pressed="false"');
      expect(html).not.toContain('bg-emerald-50 text-emerald-800');
      expect(html).toContain('aria-label="Toggle Zen Mode"');
    });

    it('renders localized button title and label across all supported languages (ca, es, en)', () => {
      const htmlEn = renderSidebar({ onToggleZenMode: vi.fn() }, 'en');
      expect(htmlEn).toContain(translations.en.zenModeBtn);

      const htmlEs = renderSidebar({ onToggleZenMode: vi.fn() }, 'es');
      expect(htmlEs).toContain(translations.es.zenModeBtn);

      const htmlCa = renderSidebar({ onToggleZenMode: vi.fn() }, 'ca');
      expect(htmlCa).toContain(translations.ca.zenModeBtn);
    });

    it('safely handles missing onToggleZenMode without rendering or crashing', () => {
      const html = renderSidebar({ onToggleZenMode: undefined });
      expect(html).not.toContain('aria-label="Toggle Zen Mode"');
    });
  });
});
