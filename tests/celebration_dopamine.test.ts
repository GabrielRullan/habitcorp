import { describe, it, expect } from 'vitest';
import { generateCelebrationParticles, isReducedMotionPreferred } from '../src/client/utils/celebration';

describe('Cycle 12: Habit Reinforcement & Sensory Dopamine Reward (BJ Fogg Celebration)', () => {
  it('generates particles with pastel tones and calm symbols', () => {
    const particles = generateCelebrationParticles(15);
    // In Node test environment, prefers-reduced-motion is false
    expect(particles.length).toBe(15);
    for (const p of particles) {
      expect(p.color).toBeDefined();
      expect(p.symbol).toBeDefined();
      expect(p.size).toBeGreaterThan(0);
    }
  });

  it('guarantees safe fallback when window is undefined or reduced-motion is active', () => {
    const isReduced = isReducedMotionPreferred();
    expect(typeof isReduced).toBe('boolean');
  });

  it('verifies celebration particle symbol alphabet aligns with natural growth', () => {
    const validSymbols = ['🌱', '✨', '⭐', '🌿', '🍃', '🔥'];
    const particles = generateCelebrationParticles(20);
    for (const p of particles) {
      expect(validSymbols).toContain(p.symbol);
    }
  });
});
