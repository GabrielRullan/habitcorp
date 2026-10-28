import crypto from 'node:crypto';
import { Router } from 'express';
import { getDb, DIFFICULTY_WEIGHTS } from '../db.js';
import { seedGabrielRoutines } from '../seedRoutines.js';
import {
  hashPassword,
  verifyPassword,
  generateApiKey,
  authMiddleware,
} from '../auth.js';
import { runUserRollover, getTodayDateString, isDailyDueOnDate } from '../rollover.js';
import { parseIcsContent, importEventsIntoDb } from '../ics.js';

export const apiRouter = Router();

export const VALID_TIME_OF_DAY = ['morning', 'workday', 'evening', 'anytime'] as const;
export type ValidTimeOfDay = (typeof VALID_TIME_OF_DAY)[number];

export function parseTimeOfDay(val: any): ValidTimeOfDay | null {
  if (typeof val !== 'string') return null;
  const clean = val.trim().toLowerCase();
  return (VALID_TIME_OF_DAY as readonly string[]).includes(clean) ? (clean as ValidTimeOfDay) : null;
}

// --- AUTH ROUTES ---

apiRouter.post('/auth/register', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'Username and password required.' });
    return;
  }

  const cleanUser = username.trim().toLowerCase();
  if (cleanUser.length < 3) {
    res.status(400).json({ error: 'Username must be at least 3 characters.' });
    return;
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(cleanUser);
  if (existing) {
    res.status(409).json({ error: 'Username already taken.' });
    return;
  }

  const userId = crypto.randomUUID();
  const apiKey = generateApiKey();
  const passwordHash = hashPassword(password);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO users (id, username, password_hash, api_key, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(userId, cleanUser, passwordHash, apiKey, now);

  res.status(201).json({
    id: userId,
    username: cleanUser,
    apiKey,
    message: 'User created successfully.',
  });
});

apiRouter.post('/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password required.' });
    return;
  }

  const db = getDb();
  const user = db.prepare('SELECT id, username, password_hash, api_key FROM users WHERE username = ?').get(
    username.trim().toLowerCase()
  ) as { id: string; username: string; password_hash: string; api_key: string } | undefined;

  if (!user || !verifyPassword(password, user.password_hash)) {
    res.status(401).json({ error: 'Invalid username or password.' });
    return;
  }

  res.json({
    id: user.id,
    username: user.username,
    apiKey: user.api_key,
  });
});

apiRouter.get('/auth/default-user', (req, res) => {
  const db = getDb();
  let user = db.prepare('SELECT id, username, api_key FROM users WHERE username = ?').get('testuser') as any;
  if (!user) {
    db.prepare(`
      INSERT INTO users (id, username, password_hash, api_key, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run('user_test_default', 'testuser', 'test_password_hash', 'tk_test_developer_key', new Date().toISOString());
    user = { id: 'user_test_default', username: 'testuser', api_key: 'tk_test_developer_key' };
  }
  res.json({
    id: user.id,
    username: user.username,
    apiKey: user.api_key,
  });
});

apiRouter.post('/auth/seed-routines', (req, res) => {
  const db = getDb();
  seedGabrielRoutines(db, 'user_test_default');
  res.json({ ok: true, message: 'Seeded Gabriel routines for testuser' });
});

// Passwordless Magic Link Login & Instant Account Creation
apiRouter.post('/auth/magic-link', (req, res) => {
  const { email } = req.body || {};
  if (!email || typeof email !== 'string') {
    res.status(400).json({ error: 'Valid email address or identifier is required.' });
    return;
  }

  const cleanEmail = email.trim().toLowerCase();
  const db = getDb();

  // Find user by email or username
  let user = db
    .prepare('SELECT id, username, email, api_key FROM users WHERE email = ? OR username = ?')
    .get(cleanEmail, cleanEmail) as any;

  // If user does not exist, auto-create account passwordlessly!
  if (!user) {
    const userId = crypto.randomUUID();
    const apiKey = generateApiKey();
    // Default username from email (e.g. alex@example.com -> alex)
    let baseUsername = cleanEmail.includes('@') ? cleanEmail.split('@')[0] : cleanEmail;
    baseUsername = baseUsername.replace(/[^a-z0-9_-]/gi, '').toLowerCase() || 'user';

    // Ensure uniqueness
    let finalUsername = baseUsername;
    let suffix = 1;
    while (db.prepare('SELECT id FROM users WHERE username = ?').get(finalUsername)) {
      finalUsername = `${baseUsername}${suffix++}`;
    }

    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO users (id, username, email, password_hash, api_key, created_at)
      VALUES (?, ?, ?, '', ?, ?)
    `).run(userId, finalUsername, cleanEmail.includes('@') ? cleanEmail : null, apiKey, now);

    user = { id: userId, username: finalUsername, email: cleanEmail, api_key: apiKey };
  }

  // Generate secure 15-minute token
  const token = `ml_${crypto.randomBytes(24).toString('hex')}`;
  const linkId = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString();

  db.prepare(`
    INSERT INTO magic_links (id, user_id, token, email, expires_at, used, created_at)
    VALUES (?, ?, ?, ?, ?, 0, ?)
  `).run(linkId, user.id, token, cleanEmail, expiresAt, now.toISOString());

  const magicUrl = `/?magic_token=${token}`;
  console.log(`\n======================================================`);
  console.log(`🔑 [Magic Link] Sign-in link for ${user.username} (${cleanEmail}):`);
  console.log(`🔗 Token: ${token}`);
  console.log(`🔗 URL:   ${magicUrl}`);
  console.log(`======================================================\n`);

  res.json({
    ok: true,
    message: 'Magic login link generated successfully.',
    token,
    url: magicUrl,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
    },
  });
});

apiRouter.post('/auth/verify-magic-link', (req, res) => {
  const { token } = req.body || {};
  if (!token || typeof token !== 'string') {
    res.status(400).json({ error: 'Magic link token required.' });
    return;
  }

  const cleanToken = token.trim();
  const db = getDb();
  const now = new Date().toISOString();

  const record = db
    .prepare(`
    SELECT id, user_id, token, expires_at, used
    FROM magic_links
    WHERE token = ?
  `)
    .get(cleanToken) as any;

  if (!record) {
    res.status(400).json({ error: 'Invalid or unrecognized magic link.' });
    return;
  }

  if (record.used === 1) {
    res.status(400).json({ error: 'This magic link has already been used.' });
    return;
  }

  if (record.expires_at < now) {
    res.status(400).json({ error: 'This magic link has expired. Please request a new one.' });
    return;
  }

  // Mark token as used
  db.prepare('UPDATE magic_links SET used = 1 WHERE id = ?').run(record.id);

  // Fetch user
  const user = db.prepare('SELECT id, username, email, api_key FROM users WHERE id = ?').get(record.user_id) as any;
  if (!user) {
    res.status(404).json({ error: 'User account not found.' });
    return;
  }

  res.json({
    ok: true,
    id: user.id,
    username: user.username,
    email: user.email,
    apiKey: user.api_key,
  });
});

// All following routes require authentication (via X-API-Key or Bearer token)
apiRouter.use(authMiddleware);

apiRouter.get('/auth/me', (req, res) => {
  res.json(req.user);
});

apiRouter.post('/auth/regenerate-key', (req, res) => {
  const newKey = generateApiKey();
  const db = getDb();
  db.prepare('UPDATE users SET api_key = ? WHERE id = ?').run(newKey, req.user!.id);
  res.json({ apiKey: newKey });
});

// --- HELPER TO FORMAT TASK WITH SUBTASKS ---
function getTaskWithSubtasks(taskId: string, userId: string) {
  const db = getDb();
  const task = db
    .prepare(`
      SELECT t.*, p.name AS project_name, p.color AS project_color
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.id = ? AND t.user_id = ?
    `)
    .get(taskId, userId) as any;
  if (!task) return null;
  const subtasks = db.prepare('SELECT * FROM subtasks WHERE task_id = ? ORDER BY position ASC').all(taskId);
  const today = getTodayDateString();
  let is_due_today = false;
  if (task.type === 'daily') {
    is_due_today = isDailyDueOnDate(task, today);
  } else if (task.due_date) {
    is_due_today = task.due_date.slice(0, 10) <= today && !task.completed;
  }
  return {
    ...task,
    time_of_day: task.time_of_day || 'anytime',
    tags: JSON.parse(task.tags || '[]'),
    repeat_days: JSON.parse(task.repeat_days || '[]'),
    subtasks,
    is_due_today,
  };
}

// --- TASK ROUTES ---

apiRouter.get('/tasks', (req, res) => {
  const userId = req.user!.id;
  runUserRollover(userId);
  const db = getDb();

  const { type, difficulty, completed, has_timeline, scheduled_date, search, tag, project_id, time_of_day } = req.query;

  let query = `
    SELECT t.*, p.name AS project_name, p.color AS project_color
    FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    WHERE t.user_id = ?
  `;
  const params: any[] = [userId];

  if (project_id) {
    query += ' AND t.project_id = ?';
    params.push(project_id);
  }

  if (time_of_day !== undefined && time_of_day !== '') {
    const parsedTod = parseTimeOfDay(time_of_day);
    if (!parsedTod) {
      res.status(400).json({
        error: "Invalid time_of_day query parameter. Must be one of: 'morning', 'workday', 'evening', 'anytime'.",
      });
      return;
    }
    query += ' AND t.time_of_day = ?';
    params.push(parsedTod);
  }

  if (type) {
    query += ' AND t.type = ?';
    params.push(type);
  }

  if (difficulty) {
    query += ' AND t.difficulty = ?';
    params.push(difficulty);
  }

  if (completed !== undefined) {
    query += ' AND t.completed = ?';
    params.push(completed === 'true' || completed === '1' ? 1 : 0);
  }

  if (has_timeline === 'true') {
    query += ' AND (t.due_date IS NOT NULL OR t.start_date IS NOT NULL)';
  } else if (has_timeline === 'false') {
    query += ' AND t.due_date IS NULL AND t.start_date IS NULL';
  }

  if (scheduled_date) {
    query += ' AND t.scheduled_date = ?';
    params.push(scheduled_date);
  }

  if (search && typeof search === 'string') {
    query += ' AND (t.title LIKE ? OR t.notes LIKE ?)';
    params.push(`%${search.trim()}%`, `%${search.trim()}%`);
  }

  query += ' ORDER BY t.created_at DESC';

  const rows = db.prepare(query).all(...params) as any[];

  // Fetch all subtasks for these tasks in one go
  const taskIds = rows.map((r) => r.id);
  const subtasksByTaskId: Record<string, any[]> = {};
  if (taskIds.length > 0) {
    const placeholders = taskIds.map(() => '?').join(',');
    const allSubtasks = db
      .prepare(`SELECT * FROM subtasks WHERE task_id IN (${placeholders}) ORDER BY position ASC`)
      .all(...taskIds) as any[];
    for (const sub of allSubtasks) {
      if (!subtasksByTaskId[sub.task_id]) subtasksByTaskId[sub.task_id] = [];
      subtasksByTaskId[sub.task_id].push(sub);
    }
  }

  const today = getTodayDateString();
  const formatted = rows
    .map((r) => {
      let is_due_today = false;
      if (r.type === 'daily') {
        is_due_today = isDailyDueOnDate(r, today);
      } else if (r.due_date) {
        is_due_today = r.due_date.slice(0, 10) <= today && !r.completed;
      }
      return {
        ...r,
        time_of_day: r.time_of_day || 'anytime',
        tags: JSON.parse(r.tags || '[]'),
        repeat_days: JSON.parse(r.repeat_days || '[]'),
        subtasks: subtasksByTaskId[r.id] || [],
        is_due_today,
      };
    })
    .filter((task) => {
      if (tag && typeof tag === 'string') {
        return task.tags.includes(tag);
      }
      return true;
    });

  res.json({ tasks: formatted });
});

apiRouter.post('/tasks', (req, res) => {
  const userId = req.user!.id;
  const db = getDb();
  const b = req.body || {};

  if (!b.title || typeof b.title !== 'string' || !b.title.trim()) {
    res.status(400).json({ error: 'Title is required.' });
    return;
  }

  const taskId = crypto.randomUUID();
  const type = ['habit', 'daily', 'todo'].includes(b.type) ? b.type : 'todo';
  const difficulty = ['trivial', 'easy', 'medium', 'hard'].includes(b.difficulty)
    ? b.difficulty
    : 'easy';
  const weight = DIFFICULTY_WEIGHTS[difficulty] || 2;
  const now = new Date().toISOString();

  const habitPositive = b.habit_positive !== undefined ? (b.habit_positive ? 1 : 0) : 1;
  const habitNegative = b.habit_negative !== undefined ? (b.habit_negative ? 1 : 0) : 0;
  const habitResetPeriod = ['daily', 'weekly', 'monthly'].includes(b.habit_reset_period)
    ? b.habit_reset_period
    : 'daily';

  const frequency = ['daily', 'weekly', 'every_n_days', 'monthly'].includes(b.frequency)
    ? b.frequency
    : 'daily';
  const repeatInterval = Number(b.repeat_interval) || 1;
  const repeatDays = JSON.stringify(
    Array.isArray(b.repeat_days) ? b.repeat_days : [0, 1, 2, 3, 4, 5, 6]
  );
  const tags = JSON.stringify(Array.isArray(b.tags) ? b.tags : []);
  const projectId = b.project_id || null;

  let timeOfDay: ValidTimeOfDay = 'anytime';
  if (b.time_of_day !== undefined && b.time_of_day !== null) {
    const parsed = parseTimeOfDay(b.time_of_day);
    if (!parsed) {
      res.status(400).json({
        error: "Invalid time_of_day. Must be one of: 'morning', 'workday', 'evening', 'anytime'.",
      });
      return;
    }
    timeOfDay = parsed;
  }

  db.prepare(`
    INSERT INTO tasks (
      id, user_id, project_id, type, title, notes, difficulty, difficulty_weight, tags,
      time_of_day,
      habit_positive, habit_negative, counter_up, counter_down, habit_reset_period,
      frequency, repeat_interval, repeat_days, streak, best_streak, completed,
      start_date, due_date, scheduled_date, scheduled_start, scheduled_duration,
      created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?,
      ?, ?, 0, 0, ?,
      ?, ?, ?, 0, 0, 0,
      ?, ?, ?, ?, ?,
      ?, ?
    )
  `).run(
    taskId,
    userId,
    projectId,
    type,
    b.title.trim(),
    b.notes || '',
    difficulty,
    weight,
    tags,
    timeOfDay,
    habitPositive,
    habitNegative,
    habitResetPeriod,
    frequency,
    repeatInterval,
    repeatDays,
    b.start_date || null,
    b.due_date || null,
    b.scheduled_date || null,
    b.scheduled_start || null,
    Number(b.scheduled_duration) || 30,
    now,
    now
  );

  // Insert subtasks if provided inline (e.g. from agent: subtasks: ["Step 1", "Step 2"])
  if (Array.isArray(b.subtasks)) {
    const insertSub = db.prepare(`
      INSERT INTO subtasks (id, task_id, title, completed, position)
      VALUES (?, ?, ?, 0, ?)
    `);
    b.subtasks.forEach((sub: any, idx: number) => {
      const title = typeof sub === 'string' ? sub : sub?.title;
      if (title && typeof title === 'string' && title.trim()) {
        insertSub.run(crypto.randomUUID(), taskId, title.trim(), idx);
      }
    });
  }

  const created = getTaskWithSubtasks(taskId, userId);
  res.status(201).json(created);
});

// Batch task creation endpoint (agent-friendly)
apiRouter.post('/tasks/batch', (req, res) => {
  const userId = req.user!.id;
  const db = getDb();
  const tasks = req.body?.tasks;

  if (!Array.isArray(tasks) || tasks.length === 0) {
    res.status(400).json({ error: 'Array of tasks required in { tasks: [...] }' });
    return;
  }

  const createdIds: string[] = [];
  const now = new Date().toISOString();

  for (const b of tasks) {
    if (!b.title) continue;
    const taskId = crypto.randomUUID();
    const type = ['habit', 'daily', 'todo'].includes(b.type) ? b.type : 'todo';
    const difficulty = ['trivial', 'easy', 'medium', 'hard'].includes(b.difficulty)
      ? b.difficulty
      : 'easy';
    const weight = DIFFICULTY_WEIGHTS[difficulty] || 2;
    const timeOfDay = parseTimeOfDay(b.time_of_day) || 'anytime';

    db.prepare(`
      INSERT INTO tasks (
        id, user_id, project_id, type, title, notes, difficulty, difficulty_weight, tags,
        time_of_day,
        habit_positive, habit_negative, counter_up, counter_down, habit_reset_period,
        frequency, repeat_interval, repeat_days, streak, best_streak, completed,
        start_date, due_date, scheduled_date, scheduled_start, scheduled_duration,
        created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?,
        ?, ?, 0, 0, ?,
        ?, ?, ?, 0, 0, 0,
        ?, ?, ?, ?, ?,
        ?, ?
      )
    `).run(
      taskId,
      userId,
      b.project_id || null,
      type,
      b.title.trim(),
      b.notes || '',
      difficulty,
      weight,
      JSON.stringify(b.tags || []),
      timeOfDay,
      b.habit_positive !== undefined ? (b.habit_positive ? 1 : 0) : 1,
      b.habit_negative !== undefined ? (b.habit_negative ? 1 : 0) : 0,
      b.habit_reset_period || 'daily',
      b.frequency || 'daily',
      b.repeat_interval || 1,
      JSON.stringify(b.repeat_days || [0, 1, 2, 3, 4, 5, 6]),
      b.start_date || null,
      b.due_date || null,
      b.scheduled_date || null,
      b.scheduled_start || null,
      Number(b.scheduled_duration) || 30,
      now,
      now
    );

    if (Array.isArray(b.subtasks)) {
      const insertSub = db.prepare(`
        INSERT INTO subtasks (id, task_id, title, completed, position)
        VALUES (?, ?, ?, 0, ?)
      `);
      b.subtasks.forEach((sub: any, idx: number) => {
        const title = typeof sub === 'string' ? sub : sub?.title;
        if (title) insertSub.run(crypto.randomUUID(), taskId, title.trim(), idx);
      });
    }

    createdIds.push(taskId);
  }

  const createdTasks = createdIds.map((id) => getTaskWithSubtasks(id, userId));
  res.status(201).json({ created_count: createdTasks.length, tasks: createdTasks });
});

apiRouter.get('/tasks/:id', (req, res) => {
  const task = getTaskWithSubtasks(req.params.id, req.user!.id);
  if (!task) {
    res.status(404).json({ error: 'Task not found.' });
    return;
  }
  res.json(task);
});

apiRouter.patch('/tasks/:id', (req, res) => {
  const userId = req.user!.id;
  const taskId = req.params.id;
  const db = getDb();
  const current = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(taskId, userId) as any;

  if (!current) {
    res.status(404).json({ error: 'Task not found.' });
    return;
  }

  const b = req.body || {};
  const updates: string[] = ['updated_at = ?'];
  const values: any[] = [new Date().toISOString()];

  if (b.title !== undefined) {
    updates.push('title = ?');
    values.push(b.title.trim());
  }
  if (b.notes !== undefined) {
    updates.push('notes = ?');
    values.push(b.notes);
  }
  if (b.project_id !== undefined) {
    updates.push('project_id = ?');
    values.push(b.project_id || null);
  }
  if (b.time_of_day !== undefined) {
    const parsed = parseTimeOfDay(b.time_of_day);
    if (!parsed) {
      res.status(400).json({
        error: "Invalid time_of_day. Must be one of: 'morning', 'workday', 'evening', 'anytime'.",
      });
      return;
    }
    updates.push('time_of_day = ?');
    values.push(parsed);
  }
  if (b.difficulty !== undefined && ['trivial', 'easy', 'medium', 'hard'].includes(b.difficulty)) {
    updates.push('difficulty = ?');
    values.push(b.difficulty);
    updates.push('difficulty_weight = ?');
    values.push(DIFFICULTY_WEIGHTS[b.difficulty] || 2);
  }
  if (b.tags !== undefined) {
    updates.push('tags = ?');
    values.push(JSON.stringify(Array.isArray(b.tags) ? b.tags : []));
  }
  if (b.habit_positive !== undefined) {
    updates.push('habit_positive = ?');
    values.push(b.habit_positive ? 1 : 0);
  }
  if (b.habit_negative !== undefined) {
    updates.push('habit_negative = ?');
    values.push(b.habit_negative ? 1 : 0);
  }
  if (b.habit_reset_period !== undefined) {
    updates.push('habit_reset_period = ?');
    values.push(b.habit_reset_period);
  }
  if (b.frequency !== undefined) {
    updates.push('frequency = ?');
    values.push(b.frequency);
  }
  if (b.repeat_interval !== undefined) {
    updates.push('repeat_interval = ?');
    values.push(Math.max(1, Number(b.repeat_interval) || 1));
  }
  if (b.repeat_days !== undefined) {
    updates.push('repeat_days = ?');
    values.push(JSON.stringify(b.repeat_days));
  }
  if (b.start_date !== undefined) {
    updates.push('start_date = ?');
    values.push(b.start_date || null);
  }
  if (b.due_date !== undefined) {
    updates.push('due_date = ?');
    values.push(b.due_date || null);
  }
  if (b.scheduled_date !== undefined) {
    updates.push('scheduled_date = ?');
    values.push(b.scheduled_date || null);
  }
  if (b.scheduled_start !== undefined) {
    updates.push('scheduled_start = ?');
    values.push(b.scheduled_start || null);
  }
  if (b.scheduled_duration !== undefined) {
    updates.push('scheduled_duration = ?');
    values.push(Number(b.scheduled_duration) || 30);
  }
  if (b.completed !== undefined) {
    updates.push('completed = ?');
    const isCompleted = b.completed ? 1 : 0;
    values.push(isCompleted);
    updates.push('completed_at = ?');
    values.push(isCompleted ? new Date().toISOString() : null);
  }

  values.push(taskId, userId);
  db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`).run(...values);

  // If subtasks array provided, replace or update
  if (Array.isArray(b.subtasks)) {
    db.prepare('DELETE FROM subtasks WHERE task_id = ?').run(taskId);
    const insertSub = db.prepare(`
      INSERT INTO subtasks (id, task_id, title, completed, position)
      VALUES (?, ?, ?, ?, ?)
    `);
    b.subtasks.forEach((sub: any, idx: number) => {
      const title = typeof sub === 'string' ? sub : sub?.title;
      const isDone = typeof sub === 'object' && sub?.completed ? 1 : 0;
      if (title) insertSub.run(crypto.randomUUID(), taskId, title.trim(), isDone, idx);
    });
  }

  const updated = getTaskWithSubtasks(taskId, userId);
  res.json(updated);
});

apiRouter.delete('/tasks/:id', (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(
    req.params.id,
    req.user!.id
  );
  if (result.changes === 0) {
    res.status(404).json({ error: 'Task not found.' });
    return;
  }
  res.json({ message: 'Task deleted successfully.' });
});

// Scoring / Action Trigger Endpoint
apiRouter.post('/tasks/:id/score', (req, res) => {
  const userId = req.user!.id;
  const taskId = req.params.id;
  const db = getDb();
  const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(taskId, userId) as any;

  if (!task) {
    res.status(404).json({ error: 'Task not found.' });
    return;
  }

  const today = getTodayDateString();
  const now = new Date().toISOString();
  const direction = req.body?.direction || 'up'; // 'up' or 'down'

  if (task.type === 'habit') {
    if (direction === 'up') {
      db.prepare('UPDATE tasks SET counter_up = counter_up + 1, updated_at = ? WHERE id = ?').run(now, taskId);
    } else {
      db.prepare('UPDATE tasks SET counter_down = counter_down + 1, updated_at = ? WHERE id = ?').run(now, taskId);
    }
  } else if (task.type === 'daily') {
    const isCompleted = task.completed === 1;
    if (!isCompleted) {
      const newStreak = task.streak + 1;
      const newBest = Math.max(task.best_streak, newStreak);
      db.prepare(`
        UPDATE tasks SET
          completed = 1,
          streak = ?,
          best_streak = ?,
          last_completed_date = ?,
          completed_at = ?,
          updated_at = ?
        WHERE id = ?
      `).run(newStreak, newBest, today, now, now, taskId);
    } else {
      const newStreak = Math.max(0, task.streak - 1);
      db.prepare(`
        UPDATE tasks SET
          completed = 0,
          streak = ?,
          last_completed_date = null,
          completed_at = null,
          updated_at = ?
        WHERE id = ?
      `).run(newStreak, now, taskId);
    }
  } else {
    // Todo (Timed or Untimed)
    const newStatus = task.completed === 1 ? 0 : 1;
    db.prepare(`
      UPDATE tasks SET
        completed = ?,
        completed_at = ?,
        updated_at = ?
      WHERE id = ?
    `).run(newStatus, newStatus === 1 ? now : null, now, taskId);
  }

  db.prepare(`
    INSERT INTO activity_logs (id, user_id, task_id, action, details, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(crypto.randomUUID(), userId, taskId, `score_${direction}`, task.type, now);

  const updated = getTaskWithSubtasks(taskId, userId);
  res.json(updated);
});

// Subtask specific endpoints
apiRouter.post('/tasks/:id/subtasks', (req, res) => {
  const userId = req.user!.id;
  const taskId = req.params.id;
  const db = getDb();
  const task = db.prepare('SELECT id FROM tasks WHERE id = ? AND user_id = ?').get(taskId, userId);
  if (!task) {
    res.status(404).json({ error: 'Task not found.' });
    return;
  }

  const title = req.body?.title;
  if (!title || typeof title !== 'string' || !title.trim()) {
    res.status(400).json({ error: 'Title required.' });
    return;
  }

  const subId = crypto.randomUUID();
  const countRow = db.prepare('SELECT COUNT(*) as cnt FROM subtasks WHERE task_id = ?').get(taskId) as any;
  const position = countRow?.cnt || 0;

  db.prepare(`
    INSERT INTO subtasks (id, task_id, title, completed, position)
    VALUES (?, ?, ?, 0, ?)
  `).run(subId, taskId, title.trim(), position);

  res.status(201).json({ id: subId, task_id: taskId, title: title.trim(), completed: 0, position });
});

apiRouter.patch('/subtasks/:id', (req, res) => {
  const db = getDb();
  const subtask = db.prepare(`
    SELECT s.*, t.user_id FROM subtasks s
    JOIN tasks t ON s.task_id = t.id
    WHERE s.id = ? AND t.user_id = ?
  `).get(req.params.id, req.user!.id) as any;

  if (!subtask) {
    res.status(404).json({ error: 'Subtask not found.' });
    return;
  }

  const b = req.body || {};
  const newTitle = b.title !== undefined ? b.title.trim() : subtask.title;
  const newDone = b.completed !== undefined ? (b.completed ? 1 : 0) : subtask.completed;

  db.prepare('UPDATE subtasks SET title = ?, completed = ? WHERE id = ?').run(
    newTitle,
    newDone,
    req.params.id
  );

  res.json({ id: req.params.id, title: newTitle, completed: newDone });
});

apiRouter.delete('/subtasks/:id', (req, res) => {
  const db = getDb();
  const subtask = db.prepare(`
    SELECT s.*, t.user_id FROM subtasks s
    JOIN tasks t ON s.task_id = t.id
    WHERE s.id = ? AND t.user_id = ?
  `).get(req.params.id, req.user!.id) as any;

  if (!subtask) {
    res.status(404).json({ error: 'Subtask not found.' });
    return;
  }

  db.prepare('DELETE FROM subtasks WHERE id = ?').run(req.params.id);
  res.json({ message: 'Subtask deleted.' });
});

// --- AGENDA & CALENDAR ROUTES ---

apiRouter.get('/agenda', (req, res) => {
  const userId = req.user!.id;
  runUserRollover(userId);
  const db = getDb();

  const start = (req.query.start as string) || getTodayDateString();
  const end = (req.query.end as string) || start;

  // 1. Fetch Calendar Meetings overlapping with the requested date range
  const startTimeIso = `${start}T00:00:00.000Z`;
  const endTimeIso = `${end}T23:59:59.999Z`;

  const meetings = db.prepare(`
    SELECT * FROM calendar_events
    WHERE user_id = ? AND (
      (start_time >= ? AND start_time <= ?) OR
      (end_time >= ? AND end_time <= ?) OR
      (start_time <= ? AND end_time >= ?)
    )
    ORDER BY start_time ASC
  `).all(userId, startTimeIso, endTimeIso, startTimeIso, endTimeIso, startTimeIso, endTimeIso);

  // 2. Fetch Time-Blocked Tasks scheduled in this date range
  const scheduledTasksRows = db.prepare(`
    SELECT * FROM tasks
    WHERE user_id = ? AND scheduled_date >= ? AND scheduled_date <= ?
    ORDER BY scheduled_start ASC, created_at ASC
  `).all(userId, start, end) as any[];

  const taskIds = scheduledTasksRows.map((t) => t.id);
  const subtasksMap: Record<string, any[]> = {};
  if (taskIds.length > 0) {
    const placeholders = taskIds.map(() => '?').join(',');
    const subs = db.prepare(`SELECT * FROM subtasks WHERE task_id IN (${placeholders}) ORDER BY position ASC`).all(...taskIds) as any[];
    for (const s of subs) {
      if (!subtasksMap[s.task_id]) subtasksMap[s.task_id] = [];
      subtasksMap[s.task_id].push(s);
    }
  }

  const scheduledTasks = scheduledTasksRows.map((t) => ({
    ...t,
    time_of_day: t.time_of_day || 'anytime',
    tags: JSON.parse(t.tags || '[]'),
    repeat_days: JSON.parse(t.repeat_days || '[]'),
    subtasks: subtasksMap[t.id] || [],
  }));

  const ghosts = db.prepare('SELECT * FROM ghosts WHERE user_id = ? ORDER BY created_at ASC').all(userId);

  res.json({
    date_range: { start, end },
    meetings,
    scheduled_tasks: scheduledTasks,
    ghosts,
  });
});

apiRouter.get('/meetings', (req, res) => {
  const userId = req.user!.id;
  const db = getDb();
  const start = req.query.start as string;
  const end = req.query.end as string;

  let query = 'SELECT * FROM calendar_events WHERE user_id = ?';
  const params: any[] = [userId];

  if (start && end) {
    query += ' AND start_time >= ? AND start_time <= ?';
    params.push(`${start}T00:00:00.000Z`, `${end}T23:59:59.999Z`);
  }

  query += ' ORDER BY start_time ASC';
  const meetings = db.prepare(query).all(...params);
  res.json({ meetings });
});

apiRouter.post('/meetings', (req, res) => {
  const userId = req.user!.id;
  const db = getDb();
  const b = req.body || {};

  if (!b.title || !b.start_time || !b.end_time) {
    res.status(400).json({ error: 'title, start_time, and end_time are required.' });
    return;
  }

  const meetingId = crypto.randomUUID();
  const now = new Date().toISOString();
  const isGhost = b.is_ghost ? 1 : 0;
  const ghostId = b.ghost_id || null;
  const ghostName = b.ghost_name || '';

  db.prepare(`
    INSERT INTO calendar_events (
      id, user_id, source_id, ghost_id, is_ghost, ghost_name, external_uid, title, description, location,
      meeting_url, start_time, end_time, all_day, color, created_at
    ) VALUES (?, ?, null, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    meetingId,
    userId,
    ghostId,
    isGhost,
    ghostName,
    crypto.randomUUID(),
    b.title.trim(),
    b.description || '',
    b.location || '',
    b.meeting_url || '',
    b.start_time,
    b.end_time,
    b.all_day ? 1 : 0,
    b.color || (isGhost ? '#ec4899' : '#6366f1'),
    now
  );

  const created = db.prepare('SELECT * FROM calendar_events WHERE id = ?').get(meetingId);
  res.status(201).json(created);
});

apiRouter.patch('/meetings/:id', (req, res) => {
  const userId = req.user!.id;
  const db = getDb();
  const current = db.prepare('SELECT * FROM calendar_events WHERE id = ? AND user_id = ?').get(req.params.id, userId);
  if (!current) {
    res.status(404).json({ error: 'Meeting not found.' });
    return;
  }

  const b = req.body || {};
  const updates: string[] = [];
  const values: any[] = [];

  ['title', 'description', 'location', 'meeting_url', 'start_time', 'end_time', 'color'].forEach((field) => {
    if (b[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(b[field]);
    }
  });

  if (b.all_day !== undefined) {
    updates.push('all_day = ?');
    values.push(b.all_day ? 1 : 0);
  }

  if (updates.length > 0) {
    values.push(req.params.id, userId);
    db.prepare(`UPDATE calendar_events SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`).run(...values);
  }

  const updated = db.prepare('SELECT * FROM calendar_events WHERE id = ?').get(req.params.id);
  res.json(updated);
});

apiRouter.delete('/meetings/:id', (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM calendar_events WHERE id = ? AND user_id = ?').run(
    req.params.id,
    req.user!.id
  );
  if (result.changes === 0) {
    res.status(404).json({ error: 'Meeting not found.' });
    return;
  }
  res.json({ success: true, message: 'Meeting deleted.' });
});

// Calendar Feeds (ICS) Management
apiRouter.get('/calendars', (req, res) => {
  const db = getDb();
  const feeds = db.prepare('SELECT * FROM calendar_sources WHERE user_id = ? ORDER BY created_at ASC').all(req.user!.id);
  res.json({ calendars: feeds });
});

apiRouter.post('/calendars', async (req, res) => {
  const userId = req.user!.id;
  const db = getDb();
  const { name, ics_url, color } = req.body || {};

  if (!name || !ics_url) {
    res.status(400).json({ error: 'name and ics_url are required.' });
    return;
  }

  const sourceId = crypto.randomUUID();
  const hexColor = color || '#6366f1';
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO calendar_sources (id, user_id, name, ics_url, color, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(sourceId, userId, name.trim(), ics_url.trim(), hexColor, now);

  // Attempt initial sync immediately
  let syncedEventsCount = 0;
  try {
    const response = await fetch(ics_url.trim());
    if (response.ok) {
      const text = await response.text();
      const events = parseIcsContent(text);
      syncedEventsCount = importEventsIntoDb(userId, sourceId, hexColor, events);
    }
  } catch (err) {
    console.error('Initial calendar sync error:', err);
  }

  const feed = db.prepare('SELECT * FROM calendar_sources WHERE id = ?').get(sourceId);
  res.status(201).json({ ...feed, synced_events_count: syncedEventsCount });
});

apiRouter.post('/calendars/:id/sync', async (req, res) => {
  const userId = req.user!.id;
  const db = getDb();
  const feed = db.prepare('SELECT * FROM calendar_sources WHERE id = ? AND user_id = ?').get(req.params.id, userId) as any;

  if (!feed) {
    res.status(404).json({ error: 'Calendar source not found.' });
    return;
  }

  try {
    const response = await fetch(feed.ics_url);
    if (!response.ok) {
      res.status(502).json({ error: `Failed to fetch ICS feed: HTTP ${response.status}` });
      return;
    }
    const text = await response.text();
    const events = parseIcsContent(text);
    const count = importEventsIntoDb(userId, feed.id, feed.color, events);
    res.json({ message: 'Calendar synced successfully.', count });
  } catch (err: any) {
    res.status(500).json({ error: `Sync failed: ${err.message}` });
  }
});

// Import raw ICS text directly (e.g. file upload or manual paste)
apiRouter.post('/calendars/import-ics', (req, res) => {
  const userId = req.user!.id;
  const { ics_text, color } = req.body || {};

  if (!ics_text || typeof ics_text !== 'string') {
    res.status(400).json({ error: 'ics_text string required.' });
    return;
  }

  const events = parseIcsContent(ics_text);
  const count = importEventsIntoDb(userId, null, color || '#6366f1', events);
  res.json({ message: 'ICS imported successfully.', count });
});

apiRouter.delete('/calendars/:id', (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM calendar_sources WHERE id = ? AND user_id = ?').run(
    req.params.id,
    req.user!.id
  );
  if (result.changes === 0) {
    res.status(404).json({ error: 'Calendar source not found.' });
    return;
  }
  res.json({ message: 'Calendar feed deleted.' });
});

// --- GHOSTS (External People: Spouse, Children, Roommates, etc.) ---

apiRouter.get('/ghosts', (req, res) => {
  const db = getDb();
  const ghosts = db.prepare('SELECT * FROM ghosts WHERE user_id = ? ORDER BY created_at ASC').all(req.user!.id);
  res.json({ ghosts });
});

apiRouter.post('/ghosts', async (req, res) => {
  const userId = req.user!.id;
  const db = getDb();
  const { name, relation, color, ics_url } = req.body || {};

  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ error: 'Ghost name is required.' });
    return;
  }

  const ghostId = crypto.randomUUID();
  const hexColor = color || '#ec4899';
  const now = new Date().toISOString();
  const url = (ics_url || '').trim();

  db.prepare(`
    INSERT INTO ghosts (id, user_id, name, relation, color, ics_url, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(ghostId, userId, name.trim(), (relation || '').trim(), hexColor, url, now);

  let syncedEventsCount = 0;
  if (url) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const text = await response.text();
        const events = parseIcsContent(text);
        syncedEventsCount = importEventsIntoDb(userId, null, hexColor, events, {
          ghostId,
          ghostName: name.trim(),
        });
      }
    } catch (err) {
      console.error('Initial ghost calendar sync error:', err);
    }
  }

  const created = db.prepare('SELECT * FROM ghosts WHERE id = ?').get(ghostId);
  res.status(201).json({ ...created, synced_events_count: syncedEventsCount });
});

apiRouter.patch('/ghosts/:id', async (req, res) => {
  const userId = req.user!.id;
  const db = getDb();
  const ghost = db.prepare('SELECT * FROM ghosts WHERE id = ? AND user_id = ?').get(req.params.id, userId) as any;

  if (!ghost) {
    res.status(404).json({ error: 'Ghost not found.' });
    return;
  }

  const b = req.body || {};
  const updates: string[] = [];
  const values: any[] = [];

  ['name', 'relation', 'color', 'ics_url'].forEach((field) => {
    if (b[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(b[field]);
    }
  });

  if (updates.length > 0) {
    values.push(req.params.id, userId);
    db.prepare(`UPDATE ghosts SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`).run(...values);
  }

  const updated = db.prepare('SELECT * FROM ghosts WHERE id = ?').get(req.params.id);
  res.json(updated);
});

apiRouter.post('/ghosts/:id/sync', async (req, res) => {
  const userId = req.user!.id;
  const db = getDb();
  const ghost = db.prepare('SELECT * FROM ghosts WHERE id = ? AND user_id = ?').get(req.params.id, userId) as any;

  if (!ghost) {
    res.status(404).json({ error: 'Ghost not found.' });
    return;
  }

  if (!ghost.ics_url) {
    res.status(400).json({ error: 'Ghost does not have an ICS URL configured.' });
    return;
  }

  try {
    const response = await fetch(ghost.ics_url);
    if (!response.ok) {
      res.status(502).json({ error: `Failed to fetch Ghost ICS feed: HTTP ${response.status}` });
      return;
    }
    const text = await response.text();
    const events = parseIcsContent(text);
    const count = importEventsIntoDb(userId, null, ghost.color, events, {
      ghostId: ghost.id,
      ghostName: ghost.name,
    });
    res.json({ message: 'Ghost calendar synced successfully.', count });
  } catch (err: any) {
    res.status(500).json({ error: `Sync failed: ${err.message}` });
  }
});

apiRouter.delete('/ghosts/:id', (req, res) => {
  const db = getDb();
  // Delete ghost events first
  db.prepare('DELETE FROM calendar_events WHERE ghost_id = ? AND user_id = ?').run(
    req.params.id,
    req.user!.id
  );
  const result = db.prepare('DELETE FROM ghosts WHERE id = ? AND user_id = ?').run(
    req.params.id,
    req.user!.id
  );
  if (result.changes === 0) {
    res.status(404).json({ error: 'Ghost not found.' });
    return;
  }
  res.json({ message: 'Ghost deleted.' });
});

// --- PROJECT ROUTES ---

apiRouter.get('/projects', (req, res) => {
  const userId = req.user!.id;
  const db = getDb();
  const projects = db.prepare(`
    SELECT p.*,
      COUNT(t.id) AS total_tasks,
      SUM(CASE WHEN t.completed = 1 THEN 1 ELSE 0 END) AS completed_tasks
    FROM projects p
    LEFT JOIN tasks t ON p.id = t.project_id AND t.user_id = p.user_id
    WHERE p.user_id = ?
    GROUP BY p.id
    ORDER BY p.name ASC
  `).all(userId);
  res.json({ projects });
});

apiRouter.post('/projects', (req, res) => {
  const userId = req.user!.id;
  const db = getDb();
  const { name, color, icon } = req.body || {};

  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ error: 'Project name is required.' });
    return;
  }

  const id = crypto.randomUUID();
  const hexColor = color && typeof color === 'string' ? color : '#6366f1';
  const iconName = icon && typeof icon === 'string' ? icon : 'folder';
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO projects (id, user_id, name, color, icon, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, userId, name.trim(), hexColor, iconName, now);

  const created = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  res.status(201).json(created);
});

apiRouter.patch('/projects/:id', (req, res) => {
  const userId = req.user!.id;
  const db = getDb();
  const project = db.prepare('SELECT * FROM projects WHERE id = ? AND user_id = ?').get(req.params.id, userId) as any;

  if (!project) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }

  const b = req.body || {};
  const updates: string[] = [];
  const values: any[] = [];

  if (b.name !== undefined && typeof b.name === 'string' && b.name.trim()) {
    updates.push('name = ?');
    values.push(b.name.trim());
  }
  if (b.color !== undefined && typeof b.color === 'string') {
    updates.push('color = ?');
    values.push(b.color);
  }
  if (b.icon !== undefined && typeof b.icon === 'string') {
    updates.push('icon = ?');
    values.push(b.icon);
  }

  if (updates.length > 0) {
    values.push(req.params.id, userId);
    db.prepare(`UPDATE projects SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`).run(...values);
  }

  const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  res.json(updated);
});

apiRouter.delete('/projects/:id', (req, res) => {
  const userId = req.user!.id;
  const db = getDb();
  // Unlink tasks first
  db.prepare('UPDATE tasks SET project_id = NULL WHERE project_id = ? AND user_id = ?').run(req.params.id, userId);
  const result = db.prepare('DELETE FROM projects WHERE id = ? AND user_id = ?').run(req.params.id, userId);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }
  res.json({ message: 'Project deleted.' });
});

// --- OPENAPI SPEC FOR AGENTS ---
apiRouter.get('/openapi.json', (req, res) => {
  res.json({
    openapi: '3.1.0',
    info: {
      title: 'Cadence Task & Habit Manager API',
      version: '1.0.0',
      description:
        'Non-gamified productivity platform combining Habits (+/- counters), Periodical Dailies (streaks), Timed Tasks, Untimed Backlog Tasks with 4-tier difficulty, Subtasks, Calendar Meetings, and Agenda Time-Blocking.',
    },
    servers: [{ url: '/api/v1' }],
    security: [{ ApiKeyAuth: [] }, { BearerAuth: [] }],
    components: {
      securitySchemes: {
        ApiKeyAuth: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
        BearerAuth: { type: 'http', scheme: 'bearer' },
      },
    },
    paths: {
      '/tasks': {
        get: {
          summary: 'List tasks with filters',
          parameters: [
            { name: 'type', in: 'query', schema: { type: 'string', enum: ['habit', 'daily', 'todo'] } },
            { name: 'time_of_day', in: 'query', description: 'Filter tasks and habits by WFH routine time of day', schema: { type: 'string', enum: ['morning', 'workday', 'evening', 'anytime'] } },
            { name: 'difficulty', in: 'query', schema: { type: 'string', enum: ['trivial', 'easy', 'medium', 'hard'] } },
            { name: 'has_timeline', in: 'query', schema: { type: 'boolean' } },
            { name: 'completed', in: 'query', schema: { type: 'boolean' } },
            { name: 'scheduled_date', in: 'query', schema: { type: 'string', example: '2026-10-28' } },
            { name: 'search', in: 'query', schema: { type: 'string' } },
          ],
        },
        post: {
          summary: 'Create a new task, habit, or daily',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title'],
                  properties: {
                    title: { type: 'string' },
                    notes: { type: 'string' },
                    type: { type: 'string', enum: ['habit', 'daily', 'todo'], default: 'todo' },
                    time_of_day: {
                      type: 'string',
                      enum: ['morning', 'workday', 'evening', 'anytime'],
                      default: 'anytime',
                      description: 'WFH routine time of day categorization',
                    },
                    difficulty: { type: 'string', enum: ['trivial', 'easy', 'medium', 'hard'], default: 'easy' },
                    subtasks: { type: 'array', items: { type: 'string' } },
                    start_date: { type: 'string', example: '2026-10-28' },
                    due_date: { type: 'string', example: '2026-10-29' },
                    scheduled_date: { type: 'string', example: '2026-10-28' },
                    scheduled_start: { type: 'string', example: '14:30' },
                    scheduled_duration: { type: 'integer', default: 30 },
                    frequency: { type: 'string', enum: ['daily', 'weekly', 'every_n_days', 'monthly'] },
                    repeat_days: { type: 'array', items: { type: 'integer' } },
                    habit_positive: { type: 'boolean' },
                    habit_negative: { type: 'boolean' },
                    tags: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
            },
          },
        },
      },
      '/tasks/batch': {
        post: {
          summary: 'Batch create multiple tasks in one call',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['tasks'],
                  properties: {
                    tasks: {
                      type: 'array',
                      items: {
                        type: 'object',
                        required: ['title'],
                        properties: {
                          title: { type: 'string' },
                          notes: { type: 'string' },
                          type: { type: 'string', enum: ['habit', 'daily', 'todo'], default: 'todo' },
                          time_of_day: { type: 'string', enum: ['morning', 'workday', 'evening', 'anytime'], default: 'anytime' },
                          difficulty: { type: 'string', enum: ['trivial', 'easy', 'medium', 'hard'], default: 'easy' },
                          scheduled_date: { type: 'string', example: '2026-10-28' },
                          scheduled_start: { type: 'string', example: '14:30' },
                          scheduled_duration: { type: 'integer', default: 30 },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/tasks/{id}': {
        get: {
          summary: 'Get a specific task with subtasks',
          parameters: [{ name: 'id', in: 'path', required: true }],
        },
        patch: {
          summary: 'Update task or habit fields',
          parameters: [{ name: 'id', in: 'path', required: true }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    notes: { type: 'string' },
                    time_of_day: { type: 'string', enum: ['morning', 'workday', 'evening', 'anytime'] },
                    difficulty: { type: 'string', enum: ['trivial', 'easy', 'medium', 'hard'] },
                    completed: { type: 'boolean' },
                    scheduled_date: { type: 'string', example: '2026-10-28' },
                    scheduled_start: { type: 'string', example: '14:30' },
                    scheduled_duration: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
        delete: {
          summary: 'Delete a task',
          parameters: [{ name: 'id', in: 'path', required: true }],
        },
      },
      '/tasks/{id}/score': {
        post: {
          summary: 'Score a habit (+/-) or toggle completion on a daily / todo',
          parameters: [{ name: 'id', in: 'path', required: true }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    direction: { type: 'string', enum: ['up', 'down'], default: 'up' },
                  },
                },
              },
            },
          },
        },
      },
      '/agenda': {
        get: {
          summary: 'Get unified hourly schedule (meetings + time-blocked tasks)',
          parameters: [
            { name: 'start', in: 'query', schema: { type: 'string', example: '2026-10-28' } },
            { name: 'end', in: 'query', schema: { type: 'string', example: '2026-10-28' } },
          ],
        },
      },
      '/meetings': {
        get: { summary: 'List calendar meetings' },
        post: {
          summary: 'Create a calendar meeting',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title', 'start_time', 'end_time'],
                  properties: {
                    title: { type: 'string' },
                    start_time: { type: 'string', format: 'date-time' },
                    end_time: { type: 'string', format: 'date-time' },
                    location: { type: 'string' },
                    meeting_url: { type: 'string' },
                    color: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
});
