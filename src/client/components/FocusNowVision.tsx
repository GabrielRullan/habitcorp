import React, { useState } from 'react';
import { Task, DifficultyTier, TaskType } from '../types';
import { TimeTimerDisk } from './TimeTimerDisk';
import { QuickTaskBar } from './QuickTaskBar';
import { Sparkles, CheckCircle2, Circle, ArrowRight, BatteryMedium, BatteryLow, BatteryCharging, BatteryWarning, PauseCircle } from 'lucide-react';

export interface FocusNowVisionProps {
  tasks: Task[];
  onScoreTask: (taskId: string, direction?: 'up' | 'down') => void;
  onOpenGoblin: (task: Task) => void;
  onOpenTaskModal: (task?: Task) => void;
  onQuickAdd: (taskData: { title: string; type: TaskType; difficulty: DifficultyTier }) => Promise<void> | void;
  onToggleLifeHappened: (days: number) => void;
  lifeHappenedActive: boolean;
}

export const FocusNowVision: React.FC<FocusNowVisionProps> = ({
  tasks,
  onScoreTask,
  onOpenGoblin,
  onOpenTaskModal,
  onQuickAdd,
  onToggleLifeHappened,
  lifeHappenedActive,
}) => {
  const [energyLevel, setEnergyLevel] = useState<'high' | 'normal' | 'low' | 'minimal'>('normal');
  const [selectedFocusTaskId, setSelectedFocusTaskId] = useState<string | null>(null);
  const [showAllTasks, setShowAllTasks] = useState(false);

  // Filter tasks based on energy level
  const energyMaxDifficulty: Record<string, DifficultyTier[]> = {
    minimal: ['trivial'],
    low: ['trivial', 'easy'],
    normal: ['trivial', 'easy', 'medium'],
    high: ['trivial', 'easy', 'medium', 'hard'],
  };

  const allowedDifficulties = energyMaxDifficulty[energyLevel];

  // Active uncompleted to-dos
  const uncompletedTodos = tasks
    .filter((t) => t.type === 'todo' && !t.completed && (!t.difficulty || allowedDifficulties.includes(t.difficulty)))
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));

  // Active uncompleted dailies / habits for today
  const uncompletedDailies = tasks.filter(
    (t) =>
      (t.type === 'daily' || t.type === 'habit') &&
      (!t.difficulty || allowedDifficulties.includes(t.difficulty)) &&
      t.is_due_today !== false
  );
  const pendingDailies = uncompletedDailies.filter((d) => !d.completed);

  // Determine current active spotlight item:
  // 1. If user explicitly selected an item
  // 2. Otherwise pick first uncompleted todo
  // 3. If no todos, seamlessly promote the first pending daily habit so user is never left stranded!
  const activeTask =
    (selectedFocusTaskId ? tasks.find((t) => t.id === selectedFocusTaskId) : null) ||
    uncompletedTodos[0] ||
    pendingDailies[0] ||
    null;

  // Next steps (maximum 2)
  const nextTasks = activeTask && activeTask.type === 'todo'
    ? uncompletedTodos.filter((t) => t.id !== activeTask.id).slice(0, showAllTasks ? 10 : 2)
    : uncompletedTodos.slice(0, showAllTasks ? 10 : 2);

  const energyConfigs = {
    high: { label: 'Energia Plena', sizeLabel: 'L (60m+)', tierText: 'Totes (XS–L)', icon: BatteryCharging, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    normal: { label: 'Energia Normal', sizeLabel: 'M (30–60m)', tierText: 'Fins a M (≤60m)', icon: BatteryMedium, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    low: { label: 'Bateria Baixa', sizeLabel: 'S (15–30m)', tierText: 'Fins a S (≤30m)', icon: BatteryLow, color: 'text-amber-700 bg-amber-50 border-amber-200' },
    minimal: { label: 'Mode Mínims', sizeLabel: 'XS (5–15m)', tierText: 'Només XS (≤15m)', icon: BatteryWarning, color: 'text-rose-700 bg-rose-50 border-rose-200' },
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 1. Header: Clima d'Energia Matinal */}
      <div className="bg-white/95 rounded-2xl border border-stone-200/80 p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <span>🔋 Com està el teu nivell d'energia avui?</span>
              {lifeHappenedActive && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                  Pausa Activa
                </span>
              )}
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Adapta la visió al que el teu cervell pot assumir sense generar ansietat ni culpa.
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {(['minimal', 'low', 'normal', 'high'] as const).map((level) => {
              const cfg = energyConfigs[level];
              const Icon = cfg.icon;
              const isSelected = energyLevel === level;
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => setEnergyLevel(level)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition ${
                    isSelected
                      ? `${cfg.color} ring-2 ring-stone-400 font-bold shadow-2xs`
                      : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cfg.tierText}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Targeta Gran d'Enfocament Singular (Spotlight + Time Timer) */}
      <div className="bg-radial from-white via-stone-50/50 to-indigo-50/30 rounded-3xl border-2 border-indigo-200/80 p-6 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200/60 mb-5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-600 text-white shadow-2xs">
              🎯 EL TEU FOCUS ARA ({activeTask?.type === 'daily' || activeTask?.type === 'habit' ? 'RUTINA ACTIVA' : 'NOMÉS 1 TASCA'})
            </span>
            <span className="text-xs text-stone-400 font-medium">
              Elimina tot el soroll extern
            </span>
          </div>

          {(uncompletedTodos.length > 1 || (uncompletedTodos.length > 0 && pendingDailies.length > 0) || pendingDailies.length > 1) && (
            <select
              value={activeTask?.id || ''}
              onChange={(e) => setSelectedFocusTaskId(e.target.value)}
              className="text-xs bg-white border border-stone-200 rounded-xl px-2.5 py-1 text-stone-600 focus:outline-hidden"
            >
              {uncompletedTodos.map((t) => (
                <option key={t.id} value={t.id}>
                  Tasca: {t.title}
                </option>
              ))}
              {pendingDailies.map((d) => (
                <option key={d.id} value={d.id}>
                  Rutina: {d.title}
                </option>
              ))}
            </select>
          )}
        </div>

        {activeTask ? (
          <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-6 items-center">
            {/* Task Details & Action Controls */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    activeTask.type === 'daily' || activeTask.type === 'habit'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                  }`}>
                    {activeTask.type === 'daily' || activeTask.type === 'habit' ? '🔄 Rutina Diària' : '⚡ Tasca Puntual'}
                  </span>
                  {activeTask.streak ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-mono font-bold border border-rose-200">
                      🔥 {activeTask.streak} dies
                    </span>
                  ) : null}
                </div>

                <h3 className="text-xl md:text-2xl font-black text-stone-900 leading-snug">
                  {activeTask.title}
                </h3>
                {activeTask.notes && (
                  <p className="text-xs text-stone-500 mt-2 line-clamp-2">
                    {activeTask.notes}
                  </p>
                )}

                {/* Starter Step / Floor Habit (Cost Zero < 30s) */}
                {activeTask.micro_habit_title && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs text-emerald-900">
                      <span className="text-sm">🌱</span>
                      <div>
                        <span className="font-bold">Pas mínim d'inèrcia: </span>
                        <span>{activeTask.micro_habit_title}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onScoreTask(activeTask.id, 'up')}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shrink-0 active:scale-95 shadow-2xs cursor-pointer"
                      title="Completa el pas mínim per salvar la ratxa avui sense sobreesforç"
                    >
                      Fes-ho en 30s
                    </button>
                  </div>
                )}
              </div>

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {activeTask.difficulty && (() => {
                  const diff = activeTask.difficulty;
                  const size = diff === 'trivial' ? 'XS (5–15m)' : diff === 'easy' ? 'S (15–30m)' : diff === 'medium' ? 'M (30–60m)' : 'L (60m+)';
                  const colorClass = diff === 'trivial'
                    ? 'bg-sky-50 text-sky-800 border-sky-200'
                    : diff === 'easy'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : diff === 'medium'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200';
                  return (
                    <span className={`px-2.5 py-0.5 rounded-full font-bold border ${colorClass}`}>
                      Mida: {size}
                    </span>
                  );
                })()}
                {activeTask.project_id && (
                  <span className="px-2 py-0.5 rounded-full font-medium bg-stone-100 text-stone-600">
                    📁 Projecte
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onScoreTask(activeTask.id, 'up')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition active:scale-95 cursor-pointer"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{activeTask.type === 'daily' || activeTask.type === 'habit' ? 'Rutina Completada (+1)' : 'Completat!'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenGoblin(activeTask)}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold text-xs shadow-2xs transition active:scale-95 cursor-pointer"
                  title="Desglossa aquesta tasca amb IA si et sembla massa aclaparadora"
                >
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <span>Desglossar amb Goblin</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenTaskModal(activeTask)}
                  className="text-xs text-stone-500 hover:text-stone-800 underline px-2 cursor-pointer"
                >
                  Editar detalls
                </button>
              </div>
            </div>

            {/* Visual Time Timer Analog Dial */}
            <div className="flex flex-col items-center justify-center p-3 bg-white/80 rounded-2xl border border-stone-200/60 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                Temporitzador Visual
              </span>
              <TimeTimerDisk
                initialMinutes={activeTask.difficulty === 'trivial' ? 15 : activeTask.difficulty === 'easy' ? 25 : 35}
                compact={true}
                onComplete={() => alert('Sessió completada! Fes una pausa breu.')}
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-stone-500">
            <p className="text-base font-semibold text-stone-700">🎉 Tot el teu dia està net!</p>
            <p className="text-xs mt-1 text-stone-400">Has completat tant les tasques com les rutines d'avui. Gaudix del descans!</p>
          </div>
        )}
      </div>

      {/* 3. Captura Ràpida d'1 Línia */}
      <div>
        <QuickTaskBar
          onQuickAdd={onQuickAdd}
          onOpenFullModal={() => onOpenTaskModal()}
          defaultType="todo"
        />
      </div>

      {/* 4. Dues Seccions Específiques: Diàries d'Avui & Pròxims Passos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Rutines d'Avui (Dailies) */}
        <div className="bg-white/95 rounded-2xl border border-stone-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-stone-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
              <span>🔄 Rutines d'Avui ({uncompletedDailies.filter(d => !d.completed).length})</span>
            </h4>
            <span className="text-[10px] text-stone-400 font-medium">Hàbits diaris</span>
          </div>

          {uncompletedDailies.length === 0 ? (
            <p className="text-xs text-stone-400 py-3 text-center">No hi ha rutines pendents per avui.</p>
          ) : (
            <div className="space-y-1.5">
              {uncompletedDailies.map((daily) => (
                <div
                  key={daily.id}
                  className={`flex items-center justify-between p-2 rounded-xl border transition ${
                    daily.completed
                      ? 'bg-stone-50 border-stone-100 opacity-60'
                      : 'bg-white border-stone-200 hover:border-indigo-200'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onScoreTask(daily.id, 'up')}
                    className="flex items-center gap-2 text-left flex-1 min-w-0 cursor-pointer"
                  >
                    {daily.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-stone-300 hover:text-indigo-600 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <span className={`text-xs font-medium block truncate ${daily.completed ? 'line-through text-stone-400' : 'text-stone-800'}`}>
                        {daily.title}
                      </span>
                      {daily.micro_habit_title && !daily.completed && (
                        <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-1 mt-0.5">
                          <span>🌱</span>
                          <span className="truncate">Pas mínim: {daily.micro_habit_title}</span>
                        </span>
                      )}
                    </div>
                  </button>

                  {daily.streak ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono bg-amber-50 text-amber-700 border border-amber-200/60 shrink-0">
                      🔥 {daily.streak}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pròxims Passos (Màxim 2 tasques per evitar angoixa) */}
        <div className="bg-white/95 rounded-2xl border border-stone-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-stone-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
              <span>⚡ Pròxims Passos ({uncompletedTodos.length})</span>
            </h4>
            {uncompletedTodos.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAllTasks(!showAllTasks)}
                className="text-[10px] text-indigo-600 hover:underline font-semibold"
              >
                {showAllTasks ? 'Amagar backlog' : `Veure'n més (${uncompletedTodos.length - 2})`}
              </button>
            )}
          </div>

          {nextTasks.length === 0 ? (
            <p className="text-xs text-stone-400 py-3 text-center">No hi ha altres tasques pendents.</p>
          ) : (
            <div className="space-y-2">
              {nextTasks.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-stone-200 bg-white hover:border-indigo-300 transition group"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => onScoreTask(t.id, 'up')}
                      className="text-stone-300 hover:text-emerald-600 shrink-0"
                    >
                      <Circle className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-medium text-stone-800 truncate">
                      {t.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedFocusTaskId(t.id)}
                      className="text-[10px] px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold transition"
                      title="Posa aquesta tasca com a focus principal"
                    >
                      Focus Ara 🎯
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
