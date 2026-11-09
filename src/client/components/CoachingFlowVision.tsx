import React, { useState } from 'react';
import { Task, DifficultyTier, TaskType } from '../types';
import { QuickTaskBar } from './QuickTaskBar';
import { isTaskEligibleToday } from '../utils/flowPrompt';
import {
  Sun,
  Sunset,
  Moon,
  CheckCircle2,
  Circle,
  Plus,
  Minus,
  Sparkles,
  Heart,
  MessageSquare,
  Award,
  Flame,
} from 'lucide-react';

export interface CoachingFlowVisionProps {
  tasks: Task[];
  onScoreTask: (taskId: string, direction?: 'up' | 'down') => void;
  onOpenTaskModal: (task?: Task) => void;
  onQuickAdd: (taskData: { title: string; type: TaskType; difficulty: DifficultyTier }) => Promise<void> | void;
}

export const CoachingFlowVision: React.FC<CoachingFlowVisionProps> = ({
  tasks,
  onScoreTask,
  onOpenTaskModal,
  onQuickAdd,
}) => {
  const [reflectionText, setReflectionText] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('coaching_daily_reflection') || '';
    }
    return '';
  });
  const [reflectionSaved, setReflectionSaved] = useState(false);
  const [mood, setMood] = useState<'great' | 'okay' | 'tired'>('okay');

  const habitsAndDailies = tasks.filter(
    (t) => t.type === 'habit' || (t.type === 'daily' && isTaskEligibleToday(t))
  );
  const completedTodayCount = tasks.filter((t) => t.completed || (t.counter_up && t.counter_up > 0)).length;

  // Split into circadian routine flows
  const morningTasks = habitsAndDailies.filter(
    (t) => t.time_of_day === 'morning' || (!t.time_of_day && t.title.toLowerCase().includes('matí'))
  );
  const eveningTasks = habitsAndDailies.filter(
    (t) => t.time_of_day === 'evening' || (!t.time_of_day && (t.title.toLowerCase().includes('nit') || t.title.toLowerCase().includes('vespre')))
  );
  const anytimeTasks = habitsAndDailies.filter(
    (t) => !morningTasks.includes(t) && !eveningTasks.includes(t)
  );

  const handleSaveReflection = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('coaching_daily_reflection', reflectionText);
    }
    setReflectionSaved(true);
    setTimeout(() => setReflectionSaved(false), 2500);
  };

  const renderRoutineCard = (
    title: string,
    subtitle: string,
    icon: React.ReactNode,
    items: Task[],
    anchorNote: string,
    colorTheme: string
  ) => (
    <div className="bg-white/95 rounded-2xl border border-stone-200/80 p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-stone-100">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${colorTheme}`}>{icon}</div>
          <div>
            <h3 className="text-sm font-bold text-stone-900">{title}</h3>
            <p className="text-[11px] text-stone-500">{subtitle}</p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-semibold">
          {items.length} hàbits
        </span>
      </div>

      {/* Habit Stacking Anchor Tip */}
      <div className="bg-stone-50 rounded-xl p-2.5 text-[11px] text-stone-600 border border-stone-200/50 flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <span><strong>Ancoratge recomanat:</strong> {anchorNote}</span>
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="text-xs text-stone-400 py-2 text-center">Cap hàbit assignat a aquesta franja.</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-2.5 rounded-xl border border-stone-200 bg-white hover:border-indigo-200 transition"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {item.type === 'daily' ? (
                  <button
                    type="button"
                    onClick={() => onScoreTask(item.id, 'up')}
                    className="shrink-0 text-stone-300 hover:text-emerald-600 transition"
                  >
                    {item.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Circle className="w-4 h-4" />
                    )}
                  </button>
                ) : (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onScoreTask(item.id, 'up')}
                      className="p-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition"
                      title="Registrar acció positiva (+)"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <span className="font-mono text-xs font-bold text-stone-700 px-1">
                      {item.counter_up || 0}
                    </span>
                  </div>
                )}

                <span
                  className={`text-xs font-medium truncate ${
                    item.completed ? 'line-through text-stone-400' : 'text-stone-800'
                  }`}
                >
                  {item.title}
                </span>
              </div>

              {item.streak ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-amber-50 text-amber-700 border border-amber-200 shrink-0 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span>{item.streak}d</span>
                </span>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 1. Celebració de Micro-Victòries i Reforç Intrínsec */}
      <div className="bg-linear-to-r from-emerald-50 via-teal-50 to-indigo-50 rounded-2xl border border-emerald-200/80 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white shadow-2xs text-emerald-600 border border-emerald-200">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-stone-900">
                Celebració de Micro-Victòries d'Avui
              </h2>
              <p className="text-xs text-stone-600 mt-0.5">
                Has consolidat <strong className="text-emerald-700">{completedTodayCount} accions</strong> avui. Recorda: la consistència és més valuosa que la perfecció.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs shrink-0">
            <span className="text-stone-500 font-medium">Com et sents?</span>
            <button
              type="button"
              onClick={() => setMood('great')}
              className={`p-1.5 rounded-xl border transition text-sm ${
                mood === 'great' ? 'bg-white shadow-2xs border-emerald-400 ring-2 ring-emerald-200' : 'border-stone-200 bg-white/60'
              }`}
              title="Molt bé!"
            >
              🌟
            </button>
            <button
              type="button"
              onClick={() => setMood('okay')}
              className={`p-1.5 rounded-xl border transition text-sm ${
                mood === 'okay' ? 'bg-white shadow-2xs border-amber-400 ring-2 ring-amber-200' : 'border-stone-200 bg-white/60'
              }`}
              title="Normal / Rutinari"
            >
              🌱
            </button>
            <button
              type="button"
              onClick={() => setMood('tired')}
              className={`p-1.5 rounded-xl border transition text-sm ${
                mood === 'tired' ? 'bg-white shadow-2xs border-rose-400 ring-2 ring-rose-200' : 'border-stone-200 bg-white/60'
              }`}
              title="Cansat / Desgastat"
            >
              🛋️
            </button>
          </div>
        </div>
      </div>

      {/* 2. Captura Ràpida d'1 Línia */}
      <div>
        <QuickTaskBar
          onQuickAdd={onQuickAdd}
          onOpenFullModal={() => onOpenTaskModal()}
          defaultType="daily"
        />
      </div>

      {/* 3. Cadenes Circadiàries d'Ancoratge (Habit Stacking) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {renderRoutineCard(
          'Rutina de Matí',
          'Arrencada conscient',
          <Sun className="w-4 h-4 text-amber-600" />,
          morningTasks,
          'Després de fer el primer glop de cafè...',
          'bg-amber-50 text-amber-700'
        )}

        {renderRoutineCard(
          'Bloc de Migdia / Focus',
          'Accions durant el dia',
          <Sunset className="w-4 h-4 text-sky-600" />,
          anytimeTasks,
          'Abans de dinar o en tornar de la pausa...',
          'bg-sky-50 text-sky-700'
        )}

        {renderRoutineCard(
          'Rutina de Vespre / Tancament',
          'Desconnexió i descans',
          <Moon className="w-4 h-4 text-indigo-600" />,
          eveningTasks,
          'Després de sopar o abans de tancar el llum...',
          'bg-indigo-50 text-indigo-700'
        )}
      </div>

      {/* 4. Retrospectiva Compassiva & Debriefing Sense Judici */}
      <div className="bg-white/95 rounded-2xl border border-stone-200/80 p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-stone-900">
              Retrospectiva del Dia (Debriefing Compassiu)
            </h3>
          </div>
          <span className="text-[10px] text-stone-400">Espai lliure de judici</span>
        </div>

        <p className="text-xs text-stone-500">
          El coaching no tracta de castigar allò que no s'ha fet, sinó d'entendre què ha funcionat i quin obstacle ha sorgit.
        </p>

        <textarea
          value={reflectionText}
          onChange={(e) => setReflectionText(e.target.value)}
          placeholder="Què ha funcionat avui? Quina tasca s'ha encallat i com la podem fer més petita demà?"
          className="w-full text-xs p-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 resize-none h-20 text-stone-800"
        />

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-emerald-600 font-semibold">
            {reflectionSaved ? '✓ Reflexió desada correctament!' : ''}
          </span>
          <button
            type="button"
            onClick={handleSaveReflection}
            className="px-4 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-xs transition active:scale-95"
          >
            Desar reflexió
          </button>
        </div>
      </div>
    </div>
  );
};
