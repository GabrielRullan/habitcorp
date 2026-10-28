import React, { useState, useEffect } from 'react';
import { Task, TaskType, DifficultyTier, HabitResetPeriod, DailyFrequency, Project, TimeOfDay } from '../types';
import { X, Plus, Trash2, Calendar, Clock, CheckSquare, Sparkles, Tag, ArrowRight, FolderPlus } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: any) => Promise<void>;
  initialTask?: Task | null;
  defaultType?: TaskType;
  defaultScheduledDate?: string;
  defaultScheduledStart?: string;
  defaultDueDate?: string;
  defaultTimeOfDay?: TimeOfDay;
  projects?: Project[];
  onCreateProject?: (name: string, color: string) => Promise<string | undefined>;
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
  initialTask,
  defaultType = 'todo',
  defaultScheduledDate,
  defaultScheduledStart,
  defaultDueDate,
  defaultTimeOfDay,
  projects = [],
  onCreateProject,
}) => {
  // Simplified choice: 'habit' (recurring) or 'task' (to-do)
  const [kind, setKind] = useState<'habit' | 'task'>(
    defaultType === 'habit' || defaultType === 'daily' ? 'habit' : 'task'
  );

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyTier>('easy');
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
            {initialTask ? 'Edit Item' : kind === 'habit' ? 'New Habit' : 'New Task'}
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
                🌱 Habit (Recurring)
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
                ✓ Task (To-Do)
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={kind === 'habit' ? 'e.g. Daily 20m Anki flashcards or Drink 2L water' : 'e.g. Complete chapter 4 exercise'}
              className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Project Selector (Link habits and tasks together!) */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1 flex items-center justify-between">
              <span>Project (Link Habits & Tasks)</span>
              <button
                type="button"
                onClick={() => setShowNewProject(!showNewProject)}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium"
              >
                <FolderPlus className="w-3 h-3" />
                <span>{showNewProject ? 'Cancel' : '+ New Project'}</span>
              </button>
            </label>

            {showNewProject ? (
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                <div className="grid grid-cols-[1fr_50px] gap-2">
                  <input
                    type="text"
                    value={newProjName}
                    onChange={(e) => setNewProjName(e.target.value)}
                    placeholder="Project name (e.g. Chinese learning)"
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
                  {creatingProject ? 'Creating...' : 'Create & Select Project'}
                </button>
              </div>
            ) : (
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-none focus:border-indigo-500"
              >
                <option value="">No Project (Standalone)</option>
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
            <label className="block text-xs font-semibold text-stone-600 mb-1">Notes (Optional)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add details, links, or context..."
              className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 resize-none"
            />
          </div>

          {/* Difficulty (Pastel Pills) */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1.5 flex items-center justify-between">
              <span>Difficulty</span>
              <span className="text-[11px] font-normal text-stone-400">Effort level</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'trivial', label: 'Trivial', color: 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-emerald-200' },
                { id: 'easy', label: 'Easy', color: 'bg-sky-50 text-sky-700 border-sky-300 ring-sky-200' },
                { id: 'medium', label: 'Medium', color: 'bg-amber-50 text-amber-700 border-amber-300 ring-amber-200' },
                { id: 'hard', label: 'Hard', color: 'bg-rose-50 text-rose-700 border-rose-300 ring-rose-200' },
              ].map((tier) => (
                <button
                  type="button"
                  key={tier.id}
                  onClick={() => setDifficulty(tier.id as DifficultyTier)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-semibold border text-center transition ${
                    difficulty === tier.id
                      ? `${tier.color} ring-2 shadow-xs`
                      : 'bg-stone-50 border-stone-200 text-stone-500 hover:bg-stone-100'
                  }`}
                >
                  {tier.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time of Day (Pastel Pills) */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span>Time of Day</span>
                <span className="text-[10px] text-stone-400 font-normal">WFH Routine Organization</span>
              </span>
              <span className="text-[11px] font-normal text-stone-400">
                {timeOfDay === 'morning' && 'Kickoff & morning focus'}
                {timeOfDay === 'workday' && 'Core working hours & pacing'}
                {timeOfDay === 'evening' && 'Shutdown & evening reflection'}
                {timeOfDay === 'anytime' && 'Flexible throughout day'}
              </span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                {
                  id: 'morning' as TimeOfDay,
                  label: 'Morning',
                  icon: '☀️',
                  activeClass: 'bg-amber-50 text-amber-800 border-amber-300 ring-2 ring-amber-200 shadow-xs',
                },
                {
                  id: 'workday' as TimeOfDay,
                  label: 'Workday',
                  icon: '💼',
                  activeClass: 'bg-sky-50 text-sky-800 border-sky-300 ring-2 ring-sky-200 shadow-xs',
                },
                {
                  id: 'evening' as TimeOfDay,
                  label: 'Evening',
                  icon: '🌙',
                  activeClass: 'bg-purple-50 text-purple-800 border-purple-300 ring-2 ring-purple-200 shadow-xs',
                },
                {
                  id: 'anytime' as TimeOfDay,
                  label: 'Anytime',
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
              <label className="block text-xs font-semibold text-emerald-900">Periodicity / Recurrence</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'daily', label: 'Every Day' },
                  { id: 'weekdays', label: 'Weekdays (Mon–Fri)' },
                  { id: 'custom_days', label: 'Specific Days' },
                  { id: 'counter_only', label: 'Flexible (+/- only)' },
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
                    {WEEKDAYS.map((wd) => {
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
                <span className="text-xs text-stone-600 font-medium">Add +/- Counter Buttons:</span>
                <div className="flex gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={habitPositive}
                      onChange={(e) => setHabitPositive(e.target.checked)}
                      className="rounded border-stone-300 text-emerald-600 focus:ring-0"
                    />
                    <span>(+) Positive</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={habitNegative}
                      onChange={(e) => setHabitNegative(e.target.checked)}
                      className="rounded border-stone-300 text-rose-600 focus:ring-0"
                    />
                    <span>(-) Negative</span>
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
                      <span>Block specific time on Agenda grid</span>
                    </span>
                    <span className="text-[10px] text-emerald-700 font-medium bg-emerald-100/70 px-2 py-0.5 rounded-md">
                      🌱 Routine Slot
                    </span>
                  </div>
                </label>

                {enableAgenda && (
                  <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-emerald-100">
                    <div>
                      <label className="block text-[10px] text-stone-600 font-medium mb-0.5">Date</label>
                      <input
                        type="date"
                        value={scheduledDate || todayStr}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs text-stone-800 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-stone-600 font-medium mb-0.5">Start Time</label>
                      <input
                        type="time"
                        value={scheduledStart}
                        onChange={(e) => setScheduledStart(e.target.value)}
                        className="w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs text-stone-800 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-stone-600 font-medium mb-0.5">Duration</label>
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
            </div>
          )}

          {/* KIND: TASK SPECIFIC */}
          {kind === 'task' && (
            <div className="p-4 bg-indigo-50/40 border border-indigo-100 rounded-xl space-y-3">
              <label className="block text-xs font-semibold text-indigo-900">Timeline / Due Date</label>
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
                  Without Timeline
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
                  📅 Task for Today
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
                  Pick Due Date
                </button>
              </div>

              {taskTimelineMode === 'custom' && (
                <div className="pt-2">
                  <label className="block text-[11px] font-medium text-stone-600 mb-1">Due Date</label>
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
                    <span className="text-xs font-medium text-stone-700">Block specific time on Agenda</span>
                  </label>

                  {enableAgenda && (
                    <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-indigo-100">
                      <div>
                        <label className="block text-[10px] text-stone-500 mb-0.5">Date</label>
                        <input
                          type="date"
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          className="w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs text-stone-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-stone-500 mb-0.5">Start Time</label>
                        <input
                          type="time"
                          value={scheduledStart}
                          onChange={(e) => setScheduledStart(e.target.value)}
                          className="w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs text-stone-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-stone-500 mb-0.5">Duration</label>
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
              <span>Checklist / Steps ({subtasks.length})</span>
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
                placeholder="Add checklist step..."
                className="flex-1 bg-white border border-stone-300 rounded-xl px-3 py-1.5 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-medium transition"
              >
                Add
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-500 hover:text-stone-800 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : initialTask ? 'Update' : kind === 'habit' ? 'Save Habit' : 'Save Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
