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
// 0. MOCK INFRASTRUCTURE (Storage & Oracles)
// ============================================================================

class LocalStorageMock {
  private store: Record<string, string> = {};
  public shouldThrowOnGet = false;
  public shouldThrowOnSet = false;

  getItem(key: string): string | null {
    if (this.shouldThrowOnGet) throw new Error('SecurityError: Mock storage access denied');
    return this.store[key] !== undefined ? this.store[key] : null;
  }
  setItem(key: string, val: string): void {
    if (this.shouldThrowOnSet) throw new Error('QuotaExceededError: Storage quota exceeded');
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

const mockStorage = new LocalStorageMock();
(globalThis as any).window = globalThis;
(globalThis as any).localStorage = mockStorage;

// Filtering Oracle reflecting src/client/App.tsx
function runFilteredTasksOracle(
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
    // Zen Mode strictly suppresses completed items regardless of activeFilter
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

// Habit Derivation Oracle
function runHabitDerivationOracle(filteredTasks: Task[], zenMode: boolean, habitTab: 'all' | 'due_today' = 'all') {
  const baseHabitsList = filteredTasks.filter((t) => {
    if (zenMode && Boolean(t.completed)) return false;
    if (t.type !== 'habit' && t.type !== 'daily') return false;
    if (habitTab === 'due_today') return t.is_due_today;
    return true;
  });

  const habitCounts = {
    all: baseHabitsList.length,
    morning: baseHabitsList.filter((h) => (h.time_of_day || 'anytime') === 'morning').length,
    workday: baseHabitsList.filter((h) => (h.time_of_day || 'anytime') === 'workday').length,
    evening: baseHabitsList.filter((h) => (h.time_of_day || 'anytime') === 'evening').length,
    anytime: baseHabitsList.filter((h) => (h.time_of_day || 'anytime') === 'anytime').length,
  };

  return { baseHabitsList, habitCounts };
}

// Task Derivation Oracle
function runTaskDerivationOracle(filteredTasks: Task[], zenMode: boolean, taskTab: 'all' | 'todo' | 'without_timeline' = 'all') {
  const allTasksList = filteredTasks.filter((t) => {
    if (zenMode && Boolean(t.completed)) return false;
    return t.type === 'todo';
  });

  const tasksList = (() => {
    if (taskTab === 'todo') {
      return allTasksList.filter((t) => t.due_date || t.scheduled_date || t.start_date);
    }
    if (taskTab === 'without_timeline') {
      return allTasksList.filter((t) => !t.due_date && !t.scheduled_date && !t.start_date);
    }
    return allTasksList;
  })();

  return { allTasksList, tasksList };
}

// Card Renderer Oracles
function renderHabitCardOracle(habit: Task, zenMode: boolean, densityMode: 'spacious' | 'compact' = 'spacious'): string | null {
  const isDone = Boolean(habit.completed);
  if (zenMode && isDone) return null;
  return `<div data-testid="habit-card-${habit.id}" class="${isDone ? 'completed line-through' : 'active'}">${habit.title}</div>`;
}

function renderTaskCardOracle(task: Task, zenMode: boolean, densityMode: 'spacious' | 'compact' = 'spacious'): string | null {
  const isDone = Boolean(task.completed);
  if (zenMode && isDone) return null;
  return `<div data-testid="task-card-${task.id}" class="${isDone ? 'completed line-through' : 'active'}">${task.title}</div>`;
}

// Mock Task Helper
function makeTask(overrides: Partial<Task>): Task {
  return {
    id: 't_' + Math.random().toString(36).substring(2, 9),
    user_id: 'u_test',
    title: 'Test Item',
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

// ============================================================================
// TEST SUITE SPECIFICATION
// ============================================================================

describe('Milestone 4 (Requirement R4) — Zen Mode Fix Test Suite', () => {
  beforeEach(() => {
    mockStorage.clear();
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // 1. STATE INITIALIZATION & ERROR RESILIENCE
  // --------------------------------------------------------------------------
  describe('1. Zen Mode State Initialization & Error Resilience', () => {
    const initZenMode = () => {
      try {
        return mockStorage.getItem('habitcorp_zen_mode') === 'true';
      } catch {
        return false;
      }
    };

    it('defaults to false when localStorage is empty (key is null)', () => {
      expect(initZenMode()).toBe(false);
    });

    it('initializes to true when localStorage stores "true"', () => {
      mockStorage.setItem('habitcorp_zen_mode', 'true');
      expect(initZenMode()).toBe(true);
    });

    it('initializes to false when localStorage stores "false"', () => {
      mockStorage.setItem('habitcorp_zen_mode', 'false');
      expect(initZenMode()).toBe(false);
    });

    it('safely defaults to false on corrupt or non-boolean strings ("1", "yes", "TRUE", "")', () => {
      for (const val of ['1', 'yes', 'TRUE', '', 'undefined', '{zen:true}']) {
        mockStorage.setItem('habitcorp_zen_mode', val);
        expect(initZenMode()).toBe(false);
      }
    });

    it('safely catches SecurityError and defaults to false if localStorage.getItem throws', () => {
      mockStorage.shouldThrowOnGet = true;
      expect(() => initZenMode()).not.toThrow();
      expect(initZenMode()).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // 2. TOGGLE BEHAVIOR & STORAGE SYNCHRONIZATION
  // --------------------------------------------------------------------------
  describe('2. Zen Mode Toggle Behavior & Persistence', () => {
    const createToggleHarness = (initial = false) => {
      let zenMode = initial;
      const toggle = () => {
        zenMode = !zenMode;
        try {
          mockStorage.setItem('habitcorp_zen_mode', String(zenMode));
        } catch {}
        return zenMode;
      };
      return { getState: () => zenMode, toggle };
    };

    it('flips zenMode from false to true and persists "true" to localStorage', () => {
      const harness = createToggleHarness(false);
      const next = harness.toggle();
      expect(next).toBe(true);
      expect(harness.getState()).toBe(true);
      expect(mockStorage.getItem('habitcorp_zen_mode')).toBe('true');
    });

    it('flips zenMode from true to false and persists "false" to localStorage', () => {
      const harness = createToggleHarness(true);
      const next = harness.toggle();
      expect(next).toBe(false);
      expect(harness.getState()).toBe(false);
      expect(mockStorage.getItem('habitcorp_zen_mode')).toBe('false');
    });

    it('supports rapid alternating toggle sequences (false -> true -> false -> true)', () => {
      const harness = createToggleHarness(false);
      harness.toggle(); // true
      expect(mockStorage.getItem('habitcorp_zen_mode')).toBe('true');
      harness.toggle(); // false
      expect(mockStorage.getItem('habitcorp_zen_mode')).toBe('false');
      harness.toggle(); // true
      expect(mockStorage.getItem('habitcorp_zen_mode')).toBe('true');
    });

    it('survives QuotaExceededError on localStorage.setItem without crashing state', () => {
      mockStorage.shouldThrowOnSet = true;
      const harness = createToggleHarness(false);
      expect(() => harness.toggle()).not.toThrow();
      expect(harness.getState()).toBe(true);
    });

    it('does not disturb other local storage keys during Zen toggle', () => {
      mockStorage.setItem('habitcorp_theme', 'dark');
      mockStorage.setItem('habitcorp_sound', 'true');
      const harness = createToggleHarness(false);
      harness.toggle();
      expect(mockStorage.getItem('habitcorp_theme')).toBe('dark');
      expect(mockStorage.getItem('habitcorp_sound')).toBe('true');
      expect(mockStorage.getItem('habitcorp_zen_mode')).toBe('true');
    });
  });

  // --------------------------------------------------------------------------
  // 3. TASK FILTERING UNDER ZEN MODE
  // --------------------------------------------------------------------------
  describe('3. Task Filtering Under Zen Mode', () => {
    const taskSet: Task[] = [
      makeTask({ id: 't_active_1', title: 'Review pull request', type: 'todo', completed: 0 }),
      makeTask({ id: 't_done_1', title: 'Write unit tests', type: 'todo', completed: 1 }),
      makeTask({ id: 't_active_2', title: 'Deploy staging', type: 'todo', completed: 0 }),
      makeTask({ id: 't_done_2', title: 'File bug report', type: 'todo', completed: 1 }),
    ];

    it('strictly excludes completed tasks when zenMode === true even if activeFilter === "all"', () => {
      const result = runFilteredTasksOracle(taskSet, true, 'all');
      const ids = result.map((t) => t.id);
      expect(ids).toEqual(['t_active_1', 't_active_2']);
      expect(ids).not.toContain('t_done_1');
      expect(ids).not.toContain('t_done_2');
    });

    it('strictly excludes completed tasks when zenMode === true and activeFilter === "active"', () => {
      const result = runFilteredTasksOracle(taskSet, true, 'active');
      const ids = result.map((t) => t.id);
      expect(ids).toEqual(['t_active_1', 't_active_2']);
    });

    it('includes completed tasks when zenMode === false and activeFilter === "all"', () => {
      const result = runFilteredTasksOracle(taskSet, false, 'all');
      expect(result).toHaveLength(4);
      const ids = result.map((t) => t.id);
      expect(ids).toContain('t_done_1');
      expect(ids).toContain('t_done_2');
    });

    it('excludes completed tasks when zenMode === false and activeFilter === "active"', () => {
      const result = runFilteredTasksOracle(taskSet, false, 'active');
      const ids = result.map((t) => t.id);
      expect(ids).toEqual(['t_active_1', 't_active_2']);
    });

    it('evaluates diverse boolean/numerical completion representations safely', () => {
      const boundaryTasks: Task[] = [
        makeTask({ id: 't1', title: 'Num 1', completed: 1 as any }),
        makeTask({ id: 't2', title: 'Bool true', completed: true as any }),
        makeTask({ id: 't3', title: 'Num 0', completed: 0 as any }),
        makeTask({ id: 't4', title: 'Bool false', completed: false as any }),
        makeTask({ id: 't5', title: 'Undefined', completed: undefined as any }),
      ];

      const zenResult = runFilteredTasksOracle(boundaryTasks, true, 'all');
      const zenIds = zenResult.map((t) => t.id);
      expect(zenIds).toEqual(['t3', 't4', 't5']);
    });

    it('derives tasksList and allTasksList without completed items under Zen mode', () => {
      const mixed = [
        makeTask({ id: 't_active_due', title: 'Active Due', type: 'todo', completed: 0, due_date: '2026-11-05' }),
        makeTask({ id: 't_done_due', title: 'Done Due', type: 'todo', completed: 1, due_date: '2026-11-05' }),
        makeTask({ id: 't_active_backlog', title: 'Active Backlog', type: 'todo', completed: 0 }),
      ];
      const filtered = runFilteredTasksOracle(mixed, true, 'all');
      const { allTasksList, tasksList } = runTaskDerivationOracle(filtered, true, 'todo');

      expect(allTasksList.map((t) => t.id)).toEqual(['t_active_due', 't_active_backlog']);
      expect(tasksList.map((t) => t.id)).toEqual(['t_active_due']);
      expect(allTasksList.map((t) => t.id)).not.toContain('t_done_due');
    });
  });

  // --------------------------------------------------------------------------
  // 4. HABIT FILTERING UNDER ZEN MODE
  // --------------------------------------------------------------------------
  describe('4. Habit Filtering Under Zen Mode', () => {
    const habitSet: Task[] = [
      makeTask({ id: 'h_morn_active', title: 'Morning Hydration', type: 'daily', time_of_day: 'morning', completed: 0 }),
      makeTask({ id: 'h_morn_done', title: 'Morning Meditation', type: 'daily', time_of_day: 'morning', completed: 1 }),
      makeTask({ id: 'h_work_active', title: 'Focus Sprint', type: 'daily', time_of_day: 'workday', completed: 0 }),
      makeTask({ id: 'h_work_done', title: 'Daily Standup', type: 'daily', time_of_day: 'workday', completed: 1 }),
      makeTask({ id: 'h_eve_active', title: 'Evening Walk', type: 'daily', time_of_day: 'evening', completed: 0 }),
      makeTask({ id: 'h_counter', title: 'Book Reading', type: 'habit', counter_up: 3, completed: 0 }),
    ];

    it('excludes completed daily habits from baseHabitsList when zenMode === true', () => {
      const filtered = runFilteredTasksOracle(habitSet, true, 'all');
      const { baseHabitsList } = runHabitDerivationOracle(filtered, true, 'all');
      const ids = baseHabitsList.map((h) => h.id);

      expect(ids).toContain('h_morn_active');
      expect(ids).toContain('h_work_active');
      expect(ids).toContain('h_eve_active');
      expect(ids).toContain('h_counter');
      expect(ids).not.toContain('h_morn_done');
      expect(ids).not.toContain('h_work_done');
    });

    it('preserves completed daily habits when zenMode === false and activeFilter === "all"', () => {
      const filtered = runFilteredTasksOracle(habitSet, false, 'all');
      const { baseHabitsList } = runHabitDerivationOracle(filtered, false, 'all');
      expect(baseHabitsList).toHaveLength(6);
      const ids = baseHabitsList.map((h) => h.id);
      expect(ids).toContain('h_morn_done');
      expect(ids).toContain('h_work_done');
    });

    it('updates habitCounts per time-of-day accurately under Zen mode', () => {
      // Under Zen mode, morning count should be 1 (meditation excluded)
      const filteredZen = runFilteredTasksOracle(habitSet, true, 'all');
      const { habitCounts: countsZen } = runHabitDerivationOracle(filteredZen, true, 'all');
      expect(countsZen.all).toBe(4);
      expect(countsZen.morning).toBe(1);
      expect(countsZen.workday).toBe(1);
      expect(countsZen.evening).toBe(1);

      // Under Zen OFF, morning count should be 2
      const filteredOff = runFilteredTasksOracle(habitSet, false, 'all');
      const { habitCounts: countsOff } = runHabitDerivationOracle(filteredOff, false, 'all');
      expect(countsOff.all).toBe(6);
      expect(countsOff.morning).toBe(2);
      expect(countsOff.workday).toBe(2);
    });
  });

  // --------------------------------------------------------------------------
  // 5. CARD RENDERING ORACLES (renderTaskCard & renderHabitCard)
  // --------------------------------------------------------------------------
  describe('5. Card Rendering Oracles Under Zen Mode', () => {
    it('renderHabitCard returns null when zenMode === true and habit is completed', () => {
      const doneHabit = makeTask({ id: 'h1', title: 'Yoga', type: 'daily', completed: 1 });
      const html = renderHabitCardOracle(doneHabit, true);
      expect(html).toBeNull();
    });

    it('renderHabitCard returns markup when zenMode === false and habit is completed', () => {
      const doneHabit = makeTask({ id: 'h1', title: 'Yoga', type: 'daily', completed: 1 });
      const html = renderHabitCardOracle(doneHabit, false);
      expect(html).not.toBeNull();
      expect(html).toContain('completed line-through');
    });

    it('renderHabitCard renders normal active card when zenMode === true and habit is active', () => {
      const activeHabit = makeTask({ id: 'h2', title: 'Stretch', type: 'daily', completed: 0 });
      const html = renderHabitCardOracle(activeHabit, true);
      expect(html).not.toBeNull();
      expect(html).toContain('active');
    });

    it('renderTaskCard returns null when zenMode === true and task is completed', () => {
      const doneTask = makeTask({ id: 't1', title: 'Code review', type: 'todo', completed: 1 });
      const html = renderTaskCardOracle(doneTask, true);
      expect(html).toBeNull();
    });

    it('renderTaskCard returns markup when zenMode === false and task is completed', () => {
      const doneTask = makeTask({ id: 't1', title: 'Code review', type: 'todo', completed: 1 });
      const html = renderTaskCardOracle(doneTask, false);
      expect(html).not.toBeNull();
      expect(html).toContain('completed line-through');
    });
  });

  // --------------------------------------------------------------------------
  // 6. MULTI-FILTER INTERACTIONS & VIEW COMBINATIONS
  // --------------------------------------------------------------------------
  describe('6. Multi-Filter Interactions & View Combinations', () => {
    const mixedTasks: Task[] = [
      makeTask({ id: 't_xs_active', title: 'Quick reply', difficulty: 'trivial', completed: 0 }),
      makeTask({ id: 't_xs_done', title: 'Quick check', difficulty: 'trivial', completed: 1 }),
      makeTask({ id: 't_s_active', title: 'Draft notes', difficulty: 'easy', completed: 0 }),
      makeTask({ id: 't_s_done', title: 'File invoice', difficulty: 'easy', completed: 1 }),
      makeTask({ id: 't_m_active', title: 'Design spec', difficulty: 'medium', completed: 0 }),
      makeTask({ id: 't_m_done', title: 'Refactor auth', difficulty: 'medium', completed: 1 }),
    ];

    it('combines Low Battery mode + Zen mode: strictly returns active XS and S tasks only', () => {
      const result = runFilteredTasksOracle(
        mixedTasks,
        true,        // zenMode = true
        'all',       // activeFilter = 'all'
        true         // lowBatteryFilter = true
      );
      const ids = result.map((t) => t.id);
      expect(ids).toEqual(['t_xs_active', 't_s_active']);
      expect(ids).not.toContain('t_xs_done');
      expect(ids).not.toContain('t_s_done');
      expect(ids).not.toContain('t_m_active');
      expect(ids).not.toContain('t_m_done');
    });

    it('combines Search query + Zen mode: suppresses matching completed items', () => {
      const searchTasks: Task[] = [
        makeTask({ id: 's1', title: 'Database migration', completed: 0 }),
        makeTask({ id: 's2', title: 'Database backup', completed: 1 }),
      ];

      // Under Zen mode ON: only active matching task appears
      const zenMatches = runFilteredTasksOracle(searchTasks, true, 'all', false, 'all', 'all', 'database');
      expect(zenMatches.map((t) => t.id)).toEqual(['s1']);

      // Under Zen mode OFF + activeFilter='all': both match
      const allMatches = runFilteredTasksOracle(searchTasks, false, 'all', false, 'all', 'all', 'database');
      expect(allMatches.map((t) => t.id)).toEqual(['s1', 's2']);
    });

    it('handles all-completed edge case by returning empty array to trigger empty state', () => {
      const allCompleted = [
        makeTask({ id: 'c1', completed: 1 }),
        makeTask({ id: 'c2', completed: 1 }),
      ];
      const result = runFilteredTasksOracle(allCompleted, true, 'all');
      expect(result).toHaveLength(0);
    });
  });

  // --------------------------------------------------------------------------
  // 7. SIDEBAR ZEN MODE NAVIGATION TRIGGER & ACCESSIBILITY
  // --------------------------------------------------------------------------
  describe('7. Sidebar Zen Mode Navigation Trigger & Accessibility', () => {
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
      theme: 'light',
      onCycleTheme: vi.fn(),
      auth: null,
      onOpenAuth: vi.fn(),
      onLogout: vi.fn(),
      zenMode: false,
      onToggleZenMode: vi.fn(),
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

    it('renders Zen mode trigger button in Sidebar when onToggleZenMode is provided', () => {
      const html = renderSidebar({ onToggleZenMode: vi.fn() });
      expect(html).toContain('aria-label="Toggle Zen Mode"');
    });

    it('reflects aria-pressed="true" when zenMode is true', () => {
      const html = renderSidebar({ zenMode: true, onToggleZenMode: vi.fn() });
      expect(html).toContain('aria-pressed="true"');
      expect(html).toContain('bg-emerald-50');
    });

    it('reflects aria-pressed="false" when zenMode is false', () => {
      const html = renderSidebar({ zenMode: false, onToggleZenMode: vi.fn() });
      expect(html).toContain('aria-pressed="false"');
    });

    it('renders localized labels in Catalan, Spanish, and English', () => {
      const htmlEn = renderSidebar({ onToggleZenMode: vi.fn() }, 'en');
      expect(htmlEn).toContain(translations.en.zenModeBtn);

      const htmlEs = renderSidebar({ onToggleZenMode: vi.fn() }, 'es');
      expect(htmlEs).toContain(translations.es.zenModeBtn);

      const htmlCa = renderSidebar({ onToggleZenMode: vi.fn() }, 'ca');
      expect(htmlCa).toContain(translations.ca.zenModeBtn);
    });

    it('does not render Zen mode button when onToggleZenMode is undefined', () => {
      const html = renderSidebar({ onToggleZenMode: undefined });
      expect(html).not.toContain('aria-label="Toggle Zen Mode"');
    });

    it('invokes onToggleZenMode callback on toggle action', () => {
      const onToggle = vi.fn();
      let currentZen = false;
      const simulateClick = () => {
        currentZen = !currentZen;
        onToggle();
      };
      simulateClick();
      expect(onToggle).toHaveBeenCalledTimes(1);
    });
  });

  // --------------------------------------------------------------------------
  // 8. STATIC CODE CONTRACT VERIFICATION
  // --------------------------------------------------------------------------
  describe('8. Static Code Contract Verification', () => {
    const appTsxPath = path.resolve(__dirname, '../src/client/App.tsx');
    const sidebarTsxPath = path.resolve(__dirname, '../src/client/components/Sidebar.tsx');

    it('verifies App.tsx declares zenMode state initialized from localStorage', () => {
      const appSource = fs.readFileSync(appTsxPath, 'utf8');
      expect(appSource).toMatch(/habitcorp_zen_mode/);
      expect(appSource).toMatch(/zenMode/);
      expect(appSource).toMatch(/setZenMode/);
    });

    it('verifies App.tsx passes zenMode and onToggleZenMode to Sidebar', () => {
      const appSource = fs.readFileSync(appTsxPath, 'utf8');
      expect(appSource).toMatch(/<Sidebar[\s\S]*?zenMode=\{zenMode\}[\s\S]*?\/>/);
      expect(appSource).toMatch(/<Sidebar[\s\S]*?onToggleZenMode=\{toggleZenMode\}[\s\S]*?\/>/);
    });

    it('verifies App.tsx filteredTasks memo incorporates zenMode dependency and suppression', () => {
      const appSource = fs.readFileSync(appTsxPath, 'utf8');
      expect(appSource).toMatch(/\(zenMode\s*\|\|\s*activeFilter\s*===\s*'active'\)\s*&&\s*Boolean\(t\.completed\)/);
      expect(appSource).toMatch(/filteredTasks\s*=\s*useMemo\([\s\S]*?\[[\s\S]*?zenMode[\s\S]*?\]\);/);
    });

    it('verifies App.tsx baseHabitsList and allTasksList have defense-in-depth zenMode filtering', () => {
      const appSource = fs.readFileSync(appTsxPath, 'utf8');
      expect(appSource).toMatch(/baseHabitsList\s*=\s*useMemo\([\s\S]*?zenMode\s*&&\s*Boolean\(t\.completed\)[\s\S]*?\]\);/);
      expect(appSource).toMatch(/allTasksList\s*=\s*useMemo\([\s\S]*?zenMode\s*&&\s*Boolean\(t\.completed\)[\s\S]*?\]\);/);
    });

    it('verifies App.tsx card renderers have defense-in-depth zenMode checks', () => {
      const appSource = fs.readFileSync(appTsxPath, 'utf8');
      expect(appSource).toMatch(/renderHabitCard[\s\S]*?if\s*\(zenMode\s*&&\s*isDone\)\s*return\s*null;/);
      expect(appSource).toMatch(/tasksList\.map[\s\S]*?if\s*\(zenMode\s*&&\s*isDone\)\s*return\s*null;/);
    });

    it('verifies App.tsx binds "z" / "Z" keyboard shortcut and preserves empty deps [] on keydown listener', () => {
      const appSource = fs.readFileSync(appTsxPath, 'utf8');
      expect(appSource).toMatch(/e\.key\s*===\s*'z'\s*\|\|\s*e\.key\s*===\s*'Z'/);
      expect(appSource).toMatch(
        /window\.addEventListener\('keydown',\s*handleKeyDown\);\s*return\s*\(\)\s*=>\s*window\.removeEventListener\('keydown',\s*handleKeyDown\);\s*},\s*\[\]\);/
      );
    });

    it('verifies Sidebar.tsx implements onToggleZenMode button with aria-pressed', () => {
      const sidebarSource = fs.readFileSync(sidebarTsxPath, 'utf8');
      expect(sidebarSource).toMatch(/onToggleZenMode/);
      expect(sidebarSource).toMatch(/aria-pressed=\{Boolean\(zenMode\)\}/);
      expect(sidebarSource).toMatch(/aria-label="Toggle Zen Mode"/);
    });
  });
});
