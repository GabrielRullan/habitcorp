import { describe, it, expect } from 'vitest';

export function resolveActiveMobileView(
  viewMode: 'habits_tasks' | 'tasks_agenda' | 'agenda',
  mobileHabitsTasksTab: 'habits' | 'tasks',
  mobileTasksAgendaTab: 'tasks' | 'agenda'
) {
  if (viewMode === 'habits_tasks') {
    return mobileHabitsTasksTab;
  }
  if (viewMode === 'tasks_agenda') {
    return mobileTasksAgendaTab;
  }
  return 'agenda';
}

describe('Mobile Segmented View Switching', () => {
  it('resolves active column for habits_tasks mode', () => {
    expect(resolveActiveMobileView('habits_tasks', 'habits', 'tasks')).toBe('habits');
    expect(resolveActiveMobileView('habits_tasks', 'tasks', 'tasks')).toBe('tasks');
  });

  it('resolves active column for tasks_agenda mode', () => {
    expect(resolveActiveMobileView('tasks_agenda', 'habits', 'tasks')).toBe('tasks');
    expect(resolveActiveMobileView('tasks_agenda', 'habits', 'agenda')).toBe('agenda');
  });

  it('always returns agenda when full agenda mode is selected', () => {
    expect(resolveActiveMobileView('agenda', 'habits', 'tasks')).toBe('agenda');
  });
});
