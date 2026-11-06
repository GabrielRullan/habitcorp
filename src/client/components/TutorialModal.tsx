import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Clock,
  Sparkles,
  Zap,
  Coffee,
  Eye,
  Sliders,
  ChevronRight,
  ChevronLeft,
  MousePointer,
  HelpCircle,
  FolderPlus,
  Compass,
} from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'video' | 'steps' | 'adhd'>('video');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Video Simulation Player State
  const [isPlaying, setIsPlaying] = useState(true);
  const [videoTime, setVideoTime] = useState(0); // 0 to 100 seconds
  const totalDuration = 24; // 24 seconds loop simulation

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Video timer ticker
  useEffect(() => {
    if (!isOpen || !isPlaying) return;
    const interval = setInterval(() => {
      setVideoTime((prev) => (prev >= totalDuration ? 0 : Number((prev + 0.1).toFixed(1))));
    }, 100);
    return () => clearInterval(interval);
  }, [isOpen, isPlaying, totalDuration]);

  if (!isOpen) return null;

  // Key phases of the 24-second code-driven video:
  // Phase 1 (0s - 5s): Cursor floats to "+ Afegir" and clicks -> Modal opens
  // Phase 2 (5s - 10s): Types "Preparar informe d'arquitectura", sets size M (30-60m)
  // Phase 3 (10s - 15s): Selects "Jornada laboral" and blocks on Agenda
  // Phase 4 (15s - 20s): Modal closes, task appears in Agenda timeline at 15:30 with duration
  // Phase 5 (20s - 24s): Cursor highlights Pomodoro timer & Zen Mode toggle

  const getPhaseInfo = (time: number) => {
    if (time < 5.5) {
      return {
        title: "1. Crear un nou element",
        desc: "Fes clic a '+ Afegir' o clica directament a qualsevol hora buida de l'agenda per crear un hàbit o tasca.",
        cursorX: 30 + Math.min(time * 12, 50),
        cursorY: 25 + Math.sin(time) * 4,
        isClicking: time > 4.5 && time < 5.2,
        modalOpen: time >= 5.0,
        taskCreated: false,
        sizeSelected: 'none',
      };
    } else if (time < 11.5) {
      const pTime = time - 5.5;
      return {
        title: "2. Assignar mida i esforç (XS, S, M, L)",
        desc: "En lloc d'estimar hores complexes, tria la fricció mental: XS (5-15m), S (15-30m), M (30-60m) o L (60m+).",
        cursorX: 50 + Math.sin(pTime) * 10,
        cursorY: 60 + Math.min(pTime * 2, 8),
        isClicking: pTime > 4.0 && pTime < 4.8,
        modalOpen: true,
        taskCreated: false,
        sizeSelected: 'M',
      };
    } else if (time < 17.5) {
      const pTime = time - 11.5;
      return {
        title: "3. Moment del dia i Reserva a l'Agenda",
        desc: "Organitza per Matí ☀️, Jornada 💼 o Vespre 🌙 i activa 'Bloquejar a l'Agenda' per garantir-li un espai proporcional.",
        cursorX: 65 - Math.min(pTime * 3, 10),
        cursorY: 78,
        isClicking: pTime > 4.2 && pTime < 5.0,
        modalOpen: true,
        taskCreated: false,
        sizeSelected: 'M',
      };
    } else {
      const pTime = time - 17.5;
      return {
        title: "4. Execució i Pacing amb Pomodoro",
        desc: "La tasca apareix a la línia horària. Activa el Pomodoro o el Mode Zen per concentrar-te sense distraccions ni culpa.",
        cursorX: 75 + Math.sin(pTime) * 8,
        cursorY: 35 + Math.cos(pTime) * 6,
        isClicking: pTime > 2.0 && pTime < 2.6,
        modalOpen: false,
        taskCreated: true,
        sizeSelected: 'M',
      };
    }
  };

  const sim = getPhaseInfo(videoTime);

  const tutorialSteps = [
    {
      title: "Hàbits recurrents vs. Tasques puntuals",
      badge: "El Nucli",
      color: "bg-emerald-50 text-emerald-800 border-emerald-200",
      content:
        "• Hàbit: Rutines que es repeteixen (diàries, entre setmana o dies concrets) com beure aigua o anar al gimnàs. Tenen ratxes (+1) i comptadors.\n• Tasca: Accions concretes amb principi i fi (com fer la compra o revisar un codi). Poden tenir calendari d'avui o quedar-se a la safata 'Sense data'.",
    },
    {
      title: "Vèncer la paràlisi amb talles (XS, S, M, L)",
      badge: "Neurodivergència & TDAH",
      color: "bg-sky-50 text-sky-800 border-sky-200",
      content:
        "Quan el cervell es bloqueja davant una llista llarga, la causa sol ser la incertesa de l'esforç. HabitCorp utilitza talles de roba:\n• XS (5–15 min): Fricció zero. Enviar un missatge, beure aigua.\n• S (15–30 min): Flux rutinari. Lectura breu, respondre correus.\n• M (30–60 min): Feina concentrada. Redactar un document.\n• L (60+ min): Màxima concentració. Projectes profunds.",
    },
    {
      title: "Agenda proporcional i Time-Blocking",
      badge: "Gestió del temps",
      color: "bg-indigo-50 text-indigo-800 border-indigo-200",
      content:
        "• La graella reflecteix l'espai real: una tasca d'1 hora ocupa el doble que una de 30 minuts.\n• Clic directe: Fes clic sobre qualsevol hora buida (15:00, 16:00...) per crear directament un esdeveniment o tasca a aquella hora.\n• Arrossegar i deixar anar: Pots arrossegar elements des de la safata de tasques pendents directament a la línia de temps.",
    },
    {
      title: "Pacing Bar, Pomodoro i Mode Zen",
      badge: "Anti-sobrecàrrega",
      color: "bg-amber-50 text-amber-800 border-amber-200",
      content:
        "• Pacing Bar: T'indica l'equilibri de càrrega del dia per no sobreplanificar.\n• Pomodoro integrat: Sessions de 25 minuts de flux amb avisos de postura, aigua i descans visual (20-20-20).\n• Mode Zen: Fes clic a 'Mode Zen' a la barra superior per amagar tot el que ja està fet o no toca fer avui. Només veus el que és accionable.",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white border border-stone-200 rounded-3xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 bg-stone-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-stone-900 flex items-center gap-2">
                <span>Com funciona HabitCorp</span>
                <span className="text-[10px] uppercase tracking-wider font-semibold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                  Guia Interactiva
                </span>
              </h2>
              <p className="text-xs text-stone-500">
                Aprèn a dominar la gestió del teu temps, hàbits i ritme sense sobrecàrrega cognitiva.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-stone-200 bg-white px-6">
          <button
            onClick={() => setActiveTab('video')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'video'
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/30'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Vídeo Simulador (100% Codi)</span>
          </button>
          <button
            onClick={() => setActiveTab('steps')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'steps'
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/30'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Els 4 Pilars del Mètode</span>
          </button>
          <button
            onClick={() => setActiveTab('adhd')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'adhd'
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/30'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Funcions Anti-Paràlisi (TDAH)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-stone-50/40">
          {activeTab === 'video' && (
            <div className="space-y-4">
              {/* Virtual Video Screen Frame */}
              <div className="relative bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-inner aspect-[16/9] select-none flex flex-col justify-between">
                {/* Simulated App Header */}
                <div className="bg-stone-800/90 border-b border-stone-700/60 px-4 py-2.5 flex items-center justify-between text-xs text-stone-200">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    <span className="ml-2 font-bold text-stone-100 flex items-center gap-1">
                      <span>HabitCorp</span>
                      <span className="text-[9px] font-mono text-stone-400">habits.balears.tech</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="bg-stone-700 px-2 py-0.5 rounded text-stone-300">
                      Modo: Tasques + Agenda
                    </span>
                    <span className="bg-indigo-600 text-white px-2 py-0.5 rounded font-semibold">
                      + Afegir
                    </span>
                  </div>
                </div>

                {/* Simulated Interactive Stage */}
                <div className="relative flex-1 bg-[#fbf9f4] p-4 overflow-hidden flex items-stretch gap-3">
                  {/* Left Column (Habits / Tasks list simulation) */}
                  <div className="w-1/3 bg-white border border-stone-200 rounded-xl p-3 shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-stone-800">TASQUES</span>
                        <span className="text-[9px] text-stone-400">Avui</span>
                      </div>
                      <div className="space-y-2">
                        <div className="p-2 bg-stone-50 border border-stone-200 rounded-lg flex items-center justify-between text-[10px]">
                          <span className="truncate">Mirar correus pendents</span>
                          <span className="px-1 bg-sky-100 text-sky-800 font-bold rounded">XS</span>
                        </div>
                        {sim.taskCreated && (
                          <div className="p-2 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-between text-[10px] animate-in zoom-in-95 duration-200">
                            <span className="font-semibold text-indigo-900 truncate">
                              Preparar informe d'arquitectura
                            </span>
                            <span className="px-1 bg-amber-100 text-amber-800 font-bold rounded">M</span>
                          </div>
                        )}
                        <div className="p-2 bg-stone-50 border border-stone-200 rounded-lg flex items-center justify-between text-[10px]">
                          <span className="truncate">Pausa per caminar</span>
                          <span className="px-1 bg-emerald-100 text-emerald-800 font-bold rounded">S</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[9px] text-stone-400">
                      <span>3 tasques</span>
                      <span className="text-emerald-600 font-semibold">● Ritme bo</span>
                    </div>
                  </div>

                  {/* Right Column (Agenda grid simulation) */}
                  <div className="flex-1 bg-white border border-stone-200 rounded-xl p-3 shadow-2xs relative flex flex-col">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-1.5 mb-2 text-[10px]">
                      <span className="font-bold text-stone-800">Graella d'Agenda</span>
                      <span className="text-stone-500 font-mono">14:00 – 18:00</span>
                    </div>

                    <div className="relative flex-1 border-t border-stone-100 space-y-3 font-mono text-[9px] text-stone-400">
                      <div className="flex items-center gap-2 border-b border-stone-100/60 pb-1">
                        <span>14:00</span>
                        <div className="h-0.5 flex-1 bg-stone-100" />
                      </div>
                      <div className="flex items-center gap-2 border-b border-stone-100/60 pb-1 relative">
                        <span>15:00</span>
                        <div className="h-0.5 flex-1 bg-stone-100" />
                        {sim.taskCreated && (
                          <div className="absolute left-10 right-2 top-2 bg-indigo-50 border border-indigo-200 border-l-[3px] border-l-indigo-600 p-2 rounded-lg text-indigo-950 font-sans shadow-xs animate-in fade-in duration-300">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[10px]">Preparar informe</span>
                              <span className="text-[9px] font-mono text-indigo-600">15:30–16:30</span>
                            </div>
                            <span className="text-[9px] text-indigo-700">Mida M · 45 min</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 border-b border-stone-100/60 pb-1">
                        <span>16:00</span>
                        <div className="h-0.5 flex-1 bg-stone-100" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span>17:00</span>
                        <div className="h-0.5 flex-1 bg-stone-100" />
                      </div>
                    </div>
                  </div>

                  {/* Simulated Modal Popup Overlay */}
                  {sim.modalOpen && (
                    <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-2xs flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-150">
                      <div className="bg-white border border-stone-200 rounded-2xl shadow-xl w-72 p-3 space-y-2 text-stone-800">
                        <div className="flex items-center justify-between border-b border-stone-100 pb-1 text-[11px] font-bold">
                          <span>Nou element</span>
                          <span className="text-stone-400 text-xs">✕</span>
                        </div>

                        <div className="bg-stone-50 border border-stone-200 rounded-lg p-1.5 text-[10px] text-stone-700 font-sans">
                          Preparar informe d'arquitectura...
                        </div>

                        {/* Size pills */}
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-stone-500">MIDA DE LA TASCA</span>
                          <div className="grid grid-cols-4 gap-1 text-[9px] font-bold text-center">
                            <span className="py-1 rounded border bg-sky-50 text-sky-800 border-stone-200">XS</span>
                            <span className="py-1 rounded border bg-emerald-50 text-emerald-800 border-stone-200">S</span>
                            <span
                              className={`py-1 rounded border ${
                                sim.sizeSelected === 'M'
                                  ? 'bg-amber-100 text-amber-900 border-amber-400 ring-2 ring-amber-200 shadow-2xs font-extrabold'
                                  : 'bg-stone-50 text-stone-600 border-stone-200'
                              }`}
                            >
                              M
                            </span>
                            <span className="py-1 rounded border bg-rose-50 text-rose-800 border-stone-200">L</span>
                          </div>
                        </div>

                        {/* Save Button */}
                        <div className="pt-2 border-t border-stone-100 flex justify-end">
                          <span className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-[9px] font-bold">
                            Desar
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Simulated Animated Mouse Cursor */}
                  <div
                    className="absolute pointer-events-none transition-all duration-300 ease-out z-50 flex items-center gap-1.5"
                    style={{
                      left: `${sim.cursorX}%`,
                      top: `${sim.cursorY}%`,
                    }}
                  >
                    <MousePointer
                      className={`w-6 h-6 text-indigo-700 drop-shadow-md transition-transform ${
                        sim.isClicking ? 'scale-75 text-rose-600' : 'scale-100'
                      }`}
                      fill="#4f46e5"
                    />
                    {sim.isClicking && (
                      <span className="w-4 h-4 rounded-full bg-rose-500/40 animate-ping absolute -top-1 -left-1" />
                    )}
                  </div>
                </div>

                {/* Subtitle / Video Caption Bar */}
                <div className="bg-stone-900/95 border-t border-stone-800 p-3 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="font-bold text-indigo-400">{sim.title}</span>
                    <p className="text-stone-300 text-[11px]">{sim.desc}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-stone-400">
                      {Math.floor(videoTime)}s / {totalDuration}s
                    </span>
                  </div>
                </div>
              </div>

              {/* Video Player Controls */}
              <div className="bg-white border border-stone-200 rounded-2xl p-3 flex items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition shadow-2xs"
                    title={isPlaying ? 'Pausar simulació' : 'Reproduir simulació'}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoTime(0)}
                    className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition"
                    title="Reiniciar simulació"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                {/* Scrubber Bar */}
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={totalDuration}
                    step={0.1}
                    value={videoTime}
                    onChange={(e) => setVideoTime(Number(e.target.value))}
                    className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                {/* Jump to phase chips */}
                <div className="hidden sm:flex items-center gap-1.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setVideoTime(0)}
                    className={`px-2 py-1 rounded-lg border font-medium transition ${
                      videoTime < 5.5
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    1. Crear
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoTime(6)}
                    className={`px-2 py-1 rounded-lg border font-medium transition ${
                      videoTime >= 5.5 && videoTime < 11.5
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    2. Mida
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoTime(12)}
                    className={`px-2 py-1 rounded-lg border font-medium transition ${
                      videoTime >= 11.5 && videoTime < 17.5
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    3. Agenda
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoTime(18)}
                    className={`px-2 py-1 rounded-lg border font-medium transition ${
                      videoTime >= 17.5
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    4. Flux
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'steps' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tutorialSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-white border border-stone-200 rounded-2xl shadow-xs space-y-2.5 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${step.color}`}>
                          {step.badge}
                        </span>
                        <span className="text-xs font-mono text-stone-400">0{idx + 1}</span>
                      </div>
                      <h3 className="font-bold text-sm text-stone-900">{step.title}</h3>
                      <p className="text-xs text-stone-600 whitespace-pre-line leading-relaxed">
                        {step.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'adhd' && (
            <div className="space-y-4">
              <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-purple-900 font-bold text-sm">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>El Sistema Anti-Paràlisi d'HabitCorp</span>
                </div>
                <p className="text-xs text-purple-950/80 leading-relaxed">
                  L'aplicació està dissenyada per no fer-te sentir culpable quan s'acumulen tasques pendents. Compta amb eines d'arrencada suau pensades per a cervells dispersos o sobrecarregats.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 bg-white border border-stone-200 rounded-2xl shadow-xs space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
                    🧙‍♂️
                  </div>
                  <h4 className="font-bold text-xs text-stone-900">Goblin Brain (Micro-Passos)</h4>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    Quan una tasca et fa mandra o angoixa, prem el botó 'Goblin'. La IA la triturarà en 3 passos físics de menys de 30 segons (p. ex. "Obrir el document", "Escriure el títol").
                  </p>
                </div>

                <div className="p-4 bg-white border border-stone-200 rounded-2xl shadow-xs space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
                    🧹
                  </div>
                  <h4 className="font-bold text-xs text-stone-900">Neteja de Culpa (Sweep)</h4>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    Si tens tasques vençudes d'ahir, no les arrosseguis com una llosa. L'escombradora automàtica et permet moure-les totes a 'Avui' o enviar-les al 'Backlog' d'un sol cop.
                  </p>
                </div>

                <div className="p-4 bg-white border border-stone-200 rounded-2xl shadow-xs space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                    🧘
                  </div>
                  <h4 className="font-bold text-xs text-stone-900">Mode Zen</h4>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    Filtra automàticament tot el soroll visual. Només veus la tasca en curs i la pròxima acció. Sense notificacions invasives ni barres que es tornen vermelles.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-200 bg-white flex items-center justify-between">
          <span className="text-xs text-stone-400">
            Pots tornar a obrir aquesta guia en qualsevol moment prement <kbd className="px-1.5 py-0.5 bg-stone-100 border border-stone-300 rounded text-[10px] font-mono">?</kbd> o des de la barra lateral.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition"
          >
            D'acord, començar!
          </button>
        </div>
      </div>
    </div>
  );
};
