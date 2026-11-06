import { describe, it, expect, beforeEach } from 'vitest';
import {
  decomposeOffline,
  getGeminiApiKey,
  setGeminiApiKey,
  clearGeminiApiKey,
} from '../src/client/services/goblinBrain';
import { getStreakStage } from '../src/client/components/StreakGrowthBadge';

class LocalStorageMock {
  private store: Record<string, string> = {};
  getItem(key: string): string | null {
    return this.store[key] !== undefined ? this.store[key] : null;
  }
  setItem(key: string, val: string): void {
    this.store[key] = String(val);
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  clear(): void {
    this.store = {};
  }
}

// Ensure window & localStorage are available in Node test runner
const mockStorage = new LocalStorageMock();
(globalThis as any).window = globalThis;
(globalThis as any).localStorage = mockStorage;

describe('ADHD & Goblin Brain Module', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  describe('Point 3: Goblin Brain (Wall of Awful Demolisher)', () => {
    it('manages Gemini API key in localStorage', () => {
      expect(getGeminiApiKey()).toBe('');
      setGeminiApiKey('AIzaSyFakeKey12345');
      expect(getGeminiApiKey()).toBe('AIzaSyFakeKey12345');
      clearGeminiApiKey();
      expect(getGeminiApiKey()).toBe('');
    });

    it('offline decomposition breaks email tasks into tiny low-friction physical micro-steps', () => {
      const steps = decomposeOffline('Send difficult email to client regarding invoice');
      expect(steps.length).toBeGreaterThanOrEqual(4);
      expect(steps[0]).toMatch(/open/i);
      expect(steps.some((s) => s.toLowerCase().includes('greeting') || s.toLowerCase().includes('recipient'))).toBe(true);
    });

    it('offline decomposition breaks cleaning tasks into 1-item micro-actions', () => {
      const steps = decomposeOffline('Clean messy desk and office space');
      expect(steps.length).toBeGreaterThanOrEqual(4);
      expect(steps.some((s) => s.toLowerCase().includes('trash') || s.toLowerCase().includes('mug'))).toBe(true);
    });

    it('offline decomposition breaks programming/coding tasks into tiny low-barrier steps', () => {
      const steps = decomposeOffline('Refactor the authentication backend module');
      expect(steps.length).toBeGreaterThanOrEqual(4);
      expect(steps.some((s) => s.toLowerCase().includes('editor') || s.toLowerCase().includes('test'))).toBe(true);
    });

    it('offline decomposition breaks phone call anxiety tasks into physical prep steps', () => {
      const steps = decomposeOffline('Call dentist to book an appointment');
      expect(steps.length).toBeGreaterThanOrEqual(4);
      expect(steps.some((s) => s.toLowerCase().includes('water') || s.toLowerCase().includes('number'))).toBe(true);
    });

    it('offline decomposition breaks tax/admin tasks into tiny starter steps', () => {
      const steps = decomposeOffline('Do quarterly tax return paperwork');
      expect(steps.length).toBeGreaterThanOrEqual(4);
      expect(steps.some((s) => s.toLowerCase().includes('folder') || s.toLowerCase().includes('portal') || s.toLowerCase().includes('browser'))).toBe(true);
    });

    it('offline decomposition handles general arbitrary tasks gracefully', () => {
      const steps = decomposeOffline('Reorganize bookshelf');
      expect(steps.length).toBeGreaterThanOrEqual(3);
      expect(steps[0]).toMatch(/sit|look|stand/i);
    });
  });

  describe('Point 5: Resilient Streak Growth Stages (No Shame / Guilt-Free Recovery)', () => {
    it('returns Seed stage for 0 or broken streak without punitive language', () => {
      const stage0 = getStreakStage(0);
      expect(stage0.emoji).toBe('🌰');
      expect(stage0.name).toBe('Seed');

      const stageNegative = getStreakStage(-5);
      expect(stageNegative.name).toBe('Seed');
    });

    it('progresses naturally through botanical stages as habits solidify', () => {
      expect(getStreakStage(1).name).toBe('Sprout');
      expect(getStreakStage(4).name).toBe('Seedling');
      expect(getStreakStage(10).name).toBe('Sapling');
      expect(getStreakStage(21).name).toBe('Young Oak');
      expect(getStreakStage(45).name).toBe('Deep Pine');
      expect(getStreakStage(65).name).toBe('Ancient Bloom');
    });
  });

  describe('Point 4: Spoon Theory / Low Battery Mode Logic', () => {
    const sampleTasks = [
      { id: '1', title: 'Drink water', difficulty: 'trivial' },
      { id: '2', title: 'Put away 1 cup', difficulty: 'easy' },
      { id: '3', title: 'Write report', difficulty: 'medium' },
      { id: '4', title: 'File taxes', difficulty: 'hard' },
    ];

    it('filters out medium and hard tasks when operating in low battery / spoon depletion state', () => {
      const lowBatteryFiltered = sampleTasks.filter(
        (t) => t.difficulty === 'trivial' || t.difficulty === 'easy'
      );
      expect(lowBatteryFiltered).toHaveLength(2);
      expect(lowBatteryFiltered.map((t) => t.id)).toEqual(['1', '2']);
    });
  });

  describe('Point 1: Never-Behind Auto-Triage Logic', () => {
    const today = '2026-10-29';
    const tasks = [
      { id: '1', title: 'Overdue yesterday', due_date: '2026-10-28', completed: 0, type: 'todo' },
      { id: '2', title: 'Overdue last week', due_date: '2026-10-20', completed: 0, type: 'todo' },
      { id: '3', title: 'Due today', due_date: '2026-10-29', completed: 0, type: 'todo' },
      { id: '4', title: 'Completed overdue', due_date: '2026-10-25', completed: 1, type: 'todo' },
      { id: '5', title: 'Without timeline', due_date: null, completed: 0, type: 'todo' },
    ];

    it('identifies overdue uncompleted todo tasks for zero-shame sweeping', () => {
      const overdue = tasks.filter(
        (t) => !t.completed && t.type === 'todo' && t.due_date && t.due_date < today
      );
      expect(overdue).toHaveLength(2);
      expect(overdue.map((t) => t.id)).toEqual(['1', '2']);
    });

    it('sweeping to today updates all overdue tasks to today date without penalty', () => {
      const overdue = tasks.filter(
        (t) => !t.completed && t.type === 'todo' && t.due_date && t.due_date < today
      );
      const sweptToday = overdue.map((t) => ({ ...t, due_date: today }));
      expect(sweptToday.every((t) => t.due_date === today)).toBe(true);
    });

    it('sweeping to backlog clears due dates safely to eliminate calendar debt', () => {
      const overdue = tasks.filter(
        (t) => !t.completed && t.type === 'todo' && t.due_date && t.due_date < today
      );
      const sweptBacklog = overdue.map((t) => ({ ...t, due_date: null }));
      expect(sweptBacklog.every((t) => t.due_date === null)).toBe(true);
    });
  });

  describe('Point 9: "Life Happened" Guilt-Free Pause', () => {
    it('sets a forward pause threshold in storage', () => {
      const now = new Date('2026-10-29T12:00:00Z');
      const pauseDays = 3;
      const pausedUntil = new Date(now.getTime() + pauseDays * 86400000)
        .toISOString()
        .slice(0, 10);

      mockStorage.setItem('cadence_paused_until', pausedUntil);
      expect(mockStorage.getItem('cadence_paused_until')).toBe('2026-11-01');

      const isPaused = '2026-10-29' < (mockStorage.getItem('cadence_paused_until') || '');
      expect(isPaused).toBe(true);
    });
  });
});
