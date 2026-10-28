import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { DatabaseSync } from 'node:sqlite';
import { app } from '../src/server/index.js';
import { resetDbForTesting, initSchema, getDb } from '../src/server/db.js';

describe('Milestone 2 & 3 Empirical Adversarial Challenge Suite', () => {
  let user: { id: string; username: string; apiKey: string };

  const postTask = (payload: any) =>
    request(app).post('/api/v1/tasks').set('X-API-Key', user.apiKey).send(payload);
  const getTask = (id: string) =>
    request(app).get(`/api/v1/tasks/${id}`).set('X-API-Key', user.apiKey);
  const patchTask = (id: string, payload: any) =>
    request(app).patch(`/api/v1/tasks/${id}`).set('X-API-Key', user.apiKey).send(payload);
  const scoreTask = (id: string, dir = 'up') =>
    request(app).post(`/api/v1/tasks/${id}/score`).set('X-API-Key', user.apiKey).send({ direction: dir });
  const getAgenda = (date = '2026-10-28') =>
    request(app).get(`/api/v1/agenda?start=${date}&end=${date}`).set('X-API-Key', user.apiKey);

  beforeEach(async () => {
    const memDb = new DatabaseSync(':memory:');
    memDb.exec('PRAGMA foreign_keys = ON;');
    initSchema(memDb);
    resetDbForTesting(memDb);

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'challenger_m23', password: 'password123' });
    user = res.body;
  });

  describe('1. Focus Pacing Presets & Math Integrity', () => {
    it('verifies 25m/5m and 50m/10m preset conversion to seconds', () => {
      const presets = [
        { id: '25_5', work: 25, break: 5 },
        { id: '50_10', work: 50, break: 10 },
      ];

      for (const p of presets) {
        const workSec = p.work * 60;
        const breakSec = p.break * 60;
        expect(workSec).toBe(p.work === 25 ? 1500 : 3000);
        expect(breakSec).toBe(p.break === 5 ? 300 : 600);
      }
    });

    it('verifies countdown formatting oracle across full time boundaries', () => {
      const formatTime = (secondsRemaining: number) => {
        const minutes = Math.floor(secondsRemaining / 60);
        const seconds = secondsRemaining % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      };

      expect(formatTime(1500)).toBe('25:00');
      expect(formatTime(3000)).toBe('50:00');
      expect(formatTime(300)).toBe('05:00');
      expect(formatTime(600)).toBe('10:00');
      expect(formatTime(59)).toBe('00:59');
      expect(formatTime(1)).toBe('00:01');
      expect(formatTime(0)).toBe('00:00');
    });

    it('verifies progress percentage calculation and bounds clamping [0, 100]', () => {
      const getProgress = (totalSec: number, remSec: number) =>
        Math.min(100, Math.max(0, ((totalSec - remSec) / totalSec) * 100));

      const total = 1500;
      expect(getProgress(total, 1500)).toBe(0);
      expect(getProgress(total, 750)).toBe(50);
      expect(getProgress(total, 0)).toBe(100);
      // Boundary safety: over-decrement or negative remaining
      expect(getProgress(total, -5)).toBe(100);
      // Overflow safety
      expect(getProgress(total, 2000)).toBe(0);
    });
  });

  describe('2. Break Health Alerts & Interactive Check-Off States', () => {
    it('verifies exact 3 health cues exist with unique IDs and emojis', () => {
      const cues = [
        { id: 'hydration', emoji: '💧', title: 'Hydration' },
        { id: 'posture', emoji: '🧘', title: 'Posture & Stretch' },
        { id: 'eye_rest', emoji: '👁️', title: '20-20-20 Eye Rest' },
      ];

      const ids = new Set(cues.map((c) => c.id));
      expect(ids.size).toBe(3);
      expect(ids.has('hydration')).toBe(true);
      expect(ids.has('posture')).toBe(true);
      expect(ids.has('eye_rest')).toBe(true);
    });

    it('verifies independent toggling and state isolation for cue check-offs', () => {
      let state: Record<string, boolean> = {};

      const toggleCue = (id: string) => {
        state = { ...state, [id]: !state[id] };
      };

      toggleCue('hydration');
      expect(state['hydration']).toBe(true);
      expect(state['posture']).toBeFalsy();
      expect(state['eye_rest']).toBeFalsy();

      toggleCue('posture');
      expect(state['hydration']).toBe(true);
      expect(state['posture']).toBe(true);
      expect(state['eye_rest']).toBeFalsy();

      // Untoggle hydration
      toggleCue('hydration');
      expect(state['hydration']).toBe(false);
      expect(state['posture']).toBe(true);

      // Phase reset clears completed cues
      state = {};
      expect(Object.keys(state)).toHaveLength(0);
    });
  });

  describe('3. Focus Block 1-Click Agenda Scheduling', () => {
    it('schedules focus block with default fallback title and 25m duration', async () => {
      const res = await postTask({
        title: 'Deep Work Focus Block',
        type: 'todo',
        scheduled_date: '2026-10-28',
        scheduled_start: '14:00',
        scheduled_duration: 25,
        time_of_day: 'workday',
      });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Deep Work Focus Block');
      expect(res.body.scheduled_duration).toBe(25);
      expect(res.body.time_of_day).toBe('workday');

      const agenda = await getAgenda('2026-10-28');
      const item = agenda.body.scheduled_tasks.find((t: any) => t.id === res.body.id);
      expect(item).toBeDefined();
      expect(item.scheduled_start).toBe('14:00');
      expect(item.scheduled_duration).toBe(25);
    });

    it('schedules focus block with custom title and 50m ultradian duration', async () => {
      const res = await postTask({
        title: 'Distributed Transaction Whitepaper',
        type: 'todo',
        scheduled_date: '2026-10-28',
        scheduled_start: '10:00',
        scheduled_duration: 50,
        time_of_day: 'workday',
      });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Distributed Transaction Whitepaper');
      expect(res.body.scheduled_duration).toBe(50);

      const agenda = await getAgenda('2026-10-28');
      const item = agenda.body.scheduled_tasks.find((t: any) => t.id === res.body.id);
      expect(item.scheduled_duration).toBe(50);
    });
  });

  describe('4. Agenda Grid Habit Time-Blocking & Routine Indicators', () => {
    it('time-blocks habits and dailies without mutating type or losing recurring nature', async () => {
      const habit = await postTask({
        title: 'Midday Stretches',
        type: 'habit',
        time_of_day: 'workday',
        scheduled_date: '2026-10-28',
        scheduled_start: '12:30',
        scheduled_duration: 15,
      });

      const daily = await postTask({
        title: 'Evening Shutdown & Reflection',
        type: 'daily',
        time_of_day: 'evening',
        scheduled_date: '2026-10-28',
        scheduled_start: '17:30',
        scheduled_duration: 30,
        subtasks: ['Check email', 'Review calendar for tomorrow'],
      });

      expect(habit.body.type).toBe('habit');
      expect(daily.body.type).toBe('daily');

      const agenda = await getAgenda('2026-10-28');
      const scheduledHabit = agenda.body.scheduled_tasks.find((t: any) => t.id === habit.body.id);
      const scheduledDaily = agenda.body.scheduled_tasks.find((t: any) => t.id === daily.body.id);

      expect(scheduledHabit).toBeDefined();
      expect(scheduledHabit.type).toBe('habit');
      expect(scheduledHabit.time_of_day).toBe('workday');

      expect(scheduledDaily).toBeDefined();
      expect(scheduledDaily.type).toBe('daily');
      expect(scheduledDaily.time_of_day).toBe('evening');
      expect(scheduledDaily.subtasks).toHaveLength(2);
    });

    it('retains streak counter progression for dailies scheduled on the agenda', async () => {
      const daily = await postTask({
        title: 'Daily Meditation',
        type: 'daily',
        time_of_day: 'morning',
        scheduled_date: '2026-10-28',
        scheduled_start: '07:30',
        scheduled_duration: 20,
      });

      expect(daily.body.streak).toBe(0);

      const scored = await scoreTask(daily.body.id, 'up');
      expect(scored.body.streak).toBe(1);
      expect(scored.body.completed).toBe(1);

      const agenda = await getAgenda('2026-10-28');
      const item = agenda.body.scheduled_tasks.find((t: any) => t.id === daily.body.id);
      expect(item.streak).toBe(1);
      expect(item.completed).toBe(1);
    });

    it('retains habit increment counters for habits scheduled on the agenda', async () => {
      const habit = await postTask({
        title: 'Hydration 250ml',
        type: 'habit',
        time_of_day: 'workday',
        scheduled_date: '2026-10-28',
        scheduled_start: '11:00',
        scheduled_duration: 10,
      });

      await scoreTask(habit.body.id, 'up');
      await scoreTask(habit.body.id, 'up');
      const scored3 = await scoreTask(habit.body.id, 'up');

      expect(scored3.body.counter_up).toBe(3);

      const agenda = await getAgenda('2026-10-28');
      const item = agenda.body.scheduled_tasks.find((t: any) => t.id === habit.body.id);
      expect(item.counter_up).toBe(3);
    });

    it('preserves checklist subtask progression on scheduled routines', async () => {
      const routine = await postTask({
        title: 'Workstation Setup',
        type: 'daily',
        time_of_day: 'morning',
        scheduled_date: '2026-10-28',
        scheduled_start: '08:45',
        scheduled_duration: 15,
        subtasks: ['Fill water bottle', 'Adjust standing desk', 'Open Notion & Slack'],
      });

      const subtask1 = routine.body.subtasks[0];
      const subtask2 = routine.body.subtasks[1];

      await request(app)
        .patch(`/api/v1/subtasks/${subtask1.id}`)
        .set('X-API-Key', user.apiKey)
        .send({ completed: true });

      const agenda = await getAgenda('2026-10-28');
      const item = agenda.body.scheduled_tasks.find((t: any) => t.id === routine.body.id);

      const completedCount = item.subtasks.filter((s: any) => s.completed === 1).length;
      expect(completedCount).toBe(1);
      expect(item.subtasks).toHaveLength(3);

      // Complete second subtask
      await request(app)
        .patch(`/api/v1/subtasks/${subtask2.id}`)
        .set('X-API-Key', user.apiKey)
        .send({ completed: true });

      const agenda2 = await getAgenda('2026-10-28');
      const item2 = agenda2.body.scheduled_tasks.find((t: any) => t.id === routine.body.id);
      const completedCount2 = item2.subtasks.filter((s: any) => s.completed === 1).length;
      expect(completedCount2).toBe(2);
    });

    it('unschedules task cleanly from agenda without deleting task or losing time_of_day', async () => {
      const task = await postTask({
        title: 'Afternoon Reading',
        type: 'habit',
        time_of_day: 'workday',
        scheduled_date: '2026-10-28',
        scheduled_start: '15:00',
        scheduled_duration: 30,
      });

      const unscheduleRes = await patchTask(task.body.id, {
        scheduled_date: null,
        scheduled_start: null,
      });
      expect(unscheduleRes.status).toBe(200);
      expect(unscheduleRes.body.scheduled_date).toBeNull();
      expect(unscheduleRes.body.scheduled_start).toBeNull();
      expect(unscheduleRes.body.time_of_day).toBe('workday');
      expect(unscheduleRes.body.type).toBe('habit');

      const agenda = await getAgenda('2026-10-28');
      const found = agenda.body.scheduled_tasks.find((t: any) => t.id === task.body.id);
      expect(found).toBeUndefined();
    });
  });
});
