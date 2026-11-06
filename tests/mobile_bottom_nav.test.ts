import { describe, it, expect } from 'vitest';

export type MobileBottomNavAction = 'board' | 'agenda' | 'add' | 'focus' | 'dump';

export function handleBottomNavAction(
  action: MobileBottomNavAction,
  callbacks: {
    setViewMode: (mode: 'tasks_agenda' | 'agenda') => void;
    openTaskModal: () => void;
    openSpotlight: () => void;
    openBrainDump: () => void;
  }
) {
  switch (action) {
    case 'board':
      callbacks.setViewMode('tasks_agenda');
      break;
    case 'agenda':
      callbacks.setViewMode('agenda');
      break;
    case 'add':
      callbacks.openTaskModal();
      break;
    case 'focus':
      callbacks.openSpotlight();
      break;
    case 'dump':
      callbacks.openBrainDump();
      break;
  }
}

describe('Mobile Ergonomic Bottom Navigation Bar', () => {
  it('correctly routes to Board view', () => {
    let mode = '';
    handleBottomNavAction('board', {
      setViewMode: (m) => { mode = m; },
      openTaskModal: () => {},
      openSpotlight: () => {},
      openBrainDump: () => {},
    });
    expect(mode).toBe('tasks_agenda');
  });

  it('correctly routes to Agenda view', () => {
    let mode = '';
    handleBottomNavAction('agenda', {
      setViewMode: (m) => { mode = m; },
      openTaskModal: () => {},
      openSpotlight: () => {},
      openBrainDump: () => {},
    });
    expect(mode).toBe('agenda');
  });

  it('triggers Quick Add modal from primary thumb button', () => {
    let addOpened = false;
    handleBottomNavAction('add', {
      setViewMode: () => {},
      openTaskModal: () => { addOpened = true; },
      openSpotlight: () => {},
      openBrainDump: () => {},
    });
    expect(addOpened).toBe(true);
  });

  it('triggers Spotlight Focus mode directly from thumb navigation', () => {
    let focusOpened = false;
    handleBottomNavAction('focus', {
      setViewMode: () => {},
      openTaskModal: () => {},
      openSpotlight: () => { focusOpened = true; },
      openBrainDump: () => {},
    });
    expect(focusOpened).toBe(true);
  });
});
