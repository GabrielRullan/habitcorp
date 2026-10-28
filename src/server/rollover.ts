import { getDb } from './db.js';

export function getTodayDateString(customDate?: string): string {
  if (customDate) return customDate;
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(`${dateA}T00:00:00Z`).getTime();
  const b = new Date(`${dateB}T00:00:00Z`).getTime();
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

export function isDailyDueOnDate(
  task: {
    frequency: string;
    repeat_interval: number;
    repeat_days: string;
    created_at: string;
  },
  dateStr: string
): boolean {
  const target = new Date(`${dateStr}T12:00:00Z`);
  const dayOfWeek = target.getUTCDay(); // 0 (Sun) - 6 (Sat)

  if (task.frequency === 'daily') {
    return true;
  }

  if (task.frequency === 'weekly') {
    try {
      const days: number[] = JSON.parse(task.repeat_days || '[0,1,2,3,4,5,6]');
      return days.includes(dayOfWeek);
    } catch {
      return true;
    }
  }

  if (task.frequency === 'every_n_days') {
    const interval = Math.max(1, task.repeat_interval || 1);
    const createdDate = task.created_at.slice(0, 10);
    const diff = daysBetween(createdDate, dateStr);
    return diff >= 0 && diff % interval === 0;
  }

  if (task.frequency === 'monthly') {
    const createdDay = Number(task.created_at.slice(8, 10)) || 1;
    const targetDay = Number(dateStr.slice(8, 10));
    return createdDay === targetDay;
  }

  return true;
}

/**
 * Lazily rolls over Periodical Dailies and Habit counters when a new calendar date is reached.
 * Zero RPG punishment — simply resets daily completion flags, updates streak consistency, and resets habit counters.
 */
export function runUserRollover(userId: string, currentDateStr?: string): void {
  const db = getDb();
  const today = getTodayDateString(currentDateStr);

  const user = db
    .prepare('SELECT id, last_rollover_date FROM users WHERE id = ?')
    .get(userId) as { id: string; last_rollover_date: string | null } | undefined;

  if (!user) return;
  if (user.last_rollover_date === today) return;

  const previousDate = user.last_rollover_date;

  // 1. Rollover Periodical Dailies
  const dailies = db
    .prepare(
      `SELECT id, frequency, repeat_interval, repeat_days, streak, best_streak, completed, last_completed_date, created_at
       FROM tasks WHERE user_id = ? AND type = 'daily'`
    )
    .all(userId) as Array<{
    id: string;
    frequency: string;
    repeat_interval: number;
    repeat_days: string;
    streak: number;
    best_streak: number;
    completed: number;
    last_completed_date: string | null;
    created_at: string;
  }>;

  const updateDailyStmt = db.prepare(
    `UPDATE tasks SET completed = ?, streak = ?, best_streak = ?, updated_at = ? WHERE id = ?`
  );
  const resetSubtasksStmt = db.prepare(`UPDATE subtasks SET completed = 0 WHERE task_id = ?`);

  for (const daily of dailies) {
    const completedToday = daily.last_completed_date === today;
    let newCompleted = completedToday ? 1 : 0;
    let newStreak = daily.streak;

    if (!completedToday && previousDate && previousDate < today) {
      // Check if it was due on any day between previousDate (inclusive) and today (exclusive)
      // and wasn't completed on that day
      const diff = Math.min(30, daysBetween(previousDate, today));
      let missedScheduledDay = false;
      for (let i = 0; i < diff; i++) {
        const d = new Date(`${previousDate}T12:00:00Z`);
        d.setUTCDate(d.getUTCDate() + i);
        const checkDate = d.toISOString().slice(0, 10);
        if (isDailyDueOnDate(daily, checkDate) && daily.last_completed_date !== checkDate) {
          missedScheduledDay = true;
          break;
        }
      }
      if (missedScheduledDay) {
        newStreak = 0;
      }
    }

    if (daily.completed !== newCompleted || daily.streak !== newStreak) {
      updateDailyStmt.run(
        newCompleted,
        newStreak,
        Math.max(daily.best_streak, newStreak),
        new Date().toISOString(),
        daily.id
      );
      if (newCompleted === 0) {
        resetSubtasksStmt.run(daily.id);
      }
    }
  }

  // 2. Rollover Habit Counters
  const habits = db
    .prepare(
      `SELECT id, habit_reset_period, last_habit_reset FROM tasks WHERE user_id = ? AND type = 'habit'`
    )
    .all(userId) as Array<{
    id: string;
    habit_reset_period: string;
    last_habit_reset: string | null;
  }>;

  const resetHabitStmt = db.prepare(
    `UPDATE tasks SET counter_up = 0, counter_down = 0, last_habit_reset = ?, updated_at = ? WHERE id = ?`
  );

  for (const habit of habits) {
    const lastReset = habit.last_habit_reset || previousDate || today;
    let shouldReset = false;

    if (habit.habit_reset_period === 'daily' && lastReset < today) {
      shouldReset = true;
    } else if (habit.habit_reset_period === 'weekly') {
      if (daysBetween(lastReset, today) >= 7) {
        shouldReset = true;
      }
    } else if (habit.habit_reset_period === 'monthly') {
      if (lastReset.slice(0, 7) !== today.slice(0, 7)) {
        shouldReset = true;
      }
    }

    if (shouldReset) {
      resetHabitStmt.run(today, new Date().toISOString(), habit.id);
    }
  }

  db.prepare('UPDATE users SET last_rollover_date = ? WHERE id = ?').run(today, userId);
}
