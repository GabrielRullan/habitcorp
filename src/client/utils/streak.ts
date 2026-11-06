/**
 * Behavioral Science Utilities for Habit & Streak Formation
 * Based on James Clear ("Atomic Habits" - Never miss twice rule)
 * and Cochran & Tesser (Resilient streak psychology vs what-the-hell effect).
 */

export function daysBetween(dateA: string, dateB: string): number {
  try {
    const a = new Date(`${dateA.slice(0, 10)}T00:00:00Z`).getTime();
    const b = new Date(`${dateB.slice(0, 10)}T00:00:00Z`).getTime();
    return Math.round((b - a) / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

/**
 * Checks whether a daily routine is currently protected by a 1-day compassionate grace period.
 * When a user misses a single day, the streak is NOT reset to 0; it enters a 1-day grace buffer.
 */
export function isTaskInGracePeriod(
  task: {
    type?: string;
    streak?: number;
    completed?: number | boolean;
    last_completed_date?: string | null;
  },
  todayDateStr?: string
): boolean {
  if (task.type !== 'daily' || !task.streak || task.streak <= 0 || task.completed) {
    return false;
  }
  if (!task.last_completed_date) return false;

  const today = todayDateStr || new Date().toISOString().slice(0, 10);
  const diff = daysBetween(task.last_completed_date, today);

  // If last completed exactly 2 days ago (missed yesterday), it's currently on its grace day
  return diff === 2;
}

/**
 * Generates empowering, shame-free streak copy adhering to Self-Determination Theory.
 */
export function getStreakGraceMessage(streak: number, inGracePeriod: boolean): string {
  if (inGracePeriod) {
    return `🛡️ Streak Shield Active: Missed yesterday, but your ${streak}d streak is protected. Complete today to keep momentum! (Never Miss Twice)`;
  }
  if (streak > 0) {
    return `🔥 ${streak}d consistent streak. Keep going!`;
  }
  return `🌱 Fresh start. Complete today to begin your streak!`;
}
