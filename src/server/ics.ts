import crypto from 'node:crypto';
import { getDb } from './db.js';

export interface ParsedCalendarEvent {
  uid: string;
  title: string;
  description: string;
  location: string;
  meeting_url: string;
  start_time: string;
  end_time: string;
  all_day: boolean;
  recurrence?: string;
  repeat_days?: number[];
  repeat_until?: string | null;
}

function unfoldIcsLines(raw: string): string[] {
  const unfolded = raw.replace(/\r?\n[ \t]/g, '');
  return unfolded.split(/\r?\n/);
}

function unescapeIcsText(val: string): string {
  return val
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
    .trim();
}

function parseIcsDate(rawVal: string, keyParams: string): { iso: string; allDay: boolean } {
  const clean = rawVal.trim().replace(/^"|"$/g, '');
  const isDateOnly = keyParams.includes('VALUE=DATE') || /^\d{8}$/.test(clean);

  if (isDateOnly && clean.length >= 8) {
    const y = clean.slice(0, 4);
    const m = clean.slice(4, 6);
    const d = clean.slice(6, 8);
    return { iso: `${y}-${m}-${d}T00:00:00.000Z`, allDay: true };
  }

  // Format: YYYYMMDDTHHMMSSZ or YYYYMMDDTHHMMSS
  const match = clean.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/);
  if (match) {
    const [, y, m, d, hh, mm, ss, z] = match;
    if (z === 'Z') {
      return { iso: `${y}-${m}-${d}T${hh}:${mm}:${ss}.000Z`, allDay: false };
    }
    const localDate = new Date(
      Number(y),
      Number(m) - 1,
      Number(d),
      Number(hh),
      Number(mm),
      Number(ss)
    );
    return { iso: localDate.toISOString(), allDay: false };
  }

  const parsed = new Date(clean);
  if (!Number.isNaN(parsed.getTime())) {
    return { iso: parsed.toISOString(), allDay: false };
  }

  return { iso: new Date().toISOString(), allDay: false };
}

function extractMeetingUrl(text: string): string {
  const match = text.match(/https?:\/\/[^\s<>"]+/i);
  return match ? match[0] : '';
}

/**
 * Extracts Cadence recurrence rule from RFC 5545 RRULE string
 */
function parseRRule(rruleStr: string, dtStartIso: string): {
  recurrence: string;
  repeatDays: number[];
  repeatUntil: string | null;
  interval: number;
} | null {
  if (!rruleStr) return null;
  const parts = rruleStr.split(';');
  const params: Record<string, string> = {};
  for (const p of parts) {
    const [k, v] = p.split('=');
    if (k && v) params[k.toUpperCase()] = v.toUpperCase();
  }

  const freq = params['FREQ'];
  if (!freq) return null;

  const interval = params['INTERVAL'] ? Number(params['INTERVAL']) || 1 : 1;
  let recurrence = 'none';
  let repeatDays: number[] = [];
  let repeatUntil: string | null = null;

  if (params['UNTIL']) {
    const rawUntil = params['UNTIL'];
    if (rawUntil.length >= 8) {
      repeatUntil = `${rawUntil.slice(0, 4)}-${rawUntil.slice(4, 6)}-${rawUntil.slice(6, 8)}`;
    }
  }

  const DAY_MAP: Record<string, number> = {
    SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6,
  };

  if (freq === 'DAILY') {
    recurrence = 'daily';
    repeatDays = [0, 1, 2, 3, 4, 5, 6];
  } else if (freq === 'WEEKLY') {
    if (params['BYDAY']) {
      const days = params['BYDAY'].split(',').map((d) => {
        const dayCode = d.replace(/[^A-Z]/g, '').slice(-2);
        return DAY_MAP[dayCode];
      }).filter((n) => n !== undefined);

      repeatDays = Array.from(new Set(days)).sort();
      if (repeatDays.length === 5 && [1, 2, 3, 4, 5].every((d) => repeatDays.includes(d))) {
        recurrence = 'weekdays';
      } else if (repeatDays.length === 1) {
        recurrence = 'weekly';
      } else {
        recurrence = 'custom_days';
      }
    } else {
      recurrence = 'weekly';
      const d = new Date(dtStartIso).getUTCDay();
      repeatDays = [Number.isNaN(d) ? 1 : d];
    }
  } else if (freq === 'MONTHLY') {
    recurrence = 'monthly';
  }

  if (recurrence !== 'none') {
    return { recurrence, repeatDays, repeatUntil, interval };
  }
  return null;
}

export function parseIcsContent(icsText: string): ParsedCalendarEvent[] {
  const lines = unfoldIcsLines(icsText);
  const events: ParsedCalendarEvent[] = [];

  let inEvent = false;
  let inSubComponent = false;
  let current: Record<string, { value: string; params: string }> = {};

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('BEGIN:')) {
      const comp = trimmed.slice(6);
      if (comp === 'VEVENT') {
        inEvent = true;
        inSubComponent = false;
        current = {};
      } else if (inEvent) {
        // e.g. BEGIN:VALARM or BEGIN:VTODO
        inSubComponent = true;
      }
      continue;
    }

    if (trimmed.startsWith('END:')) {
      const comp = trimmed.slice(4);
      if (comp === 'VEVENT') {
        inEvent = false;
        inSubComponent = false;

        const dtStart = current['DTSTART'];
        if (dtStart) {
          const startParsed = parseIcsDate(dtStart.value, dtStart.params);
          let endIso = startParsed.iso;
          if (current['DTEND']) {
            endIso = parseIcsDate(current['DTEND'].value, current['DTEND'].params).iso;
          } else {
            const endD = new Date(startParsed.iso);
            endD.setMinutes(endD.getMinutes() + (startParsed.allDay ? 1440 : 60));
            endIso = endD.toISOString();
          }

          const title = unescapeIcsText(current['SUMMARY']?.value || 'Busy / Meeting');
          const description = unescapeIcsText(current['DESCRIPTION']?.value || '');
          const location = unescapeIcsText(current['LOCATION']?.value || '');
          const urlField = unescapeIcsText(current['URL']?.value || '');
          const meetingUrl =
            urlField || extractMeetingUrl(location) || extractMeetingUrl(description);
          const uid =
            unescapeIcsText(current['UID']?.value || '') ||
            crypto.createHash('sha1').update(`${title}:${startParsed.iso}`).digest('hex');

          const rruleRaw = current['RRULE']?.value || '';
          const parsedRule = parseRRule(rruleRaw, startParsed.iso);

          if (parsedRule && parsedRule.interval === 1) {
            // Native Cadence recurring event: dynamically expanded across any date range!
            events.push({
              uid,
              title,
              description,
              location,
              meeting_url: meetingUrl,
              start_time: startParsed.iso,
              end_time: endIso,
              all_day: startParsed.allDay,
              recurrence: parsedRule.recurrence,
              repeat_days: parsedRule.repeatDays,
              repeat_until: parsedRule.repeatUntil,
            });
          } else if (parsedRule && parsedRule.interval > 1) {
            // For custom interval recurrences (e.g. biweekly), expand instances around current active window
            const now = Date.now();
            const windowStart = now - 30 * 24 * 60 * 60 * 1000;
            const windowEnd = now + 90 * 24 * 60 * 60 * 1000;
            const durationMs = new Date(endIso).getTime() - new Date(startParsed.iso).getTime();
            const stepDays = parsedRule.recurrence === 'daily' ? parsedRule.interval : parsedRule.interval * 7;
            const stepMs = stepDays * 24 * 60 * 60 * 1000;

            let curTime = new Date(startParsed.iso).getTime();
            // Fast forward if started far in the past
            if (curTime < windowStart) {
              const jumps = Math.floor((windowStart - curTime) / stepMs);
              curTime += jumps * stepMs;
            }

            let idx = 0;
            while (curTime <= windowEnd && idx < 52) {
              if (curTime >= windowStart) {
                events.push({
                  uid: `${uid}_inst_${idx}`,
                  title,
                  description,
                  location,
                  meeting_url: meetingUrl,
                  start_time: new Date(curTime).toISOString(),
                  end_time: new Date(curTime + durationMs).toISOString(),
                  all_day: startParsed.allDay,
                });
              }
              curTime += stepMs;
              idx++;
            }
          } else {
            // Non-recurring single event
            events.push({
              uid,
              title,
              description,
              location,
              meeting_url: meetingUrl,
              start_time: startParsed.iso,
              end_time: endIso,
              all_day: startParsed.allDay,
            });
          }
        }
        continue;
      } else if (inEvent) {
        inSubComponent = false;
        continue;
      }
    }

    if (inEvent && !inSubComponent) {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;
      const fullKey = line.slice(0, colonIdx);
      const value = line.slice(colonIdx + 1);
      const [keyName, ...paramParts] = fullKey.split(';');
      current[keyName.toUpperCase()] = {
        value,
        params: paramParts.join(';').toUpperCase(),
      };
    }
  }

  return events;
}

export function importEventsIntoDb(
  userId: string,
  sourceId: string | null,
  color: string,
  events: ParsedCalendarEvent[],
  ghostInfo?: { ghostId: string; ghostName: string }
): number {
  const db = getDb();
  const now = new Date().toISOString();

  if (ghostInfo?.ghostId) {
    db.prepare('DELETE FROM calendar_events WHERE user_id = ? AND ghost_id = ?').run(
      userId,
      ghostInfo.ghostId
    );
  } else if (sourceId) {
    db.prepare('DELETE FROM calendar_events WHERE user_id = ? AND source_id = ?').run(
      userId,
      sourceId
    );
  }

  const isGhost = ghostInfo ? 1 : 0;
  const ghostId = ghostInfo ? ghostInfo.ghostId : null;
  const ghostName = ghostInfo ? ghostInfo.ghostName : '';
  const ghostIds = ghostInfo ? JSON.stringify([ghostInfo.ghostId]) : '[]';

  const insertStmt = db.prepare(`
    INSERT INTO calendar_events (
      id, user_id, source_id, ghost_id, ghost_ids, is_ghost, ghost_name,
      external_uid, title, description, location,
      meeting_url, start_time, end_time, all_day, color,
      recurrence, repeat_days, repeat_until, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const ev of events) {
    insertStmt.run(
      crypto.randomUUID(),
      userId,
      sourceId,
      ghostId,
      ghostIds,
      isGhost,
      ghostName,
      ev.uid,
      ev.title,
      ev.description,
      ev.location,
      ev.meeting_url,
      ev.start_time,
      ev.end_time,
      ev.all_day ? 1 : 0,
      color,
      ev.recurrence || 'none',
      JSON.stringify(ev.repeat_days || []),
      ev.repeat_until || null,
      now
    );
  }

  if (ghostInfo?.ghostId) {
    db.prepare('UPDATE ghosts SET last_synced_at = ? WHERE id = ?').run(now, ghostInfo.ghostId);
  } else if (sourceId) {
    db.prepare('UPDATE calendar_sources SET last_synced_at = ? WHERE id = ?').run(now, sourceId);
  }

  return events.length;
}
