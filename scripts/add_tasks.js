import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';

const dbPath = path.resolve('data/tasks.db');
const db = new DatabaseSync(dbPath);
const now = new Date().toISOString();

const insertTask = db.prepare(`
  INSERT INTO tasks (
    id, user_id, project_id, type, time_of_day, title, notes,
    difficulty, difficulty_weight, tags, habit_positive, habit_negative,
    counter_up, counter_down, habit_reset_period, frequency, repeat_interval,
    repeat_days, streak, best_streak, completed, created_at, updated_at, micro_habit_title
  ) VALUES (
    ?, ?, ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?, ?, ?
  )
`);

try {
  // Gabriel
  insertTask.run(
    'habit_job_offers_1dc81dd5-18c5-4032-801a-2749b4a263f3',
    '1dc81dd5-18c5-4032-801a-2749b4a263f3',
    'proj_corp_1dc81dd5-18c5-4032-801a-2749b4a263f3',
    'daily',
    'morning',
    'Verificar noves ofertes de feina (💼)',
    'Revisar alertes de noves posicions en LinkedIn i portals de feina.',
    'easy',
    2,
    JSON.stringify(['career', 'empleo']),
    1,
    0,
    0,
    0,
    'daily',
    'daily',
    1,
    JSON.stringify([0, 1, 2, 3, 4, 5, 6]),
    0,
    0,
    0,
    now,
    now,
    'Obrir LinkedIn i veure 1 oferta'
  );
  console.log('Inserted habit for Gabriel');
} catch (e) {
  console.log('Gabriel habit:', e.message);
}

try {
  insertTask.run(
    'task_api_review_1dc81dd5-18c5-4032-801a-2749b4a263f3',
    '1dc81dd5-18c5-4032-801a-2749b4a263f3',
    'proj_corp_1dc81dd5-18c5-4032-801a-2749b4a263f3',
    'todo',
    'workday',
    'Revisió API (⚙️)',
    'Auditar endpoints, esquemes de seguretat i documentació de les APIs.',
    'medium',
    3,
    JSON.stringify(['dev', 'api']),
    1,
    0,
    0,
    0,
    'daily',
    'daily',
    1,
    JSON.stringify([0, 1, 2, 3, 4, 5, 6]),
    0,
    0,
    0,
    now,
    now,
    null
  );
  console.log('Inserted task for Gabriel');
} catch (e) {
  console.log('Gabriel task:', e.message);
}

try {
  // Test User
  insertTask.run(
    'habit_job_offers',
    'user_test_default',
    'proj_astra',
    'daily',
    'morning',
    'Verificar noves ofertes de feina (💼)',
    'Revisar alertes de noves posicions en LinkedIn i portals de feina.',
    'easy',
    2,
    JSON.stringify(['career', 'empleo']),
    1,
    0,
    0,
    0,
    'daily',
    'daily',
    1,
    JSON.stringify([0, 1, 2, 3, 4, 5, 6]),
    0,
    0,
    0,
    now,
    now,
    'Obrir LinkedIn i veure 1 oferta'
  );
  console.log('Inserted habit for testuser');
} catch (e) {
  console.log('Testuser habit:', e.message);
}

try {
  insertTask.run(
    'task_api_review',
    'user_test_default',
    'proj_astra',
    'todo',
    'workday',
    'Revisió API (⚙️)',
    'Auditar endpoints, esquemes de seguretat i documentació de les APIs.',
    'medium',
    3,
    JSON.stringify(['dev', 'api']),
    1,
    0,
    0,
    0,
    'daily',
    'daily',
    1,
    JSON.stringify([0, 1, 2, 3, 4, 5, 6]),
    0,
    0,
    0,
    now,
    now,
    null
  );
  console.log('Inserted task for testuser');
} catch (e) {
  console.log('Testuser task:', e.message);
}
