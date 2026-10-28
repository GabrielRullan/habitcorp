import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { seedGabrielRoutines } from './seedRoutines.js';

let dbInstance: DatabaseSync | null = null;

export function getDb(customPath?: string): DatabaseSync {
  if (dbInstance && !customPath) {
    return dbInstance;
  }

  const dbPath =
    customPath ||
    process.env.DB_PATH ||
    path.join(process.cwd(), 'data', 'tasks.db');

  if (dbPath !== ':memory:') {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  initSchema(db);

  if (!customPath) {
    dbInstance = db;
  }
  return db;
}

export function resetDbForTesting(db: DatabaseSync) {
  dbInstance = db;
}

export function initSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      api_key TEXT UNIQUE NOT NULL,
      last_rollover_date TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#6366f1',
      icon TEXT DEFAULT 'folder',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
      type TEXT NOT NULL CHECK (type IN ('habit', 'daily', 'todo')),
      title TEXT NOT NULL,
      notes TEXT DEFAULT '',
      difficulty TEXT NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('trivial', 'easy', 'medium', 'hard')),
      difficulty_weight INTEGER NOT NULL DEFAULT 2,
      tags TEXT NOT NULL DEFAULT '[]',

      -- Habit specific
      habit_positive INTEGER NOT NULL DEFAULT 1,
      habit_negative INTEGER NOT NULL DEFAULT 0,
      counter_up INTEGER NOT NULL DEFAULT 0,
      counter_down INTEGER NOT NULL DEFAULT 0,
      habit_reset_period TEXT NOT NULL DEFAULT 'daily' CHECK (habit_reset_period IN ('daily', 'weekly', 'monthly')),
      last_habit_reset TEXT,

      -- Periodical (Daily) specific
      frequency TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'every_n_days', 'monthly')),
      repeat_interval INTEGER NOT NULL DEFAULT 1,
      repeat_days TEXT NOT NULL DEFAULT '[0,1,2,3,4,5,6]',
      streak INTEGER NOT NULL DEFAULT 0,
      best_streak INTEGER NOT NULL DEFAULT 0,
      completed INTEGER NOT NULL DEFAULT 0,
      last_completed_date TEXT,

      -- Timeline specific (for todos)
      start_date TEXT,
      due_date TEXT,

      -- Agenda Time-Blocking (applies to any task scheduled onto the agenda)
      scheduled_date TEXT,
      scheduled_start TEXT,
      scheduled_duration INTEGER NOT NULL DEFAULT 30,

      -- Routine & time-of-day organization
      time_of_day TEXT NOT NULL DEFAULT 'anytime' CHECK (time_of_day IN ('morning', 'workday', 'evening', 'anytime')),

      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS subtasks (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      position INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS calendar_sources (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      ics_url TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#6366f1',
      last_synced_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ghosts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      relation TEXT DEFAULT '',
      color TEXT NOT NULL DEFAULT '#ec4899',
      ics_url TEXT DEFAULT '',
      last_synced_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS calendar_events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      source_id TEXT REFERENCES calendar_sources(id) ON DELETE CASCADE,
      ghost_id TEXT REFERENCES ghosts(id) ON DELETE CASCADE,
      is_ghost INTEGER NOT NULL DEFAULT 0,
      ghost_name TEXT DEFAULT '',
      external_uid TEXT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      location TEXT DEFAULT '',
      meeting_url TEXT DEFAULT '',
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      all_day INTEGER NOT NULL DEFAULT 0,
      color TEXT NOT NULL DEFAULT '#6366f1',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      details TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_scheduled ON tasks(user_id, scheduled_date);
    CREATE INDEX IF NOT EXISTS idx_subtasks_task ON subtasks(task_id);
    CREATE INDEX IF NOT EXISTS idx_events_user_time ON calendar_events(user_id, start_time, end_time);
    CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);
  `);

  // Safe migrations for existing SQLite databases
  try {
    db.exec(`ALTER TABLE tasks ADD COLUMN project_id TEXT REFERENCES projects(id) ON DELETE SET NULL;`);
  } catch {}
  try {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(user_id, project_id);`);
  } catch {}
  try {
    db.exec(`ALTER TABLE calendar_events ADD COLUMN ghost_id TEXT REFERENCES ghosts(id) ON DELETE CASCADE;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE calendar_events ADD COLUMN is_ghost INTEGER NOT NULL DEFAULT 0;`);
  } catch {}
  try {
    db.exec(`ALTER TABLE calendar_events ADD COLUMN ghost_name TEXT DEFAULT '';`);
  } catch {}
  try {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_events_ghost ON calendar_events(user_id, is_ghost);`);
  } catch {}
  try {
    db.exec(`ALTER TABLE tasks ADD COLUMN time_of_day TEXT NOT NULL DEFAULT 'anytime' CHECK (time_of_day IN ('morning', 'workday', 'evening', 'anytime'));`);
  } catch {}
  try {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_tasks_time_of_day ON tasks(user_id, time_of_day);`);
  } catch {}

  // Ensure default test user always exists for zero-friction access
  try {
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get('testuser');
    if (!existing) {
      db.prepare(`
        INSERT INTO users (id, username, password_hash, api_key, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run('user_test_default', 'testuser', 'test_password_hash', 'tk_test_developer_key', new Date().toISOString());
    }

    // Seed Gabriel's routines and projects for testuser if not in test environment
    if (process.env.NODE_ENV !== 'test') {
      const existingGabriel = db.prepare('SELECT id FROM projects WHERE user_id = ? AND id = ?').get('user_test_default', 'proj_chinese');
      if (!existingGabriel) {
        seedGabrielRoutines(db, 'user_test_default');
      }
    }
  } catch (err) {
    console.error('Error creating default test user:', err);
  }
}

export const DIFFICULTY_WEIGHTS: Record<string, number> = {
  trivial: 1,
  easy: 2,
  medium: 3,
  hard: 4,
};
