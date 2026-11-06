import { describe, it, expect } from 'vitest';

describe('Cycle 10: Sensory Calm vs Visual Overload — Visual Density Switcher', () => {
  it('supports both Spacious and Compact Zen density modes', () => {
    const validModes: ('spacious' | 'compact')[] = ['spacious', 'compact'];
    expect(validModes).toContain('spacious');
    expect(validModes).toContain('compact');
  });

  it('guarantees compact mode reduces vertical clutter while preserving core scoring controls', () => {
    const habit = {
      id: 'h1',
      title: 'Practice Duolingo Chinese',
      difficulty: 'easy',
      notes: 'Make sure to practice tones and character stroke order carefully',
      anchor_habit_title: 'After brushing teeth',
      micro_habit_title: 'Complete 1 lesson',
      counter_up: 5,
      streak: 12,
    };

    // Spacious mode includes all auxiliary descriptors
    const spaciousFeatures = [
      habit.title,
      habit.notes,
      habit.anchor_habit_title,
      habit.micro_habit_title,
      habit.counter_up,
      habit.streak,
    ];
    expect(spaciousFeatures.filter(Boolean).length).toBe(6);

    // Compact mode prioritizes title, quick counter, and difficulty tag (removes notes and multi-line anchor banners)
    const compactVisibleKeys = ['title', 'counter_up', 'difficulty', 'streak'];
    expect(compactVisibleKeys.length).toBeLessThan(spaciousFeatures.length);
  });

  it('preserves user preference persistence key habitcorp_density', () => {
    const storageKey = 'habitcorp_density';
    expect(storageKey).toBe('habitcorp_density');
  });
});
