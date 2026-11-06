import { describe, it, expect } from 'vitest';
import { Task } from '../src/client/types';

describe('FocusNowVision: Dynamic Routine Promotion & Starter Step', () => {
  it('promotes pending daily habits to Spotlight when no todos are pending', () => {
    const tasks: Task[] = [
      {
        id: 'h1',
        user_id: 'u1',
        title: 'Repassar Targes Xinès',
        notes: 'Anki 10 min',
        type: 'daily',
        completed: 0,
        streak: 3,
        difficulty: 'easy',
        counter_up: 0,
        counter_down: 0,
        micro_habit_title: 'Obrir Anki i fer 5 targetes',
        created_at: '2026-11-01T00:00:00Z',
        updated_at: '2026-11-01T00:00:00Z',
      },
    ];

    const uncompletedTodos = tasks.filter((t) => t.type === 'todo' && !t.completed);
    const uncompletedDailies = tasks.filter((t) => (t.type === 'daily' || t.type === 'habit'));
    const pendingDailies = uncompletedDailies.filter((d) => !d.completed);

    const activeTask =
      uncompletedTodos[0] ||
      pendingDailies[0] ||
      null;

    expect(activeTask).not.toBeNull();
    expect(activeTask?.title).toBe('Repassar Targes Xinès');
    expect(activeTask?.micro_habit_title).toBe('Obrir Anki i fer 5 targetes');
  });

  it('only signals clean slate when both todos and daily habits are finished', () => {
    const completedTasks: Task[] = [
      {
        id: 'h1',
        user_id: 'u1',
        title: 'Repassar Targes Xinès',
        notes: '',
        type: 'daily',
        completed: 1,
        streak: 4,
        difficulty: 'easy',
        counter_up: 0,
        counter_down: 0,
        created_at: '2026-11-01T00:00:00Z',
        updated_at: '2026-11-01T00:00:00Z',
      },
    ];

    const uncompletedTodos = completedTasks.filter((t) => t.type === 'todo' && !t.completed);
    const pendingDailies = completedTasks.filter((t) => (t.type === 'daily' || t.type === 'habit') && !t.completed);

    const activeTask = uncompletedTodos[0] || pendingDailies[0] || null;
    expect(activeTask).toBeNull();
  });
});
