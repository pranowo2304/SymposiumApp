import { Session } from '../types';

/**
 * Parses session day ("Hari I" or "Hari II") and time ("08.00 - 09.30 WIB")
 * into JavaScript Date objects for the symposium dates (15 Ags 2026 & 16 Ags 2026)
 */
export function getSessionStartEndDates(session: Session): { startDate: Date; endDate: Date } {
  // Day dates for 2026 symposium
  const baseYear = 2026;
  const monthIndex = 7; // August (0-indexed)
  const dayNum = session.day === 'Hari I' ? 15 : 16;

  // Extract times e.g. "08.00 - 09.30"
  const times = session.startTime.split('-');
  const startParts = (times[0] || '08.00').trim().split('.');
  const endParts = (times[1] || '09.30').trim().split('.');

  const startHour = parseInt(startParts[0], 10) || 8;
  const startMin = parseInt(startParts[1], 10) || 0;

  const endHour = parseInt(endParts[0], 10) || 9;
  const endMin = parseInt(endParts[1], 10) || 30;

  const startDate = new Date(baseYear, monthIndex, dayNum, startHour, startMin, 0);
  const endDate = new Date(baseYear, monthIndex, dayNum, endHour, endMin, 0);

  return { startDate, endDate };
}

/**
 * Format Date to UTC ISO string required by Google Calendar (YYYYMMDDTHHmmssZ)
 */
function formatICalDate(date: Date): string {
  return date.toISOString().replace(/-|:|\.\d\d\d/g, '');
}

/**
 * Generates a Google Calendar Web Link
 */
export function getGoogleCalendarUrl(session: Session): string {
  const { startDate, endDate } = getSessionStartEndDates(session);
  
  const title = `[Simposium 2026] ${session.title}`;
  const location = `${session.room}, Hotel Grand Sahid Jaya Jakarta`;
  
  const speakersList = session.speakers.map(s => `• ${s.name} (${s.title})`).join('\n');
  const details = `Tipe Sesi: ${session.type}\nKategori: ${session.category}\nModerator: ${session.moderator}\n\nPembicara:\n${speakersList}\n\nAbstrak:\n${session.abstract.background}`;

  const startStr = formatICalDate(startDate);
  const endStr = formatICalDate(endDate);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${startStr}/${endStr}`,
    details: details,
    location: location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generates and downloads an .ics (iCalendar) file for Apple Calendar / Outlook
 */
export function downloadICSFile(session: Session) {
  const { startDate, endDate } = getSessionStartEndDates(session);
  const startStr = formatICalDate(startDate);
  const endStr = formatICalDate(endDate);

  const title = `[Simposium 2026] ${session.title}`;
  const location = `${session.room}, Hotel Grand Sahid Jaya Jakarta`;
  const speakersList = session.speakers.map(s => `${s.name}`).join(', ');
  const description = `Tipe: ${session.type} | Pembicara: ${speakersList}`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Simposium Kedokteran 2026//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:simposium-session-${session.id}@symposium2026.org`,
    `DTSTAMP:${formatICalDate(new Date())}`,
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Simposium_${session.id}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
