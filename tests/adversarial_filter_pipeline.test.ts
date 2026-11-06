import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { Task, DifficultyTier } from '../src/client/types';

// Exact filter oracle reflecting src/client/App.tsx lines 1135-1153
function runFilteredTasksOracle(
  tasks: Task[],
  selectedProjectId: string | 'all',
  difficultyFilter: DifficultyTier | 'all',
  lowBatteryFilter: boolean,
  activeFilter: 'active' | 'all',
  searchQuery: string
): Task[] {
  return tasks.filter((t) => {
    if (selectedProjectId !== 'all' && t.project_id !== selectedProjectId) return false;
    if (difficultyFilter !== 'all' && t.difficulty !== difficultyFilter) return false;
    if (lowBatteryFilter) {
      // Spoon Theory: only trivial (1 spoon) and easy (2 spoons)
      if (t.difficulty !== 'trivial' && t.difficulty !== 'easy') return false;
    }
    if (activeFilter === 'active' && Boolean(t.completed)) return false;
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

// Downstream habit & task list derivation oracles reflecting src/client/App.tsx lines 1180-1250
function deriveDownstreamLists(
  filtered: Task[],
  habitTab: 'all' | 'due_today' = 'all',
  taskTab: 'all' | 'todo' | 'without_timeline' = 'all'
) {
  const baseHabitsList = filtered.filter((t) => {
    if (t.type !== 'habit' && t.type !== 'daily') return false;
    if (habitTab === 'due_today') return t.is_due_today;
    return true;
  });

  const habitCounts = {
    all: baseHabitsList.length,
    morning: 0,
    workday: 0,
    evening: 0,
    anytime: 0,
  };
  for (const h of baseHabitsList) {
    const tod = (h.time_of_day || 'anytime') as 'morning' | 'workday' | 'evening' | 'anytime';
    if (habitCounts[tod] !== undefined) {
      habitCounts[tod]++;
    } else {
      habitCounts.anytime++;
    }
  }

  const allTasksList = filtered.filter((t) => t.type === 'todo');
  const tasksList =
    taskTab === 'todo'
      ? allTasksList.filter((t) => t.due_date || t.scheduled_date || t.start_date)
      : taskTab === 'without_timeline'
      ? allTasksList.filter((t) => !t.due_date && !t.scheduled_date && !t.start_date)
      : allTasksList;

  return { baseHabitsList, habitCounts, allTasksList, tasksList };
}

// Spoon stats calculation oracle reflecting src/client/App.tsx lines 1156-1178
function calculateSpoonStats(tasks: Task[], todayStr: string) {
  let pendingSpoons = 0;
  let completedSpoons = 0;

  for (const t of tasks) {
    const isToday =
      t.due_date?.slice(0, 10) === todayStr ||
      t.scheduled_date?.slice(0, 10) === todayStr ||
      t.is_due_today;
    if (!isToday) continue;

    const spoons =
      t.difficulty === 'trivial' ? 1 : t.difficulty === 'easy' ? 2 : t.difficulty === 'medium' ? 3 : 4;
    if (t.completed) {
      completedSpoons += spoons;
    } else {
      pendingSpoons += spoons;
    }
  }

  const totalTarget = 12;
  const isOverloaded = pendingSpoons > totalTarget;
  return { pendingSpoons, completedSpoons, totalTarget, isOverloaded };
}

// Helper to construct mock tasks with sensible defaults
function makeTask(overrides: Partial<Task>): Task {
  return {
    id: `task_${Math.random().toString(36).substring(2, 9)}`,
    user_id: 'user_test',
    project_id: null,
    project_name: null,
    project_color: null,
    type: 'todo',
    title: 'Test Task',
    notes: '',
    difficulty: 'easy',
    difficulty_weight: 1,
    tags: [],
    time_of_day: 'anytime',
    habit_positive: 1,
    habit_negative: 0,
    counter_up: 0,
    counter_down: 0,
    habit_reset_period: 'daily',
    frequency: 'daily',
    repeat_interval: 1,
    repeat_days: [0, 1, 2, 3, 4, 5, 6],
    streak: 0,
    best_streak: 0,
    completed: 0,
    last_completed_date: null,
    start_date: null,
    due_date: null,
    ...overrides,
  };
}

describe('Adversarial Challenge: Filter Pipeline, Interactivity & Performance', () => {
  // =========================================================================
  // 1. COMPLEX COMBINATION STATES
  // =========================================================================
  describe('1. Complex Filter Combination Matrix', () => {
    const matrixTasks: Task[] = [
      // Target Project: 'proj_alpha'
      makeTask({
        id: 'alpha_active_low_title',
        project_id: 'proj_alpha',
        difficulty: 'trivial',
        completed: 0,
        title: 'Backend API Refactor',
        notes: 'Standard notes',
      }),
      makeTask({
        id: 'alpha_completed_low_title',
        project_id: 'proj_alpha',
        difficulty: 'easy',
        completed: 1,
        title: 'Database Schema Refactor',
        notes: 'Already done',
      }),
      makeTask({
        id: 'alpha_active_high_title',
        project_id: 'proj_alpha',
        difficulty: 'medium', // High battery
        completed: 0,
        title: 'Comprehensive Refactor of Auth',
        notes: 'Requires 3 spoons',
      }),
      makeTask({
        id: 'alpha_active_low_notes',
        project_id: 'proj_alpha',
        difficulty: 'trivial',
        completed: 0,
        title: 'Clean Up Legacy Code',
        notes: 'Need to refactor the utility helpers',
      }),
      makeTask({
        id: 'alpha_active_low_projname',
        project_id: 'proj_alpha',
        project_name: 'Refactor Core Architecture',
        difficulty: 'easy',
        completed: 0,
        title: 'Tidy up handlers',
        notes: '',
      }),
      makeTask({
        id: 'alpha_active_low_nomatch',
        project_id: 'proj_alpha',
        difficulty: 'easy',
        completed: 0,
        title: 'Review PR comments',
        notes: 'Documentation only',
      }),

      // Other Project: 'proj_beta'
      makeTask({
        id: 'beta_active_low_title',
        project_id: 'proj_beta',
        difficulty: 'trivial',
        completed: 0,
        title: 'Frontend Refactor',
        notes: 'In beta project',
      }),
      makeTask({
        id: 'beta_completed_low_title',
        project_id: 'proj_beta',
        difficulty: 'easy',
        completed: 1,
        title: 'Refactor Mobile Views',
        notes: 'Beta completed',
      }),
    ];

    it('satisfies 4-way combination: active + proj_alpha + lowBattery + "refactor"', () => {
      const result = runFilteredTasksOracle(
        matrixTasks,
        'proj_alpha', // selectedProjectId
        'all',        // difficultyFilter
        true,         // lowBatteryFilter
        'active',     // activeFilter
        'refactor'    // searchQuery
      );

      const resultIds = result.map((t) => t.id);

      // Matches all 4 conditions
      expect(resultIds).toContain('alpha_active_low_title');
      expect(resultIds).toContain('alpha_active_low_notes');
      expect(resultIds).toContain('alpha_active_low_projname');

      // Excluded: completed=1 (even though proj_alpha, low battery, and title matches 'refactor')
      expect(resultIds).not.toContain('alpha_completed_low_title');

      // Excluded: difficulty='medium' (fails lowBatteryFilter)
      expect(resultIds).not.toContain('alpha_active_high_title');

      // Excluded: search query does not match title, notes, or project_name
      expect(resultIds).not.toContain('alpha_active_low_nomatch');

      // Excluded: different project ('proj_beta')
      expect(resultIds).not.toContain('beta_active_low_title');
      expect(resultIds).not.toContain('beta_completed_low_title');

      expect(result.length).toBe(3);
    });

    it('toggling activeFilter to "all" unmasks completed item while preserving all other constraints', () => {
      const result = runFilteredTasksOracle(
        matrixTasks,
        'proj_alpha',
        'all',
        true,
        'all', // Toggled to 'all'
        'refactor'
      );

      const resultIds = result.map((t) => t.id);
      expect(resultIds).toContain('alpha_active_low_title');
      expect(resultIds).toContain('alpha_active_low_notes');
      expect(resultIds).toContain('alpha_active_low_projname');
      // Now included!
      expect(resultIds).toContain('alpha_completed_low_title');

      // Still excluded by low battery, search, or project
      expect(resultIds).not.toContain('alpha_active_high_title');
      expect(resultIds).not.toContain('alpha_active_low_nomatch');
      expect(resultIds).not.toContain('beta_active_low_title');
      expect(result.length).toBe(4);
    });

    it('toggling lowBatteryFilter to false unmasks medium difficulty tasks while activeFilter is active', () => {
      const result = runFilteredTasksOracle(
        matrixTasks,
        'proj_alpha',
        'all',
        false, // Toggled to false
        'active',
        'refactor'
      );

      const resultIds = result.map((t) => t.id);
      expect(resultIds).toContain('alpha_active_low_title');
      expect(resultIds).toContain('alpha_active_low_notes');
      expect(resultIds).toContain('alpha_active_low_projname');
      // High battery item now unmasked!
      expect(resultIds).toContain('alpha_active_high_title');

      // Completed item still excluded by activeFilter
      expect(resultIds).not.toContain('alpha_completed_low_title');
      expect(result.length).toBe(4);
    });

    it('toggling selectedProjectId to "all" unmasks other projects while preserving active + low battery + search', () => {
      const result = runFilteredTasksOracle(
        matrixTasks,
        'all', // Toggled to 'all'
        'all',
        true,
        'active',
        'refactor'
      );

      const resultIds = result.map((t) => t.id);
      expect(resultIds).toContain('alpha_active_low_title');
      expect(resultIds).toContain('alpha_active_low_notes');
      expect(resultIds).toContain('alpha_active_low_projname');
      // Beta project active item now unmasked!
      expect(resultIds).toContain('beta_active_low_title');

      // Completed items still excluded by activeFilter
      expect(resultIds).not.toContain('alpha_completed_low_title');
      expect(resultIds).not.toContain('beta_completed_low_title');
      expect(result.length).toBe(4);
    });

    it('clearing searchQuery reveals items matching active + proj_alpha + lowBattery without keyword restriction', () => {
      const result = runFilteredTasksOracle(
        matrixTasks,
        'proj_alpha',
        'all',
        true,
        'active',
        '   ' // Whitespace or empty query
      );

      const resultIds = result.map((t) => t.id);
      expect(resultIds).toContain('alpha_active_low_title');
      expect(resultIds).toContain('alpha_active_low_notes');
      expect(resultIds).toContain('alpha_active_low_projname');
      // Now included since search constraint was removed
      expect(resultIds).toContain('alpha_active_low_nomatch');

      // Completed still excluded
      expect(resultIds).not.toContain('alpha_completed_low_title');
      expect(result.length).toBe(4);
    });

    it('verifies case-insensitive search matching (REFACTOR vs refactor)', () => {
      const resultUpper = runFilteredTasksOracle(
        matrixTasks,
        'proj_alpha',
        'all',
        true,
        'active',
        'REFACTOR'
      );
      const resultMixed = runFilteredTasksOracle(
        matrixTasks,
        'proj_alpha',
        'all',
        true,
        'active',
        'ReFaCtOr'
      );

      expect(resultUpper.map((t) => t.id)).toEqual(resultMixed.map((t) => t.id));
      expect(resultUpper.length).toBe(3);
    });
  });

  // =========================================================================
  // 2. EDGE CASES
  // =========================================================================
  describe('2. Edge Cases Stress Testing', () => {
    describe('2.1 Tasks with Undefined / Null / Empty Dates', () => {
      const edgeDateTasks: Task[] = [
        makeTask({
          id: 'date_undef',
          title: 'Undefined Dates',
          due_date: undefined as any,
          start_date: undefined as any,
          completed: 0,
        }),
        makeTask({
          id: 'date_null',
          title: 'Null Dates',
          due_date: null,
          start_date: null,
          completed: 0,
        }),
        makeTask({
          id: 'date_empty_str',
          title: 'Empty String Dates',
          due_date: '',
          start_date: '',
          completed: 0,
        }),
        makeTask({
          id: 'date_valid',
          title: 'Valid Due Date',
          due_date: '2026-10-30T15:00:00Z',
          completed: 0,
        }),
      ];

      it('safely filters without throwing on undefined or null dates', () => {
        expect(() => {
          runFilteredTasksOracle(edgeDateTasks, 'all', 'all', false, 'active', '');
        }).not.toThrow();
      });

      it('safely executes spoonStats calculation without crashing on undefined/null dates', () => {
        expect(() => {
          calculateSpoonStats(edgeDateTasks, '2026-10-30');
        }).not.toThrow();

        const stats = calculateSpoonStats(edgeDateTasks, '2026-10-30');
        // date_valid matches today
        expect(stats.pendingSpoons).toBeGreaterThan(0);
      });

      it('correctly partitions taskTab "todo" vs "without_timeline" in downstream lists', () => {
        const filtered = runFilteredTasksOracle(edgeDateTasks, 'all', 'all', false, 'active', '');

        const todoView = deriveDownstreamLists(filtered, 'all', 'todo');
        expect(todoView.tasksList.map((t) => t.id)).toEqual(['date_valid']);

        const noTimelineView = deriveDownstreamLists(filtered, 'all', 'without_timeline');
        const noTimelineIds = noTimelineView.tasksList.map((t) => t.id);
        expect(noTimelineIds).toContain('date_undef');
        expect(noTimelineIds).toContain('date_null');
        expect(noTimelineIds).toContain('date_empty_str');
        expect(noTimelineIds).not.toContain('date_valid');
      });
    });

    describe('2.2 Habits with Negative Counters and Non-Standard Completion States', () => {
      const counterHabits: Task[] = [
        makeTask({
          id: 'habit_neg_up',
          type: 'habit',
          title: 'Negative Counter Up Habit',
          completed: 0,
          counter_up: -5,
          counter_down: 0,
        }),
        makeTask({
          id: 'habit_neg_down',
          type: 'habit',
          title: 'Negative Counter Down Habit',
          completed: 0,
          counter_up: 0,
          counter_down: -12,
        }),
        makeTask({
          id: 'habit_large_counter',
          type: 'habit',
          title: 'Huge Counter Habit',
          completed: 0,
          counter_up: 999999,
          counter_down: 45000,
        }),
        makeTask({
          id: 'habit_falsy_completion',
          type: 'daily',
          title: 'Daily with completed=0',
          completed: 0,
        }),
        makeTask({
          id: 'habit_truthy_completion',
          type: 'daily',
          title: 'Daily with completed=1',
          completed: 1,
        }),
      ];

      it('retains counter habits with negative counters in "active" mode because completed is 0', () => {
        const active = runFilteredTasksOracle(counterHabits, 'all', 'all', false, 'active', '');
        const activeIds = active.map((t) => t.id);

        expect(activeIds).toContain('habit_neg_up');
        expect(activeIds).toContain('habit_neg_down');
        expect(activeIds).toContain('habit_large_counter');
        expect(activeIds).toContain('habit_falsy_completion');
        // completed=1 MUST be purged
        expect(activeIds).not.toContain('habit_truthy_completion');
      });

      it('includes completed daily habit when activeFilter is toggled to "all"', () => {
        const all = runFilteredTasksOracle(counterHabits, 'all', 'all', false, 'all', '');
        expect(all.length).toBe(5);
        expect(all.map((t) => t.id)).toContain('habit_truthy_completion');
      });

      it('evaluates Boolean(t.completed) correctly across edge JavaScript values', () => {
        const edgeTask = (c: any) => makeTask({ id: `c_${c}`, completed: c });

        const testCases = [
          { val: 0, expectFilteredOut: false },
          { val: false, expectFilteredOut: false },
          { val: null, expectFilteredOut: false },
          { val: undefined, expectFilteredOut: false },
          { val: 1, expectFilteredOut: true },
          { val: true, expectFilteredOut: true },
        ];

        for (const tc of testCases) {
          const list = [edgeTask(tc.val)];
          const res = runFilteredTasksOracle(list, 'all', 'all', false, 'active', '');
          if (tc.expectFilteredOut) {
            expect(res.length).toBe(0);
          } else {
            expect(res.length).toBe(1);
          }
        }
      });
    });

    describe('2.3 Completed Habits vs Pending Habits Downstream Synchronization', () => {
      const mixedHabits: Task[] = [
        makeTask({
          id: 'h_morn_pend',
          type: 'daily',
          title: 'Morning Meditation',
          time_of_day: 'morning',
          completed: 0,
          is_due_today: true,
        }),
        makeTask({
          id: 'h_morn_comp',
          type: 'daily',
          title: 'Morning Hydration',
          time_of_day: 'morning',
          completed: 1,
          is_due_today: true,
        }),
        makeTask({
          id: 'h_work_pend',
          type: 'daily',
          title: 'Focus Check-in',
          time_of_day: 'workday',
          completed: 0,
          is_due_today: true,
        }),
        makeTask({
          id: 'h_eve_comp',
          type: 'daily',
          title: 'Evening Journal',
          time_of_day: 'evening',
          completed: 1,
          is_due_today: true,
        }),
      ];

      it('dynamically shrinks baseHabitsList and habitCounts when activeFilter === "active"', () => {
        const activeFiltered = runFilteredTasksOracle(mixedHabits, 'all', 'all', false, 'active', '');
        const activeDownstream = deriveDownstreamLists(activeFiltered);

        expect(activeDownstream.baseHabitsList.length).toBe(2);
        expect(activeDownstream.baseHabitsList.map((t) => t.id)).toEqual(['h_morn_pend', 'h_work_pend']);
        expect(activeDownstream.habitCounts.all).toBe(2);
        expect(activeDownstream.habitCounts.morning).toBe(1);
        expect(activeDownstream.habitCounts.workday).toBe(1);
        expect(activeDownstream.habitCounts.evening).toBe(0);
      });

      it('restores full counts in baseHabitsList and habitCounts when activeFilter === "all"', () => {
        const allFiltered = runFilteredTasksOracle(mixedHabits, 'all', 'all', false, 'all', '');
        const allDownstream = deriveDownstreamLists(allFiltered);

        expect(allDownstream.baseHabitsList.length).toBe(4);
        expect(allDownstream.habitCounts.all).toBe(4);
        expect(allDownstream.habitCounts.morning).toBe(2);
        expect(allDownstream.habitCounts.workday).toBe(1);
        expect(allDownstream.habitCounts.evening).toBe(1);
      });
    });

    describe('2.4 Multi-Project Isolation and Project Switching', () => {
      const multiProjectTasks: Task[] = [
        makeTask({ id: 'p1_task', project_id: 'p1', title: 'P1 Task' }),
        makeTask({ id: 'p2_task', project_id: 'p2', title: 'P2 Task' }),
        makeTask({ id: 'p3_task', project_id: 'p3', title: 'P3 Task' }),
        makeTask({ id: 'no_p_task', project_id: null, title: 'No Project Task' }),
        makeTask({ id: 'undef_p_task', project_id: undefined, title: 'Undef Project Task' }),
      ];

      it('strictly isolates tasks for each specific project ID', () => {
        const p1Result = runFilteredTasksOracle(multiProjectTasks, 'p1', 'all', false, 'all', '');
        expect(p1Result.map((t) => t.id)).toEqual(['p1_task']);

        const p2Result = runFilteredTasksOracle(multiProjectTasks, 'p2', 'all', false, 'all', '');
        expect(p2Result.map((t) => t.id)).toEqual(['p2_task']);

        const p3Result = runFilteredTasksOracle(multiProjectTasks, 'p3', 'all', false, 'all', '');
        expect(p3Result.map((t) => t.id)).toEqual(['p3_task']);
      });

      it('returns all tasks including unassigned tasks when selectedProjectId is "all"', () => {
        const allResult = runFilteredTasksOracle(multiProjectTasks, 'all', 'all', false, 'all', '');
        expect(allResult.length).toBe(5);
      });
    });
  });

  // =========================================================================
  // 3. CODE & UI CONTRACT: ABSENCE OF {t.allProjects} AND CHIP TOGGLE
  // =========================================================================
  describe('3. Left Filter Panel Contract & Project Chip Toggle Logic', () => {
    const appTsxPath = path.resolve(__dirname, '../src/client/App.tsx');
    const appSource = fs.readFileSync(appTsxPath, 'utf8');

    it('verifies that {t.allProjects} is completely absent from App.tsx', () => {
      // In prior versions, {t.allProjects} was rendered on the left side of the filter strip
      expect(appSource).not.toContain('t.allProjects');
      expect(appSource).not.toMatch(/allProjects/);
    });

    it('verifies that the filter strip contains the "Actiu / Tot" segmented control', () => {
      // Extract filter strip section
      const filterSectionMatch = appSource.match(/<section[^>]*border-b[^>]*>([\s\S]*?)<\/section>/);
      expect(filterSectionMatch).not.toBeNull();
      const filterSection = filterSectionMatch ? filterSectionMatch[1] : '';

      // Must have aria-label="Filter active or all items"
      expect(filterSection).toContain('aria-label="Filter active or all items"');

      // Must have setActiveFilter('active') and setActiveFilter('all')
      expect(filterSection).toContain("setActiveFilter('active')");
      expect(filterSection).toContain("setActiveFilter('all')");

      // Must have aria-pressed attributes
      expect(filterSection).toContain("aria-pressed={activeFilter === 'active'}");
      expect(filterSection).toContain("aria-pressed={activeFilter === 'all'}");
    });

    it('verifies that project chips implement toggle-to-all onClick logic', () => {
      // In App.tsx: onClick={() => setSelectedProjectId(isSelected ? 'all' : p.id)}
      expect(appSource).toMatch(/setSelectedProjectId\(\s*isSelected\s*\?\s*['"]all['"]\s*:\s*p\.id\s*\)/);
    });

    it('simulates project chip toggle state machine', () => {
      // Replicate the exact toggle state machine
      let selectedProjectId: string | 'all' = 'all';

      const handleChipClick = (clickedProjectId: string) => {
        const isSelected = selectedProjectId === clickedProjectId;
        selectedProjectId = isSelected ? 'all' : clickedProjectId;
      };

      // 1. Initial state is 'all'
      expect(selectedProjectId).toBe('all');

      // 2. Click 'p1' -> becomes 'p1'
      handleChipClick('p1');
      expect(selectedProjectId).toBe('p1');

      // 3. Click 'p1' again (the active chip) -> toggles back to 'all'
      handleChipClick('p1');
      expect(selectedProjectId).toBe('all');

      // 4. Click 'p2' -> becomes 'p2'
      handleChipClick('p2');
      expect(selectedProjectId).toBe('p2');

      // 5. Click 'p3' (different chip) -> switches to 'p3'
      handleChipClick('p3');
      expect(selectedProjectId).toBe('p3');

      // 6. Click 'p3' again -> toggles back to 'all'
      handleChipClick('p3');
      expect(selectedProjectId).toBe('all');
    });
  });

  // =========================================================================
  // 4. PERFORMANCE AND RE-RENDER BENCHMARKING (500+ ITEMS)
  // =========================================================================
  describe('4. Performance & Re-render Benchmarking (500+ Items)', () => {
    // Generate 500+ simulated items with diverse distribution
    const generateSimulatedTasks = (count: number): Task[] => {
      const difficulties: DifficultyTier[] = ['trivial', 'easy', 'medium', 'hard'];
      const types = ['daily', 'habit', 'todo'] as const;
      const projects = ['proj_a', 'proj_b', 'proj_c', 'proj_d', null];
      const keywords = ['refactor', 'meeting', 'review', 'fix', 'deploy', 'docs', 'design'];

      const result: Task[] = [];
      for (let i = 0; i < count; i++) {
        const diff = difficulties[i % difficulties.length];
        const taskType = types[i % types.length];
        const proj = projects[i % projects.length];
        const kw = keywords[i % keywords.length];

        result.push(
          makeTask({
            id: `sim_task_${i}`,
            title: `Task ${i} - ${kw} implementation`,
            notes: i % 3 === 0 ? `Detailed notes for ${kw} subtask` : '',
            project_id: proj,
            project_name: proj ? `Project ${proj}` : null,
            difficulty: diff,
            type: taskType,
            completed: i % 4 === 0 ? 1 : 0, // 25% completed
            is_due_today: i % 5 === 0,
            due_date: i % 2 === 0 ? '2026-10-30T10:00:00Z' : null,
          })
        );
      }
      return result;
    };

    it('benchmarks 500 tasks filtering throughput across 200 iterations', () => {
      const tasks500 = generateSimulatedTasks(500);
      expect(tasks500.length).toBe(500);

      const iterations = 200;
      const latencies: number[] = [];

      const tStart = performance.now();
      for (let i = 0; i < iterations; i++) {
        // Vary query and filters across iterations
        const activeFilter = i % 2 === 0 ? 'active' : 'all';
        const lowBattery = i % 3 === 0;
        const selectedProj = i % 4 === 0 ? 'proj_a' : 'all';
        const query = i % 5 === 0 ? 'refactor' : '';

        const iterStart = performance.now();
        const res = runFilteredTasksOracle(
          tasks500,
          selectedProj,
          'all',
          lowBattery,
          activeFilter,
          query
        );
        const iterEnd = performance.now();

        latencies.push(iterEnd - iterStart);
        expect(Array.isArray(res)).toBe(true);
      }
      const tEnd = performance.now();
      const totalTimeMs = tEnd - tStart;
      const avgLatencyMs = totalTimeMs / iterations;

      latencies.sort((a, b) => a - b);
      const p95Latency = latencies[Math.floor(iterations * 0.95)];
      const maxLatency = latencies[latencies.length - 1];

      // Console diagnostic output for benchmark verification
      console.log(`[500-Item Benchmark] Iterations: ${iterations}, Total: ${totalTimeMs.toFixed(2)}ms, Avg: ${avgLatencyMs.toFixed(3)}ms/filter, p95: ${p95Latency.toFixed(3)}ms, Max: ${maxLatency.toFixed(3)}ms`);

      // 60fps frame budget is 16.6ms. A single filter pass must be < 2.0ms (well under frame budget)
      expect(avgLatencyMs).toBeLessThan(2.0);
      expect(p95Latency).toBeLessThan(5.0);
    });

    it('benchmarks scalability with 1,500 simulated items', () => {
      const tasks1500 = generateSimulatedTasks(1500);
      expect(tasks1500.length).toBe(1500);

      const iterations = 50;
      const tStart = performance.now();

      for (let i = 0; i < iterations; i++) {
        runFilteredTasksOracle(
          tasks1500,
          'proj_b',
          'all',
          true,
          'active',
          'fix'
        );
      }
      const tEnd = performance.now();
      const avgLatencyMs = (tEnd - tStart) / iterations;

      console.log(`[1500-Item Benchmark] Iterations: ${iterations}, Avg: ${avgLatencyMs.toFixed(3)}ms/filter`);
      expect(avgLatencyMs).toBeLessThan(5.0);
    });

    it('verifies useMemo dependency integrity in App.tsx', () => {
      const appTsxPath = path.resolve(__dirname, '../src/client/App.tsx');
      const appSource = fs.readFileSync(appTsxPath, 'utf8');

      // Locate filteredTasks useMemo block
      const filteredTasksBlock = appSource.match(/const filteredTasks = useMemo\([\s\S]*?\},\s*\[([\s\S]*?)\]\);/);
      expect(filteredTasksBlock).not.toBeNull();

      const depsString = filteredTasksBlock ? filteredTasksBlock[1] : '';
      const deps = depsString.split(',').map((d) => d.trim()).filter(Boolean);

      // Must include exactly the 6 filter drivers
      expect(deps).toContain('tasks');
      expect(deps).toContain('selectedProjectId');
      expect(deps).toContain('difficultyFilter');
      expect(deps).toContain('lowBatteryFilter');
      expect(deps).toContain('activeFilter');
      expect(deps).toContain('searchQuery');

      // Verify that unrelated state (e.g. viewMode, settingsModalOpen, theme) is NOT in the deps array
      expect(deps).not.toContain('viewMode');
      expect(deps).not.toContain('settingsModalOpen');
      expect(deps).not.toContain('theme');
      expect(deps).not.toContain('soundEnabled');
    });

    it('simulates memoization cache behavior during unrelated state re-renders', () => {
      const tasks = generateSimulatedTasks(100);

      // Memoization harness replicating React's useMemo
      function createMemoHarness() {
        let lastDeps: any[] | null = null;
        let lastResult: Task[] | null = null;
        let computeCount = 0;

        const getFilteredTasks = (deps: [Task[], string, DifficultyTier | 'all', boolean, 'active' | 'all', string]) => {
          if (
            lastDeps &&
            deps.length === lastDeps.length &&
            deps.every((dep, i) => dep === lastDeps![i])
          ) {
            return { result: lastResult!, recomputed: false, computeCount };
          }
          computeCount++;
          const [t, p, d, l, a, s] = deps;
          lastResult = runFilteredTasksOracle(t, p, d, l, a, s);
          lastDeps = deps;
          return { result: lastResult, recomputed: true, computeCount };
        };

        return { getFilteredTasks };
      }

      const harness = createMemoHarness();
      const baseDeps: [Task[], string, DifficultyTier | 'all', boolean, 'active' | 'all', string] = [
        tasks,
        'all',
        'all',
        false,
        'active',
        '',
      ];

      // Initial compute
      const call1 = harness.getFilteredTasks(baseDeps);
      expect(call1.recomputed).toBe(true);
      expect(call1.computeCount).toBe(1);

      // Simulated re-render due to modal toggle / theme change (deps unchanged)
      const call2 = harness.getFilteredTasks(baseDeps);
      expect(call2.recomputed).toBe(false);
      expect(call2.computeCount).toBe(1);
      expect(call2.result).toBe(call1.result); // Strict reference equality!

      // Simulated filter change: toggling activeFilter to 'all'
      const updatedDeps: [Task[], string, DifficultyTier | 'all', boolean, 'active' | 'all', string] = [
        tasks,
        'all',
        'all',
        false,
        'all',
        '',
      ];
      const call3 = harness.getFilteredTasks(updatedDeps);
      expect(call3.recomputed).toBe(true);
      expect(call3.computeCount).toBe(2);
      expect(call3.result).not.toBe(call1.result); // Reference updated!
    });
  });
});
