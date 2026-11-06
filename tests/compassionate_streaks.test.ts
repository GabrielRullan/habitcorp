import { describe, it, expect } from 'vitest';
import { isTaskInGracePeriod, getStreakGraceMessage, daysBetween } from '../src/client/utils/streak';
import { getStreakStage } from '../src/client/components/StreakGrowthBadge';

describe('Behavioral Science: Compassionate Streak & Grace Day Tests', () => {
  it('correctly calculates days between dates without timezone drift', () => {
    expect(daysBetween('2026-10-28', '2026-10-30')).toBe(2);
    expect(daysBetween('2026-10-29', '2026-10-30')).toBe(1);
    expect(daysBetween('2026-10-30', '2026-10-30')).toBe(0);
  });

  it('detects when a daily task is protected by a 1-day grace period (Never Miss Twice)', () => {
    const today = '2026-10-30';

    // Completed yesterday (normal daily cadence) -> NOT in grace period
    const taskCompletedYesterday = {
      type: 'daily',
      streak: 5,
      completed: 0,
      last_completed_date: '2026-10-29',
    };
    expect(isTaskInGracePeriod(taskCompletedYesterday, today)).toBe(false);

    // Completed 2 days ago (missed yesterday, but streak preserved by 1-day grace) -> IN GRACE PERIOD
    const taskMissedYesterday = {
      type: 'daily',
      streak: 5,
      completed: 0,
      last_completed_date: '2026-10-28',
    };
    expect(isTaskInGracePeriod(taskMissedYesterday, today)).toBe(true);

    // Completed today -> NOT in grace period
    const taskCompletedToday = {
      type: 'daily',
      streak: 6,
      completed: 1,
      last_completed_date: '2026-10-30',
    };
    expect(isTaskInGracePeriod(taskCompletedToday, today)).toBe(false);

    // Zero streak or non-daily task -> NOT in grace period
    const zeroStreakTask = {
      type: 'daily',
      streak: 0,
      completed: 0,
      last_completed_date: '2026-10-28',
    };
    expect(isTaskInGracePeriod(zeroStreakTask, today)).toBe(false);
  });

  it('generates compassionate and shame-free streak messages', () => {
    const graceMsg = getStreakGraceMessage(7, true);
    expect(graceMsg).toContain('Streak Shield Active');
    expect(graceMsg).toContain('Never Miss Twice');
    expect(graceMsg).toContain('7d');

    const normalMsg = getStreakGraceMessage(7, false);
    expect(normalMsg).toContain('🔥 7d consistent streak');
  });

  it('maps streaks to organic growth stages (Seed -> Sprout -> Seedling -> Sapling -> Oak -> Pine -> Bloom)', () => {
    expect(getStreakStage(0).name).toBe('Seed');
    expect(getStreakStage(1).name).toBe('Sprout');
    expect(getStreakStage(5).name).toBe('Seedling');
    expect(getStreakStage(10).name).toBe('Sapling');
    expect(getStreakStage(20).name).toBe('Young Oak');
    expect(getStreakStage(45).name).toBe('Deep Pine');
    expect(getStreakStage(100).name).toBe('Ancient Bloom');
  });
});
