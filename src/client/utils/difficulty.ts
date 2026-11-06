import { DifficultyTier } from '../types';

export interface DifficultyConfig {
  id: DifficultyTier;
  sizeLabel: 'XS' | 'S' | 'M' | 'L';
  label: string;
  spoons: number;
  spoonDisplay: string;
  hint: string;
  durationHint: string;
  // Modal selection styles
  selectedClass: string;
  unselectedClass: string;
  // Badge pill styles (for cards and lists)
  badgeClass: string;
  agendaClass: string;
}

export const DIFFICULTY_CONFIGS: Record<DifficultyTier, DifficultyConfig> = {
  trivial: {
    id: 'trivial',
    sizeLabel: 'XS',
    label: 'Extra Small',
    spoons: 1,
    spoonDisplay: 'XS',
    hint: 'Quick win / Frictionless',
    durationHint: '5–15m',
    selectedClass: 'bg-sky-100 dark:bg-sky-950/80 text-sky-900 dark:text-sky-200 border-sky-400 dark:border-sky-500 ring-2 ring-sky-200 dark:ring-sky-800 shadow-xs font-bold',
    unselectedClass: 'bg-sky-50/30 dark:bg-stone-900/40 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-sky-300 dark:hover:border-sky-600 hover:bg-sky-50/60 dark:hover:bg-sky-950/30',
    badgeClass: 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800',
    agendaClass: 'bg-sky-50/80 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800/80 text-sky-900 dark:text-sky-200 border-l-[3px] border-l-sky-400 dark:border-l-sky-400 shadow-2xs',
  },
  easy: {
    id: 'easy',
    sizeLabel: 'S',
    label: 'Small',
    spoons: 2,
    spoonDisplay: 'S',
    hint: 'Light effort / Routine flow',
    durationHint: '15–30m',
    selectedClass: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 border-emerald-400 dark:border-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-800 shadow-xs font-bold',
    unselectedClass: 'bg-emerald-50/30 dark:bg-stone-900/40 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30',
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
    agendaClass: 'bg-emerald-50/80 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200 border-l-[3px] border-l-emerald-400 dark:border-l-emerald-400 shadow-2xs',
  },
  medium: {
    id: 'medium',
    sizeLabel: 'M',
    label: 'Medium',
    spoons: 3,
    spoonDisplay: 'M',
    hint: 'Moderate effort / Focused work',
    durationHint: '30–60m',
    selectedClass: 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border-amber-400 dark:border-amber-500 ring-2 ring-amber-200 dark:ring-amber-800 shadow-xs font-bold',
    unselectedClass: 'bg-amber-50/30 dark:bg-stone-900/40 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-amber-300 dark:hover:border-amber-600 hover:bg-amber-50/60 dark:hover:bg-amber-950/30',
    badgeClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
    agendaClass: 'bg-amber-50/80 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 border-l-[3px] border-l-amber-400 dark:border-l-amber-400 shadow-2xs',
  },
  hard: {
    id: 'hard',
    sizeLabel: 'L',
    label: 'Large',
    spoons: 4,
    spoonDisplay: 'L',
    hint: 'Deep focus / High effort',
    durationHint: '60m+',
    selectedClass: 'bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-200 border-rose-400 dark:border-rose-500 ring-2 ring-rose-200 dark:ring-rose-800 shadow-xs font-bold',
    unselectedClass: 'bg-rose-50/30 dark:bg-stone-900/40 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-rose-300 dark:hover:border-rose-600 hover:bg-rose-50/60 dark:hover:bg-rose-950/30',
    badgeClass: 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
    agendaClass: 'bg-rose-50/80 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800/80 text-rose-900 dark:text-rose-200 border-l-[3px] border-l-rose-400 dark:border-l-rose-400 shadow-2xs',
  },
};

export const DIFFICULTY_LIST: DifficultyConfig[] = [
  DIFFICULTY_CONFIGS.trivial,
  DIFFICULTY_CONFIGS.easy,
  DIFFICULTY_CONFIGS.medium,
  DIFFICULTY_CONFIGS.hard,
];

/**
 * Returns formatted size badge display info strictly mapping to XS, S, M, L
 */
export function getDifficultyBadgeText(difficulty: DifficultyTier | string | undefined): {
  sizeLabel: 'XS' | 'S' | 'M' | 'L';
  durationHint: string;
  spoons: 'XS' | 'S' | 'M' | 'L';
  label: string;
  badgeClass: string;
} {
  const tier = (difficulty as DifficultyTier) in DIFFICULTY_CONFIGS
    ? (difficulty as DifficultyTier)
    : 'easy';
  const cfg = DIFFICULTY_CONFIGS[tier];
  return {
    sizeLabel: cfg.sizeLabel,
    durationHint: cfg.durationHint,
    spoons: cfg.spoonDisplay as 'XS' | 'S' | 'M' | 'L',
    label: cfg.label,
    badgeClass: cfg.badgeClass,
  };
}

/**
 * Safely maps any raw difficulty string or undefined value to strictly XS | S | M | L
 */
export function getSizeLabel(difficulty?: DifficultyTier | string | undefined): 'XS' | 'S' | 'M' | 'L' {
  switch (difficulty) {
    case 'trivial': return 'XS';
    case 'easy': return 'S';
    case 'medium': return 'M';
    case 'hard': return 'L';
    default: return 'S';
  }
}
