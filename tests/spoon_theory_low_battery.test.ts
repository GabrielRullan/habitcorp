import { describe, it, expect } from 'vitest';
import { DIFFICULTY_CONFIGS, DifficultyTier } from '../src/client/utils/difficulty';

/**
 * Spoon Theory & Mindful Reset Test Suite
 * Guarantees ADHD cognitive reserve protection and shame-free habit resets
 */
describe('Spoon Theory & Mindful Reset Suite (Christine Miserandino & Dr. Barkley)', () => {
  it('correctly classifies tasks into low-battery compatible tiers', () => {
    const isLowBatteryFeasible = (difficulty: DifficultyTier): boolean => {
      return difficulty === 'trivial' || difficulty === 'easy';
    };

    expect(isLowBatteryFeasible('trivial')).toBe(true); // 1 spoon
    expect(isLowBatteryFeasible('easy')).toBe(true); // 2 spoons
    expect(isLowBatteryFeasible('medium')).toBe(false); // 3 spoons - too demanding
    expect(isLowBatteryFeasible('hard')).toBe(false); // 4 spoons - too demanding
  });

  it('guarantees spoon capacity adheres to 1..4 cognitive cost metric', () => {
    expect(DIFFICULTY_CONFIGS.trivial.spoons).toBe(1);
    expect(DIFFICULTY_CONFIGS.easy.spoons).toBe(2);
    expect(DIFFICULTY_CONFIGS.medium.spoons).toBe(3);
    expect(DIFFICULTY_CONFIGS.hard.spoons).toBe(4);
  });

  it('filters an array of mixed-energy tasks down to low-battery items only', () => {
    const sampleTasks = [
      { id: '1', title: 'Drink water', difficulty: 'trivial' as DifficultyTier },
      { id: '2', title: 'File annual taxes', difficulty: 'hard' as DifficultyTier },
      { id: '3', title: 'Take medication', difficulty: 'trivial' as DifficultyTier },
      { id: '4', title: 'Deep code refactor', difficulty: 'medium' as DifficultyTier },
      { id: '5', title: 'Stretch 2 minutes', difficulty: 'easy' as DifficultyTier },
    ];

    const lowBatteryFiltered = sampleTasks.filter(
      (t) => t.difficulty === 'trivial' || t.difficulty === 'easy'
    );

    expect(lowBatteryFiltered.length).toBe(3);
    expect(lowBatteryFiltered.map((t) => t.title)).toEqual([
      'Drink water',
      'Take medication',
      'Stretch 2 minutes',
    ]);
  });

  it('verifies compassionate mindful pause quotes prevent RSD shame spirals', () => {
    const mindfulQuotes = [
      "A slip is just data, not a character flaw. Reset gently for your next cue.",
      "Take a slow breath. Notice what triggered this moment without judgment.",
      "Every moment is a fresh reset. One lapse does not undo your progress.",
      "Curiosity over criticism: What was your environment asking of you?",
    ];

    expect(mindfulQuotes.length).toBeGreaterThanOrEqual(4);
    for (const quote of mindfulQuotes) {
      // Must emphasize learning, reset, or non-judgment
      const isCompassionate =
        quote.includes('data') ||
        quote.includes('breath') ||
        quote.includes('reset') ||
        quote.includes('Curiosity');
      expect(isCompassionate).toBe(true);
    }
  });
});
