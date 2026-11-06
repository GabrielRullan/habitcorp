import React, { useState } from 'react';
import { Plus, SlidersHorizontal, Sparkles } from 'lucide-react';
import { TaskType, DifficultyTier } from '../types';

export interface QuickTaskBarProps {
  onQuickAdd: (taskData: {
    title: string;
    type: TaskType;
    difficulty: DifficultyTier;
  }) => Promise<void> | void;
  onOpenFullModal?: (type?: TaskType) => void;
  defaultType?: TaskType;
}

export const QuickTaskBar: React.FC<QuickTaskBarProps> = ({
  onQuickAdd,
  onOpenFullModal,
  defaultType = 'todo',
}) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<TaskType>(defaultType);
  const [difficulty, setDifficulty] = useState<DifficultyTier>('easy');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onQuickAdd({
        title: cleanTitle,
        type,
        difficulty,
      });
      setTitle('');
    } catch (err) {
      console.error('Error in quick task add:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sizeConfig: Record<DifficultyTier, { label: string; size: 'XS' | 'S' | 'M' | 'L'; duration: string; color: string }> = {
    trivial: { label: 'Extra Small (5–15m)', size: 'XS', duration: '5–15m', color: 'bg-sky-50 text-sky-700 border-sky-200 ring-sky-300' },
    easy: { label: 'Small (15–30m)', size: 'S', duration: '15–30m', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-300' },
    medium: { label: 'Medium (30–60m)', size: 'M', duration: '30–60m', color: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-300' },
    hard: { label: 'Large (60m+)', size: 'L', duration: '60m+', color: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-300' },
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white/95 rounded-2xl border border-stone-200/80 shadow-2xs p-2.5 transition-all hover:border-indigo-200 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100"
    >
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Captura ràpida (fricció zero)... Prem Enter per desar"
          className="flex-1 bg-transparent px-2.5 py-1.5 text-sm text-stone-900 placeholder-stone-400 focus:outline-hidden"
          disabled={isSubmitting}
        />

        <button
          type="submit"
          disabled={!title.trim() || isSubmitting}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-xs transition active:scale-95 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Afegir</span>
        </button>
      </div>

      {/* Quick metadata strip: Type + Size + Full options */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 mt-1.5 border-t border-stone-100 text-xs">
        {/* Type selector */}
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-stone-400 font-medium mr-1">Tipus:</span>
          {(['todo', 'daily', 'habit'] as TaskType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition ${
                type === t
                  ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200'
                  : 'text-stone-500 hover:bg-stone-100'
              }`}
            >
              {t === 'todo' ? '📝 Tasca' : t === 'daily' ? '🔄 Diària' : '⚡ Hàbit'}
            </button>
          ))}
        </div>

        {/* Task Size Selector (Strictly XS, S, M, L) */}
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-stone-400 font-medium mr-1">Mida:</span>
          {(['trivial', 'easy', 'medium', 'hard'] as DifficultyTier[]).map((d) => {
            const conf = sizeConfig[d];
            const isSelected = difficulty === d;
            return (
              <button
                key={d}
                type="button"
                onClick={() => setDifficulty(d)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition ${
                  isSelected
                    ? `${conf.color} font-bold ring-1`
                    : 'bg-stone-50 text-stone-400 border-stone-100 hover:bg-stone-100 hover:text-stone-600'
                }`}
                title={`${conf.size} (${conf.duration}) · ${conf.label}`}
              >
                {conf.size}
              </button>
            );
          })}
        </div>

        {/* More options link */}
        {onOpenFullModal && (
          <button
            type="button"
            onClick={() => onOpenFullModal(type)}
            className="flex items-center gap-1 text-[11px] text-stone-400 hover:text-indigo-600 transition ml-auto"
            title="Obre el formulari complet amb dates, notes i projectes"
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>Més opcions</span>
          </button>
        )}
      </div>
    </form>
  );
};
