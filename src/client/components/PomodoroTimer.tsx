import React, { useState, useEffect, useMemo } from 'react';
import { Task } from '../types';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  CalendarPlus,
  Volume2,
  VolumeX,
  Droplets,
  Eye,
  Activity,
  Check,
  ChevronDown,
  ChevronUp,
  Coffee,
  Sparkles,
  Clock,
  Target,
  Plus,
  Minus,
} from 'lucide-react';

export type PomodoroMode = 'pomodoro' | 'short_break' | 'long_break' | 'deep_flow';

interface ModeConfig {
  id: PomodoroMode;
  label: string;
  minutes: number;
  type: 'work' | 'break';
  icon: string;
  description: string;
  badgeClass: string;
}

const MODES: ModeConfig[] = [
  {
    id: 'pomodoro',
    label: 'Pomodoro',
    minutes: 25,
    type: 'work',
    icon: '🍅',
    description: '25-minute focused work burst',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  {
    id: 'short_break',
    label: 'Short Break',
    minutes: 5,
    type: 'break',
    icon: '☕',
    description: '5-minute recharge and rest',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    id: 'long_break',
    label: 'Long Break',
    minutes: 15,
    type: 'break',
    icon: '🌴',
    description: '15-minute restorative reset',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
  },
  {
    id: 'deep_flow',
    label: 'Deep Flow',
    minutes: 50,
    type: 'work',
    icon: '⚡',
    description: '50-minute ultradian deep work session',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
];

interface HealthCue {
  id: string;
  emoji: string;
  title: string;
  description: string;
  colorClass: string;
  icon: React.ReactNode;
}

const HEALTH_CUES: HealthCue[] = [
  {
    id: 'hydration',
    emoji: '💧',
    title: 'Hydration',
    description: 'Drink a glass of water',
    colorClass: 'bg-sky-50 border-sky-200 text-sky-800',
    icon: <Droplets className="w-3.5 h-3.5 text-sky-600" />,
  },
  {
    id: 'posture',
    emoji: '🧘',
    title: 'Posture & Stretch',
    description: 'Stand up & roll shoulders',
    colorClass: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    icon: <Activity className="w-3.5 h-3.5 text-emerald-600" />,
  },
  {
    id: 'eye_rest',
    emoji: '👁️',
    title: '20-20-20 Eye Rest',
    description: 'Look 20ft away for 20 seconds',
    colorClass: 'bg-teal-50 border-teal-200 text-teal-800',
    icon: <Eye className="w-3.5 h-3.5 text-teal-600" />,
  },
];

// Soothing chime via Web Audio API
function playChime() {
  try {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.linearRampToValueAtTime(0.25, now + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 1.2);
  } catch (e) {
    console.debug('Audio chime error:', e);
  }
}

export interface PomodoroTimerProps {
  onBlockOnAgenda: (title: string, duration: number) => void;
  tasks?: Task[];
  onScoreTask?: (taskId: string, direction: 'up') => void;
  isOpen?: boolean;
  onToggleOpen?: () => void;
}

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  onBlockOnAgenda,
  tasks = [],
  onScoreTask,
  isOpen = true,
  onToggleOpen,
}) => {
  const [mode, setMode] = useState<PomodoroMode>('pomodoro');
  const [isRunning, setIsRunning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [targetDurationMinutes, setTargetDurationMinutes] = useState(25);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Cycle tracking (4 pomodoros per cycle)
  const [cycleIndex, setCycleIndex] = useState(1); // 1 to 4
  const [completedCount, setCompletedCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('habitcorp_pomodoro_completed_today');
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });

  // Task linking
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [blockedFeedback, setBlockedFeedback] = useState(false);
  const [completedNotification, setCompletedNotification] = useState<string | null>(null);

  // Break cues
  const [completedCues, setCompletedCues] = useState<Record<string, boolean>>({});

  const currentModeConfig = useMemo(() => {
    return MODES.find((m) => m.id === mode) || MODES[0];
  }, [mode]);

  // Selected task object
  const activeTask = useMemo(() => {
    return tasks.find((t) => t.id === selectedTaskId);
  }, [tasks, selectedTaskId]);

  // Switch mode
  const handleSelectMode = (newMode: PomodoroMode) => {
    const config = MODES.find((m) => m.id === newMode) || MODES[0];
    setMode(newMode);
    setIsRunning(false);
    setTargetDurationMinutes(config.minutes);
    setSecondsRemaining(config.minutes * 60);
    setCompletedNotification(null);
  };

  // Adjust time (+ / - minutes)
  const handleAdjustTime = (deltaMinutes: number) => {
    setSecondsRemaining((prev) => {
      const next = prev + deltaMinutes * 60;
      return Math.max(60, Math.min(180 * 60, next)); // 1m min, 180m max
    });
    setTargetDurationMinutes((prev) => Math.max(1, prev + deltaMinutes));
  };

  // Reset timer
  const handleReset = () => {
    setIsRunning(false);
    setSecondsRemaining(targetDurationMinutes * 60);
    setCompletedNotification(null);
  };

  // Skip to next phase
  const handleSkip = () => {
    setIsRunning(false);
    if (currentModeConfig.type === 'work') {
      // Transition to break
      if (cycleIndex >= 4) {
        handleSelectMode('long_break');
        setCycleIndex(1);
      } else {
        handleSelectMode('short_break');
        setCycleIndex((c) => c + 1);
      }
    } else {
      // Transition to Pomodoro
      handleSelectMode('pomodoro');
    }
  };

  // Block on Agenda
  const handleBlockOnAgenda = () => {
    const title = activeTask ? activeTask.title : `${currentModeConfig.icon} ${currentModeConfig.label} Session`;
    onBlockOnAgenda(title, Math.max(15, Math.round(targetDurationMinutes)));
    setBlockedFeedback(true);
    setTimeout(() => setBlockedFeedback(false), 2500);
  };

  // Toggle Health Cue
  const toggleCue = (id: string) => {
    setCompletedCues((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Timer Tick
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev > 1) return prev - 1;
        return 0;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  // Handle completion
  useEffect(() => {
    if (isRunning && secondsRemaining === 0) {
      setIsRunning(false);
      if (soundEnabled) {
        playChime();
      }

      if (currentModeConfig.type === 'work') {
        const newCount = completedCount + 1;
        setCompletedCount(newCount);
        try {
          localStorage.setItem('habitcorp_pomodoro_completed_today', String(newCount));
        } catch {}

        setCompletedNotification(
          `🎉 Great focus burst! Pomodoro #${cycleIndex} finished. Time for a recharge.`
        );

        // Auto advance cycle
        if (cycleIndex >= 4) {
          setMode('long_break');
          setTargetDurationMinutes(15);
          setSecondsRemaining(15 * 60);
          setCycleIndex(1);
        } else {
          setMode('short_break');
          setTargetDurationMinutes(5);
          setSecondsRemaining(5 * 60);
          setCycleIndex((c) => c + 1);
        }
      } else {
        setCompletedNotification('✨ Break finished! Ready to begin your next Pomodoro.');
        setMode('pomodoro');
        setTargetDurationMinutes(25);
        setSecondsRemaining(25 * 60);
      }
      setCompletedCues({});
    }
  }, [secondsRemaining, isRunning, currentModeConfig, cycleIndex, completedCount, soundEnabled]);

  // Document Title synchronization
  useEffect(() => {
    if (typeof document === 'undefined') return;

    if (isRunning) {
      const mins = Math.floor(secondsRemaining / 60);
      const secs = secondsRemaining % 60;
      const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      document.title = `(${formatted}) ${currentModeConfig.icon} Pomodoro — HabitCorp`;
    } else {
      document.title = 'HabitCorp — The Boring Cousin of Habitica';
    }

    return () => {
      if (typeof document !== 'undefined') {
        document.title = 'HabitCorp — The Boring Cousin of Habitica';
      }
    };
  }, [isRunning, secondsRemaining, currentModeConfig]);

  // Calculation formatting
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const totalSeconds = targetDurationMinutes * 60;
  const progressPercent = Math.min(
    100,
    Math.max(0, ((totalSeconds - secondsRemaining) / totalSeconds) * 100)
  );

  const pendingTasks = useMemo(() => tasks.filter((t) => !t.completed), [tasks]);

  return (
    <section className="bg-white/95 backdrop-blur-xs border-b border-stone-200/80 px-4 py-3 transition-all shadow-2xs">
      <div className="max-w-7xl mx-auto space-y-3">
        {/* COLLAPSED BAR VIEW */}
        {isCollapsed ? (
          <div className="flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="text-base">🍅</span>
              <span className="font-semibold text-stone-900">Pomodoro Timer</span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${currentModeConfig.badgeClass}`}
              >
                {currentModeConfig.icon} {currentModeConfig.label}
              </span>
              <span className="font-mono text-base font-bold text-stone-800">{formattedTime}</span>
              {activeTask && (
                <span className="text-stone-500 truncate max-w-[200px] hidden sm:inline">
                  • {activeTask.title}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsRunning(!isRunning)}
                className={`p-1.5 rounded-lg text-white font-medium transition ${
                  currentModeConfig.type === 'work'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
                title={isRunning ? 'Pause' : 'Start'}
              >
                {isRunning ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              </button>

              <button
                type="button"
                onClick={handleBlockOnAgenda}
                className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200/80 rounded-lg font-semibold text-xs transition"
                title="Block on Agenda"
              >
                {blockedFeedback ? '✓ Scheduled' : 'Block on Agenda'}
              </button>

              <button
                type="button"
                onClick={() => setIsCollapsed(false)}
                className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg transition"
                title="Expand Pomodoro Timer"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* EXPANDED RICH POMODORO TIMER CARD */
          <div className="space-y-3">
            {/* Top Bar: Title, Pomodoro Cycle Counter, Daily Tally, Collapse & Audio */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-stone-100 pb-2.5">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🍅</span>
                  <div>
                    <h2 className="text-sm font-bold text-stone-900 tracking-tight flex items-center gap-1.5">
                      Pomodoro Timer
                      <span className="text-[10px] font-normal text-stone-400 uppercase tracking-widest">
                        Focus & Rest
                      </span>
                    </h2>
                  </div>
                </div>

                {/* 4-Cycle Tomato Dots */}
                <div className="flex items-center gap-1.5 bg-rose-50/70 border border-rose-100 px-2.5 py-1 rounded-full text-rose-800">
                  <span className="text-[11px] font-medium">Cycle {cycleIndex}/4:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4].map((step) => {
                      const isDone = step < cycleIndex;
                      const isCurrent = step === cycleIndex;
                      return (
                        <span
                          key={step}
                          className={`text-xs transition-transform ${
                            isCurrent
                              ? 'scale-125'
                              : isDone
                              ? 'opacity-90'
                              : 'opacity-30 grayscale'
                          }`}
                          title={`Interval ${step} of 4`}
                        >
                          🍅
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Daily Total Counter */}
                <div className="hidden md:inline-flex items-center gap-1 text-stone-500 font-medium">
                  <Target className="w-3.5 h-3.5 text-stone-400" />
                  <span>
                    <strong className="text-stone-800">{completedCount}</strong> pomodoros completed today
                  </span>
                </div>
              </div>

              {/* Right controls: Sound mute, Collapse */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`p-1.5 rounded-lg border text-xs transition ${
                    soundEnabled
                      ? 'border-stone-200 text-stone-600 hover:bg-stone-100'
                      : 'border-stone-200 text-stone-400 bg-stone-50'
                  }`}
                  title={soundEnabled ? 'Chime sound enabled' : 'Chime muted'}
                >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>

                <button
                  type="button"
                  onClick={() => setIsCollapsed(true)}
                  className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100 transition"
                  title="Minimize Pomodoro Bar"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mode Tabs, Big Timer, Adjusters & Play Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Left: Mode Selection Tabs */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <div className="flex p-0.5 bg-stone-100 rounded-xl border border-stone-200/80 text-xs">
                  {MODES.map((m) => {
                    const isSelected = mode === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleSelectMode(m.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                          isSelected
                            ? 'bg-white text-stone-900 font-semibold shadow-2xs'
                            : 'text-stone-500 hover:text-stone-800'
                        }`}
                        title={m.description}
                      >
                        <span>{m.icon}</span>
                        <span>{m.label}</span>
                        <span className="text-[10px] text-stone-400 font-normal">
                          {m.minutes}m
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Center / Right: Big Digital Timer & Action Buttons */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Quick adjustments */}
                <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg border border-stone-200/80 text-xs">
                  <button
                    type="button"
                    onClick={() => handleAdjustTime(-5)}
                    className="px-1.5 py-0.5 text-stone-600 hover:text-stone-900 font-medium rounded hover:bg-white transition"
                    title="-5 minutes"
                  >
                    -5m
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustTime(1)}
                    className="px-1.5 py-0.5 text-stone-600 hover:text-stone-900 font-medium rounded hover:bg-white transition"
                    title="+1 minute"
                  >
                    +1m
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustTime(5)}
                    className="px-1.5 py-0.5 text-stone-600 hover:text-stone-900 font-medium rounded hover:bg-white transition"
                    title="+5 minutes"
                  >
                    +5m
                  </button>
                </div>

                {/* Big Clock Display */}
                <div className="font-mono text-3xl font-black tracking-tight text-stone-800 select-none">
                  {formattedTime}
                </div>

                {/* Play / Pause, Reset, Skip */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsRunning(!isRunning)}
                    className={`flex items-center gap-2 px-4 py-2 text-white font-semibold rounded-xl text-xs shadow-xs transition active:scale-95 ${
                      currentModeConfig.type === 'work'
                        ? 'bg-rose-600 hover:bg-rose-700'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {isRunning ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Start {currentModeConfig.label}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition border border-stone-200/80"
                    title="Reset Timer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={handleSkip}
                    className="p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition border border-stone-200/80"
                    title="Skip to next phase"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={handleBlockOnAgenda}
                    className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-semibold text-xs transition"
                    title="Block on Agenda"
                  >
                    <CalendarPlus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">
                      {blockedFeedback ? '✓ Added to Schedule' : 'Block on Agenda'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Pastel Progress Bar */}
            <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${
                  currentModeConfig.type === 'work'
                    ? 'bg-gradient-to-r from-rose-400 to-rose-600'
                    : 'bg-gradient-to-r from-emerald-400 to-teal-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Bottom Row: Task Linker & Health Break Cues */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs pt-1">
              {/* Task Linker */}
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <span className="text-stone-400 font-medium whitespace-nowrap">Focus on task:</span>
                <select
                  value={selectedTaskId}
                  onChange={(e) => setSelectedTaskId(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-lg px-2.5 py-1 text-xs text-stone-700 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                >
                  <option value="">— Freeform Focus Session —</option>
                  {pendingTasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.difficulty})
                    </option>
                  ))}
                </select>
                {activeTask && onScoreTask && (
                  <button
                    type="button"
                    onClick={() => onScoreTask(activeTask.id, 'up')}
                    className="whitespace-nowrap px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg font-medium transition"
                    title="Mark progress or complete"
                  >
                    ✓ Complete Task
                  </button>
                )}
              </div>

              {/* Health & Break Cues (active or visible during break) */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-stone-400 font-medium hidden lg:inline">Micro-breaks:</span>
                {HEALTH_CUES.map((cue) => {
                  const isChecked = !!completedCues[cue.id];
                  return (
                    <button
                      key={cue.id}
                      type="button"
                      onClick={() => toggleCue(cue.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] transition ${
                        isChecked
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold'
                          : 'bg-stone-50 border-stone-200/80 text-stone-600 hover:bg-stone-100'
                      }`}
                      title={cue.description}
                    >
                      <span>{cue.emoji}</span>
                      <span>{cue.title}</span>
                      {isChecked && <Check className="w-3 h-3 text-emerald-600" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notification alert banner */}
            {completedNotification && (
              <div className="flex items-center justify-between p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                <div className="flex items-center gap-2 font-medium">
                  <Sparkles className="w-4 h-4 text-rose-600" />
                  <span>{completedNotification}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCompletedNotification(null)}
                  className="text-rose-500 hover:text-rose-700 font-bold px-1.5 py-0.5"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
