import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import request from 'supertest';
import { DatabaseSync } from 'node:sqlite';
import { app } from '../src/server/index.js';
import { resetDbForTesting, initSchema, getDb } from '../src/server/db.js';
import { AgentApiModal } from '../src/client/components/AgentApiModal';

/**
 * ============================================================================
 * Milestone 3 (Requirement R3) — Adversarial Stress Test Suite:
 * Agent Guidance, OpenAPI 3.1 Schema & API Difficulty Payload Fuzzing
 * ============================================================================
 *
 * Test Vectors Covered:
 * 1. Adversarial Fuzzing of POST /tasks difficulty payloads (XL, XXS, huge, SQLi,
 *    prototype injection, extreme strings, corrupt types) -> HTTP 400 clean rejection
 *    with zero 500 Internal Server Error and zero SQL/schema leakage.
 * 2. OpenAPI 3.1 Specification Verification: Authentication enforcement, schema
 *    structure validation, and verbatim autonomous agent guidance.
 * 3. AgentApiModal Rendered Markup: Exact copyable system prompt containing verbatim
 *    internal agent instructions prohibiting spoons and enforcing XS-L sizing.
 * 4. docs/ARCHITECTURE.md Invariant Verification: Structural accuracy of route
 *    matrix, component mapping, and autonomous agent sizing documentation.
 */

describe('Milestone 3 — Agent Guidance & API Invariants Adversarial Challenge', () => {
  let testUser: { id: string; username: string; apiKey: string };

  beforeEach(async () => {
    const memDb = new DatabaseSync(':memory:');
    memDb.exec('PRAGMA foreign_keys = ON;');
    initSchema(memDb);
    resetDbForTesting(memDb);

    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'adversarial_agent_user', password: 'testPassword123' });
    testUser = regRes.body;
  });

  // =========================================================================
  // 1. ADVERSARIAL FUZZING OF POST /tasks DIFFICULTY PAYLOADS
  // =========================================================================
  describe('1. Adversarial Fuzzing: POST /tasks difficulty validation', () => {
    const invalidFuzzDifficulties = [
      // Explicitly named invalid values in prompt
      'XL',
      'XXS',
      'huge',
      // UI size label confusion (clients should use DB tiers trivial, easy, medium, hard)
      'XS',
      'S',
      'M',
      'L',
      'xs',
      's',
      'm',
      'l',
      'xl',
      'xxs',
      // Legacy spoon references
      'spoon',
      'spoons',
      '1 spoon',
      '2 spoons',
      'cullera',
      'culleres',
      '1',
      '2',
      '3',
      '4',
      // Out-of-bounds difficulty labels
      'extra_large',
      'super_hard',
      'extreme',
      'impossible',
      'minimal',
      'moderate',
      'none',
      // Whitespace and case anomalies
      '',
      '   ',
      'TRIVIAL',
      'EASY',
      'MEDIUM',
      'HARD',
      'trivial ',
      ' easy',
      'medium\n',
      'hard\t',
      // Numeric and boolean edge cases
      0 as any,
      -1 as any,
      999 as any,
      true as any,
      false as any,
      // Structured / object / array payloads
      {} as any,
      { tier: 'easy' } as any,
      ['easy'] as any,
      ['trivial', 'hard'] as any,
      // SQL Injection and escape injection payloads
      "' OR '1'='1",
      "'; DROP TABLE tasks; --",
      "trivial'; DROP TABLE tasks; --",
      "' UNION SELECT * FROM users --",
      "1; SELECT 1;",
      // Extreme length string (buffer overflow simulation)
      'hard'.padEnd(10000, 'X'),
      // Dangerous control characters and HTML tags
      '<script>alert(1)</script>',
      '\x00',
      '${7*7}',
      '{{7*7}}',
    ];

    for (const badVal of invalidFuzzDifficulties) {
      const displayVal =
        typeof badVal === 'string' && badVal.length > 30
          ? `${badVal.slice(0, 30)}... (len ${badVal.length})`
          : JSON.stringify(badVal);

      it(`cleanly rejects invalid difficulty payload ${displayVal} with HTTP 400 without 500 error or SQL leak`, async () => {
        const payload = {
          title: `Task test for ${displayVal}`,
          type: 'todo',
          difficulty: badVal,
        };

        const res = await request(app)
          .post('/api/v1/tasks')
          .set('X-API-Key', testUser.apiKey)
          .send(payload);

        // 1. Must be rejected cleanly with HTTP 400 Bad Request
        expect(res.status).toBe(400);

        // 2. Must NEVER trigger 500 Internal Server Error
        expect(res.status).not.toBe(500);

        // 3. Response body must contain clean error message
        expect(res.body).toBeDefined();
        expect(res.body.error).toBeDefined();
        expect(typeof res.body.error).toBe('string');
        expect(res.body.error.toLowerCase()).toMatch(/difficulty/);

        // 4. Must NOT leak internal SQLite errors, schema details, or stack traces
        const errorText = JSON.stringify(res.body);
        expect(errorText).not.toMatch(/sqlite/i);
        expect(errorText).not.toMatch(/check constraint/i);
        expect(errorText).not.toMatch(/syntax error/i);
        expect(errorText).not.toMatch(/prepare/i);
        expect(errorText).not.toMatch(/SQLITE_ERROR/i);
        expect(errorText).not.toMatch(/database disk image/i);
        expect(errorText).not.toMatch(/stack/i);

        // 5. Database state integrity: Verify no corrupted task was inserted
        const db = getDb();
        const row = db
          .prepare('SELECT * FROM tasks WHERE title = ? AND user_id = ?')
          .get(payload.title, testUser.id);
        expect(row).toBeUndefined();
      });
    }

    it('verifies omitted difficulty defaults safely to easy (201 Created)', async () => {
      const res = await request(app)
        .post('/api/v1/tasks')
        .set('X-API-Key', testUser.apiKey)
        .send({
          title: 'Task without explicit difficulty',
          type: 'todo',
        });

      expect(res.status).toBe(201);
      expect(res.body.difficulty).toBe('easy');
      expect(res.body.difficulty_weight).toBe(2);
    });

    it('verifies explicit null difficulty defaults safely to easy (201 Created)', async () => {
      const res = await request(app)
        .post('/api/v1/tasks')
        .set('X-API-Key', testUser.apiKey)
        .send({
          title: 'Task with null difficulty',
          type: 'todo',
          difficulty: null,
        });

      expect(res.status).toBe(201);
      expect(res.body.difficulty).toBe('easy');
      expect(res.body.difficulty_weight).toBe(2);
    });

    it('verifies all 4 valid tiers are strictly accepted with 201 Created', async () => {
      const validTiers = [
        { tier: 'trivial', expectedWeight: 1 },
        { tier: 'easy', expectedWeight: 2 },
        { tier: 'medium', expectedWeight: 3 },
        { tier: 'hard', expectedWeight: 4 },
      ];

      for (const { tier, expectedWeight } of validTiers) {
        const res = await request(app)
          .post('/api/v1/tasks')
          .set('X-API-Key', testUser.apiKey)
          .send({
            title: `Valid ${tier} task`,
            type: 'todo',
            difficulty: tier,
          });

        expect(res.status).toBe(201);
        expect(res.body.difficulty).toBe(tier);
        expect(res.body.difficulty_weight).toBe(expectedWeight);
      }
    });

    it('verifies PATCH /tasks/:id does not crash or leak SQL errors on fuzzed difficulty', async () => {
      // First create a valid task
      const createRes = await request(app)
        .post('/api/v1/tasks')
        .set('X-API-Key', testUser.apiKey)
        .send({ title: 'Task to be patched', type: 'todo', difficulty: 'easy' });
      expect(createRes.status).toBe(201);
      const taskId = createRes.body.id;

      // Now attempt to PATCH with invalid difficulty payloads
      const invalidPatchValues = ['XL', 'XXS', 'huge', 'super_hard', "'; DROP TABLE tasks; --"];
      for (const badVal of invalidPatchValues) {
        const patchRes = await request(app)
          .patch(`/api/v1/tasks/${taskId}`)
          .set('X-API-Key', testUser.apiKey)
          .send({ difficulty: badVal });

        // Must not be 500
        expect(patchRes.status).not.toBe(500);

        // Verify task in DB still retains valid difficulty and was not corrupted
        const checkRes = await request(app)
          .get(`/api/v1/tasks/${taskId}`)
          .set('X-API-Key', testUser.apiKey);
        expect(checkRes.status).toBe(200);
        expect(checkRes.body.difficulty).toBe('easy');
      }
    });
  });

  // =========================================================================
  // 2. OPENAPI 3.1 SPECIFICATION & VERBATIM AGENT GUIDANCE VERIFICATION
  // =========================================================================
  describe('2. OpenAPI 3.1 Specification & Verbatim Agent Guidance', () => {
    it('enforces authentication on GET /api/v1/openapi.json', async () => {
      // No auth header
      const res = await request(app).get('/api/v1/openapi.json');
      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
    });

    it('allows access via valid X-API-Key header and returns valid OpenAPI 3.1 document', async () => {
      const res = await request(app)
        .get('/api/v1/openapi.json')
        .set('X-API-Key', testUser.apiKey);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/application\/json/);

      const spec = res.body;

      // Conformance to OpenAPI 3.1
      expect(spec.openapi).toBe('3.1.0');
      expect(spec.info).toBeDefined();
      expect(spec.info.title).toBe('Cadence Task & Habit Manager API');
      expect(spec.info.version).toBe('1.0.0');

      // Security schemes defined
      expect(spec.components?.securitySchemes?.ApiKeyAuth).toBeDefined();
      expect(spec.components?.securitySchemes?.ApiKeyAuth.type).toBe('apiKey');
      expect(spec.components?.securitySchemes?.ApiKeyAuth.name).toBe('X-API-Key');
      expect(spec.components?.securitySchemes?.BearerAuth).toBeDefined();
    });

    it('allows access via valid Authorization Bearer header', async () => {
      const res = await request(app)
        .get('/api/v1/openapi.json')
        .set('Authorization', `Bearer ${testUser.apiKey}`);

      expect(res.status).toBe(200);
      expect(res.body.openapi).toBe('3.1.0');
    });

    it('contains verbatim autonomous agent guidance in info.description', async () => {
      const res = await request(app)
        .get('/api/v1/openapi.json')
        .set('X-API-Key', testUser.apiKey);

      expect(res.status).toBe(200);
      const description = res.body.info.description;
      expect(typeof description).toBe('string');

      // Verbatim requirements:
      // 1. "Non-gamified productivity platform combining Habits, Dailies, and Tasks with 4-tier sizing (XS through L)."
      expect(description).toContain('Non-gamified productivity platform combining Habits, Dailies, and Tasks with 4-tier sizing (XS through L).');

      // 2. "Note for autonomous agents: Do not offer or reference spoons to the user; use sizing XS, S, M, L only."
      expect(description).toContain('Note for autonomous agents: Do not offer or reference spoons to the user; use sizing XS, S, M, L only.');

      // Exact phrase checks
      expect(description).toContain('Do not offer or reference spoons to the user');
      expect(description).toContain('use sizing XS, S, M, L only');
    });

    it('verifies OpenAPI path schemas strictly restrict difficulty to the 4 tiers', async () => {
      const res = await request(app)
        .get('/api/v1/openapi.json')
        .set('X-API-Key', testUser.apiKey);

      const spec = res.body;
      const expectedTiers = ['trivial', 'easy', 'medium', 'hard'];

      // POST /tasks request body difficulty schema
      const postTaskDifficultySchema =
        spec.paths?.['/tasks']?.post?.requestBody?.content?.['application/json']?.schema?.properties?.difficulty;
      expect(postTaskDifficultySchema).toBeDefined();
      expect(postTaskDifficultySchema.type).toBe('string');
      expect(postTaskDifficultySchema.enum).toEqual(expectedTiers);
      expect(postTaskDifficultySchema.default).toBe('easy');

      // GET /tasks query parameter difficulty schema
      const getTaskParameters = spec.paths?.['/tasks']?.get?.parameters;
      const diffQueryParam = getTaskParameters?.find((p: any) => p.name === 'difficulty');
      expect(diffQueryParam).toBeDefined();
      expect(diffQueryParam.schema.enum).toEqual(expectedTiers);

      // POST /tasks/batch items difficulty schema
      const batchTaskItemsSchema =
        spec.paths?.['/tasks/batch']?.post?.requestBody?.content?.['application/json']?.schema?.properties?.tasks?.items?.properties?.difficulty;
      expect(batchTaskItemsSchema).toBeDefined();
      expect(batchTaskItemsSchema.enum).toEqual(expectedTiers);

      // PATCH /tasks/{id} difficulty schema
      const patchTaskDifficultySchema =
        spec.paths?.['/tasks/{id}']?.patch?.requestBody?.content?.['application/json']?.schema?.properties?.difficulty;
      expect(patchTaskDifficultySchema).toBeDefined();
      expect(patchTaskDifficultySchema.enum).toEqual(expectedTiers);
    });

    it('verifies OpenAPI JSON serializes and deserializes with zero loss or circular references', async () => {
      const res = await request(app)
        .get('/api/v1/openapi.json')
        .set('X-API-Key', testUser.apiKey);

      expect(() => {
        const serialized = JSON.stringify(res.body);
        const parsed = JSON.parse(serialized);
        expect(parsed.openapi).toBe('3.1.0');
        expect(parsed.info.title).toBe('Cadence Task & Habit Manager API');
      }).not.toThrow();
    });
  });

  // =========================================================================
  // 3. AGENT API MODAL RENDERED MARKUP & VERBATIM SYSTEM PROMPT
  // =========================================================================
  describe('3. AgentApiModal Rendered Markup & Verbatim Prompt Verification', () => {
    it('returns empty string when isOpen is false', () => {
      const html = renderToStaticMarkup(
        React.createElement(AgentApiModal, {
          isOpen: false,
          onClose: vi.fn(),
          apiKey: 'hc_test_key_123',
          onRegenerateKey: vi.fn().mockResolvedValue('hc_test_key_new'),
        })
      );
      expect(html).toBe('');
    });

    it('renders modal with exact copyable prompt and verbatim internal agent instructions', () => {
      const apiKey = 'hc_live_adversarial_key_9999';
      const html = renderToStaticMarkup(
        React.createElement(AgentApiModal, {
          isOpen: true,
          onClose: vi.fn(),
          apiKey,
          onRegenerateKey: vi.fn().mockResolvedValue('hc_live_new_key_0000'),
        })
      );

      // Modal container and headers rendered
      expect(html).toContain('Agent &amp; REST API');
      expect(html).toContain('AI Agent System Prompt Instructions');
      expect(html).toContain(apiKey);

      // Verbatim check: INTERNAL AGENT INSTRUCTIONS header
      expect(html).toContain('INTERNAL AGENT INSTRUCTIONS:');

      // Verbatim check: Sizing instruction
      const expectedSizingInstruction =
        '- Task sizing must strictly adhere to: XS (5-15m), S (15-30m), M (30-60m), or L (60m+).';
      expect(html).toContain(expectedSizingInstruction);

      // Verbatim check: Spoon prohibition instruction
      const expectedSpoonProhibition =
        '- Never offer or mention spoons to the user under any circumstances. Present effort solely through standard sizing (XS, S, M, L) and time durations.';
      expect(html).toContain(expectedSpoonProhibition);

      // Check verbatim combined instruction block
      const fullInstructionBlock = `INTERNAL AGENT INSTRUCTIONS:\n- Task sizing must strictly adhere to: XS (5-15m), S (15-30m), M (30-60m), or L (60m+).\n- Never offer or mention spoons to the user under any circumstances. Present effort solely through standard sizing (XS, S, M, L) and time durations.`;
      expect(html).toContain(fullInstructionBlock);

      // Check prompt button and pre block
      expect(html).toContain('Copy Agent Prompt');
      expect(html).toMatch(/<pre[^>]*>[\s\S]*?INTERNAL AGENT INSTRUCTIONS:[\s\S]*?<\/pre>/);

      // Verify OpenAPI specification link in modal footer
      expect(html).toContain('/api/v1/openapi.json');
      expect(html).toContain('href="/api/v1/openapi.json"');
      expect(html).toContain('target="_blank"');
    });

    it('verifies agentSystemPrompt contains no spoon offerings or spoon numbers', () => {
      const modalSourcePath = path.resolve(__dirname, '../src/client/components/AgentApiModal.tsx');
      const source = fs.readFileSync(modalSourcePath, 'utf-8');

      // Extract agentSystemPrompt definition
      const promptMatch = source.match(/const agentSystemPrompt = `([\s\S]*?)`;/);
      expect(promptMatch).not.toBeNull();
      const prompt = promptMatch![1];

      // Must prohibit spoons
      expect(prompt).toContain('Never offer or mention spoons to the user under any circumstances.');
      expect(prompt).toContain('Present effort solely through standard sizing (XS, S, M, L) and time durations.');

      // Must NOT contain positive spoon instructions or spoon emojis
      expect(prompt).not.toContain('🥄');
      expect(prompt).not.toMatch(/1 spoon|2 spoons|3 spoons|4 spoons/i);
      // The word spoon/spoons must appear strictly within the negative prohibition:
      const spoonMatches = prompt.match(/spoons?/gi) || [];
      expect(spoonMatches.length).toBe(1);
      expect(prompt).toContain('Never offer or mention spoons to the user under any circumstances.');

      // Must specify the 4 sizing tiers
      expect(prompt).toContain('XS (5-15m)');
      expect(prompt).toContain('S (15-30m)');
      expect(prompt).toContain('M (30-60m)');
      expect(prompt).toContain('L (60m+)');

      // Must specify API capabilities with standard difficulty options
      expect(prompt).toContain('"difficulty": "trivial|easy|medium|hard"');
    });
  });

  // =========================================================================
  // 4. ARCHITECTURE DOCUMENTATION (docs/ARCHITECTURE.md) INVARIANTS
  // =========================================================================
  describe('4. Architecture Documentation (docs/ARCHITECTURE.md) Invariants', () => {
    let archDoc: string;

    beforeEach(() => {
      const archPath = path.resolve(__dirname, '../docs/ARCHITECTURE.md');
      expect(fs.existsSync(archPath)).toBe(true);
      archDoc = fs.readFileSync(archPath, 'utf-8');
    });

    it('accurately lists AgentApiModal.tsx in client component directory', () => {
      // Must map AgentApiModal with agent instructions prohibiting spoons and enforcing XS-L
      expect(archDoc).toMatch(/\[`components\/AgentApiModal\.tsx`\]/);
      expect(archDoc).toMatch(/prohibiting spoons/i);
      expect(archDoc).toMatch(/enforcing XS.*L sizing/i);
    });

    it('accurately documents GET /api/v1/openapi.json in the API Route Matrix', () => {
      // Route matrix must document the openapi.json endpoint
      expect(archDoc).toContain('`/api/v1/openapi.json`');
      expect(archDoc).toMatch(/OpenAPI 3\.1 specification/i);
      expect(archDoc).toMatch(/autonomous agent/i);
    });

    it('contains dedicated Autonomous Agent Guidance & Sizing Guidelines section', () => {
      // Must contain header for agent guidance
      expect(archDoc).toMatch(/##\s*🤖\s*Autonomous Agent Guidance & Sizing Guidelines/);

      // Section 1: Sizing Tiers (XS through L)
      expect(archDoc).toContain('`trivial`: **XS** (5–15 minutes)');
      expect(archDoc).toContain('`easy`: **S** (15–30 minutes)');
      expect(archDoc).toContain('`medium`: **M** (30–60 minutes)');
      expect(archDoc).toContain('`hard`: **L** (60+ minutes)');

      // Section 2: Spoon System Prohibition
      expect(archDoc).toMatch(/Autonomous agents must \*\*never\*\* offer, suggest, or mention "spoons" to the user/i);
      expect(archDoc).toMatch(/solely using standard sizing \(XS, S, M, L\) and time durations/i);
      expect(archDoc).toMatch(/`AgentApiModal\.tsx`.*`GET \/api\/v1\/openapi\.json`/s);
    });

    it('contains no contradictory references to spoon offering or non-existent 5th tiers in agent guidance', () => {
      // Check that the agent guidance section does not reference spoons positively or XL/XXS tiers
      const sectionMatch = archDoc.match(/##\s*🤖\s*Autonomous Agent Guidance[\s\S]*$/);
      expect(sectionMatch).not.toBeNull();
      const section = sectionMatch![0];

      expect(section).not.toMatch(/`xl`:|`xxs`:/i);
      expect(section).toContain('XS through L');
      expect(section).toContain('Sizing Tiers (XS through L)');
      expect(section).toContain('Spoon System Prohibition');
    });
  });
});
