import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, X, Volume2, VolumeX } from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';
import { Task } from '../types';

export interface PomodoroTimerProps {
  onBlockOnAgenda?: (title: string, duration: number) => void;
  tasks?: Task[];
  onScoreTask?: (taskId: string, direction: 'up') => void;
  isOpen?: boolean;
  onToggleOpen?: () => void;
}

const DEFAULT_MINUTES = 25;
const DEFAULT_SECONDS = DEFAULT_MINUTES * 60;

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

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ onToggleOpen }) => {
  const { t } = useTranslation();
  const [isRunning, setIsRunning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(DEFAULT_SECONDS);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const initialTitleRef = useRef<string>('');

  useEffect(() => {
    if (typeof document !== 'undefined' && !initialTitleRef.current) {
      initialTitleRef.current = document.title;
    }
  }, []);

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

  // Completion check
  useEffect(() => {
    if (isRunning && secondsRemaining === 0) {
      setIsRunning(false);
      setIsCompleted(true);
      if (soundEnabled) {
        playChime();
      }
    }
  }, [secondsRemaining, isRunning, soundEnabled]);

  // Document Title synchronization
  useEffect(() => {
    if (typeof document === 'undefined') return;

    if (isRunning) {
      const mins = Math.floor(secondsRemaining / 60);
      const secs = secondsRemaining % 60;
      const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      document.title = `(${formatted}) 🍅 Pomodoro`;
    } else if (initialTitleRef.current) {
      document.title = initialTitleRef.current;
    }

    return () => {
      if (typeof document !== 'undefined' && initialTitleRef.current) {
        document.title = initialTitleRef.current;
      }
    };
  }, [isRunning, secondsRemaining]);

  const handleTogglePlay = () => {
    if (isCompleted) {
      setSecondsRemaining(DEFAULT_SECONDS);
      setIsCompleted(false);
      setIsRunning(true);
      return;
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsRemaining(DEFAULT_SECONDS);
    setIsCompleted(false);
  };

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progressPercent = ((DEFAULT_SECONDS - secondsRemaining) / DEFAULT_SECONDS) * 100;

  return (
    <section className="bg-white/95 backdrop-blur-xs border-b border-stone-200/80 px-4 py-2.5 transition-all shadow-2xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Icon, Title & Status */}
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🍅</span>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-stone-900">
              {t.pomodoroTitle || 'Pomodoro'}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-rose-50 text-rose-700 border border-rose-200/60">
              25m
            </span>
          </div>
          {isCompleted && (
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              Session completed!
            </span>
          )}
        </div>

        {/* Center / Right: Big Clean Clock & Controls */}
        <div className="flex items-center gap-3">
          <div className="font-mono text-2xl font-bold tracking-tight text-stone-800 select-none">
            {formattedTime}
          </div>

          <button
            type="button"
            onClick={handleTogglePlay}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white shadow-xs transition active:scale-95 ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>{t.pausePomodoro || 'Pause'}</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{t.startPomodoro || 'Start'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-xl border border-stone-200/80 transition"
            title={t.resetPomodoro || 'Reset to 25m'}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-xl transition"
            title={soundEnabled ? 'Chime sound enabled' : 'Chime sound muted'}
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-stone-300" />
            )}
          </button>

          {onToggleOpen && (
            <button
              type="button"
              onClick={onToggleOpen}
              className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-xl transition ml-1"
              title="Close Pomodoro bar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Thin subtle progress bar */}
      <div className="max-w-7xl mx-auto mt-2 w-full bg-stone-100 rounded-full h-1 overflow-hidden">
        <div
          className="h-full bg-rose-500 transition-all duration-1000 ease-linear rounded-full"
          style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
        />
      </div>
    </section>
  );
};
