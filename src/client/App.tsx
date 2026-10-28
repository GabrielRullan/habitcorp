import React, { useState, useEffect, useMemo } from 'react';
import {
  Task,
  TaskType,
  DifficultyTier,
  CalendarMeeting,
  Ghost,
  AuthState,
  Project,
  TimeOfDay,
} from './types';
import {
  Calendar,
  Clock,
  Plus,
  CheckCircle2,
  Circle,
  Flame,
  Search,
  Filter,
  Columns,
  LayoutGrid,
  Bot,
  CalendarDays,
  CheckSquare,
  Sparkles,
  GripVertical,
  ArrowRight,
  FolderPlus,
  Folder,
  Tag,
  Trash2,
  X,
  Sun,
  Briefcase,
  Moon,
  User,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { TaskModal } from './components/TaskModal';
import { AgendaView } from './components/AgendaView';
import { CalendarModal } from './components/CalendarModal';
import { MeetingModal } from './components/MeetingModal';
import { AgentApiModal } from './components/AgentApiModal';
import { AuthModal } from './components/AuthModal';
import { HabitCorpIcon } from './components/HabitCorpIcon';
import { FocusPacingBar } from './components/FocusPacingBar';
import { PomodoroTimer } from './components/PomodoroTimer';
import { fetchJson } from './apiHelper';

export const App: React.FC = () => {
  // Current user state (auto-logs into @testuser for frictionless local testing)
  const [auth, setAuth] = useState<AuthState | null>(null);

  // Pomodoro timer visibility
  const [showPomodoro, setShowPomodoro] = useState(true);

  // Data
  const [tasks, setTasks] = useState<Task[]>([]);
  const [meetings, setMeetings] = useState<CalendarMeeting[]>([]);
  const [ghosts, setGhosts] = useState<Ghost[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  // View state: 'habits_tasks' | 'tasks_agenda' | 'agenda' (DEFAULT: 'tasks_agenda')
  type ViewMode = 'habits_tasks' | 'tasks_agenda' | 'agenda';
  const [viewMode, setViewMode] = useState<ViewMode>('tasks_agenda');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Column Sub-Tabs & Time-of-Day Filter
  const [habitTab, setHabitTab] = useState<'all' | 'due_today'>('all');
  const [habitTimeFilter, setHabitTimeFilter] = useState<'all' | 'morning' | 'workday' | 'evening' | 'anytime'>('all');
  const [taskTab, setTaskTab] = useState<'all' | 'todo' | 'without_timeline'>('all');

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState<string | 'all'>('all');
  const [difficultyFilter] = useState<DifficultyTier | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultTaskType, setDefaultTaskType] = useState<TaskType>('todo');
  const [modalScheduledDate, setModalScheduledDate] = useState<string | undefined>();
  const [modalScheduledStart, setModalScheduledStart] = useState<string | undefined>();
  const [modalDueDate, setModalDueDate] = useState<string | undefined>();

  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<CalendarMeeting | null>(null);
  const [modalMeetingDate, setModalMeetingDate] = useState<string | undefined>();
  const [modalMeetingStart, setModalMeetingStart] = useState<string | undefined>();
  const [agentModalOpen, setAgentModalOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // New Project Form
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('#ec4899');
  const [creatingProject, setCreatingProject] = useState(false);

  // Dragging state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [isDragOverTasks, setIsDragOverTasks] = useState(false);

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const handleAuthSuccess = (newAuth: AuthState) => {
    setAuth(newAuth);
    try {
      localStorage.setItem('habitcorp_auth', JSON.stringify(newAuth));
    } catch {}
    setAuthModalOpen(false);
    setUserMenuOpen(false);
  };

  const handleLogout = () => {
    setAuth(null);
    try {
      localStorage.removeItem('habitcorp_auth');
    } catch {}
    setUserMenuOpen(false);
    setAuthModalOpen(true);
  };

  // Sync test user or magic link token on mount
  useEffect(() => {
    // 1. Check if user arrived via a Magic Link URL: /?magic_token=...
    const params = new URLSearchParams(window.location.search);
    const magicToken = params.get('magic_token');

    if (magicToken) {
      window.history.replaceState({}, '', window.location.pathname);
      fetchJson('/api/v1/auth/verify-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: magicToken }),
      })
        .then((data) => {
          if (data?.apiKey) {
            handleAuthSuccess(data);
          } else {
            setAuthModalOpen(true);
          }
        })
        .catch(() => setAuthModalOpen(true));
      return;
    }

    // 2. Check stored session
    try {
      const saved = localStorage.getItem('habitcorp_auth');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.apiKey) {
          setAuth(parsed);
          return;
        }
      }
    } catch {}

    // 3. Fallback to default user for preview
    fetchJson('/api/v1/auth/default-user')
      .then((data) => {
        if (data?.apiKey) setAuth(data);
      })
      .catch((e) => {
        console.debug('Default user fetch unavailable:', e);
        setAuthModalOpen(true);
      });
  }, []);

  const fetchGhosts = async () => {
    if (!auth) return;
    try {
      const data = await fetchJson('/api/v1/ghosts', {
        headers: { 'X-API-Key': auth.apiKey },
      });
      setGhosts(data.ghosts || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProjects = async () => {
    if (!auth) return;
    try {
      const data = await fetchJson('/api/v1/projects', {
        headers: { 'X-API-Key': auth.apiKey },
      });
      setProjects(data.projects || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTasks = async () => {
    if (!auth) return;
    try {
      const data = await fetchJson('/api/v1/tasks', {
        headers: { 'X-API-Key': auth.apiKey },
      });
      setTasks(data.tasks || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMeetings = async () => {
    if (!auth) return;
    try {
      const start = new Date(selectedDate);
      start.setDate(start.getDate() - 7);
      const end = new Date(selectedDate);
      end.setDate(end.getDate() + 14);

      const [dataMeetings, dataGhosts] = await Promise.all([
        fetchJson(
          `/api/v1/meetings?start=${start.toISOString().slice(0, 10)}&end=${end.toISOString().slice(0, 10)}`,
          { headers: { 'X-API-Key': auth.apiKey } }
        ),
        fetchJson('/api/v1/ghosts', { headers: { 'X-API-Key': auth.apiKey } }),
      ]);

      setMeetings(dataMeetings.meetings || []);
      setGhosts(dataGhosts.ghosts || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (auth) {
      setLoading(true);
      Promise.all([fetchTasks(), fetchMeetings(), fetchGhosts(), fetchProjects()]).finally(() =>
        setLoading(false)
      );
    }
  }, [auth]);

  useEffect(() => {
    if (auth) {
      fetchMeetings();
    }
  }, [selectedDate]);

  // Project creation handler
  const handleCreateProject = async (name: string, color: string): Promise<string | undefined> => {
    if (!auth || !name.trim()) return;
    try {
      const created = await fetchJson('/api/v1/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': auth.apiKey,
        },
        body: JSON.stringify({ name: name.trim(), color }),
      });
      await fetchProjects();
      return created.id;
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!auth) return;
    if (!confirm('Are you sure you want to delete this project? Tasks will remain as standalone items.')) return;
    try {
      await fetchJson(`/api/v1/projects/${projectId}`, {
        method: 'DELETE',
        headers: { 'X-API-Key': auth.apiKey },
      });
      if (selectedProjectId === projectId) setSelectedProjectId('all');
      await Promise.all([fetchProjects(), fetchTasks()]);
    } catch (e) {
      console.error(e);
    }
  };

  // Calendar Event & Meeting Handlers
  const handleOpenNewMeeting = (date?: string, start?: string) => {
    setEditingMeeting(null);
    setModalMeetingDate(date || selectedDate);
    setModalMeetingStart(start || '10:00');
    setMeetingModalOpen(true);
  };

  const handleEditMeeting = (meeting: CalendarMeeting) => {
    setEditingMeeting(meeting);
    if (meeting.start_time) {
      setModalMeetingDate(meeting.start_time.slice(0, 10));
      setModalMeetingStart(meeting.start_time.slice(11, 16));
    } else {
      setModalMeetingDate(selectedDate);
      setModalMeetingStart('10:00');
    }
    setMeetingModalOpen(true);
  };

  const handleSaveMeeting = async (meetingData: any) => {
    if (!auth) return;
    try {
      if (meetingData.id) {
        await fetchJson(`/api/v1/meetings/${meetingData.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': auth.apiKey,
          },
          body: JSON.stringify(meetingData),
        });
      } else {
        await fetchJson('/api/v1/meetings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': auth.apiKey,
          },
          body: JSON.stringify(meetingData),
        });
      }
      await fetchMeetings();
    } catch (err) {
      console.error('Failed to save meeting:', err);
    }
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    if (!auth) return;
    try {
      await fetchJson(`/api/v1/meetings/${meetingId}`, {
        method: 'DELETE',
        headers: {
          'X-API-Key': auth.apiKey,
        },
      });
      await fetchMeetings();
    } catch (err) {
      console.error('Failed to delete meeting:', err);
    }
  };

  const handleRescheduleMeeting = async (meetingId: string, date: string, startHour: number) => {
    if (!auth) return;
    const meeting = meetings.find((m) => m.id === meetingId);
    if (!meeting) return;
    try {
      const origStart = new Date(meeting.start_time);
      const origEnd = new Date(meeting.end_time);
      const durationMs = Math.max(15 * 60 * 1000, origEnd.getTime() - origStart.getTime());

      const newStart = new Date(`${date}T${String(startHour).padStart(2, '0')}:00:00.000Z`);
      const newEnd = new Date(newStart.getTime() + durationMs);

      await fetchJson(`/api/v1/meetings/${meetingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': auth.apiKey,
        },
        body: JSON.stringify({
          start_time: newStart.toISOString(),
          end_time: newEnd.toISOString(),
        }),
      });
      await fetchMeetings();
    } catch (err) {
      console.error('Failed to reschedule meeting:', err);
    }
  };

  // Scoring / Task actions
  const handleScoreTask = async (taskId: string, direction: 'up' | 'down' = 'up') => {
    if (!auth) return;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        if (t.type === 'habit') {
          return {
            ...t,
            counter_up: direction === 'up' ? t.counter_up + 1 : t.counter_up,
            counter_down: direction === 'down' ? t.counter_down + 1 : t.counter_down,
          };
        } else if (t.type === 'daily') {
          const nextCompleted = t.completed ? 0 : 1;
          const nextStreak = nextCompleted ? t.streak + 1 : Math.max(0, t.streak - 1);
          return { ...t, completed: nextCompleted, streak: nextStreak };
        } else {
          return { ...t, completed: t.completed ? 0 : 1 };
        }
      })
    );

    try {
      const updated = await fetchJson(`/api/v1/tasks/${taskId}/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': auth.apiKey,
        },
        body: JSON.stringify({ direction }),
      });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updated } : t)));
    } catch (e) {
      console.error(e);
    }
  };

  // Fast: Mark task for Today
  const handleMarkTaskForToday = async (taskId: string) => {
    if (!auth) return;
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, due_date: todayStr } : t))
    );
    try {
      await fetchJson(`/api/v1/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': auth.apiKey,
        },
        body: JSON.stringify({ due_date: todayStr }),
      });
      await fetchTasks();
    } catch (e) {
      console.error(e);
    }
  };

  // Schedule task or habit onto specific agenda hour slot
  const handleScheduleTask = async (
    taskId: string,
    date: string,
    startTime: string,
    duration = 30
  ) => {
    if (!auth) return;
    const targetTask = tasks.find((t) => t.id === taskId);
    const isHabit = targetTask?.type === 'habit' || targetTask?.type === 'daily';

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              scheduled_date: date,
              scheduled_start: startTime,
              scheduled_duration: duration,
              due_date: isHabit ? t.due_date : (t.due_date || date),
            }
          : t
      )
    );

    try {
      await fetchJson(`/api/v1/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': auth.apiKey,
        },
        body: JSON.stringify({
          scheduled_date: date,
          scheduled_start: startTime,
          scheduled_duration: duration,
          due_date: isHabit ? targetTask?.due_date : (targetTask?.due_date || date),
        }),
      });
      await fetchTasks();
    } catch (e) {
      console.error(e);
    }
  };

  // Fast: 1-click schedule today's task to agenda
  const handleQuickScheduleTodayToAgenda = (taskId: string) => {
    // Find next reasonable hour or default 09:00
    const nowHour = new Date().getHours();
    const nextHour = Math.min(21, Math.max(9, nowHour + 1));
    const timeStr = `${String(nextHour).padStart(2, '0')}:00`;
    handleScheduleTask(taskId, todayStr, timeStr, 30);
  };

  // Fast: 1-click schedule habit to agenda based on time_of_day
  const handleQuickScheduleHabitToAgenda = (habitId: string) => {
    const habit = tasks.find((t) => t.id === habitId);
    if (!habit) return;

    const tod = habit.time_of_day || 'anytime';
    let targetTime = '09:00';

    if (tod === 'morning') {
      targetTime = '08:30';
    } else if (tod === 'workday') {
      targetTime = '12:30';
    } else if (tod === 'evening') {
      targetTime = '17:30';
    } else {
      const nowHour = new Date().getHours();
      const nextHour = Math.min(21, Math.max(9, nowHour + 1));
      targetTime = `${String(nextHour).padStart(2, '0')}:00`;
    }

    const duration = habit.scheduled_duration || 30;
    handleScheduleTask(habitId, selectedDate || todayStr, targetTime, duration);
  };

  // Focus Pacing: 1-click block focus session onto today's agenda
  const handleBlockFocusOnAgenda = async (title: string, duration: number) => {
    if (!auth) return;
    const now = new Date();
    const currentHour = Math.min(22, Math.max(6, now.getHours()));
    const currentSlot = `${String(currentHour).padStart(2, '0')}:00`;
    const blockTitle = title?.trim() || 'Deep Work Focus Block';

    try {
      const created = await fetchJson('/api/v1/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': auth.apiKey,
        },
        body: JSON.stringify({
          title: blockTitle,
          type: 'todo',
          scheduled_date: todayStr,
          scheduled_start: currentSlot,
          scheduled_duration: duration,
          time_of_day: 'workday',
        }),
      });

      setTasks((prev) => [created, ...prev]);
      setSelectedDate(todayStr);
      await fetchTasks();
    } catch (e) {
      console.error('Failed to block focus session on agenda:', e);
    }
  };

  // Unschedule task
  const handleUnscheduleTask = async (taskId: string) => {
    if (!auth) return;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, scheduled_date: null, scheduled_start: null } : t
      )
    );

    try {
      await fetchJson(`/api/v1/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': auth.apiKey,
        },
        body: JSON.stringify({
          scheduled_date: null,
          scheduled_start: null,
        }),
      });
      await fetchTasks();
    } catch (e) {
      console.error(e);
    }
  };

  // Set due date directly (or null to return to without timeline)
  const handleSetTaskDate = async (taskId: string, date: string | null) => {
    if (!auth) return;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              due_date: date,
              scheduled_date: date ? t.scheduled_date : null,
              scheduled_start: date ? t.scheduled_start : null,
            }
          : t
      )
    );

    try {
      await fetchJson(`/api/v1/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': auth.apiKey,
        },
        body: JSON.stringify({
          due_date: date,
          scheduled_date: date ? undefined : null,
          scheduled_start: date ? undefined : null,
        }),
      });
      await fetchTasks();
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle Subtask
  const handleToggleSubtask = async (taskId: string, subtaskId: string, currentCompleted: number) => {
    if (!auth) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !task.subtasks) return;

    const nextSubtasks = task.subtasks.map((s) =>
      s.id === subtaskId ? { ...s, completed: currentCompleted ? 0 : 1 } : s
    );

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, subtasks: nextSubtasks } : t))
    );

    try {
      await fetchJson(`/api/v1/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': auth.apiKey,
        },
        body: JSON.stringify({ subtasks: nextSubtasks }),
      });
      await fetchTasks();
    } catch (e) {
      console.error(e);
    }
  };

  // Save Task (Modal)
  const handleSaveTask = async (taskData: any) => {
    if (!auth) return;
    if (editingTask) {
      await fetchJson(`/api/v1/tasks/${editingTask.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': auth.apiKey,
        },
        body: JSON.stringify(taskData),
      });
      await fetchTasks();
    } else {
      await fetchJson('/api/v1/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': auth.apiKey,
        },
        body: JSON.stringify(taskData),
      });
      await fetchTasks();
    }
  };

  // Filtered Tasks (by Difficulty, Search, and Project)
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (selectedProjectId !== 'all' && t.project_id !== selectedProjectId) return false;
      if (difficultyFilter !== 'all' && t.difficulty !== difficultyFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesNotes = t.notes?.toLowerCase().includes(q);
        const matchesProject = t.project_name?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesNotes && !matchesProject) return false;
      }
      return true;
    });
  }, [tasks, selectedProjectId, difficultyFilter, searchQuery]);

  // 1. HABITS (contains habits marked as daily or with other periodicity)
  const baseHabitsList = useMemo(() => {
    return filteredTasks.filter((t) => {
      if (t.type !== 'habit' && t.type !== 'daily') return false;
      if (habitTab === 'due_today') return t.is_due_today;
      return true;
    });
  }, [filteredTasks, habitTab]);

  // Count habits per time-of-day for filter pills
  const habitCounts = useMemo(() => {
    const counts = {
      all: baseHabitsList.length,
      morning: 0,
      workday: 0,
      evening: 0,
      anytime: 0,
    };
    for (const h of baseHabitsList) {
      const tod = (h.time_of_day || 'anytime') as 'morning' | 'workday' | 'evening' | 'anytime';
      if (counts[tod] !== undefined) {
        counts[tod]++;
      } else {
        counts.anytime++;
      }
    }
    return counts;
  }, [baseHabitsList]);

  // Filtered habits list by active Time-of-Day pill
  const habitsList = useMemo(() => {
    if (habitTimeFilter === 'all') return baseHabitsList;
    return baseHabitsList.filter((t) => {
      const tod = t.time_of_day || 'anytime';
      return tod === habitTimeFilter;
    });
  }, [baseHabitsList, habitTimeFilter]);

  // Sectioned groupings when habitTimeFilter === 'all'
  const morningHabits = useMemo(
    () => baseHabitsList.filter((t) => (t.time_of_day || 'anytime') === 'morning'),
    [baseHabitsList]
  );
  const workdayHabits = useMemo(
    () => baseHabitsList.filter((t) => (t.time_of_day || 'anytime') === 'workday'),
    [baseHabitsList]
  );
  const eveningHabits = useMemo(
    () => baseHabitsList.filter((t) => (t.time_of_day || 'anytime') === 'evening'),
    [baseHabitsList]
  );
  const anytimeHabits = useMemo(
    () => baseHabitsList.filter((t) => (t.time_of_day || 'anytime') === 'anytime'),
    [baseHabitsList]
  );

  // 2. TASKS (all, to do, without timeline)
  const allTasksList = useMemo(() => {
    return filteredTasks.filter((t) => t.type === 'todo');
  }, [filteredTasks]);

  const tasksList = useMemo(() => {
    if (taskTab === 'todo') {
      return allTasksList.filter((t) => t.due_date || t.scheduled_date || t.start_date);
    }
    if (taskTab === 'without_timeline') {
      return allTasksList.filter((t) => !t.due_date && !t.scheduled_date && !t.start_date);
    }
    return allTasksList;
  }, [allTasksList, taskTab]);

  const todoTasksCount = useMemo(
    () => allTasksList.filter((t) => t.due_date || t.scheduled_date || t.start_date).length,
    [allTasksList]
  );
  const withoutTimelineCount = useMemo(
    () => allTasksList.filter((t) => !t.due_date && !t.scheduled_date && !t.start_date).length,
    [allTasksList]
  );

  return (
    <div className="min-h-screen bg-[#fafaf9] text-stone-800 flex flex-col font-sans">
      {/* Top Navbar in Pastel Light Theme */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200/80 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-200/90 flex items-center justify-center shadow-2xs">
              <HabitCorpIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-stone-900 tracking-tight">HabitCorp</h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 font-medium">
                  The boring cousin of Habitica
                </span>
              </div>
            </div>
          </div>

          {/* Three View Modes: Habits + Tasks | Tasks + Agenda (DEFAULT) | Agenda */}
          <div className="flex items-center bg-stone-100 p-0.5 rounded-xl border border-stone-200/80 text-xs">
            <button
              onClick={() => setViewMode('habits_tasks')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                viewMode === 'habits_tasks'
                  ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Habits + Tasks</span>
            </button>
            <button
              onClick={() => setViewMode('tasks_agenda')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                viewMode === 'tasks_agenda'
                  ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-indigo-600" />
              <span className="font-semibold text-indigo-950">Tasks + Agenda</span>
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                viewMode === 'agenda'
                  ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Agenda Grid</span>
            </button>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="bg-stone-50 hover:bg-stone-100 focus:bg-white border border-stone-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-indigo-400 w-32 sm:w-48 shadow-2xs transition"
              />
            </div>

            <button
              onClick={() => {
                setEditingTask(null);
                setDefaultTaskType('todo');
                setModalDueDate(undefined);
                setTaskModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>

            <button
              onClick={() => setShowPomodoro((v) => !v)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition border ${
                showPomodoro
                  ? 'bg-rose-50 border-rose-200 text-rose-800 font-semibold'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-200'
              }`}
              title="Toggle Pomodoro Timer"
            >
              <span>🍅</span>
              <span className="hidden sm:inline">Pomodoro</span>
            </button>

            <button
              onClick={() => setCalendarModalOpen(true)}
              className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl text-xs transition border border-stone-200"
              title="Calendars & Ghosts"
            >
              <CalendarDays className="w-4 h-4" />
            </button>

            <button
              onClick={() => setAgentModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-indigo-700 rounded-xl text-xs font-medium transition border border-stone-200"
              title="Agent API Key"
            >
              <Bot className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline">Agent API</span>
            </button>

            {auth ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1.5 text-xs bg-stone-100 hover:bg-stone-200 px-2.5 py-1 rounded-xl border border-stone-200 transition"
                  title="Account menu"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-stone-700 font-mono text-[11px] font-semibold">@{auth.username}</span>
                  <ChevronDown className="w-3 h-3 text-stone-400" />
                </button>

                {/* User Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-stone-200 rounded-2xl p-2 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150 text-xs">
                    <div className="px-3 py-2 border-b border-stone-100 mb-1">
                      <p className="font-bold text-stone-900 truncate">@{auth.username}</p>
                      {auth.email && <p className="text-[11px] text-stone-400 truncate">{auth.email}</p>}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        setAuthModalOpen(true);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-stone-700 hover:bg-stone-100 flex items-center gap-2 transition"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                      <span>Switch Account (Magic Link)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        setAgentModalOpen(true);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-stone-700 hover:bg-stone-100 flex items-center gap-2 transition"
                    >
                      <Bot className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Agent API Key</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition mt-1 border-t border-stone-100"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Log In / Sign Up</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Pomodoro Timer (Milestone 3 & Pomodoro Suite) */}
      {showPomodoro && (
        <PomodoroTimer
          onBlockOnAgenda={handleBlockFocusOnAgenda}
          tasks={tasks}
          onScoreTask={handleScoreTask}
          isOpen={showPomodoro}
          onToggleOpen={() => setShowPomodoro((v) => !v)}
        />
      )}

      {/* Project Filter Strip (Positioned directly above the active view / after pomodoro) */}
      <section className="bg-white/80 border-b border-stone-200/70 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-stone-400 uppercase tracking-wider text-[10px] flex items-center gap-1 mr-1 shrink-0">
              <Folder className="w-3 h-3 text-stone-400" />
              <span>Projects:</span>
            </span>

            <button
              onClick={() => setSelectedProjectId('all')}
              className={`px-2.5 py-1 rounded-lg font-medium border text-xs transition shrink-0 ${
                selectedProjectId === 'all'
                  ? 'bg-stone-800 text-white border-stone-800 font-semibold shadow-2xs'
                  : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              All Projects ({tasks.length})
            </button>

            {projects.map((p) => {
              const count = tasks.filter((t) => t.project_id === p.id).length;
              const isSelected = selectedProjectId === p.id;
              return (
                <div key={p.id} className="flex items-center shrink-0">
                  <button
                    onClick={() => setSelectedProjectId(isSelected ? 'all' : p.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium border text-xs transition ${
                      isSelected
                        ? 'font-semibold shadow-2xs'
                        : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                    style={
                      isSelected
                        ? {
                            backgroundColor: `${p.color}15`,
                            borderColor: `${p.color}50`,
                            color: p.color,
                          }
                        : undefined
                    }
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: p.color }}
                    />
                    <span>{p.name}</span>
                    <span className="text-[10px] opacity-70">({count})</span>
                  </button>
                </div>
              );
            })}

            <button
              onClick={() => setProjectModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium border border-dashed border-stone-300 text-stone-500 hover:text-indigo-600 hover:border-indigo-300 bg-white hover:bg-indigo-50/40 text-xs transition shrink-0"
            >
              <Plus className="w-3 h-3" />
              <span>New Project</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Area based on ViewMode */}

      {/* VIEW 1: HABITS + TASKS (2 balanced columns) */}
      {viewMode === 'habits_tasks' && (
        <main className="flex-1 max-w-6xl w-full mx-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
          {renderHabitsColumn()}
          {renderTasksColumn()}
        </main>
      )}

      {/* VIEW 2: TASKS + AGENDA (DEFAULT: Tasks column on left, Agenda on right) */}
      {viewMode === 'tasks_agenda' && (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 grid grid-cols-1 lg:grid-cols-[410px_1fr] gap-5 items-start">
          {renderTasksColumn()}
          <div className="w-full">
            <AgendaView
              tasks={tasks}
              meetings={meetings}
              ghosts={ghosts}
              selectedDate={selectedDate}
              selectedProjectId={selectedProjectId}
              projects={projects}
              onSelectDate={setSelectedDate}
              onScoreTask={handleScoreTask}
              onEditTask={(task) => {
                setEditingTask(task);
                setTaskModalOpen(true);
              }}
              onScheduleTask={handleScheduleTask}
              onOpenNewTaskModal={(date, start) => {
                setEditingTask(null);
                setDefaultTaskType('todo');
                setModalScheduledDate(date);
                setModalScheduledStart(start);
                setTaskModalOpen(true);
              }}
              onOpenNewMeetingModal={handleOpenNewMeeting}
              onEditMeeting={handleEditMeeting}
              onDeleteMeeting={handleDeleteMeeting}
              onRescheduleMeeting={handleRescheduleMeeting}
              onUnscheduleTask={handleUnscheduleTask}
            />
          </div>
        </main>
      )}

      {/* VIEW 3: FULL AGENDA GRID */}
      {viewMode === 'agenda' && (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4">
          <AgendaView
            tasks={tasks}
            meetings={meetings}
            ghosts={ghosts}
            selectedDate={selectedDate}
            selectedProjectId={selectedProjectId}
            projects={projects}
            onSelectDate={setSelectedDate}
            onScoreTask={handleScoreTask}
            onEditTask={(task) => {
              setEditingTask(task);
              setTaskModalOpen(true);
            }}
            onScheduleTask={handleScheduleTask}
            onOpenNewTaskModal={(date, start) => {
              setEditingTask(null);
              setDefaultTaskType('todo');
              setModalScheduledDate(date);
              setModalScheduledStart(start);
              setTaskModalOpen(true);
            }}
            onOpenNewMeetingModal={handleOpenNewMeeting}
            onEditMeeting={handleEditMeeting}
            onDeleteMeeting={handleDeleteMeeting}
            onRescheduleMeeting={handleRescheduleMeeting}
            onUnscheduleTask={handleUnscheduleTask}
          />
        </main>
      )}

      {/* Modals */}
      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onSave={handleSaveTask}
        initialTask={editingTask}
        defaultType={defaultTaskType}
        defaultScheduledDate={modalScheduledDate}
        defaultScheduledStart={modalScheduledStart}
        defaultDueDate={modalDueDate}
        defaultTimeOfDay={habitTimeFilter !== 'all' ? habitTimeFilter : undefined}
        projects={projects}
        onCreateProject={handleCreateProject}
      />

      <CalendarModal
        isOpen={calendarModalOpen}
        onClose={() => setCalendarModalOpen(false)}
        apiKey={auth?.apiKey || ''}
        onRefreshMeetings={fetchMeetings}
        defaultDate={selectedDate}
      />

      <MeetingModal
        isOpen={meetingModalOpen}
        onClose={() => setMeetingModalOpen(false)}
        onSave={handleSaveMeeting}
        onDelete={handleDeleteMeeting}
        initialMeeting={editingMeeting}
        defaultDate={modalMeetingDate || selectedDate}
        defaultStartTime={modalMeetingStart || '10:00'}
        ghosts={ghosts}
      />

      <AgentApiModal
        isOpen={agentModalOpen}
        onClose={() => setAgentModalOpen(false)}
        apiKey={auth?.apiKey || ''}
        onRegenerateKey={async () => auth?.apiKey || ''}
      />

      {/* Auth Modal (Passwordless Magic Link, Account Creation & Login) */}
      {(authModalOpen || !auth) && (
        <AuthModal
          onSuccess={handleAuthSuccess}
          onClose={() => setAuthModalOpen(false)}
          canClose={!!auth}
        />
      )}

      {/* Project Management Modal */}
      {projectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white border border-stone-200 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <span className="font-semibold text-base text-stone-800 flex items-center gap-2">
                <Folder className="w-4 h-4 text-indigo-600" />
                <span>Manage Projects</span>
              </span>
              <button
                onClick={() => setProjectModalOpen(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-500">
              Projects link your recurring habits and one-off tasks together under a common goal (e.g. &ldquo;Chinese learning&rdquo;, &ldquo;Fitness&rdquo;, or &ldquo;Work&rdquo;).
            </p>

            {/* Existing Projects */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {projects.length === 0 ? (
                <p className="text-xs text-stone-400 italic">No projects created yet.</p>
              ) : (
                projects.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: p.color }}
                      />
                      <span className="font-semibold text-stone-800">{p.name}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteProject(p.id)}
                      className="text-stone-400 hover:text-rose-600 p-1"
                      title="Delete Project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Create Project Form */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newProjectName.trim()) return;
                setCreatingProject(true);
                try {
                  await handleCreateProject(newProjectName.trim(), newProjectColor);
                  setNewProjectName('');
                } finally {
                  setCreatingProject(false);
                }
              }}
              className="pt-3 border-t border-stone-100 space-y-2"
            >
              <span className="block text-xs font-semibold text-stone-500 uppercase tracking-wider">
                Add New Project
              </span>
              <div className="grid grid-cols-[1fr_50px] gap-2">
                <input
                  type="text"
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. Chinese learning"
                  className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-none focus:border-indigo-400 focus:bg-white"
                />
                <input
                  type="color"
                  value={newProjectColor}
                  onChange={(e) => setNewProjectColor(e.target.value)}
                  className="w-full h-9 rounded-xl bg-stone-50 border border-stone-200 cursor-pointer p-1"
                  title="Project badge color"
                />
              </div>
              <button
                type="submit"
                disabled={creatingProject || !newProjectName.trim()}
                className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition shadow-xs disabled:opacity-50"
              >
                {creatingProject ? 'Adding...' : 'Create Project'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  // ================= COLUMN 1: HABITS RENDERER =================
  function renderHabitsColumn() {
    // Helper to render an individual draggable habit card
    const renderHabitCard = (habit: Task) => {
      const isDone = Boolean(habit.completed);
      const tod = (habit.time_of_day || 'anytime') as 'morning' | 'workday' | 'evening' | 'anytime';
      const isScheduled = Boolean(habit.scheduled_start);

      return (
        <div
          key={habit.id}
          draggable={true}
          onDragStart={(e) => {
            e.dataTransfer.setData('text/plain', habit.id);
            setDraggedTaskId(habit.id);
          }}
          onDragEnd={() => setDraggedTaskId(null)}
          className={`p-3 rounded-xl border transition shadow-2xs cursor-grab active:cursor-grabbing ${
            isDone
              ? 'bg-stone-50/70 border-stone-200/80 text-stone-400 opacity-70'
              : 'bg-white border-stone-200/90 hover:border-stone-300'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {/* Checkbox for Daily/Periodical */}
            {habit.type === 'daily' && (
              <button
                onClick={() => handleScoreTask(habit.id, 'up')}
                className="mt-0.5 text-stone-400 hover:text-emerald-600 shrink-0"
                title={isDone ? 'Mark incomplete' : 'Mark done for today'}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Circle className="w-4 h-4" />
                )}
              </button>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-1">
                <span
                  onClick={() => {
                    setEditingTask(habit);
                    setTaskModalOpen(true);
                  }}
                  className={`font-semibold text-xs cursor-pointer hover:text-indigo-600 truncate ${
                    isDone ? 'line-through text-stone-400' : 'text-stone-800'
                  }`}
                >
                  {habit.title}
                </span>

                <div className="flex items-center gap-1 shrink-0">
                  {/* Time-of-Day Pill */}
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-medium border capitalize ${
                      tod === 'morning'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : tod === 'workday'
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : tod === 'evening'
                        ? 'bg-purple-50 text-purple-800 border-purple-200'
                        : 'bg-stone-50 text-stone-600 border-stone-200'
                    }`}
                  >
                    {tod}
                  </span>

                  {/* Pastel Difficulty Badge */}
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase shrink-0 ${
                      habit.difficulty === 'hard'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : habit.difficulty === 'medium'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {habit.difficulty}
                  </span>
                </div>
              </div>

              {/* Project Tag */}
              {habit.project_name && (
                <div className="mt-1">
                  <span
                    className="px-1.5 py-0.2 rounded text-[9px] font-medium border"
                    style={{
                      backgroundColor: `${habit.project_color || '#6366f1'}15`,
                      color: habit.project_color || '#6366f1',
                      borderColor: `${habit.project_color || '#6366f1'}30`,
                    }}
                  >
                    ● {habit.project_name}
                  </span>
                </div>
              )}

              {habit.notes && (
                <p className="text-[11px] text-stone-500 line-clamp-2 mt-0.5">
                  {habit.notes}
                </p>
              )}

              {/* Cadence info & Streak */}
              <div className="flex items-center gap-2 mt-1.5 text-[10px] text-stone-400">
                {habit.type === 'daily' && (
                  <span className="flex items-center gap-0.5 text-amber-600 font-semibold font-mono">
                    <Flame className="w-3 h-3 text-amber-500" />
                    {habit.streak}d streak
                  </span>
                )}
                <span>•</span>
                <span className="capitalize text-stone-500">
                  {habit.type === 'daily' ? habit.frequency : 'Flexible habit'}
                </span>
              </div>
            </div>
          </div>

          {/* Optional +/- Counter Buttons */}
          {(Boolean(habit.habit_positive) || Boolean(habit.habit_negative)) && (
            <div className="flex items-center justify-between pt-2 mt-2 border-t border-stone-100">
              <span className="text-[10px] text-stone-400 font-medium">Counters:</span>
              <div className="flex items-center gap-1.5">
                {Boolean(habit.habit_positive) && (
                  <button
                    onClick={() => handleScoreTask(habit.id, 'up')}
                    className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-md text-xs font-bold transition flex items-center gap-1"
                    title="Add +1"
                  >
                    <span>+</span>
                    <span className="font-mono text-[10px]">{habit.counter_up}</span>
                  </button>
                )}
                {Boolean(habit.habit_negative) && (
                  <button
                    onClick={() => handleScoreTask(habit.id, 'down')}
                    className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-md text-xs font-bold transition flex items-center gap-1"
                    title="Subtract -1"
                  >
                    <span>-</span>
                    <span className="font-mono text-[10px]">{habit.counter_down}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Checklist Subtasks */}
          {habit.subtasks && habit.subtasks.length > 0 && (
            <div className="pl-6 space-y-1 pt-1.5 mt-1 border-t border-stone-100">
              {habit.subtasks.map((sub) => (
                <div
                  key={sub.id}
                  onClick={() => handleToggleSubtask(habit.id, sub.id, sub.completed)}
                  className="flex items-center gap-1.5 text-[11px] text-stone-600 cursor-pointer hover:text-stone-900"
                >
                  {sub.completed ? (
                    <CheckSquare className="w-3 h-3 text-emerald-600 shrink-0" />
                  ) : (
                    <div className="w-3 h-3 border border-stone-300 rounded-xs shrink-0" />
                  )}
                  <span className={sub.completed ? 'line-through text-stone-400' : ''}>
                    {sub.title}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Agenda Time-Blocking & Drag Handle Bar */}
          <div className="flex items-center justify-between gap-1.5 mt-2 pt-1.5 border-t border-stone-100 text-[10px]">
            <div className="flex items-center gap-1.5">
              {isScheduled ? (
                <span className="flex items-center gap-1 font-medium text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-mono">
                  <Clock className="w-3 h-3 text-emerald-600" />
                  <span>{habit.scheduled_start}</span>
                  <span className="text-[9px] text-emerald-600">({habit.scheduled_duration || 30}m)</span>
                </span>
              ) : (
                <span className="text-stone-400 italic">Not scheduled</span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {!isScheduled ? (
                <button
                  onClick={() => handleQuickScheduleHabitToAgenda(habit.id)}
                  className="text-[10px] text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-2 py-0.5 rounded font-medium transition flex items-center gap-0.5"
                  title={`Schedule to ${tod} slot on today's agenda`}
                >
                  <Clock className="w-2.5 h-2.5 text-emerald-600" />
                  <span>+ Agenda</span>
                </button>
              ) : (
                <button
                  onClick={() => handleUnscheduleTask(habit.id)}
                  className="text-[10px] text-stone-400 hover:text-stone-700 px-1.5 py-0.5 rounded hover:bg-stone-100 transition"
                  title="Remove from agenda"
                >
                  Clear
                </button>
              )}

              <span title="Drag onto Agenda slot">
                <GripVertical className="w-3.5 h-3.5 text-stone-400 shrink-0 cursor-grab hover:text-stone-600 ml-1" />
              </span>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="bg-stone-100/70 border border-stone-200 rounded-2xl flex flex-col max-h-[calc(100vh-210px)]">
        {/* Header */}
        <div className="p-3.5 border-b border-stone-200 bg-white rounded-t-2xl space-y-2.5">
          {/* Row 1: Title & Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="font-bold text-xs text-stone-800 uppercase tracking-wider">
                Habits ({baseHabitsList.length})
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Due Today toggle pill */}
              <button
                onClick={() => setHabitTab(habitTab === 'all' ? 'due_today' : 'all')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium border transition ${
                  habitTab === 'due_today'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold shadow-2xs'
                    : 'bg-stone-100 text-stone-500 border-stone-200 hover:text-stone-700'
                }`}
                title={habitTab === 'due_today' ? 'Showing Due Today. Click for all.' : 'Filter to Due Today'}
              >
                Due Today
              </button>

              {/* Add Habit modal button */}
              <button
                onClick={() => {
                  setEditingTask(null);
                  setDefaultTaskType('daily');
                  setTaskModalOpen(true);
                }}
                className="p-1 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition"
                title="Add Habit"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Row 2: Time-of-Day Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar text-[11px] pt-1 border-t border-stone-100">
            <button
              onClick={() => setHabitTimeFilter('all')}
              className={`px-2 py-0.5 rounded-lg border font-medium transition whitespace-nowrap flex items-center gap-1 ${
                habitTimeFilter === 'all'
                  ? 'bg-white text-stone-800 border-stone-300 shadow-2xs font-semibold'
                  : 'text-stone-500 border-transparent hover:bg-stone-100 hover:text-stone-700'
              }`}
            >
              <span>All</span>
              <span className="text-[9px] opacity-75 font-mono">({habitCounts.all})</span>
            </button>

            <button
              onClick={() => setHabitTimeFilter('morning')}
              className={`px-2 py-0.5 rounded-lg border font-medium transition whitespace-nowrap flex items-center gap-1 ${
                habitTimeFilter === 'morning'
                  ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-2xs font-semibold'
                  : 'text-stone-500 border-transparent hover:bg-amber-50/60 hover:text-amber-800'
              }`}
            >
              <Sun className="w-3 h-3 text-amber-500" />
              <span>Morning</span>
              <span className="text-[9px] opacity-75 font-mono">({habitCounts.morning})</span>
            </button>

            <button
              onClick={() => setHabitTimeFilter('workday')}
              className={`px-2 py-0.5 rounded-lg border font-medium transition whitespace-nowrap flex items-center gap-1 ${
                habitTimeFilter === 'workday'
                  ? 'bg-blue-50 text-blue-800 border-blue-300 shadow-2xs font-semibold'
                  : 'text-stone-500 border-transparent hover:bg-blue-50/60 hover:text-blue-800'
              }`}
            >
              <Briefcase className="w-3 h-3 text-blue-500" />
              <span>Workday</span>
              <span className="text-[9px] opacity-75 font-mono">({habitCounts.workday})</span>
            </button>

            <button
              onClick={() => setHabitTimeFilter('evening')}
              className={`px-2 py-0.5 rounded-lg border font-medium transition whitespace-nowrap flex items-center gap-1 ${
                habitTimeFilter === 'evening'
                  ? 'bg-purple-50 text-purple-800 border-purple-300 shadow-2xs font-semibold'
                  : 'text-stone-500 border-transparent hover:bg-purple-50/60 hover:text-purple-800'
              }`}
            >
              <Moon className="w-3 h-3 text-purple-500" />
              <span>Evening</span>
              <span className="text-[9px] opacity-75 font-mono">({habitCounts.evening})</span>
            </button>

            <button
              onClick={() => setHabitTimeFilter('anytime')}
              className={`px-2 py-0.5 rounded-lg border font-medium transition whitespace-nowrap flex items-center gap-1 ${
                habitTimeFilter === 'anytime'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs font-semibold'
                  : 'text-stone-500 border-transparent hover:bg-emerald-50/60 hover:text-emerald-800'
              }`}
            >
              <Sparkles className="w-3 h-3 text-emerald-500" />
              <span>Anytime</span>
              <span className="text-[9px] opacity-75 font-mono">({habitCounts.anytime})</span>
            </button>
          </div>
        </div>

        {/* Habit Cards Container */}
        <div className="p-3 space-y-2.5 overflow-y-auto flex-1">
          {baseHabitsList.length === 0 ? (
            <div className="text-center py-12 px-4 text-xs text-stone-400">
              <p className="font-medium text-stone-500 mb-1">No habits here</p>
              <p>Track habits with daily cadence, streaks, or +/- counters.</p>
            </div>
          ) : habitTimeFilter === 'all' ? (
            /* Sectioned Views under 'All' */
            <div className="space-y-4">
              {/* Morning Kickoff Section */}
              {morningHabits.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-2 py-1 text-xs font-semibold text-amber-900 bg-amber-50/80 rounded-lg border border-amber-200/60">
                    <div className="flex items-center gap-1.5">
                      <Sun className="w-3.5 h-3.5 text-amber-600" />
                      <span>Morning Kickoff</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-mono font-medium">
                      {morningHabits.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {morningHabits.map(renderHabitCard)}
                  </div>
                </div>
              )}

              {/* Workday Focus Section */}
              {workdayHabits.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-2 py-1 text-xs font-semibold text-blue-900 bg-blue-50/80 rounded-lg border border-blue-200/60">
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                      <span>Workday Focus</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 font-mono font-medium">
                      {workdayHabits.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {workdayHabits.map(renderHabitCard)}
                  </div>
                </div>
              )}

              {/* Evening Shutdown Section */}
              {eveningHabits.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-2 py-1 text-xs font-semibold text-purple-900 bg-purple-50/80 rounded-lg border border-purple-200/60">
                    <div className="flex items-center gap-1.5">
                      <Moon className="w-3.5 h-3.5 text-purple-600" />
                      <span>Evening Shutdown</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-800 font-mono font-medium">
                      {eveningHabits.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {eveningHabits.map(renderHabitCard)}
                  </div>
                </div>
              )}

              {/* Anytime Routines Section */}
              {anytimeHabits.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-2 py-1 text-xs font-semibold text-stone-700 bg-stone-100/80 rounded-lg border border-stone-200/70">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Anytime Routines</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-stone-200 text-stone-700 font-mono font-medium">
                      {anytimeHabits.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {anytimeHabits.map(renderHabitCard)}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Filtered View for Specific Time-of-Day */
            <div className="space-y-2">
              {habitsList.length === 0 ? (
                <div className="text-center py-10 px-4 text-xs text-stone-400">
                  <p className="font-medium text-stone-500 mb-1 capitalize">
                    No {habitTimeFilter} habits
                  </p>
                  <p>Edit or add a habit with the &ldquo;{habitTimeFilter}&rdquo; time-of-day tag.</p>
                </div>
              ) : (
                habitsList.map(renderHabitCard)
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ================= COLUMN 2: TASKS RENDERER =================
  function renderTasksColumn() {
    return (
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOverTasks(true);
        }}
        onDragLeave={() => setIsDragOverTasks(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOverTasks(false);
          const id = e.dataTransfer.getData('text/plain') || draggedTaskId;
          if (id) {
            if (taskTab === 'todo') {
              handleSetTaskDate(id, selectedDate);
            } else if (taskTab === 'without_timeline') {
              handleSetTaskDate(id, null);
            }
          }
        }}
        className={`bg-stone-100/70 border rounded-2xl flex flex-col max-h-[calc(100vh-210px)] transition ${
          isDragOverTasks ? 'border-indigo-400 ring-2 ring-indigo-200 bg-indigo-50/20' : 'border-stone-200'
        }`}
      >
        {/* Header with Habitica-Style Tabs: All, To Do, Without Timeline */}
        <div className="p-3.5 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2 bg-white rounded-t-2xl">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <span className="font-bold text-xs text-stone-800 uppercase tracking-wider">
              Tasks ({tasksList.length})
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="flex bg-stone-100 p-0.5 rounded-lg border border-stone-200 text-[11px]">
              <button
                onClick={() => setTaskTab('all')}
                className={`px-2 py-0.5 rounded-md font-medium transition ${
                  taskTab === 'all' ? 'bg-white text-stone-900 shadow-2xs font-semibold' : 'text-stone-500'
                }`}
              >
                All ({allTasksList.length})
              </button>
              <button
                onClick={() => setTaskTab('todo')}
                className={`px-2 py-0.5 rounded-md font-medium transition ${
                  taskTab === 'todo' ? 'bg-white text-indigo-700 shadow-2xs font-semibold' : 'text-stone-500'
                }`}
              >
                To Do ({todoTasksCount})
              </button>
              <button
                onClick={() => setTaskTab('without_timeline')}
                className={`px-2 py-0.5 rounded-md font-medium transition ${
                  taskTab === 'without_timeline'
                    ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                    : 'text-stone-500'
                }`}
              >
                Without Timeline ({withoutTimelineCount})
              </button>
            </div>

            {/* Fast: Create Task for Today */}
            <button
              onClick={() => {
                setEditingTask(null);
                setDefaultTaskType('todo');
                setModalDueDate(todayStr);
                setTaskModalOpen(true);
              }}
              className="px-2 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition flex items-center gap-1"
              title="Add task specifically scheduled for today"
            >
              <Plus className="w-3 h-3" />
              <span>+ Today</span>
            </button>
          </div>
        </div>

        {/* Task Cards */}
        <div className="p-3 space-y-2.5 overflow-y-auto flex-1">
          {tasksList.length === 0 ? (
            <div className="text-center py-12 px-4 text-xs text-stone-400">
              <p className="font-medium text-stone-500 mb-1">No tasks in this view</p>
              <p>Switch tabs or add a task above.</p>
            </div>
          ) : (
            tasksList.map((task) => {
              const isDone = Boolean(task.completed);
              const hasDeadline = Boolean(task.due_date || task.scheduled_date);
              const isDueToday = task.due_date?.slice(0, 10) === todayStr;

              return (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', task.id);
                    setDraggedTaskId(task.id);
                  }}
                  onDragEnd={() => setDraggedTaskId(null)}
                  className={`p-3 rounded-xl border transition shadow-2xs cursor-grab active:cursor-grabbing ${
                    isDone
                      ? 'bg-stone-50/70 border-stone-200/80 text-stone-400 opacity-70'
                      : 'bg-white border-stone-200/90 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <button
                      onClick={() => handleScoreTask(task.id, 'up')}
                      className="mt-0.5 text-stone-400 hover:text-indigo-600 shrink-0"
                      title={isDone ? 'Mark incomplete' : 'Mark complete'}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <span
                          onClick={() => {
                            setEditingTask(task);
                            setTaskModalOpen(true);
                          }}
                          className={`font-semibold text-xs cursor-pointer hover:text-indigo-600 truncate ${
                            isDone ? 'line-through text-stone-400' : 'text-stone-800'
                          }`}
                        >
                          {task.title}
                        </span>

                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase shrink-0 ${
                            task.difficulty === 'hard'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : task.difficulty === 'medium'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {task.difficulty}
                        </span>
                      </div>

                      {/* Project Tag */}
                      {task.project_name && (
                        <div className="mt-1">
                          <span
                            className="px-1.5 py-0.2 rounded text-[9px] font-medium border"
                            style={{
                              backgroundColor: `${task.project_color || '#6366f1'}15`,
                              color: task.project_color || '#6366f1',
                              borderColor: `${task.project_color || '#6366f1'}30`,
                            }}
                          >
                            ● {task.project_name}
                          </span>
                        </div>
                      )}

                      {task.notes && (
                        <p className="text-[11px] text-stone-500 line-clamp-2 mt-0.5">
                          {task.notes}
                        </p>
                      )}

                      {/* Timeline Date & Scheduling Controls */}
                      <div className="flex flex-wrap items-center justify-between gap-1.5 mt-2 pt-1 border-t border-stone-100 text-[10px]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {task.due_date ? (
                            <span
                              className={`flex items-center gap-1 font-medium px-1.5 py-0.5 rounded border font-mono ${
                                isDueToday
                                  ? 'text-indigo-700 bg-indigo-50 border-indigo-200 font-semibold'
                                  : 'text-amber-700 bg-amber-50 border-amber-200'
                              }`}
                            >
                              <Calendar className="w-3 h-3 text-amber-600" />
                              {isDueToday ? 'Today' : `Due ${task.due_date}`}
                            </span>
                          ) : (
                            <span className="text-stone-400 italic">No timeline</span>
                          )}

                          {task.scheduled_start && (
                            <span className="flex items-center gap-1 font-medium text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 font-mono">
                              <Clock className="w-3 h-3 text-indigo-600" />
                              {task.scheduled_start}
                            </span>
                          )}
                        </div>

                        {/* Action buttons: "For Today" and "Add to Agenda" */}
                        <div className="flex items-center gap-1">
                          {!isDueToday && (
                            <button
                              onClick={() => handleMarkTaskForToday(task.id)}
                              className="text-[10px] text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded font-medium transition"
                              title="Set due date to today so it can be scheduled on the agenda"
                            >
                              + Today
                            </button>
                          )}

                          {isDueToday && !task.scheduled_start && (
                            <button
                              onClick={() => handleQuickScheduleTodayToAgenda(task.id)}
                              className="text-[10px] text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded font-medium transition flex items-center gap-0.5"
                              title="Place onto today's agenda time grid"
                            >
                              <Clock className="w-2.5 h-2.5 text-emerald-600" />
                              <span>Agenda</span>
                            </button>
                          )}

                          {hasDeadline && (
                            <button
                              onClick={() => handleSetTaskDate(task.id, null)}
                              className="text-[10px] text-stone-400 hover:text-stone-700 px-1.5 py-0.5 rounded hover:bg-stone-100"
                              title="Return to Without Timeline backlog"
                            >
                              Clear
                            </button>
                          )}
                          <GripVertical className="w-3.5 h-3.5 text-stone-400 shrink-0 cursor-grab" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Checklist subtasks */}
                  {task.subtasks && task.subtasks.length > 0 && (
                    <div className="pl-6 space-y-1 pt-1.5 mt-1 border-t border-stone-100">
                      {task.subtasks.map((sub) => (
                        <div
                          key={sub.id}
                          onClick={() => handleToggleSubtask(task.id, sub.id, sub.completed)}
                          className="flex items-center gap-1.5 text-[11px] text-stone-600 cursor-pointer hover:text-stone-900"
                        >
                          {sub.completed ? (
                            <CheckSquare className="w-3 h-3 text-indigo-600 shrink-0" />
                          ) : (
                            <div className="w-3 h-3 border border-stone-300 rounded-xs shrink-0" />
                          )}
                          <span className={sub.completed ? 'line-through text-stone-400' : ''}>
                            {sub.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }
};
