import React, { useState, useEffect } from 'react';
import { Task, CalendarMeeting, Ghost, Project } from '../types';
import { DIFFICULTY_CONFIGS } from '../utils/difficulty';
import { useTranslation } from '../i18n/I18nContext';
import { StreakGrowthBadge } from './StreakGrowthBadge';
import { isTaskInGracePeriod } from '../utils/streak';
import {
  resolveTaskProject,
  getProjectCardStyle,
  getProjectBadgeStyle,
  getAgendaBlockProjectStyle,
  hexToRgba,
} from '../utils/colors';
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle2,
  Circle,
  ExternalLink,
  MapPin,
  X,
  CalendarDays,
  Sparkles,
  Flame,
  Sun,
  Moon,
  Briefcase,
  Sprout,
  CheckSquare,
  Zap,
  Pencil,
  Trash2,
  Repeat,
  Lock,
} from 'lucide-react';

const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function isSafeUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const lower = url.trim().toLowerCase();
  return lower.startsWith('https://') || lower.startsWith('http://');
}

function doesMeetingOccurOnDate(m: CalendarMeeting, dateStr: string): boolean {
  if (!m || !m.start_time || typeof m.start_time !== 'string') return false;
  const mDate = m.start_time.slice(0, 10);
  if (mDate === dateStr) return true;

  const recurrence = m.recurrence || 'none';
  if (recurrence === 'none') return false;

  const baseStart = (m.series_start_time || m.start_time || '').slice(0, 10);
  if (!baseStart || dateStr < baseStart) return false;
  if (m.repeat_until && dateStr > m.repeat_until.slice(0, 10)) return false;

  try {
    const targetDate = new Date(`${dateStr}T12:00:00Z`);
    const dayOfWeek = targetDate.getUTCDay();
    const dayOfMonth = targetDate.getUTCDate();

    const startDate = new Date(`${baseStart}T12:00:00Z`);
    const startDayOfWeek = startDate.getUTCDay();
    const startDayOfMonth = startDate.getUTCDate();

    const repeatDays = Array.isArray(m.repeat_days) ? m.repeat_days : [];

    switch (recurrence) {
      case 'daily':
        return true;
      case 'weekdays':
        return dayOfWeek >= 1 && dayOfWeek <= 5;
      case 'weekly':
      case 'custom_days':
        return repeatDays.length > 0 ? repeatDays.includes(dayOfWeek) : dayOfWeek === startDayOfWeek;
      case 'monthly':
        return dayOfMonth === startDayOfMonth;
      default:
        return false;
    }
  } catch {
    return false;
  }
}

function getRecurrenceLabel(m: CalendarMeeting, t?: any): string | null {
  const recurrence = m.recurrence || 'none';
  if (recurrence === 'none') return null;
  switch (recurrence) {
    case 'daily':
      return t?.periodEveryDay || 'Daily';
    case 'weekdays':
      return t?.periodWeekdays || 'Weekdays';
    case 'weekly':
      return t?.recurrenceWeekly || 'Weekly';
    case 'monthly':
      return t?.recurrenceMonthly || 'Monthly';
    case 'custom_days': {
      const days = Array.isArray(m.repeat_days) ? m.repeat_days : [];
      if (days.length === 0) return 'Custom';
      const daysMap = t?.weekdaysShort;
      return days.map((d: number) => (daysMap && daysMap[d] ? daysMap[d].label : SHORT_DAYS[d]) || '').filter(Boolean).join(', ');
    }
    default:
      return null;
  }
}

interface AgendaViewProps {
  tasks: Task[];
  meetings: CalendarMeeting[];
  ghosts?: Ghost[];
  selectedDate: string;
  selectedProjectId?: string | 'all';
  projects?: Project[];
  onSelectDate: (date: string) => void;
  onScoreTask: (taskId: string, direction?: 'up' | 'down') => void;
  onEditTask: (task: Task) => void;
  onScheduleTask: (taskId: string, date: string, start: string, duration?: number) => void;
  onOpenNewTaskModal: (date: string, start: string) => void;
  onOpenNewMeetingModal: (date: string, start: string) => void;
  onUnscheduleTask: (taskId: string) => void;
  onEditMeeting?: (meeting: CalendarMeeting) => void;
  onDeleteMeeting?: (meetingId: string) => void;
  onRescheduleMeeting?: (meetingId: string, date: string, startHour: number) => void;
}

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 06:00 to 22:00
const START_HOUR = 6;
const END_HOUR = 23; // 22:00 slot ends at 23:00
const HOUR_HEIGHT = 56; // px per hour

function parseTimeToMinutes(timeStr: string | null | undefined, fallbackMinutes: number): number {
  if (!timeStr || typeof timeStr !== 'string') return fallbackMinutes;
  const trimmed = timeStr.trim();
  // Match HH:MM after 'T', space, or at the start of the string
  const match = trimmed.match(/(?:T|\s|^)(\d{1,2}):(\d{2})/);
  if (match) {
    const h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    if (!isNaN(h) && !isNaN(m)) {
      return h * 60 + m;
    }
  }
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    return d.getUTCHours() * 60 + d.getUTCMinutes();
  }
  return fallbackMinutes;
}

function formatMinutesToHHMM(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, Math.round(totalMinutes)));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

interface PositionedCalendarItem<T> {
  item: T;
  kind: 'meeting' | 'task';
  startMin: number;
  endMin: number;
  colIdx: number;
  totalCols: number;
}

function layoutDayItems<M, T>(
  rawItems: Array<{ item: M | T; kind: 'meeting' | 'task'; startMin: number; endMin: number }>
): Array<PositionedCalendarItem<M | T>> {
  const sorted = [...rawItems].sort((a, b) => {
    if (a.startMin !== b.startMin) return a.startMin - b.startMin;
    return (b.endMin - b.startMin) - (a.endMin - a.startMin);
  });

  const result: Array<PositionedCalendarItem<M | T>> = [];
  let cluster: Array<{ item: M | T; kind: 'meeting' | 'task'; startMin: number; endMin: number; colIdx: number }> = [];
  let clusterMaxEnd = -1;

  const flushCluster = () => {
    if (cluster.length === 0) return;
    const totalCols = Math.max(...cluster.map((c) => c.colIdx)) + 1;
    for (const c of cluster) {
      result.push({ ...c, totalCols });
    }
    cluster = [];
    clusterMaxEnd = -1;
  };

  for (const entry of sorted) {
    if (cluster.length > 0 && entry.startMin >= clusterMaxEnd) {
      flushCluster();
    }
    // Find first column where last item ends <= entry.startMin
    const colEndTimes: number[] = [];
    for (const placed of cluster) {
      colEndTimes[placed.colIdx] = Math.max(colEndTimes[placed.colIdx] ?? -1, placed.endMin);
    }
    let assignedCol = colEndTimes.findIndex((end) => end === undefined || end <= entry.startMin);
    if (assignedCol === -1) {
      assignedCol = colEndTimes.length;
    }
    cluster.push({ ...entry, colIdx: assignedCol });
    clusterMaxEnd = Math.max(clusterMaxEnd, entry.endMin);
  }
  flushCluster();

  return result;
}

export const AgendaView: React.FC<AgendaViewProps> = ({
  tasks,
  meetings,
  ghosts = [],
  selectedDate,
  selectedProjectId = 'all',
  projects = [],
  onSelectDate,
  onScoreTask,
  onEditTask,
  onScheduleTask,
  onOpenNewTaskModal,
  onOpenNewMeetingModal,
  onUnscheduleTask,
  onEditMeeting,
  onDeleteMeeting,
  onRescheduleMeeting,
}) => {
  const { t, formatDate } = useTranslation();
  const tr = t;
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [showUnscheduledDrawer, setShowUnscheduledDrawer] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'all' | 'habits' | 'tasks'>('all');
  const [drawerTimeFilter, setDrawerTimeFilter] = useState<'all' | 'morning' | 'workday' | 'evening'>('all');
  const [slotPicker, setSlotPicker] = useState<{ date: string; hour: number } | null>(null);

  // Ghosts visibility controls
  const [showGhosts, setShowGhosts] = useState(true);
  const [selectedGhostId, setSelectedGhostId] = useState<string | 'all'>('all');
  const [showTransitionBuffers, setShowTransitionBuffers] = useState(true);

  // Live Ticking Clock for ADHD Time-Blindness & Dynamic Now Line
  const [nowTime, setNowTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTime(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Navigate dates (pure UTC arithmetic to eliminate timezone / DST shifts)
  const handlePrevDay = () => {
    try {
      const [y, m, d] = selectedDate.slice(0, 10).split('-').map(Number);
      const shift = viewMode === 'day' ? 1 : 7;
      const nextDate = new Date(Date.UTC(y, m - 1, d - shift, 12, 0, 0));
      onSelectDate(nextDate.toISOString().slice(0, 10));
    } catch {
      onSelectDate(new Date().toISOString().slice(0, 10));
    }
  };

  const handleNextDay = () => {
    try {
      const [y, m, d] = selectedDate.slice(0, 10).split('-').map(Number);
      const shift = viewMode === 'day' ? 1 : 7;
      const nextDate = new Date(Date.UTC(y, m - 1, d + shift, 12, 0, 0));
      onSelectDate(nextDate.toISOString().slice(0, 10));
    } catch {
      onSelectDate(new Date().toISOString().slice(0, 10));
    }
  };

  const handleToday = () => {
    onSelectDate(new Date().toISOString().slice(0, 10));
  };

  // Week days calculation (clean Monday-to-Sunday UTC calculation)
  const getWeekDays = (baseDateStr: string) => {
    try {
      const [y, m, d] = (baseDateStr || '').slice(0, 10).split('-').map(Number);
      if (!y || !m || !d) throw new Error('invalid date');
      const curr = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
      const day = curr.getUTCDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      const mondayDate = new Date(Date.UTC(y, m - 1, d + mondayOffset, 12, 0, 0));

      return Array.from({ length: 7 }, (_, i) => {
        const dayDate = new Date(Date.UTC(
          mondayDate.getUTCFullYear(),
          mondayDate.getUTCMonth(),
          mondayDate.getUTCDate() + i,
          12, 0, 0
        ));
        return dayDate.toISOString().slice(0, 10);
      });
    } catch {
      const today = new Date().toISOString().slice(0, 10);
      return [today];
    }
  };

  const weekDays = getWeekDays(selectedDate);
  const activeDates = viewMode === 'day' ? [selectedDate] : weekDays;

  // Unscheduled tasks & recurring habits/routines (recurring habits eligible every day)
  const unscheduledTasks = tasks.filter((t) => {
    if (t.scheduled_date && t.scheduled_date === selectedDate) return false;
    if (t.type === 'habit') return true;
    if (t.type === 'daily' || t.type === 'todo') return !t.completed && (!t.scheduled_date || t.scheduled_date !== selectedDate);
    return false;
  });

  const isSelectedToday = selectedDate === new Date().toISOString().slice(0, 10);

  // Tasks and habits eligible for today's quick placement
  const tasksForSelectedDate = tasks.filter((t) => {
    if (t.scheduled_date && t.scheduled_date === selectedDate) return false;
    if (selectedProjectId && selectedProjectId !== 'all' && t.project_id !== selectedProjectId) return false;
    if (t.type === 'habit') return isSelectedToday;
    if (t.completed) return false;
    return (
      t.due_date?.slice(0, 10) === selectedDate ||
      (t.is_due_today && isSelectedToday)
    );
  });

  // Filtered backlog for unscheduled drawer
  const filteredUnscheduledTasks = unscheduledTasks.filter((t) => {
    if (selectedProjectId && selectedProjectId !== 'all' && t.project_id !== selectedProjectId) return false;
    if (drawerTab === 'habits' && t.type !== 'habit' && t.type !== 'daily') return false;
    if (drawerTab === 'tasks' && t.type !== 'todo') return false;
    if (drawerTimeFilter !== 'all' && t.time_of_day !== drawerTimeFilter) return false;
    return true;
  });

  const totalGhostEvents = meetings.filter((m) => m.is_ghost).length;

  const getRoutineIcon = (tod?: string) => {
    switch (tod) {
      case 'morning':
        return <Sun className="w-2.5 h-2.5 text-amber-600 shrink-0" />;
      case 'workday':
        return <Briefcase className="w-2.5 h-2.5 text-sky-600 shrink-0" />;
      case 'evening':
        return <Moon className="w-2.5 h-2.5 text-purple-600 shrink-0" />;
      default:
        return <Sprout className="w-2.5 h-2.5 text-emerald-600 shrink-0" />;
    }
  };

  const getCardStyle = (t: Task, isDone: boolean) => {
    if (isDone) {
      return 'bg-stone-100/90 border-stone-200 text-stone-400 line-through';
    }
    if (t.type === 'habit' || t.type === 'daily') {
      switch (t.time_of_day) {
        case 'morning':
          return 'bg-amber-50/80 border-amber-200/90 text-amber-950 border-l-[3px] border-l-amber-500 shadow-2xs';
        case 'workday':
          return 'bg-emerald-50/80 border-emerald-200/90 text-emerald-950 border-l-[3px] border-l-emerald-500 shadow-2xs';
        case 'evening':
          return 'bg-purple-50/80 border-purple-200/90 text-purple-950 border-l-[3px] border-l-purple-500 shadow-2xs';
        default:
          return 'bg-teal-50/80 border-teal-200/90 text-teal-950 border-l-[3px] border-l-teal-500 shadow-2xs';
      }
    }
    if (t.difficulty === 'hard') {
      return 'bg-rose-50/80 border-rose-200 text-rose-900 border-l-[3px] border-l-rose-400 shadow-2xs';
    }
    if (t.difficulty === 'medium') {
      return 'bg-amber-50/70 border-amber-200 text-amber-900 border-l-[3px] border-l-amber-400 shadow-2xs';
    }
    if (t.difficulty === 'trivial') {
      return 'bg-sky-50/80 border-sky-200 text-sky-900 border-l-[3px] border-l-sky-400 shadow-2xs';
    }
    return 'bg-emerald-50/70 border-emerald-200 text-emerald-950 border-l-[3px] border-l-emerald-400 shadow-2xs';
  };

  return (
    <div className="flex flex-col h-full bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
      {/* Agenda Header */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-3.5 border-b border-stone-200/80 bg-stone-50/70">
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-stone-100 border border-stone-200 rounded-xl p-0.5">
            <button
              onClick={() => setViewMode('day')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                viewMode === 'day'
                  ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              {tr.agendaDay}
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                viewMode === 'week'
                  ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              {tr.agendaWeek}
            </button>
          </div>

          <div className="flex items-center gap-0.5 bg-stone-100 border border-stone-200 rounded-xl px-1 py-0.5">
            <button
              onClick={handlePrevDay}
              className="p-1 hover:text-stone-900 text-stone-500 rounded-lg hover:bg-stone-200/60 transition"
              title="Previous"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleToday}
              className="px-2 py-0.5 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 rounded-lg transition"
            >
              {tr.agendaToday}
            </button>
            <button
              onClick={handleNextDay}
              className="p-1 hover:text-stone-900 text-stone-500 rounded-lg hover:bg-stone-200/60 transition"
              title="Next"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <span className="text-xs font-bold text-stone-800 ml-1">
            {formatDate(new Date(`${selectedDate}T12:00:00Z`), {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>

          {selectedProjectId && selectedProjectId !== 'all' && (() => {
            const activeProject = projects.find((p) => p.id === selectedProjectId);
            return (
              <span
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-semibold border shadow-2xs ml-1"
                style={
                  activeProject
                    ? {
                        backgroundColor: `${activeProject.color}15`,
                        borderColor: `${activeProject.color}40`,
                        color: activeProject.color,
                      }
                    : {
                        backgroundColor: '#eef2ff',
                        borderColor: '#c7d2fe',
                        color: '#4338ca',
                      }
                }
                title="Only tasks in this project are highlighted; others are transparent."
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: activeProject?.color || '#6366f1' }}
                />
                <span className="truncate max-w-[130px]">
                  {activeProject?.name || 'Project'} {tr.agendaOthersTransparent}
                </span>
              </span>
            );
          })()}
        </div>

        {/* Right Actions: Ghost Visibility Toggle & Unscheduled Drawer */}
        <div className="flex items-center gap-2">
            {/* Ghost Toggle Button */}
            <div className="flex items-center bg-stone-100 border border-stone-200 rounded-xl p-0.5">
              <button
                onClick={() => setShowGhosts(!showGhosts)}
                className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition ${
                  showGhosts
                    ? 'bg-pink-50 text-pink-700 border border-pink-200 shadow-2xs font-semibold'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
                title="Toggle external calendars from spouses, children, etc."
              >
                <span>👻</span>
                <span>{showGhosts ? tr.agendaGhosts : tr.agendaHidden}</span>
                {totalGhostEvents > 0 && (
                  <span className="text-[10px] bg-pink-100 text-pink-700 px-1 rounded font-mono">
                    {totalGhostEvents}
                  </span>
                )}
              </button>

              {showGhosts && ghosts.length > 1 && (
                <select
                  value={selectedGhostId}
                  onChange={(e) => setSelectedGhostId(e.target.value)}
                  className="bg-transparent border-0 text-[11px] text-pink-700 focus:ring-0 px-1.5 py-0.5 cursor-pointer font-medium"
                >
                  <option value="all" className="bg-white text-stone-800">{tr.subtabAll}</option>
                  {ghosts.map((g) => (
                    <option key={g.id} value={g.id} className="bg-white text-stone-800">
                      {g.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Transition Buffer Toggle for ADHD */}
            <button
              type="button"
              onClick={() => setShowTransitionBuffers(!showTransitionBuffers)}
              className={`px-2.5 py-1 rounded-xl text-xs font-medium flex items-center gap-1 border transition ${
                showTransitionBuffers
                  ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-2xs font-semibold'
                  : 'bg-stone-50 text-stone-500 border-stone-200 hover:text-stone-700'
              }`}
              title="Protecció TDAH: Amortidor de 15m de transició entre tasques"
            >
              <span>🛡️</span>
              <span>Buffer 15m</span>
            </button>

          <button
            onClick={() => onOpenNewMeetingModal(selectedDate, '10:00')}
            className="px-2.5 py-1 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 text-xs font-medium flex items-center gap-1.5 transition shadow-2xs hover:text-indigo-600"
            title="Create new calendar event or meeting"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-600" />
            <span>{tr.agendaNewEvent}</span>
          </button>

          <button
            onClick={() => setShowUnscheduledDrawer(!showUnscheduledDrawer)}
            className={`px-2.5 py-1 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition ${
              showUnscheduledDrawer
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-2xs font-semibold'
                : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5 text-indigo-600" />
            <span>{tr.agendaUnscheduled} ({unscheduledTasks.length})</span>
          </button>
        </div>
      </div>

      {/* Quick Placement Strip: Tasks & Routines for Today */}
      {tasksForSelectedDate.length > 0 && (
        <div className="px-3.5 py-2 bg-amber-50/60 border-b border-amber-200/60 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <span className="font-semibold text-amber-900 flex items-center gap-1 shrink-0 text-[11px]">
              <span>{tr.agendaTasksRoutinesToday}</span>
            </span>
            {tasksForSelectedDate.slice(0, 6).map((t) => {
              const isRoutine = t.type === 'habit' || t.type === 'daily';
              return (
                <button
                  key={t.id}
                  draggable={true}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', t.id);
                  }}
                  onClick={() =>
                    onScheduleTask(
                      t.id,
                      selectedDate,
                      '09:00',
                      t.scheduled_duration || 30
                    )
                  }
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition truncate max-w-[165px] shadow-2xs shrink-0 flex items-center gap-1 cursor-grab active:cursor-grabbing border ${
                    isRoutine
                      ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-200'
                      : 'bg-white hover:bg-amber-100 text-stone-800 border-amber-200'
                  }`}
                  title={`Click to place "${t.title}" onto 09:00, or drag to any hourly slot`}
                >
                  {isRoutine ? (
                    <Sprout className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                  ) : (
                    <Plus className="w-2.5 h-2.5 text-amber-700 shrink-0" />
                  )}
                  <span className="truncate">{t.title}</span>
                </button>
              );
            })}
          </div>
          {tasksForSelectedDate.length > 6 && (
            <button
              onClick={() => setShowUnscheduledDrawer(true)}
              className="text-amber-800 font-semibold text-[10px] hover:underline shrink-0"
            >
              +{tasksForSelectedDate.length - 6} {tr.agendaMore}
            </button>
          )}
        </div>
      )}

      {/* Main Grid Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Scrollable Compact Time Grid */}
        <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[calc(100vh-210px)] p-3">
          <div className={`w-full ${viewMode === 'week' ? 'min-w-[840px]' : 'min-w-[320px]'}`}>
            {/* Week Date Column Headers */}
            {viewMode === 'week' && (
              <div className="grid grid-cols-[50px_repeat(7,minmax(0,1fr))] gap-1.5 mb-1.5 pb-1.5 border-b border-stone-200 text-xs">
                <div />
                {weekDays.map((d) => {
                  const dateObj = new Date(`${d}T12:00:00Z`);
                  const isToday = d === new Date().toISOString().slice(0, 10);
                  const isSelected = d === selectedDate;
                  return (
                    <div
                      key={d}
                      onClick={() => onSelectDate(d)}
                      className={`text-center py-1 rounded-lg cursor-pointer transition min-w-0 ${
                        isSelected
                          ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200 shadow-2xs'
                          : isToday
                          ? 'bg-stone-200/80 text-stone-800 font-medium'
                          : 'text-stone-500 hover:bg-stone-100'
                      }`}
                    >
                      <div className="text-[9px] uppercase text-stone-400 truncate">
                        {formatDate(dateObj, { weekday: 'short' })}
                      </div>
                      <div className="text-xs font-bold">{dateObj.getUTCDate()}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Timeline View: Fixed Hour Labels + Proportional Calendar Columns */}
            <div className={`grid ${viewMode === 'week' ? 'grid-cols-[50px_repeat(7,minmax(0,1fr))]' : 'grid-cols-[50px_1fr]'} gap-1.5`}>
              {/* Left Column: Fixed Time Labels */}
              <div className="relative select-none" style={{ height: `${HOURS.length * HOUR_HEIGHT}px` }}>
                {HOURS.map((hour, idx) => (
                  <div
                    key={hour}
                    className="absolute left-0 right-0 text-[10px] font-mono text-stone-400 text-right pr-2 select-none -translate-y-2"
                    style={{ top: `${idx * HOUR_HEIGHT}px` }}
                  >
                    {String(hour).padStart(2, '0')}:00
                  </div>
                ))}
              </div>

              {/* Day Columns */}
              {activeDates.map((dateStr) => {
                const seenMeetingIds = new Set<string>();
                const dayMeetings = meetings.filter((m) => {
                  if (!doesMeetingOccurOnDate(m, dateStr)) return false;
                  if (m.is_ghost) {
                    if (!showGhosts) return false;
                    if (selectedGhostId !== 'all') {
                      const gids = (m.ghost_ids && m.ghost_ids.length > 0)
                        ? m.ghost_ids
                        : (m.ghost_id ? [m.ghost_id] : []);
                      if (!gids.includes(selectedGhostId)) return false;
                    }
                  }
                  if (seenMeetingIds.has(m.id)) return false;
                  seenMeetingIds.add(m.id);
                  return true;
                });

                const dayTasks = tasks.filter((t) => {
                  return t.scheduled_date === dateStr && Boolean(t.scheduled_start);
                });

                const rawItems: Array<{ item: CalendarMeeting | Task; kind: 'meeting' | 'task'; startMin: number; endMin: number }> = [];

                for (const m of dayMeetings) {
                  const startMin = parseTimeToMinutes(m.start_time, 10 * 60);
                  let endMin = parseTimeToMinutes(m.end_time, startMin + 60);
                  if (endMin <= startMin) endMin = startMin + 60;
                  rawItems.push({ item: m, kind: 'meeting', startMin, endMin });
                }

                for (const t of dayTasks) {
                  const startMin = parseTimeToMinutes(t.scheduled_start, 9 * 60);
                  const duration = Math.max(15, t.scheduled_duration || 30);
                  const endMin = startMin + duration;
                  rawItems.push({ item: t, kind: 'task', startMin, endMin });
                }

                const positionedItems = layoutDayItems(rawItems);

                const isHourOccupied = (hour: number) => {
                  const hStart = hour * 60;
                  const hEnd = (hour + 1) * 60;
                  return rawItems.some((r) => r.startMin < hEnd && r.endMin > hStart);
                };

                const now = nowTime;
                const isDateToday = dateStr === now.toISOString().slice(0, 10);
                const currentMinutes = now.getHours() * 60 + now.getMinutes();
                const showNowIndicator = isDateToday && currentMinutes >= START_HOUR * 60 && currentMinutes <= END_HOUR * 60;

                return (
                  <div
                    key={dateStr}
                    className="relative border-l border-stone-200/50 bg-stone-50/20"
                    style={{ height: `${HOURS.length * HOUR_HEIGHT}px` }}
                  >
                    {/* Background Hourly Rows */}
                    {HOURS.map((hour, idx) => {
                      const occupied = isHourOccupied(hour);
                      return (
                        <div
                          key={hour}
                          style={{
                            top: `${idx * HOUR_HEIGHT}px`,
                            height: `${HOUR_HEIGHT}px`,
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            const meetingId = e.dataTransfer.getData('text/meeting-id');
                            if (meetingId && onRescheduleMeeting) {
                              onRescheduleMeeting(meetingId, dateStr, hour);
                              return;
                            }
                            const taskId = e.dataTransfer.getData('text/plain');
                            if (taskId) {
                              const droppedTask = tasks.find((t) => t.id === taskId);
                              const duration = droppedTask?.scheduled_duration || 30;
                              onScheduleTask(
                                taskId,
                                dateStr,
                                `${String(hour).padStart(2, '0')}:00`,
                                duration
                              );
                            }
                          }}
                          onClick={() => {
                            if (!occupied) {
                              setSlotPicker({ date: dateStr, hour });
                            }
                          }}
                          className={`absolute left-0 right-0 border-t border-stone-200/60 transition ${
                            occupied
                              ? 'cursor-default'
                              : 'cursor-pointer hover:bg-indigo-50/40 group/slot'
                          }`}
                          title={occupied ? undefined : `${tr.agendaAddSlotTitle || 'Click para añadir evento o tarea'} (${String(hour).padStart(2, '0')}:00)`}
                        >
                          {!occupied && (
                            <div className="opacity-0 group-hover/slot:opacity-100 flex items-center justify-center h-full text-indigo-500 font-medium text-xs gap-1 select-none pointer-events-none transition-opacity">
                              <Plus className="w-3.5 h-3.5" />
                              <span className="text-[11px]">{tr.agendaNewEvent || 'Añadir'}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Current-Time "Now" Indicator Line (ADHD Time-Blindness Relief) */}
                    {showNowIndicator && (
                      <div
                        className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                        style={{
                          top: `${((currentMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT}px`,
                        }}
                      >
                        <div className="flex items-center gap-1 -ml-1.5 shrink-0">
                          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-200 dark:ring-rose-900 shadow-xs animate-pulse" />
                          <span className="text-[9px] font-mono font-bold bg-rose-600 text-white px-1 py-0.2 rounded shadow-xs select-none">
                            {String(now.getHours()).padStart(2, '0')}:{String(now.getMinutes()).padStart(2, '0')}
                          </span>
                        </div>
                        <div className="h-0.5 w-full bg-rose-500 shadow-xs" />
                      </div>
                    )}

                    {/* Positioned Events & Scheduled Tasks */}
                    {positionedItems.map((p) => {
                      const clampedStart = Math.max(START_HOUR * 60, Math.min(END_HOUR * 60 - 15, p.startMin));
                      const clampedEnd = Math.max(clampedStart + 15, Math.min(END_HOUR * 60, p.endMin));
                      const topPx = ((clampedStart - START_HOUR * 60) / 60) * HOUR_HEIGHT;
                      const heightPx = Math.max(26, ((clampedEnd - clampedStart) / 60) * HOUR_HEIGHT - 3);
                      const leftPct = (p.colIdx / p.totalCols) * 100;
                      const widthPct = (1 / p.totalCols) * 100;

                      if (p.kind === 'meeting') {
                        const m = p.item as CalendarMeeting;
                        const startTime = formatMinutesToHHMM(p.startMin);
                        const endTime = formatMinutesToHHMM(p.endMin);
                        const recurrenceLabel = getRecurrenceLabel(m, t);
                        const isExternalSynced = Boolean(m.source_id);
                        const isShort = heightPx < 45;

                        if (m.is_ghost) {
                          return (
                            <div
                              key={`${m.id}_${dateStr}`}
                              draggable={!isExternalSynced}
                              onDragStart={(e) => {
                                if (isExternalSynced) return;
                                e.dataTransfer.setData('text/meeting-id', m.id);
                                e.dataTransfer.effectAllowed = 'move';
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isExternalSynced && onEditMeeting) onEditMeeting(m);
                              }}
                              style={{
                                top: `${topPx}px`,
                                height: `${heightPx}px`,
                                left: `calc(${leftPct}% + 2px)`,
                                width: `calc(${widthPct}% - 4px)`,
                                borderColor: m.color || '#f472b6',
                              }}
                              className={`absolute z-10 p-1.5 rounded-lg text-xs border border-dashed bg-pink-50/90 text-pink-950 shadow-2xs overflow-hidden transition group/event ${
                                isExternalSynced ? 'cursor-default' : 'cursor-pointer hover:border-pink-500 hover:shadow-xs'
                              }`}
                            >
                              <div className="flex items-center justify-between font-medium text-pink-900 min-w-0">
                                <span className="truncate flex items-center gap-1 min-w-0">
                                  <span title="External Ghost Calendar" className="shrink-0 text-[10px]">👻</span>
                                  <span className={`truncate text-xs ${!isExternalSynced ? 'hover:underline' : ''}`}>{m.title}</span>
                                  {isExternalSynced && (
                                    <Lock className="w-2.5 h-2.5 text-pink-400 inline shrink-0" />
                                  )}
                                </span>
                                <span className="text-[9px] font-mono text-pink-600 shrink-0 ml-1">
                                  {startTime}–{endTime}
                                </span>
                              </div>
                              {!isShort && (
                                <div className="flex items-center gap-1 text-[9px] text-pink-800/80 mt-1 flex-wrap min-w-0">
                                  <span className="px-1 py-0.2 rounded font-medium bg-pink-100/70 border border-pink-200">
                                    {m.ghost_name || 'Ghost'}
                                  </span>
                                  {m.location && (
                                    <span className="flex items-center gap-0.5 truncate text-stone-400">
                                      <MapPin className="w-2 h-2" />
                                      {m.location}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        }

                        // Primary User Meeting
                        return (
                          <div
                            key={`${m.id}_${dateStr}`}
                            draggable={true}
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/meeting-id', m.id);
                              e.dataTransfer.effectAllowed = 'move';
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onEditMeeting) onEditMeeting(m);
                            }}
                            style={{
                              top: `${topPx}px`,
                              height: `${heightPx}px`,
                              left: `calc(${leftPct}% + 2px)`,
                              width: `calc(${widthPct}% - 4px)`,
                            }}
                            className="absolute z-10 p-1.5 rounded-lg text-xs border border-indigo-200 bg-indigo-50/90 text-indigo-950 shadow-2xs cursor-pointer hover:border-indigo-400 hover:shadow-xs transition group/event overflow-hidden"
                          >
                            <div className="flex items-center justify-between font-medium text-indigo-950 min-w-0">
                              <span className="truncate hover:underline text-xs min-w-0 font-semibold">{m.title}</span>
                              <div className="flex items-center gap-1 shrink-0 ml-1">
                                {recurrenceLabel && (
                                  <span
                                    className="px-1 py-0.2 rounded text-[8px] font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-0.5"
                                    title={`Periodical event: ${recurrenceLabel}`}
                                  >
                                    <Repeat className="w-2 h-2" />
                                    <span>{recurrenceLabel}</span>
                                  </span>
                                )}
                                <span className="text-[9px] font-mono text-indigo-600 font-semibold">
                                  {startTime}–{endTime}
                                </span>
                                {onEditMeeting && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onEditMeeting(m);
                                    }}
                                    title={tr.agendaEditEvent}
                                    className="opacity-0 group-hover/event:opacity-100 p-0.5 text-stone-400 hover:text-indigo-600 rounded transition"
                                  >
                                    <Pencil className="w-2.5 h-2.5" />
                                  </button>
                                )}
                                {onDeleteMeeting && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteMeeting(m.id);
                                    }}
                                    title={tr.agendaDeleteEvent}
                                    className="opacity-0 group-hover/event:opacity-100 p-0.5 text-stone-400 hover:text-rose-600 rounded transition"
                                  >
                                    <Trash2 className="w-2.5 h-2.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                            {!isShort && (
                              <div className="flex items-center gap-2 text-[9px] text-stone-500 mt-1">
                                <span className="text-[8px] font-semibold text-indigo-800 bg-indigo-100/70 border border-indigo-200/60 rounded px-1 py-0.2 select-none">
                                  ⏱️ 15m buffer
                                </span>
                                {m.location && (
                                  <span className="flex items-center gap-0.5 truncate text-stone-500">
                                    <MapPin className="w-2.5 h-2.5" />
                                    {m.location}
                                  </span>
                                )}
                                {m.meeting_url && isSafeUrl(m.meeting_url) && (
                                  <a
                                    href={m.meeting_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-indigo-600 hover:underline flex items-center gap-0.5 ml-auto shrink-0 font-medium"
                                  >
                                    <ExternalLink className="w-2.5 h-2.5" />
                                    <span>{tr.agendaJoin}</span>
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      }

                      // Scheduled Task
                      const taskItem = p.item as Task;
                      const isRoutine = taskItem.type === 'habit' || taskItem.type === 'daily';
                      const isDone = Boolean(taskItem.completed);
                      const isDimmed = selectedProjectId && selectedProjectId !== 'all' && taskItem.project_id !== selectedProjectId;
                      const startTime = formatMinutesToHHMM(p.startMin);
                      const isShort = heightPx < 45;
                      const { color: projColor, name: projName } = resolveTaskProject(taskItem, projects);

                      return (
                        <div
                          key={taskItem.id}
                          draggable={true}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditTask(taskItem);
                          }}
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', taskItem.id);
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          style={{
                            top: `${topPx}px`,
                            height: `${heightPx}px`,
                            left: `calc(${leftPct}% + 2px)`,
                            width: `calc(${widthPct}% - 4px)`,
                            ...getAgendaBlockProjectStyle(projColor, isDone),
                          }}
                          className={`absolute z-10 p-1.5 rounded-lg text-xs border transition-all duration-150 cursor-pointer hover:shadow-xs active:cursor-grabbing overflow-hidden ${
                            !projColor
                              ? getCardStyle(taskItem, isDone)
                              : isDone
                              ? 'text-stone-400 line-through opacity-70'
                              : 'text-stone-900 shadow-2xs'
                          } ${
                            isDimmed ? 'opacity-20 hover:opacity-90 grayscale-[35%] border-dashed shadow-none' : 'opacity-100'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 min-w-0">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              {taskItem.type === 'habit' ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onScoreTask(taskItem.id, 'up');
                                  }}
                                  className="p-0.5 rounded text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 transition shrink-0"
                                  title={`Increment habit counter (${taskItem.counter_up || 0})`}
                                >
                                  <Plus className="w-3 h-3" style={projColor ? { color: projColor } : undefined} />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onScoreTask(taskItem.id, 'up');
                                  }}
                                  className="text-stone-400 hover:text-indigo-600 shrink-0"
                                  title={isDone ? 'Mark uncompleted' : 'Mark completed'}
                                >
                                  {isDone ? (
                                    <CheckCircle2 className="w-3 h-3" style={{ color: projColor || '#059669' }} />
                                  ) : (
                                    <Circle className="w-3 h-3" />
                                  )}
                                </button>
                              )}
                              <span className="font-semibold truncate hover:underline text-[11px] text-stone-900">
                                {taskItem.title}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0 ml-1">
                              <span className="text-[9px] font-mono text-stone-500">
                                {startTime} ({taskItem.scheduled_duration || 30}m)
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUnscheduleTask(taskItem.id);
                                }}
                                className="text-stone-400 hover:text-rose-600 p-0.5 rounded shrink-0"
                                title="Unschedule"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>

                          {!isShort && (
                            <div className="flex flex-wrap items-center gap-1 mt-1 pt-1 border-t border-stone-200/50">
                              {isRoutine && (
                                <span className="px-1 py-0.2 rounded text-[8px] font-semibold bg-emerald-100/90 text-emerald-800 border border-emerald-200 flex items-center gap-0.5 shrink-0">
                                  {getRoutineIcon(taskItem.time_of_day)}
                                  <span>{tr.routineBadge}</span>
                                </span>
                              )}
                              {taskItem.type === 'daily' && (taskItem.streak || 0) > 0 && (
                                <StreakGrowthBadge
                                  streak={taskItem.streak}
                                  inGracePeriod={isTaskInGracePeriod(taskItem, dateStr)}
                                  compact
                                />
                              )}
                              {projName && (
                                <span
                                  className="px-1 py-0.2 rounded text-[8px] font-semibold border truncate max-w-[80px]"
                                  style={getProjectBadgeStyle(projColor)}
                                >
                                  {projName}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Transition Buffer Alerts for ADHD Back-to-Back Events */}
                    {showTransitionBuffers && rawItems.length > 1 && (
                      (() => {
                        const sorted = [...rawItems].sort((a, b) => a.startMin - b.startMin);
                        const bufferBadges: React.ReactNode[] = [];
                        for (let i = 0; i < sorted.length - 1; i++) {
                          const curr = sorted[i];
                          const next = sorted[i + 1];
                          const gap = next.startMin - curr.endMin;
                          // If items are back-to-back (gap between 0 and 15 mins)
                          if (gap >= 0 && gap < 15 && curr.endMin >= START_HOUR * 60 && curr.endMin <= END_HOUR * 60) {
                            const topPx = ((curr.endMin - START_HOUR * 60) / 60) * HOUR_HEIGHT;
                            bufferBadges.push(
                              <div
                                key={`buf-${curr.startMin}-${next.startMin}`}
                                style={{ top: `${topPx}px` }}
                                className="absolute left-2 right-2 z-20 pointer-events-none -translate-y-1/2 flex items-center justify-center"
                              >
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/90 text-white shadow-xs border border-amber-300 backdrop-blur-xs flex items-center gap-1">
                                  <span>🛡️</span>
                                  <span>Buffer recomanat (+15m)</span>
                                </span>
                              </div>
                            );
                          }
                        }
                        return bufferBadges;
                      })()
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Collapsible Unscheduled Tasks Drawer */}
        {showUnscheduledDrawer && (
          <div className="w-80 bg-white border-l border-stone-200 p-3.5 flex flex-col z-20 overflow-y-auto shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-indigo-600" />
                <span>{t.unscheduledDrawerTitle} ({unscheduledTasks.length})</span>
              </span>
              <button
                onClick={() => setShowUnscheduledDrawer(false)}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-lg"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Backlog Type Tabs */}
            <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200 text-[10px] font-medium mb-2">
              <button
                onClick={() => setDrawerTab('all')}
                className={`flex-1 py-0.5 rounded text-center transition ${
                  drawerTab === 'all'
                    ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                {t.unscheduledDrawerTabAll} ({unscheduledTasks.length})
              </button>
              <button
                onClick={() => setDrawerTab('habits')}
                className={`flex-1 py-0.5 rounded text-center transition ${
                  drawerTab === 'habits'
                    ? 'bg-white text-emerald-800 shadow-2xs font-semibold'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                {t.unscheduledDrawerTabRoutines} ({unscheduledTasks.filter((t) => t.type === 'habit' || t.type === 'daily').length})
              </button>
              <button
                onClick={() => setDrawerTab('tasks')}
                className={`flex-1 py-0.5 rounded text-center transition ${
                  drawerTab === 'tasks'
                    ? 'bg-white text-indigo-800 shadow-2xs font-semibold'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                {t.unscheduledDrawerTabTasks} ({unscheduledTasks.filter((t) => t.type === 'todo').length})
              </button>
            </div>

            {/* Time-of-Day Sub-Filters */}
            <div className="flex items-center gap-1 mb-2 overflow-x-auto pb-0.5 text-[9px]">
              {(['all', 'morning', 'workday', 'evening'] as const).map((tod) => (
                <button
                  key={tod}
                  onClick={() => setDrawerTimeFilter(tod)}
                  className={`px-1.5 py-0.5 rounded-md font-medium border capitalize shrink-0 transition ${
                    drawerTimeFilter === tod
                      ? 'bg-stone-800 text-white border-stone-800 font-semibold'
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {tod === 'all' ? t.timeFilterAll : tod === 'morning' ? t.timeFilterMorning : tod === 'workday' ? t.timeFilterWorkday : t.timeFilterEvening}
                </button>
              ))}
            </div>

            <p className="text-[10px] text-stone-500 mb-2">
              {t.unscheduledDrawerSubtitle}
            </p>

            <div className="space-y-1.5 flex-1 overflow-y-auto">
              {filteredUnscheduledTasks.length === 0 ? (
                <div className="text-center py-8 text-xs text-stone-400">
                  {t.unscheduledDrawerEmpty}
                </div>
              ) : (
                filteredUnscheduledTasks.map((t) => {
                  const isRoutine = t.type === 'habit' || t.type === 'daily';
                  const { color: projColor, name: projName } = resolveTaskProject(t, projects);
                  return (
                    <div
                      key={t.id}
                      draggable={true}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', t.id);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      className={`p-2 rounded-xl text-xs transition shadow-2xs cursor-grab active:cursor-grabbing border ${
                        !projColor
                          ? isRoutine
                            ? 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-300'
                            : 'bg-stone-50 border-stone-200 hover:border-indigo-300'
                          : 'hover:shadow-xs'
                      }`}
                      style={getProjectCardStyle(projColor, false)}
                    >
                      <div className="flex items-center justify-between font-medium text-stone-900 mb-1">
                        <span className="truncate flex items-center gap-1">
                          {isRoutine && <Sprout className="w-2.5 h-2.5 text-emerald-600 shrink-0" />}
                          <span className="truncate">{t.title}</span>
                        </span>
                        {(() => {
                          const diffCfg = DIFFICULTY_CONFIGS[t.difficulty] || DIFFICULTY_CONFIGS.easy;
                          return (
                            <span
                              className={`text-[8px] px-1 py-0.2 rounded font-bold inline-flex items-center justify-center min-w-[15px] leading-none select-none shrink-0 ${diffCfg.badgeClass}`}
                              title={`${diffCfg.sizeLabel} · ${diffCfg.label} (${diffCfg.durationHint})`}
                            >
                              {diffCfg.sizeLabel}
                            </span>
                          );
                        })()}
                      </div>

                      {projName && (
                        <div className="mb-1">
                          <span
                            className="px-1.5 py-0.2 rounded text-[8px] font-semibold border inline-flex items-center gap-1"
                            style={getProjectBadgeStyle(projColor)}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: projColor || '#6366f1' }}
                            />
                            <span>{projName}</span>
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-stone-500 mt-1 pt-1 border-t border-stone-200/50">
                        <span className="flex items-center gap-1 text-[9px] font-medium text-stone-600">
                          {isRoutine ? (
                            <span className="text-emerald-700 font-semibold">🌱 Routine</span>
                          ) : (
                            <span>Task</span>
                          )}
                          {t.time_of_day && t.time_of_day !== 'anytime' && (
                            <span className="text-stone-400">({t.time_of_day})</span>
                          )}
                          {t.type === 'daily' && (t.streak || 0) > 0 && (
                            <StreakGrowthBadge
                              streak={t.streak}
                              inGracePeriod={isTaskInGracePeriod(t, selectedDate)}
                              compact
                            />
                          )}
                        </span>
                        <button
                          onClick={() =>
                            onScheduleTask(
                              t.id,
                              selectedDate,
                              '09:00',
                              t.scheduled_duration || 30
                            )
                          }
                          className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-md text-[9px] transition border border-indigo-200 font-medium"
                        >
                          Schedule on {selectedDate.slice(5)}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Slot Picker Popover */}
      {slotPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs p-4">
          <div className="w-80 bg-white border border-stone-200 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-800">
                Add to {slotPicker.date} at {String(slotPicker.hour).padStart(2, '0')}:00
              </span>
              <button
                onClick={() => setSlotPicker(null)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  const startTime = `${String(slotPicker.hour).padStart(2, '0')}:00`;
                  onOpenNewTaskModal(slotPicker.date, startTime);
                  setSlotPicker(null);
                }}
                className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-xl flex items-center justify-center gap-2 shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Scheduled Task</span>
              </button>

              <button
                onClick={() => {
                  const startTime = `${String(slotPicker.hour).padStart(2, '0')}:00`;
                  onOpenNewMeetingModal(slotPicker.date, startTime);
                  setSlotPicker(null);
                }}
                className="w-full py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium rounded-xl flex items-center justify-center gap-2 border border-stone-200 transition"
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Add Calendar Meeting</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
