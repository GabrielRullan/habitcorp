import { describe, it, expect } from 'vitest';
import {
  hexToRgba,
  resolveTaskProject,
  getProjectCardStyle,
  getProjectBadgeStyle,
  getAgendaBlockProjectStyle,
} from '../src/client/utils/colors';
import { Project, Task } from '../src/client/types';

describe('Project Color Utilities for Tasks and Habits', () => {
  it('converts standard 6-digit hex colors to rgba correctly', () => {
    expect(hexToRgba('#ec4899', 0.1)).toBe('rgba(236, 72, 153, 0.1)');
    expect(hexToRgba('#10b981', 0.5)).toBe('rgba(16, 185, 129, 0.5)');
    expect(hexToRgba('#3b82f6', 1)).toBe('rgba(59, 130, 246, 1)');
  });

  it('converts shorthand 3-digit hex colors to rgba correctly', () => {
    expect(hexToRgba('#fff', 0.2)).toBe('rgba(255, 255, 255, 0.2)');
    expect(hexToRgba('#000', 0.8)).toBe('rgba(0, 0, 0, 0.8)');
  });

  it('resolves project color and name from task or project list', () => {
    const projects: Project[] = [
      {
        id: 'proj_health',
        user_id: 'user_1',
        name: 'Health & Fitness',
        color: '#10b981',
        created_at: new Date().toISOString(),
      },
      {
        id: 'proj_chinese',
        user_id: 'user_1',
        name: 'Chinese Study',
        color: '#ec4899',
        created_at: new Date().toISOString(),
      },
    ];

    // Case 1: Task with direct project_color and project_name
    const taskWithDirectColor: Partial<Task> = {
      project_id: 'proj_health',
      project_color: '#10b981',
      project_name: 'Health & Fitness',
    };
    const res1 = resolveTaskProject(taskWithDirectColor, projects);
    expect(res1.color).toBe('#10b981');
    expect(res1.name).toBe('Health & Fitness');

    // Case 2: Task with only project_id (lookup in projects list)
    const habitWithProjectIdOnly: Partial<Task> = {
      project_id: 'proj_chinese',
      project_color: null,
      project_name: null,
    };
    const res2 = resolveTaskProject(habitWithProjectIdOnly, projects);
    expect(res2.color).toBe('#ec4899');
    expect(res2.name).toBe('Chinese Study');
    expect(res2.project?.id).toBe('proj_chinese');

    // Case 3: Task without project
    const unassignedTask: Partial<Task> = {
      project_id: null,
    };
    const res3 = resolveTaskProject(unassignedTask, projects);
    expect(res3.color).toBeUndefined();
    expect(res3.name).toBeUndefined();
  });

  it('generates correct project card styles for active and completed states', () => {
    const activeStyle = getProjectCardStyle('#10b981', false);
    expect(activeStyle).toBeDefined();
    expect(activeStyle?.borderLeftColor).toBe('#10b981');
    expect(activeStyle?.borderLeftWidth).toBe('4px');
    expect(activeStyle?.borderColor).toBe('rgba(16, 185, 129, 0.38)');
    expect(activeStyle?.backgroundColor).toBe('rgba(16, 185, 129, 0.07)');

    const doneStyle = getProjectCardStyle('#10b981', true);
    expect(doneStyle).toBeDefined();
    expect(doneStyle?.borderLeftColor).toBe('rgba(16, 185, 129, 0.45)');
    expect(doneStyle?.borderColor).toBe('rgba(16, 185, 129, 0.22)');
    expect(doneStyle?.backgroundColor).toBe('rgba(16, 185, 129, 0.03)');

    // Returns undefined if color is not present
    expect(getProjectCardStyle(null, false)).toBeUndefined();
    expect(getProjectCardStyle(undefined, false)).toBeUndefined();
  });

  it('generates correct agenda block and badge styles', () => {
    const agendaStyle = getAgendaBlockProjectStyle('#ec4899', false);
    expect(agendaStyle?.borderLeftColor).toBe('#ec4899');
    expect(agendaStyle?.borderLeftWidth).toBe('3.5px');
    expect(agendaStyle?.backgroundColor).toBe('rgba(236, 72, 153, 0.12)');

    const badgeStyle = getProjectBadgeStyle('#ec4899');
    expect(badgeStyle.color).toBe('#ec4899');
    expect(badgeStyle.backgroundColor).toBe('rgba(236, 72, 153, 0.14)');
  });
});
