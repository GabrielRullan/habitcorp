/**
 * Restful Dopamine & Celebration Engine
 * Based on BJ Fogg's "Celebration" principle & Deci & Ryan Self-Determination Theory.
 * Uses native Web Audio API synthesis for zero-asset latency and zero bundle bloat.
 */

export function isReducedMotionPreferred(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function playPeacefulChime(soundEnabled = true) {
  if (!soundEnabled || typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Peaceful C-Major pentatonic chime: C5, E5, G5
    const notes = [523.25, 659.25, 783.99];
    const now = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      // Gentle attack and soft exponential release
      gain.gain.setValueAtTime(0, now + idx * 0.06);
      gain.gain.linearRampToValueAtTime(0.06, now + idx * 0.06 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.5);
    });
  } catch (e) {
    console.debug('Audio chime unavailable:', e);
  }
}

export interface CelebrationParticle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  vx: number;
  vy: number;
  symbol: string;
}

const PASTEL_COLORS = [
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ec4899', // pink
  '#3b82f6', // blue
];

const SYMBOLS = ['🌱', '✨', '⭐', '🌿', '🍃', '🔥'];

export function generateCelebrationParticles(count = 18): CelebrationParticle[] {
  if (isReducedMotionPreferred()) return [];

  const particles: CelebrationParticle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      id: i + Math.random(),
      x: 50 + (Math.random() * 20 - 10), // centered around 50%
      y: 60,
      color: PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)],
      size: Math.random() * 8 + 12,
      vx: (Math.random() - 0.5) * 80,
      vy: -(Math.random() * 60 + 30),
      symbol: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
    });
  }
  return particles;
}
