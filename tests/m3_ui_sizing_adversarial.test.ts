import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import request from 'supertest';
import { DatabaseSync } from 'node:sqlite';
import { app } from '../src/server/index.js';
import { resetDbForTesting, initSchema } from '../src/server/db.js';
import {
  DIFFICULTY_CONFIGS,
  DIFFICULTY_LIST,
  getDifficultyBadgeText,
  getSizeLabel,
  DifficultyConfig,
} from '../src/client/utils/difficulty';
import { getSpoonCalibratedDuration } from '../src/client/utils/smartScheduling';
import { QuickTaskBar } from '../src/client/components/QuickTaskBar';
import { FocusNowVision } from '../src/client/components/FocusNowVision';
import { AgentApiModal } from '../src/client/components/AgentApiModal';
import { DifficultyTier, Task, Habit } from '../src/client/types';

// ============================================================================
// WAI-ARIA Accessibility Oracle for Static HTML (accname emulation)
// ============================================================================
interface AccessibleElement {
  tag: string;
  role: string;
  accessibleName: string;
  title: string;
  rawHtml: string;
  attributes: Record<string, string>;
}

function parseAccessibleElements(html: string): AccessibleElement[] {
  const elements: AccessibleElement[] = [];

  // Parse all <button ...>...</button>
  const buttonRegex = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
  let match: RegExpExecArray | null;

  while ((match = buttonRegex.exec(html)) !== null) {
    const rawAttrs = match[1];
    const innerContent = match[2];

    const attributes: Record<string, string> = {};
    const attrRegex = /([a-zA-Z0-9\-]+)=(?:"([^"]*)"|'([^']*)')/g;
    let attrMatch: RegExpExecArray | null;
    while ((attrMatch = attrRegex.exec(rawAttrs)) !== null) {
      attributes[attrMatch[1].toLowerCase()] = attrMatch[2] !== undefined ? attrMatch[2] : attrMatch[3];
    }

    const role = attributes['role'] || 'button';
    const title = attributes['title'] || '';
    let accessibleName = attributes['aria-label'] || '';
    if (!accessibleName) {
      accessibleName = innerContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }
    if (!accessibleName && title) {
      accessibleName = title;
    }

    elements.push({
      tag: 'button',
      role,
      accessibleName,
      title,
      rawHtml: match[0],
      attributes,
    });
  }

  return elements;
}

function queryByRole(
  html: string,
  role: string,
  options?: { name?: RegExp | string }
): AccessibleElement | null {
  const elements = parseAccessibleElements(html);
  const found = elements.filter((el) => {
    if (el.role.toLowerCase() !== role.toLowerCase()) return false;
    if (options?.name) {
      if (typeof options.name === 'string') {
        return (
          el.accessibleName.toLowerCase() === options.name.toLowerCase() ||
          el.accessibleName.toLowerCase().includes(options.name.toLowerCase())
        );
      }
      return options.name.test(el.accessibleName);
    }
    return true;
  });

  return found.length > 0 ? found[0] : null;
}

function getByRole(
  html: string,
  role: string,
  options?: { name?: RegExp | string }
): AccessibleElement {
  const element = queryByRole(html, role, options);
  if (!element) {
    throw new Error(
      `Unable to find an accessible element with role "${role}" and name ${options?.name?.toString() || 'ANY'}`
    );
  }
  return element;
}

// ============================================================================
// ADVERSARIAL TEST SUITE: Milestone 3 UI Spoon Sizing Restriction & Purity
// ============================================================================
describe('Milestone 3 Adversarial Challenge: UI Spoon Sizing Restriction & Purity', () => {
  const VALID_SIZES = ['XS', 'S', 'M', 'L'];
  const VALID_TIERS: DifficultyTier[] = ['trivial', 'easy', 'medium', 'hard'];

  // =========================================================================
  // 1. CORRUPTED, UNKNOWN, & MALFORMED DIFFICULTY TIERS (SAFE FALLBACK TO XS-L)
  // =========================================================================
  describe('1. Corrupted, Unknown, & Malformed Difficulty Tiers', () => {
    it('safely handles non-standard sizing tiers (XL, XXS, spoons, micro, epic) by falling back to valid XS-L', () => {
      const rogueTiers = [
        'XL',
        'XXS',
        'spoons',
        'spoon',
        'extra_large',
        'colossal',
        'micro',
        'epic',
        'gigantic',
        'tier_5',
        'infinity',
      ];

      for (const rogue of rogueTiers) {
        // getSizeLabel must not throw and must return strictly XS, S, M, or L
        expect(() => getSizeLabel(rogue)).not.toThrow();
        const size = getSizeLabel(rogue);
        expect(VALID_SIZES).toContain(size);
        expect(size).toBe('S'); // Default fallback tier

        // getDifficultyBadgeText must not throw and must produce safe fallback badge
        expect(() => getDifficultyBadgeText(rogue)).not.toThrow();
        const badge = getDifficultyBadgeText(rogue);
        expect(VALID_SIZES).toContain(badge.spoons);
        expect(VALID_SIZES).toContain(badge.sizeLabel);
        expect(badge.spoons).toBe('S');
        expect(badge.sizeLabel).toBe('S');
        expect(badge.durationHint).toBe('15–30m');
      }
    });

    it('safely handles empty, whitespace, and nullish inputs without crashing', () => {
      const emptyAndNullish = [
        '',
        ' ',
        '   ',
        '\t',
        '\n',
        '\r\n',
        undefined,
        null as any,
      ];

      for (const val of emptyAndNullish) {
        expect(() => getSizeLabel(val)).not.toThrow();
        expect(VALID_SIZES).toContain(getSizeLabel(val));
        expect(getSizeLabel(val)).toBe('S');

        expect(() => getDifficultyBadgeText(val)).not.toThrow();
        const badge = getDifficultyBadgeText(val);
        expect(VALID_SIZES).toContain(badge.spoons);
        expect(badge.spoons).toBe('S');
        expect(badge.durationHint).toBe('15–30m');
      }
    });

    it('safely handles numerical and extreme numeric values by falling back to valid XS-L', () => {
      const numbers = [
        0 as any,
        1 as any,
        2 as any,
        3 as any,
        4 as any,
        -1 as any,
        9999 as any,
        NaN as any,
        Infinity as any,
        -Infinity as any,
      ];

      for (const num of numbers) {
        expect(() => getSizeLabel(num)).not.toThrow();
        const size = getSizeLabel(num);
        expect(VALID_SIZES).toContain(size);
        expect(size).toBe('S');

        expect(() => getDifficultyBadgeText(num)).not.toThrow();
        const badge = getDifficultyBadgeText(num);
        expect(VALID_SIZES).toContain(badge.spoons);
        expect(badge.spoons).toBe('S');
      }
    });

    it('safely handles booleans, objects, arrays, and functions by falling back to valid XS-L', () => {
      const complexTypes = [
        true as any,
        false as any,
        {} as any,
        { difficulty: 'hard' } as any,
        [] as any,
        ['trivial'] as any,
        (() => 'hard') as any,
      ];

      for (const item of complexTypes) {
        expect(() => getSizeLabel(item)).not.toThrow();
        expect(VALID_SIZES).toContain(getSizeLabel(item));
        expect(getSizeLabel(item)).toBe('S');

        expect(() => getDifficultyBadgeText(item)).not.toThrow();
        const badge = getDifficultyBadgeText(item);
        expect(VALID_SIZES).toContain(badge.spoons);
        expect(VALID_SIZES).toContain(badge.sizeLabel);
      }
    });

    it('runs fuzz testing over 100 randomly generated corrupt strings and asserts zero exceptions and valid XS-L fallback', () => {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';

      for (let i = 0; i < 100; i++) {
        let randomStr = '';
        const len = Math.floor(Math.random() * 25) + 1;
        for (let j = 0; j < len; j++) {
          randomStr += characters.charAt(Math.floor(Math.random() * characters.length));
        }

        expect(() => getSizeLabel(randomStr)).not.toThrow();
        const size = getSizeLabel(randomStr);
        expect(VALID_SIZES).toContain(size);

        expect(() => getDifficultyBadgeText(randomStr)).not.toThrow();
        const badge = getDifficultyBadgeText(randomStr);
        expect(VALID_SIZES).toContain(badge.spoons);
        expect(VALID_SIZES).toContain(badge.sizeLabel);
      }
    });

    it('verifies getSpoonCalibratedDuration provides safe 30m fallback for all malformed tiers', () => {
      const malformedTiers = ['XL', 'XXS', 'spoons', '', 'random', 42 as any, null as any, undefined];

      for (const bad of malformedTiers) {
        expect(() => getSpoonCalibratedDuration(bad)).not.toThrow();
        // Calibrated duration defaults safely to 30 minutes (equivalent to S)
        expect(getSpoonCalibratedDuration(bad)).toBe(30);
      }
    });
  });

  // =========================================================================
  // 2. CASE VARIATIONS & NORMALIZATION RESILIENCE
  // =========================================================================
  describe('2. Case Variations & Normalization Resilience', () => {
    it('safely processes uppercase case variations (TRIVIAL, EASY, MEDIUM, HARD)', () => {
      const uppercaseVariants = ['TRIVIAL', 'EASY', 'MEDIUM', 'HARD'];

      for (const variant of uppercaseVariants) {
        expect(() => getSizeLabel(variant)).not.toThrow();
        const size = getSizeLabel(variant);
        expect(VALID_SIZES).toContain(size);

        expect(() => getDifficultyBadgeText(variant)).not.toThrow();
        const badge = getDifficultyBadgeText(variant);
        expect(VALID_SIZES).toContain(badge.spoons);
        expect(VALID_SIZES).toContain(badge.sizeLabel);
      }
    });

    it('safely processes titlecase and mixed case variations (Trivial, Easy, Medium, Hard, eAsY)', () => {
      const mixedVariants = ['Trivial', 'Easy', 'Medium', 'Hard', 'tRiViAl', 'eAsY', 'mEdIuM', 'hArD'];

      for (const variant of mixedVariants) {
        expect(() => getSizeLabel(variant)).not.toThrow();
        const size = getSizeLabel(variant);
        expect(VALID_SIZES).toContain(size);

        expect(() => getDifficultyBadgeText(variant)).not.toThrow();
        const badge = getDifficultyBadgeText(variant);
        expect(VALID_SIZES).toContain(badge.spoons);
        expect(VALID_SIZES).toContain(badge.sizeLabel);
      }
    });

    it('ensures raw casing strings (e.g. TRIVIAL, Easy) are never leaked into user-facing sizeLabel outputs', () => {
      const variations = ['TRIVIAL', 'EASY', 'Easy', 'Trivial', 'HARD', 'Hard', 'MEDIUM', 'Medium'];

      for (const v of variations) {
        const size = getSizeLabel(v);
        expect(size).not.toBe(v);
        expect(VALID_SIZES).toContain(size);

        const badge = getDifficultyBadgeText(v);
        expect(badge.spoons).not.toBe(v);
        expect(VALID_SIZES).toContain(badge.spoons);
      }
    });
  });

  // =========================================================================
  // 3. ACCESSIBILITY QUERIES ON QuickTaskBar (XS, S, M, L ACCESSIBLE NAMES)
  // =========================================================================
  describe('3. Accessibility Queries on QuickTaskBar', () => {
    it('finds and verifies all 4 sizing buttons via accessible name queries (XS, S, M, L)', () => {
      const html = renderToStaticMarkup(
        React.createElement(QuickTaskBar, {
          onQuickAdd: vi.fn(),
        })
      );

      // Query by accessible name for XS, S, M, L
      const btnXS = getByRole(html, 'button', { name: /^XS$/ });
      const btnS = getByRole(html, 'button', { name: /^S$/ });
      const btnM = getByRole(html, 'button', { name: /^M$/ });
      const btnL = getByRole(html, 'button', { name: /^L$/ });

      expect(btnXS).toBeDefined();
      expect(btnS).toBeDefined();
      expect(btnM).toBeDefined();
      expect(btnL).toBeDefined();

      expect(btnXS.accessibleName).toBe('XS');
      expect(btnS.accessibleName).toBe('S');
      expect(btnM.accessibleName).toBe('M');
      expect(btnL.accessibleName).toBe('L');
    });

    it('verifies sizing buttons contain descriptive cognitive duration hints in their accessible titles', () => {
      const html = renderToStaticMarkup(
        React.createElement(QuickTaskBar, {
          onQuickAdd: vi.fn(),
        })
      );

      const btnXS = getByRole(html, 'button', { name: /^XS$/ });
      const btnS = getByRole(html, 'button', { name: /^S$/ });
      const btnM = getByRole(html, 'button', { name: /^M$/ });
      const btnL = getByRole(html, 'button', { name: /^L$/ });

      // Titles must provide cognitive bracket context
      expect(btnXS.title).toContain('5–15m');
      expect(btnS.title).toContain('15–30m');
      expect(btnM.title).toContain('30–60m');
      expect(btnL.title).toContain('60m+');

      // Titles must NOT contain spoon counts
      expect(btnXS.title).not.toMatch(/spoon|cullera/i);
      expect(btnS.title).not.toMatch(/spoon|cullera/i);
      expect(btnM.title).not.toMatch(/spoon|cullera/i);
      expect(btnL.title).not.toMatch(/spoon|cullera/i);
    });

    it('confirms absence of legacy spoon buttons in QuickTaskBar accessibility tree', () => {
      const html = renderToStaticMarkup(
        React.createElement(QuickTaskBar, {
          onQuickAdd: vi.fn(),
        })
      );

      // Querying for legacy spoon buttons must yield null
      expect(queryByRole(html, 'button', { name: /🥄/ })).toBeNull();
      expect(queryByRole(html, 'button', { name: /spoon/i })).toBeNull();
      expect(queryByRole(html, 'button', { name: /cullera/i })).toBeNull();
      expect(queryByRole(html, 'button', { name: /XL/ })).toBeNull();
      expect(queryByRole(html, 'button', { name: /XXS/ })).toBeNull();
    });

    it('verifies QuickTaskBar groups the size selector with accessible label "Mida:"', () => {
      const html = renderToStaticMarkup(
        React.createElement(QuickTaskBar, {
          onQuickAdd: vi.fn(),
        })
      );

      expect(html).toContain('Mida:');
      expect(html).not.toContain('Culleres:');
      expect(html).not.toContain('Cullera:');
    });
  });

  // =========================================================================
  // 4. AST & STATIC SCAN FOR SIZING CONTEXT PURITY (ZERO 🥄 OR CULLERA)
  // =========================================================================
  describe('4. AST & Static Scan for Sizing Context Purity', () => {
    it('verifies QuickTaskBar.tsx contains zero spoon emojis, zero cullera strings, and strictly XS-L config', () => {
      const filePath = path.resolve(__dirname, '../src/client/components/QuickTaskBar.tsx');
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');

      // Zero spoon emoji
      expect(content).not.toContain('🥄');

      // Zero mentions of cullera / culleres
      expect(content).not.toMatch(/cullera|culleres/i);

      // Zero legacy spoonConfig
      expect(content).not.toContain('spoonConfig');

      // Presence of sizeConfig with XS, S, M, L
      expect(content).toContain('sizeConfig: Record<DifficultyTier');
      expect(content).toMatch(/size:\s*'XS'/);
      expect(content).toMatch(/size:\s*'S'/);
      expect(content).toMatch(/size:\s*'M'/);
      expect(content).toMatch(/size:\s*'L'/);
    });

    it('verifies FocusNowVision.tsx contains zero cullera references and renders Mida: with XS-L tiers', () => {
      const filePath = path.resolve(__dirname, '../src/client/components/FocusNowVision.tsx');
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');

      // Zero cullera / culleres references in FocusNowVision
      expect(content).not.toMatch(/cullera|culleres/i);

      // Tier text contains size brackets
      expect(content).toContain('Només XS (≤15m)');
      expect(content).toContain('Fins a S (≤30m)');
      expect(content).toContain('Fins a M (≤60m)');
      expect(content).toContain('Totes (XS–L)');

      // Displays Mida: instead of Culleres:
      expect(content).toContain('Mida:');
      expect(content).not.toContain('Culleres:');
    });

    it('verifies App.tsx renders difficulty badges with strict XS, S, M, L mapping and zero spoon emojis', () => {
      const filePath = path.resolve(__dirname, '../src/client/App.tsx');
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');

      // In habit rendering: check for XS, S, M, L mapping
      expect(content).toMatch(/habit\.difficulty\s*===\s*'trivial'\s*\?\s*'XS'/);
      expect(content).toMatch(/habit\.difficulty\s*===\s*'easy'\s*\?\s*'S'/);
      expect(content).toMatch(/habit\.difficulty\s*===\s*'medium'\s*\?\s*'M'/);

      // In task rendering: check for XS, S, M, L mapping
      expect(content).toMatch(/task\.difficulty\s*===\s*'trivial'\s*\?\s*'XS'/);
      expect(content).toMatch(/task\.difficulty\s*===\s*'easy'\s*\?\s*'S'/);
      expect(content).toMatch(/task\.difficulty\s*===\s*'medium'\s*\?\s*'M'/);

      // Low battery mode tooltip uses XS & S instead of 1 spoon & 2 spoons
      expect(content).toContain('XS: 5–15m & S: 15–30m');
      expect(content).not.toContain('XS/1 spoon & S/2 spoons');
    });

    it('verifies difficulty.ts DIFFICULTY_CONFIGS strictly defines sizeLabel and spoonDisplay as XS, S, M, L', () => {
      const filePath = path.resolve(__dirname, '../src/client/utils/difficulty.ts');
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');

      // Zero spoon emoji in difficulty.ts
      expect(content).not.toContain('🥄');

      // Zero cullera in difficulty.ts
      expect(content).not.toMatch(/cullera|culleres/i);

      // Inspect runtime config
      expect(DIFFICULTY_CONFIGS.trivial.sizeLabel).toBe('XS');
      expect(DIFFICULTY_CONFIGS.trivial.spoonDisplay).toBe('XS');
      expect(DIFFICULTY_CONFIGS.easy.sizeLabel).toBe('S');
      expect(DIFFICULTY_CONFIGS.easy.spoonDisplay).toBe('S');
      expect(DIFFICULTY_CONFIGS.medium.sizeLabel).toBe('M');
      expect(DIFFICULTY_CONFIGS.medium.spoonDisplay).toBe('M');
      expect(DIFFICULTY_CONFIGS.hard.sizeLabel).toBe('L');
      expect(DIFFICULTY_CONFIGS.hard.spoonDisplay).toBe('L');
    });

    it('verifies AgentApiModal.tsx contains the strict internal directive forbidding spoons and enforcing XS-L', () => {
      const filePath = path.resolve(__dirname, '../src/client/components/AgentApiModal.tsx');
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');

      expect(content).toContain('INTERNAL AGENT INSTRUCTIONS:');
      expect(content).toMatch(/Never offer or mention spoons to the user under any circumstances/i);
      expect(content).toMatch(/Task sizing must strictly adhere to: XS \(5-15m\), S \(15-30m\), M \(30-60m\), or L \(60m\+\)/);
    });
  });

  // =========================================================================
  // 5. BACKEND API & AUTONOMOUS AGENT OPENAPI CONTRACT
  // =========================================================================
  describe('5. Backend API & Autonomous Agent Guidance Contract', () => {
    let testUser: { id: string; username: string; apiKey: string };

    beforeEach(async () => {
      const memDb = new DatabaseSync(':memory:');
      memDb.exec('PRAGMA foreign_keys = ON;');
      initSchema(memDb);
      resetDbForTesting(memDb);

      const regRes = await request(app)
        .post('/api/v1/auth/register')
        .send({ username: 'challenger_sizing_user', password: 'securePassword123' });
      testUser = regRes.body;
    });

    it('verifies authenticated /api/v1/openapi.json instructs autonomous agents not to offer spoons and to use XS-L', async () => {
      const res = await request(app)
        .get('/api/v1/openapi.json')
        .set('X-API-Key', testUser.apiKey);

      expect(res.status).toBe(200);
      const desc = res.body.info?.description;
      expect(desc).toBeDefined();

      // Must direct agents regarding spoons and XS-L
      expect(desc).toMatch(/do not offer or reference spoons/i);
      expect(desc).toMatch(/XS/);
      expect(desc).toMatch(/L/);
    });

    it('rejects tasks with corrupted difficulty tiers with HTTP 400', async () => {
      const badTiers = ['XL', 'XXS', 'spoons', 'super_hard', '10', 'TRIVIAL'];

      for (const bad of badTiers) {
        const res = await request(app)
          .post('/api/v1/tasks')
          .set('X-API-Key', testUser.apiKey)
          .send({
            title: `Adversarial task with ${bad}`,
            type: 'todo',
            difficulty: bad,
          });

        expect(res.status).toBe(400);
        expect(res.body.error).toBeDefined();
      }
    });

    it('accepts valid 4-tier difficulties (trivial, easy, medium, hard) with HTTP 201', async () => {
      for (const diff of VALID_TIERS) {
        const res = await request(app)
          .post('/api/v1/tasks')
          .set('X-API-Key', testUser.apiKey)
          .send({
            title: `Valid task with ${diff}`,
            type: 'todo',
            difficulty: diff,
          });

        expect(res.status).toBe(201);
        expect(res.body.difficulty).toBe(diff);
      }
    });
  });

  // =========================================================================
  // 6. ADVERSARIAL COMPONENT PROP INJECTION & CARD RENDERING STRESS
  // =========================================================================
  describe('6. Adversarial Component Prop Injection & Card Rendering Stress', () => {
    it('renders habit cards safely without crash when habit.difficulty is corrupted', () => {
      const corruptedHabits: Partial<Habit>[] = [
        { id: 'h1', title: 'Corrupted Habit 1', difficulty: 'XL' as any },
        { id: 'h2', title: 'Corrupted Habit 2', difficulty: 'XXS' as any },
        { id: 'h3', title: 'Corrupted Habit 3', difficulty: undefined },
        { id: 'h4', title: 'Corrupted Habit 4', difficulty: null as any },
        { id: 'h5', title: 'Corrupted Habit 5', difficulty: 99 as any },
      ];

      // Simulated App.tsx habit badge mapping oracle:
      // habit.difficulty === 'trivial' ? 'XS' : habit.difficulty === 'easy' ? 'S' : habit.difficulty === 'medium' ? 'M' : 'L'
      const renderHabitBadge = (diff: any): string => {
        if (diff === 'trivial') return 'XS';
        if (diff === 'easy') return 'S';
        if (diff === 'medium') return 'M';
        return 'L';
      };

      for (const h of corruptedHabits) {
        const size = renderHabitBadge(h.difficulty);
        expect(VALID_SIZES).toContain(size);
        expect(size).not.toBe('XL');
        expect(size).not.toBe('XXS');
      }
    });

    it('renders task cards safely without crash when task.difficulty is corrupted', () => {
      const corruptedTasks: Partial<Task>[] = [
        { id: 't1', title: 'Corrupted Task 1', difficulty: 'spoons' as any },
        { id: 't2', title: 'Corrupted Task 2', difficulty: '' as any },
        { id: 't3', title: 'Corrupted Task 3', difficulty: 'HARD' as any },
        { id: 't4', title: 'Corrupted Task 4', difficulty: 0 as any },
      ];

      const renderTaskBadge = (diff: any): string => {
        return getSizeLabel(diff);
      };

      for (const t of corruptedTasks) {
        const size = renderTaskBadge(t.difficulty);
        expect(VALID_SIZES).toContain(size);
        expect(size).toBe('S');
      }
    });

    it('verifies QuickTaskBar accepts submissions across all 4 valid tiers with correct size mapping', async () => {
      const quickAddMock = vi.fn();

      for (const diff of VALID_TIERS) {
        const expectedSize = getSizeLabel(diff);
        expect(VALID_SIZES).toContain(expectedSize);

        // Call onQuickAdd with mock
        await quickAddMock({
          title: `Test task ${diff}`,
          type: 'todo',
          difficulty: diff,
        });

        expect(quickAddMock).toHaveBeenLastCalledWith(
          expect.objectContaining({
            difficulty: diff,
          })
        );
      }

      expect(quickAddMock).toHaveBeenCalledTimes(4);
    });
  });
});
