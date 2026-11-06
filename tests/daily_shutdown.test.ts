import { describe, it, expect } from 'vitest';
import { Task } from '../src/client/types';

export function partitionTodayTasks(tasks: Task[], todayStr: string) {
  const todayTasks = tasks.filter(
    (t) =>
      t.due_date?.slice(0, 10) === todayStr ||
      t.scheduled_date?.slice(0, 10) === todayStr ||
      t.is_due_today
  );

  const completed = todayTasks.filter((t) => Boolean(t.completed));
  const pending = todayTasks.filter((t) => !t.completed);

  return { completed, pending };
}

describe('Daily Shutdown & Evening Review Ritual', () => {
  const todayStr = '2026-10-30';

  const t1: Task = {
    id: 't1',
    user_id: 'u1',
    title: 'Write project report',
    notes: '',
    type: 'todo',
    completed: 1,
    streak: 0,
    difficulty: 'medium',
    counter_up: 0,
    counter_down: 0,
    due_date: todayStr,
    created_at: '2026-10-30T08:00:00Z',
    updated_at: '2026-10-30T08:00:00Z',
  };

  const t2: Task = {
    id: 't2',
    user_id: 'u1',
    title: 'Reply to client email',
    notes: '',
    type: 'todo',
    completed: 0,
    streak: 0,
    difficulty: 'trivial',
    counter_up: 0,
    counter_down: 0,
    due_date: todayStr,
    created_at: '2026-10-30T08:00:00Z',
    updated_at: '2026-10-30T08:00:00Z',
  };

  it('correctly partitions completed wins and pending today tasks', () => {
    const { completed, pending } = partitionTodayTasks([t1, t2], todayStr);
    expect(completed.length).toBe(1);
    expect(completed[0].id).toBe('t1');
    expect(pending.length).toBe(1);
    expect(pending[0].id).toBe('t2');
  });

  it('handles empty lists gracefully with zero errors', () => {
    const { completed, pending } = partitionTodayTasks([], todayStr);
    expect(completed.length).toBe(0);
    expect(pending.length).toBe(0);
  });
});
