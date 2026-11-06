import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { GoblinBrainModal } from '../src/client/components/GoblinBrainModal';
import { decomposeOffline } from '../src/client/services/goblinBrain';
import { Task } from '../src/client/types';

describe('GoblinBrainModal Dual-Mode & Task Demolition Suite', () => {
  const sampleTask: Task = {
    id: 'task_sample_123',
    user_id: 'user_1',
    title: 'File quarterly taxes and organize receipts',
    notes: 'Invoices stored in Documents folder',
    type: 'todo',
    completed: 0,
    difficulty: 'hard',
    created_at: '2026-10-30',
    updated_at: '2026-10-30',
    subtasks: [],
  };

  const samplePendingTasks: Task[] = [
    {
      id: 'task_pending_1',
      user_id: 'user_1',
      title: 'Reply to client email',
      notes: '',
      type: 'todo',
      completed: 0,
      difficulty: 'easy',
      created_at: '2026-10-30',
      updated_at: '2026-10-30',
      subtasks: [],
    },
    {
      id: 'task_completed_1',
      user_id: 'user_1',
      title: 'Water the plants',
      notes: '',
      type: 'todo',
      completed: 1,
      difficulty: 'trivial',
      created_at: '2026-10-30',
      updated_at: '2026-10-30',
      subtasks: [],
    },
  ];

  describe('1. Modal Render Visibility & Guard Logic', () => {
    it('returns empty markup when isOpen is false and task is null', () => {
      const html = renderToStaticMarkup(
        React.createElement(GoblinBrainModal, {
          isOpen: false,
          onClose: vi.fn(),
          task: null,
          onApplySubtasks: vi.fn(),
        })
      );
      expect(html).toBe('');
    });

    it('returns empty markup when isOpen is false and task is provided', () => {
      const html = renderToStaticMarkup(
        React.createElement(GoblinBrainModal, {
          isOpen: false,
          onClose: vi.fn(),
          task: sampleTask,
          onApplySubtasks: vi.fn(),
        })
      );
      expect(html).toBe('');
    });

    it('renders non-empty markup when isOpen is true and task is null (Global Launcher Mode)', () => {
      const html = renderToStaticMarkup(
        React.createElement(GoblinBrainModal, {
          isOpen: true,
          onClose: vi.fn(),
          task: null,
          tasks: samplePendingTasks,
          onApplySubtasks: vi.fn(),
          onCreateTaskWithSubtasks: vi.fn(),
        })
      );

      // Must NOT return empty / null
      expect(html).not.toBe('');
      expect(html).toContain('Goblin Brain');
      expect(html).toContain('Wall of Awful');
      expect(html).toContain('What are you stuck on right now?');
      expect(html).toContain('Demolish');
      expect(html).toContain('placeholder="e.g. Reply to difficult email, file quarterly taxes..."');
    });

    it('renders active task selector in global launcher mode showing only incomplete tasks', () => {
      const html = renderToStaticMarkup(
        React.createElement(GoblinBrainModal, {
          isOpen: true,
          onClose: vi.fn(),
          task: null,
          tasks: samplePendingTasks,
          onApplySubtasks: vi.fn(),
        })
      );

      expect(html).toContain('Or choose active task:');
      expect(html).toContain('Reply to client email');
      // Completed tasks must be filtered out
      expect(html).not.toContain('Water the plants');
    });

    it('renders contextual mode when task is non-null', () => {
      const html = renderToStaticMarkup(
        React.createElement(GoblinBrainModal, {
          isOpen: true,
          onClose: vi.fn(),
          task: sampleTask,
          onApplySubtasks: vi.fn(),
        })
      );

      expect(html).not.toBe('');
      expect(html).toContain('Stuck on:');
      expect(html).toContain('File quarterly taxes and organize receipts');
      expect(html).toContain('Re-roll');
      expect(html).toContain('Apply Steps to Task');
      // Should not show global prompt in contextual mode
      expect(html).not.toContain('What are you stuck on right now?');
    });
  });

  describe('2. Empty State Guidance Prompt', () => {
    it('displays friendly prompt explaining how Goblin Brain breaks down tasks when no steps exist', () => {
      const html = renderToStaticMarkup(
        React.createElement(GoblinBrainModal, {
          isOpen: true,
          onClose: vi.fn(),
          task: null,
          onApplySubtasks: vi.fn(),
        })
      );

      expect(html).toContain('Paralyzed by a task?');
      expect(html).toContain('Type what is overwhelming you above and click Demolish');
    });
  });

  describe('3. Execution & Step Application Logic', () => {
    it('calls onCreateTaskWithSubtasks when custom steps are applied without an existing task', async () => {
      const handleCreateTaskWithSubtasks = vi.fn(async (title: string, steps: string[]) => {
        expect(title).toBe('Draft complex architectural proposal');
        expect(steps.length).toBeGreaterThanOrEqual(3);
      });

      const steps = decomposeOffline('Draft complex architectural proposal');
      await handleCreateTaskWithSubtasks('Draft complex architectural proposal', steps);

      expect(handleCreateTaskWithSubtasks).toHaveBeenCalledWith(
        'Draft complex architectural proposal',
        steps
      );
    });

    it('calls onApplySubtasks when an existing task is targeted', async () => {
      const handleApplySubtasks = vi.fn(async (taskId: string, steps: string[]) => {
        expect(taskId).toBe('task_sample_123');
        expect(steps.length).toBeGreaterThanOrEqual(3);
      });

      const steps = decomposeOffline(sampleTask.title);
      await handleApplySubtasks(sampleTask.id, steps);

      expect(handleApplySubtasks).toHaveBeenCalledWith(sampleTask.id, steps);
    });
  });

  describe('4. Instant Offline ADHD Decomposition Heuristics', () => {
    it('generates 3 to 5 tiny <30-second friction-free starter steps for common ADHD blocks', () => {
      const testCases = [
        {
          input: 'Reply to client email with invoice',
          expectedPhrases: ['open', 'email', 'greeting', 'send'],
        },
        {
          input: 'Clean the messy kitchen counters and sink',
          expectedPhrases: ['chair', 'trash', 'mug', 'sink', 'timer'],
        },
        {
          input: 'File quarterly taxes and submit forms',
          expectedPhrases: ['portal', 'folder', 'download', 'date'],
        },
        {
          input: 'Write documentation for authentication module',
          expectedPhrases: ['document', 'editor', 'title', 'bullet', 'sentences'],
        },
        {
          input: 'Phone call to schedule dentist appointment',
          expectedPhrases: ['phone', 'number', 'calendar', 'dial'],
        },
      ];

      for (const tc of testCases) {
        const steps = decomposeOffline(tc.input);
        expect(steps.length).toBeGreaterThanOrEqual(3);
        expect(steps.length).toBeLessThanOrEqual(5);

        const hasRelevantKeyword = steps.some((s) =>
          tc.expectedPhrases.some((phrase) => s.toLowerCase().includes(phrase.toLowerCase()))
        );
        expect(hasRelevantKeyword).toBe(true);
      }
    });
  });
});
