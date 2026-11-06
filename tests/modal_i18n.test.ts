import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { I18nProvider } from '../src/client/i18n/I18nContext';
import { translations, Language, SupportedLang } from '../src/client/i18n/translations';
import { PomodoroTimer } from '../src/client/components/PomodoroTimer';
import { TimeTimerDisk } from '../src/client/components/TimeTimerDisk';
import { SpotlightModal } from '../src/client/components/SpotlightModal';
import { BrainDumpDrawer } from '../src/client/components/BrainDumpDrawer';
import { CalendarModal } from '../src/client/components/CalendarModal';
import { Task } from '../src/client/types';

// ============================================================================
// 1. MOCK ENVIRONMENT SETUP
// ============================================================================

class LocalStorageMock {
  private store: Record<string, string> = {};
  getItem(key: string): string | null {
    return this.store[key] !== undefined ? this.store[key] : null;
  }
  setItem(key: string, val: string): void {
    this.store[key] = String(val);
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  clear(): void {
    this.store = {};
  }
}

const mockStorage = new LocalStorageMock();
(globalThis as any).window = globalThis;
(globalThis as any).localStorage = mockStorage;

// Safe mock for fetch
(globalThis as any).fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ calendars: [], ghosts: [] }),
});

const mockTask: Task = {
  id: 'task-101',
  user_id: 'user-1',
  title: 'Finalize quarterly financial report',
  notes: 'Review balance sheet and tax deductions',
  type: 'todo',
  difficulty: 'medium',
  completed: 0,
  position: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  subtasks: [
    { id: 'st-1', task_id: 'task-101', title: 'Export CSV statements', completed: 0, position: 0 },
    { id: 'st-2', task_id: 'task-101', title: 'Reconcile payroll variance', completed: 0, position: 1 },
  ],
};

function renderWithLocale(element: React.ReactElement, lang: Language): string {
  mockStorage.setItem('habitcorp_lang', lang);
  const rawHtml = renderToStaticMarkup(
    React.createElement(I18nProvider, null, element)
  );
  // Normalize HTML entities like &amp; so string assertions match translation dictionaries directly
  return rawHtml.replace(/&amp;/g, '&');
}

// ============================================================================
// 2. TEST SUITE
// ============================================================================

describe('Milestone 5 (Requirement R5) — Modal Internationalization Test Suite', () => {
  const supportedLangs: SupportedLang[] = ['en', 'es', 'ca'];

  beforeEach(() => {
    mockStorage.clear();
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // 1. Dictionary Parity & Integrity
  // --------------------------------------------------------------------------
  describe('1. Dictionary Key Parity & Non-Empty String Verification', () => {
    it('guarantees 100% key parity across en, es, and ca dictionaries', () => {
      const enKeys = Object.keys(translations.en).sort();
      const esKeys = Object.keys(translations.es).sort();
      const caKeys = Object.keys(translations.ca).sort();

      expect(esKeys).toEqual(enKeys);
      expect(caKeys).toEqual(enKeys);
    });

    it('ensures no translation string or function result is empty across all languages', () => {
      supportedLangs.forEach((lang) => {
        const dict = translations[lang];
        Object.entries(dict).forEach(([key, val]) => {
          if (typeof val === 'string') {
            expect(val.trim().length, `Empty string for [${lang}].${key}`).toBeGreaterThan(0);
          } else if (typeof val === 'function') {
            const result = (val as any)(2, 5);
            expect(result.trim().length, `Empty function result for [${lang}].${key}`).toBeGreaterThan(0);
          }
        });
      });
    });

    it('contains all required Milestone 5 modal translation keys across en, es, and ca', () => {
      const requiredM5Keys: (keyof typeof translations.en)[] = [
        // Shared
        'closeBtn',
        // Pomodoro & TimeTimer
        'pomodoroSessionCompleted',
        'pomodoroResetTooltip',
        'pomodoroToggleVisualDiskTitle',
        'pomodoroVisualDiskBtn',
        'pomodoroSoundEnabled',
        'pomodoroSoundMuted',
        'pomodoroCloseBar',
        'pomodoroVisualDiskTitle',
        'pomodoroTimeUp',
        'timeTimerFocusTitle',
        'timeTimerStatusFocusing',
        'timeTimerStatusDone',
        'timeTimerStatusPaused',
        'timeTimerStart',
        'timeTimerPause',
        'timeTimerResetTitle',
        'timeTimerSoundEnabled',
        'timeTimerSoundMuted',
        // Spotlight
        'spotlightFocusTunnel',
        'spotlightToggleTimerTitle',
        'spotlightHideTimer',
        'spotlightShowTimer',
        'spotlightExitTitle',
        'spotlightSize',
        'spotlightNextStep',
        'spotlightGoblinPrompt',
        'spotlightCompleting',
        'spotlightMarkDone',
        'spotlightSkipTooltip',
        'spotlightSkipForNow',
        'spotlightTaskProgress',
        'spotlightEmptyTitle',
        'spotlightEmptyDesc',
        'spotlightBackToBoard',
        // Brain Dump
        'brainDumpTitle',
        'brainDumpSubtitle',
        'brainDumpPlaceholder',
        'brainDumpHelpText',
        'brainDumpSaving',
        'brainDumpSubmitBtn',
        // Calendar
        'calTabGhosts',
        'calTabFeeds',
        'calTabManual',
        'calTabImport',
        'calGhostsWhatIsTitle',
        'calGhostsWhatIsDesc',
        'calGhostsActiveHeading',
        'calGhostsEmpty',
        'calGhostAddNewHeading',
        'calGhostAddSubmitBtn',
        'calFeedsHeading',
        'calFeedsEmpty',
        'calGuideAccordionTitle',
        'calFeedSubscribeSyncBtn',
        'calManualTitleLabel',
        'calManualAddEventBtn',
        'calRawImportDescription',
        'calRawImportBtn',
      ];

      supportedLangs.forEach((lang) => {
        const dict = translations[lang] as any;
        requiredM5Keys.forEach((key) => {
          expect(dict[key], `Missing key [${String(key)}] in translations.${lang}`).toBeDefined();
        });
      });
    });
  });

  // --------------------------------------------------------------------------
  // 2. PomodoroTimer Localization & Leak Prevention
  // --------------------------------------------------------------------------
  describe('2. PomodoroTimer Component Localization', () => {
    const basePomodoroProps = {
      isOpen: true,
      onToggleOpen: vi.fn(),
    };

    it('renders localized Pomodoro titles and controls in English, Spanish, and Catalan', () => {
      const enHtml = renderWithLocale(React.createElement(PomodoroTimer, basePomodoroProps), 'en');
      expect(enHtml).toContain(translations.en.pomodoroTitle);
      expect(enHtml).toContain(translations.en.startPomodoro);
      expect(enHtml).toContain(translations.en.pomodoroVisualDiskBtn);
      expect(enHtml).toContain(translations.en.pomodoroCloseBar);

      const esHtml = renderWithLocale(React.createElement(PomodoroTimer, basePomodoroProps), 'es');
      expect(esHtml).toContain(translations.es.pomodoroTitle);
      expect(esHtml).toContain(translations.es.startPomodoro);
      expect(esHtml).toContain(translations.es.pomodoroVisualDiskBtn);
      expect(esHtml).toContain(translations.es.pomodoroCloseBar);

      const caHtml = renderWithLocale(React.createElement(PomodoroTimer, basePomodoroProps), 'ca');
      expect(caHtml).toContain(translations.ca.pomodoroTitle);
      expect(caHtml).toContain(translations.ca.startPomodoro);
      expect(caHtml).toContain(translations.ca.pomodoroVisualDiskBtn);
      expect(caHtml).toContain(translations.ca.pomodoroCloseBar);
    });

    it('prevents hardcoded English or Catalan strings from leaking when locale is Spanish', () => {
      const esHtml = renderWithLocale(React.createElement(PomodoroTimer, basePomodoroProps), 'es');
      // Must not leak Catalan phrases
      expect(esHtml).not.toContain('Mostra / amaga el disc visual');
      expect(esHtml).not.toContain('Disc Visual Analògic');
      expect(esHtml).not.toContain('Tancar');
      // Must not leak hardcoded English
      expect(esHtml).not.toContain('Close Pomodoro bar');
      expect(esHtml).not.toContain('Chime sound enabled');
    });

    it('prevents hardcoded English strings from leaking when locale is Catalan', () => {
      const caHtml = renderWithLocale(React.createElement(PomodoroTimer, basePomodoroProps), 'ca');
      expect(caHtml).not.toContain('Close Pomodoro bar');
      expect(caHtml).not.toContain('Chime sound enabled');
    });
  });

  // --------------------------------------------------------------------------
  // 3. TimeTimerDisk Localization & Leak Prevention
  // --------------------------------------------------------------------------
  describe('3. TimeTimerDisk Component Localization', () => {
    it('renders localized timer controls and status states across all languages', () => {
      const enHtml = renderWithLocale(React.createElement(TimeTimerDisk, { initialMinutes: 25 }), 'en');
      expect(enHtml).toContain(translations.en.timeTimerStatusPaused);
      expect(enHtml).toContain(translations.en.timeTimerStart);
      expect(enHtml).toContain(translations.en.timeTimerResetTitle);

      const esHtml = renderWithLocale(React.createElement(TimeTimerDisk, { initialMinutes: 25 }), 'es');
      expect(esHtml).toContain(translations.es.timeTimerStatusPaused);
      expect(esHtml).toContain(translations.es.timeTimerStart);
      expect(esHtml).toContain(translations.es.timeTimerResetTitle);

      const caHtml = renderWithLocale(React.createElement(TimeTimerDisk, { initialMinutes: 25 }), 'ca');
      expect(caHtml).toContain(translations.ca.timeTimerStatusPaused);
      expect(caHtml).toContain(translations.ca.timeTimerStart);
      expect(caHtml).toContain(translations.ca.timeTimerResetTitle);
    });

    it('prevents hardcoded English strings from leaking into Spanish and Catalan', () => {
      const esHtml = renderWithLocale(React.createElement(TimeTimerDisk, { initialMinutes: 25 }), 'es');
      expect(esHtml).not.toContain('title="Reset timer"');
      expect(esHtml).not.toContain('title="Sound enabled"');

      const caHtml = renderWithLocale(React.createElement(TimeTimerDisk, { initialMinutes: 25 }), 'ca');
      expect(caHtml).not.toContain('title="Reset timer"');
      expect(caHtml).not.toContain('title="Sound enabled"');
    });
  });

  // --------------------------------------------------------------------------
  // 4. SpotlightModal Localization & Leak Prevention
  // --------------------------------------------------------------------------
  describe('4. SpotlightModal Component Localization', () => {
    const baseSpotlightProps = {
      isOpen: true,
      onClose: vi.fn(),
      onCompleteTask: vi.fn(),
      onToggleSubtask: vi.fn(),
      onOpenGoblinBrain: vi.fn(),
    };

    it('renders single-task tunnel prompts and action buttons in English, Spanish, and Catalan', () => {
      // English
      const enHtml = renderWithLocale(
        React.createElement(SpotlightModal, { ...baseSpotlightProps, tasks: [mockTask] }),
        'en'
      );
      expect(enHtml).toContain(translations.en.spotlightFocusTunnel);
      expect(enHtml).toContain(translations.en.spotlightNextStep);
      expect(enHtml).toContain(translations.en.spotlightMarkDone);
      expect(enHtml).toContain(translations.en.spotlightSkipForNow);
      expect(enHtml).toContain(translations.en.spotlightGoblinPrompt);
      expect(enHtml).toContain(translations.en.spotlightTaskProgress(1, 1));

      // Spanish
      const esHtml = renderWithLocale(
        React.createElement(SpotlightModal, { ...baseSpotlightProps, tasks: [mockTask] }),
        'es'
      );
      expect(esHtml).toContain(translations.es.spotlightFocusTunnel);
      expect(esHtml).toContain(translations.es.spotlightNextStep);
      expect(esHtml).toContain(translations.es.spotlightMarkDone);
      expect(esHtml).toContain(translations.es.spotlightSkipForNow);
      expect(esHtml).toContain(translations.es.spotlightGoblinPrompt);
      expect(esHtml).toContain(translations.es.spotlightTaskProgress(1, 1));

      // Catalan
      const caHtml = renderWithLocale(
        React.createElement(SpotlightModal, { ...baseSpotlightProps, tasks: [mockTask] }),
        'ca'
      );
      expect(caHtml).toContain(translations.ca.spotlightFocusTunnel);
      expect(caHtml).toContain(translations.ca.spotlightNextStep);
      expect(caHtml).toContain(translations.ca.spotlightMarkDone);
      expect(caHtml).toContain(translations.ca.spotlightSkipForNow);
      expect(caHtml).toContain(translations.ca.spotlightGoblinPrompt);
      expect(caHtml).toContain(translations.ca.spotlightTaskProgress(1, 1));
    });

    it('renders clear-tunnel celebration state localized without English leaks', () => {
      const esEmptyHtml = renderWithLocale(
        React.createElement(SpotlightModal, { ...baseSpotlightProps, tasks: [] }),
        'es'
      );
      expect(esEmptyHtml).toContain(translations.es.spotlightEmptyTitle);
      expect(esEmptyHtml).toContain(translations.es.spotlightEmptyDesc);
      expect(esEmptyHtml).toContain(translations.es.spotlightBackToBoard);
      expect(esEmptyHtml).not.toContain('Your Focus Tunnel is Clear!');
      expect(esEmptyHtml).not.toContain('Back to Board');

      const caEmptyHtml = renderWithLocale(
        React.createElement(SpotlightModal, { ...baseSpotlightProps, tasks: [] }),
        'ca'
      );
      expect(caEmptyHtml).toContain(translations.ca.spotlightEmptyTitle);
      expect(caEmptyHtml).toContain(translations.ca.spotlightEmptyDesc);
      expect(caEmptyHtml).toContain(translations.ca.spotlightBackToBoard);
      expect(caEmptyHtml).not.toContain('Your Focus Tunnel is Clear!');
      expect(caEmptyHtml).not.toContain('Back to Board');
    });

    it('prevents hardcoded English strings from leaking into Spanish and Catalan with active task', () => {
      const esHtml = renderWithLocale(
        React.createElement(SpotlightModal, { ...baseSpotlightProps, tasks: [mockTask] }),
        'es'
      );
      expect(esHtml).not.toContain('Single-Task Focus Tunnel');
      expect(esHtml).not.toContain('Next Step:');
      expect(esHtml).not.toContain('Skip for now');
      expect(esHtml).not.toContain('Mark Done');

      const caHtml = renderWithLocale(
        React.createElement(SpotlightModal, { ...baseSpotlightProps, tasks: [mockTask] }),
        'ca'
      );
      expect(caHtml).not.toContain('Single-Task Focus Tunnel');
      expect(caHtml).not.toContain('Next Step:');
      expect(caHtml).not.toContain('Skip for now');
      expect(caHtml).not.toContain('Mark Done');
    });
  });

  // --------------------------------------------------------------------------
  // 5. BrainDumpDrawer Component Localization
  // --------------------------------------------------------------------------
  describe('5. BrainDumpDrawer Component Localization', () => {
    const baseBrainDumpProps = {
      isOpen: true,
      onClose: vi.fn(),
      onSaveTasks: vi.fn(),
    };

    it('renders localized drawer title, subtitle, placeholders, and action buttons', () => {
      // English
      const enHtml = renderWithLocale(React.createElement(BrainDumpDrawer, baseBrainDumpProps), 'en');
      expect(enHtml).toContain(translations.en.brainDumpTitle);
      expect(enHtml).toContain(translations.en.brainDumpSubtitle);
      expect(enHtml).toContain(translations.en.brainDumpSubmitBtn);
      expect(enHtml).toContain(translations.en.cancelBtn);

      // Spanish
      const esHtml = renderWithLocale(React.createElement(BrainDumpDrawer, baseBrainDumpProps), 'es');
      expect(esHtml).toContain(translations.es.brainDumpTitle);
      expect(esHtml).toContain(translations.es.brainDumpSubtitle);
      expect(esHtml).toContain(translations.es.brainDumpSubmitBtn);
      expect(esHtml).toContain(translations.es.cancelBtn);

      // Catalan
      const caHtml = renderWithLocale(React.createElement(BrainDumpDrawer, baseBrainDumpProps), 'ca');
      expect(caHtml).toContain(translations.ca.brainDumpTitle);
      expect(caHtml).toContain(translations.ca.brainDumpSubtitle);
      expect(caHtml).toContain(translations.ca.brainDumpSubmitBtn);
      expect(caHtml).toContain(translations.ca.cancelBtn);
    });

    it('prevents hardcoded English strings from leaking into Spanish and Catalan', () => {
      const esHtml = renderWithLocale(React.createElement(BrainDumpDrawer, baseBrainDumpProps), 'es');
      expect(esHtml).not.toContain('Brain Dump (Working Memory Offloader)');
      expect(esHtml).not.toContain('Dump & Clear Brain');

      const caHtml = renderWithLocale(React.createElement(BrainDumpDrawer, baseBrainDumpProps), 'ca');
      expect(caHtml).not.toContain('Brain Dump (Working Memory Offloader)');
      expect(caHtml).not.toContain('Dump & Clear Brain');
    });
  });

  // --------------------------------------------------------------------------
  // 6. CalendarModal Component Localization
  // --------------------------------------------------------------------------
  describe('6. CalendarModal Component Localization', () => {
    const baseCalendarProps = {
      isOpen: true,
      onClose: vi.fn(),
      apiKey: 'test-api-key',
      onRefreshMeetings: vi.fn(),
    };

    it('renders all 4 tabs and title localized across English, Spanish, and Catalan', () => {
      // English
      const enHtml = renderWithLocale(React.createElement(CalendarModal, baseCalendarProps), 'en');
      expect(enHtml).toContain(translations.en.calModalTitle);
      expect(enHtml).toContain(translations.en.calTabGhosts);
      expect(enHtml).toContain(translations.en.calTabFeeds);
      expect(enHtml).toContain(translations.en.calTabManual);
      expect(enHtml).toContain(translations.en.calTabImport);
      expect(enHtml).toContain(translations.en.calGhostsWhatIsTitle);
      expect(enHtml).toContain(translations.en.calGhostsEmpty);

      // Spanish
      const esHtml = renderWithLocale(React.createElement(CalendarModal, baseCalendarProps), 'es');
      expect(esHtml).toContain(translations.es.calModalTitle);
      expect(esHtml).toContain(translations.es.calTabGhosts);
      expect(esHtml).toContain(translations.es.calTabFeeds);
      expect(esHtml).toContain(translations.es.calTabManual);
      expect(esHtml).toContain(translations.es.calTabImport);
      expect(esHtml).toContain(translations.es.calGhostsWhatIsTitle);
      expect(esHtml).toContain(translations.es.calGhostsEmpty);

      // Catalan
      const caHtml = renderWithLocale(React.createElement(CalendarModal, baseCalendarProps), 'ca');
      expect(caHtml).toContain(translations.ca.calModalTitle);
      expect(caHtml).toContain(translations.ca.calTabGhosts);
      expect(caHtml).toContain(translations.ca.calTabFeeds);
      expect(caHtml).toContain(translations.ca.calTabManual);
      expect(caHtml).toContain(translations.ca.calTabImport);
      expect(caHtml).toContain(translations.ca.calGhostsWhatIsTitle);
      expect(caHtml).toContain(translations.ca.calGhostsEmpty);
    });

    it('prevents hardcoded English tab labels and headings from leaking when locale is Spanish or Catalan', () => {
      const esHtml = renderWithLocale(React.createElement(CalendarModal, baseCalendarProps), 'es');
      expect(esHtml).not.toContain('👻 Ghosts (Family / Spouse)');
      expect(esHtml).not.toContain('My Calendar Feeds');
      expect(esHtml).not.toContain('Raw .ics Upload');
      expect(esHtml).not.toContain('What are Ghosts?');

      const caHtml = renderWithLocale(React.createElement(CalendarModal, baseCalendarProps), 'ca');
      expect(caHtml).not.toContain('👻 Ghosts (Family / Spouse)');
      expect(caHtml).not.toContain('My Calendar Feeds');
      expect(caHtml).not.toContain('Raw .ics Upload');
      expect(caHtml).not.toContain('What are Ghosts?');
    });
  });

  // --------------------------------------------------------------------------
  // 7. Dynamic Locale Switching & Isolation
  // --------------------------------------------------------------------------
  describe('7. Dynamic Locale Switching & State Isolation', () => {
    it('switches cleanly through locales sequentially without cross-contamination', () => {
      // 1. Render in English
      const en1 = renderWithLocale(React.createElement(TimeTimerDisk, { initialMinutes: 25 }), 'en');
      expect(en1).toContain(translations.en.timeTimerStatusPaused);

      // 2. Switch to Spanish
      const es1 = renderWithLocale(React.createElement(TimeTimerDisk, { initialMinutes: 25 }), 'es');
      expect(es1).toContain(translations.es.timeTimerStatusPaused);
      expect(es1).not.toContain(translations.en.timeTimerStatusPaused);

      // 3. Switch to Catalan
      const ca1 = renderWithLocale(React.createElement(TimeTimerDisk, { initialMinutes: 25 }), 'ca');
      expect(ca1).toContain(translations.ca.timeTimerStatusPaused);

      // 4. Return to English
      const en2 = renderWithLocale(React.createElement(TimeTimerDisk, { initialMinutes: 25 }), 'en');
      expect(en2).toContain(translations.en.timeTimerStatusPaused);
    });
  });
});
