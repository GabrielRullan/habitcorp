import { describe, it, expect } from 'vitest';
import { Task } from '../src/client/types';

/**
 * Simulates logging a floor habit (micro starter step)
 */
export function logFloorHabitCompletion(task: Task): { updatedTask: Task; message: string } {
  const isNowCompleted = task.type === 'habit' ? task.completed : 1;
  const newStreak = task.type === 'daily' ? task.streak + 1 : task.streak;
  const counterUp = task.type === 'habit' ? task.counter_up + 1 : task.counter_up;

  const updatedTask: Task = {
    ...task,
    completed: isNowCompleted,
    streak: newStreak,
    counter_up: counterUp,
  };

  const message = '🌱 Starter step logged! You maintained your habit momentum on a low-spoon day.';

  return { updatedTask, message };
}

describe('Elastic Habit Two-Tier Tracking (Floor Habit / Starter Step)', () => {
  it('increments streak on daily habit when starter step is logged', () => {
    const dailyHabit: Task = {
      id: 'h1',
      user_id: 'u1',
      title: 'Morning Yoga 20 min',
      notes: '',
      type: 'daily',
      frequency: 'daily',
      micro_habit_title: 'Unroll yoga mat',
      completed: 0,
      streak: 5,
      difficulty: 'medium',
      counter_up: 5,
      counter_down: 0,
      created_at: '2026-10-30T00:00:00Z',
      updated_at: '2026-10-30T00:00:00Z',
    };

    const { updatedTask, message } = logFloorHabitCompletion(dailyHabit);
    expect(updatedTask.completed).toBe(1);
    expect(updatedTask.streak).toBe(6);
    expect(message).toContain('Starter step logged');
  });

  it('increments counter_up on flexible habit when starter step is logged', () => {
    const flexHabit: Task = {
      id: 'h2',
      user_id: 'u1',
      title: 'Drink 2L Water',
      notes: '',
      type: 'habit',
      micro_habit_title: 'Drink 1 sip',
      completed: 0,
      streak: 0,
      difficulty: 'trivial',
      counter_up: 2,
      counter_down: 0,
      created_at: '2026-10-30T00:00:00Z',
      updated_at: '2026-10-30T00:00:00Z',
    };

    const { updatedTask } = logFloorHabitCompletion(flexHabit);
    expect(updatedTask.counter_up).toBe(3);
  });
});
