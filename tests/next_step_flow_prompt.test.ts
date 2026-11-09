import { describe, it, expect } from 'vitest';
import { getNextFlowTask, isTaskEligibleToday } from '../src/client/utils/flowPrompt';
import { Task } from '../src/client/types';

describe('Next Step Flow Prompt Utility', () => {
  const baseTask: Task = {
    id: 't1',
    user_id: 'u1',
    title: 'Morning Coffee',
    notes: '',
    type: 'habit',
    completed: 0,
    streak: 5,
    difficulty: 'trivial',
    counter_up: 1,
    counter_down: 0,
    created_at: '2026-10-30T08:00:00Z',
    updated_at: '2026-10-30T08:00:00Z',
  };

  it('prioritizes directly stacked habit (anchor_task_id)', () => {
    const stackedHabit: Task = {
      ...baseTask,
      id: 't2',
      title: '5 Minutes Meditation',
      anchor_task_id: 't1',
      completed: 0,
    };
    const otherTask: Task = {
      ...baseTask,
      id: 't3',
      title: 'Check Email',
      type: 'todo',
      completed: 0,
    };

    const next = getNextFlowTask(baseTask, [baseTask, otherTask, stackedHabit]);
    expect(next).not.toBeNull();
    expect(next?.id).toBe('t2');
    expect(next?.title).toBe('5 Minutes Meditation');
  });

  it('prioritizes stacked habit matched by title (anchor_habit_title)', () => {
    const stackedHabit: Task = {
      ...baseTask,
      id: 't2',
      title: 'Drink Glass of Water',
      anchor_habit_title: 'morning coffee',
      completed: 0,
    };
    const randomTodo: Task = {
      ...baseTask,
      id: 't4',
      title: 'Pay electric bill',
      type: 'todo',
      completed: 0,
    };

    const next = getNextFlowTask(baseTask, [baseTask, randomTodo, stackedHabit]);
    expect(next?.id).toBe('t2');
  });

  it('falls back to same-day scheduled task if no anchor exists', () => {
    const completedTodo: Task = {
      ...baseTask,
      id: 'todo1',
      title: 'Standup Meeting',
      type: 'todo',
      scheduled_date: '2026-10-30',
      completed: 0,
    };

    const nextScheduled: Task = {
      ...baseTask,
      id: 'todo2',
      title: 'Review PR',
      type: 'todo',
      scheduled_date: '2026-10-30',
      completed: 0,
    };

    const laterTodo: Task = {
      ...baseTask,
      id: 'todo3',
      title: 'Future Task',
      type: 'todo',
      scheduled_date: '2026-11-05',
      completed: 0,
    };

    const next = getNextFlowTask(completedTodo, [completedTodo, laterTodo, nextScheduled]);
    expect(next?.id).toBe('todo2');
  });

  it('returns null if no pending tasks remain', () => {
    const completed = { ...baseTask, completed: 1 };
    const next = getNextFlowTask(completed, [completed]);
    expect(next).toBeNull();
  });

  it('never offers a weekday-specific routine (e.g. Correr on Tue/Fri) as pending on a non-due day (Monday)', () => {
    const mondayStr = '2026-11-09'; // Monday (dayOfWeek = 1)
    const correrRoutine: Task = {
      ...baseTask,
      id: 'routine_correr',
      title: 'Correr',
      type: 'daily',
      frequency: 'weekly',
      repeat_days: [2, 5], // Tuesday (2) and Friday (5)
      is_due_today: false,
      completed: 0,
    };

    expect(isTaskEligibleToday(correrRoutine, mondayStr)).toBe(false);
    expect(getNextFlowTask(baseTask, [baseTask, correrRoutine], mondayStr)).toBeNull();

    // On Tuesday (2026-11-10), it IS due and eligible
    const tuesdayRoutine: Task = {
      ...correrRoutine,
      is_due_today: true,
    };
    expect(isTaskEligibleToday(tuesdayRoutine, '2026-11-10')).toBe(true);
    expect(getNextFlowTask(baseTask, [baseTask, tuesdayRoutine], '2026-11-10')?.id).toBe('routine_correr');
  });
});
