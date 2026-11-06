import { describe, it, expect } from 'vitest';
import { runClientRollover, isDailyDueOnDate, handleClientStorageRequest } from '../src/client/clientStore';
import { Task } from '../src/client/types';

describe('Client Storage Rollover & Habit Scheduling', () => {
  it('correctly determines whether a task is due on a given day', () => {
    // Weekly running habit scheduled for Tuesday (2) and Friday (5)
    const runningHabit: Partial<Task> = {
      frequency: 'weekly',
      repeat_days: [2, 5],
    };

    // 2026-11-06 is Friday (5)
    expect(isDailyDueOnDate(runningHabit, '2026-11-06')).toBe(true);

    // 2026-11-07 is Saturday (6)
    expect(isDailyDueOnDate(runningHabit, '2026-11-07')).toBe(false);

    // 2026-11-08 is Sunday (0)
    expect(isDailyDueOnDate(runningHabit, '2026-11-08')).toBe(false);
  });

  it('resets completed flag to 0 when date rolls over to a new day', () => {
    const mockDb: any = {
      users: [
        {
          id: 'user_1',
          username: 'gabriel',
          last_rollover_date: '2026-11-05',
        },
      ],
      tasks: [
        {
          id: 'habit_run',
          user_id: 'user_1',
          title: 'Correr',
          type: 'daily',
          frequency: 'weekly',
          repeat_days: [2, 5],
          completed: 1,
          streak: 10,
          last_completed_date: '2026-11-03', // Completed 3 days ago
        },
      ],
      projects: [],
      meetings: [],
      ghosts: [],
      calendars: [],
      subtasks: [],
      magicLinks: [],
    };

    // Run rollover for today: 2026-11-06 (Friday)
    const changed = runClientRollover(mockDb, 'user_1', '2026-11-06');
    expect(changed).toBe(true);

    const task = mockDb.tasks[0];
    // Completed status MUST reset to 0 for the fresh day!
    expect(task.completed).toBe(0);
    // User last rollover date is updated
    expect(mockDb.users[0].last_rollover_date).toBe('2026-11-06');
  });

  it('preserves completed status if the task was completed today', () => {
    const mockDb: any = {
      users: [
        {
          id: 'user_1',
          username: 'gabriel',
          last_rollover_date: '2026-11-05',
        },
      ],
      tasks: [
        {
          id: 'habit_run',
          user_id: 'user_1',
          title: 'Correr',
          type: 'daily',
          frequency: 'weekly',
          repeat_days: [2, 5],
          completed: 1,
          streak: 11,
          last_completed_date: '2026-11-06', // Completed today
        },
      ],
      projects: [],
      meetings: [],
      ghosts: [],
      calendars: [],
      subtasks: [],
      magicLinks: [],
    };

    runClientRollover(mockDb, 'user_1', '2026-11-06');
    const task = mockDb.tasks[0];
    expect(task.completed).toBe(1);
  });
});
