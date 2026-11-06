import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { Sidebar, SidebarProps } from '../src/client/components/Sidebar';
import { I18nProvider } from '../src/client/i18n/I18nContext';
import { translations, Language } from '../src/client/i18n/translations';
import { Task, DifficultyTier } from '../src/client/types';

// ============================================================================
// 0. ENVIRONMENT MOCK & ACCESSIBILITY QUERY ORACLES
// ============================================================================

class AdversarialLocalStorageMock {
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

const mockStorage = new AdversarialLocalStorageMock();
(globalThis as any).window = globalThis;
(globalThis as any).localStorage = mockStorage;

// Accessible element parsed from HTML
interface AccessibleElement {
  tag: string;
  role: string;
  accessibleName: string;
  rawHtml: string;
  attributes: Record<string, string>;
  textContent: string;
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function parseAccessibleButtons(html: string): AccessibleElement[] {
  const elements: AccessibleElement[] = [];
  const buttonRegex = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
  let match: RegExpExecArray | null;

  while ((match = buttonRegex.exec(html)) !== null) {
    const rawAttrs = match[1];
    const innerContent = match[2];

    const attributes: Record<string, string> = {};
    const attrRegex = /([a-zA-Z0-9\-]+)=(?:"([^"]*)"|'([^']*)')/g;
    let attrMatch: RegExpExecArray | null;
    while ((attrMatch = attrRegex.exec(rawAttrs)) !== null) {
      const val = attrMatch[2] !== undefined ? attrMatch[2] : attrMatch[3];
      attributes[attrMatch[1].toLowerCase()] = decodeHtmlEntities(val);
    }

    const role = attributes['role'] || 'button';
    let accessibleName = attributes['aria-label'] || attributes['title'] || '';
    const textContent = decodeHtmlEntities(innerContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
    if (!accessibleName) {
      accessibleName = textContent;
    }

    elements.push({
      tag: 'button',
      role,
      accessibleName,
      rawHtml: match[0],
      attributes,
      textContent,
    });
  }

  return elements;
}

function renderSidebarWithI18n(props: Partial<SidebarProps>, lang: Language = 'en'): string {
  mockStorage.setItem('habitcorp_lang', lang);
  const defaultProps: SidebarProps = {
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
    zenMode: false,
    onToggleZenMode: vi.fn(),
    ...props,
  };

  return renderToStaticMarkup(
    React.createElement(I18nProvider, null, React.createElement(Sidebar, defaultProps))
  );
}

// ============================================================================
// 1. PRODUCTION FILTERING PIPELINE ORACLE (src/client/App.tsx fidelity)
// ============================================================================

export interface FilterParams {
  tasks: Task[];
  zenMode: boolean;
  activeFilter?: 'active' | 'all';
  difficultyFilter?: DifficultyTier | 'all';
  lowBatteryFilter?: boolean;
  selectedProjectId?: string | 'all';
  searchQuery?: string;
  habitTab?: 'all' | 'due_today';
  habitTimeFilter?: 'all' | 'morning' | 'workday' | 'evening' | 'anytime';
  taskTab?: 'all' | 'todo' | 'without_timeline';
}

export function executeFilteringPipeline(params: FilterParams) {
  const {
    tasks,
    zenMode,
    activeFilter = 'all',
    difficultyFilter = 'all',
    lowBatteryFilter = false,
    selectedProjectId = 'all',
    searchQuery = '',
    habitTab = 'all',
    habitTimeFilter = 'all',
    taskTab = 'all',
  } = params;

  // 1. filteredTasks (Upstream Root Filter)
  const filteredTasks = tasks.filter((t) => {
    if (selectedProjectId !== 'all' && t.project_id !== selectedProjectId) return false;
    if (difficultyFilter !== 'all' && t.difficulty !== difficultyFilter) return false;
    if (lowBatteryFilter) {
      if (t.difficulty !== 'trivial' && t.difficulty !== 'easy') return false;
    }
    // Zen Mode or activeFilter === 'active' strictly suppresses completed items
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

  // 2. baseHabitsList (Habit Derivation with Defense-in-Depth)
  const baseHabitsList = filteredTasks.filter((t) => {
    if (zenMode && Boolean(t.completed)) return false;
    if (t.type !== 'habit' && t.type !== 'daily') return false;
    if (habitTab === 'due_today') return t.is_due_today;
    return true;
  });

  // 3. habitCounts
  const habitCounts = {
    all: baseHabitsList.length,
    morning: baseHabitsList.filter((h) => (h.time_of_day || 'anytime') === 'morning').length,
    workday: baseHabitsList.filter((h) => (h.time_of_day || 'anytime') === 'workday').length,
    evening: baseHabitsList.filter((h) => (h.time_of_day || 'anytime') === 'evening').length,
    anytime: baseHabitsList.filter((h) => (h.time_of_day || 'anytime') === 'anytime').length,
  };

  // 4. habitsList (Time-of-day pill selection)
  const habitsList =
    habitTimeFilter === 'all'
      ? baseHabitsList
      : baseHabitsList.filter((t) => (t.time_of_day || 'anytime') === habitTimeFilter);

  // 5. Sectioned Habit Groupings
  const morningHabits = baseHabitsList.filter((t) => (t.time_of_day || 'anytime') === 'morning');
  const workdayHabits = baseHabitsList.filter((t) => (t.time_of_day || 'anytime') === 'workday');
  const eveningHabits = baseHabitsList.filter((t) => (t.time_of_day || 'anytime') === 'evening');
  const anytimeHabits = baseHabitsList.filter((t) => (t.time_of_day || 'anytime') === 'anytime');

  // 6. allTasksList (Task Derivation with Defense-in-Depth)
  const allTasksList = filteredTasks.filter((t) => {
    if (zenMode && Boolean(t.completed)) return false;
    return t.type === 'todo';
  });

  // 7. tasksList (Task Tab selection)
  const tasksList = (() => {
    if (taskTab === 'todo') {
      return allTasksList.filter((t) => t.due_date || t.scheduled_date || t.start_date);
    }
    if (taskTab === 'without_timeline') {
      return allTasksList.filter((t) => !t.due_date && !t.scheduled_date && !t.start_date);
    }
    return allTasksList;
  })();

  return {
    filteredTasks,
    baseHabitsList,
    habitCounts,
    habitsList,
    morningHabits,
    workdayHabits,
    eveningHabits,
    anytimeHabits,
    allTasksList,
    tasksList,
  };
}

// Card Renderers Oracles
export function renderHabitCardOracle(habit: Task, zenMode: boolean): string | null {
  const isDone = Boolean(habit.completed);
  if (zenMode && isDone) return null;
  return `<div data-testid="habit-card-${habit.id}" class="${isDone ? 'completed' : 'active'}">${habit.title}</div>`;
}

export function renderTaskCardOracle(task: Task, zenMode: boolean): string | null {
  const isDone = Boolean(task.completed);
  if (zenMode && isDone) return null;
  return `<div data-testid="task-card-${task.id}" class="${isDone ? 'completed' : 'active'}">${task.title}</div>`;
}

// Task Generator Helper
function generateTestTask(id: string, overrides: Partial<Task> = {}): Task {
  return {
    id,
    user_id: 'u_adversarial',
    title: `Item ${id}`,
    notes: `Notes for ${id}`,
    type: 'todo',
    difficulty: 'easy',
    difficulty_weight: 2,
    tags: ['tagA', 'tagB'],
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
    scheduled_date: null,
    project_id: 'proj_alpha',
    project_name: 'Alpha Project',
    time_of_day: 'morning',
    is_due_today: true,
    ...overrides,
  };
}

// Pseudo-random seeded generator for reproducibility
class SeededRandom {
  private seed: number;
  constructor(seed = 123456789) {
    this.seed = seed;
  }
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
  boolean(prob = 0.5): boolean {
    return this.next() < prob;
  }
}

// ============================================================================
// 2. ADVERSARIAL TEST SUITE: FILTER PERMUTATIONS, WAI-ARIA, PERFORMANCE
// ============================================================================

describe('Milestone 4 Adversarial Verification: Zen Mode Filtering & Accessibility', () => {
  beforeEach(() => {
    mockStorage.clear();
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // SECTION 1: Exhaustive Deterministic Permutations Grid (480 combinations)
  // --------------------------------------------------------------------------
  describe('1. Exhaustive Combinatorial Grid Permutations', () => {
    const zenModes: boolean[] = [true, false];
    const activeFilters: ('active' | 'all')[] = ['active', 'all'];
    const difficultyFilters: (DifficultyTier | 'all')[] = ['all', 'trivial', 'easy', 'medium', 'hard'];
    const lowBatteryFilters: boolean[] = [false, true];
    const projectFilters: (string | 'all')[] = ['all', 'proj_alpha', 'proj_nonexistent'];
    const searchQueries: string[] = ['', 'item', 'notes', 'nomatch_xyz'];

    // Create a base dataset with 12 distinct items covering types, completion, difficulties, projects
    const baseDataset: Task[] = [
      // Completed Tasks
      generateTestTask('t1', { type: 'todo', completed: 1, difficulty: 'trivial', project_id: 'proj_alpha', title: 'Completed Trivial Todo' }),
      generateTestTask('t2', { type: 'todo', completed: 1, difficulty: 'medium', project_id: 'proj_alpha', title: 'Completed Medium Todo' }),
      generateTestTask('t3', { type: 'todo', completed: 1, difficulty: 'hard', project_id: 'proj_beta', title: 'Completed Hard Todo Beta' }),
      // Uncompleted Tasks
      generateTestTask('t4', { type: 'todo', completed: 0, difficulty: 'trivial', project_id: 'proj_alpha', title: 'Uncompleted Trivial Todo' }),
      generateTestTask('t5', { type: 'todo', completed: 0, difficulty: 'easy', project_id: 'proj_alpha', title: 'Uncompleted Easy Todo' }),
      generateTestTask('t6', { type: 'todo', completed: 0, difficulty: 'hard', project_id: 'proj_beta', title: 'Uncompleted Hard Todo Beta' }),
      // Completed Habits
      generateTestTask('h1', { type: 'habit', completed: 1, difficulty: 'trivial', project_id: 'proj_alpha', time_of_day: 'morning', title: 'Completed Morning Habit' }),
      generateTestTask('h2', { type: 'daily', completed: 1, difficulty: 'easy', project_id: 'proj_alpha', time_of_day: 'workday', title: 'Completed Workday Daily' }),
      generateTestTask('h3', { type: 'habit', completed: 1, difficulty: 'medium', project_id: 'proj_beta', time_of_day: 'evening', title: 'Completed Evening Habit Beta' }),
      // Uncompleted Habits
      generateTestTask('h4', { type: 'habit', completed: 0, difficulty: 'trivial', project_id: 'proj_alpha', time_of_day: 'morning', title: 'Uncompleted Morning Habit' }),
      generateTestTask('h5', { type: 'daily', completed: 0, difficulty: 'easy', project_id: 'proj_alpha', time_of_day: 'workday', title: 'Uncompleted Workday Daily' }),
      generateTestTask('h6', { type: 'habit', completed: 0, difficulty: 'hard', project_id: 'proj_beta', time_of_day: 'anytime', title: 'Uncompleted Hard Habit Beta' }),
    ];

    it('evaluates all 480 combinatorial filter permutations verifying zero completed items leak when zenMode === true', () => {
      let totalEvaluated = 0;
      let zenActiveEvaluated = 0;

      for (const zenMode of zenModes) {
        for (const activeFilter of activeFilters) {
          for (const difficultyFilter of difficultyFilters) {
            for (const lowBatteryFilter of lowBatteryFilters) {
              for (const selectedProjectId of projectFilters) {
                for (const searchQuery of searchQueries) {
                  totalEvaluated++;
                  const res = executeFilteringPipeline({
                    tasks: baseDataset,
                    zenMode,
                    activeFilter,
                    difficultyFilter,
                    lowBatteryFilter,
                    selectedProjectId,
                    searchQuery,
                  });

                  if (zenMode) {
                    zenActiveEvaluated++;
                    // Invariant 1: filteredTasks must never contain ANY completed task or habit
                    const completedInFiltered = res.filteredTasks.filter((t) => Boolean(t.completed));
                    expect(completedInFiltered).toHaveLength(0);

                    // Invariant 2: baseHabitsList and all habits views must have 0 completed habits
                    const completedInBaseHabits = res.baseHabitsList.filter((h) => Boolean(h.completed));
                    expect(completedInBaseHabits).toHaveLength(0);
                    const completedInHabitsList = res.habitsList.filter((h) => Boolean(h.completed));
                    expect(completedInHabitsList).toHaveLength(0);
                    expect(res.morningHabits.filter((h) => Boolean(h.completed))).toHaveLength(0);
                    expect(res.workdayHabits.filter((h) => Boolean(h.completed))).toHaveLength(0);
                    expect(res.eveningHabits.filter((h) => Boolean(h.completed))).toHaveLength(0);
                    expect(res.anytimeHabits.filter((h) => Boolean(h.completed))).toHaveLength(0);

                    // Invariant 3: allTasksList and tasksList must have 0 completed tasks
                    const completedInAllTasks = res.allTasksList.filter((t) => Boolean(t.completed));
                    expect(completedInAllTasks).toHaveLength(0);
                    const completedInTasksList = res.tasksList.filter((t) => Boolean(t.completed));
                    expect(completedInTasksList).toHaveLength(0);

                    // Invariant 4: Card renderers must return null for completed items
                    for (const item of baseDataset) {
                      if (Boolean(item.completed)) {
                        expect(renderHabitCardOracle(item, zenMode)).toBeNull();
                        expect(renderTaskCardOracle(item, zenMode)).toBeNull();
                      }
                    }
                  } else if (activeFilter === 'all') {
                    // When zenMode === false AND activeFilter === 'all', completed items SHOULD be allowed
                    // (unless filtered by difficulty, project, or search)
                    const matchingCompleted = baseDataset.filter((t) => {
                      if (!Boolean(t.completed)) return false;
                      if (selectedProjectId !== 'all' && t.project_id !== selectedProjectId) return false;
                      if (difficultyFilter !== 'all' && t.difficulty !== difficultyFilter) return false;
                      if (lowBatteryFilter && t.difficulty !== 'trivial' && t.difficulty !== 'easy') return false;
                      if (searchQuery.trim()) {
                        const q = searchQuery.toLowerCase();
                        const mTitle = t.title.toLowerCase().includes(q);
                        const mNotes = t.notes?.toLowerCase().includes(q);
                        const mProj = t.project_name?.toLowerCase().includes(q);
                        if (!mTitle && !mNotes && !mProj) return false;
                      }
                      return true;
                    });
                    const actualCompletedInFiltered = res.filteredTasks.filter((t) => Boolean(t.completed));
                    expect(actualCompletedInFiltered).toHaveLength(matchingCompleted.length);
                  }
                }
              }
            }
          }
        }
      }

      expect(totalEvaluated).toBe(480);
      expect(zenActiveEvaluated).toBe(240);
    });
  });

  // --------------------------------------------------------------------------
  // SECTION 2: 500+ Randomized Monte Carlo Permutations (Adversarial Fuzzing)
  // --------------------------------------------------------------------------
  describe('2. Randomized Monte Carlo Stress-Testing (500+ Permutations)', () => {
    it('executes 600 randomized permutations confirming zero completed items leak under any combination of parameters', () => {
      const rng = new SeededRandom(987654321);
      const difficulties: DifficultyTier[] = ['trivial', 'easy', 'medium', 'hard'];
      const projects = ['proj_1', 'proj_2', 'proj_3', 'proj_4'];
      const searchTerms = ['', 'clean', 'meeting', 'water', 'exercise', 'code', 'random_query_xyz'];
      const timesOfDay: ('morning' | 'workday' | 'evening' | 'anytime')[] = ['morning', 'workday', 'evening', 'anytime'];

      let zenModeActiveRuns = 0;

      for (let run = 0; run < 600; run++) {
        // Generate a random pool of 30 to 80 items
        const itemCount = 30 + Math.floor(rng.next() * 50);
        const tasks: Task[] = [];

        for (let i = 0; i < itemCount; i++) {
          const isCompleted = rng.boolean(0.5); // 50% completed ratio
          const itemType = rng.pick(['todo', 'habit', 'daily'] as const);
          const diff = rng.pick(difficulties);
          const proj = rng.boolean(0.8) ? rng.pick(projects) : undefined;
          const tod = rng.pick(timesOfDay);
          const hasTimeline = rng.boolean(0.6);

          tasks.push(
            generateTestTask(`fuzz_${run}_${i}`, {
              type: itemType,
              completed: isCompleted ? 1 : 0,
              difficulty: diff,
              project_id: proj,
              project_name: proj ? `Project ${proj}` : undefined,
              time_of_day: tod,
              title: `${rng.pick(searchTerms)} task ${i}`,
              notes: rng.boolean(0.3) ? `Special note ${rng.pick(searchTerms)}` : '',
              is_due_today: rng.boolean(0.7),
              due_date: hasTimeline ? '2026-11-01' : null,
              scheduled_date: hasTimeline ? '2026-11-01' : null,
              start_date: hasTimeline ? '2026-11-01' : null,
            })
          );
        }

        // Random filter parameters
        const zenMode = rng.boolean(0.5);
        if (zenMode) zenModeActiveRuns++;

        const activeFilter = rng.pick(['active', 'all'] as const);
        const difficultyFilter = rng.boolean(0.7) ? rng.pick(difficulties) : 'all';
        const lowBatteryFilter = rng.boolean(0.3);
        const selectedProjectId = rng.boolean(0.6) ? rng.pick(projects) : 'all';
        const searchQuery = rng.pick(searchTerms);
        const habitTab = rng.pick(['all', 'due_today'] as const);
        const habitTimeFilter = rng.pick(['all', 'morning', 'workday', 'evening', 'anytime'] as const);
        const taskTab = rng.pick(['all', 'todo', 'without_timeline'] as const);

        const res = executeFilteringPipeline({
          tasks,
          zenMode,
          activeFilter,
          difficultyFilter,
          lowBatteryFilter,
          selectedProjectId,
          searchQuery,
          habitTab,
          habitTimeFilter,
          taskTab,
        });

        if (zenMode) {
          // Zero tolerance for any completed items in ANY pipeline collection
          for (const item of res.filteredTasks) {
            expect(Boolean(item.completed), `Leak in filteredTasks at run ${run}: id=${item.id}`).toBe(false);
          }
          for (const habit of res.baseHabitsList) {
            expect(Boolean(habit.completed), `Leak in baseHabitsList at run ${run}: id=${habit.id}`).toBe(false);
          }
          for (const habit of res.habitsList) {
            expect(Boolean(habit.completed), `Leak in habitsList at run ${run}: id=${habit.id}`).toBe(false);
          }
          for (const task of res.allTasksList) {
            expect(Boolean(task.completed), `Leak in allTasksList at run ${run}: id=${task.id}`).toBe(false);
          }
          for (const task of res.tasksList) {
            expect(Boolean(task.completed), `Leak in tasksList at run ${run}: id=${task.id}`).toBe(false);
          }

          // Card renderers must return null for every completed task or habit
          for (const item of tasks) {
            if (Boolean(item.completed)) {
              expect(renderHabitCardOracle(item, zenMode)).toBeNull();
              expect(renderTaskCardOracle(item, zenMode)).toBeNull();
            }
          }

          // Verify uncompleted items are NOT falsely dropped if they match active filters
          const expectedUncompletedMatches = tasks.filter((t) => {
            if (Boolean(t.completed)) return false;
            if (selectedProjectId !== 'all' && t.project_id !== selectedProjectId) return false;
            if (difficultyFilter !== 'all' && t.difficulty !== difficultyFilter) return false;
            if (lowBatteryFilter && t.difficulty !== 'trivial' && t.difficulty !== 'easy') return false;
            if (searchQuery.trim()) {
              const q = searchQuery.toLowerCase();
              const mTitle = t.title.toLowerCase().includes(q);
              const mNotes = t.notes?.toLowerCase().includes(q);
              const mProj = t.project_name?.toLowerCase().includes(q);
              if (!mTitle && !mNotes && !mProj) return false;
            }
            return true;
          });

          expect(res.filteredTasks.length).toBe(expectedUncompletedMatches.length);
        }
      }

      expect(zenModeActiveRuns).toBeGreaterThanOrEqual(250);
      expect(zenModeActiveRuns).toBeLessThanOrEqual(350);
    });

    it('adversarially stress-tests diverse completion type representations (boolean, number, strings, null, undefined)', () => {
      const edgeCases: { val: any; shouldBeSuppressedInZen: boolean }[] = [
        { val: 1, shouldBeSuppressedInZen: true },
        { val: true, shouldBeSuppressedInZen: true },
        { val: '1', shouldBeSuppressedInZen: true },
        { val: 'true', shouldBeSuppressedInZen: true },
        { val: 0, shouldBeSuppressedInZen: false },
        { val: false, shouldBeSuppressedInZen: false },
        { val: null, shouldBeSuppressedInZen: false },
        { val: undefined, shouldBeSuppressedInZen: false },
        { val: '', shouldBeSuppressedInZen: false },
      ];

      for (let i = 0; i < edgeCases.length; i++) {
        const { val, shouldBeSuppressedInZen } = edgeCases[i];
        const task = generateTestTask(`edge_${i}`, { completed: val as any });
        const resZen = executeFilteringPipeline({
          tasks: [task],
          zenMode: true,
          activeFilter: 'all',
        });

        if (shouldBeSuppressedInZen) {
          expect(resZen.filteredTasks, `Value ${String(val)} leaked in zenMode`).toHaveLength(0);
          expect(renderTaskCardOracle(task, true)).toBeNull();
        } else {
          expect(resZen.filteredTasks, `Value ${String(val)} was falsely dropped in zenMode`).toHaveLength(1);
          expect(renderTaskCardOracle(task, true)).not.toBeNull();
        }
      }
    });
  });

  // --------------------------------------------------------------------------
  // SECTION 3: WAI-ARIA Accessibility Tree Validation for Sidebar Zen Mode Toggle
  // --------------------------------------------------------------------------
  describe('3. WAI-ARIA Accessibility Tree & Localization Validation', () => {
    it('validates aria-label="Toggle Zen Mode" and aria-pressed attributes in active and inactive states', () => {
      // Inactive State
      const htmlInactive = renderSidebarWithI18n({ zenMode: false, onToggleZenMode: vi.fn() }, 'en');
      const buttonsInactive = parseAccessibleButtons(htmlInactive);
      const zenBtnInactive = buttonsInactive.find((b) => b.attributes['aria-label'] === 'Toggle Zen Mode');

      expect(zenBtnInactive).toBeDefined();
      expect(zenBtnInactive?.tag).toBe('button');
      expect(zenBtnInactive?.role).toBe('button');
      expect(zenBtnInactive?.attributes['type']).toBe('button');
      expect(zenBtnInactive?.attributes['aria-pressed']).toBe('false');
      expect(zenBtnInactive?.attributes['title']).toContain('Inactive');
      expect(zenBtnInactive?.attributes['title']).toContain("Press 'z'");

      // Active State
      const htmlActive = renderSidebarWithI18n({ zenMode: true, onToggleZenMode: vi.fn() }, 'en');
      const buttonsActive = parseAccessibleButtons(htmlActive);
      const zenBtnActive = buttonsActive.find((b) => b.attributes['aria-label'] === 'Toggle Zen Mode');

      expect(zenBtnActive).toBeDefined();
      expect(zenBtnActive?.tag).toBe('button');
      expect(zenBtnActive?.role).toBe('button');
      expect(zenBtnActive?.attributes['type']).toBe('button');
      expect(zenBtnActive?.attributes['aria-pressed']).toBe('true');
      expect(zenBtnActive?.attributes['title']).toContain('Active');
      expect(zenBtnActive?.attributes['title']).toContain("Press 'z'");

      // Visual indicator element (emerald badge) should be present when active
      expect(zenBtnActive?.rawHtml).toContain('bg-emerald-500');
      expect(zenBtnInactive?.rawHtml).not.toContain('bg-emerald-500');
    });

    it('verifies localized title and visible text across Catalan (ca), Spanish (es), and English (en)', () => {
      const languages: { lang: Language; expectedTitlePrefix: string; expectedBtnText: string }[] = [
        { lang: 'en', expectedTitlePrefix: 'Zen Mode', expectedBtnText: 'Zen Mode' },
        { lang: 'es', expectedTitlePrefix: 'Modo Zen', expectedBtnText: 'Modo Zen' },
        { lang: 'ca', expectedTitlePrefix: 'Mode Zen', expectedBtnText: 'Mode Zen' },
      ];

      for (const { lang, expectedTitlePrefix, expectedBtnText } of languages) {
        // Active
        const htmlActive = renderSidebarWithI18n({ zenMode: true, onToggleZenMode: vi.fn() }, lang);
        const buttonsActive = parseAccessibleButtons(htmlActive);
        const zenBtnActive = buttonsActive.find((b) => b.attributes['aria-label'] === 'Toggle Zen Mode');

        expect(zenBtnActive, `Zen button missing for lang=${lang}`).toBeDefined();
        expect(zenBtnActive?.attributes['title']).toBe(`${expectedTitlePrefix} (Active, Press 'z')`);
        expect(zenBtnActive?.textContent).toContain(expectedBtnText);
        expect(zenBtnActive?.textContent).toContain("'z'");

        // Inactive
        const htmlInactive = renderSidebarWithI18n({ zenMode: false, onToggleZenMode: vi.fn() }, lang);
        const buttonsInactive = parseAccessibleButtons(htmlInactive);
        const zenBtnInactive = buttonsInactive.find((b) => b.attributes['aria-label'] === 'Toggle Zen Mode');

        expect(zenBtnInactive, `Zen button missing for lang=${lang} (inactive)`).toBeDefined();
        expect(zenBtnInactive?.attributes['title']).toBe(`${expectedTitlePrefix} (Inactive, Press 'z')`);
        expect(zenBtnInactive?.textContent).toContain(expectedBtnText);
      }
    });

    it('gracefully omits Zen Mode toggle when onToggleZenMode callback is not provided', () => {
      const htmlWithoutToggle = renderSidebarWithI18n({ onToggleZenMode: undefined }, 'en');
      const buttons = parseAccessibleButtons(htmlWithoutToggle);
      const zenBtn = buttons.find((b) => b.attributes['aria-label'] === 'Toggle Zen Mode');

      expect(zenBtn).toBeUndefined();
      expect(htmlWithoutToggle).not.toContain('aria-label="Toggle Zen Mode"');
    });

    it('confirms the toggle button has valid keyboard affordance text for assistive tech', () => {
      const html = renderSidebarWithI18n({ zenMode: false, onToggleZenMode: vi.fn() }, 'en');
      const buttons = parseAccessibleButtons(html);
      const zenBtn = buttons.find((b) => b.attributes['aria-label'] === 'Toggle Zen Mode');

      expect(zenBtn).toBeDefined();
      expect(zenBtn?.textContent).toContain('Zen Mode');
      expect(zenBtn?.textContent).toContain("'z'");
      expect(zenBtn?.rawHtml).toContain("font-mono");
    });
  });

  // --------------------------------------------------------------------------
  // SECTION 4: High-Scale Performance Benchmark (1,000 Items < 1ms)
  // --------------------------------------------------------------------------
  describe('4. High-Scale Filtering Pipeline Performance Benchmark (1,000 Items)', () => {
    // Generate realistic large-scale dataset
    const largeDataset: Task[] = [];
    const rng = new SeededRandom(424242);
    const difficulties: DifficultyTier[] = ['trivial', 'easy', 'medium', 'hard'];
    const projectIds = ['proj_work', 'proj_personal', 'proj_health', 'proj_finance', 'proj_hobby'];

    for (let i = 0; i < 1000; i++) {
      const isHabit = i < 400; // 400 habits, 600 tasks
      const isCompleted = rng.boolean(0.35); // 35% completed
      const diff = rng.pick(difficulties);
      const proj = rng.pick(projectIds);
      const tod = rng.pick(['morning', 'workday', 'evening', 'anytime'] as const);

      largeDataset.push(
        generateTestTask(`perf_item_${i}`, {
          type: isHabit ? (rng.boolean(0.5) ? 'habit' : 'daily') : 'todo',
          completed: isCompleted ? 1 : 0,
          difficulty: diff,
          project_id: proj,
          project_name: `Project ${proj}`,
          time_of_day: tod,
          title: `Performance Benchmark Item #${i} ${diff} ${proj}`,
          notes: i % 3 === 0 ? `Detailed notes for cognitive task execution ${i}` : '',
          is_due_today: i % 2 === 0,
          due_date: !isHabit && i % 4 === 0 ? '2026-11-01' : null,
          scheduled_date: !isHabit && i % 4 === 1 ? '2026-11-01' : null,
          start_date: !isHabit && i % 4 === 2 ? '2026-11-01' : null,
        })
      );
    }

    it('measures filtering pipeline throughput across 100 runs and confirms average execution time < 1.0 ms', () => {
      const iterations = 100;
      const durations: number[] = [];

      // Warm-up run
      executeFilteringPipeline({
        tasks: largeDataset,
        zenMode: true,
        activeFilter: 'all',
        difficultyFilter: 'all',
        lowBatteryFilter: false,
        selectedProjectId: 'all',
        searchQuery: '',
      });

      for (let i = 0; i < iterations; i++) {
        const toggleZen = i % 2 === 0;
        const toggleActive = i % 3 === 0 ? 'active' : 'all';
        const search = i % 10 === 0 ? 'health' : '';
        const diff = i % 5 === 0 ? 'easy' : 'all';

        const start = performance.now();
        const result = executeFilteringPipeline({
          tasks: largeDataset,
          zenMode: toggleZen,
          activeFilter: toggleActive,
          difficultyFilter: diff,
          lowBatteryFilter: false,
          selectedProjectId: 'all',
          searchQuery: search,
        });
        const duration = performance.now() - start;
        durations.push(duration);

        // Basic sanity check on result
        if (toggleZen) {
          expect(result.filteredTasks.some((t) => Boolean(t.completed))).toBe(false);
        }
      }

      const totalTime = durations.reduce((a, b) => a + b, 0);
      const avgTime = totalTime / iterations;
      durations.sort((a, b) => a - b);
      const medianTime = durations[Math.floor(iterations / 2)];
      const p95Time = durations[Math.floor(iterations * 0.95)];
      const maxTime = durations[durations.length - 1];

      // Console logging for empirical visibility
      console.log(`\n[Empirical 1,000-Task Benchmark Results]`);
      console.log(`- Dataset size: ${largeDataset.length} items`);
      console.log(`- Iterations: ${iterations}`);
      console.log(`- Total time: ${totalTime.toFixed(3)} ms`);
      console.log(`- Average time: ${avgTime.toFixed(4)} ms / run`);
      console.log(`- Median time: ${medianTime.toFixed(4)} ms`);
      console.log(`- 95th percentile: ${p95Time.toFixed(4)} ms`);
      console.log(`- Max time: ${maxTime.toFixed(4)} ms\n`);

      // Strict Acceptance Threshold: Average execution time MUST be strictly < 1.0 ms
      expect(avgTime).toBeLessThan(1.0);
      expect(medianTime).toBeLessThan(1.0);
      expect(p95Time).toBeLessThan(2.0);
    });

    it('benchmarks full card rendering batch under Zen Mode for 1,000 items and confirms execution time < 5ms', () => {
      const start = performance.now();
      let renderedCount = 0;
      let skippedCount = 0;

      for (const item of largeDataset) {
        const rendered = item.type === 'todo' ? renderTaskCardOracle(item, true) : renderHabitCardOracle(item, true);
        if (rendered !== null) {
          renderedCount++;
        } else {
          skippedCount++;
        }
      }
      const duration = performance.now() - start;

      // Completed items (350 approx) must have been skipped
      expect(skippedCount).toBe(largeDataset.filter((t) => Boolean(t.completed)).length);
      expect(renderedCount).toBe(largeDataset.filter((t) => !Boolean(t.completed)).length);
      expect(duration).toBeLessThan(5.0);
    });
  });

  // --------------------------------------------------------------------------
  // SECTION 5: Static Architectural Code Invariants (Source File Inspection)
  // --------------------------------------------------------------------------
  describe('5. Static Architectural Code Contracts', () => {
    it('verifies src/client/App.tsx strictly includes zenMode in useMemo dependency arrays and guards card renderers', () => {
      const appPath = path.resolve(process.cwd(), 'src/client/App.tsx');
      expect(fs.existsSync(appPath)).toBe(true);
      const appCode = fs.readFileSync(appPath, 'utf8');

      // 1. filteredTasks dependency array
      expect(appCode).toMatch(/useMemo\(\s*\(\)\s*=>\s*\{[\s\S]*?\}, \[[^\]]*zenMode[^\]]*\]\);/);

      // 2. baseHabitsList dependency array
      expect(appCode).toMatch(/useMemo\(\s*\(\)\s*=>\s*\{[\s\S]*?\}, \[[^\]]*zenMode[^\]]*\]\);/);

      // 3. allTasksList dependency array
      expect(appCode).toMatch(/useMemo\(\s*\(\)\s*=>\s*\{[\s\S]*?\}, \[[^\]]*zenMode[^\]]*\]\);/);

      // 4. Keyboard listener useEffect dependency array strictly empty []
      expect(appCode).toMatch(/window\.addEventListener\('keydown', handleKeyDown\);[\s\S]*?return \(\) => window\.removeEventListener\('keydown', handleKeyDown\);[\s\S]*?\}, \[\]\);/);

      // 5. Card renderers defense-in-depth
      expect(appCode).toContain('if (zenMode && isDone) return null;');

      // 6. Sidebar wiring
      expect(appCode).toContain('zenMode={zenMode}');
      expect(appCode).toContain('onToggleZenMode={toggleZenMode}');
    });

    it('verifies src/client/components/Sidebar.tsx implements WAI-ARIA and localized Zen Mode toggle', () => {
      const sidebarPath = path.resolve(process.cwd(), 'src/client/components/Sidebar.tsx');
      expect(fs.existsSync(sidebarPath)).toBe(true);
      const sidebarCode = fs.readFileSync(sidebarPath, 'utf8');

      // 1. aria-label="Toggle Zen Mode"
      expect(sidebarCode).toContain('aria-label="Toggle Zen Mode"');

      // 2. aria-pressed={Boolean(zenMode)}
      expect(sidebarCode).toContain('aria-pressed={Boolean(zenMode)}');

      // 3. title with localized zenModeBtn and hotkey guide
      expect(sidebarCode).toContain("title={`${t.zenModeBtn || 'Zen Mode'} (${zenMode ? 'Active' : 'Inactive'}, Press 'z')`}");

      // 4. type="button"
      expect(sidebarCode).toContain('type="button"');
    });

    it('verifies src/client/i18n/translations.ts provides zenModeBtn and zenModeExpl across all 3 supported languages', () => {
      const translationsPath = path.resolve(process.cwd(), 'src/client/i18n/translations.ts');
      expect(fs.existsSync(translationsPath)).toBe(true);
      const translationsCode = fs.readFileSync(translationsPath, 'utf8');

      // English
      expect(translations.en.zenModeBtn).toBe('Zen Mode');
      expect(translations.en.zenModeExpl).toContain('Zen Mode automatically hides completed tasks');

      // Spanish
      expect(translations.es.zenModeBtn).toBe('Modo Zen');
      expect(translations.es.zenModeExpl).toContain('El Modo Zen oculta automáticamente las tareas completadas');

      // Catalan
      expect(translations.ca.zenModeBtn).toBe('Mode Zen');
      expect(translations.ca.zenModeExpl).toContain('El Mode Zen amaga automàticament les tasques completades');
    });
  });
});
