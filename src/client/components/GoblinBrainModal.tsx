import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import {
  X,
  Sparkles,
  Key,
  RotateCcw,
  Check,
  Plus,
  Trash2,
  Brain,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import {
  decomposeTask,
  getGeminiApiKey,
  setGeminiApiKey,
} from '../services/goblinBrain';
import { isTaskEligibleToday } from '../utils/flowPrompt';

interface GoblinBrainModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  tasks?: Task[];
  onApplySubtasks: (taskId: string, steps: string[]) => Promise<void>;
  onCreateTaskWithSubtasks?: (title: string, steps: string[]) => Promise<void>;
}

export const GoblinBrainModal: React.FC<GoblinBrainModalProps> = ({
  isOpen,
  onClose,
  task,
  tasks = [],
  onApplySubtasks,
  onCreateTaskWithSubtasks,
}) => {
  const [customTitle, setCustomTitle] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [steps, setSteps] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<'gemini' | 'offline'>('offline');
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [savedKeySuccess, setSavedKeySuccess] = useState(false);
  const [applying, setApplying] = useState(false);

  const pendingTasks = tasks.filter((t) => !t.completed && isTaskEligibleToday(t));

  useEffect(() => {
    if (!isOpen) return;
    setGeminiKeyInput(getGeminiApiKey());
    if (task) {
      setCustomTitle(task.title);
      setSelectedTaskId(task.id);
      generateStepsFor(task.title, task.notes);
    } else {
      setCustomTitle('');
      setSelectedTaskId('');
      setSteps([]);
    }
  }, [isOpen, task?.id]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const generateStepsFor = async (title: string, notes?: string) => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      const res = await decomposeTask(title.trim(), notes || '');
      setSteps(res.steps);
      setSource(res.source);
    } finally {
      setLoading(false);
    }
  };

  const handleReroll = () => {
    const titleToUse = task
      ? task.title
      : selectedTaskId
      ? tasks.find((t) => t.id === selectedTaskId)?.title || customTitle
      : customTitle;
    const notesToUse = task
      ? task.notes
      : selectedTaskId
      ? tasks.find((t) => t.id === selectedTaskId)?.notes || ''
      : '';
    generateStepsFor(titleToUse, notesToUse);
  };

  const handleDemolishCustom = () => {
    if (!customTitle.trim()) return;
    setSelectedTaskId('');
    generateStepsFor(customTitle);
  };

  const handleSelectPendingTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    if (!taskId) {
      setCustomTitle('');
      setSteps([]);
      return;
    }
    const chosen = tasks.find((t) => t.id === taskId);
    if (chosen) {
      setCustomTitle(chosen.title);
      generateStepsFor(chosen.title, chosen.notes);
    }
  };

  const handleSaveKey = () => {
    setGeminiApiKey(geminiKeyInput.trim());
    setSavedKeySuccess(true);
    setTimeout(() => setSavedKeySuccess(false), 2000);
    const titleToUse = task
      ? task.title
      : selectedTaskId
      ? tasks.find((t) => t.id === selectedTaskId)?.title || customTitle
      : customTitle;
    const notesToUse = task
      ? task.notes
      : selectedTaskId
      ? tasks.find((t) => t.id === selectedTaskId)?.notes || ''
      : '';
    if (titleToUse.trim()) {
      generateStepsFor(titleToUse, notesToUse);
    }
  };

  const handleUpdateStep = (index: number, val: string) => {
    setSteps((prev) => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  const handleDeleteStep = (index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddStep = () => {
    setSteps((prev) => [...prev, 'Next tiny 30-second action']);
  };

  const handleApply = async () => {
    const validSteps = steps.filter((s) => s.trim().length > 0);
    if (validSteps.length === 0) return;

    setApplying(true);
    try {
      const targetId = task?.id || selectedTaskId;
      if (targetId) {
        await onApplySubtasks(targetId, validSteps);
      } else if (customTitle.trim() && onCreateTaskWithSubtasks) {
        await onCreateTaskWithSubtasks(customTitle.trim(), validSteps);
      } else if (customTitle.trim()) {
        await onApplySubtasks('', validSteps);
      }
      onClose();
    } finally {
      setApplying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white border border-stone-200 rounded-3xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-stone-100 bg-gradient-to-r from-emerald-50/80 via-teal-50/60 to-stone-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl select-none" role="img" aria-label="goblin">
              👺
            </span>
            <div>
              <h2 className="font-bold text-base text-stone-900 flex items-center gap-2">
                Goblin Brain
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {source === 'gemini' ? 'Gemini AI' : 'ADHD Heuristic'}
                </span>
              </h2>
              <p className="text-xs text-stone-500">
                Cracking the Wall of Awful into effortless &lt;30s physical micro-steps
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 rounded-xl transition"
            title="Close Goblin Brain"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contextual Task Title Banner OR Global Launcher Input */}
        {task ? (
          <div className="px-5 py-3 bg-stone-50/80 border-b border-stone-100 flex items-center justify-between gap-3">
            <div className="truncate">
              <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                Stuck on:
              </span>
              <p className="font-semibold text-xs text-stone-800 truncate">{task.title}</p>
            </div>
            <button
              type="button"
              onClick={handleReroll}
              disabled={loading}
              className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 text-stone-600 transition shrink-0 font-medium cursor-pointer disabled:cursor-not-allowed"
              title="Re-generate micro-steps"
            >
              <RotateCcw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              <span>Re-roll</span>
            </button>
          </div>
        ) : (
          <div className="px-5 py-3.5 bg-stone-50/80 border-b border-stone-100 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="goblin-custom-title"
                className="text-[11px] font-bold text-stone-600 uppercase tracking-wider"
              >
                What are you stuck on right now?
              </label>
              {steps.length > 0 && (
                <button
                  type="button"
                  onClick={handleReroll}
                  disabled={loading || (!customTitle.trim() && !selectedTaskId)}
                  className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 text-stone-600 transition shrink-0 font-medium cursor-pointer disabled:cursor-not-allowed"
                  title="Re-generate micro-steps"
                >
                  <RotateCcw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                  <span>Re-roll</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                id="goblin-custom-title"
                type="text"
                autoFocus
                value={customTitle}
                onChange={(e) => {
                  setCustomTitle(e.target.value);
                  if (selectedTaskId) setSelectedTaskId('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleDemolishCustom();
                  }
                }}
                placeholder="e.g. Reply to difficult email, file quarterly taxes..."
                className="flex-1 px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium shadow-xs"
              />
              <button
                type="button"
                onClick={handleDemolishCustom}
                disabled={loading || !customTitle.trim()}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs disabled:opacity-50 shrink-0 cursor-pointer disabled:cursor-not-allowed"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{loading ? 'Demolishing...' : 'Demolish'}</span>
              </button>
            </div>

            {pendingTasks.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-stone-500">
                <span className="text-[11px] text-stone-400 shrink-0">Or choose active task:</span>
                <select
                  value={selectedTaskId}
                  onChange={(e) => handleSelectPendingTask(e.target.value)}
                  className="text-xs bg-white border border-stone-200 rounded-lg px-2 py-1 text-stone-700 flex-1 truncate"
                >
                  <option value="">-- Select an active task --</option>
                  {pendingTasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Micro-Steps List */}
        <div className="p-5 space-y-3 max-h-[50vh] overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center text-xs text-stone-400 space-y-2">
              <Brain className="w-8 h-8 text-emerald-500 animate-pulse mx-auto" />
              <p className="font-medium text-stone-600">Goblin Brain is breaking the wall...</p>
              <p className="text-[11px] text-stone-400">Finding effortless 30-second starter steps</p>
            </div>
          ) : steps.length === 0 ? (
            <div className="py-10 text-center text-xs text-stone-400 space-y-2">
              <Brain className="w-8 h-8 text-emerald-400/80 mx-auto" />
              <p className="font-semibold text-stone-600">Paralyzed by a task?</p>
              <p className="text-[11px] text-stone-400 max-w-xs mx-auto">
                Type what is overwhelming you above and click Demolish to get 3 to 5 tiny, friction-free starter steps.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2 bg-stone-50 hover:bg-emerald-50/40 border border-stone-200/80 rounded-xl transition group"
                  >
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={step}
                      onChange={(e) => handleUpdateStep(idx, e.target.value)}
                      className="flex-1 bg-transparent text-xs text-stone-800 focus:outline-hidden font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteStep(idx)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-rose-600 rounded transition"
                      title="Remove step"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddStep}
                className="flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-800 font-medium px-2 py-1 rounded-lg hover:bg-emerald-50 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add another tiny step</span>
              </button>
            </>
          )}

          {/* Gemini API Key Collapsible Drawer */}
          <div className="pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setShowKeyConfig((v) => !v)}
              className="w-full flex items-center justify-between text-xs text-stone-500 hover:text-stone-800 py-1"
            >
              <span className="flex items-center gap-1.5 font-medium">
                <Key className="w-3.5 h-3.5 text-stone-400" />
                <span>Gemini API Key (Optional AI Power-up)</span>
              </span>
              {showKeyConfig ? (
                <ChevronUp className="w-3.5 h-3.5 text-stone-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
              )}
            </button>

            {showKeyConfig && (
              <div className="mt-2 p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-3 text-xs">
                {/* Step-by-Step Guide on How to Get a Free Gemini API Key */}
                <div className="p-3 bg-emerald-50/80 border border-emerald-200/90 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-emerald-950 flex items-center gap-1.5 text-xs">
                      <span>✨</span> How to get a free Gemini API key:
                    </span>
                    <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200">
                      100% Free · No Card Needed
                    </span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-emerald-900/90 leading-relaxed">
                    <li>
                      Open{' '}
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold underline hover:text-emerald-700 inline-flex items-center gap-0.5"
                      >
                        Google AI Studio <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </li>
                    <li>Sign in with your Google account.</li>
                    <li>Click the blue <strong>&quot;Create API Key&quot;</strong> button.</li>
                    <li>Copy your key (starts with <code className="font-mono bg-emerald-100/70 px-1 py-0.2 rounded text-[10px]">AIzaSy...</code>) and paste it below.</li>
                  </ol>
                  <p className="text-[10px] text-emerald-850/80 italic flex items-center gap-1 pt-0.5 border-t border-emerald-200/60">
                    <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>Your key is stored strictly on this device (localStorage) and never touches Cadence servers.</span>
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-stone-600 block">
                    Paste your Gemini API Key:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      value={geminiKeyInput}
                      onChange={(e) => setGeminiKeyInput(e.target.value)}
                      placeholder="AIzaSy..."
                      className="flex-1 px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-mono focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleSaveKey}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition shrink-0"
                    >
                      {savedKeySuccess ? 'Saved!' : 'Save Key'}
                    </button>
                    {geminiKeyInput && (
                      <button
                        type="button"
                        onClick={() => {
                          setGeminiKeyInput('');
                          setGeminiApiKey('');
                          setSavedKeySuccess(false);
                          handleReroll();
                        }}
                        className="px-2 py-1.5 text-stone-400 hover:text-rose-600 border border-stone-200 bg-white hover:bg-stone-50 rounded-lg text-xs transition shrink-0"
                        title="Remove key and revert to instant offline heuristics"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-[10px] text-stone-400">
                  Tip: Without a key, Goblin Brain automatically uses instant offline heuristics for email, chores, writing, coding, admin, and phone calls.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-stone-100 bg-stone-50/60 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-stone-500 hover:text-stone-800 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={loading || steps.length === 0 || applying}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50 active:scale-95 cursor-pointer disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4" />
            <span>
              {applying
                ? 'Applying...'
                : task || selectedTaskId
                ? 'Apply Steps to Task'
                : 'Create Task with Steps'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoblinBrainModal;
