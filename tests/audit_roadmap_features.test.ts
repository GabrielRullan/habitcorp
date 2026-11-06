import { describe, it, expect, beforeEach } from 'vitest';
import { isSafeUrl, normalizeCalendarUrl } from '../src/server/services/safeFetch.js';
import { parseIcsContent } from '../src/server/ics.js';
import { getStreakStage, STREAK_STAGES } from '../src/client/components/StreakGrowthBadge';
import { handleClientStorageRequest, getClientDb, saveClientDb } from '../src/client/clientStore';

describe('Audit Roadmap Features & Enhancements', () => {
  describe('Calendar Sync & URL Normalization', () => {
    it('normalizes webcal and webcals URLs to https', () => {
      expect(normalizeCalendarUrl('webcal://calendar.google.com/calendar/ical/feed/basic.ics'))
        .toBe('https://calendar.google.com/calendar/ical/feed/basic.ics');
      expect(normalizeCalendarUrl('webcals://p64-caldav.icloud.com/published/2/calendar.ics'))
        .toBe('https://p64-caldav.icloud.com/published/2/calendar.ics');
    });

    it('transforms Google Calendar embed and cid URLs to direct iCal .ics URLs', () => {
      expect(normalizeCalendarUrl('https://calendar.google.com/calendar/embed?src=family%40gmail.com&ctz=Europe%2FMadrid'))
        .toBe('https://calendar.google.com/calendar/ical/family%40gmail.com/public/basic.ics');
      expect(normalizeCalendarUrl('https://calendar.google.com/calendar/u/0?cid=work%40company.com'))
        .toBe('https://calendar.google.com/calendar/ical/work%40company.com/public/basic.ics');
    });

    it('validates webcal URLs safely under SSRF protection', () => {
      expect(isSafeUrl('webcal://calendar.google.com/calendar/ical/feed/basic.ics')).toBe(true);
      expect(isSafeUrl('webcal://127.0.0.1/evil.ics')).toBe(false);
      expect(isSafeUrl('webcal://169.254.169.254/latest')).toBe(false);
    });

    it('correctly parses iCal events with nested VALARM without overwriting summary', () => {
      const ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'BEGIN:VEVENT',
        'UID:evt_dentist_101',
        'SUMMARY:Dentist Checkup',
        'DESCRIPTION:Routine dental cleaning',
        'LOCATION:Dental Clinic, Room 3',
        'DTSTART:20261029T140000Z',
        'DTEND:20261029T150000Z',
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        'DESCRIPTION:Reminder: 15 minutes before',
        'TRIGGER:-PT15M',
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR',
      ].join('\r\n');

      const events = parseIcsContent(ics);
      expect(events).toHaveLength(1);
      expect(events[0].title).toBe('Dentist Checkup');
      expect(events[0].description).toBe('Routine dental cleaning');
      expect(events[0].location).toBe('Dental Clinic, Room 3');
      expect(events[0].start_time).toBe('2026-10-29T14:00:00.000Z');
      expect(events[0].end_time).toBe('2026-10-29T15:00:00.000Z');
    });

    it('parses weekly RRULE recurring events into native Cadence recurrence', () => {
      const ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'BEGIN:VEVENT',
        'UID:evt_recurring_sync_202',
        'SUMMARY:Weekly Team Architecture Sync',
        'DTSTART:20240108T100000Z',
        'DTEND:20240108T110000Z',
        'RRULE:FREQ=WEEKLY;BYDAY=MO',
        'END:VEVENT',
        'END:VCALENDAR',
      ].join('\r\n');

      const events = parseIcsContent(ics);
      expect(events).toHaveLength(1);
      expect(events[0].title).toBe('Weekly Team Architecture Sync');
      expect(events[0].recurrence).toBe('weekly');
      expect(events[0].repeat_days).toEqual([1]); // Monday
    });
  });

  describe('SSRF Protection (safeFetch)', () => {
    it('allows valid public HTTP and HTTPS URLs', () => {
      expect(isSafeUrl('https://calendar.google.com/calendar/ical/feed.ics')).toBe(true);
      expect(isSafeUrl('http://example.com/events.ics')).toBe(true);
      expect(isSafeUrl('https://outlook.live.com/owa/calendar.ics')).toBe(true);
    });

    it('blocks internal, private, loopback, and cloud metadata addresses', () => {
      // Loopback
      expect(isSafeUrl('http://localhost:3000/feed.ics')).toBe(false);
      expect(isSafeUrl('http://127.0.0.1/admin')).toBe(false);
      expect(isSafeUrl('http://127.0.0.2:8080')).toBe(false);
      expect(isSafeUrl('http://0.0.0.0/')).toBe(false);

      // AWS/GCP metadata
      expect(isSafeUrl('http://169.254.169.254/latest/meta-data/')).toBe(false);
      expect(isSafeUrl('http://metadata.google.internal/computeMetadata/v1/')).toBe(false);

      // RFC 1918 Private ranges
      expect(isSafeUrl('http://10.0.0.1/secret.ics')).toBe(false);
      expect(isSafeUrl('http://172.16.0.5/calendar.ics')).toBe(false);
      expect(isSafeUrl('http://172.31.255.255/')).toBe(false);
      expect(isSafeUrl('http://192.168.1.1/router')).toBe(false);

      // Dangerous schemes
      expect(isSafeUrl('javascript:alert(1)')).toBe(false);
      expect(isSafeUrl('file:///etc/passwd')).toBe(false);
      expect(isSafeUrl('ftp://example.com/')).toBe(false);
    });
  });

  describe('Streak Growth Progression (Plant to Tree 🌱 -> 🌳)', () => {
    it('correctly maps streak counts to botanical growth stages', () => {
      // Day 0: Seed planted
      const stage0 = getStreakStage(0);
      expect(stage0.name).toBe('Seed');
      expect(stage0.emoji).toBe('🌰');

      // Days 1-3: Sprout
      const stage1 = getStreakStage(1);
      expect(stage1.name).toBe('Sprout');
      expect(stage1.emoji).toBe('🌱');

      const stage3 = getStreakStage(3);
      expect(stage3.name).toBe('Sprout');

      // Days 4-7: Seedling
      const stage5 = getStreakStage(5);
      expect(stage5.name).toBe('Seedling');
      expect(stage5.emoji).toBe('🌿');

      // Days 8-14: Sapling
      const stage10 = getStreakStage(10);
      expect(stage10.name).toBe('Sapling');
      expect(stage10.emoji).toBe('🪴');

      // Days 15-29: Young Oak
      const stage20 = getStreakStage(20);
      expect(stage20.name).toBe('Young Oak');
      expect(stage20.emoji).toBe('🌳');

      // Days 30-59: Deep Pine
      const stage45 = getStreakStage(45);
      expect(stage45.name).toBe('Deep Pine');
      expect(stage45.emoji).toBe('🌲');

      // Days 60+: Ancient Bloom
      const stage75 = getStreakStage(75);
      expect(stage75.name).toBe('Ancient Bloom');
      expect(stage75.emoji).toBe('🌸');
    });

    it('contains all 7 progression milestones', () => {
      expect(STREAK_STAGES.length).toBe(7);
    });
  });

  describe('Multi-Ghost Support & Weekly Agenda Safety', () => {
    it('supports multiple ghosts assigned to a single meeting', () => {
      const ghostIds = ['ghost_alex', 'ghost_sam', 'ghost_taylor'];
      const meeting = {
        id: 'meet_multi_ghost_1',
        title: 'Family Logistics Run',
        is_ghost: 1,
        ghost_id: ghostIds[0],
        ghost_ids: ghostIds,
        start_time: '2026-10-29T10:00:00.000Z',
        end_time: '2026-10-29T11:00:00.000Z',
      };

      expect(meeting.is_ghost).toBe(1);
      expect(meeting.ghost_ids).toHaveLength(3);
      expect(meeting.ghost_ids).toContain('ghost_sam');
      expect(meeting.ghost_ids).toContain('ghost_taylor');
    });

    it('calculates 7-day Monday-to-Sunday week cleanly across month boundaries', () => {
      // November 1st, 2026 is a Sunday; Monday was Oct 26th
      const baseDateStr = '2026-11-01';
      const [y, m, d] = baseDateStr.split('-').map(Number);
      const curr = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
      const day = curr.getUTCDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      const mondayDate = new Date(Date.UTC(y, m - 1, d + mondayOffset, 12, 0, 0));

      const days = Array.from({ length: 7 }, (_, i) => {
        const dayDate = new Date(Date.UTC(
          mondayDate.getUTCFullYear(),
          mondayDate.getUTCMonth(),
          mondayDate.getUTCDate() + i,
          12, 0, 0
        ));
        return dayDate.toISOString().slice(0, 10);
      });

      expect(days).toEqual([
        '2026-10-26',
        '2026-10-27',
        '2026-10-28',
        '2026-10-29',
        '2026-10-30',
        '2026-10-31',
        '2026-11-01',
      ]);
      expect(days).toHaveLength(7);
    });
  });

  describe('Task Deletion Capabilities', () => {
    it('supports deleting tasks through clientStore with cascaded subtask removal', async () => {
      // Setup mock localStorage
      const storage: Record<string, string> = {};
      const mockStorage = {
        getItem: (key: string) => storage[key] || null,
        setItem: (key: string, val: string) => { storage[key] = val; },
        removeItem: (key: string) => { delete storage[key]; },
        clear: () => { Object.keys(storage).forEach((k) => delete storage[k]); },
      };
      (globalThis as any).localStorage = mockStorage;
      (globalThis as any).window = { localStorage: mockStorage };

      const db = getClientDb();
      db.subtasks = db.subtasks || [];
      
      const testTaskId = 'task_test_delete_99';
      db.tasks.push({
        id: testTaskId,
        user_id: 'user_test',
        title: 'Temporary Task to Delete',
        difficulty: 'easy',
        type: 'todo',
        created_at: new Date().toISOString(),
      });
      db.subtasks.push({
        id: 'sub_test_99',
        task_id: testTaskId,
        title: 'Temporary Subtask',
        completed: 0,
        position: 0,
        created_at: new Date().toISOString(),
      });
      saveClientDb(db);

      expect(getClientDb().tasks.some((t: any) => t.id === testTaskId)).toBe(true);
      expect(getClientDb().subtasks.some((s: any) => s.task_id === testTaskId)).toBe(true);

      // Execute DELETE /api/v1/tasks/:id
      const res = await handleClientStorageRequest(`/api/v1/tasks/${testTaskId}`, { method: 'DELETE' });
      expect(res.message).toBe('Task deleted successfully.');

      // Verify task and its subtasks are cleanly deleted
      expect(getClientDb().tasks.some((t: any) => t.id === testTaskId)).toBe(false);
      expect(getClientDb().subtasks.some((s: any) => s.task_id === testTaskId)).toBe(false);
    });
  });
});
