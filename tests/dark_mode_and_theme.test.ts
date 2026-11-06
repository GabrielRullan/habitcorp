import { describe, it, expect } from 'vitest';
import { DIFFICULTY_CONFIGS, DIFFICULTY_LIST, getDifficultyBadgeText } from '../src/client/utils/difficulty';

describe('Restful Dark Mode & Visual Contrast Tier Tests', () => {
  it('ensures all 4 difficulty tiers contain explicit dark: styling for high contrast', () => {
    for (const config of DIFFICULTY_LIST) {
      expect(config.selectedClass).toContain('dark:');
      expect(config.unselectedClass).toContain('dark:');
      expect(config.badgeClass).toContain('dark:');
      expect(config.agendaClass).toContain('dark:');
    }
  });

  it('guarantees distinct color families per spoon tier in both light and dark mode', () => {
    // Trivial / XS: Sky / Blue
    expect(DIFFICULTY_CONFIGS.trivial.selectedClass).toContain('text-sky-900');
    expect(DIFFICULTY_CONFIGS.trivial.selectedClass).toContain('dark:text-sky-200');
    expect(DIFFICULTY_CONFIGS.trivial.badgeClass).toContain('dark:bg-sky-950/60');

    // Easy / S: Emerald / Green
    expect(DIFFICULTY_CONFIGS.easy.selectedClass).toContain('text-emerald-900');
    expect(DIFFICULTY_CONFIGS.easy.selectedClass).toContain('dark:text-emerald-200');
    expect(DIFFICULTY_CONFIGS.easy.badgeClass).toContain('dark:bg-emerald-950/60');

    // Medium / M: Amber / Warm Brass
    expect(DIFFICULTY_CONFIGS.medium.selectedClass).toContain('text-amber-900');
    expect(DIFFICULTY_CONFIGS.medium.selectedClass).toContain('dark:text-amber-200');
    expect(DIFFICULTY_CONFIGS.medium.badgeClass).toContain('dark:bg-amber-950/60');

    // Hard / L: Rose / Red
    expect(DIFFICULTY_CONFIGS.hard.selectedClass).toContain('text-rose-900');
    expect(DIFFICULTY_CONFIGS.hard.selectedClass).toContain('dark:text-rose-200');
    expect(DIFFICULTY_CONFIGS.hard.badgeClass).toContain('dark:bg-rose-950/60');
  });

  it('correctly maps spoons to cognitive size labels (XS, S, M, L)', () => {
    expect(DIFFICULTY_CONFIGS.trivial.spoons).toBe(1);
    expect(DIFFICULTY_CONFIGS.easy.spoons).toBe(2);
    expect(DIFFICULTY_CONFIGS.medium.spoons).toBe(3);
    expect(DIFFICULTY_CONFIGS.hard.spoons).toBe(4);
  });

  it('returns valid fallback badge for undefined difficulty tier with dark mode classes', () => {
    const badge = getDifficultyBadgeText(undefined);
    expect(badge.label).toBe('Small');
    expect(badge.spoons).toBe('S');
    expect(badge.badgeClass).toContain('dark:');
  });
});
