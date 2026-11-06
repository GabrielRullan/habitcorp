import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  ListPlus,
  Sun,
  Briefcase,
  Moon,
  User,
  LogOut,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  BatteryLow,
  Monitor,
  Target,
  Inbox,
  HelpCircle,
  Minimize2,
  Maximize2,
  Volume2,
  VolumeX,
  FastForward,
  RotateCcw,
} from 'lucide-react';
import { TaskModal } from './components/TaskModal';
import { AgendaView } from './components/AgendaView';
import { CalendarModal } from './components/CalendarModal';
import { MeetingModal } from './components/MeetingModal';
import { AgentApiModal } from './components/AgentApiModal';
import { AuthModal } from './components/AuthModal';
import { Sidebar } from './components/Sidebar';
import { SettingsModal } from './components/SettingsModal';
import { HabitCorpIcon } from './components/HabitCorpIcon';
import { FocusPacingBar } from './components/FocusPacingBar';
import { PomodoroTimer } from './components/PomodoroTimer';
import { fetchJson } from './apiHelper';
import { useTranslation } from './i18n/I18nContext';
import { LanguagePicker } from './components/LanguagePicker';
import { StreakGrowthBadge } from './components/StreakGrowthBadge';
import { SpotlightModal } from './components/SpotlightModal';
import { BrainDumpDrawer } from './components/BrainDumpDrawer';
import { TutorialModal } from './components/TutorialModal';
import { GoblinBrainModal } from './components/GoblinBrainModal';
import { CelebrationOverlay } from './components/CelebrationOverlay';
import { playPeacefulChime } from './utils/celebration';
import { isTaskInGracePeriod, getStreakGraceMessage } from './utils/streak';
import { findNextAvailableSlot, getSpoonCalibratedDuration } from './utils/smartScheduling';
import { getNextFlowTask } from './utils/flowPrompt';
import { isTaskStale, getStaleTasks, getStaleTriageMessage } from './utils/backlogTriage';
import { DailyShutdownModal } from './components/DailyShutdownModal';

export const App: React.FC = () => {
  const { t, formatDate } = useTranslation();

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
  const [mobileHabitsTasksTab, setMobileHabitsTasksTab] = useState<'habits' | 'tasks'>('habits');
  const [mobileTasksAgendaTab, setMobileTasksAgendaTab] = useState<'tasks' | 'agenda' | 'habits'>('tasks');
  const [desktopBoardTab, setDesktopBoardTab] = useState<'tasks' | 'habits'>('tasks');

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState<string | 'all'>('all');
  const [activeFilter, setActiveFilter] = useState<'active' | 'all'>('active');
  const projectsScrollRef = useRef<HTMLDivElement>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyTier | 'all'>('all');
  const [lowBatteryFilter, setLowBatteryFilter] = useState<boolean>(false);
  const [energyMode, setEnergyMode] = useState<'high' | 'steady' | 'gentle'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('habitcorp_energy_mode') as any;
        if (stored === 'high' || stored === 'steady' || stored === 'gentle') return stored;
      } catch {}
    }
    return 'steady';
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Restful Theme & Mindfulness State
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('habitcorp_theme');
      if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
    }
    return 'system';
  });
  const [mindfulReflection, setMindfulReflection] = useState<string | null>(null);
  const reflectionTimeoutRef = useRef<any>(null);

  // Visual Density Mode: 'spacious' (full details) vs 'compact' (zen minimalism)
  const [densityMode, setDensityMode] = useState<'spacious' | 'compact'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('habitcorp_density');
      if (stored === 'compact' || stored === 'spacious') return stored;
    }
    return 'spacious';
  });

  const toggleDensityMode = () => {
    setDensityMode((prev) => {
      const next = prev === 'spacious' ? 'compact' : 'spacious';
      try {
        localStorage.setItem('habitcorp_density', next);
      } catch {}
      return next;
    });
  };

  // Audio Feedback & Dopamine Celebration State
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('habitcorp_sound');
      if (stored !== null) return stored === 'true';
    }
    return true;
  });
  const [celebrationKey, setCelebrationKey] = useState<number>(0);

  const triggerCelebration = () => {
    setCelebrationKey((prev) => prev + 1);
    playPeacefulChime(soundEnabled);
  };

  // Settings Modal & Tutorial Visibility State
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [showTutorials, setShowTutorials] = useState<boolean>(() => {
    try {
      return localStorage.getItem('habitcorp_show_tutorials') !== 'false';
    } catch {
      return true;
    }
  });

  const showTutorialsRef = useRef(showTutorials);
  useEffect(() => {
    showTutorialsRef.current = showTutorials;
  }, [showTutorials]);

  const handleToggleTutorials = (val: boolean) => {
    setShowTutorials(val);
    try {
      localStorage.setItem('habitcorp_show_tutorials', String(val));
    } catch {}
  };

  // Zen Mode State & Persistence (Requirement R4)
  const [zenMode, setZenMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('habitcorp_zen_mode') === 'true';
      } catch {
        return false;
      }
    }
    return false;
  });

  const zenModeRef = useRef(zenMode);
  useEffect(() => {
    zenModeRef.current = zenMode;
  }, [zenMode]);

  const toggleZenMode = () => {
    setZenMode((prev) => {
      const next = !prev;
      zenModeRef.current = next;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('habitcorp_zen_mode', String(next));
        } catch {}
      }
      return next;
    });
  };

  // Modals
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultTaskType, setDefaultTaskType] = useState<TaskType>('todo');
  const [modalScheduledDate, setModalScheduledDate] = useState<string | undefined>();
  const [modalScheduledStart, setModalScheduledStart] = useState<string | undefined>();
  const [modalDueDate, setModalDueDate] = useState<string | undefined>();

  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [spotlightTaskId, setSpotlightTaskId] = useState<string | undefined>();
  const [nextFlowPrompt, setNextFlowPrompt] = useState<{ completedTitle: string; nextTask: Task } | null>(null);
  const flowPromptTimeoutRef = useRef<any>(null);
  const [brainDumpOpen, setBrainDumpOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [goblinModalOpen, setGoblinModalOpen] = useState(false);
  const [goblinTask, setGoblinTask] = useState<Task | null>(null);
  const [dailyShutdownOpen, setDailyShutdownOpen] = useState(false);

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

  const [todayStr, setTodayStr] = useState(() => new Date().toISOString().slice(0, 10));

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

  // Sync Theme preference to <html> element
  useEffect(() => {
    const root = document.documentElement;
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('habitcorp_theme', theme);
    } catch {}
  }, [theme]);

  const cycleTheme = () => {
    setTheme((prev) => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'system';
      return 'light';
    });
  };

  const handleSetEnergyMode = (mode: 'high' | 'steady' | 'gentle') => {
    setEnergyMode(mode);
    try {
      localStorage.setItem('habitcorp_energy_mode', mode);
    } catch {}

    if (mode === 'gentle') {
      setLowBatteryFilter(true);
      setDensityMode('compact');
      setMindfulReflection('✨ Gentle Mode active. Low visual noise, XS/S tasks prioritized. Go easy on yourself today.');
      if (reflectionTimeoutRef.current) clearTimeout(reflectionTimeoutRef.current);
      reflectionTimeoutRef.current = setTimeout(() => setMindfulReflection(null), 7000);
    } else if (mode === 'high') {
      setLowBatteryFilter(false);
      setDensityMode('spacious');
      setMindfulReflection('🚀 High Energy Mode! Ready for deep work and tackling challenging goals.');
      if (reflectionTimeoutRef.current) clearTimeout(reflectionTimeoutRef.current);
      reflectionTimeoutRef.current = setTimeout(() => setMindfulReflection(null), 5000);
    } else {
      setLowBatteryFilter(false);
      setMindfulReflection('🌱 Steady Mode active. One step at a time at your natural pace.');
      if (reflectionTimeoutRef.current) clearTimeout(reflectionTimeoutRef.current);
      reflectionTimeoutRef.current = setTimeout(() => setMindfulReflection(null), 5000);
    }
  };

  // Global ADHD & Accessibility Hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'Escape') {
        setTaskModalOpen(false);
        setMeetingModalOpen(false);
        setCalendarModalOpen(false);
        setProjectModalOpen(false);
        setAgentModalOpen(false);
        setSpotlightOpen(false);
        setBrainDumpOpen(false);
        setTutorialOpen(false);
        setGoblinModalOpen(false);
        setDailyShutdownOpen(false);
        setSettingsModalOpen(false);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setBrainDumpOpen(true);
        return;
      }

      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setEditingTask(null);
        setDefaultTaskType('todo');
        setTaskModalOpen(true);
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setSpotlightOpen(true);
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        setBrainDumpOpen(true);
      } else if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        setDailyShutdownOpen(true);
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        cycleTheme();
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        setShowPomodoro((prev) => !prev);
      } else if (e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        toggleZenMode();
      } else if (e.key === '?') {
        if (showTutorialsRef.current) {
          e.preventDefault();
          setTutorialOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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

  // Auto-refresh tasks and synchronized date when midnight passes or when window regains visibility/focus
  useEffect(() => {
    const checkRollover = () => {
      const nowDay = new Date().toISOString().slice(0, 10);
      if (nowDay !== todayStr) {
        setTodayStr(nowDay);
        if (auth) {
          fetchTasks();
          fetchMeetings();
        }
      }
    };

    // Check periodically every 30 seconds
    const timer = setInterval(checkRollover, 30000);

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        checkRollover();
        if (auth) {
          fetchTasks();
        }
      }
    };

    window.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);

    return () => {
      clearInterval(timer);
      window.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [todayStr, auth]);

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
  const handleScoreTask = async (taskId: string, direction: 'up' | 'down' | 'toggle' = 'up') => {
    if (!auth) return;

    if (direction === 'down') {
      const mindfulQuotes = [
        "A slip is just data, not a character flaw. Reset gently for your next cue.",
        "Take a slow breath. Notice what triggered this moment without judgment.",
        "Every moment is a fresh reset. One lapse does not undo your progress.",
        "Curiosity over criticism: What was your environment asking of you?",
      ];
      const randomQuote = mindfulQuotes[Math.floor(Math.random() * mindfulQuotes.length)];
      setMindfulReflection(randomQuote);
      if (reflectionTimeoutRef.current) clearTimeout(reflectionTimeoutRef.current);
      reflectionTimeoutRef.current = setTimeout(() => {
        setMindfulReflection(null);
      }, 7000);
    }

    if (direction === 'up' || direction === 'toggle') {
      const target = tasks.find((t) => t.id === taskId);
      if (!target || !target.completed) {
        triggerCelebration();

        // ADHD Flow Bridge: Find the optimal next task to recommend
        if (target) {
          const nextTask = getNextFlowTask(target, tasks);
          if (nextTask) {
            setNextFlowPrompt({ completedTitle: target.title, nextTask });
            if (flowPromptTimeoutRef.current) clearTimeout(flowPromptTimeoutRef.current);
            flowPromptTimeoutRef.current = setTimeout(() => {
              setNextFlowPrompt(null);
            }, 8000);
          }
        }
      }
    }

    const targetTask = tasks.find((t) => t.id === taskId);
    const nowIso = new Date().toISOString();

    setTasks((prev) => {
      // 1. Scoring a habit or daily: synchronize linked action tasks for today
      if (targetTask && (targetTask.type === 'daily' || targetTask.type === 'habit')) {
        const nextDailyCompleted = targetTask.type === 'daily' ? (targetTask.completed ? 0 : 1) : 1;
        return prev.map((t) => {
          if (t.id === taskId) {
            if (t.type === 'habit') {
              return {
                ...t,
                counter_up: direction === 'up' ? t.counter_up + 1 : t.counter_up,
                counter_down: direction === 'down' ? t.counter_down + 1 : t.counter_down,
              };
            } else {
              const nextStreak = nextDailyCompleted ? t.streak + 1 : Math.max(0, t.streak - 1);
              return { ...t, completed: nextDailyCompleted, streak: nextStreak };
            }
          }
          // Synchronize any linked action task for today
          if (
            t.habit_id === taskId &&
            (t.due_date?.slice(0, 10) === todayStr || t.scheduled_date?.slice(0, 10) === todayStr || t.is_due_today)
          ) {
            if (targetTask.type === 'daily') {
              return { ...t, completed: nextDailyCompleted, completed_at: nextDailyCompleted ? nowIso : null };
            } else if (direction === 'up') {
              return { ...t, completed: 1, completed_at: nowIso };
            }
          }
          return t;
        });
      }

      // 2. Scoring an action task of a habit: synchronize parent habit
      if (targetTask && targetTask.habit_id) {
        const nextTaskCompleted = targetTask.completed ? 0 : 1;
        const parentId = targetTask.habit_id;
        return prev.map((t) => {
          if (t.id === taskId) {
            return { ...t, completed: nextTaskCompleted, completed_at: nextTaskCompleted ? nowIso : null };
          }
          if (t.id === parentId) {
            if (t.type === 'daily') {
              if (nextTaskCompleted && !t.completed) {
                const nextStreak = t.streak + 1;
                return { ...t, completed: 1, streak: nextStreak, last_completed_date: todayStr, completed_at: nowIso };
              } else if (!nextTaskCompleted && t.completed) {
                const nextStreak = Math.max(0, t.streak - 1);
                return { ...t, completed: 0, streak: nextStreak, last_completed_date: null, completed_at: null };
              }
            } else if (t.type === 'habit') {
              if (nextTaskCompleted) {
                return { ...t, counter_up: (t.counter_up || 0) + 1 };
              } else {
                return { ...t, counter_up: Math.max(0, (t.counter_up || 0) - 1) };
              }
            }
          }
          return t;
        });
      }

      // 3. Regular task scoring
      return prev.map((t) => {
        if (t.id !== taskId) return t;
        return { ...t, completed: t.completed ? 0 : 1, completed_at: t.completed ? null : nowIso };
      });
    });

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
      // Refresh tasks in background to keep all synchronized parent/child states fresh
      fetchTasks();
    } catch (e) {
      console.error(e);
    }
  };

  // Goblin Brain: Demolish task into micro executable steps
  const handleApplyGoblinSubtasks = async (taskId: string, steps: string[]) => {
    if (!auth) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const newSubtasks = steps.map((title) => ({
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title,
      completed: 0,
    }));
    const combinedSubtasks = [...(task.subtasks || []), ...newSubtasks];
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, subtasks: combinedSubtasks } : t))
    );
    try {
      await fetchJson(`/api/v1/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': auth.apiKey,
        },
        body: JSON.stringify({ subtasks: combinedSubtasks }),
      });
      await fetchTasks();
    } catch (e) {
      console.error(e);
    }
  };

  // Goblin Brain: Create new task with micro executable steps
  const handleCreateTaskWithSubtasks = async (title: string, steps: string[]) => {
    if (!auth || !title.trim()) return;
    const newSubtasks = steps.map((s) => ({
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: s,
      completed: 0,
    }));
    try {
      await fetchJson('/api/v1/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': auth.apiKey,
        },
        body: JSON.stringify({
          title: title.trim(),
          type: 'todo',
          difficulty: 'trivial', // Lowest cognitive barrier
          subtasks: newSubtasks,
        }),
      });
      await fetchTasks();
    } catch (e) {
      console.error(e);
    }
  };

  // Brain Dump: Batch save stream-of-consciousness lines as trivial tasks
  const handleSaveBrainDump = async (titles: string[]) => {
    if (!auth || titles.length === 0) return;
    try {
      const tasksToCreate = titles.map((title) => ({
        title,
        type: 'todo',
        difficulty: 'trivial', // Lowest cognitive barrier
      }));
      await fetchJson('/api/v1/tasks/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': auth.apiKey,
        },
        body: JSON.stringify({ tasks: tasksToCreate }),
      });
      await fetchTasks();
    } catch (e) {
      console.error(e);
    }
  };

  // Compassionate Shift: 1-Tap defer task to tomorrow without shame
  const handlePushTaskToTomorrow = async (taskId: string) => {
    if (!auth) return;
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              due_date: tomorrow,
              scheduled_date: null,
              scheduled_start: null,
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
          due_date: tomorrow,
          scheduled_date: null,
          scheduled_start: null,
        }),
      });
      await fetchTasks();
    } catch (e) {
      console.error(e);
    }
  };

  // Compassionate Sweep: 1-Tap sweep all unfinished today tasks to tomorrow
  const handleSweepIncompleteToTomorrow = async () => {
    if (!auth) return;
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const incompleteTodayTasks = tasks.filter(
      (t) => !t.completed && (t.due_date?.slice(0, 10) === todayStr || t.scheduled_date?.slice(0, 10) === todayStr)
    );
    if (incompleteTodayTasks.length === 0) return;

    setTasks((prev) =>
      prev.map((t) => {
        if (!t.completed && (t.due_date?.slice(0, 10) === todayStr || t.scheduled_date?.slice(0, 10) === todayStr)) {
          return { ...t, due_date: tomorrow, scheduled_date: null, scheduled_start: null };
        }
        return t;
      })
    );

    try {
      await Promise.all(
        incompleteTodayTasks.map((t) =>
          fetchJson(`/api/v1/tasks/${t.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': auth.apiKey,
            },
            body: JSON.stringify({
              due_date: tomorrow,
              scheduled_date: null,
              scheduled_start: null,
            }),
          })
        )
      );
      await fetchTasks();
      setMindfulReflection("All unfinished tasks gently shifted to tomorrow. Rest well tonight!");
      if (reflectionTimeoutRef.current) clearTimeout(reflectionTimeoutRef.current);
      reflectionTimeoutRef.current = setTimeout(() => setMindfulReflection(null), 6000);
    } catch (e) {
      console.error(e);
    }
  };

  // Compassionate Stale Backlog Triage: Rest tasks older than 7 days into Someday (+30d)
  const handleTriageStaleTasks = async () => {
    if (!auth) return;
    const stale = getStaleTasks(tasks);
    if (stale.length === 0) return;

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const somedayStr = futureDate.toISOString().slice(0, 10);

    setTasks((prev) =>
      prev.map((t) => {
        if (stale.some((s) => s.id === t.id)) {
          return { ...t, scheduled_date: somedayStr };
        }
        return t;
      })
    );

    try {
      await Promise.all(
        stale.map((st) =>
          fetchJson(`/api/v1/tasks/${st.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': auth.apiKey,
            },
            body: JSON.stringify({ scheduled_date: somedayStr }),
          })
        )
      );
      await fetchTasks();
      setMindfulReflection(getStaleTriageMessage(stale.length));
      if (reflectionTimeoutRef.current) clearTimeout(reflectionTimeoutRef.current);
      reflectionTimeoutRef.current = setTimeout(() => setMindfulReflection(null), 7000);
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

  // Fast: 1-click schedule today's task to agenda with conflict-free slot & calibrated duration
  const handleQuickScheduleTodayToAgenda = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    const duration = getSpoonCalibratedDuration(task?.difficulty);
    const targetSlot = findNextAvailableSlot(tasks, meetings, todayStr, duration);
    handleScheduleTask(taskId, todayStr, targetSlot, duration);
  };

  // Fast: 1-click schedule habit to agenda based on time_of_day with calibrated duration
  const handleQuickScheduleHabitToAgenda = (habitId: string) => {
    const habit = tasks.find((t) => t.id === habitId);
    if (!habit) return;

    const duration = habit.scheduled_duration || getSpoonCalibratedDuration(habit.difficulty);
    const tod = habit.time_of_day || 'anytime';
    let targetTime = '09:00';

    if (tod === 'morning') {
      targetTime = '08:30';
    } else if (tod === 'workday') {
      targetTime = '12:30';
    } else if (tod === 'evening') {
      targetTime = '17:30';
    } else {
      targetTime = findNextAvailableSlot(tasks, meetings, selectedDate || todayStr, duration);
    }

    handleScheduleTask(habitId, selectedDate || todayStr, targetTime, duration);
  };

  // Convert habit into a concrete action task for today (linked and synchronized)
  const handleConvertHabitToTodayTask = async (habit: Task) => {
    if (!auth) return;

    // Check if an action task for today already exists for this habit
    const existingAction = tasks.find(
      (t) =>
        t.habit_id === habit.id &&
        (t.due_date?.slice(0, 10) === todayStr || t.scheduled_date?.slice(0, 10) === todayStr)
    );
    if (existingAction) {
      setMindfulReflection(
        `⚡ ${habit.title}: ${t.habitActionAlreadyExistsToast || "Aquest hàbit ja té la seva acció d'avui activa a la columna de tasques."}`
      );
      if (reflectionTimeoutRef.current) clearTimeout(reflectionTimeoutRef.current);
      reflectionTimeoutRef.current = setTimeout(() => setMindfulReflection(null), 6000);
      return;
    }

    try {
      const payload: any = {
        title: habit.title,
        habit_id: habit.id,
        project_id: habit.project_id || null,
        type: 'todo',
        time_of_day: habit.time_of_day || 'anytime',
        difficulty: habit.difficulty || 'easy',
        difficulty_weight: habit.difficulty_weight || 2,
        notes: habit.notes || '',
        tags: [...(habit.tags || []), 'habit-action'],
        due_date: todayStr,
        scheduled_duration: habit.scheduled_duration || 30,
        micro_habit_title: habit.micro_habit_title || null,
        subtasks: (habit.subtasks || []).map((s, idx) => ({
          id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sub_${Date.now()}_${idx}`,
          title: s.title,
          completed: 0,
          position: idx,
        })),
      };

      const tempId = 'task_' + Math.random().toString(36).slice(2, 9);
      const optimisticTask: Task = {
        id: tempId,
        habit_id: habit.id,
        user_id: auth.username,
        title: payload.title,
        project_id: payload.project_id,
        type: 'todo',
        time_of_day: payload.time_of_day,
        difficulty: payload.difficulty,
        difficulty_weight: payload.difficulty_weight,
        notes: payload.notes,
        tags: payload.tags,
        due_date: todayStr,
        scheduled_duration: payload.scheduled_duration,
        micro_habit_title: payload.micro_habit_title,
        subtasks: payload.subtasks,
        streak: 0,
        completed: 0,
        is_due_today: true,
        project_name: habit.project_name,
        project_color: habit.project_color,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setTasks((prev) => [optimisticTask, ...prev]);

      if (soundEnabled) {
        playPeacefulChime();
      }
      setMindfulReflection(`🌱 ${habit.title}: ${t.habitActionCreatedToast || "Acció d'avui creada! En completar-la es registrarà el teu hàbit."}`);
      if (reflectionTimeoutRef.current) clearTimeout(reflectionTimeoutRef.current);
      reflectionTimeoutRef.current = setTimeout(() => setMindfulReflection(null), 6000);

      const created = await fetchJson('/api/v1/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': auth.apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (created && created.id) {
        setTasks((prev) => prev.map((item) => (item.id === tempId ? created : item)));
      }
      await fetchTasks();
    } catch (e) {
      console.error('Error creating habit today action task:', e);
    }
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

  // Filtered Tasks (by Difficulty, Low-Battery Spoons, Active/All Status, Search, and Project)
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (selectedProjectId !== 'all' && t.project_id !== selectedProjectId) return false;
      if (difficultyFilter !== 'all' && t.difficulty !== difficultyFilter) return false;
      if (lowBatteryFilter) {
        // Spoon Theory: only trivial (1 spoon) and easy (2 spoons)
        if (t.difficulty !== 'trivial' && t.difficulty !== 'easy') return false;
      }
      if ((zenMode || activeFilter === 'active') && Boolean(t.completed)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesNotes = t.notes?.toLowerCase().includes(q);
        const matchesProject = t.project_name?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesNotes && !matchesProject) return false;
      }
      return true;
    });
  }, [tasks, selectedProjectId, difficultyFilter, lowBatteryFilter, activeFilter, searchQuery, zenMode]);

  // Spoon Theory Daily Battery Meter (Alex & Dr. Marcus)
  const spoonStats = useMemo(() => {
    let pendingSpoons = 0;
    let completedSpoons = 0;

    for (const t of tasks) {
      const isToday =
        t.due_date?.slice(0, 10) === todayStr ||
        t.scheduled_date?.slice(0, 10) === todayStr ||
        t.is_due_today;
      if (!isToday) continue;

      const spoons = t.difficulty === 'trivial' ? 1 : t.difficulty === 'easy' ? 2 : t.difficulty === 'medium' ? 3 : 4;
      if (t.completed) {
        completedSpoons += spoons;
      } else {
        pendingSpoons += spoons;
      }
    }

    const totalTarget = 12; // Recommended healthy baseline for sustainable executive function
    const isOverloaded = pendingSpoons > totalTarget;
    return { pendingSpoons, completedSpoons, totalTarget, isOverloaded };
  }, [tasks, todayStr]);

  // 1. HABITS (contains habits marked as daily or with other periodicity)
  const baseHabitsList = useMemo(() => {
    return filteredTasks.filter((t) => {
      if (zenMode && Boolean(t.completed)) return false;
      if (t.type !== 'habit' && t.type !== 'daily') return false;
      if (habitTab === 'due_today') return t.is_due_today;
      return true;
    });
  }, [filteredTasks, habitTab, zenMode]);

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
    return filteredTasks.filter((t) => {
      if (zenMode && Boolean(t.completed)) return false;
      return t.type === 'todo';
    });
  }, [filteredTasks, zenMode]);

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
  const staleTasksList = useMemo(() => getStaleTasks(tasks), [tasks]);

  const todayCompletedTasks = useMemo(() => {
    return tasks.filter((t) => Boolean(t.completed) && (t.due_date?.slice(0, 10) === todayStr || t.scheduled_date?.slice(0, 10) === todayStr || t.is_due_today));
  }, [tasks, todayStr]);

  const todayPendingTasks = useMemo(() => {
    return tasks.filter((t) => !t.completed && (t.due_date?.slice(0, 10) === todayStr || t.scheduled_date?.slice(0, 10) === todayStr || t.is_due_today));
  }, [tasks, todayStr]);

  return (
    <div className="min-h-screen bg-[#fafaf9] text-stone-800 flex flex-row font-sans pb-16 md:pb-0">
      {/* Desktop Navigation Sidebar */}
      <Sidebar
        onOpenGoblin={() => {
          setGoblinTask(null);
          setGoblinModalOpen(true);
        }}
        onOpenAgentApi={() => setAgentModalOpen(true)}
        onOpenPomodoro={() => setShowPomodoro((v) => !v)}
        onOpenCalendars={() => setCalendarModalOpen(true)}
        onOpenSpotlight={() => setSpotlightOpen(true)}
        onOpenBrainDump={() => setBrainDumpOpen(true)}
        onOpenShutdown={() => setDailyShutdownOpen(true)}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          setSoundEnabled((prev) => {
            const next = !prev;
            try {
              localStorage.setItem('habitcorp_sound', String(next));
            } catch {}
            return next;
          });
        }}
        showTutorials={showTutorials}
        onOpenTutorial={() => setTutorialOpen(true)}
        onOpenSettings={() => setSettingsModalOpen(true)}
        theme={theme}
        onCycleTheme={cycleTheme}
        auth={auth}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        zenMode={zenMode}
        onToggleZenMode={toggleZenMode}
      />

      <div className="flex-1 flex flex-col min-w-0">
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
                  <h1 className="text-base font-bold text-stone-900 tracking-tight">{t.brandName}</h1>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 font-medium hidden sm:inline">
                    {t.tagline}
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
                <span>{t.viewHabitsTasks}</span>
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
                <span className="font-semibold text-indigo-950">{t.viewTasksAgenda}</span>
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
                <span>{t.viewAgendaGrid}</span>
              </button>
            </div>

            {/* Right Action Icons: Search & Add ONLY */}
            <div className="flex items-center gap-2">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
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
                <span>{t.addBtn}</span>
              </button>
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
      <section className="bg-white/80 dark:bg-stone-900/80 border-b border-stone-200/70 dark:border-stone-800 px-4 py-1.5">
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          {/* Status Filter: Actiu / Tot Segmented Control */}
          <div
            className="flex items-center bg-stone-100 dark:bg-stone-800 p-0.5 rounded-lg border border-stone-200 dark:border-stone-700 text-xs shrink-0 select-none"
            role="group"
            aria-label="Filter active or all items"
          >
            <button
              type="button"
              onClick={() => setActiveFilter('active')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                activeFilter === 'active'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 font-bold shadow-2xs'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
              aria-pressed={activeFilter === 'active'}
            >
              {t.filterActive || 'Actiu'}
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 font-bold shadow-2xs'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
              aria-pressed={activeFilter === 'all'}
            >
              {t.filterAll || 'Tot'}
            </button>
          </div>

          <div className="h-4 w-px bg-stone-200 dark:bg-stone-700 shrink-0 mx-0.5" />

          <div className="flex items-center gap-1 font-semibold text-stone-400 uppercase tracking-wider text-[10px] shrink-0 mr-1 select-none">
            <Folder className="w-3.5 h-3.5 text-stone-400" />
            <span>{t.projectsLabel}</span>
          </div>

          <button
            type="button"
            onClick={() => projectsScrollRef.current?.scrollBy({ left: -220, behavior: 'smooth' })}
            className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg shrink-0 transition"
            title="Scroll projects left"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <div
            ref={projectsScrollRef}
            onWheel={(e) => {
              if (e.deltaY !== 0) {
                e.currentTarget.scrollLeft += e.deltaY;
              }
            }}
            className="flex-1 flex items-center gap-1.5 text-xs overflow-x-auto no-scrollbar scroll-smooth py-1"
          >
            {/* Spoon Theory Low-Battery Filter */}
            <button
              type="button"
              onClick={() => setLowBatteryFilter((prev) => !prev)}
              className={`px-2.5 py-1 rounded-lg font-medium border text-xs transition shrink-0 flex items-center gap-1.5 ${
                lowBatteryFilter
                  ? 'bg-amber-100 dark:bg-amber-950/80 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 font-semibold shadow-2xs'
                  : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-amber-50/50'
              }`}
              title="Low Battery Mode: Show only low-activation tasks (XS: 5–15m & S: 15–30m)"
              aria-pressed={lowBatteryFilter}
            >
              <BatteryLow className={`w-3.5 h-3.5 ${lowBatteryFilter ? 'text-amber-600 dark:text-amber-400' : 'text-stone-400'}`} />
              <span>Low Battery</span>
              {lowBatteryFilter && (
                <span className="text-[10px] bg-amber-200 dark:bg-amber-900 text-amber-950 dark:text-amber-100 px-1 rounded-full font-bold">
                  ON
                </span>
              )}
            </button>

            {/* Daily Spoon Battery Gauge */}
            <div
              onClick={() => setLowBatteryFilter((prev) => !prev)}
              className={`px-2.5 py-1 rounded-lg border text-xs cursor-pointer transition select-none flex items-center gap-1.5 shrink-0 ${
                spoonStats.isOverloaded
                  ? 'bg-rose-50 dark:bg-rose-950/70 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                  : spoonStats.pendingSpoons > 8
                  ? 'bg-amber-50 dark:bg-amber-950/70 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                  : 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              }`}
              title={`Today's Spoon Budget: ${spoonStats.pendingSpoons} spoons pending, ${spoonStats.completedSpoons} completed. (Max recommended: ${spoonStats.totalTarget} spoons). Click to toggle Low Battery filter.`}
            >
              <span>{spoonStats.isOverloaded ? '⚡' : '🔋'}</span>
              <span className="font-semibold font-mono">{spoonStats.pendingSpoons}/{spoonStats.totalTarget} Spoons</span>
              {spoonStats.isOverloaded && (
                <span className="text-[9px] font-bold uppercase tracking-wider bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100 px-1 rounded-xs">
                  Heavy
                </span>
              )}
            </div>

            {/* Contextual Energy Mode Selector (Elena, Alex, Dr. Marcus) */}
            <div className="flex items-center gap-1 p-0.5 bg-stone-100 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 text-xs shrink-0 select-none">
              <button
                type="button"
                onClick={() => handleSetEnergyMode('gentle')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition cursor-pointer flex items-center gap-1 ${
                  energyMode === 'gentle'
                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 font-bold shadow-2xs'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-800'
                }`}
                title="Gentle mode: low spoons / overwhelm (XS/S tasks & compact zen)"
              >
                <span>🔋</span>
                <span className="hidden sm:inline">Gentle</span>
              </button>
              <button
                type="button"
                onClick={() => handleSetEnergyMode('steady')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition cursor-pointer flex items-center gap-1 ${
                  energyMode === 'steady'
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 font-bold shadow-2xs'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-800'
                }`}
                title="Steady mode: normal pace and balanced load"
              >
                <span>🌱</span>
                <span className="hidden sm:inline">Steady</span>
              </button>
              <button
                type="button"
                onClick={() => handleSetEnergyMode('high')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition cursor-pointer flex items-center gap-1 ${
                  energyMode === 'high'
                    ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200 font-bold shadow-2xs'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-800'
                }`}
                title="High energy: ready for deep focus and big challenges"
              >
                <span>⚡</span>
                <span className="hidden sm:inline">High</span>
              </button>
            </div>

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
              <span>{t.newProjectBtn}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => projectsScrollRef.current?.scrollBy({ left: 220, behavior: 'smooth' })}
            className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg shrink-0 transition"
            title="Scroll projects right"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* Main Content Area based on ViewMode */}

      {/* VIEW 1: HABITS + TASKS (Mobile Segmented Tab or Desktop 2-Col) */}
      {viewMode === 'habits_tasks' && (
        <main className="flex-1 max-w-6xl w-full mx-auto p-4">
          {/* Mobile Segmented Control */}
          <div className="md:hidden flex items-center justify-center p-1 bg-stone-100 dark:bg-stone-800 rounded-xl mb-4 border border-stone-200 dark:border-stone-700">
            <button
              type="button"
              onClick={() => setMobileHabitsTasksTab('habits')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold text-center transition ${
                mobileHabitsTasksTab === 'habits'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-2xs font-bold'
                  : 'text-stone-500 dark:text-stone-400'
              }`}
            >
              <span>🔁 Habits ({habitsList.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileHabitsTasksTab('tasks')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold text-center transition ${
                mobileHabitsTasksTab === 'tasks'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-2xs font-bold'
                  : 'text-stone-500 dark:text-stone-400'
              }`}
            >
              <span>📋 Tasks ({tasksList.length})</span>
            </button>
          </div>

          <div className="hidden md:grid md:grid-cols-2 gap-5 items-start">
            {renderHabitsColumn()}
            {renderTasksColumn()}
          </div>

          <div className="md:hidden">
            {mobileHabitsTasksTab === 'habits' ? renderHabitsColumn() : renderTasksColumn()}
          </div>
        </main>
      )}

      {/* VIEW 2: TASKS + AGENDA / BOARD VIEW (Shows Habits + Tasks + Agenda on XL, segmented left column on LG, and 3-tab on Mobile) */}
      {viewMode === 'tasks_agenda' && (
        <main className="flex-1 max-w-[1720px] w-full mx-auto p-4">
          {/* Mobile Segmented Control with Habits, Tasks, and Agenda */}
          <div className="lg:hidden flex items-center justify-center p-1 bg-stone-100 dark:bg-stone-800 rounded-xl mb-4 border border-stone-200 dark:border-stone-700">
            <button
              type="button"
              onClick={() => setMobileTasksAgendaTab('habits')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold text-center transition ${
                mobileTasksAgendaTab === 'habits'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-2xs font-bold'
                  : 'text-stone-500 dark:text-stone-400'
              }`}
            >
              <span>🔁 Habits ({habitsList.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileTasksAgendaTab('tasks')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold text-center transition ${
                mobileTasksAgendaTab === 'tasks'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-2xs font-bold'
                  : 'text-stone-500 dark:text-stone-400'
              }`}
            >
              <span>📋 Tasks ({tasksList.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileTasksAgendaTab('agenda')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold text-center transition ${
                mobileTasksAgendaTab === 'agenda'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-2xs font-bold'
                  : 'text-stone-500 dark:text-stone-400'
              }`}
            >
              <span>📅 Agenda</span>
            </button>
          </div>

          {/* XL Screens: Classic 3-Column Board with Habits + Tasks + Agenda */}
          <div className="hidden xl:grid xl:grid-cols-[330px_370px_1fr] gap-5 items-start">
            {renderHabitsColumn()}
            {renderTasksColumn()}
            <div className="w-full min-w-0">
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
          </div>

          {/* LG Screens (1024px - 1279px): Left Column with quick Tasks/Habits toggle + Right Column Agenda */}
          <div className="hidden lg:grid xl:hidden lg:grid-cols-[410px_1fr] gap-5 items-start">
            <div className="space-y-3">
              <div className="flex items-center p-1 bg-stone-100 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700">
                <button
                  type="button"
                  onClick={() => setDesktopBoardTab('tasks')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold text-center transition ${
                    desktopBoardTab === 'tasks'
                      ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-2xs font-bold'
                      : 'text-stone-500 dark:text-stone-400 hover:text-stone-800'
                  }`}
                >
                  <span>📋 Tasks ({tasksList.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDesktopBoardTab('habits')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold text-center transition ${
                    desktopBoardTab === 'habits'
                      ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-2xs font-bold'
                      : 'text-stone-500 dark:text-stone-400 hover:text-stone-800'
                  }`}
                >
                  <span>🔁 Habits ({habitsList.length})</span>
                </button>
              </div>
              {desktopBoardTab === 'tasks' ? renderTasksColumn() : renderHabitsColumn()}
            </div>
            <div className="w-full min-w-0">
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
          </div>

          {/* Mobile Display: Habits or Tasks or Agenda */}
          <div className="lg:hidden">
            {mobileTasksAgendaTab === 'habits' ? (
              renderHabitsColumn()
            ) : mobileTasksAgendaTab === 'tasks' ? (
              renderTasksColumn()
            ) : (
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
            )}
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
      </div>

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

      {/* Dopamine Celebration Visual Feedback */}
      <CelebrationOverlay triggerKey={celebrationKey} />

      {/* Mindful Pause Harm-Reduction Toast */}
      {mindfulReflection && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-14 left-1/2 -translate-x-1/2 z-50 max-w-md w-11/12 bg-amber-50 dark:bg-stone-900 border border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-200 px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-3 duration-200"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-lg shrink-0 select-none">🧘</span>
            <span className="font-medium leading-relaxed">{mindfulReflection}</span>
          </div>
          <button
            type="button"
            onClick={() => setMindfulReflection(null)}
            className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1 shrink-0 rounded-lg hover:bg-amber-100 dark:hover:bg-stone-800 transition"
            title="Dismiss reflection"
          >
            ✕
          </button>
        </div>
      )}

      {/* Next Step Flow Prompt (ADHD Transition Bridge) */}
      {nextFlowPrompt && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92vw] md:w-auto bg-stone-900/95 dark:bg-stone-800/95 backdrop-blur-md text-white border border-stone-700/60 shadow-2xl rounded-2xl px-4 py-3 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-emerald-400 text-lg select-none">✨</span>
            <div className="min-w-0">
              <p className="text-[11px] text-stone-300">
                Done: <span className="text-stone-400 line-through truncate inline-block max-w-[120px] align-bottom">{nextFlowPrompt.completedTitle}</span>
              </p>
              <p className="text-xs font-semibold text-white truncate max-w-[180px] sm:max-w-[240px]">
                Up next: <span className="text-amber-300">{nextFlowPrompt.nextTask.title}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setSpotlightTaskId(nextFlowPrompt.nextTask.id);
                setSpotlightOpen(true);
                setNextFlowPrompt(null);
              }}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1 active:scale-95 cursor-pointer"
            >
              <span>Focus</span>
              <span>🎯</span>
            </button>
            <button
              type="button"
              onClick={() => setNextFlowPrompt(null)}
              className="text-stone-400 hover:text-stone-200 p-1 rounded-lg transition cursor-pointer"
              aria-label="Dismiss flow prompt"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ADHD & Executive Function Modals */}
      <GoblinBrainModal
        isOpen={goblinModalOpen}
        onClose={() => {
          setGoblinModalOpen(false);
          setGoblinTask(null);
        }}
        task={goblinTask}
        tasks={tasks}
        onApplySubtasks={handleApplyGoblinSubtasks}
        onCreateTaskWithSubtasks={handleCreateTaskWithSubtasks}
      />

      <SpotlightModal
        isOpen={spotlightOpen}
        initialTaskId={spotlightTaskId}
        onClose={() => {
          setSpotlightOpen(false);
          setSpotlightTaskId(undefined);
        }}
        tasks={filteredTasks}
        onCompleteTask={(id) => handleScoreTask(id, 'toggle')}
        onOpenGoblinBrain={(task: Task) => {
          setGoblinTask(task);
          setGoblinModalOpen(true);
        }}
        onToggleSubtask={handleToggleSubtask}
      />

      <BrainDumpDrawer
        isOpen={brainDumpOpen}
        onClose={() => setBrainDumpOpen(false)}
        onSaveTasks={handleSaveBrainDump}
      />

      <TutorialModal
        isOpen={tutorialOpen}
        onClose={() => setTutorialOpen(false)}
      />

      <DailyShutdownModal
        isOpen={dailyShutdownOpen}
        onClose={() => setDailyShutdownOpen(false)}
        completedTasks={todayCompletedTasks}
        pendingTodayTasks={todayPendingTasks}
        onSweepToTomorrow={handleSweepIncompleteToTomorrow}
      />

      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        showTutorials={showTutorials}
        onToggleTutorials={handleToggleTutorials}
        theme={theme}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          setSoundEnabled((prev) => {
            const next = !prev;
            try {
              localStorage.setItem('habitcorp_sound', String(next));
            } catch {}
            return next;
          });
        }}
        densityMode={densityMode}
        onToggleDensity={toggleDensityMode}
        onSelectTheme={(t) => setTheme(t)}
      />

      {/* Mobile Ergonomic Bottom Navigation Bar (< md screens) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-t border-stone-200/90 dark:border-stone-800 z-40 px-3 flex items-center justify-around shadow-lg select-none">
        <button
          type="button"
          onClick={() => setViewMode('tasks_agenda')}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2.5 rounded-xl transition cursor-pointer ${
            viewMode === 'tasks_agenda' || viewMode === 'habits_tasks'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-stone-500 dark:text-stone-400 hover:text-stone-800'
          }`}
          title="Board View"
        >
          <LayoutGrid className="w-5 h-5" />
          <span className="text-[10px]">Board</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode('agenda')}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2.5 rounded-xl transition cursor-pointer ${
            viewMode === 'agenda'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-stone-500 dark:text-stone-400 hover:text-stone-800'
          }`}
          title="Agenda Grid"
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px]">Agenda</span>
        </button>

        {/* Center Primary Action: Quick Add Task */}
        <button
          type="button"
          onClick={() => {
            setEditingTask(null);
            setDefaultTaskType('todo');
            setTaskModalOpen(true);
          }}
          className="w-11 h-11 -mt-4 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white shadow-md flex items-center justify-center text-xl active:scale-95 transition cursor-pointer"
          title="Add Task / Habit"
          aria-label="Add Task / Habit"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>

        <button
          type="button"
          onClick={() => setSpotlightOpen(true)}
          className="flex flex-col items-center justify-center gap-0.5 py-1 px-2.5 rounded-xl text-stone-500 dark:text-stone-400 hover:text-rose-600 transition cursor-pointer"
          title="Spotlight Single-Task Focus"
        >
          <Target className="w-5 h-5 text-rose-500" />
          <span className="text-[10px]">Focus</span>
        </button>

        <button
          type="button"
          onClick={() => setBrainDumpOpen(true)}
          className="flex flex-col items-center justify-center gap-0.5 py-1 px-2.5 rounded-xl text-stone-500 dark:text-stone-400 hover:text-purple-600 transition cursor-pointer"
          title="Brain Dump Quick Capture"
        >
          <Inbox className="w-5 h-5 text-purple-500" />
          <span className="text-[10px]">Dump</span>
        </button>
      </nav>
    </div>
  );

  // ================= COLUMN 1: HABITS RENDERER =================
  function renderHabitsColumn() {
    // Helper to render an individual draggable habit card
    const renderHabitCard = (habit: Task) => {
      const isDone = Boolean(habit.completed);
      if (zenMode && isDone) return null;
      const tod = (habit.time_of_day || 'anytime') as 'morning' | 'workday' | 'evening' | 'anytime';
      const isScheduled = Boolean(habit.scheduled_start && habit.scheduled_date === todayStr);
      const inGrace = isTaskInGracePeriod(habit, todayStr);
      const todayAction = tasks.find(
        (t) =>
          t.habit_id === habit.id &&
          (t.due_date?.slice(0, 10) === todayStr || t.scheduled_date?.slice(0, 10) === todayStr)
      );

      if (densityMode === 'compact') {
        return (
          <div
            key={habit.id}
            draggable={true}
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', habit.id);
              setDraggedTaskId(habit.id);
            }}
            onDragEnd={() => setDraggedTaskId(null)}
            onClick={() => {
              setEditingTask(habit);
              setTaskModalOpen(true);
            }}
            className={`px-3 py-2 rounded-xl border transition shadow-2xs flex items-center justify-between gap-2.5 cursor-pointer select-none ${
              isDone
                ? 'bg-stone-50/70 border-stone-200/80 text-stone-400 opacity-60'
                : 'bg-white dark:bg-stone-800 border-stone-200/90 dark:border-stone-700/80 hover:border-indigo-300'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              {habit.type === 'daily' && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleScoreTask(habit.id, 'up');
                  }}
                  className="text-stone-400 hover:text-emerald-600 shrink-0"
                  title={isDone ? 'Mark incomplete' : 'Mark done for today'}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                </button>
              )}
              <span className={`text-xs font-medium truncate ${isDone ? 'line-through text-stone-400' : 'text-stone-800 dark:text-stone-200'}`}>
                {habit.title}
              </span>
              {habit.streak > 0 && habit.type === 'daily' && (
                <span className="text-[10px] text-amber-600 font-mono flex items-center gap-0.5 shrink-0">
                  <Flame className="w-3 h-3 text-amber-500" />
                  {habit.streak}d
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
              {(Boolean(habit.habit_positive) || Boolean(habit.habit_negative)) && (
                <div className="flex items-center gap-1">
                  {Boolean(habit.habit_positive) && (
                    <button
                      type="button"
                      onClick={() => handleScoreTask(habit.id, 'up')}
                      className="px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded text-[10px] font-bold"
                    >
                      +{habit.counter_up || 0}
                    </button>
                  )}
                  {Boolean(habit.habit_negative) && (
                    <button
                      type="button"
                      onClick={() => handleScoreTask(habit.id, 'down')}
                      className="px-1.5 py-0.5 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 rounded text-[10px] font-bold"
                    >
                      -{habit.counter_down || 0}
                    </button>
                  )}
                </div>
              )}
              {todayAction ? (
                todayAction.completed ? (
                  <span
                    className="px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 rounded text-[9px] font-semibold flex items-center gap-0.5"
                    title={t.habitActionDone || '✓ Acció feta'}
                  >
                    {t.habitActionDone || '✓ Acció feta'}
                  </span>
                ) : (
                  <span
                    className="px-1.5 py-0.5 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/80 rounded text-[9px] font-semibold flex items-center gap-0.5"
                    title={t.habitActionActive || '⚡ Acció activa'}
                  >
                    {t.habitActionActive || '⚡ Acció activa'}
                  </span>
                )
              ) : (
                <button
                  type="button"
                  onClick={() => handleConvertHabitToTodayTask(habit)}
                  className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/70 rounded text-[9px] font-semibold transition flex items-center gap-0.5"
                  title={t.convertHabitToTodayTaskTooltip || "Crear la tasca d'acció d'avui per aquest hàbit"}
                >
                  <ListPlus className="w-2.5 h-2.5" />
                  <span>{t.convertHabitToTodayTask || "+ Acció d'avui"}</span>
                </button>
              )}
              <span className="text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300">
                {habit.difficulty === 'trivial' ? 'XS' : habit.difficulty === 'easy' ? 'S' : habit.difficulty === 'medium' ? 'M' : 'L'}
              </span>
            </div>
          </div>
        );
      }

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
                        ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        : habit.difficulty === 'medium'
                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        : habit.difficulty === 'trivial'
                        ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                        : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    }`}
                    title={
                      habit.difficulty === 'trivial'
                        ? 'XS (5–15m)'
                        : habit.difficulty === 'medium'
                        ? 'M (30–60m)'
                        : habit.difficulty === 'hard'
                        ? 'L (60m+)'
                        : 'S (15–30m)'
                    }
                  >
                    {habit.difficulty === 'trivial' ? 'XS' : habit.difficulty === 'easy' ? 'S' : habit.difficulty === 'medium' ? 'M' : 'L'}
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

              {/* Habit Stacking Cue Pill */}
              {habit.anchor_habit_title && (
                <div className="mt-1 flex items-center gap-1 text-[10px] text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-800/60 font-medium">
                  <span>🔗</span>
                  <span>After: {habit.anchor_habit_title}</span>
                </div>
              )}

              {/* Micro-Habit Starter Step Chip with 1-Tap Floor Completion */}
              {habit.micro_habit_title && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isDone) {
                      handleScoreTask(habit.id, 'up');
                      setMindfulReflection('🌱 Starter step logged! You maintained your habit momentum on a low-spoon day.');
                      if (reflectionTimeoutRef.current) clearTimeout(reflectionTimeoutRef.current);
                      reflectionTimeoutRef.current = setTimeout(() => setMindfulReflection(null), 7000);
                    }
                  }}
                  className={`mt-1 inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-md border font-medium transition cursor-pointer select-none ${
                    isDone
                      ? 'bg-emerald-100/60 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                      : 'bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-700 active:scale-95'
                  }`}
                  title={isDone ? 'Starter step completed' : 'Tap to log starter step (< 30s floor habit)'}
                >
                  <span>🌱</span>
                  <span className="font-semibold">Starter Step:</span>
                  <span className={isDone ? 'line-through text-stone-500' : ''}>{habit.micro_habit_title}</span>
                  {!isDone && (
                    <span className="ml-1 text-[9px] bg-emerald-600 hover:bg-emerald-700 text-white px-1.5 py-0.2 rounded font-bold shadow-2xs">
                      Do Now
                    </span>
                  )}
                </div>
              )}

              {/* Cadence info & Streak & Compassionate Grace Shield */}
              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px] text-stone-400">
                {habit.type === 'daily' && (
                  <div className="flex items-center gap-1.5">
                    <span className="flex items-center gap-0.5 text-amber-600 font-semibold font-mono">
                      <Flame className="w-3 h-3 text-amber-500" />
                      {habit.streak}d streak
                    </span>
                    <StreakGrowthBadge streak={habit.streak} size="xs" />
                    {inGrace && (
                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md text-[9px] font-semibold bg-sky-100 dark:bg-sky-950/70 border border-sky-300 dark:border-sky-700 text-sky-800 dark:text-sky-200"
                        title={getStreakGraceMessage(habit.streak, true)}
                      >
                        <span>🛡️</span>
                        <span>Shield Active</span>
                      </span>
                    )}
                  </div>
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
              <button
                type="button"
                onClick={() => {
                  setGoblinTask(habit);
                  setGoblinModalOpen(true);
                }}
                className="text-[10px] text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-1.5 py-0.5 rounded font-medium transition flex items-center gap-0.5"
                title="Goblin Brain: Demolish this routine into micro starter steps"
              >
                <span>👺</span>
                <span className="hidden sm:inline">Goblin</span>
              </button>

              {todayAction ? (
                todayAction.completed ? (
                  <span
                    className="text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/90 dark:border-emerald-800 px-2 py-0.5 rounded font-medium flex items-center gap-1"
                    title={t.habitActionDone || '✓ Acció feta'}
                  >
                    {t.habitActionDone || '✓ Acció feta'}
                  </span>
                ) : (
                  <span
                    className="text-[10px] text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border border-purple-200/90 dark:border-purple-800 px-2 py-0.5 rounded font-medium flex items-center gap-1"
                    title={t.habitActionActive || '⚡ Acció activa'}
                  >
                    {t.habitActionActive || '⚡ Acció activa'}
                  </span>
                )
              ) : (
                <button
                  type="button"
                  onClick={() => handleConvertHabitToTodayTask(habit)}
                  className="text-[10px] text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/90 dark:border-indigo-800 px-2 py-0.5 rounded font-medium transition flex items-center gap-1"
                  title={t.convertHabitToTodayTaskTooltip || "Crear la tasca d'acció d'avui per aquest hàbit"}
                >
                  <ListPlus className="w-2.5 h-2.5 text-indigo-600 dark:text-indigo-400" />
                  <span>{t.convertHabitToTodayTask || "+ Acció d'avui"}</span>
                </button>
              )}

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
                {t.subtabDueToday}
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
              <span>{t.subtabAll}</span>
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
              <span>{t.timeFilterMorning}</span>
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
              <span>{t.timeFilterWorkday}</span>
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
              <span>{t.timeFilterEvening}</span>
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
              <span>{t.timeFilterAnytime}</span>
              <span className="text-[9px] opacity-75 font-mono">({habitCounts.anytime})</span>
            </button>
          </div>
        </div>

        {/* Habit Cards Container */}
        <div className="p-3 space-y-2.5 overflow-y-auto flex-1">
          {baseHabitsList.length === 0 ? (
            <div className="text-center py-12 px-4 text-xs text-stone-400">
              <p className="font-medium text-stone-500 mb-1">{t.noHabitsMessage}</p>
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
            const droppedTask = tasks.find((t) => t.id === id);
            if (droppedTask && (droppedTask.type === 'habit' || droppedTask.type === 'daily')) {
              handleConvertHabitToTodayTask(droppedTask);
            } else if (taskTab === 'todo') {
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
              {t.tasksTitle} ({tasksList.length})
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
                {t.subtabAll} ({allTasksList.length})
              </button>
              <button
                onClick={() => setTaskTab('todo')}
                className={`px-2 py-0.5 rounded-md font-medium transition ${
                  taskTab === 'todo' ? 'bg-white text-indigo-700 shadow-2xs font-semibold' : 'text-stone-500'
                }`}
              >
                {t.subtabToDo} ({todoTasksCount})
              </button>
              <button
                onClick={() => setTaskTab('without_timeline')}
                className={`px-2 py-0.5 rounded-md font-medium transition ${
                  taskTab === 'without_timeline'
                    ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                    : 'text-stone-500'
                }`}
              >
                {t.subtabWithoutTimeline} ({withoutTimelineCount})
              </button>
            </div>

            {/* Compassionate Sweep to Tomorrow */}
            <button
              type="button"
              onClick={handleSweepIncompleteToTomorrow}
              className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 rounded-md text-[11px] font-medium transition cursor-pointer"
              title="Gently shift all unfinished tasks scheduled for today to tomorrow with zero guilt"
            >
              <span>🧹</span>
              <span className="hidden sm:inline">Sweep to Tomorrow</span>
            </button>

            {/* Compassionate Stale Backlog Triage */}
            {staleTasksList.length > 0 && (
              <button
                type="button"
                onClick={handleTriageStaleTasks}
                className="flex items-center gap-1 px-2 py-0.5 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-900 dark:text-purple-200 border border-purple-200/80 dark:border-purple-800 rounded-md text-[11px] font-medium transition cursor-pointer"
                title="Gently rest stale tasks (>7 days old) into Someday"
              >
                <span>🧺</span>
                <span className="hidden sm:inline">Rest Stale ({staleTasksList.length})</span>
              </button>
            )}

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
              <span>{t.plusTodayBtn}</span>
            </button>
          </div>
        </div>

        {/* Task Cards */}
        <div className="p-3 space-y-2.5 overflow-y-auto flex-1">
          {tasksList.length === 0 ? (
            <div className="text-center py-12 px-4 text-xs text-stone-400">
              <p className="font-medium text-stone-500 mb-1">{t.noTasksMessage}</p>
            </div>
          ) : (
            tasksList.map((task) => {
              const isDone = Boolean(task.completed);
              if (zenMode && isDone) return null;
              const hasDeadline = Boolean(task.due_date || task.scheduled_date);
              const isDueToday = task.due_date?.slice(0, 10) === todayStr;

              if (densityMode === 'compact') {
                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', task.id);
                      setDraggedTaskId(task.id);
                    }}
                    onDragEnd={() => setDraggedTaskId(null)}
                    onClick={() => {
                      setEditingTask(task);
                      setTaskModalOpen(true);
                    }}
                    className={`px-3 py-2 rounded-xl border transition shadow-2xs flex items-center justify-between gap-2.5 cursor-pointer select-none ${
                      isDone
                        ? 'bg-stone-50/70 border-stone-200/80 text-stone-400 opacity-60'
                        : task.habit_id
                        ? 'bg-purple-50/20 dark:bg-purple-950/20 border-purple-200/90 dark:border-purple-800/80 hover:border-purple-400'
                        : 'bg-white dark:bg-stone-800 border-stone-200/90 dark:border-stone-700/80 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleScoreTask(task.id, 'up');
                        }}
                        className="text-stone-400 hover:text-indigo-600 shrink-0"
                        title={isDone ? 'Mark incomplete' : 'Mark complete'}
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </button>
                      {task.habit_id && (
                        <span className="text-[10px] text-purple-600 dark:text-purple-400 shrink-0 font-bold" title={t.habitActionBadge || "Acció d'hàbit"}>
                          🔁
                        </span>
                      )}
                      <span className={`text-xs font-medium truncate ${isDone ? 'line-through text-stone-400' : 'text-stone-800 dark:text-stone-200'}`}>
                        {task.title}
                      </span>
                      {isTaskStale(task) && (
                        <span className="text-[10px] text-purple-600 dark:text-purple-400 font-mono shrink-0" title="Stale task (>7 days)">
                          ⏳
                        </span>
                      )}
                      {task.scheduled_start && (
                        <span className="text-[10px] text-indigo-600 font-mono font-medium flex items-center gap-0.5 shrink-0">
                          <Clock className="w-3 h-3" />
                          {task.scheduled_start}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handlePushTaskToTomorrow(task.id)}
                        className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200"
                        title="Push to tomorrow"
                      >
                        ⏩
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setGoblinTask(task);
                          setGoblinModalOpen(true);
                        }}
                        className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200"
                        title="Goblin Brain Starter Steps"
                      >
                        👺
                      </button>
                      <span className="text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300">
                        {task.difficulty === 'trivial' ? 'XS' : task.difficulty === 'easy' ? 'S' : task.difficulty === 'medium' ? 'M' : 'L'}
                      </span>
                    </div>
                  </div>
                );
              }

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
                      : task.habit_id
                      ? 'bg-purple-50/20 border-purple-200/90 hover:border-purple-300'
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
                              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                              : task.difficulty === 'medium'
                              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                              : task.difficulty === 'trivial'
                              ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                              : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          }`}
                          title={
                            task.difficulty === 'trivial'
                              ? 'XS (5–15m)'
                              : task.difficulty === 'medium'
                              ? 'M (30–60m)'
                              : task.difficulty === 'hard'
                              ? 'L (60m+)'
                              : 'S (15–30m)'
                          }
                        >
                          {task.difficulty === 'trivial' ? 'XS' : task.difficulty === 'easy' ? 'S' : task.difficulty === 'medium' ? 'M' : 'L'}
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

                      {/* Habit Action Indicator */}
                      {task.habit_id && (() => {
                        const parentHabit = tasks.find((h) => h.id === task.habit_id);
                        return (
                          <div className="mt-1 flex items-center justify-between gap-1 text-[10px] text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800 font-medium">
                            <div className="flex items-center gap-1 truncate">
                              <span>🔁</span>
                              <span className="font-semibold">{t.habitActionBadge || "Acció d'hàbit"}:</span>
                              <span className="truncate">{parentHabit ? parentHabit.title : ''}</span>
                            </div>
                            {parentHabit && (parentHabit.streak !== undefined || parentHabit.counter_up !== undefined) && (
                              <span className="shrink-0 text-amber-600 dark:text-amber-400 font-bold">
                                🔥 {parentHabit.streak || parentHabit.counter_up || 0}d
                              </span>
                            )}
                          </div>
                        );
                      })()}

                      {/* Habit Stacking Cue Pill */}
                      {task.anchor_habit_title && (
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-800/60 font-medium">
                          <span>🔗</span>
                          <span>After: {task.anchor_habit_title}</span>
                        </div>
                      )}

                      {/* Micro-Habit Starter Step Chip with 1-Tap Floor Completion */}
                      {task.micro_habit_title && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isDone) {
                              handleScoreTask(task.id, 'up');
                              setMindfulReflection('🌱 Starter step logged! You maintained your momentum on a low-spoon day.');
                              if (reflectionTimeoutRef.current) clearTimeout(reflectionTimeoutRef.current);
                              reflectionTimeoutRef.current = setTimeout(() => setMindfulReflection(null), 7000);
                            }
                          }}
                          className={`mt-1 inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-md border font-medium transition cursor-pointer select-none ${
                            isDone
                              ? 'bg-emerald-100/60 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                              : 'bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-700 active:scale-95'
                          }`}
                          title={isDone ? 'Starter step completed' : 'Tap to complete starter step (< 30s)'}
                        >
                          <span>🌱</span>
                          <span className="font-semibold">Starter Step:</span>
                          <span className={isDone ? 'line-through text-stone-500' : ''}>{task.micro_habit_title}</span>
                          {!isDone && (
                            <span className="ml-1 text-[9px] bg-emerald-600 hover:bg-emerald-700 text-white px-1.5 py-0.2 rounded font-bold shadow-2xs">
                              Do Now
                            </span>
                          )}
                        </div>
                      )}

                      {/* Compassionate Stale Backlog Triage Badge */}
                      {isTaskStale(task) && (
                        <div className="mt-1 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <span className="text-[10px] text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800/60 font-medium inline-flex items-center gap-1">
                            <span>⏳</span>
                            <span>Stale (7d+)</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const futureDate = new Date();
                              futureDate.setDate(futureDate.getDate() + 30);
                              handleScheduleTask(task.id, futureDate.toISOString().slice(0, 10));
                              setMindfulReflection('🧺 Task rested to Someday. Zero guilt!');
                              if (reflectionTimeoutRef.current) clearTimeout(reflectionTimeoutRef.current);
                              reflectionTimeoutRef.current = setTimeout(() => setMindfulReflection(null), 7000);
                            }}
                            className="text-[10px] text-stone-600 dark:text-stone-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/60 px-1.5 py-0.5 rounded border border-stone-200 dark:border-stone-700 transition cursor-pointer"
                            title="Rest task to Someday (+30 days)"
                          >
                            <span>Rest to Someday</span>
                          </button>
                        </div>
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
                              {isDueToday ? t.taskBtnToday : `${t.duePrefix} ${task.due_date}`}
                            </span>
                          ) : (
                            <span className="text-stone-400 italic">{t.noTimeline}</span>
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
                              {t.plusTodayBtn}
                            </button>
                          )}

                          {isDueToday && !task.scheduled_start && (
                            <button
                              onClick={() => handleQuickScheduleTodayToAgenda(task.id)}
                              className="text-[10px] text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded font-medium transition flex items-center gap-0.5"
                              title="Place onto today's agenda time grid"
                            >
                              <Clock className="w-2.5 h-2.5 text-emerald-600" />
                              <span>{t.taskBtnAgenda}</span>
                            </button>
                          )}

                          {/* 1-Tap Defer to Tomorrow */}
                          <button
                            type="button"
                            onClick={() => handlePushTaskToTomorrow(task.id)}
                            className="text-[10px] text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded font-medium transition flex items-center gap-0.5"
                            title="Gently push task to tomorrow"
                          >
                            <span>⏩</span>
                            <span className="hidden sm:inline">Tomorrow</span>
                          </button>

                          {/* Goblin Brain Demolisher */}
                          <button
                            type="button"
                            onClick={() => {
                              setGoblinTask(task);
                              setGoblinModalOpen(true);
                            }}
                            className="text-[10px] text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-1.5 py-0.5 rounded font-medium transition flex items-center gap-0.5"
                            title="Goblin Brain: Demolish this task into micro starter steps"
                          >
                            <span>👺</span>
                            <span className="hidden sm:inline">Goblin</span>
                          </button>

                          {hasDeadline && (
                            <button
                              onClick={() => handleSetTaskDate(task.id, null)}
                              className="text-[10px] text-stone-400 hover:text-stone-700 px-1.5 py-0.5 rounded hover:bg-stone-100"
                              title="Return to Without Timeline backlog"
                            >
                              {t.taskBtnClear}
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
