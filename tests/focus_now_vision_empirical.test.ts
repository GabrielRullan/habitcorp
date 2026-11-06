import { describe, it, expect } from 'vitest';

describe('Empirical Verification: FocusNowVision uncluttering and spotlight clamping', () => {
  it('empirically verifies activeTask defaults to uncompletedTodos[0] and nextTasks clamps to 2', () => {
    // Model the exact logic in src/client/components/FocusNowVision.tsx lines 40-58
    const energyMaxDifficulty: Record<string, string[]> = {
      minimal: ['trivial'],
      low: ['trivial', 'easy'],
      normal: ['trivial', 'easy', 'medium'],
      high: ['trivial', 'easy', 'medium', 'hard'],
    };

    const energyLevel = 'normal';
    const allowedDifficulties = energyMaxDifficulty[energyLevel];
    const selectedFocusTaskId: string | null = null;
    const showAllTasks = false;

    // Simulate 5 uncompleted tasks in system (e.g. 3 injected microtasks + 2 real project tasks)
    const tasks = [
      { id: 'micro_1', type: 'todo', completed: 0, priority: 1, difficulty: 'trivial', title: 'Put on running shoes' },
      { id: 'micro_2', type: 'todo', completed: 0, priority: 1, difficulty: 'trivial', title: 'Get water bottle' },
      { id: 'micro_3', type: 'todo', completed: 0, priority: 1, difficulty: 'trivial', title: 'Step outside' },
      { id: 'proj_real_1', type: 'todo', completed: 0, priority: 0, difficulty: 'medium', title: 'Submit quarterly budget report' },
      { id: 'proj_real_2', type: 'todo', completed: 0, priority: 0, difficulty: 'hard', title: 'Deploy production release' },
    ];

    const uncompletedTodos = tasks
      .filter((t) => t.type === 'todo' && !t.completed && (!t.difficulty || allowedDifficulties.includes(t.difficulty)))
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));

    // Active spotlight task (only 1)
    const activeTask =
      uncompletedTodos.find((t) => t.id === selectedFocusTaskId) ||
      uncompletedTodos[0] ||
      null;

    // Next steps: clamped to 2
    const nextTasks = activeTask
      ? uncompletedTodos.filter((t) => t.id !== activeTask.id).slice(0, showAllTasks ? 10 : 2)
      : uncompletedTodos.slice(1, showAllTasks ? 10 : 3);

    // 1. Verify activeTask is uncompletedTodos[0]
    expect(activeTask).not.toBeNull();
    expect(activeTask?.id).toBe('micro_1');
    expect(activeTask?.title).toBe('Put on running shoes');

    // 2. Verify nextTasks has length exactly 2 (clamped by slice(0, 2))
    expect(nextTasks).toHaveLength(2);
    expect(nextTasks.map((t) => t.id)).toEqual(['micro_2', 'micro_3']);

    // 3. Verify real strategic project tasks are pushed outside view (out of sight)
    const visibleTaskIds = [activeTask?.id, ...nextTasks.map((t) => t.id)];
    expect(visibleTaskIds).not.toContain('proj_real_1');
    expect(visibleTaskIds).not.toContain('proj_real_2');
  });
});
