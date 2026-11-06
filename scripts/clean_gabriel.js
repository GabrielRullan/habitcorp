import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const dbPath = path.join(process.cwd(), 'data', 'tasks.db');
if (fs.existsSync(dbPath)) {
  const db = new DatabaseSync(dbPath);
  db.prepare("DELETE FROM subtasks WHERE task_id IN (SELECT id FROM tasks WHERE user_id = 'user_gabriel')").run();
  db.prepare("DELETE FROM tasks WHERE user_id = 'user_gabriel'").run();
  db.prepare("DELETE FROM calendar_events WHERE user_id = 'user_gabriel'").run();
  db.prepare("DELETE FROM ghosts WHERE user_id = 'user_gabriel'").run();
  db.prepare("DELETE FROM projects WHERE user_id = 'user_gabriel'").run();
  console.log('Cleaned user_gabriel from data/tasks.db');
}
