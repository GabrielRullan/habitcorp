import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { DatabaseSync } from 'node:sqlite';
import { app } from '../src/server/index.js';
import { resetDbForTesting, initSchema } from '../src/server/db.js';
import { runUserRollover } from '../src/server/rollover.js';

describe('WFH User Stories & Routine Verification Suite', () => {
  let user: { id: string; username: string; apiKey: string };

  const postTask = (p: any) => request(app).post('/api/v1/tasks').set('X-API-Key', user.apiKey).send(p);
  const getTask = (id: string) => request(app).get(`/api/v1/tasks/${id}`).set('X-API-Key', user.apiKey);
  const patchTask = (id: string, p: any) => request(app).patch(`/api/v1/tasks/${id}`).set('X-API-Key', user.apiKey).send(p);
  const scoreTask = (id: string, dir = 'up') => request(app).post(`/api/v1/tasks/${id}/score`).set('X-API-Key', user.apiKey).send({ direction: dir });
  const getAgenda = (d = '2026-10-28') => request(app).get(`/api/v1/agenda?start=${d}&end=${d}`).set('X-API-Key', user.apiKey);

  beforeEach(async () => {
    const memDb = new DatabaseSync(':memory:');
    memDb.exec('PRAGMA foreign_keys = ON;');
    initSchema(memDb);
    resetDbForTesting(memDb);

    const res = await request(app).post('/api/v1/auth/register').send({ username: 'maya_lin', password: 'password123' });
    user = res.body;
  });

  // --- TIER 1: FEATURE COVERAGE ---
  describe('Tier 1: Core Feature Verification', () => {
    it('T1.1: persists habits with time_of_day across all valid values', async () => {
      for (const tod of ['morning', 'workday', 'evening', 'anytime'] as const) {
        const createRes = await postTask({ title: `${tod} routine`, type: 'habit', time_of_day: tod });
        expect(createRes.status).toBe(201);
        expect(createRes.body.time_of_day).toBe(tod);

        const getRes = await getTask(createRes.body.id);
        expect(getRes.status).toBe(200);
        expect(getRes.body.time_of_day).toBe(tod);
        expect(getRes.body.type).toBe('habit');
      }
    });

    it('T1.2: filters tasks by time_of_day query parameter', async () => {
      await postTask({ title: 'M1', type: 'habit', time_of_day: 'morning' });
      await postTask({ title: 'M2', type: 'daily', time_of_day: 'morning' });
      await postTask({ title: 'W1', type: 'habit', time_of_day: 'workday' });
      await postTask({ title: 'E1', type: 'daily', time_of_day: 'evening' });

      const morningRes = await request(app).get('/api/v1/tasks?time_of_day=morning').set('X-API-Key', user.apiKey);
      expect(morningRes.status).toBe(200);
      expect(morningRes.body.tasks).toHaveLength(2);
      expect(morningRes.body.tasks.every((t: any) => t.time_of_day === 'morning')).toBe(true);

      const workdayRes = await request(app).get('/api/v1/tasks?time_of_day=workday').set('X-API-Key', user.apiKey);
      expect(workdayRes.status).toBe(200);
      expect(workdayRes.body.tasks).toHaveLength(1);
      expect(workdayRes.body.tasks[0].title).toBe('W1');
    });

    it('T1.3: batch ingests tasks with various time_of_day taxonomy values', async () => {
      const batchRes = await request(app).post('/api/v1/tasks/batch').set('X-API-Key', user.apiKey).send({
        tasks: [
          { title: 'Hydrate', type: 'habit', time_of_day: 'morning', difficulty: 'trivial' },
          { title: 'Posture Stretch', type: 'habit', time_of_day: 'workday', difficulty: 'easy' },
          { title: 'Shutdown', type: 'daily', time_of_day: 'evening', subtasks: ['Clean inbox', 'Log notes'] },
          { title: 'Read Book', type: 'daily', time_of_day: 'anytime', difficulty: 'medium' },
        ],
      });
      expect(batchRes.status).toBe(201);
      expect(batchRes.body.created_count).toBe(4);
      expect(batchRes.body.tasks.map((t: any) => t.time_of_day)).toEqual(['morning', 'workday', 'evening', 'anytime']);
      expect(batchRes.body.tasks[2].subtasks).toHaveLength(2);
    });

    it('T1.4: time-blocks habits onto agenda while preserving habit/daily type', async () => {
      const habitRes = await postTask({
        title: 'Morning Review', type: 'daily', time_of_day: 'morning',
        scheduled_date: '2026-10-28', scheduled_start: '08:30', scheduled_duration: 30,
      });
      expect(habitRes.status).toBe(201);
      expect(habitRes.body.type).toBe('daily');

      const agendaRes = await getAgenda('2026-10-28');
      expect(agendaRes.status).toBe(200);
      const scheduled = agendaRes.body.scheduled_tasks.find((t: any) => t.id === habitRes.body.id);
      expect(scheduled).toBeDefined();
      expect(scheduled.type).toBe('daily');
      expect(scheduled.time_of_day).toBe('morning');
      expect(scheduled.scheduled_start).toBe('08:30');
      expect(scheduled.scheduled_duration).toBe(30);
    });
  });

  // --- TIER 2: BOUNDARY & CORNER CASES ---
  describe('Tier 2: Boundary & Corner Cases', () => {
    it('T2.1: defaults omitted or null time_of_day to anytime', async () => {
      const resOmitted = await postTask({ title: 'Omitted TOD', type: 'habit' });
      expect(resOmitted.status).toBe(201);
      expect(resOmitted.body.time_of_day).toBe('anytime');

      const resNull = await postTask({ title: 'Null TOD', type: 'habit', time_of_day: null });
      expect(resNull.status).toBe(201);
      expect(resNull.body.time_of_day).toBe('anytime');
    });

    it('T2.2: rejects invalid time_of_day with HTTP 400 on create, patch, and filter', async () => {
      const badCreate = await postTask({ title: 'Bad TOD', type: 'habit', time_of_day: 'night' });
      expect(badCreate.status).toBe(400);

      const validTask = await postTask({ title: 'Good Task', type: 'habit', time_of_day: 'morning' });
      expect(validTask.status).toBe(201);

      const badPatch = await patchTask(validTask.body.id, { time_of_day: 'afternoon' });
      expect(badPatch.status).toBe(400);

      const badFilter = await request(app).get('/api/v1/tasks?time_of_day=dawn').set('X-API-Key', user.apiKey);
      expect(badFilter.status).toBe(400);
    });

    it('T2.3: increments counters and streaks without wiping agenda scheduling fields', async () => {
      const dailyRes = await postTask({
        title: 'Scheduled Stretch', type: 'daily',
        scheduled_date: '2026-10-28', scheduled_start: '09:00', scheduled_duration: 15,
      });
      const scored = await scoreTask(dailyRes.body.id, 'up');
      expect(scored.status).toBe(200);
      expect(scored.body.streak).toBe(1);
      expect(scored.body.completed).toBe(1);
      expect(scored.body.scheduled_date).toBe('2026-10-28');
      expect(scored.body.scheduled_start).toBe('09:00');
      expect(scored.body.scheduled_duration).toBe(15);
    });

    it('T2.4: preserves time_of_day across midnight user rollover execution', async () => {
      const t1 = await postTask({ title: 'Morning Hydrate', type: 'daily', time_of_day: 'morning' });
      const t2 = await postTask({ title: 'Workday Focus', type: 'habit', time_of_day: 'workday' });

      await scoreTask(t1.body.id, 'up');
      runUserRollover(user.id, '2026-10-29');

      const res1 = await getTask(t1.body.id);
      expect(res1.body.time_of_day).toBe('morning');
      expect(res1.body.completed).toBe(0);
      expect(res1.body.streak).toBe(1);

      const res2 = await getTask(t2.body.id);
      expect(res2.body.time_of_day).toBe('workday');
    });
  });

  // --- TIER 3: CROSS-FEATURE COMBINATIONS ---
  describe('Tier 3: Cross-Feature Combinations', () => {
    it('T3.1: supports habit routine and ghost meeting coexistence on agenda at same hour', async () => {
      const ghost = await request(app).post('/api/v1/ghosts').set('X-API-Key', user.apiKey).send({
        name: 'Marcus', relation: 'Spouse', color: '#ec4899',
      });

      await request(app).post('/api/v1/meetings').set('X-API-Key', user.apiKey).send({
        title: 'Marcus Orthodontist Pickup',
        start_time: '2026-10-28T15:00:00.000Z',
        end_time: '2026-10-28T16:00:00.000Z',
        is_ghost: true, ghost_id: ghost.body.id, ghost_name: 'Marcus (Spouse)',
      });

      await postTask({
        title: 'Afternoon Focus Sprint', type: 'habit', time_of_day: 'workday',
        scheduled_date: '2026-10-28', scheduled_start: '15:00', scheduled_duration: 60,
      });

      const agenda = await getAgenda('2026-10-28');
      expect(agenda.status).toBe(200);
      expect(agenda.body.meetings.some((m: any) => m.is_ghost === 1 && m.title.includes('Marcus'))).toBe(true);
      expect(agenda.body.scheduled_tasks.some((t: any) => t.title === 'Afternoon Focus Sprint')).toBe(true);
    });

    it('T3.2: links habit with time_of_day to project and updates project task counts', async () => {
      const proj = await request(app).post('/api/v1/projects').set('X-API-Key', user.apiKey).send({
        name: 'Distributed Systems Core', color: '#6366f1',
      });

      await postTask({
        title: 'Read Consensus RFC', type: 'daily', time_of_day: 'workday', project_id: proj.body.id,
      });

      const projList = await request(app).get('/api/v1/projects').set('X-API-Key', user.apiKey);
      const found = projList.body.projects.find((p: any) => p.id === proj.body.id);
      expect(found.total_tasks).toBe(1);

      const filterRes = await request(app).get(`/api/v1/tasks?project_id=${proj.body.id}&time_of_day=workday`).set('X-API-Key', user.apiKey);
      expect(filterRes.body.tasks).toHaveLength(1);
      expect(filterRes.body.tasks[0].project_name).toBe('Distributed Systems Core');
    });

    it('T3.3: updates checklist subtask progress on scheduled routine in agenda payload', async () => {
      const daily = await postTask({
        title: 'Nutrient Breakfast', type: 'daily', time_of_day: 'morning',
        scheduled_date: '2026-10-28', scheduled_start: '08:00', scheduled_duration: 30,
        subtasks: ['Omega 3 + D3', 'High protein breakfast', 'Green tea'],
      });

      const sub1 = daily.body.subtasks[0];
      await request(app).patch(`/api/v1/subtasks/${sub1.id}`).set('X-API-Key', user.apiKey).send({ completed: true });

      const agenda = await getAgenda('2026-10-28');
      const item = agenda.body.scheduled_tasks.find((t: any) => t.id === daily.body.id);
      expect(item.subtasks).toHaveLength(3);
      expect(item.subtasks.filter((s: any) => s.completed === 1)).toHaveLength(1);
    });

    it('T3.4: allows dynamic rescheduling of tasks without altering identity or type', async () => {
      const task = await postTask({
        title: 'Architecture Review', type: 'todo',
        scheduled_date: '2026-10-28', scheduled_start: '15:00', scheduled_duration: 45,
      });

      const patchRes = await patchTask(task.body.id, { scheduled_start: '16:15', scheduled_duration: 60 });
      expect(patchRes.status).toBe(200);
      expect(patchRes.body.scheduled_start).toBe('16:15');
      expect(patchRes.body.scheduled_duration).toBe(60);

      const agenda = await getAgenda('2026-10-28');
      const scheduled = agenda.body.scheduled_tasks.find((t: any) => t.id === task.body.id);
      expect(scheduled.scheduled_start).toBe('16:15');
      expect(scheduled.scheduled_duration).toBe(60);
    });
  });

  // --- TIER 4: REAL-WORLD WFH USER STORIES ---
  describe('Tier 4: Real-World WFH User Stories', () => {
    it("T4.1: User Story 1 (Maya's Morning Kickoff): ingests, filters, scores, and time-blocks morning routines", async () => {
      const batchRes = await request(app).post('/api/v1/tasks/batch').set('X-API-Key', user.apiKey).send({
        tasks: [
          { title: 'Hydrate (500ml warm water & lemon)', type: 'habit', time_of_day: 'morning' },
          { title: 'Morning Mobility & Core (20m)', type: 'daily', time_of_day: 'morning', difficulty: 'medium' },
          { title: 'Vitamins & Nutrient-Rich Breakfast', type: 'daily', time_of_day: 'morning', subtasks: ['Omega 3 + D3', 'High protein breakfast'] },
          { title: 'Morning Agenda Review & Top 3 Priorities', type: 'daily', time_of_day: 'morning', scheduled_date: '2026-10-28', scheduled_start: '08:30', scheduled_duration: 30 },
        ],
      });
      expect(batchRes.status).toBe(201);
      const [hydrate, mobility, , review] = batchRes.body.tasks;

      const morningRes = await request(app).get('/api/v1/tasks?time_of_day=morning').set('X-API-Key', user.apiKey);
      expect(morningRes.body.tasks).toHaveLength(4);

      const scoreHydrate = await scoreTask(hydrate.id, 'up');
      expect(scoreHydrate.body.counter_up).toBe(1);

      const scoreMobility = await scoreTask(mobility.id, 'up');
      expect(scoreMobility.body.completed).toBe(1);
      expect(scoreMobility.body.streak).toBe(1);

      const agenda = await getAgenda('2026-10-28');
      const agendaItem = agenda.body.scheduled_tasks.find((t: any) => t.id === review.id);
      expect(agendaItem).toBeDefined();
      expect(agendaItem.type).toBe('daily');
      expect(agendaItem.scheduled_start).toBe('08:30');
    });

    it('T4.2: User Story 2 (Workday Pacing & Health): tracks hydration, stretches, and lunch walk', async () => {
      const batchRes = await request(app).post('/api/v1/tasks/batch').set('X-API-Key', user.apiKey).send({
        tasks: [
          { title: 'Desk Hydration Counter', type: 'habit', time_of_day: 'workday' },
          { title: 'Ergonomic Posture & Eye Rest', type: 'habit', time_of_day: 'workday' },
          { title: 'Midday Lunch & 30m Nature Walk', type: 'daily', time_of_day: 'workday', scheduled_date: '2026-10-28', scheduled_start: '12:30', scheduled_duration: 60 },
          { title: 'Draft Distributed Consensus Architecture RFC', type: 'todo', time_of_day: 'workday', scheduled_date: '2026-10-28', scheduled_start: '10:00', scheduled_duration: 50 },
        ],
      });
      const [hydration, , lunchWalk, focusTask] = batchRes.body.tasks;

      const workdayList = await request(app).get('/api/v1/tasks?time_of_day=workday').set('X-API-Key', user.apiKey);
      expect(workdayList.body.tasks).toHaveLength(4);

      await scoreTask(hydration.id, 'up');
      const scoredHydration = await scoreTask(hydration.id, 'up');
      expect(scoredHydration.body.counter_up).toBe(2);

      const walkScore = await scoreTask(lunchWalk.id, 'up');
      expect(walkScore.body.completed).toBe(1);
      expect(walkScore.body.streak).toBe(1);

      const agenda = await getAgenda('2026-10-28');
      expect(agenda.body.scheduled_tasks.some((t: any) => t.id === lunchWalk.id && t.completed === 1)).toBe(true);
      expect(agenda.body.scheduled_tasks.some((t: any) => t.id === focusTask.id && t.scheduled_start === '10:00')).toBe(true);
    });

    it('T4.3: User Story 3 (Ghost Collision & Rescheduling): detects collision with family ghost event and reschedules', async () => {
      const ghost = await request(app).post('/api/v1/ghosts').set('X-API-Key', user.apiKey).send({
        name: 'Marcus', relation: 'Spouse', color: '#ec4899',
      });

      await request(app).post('/api/v1/meetings').set('X-API-Key', user.apiKey).send({
        title: 'Urgent Orthodontist Appointment (Need Kids Pickup)',
        start_time: '2026-10-28T15:00:00.000Z',
        end_time: '2026-10-28T16:00:00.000Z',
        is_ghost: true, ghost_id: ghost.body.id, ghost_name: 'Marcus (Spouse)',
      });

      const taskRes = await postTask({
        title: 'Code Review: Raft Consensus Primitives', type: 'todo',
        scheduled_date: '2026-10-28', scheduled_start: '15:00', scheduled_duration: 45,
      });

      const agendaBefore = await getAgenda('2026-10-28');
      const ghostEvent = agendaBefore.body.meetings.find((m: any) => m.is_ghost === 1);
      const initialTask = agendaBefore.body.scheduled_tasks.find((t: any) => t.id === taskRes.body.id);
      expect(ghostEvent.start_time).toContain('15:00');
      expect(initialTask.scheduled_start).toBe('15:00');

      const patchRes = await patchTask(taskRes.body.id, { scheduled_start: '16:15', scheduled_duration: 45 });
      expect(patchRes.status).toBe(200);

      const agendaAfter = await getAgenda('2026-10-28');
      const rescheduledTask = agendaAfter.body.scheduled_tasks.find((t: any) => t.id === taskRes.body.id);
      expect(rescheduledTask.scheduled_start).toBe('16:15');
    });

    it('T4.4: User Story 4 (Evening Shutdown Routine): completes checklist, scores shutdown daily, verifies streak & rollover', async () => {
      const shutdown = await postTask({
        title: 'Workday Shutdown Checklist', type: 'daily', time_of_day: 'evening',
        subtasks: ['Slack status to Away', 'Inbox zero sweep', 'Log git commits', 'Close work tabs'],
      });
      expect(shutdown.status).toBe(201);
      expect(shutdown.body.subtasks).toHaveLength(4);

      for (const sub of shutdown.body.subtasks) {
        const patchSub = await request(app).patch(`/api/v1/subtasks/${sub.id}`).set('X-API-Key', user.apiKey).send({ completed: true });
        expect(patchSub.status).toBe(200);
        expect(patchSub.body.completed).toBe(1);
      }

      const scoreRes = await scoreTask(shutdown.body.id, 'up');
      expect(scoreRes.body.completed).toBe(1);
      expect(scoreRes.body.streak).toBe(1);
      expect(scoreRes.body.subtasks.every((s: any) => s.completed === 1)).toBe(true);

      const tomorrowTask = await postTask({ title: 'Deploy v2 Cluster', type: 'todo', scheduled_date: '2026-10-29' });
      expect(tomorrowTask.status).toBe(201);

      runUserRollover(user.id, '2026-10-29');

      const afterRollover = await getTask(shutdown.body.id);
      expect(afterRollover.body.completed).toBe(0);
      expect(afterRollover.body.streak).toBe(1);
      expect(afterRollover.body.time_of_day).toBe('evening');
    });
  });
});
