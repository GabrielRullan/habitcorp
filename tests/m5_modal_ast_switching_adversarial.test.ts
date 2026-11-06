import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import fs from 'fs';
import path from 'path';
import ts from 'typescript';
import { I18nProvider, useTranslation } from '../src/client/i18n/I18nContext';
import { translations, Language, SupportedLang, Translations } from '../src/client/i18n/translations';
import { PomodoroTimer } from '../src/client/components/PomodoroTimer';
import { TimeTimerDisk } from '../src/client/components/TimeTimerDisk';
import { SpotlightModal } from '../src/client/components/SpotlightModal';
import { BrainDumpDrawer } from '../src/client/components/BrainDumpDrawer';
import { CalendarModal } from '../src/client/components/CalendarModal';
import { Task } from '../src/client/types';

// ============================================================================
// 1. MOCK ENVIRONMENT & HELPERS
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
  id: 'task-adv-1',
  user_id: 'user-adv',
  title: 'Audit AST and internationalization pipeline',
  notes: 'Ensure zero hardcoded string leaks across modals',
  type: 'todo',
  difficulty: 'medium',
  completed: 0,
  position: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  subtasks: [
    { id: 'st-adv-1', task_id: 'task-adv-1', title: 'Parse TypeScript AST', completed: 0, position: 0 },
    { id: 'st-adv-2', task_id: 'task-adv-1', title: 'Verify rapid locale cycling', completed: 0, position: 1 },
  ],
};

function renderWithStorageLocale(element: React.ReactElement, lang: Language): string {
  mockStorage.setItem('habitcorp_lang', lang);
  const rawHtml = renderToStaticMarkup(
    React.createElement(I18nProvider, null, element)
  );
  return rawHtml.replace(/&amp;/g, '&');
}

const MODAL_FILES = [
  'src/client/components/PomodoroTimer.tsx',
  'src/client/components/TimeTimerDisk.tsx',
  'src/client/components/SpotlightModal.tsx',
  'src/client/components/BrainDumpDrawer.tsx',
  'src/client/components/CalendarModal.tsx',
];

// ============================================================================
// 2. ADVERSARIAL TEST SUITE
// ============================================================================

describe('Milestone 5 — Adversarial Locale Switching, AST Checks & Code Invariants', () => {
  beforeEach(() => {
    mockStorage.clear();
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // TASK 1A: RAPID LOCALE CYCLING
  // --------------------------------------------------------------------------
  describe('Task 1A: Rapid Locale Cycling Across Repeated Renders (Stale Cache Prevention)', () => {
    const rapidSequence: Language[] = [
      'en', 'ca', 'es', 'en', 'ca', 'es', 'en', 'es', 'ca', 'en', 'ca', 'es',
    ];

    it('rapidly cycles PomodoroTimer without retaining stale text from prior locales', () => {
      const baseProps = { isOpen: true, onToggleOpen: vi.fn() };

      rapidSequence.forEach((lang, step) => {
        const html = renderWithStorageLocale(React.createElement(PomodoroTimer, baseProps), lang);

        if (lang === 'en') {
          expect(html, `Step ${step} [en]`).toContain(translations.en.startPomodoro);
          expect(html, `Step ${step} [en]`).toContain(translations.en.pomodoroVisualDiskBtn);
          expect(html, `Step ${step} [en]`).toContain(translations.en.pomodoroCloseBar);
          // Must not contain Spanish/Catalan unique controls
          expect(html).not.toContain(translations.es.pomodoroCloseBar);
          expect(html).not.toContain(translations.ca.pomodoroCloseBar);
        } else if (lang === 'ca') {
          expect(html, `Step ${step} [ca]`).toContain(translations.ca.startPomodoro);
          expect(html, `Step ${step} [ca]`).toContain(translations.ca.pomodoroVisualDiskBtn);
          expect(html, `Step ${step} [ca]`).toContain(translations.ca.pomodoroCloseBar);
          // Must not contain English/Spanish controls
          expect(html).not.toContain(translations.en.pomodoroCloseBar);
          expect(html).not.toContain(translations.es.pomodoroCloseBar);
          expect(html).not.toContain(translations.es.pomodoroVisualDiskBtn);
        } else if (lang === 'es') {
          expect(html, `Step ${step} [es]`).toContain(translations.es.startPomodoro);
          expect(html, `Step ${step} [es]`).toContain(translations.es.pomodoroVisualDiskBtn);
          expect(html, `Step ${step} [es]`).toContain(translations.es.pomodoroCloseBar);
          // Must not contain English/Catalan controls
          expect(html).not.toContain(translations.en.pomodoroCloseBar);
          expect(html).not.toContain(translations.ca.pomodoroCloseBar);
          expect(html).not.toContain(translations.ca.pomodoroVisualDiskBtn);
        }
      });
    });

    it('rapidly cycles TimeTimerDisk without stale text or cross-contamination', () => {
      rapidSequence.forEach((lang, step) => {
        const html = renderWithStorageLocale(
          React.createElement(TimeTimerDisk, { initialMinutes: 25 }),
          lang
        );

        if (lang === 'en') {
          expect(html, `Step ${step} [en]`).toContain(translations.en.timeTimerStatusPaused);
          expect(html, `Step ${step} [en]`).toContain(translations.en.timeTimerStart);
          expect(html, `Step ${step} [en]`).toContain(translations.en.timeTimerResetTitle);
          expect(html).not.toContain(translations.ca.timeTimerResetTitle);
          expect(html).not.toContain(translations.es.timeTimerResetTitle);
        } else if (lang === 'ca') {
          expect(html, `Step ${step} [ca]`).toContain(translations.ca.timeTimerStatusPaused);
          expect(html, `Step ${step} [ca]`).toContain(translations.ca.timeTimerStart);
          expect(html, `Step ${step} [ca]`).toContain(translations.ca.timeTimerResetTitle);
          expect(html).not.toContain(translations.en.timeTimerResetTitle);
          expect(html).not.toContain(translations.es.timeTimerResetTitle);
        } else if (lang === 'es') {
          expect(html, `Step ${step} [es]`).toContain(translations.es.timeTimerStatusPaused);
          expect(html, `Step ${step} [es]`).toContain(translations.es.timeTimerStart);
          expect(html, `Step ${step} [es]`).toContain(translations.es.timeTimerResetTitle);
          expect(html).not.toContain(translations.en.timeTimerResetTitle);
          expect(html).not.toContain(translations.ca.timeTimerResetTitle);
        }
      });
    });

    it('rapidly cycles SpotlightModal (active task mode) immediately switching all prompts', () => {
      const baseProps = {
        isOpen: true,
        onClose: vi.fn(),
        onCompleteTask: vi.fn(),
        onToggleSubtask: vi.fn(),
        onOpenGoblinBrain: vi.fn(),
        tasks: [mockTask],
      };

      rapidSequence.forEach((lang, step) => {
        const html = renderWithStorageLocale(React.createElement(SpotlightModal, baseProps), lang);

        if (lang === 'en') {
          expect(html, `Step ${step} [en]`).toContain(translations.en.spotlightFocusTunnel);
          expect(html, `Step ${step} [en]`).toContain(translations.en.spotlightNextStep);
          expect(html, `Step ${step} [en]`).toContain(translations.en.spotlightMarkDone);
          expect(html, `Step ${step} [en]`).toContain(translations.en.spotlightSkipForNow);
          expect(html, `Step ${step} [en]`).toContain(translations.en.spotlightGoblinPrompt);
          expect(html).not.toContain(translations.es.spotlightFocusTunnel);
          expect(html).not.toContain(translations.ca.spotlightFocusTunnel);
        } else if (lang === 'ca') {
          expect(html, `Step ${step} [ca]`).toContain(translations.ca.spotlightFocusTunnel);
          expect(html, `Step ${step} [ca]`).toContain(translations.ca.spotlightNextStep);
          expect(html, `Step ${step} [ca]`).toContain(translations.ca.spotlightMarkDone);
          expect(html, `Step ${step} [ca]`).toContain(translations.ca.spotlightSkipForNow);
          expect(html, `Step ${step} [ca]`).toContain(translations.ca.spotlightGoblinPrompt);
          expect(html).not.toContain(translations.en.spotlightFocusTunnel);
          expect(html).not.toContain(translations.es.spotlightFocusTunnel);
        } else if (lang === 'es') {
          expect(html, `Step ${step} [es]`).toContain(translations.es.spotlightFocusTunnel);
          expect(html, `Step ${step} [es]`).toContain(translations.es.spotlightNextStep);
          expect(html, `Step ${step} [es]`).toContain(translations.es.spotlightMarkDone);
          expect(html, `Step ${step} [es]`).toContain(translations.es.spotlightSkipForNow);
          expect(html, `Step ${step} [es]`).toContain(translations.es.spotlightGoblinPrompt);
          expect(html).not.toContain(translations.en.spotlightFocusTunnel);
          expect(html).not.toContain(translations.ca.spotlightFocusTunnel);
        }
      });
    });

    it('rapidly cycles SpotlightModal empty celebration state across repeated renders', () => {
      const emptyProps = {
        isOpen: true,
        onClose: vi.fn(),
        onCompleteTask: vi.fn(),
        onToggleSubtask: vi.fn(),
        onOpenGoblinBrain: vi.fn(),
        tasks: [],
      };

      rapidSequence.forEach((lang, step) => {
        const html = renderWithStorageLocale(React.createElement(SpotlightModal, emptyProps), lang);

        if (lang === 'en') {
          expect(html, `Step ${step} [en]`).toContain(translations.en.spotlightEmptyTitle);
          expect(html, `Step ${step} [en]`).toContain(translations.en.spotlightBackToBoard);
          expect(html).not.toContain(translations.es.spotlightEmptyTitle);
          expect(html).not.toContain(translations.ca.spotlightEmptyTitle);
        } else if (lang === 'ca') {
          expect(html, `Step ${step} [ca]`).toContain(translations.ca.spotlightEmptyTitle);
          expect(html, `Step ${step} [ca]`).toContain(translations.ca.spotlightBackToBoard);
          expect(html).not.toContain(translations.en.spotlightEmptyTitle);
          expect(html).not.toContain(translations.es.spotlightEmptyTitle);
        } else if (lang === 'es') {
          expect(html, `Step ${step} [es]`).toContain(translations.es.spotlightEmptyTitle);
          expect(html, `Step ${step} [es]`).toContain(translations.es.spotlightBackToBoard);
          expect(html).not.toContain(translations.en.spotlightEmptyTitle);
          expect(html).not.toContain(translations.ca.spotlightEmptyTitle);
        }
      });
    });

    it('rapidly cycles BrainDumpDrawer and immediately updates headers and buttons', () => {
      const baseProps = {
        isOpen: true,
        onClose: vi.fn(),
        onSaveTasks: vi.fn(),
      };

      rapidSequence.forEach((lang, step) => {
        const html = renderWithStorageLocale(React.createElement(BrainDumpDrawer, baseProps), lang);

        if (lang === 'en') {
          expect(html, `Step ${step} [en]`).toContain(translations.en.brainDumpTitle);
          expect(html, `Step ${step} [en]`).toContain(translations.en.brainDumpSubtitle);
          expect(html, `Step ${step} [en]`).toContain(translations.en.brainDumpSubmitBtn);
          expect(html, `Step ${step} [en]`).toContain(translations.en.cancelBtn);
          expect(html).not.toContain(translations.es.brainDumpTitle);
          expect(html).not.toContain(translations.ca.brainDumpTitle);
        } else if (lang === 'ca') {
          expect(html, `Step ${step} [ca]`).toContain(translations.ca.brainDumpTitle);
          expect(html, `Step ${step} [ca]`).toContain(translations.ca.brainDumpSubtitle);
          expect(html, `Step ${step} [ca]`).toContain(translations.ca.brainDumpSubmitBtn);
          expect(html, `Step ${step} [ca]`).toContain(translations.ca.cancelBtn);
          expect(html).not.toContain(translations.en.brainDumpTitle);
          expect(html).not.toContain(translations.es.brainDumpTitle);
        } else if (lang === 'es') {
          expect(html, `Step ${step} [es]`).toContain(translations.es.brainDumpTitle);
          expect(html, `Step ${step} [es]`).toContain(translations.es.brainDumpSubtitle);
          expect(html, `Step ${step} [es]`).toContain(translations.es.brainDumpSubmitBtn);
          expect(html, `Step ${step} [es]`).toContain(translations.es.cancelBtn);
          expect(html).not.toContain(translations.en.brainDumpTitle);
          expect(html).not.toContain(translations.ca.brainDumpTitle);
        }
      });
    });

    it('rapidly cycles CalendarModal across tabs, headings, and guide descriptions', () => {
      const baseProps = {
        isOpen: true,
        onClose: vi.fn(),
        apiKey: 'test-api-key',
        onRefreshMeetings: vi.fn(),
      };

      rapidSequence.forEach((lang, step) => {
        const html = renderWithStorageLocale(React.createElement(CalendarModal, baseProps), lang);

        if (lang === 'en') {
          expect(html, `Step ${step} [en]`).toContain(translations.en.calModalTitle);
          expect(html, `Step ${step} [en]`).toContain(translations.en.calTabGhosts);
          expect(html, `Step ${step} [en]`).toContain(translations.en.calTabFeeds);
          expect(html, `Step ${step} [en]`).toContain(translations.en.calGhostsWhatIsTitle);
          expect(html).not.toContain(translations.es.calGhostsWhatIsTitle);
          expect(html).not.toContain(translations.ca.calGhostsWhatIsTitle);
        } else if (lang === 'ca') {
          expect(html, `Step ${step} [ca]`).toContain(translations.ca.calModalTitle);
          expect(html, `Step ${step} [ca]`).toContain(translations.ca.calTabGhosts);
          expect(html, `Step ${step} [ca]`).toContain(translations.ca.calTabFeeds);
          expect(html, `Step ${step} [ca]`).toContain(translations.ca.calGhostsWhatIsTitle);
          expect(html).not.toContain(translations.en.calGhostsWhatIsTitle);
          expect(html).not.toContain(translations.es.calGhostsWhatIsTitle);
        } else if (lang === 'es') {
          expect(html, `Step ${step} [es]`).toContain(translations.es.calModalTitle);
          expect(html, `Step ${step} [es]`).toContain(translations.es.calTabGhosts);
          expect(html, `Step ${step} [es]`).toContain(translations.es.calTabFeeds);
          expect(html, `Step ${step} [es]`).toContain(translations.es.calGhostsWhatIsTitle);
          expect(html).not.toContain(translations.en.calGhostsWhatIsTitle);
          expect(html).not.toContain(translations.ca.calGhostsWhatIsTitle);
        }
      });
    });
  });

  // --------------------------------------------------------------------------
  // TASK 1B: AST & SOURCE PATTERN CHECKS
  // --------------------------------------------------------------------------
  describe('Task 1B: AST and Source Pattern Checks on the 5 Modal Components', () => {
    // Specifically identified legacy hardcoded string literals
    const legacyHardcodedStrings = [
      'Brain Dump (Working Memory Offloader)',
      'Dump intrusive thoughts here',
      'Session completed!',
      'Single-Task Focus Tunnel',
      'What are Ghosts?',
      'How to get your iCal (.ics) link',
      'Analog Visual Disk (Time Timer)',
      'Your Focus Tunnel is Clear!',
      'Skip for now',
      'Mark Done',
      'Next Step:',
      'Dump & Clear Brain',
      'Ghosts (Family / Spouse)',
      'My Calendar Feeds',
      'Raw .ics Upload',
      'Add meeting',
      'Add New Ghost',
      'Add Ghost Contact',
      'Back to Board',
      'Close Pomodoro bar',
      'Exit Spotlight (Esc)',
      'Sound enabled',
      'Sound muted',
      'Reset timer',
    ];

    function getSourceAst(filePath: string): { sourceFile: ts.SourceFile; content: string } {
      const fullPath = path.resolve(process.cwd(), filePath);
      const content = fs.readFileSync(fullPath, 'utf8');
      const sourceFile = ts.createSourceFile(
        fullPath,
        content,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX
      );
      return { sourceFile, content };
    }

    function extractJsxTextNodes(sourceFile: ts.SourceFile): Array<{ text: string; line: number }> {
      const results: Array<{ text: string; line: number }> = [];

      function walk(node: ts.Node) {
        if (ts.isJsxText(node)) {
          const raw = node.text.trim();
          if (raw.length > 0) {
            const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
            results.push({ text: raw, line: line + 1 });
          }
        }
        ts.forEachChild(node, walk);
      }

      walk(sourceFile);
      return results;
    }

    function extractJsxAttributes(sourceFile: ts.SourceFile): Array<{ name: string; value: string; line: number }> {
      const results: Array<{ name: string; value: string; line: number }> = [];

      function walk(node: ts.Node) {
        if (ts.isJsxAttribute(node)) {
          const attrName = node.name.text;
          if (node.initializer && ts.isStringLiteral(node.initializer)) {
            const { line } = sourceFile.getLineAndCharacterOfPosition(node.initializer.getStart(sourceFile));
            results.push({ name: attrName, value: node.initializer.text, line: line + 1 });
          }
        }
        ts.forEachChild(node, walk);
      }

      walk(sourceFile);
      return results;
    }

    it('verifies that all 5 modal component source files exist', () => {
      MODAL_FILES.forEach((file) => {
        const fullPath = path.resolve(process.cwd(), file);
        expect(fs.existsSync(fullPath), `File must exist: ${file}`).toBe(true);
      });
    });

    it('asserts that legacy hardcoded string literals do NOT exist in any JSX text node across all 5 modals', () => {
      MODAL_FILES.forEach((file) => {
        const { sourceFile } = getSourceAst(file);
        const jsxTexts = extractJsxTextNodes(sourceFile);

        legacyHardcodedStrings.forEach((banned) => {
          jsxTexts.forEach(({ text, line }) => {
            expect(
              text.includes(banned),
              `Hardcoded string "${banned}" leaked in ${file}:${line} -> "${text}"`
            ).toBe(false);
          });
        });
      });
    });

    it('enforces that all remaining JSX text nodes contain only punctuation, compact units, or emojis', () => {
      const allowedLiteralTokens = new Set([
        '🍅', '25m', 'm', '⏳', '•', '👺', '🎉', '📥', '👻', '(', ')', '✓',
      ]);

      MODAL_FILES.forEach((file) => {
        const { sourceFile } = getSourceAst(file);
        const jsxTexts = extractJsxTextNodes(sourceFile);

        jsxTexts.forEach(({ text, line }) => {
          expect(
            allowedLiteralTokens.has(text),
            `Unpermitted raw JSX text node "${text}" in ${file}:${line}`
          ).toBe(true);
        });
      });
    });

    it('asserts that title, placeholder, and aria-label attributes do not leak hardcoded English prose', () => {
      // Whitelist of valid non-localized technical strings
      const allowedTechnicalLiterals = new Set([
        'https://meet.google.com/...',
        'BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\n...',
        'BEGIN:VCALENDAR&#10;VERSION:2.0&#10;BEGIN:VEVENT&#10;...',
      ]);

      MODAL_FILES.forEach((file) => {
        const { sourceFile } = getSourceAst(file);
        const attrs = extractJsxAttributes(sourceFile);

        attrs.forEach(({ name, value, line }) => {
          if (['title', 'placeholder', 'aria-label', 'alt'].includes(name)) {
            const isAllowed = allowedTechnicalLiterals.has(value.trim());
            expect(
              isAllowed,
              `Attribute ${name}="${value}" contains raw string literal in ${file}:${line}`
            ).toBe(true);
          }
        });
      });
    });
  });

  // --------------------------------------------------------------------------
  // TASK 1C: DICTIONARY COMPLETENESS, FORMATTING & UNIQUENESS INVARIANTS
  // --------------------------------------------------------------------------
  describe('Task 1C: Dictionary Completeness, Formatting, and Uniqueness Invariants', () => {
    const supportedLangs: SupportedLang[] = ['en', 'es', 'ca'];

    it('enforces exact 1:1 key parity between en, es, and ca dictionaries', () => {
      const enKeys = Object.keys(translations.en).sort();
      const esKeys = Object.keys(translations.es).sort();
      const caKeys = Object.keys(translations.ca).sort();

      expect(esKeys).toEqual(enKeys);
      expect(caKeys).toEqual(enKeys);
      expect(enKeys.length).toBeGreaterThan(150);
    });

    it('ensures no dictionary entries are empty strings across any language', () => {
      supportedLangs.forEach((lang) => {
        const dict = translations[lang];
        Object.entries(dict).forEach(([key, val]) => {
          if (typeof val === 'string') {
            expect(val.trim().length, `Empty string at [${lang}].${key}`).toBeGreaterThan(0);
          } else if (typeof val === 'function') {
            const resNoArg = (val as any)();
            const resZero = (val as any)(0);
            const resOne = (val as any)(1);
            const resMany = (val as any)(5);
            const resStr = (val as any)('Test');

            expect(resNoArg.trim().length, `Empty function() result at [${lang}].${key}`).toBeGreaterThan(0);
            expect(resZero.trim().length, `Empty function(0) result at [${lang}].${key}`).toBeGreaterThan(0);
            expect(resOne.trim().length, `Empty function(1) result at [${lang}].${key}`).toBeGreaterThan(0);
            expect(resMany.trim().length, `Empty function(5) result at [${lang}].${key}`).toBeGreaterThan(0);
            expect(resStr.trim().length, `Empty function('Test') result at [${lang}].${key}`).toBeGreaterThan(0);
          } else if (Array.isArray(val)) {
            expect(val.length, `Empty array at [${lang}].${key}`).toBeGreaterThan(0);
            val.forEach((item, idx) => {
              expect(item.label.trim().length, `Empty array item label at [${lang}].${key}[${idx}]`).toBeGreaterThan(0);
            });
          }
        });
      });
    });

    it('guarantees that no translation leaks raw unreplaced placeholders', () => {
      const placeholderRegex = /\{0\}|\{1\}|%s|undefined|null|NaN|\[object Object\]/;

      supportedLangs.forEach((lang) => {
        const dict = translations[lang];
        Object.entries(dict).forEach(([key, val]) => {
          if (typeof val === 'string') {
            expect(
              placeholderRegex.test(val),
              `Unreplaced placeholder in [${lang}].${key}: "${val}"`
            ).toBe(false);
          } else if (typeof val === 'function') {
            const samples = [
              (val as any)(0),
              (val as any)(1),
              (val as any)(5),
              (val as any)('SampleName'),
            ];
            samples.forEach((sample, i) => {
              expect(
                placeholderRegex.test(sample),
                `Unreplaced placeholder in function sample ${i} of [${lang}].${key}: "${sample}"`
              ).toBe(false);
            });
          }
        });
      });
    });

    it('enforces consistent punctuation conventions (Spanish inverted question/exclamation marks)', () => {
      // When a Spanish string ends in '?', it should start with '¿' (or lead with an emoji then '¿')
      const esDict = translations.es;
      Object.entries(esDict).forEach(([key, val]) => {
        if (typeof val === 'string' && val.trim().endsWith('?')) {
          const trimmed = val.trim();
          const hasInvertedQ = trimmed.includes('¿');
          expect(
            hasInvertedQ,
            `Spanish translation [es].${key} ends with '?' but is missing inverted question mark '¿': "${val}"`
          ).toBe(true);
        }
      });
    });

    it('verifies that descriptive paragraphs and modal titles are distinct across languages', () => {
      const distinctParagraphKeys: (keyof Translations)[] = [
        'calGhostsWhatIsDesc',
        'brainDumpHelpText',
        'spotlightEmptyDesc',
        'calGuideGoogleText',
        'calGuideAppleText',
        'calGuideOutlookText',
        'calGuideNoteText',
        'calRawImportDescription',
        'brainDumpTitle',
        'brainDumpSubtitle',
        'calModalTitle',
        'spotlightFocusTunnel',
        'spotlightEmptyTitle',
        'calGhostsWhatIsTitle',
      ];

      distinctParagraphKeys.forEach((key) => {
        const enVal = translations.en[key];
        const esVal = translations.es[key];
        const caVal = translations.ca[key];

        // English vs Spanish
        expect(
          enVal !== esVal,
          `Key "${String(key)}" must not be identical between English and Spanish ("${enVal}")`
        ).toBe(true);

        // English vs Catalan
        expect(
          enVal !== caVal,
          `Key "${String(key)}" must not be identical between English and Catalan ("${enVal}")`
        ).toBe(true);

        // Spanish vs Catalan
        expect(
          esVal !== caVal,
          `Key "${String(key)}" must not be identical between Spanish and Catalan ("${esVal}")`
        ).toBe(true);
      });
    });

    it('verifies that weekdaysShort array preserves 7 distinct items with values 0 to 6 across all languages', () => {
      supportedLangs.forEach((lang) => {
        const weekdays = translations[lang].weekdaysShort;
        expect(Array.isArray(weekdays)).toBe(true);
        expect(weekdays.length).toBe(7);

        const values = weekdays.map((w) => w.value);
        expect(values).toEqual([0, 1, 2, 3, 4, 5, 6]);

        const labels = weekdays.map((w) => w.label);
        const uniqueLabels = new Set(labels);
        expect(uniqueLabels.size).toBe(7);
      });
    });
  });
});
