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
}

function unfoldIcsLines(raw: string): string[] {
  const unfolded = raw.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
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
  const clean = rawVal.trim();
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

export function parseIcsContent(icsText: string): ParsedCalendarEvent[] {
  const lines = unfoldIcsLines(icsText);
  const events: ParsedCalendarEvent[] = [];

  let inEvent = false;
  let current: Record<string, { value: string; params: string }> = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === 'BEGIN:VEVENT') {
      inEvent = true;
      current = {};
      continue;
    }
    if (trimmed === 'END:VEVENT') {
      inEvent = false;
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

        const rrule = current['RRULE']?.value || '';
        if (rrule && (rrule.includes('FREQ=DAILY') || rrule.includes('FREQ=WEEKLY'))) {
          const isDaily = rrule.includes('FREQ=DAILY');
          const stepDays = isDaily ? 1 : 7;
          const maxOccurrences = isDaily ? 14 : 6;
          const durationMs =
            new Date(endIso).getTime() - new Date(startParsed.iso).getTime();

          for (let i = 1; i <= maxOccurrences; i++) {
            const nextStart = new Date(startParsed.iso);
            nextStart.setUTCDate(nextStart.getUTCDate() + i * stepDays);
            const nextEnd = new Date(nextStart.getTime() + durationMs);
            events.push({
              uid: `${uid}_r_${i}`,
              title,
              description,
              location,
              meeting_url: meetingUrl,
              start_time: nextStart.toISOString(),
              end_time: nextEnd.toISOString(),
              all_day: startParsed.allDay,
            });
          }
        }
      }
      continue;
    }

    if (inEvent) {
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

  const insertStmt = db.prepare(`
    INSERT INTO calendar_events (
      id, user_id, source_id, ghost_id, is_ghost, ghost_name,
      external_uid, title, description, location,
      meeting_url, start_time, end_time, all_day, color, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const ev of events) {
    insertStmt.run(
      crypto.randomUUID(),
      userId,
      sourceId,
      ghostId,
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
