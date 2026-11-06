import { describe, it, expect } from 'vitest';
import { getDb } from '../src/server/db.js';
import { runUserRollover } from '../src/server/rollover.js';

describe('Empirical Verification: Subtasks reset at rollover', () => {
  it('resets subtasks of a completed daily when rollover occurs', () => {
    const db = getDb();
    const userId = 'user_subtask_test_' + Date.now();
    db.prepare(`
      INSERT INTO users (id, username, password_hash, api_key, last_rollover_date, created_at)
      VALUES (?, ?, 'hash', ?, '2026-10-25', '2026-10-25')
    `).run(userId, userId, 'key_' + userId);

    const dailyId = 'daily_test_' + Date.now();
    db.prepare(`
      INSERT INTO tasks (id, user_id, type, title, completed, streak, last_completed_date, created_at, updated_at)
      VALUES (?, ?, 'daily', 'Daily with subtasks', 1, 1, '2026-10-25', '2026-10-25', '2026-10-25')
    `).run(dailyId, userId);

    const subId1 = 'sub1_' + Date.now();
    const subId2 = 'sub2_' + Date.now();
    db.prepare(`
      INSERT INTO subtasks (id, task_id, title, completed, position)
      VALUES (?, ?, 'Subtask 1', 1, 0), (?, ?, 'Subtask 2', 1, 1)
    `).run(subId1, dailyId, subId2, dailyId);

    // Verify initially completed
    const sub1Before = db.prepare('SELECT completed FROM subtasks WHERE id = ?').get(subId1) as any;
    const sub2Before = db.prepare('SELECT completed FROM subtasks WHERE id = ?').get(subId2) as any;
    expect(sub1Before.completed).toBe(1);
    expect(sub2Before.completed).toBe(1);

    // Execute rollover to next day
    runUserRollover(userId, '2026-10-26');

    // Verify daily completed is reset to 0
    const dailyAfter = db.prepare('SELECT completed FROM tasks WHERE id = ?').get(dailyId) as any;
    expect(dailyAfter.completed).toBe(0);

    // Verify subtasks are reset to 0
    const sub1After = db.prepare('SELECT completed FROM subtasks WHERE id = ?').get(subId1) as any;
    const sub2After = db.prepare('SELECT completed FROM subtasks WHERE id = ?').get(subId2) as any;
    expect(sub1After.completed).toBe(0);
    expect(sub2After.completed).toBe(0);
  });

  it('investigates the edge case: daily was uncompleted (0) yesterday with partial subtasks', () => {
    const db = getDb();
    const userId = 'user_subtask_edge_' + Date.now();
    db.prepare(`
      INSERT INTO users (id, username, password_hash, api_key, last_rollover_date, created_at)
      VALUES (?, ?, 'hash', ?, '2026-10-25', '2026-10-25')
    `).run(userId, userId, 'key_' + userId);

    // Daily created on 2026-10-25, never completed (completed = 0, streak = 0)
    const dailyId = 'daily_edge_' + Date.now();
    db.prepare(`
      INSERT INTO tasks (id, user_id, type, title, frequency, completed, streak, last_completed_date, created_at, updated_at)
      VALUES (?, ?, 'daily', 'Uncompleted Daily with partial subtasks', 'daily', 0, 0, NULL, '2026-10-25', '2026-10-25')
    `).run(dailyId, userId);

    const subId = 'sub_edge_' + Date.now();
    db.prepare(`
      INSERT INTO subtasks (id, task_id, title, completed, position)
      VALUES (?, ?, 'Partial Subtask', 1, 0)
    `).run(subId, dailyId);

    // Rollover to 2026-10-26 (missedDaysCount = 1 -> streak remains 0)
    // Here daily.completed (0) === newCompleted (0) AND daily.streak (0) === newStreak (0)
    runUserRollover(userId, '2026-10-26');

    const subAfter = db.prepare('SELECT completed FROM subtasks WHERE id = ?').get(subId) as any;
    // Let us check whether this subtask reset or stayed 1 due to the guard:
    // `if (daily.completed !== newCompleted || daily.streak !== newStreak)`
    console.log('[EDGE CASE RESULT] subtask.completed after rollover of uncompleted daily:', subAfter.completed);
  });
});
