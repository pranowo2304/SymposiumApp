import { Session } from '../types';

const TIME_TOKEN_REGEX = /(\d{1,2})\s*[:.]\s*(\d{2})(?:\s*[:.]\s*\d{2})?(?:\s*(am|pm))?/gi;

/**
 * Parse a single clock token (e.g. "08:30", "8.30", "1:30 PM", "14:00 WIB")
 * into minutes since midnight (0..1440). Returns null if unparseable.
 */
export function parseTimeToMinutes(raw?: string | null): number | null {
  if (!raw) return null;
  const text = String(raw).trim();
  if (!text) return null;

  const match = text.match(/(\d{1,2})\s*[:.]\s*(\d{2})(?:\s*[:.]\s*\d{2})?(?:\s*(am|pm))?/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3]?.toLowerCase();

  if (!Number.isFinite(hours) || !Number.isFinite(minutes) || minutes < 0 || minutes > 59) {
    return null;
  }

  if (meridiem === 'am') {
    if (hours === 12) hours = 0;
  } else if (meridiem === 'pm') {
    if (hours >= 1 && hours <= 11) hours += 12;
  }

  if (hours < 0 || hours > 24 || (hours === 24 && minutes > 0)) {
    return null;
  }

  return hours * 60 + minutes;
}

/**
 * Extract start and end times (in minutes since midnight) from a range string
 * such as "08:30 - 10:00 WIB", "09.00–10.30", or "13:30 s/d Selesai".
 */
export function parseTimeRangeMinutes(timeString?: string | null): {
  start: number | null;
  end: number | null;
} {
  if (!timeString) return { start: null, end: null };
  const text = String(timeString).trim();
  if (!text) return { start: null, end: null };

  const matches = Array.from(text.matchAll(TIME_TOKEN_REGEX));
  if (matches.length === 0) return { start: null, end: null };

  const start = parseTimeToMinutes(matches[0][0]);
  const end = matches.length >= 2 ? parseTimeToMinutes(matches[1][0]) : null;
  return { start, end };
}

/**
 * Resolve the effective chronological start & end minutes for a session.
 * Prioritizes `timeString` (the exact time displayed on cards) when it contains
 * a valid clock time, falling back to `startTime` / `endTime`.
 */
export function getSessionTimeRangeMinutes(
  session: Pick<Session, 'startTime' | 'endTime' | 'timeString'>
): { start: number; end: number } {
  const fromRange = parseTimeRangeMinutes(session.timeString);
  const fromStartField = parseTimeToMinutes(session.startTime);
  const fromEndField = parseTimeToMinutes(session.endTime);

  const start = fromRange.start ?? fromStartField ?? Number.MAX_SAFE_INTEGER;
  const end = fromRange.end ?? fromEndField ?? start;

  return { start, end };
}

/**
 * Compute chronological sort rank for day labels
 * (Pre-Congress / Workshop -> Hari I -> Hari II -> Hari III -> Hari IV -> ...).
 */
export function getDaySortRank(day?: string | null): number {
  const original = String(day || '').trim();
  if (!original) return 999;

  const lower = original.toLowerCase();
  if (
    lower.includes('workshop') ||
    lower.includes('pre-congress') ||
    lower.includes('pre congress') ||
    lower.includes('prakongres')
  ) {
    return 0;
  }

  // Check highest Roman numerals first so "Hari III" is never matched as "Hari II" or "Hari I"
  if (/\b(hari\s*(v|5|kelima|ke-5)|day\s*-?\s*5)\b/i.test(original)) return 5;
  if (/\b(hari\s*(iv|4|keempat|ke-4)|day\s*-?\s*4)\b/i.test(original)) return 4;
  if (/\b(hari\s*(iii|3|ketiga|ke-3)|day\s*-?\s*3)\b/i.test(original)) return 3;
  if (/\b(hari\s*(ii|2|kedua|ke-2)|day\s*-?\s*2)\b/i.test(original)) return 2;
  if (/\b(hari\s*(i|1|pertama|ke-1)|day\s*-?\s*1)\b/i.test(original)) return 1;

  const numMatch = lower.match(/\b(\d{1,2})\b/);
  if (numMatch) {
    const n = parseInt(numMatch[1], 10);
    if (Number.isFinite(n)) return 10 + n;
  }

  return 100;
}

/**
 * Compare two sessions chronologically:
 * 1. Day order
 * 2. Start time (numeric minutes since midnight)
 * 3. End time (numeric minutes since midnight)
 * 4. Room name (normalized)
 * 5. Session title (stable deterministic tie-breaker)
 */
export function compareSessionsChronologically(a: Session, b: Session): number {
  const dayRankDiff = getDaySortRank(a.day) - getDaySortRank(b.day);
  if (dayRankDiff !== 0) return dayRankDiff;

  const dayA = String(a.day || '').trim();
  const dayB = String(b.day || '').trim();
  if (dayA !== dayB) {
    const dayCmp = dayA.localeCompare(dayB, 'id', { numeric: true, sensitivity: 'base' });
    if (dayCmp !== 0) return dayCmp;
  }

  const timeA = getSessionTimeRangeMinutes(a);
  const timeB = getSessionTimeRangeMinutes(b);

  if (timeA.start !== timeB.start) return timeA.start - timeB.start;
  if (timeA.end !== timeB.end) return timeA.end - timeB.end;

  const roomA = String(a.room || '').trim().toLowerCase();
  const roomB = String(b.room || '').trim().toLowerCase();
  if (roomA !== roomB) {
    return roomA.localeCompare(roomB, 'id', { numeric: true, sensitivity: 'base' });
  }

  return String(a.title || '').localeCompare(String(b.title || ''), 'id', {
    numeric: true,
    sensitivity: 'base',
  });
}

/**
 * Return a new array of sessions sorted chronologically by day and time.
 */
export function sortSessionsChronologically(sessions: Session[]): Session[] {
  return [...sessions].sort(compareSessionsChronologically);
}

/**
 * Compare two rundown items numerically by startTime, then endTime.
 */
export function compareRundownItemsByTime(
  a: { startTime?: string; endTime?: string },
  b: { startTime?: string; endTime?: string }
): number {
  const startA = parseTimeToMinutes(a.startTime) ?? Number.MAX_SAFE_INTEGER;
  const startB = parseTimeToMinutes(b.startTime) ?? Number.MAX_SAFE_INTEGER;
  if (startA !== startB) return startA - startB;

  const endA = parseTimeToMinutes(a.endTime) ?? startA;
  const endB = parseTimeToMinutes(b.endTime) ?? startB;
  return endA - endB;
}
