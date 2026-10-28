import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { DatabaseSync } from 'node:sqlite';
import { app } from '../src/server/index.js';
import { resetDbForTesting, initSchema } from '../src/server/db.js';

describe('Cadence API Suite', () => {
  let userA: { id: string; username: string; apiKey: string };
  let userB: { id: string; username: string; apiKey: string };

  beforeEach(async () => {
    // Fresh in-memory database for isolated testing
    const memDb = new DatabaseSync(':memory:');
    memDb.exec('PRAGMA foreign_keys = ON;');
    initSchema(memDb);
    resetDbForTesting(memDb);

    // Register User A
    const resA = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'alice', password: 'password123' });
    userA = resA.body;

    // Register User B
    const resB = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'bob', password: 'password456' });
    userB = resB.body;
  });

  it('registers and authenticates users with isolated API keys', async () => {
    expect(userA.username).toBe('alice');
    expect(userA.apiKey).toMatch(/^tk_/);
    expect(userB.username).toBe('bob');
    expect(userA.id).not.toBe(userB.id);

    // Login test
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'alice', password: 'password123' });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.apiKey).toBe(userA.apiKey);
  });

  it('authenticates and creates accounts passwordlessly via Magic Links', async () => {
    // 1. Request magic link for new user without password
    const linkRes = await request(app)
      .post('/api/v1/auth/magic-link')
      .send({ email: 'carol@example.com' });

    expect(linkRes.status).toBe(200);
    expect(linkRes.body.ok).toBe(true);
    expect(linkRes.body.token).toMatch(/^ml_/);
    expect(linkRes.body.user.username).toBe('carol');
    const token = linkRes.body.token;

    // 2. Verify magic link -> logs in and provides apiKey
    const verifyRes = await request(app)
      .post('/api/v1/auth/verify-magic-link')
      .send({ token });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.ok).toBe(true);
    expect(verifyRes.body.username).toBe('carol');
    expect(verifyRes.body.apiKey).toMatch(/^tk_/);

    // 3. Replay attack prevention: Same token cannot be used twice
    const replayRes = await request(app)
      .post('/api/v1/auth/verify-magic-link')
      .send({ token });
    expect(replayRes.status).toBe(400);
    expect(replayRes.body.error).toMatch(/already been used/);
  });

  it('enforces multi-user isolation on tasks', async () => {
    // User A creates a task
    const createRes = await request(app)
      .post('/api/v1/tasks')
      .set('X-API-Key', userA.apiKey)
      .send({
        title: 'Alice Secret Task',
        type: 'todo',
        difficulty: 'hard',
      });
    expect(createRes.status).toBe(201);
    const taskId = createRes.body.id;

    // User B tries to view Alice's task -> 404
    const getResB = await request(app)
      .get(`/api/v1/tasks/${taskId}`)
      .set('X-API-Key', userB.apiKey);
    expect(getResB.status).toBe(404);

    // User A views own task -> 200
    const getResA = await request(app)
      .get(`/api/v1/tasks/${taskId}`)
      .set('X-API-Key', userA.apiKey);
    expect(getResA.status).toBe(200);
    expect(getResA.body.title).toBe('Alice Secret Task');
  });

  it('creates and scores habits (+/- counters)', async () => {
    const res = await request(app)
      .post('/api/v1/tasks')
      .set('X-API-Key', userA.apiKey)
      .send({
        title: 'Drink 2L Water',
        type: 'habit',
        difficulty: 'trivial',
        habit_positive: true,
        habit_negative: false,
      });
    expect(res.status).toBe(201);
    const habitId = res.body.id;

    // Score up twice
    await request(app)
      .post(`/api/v1/tasks/${habitId}/score`)
      .set('X-API-Key', userA.apiKey)
      .send({ direction: 'up' });
    const scoreRes = await request(app)
      .post(`/api/v1/tasks/${habitId}/score`)
      .set('X-API-Key', userA.apiKey)
      .send({ direction: 'up' });

    expect(scoreRes.body.counter_up).toBe(2);
    expect(scoreRes.body.counter_down).toBe(0);
  });

  it('manages periodical dailies, streak calculations, and subtasks', async () => {
    const res = await request(app)
      .post('/api/v1/tasks')
      .set('X-API-Key', userA.apiKey)
      .send({
        title: 'Morning Routine',
        type: 'daily',
        difficulty: 'easy',
        frequency: 'daily',
        subtasks: ['Stretch', 'Meditate 10m', 'Review Day Agenda'],
      });

    expect(res.status).toBe(201);
    expect(res.body.subtasks.length).toBe(3);
    const dailyId = res.body.id;

    // Score daily complete -> streak 1
    const scoreRes1 = await request(app)
      .post(`/api/v1/tasks/${dailyId}/score`)
      .set('X-API-Key', userA.apiKey)
      .send({ direction: 'up' });
    expect(scoreRes1.body.completed).toBe(1);
    expect(scoreRes1.body.streak).toBe(1);

    // Toggle subtask completion
    const subtaskId = scoreRes1.body.subtasks[0].id;
    const subRes = await request(app)
      .patch(`/api/v1/subtasks/${subtaskId}`)
      .set('X-API-Key', userA.apiKey)
      .send({ completed: true });
    expect(subRes.status).toBe(200);
    expect(subRes.body.completed).toBe(1);
  });

  it('supports batch task creation for AI agents', async () => {
    const res = await request(app)
      .post('/api/v1/tasks/batch')
      .set('X-API-Key', userA.apiKey)
      .send({
        tasks: [
          { title: 'Write Spec', type: 'todo', difficulty: 'medium' },
          { title: 'Code API', type: 'todo', difficulty: 'hard' },
          { title: 'Deploy', type: 'todo', difficulty: 'easy', due_date: '2026-10-30' },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.created_count).toBe(3);

    const listRes = await request(app)
      .get('/api/v1/tasks?difficulty=hard')
      .set('X-API-Key', userA.apiKey);
    expect(listRes.body.tasks.length).toBe(1);
    expect(listRes.body.tasks[0].title).toBe('Code API');
  });

  it('schedules a task onto the Agenda and retrieves unified timeline', async () => {
    // 1. Create a task with time-block
    const taskRes = await request(app)
      .post('/api/v1/tasks')
      .set('X-API-Key', userA.apiKey)
      .send({
        title: 'Deep Work: System Architecture',
        type: 'todo',
        difficulty: 'hard',
        scheduled_date: '2026-10-28',
        scheduled_start: '14:00',
        scheduled_duration: 90,
      });
    expect(taskRes.status).toBe(201);

    // 2. Create a calendar meeting
    const meetingRes = await request(app)
      .post('/api/v1/meetings')
      .set('X-API-Key', userA.apiKey)
      .send({
        title: 'Team Sync',
        start_time: '2026-10-28T10:00:00.000Z',
        end_time: '2026-10-28T11:00:00.000Z',
        location: 'Google Meet',
      });
    expect(meetingRes.status).toBe(201);

    // 3. Query /agenda for 2026-10-28
    const agendaRes = await request(app)
      .get('/api/v1/agenda?start=2026-10-28&end=2026-10-28')
      .set('X-API-Key', userA.apiKey);

    expect(agendaRes.status).toBe(200);
    expect(agendaRes.body.meetings.length).toBe(1);
    expect(agendaRes.body.meetings[0].title).toBe('Team Sync');
    expect(agendaRes.body.scheduled_tasks.length).toBe(1);
    expect(agendaRes.body.scheduled_tasks[0].title).toBe('Deep Work: System Architecture');
    expect(agendaRes.body.scheduled_tasks[0].scheduled_start).toBe('14:00');
    expect(agendaRes.body.scheduled_tasks[0].scheduled_duration).toBe(90);
  });

  it('updates (edits) and deletes calendar events on the agenda', async () => {
    // 1. Create event
    const createRes = await request(app)
      .post('/api/v1/meetings')
      .set('X-API-Key', userA.apiKey)
      .send({
        title: 'Weekly Standup',
        start_time: '2026-10-28T09:00:00.000Z',
        end_time: '2026-10-28T09:30:00.000Z',
        location: 'Room A',
      });
    expect(createRes.status).toBe(201);
    const meetingId = createRes.body.id;

    // 2. Edit event (PATCH)
    const patchRes = await request(app)
      .patch(`/api/v1/meetings/${meetingId}`)
      .set('X-API-Key', userA.apiKey)
      .send({
        title: 'Weekly Standup (Rescheduled & Updated)',
        location: 'Zoom Room 1',
        start_time: '2026-10-28T11:00:00.000Z',
        end_time: '2026-10-28T11:45:00.000Z',
        description: 'Review architecture RFC',
      });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.title).toBe('Weekly Standup (Rescheduled & Updated)');
    expect(patchRes.body.location).toBe('Zoom Room 1');
    expect(patchRes.body.start_time).toBe('2026-10-28T11:00:00.000Z');
    expect(patchRes.body.end_time).toBe('2026-10-28T11:45:00.000Z');
    expect(patchRes.body.description).toBe('Review architecture RFC');

    // 3. Delete event (DELETE)
    const deleteRes = await request(app)
      .delete(`/api/v1/meetings/${meetingId}`)
      .set('X-API-Key', userA.apiKey);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);

    // 4. Verify gone from agenda
    const verifyRes = await request(app)
      .get('/api/v1/agenda?start=2026-10-28&end=2026-10-28')
      .set('X-API-Key', userA.apiKey);
    const found = verifyRes.body.meetings.find((m: any) => m.id === meetingId);
    expect(found).toBeUndefined();
  });

  it('manages ghosts (family/spouse external calendars) and agenda visibility', async () => {
    // 1. Create a Ghost for user A (e.g. Spouse)
    const ghostRes = await request(app)
      .post('/api/v1/ghosts')
      .set('X-API-Key', userA.apiKey)
      .send({
        name: 'Sarah',
        relation: 'Spouse',
        color: '#ec4899',
      });
    expect(ghostRes.status).toBe(201);
    const ghostId = ghostRes.body.id;
    expect(ghostRes.body.name).toBe('Sarah');

    // 2. Add an event for this ghost
    const meetingRes = await request(app)
      .post('/api/v1/meetings')
      .set('X-API-Key', userA.apiKey)
      .send({
        title: 'Sarah Doctor Appointment',
        start_time: '2026-10-28T15:00:00.000Z',
        end_time: '2026-10-28T16:00:00.000Z',
        is_ghost: true,
        ghost_id: ghostId,
        ghost_name: 'Sarah (Spouse)',
      });
    expect(meetingRes.status).toBe(201);
    expect(meetingRes.body.is_ghost).toBe(1);
    expect(meetingRes.body.ghost_name).toBe('Sarah (Spouse)');

    // 3. Query agenda and verify ghost is included
    const agendaRes = await request(app)
      .get('/api/v1/agenda?start=2026-10-28&end=2026-10-28')
      .set('X-API-Key', userA.apiKey);
    expect(agendaRes.status).toBe(200);
    expect(agendaRes.body.ghosts.length).toBe(1);
    expect(agendaRes.body.ghosts[0].name).toBe('Sarah');

    const ghostMeeting = agendaRes.body.meetings.find((m: any) => m.is_ghost === 1);
    expect(ghostMeeting).toBeDefined();
    expect(ghostMeeting.title).toBe('Sarah Doctor Appointment');

    // 3.5. Edit ghost (PATCH) and verify event ghost_name and color cascade
    const patchGhostRes = await request(app)
      .patch(`/api/v1/ghosts/${ghostId}`)
      .set('X-API-Key', userA.apiKey)
      .send({
        name: 'Sarah Smith',
        relation: 'Partner',
        color: '#8b5cf6',
      });
    expect(patchGhostRes.status).toBe(200);
    expect(patchGhostRes.body.name).toBe('Sarah Smith');
    expect(patchGhostRes.body.relation).toBe('Partner');
    expect(patchGhostRes.body.color).toBe('#8b5cf6');

    // Verify cascade to agenda meeting
    const updatedAgenda = await request(app)
      .get('/api/v1/agenda?start=2026-10-28&end=2026-10-28')
      .set('X-API-Key', userA.apiKey);
    const updatedGhostEvent = updatedAgenda.body.meetings.find((m: any) => m.ghost_id === ghostId);
    expect(updatedGhostEvent.ghost_name).toBe('Sarah Smith');
    expect(updatedGhostEvent.color).toBe('#8b5cf6');

    // 4. Delete ghost -> cascades to meeting
    const delRes = await request(app)
      .delete(`/api/v1/ghosts/${ghostId}`)
      .set('X-API-Key', userA.apiKey);
    expect(delRes.status).toBe(200);

    const afterDel = await request(app)
      .get('/api/v1/agenda?start=2026-10-28&end=2026-10-28')
      .set('X-API-Key', userA.apiKey);
    expect(afterDel.body.ghosts.length).toBe(0);
    expect(afterDel.body.meetings.some((m: any) => m.is_ghost === 1)).toBe(false);
  });

  it('supports events with multiple ghosts and preserves association', async () => {
    // 1. Create two Ghosts
    const g1 = await request(app)
      .post('/api/v1/ghosts')
      .set('X-API-Key', userA.apiKey)
      .send({ name: 'Leo', relation: 'Child', color: '#3b82f6' });
    const g2 = await request(app)
      .post('/api/v1/ghosts')
      .set('X-API-Key', userA.apiKey)
      .send({ name: 'Maya', relation: 'Child', color: '#10b981' });

    expect(g1.status).toBe(201);
    expect(g2.status).toBe(201);
    const leoId = g1.body.id;
    const mayaId = g2.body.id;

    // 2. Create meeting with both ghosts
    const meetRes = await request(app)
      .post('/api/v1/meetings')
      .set('X-API-Key', userA.apiKey)
      .send({
        title: 'Kids Swimming Practice',
        start_time: '2026-10-28T16:00:00.000Z',
        end_time: '2026-10-28T17:00:00.000Z',
        ghost_ids: [leoId, mayaId],
      });

    expect(meetRes.status).toBe(201);
    expect(meetRes.body.is_ghost).toBe(1);
    expect(meetRes.body.ghost_ids).toContain(leoId);
    expect(meetRes.body.ghost_ids).toContain(mayaId);
    expect(meetRes.body.ghost_name).toContain('Leo');
    expect(meetRes.body.ghost_name).toContain('Maya');

    // 3. Query agenda and verify both ghost ids present
    const agendaRes = await request(app)
      .get('/api/v1/agenda?start=2026-10-28&end=2026-10-28')
      .set('X-API-Key', userA.apiKey);
    const swimMeeting = agendaRes.body.meetings.find((m: any) => m.title === 'Kids Swimming Practice');
    expect(swimMeeting).toBeDefined();
    expect(swimMeeting.ghost_ids).toEqual(expect.arrayContaining([leoId, mayaId]));

    // 4. Update meeting to add / change ghosts
    const patchRes = await request(app)
      .patch(`/api/v1/meetings/${swimMeeting.id}`)
      .set('X-API-Key', userA.apiKey)
      .send({
        ghost_ids: [mayaId],
      });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.ghost_ids).toEqual([mayaId]);
  });

  it('manages projects and links habits & tasks together', async () => {
    // 1. Create a project "Chinese learning"
    const projRes = await request(app)
      .post('/api/v1/projects')
      .set('X-API-Key', userA.apiKey)
      .send({
        name: 'Chinese learning',
        color: '#ec4899',
      });
    expect(projRes.status).toBe(201);
    expect(projRes.body.name).toBe('Chinese learning');
    const projectId = projRes.body.id;

    // 2. Create a Habit linked to the project
    const habitRes = await request(app)
      .post('/api/v1/tasks')
      .set('X-API-Key', userA.apiKey)
      .send({
        title: 'Daily 20m Anki flashcards',
        type: 'daily',
        frequency: 'daily',
        project_id: projectId,
      });
    expect(habitRes.status).toBe(201);
    expect(habitRes.body.project_id).toBe(projectId);
    expect(habitRes.body.project_name).toBe('Chinese learning');

    // 3. Create a Task linked to the project
    const taskRes = await request(app)
      .post('/api/v1/tasks')
      .set('X-API-Key', userA.apiKey)
      .send({
        title: 'Complete HSK 3 Practice Exam',
        type: 'todo',
        due_date: '2026-10-28',
        project_id: projectId,
      });
    expect(taskRes.status).toBe(201);
    expect(taskRes.body.project_id).toBe(projectId);
    expect(taskRes.body.project_name).toBe('Chinese learning');

    // 4. Filter tasks by project_id
    const filteredRes = await request(app)
      .get(`/api/v1/tasks?project_id=${projectId}`)
      .set('X-API-Key', userA.apiKey);
    expect(filteredRes.status).toBe(200);
    expect(filteredRes.body.tasks.length).toBe(2);

    // 5. Query projects and verify task count
    const listProjRes = await request(app)
      .get('/api/v1/projects')
      .set('X-API-Key', userA.apiKey);
    expect(listProjRes.status).toBe(200);
    const proj = listProjRes.body.projects.find((p: any) => p.id === projectId);
    expect(proj).toBeDefined();
    expect(proj.total_tasks).toBe(2);
  });
});
