import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Sidebar, SidebarProps } from '../src/client/components/Sidebar';
import { I18nProvider } from '../src/client/i18n/I18nContext';
import { Project, Task } from '../src/client/types';

describe('Sidebar Projects & Collapsible Sections (UX Expand)', () => {
  const mockProjects: Project[] = [
    { id: 'proj-1', name: 'Chinese Learning', color: '#10b981', created_at: '2026-11-01' },
    { id: 'proj-2', name: 'Client Work', color: '#6366f1', created_at: '2026-11-01' },
  ];

  const mockTasks: Task[] = [
    {
      id: 'task-1',
      title: 'Review HSK 4 Vocabulary',
      type: 'todo',
      difficulty: 'easy',
      completed: 0,
      project_id: 'proj-1',
      project_name: 'Chinese Learning',
      created_at: '2026-11-01',
    },
    {
      id: 'task-2',
      title: 'Submit Invoice',
      type: 'todo',
      difficulty: 'medium',
      completed: 0,
      project_id: 'proj-2',
      project_name: 'Client Work',
      created_at: '2026-11-01',
    },
  ];

  const defaultProps: SidebarProps = {
    onOpenGoblin: vi.fn(),
    onOpenAgentApi: vi.fn(),
    onOpenPomodoro: vi.fn(),
    onOpenCalendars: vi.fn(),
    onOpenSpotlight: vi.fn(),
    onOpenBrainDump: vi.fn(),
    onOpenShutdown: vi.fn(),
    soundEnabled: true,
    onToggleSound: vi.fn(),
    showTutorials: true,
    onOpenTutorial: vi.fn(),
    theme: 'light',
    onCycleTheme: vi.fn(),
    auth: null,
    onOpenAuth: vi.fn(),
    onLogout: vi.fn(),
    projects: mockProjects,
    selectedProjectId: 'all',
    onSelectProject: vi.fn(),
    onOpenNewProject: vi.fn(),
    tasks: mockTasks,
  };

  const renderSidebar = (props: Partial<SidebarProps> = {}) => {
    const combinedProps = { ...defaultProps, ...props };
    return renderToStaticMarkup(
      React.createElement(
        I18nProvider,
        null,
        React.createElement(Sidebar, combinedProps)
      )
    );
  };

  it('renders collapsible toggles for Action Triggers, Projects, and Tools sections', () => {
    const html = renderSidebar();

    expect(html).toContain('aria-label="Toggle Action Triggers Section"');
    expect(html).toContain('aria-label="Toggle Projects Section"');
    expect(html).toContain('aria-label="Toggle Tools Section"');
  });

  it('renders the Projects list with counts and color badges in the sidebar', () => {
    const html = renderSidebar();

    expect(html).toContain('Chinese Learning');
    expect(html).toContain('Client Work');
    expect(html).toContain('aria-label="All Projects"');
    expect(html).toContain('aria-label="Project Chinese Learning"');
    expect(html).toContain('aria-label="Create New Project"');
  });

  it('highlights the selected project with aria-pressed', () => {
    const html = renderSidebar({ selectedProjectId: 'proj-1' });

    expect(html).toContain('aria-label="Project Chinese Learning"');
    expect(html).toMatch(/aria-label="Project Chinese Learning"[^>]*aria-pressed="true"/);
  });
});
