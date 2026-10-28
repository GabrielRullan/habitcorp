import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { initSchema, resetDbForTesting, getDb } from '../src/server/db.js';
import { runUserRollover } from '../src/server/rollover.js';

describe('Adversarial Database & State Integrity Suite (M1 Challenger 2)', () => {
  let db: DatabaseSync;
  const testUserId = 'test_user_challenger';

  beforeEach(() => {
    db = new DatabaseSync(':memory:');
    db.exec('PRAGMA foreign_keys = ON;');
    initSchema(db);
    resetDbForTesting(db);

    // Insert isolated test user
    db.prepare(`
      INSERT INTO users (id, username, password_hash, api_key, last_rollover_date, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      testUserId,
      `challenger_${crypto.randomUUID().slice(0, 8)}`,
      'hash123',
      `tk_chal_${crypto.randomUUID()}`,
      '2026-10-25',
      new Date().toISOString()
    );
  });

  describe('1. Schema Definition & Table Info Verification', () => {
    it('declares time_of_day column with NOT NULL and default anytime', () => {
      const columns = db.prepare("PRAGMA table_info('tasks')").all() as Array<{
        cid: number;
        name: string;
        type: string;
        notnull: number;
        dflt_value: string;
        pk: number;
      }>;

      const todCol = columns.find((c) => c.name === 'time_of_day');
      expect(todCol).toBeDefined();
      expect(todCol?.type.toUpperCase()).toBe('TEXT');
      expect(todCol?.notnull).toBe(1);
      expect(todCol?.dflt_value).toBe("'anytime'");
    });

    it('indexes time_of_day with composite index (user_id, time_of_day)', () => {
      const indexes = db.prepare("PRAGMA index_list('tasks')").all() as Array<{
        name: string;
        unique: number;
      }>;

      const todIndex = indexes.find((i) => i.name === 'idx_tasks_time_of_day');
      expect(todIndex).toBeDefined();

      const indexCols = db.prepare("PRAGMA index_info('idx_tasks_time_of_day')").all() as Array<{
        seqno: number;
        cid: number;
        name: string;
      }>;

      expect(indexCols.length).toBe(2);
      expect(indexCols[0].name).toBe('user_id');
      expect(indexCols[1].name).toBe('time_of_day');
    });

    it('uses idx_tasks_time_of_day during filtered task lookups', () => {
      const queryPlan = db
        .prepare('EXPLAIN QUERY PLAN SELECT * FROM tasks WHERE user_id = ? AND time_of_day = ?')
        .all(testUserId, 'morning') as Array<{ detail: string }>;

      const usesIndex = queryPlan.some((row) =>
        row.detail.toLowerCase().includes('idx_tasks_time_of_day')
      );
      expect(usesIndex).toBe(true);
    });
  });

  describe('2. initSchema Idempotency & Legacy Database Migration', () => {
    it('executes repeatedly (50x) on the same database without throwing errors or altering schema', () => {
      expect(() => {
        for (let i = 0; i < 50; i++) {
          initSchema(db);
        }
      }).not.toThrow();

      // Verify column count and index count remain stable
      const columns = db.prepare("PRAGMA table_info('tasks')").all();
      const indexes = db.prepare("PRAGMA index_list('tasks')").all();
      const todCols = columns.filter((c: any) => c.name === 'time_of_day');
      const todIndexes = indexes.filter((i: any) => i.name === 'idx_tasks_time_of_day');

      expect(todCols.length).toBe(1);
      expect(todIndexes.length).toBe(1);
    });

    it('safely migrates a legacy database lacking time_of_day and sets default value on existing rows', () => {
      const legacyDb = new DatabaseSync(':memory:');
      legacyDb.exec('PRAGMA foreign_keys = ON;');

      // Create users table
      legacyDb.exec(`
        CREATE TABLE users (
          id TEXT PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          api_key TEXT UNIQUE NOT NULL,
          last_rollover_date TEXT,
          created_at TEXT NOT NULL
        );
      `);

      // Create legacy tasks table with exact pre-M1 schema (all 30 columns, omitting time_of_day)
      legacyDb.exec(`
        CREATE TABLE tasks (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          project_id TEXT,
          type TEXT NOT NULL CHECK (type IN ('habit', 'daily', 'todo')),
          title TEXT NOT NULL,
          notes TEXT DEFAULT '',
          difficulty TEXT NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('trivial', 'easy', 'medium', 'hard')),
          difficulty_weight INTEGER NOT NULL DEFAULT 2,
          tags TEXT NOT NULL DEFAULT '[]',
          habit_positive INTEGER NOT NULL DEFAULT 1,
          habit_negative INTEGER NOT NULL DEFAULT 0,
          counter_up INTEGER NOT NULL DEFAULT 0,
          counter_down INTEGER NOT NULL DEFAULT 0,
          habit_reset_period TEXT NOT NULL DEFAULT 'daily' CHECK (habit_reset_period IN ('daily', 'weekly', 'monthly')),
          last_habit_reset TEXT,
          frequency TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'every_n_days', 'monthly')),
          repeat_interval INTEGER NOT NULL DEFAULT 1,
          repeat_days TEXT NOT NULL DEFAULT '[0,1,2,3,4,5,6]',
          streak INTEGER NOT NULL DEFAULT 0,
          best_streak INTEGER NOT NULL DEFAULT 0,
          completed INTEGER NOT NULL DEFAULT 0,
          last_completed_date TEXT,
          start_date TEXT,
          due_date TEXT,
          scheduled_date TEXT,
          scheduled_start TEXT,
          scheduled_duration INTEGER NOT NULL DEFAULT 30,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          completed_at TEXT
        );
      `);

      // Insert pre-existing user and tasks in legacy DB
      legacyDb.prepare(`
        INSERT INTO users (id, username, password_hash, api_key, created_at)
        VALUES ('u_legacy', 'legacy_user', 'hash', 'key_legacy', '2026-01-01')
      `).run();

      legacyDb.prepare(`
        INSERT INTO tasks (id, user_id, type, title, created_at, updated_at)
        VALUES ('t_legacy_1', 'u_legacy', 'habit', 'Old Habit', '2026-01-01', '2026-01-01'),
               ('t_legacy_2', 'u_legacy', 'daily', 'Old Daily', '2026-01-01', '2026-01-01')
      `).run();

      // Now run initSchema on the legacy database
      expect(() => {
        initSchema(legacyDb);
      }).not.toThrow();

      // Check that existing tasks have time_of_day = 'anytime'
      const rows = legacyDb.prepare('SELECT id, time_of_day FROM tasks ORDER BY id ASC').all() as any[];
      expect(rows.length).toBe(2);
      expect(rows[0].time_of_day).toBe('anytime');
      expect(rows[1].time_of_day).toBe('anytime');

      // Verify running initSchema again on the newly migrated DB is completely idempotent
      expect(() => {
        initSchema(legacyDb);
        initSchema(legacyDb);
      }).not.toThrow();

      // Verify CHECK constraint is also enforced on migrated database
      expect(() => {
        legacyDb.prepare(`
          INSERT INTO tasks (id, user_id, type, title, time_of_day, created_at, updated_at)
          VALUES ('t_bad', 'u_legacy', 'habit', 'Bad', 'bogus_tod', '2026-01-01', '2026-01-01')
        `).run();
      }).toThrow(/CHECK constraint failed/i);
    });
  });

  describe('3. Direct SQL CHECK Constraint Adversarial Stress Testing', () => {
    it('accepts valid time_of_day values directly via SQL', () => {
      const validValues = ['morning', 'workday', 'evening', 'anytime'];
      for (const val of validValues) {
        const taskId = `task_${val}_${crypto.randomUUID().slice(0, 6)}`;
        expect(() => {
          db.prepare(`
            INSERT INTO tasks (id, user_id, type, title, time_of_day, created_at, updated_at)
            VALUES (?, ?, 'habit', ?, ?, ?, ?)
          `).run(taskId, testUserId, `Title ${val}`, val, '2026-10-28', '2026-10-28');
        }).not.toThrow();

        const stored = db.prepare('SELECT time_of_day FROM tasks WHERE id = ?').get(taskId) as any;
        expect(stored.time_of_day).toBe(val);
      }
    });

    it('falls back to default anytime when time_of_day column is omitted in SQL INSERT', () => {
      const taskId = `task_dflt_${crypto.randomUUID().slice(0, 6)}`;
      db.prepare(`
        INSERT INTO tasks (id, user_id, type, title, created_at, updated_at)
        VALUES (?, ?, 'todo', 'Default Task', '2026-10-28', '2026-10-28')
      `).run(taskId, testUserId);

      const stored = db.prepare('SELECT time_of_day FROM tasks WHERE id = ?').get(taskId) as any;
      expect(stored.time_of_day).toBe('anytime');
    });

    it('strictly REJECTS invalid time_of_day strings with CHECK constraint failure', () => {
      const invalidStrings = [
        'afternoon',
        'night',
        'dawn',
        'dusk',
        'weekend',
        'MORNING', // Uppercase invalid per schema CHECK
        'Workday', // Titlecase invalid per schema CHECK
        'EVENING',
        'ANYTIME',
        ' morning', // Leading space
        'anytime ', // Trailing space
        '', // Empty string
        '   ',
        'any_time',
        'work_day',
        'undefined',
        'null',
        '0',
        "morning' OR '1'='1",
      ];

      for (const badVal of invalidStrings) {
        const taskId = `task_bad_${crypto.randomUUID().slice(0, 6)}`;
        expect(() => {
          db.prepare(`
            INSERT INTO tasks (id, user_id, type, title, time_of_day, created_at, updated_at)
            VALUES (?, ?, 'habit', 'Bad Task', ?, '2026-10-28', '2026-10-28')
          `).run(taskId, testUserId, badVal);
        }).toThrow(/CHECK constraint failed/i);
      }
    });

    it('strictly REJECTS NULL for time_of_day (NOT NULL constraint)', () => {
      const taskId = `task_null_${crypto.randomUUID().slice(0, 6)}`;
      expect(() => {
        db.prepare(`
          INSERT INTO tasks (id, user_id, type, title, time_of_day, created_at, updated_at)
          VALUES (?, ?, 'habit', 'Null Task', NULL, '2026-10-28', '2026-10-28')
        `).run(taskId, testUserId);
      }).toThrow(/NOT NULL constraint failed/i);
    });

    it('strictly REJECTS invalid values during direct SQL UPDATE', () => {
      const taskId = `task_upd_${crypto.randomUUID().slice(0, 6)}`;
      db.prepare(`
        INSERT INTO tasks (id, user_id, type, title, time_of_day, created_at, updated_at)
        VALUES (?, ?, 'habit', 'Update Test', 'morning', '2026-10-28', '2026-10-28')
      `).run(taskId, testUserId);

      // Attempt invalid UPDATE
      expect(() => {
        db.prepare('UPDATE tasks SET time_of_day = ? WHERE id = ?').run('afternoon', taskId);
      }).toThrow(/CHECK constraint failed/i);

      // Attempt NULL UPDATE
      expect(() => {
        db.prepare('UPDATE tasks SET time_of_day = NULL WHERE id = ?').run(taskId);
      }).toThrow(/NOT NULL constraint failed/i);

      // Verify original value remained unmodified
      const stored = db.prepare('SELECT time_of_day FROM tasks WHERE id = ?').get(taskId) as any;
      expect(stored.time_of_day).toBe('morning');
    });

    it('fuzzes 100 pseudo-random strings against CHECK constraint', () => {
      for (let i = 0; i < 100; i++) {
        const randStr = crypto.randomBytes(8).toString('hex');
        if (['morning', 'workday', 'evening', 'anytime'].includes(randStr)) continue;

        expect(() => {
          db.prepare(`
            INSERT INTO tasks (id, user_id, type, title, time_of_day, created_at, updated_at)
            VALUES (?, ?, 'todo', 'Fuzz', ?, '2026-10-28', '2026-10-28')
          `).run(`fuzz_${i}`, testUserId, randStr);
        }).toThrow(/CHECK constraint failed/i);
      }
    });
  });

  describe('4. Rollover Preservation in src/server/rollover.ts', () => {
    it('preserves time_of_day on habits and dailies across daily rollovers', () => {
      // 1. Create habits with various time_of_day values
      const habits = [
        { id: 'h_morn', tod: 'morning', period: 'daily', up: 4 },
        { id: 'h_work', tod: 'workday', period: 'weekly', up: 7 },
        { id: 'h_eve', tod: 'evening', period: 'monthly', up: 10 },
        { id: 'h_any', tod: 'anytime', period: 'daily', up: 1 },
      ];

      for (const h of habits) {
        db.prepare(`
          INSERT INTO tasks (id, user_id, type, title, habit_reset_period, counter_up, time_of_day, created_at, updated_at)
          VALUES (?, ?, 'habit', ?, ?, ?, ?, '2026-10-25', '2026-10-25')
        `).run(h.id, testUserId, `Habit ${h.id}`, h.period, h.up, h.tod);
      }

      // 2. Create dailies with various time_of_day values
      const dailies = [
        { id: 'd_morn', tod: 'morning', completed: 1, streak: 3 },
        { id: 'd_work', tod: 'workday', completed: 0, streak: 5 },
        { id: 'd_eve', tod: 'evening', completed: 1, streak: 1 },
        { id: 'd_any', tod: 'anytime', completed: 1, streak: 12 },
      ];

      for (const d of dailies) {
        db.prepare(`
          INSERT INTO tasks (id, user_id, type, title, frequency, completed, streak, last_completed_date, time_of_day, created_at, updated_at)
          VALUES (?, ?, 'daily', ?, 'daily', ?, ?, '2026-10-25', ?, '2026-10-25', '2026-10-25')
        `).run(d.id, testUserId, `Daily ${d.id}`, d.completed, d.streak, d.tod);

        // Add subtasks to verify subtask reset doesn't affect parent task
        db.prepare(`
          INSERT INTO subtasks (id, task_id, title, completed, position)
          VALUES (?, ?, 'Subtask 1', 1, 0)
        `).run(`sub_${d.id}`, d.id);
      }

      // 3. Trigger rollover for 2026-10-26
      runUserRollover(testUserId, '2026-10-26');

      // Verify habit state and time_of_day preservation
      for (const h of habits) {
        const row = db.prepare('SELECT time_of_day, counter_up FROM tasks WHERE id = ?').get(h.id) as any;
        expect(row.time_of_day).toBe(h.tod); // MUST NOT MUTATE
        if (h.period === 'daily') {
          expect(row.counter_up).toBe(0); // Reset daily habit
        } else {
          expect(row.counter_up).toBe(h.up); // Weekly/Monthly untouched
        }
      }

      // Verify daily state and time_of_day preservation
      for (const d of dailies) {
        const row = db.prepare('SELECT time_of_day, completed, streak FROM tasks WHERE id = ?').get(d.id) as any;
        expect(row.time_of_day).toBe(d.tod); // MUST NOT MUTATE
        expect(row.completed).toBe(0); // Reset daily completion
      }

      // 4. Simulate a sequence of 30 consecutive days of rollover
      let simDate = new Date('2026-10-26T12:00:00Z');
      for (let day = 0; day < 30; day++) {
        simDate.setUTCDate(simDate.getUTCDate() + 1);
        const nextDateStr = simDate.toISOString().slice(0, 10);
        runUserRollover(testUserId, nextDateStr);
      }

      // 5. Final check after 30 days of rollovers
      for (const h of habits) {
        const row = db.prepare('SELECT time_of_day FROM tasks WHERE id = ?').get(h.id) as any;
        expect(row.time_of_day).toBe(h.tod);
      }
      for (const d of dailies) {
        const row = db.prepare('SELECT time_of_day FROM tasks WHERE id = ?').get(d.id) as any;
        expect(row.time_of_day).toBe(d.tod);
      }
    });

    it('leaves time_of_day intact when user rollover is a no-op (same date)', () => {
      const habitId = 'h_noop';
      db.prepare(`
        INSERT INTO tasks (id, user_id, type, title, habit_reset_period, counter_up, time_of_day, created_at, updated_at)
        VALUES (?, ?, 'habit', 'Noop Habit', 'daily', 5, 'workday', '2026-10-28', '2026-10-28')
      `).run(habitId, testUserId);

      // Set user's last_rollover_date to today
      db.prepare('UPDATE users SET last_rollover_date = ? WHERE id = ?').run('2026-10-28', testUserId);

      // Run rollover on same date
      runUserRollover(testUserId, '2026-10-28');

      const row = db.prepare('SELECT time_of_day, counter_up FROM tasks WHERE id = ?').get(habitId) as any;
      expect(row.time_of_day).toBe('workday');
      expect(row.counter_up).toBe(5);
    });

    it('handles non-existent user rollover gracefully without database error', () => {
      expect(() => {
        runUserRollover('non_existent_user_id', '2026-10-28');
      }).not.toThrow();
    });

    it('does NOT alter todos or unaffected tasks during rollover', () => {
      const todoId = 'todo_tod_test';
      db.prepare(`
        INSERT INTO tasks (id, user_id, type, title, time_of_day, created_at, updated_at)
        VALUES (?, ?, 'todo', 'WFH Project Doc', 'workday', '2026-10-25', '2026-10-25')
      `).run(todoId, testUserId);

      runUserRollover(testUserId, '2026-10-26');

      const stored = db.prepare('SELECT time_of_day, updated_at FROM tasks WHERE id = ?').get(todoId) as any;
      expect(stored.time_of_day).toBe('workday');
      expect(stored.updated_at).toBe('2026-10-25'); // completely untouched
    });

    it('enforces strict multi-user isolation during rollover', () => {
      const userBId = 'test_user_b_isolation';
      db.prepare(`
        INSERT INTO users (id, username, password_hash, api_key, last_rollover_date, created_at)
        VALUES (?, 'user_b_iso', 'hashB', 'tk_b_iso', '2026-10-25', '2026-10-25')
      `).run(userBId);

      // User A habit
      db.prepare(`
        INSERT INTO tasks (id, user_id, type, title, habit_reset_period, counter_up, time_of_day, created_at, updated_at)
        VALUES ('h_user_a', ?, 'habit', 'User A Habit', 'daily', 5, 'morning', '2026-10-25', '2026-10-25')
      `).run(testUserId);

      // User B habit
      db.prepare(`
        INSERT INTO tasks (id, user_id, type, title, habit_reset_period, counter_up, time_of_day, created_at, updated_at)
        VALUES ('h_user_b', ?, 'habit', 'User B Habit', 'daily', 5, 'evening', '2026-10-25', '2026-10-25')
      `).run(userBId);

      // Run rollover ONLY for User A
      runUserRollover(testUserId, '2026-10-26');

      // User A reset to 0, morning preserved
      const habitA = db.prepare('SELECT counter_up, time_of_day FROM tasks WHERE id = ?').get('h_user_a') as any;
      expect(habitA.counter_up).toBe(0);
      expect(habitA.time_of_day).toBe('morning');

      // User B NOT reset, evening preserved
      const habitB = db.prepare('SELECT counter_up, time_of_day FROM tasks WHERE id = ?').get('h_user_b') as any;
      expect(habitB.counter_up).toBe(5);
      expect(habitB.time_of_day).toBe('evening');
    });

    it('preserves time_of_day for complex frequency dailies (weekly, every_n_days, monthly)', () => {
      // Weekly daily due on Mon/Wed/Fri (1, 3, 5)
      db.prepare(`
        INSERT INTO tasks (id, user_id, type, title, frequency, repeat_days, completed, streak, time_of_day, created_at, updated_at)
        VALUES ('d_weekly', ?, 'daily', 'Weekly Routine', 'weekly', '[1,3,5]', 1, 4, 'morning', '2026-10-20', '2026-10-20')
      `).run(testUserId);

      // Every 3 days daily
      db.prepare(`
        INSERT INTO tasks (id, user_id, type, title, frequency, repeat_interval, completed, streak, time_of_day, created_at, updated_at)
        VALUES ('d_interval', ?, 'daily', 'Interval Routine', 'every_n_days', 3, 1, 2, 'workday', '2026-10-20', '2026-10-20')
      `).run(testUserId);

      // Monthly daily
      db.prepare(`
        INSERT INTO tasks (id, user_id, type, title, frequency, completed, streak, time_of_day, created_at, updated_at)
        VALUES ('d_monthly', ?, 'daily', 'Monthly Review', 'monthly', 1, 1, 'evening', '2026-10-01', '2026-10-01')
      `).run(testUserId);

      runUserRollover(testUserId, '2026-10-28');

      const dWeekly = db.prepare('SELECT time_of_day, completed FROM tasks WHERE id = ?').get('d_weekly') as any;
      expect(dWeekly.time_of_day).toBe('morning');
      expect(dWeekly.completed).toBe(0);

      const dInterval = db.prepare('SELECT time_of_day, completed FROM tasks WHERE id = ?').get('d_interval') as any;
      expect(dInterval.time_of_day).toBe('workday');
      expect(dInterval.completed).toBe(0);

      const dMonthly = db.prepare('SELECT time_of_day, completed FROM tasks WHERE id = ?').get('d_monthly') as any;
      expect(dMonthly.time_of_day).toBe('evening');
      expect(dMonthly.completed).toBe(0);
    });
  });

  describe('5. Real Disk Database (data/tasks.db) Integrity Check', () => {
    it('passes SQLite PRAGMA integrity_check and foreign_key_check on disk db', () => {
      const diskDbPath = path.join(process.cwd(), 'data', 'tasks.db');
      if (!fs.existsSync(diskDbPath)) {
        // If not created yet, getDb() initializes it
        getDb(diskDbPath);
      }

      const diskDb = new DatabaseSync(diskDbPath);
      diskDb.exec('PRAGMA foreign_keys = ON;');

      // 1. Run PRAGMA integrity_check
      const integrity = diskDb.prepare('PRAGMA integrity_check').all() as Array<{ integrity_check: string }>;
      expect(integrity.length).toBeGreaterThan(0);
      expect(integrity[0].integrity_check).toBe('ok');

      // 2. Run PRAGMA foreign_key_check
      const fkCheck = diskDb.prepare('PRAGMA foreign_key_check').all();
      expect(fkCheck.length).toBe(0);

      // 3. Verify time_of_day column in tasks table
      const columns = diskDb.prepare("PRAGMA table_info('tasks')").all() as any[];
      const todCol = columns.find((c) => c.name === 'time_of_day');
      expect(todCol).toBeDefined();

      // 4. Verify all existing rows in tasks have valid time_of_day
      const tasks = diskDb.prepare('SELECT id, time_of_day FROM tasks').all() as any[];
      for (const t of tasks) {
        expect(['morning', 'workday', 'evening', 'anytime']).toContain(t.time_of_day);
      }

      // 5. Verify index exists
      const indexes = diskDb.prepare("PRAGMA index_list('tasks')").all() as any[];
      const todIndex = indexes.find((i) => i.name === 'idx_tasks_time_of_day');
      expect(todIndex).toBeDefined();
    });

    it('cascades deletion on tasks with time_of_day when user is deleted', () => {
      const tempUser = 'user_to_delete';
      db.prepare(`
        INSERT INTO users (id, username, password_hash, api_key, created_at)
        VALUES (?, 'delete_me', 'hash', 'tk_del', '2026-10-28')
      `).run(tempUser);

      db.prepare(`
        INSERT INTO tasks (id, user_id, type, title, time_of_day, created_at, updated_at)
        VALUES ('task_del_1', ?, 'habit', 'Habit 1', 'morning', '2026-10-28', '2026-10-28')
      `).run(tempUser);

      // Delete user
      db.prepare('DELETE FROM users WHERE id = ?').run(tempUser);

      // Verify task was cascaded
      const task = db.prepare('SELECT id FROM tasks WHERE id = ?').get('task_del_1');
      expect(task).toBeUndefined();
    });
  });
});

