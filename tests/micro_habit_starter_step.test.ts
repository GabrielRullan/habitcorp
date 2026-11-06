import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/server/index';

describe('Cycle 9: Micro-Habit Scaling & Minimum Viable Routine (BJ Fogg $B=MAP$)', () => {
  const testUser = `fogg_user_${Date.now()}`;
  let apiKey = '';

  it('registers a test user for micro-habit evaluation', async () => {
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: testUser, password: 'password123' });

    expect(regRes.status).toBe(201);
    apiKey = regRes.body.apiKey;
    expect(apiKey).toBeDefined();
  });

  it('creates a habit with a micro-habit starter step (tiny version)', async () => {
    const res = await request(app)
      .post('/api/v1/tasks')
      .set('X-API-Key', apiKey)
      .send({
        type: 'habit',
        title: 'Morning 45-Minute Workout',
        difficulty: 'hard',
        time_of_day: 'morning',
        micro_habit_title: 'Put on running shoes and do 1 stretch',
      });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Morning 45-Minute Workout');
    expect(res.body.micro_habit_title).toBe('Put on running shoes and do 1 stretch');
  });

  it('updates a task with a micro-habit starter step via PATCH', async () => {
    const createRes = await request(app)
      .post('/api/v1/tasks')
      .set('X-API-Key', apiKey)
      .send({
        type: 'daily',
        title: 'Read 50 Pages of Neuroscience',
        difficulty: 'medium',
      });

    const taskId = createRes.body.id;

    const patchRes = await request(app)
      .patch(`/api/v1/tasks/${taskId}`)
      .set('X-API-Key', apiKey)
      .send({
        micro_habit_title: 'Open book and read 1 paragraph',
      });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.micro_habit_title).toBe('Open book and read 1 paragraph');
  });

  it('supports batch creation with micro_habit_title', async () => {
    const batchRes = await request(app)
      .post('/api/v1/tasks/batch')
      .set('X-API-Key', apiKey)
      .send({
        tasks: [
          {
            type: 'habit',
            title: 'Floss All Teeth',
            micro_habit_title: 'Floss just 1 tooth',
          },
          {
            type: 'todo',
            title: 'Complete Quarterly Tax Filing',
            micro_habit_title: 'Log into IRS portal and check balance',
          },
        ],
      });

    expect(batchRes.status).toBe(201);
    expect(batchRes.body.created_count).toBe(2);

    const listRes = await request(app)
      .get('/api/v1/tasks')
      .set('X-API-Key', apiKey);

    const flossTask = listRes.body.tasks.find((t: any) => t.title === 'Floss All Teeth');
    expect(flossTask).toBeDefined();
    expect(flossTask.micro_habit_title).toBe('Floss just 1 tooth');

    const taxTask = listRes.body.tasks.find((t: any) => t.title === 'Complete Quarterly Tax Filing');
    expect(taxTask).toBeDefined();
    expect(taxTask.micro_habit_title).toBe('Log into IRS portal and check balance');
  });
});
