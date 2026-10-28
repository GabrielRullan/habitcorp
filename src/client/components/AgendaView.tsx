import React, { useState } from 'react';
import { Task, CalendarMeeting, Ghost, Project } from '../types';
import { useTranslation } from '../i18n/I18nContext';
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
} from 'lucide-react';

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
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [showUnscheduledDrawer, setShowUnscheduledDrawer] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'all' | 'habits' | 'tasks'>('all');
  const [drawerTimeFilter, setDrawerTimeFilter] = useState<'all' | 'morning' | 'workday' | 'evening'>('all');
  const [slotPicker, setSlotPicker] = useState<{ date: string; hour: number } | null>(null);

  // Ghosts visibility controls
  const [showGhosts, setShowGhosts] = useState(true);
  const [selectedGhostId, setSelectedGhostId] = useState<string | 'all'>('all');

  // Navigate dates
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - (viewMode === 'day' ? 1 : 7));
    onSelectDate(d.toISOString().slice(0, 10));
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + (viewMode === 'day' ? 1 : 7));
    onSelectDate(d.toISOString().slice(0, 10));
  };

  const handleToday = () => {
    onSelectDate(new Date().toISOString().slice(0, 10));
  };

  // Week days calculation
  const getWeekDays = (baseDateStr: string) => {
    const curr = new Date(`${baseDateStr}T12:00:00Z`);
    const day = curr.getUTCDay();
    const diff = curr.getUTCDate() - day + (day === 0 ? -6 : 1); // Monday start
    const monday = new Date(curr.setDate(diff));

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setUTCDate(monday.getUTCDate() + i);
      return d.toISOString().slice(0, 10);
    });
  };

  const weekDays = getWeekDays(selectedDate);
  const activeDates = viewMode === 'day' ? [selectedDate] : weekDays;

  // Unscheduled tasks & recurring habits/routines
  const unscheduledTasks = tasks.filter((t) => {
    if (t.scheduled_date) return false;
    if (t.type === 'habit') return true;
    if (t.type === 'daily' || t.type === 'todo') return !t.completed;
    return false;
  });

  const isSelectedToday = selectedDate === new Date().toISOString().slice(0, 10);

  // Tasks and habits eligible for today's quick placement
  const tasksForSelectedDate = tasks.filter((t) => {
    if (t.scheduled_date) return false;
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
    return 'bg-white border-stone-200 text-stone-800 border-l-[3px] border-l-indigo-400 shadow-2xs';
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
              {t.agendaDay}
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                viewMode === 'week'
                  ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              {t.agendaWeek}
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
              {t.agendaToday}
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
                  {activeProject?.name || 'Project'} {t.agendaOthersTransparent}
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
              <span>{showGhosts ? t.agendaGhosts : t.agendaHidden}</span>
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
                <option value="all" className="bg-white text-stone-800">{t.subtabAll}</option>
                {ghosts.map((g) => (
                  <option key={g.id} value={g.id} className="bg-white text-stone-800">
                    {g.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <button
            onClick={() => onOpenNewMeetingModal(selectedDate, '10:00')}
            className="px-2.5 py-1 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 text-xs font-medium flex items-center gap-1.5 transition shadow-2xs hover:text-indigo-600"
            title="Create new calendar event or meeting"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-600" />
            <span>{t.agendaNewEvent}</span>
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
            <span>{t.agendaUnscheduled} ({unscheduledTasks.length})</span>
          </button>
        </div>
      </div>

      {/* Quick Placement Strip: Tasks & Routines for Today */}
      {tasksForSelectedDate.length > 0 && (
        <div className="px-3.5 py-2 bg-amber-50/60 border-b border-amber-200/60 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <span className="font-semibold text-amber-900 flex items-center gap-1 shrink-0 text-[11px]">
              <span>{t.agendaTasksRoutinesToday}</span>
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
              +{tasksForSelectedDate.length - 6} {t.agendaMore}
            </button>
          )}
        </div>
      )}

      {/* Main Grid Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Scrollable Compact Time Grid */}
        <div className="flex-1 overflow-y-auto max-h-[calc(100vh-210px)] p-3">
          <div className="min-w-[500px]">
            {/* Week Date Column Headers */}
            {viewMode === 'week' && (
              <div className="grid grid-cols-[50px_repeat(7,1fr)] gap-1.5 mb-1.5 pb-1.5 border-b border-stone-200 text-xs">
                <div />
                {weekDays.map((d) => {
                  const dateObj = new Date(`${d}T12:00:00Z`);
                  const isToday = d === new Date().toISOString().slice(0, 10);
                  const isSelected = d === selectedDate;
                  return (
                    <div
                      key={d}
                      onClick={() => onSelectDate(d)}
                      className={`text-center py-1 rounded-lg cursor-pointer transition ${
                        isSelected
                          ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200 shadow-2xs'
                          : isToday
                          ? 'bg-stone-200/80 text-stone-800 font-medium'
                          : 'text-stone-500 hover:bg-stone-100'
                      }`}
                    >
                      <div className="text-[9px] uppercase text-stone-400">
                        {formatDate(dateObj, { weekday: 'short' })}
                      </div>
                      <div className="text-xs font-bold">{dateObj.getUTCDate()}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Compact Hourly Rows */}
            <div className="space-y-0.5">
              {HOURS.map((hour) => {
                const hourFormatted = `${String(hour).padStart(2, '0')}:00`;
                return (
                  <div
                    key={hour}
                    className={`grid ${
                      viewMode === 'week'
                        ? 'grid-cols-[50px_repeat(7,1fr)]'
                        : 'grid-cols-[50px_1fr]'
                    } gap-1.5 items-start min-h-[44px] border-t border-stone-200/50 pt-0.5 group`}
                  >
                    {/* Time Label */}
                    <span className="text-[10px] font-mono text-stone-400 pt-0.5 text-right pr-1.5 select-none">
                      {hourFormatted}
                    </span>

                    {/* Columns for each active date */}
                    {activeDates.map((dateStr) => {
                      // Filter meetings starting in this hour on this date
                      const currentHourMeetings = meetings.filter((m) => {
                        const mDate = m.start_time.slice(0, 10);
                        if (mDate !== dateStr) return false;
                        const mHour = new Date(m.start_time).getUTCHours();
                        if (mHour !== hour) return false;

                        // Ghost filtering logic
                        if (m.is_ghost) {
                          if (!showGhosts) return false;
                          if (selectedGhostId !== 'all') {
                            const gids = (m.ghost_ids && m.ghost_ids.length > 0)
                              ? m.ghost_ids
                              : (m.ghost_id ? [m.ghost_id] : []);
                            if (!gids.includes(selectedGhostId)) return false;
                          }
                        }
                        return true;
                      });

                      // Filter scheduled tasks starting in this hour on this date
                      const currentHourTasks = tasks.filter((t) => {
                        if (t.scheduled_date !== dateStr) return false;
                        if (!t.scheduled_start) return false;
                        const taskHour = parseInt(t.scheduled_start.split(':')[0], 10);
                        return taskHour === hour;
                      });

                      return (
                        <div
                          key={dateStr}
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
                          className="relative min-h-[38px] rounded-lg p-1 bg-stone-50/40 border border-transparent hover:border-stone-200 transition group/slot"
                        >
                          {/* Add button on hover */}
                          <button
                            type="button"
                            onClick={() => setSlotPicker({ date: dateStr, hour })}
                            className="absolute right-1 top-1 opacity-0 group-hover/slot:opacity-100 p-0.5 bg-white hover:bg-indigo-50 text-stone-400 hover:text-indigo-600 rounded text-[9px] transition border border-stone-200 shadow-2xs z-10"
                            title={t.agendaAddSlotTitle}
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>

                          {/* Meeting Blocks */}
                          {currentHourMeetings.map((m) => {
                            const startTime = m.start_time.slice(11, 16);
                            const endTime = m.end_time.slice(11, 16);

                            if (m.is_ghost) {
                              // Ghost Event (Pastel translucent styling with dashed border)
                              return (
                                <div
                                  key={m.id}
                                  draggable={true}
                                  onDragStart={(e) => {
                                    e.dataTransfer.setData('text/meeting-id', m.id);
                                    e.dataTransfer.effectAllowed = 'move';
                                  }}
                                  onClick={() => onEditMeeting && onEditMeeting(m)}
                                  style={{ borderColor: m.color || '#f472b6' }}
                                  className="mb-1 p-1.5 rounded-lg text-xs border border-dashed bg-pink-50/80 text-pink-950 shadow-2xs relative overflow-hidden cursor-pointer hover:border-pink-500 hover:shadow-xs transition group/event"
                                >
                                  <div className="flex items-center justify-between font-medium text-pink-900">
                                    <span className="truncate flex items-center gap-1">
                                      <span title="External Ghost Calendar">👻</span>
                                      <span className="truncate hover:underline">{m.title}</span>
                                    </span>
                                    <div className="flex items-center gap-1 shrink-0 ml-1">
                                      <span className="text-[9px] font-mono text-pink-600">
                                        {startTime}–{endTime}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onEditMeeting && onEditMeeting(m);
                                        }}
                                        title={t.agendaEditEvent}
                                        className="opacity-0 group-hover/event:opacity-100 p-0.5 text-pink-400 hover:text-pink-700 rounded transition"
                                      >
                                        <Pencil className="w-2.5 h-2.5" />
                                      </button>
                                      {onDeleteMeeting && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteMeeting(m.id);
                                          }}
                                          title={t.agendaDeleteEvent}
                                          className="opacity-0 group-hover/event:opacity-100 p-0.5 text-pink-400 hover:text-rose-600 rounded transition"
                                        >
                                          <Trash2 className="w-2.5 h-2.5" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 text-[9px] text-pink-800/80 mt-0.5 flex-wrap">
                                    {(() => {
                                      const gids = (m.ghost_ids && m.ghost_ids.length > 0)
                                        ? m.ghost_ids
                                        : (m.ghost_id ? [m.ghost_id] : []);

                                      if (gids.length > 0) {
                                        return gids.map((gid) => {
                                          const g = ghosts.find((gh) => gh.id === gid);
                                          const gName = g?.name || m.ghost_name || 'Ghost';
                                          const gColor = g?.color || '#ec4899';
                                          return (
                                            <span
                                              key={gid}
                                              className="px-1.5 py-0.2 rounded font-medium border text-[9px] flex items-center gap-1 shadow-2xs"
                                              style={{
                                                backgroundColor: `${gColor}18`,
                                                borderColor: `${gColor}50`,
                                                color: gColor,
                                              }}
                                            >
                                              <span
                                                className="w-1.5 h-1.5 rounded-full"
                                                style={{ backgroundColor: gColor }}
                                              />
                                              <span>{gName}</span>
                                            </span>
                                          );
                                        });
                                      }

                                      return (
                                        <span className="px-1 py-0.2 rounded font-medium bg-pink-100 text-pink-700 border border-pink-200">
                                          {m.ghost_name || 'Ghost'}
                                        </span>
                                      );
                                    })()}
                                    {m.location && (
                                      <span className="flex items-center gap-0.5 truncate text-stone-400 ml-0.5">
                                        <MapPin className="w-2 h-2" />
                                        {m.location}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            }

                            // User's own primary meeting
                            return (
                              <div
                                key={m.id}
                                draggable={true}
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('text/meeting-id', m.id);
                                  e.dataTransfer.effectAllowed = 'move';
                                }}
                                onClick={() => onEditMeeting && onEditMeeting(m)}
                                className="mb-1 p-1.5 rounded-lg text-xs border border-indigo-200 bg-indigo-50/80 text-indigo-950 shadow-2xs cursor-pointer hover:border-indigo-400 hover:shadow-xs transition group/event"
                              >
                                <div className="flex items-center justify-between font-medium text-indigo-950">
                                  <span className="truncate hover:underline">{m.title}</span>
                                  <div className="flex items-center gap-1 shrink-0 ml-1">
                                    <span className="text-[9px] font-mono text-indigo-600">
                                      {startTime}–{endTime}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onEditMeeting && onEditMeeting(m);
                                      }}
                                      title={t.agendaEditEvent}
                                      className="opacity-0 group-hover/event:opacity-100 p-0.5 text-stone-400 hover:text-indigo-600 rounded transition"
                                    >
                                      <Pencil className="w-2.5 h-2.5" />
                                    </button>
                                    {onDeleteMeeting && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onDeleteMeeting(m.id);
                                        }}
                                        title={t.agendaDeleteEvent}
                                        className="opacity-0 group-hover/event:opacity-100 p-0.5 text-stone-400 hover:text-rose-600 rounded transition"
                                      >
                                        <Trash2 className="w-2.5 h-2.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                                {(m.location || m.meeting_url) && (
                                  <div className="flex items-center gap-1.5 text-[9px] text-stone-500 mt-0.5">
                                    {m.location && (
                                      <span className="flex items-center gap-0.5 truncate">
                                        <MapPin className="w-2 h-2" />
                                        {m.location}
                                      </span>
                                    )}
                                    {m.meeting_url && (
                                      <a
                                        href={m.meeting_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-indigo-600 hover:underline flex items-center gap-0.5 ml-auto shrink-0"
                                      >
                                        <ExternalLink className="w-2 h-2" />
                                        <span>{t.agendaJoin}</span>
                                      </a>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {/* Scheduled Task & Routine Blocks */}
                          {currentHourTasks.map((t) => {
                            const isRoutine = t.type === 'habit' || t.type === 'daily';
                            const isDone = Boolean(t.completed);
                            const isDimmed =
                              selectedProjectId &&
                              selectedProjectId !== 'all' &&
                              t.project_id !== selectedProjectId;

                            return (
                              <div
                                key={t.id}
                                draggable={true}
                                onClick={() => onEditTask(t)}
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('text/plain', t.id);
                                  e.dataTransfer.effectAllowed = 'move';
                                }}
                                className={`mb-1 p-1.5 rounded-lg text-xs border transition-all duration-200 cursor-pointer hover:shadow-xs active:cursor-grabbing ${getCardStyle(t, isDone)} ${
                                  isDimmed
                                    ? 'opacity-20 hover:opacity-90 grayscale-[35%] border-dashed shadow-none'
                                    : 'opacity-100 ring-1 ring-transparent'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  {/* Scoring / Action Button */}
                                  {t.type === 'habit' ? (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onScoreTask(t.id, 'up');
                                      }}
                                      className="p-0.5 rounded text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 transition shrink-0"
                                      title={`Increment habit counter (${t.counter_up || 0})`}
                                    >
                                      <Plus className="w-3 h-3 text-emerald-600" />
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onScoreTask(t.id, 'up');
                                      }}
                                      className="text-stone-400 hover:text-indigo-600 shrink-0"
                                      title={isDone ? 'Mark uncompleted' : 'Mark completed'}
                                    >
                                      {isDone ? (
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      ) : (
                                        <Circle className="w-3 h-3" />
                                      )}
                                    </button>
                                  )}

                                  {/* Title */}
                                  <span
                                    className="font-medium truncate flex-1 hover:underline text-[11px]"
                                  >
                                    {t.title}
                                  </span>

                                  {/* Project Badge */}
                                  {t.project_name && (
                                    <span
                                      className="px-1 py-0.2 rounded text-[8px] font-semibold border truncate max-w-[65px]"
                                      style={{
                                        backgroundColor: `${t.project_color || '#6366f1'}15`,
                                        color: t.project_color || '#6366f1',
                                        borderColor: `${t.project_color || '#6366f1'}30`,
                                      }}
                                    >
                                      {t.project_name}
                                    </span>
                                  )}

                                  {/* Start Time & Duration */}
                                  <span className="text-[9px] font-mono text-stone-500 shrink-0">
                                    {t.scheduled_start} ({t.scheduled_duration}m)
                                  </span>

                                  {/* Unschedule */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onUnscheduleTask(t.id);
                                    }}
                                    className="text-stone-400 hover:text-rose-600 p-0.5 rounded shrink-0"
                                    title="Unschedule"
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                </div>

                                {/* Routine Metadata & Indicators Bar */}
                                {isRoutine && (
                                  <div className="flex flex-wrap items-center gap-1 mt-1 pt-1 border-t border-stone-200/50">
                                    {/* Routine Badge */}
                                    <span className="px-1.5 py-0.2 rounded text-[8px] font-semibold bg-emerald-100/90 text-emerald-800 border border-emerald-200 flex items-center gap-0.5 shrink-0">
                                      {getRoutineIcon(t.time_of_day)}
                                      <span>{t.routineBadge}</span>
                                    </span>

                                    {/* Time of Day Pill */}
                                    {t.time_of_day && t.time_of_day !== 'anytime' && (
                                      <span
                                        className={`px-1.5 py-0.2 rounded text-[8px] font-semibold border shrink-0 uppercase tracking-wider ${
                                          t.time_of_day === 'morning'
                                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                                            : t.time_of_day === 'workday'
                                            ? 'bg-sky-100 text-sky-800 border-sky-200'
                                            : 'bg-purple-100 text-purple-800 border-purple-200'
                                        }`}
                                      >
                                        {t.time_of_day}
                                      </span>
                                    )}

                                    {/* Streak Counter for Dailies */}
                                    {t.type === 'daily' && (t.streak || 0) > 0 && (
                                      <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-amber-100/90 text-amber-900 border border-amber-300/80 flex items-center gap-0.5 shrink-0">
                                        <Flame className="w-2.5 h-2.5 text-amber-600 fill-amber-500" />
                                        <span>{t.streak}d streak</span>
                                      </span>
                                    )}

                                    {/* Counter Display for Habits */}
                                    {t.type === 'habit' && (
                                      <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-indigo-100/80 text-indigo-800 border border-indigo-200 flex items-center gap-0.5 shrink-0 font-mono">
                                        <Zap className="w-2.5 h-2.5 text-indigo-600" />
                                        <span>{t.counter_up || 0} logged</span>
                                      </span>
                                    )}
                                  </div>
                                )}

                                {/* Subtasks Progress */}
                                {t.subtasks && t.subtasks.length > 0 && (
                                  <div className="mt-1 pt-1 border-t border-stone-200/50 flex items-center justify-between text-[9px] text-stone-600">
                                    <div className="flex items-center gap-1 font-medium">
                                      <CheckSquare className="w-2.5 h-2.5 text-stone-400" />
                                      <span>
                                        {t.subtasks.filter((s) => s.completed).length}/{t.subtasks.length} subtasks
                                      </span>
                                    </div>
                                    <div className="w-14 h-1.5 bg-stone-200/80 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                                        style={{
                                          width: `${Math.round(
                                            (t.subtasks.filter((s) => s.completed).length / t.subtasks.length) * 100
                                          )}%`,
                                        }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
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
                  return (
                    <div
                      key={t.id}
                      draggable={true}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', t.id);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      className={`p-2 rounded-xl text-xs transition shadow-2xs cursor-grab active:cursor-grabbing border ${
                        isRoutine
                          ? 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-300'
                          : 'bg-stone-50 border-stone-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-center justify-between font-medium text-stone-900 mb-1">
                        <span className="truncate flex items-center gap-1">
                          {isRoutine && <Sprout className="w-2.5 h-2.5 text-emerald-600 shrink-0" />}
                          <span className="truncate">{t.title}</span>
                        </span>
                        <span
                          className={`text-[8px] px-1 py-0.2 rounded uppercase font-semibold ${
                            t.difficulty === 'hard'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : t.difficulty === 'medium'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {t.difficulty}
                        </span>
                      </div>

                      {t.project_name && (
                        <div className="mb-1">
                          <span
                            className="px-1.5 py-0.2 rounded text-[8px] font-medium border"
                            style={{
                              backgroundColor: `${t.project_color || '#6366f1'}15`,
                              color: t.project_color || '#6366f1',
                              borderColor: `${t.project_color || '#6366f1'}30`,
                            }}
                          >
                            ● {t.project_name}
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
                          {t.type === 'daily' && t.streak > 0 && (
                            <span className="text-amber-700 font-bold">🔥{t.streak}d</span>
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
