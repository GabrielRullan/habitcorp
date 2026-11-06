import { describe, it, expect } from 'vitest';

describe('Cycle 13: Frictionless One-Tap Time-Shift & Reschedule (Compassionate Shift & Sweep)', () => {
  const getTomorrowStr = (baseDateStr: string): string => {
    const d = new Date(`${baseDateStr}T12:00:00Z`);
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  };

  it('correctly calculates tomorrow date without time zone drift', () => {
    const today = '2026-10-30';
    const tomorrow = getTomorrowStr(today);
    expect(tomorrow).toBe('2026-10-31');
  });

  it('defers individual task to tomorrow while safely clearing rigid agenda time slots', () => {
    const task = {
      id: 't_1',
      title: 'Finish client presentation',
      due_date: '2026-10-30',
      scheduled_date: '2026-10-30',
      scheduled_start: '14:00',
    };

    const tomorrow = getTomorrowStr(task.due_date);
    const deferredTask = {
      ...task,
      due_date: tomorrow,
      scheduled_date: null,
      scheduled_start: null,
    };

    expect(deferredTask.due_date).toBe('2026-10-31');
    expect(deferredTask.scheduled_date).toBeNull();
    expect(deferredTask.scheduled_start).toBeNull();
  });

  it('sweeps all incomplete today tasks in a batch to tomorrow without altering completed tasks', () => {
    const todayStr = '2026-10-30';
    const tomorrowStr = '2026-10-31';

    const tasks = [
      { id: '1', title: 'Medication', due_date: todayStr, completed: 1 },
      { id: '2', title: 'Deep Work Block', due_date: todayStr, scheduled_date: todayStr, scheduled_start: '10:00', completed: 0 },
      { id: '3', title: 'Check Emails', due_date: todayStr, completed: 0 },
      { id: '4', title: 'Future task', due_date: '2026-11-04', completed: 0 },
    ];

    const sweptTasks = tasks.map((t) => {
      if (!t.completed && (t.due_date === todayStr || t.scheduled_date === todayStr)) {
        return { ...t, due_date: tomorrowStr, scheduled_date: null, scheduled_start: null };
      }
      return t;
    });

    // Completed task remains untouched
    expect(sweptTasks[0].due_date).toBe(todayStr);
    expect(sweptTasks[0].completed).toBe(1);

    // Incomplete today tasks shifted to tomorrow
    expect(sweptTasks[1].due_date).toBe(tomorrowStr);
    expect(sweptTasks[1].scheduled_date).toBeNull();
    expect(sweptTasks[2].due_date).toBe(tomorrowStr);

    // Future task remains untouched
    expect(sweptTasks[3].due_date).toBe('2026-11-04');
  });
});
