import { describe, it, expect } from 'vitest';
import { isTaskStale, getStaleTasks, getStaleTriageMessage } from '../src/client/utils/backlogTriage';
import { Task } from '../src/client/types';

describe('Compassionate Backlog Triage Utility', () => {
  const now = new Date('2026-10-30T10:00:00Z');

  const baseTask: Task = {
    id: 't1',
    user_id: 'u1',
    title: 'Random thought from last month',
    notes: '',
    type: 'todo',
    completed: 0,
    streak: 0,
    difficulty: 'trivial',
    counter_up: 0,
    counter_down: 0,
    created_at: '2026-10-15T10:00:00Z', // 15 days ago
    updated_at: '2026-10-15T10:00:00Z',
  };

  it('identifies uncompleted, unscheduled tasks older than 7 days as stale', () => {
    expect(isTaskStale(baseTask, 7, now)).toBe(true);
  });

  it('does NOT mark completed tasks as stale', () => {
    const completed = { ...baseTask, completed: 1 };
    expect(isTaskStale(completed, 7, now)).toBe(false);
  });

  it('does NOT mark scheduled tasks or tasks with due dates as stale', () => {
    const scheduled = { ...baseTask, scheduled_date: '2026-10-30' };
    const withDueDate = { ...baseTask, due_date: '2026-11-01' };
    expect(isTaskStale(scheduled, 7, now)).toBe(false);
    expect(isTaskStale(withDueDate, 7, now)).toBe(false);
  });

  it('does NOT mark recently created tasks (< 7 days) as stale', () => {
    const fresh = { ...baseTask, created_at: '2026-10-28T10:00:00Z' }; // 2 days ago
    expect(isTaskStale(fresh, 7, now)).toBe(false);
  });

  it('filters stale tasks from a mixed list', () => {
    const fresh = { ...baseTask, id: 't2', created_at: '2026-10-29T10:00:00Z' };
    const staleList = getStaleTasks([baseTask, fresh], 7, now);
    expect(staleList.length).toBe(1);
    expect(staleList[0].id).toBe('t1');
  });

  it('generates compassionate triage message with no guilt', () => {
    expect(getStaleTriageMessage(1)).toContain('rested into Someday');
    expect(getStaleTriageMessage(4)).toContain('4 stale tasks rested');
  });
});
