import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';

export interface TimeTimerDiskProps {
  initialMinutes?: number;
  onComplete?: () => void;
  compact?: boolean;
}

export const TimeTimerDisk: React.FC<TimeTimerDiskProps> = ({
  initialMinutes = 25,
  onComplete,
  compact = false,
}) => {
  const { t } = useTranslation();
  const [totalMinutes, setTotalMinutes] = useState(initialMinutes);
  const [secondsRemaining, setSecondsRemaining] = useState(initialMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const initialTitleRef = useRef<string>('');

  useEffect(() => {
    if (typeof document !== 'undefined' && !initialTitleRef.current) {
      initialTitleRef.current = document.title;
    }
  }, []);

  // Sync when initialMinutes prop changes
  useEffect(() => {
    setTotalMinutes(initialMinutes);
    setSecondsRemaining(initialMinutes * 60);
    setIsRunning(false);
  }, [initialMinutes]);

  // Tick
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

  // Sound chime helper
  const playChime = () => {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now); // E5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.2); // A5
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.2);
    } catch (e) {
      console.debug('Chime error', e);
    }
  };

  // Completion
  useEffect(() => {
    if (isRunning && secondsRemaining === 0) {
      setIsRunning(false);
      if (soundEnabled) playChime();
      if (onComplete) onComplete();
    }
  }, [secondsRemaining, isRunning, soundEnabled, onComplete]);

  // Sync title
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (isRunning) {
      const m = Math.floor(secondsRemaining / 60);
      const s = secondsRemaining % 60;
      document.title = `(${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}) ⏳ ${t.timeTimerFocusTitle || 'Focus'}`;
    } else if (initialTitleRef.current) {
      document.title = initialTitleRef.current;
    }
  }, [isRunning, secondsRemaining, t.timeTimerFocusTitle]);

  const handleSetDuration = (mins: number) => {
    setTotalMinutes(mins);
    setSecondsRemaining(mins * 60);
    setIsRunning(false);
  };

  const handleToggle = () => {
    if (secondsRemaining === 0) {
      setSecondsRemaining(totalMinutes * 60);
      setIsRunning(true);
      return;
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsRemaining(totalMinutes * 60);
  };

  const totalSeconds = totalMinutes * 60;
  const ratio = totalSeconds > 0 ? secondsRemaining / totalSeconds : 0;
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Calculate SVG Wedge for Time Timer (360 degrees dial)
  // The wedge represents the remaining time. Angle starts at top (0 rad) and goes clockwise up to ratio * 360 deg.
  const size = compact ? 120 : 160;
  const center = size / 2;
  const radius = center - 12;

  const angleDeg = ratio * 360;
  const angleRad = (angleDeg - 90) * (Math.PI / 180);
  const startX = center;
  const startY = center - radius;
  const endX = center + radius * Math.cos(angleRad);
  const endY = center + radius * Math.sin(angleRad);
  const largeArcFlag = angleDeg > 180 ? 1 : 0;

  // Path for remaining pie slice
  const pathData =
    angleDeg >= 359.9
      ? `M ${center} ${center} m -${radius}, 0 a ${radius},${radius} 0 1,0 ${radius * 2},0 a ${radius},${radius} 0 1,0 -${radius * 2},0`
      : angleDeg <= 0.1
      ? ''
      : `M ${center} ${center} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;

  return (
    <div className={`flex flex-col items-center select-none ${compact ? 'gap-2' : 'gap-3'}`}>
      {/* Duration Selector Buttons */}
      {!compact && (
        <div className="flex items-center gap-1.5 p-1 bg-stone-100 dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700 rounded-xl">
          {[15, 25, 45].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => handleSetDuration(m)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                totalMinutes === m
                  ? 'bg-white dark:bg-stone-700 text-indigo-700 dark:text-indigo-300 shadow-2xs font-bold'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              {m}m
            </button>
          ))}
        </div>
      )}

      {/* SVG Analog Time Timer Dial */}
      <div className="relative flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Clock background ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            className="fill-stone-100/90 dark:fill-stone-800 stroke-stone-200 dark:stroke-stone-700"
            strokeWidth="3"
          />

          {/* Tick marks */}
          {[...Array(12)].map((_, i) => {
            const rot = i * 30;
            return (
              <line
                key={i}
                x1={center}
                y1={center - radius + 2}
                x2={center}
                y2={center - radius + (i % 3 === 0 ? 8 : 4)}
                className={i % 3 === 0 ? 'stroke-stone-400 dark:stroke-stone-500' : 'stroke-stone-300 dark:stroke-stone-600'}
                strokeWidth={i % 3 === 0 ? '2' : '1'}
                transform={`rotate(${rot} ${center} ${center})`}
              />
            );
          })}

          {/* Colored Time Wedge (Red/Rose for ADHD urgency perception) */}
          {pathData && (
            <path
              d={pathData}
              className="fill-rose-500/85 transition-all duration-300 ease-out"
            />
          )}

          {/* Center Pivot Pin */}
          <circle cx={center} cy={center} r="5" className="fill-stone-700 dark:fill-stone-300 stroke-white dark:stroke-stone-900 stroke-2" />
        </svg>

        {/* Center Digital Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className={`font-mono font-bold tracking-tight text-stone-900 dark:text-stone-100 ${compact ? 'text-sm' : 'text-lg'}`}>
            {formattedTime}
          </span>
          <span className="text-[9px] uppercase font-bold tracking-wider text-stone-500 dark:text-stone-400">
            {isRunning ? (t.timeTimerStatusFocusing || 'Focusing') : secondsRemaining === 0 ? (t.timeTimerStatusDone || 'Done!') : (t.timeTimerStatusPaused || 'Paused')}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleToggle}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white shadow-xs transition active:scale-95 ${
            isRunning
              ? 'bg-amber-600 hover:bg-amber-700'
              : 'bg-rose-600 hover:bg-rose-700'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>{t.timeTimerPause || 'Pause'}</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{t.timeTimerStart || 'Start'}</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="p-1.5 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 transition"
          title={t.timeTimerResetTitle || 'Reset timer'}
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition"
          title={soundEnabled ? (t.timeTimerSoundEnabled || 'Sound enabled') : (t.timeTimerSoundMuted || 'Sound muted')}
        >
          {soundEnabled ? (
            <Volume2 className="w-3.5 h-3.5 text-stone-600 dark:text-stone-300" />
          ) : (
            <VolumeX className="w-3.5 h-3.5 text-stone-400 dark:text-stone-600" />
          )}
        </button>
      </div>
    </div>
  );
};
