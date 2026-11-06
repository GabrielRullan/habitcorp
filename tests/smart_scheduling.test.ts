import { describe, it, expect } from 'vitest';
import {
  getSpoonCalibratedDuration,
  parseTimeToMinutes,
  minutesToTimeStr,
  findNextAvailableSlot,
} from '../src/client/utils/smartScheduling';
import { Task, CalendarMeeting } from '../src/client/types';

describe('Cycle 14: Mobile Tap-to-Place & Spoon-Calibrated Time-Blocking (Elena & Dr. Marcus)', () => {
  it('calibrates time-block duration automatically from spoon tier (XS=15m, S=30m, M=45m, L=60m)', () => {
    expect(getSpoonCalibratedDuration('trivial')).toBe(15);
    expect(getSpoonCalibratedDuration('easy')).toBe(30);
    expect(getSpoonCalibratedDuration('medium')).toBe(45);
    expect(getSpoonCalibratedDuration('hard')).toBe(60);
    expect(getSpoonCalibratedDuration(undefined)).toBe(30);
  });

  it('correctly converts between time string and total minutes', () => {
    expect(parseTimeToMinutes('09:30')).toBe(570);
    expect(minutesToTimeStr(570)).toBe('09:30');
    expect(minutesToTimeStr(14 * 60 + 15)).toBe('14:15');
  });

  it('finds the next conflict-free available slot skipping over busy meetings and existing tasks', () => {
    const dateStr = '2026-10-30';

    const existingTasks: Partial<Task>[] = [
      {
        id: 't1',
        scheduled_date: dateStr,
        scheduled_start: '09:00',
        scheduled_duration: 60, // 09:00 - 10:00 busy
      },
    ];

    const existingMeetings: Partial<CalendarMeeting>[] = [
      {
        id: 'm1',
        start_time: `${dateStr}T10:00:00.000Z`,
        end_time: `${dateStr}T11:00:00.000Z`, // 10:00 - 11:00 busy in local context
      },
    ];

    // Testing a future date so current clock time doesn't interfere
    const futureDate = '2026-11-15';
    const futureTasks: Partial<Task>[] = [
      {
        id: 't1',
        scheduled_date: futureDate,
        scheduled_start: '09:00',
        scheduled_duration: 60, // 09:00 - 10:00 busy
      },
    ];

    const nextSlot = findNextAvailableSlot(futureTasks as Task[], [], futureDate, 30);
    expect(nextSlot).toBe('10:00');
  });
});
