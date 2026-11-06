import React, { useEffect } from 'react';
import {
  X,
  Settings,
  HelpCircle,
  Sun,
  Moon,
  Monitor,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  showTutorials: boolean;
  onToggleTutorials: (show: boolean) => void;
  theme: 'light' | 'dark' | 'system';
  onCycleTheme?: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  densityMode?: 'spacious' | 'compact';
  onToggleDensity?: () => void;
  onSelectTheme?: (theme: 'light' | 'dark' | 'system') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  showTutorials,
  onToggleTutorials,
  theme,
  onCycleTheme,
  soundEnabled,
  onToggleSound,
  densityMode = 'spacious',
  onToggleDensity,
  onSelectTheme,
}) => {
  const { t } = useTranslation();

  // Escape key listener for accessible universal dismissal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleThemeClick = (targetTheme: 'light' | 'dark' | 'system') => {
    if (onSelectTheme) {
      onSelectTheme(targetTheme);
    } else if (theme !== targetTheme) {
      onCycleTheme();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl overflow-hidden text-stone-900 dark:text-stone-100 flex flex-col my-8 animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200/80 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-950/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-2xs shrink-0">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="settings-modal-title"
                className="font-bold text-base text-stone-900 dark:text-stone-100 tracking-tight"
              >
                {t.settingsTitle || 'Settings'}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {t.settingsSub || 'Preferences & Sensory Ergonomics'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
            aria-label="Close Settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Section: Tutorials & Guided Walkthrough */}
          <div className="p-4 rounded-2xl bg-stone-50/80 dark:bg-stone-950/40 border border-stone-200/80 dark:border-stone-800/80 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="block font-semibold text-xs text-stone-900 dark:text-stone-100">
                  {t.showTutorialsLabel || 'Interactive Tutorials & Guides'}
                </span>
                <span className="block text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                  {t.showTutorialsDesc || "Display the Guide & Tutorial trigger in the sidebar and enable the '?' shortcut."}
                </span>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={showTutorials}
              aria-label="Toggle Interactive Tutorials"
              onClick={() => onToggleTutorials(!showTutorials)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                showTutorials ? 'bg-indigo-600' : 'bg-stone-300 dark:bg-stone-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  showTutorials ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Section: System Color Theme */}
          <div className="p-4 rounded-2xl bg-stone-50/80 dark:bg-stone-950/40 border border-stone-200/80 dark:border-stone-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                {theme === 'light' ? (
                  <Sun className="w-4 h-4 text-amber-500" />
                ) : theme === 'dark' ? (
                  <Moon className="w-4 h-4 text-indigo-400" />
                ) : (
                  <Monitor className="w-4 h-4 text-stone-400" />
                )}
              </div>
              <div className="min-w-0">
                <span className="block font-semibold text-xs text-stone-900 dark:text-stone-100">
                  {t.themeLabel || 'System Color Theme'}
                </span>
                <span className="block text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                  {t.themeDesc || "Select Light, Dark, or System mode ('t' hotkey)."}
                </span>
              </div>
            </div>

            <div className="flex items-center p-0.5 bg-stone-200/60 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 text-xs shrink-0 select-none self-end sm:self-auto">
              <button
                type="button"
                onClick={() => handleThemeClick('light')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  theme === 'light'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-2xs font-bold'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
                aria-label="Light Theme"
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => handleThemeClick('dark')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-2xs font-bold'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
                aria-label="Dark Theme"
              >
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Dark</span>
              </button>
              <button
                type="button"
                onClick={() => handleThemeClick('system')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  theme === 'system'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-2xs font-bold'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
                aria-label="System Theme"
              >
                <Monitor className="w-3.5 h-3.5 text-stone-400" />
                <span>System</span>
              </button>
            </div>
          </div>

          {/* Section: Audio Celebration Feedback */}
          <div className="p-4 rounded-2xl bg-stone-50/80 dark:bg-stone-950/40 border border-stone-200/80 dark:border-stone-800/80 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4 text-stone-400" />
                )}
              </div>
              <div className="min-w-0">
                <span className="block font-semibold text-xs text-stone-900 dark:text-stone-100">
                  {t.soundEffectsLabel || 'Celebration Audio Feedback'}
                </span>
                <span className="block text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                  {t.soundEffectsDesc || 'Play peaceful dopamine chimes upon task or habit completion.'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400 hidden sm:inline">
                {soundEnabled ? 'Active' : 'Muted'}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={soundEnabled}
                aria-label="Toggle Audio Feedback"
                onClick={onToggleSound}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  soundEnabled ? 'bg-emerald-600' : 'bg-stone-300 dark:bg-stone-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    soundEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Section: Visual Density Mode */}
          <div className="p-4 rounded-2xl bg-stone-50/80 dark:bg-stone-950/40 border border-stone-200/80 dark:border-stone-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0 mt-0.5">
                {densityMode === 'compact' ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0">
                <span className="block font-semibold text-xs text-stone-900 dark:text-stone-100">
                  {t.densityLabel || 'Visual Density Mode'}
                </span>
                <span className="block text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                  {t.densityDesc || 'Spacious shows full checklists & tags; Compact enables zen minimalism.'}
                </span>
              </div>
            </div>

            <div className="flex items-center p-0.5 bg-stone-200/60 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 text-xs shrink-0 select-none self-end sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  if (densityMode === 'compact' && onToggleDensity) {
                    onToggleDensity();
                  }
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  densityMode === 'spacious'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-2xs font-bold'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
                aria-label="Spacious Density"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Spacious</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (densityMode === 'spacious' && onToggleDensity) {
                    onToggleDensity();
                  }
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  densityMode === 'compact'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-2xs font-bold'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
                aria-label="Compact Density"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Compact</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-stone-200/80 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-950/50 flex items-center justify-between text-xs">
          <span className="text-[11px] text-stone-400 dark:text-stone-500 font-medium">
            Preferences save automatically
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
