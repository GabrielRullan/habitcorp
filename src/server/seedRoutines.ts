import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';

export function seedDefaultRoutines(db: DatabaseSync, userId: string = 'user_test_default') {
  // Clear existing items for clean seeding
  db.prepare('DELETE FROM subtasks WHERE task_id IN (SELECT id FROM tasks WHERE user_id = ?)').run(userId);
  db.prepare('DELETE FROM tasks WHERE user_id = ?').run(userId);
  db.prepare('DELETE FROM calendar_events WHERE user_id = ?').run(userId);
  db.prepare('DELETE FROM ghosts WHERE user_id = ?').run(userId);
  db.prepare('DELETE FROM projects WHERE user_id = ?').run(userId);

  const now = new Date().toISOString();
  const today = now.slice(0, 10);

  // Helper to compute date offset
  const getDateOffset = (offsetDays: number) => {
    const d = new Date(`${today}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + offsetDays);
    return d.toISOString().slice(0, 10);
  };

  // 1. PROJECTS
  const projects = [
    { id: 'proj_chinese', name: '🇨🇳 Chinese Acquisition (HSK 4)', color: '#ec4899', icon: 'languages' },
    { id: 'proj_japanese', name: '🇯🇵 Japanese Study (JLPT N5)', color: '#8b5cf6', icon: 'languages' },
    { id: 'proj_health', name: '💪 Health & Fitness (SBS & Running)', color: '#10b981', icon: 'activity' },
    { id: 'proj_corp', name: '💼 Enterprise Architecture & Governance', color: '#0ea5e9', icon: 'building' },
    { id: 'proj_unicorn', name: '🦄 Unicorn Venture (P011/P012)', color: '#f59e0b', icon: 'sparkles' },
    { id: 'proj_family', name: '👨‍👩‍👧‍👦 Family & Logistics', color: '#a855f7', icon: 'home' },
  ];

  const insertProj = db.prepare(`
    INSERT INTO projects (id, user_id, name, color, icon, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const p of projects) {
    insertProj.run(p.id, userId, p.name, p.color, p.icon, now);
  }

  // 2. GHOSTS (Family Members)
  const ghosts = [
    { id: 'ghost_alex', name: 'Alex', relation: 'Partner / Spouse', color: '#ec4899' },
    { id: 'ghost_sam', name: 'Sam', relation: 'Child (Piano/Language/Sports)', color: '#3b82f6' },
    { id: 'ghost_taylor', name: 'Taylor', relation: 'Child (Drums/Karate/Music)', color: '#f97316' },
    { id: 'ghost_jordan', name: 'Jordan', relation: 'Child (Acrobatics/Violin)', color: '#14b8a6' },
  ];

  const insertGhost = db.prepare(`
    INSERT INTO ghosts (id, user_id, name, relation, color, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const g of ghosts) {
    insertGhost.run(g.id, userId, g.name, g.relation, g.color, now);
  }

  // Helper to insert task + subtasks
  const insertTaskStmt = db.prepare(`
    INSERT INTO tasks (
      id, user_id, project_id, type, time_of_day, title, notes, difficulty, difficulty_weight, tags,
      habit_positive, habit_negative, counter_up, counter_down, habit_reset_period,
      frequency, repeat_interval, repeat_days, streak, best_streak, completed,
      start_date, due_date, scheduled_date, scheduled_start, scheduled_duration,
      created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, 0, 'daily',
      ?, 1, ?, ?, ?, 0,
      ?, ?, ?, ?, ?,
      ?, ?
    )
  `);

  const insertSubStmt = db.prepare(`
    INSERT INTO subtasks (id, task_id, title, completed, position)
    VALUES (?, ?, ?, 0, ?)
  `);

  const addTask = (data: {
    id: string;
    projectId?: string;
    type: 'habit' | 'daily' | 'todo';
    time_of_day?: 'morning' | 'workday' | 'evening' | 'anytime';
    title: string;
    notes?: string;
    difficulty?: 'trivial' | 'easy' | 'medium' | 'hard';
    weight?: number;
    tags?: string[];
    positive?: boolean;
    negative?: boolean;
    counterUp?: number;
    frequency?: 'daily' | 'weekly';
    repeatDays?: number[];
    streak?: number;
    dueDate?: string;
    schedDate?: string;
    schedStart?: string;
    schedDuration?: number;
    subtasks?: string[];
  }) => {
    insertTaskStmt.run(
      data.id,
      userId,
      data.projectId || null,
      data.type,
      data.time_of_day || 'anytime',
      data.title,
      data.notes || '',
      data.difficulty || 'easy',
      data.weight || 2,
      JSON.stringify(data.tags || []),
      data.positive !== undefined ? (data.positive ? 1 : 0) : 1,
      data.negative !== undefined ? (data.negative ? 1 : 0) : 0,
      data.counterUp || 0,
      data.frequency || 'daily',
      JSON.stringify(data.repeatDays || [0, 1, 2, 3, 4, 5, 6]),
      data.streak || 0,
      data.streak || 0,
      null,
      data.dueDate || null,
      data.schedDate || null,
      data.schedStart || null,
      data.schedDuration || 30,
      now,
      now
    );

    if (data.subtasks && data.subtasks.length > 0) {
      data.subtasks.forEach((st, idx) => {
        insertSubStmt.run(crypto.randomUUID(), data.id, st, idx);
      });
    }
  };

  // 3. HABITS (Categorized by Time of Day & Cadence)

  // --- MORNING ROUTINES ---
  addTask({
    id: 'habit_weigh_in',
    projectId: 'proj_health',
    type: 'daily',
    time_of_day: 'morning',
    title: 'Morning Biometrics (⚖️)',
    notes: 'Daily morning weigh-in upon waking, synced with weight.md and Fitbit/Google Health.',
    difficulty: 'trivial',
    streak: 47,
    frequency: 'daily',
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
    subtasks: ['Step on scale upon waking', 'Sync record to weight.md / Health API'],
  });

  addTask({
    id: 'habit_morning_fuel',
    projectId: 'proj_health',
    type: 'daily',
    time_of_day: 'morning',
    title: 'Morning Hydration & Fuel',
    notes: '500ml water hydration and high-protein breakfast before school run.',
    difficulty: 'easy',
    streak: 32,
    frequency: 'daily',
    subtasks: ['500ml warm water with lemon', 'High protein breakfast'],
  });

  addTask({
    id: 'habit_chinese_anki',
    projectId: 'proj_chinese',
    type: 'daily',
    time_of_day: 'morning',
    title: 'Chinese Mandarin SRS (🇨🇳 Anki HSK 4)',
    notes: '20-minute Anki review (morning preferred before workday deep work).',
    difficulty: 'medium',
    streak: 64,
    frequency: 'daily',
    schedDate: today,
    schedStart: '07:30',
    schedDuration: 30,
    subtasks: ['Clear due HSK 4 flashcards', 'Review 10 difficult vocabulary items'],
  });

  addTask({
    id: 'habit_work_kickoff',
    projectId: 'proj_corp',
    type: 'daily',
    time_of_day: 'morning',
    title: 'Work Kickoff (🧠)',
    notes: 'Task review and agenda alignment for the workday.',
    difficulty: 'easy',
    streak: 25,
    frequency: 'weekly',
    repeatDays: [1, 2, 3, 4, 5],
    schedDate: today,
    schedStart: '09:00',
    schedDuration: 30,
    subtasks: ["Review today's agenda & meetings", 'Set top 3 focus priorities', 'Scan project and architecture threads'],
  });

  // --- WORKDAY ROUTINES ---
  addTask({
    id: 'habit_deep_work',
    projectId: 'proj_corp',
    type: 'daily',
    time_of_day: 'workday',
    title: 'Deep Work Window (🧠)',
    notes: '90+ minute focused blocks reserved Monday through Friday for architecture & venture building.',
    difficulty: 'hard',
    streak: 19,
    frequency: 'weekly',
    repeatDays: [1, 2, 3, 4, 5],
    schedDate: today,
    schedStart: '09:30',
    schedDuration: 90,
  });

  addTask({
    id: 'habit_japanese_study',
    projectId: 'proj_japanese',
    type: 'daily',
    time_of_day: 'workday',
    title: 'Japanese Study (🇯🇵 JLPT N5)',
    notes: '15–20 minutes daily Anki & grammar point review (n5_gramatica.md). Separation principle: Must have >=30m buffer from Chinese study.',
    difficulty: 'medium',
    streak: 29,
    frequency: 'daily',
    schedDate: today,
    schedStart: '14:30',
    schedDuration: 30,
    subtasks: ['Anki review (JLPT N5 vocab)', 'Review 1 grammar point in n5_gramatica.md', 'Check 3 practice sentences'],
  });

  addTask({
    id: 'habit_chinese_practice',
    projectId: 'proj_chinese',
    type: 'daily',
    time_of_day: 'workday',
    title: 'Chinese Study Practice (🇨🇳)',
    notes: 'Reading 5 pages/sentence mining, 10m immersion listening, writing 3 sentences.',
    difficulty: 'medium',
    streak: 36,
    frequency: 'daily',
    subtasks: ['Read 5 pages / sentence mining', '10m immersion listening (podcast/video)', 'Write 3 sample sentences'],
  });

  addTask({
    id: 'habit_desk_hydration',
    projectId: 'proj_health',
    type: 'habit',
    time_of_day: 'workday',
    title: 'Desk Hydration & Posture Checks',
    notes: 'Track water glasses and 20-20-20 eye rests throughout the desk workday.',
    difficulty: 'trivial',
    positive: true,
    negative: false,
    counterUp: 4,
  });

  // --- FITNESS CADENCE ROUTINES ---
  addTask({
    id: 'habit_gym_sbs',
    projectId: 'proj_health',
    type: 'daily',
    time_of_day: 'workday',
    title: 'Strength Training (💪 SBS Hypertrophy)',
    notes: '90-minute sessions twice per week (Monday & Wednesday, after 15:00) following SBS Hypertrophy Program (Gym.md). Friday is non-feasible.',
    difficulty: 'hard',
    streak: 15,
    frequency: 'weekly',
    repeatDays: [1, 3], // Mon, Wed
    schedDate: today,
    schedStart: '15:30',
    schedDuration: 90,
    subtasks: ['Warmup & mobility', 'SBS Main Compounds (Wave progression)', 'Hypertrophy accessories', 'Log weights in Gym.md'],
  });

  addTask({
    id: 'habit_running_short',
    projectId: 'proj_health',
    type: 'daily',
    time_of_day: 'morning',
    title: 'Morning Running (🏃 30–40m)',
    notes: 'Tuesday & Thursday morning short run (30–40 min).',
    difficulty: 'medium',
    streak: 9,
    frequency: 'weekly',
    repeatDays: [2, 4], // Tue, Thu
  });

  addTask({
    id: 'habit_running_long',
    projectId: 'proj_health',
    type: 'daily',
    time_of_day: 'morning',
    title: 'Weekend Long Run (🏃 60m)',
    notes: 'Saturday long run (60 min endurance pace).',
    difficulty: 'hard',
    streak: 7,
    frequency: 'weekly',
    repeatDays: [6], // Sat
  });

  // --- EVENING ROUTINES ---
  addTask({
    id: 'habit_evening_close',
    projectId: 'proj_family',
    type: 'daily',
    time_of_day: 'evening',
    title: 'Evening Habit Tracker & Day Close',
    notes: 'Daily habit check-off in Habits_Tracker.md and next-day schedule review in Calendar/Weeks/. Day concludes at last task or family dinner.',
    difficulty: 'easy',
    streak: 52,
    frequency: 'daily',
    subtasks: ['Check off completed habits in Habits_Tracker.md', "Review tomorrow's schedule in Calendar/Weeks/", 'Close open tabs and archive daily notes'],
  });

  addTask({
    id: 'habit_family_dinner',
    projectId: 'proj_family',
    type: 'daily',
    time_of_day: 'evening',
    title: 'Family Dinner (🏡)',
    notes: 'Dinner with family.',
    difficulty: 'easy',
    streak: 60,
    frequency: 'daily',
    schedDate: today,
    schedStart: '20:00',
    schedDuration: 60,
  });

  // 4. ACTIVE TASKS

  // --- TODAY'S ACTIONABLE TASKS (with timeline) ---
  addTask({
    id: 'task_cmc_review',
    projectId: 'proj_corp',
    type: 'todo',
    title: 'Enterprise: Architecture Gate & Governance Alignment',
    notes: 'Review architecture gate deliverables, verify interfaces and governance checklist before biweekly review.',
    difficulty: 'medium',
    dueDate: today,
    schedDate: today,
    schedStart: '11:30',
    schedDuration: 60,
    subtasks: ['Review architecture gate deliverables', 'Validate cross-track interfaces', 'Publish status notes'],
  });

  addTask({
    id: 'task_unicorn_p011',
    projectId: 'proj_unicorn',
    type: 'todo',
    title: 'Unicorn Venture: P011 Financial & Concept Validation',
    notes: 'Advance P011 project development: financial modeling, concept validation, and pitch sync.',
    difficulty: 'hard',
    dueDate: today,
    subtasks: ['Refine unit economics in spreadsheet', 'Draft validation summary in project docs', 'Send async update to co-founder'],
  });

  addTask({
    id: 'task_chinese_sentence_mining',
    projectId: 'proj_chinese',
    type: 'todo',
    title: 'Chinese: Sentence Mining & HSK 4 Audio Deck',
    notes: 'Mine 5 sentences from current reading and add audio to Anki deck.',
    difficulty: 'easy',
    dueDate: today,
  });

  // --- BACKLOG TASKS (without timeline) ---
  addTask({
    id: 'task_unicorn_p012',
    projectId: 'proj_unicorn',
    type: 'todo',
    title: 'Unicorn: P012 Technical Architecture RFC',
    notes: 'Draft technical design for P012 backend and event infrastructure.',
    difficulty: 'hard',
  });

  addTask({
    id: 'task_japanese_grammar_summary',
    projectId: 'proj_japanese',
    type: 'todo',
    title: 'Japanese: Te-form & Causative conjugation sheet',
    notes: 'Consolidate tricky grammar patterns into grammar reference cheat-sheet.',
    difficulty: 'medium',
  });

  addTask({
    id: 'task_sbs_wave2_review',
    projectId: 'proj_health',
    type: 'todo',
    title: 'Gym: SBS Hypertrophy Wave 2 Weight Progression Review',
    notes: 'Review auxiliary exercise weights and rep targets before next week.',
    difficulty: 'easy',
  });

  addTask({
    id: 'task_family_trip_prep',
    projectId: 'proj_family',
    type: 'todo',
    title: 'Family: Review upcoming weekend schedule & driving logistics',
    notes: 'Coordinate sports pickups and carpool routing.',
    difficulty: 'trivial',
  });

  // 5. CALENDAR MEETINGS & FIXED ANCHORS
  const insertEvent = db.prepare(`
    INSERT INTO calendar_events (
      id, user_id, source_id, ghost_id, is_ghost, ghost_name,
      title, description, location, meeting_url, start_time, end_time, all_day, color, recurrence, repeat_days, created_at
    ) VALUES (
      ?, ?, NULL, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?
    )
  `);

  // Fixed daily anchors for today & surrounding days
  const addMeeting = (data: {
    id: string;
    title: string;
    start: string; // ISO
    end: string;   // ISO
    color?: string;
    isGhost?: boolean;
    ghostId?: string;
    ghostName?: string;
    location?: string;
    meetingUrl?: string;
    description?: string;
    recurrence?: string;
    repeatDays?: number[];
  }) => {
    insertEvent.run(
      data.id,
      userId,
      data.ghostId || null,
      data.isGhost ? 1 : 0,
      data.ghostName || '',
      data.title,
      data.description || '',
      data.location || '',
      data.meetingUrl || '',
      data.start,
      data.end,
      data.color || (data.isGhost ? '#ec4899' : '#0ea5e9'),
      data.recurrence || 'none',
      JSON.stringify(data.repeatDays || []),
      now
    );
  };

  // Populate anchors for today
  addMeeting({
    id: 'meet_school_run_today',
    title: 'School Run (🚗 Kids)',
    start: `${today}T08:00:00.000Z`,
    end: `${today}T08:30:00.000Z`,
    color: '#a855f7',
    location: 'School',
    description: 'Drop off children at school (08:30–13:30 schedule).',
    recurrence: 'weekdays',
    repeatDays: [1, 2, 3, 4, 5],
  });

  addMeeting({
    id: 'meet_dog_walk_today',
    title: 'Walk Dogs (🏡 Pets)',
    start: `${today}T08:30:00.000Z`,
    end: `${today}T08:55:00.000Z`,
    color: '#10b981',
    description: 'Morning walk with dogs around the neighborhood.',
    recurrence: 'daily',
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
  });

  addMeeting({
    id: 'meet_corp_sync_today',
    title: 'Enterprise: Architecture Team Sync',
    start: `${today}T13:00:00.000Z`,
    end: `${today}T14:00:00.000Z`,
    color: '#0ea5e9',
    location: 'Remote',
    meetingUrl: 'https://meet.example.com/team-sync',
    description: 'Weekly team architecture review and cross-track delivery status.',
    recurrence: 'weekly',
  });

  // --- GHOST EVENTS (Family Commitments) ---
  addMeeting({
    id: 'ghost_alex_pickup_today',
    title: 'Alex: High School Campus Pickup (👩)',
    start: `${today}T13:05:00.000Z`,
    end: `${today}T13:35:00.000Z`,
    color: '#ec4899',
    isGhost: true,
    ghostId: 'ghost_alex',
    ghostName: 'Alex (Partner)',
    location: 'High School',
    description: 'Teaching schedule finish.',
  });

  addMeeting({
    id: 'ghost_jordan_circus_today',
    title: 'Jordan: Acrobatics Practice (👧)',
    start: `${today}T17:00:00.000Z`,
    end: `${today}T18:00:00.000Z`,
    color: '#14b8a6',
    isGhost: true,
    ghostId: 'ghost_jordan',
    ghostName: 'Jordan (Child)',
    location: 'Studio',
  });

  addMeeting({
    id: 'ghost_sam_chinese_today',
    title: 'Sam: Language Class (👦)',
    start: `${today}T17:30:00.000Z`,
    end: `${today}T18:30:00.000Z`,
    color: '#3b82f6',
    isGhost: true,
    ghostId: 'ghost_sam',
    ghostName: 'Sam (Child)',
    location: 'Language Academy',
  });

  addMeeting({
    id: 'ghost_taylor_chinese_today',
    title: 'Taylor: Language Class (🧒)',
    start: `${today}T17:30:00.000Z`,
    end: `${today}T18:30:00.000Z`,
    color: '#f97316',
    isGhost: true,
    ghostId: 'ghost_taylor',
    ghostName: 'Taylor (Child)',
    location: 'Language Academy',
  });

  // Also seed tomorrow's anchors for full week context
  const tomorrow = getDateOffset(1);
  addMeeting({
    id: 'meet_school_run_tomorrow',
    title: 'School Run (🚗 Kids)',
    start: `${tomorrow}T08:00:00.000Z`,
    end: `${tomorrow}T08:30:00.000Z`,
    color: '#a855f7',
    location: 'School',
  });

  addMeeting({
    id: 'meet_dog_walk_tomorrow',
    title: 'Walk Dogs (🏡 Pets)',
    start: `${tomorrow}T08:30:00.000Z`,
    end: `${tomorrow}T08:55:00.000Z`,
    color: '#10b981',
  });

  addMeeting({
    id: 'meet_chinese_class_tomorrow',
    title: 'Language Online Class (🇨🇳 HSK 4)',
    start: `${tomorrow}T10:00:00.000Z`,
    end: `${tomorrow}T11:00:00.000Z`,
    color: '#ec4899',
    location: 'Online',
    meetingUrl: 'https://meet.example.com/language-class',
    description: 'Weekly 60m live teacher session for language grammar & spoken fluency.',
  });

  addMeeting({
    id: 'ghost_sam_drawing_tomorrow',
    title: 'Sam: Drawing Workshop (👦)',
    start: `${tomorrow}T16:40:00.000Z`,
    end: `${tomorrow}T17:40:00.000Z`,
    color: '#3b82f6',
    isGhost: true,
    ghostId: 'ghost_sam',
    ghostName: 'Sam (Child)',
  });

  addMeeting({
    id: 'ghost_taylor_karate_tomorrow',
    title: 'Taylor: Martial Arts Class (🧒)',
    start: `${tomorrow}T17:30:00.000Z`,
    end: `${tomorrow}T18:30:00.000Z`,
    color: '#f97316',
    isGhost: true,
    ghostId: 'ghost_taylor',
    ghostName: 'Taylor (Child)',
  });
}

export const seedGabrielRoutines = seedDefaultRoutines;
