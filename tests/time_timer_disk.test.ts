import { describe, it, expect } from 'vitest';
import { DifficultyTier } from '../src/client/types';

/**
 * Calculates difficulty-calibrated focus timer duration (in minutes).
 */
export function getFocusTimerDurationForDifficulty(difficulty?: DifficultyTier): number {
  switch (difficulty) {
    case 'trivial':
      return 15;
    case 'easy':
      return 25;
    case 'medium':
      return 35;
    case 'hard':
      return 45;
    default:
      return 25;
  }
}

/**
 * Calculates the SVG sweep angle (degrees) for the analog time timer dial.
 */
export function calculateTimeTimerWedgeAngle(secondsRemaining: number, totalSeconds: number): number {
  if (totalSeconds <= 0) return 0;
  const ratio = Math.max(0, Math.min(1, secondsRemaining / totalSeconds));
  return ratio * 360;
}

describe('TimeTimer Analog Radial Dial & Focus Calibration', () => {
  it('calibrates timer duration correctly according to executive load / spoon size', () => {
    expect(getFocusTimerDurationForDifficulty('trivial')).toBe(15);
    expect(getFocusTimerDurationForDifficulty('easy')).toBe(25);
    expect(getFocusTimerDurationForDifficulty('medium')).toBe(35);
    expect(getFocusTimerDurationForDifficulty('hard')).toBe(45);
    expect(getFocusTimerDurationForDifficulty(undefined)).toBe(25);
  });

  it('calculates the decaying radial wedge angle with precision', () => {
    // Full timer (25m remaining of 25m) -> 360 deg
    expect(calculateTimeTimerWedgeAngle(1500, 1500)).toBe(360);

    // Halfway through (12.5m remaining of 25m) -> 180 deg
    expect(calculateTimeTimerWedgeAngle(750, 1500)).toBe(180);

    // Quarter remaining -> 90 deg
    expect(calculateTimeTimerWedgeAngle(375, 1500)).toBe(90);

    // Completed -> 0 deg
    expect(calculateTimeTimerWedgeAngle(0, 1500)).toBe(0);
  });

  it('clamps invalid values between 0 and 360 degrees', () => {
    expect(calculateTimeTimerWedgeAngle(-50, 1500)).toBe(0);
    expect(calculateTimeTimerWedgeAngle(2000, 1500)).toBe(360);
    expect(calculateTimeTimerWedgeAngle(0, 0)).toBe(0);
  });
});
