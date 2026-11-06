import { describe, it, expect } from 'vitest';

describe('Cycle 11: Time-Blindness & Hyperfocus Burnout Prevention — Daily Spoon Budget Gauge', () => {
  const calculateSpoons = (tasks: any[], todayStr: string) => {
    let pendingSpoons = 0;
    let completedSpoons = 0;

    for (const t of tasks) {
      const isToday =
        t.due_date?.slice(0, 10) === todayStr ||
        t.scheduled_date?.slice(0, 10) === todayStr ||
        t.is_due_today;
      if (!isToday) continue;

      const spoons =
        t.difficulty === 'trivial'
          ? 1
          : t.difficulty === 'easy'
          ? 2
          : t.difficulty === 'medium'
          ? 3
          : 4;

      if (t.completed) {
        completedSpoons += spoons;
      } else {
        pendingSpoons += spoons;
      }
    }

    const totalTarget = 12;
    const isOverloaded = pendingSpoons > totalTarget;
    return { pendingSpoons, completedSpoons, totalTarget, isOverloaded };
  };

  const todayStr = '2026-10-30';

  it('calculates pending and completed spoons correctly for today tasks', () => {
    const tasks = [
      { id: '1', title: 'Medication', due_date: todayStr, difficulty: 'trivial', completed: 1 }, // 1 spoon done
      { id: '2', title: 'Code review', due_date: todayStr, difficulty: 'medium', completed: 0 }, // 3 spoons pending
      { id: '3', title: 'Write specs', scheduled_date: todayStr, difficulty: 'hard', completed: 0 }, // 4 spoons pending
      { id: '4', title: 'Next week task', due_date: '2026-11-05', difficulty: 'hard', completed: 0 }, // not today
    ];

    const stats = calculateSpoons(tasks, todayStr);
    expect(stats.completedSpoons).toBe(1);
    expect(stats.pendingSpoons).toBe(7); // 3 + 4
    expect(stats.isOverloaded).toBe(false);
  });

  it('detects executive function overload when pending spoons exceed healthy threshold (> 12)', () => {
    const overloadedTasks = [
      { id: '1', due_date: todayStr, difficulty: 'hard', completed: 0 }, // 4
      { id: '2', due_date: todayStr, difficulty: 'hard', completed: 0 }, // 4
      { id: '3', due_date: todayStr, difficulty: 'hard', completed: 0 }, // 4
      { id: '4', due_date: todayStr, difficulty: 'medium', completed: 0 }, // 3 -> Total 15 spoons!
    ];

    const stats = calculateSpoons(overloadedTasks, todayStr);
    expect(stats.pendingSpoons).toBe(15);
    expect(stats.isOverloaded).toBe(true);
  });
});
