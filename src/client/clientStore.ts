/**
 * Client-Side Local-First Storage Adapter for HabitCorp
 * Allows the app to run with 100% full functionality directly on static web hosting
 * (e.g. Firebase Hosting, GitHub Pages) without throwing <!doctype html> JSON errors.
 */

import { Task, Project, CalendarMeeting, Ghost, CalendarSource, AuthState } from './types';

interface StoredData {
  users: Array<{
    id: string;
    username: string;
    email: string;
    password: string;
    apiKey: string;
  }>;
  projects: Project[];
  tasks: Task[];
  meetings: CalendarMeeting[];
  ghosts: Ghost[];
  calendars: CalendarSource[];
  magicLinks: Array<{
    token: string;
    email: string;
    username: string;
    apiKey: string;
    expiresAt: number;
    used: boolean;
  }>;
}

const STORAGE_KEY = 'habitcorp_client_db_v1';

function getDefaultSeedData(): StoredData {
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toISOString();

  const getDateOffset = (offsetDays: number) => {
    const d = new Date(`${today}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + offsetDays);
    return d.toISOString().slice(0, 10);
  };

  return {
    users: [
      {
        id: 'user_gabriel',
        username: 'gabriel',
        email: 'gabriel@rullan.cat',
        password: 'falcon.badger.otter',
        apiKey: 'tk_gabriel_rullan_key',
      },
      {
        id: 'user_test_default',
        username: 'testuser',
        email: 'testuser@example.com',
        password: 'test_password',
        apiKey: 'tk_test_developer_key',
      },
    ],
    projects: [
      { id: 'proj_chinese', user_id: 'user_gabriel', name: '🇨🇳 Chinese Acquisition (HSK 4)', color: '#ec4899', icon: 'languages', created_at: now },
      { id: 'proj_japanese', user_id: 'user_gabriel', name: '🇯🇵 Japanese Study (JLPT N5)', color: '#8b5cf6', icon: 'languages', created_at: now },
      { id: 'proj_health', user_id: 'user_gabriel', name: '💪 Health & Fitness (SBS & Running)', color: '#10b981', icon: 'activity', created_at: now },
      { id: 'proj_corp', user_id: 'user_gabriel', name: '💼 Enterprise Architecture & Governance', color: '#0ea5e9', icon: 'building', created_at: now },
      { id: 'proj_unicorn', user_id: 'user_gabriel', name: '🦄 Unicorn Venture (P011/P012)', color: '#f59e0b', icon: 'sparkles', created_at: now },
      { id: 'proj_family', user_id: 'user_gabriel', name: '👨‍👩‍👧‍👦 Family & Logistics', color: '#a855f7', icon: 'home', created_at: now },
    ],
    ghosts: [
      { id: 'ghost_alex', user_id: 'user_gabriel', name: 'Alex', relation: 'Partner / Spouse', color: '#ec4899', created_at: now },
      { id: 'ghost_sam', user_id: 'user_gabriel', name: 'Sam', relation: 'Child (Piano/Language/Sports)', color: '#3b82f6', created_at: now },
      { id: 'ghost_taylor', user_id: 'user_gabriel', name: 'Taylor', relation: 'Child (Drums/Karate/Music)', color: '#f97316', created_at: now },
      { id: 'ghost_jordan', user_id: 'user_gabriel', name: 'Jordan', relation: 'Child (Acrobatics/Violin)', color: '#14b8a6', created_at: now },
    ],
    tasks: [
      {
        id: 'habit_weigh_in',
        user_id: 'user_gabriel',
        project_id: 'proj_health',
        type: 'daily',
        time_of_day: 'morning',
        title: 'Morning Biometrics (⚖️)',
        notes: 'Daily morning weigh-in upon waking, synced with Health API.',
        difficulty: 'trivial',
        difficulty_weight: 1,
        tags: [],
        habit_positive: 1,
        habit_negative: 0,
        counter_up: 0,
        counter_down: 0,
        habit_reset_period: 'daily',
        frequency: 'daily',
        repeat_interval: 1,
        repeat_days: [0, 1, 2, 3, 4, 5, 6],
        streak: 47,
        best_streak: 47,
        completed: 0,
        last_completed_date: null,
        start_date: null,
        due_date: null,
        scheduled_date: null,
        scheduled_start: null,
        scheduled_duration: 30,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'habit_chinese_anki',
        user_id: 'user_gabriel',
        project_id: 'proj_chinese',
        type: 'daily',
        time_of_day: 'morning',
        title: 'Chinese Mandarin SRS (🇨🇳 Anki HSK 4)',
        notes: '20-minute Anki review (morning preferred).',
        difficulty: 'medium',
        difficulty_weight: 3,
        tags: [],
        habit_positive: 1,
        habit_negative: 0,
        counter_up: 0,
        counter_down: 0,
        habit_reset_period: 'daily',
        frequency: 'daily',
        repeat_interval: 1,
        repeat_days: [0, 1, 2, 3, 4, 5, 6],
        streak: 64,
        best_streak: 64,
        completed: 0,
        last_completed_date: null,
        start_date: null,
        due_date: null,
        scheduled_date: today,
        scheduled_start: '07:30',
        scheduled_duration: 30,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'habit_work_kickoff',
        user_id: 'user_gabriel',
        project_id: 'proj_corp',
        type: 'daily',
        time_of_day: 'morning',
        title: 'Work Kickoff (🧠)',
        notes: 'Task review and agenda alignment for the workday.',
        difficulty: 'easy',
        difficulty_weight: 2,
        tags: [],
        habit_positive: 1,
        habit_negative: 0,
        counter_up: 0,
        counter_down: 0,
        habit_reset_period: 'daily',
        frequency: 'weekly',
        repeat_interval: 1,
        repeat_days: [1, 2, 3, 4, 5],
        streak: 25,
        best_streak: 25,
        completed: 0,
        last_completed_date: null,
        start_date: null,
        due_date: null,
        scheduled_date: today,
        scheduled_start: '09:00',
        scheduled_duration: 30,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'habit_deep_work',
        user_id: 'user_gabriel',
        project_id: 'proj_corp',
        type: 'daily',
        time_of_day: 'workday',
        title: 'Deep Work Window (🧠)',
        notes: '90+ minute focused block for architecture & venture building.',
        difficulty: 'hard',
        difficulty_weight: 4,
        tags: [],
        habit_positive: 1,
        habit_negative: 0,
        counter_up: 0,
        counter_down: 0,
        habit_reset_period: 'daily',
        frequency: 'weekly',
        repeat_interval: 1,
        repeat_days: [1, 2, 3, 4, 5],
        streak: 19,
        best_streak: 19,
        completed: 0,
        last_completed_date: null,
        start_date: null,
        due_date: null,
        scheduled_date: today,
        scheduled_start: '09:30',
        scheduled_duration: 90,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'habit_japanese_study',
        user_id: 'user_gabriel',
        project_id: 'proj_japanese',
        type: 'daily',
        time_of_day: 'workday',
        title: 'Japanese Study (🇯🇵 JLPT N5)',
        notes: '15–20 minutes daily Anki & grammar point review. Buffered >=30m from Chinese.',
        difficulty: 'medium',
        difficulty_weight: 3,
        tags: [],
        habit_positive: 1,
        habit_negative: 0,
        counter_up: 0,
        counter_down: 0,
        habit_reset_period: 'daily',
        frequency: 'daily',
        repeat_interval: 1,
        repeat_days: [0, 1, 2, 3, 4, 5, 6],
        streak: 29,
        best_streak: 29,
        completed: 0,
        last_completed_date: null,
        start_date: null,
        due_date: null,
        scheduled_date: today,
        scheduled_start: '14:30',
        scheduled_duration: 30,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'habit_gym_sbs',
        user_id: 'user_gabriel',
        project_id: 'proj_health',
        type: 'daily',
        time_of_day: 'workday',
        title: 'Strength Training (💪 SBS Hypertrophy)',
        notes: '90-minute session (Mon & Wed after 15:00) following SBS Hypertrophy Program.',
        difficulty: 'hard',
        difficulty_weight: 4,
        tags: [],
        habit_positive: 1,
        habit_negative: 0,
        counter_up: 0,
        counter_down: 0,
        habit_reset_period: 'daily',
        frequency: 'weekly',
        repeat_interval: 1,
        repeat_days: [1, 3],
        streak: 15,
        best_streak: 15,
        completed: 0,
        last_completed_date: null,
        start_date: null,
        due_date: null,
        scheduled_date: today,
        scheduled_start: '15:30',
        scheduled_duration: 90,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'habit_evening_close',
        user_id: 'user_gabriel',
        project_id: 'proj_family',
        type: 'daily',
        time_of_day: 'evening',
        title: 'Evening Habit Tracker & Day Close',
        notes: 'Daily habit check-off and next-day schedule review.',
        difficulty: 'easy',
        difficulty_weight: 2,
        tags: [],
        habit_positive: 1,
        habit_negative: 0,
        counter_up: 0,
        counter_down: 0,
        habit_reset_period: 'daily',
        frequency: 'daily',
        repeat_interval: 1,
        repeat_days: [0, 1, 2, 3, 4, 5, 6],
        streak: 52,
        best_streak: 52,
        completed: 0,
        last_completed_date: null,
        start_date: null,
        due_date: null,
        scheduled_date: null,
        scheduled_start: null,
        scheduled_duration: 30,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'task_cmc_review',
        user_id: 'user_gabriel',
        project_id: 'proj_corp',
        type: 'todo',
        title: 'Enterprise: Architecture Gate & Governance Alignment',
        notes: 'Review architecture gate deliverables, verify interfaces and governance checklist.',
        difficulty: 'medium',
        difficulty_weight: 2,
        tags: [],
        habit_positive: 1,
        habit_negative: 0,
        counter_up: 0,
        counter_down: 0,
        habit_reset_period: 'daily',
        frequency: 'daily',
        repeat_interval: 1,
        repeat_days: [0, 1, 2, 3, 4, 5, 6],
        streak: 0,
        best_streak: 0,
        completed: 0,
        last_completed_date: null,
        start_date: null,
        due_date: today,
        scheduled_date: today,
        scheduled_start: '11:30',
        scheduled_duration: 60,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'task_unicorn_p011',
        user_id: 'user_gabriel',
        project_id: 'proj_unicorn',
        type: 'todo',
        title: 'Unicorn Venture: P011 Financial & Concept Validation',
        notes: 'Refine unit economics in spreadsheet and draft validation summary.',
        difficulty: 'hard',
        difficulty_weight: 4,
        tags: [],
        habit_positive: 1,
        habit_negative: 0,
        counter_up: 0,
        counter_down: 0,
        habit_reset_period: 'daily',
        frequency: 'daily',
        repeat_interval: 1,
        repeat_days: [0, 1, 2, 3, 4, 5, 6],
        streak: 0,
        best_streak: 0,
        completed: 0,
        last_completed_date: null,
        start_date: null,
        due_date: today,
        scheduled_date: null,
        scheduled_start: null,
        scheduled_duration: 30,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'task_chinese_sentence_mining',
        user_id: 'user_gabriel',
        project_id: 'proj_chinese',
        type: 'todo',
        title: 'Chinese: Sentence Mining & HSK 4 Audio Deck',
        notes: 'Mine 5 sentences from current reading and add audio to Anki deck.',
        difficulty: 'easy',
        difficulty_weight: 2,
        tags: [],
        habit_positive: 1,
        habit_negative: 0,
        counter_up: 0,
        counter_down: 0,
        habit_reset_period: 'daily',
        frequency: 'daily',
        repeat_interval: 1,
        repeat_days: [0, 1, 2, 3, 4, 5, 6],
        streak: 0,
        best_streak: 0,
        completed: 0,
        last_completed_date: null,
        start_date: null,
        due_date: today,
        scheduled_date: null,
        scheduled_start: null,
        scheduled_duration: 30,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'task_unicorn_p012',
        user_id: 'user_gabriel',
        project_id: 'proj_unicorn',
        type: 'todo',
        title: 'Unicorn: P012 Technical Architecture RFC',
        notes: 'Draft technical design for P012 backend and event infrastructure.',
        difficulty: 'hard',
        difficulty_weight: 4,
        tags: [],
        habit_positive: 1,
        habit_negative: 0,
        counter_up: 0,
        counter_down: 0,
        habit_reset_period: 'daily',
        frequency: 'daily',
        repeat_interval: 1,
        repeat_days: [0, 1, 2, 3, 4, 5, 6],
        streak: 0,
        best_streak: 0,
        completed: 0,
        last_completed_date: null,
        start_date: null,
        due_date: null,
        scheduled_date: null,
        scheduled_start: null,
        scheduled_duration: 30,
        created_at: now,
        updated_at: now,
      },
    ],
    meetings: [
      {
        id: 'meet_school_run_today',
        user_id: 'user_gabriel',
        title: 'School Run (🚗 Kids)',
        description: 'Drop off children at school (08:30–13:30 schedule).',
        location: 'School',
        meeting_url: '',
        start_time: `${today}T08:00:00.000Z`,
        end_time: `${today}T08:30:00.000Z`,
        all_day: 0,
        color: '#a855f7',
        is_ghost: 0,
        ghost_name: '',
        created_at: now,
      },
      {
        id: 'meet_dog_walk_today',
        user_id: 'user_gabriel',
        title: 'Walk Dogs (🏡 Pets)',
        description: 'Morning walk with dogs around the neighborhood.',
        location: '',
        meeting_url: '',
        start_time: `${today}T08:30:00.000Z`,
        end_time: `${today}T08:55:00.000Z`,
        all_day: 0,
        color: '#10b981',
        is_ghost: 0,
        ghost_name: '',
        created_at: now,
      },
      {
        id: 'meet_corp_sync_today',
        user_id: 'user_gabriel',
        title: 'Enterprise: Architecture Team Sync',
        description: 'Weekly team architecture review and cross-track delivery status.',
        location: 'Remote',
        meeting_url: 'https://meet.example.com/team-sync',
        start_time: `${today}T13:00:00.000Z`,
        end_time: `${today}T14:00:00.000Z`,
        all_day: 0,
        color: '#0ea5e9',
        is_ghost: 0,
        ghost_name: '',
        created_at: now,
      },
      {
        id: 'ghost_alex_pickup_today',
        user_id: 'user_gabriel',
        title: 'Alex: High School Campus Pickup (👩)',
        description: 'Teaching schedule finish.',
        location: 'High School',
        meeting_url: '',
        start_time: `${today}T13:05:00.000Z`,
        end_time: `${today}T13:35:00.000Z`,
        all_day: 0,
        color: '#ec4899',
        is_ghost: 1,
        ghost_name: 'Alex (Partner)',
        created_at: now,
      },
      {
        id: 'ghost_jordan_circus_today',
        user_id: 'user_gabriel',
        title: 'Jordan: Acrobatics Practice (👧)',
        description: '',
        location: 'Studio',
        meeting_url: '',
        start_time: `${today}T17:00:00.000Z`,
        end_time: `${today}T18:00:00.000Z`,
        all_day: 0,
        color: '#14b8a6',
        is_ghost: 1,
        ghost_name: 'Jordan (Child)',
        created_at: now,
      },
    ],
    calendars: [],
    magicLinks: [],
  };
}

export function getClientDb(): StoredData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getDefaultSeedData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (!parsed.calendars) parsed.calendars = [];
    if (!parsed.ghosts) parsed.ghosts = [];
    if (!parsed.meetings) parsed.meetings = [];
    if (!parsed.tasks) parsed.tasks = [];
    if (!parsed.projects) parsed.projects = [];
    if (!parsed.users) parsed.users = [];
    return parsed;
  } catch {
    return getDefaultSeedData();
  }
}

export function saveClientDb(data: StoredData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

/**
 * Handle in-browser local storage mock of the REST API
 */
export async function handleClientStorageRequest(
  path: string,
  options?: RequestInit
): Promise<any> {
  const method = (options?.method || 'GET').toUpperCase();
  const db = getClientDb();
  let body: any = {};
  if (options?.body) {
    try {
      body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
    } catch {}
  }

  // 1. /api/v1/auth/default-user
  if (path === '/api/v1/auth/default-user') {
    const user = db.users.find((u) => u.username === 'gabriel') || db.users[0];
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      apiKey: user.apiKey,
    };
  }

  // 2. /api/v1/auth/login
  if (path === '/api/v1/auth/login' && method === 'POST') {
    const cleanIdentifier = (body.username || body.email || '').trim().toLowerCase();
    const user = db.users.find(
      (u) =>
        (u.username.toLowerCase() === cleanIdentifier || u.email.toLowerCase() === cleanIdentifier) &&
        u.password === body.password
    );
    if (!user) {
      throw new Error('Invalid username or password.');
    }
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      apiKey: user.apiKey,
    };
  }

  // 3. /api/v1/auth/register
  if (path === '/api/v1/auth/register' && method === 'POST') {
    const cleanUser = (body.username || '').trim().toLowerCase();
    const existing = db.users.find((u) => u.username.toLowerCase() === cleanUser);
    if (existing) {
      throw new Error('Username already taken.');
    }
    const newUser = {
      id: 'user_' + Math.random().toString(36).slice(2, 9),
      username: cleanUser,
      email: body.email || `${cleanUser}@example.com`,
      password: body.password || '',
      apiKey: 'tk_' + Math.random().toString(36).slice(2, 14),
    };
    db.users.push(newUser);
    saveClientDb(db);
    return {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      apiKey: newUser.apiKey,
    };
  }

  // 4. /api/v1/auth/magic-link
  if (path === '/api/v1/auth/magic-link' && method === 'POST') {
    const cleanEmail = (body.email || '').trim().toLowerCase();
    let user = db.users.find(
      (u) => u.email.toLowerCase() === cleanEmail || u.username.toLowerCase() === cleanEmail
    );

    if (!user) {
      let baseUser = cleanEmail.includes('@') ? cleanEmail.split('@')[0] : cleanEmail;
      baseUser = baseUser.replace(/[^a-z0-9_-]/gi, '').toLowerCase() || 'user';
      user = {
        id: 'user_' + Math.random().toString(36).slice(2, 9),
        username: baseUser,
        email: cleanEmail,
        password: '',
        apiKey: 'tk_' + Math.random().toString(36).slice(2, 14),
      };
      db.users.push(user);
    }

    const token = 'ml_' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    db.magicLinks.push({
      token,
      email: cleanEmail,
      username: user.username,
      apiKey: user.apiKey,
      expiresAt: Date.now() + 15 * 60 * 1000,
      used: false,
    });
    saveClientDb(db);

    return {
      ok: true,
      message: 'Magic login link generated successfully.',
      token,
      url: `/?magic_token=${token}`,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    };
  }

  // 5. /api/v1/auth/verify-magic-link
  if (path === '/api/v1/auth/verify-magic-link' && method === 'POST') {
    const token = (body.token || '').trim();
    const link = db.magicLinks.find((l) => l.token === token);
    if (!link) {
      throw new Error('Invalid magic link.');
    }
    if (link.used) {
      throw new Error('This magic link has already been used.');
    }
    if (Date.now() > link.expiresAt) {
      throw new Error('This magic link has expired.');
    }
    link.used = true;
    saveClientDb(db);
    return {
      ok: true,
      username: link.username,
      email: link.email,
      apiKey: link.apiKey,
    };
  }

  // 6. /api/v1/auth/me
  if (path === '/api/v1/auth/me') {
    const apiKey = (options?.headers as any)?.['X-API-Key'];
    const user = db.users.find((u) => u.apiKey === apiKey) || db.users[0];
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      api_key: user.apiKey,
    };
  }

  // 7. /api/v1/projects
  if (path.startsWith('/api/v1/projects')) {
    if (method === 'GET') {
      return { projects: db.projects };
    }
    if (method === 'POST') {
      const newProj: Project = {
        id: 'proj_' + Math.random().toString(36).slice(2, 9),
        user_id: 'user_gabriel',
        name: body.name || 'New Project',
        color: body.color || '#6366f1',
        icon: body.icon || 'folder',
        created_at: new Date().toISOString(),
        total_tasks: 0,
        completed_tasks: 0,
      };
      db.projects.push(newProj);
      saveClientDb(db);
      return newProj;
    }
  }

  // 8. /api/v1/tasks
  if (path.startsWith('/api/v1/tasks')) {
    // Score task
    const scoreMatch = path.match(/\/api\/v1\/tasks\/([^/]+)\/score/);
    if (scoreMatch && method === 'POST') {
      const taskId = scoreMatch[1];
      const task = db.tasks.find((t) => t.id === taskId);
      if (task) {
        if (task.type === 'habit') {
          if (body.direction === 'up') task.counter_up = (task.counter_up || 0) + 1;
          if (body.direction === 'down') task.counter_down = (task.counter_down || 0) + 1;
        } else {
          task.completed = task.completed ? 0 : 1;
          if (task.completed) task.streak = (task.streak || 0) + 1;
        }
        saveClientDb(db);
        return task;
      }
    }

    // Update task
    const idMatch = path.match(/\/api\/v1\/tasks\/([^/]+)$/);
    if (idMatch && method === 'PATCH') {
      const taskId = idMatch[1];
      const task = db.tasks.find((t) => t.id === taskId);
      if (task) {
        Object.assign(task, body, { updated_at: new Date().toISOString() });
        saveClientDb(db);
        return task;
      }
    }

    // Create task
    if (path === '/api/v1/tasks' && method === 'POST') {
      const newTask: Task = {
        id: 'task_' + Math.random().toString(36).slice(2, 9),
        user_id: 'user_gabriel',
        project_id: body.project_id || null,
        type: body.type || 'todo',
        title: body.title || 'Untitled',
        notes: body.notes || '',
        difficulty: body.difficulty || 'easy',
        difficulty_weight: body.difficulty === 'hard' ? 4 : body.difficulty === 'medium' ? 3 : 2,
        tags: body.tags || [],
        time_of_day: body.time_of_day || 'anytime',
        habit_positive: body.habit_positive !== undefined ? body.habit_positive : 1,
        habit_negative: body.habit_negative !== undefined ? body.habit_negative : 0,
        counter_up: 0,
        counter_down: 0,
        habit_reset_period: 'daily',
        frequency: body.frequency || 'daily',
        repeat_interval: 1,
        repeat_days: body.repeat_days || [0, 1, 2, 3, 4, 5, 6],
        streak: 0,
        best_streak: 0,
        completed: 0,
        last_completed_date: null,
        start_date: body.start_date || null,
        due_date: body.due_date || null,
        scheduled_date: body.scheduled_date || null,
        scheduled_start: body.scheduled_start || null,
        scheduled_duration: body.scheduled_duration || 30,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.tasks.push(newTask);
      saveClientDb(db);
      return newTask;
    }

    // List tasks
    if (path === '/api/v1/tasks' && method === 'GET') {
      return { tasks: db.tasks };
    }
  }

  // 9. /api/v1/meetings
  if (path.startsWith('/api/v1/meetings')) {
    if (method === 'GET') {
      return { meetings: db.meetings };
    }
    if (method === 'POST') {
      const newMeet: CalendarMeeting = {
        id: 'meet_' + Math.random().toString(36).slice(2, 9),
        user_id: 'user_gabriel',
        title: body.title || 'Meeting',
        description: body.description || '',
        location: body.location || '',
        meeting_url: body.meeting_url || '',
        start_time: body.start_time || new Date().toISOString(),
        end_time: body.end_time || new Date().toISOString(),
        all_day: body.all_day || 0,
        color: body.color || '#0ea5e9',
        is_ghost: body.is_ghost || 0,
        ghost_name: body.ghost_name || '',
        created_at: new Date().toISOString(),
      };
      db.meetings.push(newMeet);
      saveClientDb(db);
      return newMeet;
    }
  }

  // 10. /api/v1/ghosts
  if (path.startsWith('/api/v1/ghosts')) {
    if (path.includes('/sync')) {
      return { success: true, count: 0 };
    }
    if (method === 'GET') {
      return { ghosts: db.ghosts };
    }
    if (method === 'POST') {
      const newGhost: Ghost = {
        id: 'ghost_' + Math.random().toString(36).slice(2, 9),
        user_id: 'user_gabriel',
        name: body.name || 'Ghost Contact',
        relation: body.relation || '',
        color: body.color || '#ec4899',
        ics_url: body.ics_url || '',
        created_at: new Date().toISOString(),
      };
      db.ghosts.push(newGhost);
      saveClientDb(db);
      return newGhost;
    }
    if (method === 'DELETE') {
      const ghostId = path.split('/')[4];
      db.ghosts = db.ghosts.filter((g) => g.id !== ghostId);
      saveClientDb(db);
      return { success: true };
    }
  }

  // 11. /api/v1/calendars
  if (path.startsWith('/api/v1/calendars')) {
    if (path.includes('/import-ics')) {
      return { count: 0, meetings: [] };
    }
    if (path.includes('/sync')) {
      return { success: true, count: 0 };
    }
    if (method === 'GET') {
      return { calendars: db.calendars || [] };
    }
    if (method === 'POST') {
      const newCal: CalendarSource = {
        id: 'cal_' + Math.random().toString(36).slice(2, 9),
        user_id: 'user_gabriel',
        name: body.name || 'Calendar Feed',
        color: body.color || '#6366f1',
        ics_url: body.ics_url || '',
        created_at: new Date().toISOString(),
      };
      db.calendars.push(newCal);
      saveClientDb(db);
      return newCal;
    }
    if (method === 'DELETE') {
      const calId = path.split('/')[4];
      db.calendars = (db.calendars || []).filter((c) => c.id !== calId);
      saveClientDb(db);
      return { success: true };
    }
  }

  // Default fallback
  return { ok: true };
}
