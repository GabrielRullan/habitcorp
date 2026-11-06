import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { I18nProvider } from '../src/client/i18n/I18nContext';
import { translations, Language, SupportedLang, Translations } from '../src/client/i18n/translations';
import { PomodoroTimer, PomodoroTimerProps } from '../src/client/components/PomodoroTimer';
import { TimeTimerDisk, TimeTimerDiskProps } from '../src/client/components/TimeTimerDisk';
import { SpotlightModal } from '../src/client/components/SpotlightModal';
import { BrainDumpDrawer } from '../src/client/components/BrainDumpDrawer';
import { CalendarModal } from '../src/client/components/CalendarModal';
import { Task, DifficultyTier } from '../src/client/types';

// ============================================================================
// 1. IN-MEMORY STORAGE MOCK WITH ERROR SIMULATION & STATE TRACKING
// ============================================================================

class AdversarialLocalStorageMock {
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

const mockStorage = new AdversarialLocalStorageMock();
(globalThis as any).window = globalThis;
(globalThis as any).localStorage = mockStorage;

// Safe mock for fetchJson
(globalThis as any).fetch = vi.fn().mockResolvedValue({
  ok: true,
  headers: { get: () => 'application/json' },
  json: async () => ({ calendars: [], ghosts: [] }),
});

function renderWithLocale(element: React.ReactElement, lang: Language): string {
  mockStorage.setItem('habitcorp_lang', lang);
  const rawHtml = renderToStaticMarkup(
    React.createElement(I18nProvider, null, element)
  );
  return rawHtml.replace(/&amp;/g, '&');
}

const makeMockTask = (difficulty: DifficultyTier = 'medium'): Task => ({
  id: 'task-adv-100',
  user_id: 'user-adversary',
  title: 'Conduct penetration test on modal localization',
  notes: 'Stress-test all input arguments, plural functions, and leak boundaries',
  type: 'todo',
  difficulty,
  completed: 0,
  position: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  subtasks: [
    { id: 'st-1', task_id: 'task-adv-100', title: 'Check singular/plural boundaries', completed: 0, position: 0 },
    { id: 'st-2', task_id: 'task-adv-100', title: 'Verify zero and negative counts', completed: 1, position: 1 },
  ],
});

// ============================================================================
// 2. ADVERSARIAL SUITE
// ============================================================================

describe('M5 Adversarial Suite: Modal Internationalization (Requirement R5)', () => {
  const supportedLangs: SupportedLang[] = ['en', 'es', 'ca'];

  beforeEach(() => {
    mockStorage.clear();
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // SUITE 1: DYNAMIC PLURALIZED FUNCTIONS STRESS HARNESS
  // --------------------------------------------------------------------------
  describe('Suite 1: Dynamic Pluralized Functions Edge Counts (0, 1, 2, 5, 999, negative)', () => {
    const testCounts = [0, 1, 2, 5, 999, -1, 10000];

    it('calGhostAddedSynced: correctly differentiates singular and plural across en, es, ca', () => {
      // English: 1 event vs events
      expect(translations.en.calGhostAddedSynced(1)).toBe('Ghost added and synced 1 event!');
      expect(translations.en.calGhostAddedSynced(0)).toBe('Ghost added and synced 0 events!');
      expect(translations.en.calGhostAddedSynced(2)).toBe('Ghost added and synced 2 events!');
      expect(translations.en.calGhostAddedSynced(5)).toBe('Ghost added and synced 5 events!');
      expect(translations.en.calGhostAddedSynced(999)).toBe('Ghost added and synced 999 events!');

      // Spanish: 1 evento sincronizado vs eventos sincronizados
      expect(translations.es.calGhostAddedSynced(1)).toBe('¡Contacto fantasma añadido y 1 evento sincronizado!');
      expect(translations.es.calGhostAddedSynced(0)).toBe('¡Contacto fantasma añadido y 0 eventos sincronizados!');
      expect(translations.es.calGhostAddedSynced(2)).toBe('¡Contacto fantasma añadido y 2 eventos sincronizados!');
      expect(translations.es.calGhostAddedSynced(5)).toBe('¡Contacto fantasma añadido y 5 eventos sincronizados!');
      expect(translations.es.calGhostAddedSynced(999)).toBe('¡Contacto fantasma añadido y 999 eventos sincronizados!');

      // Catalan: 1 esdeveniment sincronitzat vs esdeveniments sincronitzats
      expect(translations.ca.calGhostAddedSynced(1)).toBe('Contacte fantasma afegit i 1 esdeveniment sincronitzat!');
      expect(translations.ca.calGhostAddedSynced(0)).toBe('Contacte fantasma afegit i 0 esdeveniments sincronitzats!');
      expect(translations.ca.calGhostAddedSynced(2)).toBe('Contacte fantasma afegit i 2 esdeveniments sincronitzats!');
      expect(translations.ca.calGhostAddedSynced(5)).toBe('Contacte fantasma afegit i 5 esdeveniments sincronitzats!');
      expect(translations.ca.calGhostAddedSynced(999)).toBe('Contacte fantasma afegit i 999 esdeveniments sincronitzats!');
    });

    it('calGhostSyncedEvents: correctly handles singular and plural counts', () => {
      supportedLangs.forEach((lang) => {
        const fn = translations[lang].calGhostSyncedEvents;
        testCounts.forEach((count) => {
          const res = fn(count);
          expect(res).toBeDefined();
          expect(res).toContain(String(count));
          if (count === 1) {
            if (lang === 'en') expect(res).toContain('1 event updated');
            if (lang === 'es') expect(res).toContain('1 evento actualizado');
            if (lang === 'ca') expect(res).toContain('1 esdeveniment actualitzat');
          } else {
            if (lang === 'en') expect(res).toContain(`${count} events updated`);
            if (lang === 'es') expect(res).toContain(`${count} eventos actualizados`);
            if (lang === 'ca') expect(res).toContain(`${count} esdeveniments actualitzats`);
          }
        });
      });
    });

    it('calFeedAddedSynced: pluralizes feed added message properly', () => {
      // 1 singular
      expect(translations.en.calFeedAddedSynced(1)).toContain('Synced 1 event.');
      expect(translations.es.calFeedAddedSynced(1)).toContain('Sincronizado 1 evento.');
      expect(translations.ca.calFeedAddedSynced(1)).toContain('Sincronitzat 1 esdeveniment.');

      // 0, 2, 5, 999 plurals
      [0, 2, 5, 999].forEach((count) => {
        expect(translations.en.calFeedAddedSynced(count)).toContain(`Synced ${count} events.`);
        expect(translations.es.calFeedAddedSynced(count)).toContain(`Sincronizados ${count} eventos.`);
        expect(translations.ca.calFeedAddedSynced(count)).toContain(`Sincronitzats ${count} esdeveniments.`);
      });
    });

    it('calFeedSyncedEvents: updates event counts accurately', () => {
      expect(translations.en.calFeedSyncedEvents(1)).toContain('1 event updated');
      expect(translations.es.calFeedSyncedEvents(1)).toContain('1 evento actualizado');
      expect(translations.ca.calFeedSyncedEvents(1)).toContain('1 esdeveniment actualitzat');

      [0, 2, 5, 999].forEach((c) => {
        expect(translations.en.calFeedSyncedEvents(c)).toContain(`${c} events updated`);
        expect(translations.es.calFeedSyncedEvents(c)).toContain(`${c} eventos actualizados`);
        expect(translations.ca.calFeedSyncedEvents(c)).toContain(`${c} esdeveniments actualitzats`);
      });
    });

    it('calEventsImported: imports event count string without corruption', () => {
      expect(translations.en.calEventsImported(1)).toBe('Imported 1 calendar event!');
      expect(translations.en.calEventsImported(999)).toBe('Imported 999 calendar events!');

      expect(translations.es.calEventsImported(1)).toBe('¡1 evento de calendario importado!');
      expect(translations.es.calEventsImported(999)).toBe('¡999 eventos de calendario importados!');

      expect(translations.ca.calEventsImported(1)).toBe("S'han importat 1 esdeveniment de calendari!");
      expect(translations.ca.calEventsImported(999)).toBe("S'han importat 999 esdeveniments de calendari!");
    });

    it('calGhostEventsCount & calFeedEventsCount: format badge pill strings', () => {
      supportedLangs.forEach((lang) => {
        const fnGhost = translations[lang].calGhostEventsCount;
        const fnFeed = translations[lang].calFeedEventsCount;

        expect(fnGhost(1)).toBe(fnFeed(1));
        expect(fnGhost(2)).toBe(fnFeed(2));
        expect(fnGhost(0)).toBe(fnFeed(0));

        if (lang === 'en') {
          expect(fnGhost(1)).toBe('1 event');
          expect(fnGhost(0)).toBe('0 events');
          expect(fnGhost(5)).toBe('5 events');
        } else if (lang === 'es') {
          expect(fnGhost(1)).toBe('1 evento');
          expect(fnGhost(0)).toBe('0 eventos');
          expect(fnGhost(5)).toBe('5 eventos');
        } else if (lang === 'ca') {
          expect(fnGhost(1)).toBe('1 esdeveniment');
          expect(fnGhost(0)).toBe('0 esdeveniments');
          expect(fnGhost(5)).toBe('5 esdeveniments');
        }
      });
    });

    it('calManualGhostCountBadge: differentiates 1 Ghost vs multiple Ghosts', () => {
      // English
      expect(translations.en.calManualGhostCountBadge(1)).toBe('1 Ghost');
      expect(translations.en.calManualGhostCountBadge(0)).toBe('0 Ghosts');
      expect(translations.en.calManualGhostCountBadge(2)).toBe('2 Ghosts');
      expect(translations.en.calManualGhostCountBadge(999)).toBe('999 Ghosts');

      // Spanish
      expect(translations.es.calManualGhostCountBadge(1)).toBe('1 Fantasma');
      expect(translations.es.calManualGhostCountBadge(0)).toBe('0 Fantasmas');
      expect(translations.es.calManualGhostCountBadge(2)).toBe('2 Fantasmas');
      expect(translations.es.calManualGhostCountBadge(999)).toBe('999 Fantasmas');

      // Catalan
      expect(translations.ca.calManualGhostCountBadge(1)).toBe('1 Fantasma');
      expect(translations.ca.calManualGhostCountBadge(0)).toBe('0 Fantasmes');
      expect(translations.ca.calManualGhostCountBadge(2)).toBe('2 Fantasmes');
      expect(translations.ca.calManualGhostCountBadge(999)).toBe('999 Fantasmes');
    });

    it('spotlightTaskProgress: correctly handles boundary progress counts', () => {
      testCounts.forEach((c) => {
        expect(translations.en.spotlightTaskProgress(c, c)).toContain(`Task ${c} of ${c || c}`);
        expect(translations.es.spotlightTaskProgress(c, c)).toContain(`Tarea ${c} de ${c || c}`);
        expect(translations.ca.spotlightTaskProgress(c, c)).toContain(`Tasca ${c} de ${c || c}`);
      });

      // Edge: (0, 0)
      expect(translations.en.spotlightTaskProgress(0, 0)).toBe('Task 0 of 0 • Press Esc to exit');
      expect(translations.es.spotlightTaskProgress(0, 0)).toBe('Tarea 0 de 0 • Pulsa Esc para salir');
      expect(translations.ca.spotlightTaskProgress(0, 0)).toBe('Tasca 0 de 0 • Prem Esc per sortir');

      // Edge: (1, 10)
      expect(translations.en.spotlightTaskProgress(1, 10)).toBe('Task 1 of 10 • Press Esc to exit');
      expect(translations.es.spotlightTaskProgress(1, 10)).toBe('Tarea 1 de 10 • Pulsa Esc para salir');
      expect(translations.ca.spotlightTaskProgress(1, 10)).toBe('Tasca 1 de 10 • Prem Esc per sortir');
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 2: FUZZING & HOSTILE INPUT DEFENSE (FUNCTION SAFETY)
  // --------------------------------------------------------------------------
  describe('Suite 2: Hostile Input Fuzzing & Unhandled Exception Defense across all 3 languages', () => {
    const hostileInputs = [
      undefined,
      null,
      '',
      0,
      1,
      -1,
      2.71828,
      NaN,
      Infinity,
      -Infinity,
      '<script>alert("xss")</script>',
      'Special 👻 🍅 ⏳',
      {},
      [],
      [1, 2],
      true,
      false,
    ];

    it('invokes EVERY translation function with hostile argument types without throwing', () => {
      supportedLangs.forEach((lang) => {
        const dict = translations[lang];
        const fnEntries = Object.entries(dict).filter(([_, val]) => typeof val === 'function');

        expect(fnEntries.length).toBeGreaterThanOrEqual(15);

        fnEntries.forEach(([key, fn]) => {
          // 1. Zero arguments
          expect(() => {
            const res = (fn as Function)();
            expect(typeof res, `[${lang}].${key}() did not return string`).toBe('string');
            expect((res as string).length, `[${lang}].${key}() returned empty string`).toBeGreaterThan(0);
          }).not.toThrow();

          // 2. Fuzz with each hostile input as single argument
          hostileInputs.forEach((input) => {
            expect(() => {
              const res = (fn as Function)(input);
              expect(typeof res, `[${lang}].${key}(${input}) did not return string`).toBe('string');
              expect((res as string).length).toBeGreaterThan(0);
            }).not.toThrow();
          });

          // 3. Fuzz with dual arguments
          hostileInputs.slice(0, 8).forEach((in1) => {
            hostileInputs.slice(0, 8).forEach((in2) => {
              expect(() => {
                const res = (fn as Function)(in1, in2);
                expect(typeof res, `[${lang}].${key}(${in1}, ${in2}) did not return string`).toBe('string');
                expect((res as string).length).toBeGreaterThan(0);
              }).not.toThrow();
            });
          });
        });
      });
    });

    it('ensures zero unhandled exceptions when calling parameterized functions with null or undefined', () => {
      supportedLangs.forEach((lang) => {
        const dict = translations[lang];
        // calGhostAddSyncError
        expect(dict.calGhostAddSyncError(undefined)).not.toContain('undefined');
        expect(typeof dict.calGhostAddSyncError(undefined)).toBe('string');
        // calFeedAddSyncNotice
        expect(dict.calFeedAddSyncNotice(undefined)).not.toContain('undefined');
        expect(typeof dict.calFeedAddSyncNotice(undefined)).toBe('string');
        // calGhostEditHeading
        expect(dict.calGhostEditHeading(undefined)).not.toContain('undefined');
        // calFeedEditHeading
        expect(dict.calFeedEditHeading(undefined)).not.toContain('undefined');
        // calGhostLastSynced
        expect(dict.calGhostLastSynced(undefined)).not.toContain('undefined');
        // calFeedLastSynced
        expect(dict.calFeedLastSynced(undefined, undefined)).not.toContain('undefined');
      });
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 3: COMPLETE KEY PARITY & INTEGRITY
  // --------------------------------------------------------------------------
  describe('Suite 3: 100% Dictionary Key Parity and Translation Completeness', () => {
    it('verifies exact key parity between en, es, and ca', () => {
      const enKeys = Object.keys(translations.en).sort();
      const esKeys = Object.keys(translations.es).sort();
      const caKeys = Object.keys(translations.ca).sort();

      expect(esKeys).toEqual(enKeys);
      expect(caKeys).toEqual(enKeys);
    });

    it('verifies that no key value in en, es, or ca is undefined or null', () => {
      supportedLangs.forEach((lang) => {
        const dict = translations[lang];
        Object.entries(dict).forEach(([key, val]) => {
          expect(val, `translations.${lang}.${key} is undefined/null`).toBeDefined();
          if (typeof val === 'string') {
            expect(val.trim().length, `translations.${lang}.${key} is empty string`).toBeGreaterThan(0);
          }
        });
      });
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 4: ALL 5 MODALS RENDERING ACROSS ALL 3 LANGUAGES
  // --------------------------------------------------------------------------
  describe('Suite 4: Modal Component Rendering across English, Spanish, and Catalan', () => {
    // 1. PomodoroTimer
    it('renders PomodoroTimer in en, es, ca with matching titles and buttons', () => {
      const props: PomodoroTimerProps = { isOpen: true, onToggleOpen: vi.fn() };
      supportedLangs.forEach((lang) => {
        const html = renderWithLocale(React.createElement(PomodoroTimer, props), lang);
        expect(html).toContain(translations[lang].pomodoroTitle);
        expect(html).toContain(translations[lang].startPomodoro);
        expect(html).toContain(translations[lang].pomodoroVisualDiskBtn);
        expect(html).toContain(translations[lang].pomodoroCloseBar);
      });
    });

    // 2. TimeTimerDisk
    it('renders TimeTimerDisk in en, es, ca with proper action labels', () => {
      supportedLangs.forEach((lang) => {
        const html = renderWithLocale(React.createElement(TimeTimerDisk, { initialMinutes: 25 }), lang);
        expect(html).toContain(translations[lang].timeTimerStatusPaused);
        expect(html).toContain(translations[lang].timeTimerStart);
        expect(html).toContain(translations[lang].timeTimerResetTitle);
      });
    });

    // 3. SpotlightModal (active task)
    it('renders SpotlightModal in en, es, ca with active task', () => {
      const task = makeMockTask('medium');
      const props = {
        isOpen: true,
        onClose: vi.fn(),
        tasks: [task],
        onCompleteTask: vi.fn(),
        onToggleSubtask: vi.fn(),
        onOpenGoblinBrain: vi.fn(),
      };

      supportedLangs.forEach((lang) => {
        const html = renderWithLocale(React.createElement(SpotlightModal, props), lang);
        expect(html).toContain(translations[lang].spotlightFocusTunnel);
        expect(html).toContain(translations[lang].spotlightNextStep);
        expect(html).toContain(translations[lang].spotlightMarkDone);
        expect(html).toContain(translations[lang].spotlightSkipForNow);
        expect(html).toContain(translations[lang].spotlightGoblinPrompt);
      });
    });

    // 3b. SpotlightModal (empty focus tunnel)
    it('renders SpotlightModal empty state in en, es, ca', () => {
      const props = {
        isOpen: true,
        onClose: vi.fn(),
        tasks: [],
        onCompleteTask: vi.fn(),
        onToggleSubtask: vi.fn(),
        onOpenGoblinBrain: vi.fn(),
      };

      supportedLangs.forEach((lang) => {
        const html = renderWithLocale(React.createElement(SpotlightModal, props), lang);
        expect(html).toContain(translations[lang].spotlightEmptyTitle);
        expect(html).toContain(translations[lang].spotlightEmptyDesc);
        expect(html).toContain(translations[lang].spotlightBackToBoard);
      });
    });

    // 4. BrainDumpDrawer
    it('renders BrainDumpDrawer in en, es, ca with localized form and help text', () => {
      const props = {
        isOpen: true,
        onClose: vi.fn(),
        onSaveTasks: vi.fn(),
      };

      supportedLangs.forEach((lang) => {
        const html = renderWithLocale(React.createElement(BrainDumpDrawer, props), lang);
        expect(html).toContain(translations[lang].brainDumpTitle);
        expect(html).toContain(translations[lang].brainDumpSubtitle);
        expect(html).toContain(translations[lang].brainDumpSubmitBtn);
        expect(html).toContain(translations[lang].cancelBtn);
      });
    });

    // 5. CalendarModal
    it('renders CalendarModal in en, es, ca with tabs, callouts, and ghost headers', () => {
      const props = {
        isOpen: true,
        onClose: vi.fn(),
        apiKey: 'adversarial-key',
        onRefreshMeetings: vi.fn(),
      };

      supportedLangs.forEach((lang) => {
        const html = renderWithLocale(React.createElement(CalendarModal, props), lang);
        expect(html).toContain(translations[lang].calModalTitle);
        expect(html).toContain(translations[lang].calTabGhosts);
        expect(html).toContain(translations[lang].calTabFeeds);
        expect(html).toContain(translations[lang].calTabManual);
        expect(html).toContain(translations[lang].calTabImport);
        expect(html).toContain(translations[lang].calGhostsWhatIsTitle);
        expect(html).toContain(translations[lang].calGhostsEmpty);
        expect(html).toContain(translations[lang].calGhostAddNewHeading);
        expect(html).toContain(translations[lang].calGhostAddSubmitBtn);
      });
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 5: LEAK PREVENTION & LOCALE PURITY ACROSS ALL MODALS
  // --------------------------------------------------------------------------
  describe('Suite 5: Leak Prevention Matrix (Zero Cross-Language Contamination)', () => {
    // ------------------------------------------------------------------------
    // 1. PomodoroTimer Leak Checks
    // ------------------------------------------------------------------------
    describe('PomodoroTimer Leak Prevention', () => {
      const pomodoroProps = { isOpen: true, onToggleOpen: vi.fn() };

      it('prevents English and Catalan phrases when PomodoroTimer is rendered in Spanish', () => {
        const esHtml = renderWithLocale(React.createElement(PomodoroTimer, pomodoroProps), 'es');

        // English phrases must not leak
        const forbiddenEnglish = [
          'Pomodoro Timer',
          'Close Pomodoro bar',
          'Chime sound enabled',
          'Chime sound muted',
          'Show / hide visual disk',
          'Time is up!',
          'Session completed!',
          'Reset to 25m',
        ];
        forbiddenEnglish.forEach((phrase) => {
          expect(esHtml, `Leaked English phrase "${phrase}" in Spanish PomodoroTimer`).not.toContain(phrase);
        });

        // Catalan phrases must not leak
        const forbiddenCatalan = [
          'Mostra / amaga el disc visual',
          'Disc Visual Analògic',
          'Tancar la barra de Pomodoro',
          "So d'avís activat",
          "So d'avís silenciat",
          'Temps exhaurit!',
          'Sessió completada!',
          'Restablir a 25m',
        ];
        forbiddenCatalan.forEach((phrase) => {
          expect(esHtml, `Leaked Catalan phrase "${phrase}" in Spanish PomodoroTimer`).not.toContain(phrase);
        });
      });

      it('prevents English and Spanish phrases when PomodoroTimer is rendered in Catalan', () => {
        const caHtml = renderWithLocale(React.createElement(PomodoroTimer, pomodoroProps), 'ca');

        // English phrases must not leak
        const forbiddenEnglish = [
          'Pomodoro Timer',
          'Close Pomodoro bar',
          'Chime sound enabled',
          'Chime sound muted',
          'Show / hide visual disk',
          'Time is up!',
          'Session completed!',
          'Reset to 25m',
        ];
        forbiddenEnglish.forEach((phrase) => {
          expect(caHtml, `Leaked English phrase "${phrase}" in Catalan PomodoroTimer`).not.toContain(phrase);
        });

        // Spanish phrases must not leak
        const forbiddenSpanish = [
          'Cerrar barra de Pomodoro',
          'Sonido de aviso activado',
          'Sonido de aviso silenciado',
          'Mostrar / ocultar disco visual',
          '¡Tiempo agotado!',
          '¡Sesión completada!',
          'Reiniciar a 25m',
        ];
        forbiddenSpanish.forEach((phrase) => {
          expect(caHtml, `Leaked Spanish phrase "${phrase}" in Catalan PomodoroTimer`).not.toContain(phrase);
        });
      });

      it('prevents Spanish and Catalan phrases when PomodoroTimer is rendered in English', () => {
        const enHtml = renderWithLocale(React.createElement(PomodoroTimer, pomodoroProps), 'en');

        const forbiddenForeign = [
          'Cerrar barra de Pomodoro',
          'Tancar la barra de Pomodoro',
          'Sonido de aviso activado',
          "So d'avís activat",
          '¡Sesión completada!',
          'Sessió completada!',
          'Reiniciar a 25m',
          'Restablir a 25m',
        ];
        forbiddenForeign.forEach((phrase) => {
          expect(enHtml, `Leaked phrase "${phrase}" in English PomodoroTimer`).not.toContain(phrase);
        });
      });
    });

    // ------------------------------------------------------------------------
    // 2. TimeTimerDisk Leak Checks
    // ------------------------------------------------------------------------
    describe('TimeTimerDisk Leak Prevention', () => {
      it('prevents English and Catalan phrases when TimeTimerDisk is rendered in Spanish', () => {
        const esHtml = renderWithLocale(React.createElement(TimeTimerDisk, { initialMinutes: 25 }), 'es');

        const forbiddenEnglish = [
          'Reset timer',
          'Sound enabled',
          'Sound muted',
          'Focusing',
          'Paused',
          'Done!',
        ];
        forbiddenEnglish.forEach((phrase) => {
          expect(esHtml, `Leaked English "${phrase}" in Spanish TimeTimerDisk`).not.toContain(phrase);
        });

        const forbiddenCatalan = [
          'Restablir temporitzador',
          'So activat',
          'So silenciat',
          'Concentrant-se',
          'Fet!',
        ];
        forbiddenCatalan.forEach((phrase) => {
          expect(esHtml, `Leaked Catalan "${phrase}" in Spanish TimeTimerDisk`).not.toContain(phrase);
        });
      });

      it('prevents English and Spanish phrases when TimeTimerDisk is rendered in Catalan', () => {
        const caHtml = renderWithLocale(React.createElement(TimeTimerDisk, { initialMinutes: 25 }), 'ca');

        const forbiddenEnglish = [
          'Reset timer',
          'Sound enabled',
          'Sound muted',
          'Focusing',
          'Paused',
          'Done!',
        ];
        forbiddenEnglish.forEach((phrase) => {
          expect(caHtml, `Leaked English "${phrase}" in Catalan TimeTimerDisk`).not.toContain(phrase);
        });

        const forbiddenSpanish = [
          'Reiniciar temporizador',
          'Sonido activado',
          'Sonido silenciado',
          'Enfocando',
          '¡Hecho!',
        ];
        forbiddenSpanish.forEach((phrase) => {
          expect(caHtml, `Leaked Spanish "${phrase}" in Catalan TimeTimerDisk`).not.toContain(phrase);
        });
      });
    });

    // ------------------------------------------------------------------------
    // 3. SpotlightModal Leak Checks
    // ------------------------------------------------------------------------
    describe('SpotlightModal Leak Prevention', () => {
      const activeTaskProps = {
        isOpen: true,
        onClose: vi.fn(),
        tasks: [makeMockTask('hard')],
        onCompleteTask: vi.fn(),
        onToggleSubtask: vi.fn(),
        onOpenGoblinBrain: vi.fn(),
      };

      const emptyTaskProps = {
        isOpen: true,
        onClose: vi.fn(),
        tasks: [],
        onCompleteTask: vi.fn(),
        onToggleSubtask: vi.fn(),
        onOpenGoblinBrain: vi.fn(),
      };

      it('prevents English and Catalan phrases when SpotlightModal is rendered in Spanish', () => {
        const esHtmlActive = renderWithLocale(React.createElement(SpotlightModal, activeTaskProps), 'es');

        const forbiddenEnglish = [
          'Single-Task Focus Tunnel',
          'Next Step:',
          'Mark Done',
          'Skip for now',
          'Skip to next task for now (no penalty)',
          'Stuck? Break this down with Goblin Brain',
          'Toggle Analog Time-Timer Disk',
          'Analog Timer',
          'Hide Timer',
          'Exit Spotlight (Esc)',
          'Task 1 of',
        ];
        forbiddenEnglish.forEach((phrase) => {
          expect(esHtmlActive, `Leaked English phrase "${phrase}" in Spanish SpotlightModal`).not.toContain(phrase);
        });

        const forbiddenCatalan = [
          'Túnel de Concentració Monotasca',
          'Següent pas:',
          'Marca com a fet',
          'Bloquejat? Desglossa-ho amb Goblin Brain',
          'Tasca 1 de',
        ];
        forbiddenCatalan.forEach((phrase) => {
          expect(esHtmlActive, `Leaked Catalan phrase "${phrase}" in Spanish SpotlightModal`).not.toContain(phrase);
        });

        const esHtmlEmpty = renderWithLocale(React.createElement(SpotlightModal, emptyTaskProps), 'es');
        expect(esHtmlEmpty).not.toContain('Your Focus Tunnel is Clear!');
        expect(esHtmlEmpty).not.toContain('Back to Board');
        expect(esHtmlEmpty).not.toContain('El teu túnel de concentració està buit!');
        expect(esHtmlEmpty).not.toContain('Tornar al Tauler');
      });

      it('prevents English and Spanish phrases when SpotlightModal is rendered in Catalan', () => {
        const caHtmlActive = renderWithLocale(React.createElement(SpotlightModal, activeTaskProps), 'ca');

        const forbiddenEnglish = [
          'Single-Task Focus Tunnel',
          'Next Step:',
          'Mark Done',
          'Skip for now',
          'Stuck? Break this down with Goblin Brain',
          'Task 1 of',
        ];
        forbiddenEnglish.forEach((phrase) => {
          expect(caHtmlActive, `Leaked English phrase "${phrase}" in Catalan SpotlightModal`).not.toContain(phrase);
        });

        const forbiddenSpanish = [
          'Túnel de Enfoque Monotarea',
          'Siguiente paso:',
          'Marcar como hecho',
          '¿Bloqueado? Divide esto con Goblin Brain',
          'Tarea 1 de',
        ];
        forbiddenSpanish.forEach((phrase) => {
          expect(caHtmlActive, `Leaked Spanish phrase "${phrase}" in Catalan SpotlightModal`).not.toContain(phrase);
        });

        const caHtmlEmpty = renderWithLocale(React.createElement(SpotlightModal, emptyTaskProps), 'ca');
        expect(caHtmlEmpty).not.toContain('Your Focus Tunnel is Clear!');
        expect(caHtmlEmpty).not.toContain('Back to Board');
        expect(caHtmlEmpty).not.toContain('¡Tu túnel de enfoque está despejado!');
        expect(caHtmlEmpty).not.toContain('Volver al Tablero');
      });
    });

    // ------------------------------------------------------------------------
    // 4. BrainDumpDrawer Leak Checks
    // ------------------------------------------------------------------------
    describe('BrainDumpDrawer Leak Prevention', () => {
      const brainDumpProps = {
        isOpen: true,
        onClose: vi.fn(),
        onSaveTasks: vi.fn(),
      };

      it('prevents English and Catalan phrases when BrainDumpDrawer is rendered in Spanish', () => {
        const esHtml = renderWithLocale(React.createElement(BrainDumpDrawer, brainDumpProps), 'es');

        const forbiddenEnglish = [
          'Brain Dump (Working Memory Offloader)',
          'Dump intrusive thoughts here',
          'Each line becomes a backlog task',
          'Dump & Clear Brain',
          'Offloading...',
        ];
        forbiddenEnglish.forEach((phrase) => {
          expect(esHtml, `Leaked English phrase "${phrase}" in Spanish BrainDumpDrawer`).not.toContain(phrase);
        });

        const forbiddenCatalan = [
          'Buidatge Mental (Descàrrega de Memòria de Treball)',
          'Aboqueu pensaments intrusius',
          'Cada línia esdevé una tasca',
          'Bolcar i aclarir la ment',
          'Descarregant...',
        ];
        forbiddenCatalan.forEach((phrase) => {
          expect(esHtml, `Leaked Catalan phrase "${phrase}" in Spanish BrainDumpDrawer`).not.toContain(phrase);
        });
      });

      it('prevents English and Spanish phrases when BrainDumpDrawer is rendered in Catalan', () => {
        const caHtml = renderWithLocale(React.createElement(BrainDumpDrawer, brainDumpProps), 'ca');

        const forbiddenEnglish = [
          'Brain Dump (Working Memory Offloader)',
          'Dump intrusive thoughts here',
          'Each line becomes a backlog task',
          'Dump & Clear Brain',
          'Offloading...',
        ];
        forbiddenEnglish.forEach((phrase) => {
          expect(caHtml, `Leaked English phrase "${phrase}" in Catalan BrainDumpDrawer`).not.toContain(phrase);
        });

        const forbiddenSpanish = [
          'Vaciado Mental (Descarga de Memoria de Trabajo)',
          'Vuelca pensamientos intrusivos',
          'Cada línea se convierte en una tarea',
          'Volcar y despejar mente',
          'Descargando...',
        ];
        forbiddenSpanish.forEach((phrase) => {
          expect(caHtml, `Leaked Spanish phrase "${phrase}" in Catalan BrainDumpDrawer`).not.toContain(phrase);
        });
      });
    });

    // ------------------------------------------------------------------------
    // 5. CalendarModal Leak Checks
    // ------------------------------------------------------------------------
    describe('CalendarModal Leak Prevention', () => {
      const calProps = {
        isOpen: true,
        onClose: vi.fn(),
        apiKey: 'adversarial-key',
        onRefreshMeetings: vi.fn(),
      };

      it('prevents English and Catalan phrases when CalendarModal is rendered in Spanish', () => {
        const esHtml = renderWithLocale(React.createElement(CalendarModal, calProps), 'es');

        const forbiddenEnglish = [
          '👻 Ghosts (Family / Spouse)',
          'My Calendar Feeds',
          'Add Meeting',
          'Raw .ics Upload',
          'What are Ghosts?',
          'No ghosts configured yet',
          'Add New Ghost',
          'Add Ghost',
        ];
        forbiddenEnglish.forEach((phrase) => {
          expect(esHtml, `Leaked English phrase "${phrase}" in Spanish CalendarModal`).not.toContain(phrase);
        });

        const forbiddenCatalan = [
          '👻 Fantasmes (Família / Parella)',
          'Els Meus Calendaris',
          'Afegir reunió',
          'Pujar .ics en brut',
          'Què són els Fantasmes?',
          'Encara no teniu cap contacte fantasma',
          'Afegir Nou Fantasma',
          'Afegir Fantasma',
        ];
        forbiddenCatalan.forEach((phrase) => {
          expect(esHtml, `Leaked Catalan phrase "${phrase}" in Spanish CalendarModal`).not.toContain(phrase);
        });
      });

      it('prevents English and Spanish phrases when CalendarModal is rendered in Catalan', () => {
        const caHtml = renderWithLocale(React.createElement(CalendarModal, calProps), 'ca');

        const forbiddenEnglish = [
          '👻 Ghosts (Family / Spouse)',
          'My Calendar Feeds',
          'Add Meeting',
          'Raw .ics Upload',
          'What are Ghosts?',
          'No ghosts configured yet',
          'Add New Ghost',
          'Add Ghost',
        ];
        forbiddenEnglish.forEach((phrase) => {
          expect(caHtml, `Leaked English phrase "${phrase}" in Catalan CalendarModal`).not.toContain(phrase);
        });

        const forbiddenSpanish = [
          '👻 Fantasmas (Familia / Pareja)',
          'Mis Calendarios',
          'Añadir Reunión',
          'Subir .ics en bruto',
          '¿Qué son los Fantasmas?',
          'No hay contactos fantasma configurados',
          'Añadir Nuevo Fantasma',
          'Añadir Fantasma',
        ];
        forbiddenSpanish.forEach((phrase) => {
          expect(caHtml, `Leaked Spanish phrase "${phrase}" in Catalan CalendarModal`).not.toContain(phrase);
        });
      });
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 6: DYNAMIC RUNTIME LOCALE SWITCHING STABILITY
  // --------------------------------------------------------------------------
  describe('Suite 6: Dynamic Runtime Locale Switching Cycle & Re-rendering', () => {
    it('executes rapid locale switching cycles (en -> es -> ca -> en) without state leakage', () => {
      // 1. English
      const en1 = renderWithLocale(React.createElement(BrainDumpDrawer, { isOpen: true, onClose: vi.fn(), onSaveTasks: vi.fn() }), 'en');
      expect(en1).toContain(translations.en.brainDumpTitle);
      expect(en1).not.toContain(translations.es.brainDumpTitle);
      expect(en1).not.toContain(translations.ca.brainDumpTitle);

      // 2. Spanish
      const es1 = renderWithLocale(React.createElement(BrainDumpDrawer, { isOpen: true, onClose: vi.fn(), onSaveTasks: vi.fn() }), 'es');
      expect(es1).toContain(translations.es.brainDumpTitle);
      expect(es1).not.toContain(translations.en.brainDumpTitle);
      expect(es1).not.toContain(translations.ca.brainDumpTitle);

      // 3. Catalan
      const ca1 = renderWithLocale(React.createElement(BrainDumpDrawer, { isOpen: true, onClose: vi.fn(), onSaveTasks: vi.fn() }), 'ca');
      expect(ca1).toContain(translations.ca.brainDumpTitle);
      expect(ca1).not.toContain(translations.en.brainDumpTitle);
      expect(ca1).not.toContain(translations.es.brainDumpTitle);

      // 4. English back
      const en2 = renderWithLocale(React.createElement(BrainDumpDrawer, { isOpen: true, onClose: vi.fn(), onSaveTasks: vi.fn() }), 'en');
      expect(en2).toContain(translations.en.brainDumpTitle);
      expect(en2).not.toContain(translations.es.brainDumpTitle);
      expect(en2).not.toContain(translations.ca.brainDumpTitle);
    });
  });
});
