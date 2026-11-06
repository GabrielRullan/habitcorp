import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/server/index';
import { getDb, resetDbForTesting } from '../src/server/db';

describe('Behavioral Science: Habit Stacking & Cue Anchoring (BJ Fogg)', () => {
  let authToken: string;

  beforeEach(async () => {
    resetDbForTesting();
    const uname = `fogg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: uname, password: 'password123' });
    authToken = res.body.apiKey;
  });

  it('creates an anchor routine and stacks a second routine after it', async () => {
    // 1. Create Anchor Habit: Morning Coffee
    const anchorRes = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        type: 'habit',
        title: 'Morning Coffee',
        time_of_day: 'morning',
      });
    expect(anchorRes.status).toBe(201);
    const anchorId = anchorRes.body.id;

    // 2. Create Stacked Habit: 2-min Meditation
    const stackedRes = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        type: 'daily',
        title: 'Meditate 2 minutes',
        time_of_day: 'morning',
        difficulty: 'trivial',
        anchor_task_id: anchorId,
        anchor_habit_title: 'Morning Coffee',
      });
    expect(stackedRes.status).toBe(201);
    expect(stackedRes.body.anchor_task_id).toBe(anchorId);
    expect(stackedRes.body.anchor_habit_title).toBe('Morning Coffee');

    // 3. Verify retrieval in GET /tasks
    const listRes = await request(app)
      .get('/api/v1/tasks')
      .set('Authorization', `Bearer ${authToken}`);
    expect(listRes.status).toBe(200);

    const retrievedStacked = listRes.body.tasks.find((t: any) => t.id === stackedRes.body.id);
    expect(retrievedStacked).toBeDefined();
    expect(retrievedStacked.anchor_task_id).toBe(anchorId);
    expect(retrievedStacked.anchor_habit_title).toBe('Morning Coffee');
  });

  it('updates anchor habit link via PATCH /tasks/:id', async () => {
    const taskRes = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        type: 'daily',
        title: 'Drink 500ml Water',
      });
    const taskId = taskRes.body.id;

    const patchRes = await request(app)
      .patch(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        anchor_habit_title: 'Waking Up',
      });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.anchor_habit_title).toBe('Waking Up');
  });

  it('supports habit stacking via batch ingestion endpoint POST /tasks/batch', async () => {
    const batchRes = await request(app)
      .post('/api/v1/tasks/batch')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        tasks: [
          {
            type: 'habit',
            title: 'Brush Teeth',
            time_of_day: 'morning',
          },
          {
            type: 'daily',
            title: 'Floss 1 Tooth',
            time_of_day: 'morning',
            anchor_habit_title: 'Brush Teeth',
          },
        ],
      });
    expect(batchRes.status).toBe(201);
    expect(batchRes.body.created_count).toBe(2);

    const listRes = await request(app)
      .get('/api/v1/tasks')
      .set('Authorization', `Bearer ${authToken}`);
    const flossTask = listRes.body.tasks.find((t: any) => t.title === 'Floss 1 Tooth');
    expect(flossTask.anchor_habit_title).toBe('Brush Teeth');
  });
});
