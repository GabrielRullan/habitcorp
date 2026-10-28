export type TaskType = 'habit' | 'daily' | 'todo';
export type DifficultyTier = 'trivial' | 'easy' | 'medium' | 'hard';
export type HabitResetPeriod = 'daily' | 'weekly' | 'monthly';
export type DailyFrequency = 'daily' | 'weekly' | 'every_n_days' | 'monthly';
export type TimeOfDay = 'morning' | 'workday' | 'evening' | 'anytime';

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  completed: number;
  position: number;
}

export interface Task {
  id: string;
  user_id: string;
  project_id?: string | null;
  project_name?: string | null;
  project_color?: string | null;
  type: TaskType;
  title: string;
  notes: string;
  difficulty: DifficultyTier;
  difficulty_weight: number;
  tags: string[];

  // Routine & Time-of-day (WFH)
  time_of_day?: TimeOfDay;

  // Habit
  habit_positive: number;
  habit_negative: number;
  counter_up: number;
  counter_down: number;
  habit_reset_period: HabitResetPeriod;

  // Periodical (Daily)
  frequency: DailyFrequency;
  repeat_interval: number;
  repeat_days: number[]; // 0=Sun .. 6=Sat
  streak: number;
  best_streak: number;
  completed: number;
  last_completed_date: string | null;
  is_due_today?: boolean;

  // Timeline
  start_date: string | null;
  due_date: string | null;

  // Agenda Time-Blocking
  scheduled_date: string | null;
  scheduled_start: string | null; // e.g. "14:30"
  scheduled_duration: number; // minutes

  subtasks: Subtask[];
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface FocusSessionState {
  mode: 'work' | 'break';
  workMinutes: number;
  breakMinutes: number;
  secondsRemaining: number;
  isRunning: boolean;
  linkedRoutineTitle?: string;
}

export interface CalendarMeeting {
  id: string;
  user_id: string;
  source_id: string | null;
  ghost_id?: string | null;
  is_ghost?: number;
  ghost_name?: string;
  external_uid?: string;
  title: string;
  description: string;
  location: string;
  meeting_url: string;
  start_time: string; // ISO
  end_time: string; // ISO
  all_day: number;
  color: string;
  created_at: string;
}

export interface Ghost {
  id: string;
  user_id: string;
  name: string;
  relation: string;
  color: string;
  ics_url: string;
  last_synced_at: string | null;
  created_at: string;
}

export interface CalendarSource {
  id: string;
  user_id: string;
  name: string;
  ics_url: string;
  color: string;
  last_synced_at: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon?: string;
  total_tasks?: number;
  completed_tasks?: number;
  created_at: string;
}

export interface AuthState {
  id: string;
  username: string;
  email?: string;
  apiKey: string;
}
