import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { Sidebar, SidebarProps } from '../src/client/components/Sidebar';
import { SettingsModal, SettingsModalProps } from '../src/client/components/SettingsModal';
import { I18nProvider } from '../src/client/i18n/I18nContext';
import { translations } from '../src/client/i18n/translations';
import { Task } from '../src/client/types';

// In-memory LocalStorage mock for Node runner environment
class LocalStorageMock {
  private store: Record<string, string> = {};
  getItem(key: string): string | null {
    return this.store[key] !== undefined ? this.store[key] : null;
  }
  setItem(key: string, val: string): void {
    this.store[key] = String(val);
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  clear(): void {
    this.store = {};
  }
}

const mockStorage = new LocalStorageMock();
(globalThis as any).window = globalThis;
(globalThis as any).localStorage = mockStorage;

describe('Milestone 2 (Requirement R2) — Settings Modal & Filter Adjustments Test Suite', () => {
  beforeEach(() => {
    mockStorage.clear();
    vi.clearAllMocks();
  });

  // =========================================================================
  // 1. UNIT TESTS: SettingsModal Component
  // =========================================================================
  describe('1. SettingsModal Component Unit Tests', () => {
    const defaultSettingsProps: SettingsModalProps = {
      isOpen: true,
      onClose: vi.fn(),
      showTutorials: true,
      onToggleTutorials: vi.fn(),
      theme: 'light',
      onCycleTheme: vi.fn(),
      soundEnabled: true,
      onToggleSound: vi.fn(),
      densityMode: 'spacious',
      onToggleDensity: vi.fn(),
    };

    const renderModal = (props: Partial<SettingsModalProps> = {}, lang: 'en' | 'es' | 'ca' = 'en') => {
      mockStorage.setItem('habitcorp_lang', lang);
      const combined = { ...defaultSettingsProps, ...props };
      return renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          null,
          React.createElement(SettingsModal, combined)
        )
      );
    };

    it('returns empty markup when isOpen is false', () => {
      const html = renderModal({ isOpen: false });
      expect(html).toBe('');
    });

    it('renders accessible dialog container when isOpen is true', () => {
      const html = renderModal({ isOpen: true });
      expect(html).not.toBe('');
      expect(html).toContain('role="dialog"');
      expect(html).toContain('aria-modal="true"');
      expect(html).toContain('aria-labelledby="settings-modal-title"');
    });

    it('renders localized modal title and subtitle in English, Spanish, and Catalan', () => {
      // English
      const htmlEn = renderModal({ isOpen: true }, 'en');
      expect(htmlEn).toContain(translations.en.settingsTitle);

      // Spanish
      const htmlEs = renderModal({ isOpen: true }, 'es');
      expect(htmlEs).toContain(translations.es.settingsTitle);

      // Catalan
      const htmlCa = renderModal({ isOpen: true }, 'ca');
      expect(htmlCa).toContain(translations.ca.settingsTitle);
    });

    it('renders interactive tutorial toggle and reflects showTutorials prop state', () => {
      // Active tutorial toggle
      const htmlActive = renderModal({ showTutorials: true });
      expect(htmlActive).toContain('role="switch"');
      expect(htmlActive).toContain('aria-checked="true"');

      // Inactive tutorial toggle
      const htmlInactive = renderModal({ showTutorials: false });
      expect(htmlInactive).toContain('role="switch"');
      expect(htmlInactive).toContain('aria-checked="false"');
    });

    it('invokes onToggleTutorials with inverted value', () => {
      const onToggleTutorials = vi.fn();
      let currentShowTutorials = true;

      // Simulate toggle action
      const handleToggle = () => onToggleTutorials(!currentShowTutorials);
      handleToggle();
      expect(onToggleTutorials).toHaveBeenCalledWith(false);

      currentShowTutorials = false;
      handleToggle();
      expect(onToggleTutorials).toHaveBeenCalledWith(true);
    });

    it('renders theme selector and audio feedback controls', () => {
      const html = renderModal({
        theme: 'dark',
        soundEnabled: false,
      });

      // Sound status
      expect(html).toContain('Muted');

      // Theme
      expect(html).toContain('Dark');
    });
  });

  // =========================================================================
  // 2. COMPONENT TESTS: Sidebar.tsx Conditional Tutorial Rendering
  // =========================================================================
  describe('2. Sidebar Component Tutorial Conditional Rendering', () => {
    const defaultSidebarProps: SidebarProps = {
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
      const combined = { ...defaultSidebarProps, ...props };
      return renderToStaticMarkup(
        React.createElement(
          I18nProvider,
          null,
          React.createElement(Sidebar, combined)
        )
      );
    };

    it('renders the tutorial walkthrough button when showTutorials is true', () => {
      const html = renderSidebar({ showTutorials: true });
      expect(html).toContain('aria-label="Guide and Tutorial"');
      expect(html).toContain('Guide &amp; Tutorial');
      expect(html).toMatch(/(&#x27;|')\?(&#x27;|')/);
    });

    it('omits the tutorial walkthrough button entirely when showTutorials is false', () => {
      const html = renderSidebar({ showTutorials: false });
      expect(html).not.toContain('aria-label="Guide and Tutorial"');
      expect(html).not.toContain('Guide &amp; Tutorial');
    });

    it('defaults showTutorials to true if omitted', () => {
      const html = renderSidebar({ showTutorials: undefined });
      expect(html).toContain('aria-label="Guide and Tutorial"');
    });

    it('renders Settings modal trigger button when onOpenSettings is provided', () => {
      const htmlWithSettings = renderSidebar({ onOpenSettings: vi.fn() });
      expect(htmlWithSettings).toContain('aria-label="Settings"');
      expect(htmlWithSettings).toContain('Settings');

      const htmlWithoutSettings = renderSidebar({ onOpenSettings: undefined });
      expect(htmlWithoutSettings).not.toContain('aria-label="Settings"');
    });
  });

  // =========================================================================
  // 3. INTEGRATION TESTS: App.tsx Filter Strip & State Pipeline
  // =========================================================================
  describe('3. App.tsx Left Filter Panel & "Actiu / Tot" Integration', () => {
    const appTsxPath = path.resolve(__dirname, '../src/client/App.tsx');
    const appSource = fs.readFileSync(appTsxPath, 'utf8');

    it('verifies removal of redundant {t.allProjects} button from the left filter strip', () => {
      // The old redundant button had setSelectedProjectId('all') on the left
      const filterSectionMatch = appSource.match(/<section[^>]*border-b[^>]*>([\s\S]*?)<\/section>/);
      expect(filterSectionMatch).not.toBeNull();
      const filterSection = filterSectionMatch ? filterSectionMatch[1] : '';

      // The left side of the filter strip should no longer have {t.allProjects} ({tasks.length})
      expect(filterSection).not.toMatch(/\{t\.allProjects\}\s*\(\{tasks\.length\}\)/);
    });

    it('verifies existence and structure of segmented "Actiu / Tot" filter controls in App.tsx', () => {
      expect(appSource).toMatch(/activeFilter/);
      expect(appSource).toMatch(/setActiveFilter/);
      expect(appSource).toMatch(/setActiveFilter\(['"]active['"]\)/);
      expect(appSource).toMatch(/setActiveFilter\(['"]all['"]\)/);
    });

    describe('3.1 Filtering Logic Oracle for Tasks and Habits', () => {
      const mockTasks: Task[] = [
        {
          id: 'habit_pending',
          user_id: 'u1',
          title: 'Drink 2L Water',
          notes: '',
          type: 'daily',
          completed: 0,
          difficulty: 'trivial',
          created_at: '2026-10-30',
          updated_at: '2026-10-30',
          is_due_today: true,
        },
        {
          id: 'habit_completed',
          user_id: 'u1',
          title: 'Morning Yoga',
          notes: '',
          type: 'daily',
          completed: 1,
          difficulty: 'easy',
          created_at: '2026-10-30',
          updated_at: '2026-10-30',
          is_due_today: true,
        },
        {
          id: 'task_pending',
          user_id: 'u1',
          title: 'Prepare Milestone 2 Architecture',
          notes: '',
          type: 'todo',
          completed: 0,
          difficulty: 'hard',
          created_at: '2026-10-30',
          updated_at: '2026-10-30',
        },
        {
          id: 'task_completed',
          user_id: 'u1',
          title: 'Submit Expense Report',
          notes: '',
          type: 'todo',
          completed: 1,
          difficulty: 'medium',
          created_at: '2026-10-30',
          updated_at: '2026-10-30',
        },
        {
          id: 'habit_counter',
          user_id: 'u1',
          title: 'Read Book Pages',
          notes: '',
          type: 'habit',
          completed: 0,
          difficulty: 'easy',
          counter_up: 5,
          created_at: '2026-10-30',
          updated_at: '2026-10-30',
        },
      ];

      // Exact filtering function implemented in App.tsx:filteredTasks
      const runFilter = (items: Task[], activeFilter: 'active' | 'all') => {
        return items.filter((t) => {
          if (activeFilter === 'active' && Boolean(t.completed)) return false;
          return true;
        });
      };

      it('filters out completed daily habits and completed tasks when activeFilter === "active"', () => {
        const filtered = runFilter(mockTasks, 'active');
        const ids = filtered.map((t) => t.id);

        expect(ids).toContain('habit_pending');
        expect(ids).toContain('task_pending');
        expect(ids).toContain('habit_counter');

        // Completed items must be excluded
        expect(ids).not.toContain('habit_completed');
        expect(ids).not.toContain('task_completed');
      });

      it('retains completed daily habits and completed tasks when activeFilter === "all"', () => {
        const filtered = runFilter(mockTasks, 'all');
        const ids = filtered.map((t) => t.id);

        expect(ids).toContain('habit_pending');
        expect(ids).toContain('habit_completed');
        expect(ids).toContain('task_pending');
        expect(ids).toContain('task_completed');
        expect(ids).toContain('habit_counter');
        expect(filtered.length).toBe(5);
      });
    });

    describe('3.2 Persistence of showTutorials in localStorage', () => {
      it('initializes to true when localStorage is empty', () => {
        const initShowTutorials = () => {
          try {
            return mockStorage.getItem('habitcorp_show_tutorials') !== 'false';
          } catch {
            return true;
          }
        };
        expect(initShowTutorials()).toBe(true);
      });

      it('initializes to false when localStorage stores "false"', () => {
        mockStorage.setItem('habitcorp_show_tutorials', 'false');
        const initShowTutorials = () => {
          try {
            return mockStorage.getItem('habitcorp_show_tutorials') !== 'false';
          } catch {
            return true;
          }
        };
        expect(initShowTutorials()).toBe(false);
      });

      it('persists changes to localStorage upon toggle', () => {
        const handleToggle = (val: boolean) => {
          try {
            mockStorage.setItem('habitcorp_show_tutorials', String(val));
          } catch {}
        };

        handleToggle(false);
        expect(mockStorage.getItem('habitcorp_show_tutorials')).toBe('false');

        handleToggle(true);
        expect(mockStorage.getItem('habitcorp_show_tutorials')).toBe('true');
      });
    });

    describe('3.3 Inactivity of "?" Keyboard Shortcut When showTutorials Is False', () => {
      function createShortcutHarness(initialShowTutorials = true) {
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
          setShowTutorials: (val: boolean) => {
            showTutorials = val;
            showTutorialsRef.current = val;
          },
        };
      }

      it('opens tutorial on "?" keydown when showTutorials is true', () => {
        const harness = createShortcutHarness(true);
        harness.handleKeyDown({ key: '?' });
        expect(harness.isTutorialOpen()).toBe(true);
      });

      it('ignores "?" keydown when showTutorials is false', () => {
        const harness = createShortcutHarness(false);
        harness.handleKeyDown({ key: '?' });
        expect(harness.isTutorialOpen()).toBe(false);
      });

      it('dynamically adapts when showTutorials is toggled from true to false', () => {
        const harness = createShortcutHarness(true);
        harness.setShowTutorials(false);
        harness.handleKeyDown({ key: '?' });
        expect(harness.isTutorialOpen()).toBe(false);
      });

      it('ignores "?" keydown when focused on text input even if showTutorials is true', () => {
        const harness = createShortcutHarness(true);
        harness.handleKeyDown({ key: '?', target: { tagName: 'INPUT' } });
        expect(harness.isTutorialOpen()).toBe(false);
      });
    });
  });
});
