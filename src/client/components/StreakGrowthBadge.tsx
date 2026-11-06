import React from 'react';

export interface StreakGrowthStage {
  minStreak: number;
  maxStreak: number;
  emoji: string;
  name: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  description: string;
}

export const STREAK_STAGES: StreakGrowthStage[] = [
  {
    minStreak: 0,
    maxStreak: 0,
    emoji: '🌰',
    name: 'Seed',
    colorClass: 'text-stone-600 dark:text-stone-300',
    bgClass: 'bg-stone-100 dark:bg-stone-800',
    borderClass: 'border-stone-200 dark:border-stone-700',
    description: 'Seed planted. Complete today to sprout!',
  },
  {
    minStreak: 1,
    maxStreak: 3,
    emoji: '🌱',
    name: 'Sprout',
    colorClass: 'text-emerald-700 dark:text-emerald-300',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/60',
    borderClass: 'border-emerald-200 dark:border-emerald-800',
    description: 'First leaves emerging! Consistency takes root.',
  },
  {
    minStreak: 4,
    maxStreak: 7,
    emoji: '🌿',
    name: 'Seedling',
    colorClass: 'text-emerald-800 dark:text-emerald-200',
    bgClass: 'bg-emerald-100/70 dark:bg-emerald-900/60',
    borderClass: 'border-emerald-300 dark:border-emerald-700',
    description: 'Growing strong leaves. Habit momentum building.',
  },
  {
    minStreak: 8,
    maxStreak: 14,
    emoji: '🪴',
    name: 'Sapling',
    colorClass: 'text-teal-800 dark:text-teal-200',
    bgClass: 'bg-teal-50 dark:bg-teal-950/60',
    borderClass: 'border-teal-300 dark:border-teal-800',
    description: 'Healthy root system established. 1+ week of discipline.',
  },
  {
    minStreak: 15,
    maxStreak: 29,
    emoji: '🌳',
    name: 'Young Oak',
    colorClass: 'text-green-900 dark:text-green-200',
    bgClass: 'bg-green-100/80 dark:bg-green-950/60',
    borderClass: 'border-green-300 dark:border-green-800',
    description: 'Sturdy trunk and spreading canopy. Resilient habit.',
  },
  {
    minStreak: 30,
    maxStreak: 59,
    emoji: '🌲',
    name: 'Deep Pine',
    colorClass: 'text-emerald-950 dark:text-emerald-100',
    bgClass: 'bg-emerald-200/70 dark:bg-emerald-900/80',
    borderClass: 'border-emerald-400 dark:border-emerald-600',
    description: 'Deep-rooted evergreen. 30+ days of unbreakable focus.',
  },
  {
    minStreak: 60,
    maxStreak: Infinity,
    emoji: '🌸',
    name: 'Ancient Bloom',
    colorClass: 'text-rose-950 dark:text-rose-100',
    bgClass: 'bg-gradient-to-r from-emerald-100 to-rose-100 dark:from-emerald-950/80 dark:to-rose-950/80',
    borderClass: 'border-rose-300 dark:border-rose-800',
    description: 'Mastery in full blossom! 60+ days of unwavering cadence.',
  },
];

export function getStreakStage(streak: number): StreakGrowthStage {
  const normalized = Math.max(0, streak || 0);
  for (let i = STREAK_STAGES.length - 1; i >= 0; i--) {
    if (normalized >= STREAK_STAGES[i].minStreak) {
      return STREAK_STAGES[i];
    }
  }
  return STREAK_STAGES[0];
}

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

interface StreakGrowthBadgeProps {
  streak: number;
  bestStreak?: number;
  rollingConsistency?: number;
  inGracePeriod?: boolean;
  compact?: boolean;
  className?: string;
}

export const StreakGrowthBadge: React.FC<StreakGrowthBadgeProps> = ({
  streak,
  bestStreak,
  rollingConsistency,
  inGracePeriod = false,
  compact = false,
  className = '',
}) => {
  const stage = getStreakStage(streak);
  const milestone = getNextMilestoneInfo(streak);
  const bestText = bestStreak && bestStreak > streak ? ` (Best: ${bestStreak}d)` : '';
  const consistencyText =
    rollingConsistency !== undefined
      ? ` • ${Math.round(rollingConsistency)}% consistency`
      : '';
  const isZero = (streak || 0) === 0;
  const statusLabel = isZero ? 'Ready' : `${streak}d`;
  const graceShieldText = inGracePeriod
    ? ' 🛡️ Streak Shield Active (Complete today to keep momentum!)'
    : '';
  const nextStageText = milestone.nextStage
    ? ` • ${milestone.daysRemaining}d to ${milestone.nextStage.emoji} ${milestone.nextStage.name}`
    : ' • Max Level';
  const tooltipText = isZero
    ? `🌰 Fresh slate — every day is a new beginning (1d to 🌱 Sprout)${bestText}${consistencyText}`
    : `${stage.emoji} ${stage.name} (${streak}d cadence)${nextStageText}${graceShieldText} — ${stage.description}${bestText}${consistencyText}`;

  if (compact) {
    return (
      <span
        title={tooltipText}
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${stage.bgClass} ${stage.colorClass} ${stage.borderClass} ${className} select-none transition-transform hover:scale-105`}
      >
        <span>{stage.emoji}</span>
        <span>{statusLabel}</span>
        {inGracePeriod && (
          <span
            className="text-[9px] bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 px-1 py-0.2 rounded font-bold"
            title="Grace Day Active: Never Miss Twice"
          >
            🛡️ Shield
          </span>
        )}
        {rollingConsistency !== undefined && (
          <span className="text-[9px] opacity-75 hidden sm:inline">
            ({Math.round(rollingConsistency)}%)
          </span>
        )}
      </span>
    );
  }

  return (
    <div
      title={tooltipText}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border shadow-2xs ${stage.bgClass} ${stage.colorClass} ${stage.borderClass} ${className} select-none transition hover:shadow-xs`}
    >
      <span className="text-sm">{stage.emoji}</span>
      <span className="font-bold">{isZero ? 'Fresh Start' : `${streak}d`}</span>
      {inGracePeriod && (
        <span
          className="text-[10px] bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 px-1.5 py-0.2 rounded-full font-bold flex items-center gap-0.5"
          title="Streak Shield Active: Complete today to keep your streak going!"
        >
          <span>🛡️</span>
          <span>Shield</span>
        </span>
      )}
      <span className="text-[10px] opacity-75 font-normal tracking-tight hidden sm:inline">
        {isZero ? 'Ready to sprout' : stage.name}
      </span>
      {rollingConsistency !== undefined && (
        <span className="text-[10px] opacity-80 font-semibold px-1 py-0.2 rounded bg-white/50 border border-stone-200/50">
          {Math.round(rollingConsistency)}% consistency
        </span>
      )}
    </div>
  );
};

export default StreakGrowthBadge;
