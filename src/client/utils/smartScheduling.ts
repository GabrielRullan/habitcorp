import { Task, CalendarMeeting, DifficultyTier } from '../types';

/**
 * Smart Scheduling & Frictionless Time-Blocking
 * Solves ADHD time estimation blindness by calibrating duration to spoon count.
 * Automatically identifies first conflict-free time window on today's agenda.
 */

export function getSpoonCalibratedDuration(difficulty?: DifficultyTier): number {
  switch (difficulty) {
    case 'trivial':
      return 15; // 1 Spoon: quick win / starter step
    case 'easy':
      return 30; // 2 Spoons: focused sprint
    case 'medium':
      return 45; // 3 Spoons: standard deep work block
    case 'hard':
      return 60; // 4 Spoons: heavy cognitive task
    default:
      return 30;
  }
}

export function parseTimeToMinutes(timeStr: string): number {
  try {
    const [hh, mm] = timeStr.split(':').map(Number);
    return hh * 60 + (mm || 0);
  } catch {
    return 9 * 60;
  }
}

export function minutesToTimeStr(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export interface BusyBlock {
  startMinutes: number;
  endMinutes: number;
}

export function findNextAvailableSlot(
  tasks: Task[],
  meetings: CalendarMeeting[],
  dateStr: string,
  durationMinutes = 30
): string {
  const busyBlocks: BusyBlock[] = [];

  // 1. Gather busy blocks from scheduled tasks on that date
  for (const t of tasks) {
    if (t.scheduled_date?.slice(0, 10) === dateStr && t.scheduled_start) {
      const start = parseTimeToMinutes(t.scheduled_start);
      const end = start + (t.scheduled_duration || 30);
      busyBlocks.push({ startMinutes: start, endMinutes: end });
    }
  }

  // 2. Gather busy blocks from calendar meetings on that date
  for (const m of meetings) {
    if (m.start_time?.slice(0, 10) === dateStr) {
      try {
        const startDate = new Date(m.start_time);
        const endDate = new Date(m.end_time);
        const start = startDate.getHours() * 60 + startDate.getMinutes();
        const end = endDate.getHours() * 60 + endDate.getMinutes();
        busyBlocks.push({ startMinutes: start, endMinutes: Math.max(start + 15, end) });
      } catch {}
    }
  }

  // Sort blocks chronologically
  busyBlocks.sort((a, b) => a.startMinutes - b.startMinutes);

  // Search candidate slots in 15-minute increments between startOfDay and 20:00 (8 PM)
  const now = new Date();
  const isToday = now.toISOString().slice(0, 10) === dateStr;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // If today, start at next 15-min mark after current time (min 09:00), otherwise start at 09:00
  let candidateStart = 9 * 60; // 09:00
  if (isToday && currentMinutes > candidateStart) {
    candidateStart = Math.ceil((currentMinutes + 10) / 15) * 15;
  }

  const endOfDay = 21 * 60; // 21:00

  for (let slot = candidateStart; slot + durationMinutes <= endOfDay; slot += 15) {
    const slotEnd = slot + durationMinutes;

    // Check if slot collides with any busy block
    const collides = busyBlocks.some((b) => {
      // Overlap condition: slot begins before block ends AND slot ends after block begins
      return slot < b.endMinutes && slotEnd > b.startMinutes;
    });

    if (!collides) {
      return minutesToTimeStr(slot);
    }
  }

  // Fallback default
  return '09:00';
}
