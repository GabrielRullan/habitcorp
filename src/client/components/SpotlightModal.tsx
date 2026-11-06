import React, { useState, useEffect } from 'react';
import { Task, Subtask } from '../types';
import {
  X,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Brain,
  Zap,
} from 'lucide-react';
import { TimeTimerDisk } from './TimeTimerDisk';
import { useTranslation } from '../i18n/I18nContext';

interface SpotlightModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  initialTaskId?: string;
  onCompleteTask: (taskId: string) => Promise<void>;
  onToggleSubtask: (taskId: string, subtaskId: string, currentStatus: number) => Promise<void>;
  onOpenGoblinBrain: (task: Task) => void;
}

export const SpotlightModal: React.FC<SpotlightModalProps> = ({
  isOpen,
  onClose,
  tasks,
  initialTaskId,
  onCompleteTask,
  onToggleSubtask,
  onOpenGoblinBrain,
}) => {
  const { t } = useTranslation();
  const pendingTasks = tasks.filter((t) => !t.completed && t.type !== 'habit');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [showTimer, setShowTimer] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (initialTaskId) {
      const idx = pendingTasks.findIndex((t) => t.id === initialTaskId);
      if (idx !== -1) {
        setCurrentIndex(idx);
        return;
      }
    }
    setCurrentIndex(0);
  }, [isOpen, initialTaskId]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' || e.key === 'n') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, pendingTasks.length]);

  const currentTask: Task | undefined = pendingTasks[currentIndex];

  const defaultMinutes =
    currentTask?.difficulty === 'trivial'
      ? 15
      : currentTask?.difficulty === 'easy'
      ? 25
      : currentTask?.difficulty === 'medium'
      ? 35
      : 45;

  const handleNext = () => {
    if (pendingTasks.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % pendingTasks.length);
  };

  const handleMarkComplete = async () => {
    if (!currentTask) return;
    setCompleting(true);
    try {
      await onCompleteTask(currentTask.id);
      if (pendingTasks.length <= 1) {
        onClose();
      }
    } finally {
      setCompleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl overflow-hidden text-stone-900 dark:text-stone-100 p-8 space-y-6 text-center relative"
        style={
          currentTask?.project_color
            ? {
                borderTop: `6px solid ${currentTask.project_color}`,
              }
            : undefined
        }
      >
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.spotlightFocusTunnel || 'Single-Task Focus Tunnel'}</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowTimer((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border transition ${
                showTimer
                  ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 shadow-2xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
              title={t.spotlightToggleTimerTitle || 'Toggle Analog Time-Timer Disk'}
            >
              <span>⏳</span>
              <span className="hidden sm:inline">{showTimer ? (t.spotlightHideTimer || 'Hide Timer') : (t.spotlightShowTimer || 'Analog Timer')}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition"
              title={t.spotlightExitTitle || 'Exit Spotlight (Esc)'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {currentTask ? (
          <>
            {/* Task Card Content */}
            <div className="space-y-3 py-4">
              <div className="flex items-center justify-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                  {currentTask.type === 'daily' ? t.itemTypeDaily : currentTask.type === 'habit' ? t.itemTypeHabit : t.itemTypeTodo} • {t.spotlightSize || 'Size'} {currentTask.difficulty === 'trivial' ? 'XS' : currentTask.difficulty === 'easy' ? 'S' : currentTask.difficulty === 'medium' ? 'M' : 'L'}
                </span>
                {currentTask.project_name && (
                  <span
                    className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1.5"
                    style={{
                      backgroundColor: `${currentTask.project_color || '#6366f1'}15`,
                      color: currentTask.project_color || '#6366f1',
                      borderColor: `${currentTask.project_color || '#6366f1'}40`,
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: currentTask.project_color || '#6366f1' }}
                    />
                    <span>{currentTask.project_name}</span>
                  </span>
                )}
              </div>

              <h1 className="text-3xl font-black text-stone-900 dark:text-stone-100 tracking-tight leading-snug">
                {currentTask.title}
              </h1>

              {currentTask.notes && (
                <p className="text-sm text-stone-500 dark:text-stone-400 max-w-md mx-auto line-clamp-3">
                  {currentTask.notes}
                </p>
              )}
            </div>

            {/* Visual Time-Timer Radial Countdown Disk */}
            {showTimer && (
              <div className="py-2 flex justify-center animate-in zoom-in-95 duration-200">
                <TimeTimerDisk initialMinutes={defaultMinutes} compact={false} />
              </div>
            )}

            {/* Subtasks (if any) */}
            {currentTask.subtasks && currentTask.subtasks.length > 0 && (
              <div className="max-w-md mx-auto bg-stone-50 dark:bg-stone-950 border border-stone-200/80 dark:border-stone-800 rounded-2xl p-4 text-left space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                  {t.spotlightNextStep || 'Next Step:'}
                </span>
                {currentTask.subtasks.map((st) => (
                  <div
                    key={st.id}
                    onClick={() => onToggleSubtask(currentTask.id, st.id, st.completed)}
                    className="flex items-center gap-2 text-xs font-medium cursor-pointer p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                        st.completed
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900'
                      }`}
                    >
                      {st.completed === 1 && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                    <span
                      className={
                        st.completed ? 'line-through text-stone-400 dark:text-stone-500' : 'text-stone-800 dark:text-stone-200'
                      }
                    >
                      {st.title}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Goblin Brain Stuck Helper */}
            <div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenGoblinBrain(currentTask);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl transition"
              >
                <span>👺</span>
                <span>{t.spotlightGoblinPrompt || 'Stuck? Break this down with Goblin Brain'}</span>
              </button>
            </div>

            {/* Main Action Buttons */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleMarkComplete}
                disabled={completing}
                className="flex items-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-2xl shadow-md transition active:scale-95 disabled:opacity-50"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>{completing ? (t.spotlightCompleting || 'Completing...') : (t.spotlightMarkDone || 'Mark Done')}</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 px-5 py-3.5 text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-2xl text-xs font-semibold transition"
                title={t.spotlightSkipTooltip || 'Skip to next task for now (no penalty)'}
              >
                <span>{t.spotlightSkipForNow || 'Skip for now'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-stone-400">
              {typeof t.spotlightTaskProgress === 'function'
                ? t.spotlightTaskProgress(currentIndex + 1, pendingTasks.length)
                : `Task ${currentIndex + 1} of ${pendingTasks.length} • Press Esc to exit`}
            </p>
          </>
        ) : (
          <div className="py-12 space-y-3">
            <span className="text-4xl">🎉</span>
            <h2 className="text-xl font-bold text-stone-800">{t.spotlightEmptyTitle || 'Your Focus Tunnel is Clear!'}</h2>
            <p className="text-xs text-stone-500">
              {t.spotlightEmptyDesc || 'No pending tasks to spotlight right now. Take a deep breath or check your backlog.'}
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2 bg-stone-800 text-white text-xs font-bold rounded-xl"
            >
              {t.spotlightBackToBoard || 'Back to Board'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpotlightModal;
