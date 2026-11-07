import React, { useState, useEffect, useMemo } from 'react';
import { Task, TaskType, DifficultyTier, HabitResetPeriod, DailyFrequency, Project, TimeOfDay } from '../types';
import { DIFFICULTY_LIST, DIFFICULTY_CONFIGS } from '../utils/difficulty';
import { useTranslation } from '../i18n/I18nContext';
import { X, Plus, Trash2, Calendar, Clock, CheckSquare, Sparkles, Tag, ArrowRight, FolderPlus } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: any) => Promise<void>;
  onDelete?: (taskId: string) => Promise<void>;
  initialTask?: Task | null;
  defaultType?: TaskType;
  defaultScheduledDate?: string;
  defaultScheduledStart?: string;
  defaultDueDate?: string;
  defaultTimeOfDay?: TimeOfDay;
  projects?: Project[];
  onCreateProject?: (name: string, color: string) => Promise<string | undefined>;
  existingHabits?: Task[];
}

const WEEKDAYS = [
  { label: 'Su', value: 0 },
  { label: 'Mo', value: 1 },
  { label: 'Tu', value: 2 },
  { label: 'We', value: 3 },
  { label: 'Th', value: 4 },
  { label: 'Fr', value: 5 },
  { label: 'Sa', value: 6 },
];

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialTask,
  defaultType = 'todo',
  defaultScheduledDate,
  defaultScheduledStart,
  defaultDueDate,
  defaultTimeOfDay,
  projects = [],
  onCreateProject,
  existingHabits = [],
}) => {
  const { t } = useTranslation();

  const getDifficultyInfo = (tier: DifficultyTier) => {
    switch (tier) {
      case 'trivial':
        return { label: t.diffTierTrivialLabel, hint: t.diffTierTrivialHint };
      case 'easy':
        return { label: t.diffTierEasyLabel, hint: t.diffTierEasyHint };
      case 'medium':
        return { label: t.diffTierMediumLabel, hint: t.diffTierMediumHint };
      case 'hard':
        return { label: t.diffTierHardLabel, hint: t.diffTierHardHint };
      default:
        return { label: '', hint: '' };
    }
  };

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setConfirmDelete(false);
  }, [isOpen, initialTask]);

  const handleDelete = async () => {
    if (!initialTask || !onDelete) return;
    setDeleting(true);
    try {
      await onDelete(initialTask.id);
      onClose();
    } catch (err) {
      console.error('Failed to delete task:', err);
    } finally {
      setDeleting(false);
    }
  };

  // Escape key listener for keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Simplified choice: 'habit' (recurring) or 'task' (to-do)
  const [kind, setKind] = useState<'habit' | 'task'>(
    defaultType === 'habit' || defaultType === 'daily' ? 'habit' : 'task'
  );

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyTier>('easy');
  const diffInfo = getDifficultyInfo(difficulty);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('anytime');
  const [tagsInput, setTagsInput] = useState('');
  const [projectId, setProjectId] = useState<string>('');

  // Inline project creation
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjColor, setNewProjColor] = useState('#6366f1');
  const [creatingProject, setCreatingProject] = useState(false);

  // Habit settings
  const [periodicity, setPeriodicity] = useState<'daily' | 'weekdays' | 'custom_days' | 'counter_only'>('daily');
  const [repeatDays, setRepeatDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [habitPositive, setHabitPositive] = useState(true);
  const [habitNegative, setHabitNegative] = useState(false);
  const [anchorTaskId, setAnchorTaskId] = useState<string>('');
  const [anchorHabitTitle, setAnchorHabitTitle] = useState<string>('');
  const [microHabitTitle, setMicroHabitTitle] = useState<string>('');

  // Task settings: 'none' | 'today' | 'custom'
  const [taskTimelineMode, setTaskTimelineMode] = useState<'none' | 'today' | 'custom'>('none');
  const [dueDate, setDueDate] = useState('');
  const [startDate, setStartDate] = useState('');

  // Agenda Time-blocking
  const [enableAgenda, setEnableAgenda] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledStart, setScheduledStart] = useState('09:00');
  const [scheduledDuration, setScheduledDuration] = useState(30);

  // Subtasks
  const [subtasks, setSubtasks] = useState<{ id?: string; title: string; completed?: number }[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const todayStr = new Date().toISOString().slice(0, 10);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }, []);

  useEffect(() => {
    if (initialTask) {
      const isHabit = initialTask.type === 'habit' || initialTask.type === 'daily';
      setKind(isHabit ? 'habit' : 'task');
      setTitle(initialTask.title);
      setNotes(initialTask.notes || '');
      setDifficulty(initialTask.difficulty);
      setTimeOfDay(initialTask.time_of_day || 'anytime');
      setTagsInput(initialTask.tags?.join(', ') || '');
      setProjectId(initialTask.project_id || '');

      setHabitPositive(Boolean(initialTask.habit_positive));
      setHabitNegative(Boolean(initialTask.habit_negative));
      setAnchorTaskId(initialTask.anchor_task_id || '');
      setAnchorHabitTitle(initialTask.anchor_habit_title || '');
      setMicroHabitTitle(initialTask.micro_habit_title || '');

      if (initialTask.frequency === 'daily') {
        setPeriodicity('daily');
      } else if (initialTask.frequency === 'weekly') {
        const days = initialTask.repeat_days || [];
        if (days.length === 5 && [1, 2, 3, 4, 5].every((d) => days.includes(d))) {
          setPeriodicity('weekdays');
        } else {
          setPeriodicity('custom_days');
        }
        setRepeatDays(days);
      } else if (initialTask.type === 'habit') {
        setPeriodicity('counter_only');
      }

      if (initialTask.due_date) {
        if (initialTask.due_date.slice(0, 10) === todayStr) {
          setTaskTimelineMode('today');
        } else {
          setTaskTimelineMode('custom');
        }
        setDueDate(initialTask.due_date);
        setStartDate(initialTask.start_date || '');
      } else {
        setTaskTimelineMode('none');
        setDueDate('');
        setStartDate('');
      }

      if (initialTask.scheduled_date) {
        setEnableAgenda(true);
        setScheduledDate(initialTask.scheduled_date);
        setScheduledStart(initialTask.scheduled_start || '09:00');
        setScheduledDuration(initialTask.scheduled_duration || 30);
      } else {
        setEnableAgenda(false);
        setScheduledDate('');
        setScheduledStart('09:00');
        setScheduledDuration(30);
      }

      setSubtasks(initialTask.subtasks || []);
    } else {
      setKind(defaultType === 'habit' || defaultType === 'daily' ? 'habit' : 'task');
      setTitle('');
      setNotes('');
      setDifficulty('easy');
      setTimeOfDay(defaultTimeOfDay || 'anytime');
      setTagsInput('');
      setProjectId('');
      setPeriodicity('daily');
      setRepeatDays([1, 2, 3, 4, 5]);
      setHabitPositive(true);
      setHabitNegative(false);
      setAnchorTaskId('');
      setAnchorHabitTitle('');
      setMicroHabitTitle('');

      if (defaultScheduledDate) {
        setTaskTimelineMode(defaultScheduledDate === todayStr ? 'today' : 'custom');
        setDueDate(defaultScheduledDate);
        setEnableAgenda(true);
        setScheduledDate(defaultScheduledDate);
        setScheduledStart(defaultScheduledStart || '09:00');
        setScheduledDuration(30);
      } else if (defaultDueDate) {
        setTaskTimelineMode(defaultDueDate === todayStr ? 'today' : 'custom');
        setDueDate(defaultDueDate);
        setEnableAgenda(false);
        setScheduledDate('');
        setScheduledStart('09:00');
        setScheduledDuration(30);
      } else {
        setTaskTimelineMode('none');
        setDueDate('');
        setStartDate('');
        setEnableAgenda(false);
        setScheduledDate('');
        setScheduledStart('09:00');
        setScheduledDuration(30);
      }
      setSubtasks([]);
    }
  }, [initialTask, defaultType, defaultScheduledDate, defaultScheduledStart, defaultDueDate, defaultTimeOfDay, isOpen]);

  if (!isOpen) return null;

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks([...subtasks, { title: newSubtaskTitle.trim(), completed: 0 }]);
    setNewSubtaskTitle('');
  };

  const handleRemoveSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, idx) => idx !== index));
  };

  const toggleWeekday = (day: number) => {
    if (repeatDays.includes(day)) {
      if (repeatDays.length > 1) {
        setRepeatDays(repeatDays.filter((d) => d !== day));
      }
    } else {
      setRepeatDays([...repeatDays, day].sort());
    }
  };

  const handleQuickCreateProject = async () => {
    if (!newProjName.trim() || !onCreateProject) return;
    setCreatingProject(true);
    try {
      const createdId = await onCreateProject(newProjName.trim(), newProjColor);
      if (createdId) {
        setProjectId(createdId);
        setNewProjName('');
        setShowNewProject(false);
      }
    } finally {
      setCreatingProject(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const payload: any = {
      title: title.trim(),
      notes: notes.trim(),
      difficulty,
      time_of_day: timeOfDay,
      tags: parsedTags,
      subtasks,
      project_id: projectId || null,
    };

    if (kind === 'habit') {
      if (periodicity === 'counter_only') {
        payload.type = 'habit';
        payload.habit_positive = habitPositive;
        payload.habit_negative = habitNegative;
        payload.habit_reset_period = 'daily';
      } else {
        payload.type = 'daily';
        payload.habit_positive = habitPositive;
        payload.habit_negative = habitNegative;
        if (periodicity === 'daily') {
          payload.frequency = 'daily';
          payload.repeat_days = [0, 1, 2, 3, 4, 5, 6];
        } else if (periodicity === 'weekdays') {
          payload.frequency = 'weekly';
          payload.repeat_days = [1, 2, 3, 4, 5];
        } else if (periodicity === 'custom_days') {
          payload.frequency = 'weekly';
          payload.repeat_days = repeatDays;
        }
      }

      // Agenda Time-Blocking for habits without converting to tasks
      if (enableAgenda && scheduledDate) {
        payload.scheduled_date = scheduledDate;
        payload.scheduled_start = scheduledStart;
        payload.scheduled_duration = scheduledDuration;
      } else {
        payload.scheduled_date = null;
        payload.scheduled_start = null;
      }

      // Habit Stacking (BJ Fogg Cue Anchoring)
      payload.anchor_task_id = anchorTaskId || null;
      payload.anchor_habit_title = anchorHabitTitle.trim() || '';
      payload.micro_habit_title = microHabitTitle.trim() || '';
    } else {
      // One-off Task
      payload.type = 'todo';
      if (taskTimelineMode === 'today') {
        payload.due_date = todayStr;
        payload.start_date = null;
      } else if (taskTimelineMode === 'custom' && dueDate) {
        payload.due_date = dueDate;
        payload.start_date = startDate || null;
      } else {
        payload.due_date = null;
        payload.start_date = null;
      }

      if (enableAgenda && scheduledDate) {
        payload.scheduled_date = scheduledDate;
        payload.scheduled_start = scheduledStart;
        payload.scheduled_duration = scheduledDuration;
      } else {
        payload.scheduled_date = null;
        payload.scheduled_start = null;
      }
    }

    try {
      await onSave(payload);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white border border-stone-200 rounded-2xl shadow-xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/60">
          <span className="font-semibold text-base text-stone-800">
            {initialTask ? t.modalEditItemTitle : t.modalNewItemTitle}
          </span>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-stone-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {/* Simple Habit vs Task Pill Tabs */}
          <div>
            <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 rounded-xl">
              <button
                type="button"
                onClick={() => setKind('habit')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition ${
                  kind === 'habit'
                    ? 'bg-white text-emerald-800 shadow-xs border border-stone-200/80'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                {t.itemTabHabit}
              </button>
              <button
                type="button"
                onClick={() => setKind('task')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition ${
                  kind === 'task'
                    ? 'bg-white text-indigo-800 shadow-xs border border-stone-200/80'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                {t.itemTabTask}
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">{t.itemTitleLabel}</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={kind === 'habit' ? t.itemTitlePlaceholderHabit : t.itemTitlePlaceholderTask}
              className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />

            {/* Quick Executive Preset Chips (< 5s initiation barrier) */}
            <div className="flex items-center gap-1.5 flex-wrap mt-2">
              <span className="text-[10px] uppercase font-bold text-stone-400 mr-1 select-none">Quick:</span>
              <button
                type="button"
                onClick={() => {
                  setDifficulty('trivial');
                  setScheduledDuration(15);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                  difficulty === 'trivial'
                    ? 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-200 border-sky-300'
                    : 'bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:bg-stone-100'
                }`}
                title="15 min small starter task"
              >
                ⚡ 15m XS
              </button>
              <button
                type="button"
                onClick={() => {
                  setDifficulty('easy');
                  setScheduledDuration(30);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                  difficulty === 'easy'
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border-emerald-300'
                    : 'bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:bg-stone-100'
                }`}
                title="30 min standard task"
              >
                🎯 30m S
              </button>
              <button
                type="button"
                onClick={() => {
                  setTaskTimelineMode('today');
                  setDueDate(todayStr);
                  setScheduledDate(todayStr);
                  setEnableAgenda(true);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                  scheduledDate === todayStr || (taskTimelineMode === 'today' && !scheduledDate)
                    ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200 border-indigo-300'
                    : 'bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:bg-stone-100'
                }`}
                title="Schedule for Today"
              >
                📅 Today
              </button>
              <button
                type="button"
                onClick={() => {
                  setTaskTimelineMode('custom');
                  setDueDate(tomorrowStr);
                  setScheduledDate(tomorrowStr);
                  setEnableAgenda(true);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                  scheduledDate === tomorrowStr
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border-amber-300'
                    : 'bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:bg-stone-100'
                }`}
                title="Schedule for Tomorrow"
              >
                ⏩ Tomorrow
              </button>
            </div>
          </div>

          {/* Project Selector (Link habits and tasks together!) */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1 flex items-center justify-between">
              <span>{t.itemProjectHeader}</span>
              <button
                type="button"
                onClick={() => setShowNewProject(!showNewProject)}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium"
              >
                <FolderPlus className="w-3 h-3" />
                <span>{showNewProject ? t.cancelBtn : t.itemNewProjectBtn}</span>
              </button>
            </label>

            {showNewProject ? (
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                <div className="grid grid-cols-[1fr_50px] gap-2">
                  <input
                    type="text"
                    value={newProjName}
                    onChange={(e) => setNewProjName(e.target.value)}
                    placeholder={t.itemNewProjectPlaceholder}
                    className="bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-indigo-500"
                  />
                  <input
                    type="color"
                    value={newProjColor}
                    onChange={(e) => setNewProjColor(e.target.value)}
                    className="w-full h-8 rounded-lg border border-stone-300 cursor-pointer p-0.5 bg-white"
                    title="Project color"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleQuickCreateProject}
                  disabled={creatingProject || !newProjName.trim()}
                  className="w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition disabled:opacity-50"
                >
                  {creatingProject ? t.itemProjectCreating : t.itemCreateSelectProjectBtn}
                </button>
              </div>
            ) : (
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-none focus:border-indigo-500"
              >
                <option value="">{t.itemNoProjectOption}</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    ● {p.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">{t.itemNotesLabelOptional}</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.itemNotesPlaceholder}
              className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 resize-none"
            />
          </div>

          {/* Task Size & Estimated Duration (XS / S / M / L) */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span>{t.itemTaskSizeLabel}</span>
                <span className="text-[10px] text-stone-500 font-normal">{t.itemEstimatedDuration}</span>
              </span>
              <span className="text-[11px] font-normal text-stone-500">
                {diffInfo.label} · {diffInfo.hint} ({DIFFICULTY_CONFIGS[difficulty]?.durationHint})
              </span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {DIFFICULTY_LIST.map((tier) => {
                const isSelected = difficulty === tier.id;
                return (
                  <button
                    type="button"
                    key={tier.id}
                    onClick={() => setDifficulty(tier.id)}
                    className={`py-2 px-1.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-0.5 ${
                      isSelected
                        ? tier.selectedClass
                        : tier.unselectedClass
                    }`}
                  >
                    <span className="text-sm font-extrabold leading-none tracking-tight select-none">
                      {tier.sizeLabel}
                    </span>
                    <span className="text-[10px] font-medium opacity-80">
                      {tier.durationHint}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time of Day (Pastel Pills) */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span>{t.itemTimeOfDayLabel}</span>
                <span className="text-[10px] text-stone-400 font-normal">{t.itemTimeOfDaySub}</span>
              </span>
              <span className="text-[11px] font-normal text-stone-400">
                {timeOfDay === 'morning' && t.itemTimeOfDayHintMorning}
                {timeOfDay === 'workday' && t.itemTimeOfDayHintWorkday}
                {timeOfDay === 'evening' && t.itemTimeOfDayHintEvening}
                {timeOfDay === 'anytime' && t.itemTimeOfDayHintAnytime}
              </span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                {
                  id: 'morning' as TimeOfDay,
                  label: t.timeOfDayMorning,
                  icon: '☀️',
                  activeClass: 'bg-amber-50 text-amber-800 border-amber-300 ring-2 ring-amber-200 shadow-xs',
                },
                {
                  id: 'workday' as TimeOfDay,
                  label: t.timeOfDayWorkday,
                  icon: '💼',
                  activeClass: 'bg-sky-50 text-sky-800 border-sky-300 ring-2 ring-sky-200 shadow-xs',
                },
                {
                  id: 'evening' as TimeOfDay,
                  label: t.timeOfDayEvening,
                  icon: '🌙',
                  activeClass: 'bg-purple-50 text-purple-800 border-purple-300 ring-2 ring-purple-200 shadow-xs',
                },
                {
                  id: 'anytime' as TimeOfDay,
                  label: t.timeOfDayAnytime,
                  icon: '✨',
                  activeClass: 'bg-stone-100 text-stone-800 border-stone-300 ring-2 ring-stone-200 shadow-xs',
                },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setTimeOfDay(opt.id)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-semibold border text-center transition flex items-center justify-center gap-1.5 ${
                    timeOfDay === opt.id
                      ? opt.activeClass
                      : 'bg-stone-50 border-stone-200 text-stone-500 hover:bg-stone-100 hover:text-stone-700'
                  }`}
                >
                  <span>{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* KIND: HABIT SPECIFIC */}
          {kind === 'habit' && (
            <div className="p-4 bg-emerald-50/40 border border-emerald-100 rounded-xl space-y-3">
              <label className="block text-xs font-semibold text-emerald-900">{t.periodicityTitle}</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'daily', label: t.periodEveryDay },
                  { id: 'weekdays', label: t.periodWeekdays },
                  { id: 'custom_days', label: t.periodSpecificDays },
                  { id: 'counter_only', label: t.periodFlexibleCounter },
                ].map((opt) => (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => setPeriodicity(opt.id as any)}
                    className={`py-1.5 px-2.5 rounded-lg border text-left font-medium transition ${
                      periodicity === opt.id
                        ? 'bg-white border-emerald-400 text-emerald-900 shadow-xs'
                        : 'bg-white/60 border-stone-200 text-stone-600 hover:bg-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {periodicity === 'custom_days' && (
                <div className="pt-2">
                  <div className="flex gap-1">
                    {(t.weekdaysShort || WEEKDAYS).map((wd) => {
                      const active = repeatDays.includes(wd.value);
                      return (
                        <button
                          type="button"
                          key={wd.value}
                          onClick={() => toggleWeekday(wd.value)}
                          className={`flex-1 py-1 rounded-md text-xs font-semibold border text-center transition ${
                            active
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'bg-white border-stone-200 text-stone-500 hover:border-emerald-300'
                          }`}
                        >
                          {wd.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Optional +/- Counter Buttons */}
              <div className="pt-2 border-t border-emerald-200/50 flex items-center justify-between">
                <span className="text-xs text-stone-600 font-medium">{t.counterButtonsLabel}</span>
                <div className="flex gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={habitPositive}
                      onChange={(e) => setHabitPositive(e.target.checked)}
                      className="rounded border-stone-300 text-emerald-600 focus:ring-0"
                    />
                    <span>{t.counterPositive}</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={habitNegative}
                      onChange={(e) => setHabitNegative(e.target.checked)}
                      className="rounded border-stone-300 text-rose-600 focus:ring-0"
                    />
                    <span>{t.counterNegative}</span>
                  </label>
                </div>
              </div>

              {/* Unlocked Agenda Time-Blocking for Habits */}
              <div className="pt-2.5 border-t border-emerald-200/50">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableAgenda}
                    onChange={(e) => {
                      setEnableAgenda(e.target.checked);
                      if (e.target.checked && !scheduledDate) {
                        setScheduledDate(defaultScheduledDate || todayStr);
                      }
                    }}
                    className="rounded border-stone-300 text-emerald-600 focus:ring-0"
                  />
                  <div className="flex items-center justify-between flex-1">
                    <span className="text-xs font-semibold text-emerald-950 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{t.blockAgendaSlotLabel}</span>
                    </span>
                    <span className="text-[10px] text-emerald-700 font-medium bg-emerald-100/70 px-2 py-0.5 rounded-md">
                      {t.routineSlotBadge}
                    </span>
                  </div>
                </label>

                {enableAgenda && (
                  <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-emerald-100">
                    <div>
                      <label className="block text-[10px] text-stone-600 font-medium mb-0.5">{t.labelDate}</label>
                      <input
                        type="date"
                        value={scheduledDate || todayStr}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs text-stone-800 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-stone-600 font-medium mb-0.5">{t.labelStartTime}</label>
                      <input
                        type="time"
                        value={scheduledStart}
                        onChange={(e) => setScheduledStart(e.target.value)}
                        className="w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs text-stone-800 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-stone-600 font-medium mb-0.5">{t.labelDuration}</label>
                      <select
                        value={scheduledDuration}
                        onChange={(e) => setScheduledDuration(Number(e.target.value))}
                        className="w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs text-stone-800 focus:outline-none focus:border-emerald-500"
                      >
                        <option value={15}>15m</option>
                        <option value={30}>30m</option>
                        <option value={45}>45m</option>
                        <option value={60}>1h</option>
                        <option value={90}>1.5h</option>
                        <option value={120}>2h</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Habit Stacking (BJ Fogg Cue Anchoring: "After [Anchor], I will [Routine]") */}
              <div className="pt-2.5 border-t border-emerald-200/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-950 dark:text-emerald-300 flex items-center gap-1.5">
                    <span>🔗</span>
                    <span>Habit Stacking (BJ Fogg Anchor)</span>
                  </span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                    "After [Anchor], I will [Routine]"
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {existingHabits && existingHabits.length > 0 && (
                    <div>
                      <label className="text-[10px] font-semibold text-stone-500 block mb-1">Select existing routine:</label>
                      <select
                        value={anchorTaskId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAnchorTaskId(val);
                          const match = existingHabits.find((h) => h.id === val);
                          if (match) setAnchorHabitTitle(match.title);
                          else if (!val) setAnchorHabitTitle('');
                        }}
                        className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-2 py-1.5 text-xs text-stone-800 dark:text-stone-100"
                      >
                        <option value="">No anchor (Independent habit)</option>
                        {existingHabits
                          .filter((h) => h.id !== initialTask?.id)
                          .map((h) => (
                            <option key={h.id} value={h.id}>
                              After: {h.title}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="text-[10px] font-semibold text-stone-500 block mb-1">Or type a sensory anchor cue:</label>
                    <input
                      type="text"
                      value={anchorHabitTitle}
                      onChange={(e) => {
                        setAnchorHabitTitle(e.target.value);
                        if (anchorTaskId) setAnchorTaskId('');
                      }}
                      placeholder="e.g. Pouring morning coffee, Shutting laptop..."
                      className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-2.5 py-1.5 text-xs text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500"
                    />
                  </div>
                </div>
              </div>

              {/* Micro-Habit / Starter Step (BJ Fogg "Tiny Habits" Minimum Viable Routine) */}
              <div className="pt-2.5 border-t border-emerald-200/50 dark:border-emerald-800/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-950 dark:text-emerald-300 flex items-center gap-1.5">
                    <span>🌱</span>
                    <span>Micro-Habit (Starter Step)</span>
                  </span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                    Minimum Viable Routine (&lt; 30 seconds)
                  </span>
                </div>
                <input
                  type="text"
                  value={microHabitTitle}
                  onChange={(e) => setMicroHabitTitle(e.target.value)}
                  placeholder="e.g. Put on running shoes, or read 1 sentence"
                  className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-2.5 py-1.5 text-xs text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500"
                />
              </div>
            </div>
          )}

          {/* KIND: TASK SPECIFIC */}
          {kind === 'task' && (
            <div className="p-4 bg-indigo-50/40 border border-indigo-100 rounded-xl space-y-3">
              <label className="block text-xs font-semibold text-indigo-900">{t.timelineTitle}</label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setTaskTimelineMode('none');
                    setDueDate('');
                  }}
                  className={`py-1.5 px-2.5 rounded-lg border text-center font-medium transition ${
                    taskTimelineMode === 'none'
                      ? 'bg-white border-indigo-400 text-indigo-900 shadow-xs font-semibold'
                      : 'bg-white/60 border-stone-200 text-stone-600 hover:bg-white'
                  }`}
                >
                  {t.timelineNone}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTaskTimelineMode('today');
                    setDueDate(todayStr);
                  }}
                  className={`py-1.5 px-2.5 rounded-lg border text-center font-medium transition ${
                    taskTimelineMode === 'today'
                      ? 'bg-white border-indigo-400 text-indigo-900 shadow-xs font-semibold'
                      : 'bg-white/60 border-stone-200 text-stone-600 hover:bg-white'
                  }`}
                >
                  {t.timelineToday}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTaskTimelineMode('custom');
                    if (!dueDate) setDueDate(todayStr);
                  }}
                  className={`py-1.5 px-2.5 rounded-lg border text-center font-medium transition ${
                    taskTimelineMode === 'custom'
                      ? 'bg-white border-indigo-400 text-indigo-900 shadow-xs font-semibold'
                      : 'bg-white/60 border-stone-200 text-stone-600 hover:bg-white'
                  }`}
                >
                  {t.timelineCustom}
                </button>
              </div>

              {taskTimelineMode === 'custom' && (
                <div className="pt-2">
                  <label className="block text-[11px] font-medium text-stone-600 mb-1">{t.itemDueDateLabel}</label>
                  <input
                    type="date"
                    required={taskTimelineMode === 'custom'}
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {/* Time-Block on Agenda Option */}
              {taskTimelineMode !== 'none' && (
                <div className="pt-2 border-t border-indigo-200/50">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableAgenda}
                      onChange={(e) => {
                        setEnableAgenda(e.target.checked);
                        if (e.target.checked && !scheduledDate) {
                          setScheduledDate(dueDate || todayStr);
                        }
                      }}
                      className="rounded border-stone-300 text-indigo-600 focus:ring-0"
                    />
                    <span className="text-xs font-medium text-stone-700">{t.blockAgendaSlotLabel}</span>
                  </label>

                  {enableAgenda && (
                    <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-indigo-100">
                      <div>
                        <label className="block text-[10px] text-stone-500 mb-0.5">{t.labelDate}</label>
                        <input
                          type="date"
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          className="w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs text-stone-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-stone-500 mb-0.5">{t.labelStartTime}</label>
                        <input
                          type="time"
                          value={scheduledStart}
                          onChange={(e) => setScheduledStart(e.target.value)}
                          className="w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs text-stone-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-stone-500 mb-0.5">{t.labelDuration}</label>
                        <select
                          value={scheduledDuration}
                          onChange={(e) => setScheduledDuration(Number(e.target.value))}
                          className="w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs text-stone-800"
                        >
                          <option value={15}>15m</option>
                          <option value={30}>30m</option>
                          <option value={45}>45m</option>
                          <option value={60}>1h</option>
                          <option value={90}>1.5h</option>
                          <option value={120}>2h</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Subtasks (Checklist) */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1.5 flex items-center justify-between">
              <span>{t.checklistTitle(subtasks.length)}</span>
            </label>

            {subtasks.length > 0 && (
              <div className="space-y-1.5 mb-2">
                {subtasks.map((sub, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-1.5 px-3 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-700"
                  >
                    <span className="truncate">{sub.title}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(idx)}
                      className="text-stone-400 hover:text-rose-600 p-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                placeholder={t.checklistPlaceholder}
                className="flex-1 bg-white border border-stone-300 rounded-xl px-3 py-1.5 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-medium transition"
              >
                {t.checklistAddBtn}
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
            {initialTask && onDelete ? (
              confirmDelete ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition shadow-xs flex items-center gap-1 disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{deleting ? '...' : (t.confirmDeleteBtn || 'Confirm Delete')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-2.5 py-1.5 text-xs text-stone-500 hover:text-stone-800 transition"
                  >
                    {t.cancelBtn || 'Cancel'}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="px-2.5 py-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition flex items-center gap-1 font-medium"
                  title="Delete this task permanently"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t.deleteTaskBtn || 'Delete Task'}</span>
                </button>
              )
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-stone-500 hover:text-stone-800 rounded-xl transition"
              >
                {t.cancelBtn || 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition disabled:opacity-50"
              >
                {saving ? '...' : (t.saveBtn || 'Save')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
