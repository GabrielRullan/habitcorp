import React, { useState, useEffect } from 'react';
import { X, Send, Inbox, Sparkles } from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';

interface BrainDumpDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTasks: (titles: string[]) => Promise<void>;
}

export const BrainDumpDrawer: React.FC<BrainDumpDrawerProps> = ({
  isOpen,
  onClose,
  onSaveTasks,
}) => {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    // Split multi-line input into distinct items
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return;

    setSaving(true);
    try {
      await onSaveTasks(lines);
      setText('');
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-4 text-stone-900 dark:text-stone-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">📥</span>
            <div>
              <h2 className="font-bold text-sm text-stone-900 dark:text-stone-100">{t.brainDumpTitle}</h2>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                {t.brainDumpSubtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            autoFocus
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t.brainDumpPlaceholder}
            className="w-full p-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl text-xs text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white dark:focus:bg-stone-900 transition resize-none font-sans"
          />

          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] text-stone-400 dark:text-stone-500">
              {t.brainDumpHelpText}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 font-medium"
              >
                {t.cancelBtn}
              </button>
              <button
                type="submit"
                disabled={!text.trim() || saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs transition disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{saving ? t.brainDumpSaving : t.brainDumpSubmitBtn}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BrainDumpDrawer;
