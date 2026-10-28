import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { DatabaseSync } from 'node:sqlite';
import { app } from '../src/server/index.js';
import { resetDbForTesting, initSchema, getDb } from '../src/server/db.js';

describe('Milestone 1 Adversarial Empirical Verification Suite', () => {
  let userA: { id: string; username: string; apiKey: string };
  let userB: { id: string; username: string; apiKey: string };

  beforeEach(async () => {
    // Isolated in-memory database for clean test isolation
    const memDb = new DatabaseSync(':memory:');
    memDb.exec('PRAGMA foreign_keys = ON;');
    initSchema(memDb);
    resetDbForTesting(memDb);

    // Register User A
    const resA = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'challenger_alice', password: 'password123' });
    userA = resA.body;

    // Register User B
    const resB = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'challenger_bob', password: 'password456' });
    userB = resB.body;
  });

  describe('1. SQLite Schema Constraints & Migration Resilience', () => {
    it('enforces SQLite CHECK constraint at the database engine level', () => {
      const db = getDb();

      // Verify column exists and is indexed
      const columns = db.prepare('PRAGMA table_info(tasks)').all() as any[];
      const todCol = columns.find((c) => c.name === 'time_of_day');
      expect(todCol).toBeDefined();
      expect(todCol.notnull).toBe(1);
      expect(todCol.dflt_value).toBe("'anytime'");

      const indexes = db.prepare('PRAGMA index_list(tasks)').all() as any[];
      expect(indexes.some((i) => i.name === 'idx_tasks_time_of_day')).toBe(true);

      // Attempt direct SQL insertion with invalid time_of_day -> MUST throw CHECK constraint violation
      expect(() => {
        db.prepare(`
          INSERT INTO tasks (
            id, user_id, type, title, time_of_day, created_at, updated_at
          ) VALUES ('raw_1', ?, 'habit', 'Illegal Habit', 'afternoon', '2026-10-28', '2026-10-28')
        `).run(userA.id);
      }).toThrow(/CHECK constraint failed/);

      // Verify valid insert works
      expect(() => {
        db.prepare(`
          INSERT INTO tasks (
            id, user_id, type, title, time_of_day, created_at, updated_at
          ) VALUES ('raw_2', ?, 'habit', 'Legal Habit', 'morning', '2026-10-28', '2026-10-28')
        `).run(userA.id);
      }).not.toThrow();
    });

    it('guarantees migration idempotency when initSchema is called repeatedly', () => {
      const db = getDb();
      // Should not throw or crash if called again on existing DB
      expect(() => initSchema(db)).not.toThrow();
      expect(() => initSchema(db)).not.toThrow();

      const columns = db.prepare('PRAGMA table_info(tasks)').all() as any[];
      const todCols = columns.filter((c) => c.name === 'time_of_day');
      expect(todCols.length).toBe(1);
    });
  });

  describe('2. POST /tasks Boundary Values, Case Variations & Input Sanitization', () => {
    it('accepts omitted time_of_day and defaults to anytime', async () => {
      const res = await request(app)
        .post('/api/v1/tasks')
        .set('X-API-Key', userA.apiKey)
        .send({ title: 'Default Anytime Habit', type: 'habit' });

      expect(res.status).toBe(201);
      expect(res.body.time_of_day).toBe('anytime');
    });

    it('accepts null time_of_day and gracefully defaults to anytime', async () => {
      const res = await request(app)
        .post('/api/v1/tasks')
        .set('X-API-Key', userA.apiKey)
        .send({ title: 'Null Field Habit', type: 'habit', time_of_day: null });

      expect(res.status).toBe(201);
      expect(res.body.time_of_day).toBe('anytime');
    });

    it('normalizes case variations and whitespace padding for all valid values', async () => {
      const testCases = [
        { input: 'morning', expected: 'morning' },
        { input: '  Morning  ', expected: 'morning' },
        { input: 'WORKDAY', expected: 'workday' },
        { input: '  wOrKdAy \n', expected: 'workday' },
        { input: 'EVENING', expected: 'evening' },
        { input: '  Evening\t', expected: 'evening' },
        { input: 'ANYTIME', expected: 'anytime' },
        { input: 'AnyTime', expected: 'anytime' },
      ];

      for (const tc of testCases) {
        const res = await request(app)
          .post('/api/v1/tasks')
          .set('X-API-Key', userA.apiKey)
          .send({ title: `Habit ${tc.input}`, type: 'habit', time_of_day: tc.input });

        expect(res.status).toBe(201);
        expect(res.body.time_of_day).toBe(tc.expected);
      }
    });

    it('rejects empty strings and whitespace-only strings with HTTP 400', async () => {
      const badInputs = ['', '   ', '\t', '\n'];
      for (const bad of badInputs) {
        const res = await request(app)
          .post('/api/v1/tasks')
          .set('X-API-Key', userA.apiKey)
          .send({ title: 'Empty String Habit', type: 'habit', time_of_day: bad });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/Invalid time_of_day/);
      }
    });

    it('rejects invalid taxonomical strings with HTTP 400', async () => {
      const invalidStrings = ['afternoon', 'night', 'noon', 'midday', 'dawn', 'dusk', 'someday'];
      for (const invalid of invalidStrings) {
        const res = await request(app)
          .post('/api/v1/tasks')
          .set('X-API-Key', userA.apiKey)
          .send({ title: `Invalid Habit ${invalid}`, type: 'habit', time_of_day: invalid });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/Invalid time_of_day/);
      }
    });

    it('rejects type-mismatched payloads (numbers, booleans, arrays, objects) with HTTP 400', async () => {
      const nonStringInputs = [123, true, false, ['morning'], { value: 'morning' }];
      for (const val of nonStringInputs) {
        const res = await request(app)
          .post('/api/v1/tasks')
          .set('X-API-Key', userA.apiKey)
          .send({ title: 'Non-string habit', type: 'habit', time_of_day: val });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/Invalid time_of_day/);
      }
    });

    it('safely handles extra long strings and malicious injection vectors without crashing', async () => {
      const maliciousInputs = [
        'morning' + 'a'.repeat(5000),
        "' OR '1'='1",
        "morning'; DROP TABLE tasks; --",
        '<script>alert("xss")</script>',
        'morning\0nullbyte',
      ];

      for (const mal of maliciousInputs) {
        const res = await request(app)
          .post('/api/v1/tasks')
          .set('X-API-Key', userA.apiKey)
          .send({ title: 'Malicious TOD Habit', type: 'habit', time_of_day: mal });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/Invalid time_of_day/);
      }

      // Verify tasks table is intact
      const listRes = await request(app)
        .get('/api/v1/tasks')
        .set('X-API-Key', userA.apiKey);
      expect(listRes.status).toBe(200);
    });
  });

  describe('3. PATCH /tasks/:id Boundary Values & Integrity Protection', () => {
    let taskId: string;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/v1/tasks')
        .set('X-API-Key', userA.apiKey)
        .send({ title: 'Mutable Morning Habit', type: 'habit', time_of_day: 'morning' });
      taskId = res.body.id;
    });

    it('updates time_of_day across valid taxonomies with case normalization', async () => {
      // morning -> workday
      const patch1 = await request(app)
        .patch(`/api/v1/tasks/${taskId}`)
        .set('X-API-Key', userA.apiKey)
        .send({ time_of_day: '  WorkDay ' });
      expect(patch1.status).toBe(200);
      expect(patch1.body.time_of_day).toBe('workday');

      // workday -> evening
      const patch2 = await request(app)
        .patch(`/api/v1/tasks/${taskId}`)
        .set('X-API-Key', userA.apiKey)
        .send({ time_of_day: 'EVENING' });
      expect(patch2.status).toBe(200);
      expect(patch2.body.time_of_day).toBe('evening');

      // evening -> anytime
      const patch3 = await request(app)
        .patch(`/api/v1/tasks/${taskId}`)
        .set('X-API-Key', userA.apiKey)
        .send({ time_of_day: 'anytime' });
      expect(patch3.status).toBe(200);
      expect(patch3.body.time_of_day).toBe('anytime');
    });

    it('rejects invalid time_of_day on PATCH with HTTP 400 and preserves original data', async () => {
      const invalidPatches = ['afternoon', '', '   ', null, 999, ['morning'], "'; DROP TABLE tasks;--"];

      for (const bad of invalidPatches) {
        const patchRes = await request(app)
          .patch(`/api/v1/tasks/${taskId}`)
          .set('X-API-Key', userA.apiKey)
          .send({ time_of_day: bad });

        expect(patchRes.status).toBe(400);
        expect(patchRes.body.error).toMatch(/Invalid time_of_day/);

        // Verify task was NOT modified
        const getRes = await request(app)
          .get(`/api/v1/tasks/${taskId}`)
          .set('X-API-Key', userA.apiKey);
        expect(getRes.status).toBe(200);
        expect(getRes.body.time_of_day).toBe('morning');
      }
    });

    it('prevents cross-user PATCH attempts (multi-user isolation)', async () => {
      const unauthorizedPatch = await request(app)
        .patch(`/api/v1/tasks/${taskId}`)
        .set('X-API-Key', userB.apiKey)
        .send({ time_of_day: 'evening' });

      expect(unauthorizedPatch.status).toBe(404);

      // Verify User A task remains unchanged
      const getRes = await request(app)
        .get(`/api/v1/tasks/${taskId}`)
        .set('X-API-Key', userA.apiKey);
      expect(getRes.body.time_of_day).toBe('morning');
    });
  });

  describe('4. GET /tasks Query Filtering Stress & Edge Cases', () => {
    beforeEach(async () => {
      // Seed 4 distinct habits for User A
      const items = [
        { title: 'Morning Kickoff Routine', type: 'habit', time_of_day: 'morning' },
        { title: 'Workday Focus Session', type: 'habit', time_of_day: 'workday' },
        { title: 'Evening Shutdown Routine', type: 'habit', time_of_day: 'evening' },
        { title: 'Anytime Hydration Reminder', type: 'habit', time_of_day: 'anytime' },
      ];
      for (const item of items) {
        await request(app)
          .post('/api/v1/tasks')
          .set('X-API-Key', userA.apiKey)
          .send(item);
      }
    });

    it('accurately filters tasks by valid time_of_day values with case insensitivity', async () => {
      const morningRes = await request(app)
        .get('/api/v1/tasks?time_of_day=morning')
        .set('X-API-Key', userA.apiKey);
      expect(morningRes.status).toBe(200);
      expect(morningRes.body.tasks.length).toBe(1);
      expect(morningRes.body.tasks[0].title).toBe('Morning Kickoff Routine');

      // Case variation
      const workdayRes = await request(app)
        .get('/api/v1/tasks?time_of_day=WorkDay')
        .set('X-API-Key', userA.apiKey);
      expect(workdayRes.status).toBe(200);
      expect(workdayRes.body.tasks.length).toBe(1);
      expect(workdayRes.body.tasks[0].title).toBe('Workday Focus Session');

      const eveningRes = await request(app)
        .get('/api/v1/tasks?time_of_day=EVENING')
        .set('X-API-Key', userA.apiKey);
      expect(eveningRes.status).toBe(200);
      expect(eveningRes.body.tasks.length).toBe(1);
      expect(eveningRes.body.tasks[0].title).toBe('Evening Shutdown Routine');

      const anytimeRes = await request(app)
        .get('/api/v1/tasks?time_of_day=anytime')
        .set('X-API-Key', userA.apiKey);
      expect(anytimeRes.status).toBe(200);
      expect(anytimeRes.body.tasks.length).toBe(1);
      expect(anytimeRes.body.tasks[0].title).toBe('Anytime Hydration Reminder');
    });

    it('treats empty query parameter (?time_of_day=) as no filter', async () => {
      const res = await request(app)
        .get('/api/v1/tasks?time_of_day=')
        .set('X-API-Key', userA.apiKey);
      expect(res.status).toBe(200);
      expect(res.body.tasks.length).toBe(4);
    });

    it('rejects whitespace-only and invalid query parameters with HTTP 400', async () => {
      const badQueries = ['%20%20', 'afternoon', 'night', '1234', 'null'];
      for (const bq of badQueries) {
        const res = await request(app)
          .get(`/api/v1/tasks?time_of_day=${bq}`)
          .set('X-API-Key', userA.apiKey);
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/Invalid time_of_day/);
      }
    });

    it('gracefully rejects array query parameters (?time_of_day=morning&time_of_day=evening) with HTTP 400 without 500 error', async () => {
      const res = await request(app)
        .get('/api/v1/tasks?time_of_day=morning&time_of_day=evening')
        .set('X-API-Key', userA.apiKey);

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Invalid time_of_day/);
    });

    it('supports composite filtering (time_of_day + type + search)', async () => {
      const res = await request(app)
        .get('/api/v1/tasks?time_of_day=morning&type=habit&search=Kickoff')
        .set('X-API-Key', userA.apiKey);

      expect(res.status).toBe(200);
      expect(res.body.tasks.length).toBe(1);
      expect(res.body.tasks[0].title).toBe('Morning Kickoff Routine');

      // Non-matching search
      const noMatchRes = await request(app)
        .get('/api/v1/tasks?time_of_day=morning&search=NonExistent')
        .set('X-API-Key', userA.apiKey);
      expect(noMatchRes.status).toBe(200);
      expect(noMatchRes.body.tasks.length).toBe(0);
    });
  });

  describe('5. Multi-User Isolation Under Time-of-Day Queries', () => {
    beforeEach(async () => {
      // User A creates 4 routines
      for (const tod of ['morning', 'workday', 'evening', 'anytime']) {
        await request(app)
          .post('/api/v1/tasks')
          .set('X-API-Key', userA.apiKey)
          .send({ title: `Alice ${tod}`, type: 'habit', time_of_day: tod });
      }

      // User B creates 4 routines
      for (const tod of ['morning', 'workday', 'evening', 'anytime']) {
        await request(app)
          .post('/api/v1/tasks')
          .set('X-API-Key', userB.apiKey)
          .send({ title: `Bob ${tod}`, type: 'habit', time_of_day: tod });
      }
    });

    it('guarantees complete isolation when querying identical time_of_day', async () => {
      for (const tod of ['morning', 'workday', 'evening', 'anytime']) {
        // Query as User A
        const resA = await request(app)
          .get(`/api/v1/tasks?time_of_day=${tod}`)
          .set('X-API-Key', userA.apiKey);
        expect(resA.status).toBe(200);
        expect(resA.body.tasks.length).toBe(1);
        expect(resA.body.tasks[0].title).toBe(`Alice ${tod}`);
        expect(resA.body.tasks.some((t: any) => t.title.startsWith('Bob'))).toBe(false);

        // Query as User B
        const resB = await request(app)
          .get(`/api/v1/tasks?time_of_day=${tod}`)
          .set('X-API-Key', userB.apiKey);
        expect(resB.status).toBe(200);
        expect(resB.body.tasks.length).toBe(1);
        expect(resB.body.tasks[0].title).toBe(`Bob ${tod}`);
        expect(resB.body.tasks.some((t: any) => t.title.startsWith('Alice'))).toBe(false);
      }
    });

    it('enforces isolation on direct task retrieval and deletion', async () => {
      // Get Alice's morning task id
      const resA = await request(app)
        .get('/api/v1/tasks?time_of_day=morning')
        .set('X-API-Key', userA.apiKey);
      const aliceMorningId = resA.body.tasks[0].id;

      // Bob tries GET -> 404
      const bobGet = await request(app)
        .get(`/api/v1/tasks/${aliceMorningId}`)
        .set('X-API-Key', userB.apiKey);
      expect(bobGet.status).toBe(404);

      // Bob tries DELETE -> 404
      const bobDel = await request(app)
        .delete(`/api/v1/tasks/${aliceMorningId}`)
        .set('X-API-Key', userB.apiKey);
      expect(bobDel.status).toBe(404);

      // Alice's task still exists
      const aliceVerify = await request(app)
        .get(`/api/v1/tasks/${aliceMorningId}`)
        .set('X-API-Key', userA.apiKey);
      expect(aliceVerify.status).toBe(200);
    });
  });

  describe('6. Batch Ingestion Resilience (Bulk 20-Item Payload)', () => {
    it('processes 20 items with mixed valid, invalid, missing, and adversarial inputs with 100% resilience', async () => {
      // Construct an adversarial 20-item bulk payload
      const bulkTasks = [
        // 4 Valid canonical items
        { title: 'B1: Morning Coffee', type: 'habit', time_of_day: 'morning' },
        { title: 'B2: Deep Work Block 1', type: 'todo', time_of_day: 'workday' },
        { title: 'B3: Evening Reflection', type: 'daily', time_of_day: 'evening' },
        { title: 'B4: Hydration 2L', type: 'habit', time_of_day: 'anytime' },

        // 4 Case-variation and padded items
        { title: 'B5: Morning Stretch', type: 'habit', time_of_day: '  MORNING  ' },
        { title: 'B6: Workday Posture Check', type: 'habit', time_of_day: 'WoRkDaY' },
        { title: 'B7: Evening Shutdown Routine', type: 'daily', time_of_day: '  evening\n' },
        { title: 'B8: Anytime Breathe', type: 'habit', time_of_day: 'AnyTime' },

        // 4 Missing or null items -> should fall back to anytime
        { title: 'B9: Omitted TOD Item', type: 'todo' },
        { title: 'B10: Null TOD Item', type: 'habit', time_of_day: null },
        { title: 'B11: Undefined TOD Item', type: 'daily', time_of_day: undefined },
        { title: 'B12: Empty String TOD Item', type: 'habit', time_of_day: '' },

        // 4 Invalid taxonomical strings -> should fall back to anytime
        { title: 'B13: Afternoon Walk', type: 'habit', time_of_day: 'afternoon' },
        { title: 'B14: Midnight Reading', type: 'habit', time_of_day: 'midnight' },
        { title: 'B15: Lunch Routine', type: 'habit', time_of_day: 'lunch' },
        { title: 'B16: Whitespace Only TOD', type: 'habit', time_of_day: '   ' },

        // 4 Extreme / Non-string / Malicious items -> should fall back to anytime
        { title: 'B17: Numeric TOD', type: 'habit', time_of_day: 12345 },
        { title: 'B18: Boolean TOD', type: 'habit', time_of_day: true },
        { title: 'B19: Injection Vector TOD', type: 'habit', time_of_day: "morning'; DROP TABLE tasks; --" },
        { title: 'B20: Super Long TOD', type: 'habit', time_of_day: 'workday'.repeat(200) },
      ];

      expect(bulkTasks.length).toBe(20);

      const batchRes = await request(app)
        .post('/api/v1/tasks/batch')
        .set('X-API-Key', userA.apiKey)
        .send({ tasks: bulkTasks });

      expect(batchRes.status).toBe(201);
      expect(batchRes.body.created_count).toBe(20);
      expect(batchRes.body.tasks.length).toBe(20);

      // Verify each task adheres to the expected time_of_day mapping
      const created = batchRes.body.tasks;
      expect(created[0].time_of_day).toBe('morning');
      expect(created[1].time_of_day).toBe('workday');
      expect(created[2].time_of_day).toBe('evening');
      expect(created[3].time_of_day).toBe('anytime');

      expect(created[4].time_of_day).toBe('morning');
      expect(created[5].time_of_day).toBe('workday');
      expect(created[6].time_of_day).toBe('evening');
      expect(created[7].time_of_day).toBe('anytime');

      // B9 - B20 must all have fallen back gracefully to anytime
      for (let i = 8; i < 20; i++) {
        expect(created[i].time_of_day).toBe('anytime');
      }

      // Verify SQLite database integrity directly
      const db = getDb();
      const allRows = db.prepare('SELECT time_of_day FROM tasks WHERE user_id = ?').all(userA.id) as any[];
      expect(allRows.length).toBe(20);

      const validValues = new Set(['morning', 'workday', 'evening', 'anytime']);
      for (const row of allRows) {
        expect(validValues.has(row.time_of_day)).toBe(true);
      }

      // Count distribution:
      // morning: B1, B5 -> 2
      // workday: B2, B6 -> 2
      // evening: B3, B7 -> 2
      // anytime: B4, B8 + B9..B20 (12) -> 14
      const morningQuery = await request(app)
        .get('/api/v1/tasks?time_of_day=morning')
        .set('X-API-Key', userA.apiKey);
      expect(morningQuery.body.tasks.length).toBe(2);

      const workdayQuery = await request(app)
        .get('/api/v1/tasks?time_of_day=workday')
        .set('X-API-Key', userA.apiKey);
      expect(workdayQuery.body.tasks.length).toBe(2);

      const eveningQuery = await request(app)
        .get('/api/v1/tasks?time_of_day=evening')
        .set('X-API-Key', userA.apiKey);
      expect(eveningQuery.body.tasks.length).toBe(2);

      const anytimeQuery = await request(app)
        .get('/api/v1/tasks?time_of_day=anytime')
        .set('X-API-Key', userA.apiKey);
      expect(anytimeQuery.body.tasks.length).toBe(14);

      // Verify User B still sees 0 tasks (isolation after batch)
      const bobRes = await request(app)
        .get('/api/v1/tasks')
        .set('X-API-Key', userB.apiKey);
      expect(bobRes.body.tasks.length).toBe(0);
    });
  });

  describe('7. Agenda Integration & OpenAPI Spec Verification', () => {
    it('returns time_of_day on scheduled habits and tasks in GET /agenda', async () => {
      // Create a scheduled habit
      await request(app)
        .post('/api/v1/tasks')
        .set('X-API-Key', userA.apiKey)
        .send({
          title: 'Scheduled Morning Kickoff Routine',
          type: 'habit',
          time_of_day: 'morning',
          scheduled_date: '2026-10-28',
          scheduled_start: '08:30',
          scheduled_duration: 45,
        });

      const agendaRes = await request(app)
        .get('/api/v1/agenda?start=2026-10-28&end=2026-10-28')
        .set('X-API-Key', userA.apiKey);

      expect(agendaRes.status).toBe(200);
      expect(agendaRes.body.scheduled_tasks.length).toBe(1);
      const scheduled = agendaRes.body.scheduled_tasks[0];
      expect(scheduled.title).toBe('Scheduled Morning Kickoff Routine');
      expect(scheduled.type).toBe('habit');
      expect(scheduled.time_of_day).toBe('morning');
      expect(scheduled.scheduled_start).toBe('08:30');
      expect(scheduled.scheduled_duration).toBe(45);
    });

    it('documents time_of_day properly in GET /openapi.json specification', async () => {
      // Unauthenticated request is rejected by authMiddleware
      const unauthRes = await request(app).get('/api/v1/openapi.json');
      expect(unauthRes.status).toBe(401);

      // Authenticated request succeeds
      const openapiRes = await request(app)
        .get('/api/v1/openapi.json')
        .set('X-API-Key', userA.apiKey);
      expect(openapiRes.status).toBe(200);

      const spec = openapiRes.body;
      const getTasksParams = spec.paths['/tasks'].get.parameters;
      const todQueryParam = getTasksParams.find((p: any) => p.name === 'time_of_day');
      expect(todQueryParam).toBeDefined();
      expect(todQueryParam.schema.enum).toEqual(['morning', 'workday', 'evening', 'anytime']);

      const postTaskProp = spec.paths['/tasks'].post.requestBody.content['application/json'].schema.properties.time_of_day;
      expect(postTaskProp).toBeDefined();
      expect(postTaskProp.enum).toEqual(['morning', 'workday', 'evening', 'anytime']);

      const batchItemProp = spec.paths['/tasks/batch'].post.requestBody.content['application/json'].schema.properties.tasks.items.properties.time_of_day;
      expect(batchItemProp).toBeDefined();
      expect(batchItemProp.enum).toEqual(['morning', 'workday', 'evening', 'anytime']);

      const patchTaskProp = spec.paths['/tasks/{id}'].patch.requestBody.content['application/json'].schema.properties.time_of_day;
      expect(patchTaskProp).toBeDefined();
      expect(patchTaskProp.enum).toEqual(['morning', 'workday', 'evening', 'anytime']);
    });
  });
});
