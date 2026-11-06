import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  CalendarDays,
  Target,
  Inbox,
  Volume2,
  VolumeX,
  HelpCircle,
  Sun,
  Moon,
  Monitor,
  LogOut,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Settings,
} from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';
import { LanguagePicker } from './LanguagePicker';
import { HabitCorpIcon } from './HabitCorpIcon';

export interface SidebarProps {
  onOpenGoblin: () => void;
  onOpenAgentApi: () => void;
  onOpenPomodoro: () => void;
  onOpenCalendars: () => void;
  onOpenSpotlight: () => void;
  onOpenBrainDump: () => void;
  onOpenShutdown: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  showTutorials?: boolean;
  onOpenTutorial: () => void;
  onOpenSettings?: () => void;
  theme: 'light' | 'dark' | 'system';
  onCycleTheme: () => void;
  auth: { username: string; apiKey?: string; email?: string } | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  zenMode?: boolean;
  onToggleZenMode?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenGoblin,
  onOpenAgentApi,
  onOpenPomodoro,
  onOpenCalendars,
  onOpenSpotlight,
  onOpenBrainDump,
  onOpenShutdown,
  soundEnabled,
  onToggleSound,
  showTutorials = true,
  onOpenTutorial,
  onOpenSettings,
  theme,
  onCycleTheme,
  auth,
  onOpenAuth,
  onLogout,
  zenMode,
  onToggleZenMode,
}) => {
  const { t } = useTranslation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  return (
    <aside
      className="hidden md:flex flex-col w-56 lg:w-60 shrink-0 border-r border-stone-200/80 bg-white/95 dark:bg-stone-900/95 dark:border-stone-800 transition-colors z-20 sticky top-0 h-screen select-none"
      aria-label="Sidebar Navigation"
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-stone-200/70 dark:border-stone-800 flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800 flex items-center justify-center shadow-2xs shrink-0">
          <HabitCorpIcon className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <h2 className="font-bold text-sm text-stone-900 dark:text-stone-100 tracking-tight truncate">
            {t.brandName || 'Cadence'}
          </h2>
          <span className="text-[10px] text-stone-400 dark:text-stone-500 font-medium block truncate">
            {t.tagline || 'Focus & Habits'}
          </span>
        </div>
      </div>

      {/* Scrollable Navigation Body */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 text-xs">
        {/* Action Triggers Section */}
        <div>
          <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
            Action Triggers
          </div>
          <div className="space-y-1.5">
            {/* Goblin Brain Trigger */}
            <button
              type="button"
              onClick={onOpenGoblin}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-semibold text-emerald-800 dark:text-emerald-200 bg-emerald-50/80 dark:bg-emerald-950/40 hover:bg-emerald-100/90 dark:hover:bg-emerald-900/60 border border-emerald-200/80 dark:border-emerald-800/60 transition shadow-2xs group text-left cursor-pointer"
              title="Goblin Brain: Demolish the Wall of Awful into micro-steps"
              aria-label="Goblin Brain Demolisher"
            >
              <span className="text-base leading-none group-hover:scale-110 transition-transform select-none">👺</span>
              <div className="flex-1 min-w-0">
                <span className="block truncate font-semibold">Goblin Brain</span>
                <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-normal truncate">
                  Micro-step Demolisher
                </span>
              </div>
              <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            </button>

            {/* Agent REST API Trigger */}
            <button
              type="button"
              onClick={onOpenAgentApi}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50/70 dark:bg-indigo-950/40 hover:bg-indigo-100/90 dark:hover:bg-indigo-900/60 border border-indigo-200/70 dark:border-indigo-800/60 transition shadow-2xs text-left cursor-pointer"
              title={t.agentApiBtn || 'Agent REST API'}
              aria-label="Agent REST API"
            >
              <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="block truncate font-semibold">{t.agentApiBtn || 'Agent REST API'}</span>
                <span className="block text-[10px] text-indigo-500 dark:text-indigo-400 font-normal truncate">
                  OpenAPI / Agents
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Tools Section */}
        <div>
          <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
            Tools
          </div>
          <div className="space-y-1">
            {/* Pomodoro */}
            <button
              type="button"
              onClick={onOpenPomodoro}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl font-medium text-stone-700 dark:text-stone-300 hover:bg-rose-50/70 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-300 transition text-left cursor-pointer"
              title={`${t.pomodoroBtn || 'Pomodoro'} (Press 'p')`}
              aria-label="Pomodoro Focus Timer"
            >
              <span className="text-sm select-none">🍅</span>
              <span className="flex-1 truncate">{t.pomodoroBtn || 'Pomodoro'}</span>
              <span className="text-[10px] font-mono text-stone-400 dark:text-stone-500 font-semibold">'p'</span>
            </button>

            {/* Calendars & Ghosts */}
            <button
              type="button"
              onClick={onOpenCalendars}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition text-left cursor-pointer"
              title={t.calendarsGhostsBtn || 'Calendars & Ghosts'}
              aria-label="Calendars and Ghosts"
            >
              <CalendarDays className="w-4 h-4 text-sky-500 shrink-0" />
              <span className="flex-1 truncate">{t.calendarsGhostsBtn || 'Calendars & Ghosts'}</span>
            </button>

            {/* Spotlight Single-Task Isolation */}
            <button
              type="button"
              onClick={onOpenSpotlight}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl font-medium text-stone-700 dark:text-stone-300 hover:bg-rose-50/70 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-300 transition text-left cursor-pointer"
              title="Spotlight Single-Task Isolation (Press 's')"
              aria-label="Spotlight Single-Task Isolation"
            >
              <Target className="w-4 h-4 text-rose-500 shrink-0" />
              <span className="flex-1 truncate">Spotlight</span>
              <span className="text-[10px] font-mono text-stone-400 dark:text-stone-500 font-semibold">'s'</span>
            </button>

            {/* Brain Dump Offloader */}
            <button
              type="button"
              onClick={onOpenBrainDump}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl font-medium text-stone-700 dark:text-stone-300 hover:bg-purple-50/70 dark:hover:bg-purple-950/40 hover:text-purple-700 dark:hover:text-purple-300 transition text-left cursor-pointer"
              title="Brain Dump Offloader (Press 'b' or Ctrl+K)"
              aria-label="Brain Dump Offloader"
            >
              <Inbox className="w-4 h-4 text-purple-500 shrink-0" />
              <span className="flex-1 truncate">Brain Dump</span>
              <span className="text-[10px] font-mono text-stone-400 dark:text-stone-500 font-semibold">'b'</span>
            </button>

            {/* Evening Daily Shutdown */}
            <button
              type="button"
              onClick={onOpenShutdown}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl font-medium text-stone-700 dark:text-stone-300 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 hover:text-indigo-700 dark:hover:text-indigo-300 transition text-left cursor-pointer"
              title="Evening Daily Shutdown Ritual (Press 'd')"
              aria-label="Evening Daily Shutdown Ritual"
            >
              <span className="text-sm select-none">🌙</span>
              <span className="flex-1 truncate">Daily Shutdown</span>
              <span className="text-[10px] font-mono text-stone-400 dark:text-stone-500 font-semibold">'d'</span>
            </button>

            {/* Audio Feedback Chime Toggle */}
            <button
              type="button"
              onClick={onToggleSound}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition text-left cursor-pointer"
              title={soundEnabled ? 'Mute Celebration Chimes' : 'Unmute Celebration Chimes'}
              aria-label="Toggle Audio Feedback"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <VolumeX className="w-4 h-4 text-stone-400 shrink-0" />
              )}
              <span className="flex-1 truncate">
                {soundEnabled ? 'Chimes Active' : 'Chimes Muted'}
              </span>
            </button>

            {/* Tutorial Walkthrough */}
            {showTutorials && (
              <button
                type="button"
                onClick={onOpenTutorial}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl font-medium text-stone-700 dark:text-stone-300 hover:bg-amber-50/70 dark:hover:bg-amber-950/40 hover:text-amber-700 dark:hover:text-amber-300 transition text-left cursor-pointer"
                title="Guide & Tutorial (Press '?')"
                aria-label="Guide and Tutorial"
              >
                <HelpCircle className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="flex-1 truncate">Guide & Tutorial</span>
                <span className="text-[10px] font-mono text-stone-400 dark:text-stone-500 font-semibold">'?'</span>
              </button>
            )}

            {/* Zen Mode Toggle (Requirement R4) */}
            {onToggleZenMode && (
              <button
                type="button"
                onClick={onToggleZenMode}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl font-medium transition text-left cursor-pointer ${
                  zenMode
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 font-semibold'
                    : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
                title={`${t.zenModeBtn || 'Zen Mode'} (${zenMode ? 'Active' : 'Inactive'}, Press 'z')`}
                aria-label="Toggle Zen Mode"
                aria-pressed={Boolean(zenMode)}
              >
                <span className="text-sm select-none">🧘</span>
                <span className="flex-1 truncate">
                  {t.zenModeBtn || 'Zen Mode'}
                </span>
                {zenMode && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                )}
                <span className="text-[10px] font-mono text-stone-400 dark:text-stone-500 font-semibold">'z'</span>
              </button>
            )}

            {/* Optional Settings Modal Trigger */}
            {onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition text-left cursor-pointer"
                title="Settings"
                aria-label="Settings"
              >
                <Settings className="w-4 h-4 text-stone-400 shrink-0" />
                <span className="flex-1 truncate">Settings</span>
              </button>
            )}
          </div>
        </div>

        {/* System Color Selector (Exclusively in Sidebar) */}
        <div>
          <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
            System Color
          </div>
          <button
            type="button"
            onClick={onCycleTheme}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium text-stone-700 dark:text-stone-300 bg-stone-50 hover:bg-stone-100 dark:bg-stone-800/80 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 transition shadow-2xs cursor-pointer"
            title={`Theme: ${theme} (Press 't' to cycle)`}
            aria-label="Toggle Color Theme"
          >
            <div className="flex items-center gap-2">
              {theme === 'light' ? (
                <Sun className="w-4 h-4 text-amber-500 shrink-0" />
              ) : theme === 'dark' ? (
                <Moon className="w-4 h-4 text-indigo-400 shrink-0" />
              ) : (
                <Monitor className="w-4 h-4 text-stone-400 shrink-0" />
              )}
              <span className="capitalize font-semibold text-stone-800 dark:text-stone-200">
                {theme} Mode
              </span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-200/70 dark:bg-stone-700 text-stone-500 dark:text-stone-400 font-bold">
              't'
            </span>
          </button>
        </div>
      </div>

      {/* Footer: LanguagePicker and Login / Account profile menu */}
      <div className="p-3 border-t border-stone-200/80 dark:border-stone-800 space-y-2 bg-stone-50/40 dark:bg-stone-900/40">
        {/* Language Picker */}
        <div className="w-full">
          <LanguagePicker />
        </div>

        {/* Account Profile / Login */}
        <div className="relative" ref={userMenuRef}>
          {auth ? (
            <div>
              <button
                type="button"
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className="w-full flex items-center justify-between gap-1.5 text-xs bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700/80 px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 transition shadow-2xs cursor-pointer"
                title="Account menu"
                aria-label="Account menu"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-stone-700 dark:text-stone-300 font-mono text-[11px] font-semibold truncate">
                    @{auth.username}
                  </span>
                </div>
                {userMenuOpen ? (
                  <ChevronUp className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                )}
              </button>

              {/* Upward Account Menu Popover */}
              {userMenuOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl p-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
                  <div className="px-2.5 py-1.5 border-b border-stone-100 dark:border-stone-700/70 mb-1">
                    <p className="font-bold text-stone-900 dark:text-stone-100 truncate">@{auth.username}</p>
                    {auth.email && (
                      <p className="text-[10px] text-stone-400 dark:text-stone-400 truncate">{auth.email}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      onOpenAuth();
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center gap-2 transition cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                    <span>{t.switchAccount || 'Switch Account'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      onOpenAgentApi();
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center gap-2 transition cursor-pointer"
                  >
                    <Bot className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{t.agentApiBtn || 'Agent REST API'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 transition mt-1 border-t border-stone-100 dark:border-stone-700/70 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{t.logOut || 'Log Out'}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.logInSignUp || 'Log In / Sign Up'}</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
