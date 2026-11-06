import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/server/index';
import { translations } from '../src/client/i18n/translations';
import { Task } from '../src/client/types';

describe('Board Habits & Habit-to-Task Conversion Suite', () => {
  it('guarantees translation key parity for habit conversion features', () => {
    const langs = ['en', 'es', 'ca'] as const;
    langs.forEach((lang) => {
      const dict = translations[lang];
      expect(dict.convertHabitToTodayTask).toBeDefined();
      expect(dict.convertHabitToTodayTask.length).toBeGreaterThan(0);

      expect(dict.convertHabitToTodayTaskTooltip).toBeDefined();
      expect(dict.convertHabitToTodayTaskTooltip.length).toBeGreaterThan(0);

      expect(dict.habitConvertedToast).toBeDefined();
      expect(dict.habitConvertedToast.length).toBeGreaterThan(0);

      expect(dict.habitActionActive).toBeDefined();
      expect(dict.habitActionDone).toBeDefined();
      expect(dict.habitActionBadge).toBeDefined();
      expect(dict.habitActionAlreadyExistsToast).toBeDefined();
      expect(dict.habitActionCreatedToast).toBeDefined();
    });

    expect(translations.ca.convertHabitToTodayTask).toBe("+ Acció d'avui");
    expect(translations.es.convertHabitToTodayTask).toBe('+ Acción de hoy');
    expect(translations.en.convertHabitToTodayTask).toBe("+ Today's Action");
  });

  it('correctly creates an action task payload linked to the parent habit', () => {
    const todayStr = '2026-11-06';
    const mockHabit: Task = {
      id: 'habit_job_offers_123',
      user_id: 'user_gabriel',
      project_id: 'proj_corp',
      type: 'daily',
      time_of_day: 'morning',
      title: 'Verificar noves ofertes de feina (💼)',
      notes: 'Revisar alertes de noves posicions en LinkedIn.',
      difficulty: 'easy',
      difficulty_weight: 2,
      tags: ['career', 'feina'],
      streak: 5,
      completed: 0,
      micro_habit_title: 'Obrir LinkedIn i veure 1 oferta',
      scheduled_duration: 20,
      subtasks: [
        { id: 'sub_1', task_id: 'habit_job_offers_123', title: 'Obrir LinkedIn', completed: 0, position: 0 },
        { id: 'sub_2', task_id: 'habit_job_offers_123', title: 'Revisar alertes', completed: 0, position: 1 },
      ],
      created_at: '2026-11-01T08:00:00Z',
      updated_at: '2026-11-01T08:00:00Z',
    };

    // Action task payload logic
    const actionTaskPayload: Partial<Task> = {
      title: mockHabit.title,
      habit_id: mockHabit.id,
      project_id: mockHabit.project_id || null,
      type: 'todo',
      time_of_day: mockHabit.time_of_day || 'anytime',
      difficulty: mockHabit.difficulty || 'easy',
      difficulty_weight: mockHabit.difficulty_weight || 2,
      notes: mockHabit.notes || '',
      tags: [...(mockHabit.tags || []), 'habit-action'],
      due_date: todayStr,
      micro_habit_title: mockHabit.micro_habit_title || null,
      scheduled_duration: mockHabit.scheduled_duration || 30,
      subtasks: (mockHabit.subtasks || []).map((s, idx) => ({
        id: `cloned_sub_${idx}`,
        task_id: '',
        title: s.title,
        completed: 0,
        position: idx,
      })),
    };

    expect(actionTaskPayload.type).toBe('todo');
    expect(actionTaskPayload.habit_id).toBe('habit_job_offers_123');
    expect(actionTaskPayload.due_date).toBe(todayStr);
    expect(actionTaskPayload.title).toBe('Verificar noves ofertes de feina (💼)');
    expect(actionTaskPayload.tags).toContain('habit-action');
    expect(actionTaskPayload.micro_habit_title).toBe('Obrir LinkedIn i veure 1 oferta');
    expect(actionTaskPayload.subtasks).toHaveLength(2);
  });

  it('prevents creating duplicate action tasks for today for the same habit', () => {
    const todayStr = '2026-11-06';
    const habitId = 'habit_test_gym';
    const existingTasks: Task[] = [
      {
        id: 'action_gym_today',
        user_id: 'u1',
        habit_id: habitId,
        title: 'Gym Workout',
        type: 'todo',
        due_date: todayStr,
        streak: 0,
        completed: 0,
        created_at: '',
        updated_at: '',
      },
    ];

    const canCreateAction = !existingTasks.some(
      (t) => t.habit_id === habitId && (t.due_date?.slice(0, 10) === todayStr || t.scheduled_date?.slice(0, 10) === todayStr)
    );

    expect(canCreateAction).toBe(false);

    // Different habit can create action
    const canCreateOther = !existingTasks.some(
      (t) => t.habit_id === 'other_habit' && (t.due_date?.slice(0, 10) === todayStr || t.scheduled_date?.slice(0, 10) === todayStr)
    );
    expect(canCreateOther).toBe(true);
  });

  it('correctly tracks habit action card status (pending -> done)', () => {
    const todayStr = '2026-11-06';
    const habit: Task = {
      id: 'h_read',
      user_id: 'u1',
      type: 'daily',
      title: 'Reading',
      streak: 10,
      completed: 0,
      created_at: '',
      updated_at: '',
    };

    const getActionStatus = (habitId: string, taskList: Task[]) => {
      const act = taskList.find(
        (t) => t.habit_id === habitId && (t.due_date?.slice(0, 10) === todayStr || t.scheduled_date?.slice(0, 10) === todayStr)
      );
      if (!act) return 'create';
      return act.completed ? 'done' : 'active';
    };

    // No action exists
    expect(getActionStatus(habit.id, [])).toBe('create');

    // Pending action exists
    const withActive: Task[] = [
      {
        id: 'act_1',
        user_id: 'u1',
        habit_id: habit.id,
        type: 'todo',
        title: 'Reading',
        due_date: todayStr,
        streak: 0,
        completed: 0,
        created_at: '',
        updated_at: '',
      },
    ];
    expect(getActionStatus(habit.id, withActive)).toBe('active');

    // Completed action exists
    const withDone: Task[] = [
      {
        id: 'act_1',
        user_id: 'u1',
        habit_id: habit.id,
        type: 'todo',
        title: 'Reading',
        due_date: todayStr,
        streak: 0,
        completed: 1,
        created_at: '',
        updated_at: '',
      },
    ];
    expect(getActionStatus(habit.id, withDone)).toBe('done');
  });

  it('verifies server API synchronizes habit completion when habit action task is scored', async () => {
    const testUsername = `sync_user_${Date.now()}`;
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: testUsername, password: 'password123' });
    const apiKey = regRes.body.apiKey;
    const todayStr = new Date().toISOString().slice(0, 10);

    // 1. Create a daily habit
    const habitRes = await request(app)
      .post('/api/v1/tasks')
      .set('X-API-Key', apiKey)
      .send({
        type: 'daily',
        title: 'Morning Meditation',
        difficulty: 'easy',
      });
    expect(habitRes.status).toBe(201);
    const habitId = habitRes.body.id;
    expect(habitRes.body.streak).toBe(0);
    expect(habitRes.body.completed).toBe(0);

    // 2. Create today's action task linked to the habit
    const actionRes = await request(app)
      .post('/api/v1/tasks')
      .set('X-API-Key', apiKey)
      .send({
        type: 'todo',
        title: 'Morning Meditation (Today Action)',
        habit_id: habitId,
        due_date: todayStr,
      });
    expect(actionRes.status).toBe(201);
    expect(actionRes.body.habit_id).toBe(habitId);
    const actionTaskId = actionRes.body.id;

    // 3. Score the action task to complete it
    const scoreRes = await request(app)
      .post(`/api/v1/tasks/${actionTaskId}/score`)
      .set('X-API-Key', apiKey)
      .send({ direction: 'toggle' });
    expect(scoreRes.status).toBe(200);
    expect(scoreRes.body.completed).toBe(1);

    // 4. Check the parent habit was automatically synchronized (completed = 1, streak = 1)
    const getHabitRes = await request(app)
      .get('/api/v1/tasks')
      .set('X-API-Key', apiKey);
    const parentHabit = getHabitRes.body.tasks.find((t: any) => t.id === habitId);
    expect(parentHabit).toBeDefined();
    expect(parentHabit.completed).toBe(1);
    expect(parentHabit.streak).toBe(1);

    // 5. Uncheck the action task and verify parent habit unchecks
    const uncheckRes = await request(app)
      .post(`/api/v1/tasks/${actionTaskId}/score`)
      .set('X-API-Key', apiKey)
      .send({ direction: 'toggle' });
    expect(uncheckRes.status).toBe(200);
    expect(uncheckRes.body.completed).toBe(0);

    const getHabitRes2 = await request(app)
      .get('/api/v1/tasks')
      .set('X-API-Key', apiKey);
    const parentHabit2 = getHabitRes2.body.tasks.find((t: any) => t.id === habitId);
    expect(parentHabit2.completed).toBe(0);
    expect(parentHabit2.streak).toBe(0);
  });
});
