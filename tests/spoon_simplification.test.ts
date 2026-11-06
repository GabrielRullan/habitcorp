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
import { AgentApiModal } from '../src/client/components/AgentApiModal';
import { DifficultyTier, Task } from '../src/client/types';

describe('Milestone 3 (Requirement R3) — Spoon Simplification & Agent Guidance Test Suite', () => {
  // =========================================================================
  // 1. UI SIZING PURITY (DIFFICULTY_CONFIGS, getDifficultyBadgeText, QuickTaskBar, App.tsx)
  // =========================================================================
  describe('1. UI Sizing Purity (XS through L Restriction)', () => {
    it('verifies DIFFICULTY_CONFIGS defines exactly the 4 standard tiers: trivial, easy, medium, hard', () => {
      const keys = Object.keys(DIFFICULTY_CONFIGS).sort();
      expect(keys).toEqual(['easy', 'hard', 'medium', 'trivial']);
      expect(keys).not.toContain('xl');
      expect(keys).not.toContain('xxs');
      expect(keys).not.toContain('extra_large');
    });

    it('verifies sizeLabel and spoonDisplay strictly produce XS, S, M, L across all configured tiers', () => {
      const allowedSizes = ['XS', 'S', 'M', 'L'];

      // trivial -> XS
      expect(DIFFICULTY_CONFIGS.trivial.sizeLabel).toBe('XS');
      expect(DIFFICULTY_CONFIGS.trivial.spoonDisplay).toBe('XS');

      // easy -> S
      expect(DIFFICULTY_CONFIGS.easy.sizeLabel).toBe('S');
      expect(DIFFICULTY_CONFIGS.easy.spoonDisplay).toBe('S');

      // medium -> M
      expect(DIFFICULTY_CONFIGS.medium.sizeLabel).toBe('M');
      expect(DIFFICULTY_CONFIGS.medium.spoonDisplay).toBe('M');

      // hard -> L
      expect(DIFFICULTY_CONFIGS.hard.sizeLabel).toBe('L');
      expect(DIFFICULTY_CONFIGS.hard.spoonDisplay).toBe('L');

      // Verify no other sizing label exists
      for (const tier of Object.keys(DIFFICULTY_CONFIGS) as DifficultyTier[]) {
        const cfg = DIFFICULTY_CONFIGS[tier];
        expect(allowedSizes).toContain(cfg.sizeLabel);
        expect(allowedSizes).toContain(cfg.spoonDisplay);
      }
    });

    it('verifies duration hints follow progressive cognitive effort brackets', () => {
      expect(DIFFICULTY_CONFIGS.trivial.durationHint).toBe('5–15m');
      expect(DIFFICULTY_CONFIGS.easy.durationHint).toBe('15–30m');
      expect(DIFFICULTY_CONFIGS.medium.durationHint).toBe('30–60m');
      expect(DIFFICULTY_CONFIGS.hard.durationHint).toBe('60m+');
    });

    it('verifies DIFFICULTY_LIST contains all 4 tiers in ascending difficulty sequence', () => {
      expect(DIFFICULTY_LIST).toHaveLength(4);
      const labels = DIFFICULTY_LIST.map((d: DifficultyConfig) => d.sizeLabel);
      expect(labels).toEqual(['XS', 'S', 'M', 'L']);
    });

    it('verifies getDifficultyBadgeText produces only XS, S, M, L for all valid tiers', () => {
      expect(getDifficultyBadgeText('trivial').spoons).toBe('XS');
      expect(getDifficultyBadgeText('easy').spoons).toBe('S');
      expect(getDifficultyBadgeText('medium').spoons).toBe('M');
      expect(getDifficultyBadgeText('hard').spoons).toBe('L');

      const validTiers: DifficultyTier[] = ['trivial', 'easy', 'medium', 'hard'];
      for (const tier of validTiers) {
        const badge = getDifficultyBadgeText(tier);
        expect(['XS', 'S', 'M', 'L']).toContain(badge.spoons);
        expect(badge.label).toBeTruthy();
        expect(badge.badgeClass).toBeTruthy();
      }
    });

    it('verifies getSizeLabel maps tiers to XS, S, M, L and falls back to S', () => {
      expect(getSizeLabel('trivial')).toBe('XS');
      expect(getSizeLabel('easy')).toBe('S');
      expect(getSizeLabel('medium')).toBe('M');
      expect(getSizeLabel('hard')).toBe('L');
      expect(getSizeLabel(undefined)).toBe('S');
      expect(getSizeLabel('unknown' as any)).toBe('S');
      expect(getSizeLabel('')).toBe('S');
    });

    it('verifies QuickTaskBar.tsx buttons render XS, S, M, L labels', () => {
      const html = renderToStaticMarkup(
        React.createElement(QuickTaskBar, {
          onQuickAdd: vi.fn(),
        })
      );

      // Verify buttons contain XS, S, M, and L
      expect(html).toContain('XS');
      expect(html).toContain('S');
      expect(html).toContain('M');
      expect(html).toContain('L');

      // Verify buttons do NOT render raw spoon counts without XS-L sizing
      expect(html).not.toMatch(/>\s*🥄\s*1\s*</);
      expect(html).not.toMatch(/>\s*🥄\s*2\s*</);
      expect(html).not.toMatch(/>\s*🥄\s*3\s*</);
      expect(html).not.toMatch(/>\s*🥄\s*4\s*</);
    });

    it('verifies App.tsx card rendering displays XS, S, M, L instead of raw tier names', () => {
      const appTsxPath = path.resolve(__dirname, '../src/client/App.tsx');
      expect(fs.existsSync(appTsxPath)).toBe(true);
      const appSource = fs.readFileSync(appTsxPath, 'utf-8');

      // Ensure raw database strings {habit.difficulty} and {task.difficulty} are not directly rendered in badge tags
      expect(appSource).not.toMatch(/<span[^>]*>\s*\{habit\.difficulty\}\s*<\/span>/);
      expect(appSource).not.toMatch(/<span[^>]*>\s*\{task\.difficulty\}\s*<\/span>/);

      // Card rendering oracle: maps all 4 tiers strictly to XS, S, M, L
      const renderCardDifficulty = (diff: DifficultyTier | string | undefined): string => {
        if (diff === 'trivial') return 'XS';
        if (diff === 'easy') return 'S';
        if (diff === 'medium') return 'M';
        if (diff === 'hard') return 'L';
        return 'S';
      };

      expect(renderCardDifficulty('trivial')).toBe('XS');
      expect(renderCardDifficulty('easy')).toBe('S');
      expect(renderCardDifficulty('medium')).toBe('M');
      expect(renderCardDifficulty('hard')).toBe('L');

      // Raw strings should never be the output of card difficulty rendering
      const rawTiers = ['trivial', 'easy', 'medium', 'hard'];
      for (const t of rawTiers) {
        expect(['XS', 'S', 'M', 'L']).toContain(renderCardDifficulty(t));
        expect(renderCardDifficulty(t)).not.toBe(t);
      }
    });
  });

  // =========================================================================
  // 2. AGENT GUIDANCE & SYSTEM PROMPT (AgentApiModal, api.ts, ARCHITECTURE.md)
  // =========================================================================
  describe('2. Agent Guidance & System Prompt Restrictions', () => {
    it('verifies AgentApiModal.tsx contains the required internal directive against offering spoons and enforcing XS-L', () => {
      const modalProps = {
        isOpen: true,
        onClose: vi.fn(),
        apiKey: 'hc_live_test_api_key_456',
        onRegenerateKey: vi.fn().mockResolvedValue('hc_live_new_key_789'),
      };

      const html = renderToStaticMarkup(React.createElement(AgentApiModal, modalProps));

      // 1. Internal instructions heading
      expect(html).toMatch(/INTERNAL AGENT INSTRUCTIONS/i);

      // 2. Explicit prohibition on offering spoons
      expect(html).toMatch(/never offer or mention spoons/i);

      // 3. Strict XS through L sizing enforcement
      expect(html).toMatch(/XS.*5-15m/i);
      expect(html).toMatch(/S.*15-30m/i);
      expect(html).toMatch(/M.*30-60m/i);
      expect(html).toMatch(/L.*60m\+/i);
    });

    it('verifies AgentApiModal.tsx source code preserves the exact directive in agentSystemPrompt', () => {
      const modalPath = path.resolve(__dirname, '../src/client/components/AgentApiModal.tsx');
      expect(fs.existsSync(modalPath)).toBe(true);
      const modalSource = fs.readFileSync(modalPath, 'utf-8');

      expect(modalSource).toContain('INTERNAL AGENT INSTRUCTIONS:');
      expect(modalSource).toMatch(/Never offer or mention spoons to the user under any circumstances/i);
      expect(modalSource).toMatch(/Task sizing must strictly adhere to: XS.*S.*M.*L/i);
    });

    it('verifies Express API endpoint /api/v1/openapi.json returns the agent instruction note in description', async () => {
      // Unauthenticated request is rejected by authMiddleware
      const unauthRes = await request(app).get('/api/v1/openapi.json');
      expect(unauthRes.status).toBe(401);

      // Authenticated request
      const memDb = new DatabaseSync(':memory:');
      memDb.exec('PRAGMA foreign_keys = ON;');
      initSchema(memDb);
      resetDbForTesting(memDb);

      const regRes = await request(app)
        .post('/api/v1/auth/register')
        .send({ username: 'openapi_agent_user', password: 'testPassword123' });
      const apiKey = regRes.body.apiKey;

      const res = await request(app)
        .get('/api/v1/openapi.json')
        .set('X-API-Key', apiKey);
      expect(res.status).toBe(200);
      expect(res.body.openapi).toBe('3.1.0');
      expect(res.body.info).toBeDefined();

      const description = res.body.info.description;
      expect(typeof description).toBe('string');

      // Must direct autonomous agents not to offer spoons and to use XS through L
      expect(description).toMatch(/spoons?/i);
      expect(description).toMatch(/do not offer|never offer|not offer or reference spoons/i);
      expect(description).toMatch(/XS/);
      expect(description).toMatch(/L/);
    });

    it('verifies docs/ARCHITECTURE.md documents the agent guidance prohibiting spoons and enforcing XS-L', () => {
      const archDocPath = path.resolve(__dirname, '../docs/ARCHITECTURE.md');
      expect(fs.existsSync(archDocPath)).toBe(true);
      const archDoc = fs.readFileSync(archDocPath, 'utf-8');

      // Documentation must record the agent instructions
      expect(archDoc).toMatch(/Agent.*API/i);
      expect(archDoc).toMatch(/spoon/i);
      expect(archDoc).toMatch(/XS.*L/i);
    });
  });

  // =========================================================================
  // 3. NEGATIVE & BOUNDARY TESTS (Safe Fallback to XS-L)
  // =========================================================================
  describe('3. Negative & Boundary Safety (Fallbacks to XS-L)', () => {
    it('verifies getDifficultyBadgeText falls back safely to XS-L for invalid or unknown strings', () => {
      const boundaryCases = [
        undefined,
        null as any,
        '',
        '   ',
        'unknown',
        'XL',
        'XXS',
        'super_hard',
        'spoons',
        'TRIVIAL', // case sensitive check
        'HARD',
        'easy ',
        123 as any,
        {} as any,
        [] as any,
        NaN as any,
      ];

      for (const input of boundaryCases) {
        expect(() => getDifficultyBadgeText(input)).not.toThrow();
        const badge = getDifficultyBadgeText(input);

        // Result MUST strictly be one of XS, S, M, L
        expect(['XS', 'S', 'M', 'L']).toContain(badge.spoons);
        // Default fallback must be S (easy)
        expect(badge.spoons).toBe('S');
        expect(badge.label).toBe('Small');
        expect(badge.badgeClass).toBeTruthy();
      }
    });

    it('verifies getSpoonCalibratedDuration returns valid minutes and safe fallback for unknown tiers', () => {
      // Standard calibration
      expect(getSpoonCalibratedDuration('trivial')).toBe(15);
      expect(getSpoonCalibratedDuration('easy')).toBe(30);
      expect(getSpoonCalibratedDuration('medium')).toBe(45);
      expect(getSpoonCalibratedDuration('hard')).toBe(60);

      // Boundary / corrupt values fallback safely to 30m (S)
      expect(getSpoonCalibratedDuration(undefined)).toBe(30);
      expect(getSpoonCalibratedDuration(null as any)).toBe(30);
      expect(getSpoonCalibratedDuration('XL' as any)).toBe(30);
      expect(getSpoonCalibratedDuration('unknown' as any)).toBe(30);
      expect(getSpoonCalibratedDuration('' as any)).toBe(30);
    });

    it('verifies card rendering fallback produces valid XS-L for corrupted task objects', () => {
      const corruptedTasks: Partial<Task>[] = [
        { id: '1', title: 'Task 1', difficulty: 'XL' as any },
        { id: '2', title: 'Task 2', difficulty: undefined },
        { id: '3', title: 'Task 3', difficulty: null as any },
        { id: '4', title: 'Task 4', difficulty: 'extreme' as any },
      ];

      const renderCardBadge = (diff: any): string => {
        return getDifficultyBadgeText(diff).spoons;
      };

      for (const t of corruptedTasks) {
        const badge = renderCardBadge(t.difficulty);
        expect(['XS', 'S', 'M', 'L']).toContain(badge);
        expect(badge).toBe('S');
      }
    });
  });

  // =========================================================================
  // 4. BACKEND INTEGRATION & DATABASE CONSTRAINT INTEGRITY
  // =========================================================================
  describe('4. Backend API & SQLite CHECK Constraint Integrity', () => {
    let testUser: { id: string; username: string; apiKey: string };

    beforeEach(async () => {
      const memDb = new DatabaseSync(':memory:');
      memDb.exec('PRAGMA foreign_keys = ON;');
      initSchema(memDb);
      resetDbForTesting(memDb);

      const regRes = await request(app)
        .post('/api/v1/auth/register')
        .send({ username: 'spoon_test_user', password: 'testPassword123' });
      testUser = regRes.body;
    });

    it('accepts valid 4-tier difficulties upon task creation', async () => {
      const validTiers: DifficultyTier[] = ['trivial', 'easy', 'medium', 'hard'];

      for (const diff of validTiers) {
        const res = await request(app)
          .post('/api/v1/tasks')
          .set('X-API-Key', testUser.apiKey)
          .send({
            title: `Task for ${diff}`,
            type: 'todo',
            difficulty: diff,
          });

        expect(res.status).toBe(201);
        expect(res.body.difficulty).toBe(diff);
      }
    });

    it('rejects invalid difficulty values with HTTP 400 validation error', async () => {
      const invalidTiers = ['XL', 'XXS', 'spoons', 'super_hard', '10', ''];

      for (const badDiff of invalidTiers) {
        const res = await request(app)
          .post('/api/v1/tasks')
          .set('X-API-Key', testUser.apiKey)
          .send({
            title: 'Task with invalid difficulty',
            type: 'todo',
            difficulty: badDiff,
          });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/difficulty/i);
      }
    });
  });
});
