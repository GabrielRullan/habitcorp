import React, { useState } from 'react';
import { Task } from '../types';
import {
  X,
  CheckCircle2,
  Moon,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Heart,
} from 'lucide-react';

interface DailyShutdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  completedTasks: Task[];
  pendingTodayTasks: Task[];
  onSweepToTomorrow: () => Promise<void>;
}

export const DailyShutdownModal: React.FC<DailyShutdownModalProps> = ({
  isOpen,
  onClose,
  completedTasks,
  pendingTodayTasks,
  onSweepToTomorrow,
}) => {
  const [sweeping, setSweeping] = useState(false);
  const [shutdownComplete, setShutdownComplete] = useState(false);

  if (!isOpen) return null;

  const handleSweep = async () => {
    setSweeping(true);
    try {
      await onSweepToTomorrow();
    } finally {
      setSweeping(false);
    }
  };

  const handleFinish = () => {
    setShutdownComplete(true);
    setTimeout(() => {
      onClose();
      setShutdownComplete(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl overflow-hidden text-stone-900 dark:text-stone-100 p-6 md:p-8 space-y-6 text-center relative">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-xl text-lg">
              🌙
            </span>
            <span className="text-sm font-bold tracking-tight">Evening Shutdown & Peace</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {shutdownComplete ? (
          <div className="py-10 space-y-3 animate-in zoom-in-95 duration-300">
            <span className="text-5xl select-none">✨</span>
            <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
              Shutdown Complete. Rest Well!
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
              Your mental slate is cleared. Work is done for today. Enjoy your evening without guilt.
            </p>
          </div>
        ) : (
          <>
            {/* Step 1: Celebrate Completed Wins */}
            <div className="space-y-2 text-left bg-stone-50 dark:bg-stone-950 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Today's Accomplishments ({completedTasks.length})</span>
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                  {completedTasks.length > 0 ? '✨ Great job!' : '🌱 Every step counts'}
                </span>
              </div>

              {completedTasks.length === 0 ? (
                <p className="text-xs text-stone-400 italic py-2">
                  No tasks marked complete today. Remember: resting and protecting your spoons is also progress.
                </p>
              ) : (
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {completedTasks.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-2 text-xs text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-900 px-2.5 py-1.5 rounded-lg border border-stone-200/60 dark:border-stone-800"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="truncate">{t.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Step 2: Unfinished Tasks Compassionate Sweep */}
            {pendingTodayTasks.length > 0 && (
              <div className="space-y-2 text-left bg-amber-50/70 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200/70 dark:border-amber-900/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <span>🧹</span>
                    <span>Remaining for Today ({pendingTodayTasks.length})</span>
                  </span>
                  <span className="text-[10px] text-amber-700 dark:text-amber-400">
                    No guilt, no penalty
                  </span>
                </div>
                <p className="text-xs text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
                  Sweep unfinished tasks to tomorrow with 1 tap so they don't linger in your thoughts tonight.
                </p>
                <button
                  type="button"
                  onClick={handleSweep}
                  disabled={sweeping}
                  className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <span>🧹</span>
                  <span>{sweeping ? 'Sweeping...' : `Sweep ${pendingTodayTasks.length} Tasks to Tomorrow`}</span>
                </button>
              </div>
            )}

            {/* Step 3: Clear Mind Shutdown Ritual Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleFinish}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl text-sm font-bold shadow-md transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Moon className="w-4 h-4 fill-current" />
                <span>Complete Daily Shutdown & Disconnect</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DailyShutdownModal;
