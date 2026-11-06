import { Task } from '../types';

/**
 * Finds the optimal next task to suggest to an ADHD user following task completion.
 * Prioritizes:
 * 1. Directly stacked habit/task (via anchor_task_id or anchor_habit_title)
 * 2. Next uncompleted task scheduled for today
 * 3. Next pending todo/daily item
 */
export function getNextFlowTask(completedTask: Task, allTasks: Task[]): Task | null {
  const pending = allTasks.filter((t) => !t.completed && t.id !== completedTask.id);
  if (pending.length === 0) return null;

  // 1. Direct habit-stack anchor match
  const anchored = pending.find(
    (t) =>
      t.anchor_task_id === completedTask.id ||
      (Boolean(t.anchor_habit_title) &&
        Boolean(completedTask.title) &&
        t.anchor_habit_title!.trim().toLowerCase() === completedTask.title.trim().toLowerCase())
  );
  if (anchored) return anchored;

  // 2. Next task scheduled for the same day
  if (completedTask.scheduled_date) {
    const nextScheduled = pending.find(
      (t) => t.scheduled_date === completedTask.scheduled_date && t.type !== 'habit'
    );
    if (nextScheduled) return nextScheduled;
  }

  // 3. Next pending non-habit task (todo or daily)
  const nextGeneral = pending.find((t) => t.type !== 'habit');
  return nextGeneral || pending[0] || null;
}
