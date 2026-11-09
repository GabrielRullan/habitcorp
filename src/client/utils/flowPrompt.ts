import { Task } from '../types';
import { isDailyDueOnDate } from '../clientStore';

/**
 * Checks whether a routine/task is due today so non-due routines (e.g. Tue/Fri on a Monday)
 * are never offered as pending in recommendations or flow prompts.
 */
export function isTaskEligibleToday(task: Task, todayStr?: string): boolean {
  if (task.type !== 'daily') return true;
  if (task.is_due_today === false) return false;
  const targetDate = todayStr || new Date().toISOString().slice(0, 10);
  return isDailyDueOnDate(task, targetDate);
}

/**
 * Finds the optimal next task to suggest to an ADHD user following task completion.
 * Prioritizes:
 * 1. Directly stacked habit/task (via anchor_task_id or anchor_habit_title)
 * 2. Next uncompleted task scheduled for today
 * 3. Next pending todo/daily item due today
 */
export function getNextFlowTask(completedTask: Task, allTasks: Task[], todayStr?: string): Task | null {
  const pending = allTasks.filter(
    (t) => !t.completed && t.id !== completedTask.id && isTaskEligibleToday(t, todayStr)
  );
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
