import { Project, Task } from '../types';

/**
 * Converts a hex color string (#rgb or #rrggbb) to rgba(r, g, b, alpha).
 * Falls back safely if the input is already rgb/rgba or invalid.
 */
export function hexToRgba(color: string | undefined | null, alpha: number): string {
  if (!color) return `rgba(99, 102, 241, ${alpha})`;
  const trimmed = color.trim();
  if (trimmed.startsWith('rgba') || trimmed.startsWith('rgb')) {
    return trimmed;
  }
  let clean = trimmed.replace('#', '');
  if (clean.length === 3) {
    clean = clean
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (clean.length === 6) {
    const num = parseInt(clean, 16);
    if (!isNaN(num)) {
      const r = (num >> 16) & 255;
      const g = (num >> 8) & 255;
      const b = num & 255;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }
  return color;
}

/**
 * Resolve project details (color, name, project object) for a task/habit.
 * Checks task properties first, then matches against the project list.
 */
export function resolveTaskProject(
  task: Partial<Task>,
  projects: Project[] = []
): { color?: string; name?: string; project?: Project } {
  const project = task.project_id ? projects.find((p) => p.id === task.project_id) : undefined;
  const color = task.project_color || project?.color;
  const name = task.project_name || project?.name;
  return { color: color || undefined, name: name || undefined, project };
}

/**
 * Card container style for Task / Habit cards in lists and columns.
 */
export function getProjectCardStyle(
  color: string | undefined | null,
  isDone: boolean = false
): React.CSSProperties | undefined {
  if (!color) return undefined;
  return {
    borderLeftColor: isDone ? hexToRgba(color, 0.45) : color,
    borderLeftWidth: '4px',
    borderColor: isDone ? hexToRgba(color, 0.22) : hexToRgba(color, 0.38),
    backgroundColor: isDone ? hexToRgba(color, 0.03) : hexToRgba(color, 0.07),
  };
}

/**
 * Badge style for project chip pills on cards.
 */
export function getProjectBadgeStyle(color: string | undefined | null): React.CSSProperties {
  const c = color || '#6366f1';
  return {
    backgroundColor: hexToRgba(c, 0.14),
    color: c,
    borderColor: hexToRgba(c, 0.32),
  };
}

/**
 * Agenda calendar time-block style when scheduled on the grid.
 */
export function getAgendaBlockProjectStyle(
  color: string | undefined | null,
  isDone: boolean = false
): React.CSSProperties | undefined {
  if (!color) return undefined;
  return {
    borderLeftColor: isDone ? hexToRgba(color, 0.45) : color,
    borderLeftWidth: '3.5px',
    borderColor: isDone ? hexToRgba(color, 0.22) : hexToRgba(color, 0.45),
    backgroundColor: isDone ? hexToRgba(color, 0.04) : hexToRgba(color, 0.12),
  };
}
