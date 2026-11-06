import { describe, it, expect } from 'vitest';
import { getStreakStage, STREAK_STAGES, StreakGrowthStage } from '../src/client/components/StreakGrowthBadge';

export interface MilestoneProgress {
  currentStage: StreakGrowthStage;
  nextStage: StreakGrowthStage | null;
  daysRemaining: number;
  progressPercent: number;
}

export function getNextMilestoneInfo(streak: number): MilestoneProgress {
  const currentStage = getStreakStage(streak);
  const currentIndex = STREAK_STAGES.findIndex((s) => s.name === currentStage.name);

  if (currentIndex === -1 || currentIndex === STREAK_STAGES.length - 1) {
    return {
      currentStage,
      nextStage: null,
      daysRemaining: 0,
      progressPercent: 100,
    };
  }

  const nextStage = STREAK_STAGES[currentIndex + 1];
  const targetDays = nextStage.minStreak;
  const daysRemaining = Math.max(0, targetDays - streak);

  const stageSpan = targetDays - currentStage.minStreak;
  const progressInStage = streak - currentStage.minStreak;
  const progressPercent = stageSpan > 0 ? Math.min(100, Math.round((progressInStage / stageSpan) * 100)) : 100;

  return {
    currentStage,
    nextStage,
    daysRemaining,
    progressPercent,
  };
}

describe('Streak Growth Milestones & Identity Affirmation', () => {
  it('identifies 0 streak as Seed with 1 day to Sprout', () => {
    const info = getNextMilestoneInfo(0);
    expect(info.currentStage.name).toBe('Seed');
    expect(info.nextStage?.name).toBe('Sprout');
    expect(info.daysRemaining).toBe(1);
  });

  it('correctly calculates remaining days to next stage for mid-tier habit', () => {
    // Streak 5 is Seedling (min 4, next is Sapling at min 8)
    const info = getNextMilestoneInfo(5);
    expect(info.currentStage.name).toBe('Seedling');
    expect(info.nextStage?.name).toBe('Sapling');
    expect(info.daysRemaining).toBe(3); // 8 - 5
    expect(info.progressPercent).toBe(25); // (5 - 4) / (8 - 4) = 1/4 = 25%
  });

  it('handles maximum tier gracefully with 0 remaining days and 100% progress', () => {
    const info = getNextMilestoneInfo(65);
    expect(info.currentStage.name).toBe('Ancient Bloom');
    expect(info.nextStage).toBeNull();
    expect(info.daysRemaining).toBe(0);
    expect(info.progressPercent).toBe(100);
  });
});
