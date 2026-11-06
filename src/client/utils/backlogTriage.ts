import { Task } from '../types';

/**
 * Checks whether an unscheduled backlog to-do task is stale (created >= daysThreshold ago).
 */
export function isTaskStale(task: Task, daysThreshold: number = 7, now: Date = new Date()): boolean {
  if (Boolean(task.completed) || task.type !== 'todo') return false;
  if (Boolean(task.scheduled_date) || Boolean(task.due_date)) return false;
  const created = new Date(task.created_at || now.toISOString()).getTime();
  const diffDays = (now.getTime() - created) / (1000 * 60 * 60 * 24);
  return diffDays >= daysThreshold;
}

/**
 * Filters the backlog for tasks that haven't been scheduled or touched for >= daysThreshold.
 */
export function getStaleTasks(tasks: Task[], daysThreshold: number = 7, now: Date = new Date()): Task[] {
  return tasks.filter((t) => isTaskStale(t, daysThreshold, now));
}

/**
 * Generates a compassionate confirmation message when stale tasks are snoozed or triaged.
 */
export function getStaleTriageMessage(count: number): string {
  if (count <= 1) {
    return '🧺 Stale task rested into Someday. Guilt-free focus restored!';
  }
  return `🧺 ${count} stale tasks rested into Someday. No shame, your mind is clear!`;
}
