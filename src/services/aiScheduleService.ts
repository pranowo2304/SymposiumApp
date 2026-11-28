import { Session, Speaker } from '../types';

export interface AiExtractionOptions {
  targetDayHint?: string;
  customHint?: string;
  existingSpeakers?: Speaker[];
}

export interface AiExtractionResponse {
  success: boolean;
  error?: string;
  usedModel?: string;
  data?: {
    eventName?: string;
    eventDate?: string;
    venue?: string;
    sessions: Session[];
    detectedRooms?: Array<{
      name: string;
      shortName?: string;
      floor?: string;
      capacity?: number;
      color?: string;
    }>;
    detectedSpeakers?: Array<{
      name: string;
      title?: string;
      institution?: string;
      specialty?: string;
    }>;
    summary?: string;
  };
}

/**
 * Convert a File to base64 string
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Generate a crisp inline SVG initials avatar for newly extracted speakers
 * so speaker cards never show broken images or misleading stock portraits.
 */
export function buildInitialsAvatarDataUri(name: string): string {
  const cleaned = (name || '')
    .replace(/\b(prof|dr|drh|ns|apt|ir|drs|hj|h|mr|ms|mrs)\.?\s*/gi, '')
    .split(',')[0]
    .trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  const initials =
    words.length >= 2
      ? `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
      : (words[0]?.slice(0, 2) || 'SP').toUpperCase();

  const palette = ['#4f46e5', '#0f766e', '#0369a1', '#7c3aed', '#b45309', '#be123c'];
  let hash = 0;
  for (let i = 0; i < initials.length; i++) {
    hash = (hash * 31 + initials.charCodeAt(i)) % palette.length;
  }
  const bg = palette[Math.abs(hash) % palette.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect width="160" height="160" rx="24" fill="${bg}"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="system-ui,-apple-system,sans-serif" font-size="58" font-weight="700">${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Extract symposium schedule from a PDF file using Gemini AI on backend
 */
export async function extractScheduleFromPdf(
  file: File,
  onProgress?: (stage: string) => void,
  options?: AiExtractionOptions
): Promise<AiExtractionResponse> {
  try {
    onProgress?.(`Membaca berkas PDF "${file.name}"...`);
    const base64Data = await fileToBase64(file);

    onProgress?.('Mengirim dokumen PDF ke AI Gemini untuk membaca seluruh tabel, ruangan, pembicara & hari...');
    const response = await fetch('/api/ai/extract-schedule-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pdfBase64: base64Data,
        mimeType: file.type || 'application/pdf',
        fileName: file.name,
        targetDayHint: options?.targetDayHint || '',
        customHint: options?.customHint || '',
      }),
    });

    onProgress?.('Memetakan hasil ekstraksi AI ke struktur jadwal aplikasi...');
    const rawBody = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(rawBody?.error || `Server mengembalikan status ${response.status}`);
    }

    const result: AiExtractionResponse = rawBody;
    if (!result || !result.success || !result.data) {
      throw new Error(result?.error || 'AI tidak menghasilkan data jadwal yang valid.');
    }

    result.data.sessions = sanitizeExtractedSessions(result.data.sessions, {
      targetDayOverride:
        options?.targetDayHint && options.targetDayHint !== 'auto'
          ? options.targetDayHint
          : undefined,
      fallbackDate: result.data.eventDate || '',
      existingSpeakers: options?.existingSpeakers || [],
    });

    return result;
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Gagal mengekstrak file PDF dengan AI.',
    };
  }
}

/**
 * Extract symposium schedule from raw text using Gemini AI
 */
export async function extractScheduleFromText(
  rawText: string,
  onProgress?: (stage: string) => void,
  options?: AiExtractionOptions
): Promise<AiExtractionResponse> {
  try {
    onProgress?.('Mengirim teks jadwal ke AI Gemini...');
    const response = await fetch('/api/ai/extract-schedule-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rawText,
        fileName: 'teks-jadwal.txt',
        targetDayHint: options?.targetDayHint || '',
        customHint: options?.customHint || '',
      }),
    });

    onProgress?.('Memproses pemetaan struktur sesi dari AI...');
    const rawBody = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(rawBody?.error || `Server mengembalikan status ${response.status}`);
    }

    const result: AiExtractionResponse = rawBody;
    if (!result || !result.success || !result.data) {
      throw new Error(result?.error || 'AI tidak menghasilkan data jadwal.');
    }

    result.data.sessions = sanitizeExtractedSessions(result.data.sessions, {
      targetDayOverride:
        options?.targetDayHint && options.targetDayHint !== 'auto'
          ? options.targetDayHint
          : undefined,
      fallbackDate: result.data.eventDate || '',
      existingSpeakers: options?.existingSpeakers || [],
    });

    return result;
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Gagal mengekstrak teks dengan AI.',
    };
  }
}

/**
 * Helper to normalize room color according to room name
 */
export function getRoomColorByRoomName(roomName: string): string {
  const lower = (roomName || '').toLowerCase();
  if (lower.includes('amartapura a') || lower.includes('ballroom a') || lower.includes('hall a') || lower.includes('room a')) return 'bg-indigo-600';
  if (lower.includes('amartapura b') || lower.includes('ballroom b') || lower.includes('hall b') || lower.includes('room b')) return 'bg-emerald-600';
  if (lower.includes('ballroom c') || lower.includes('hall c') || lower.includes('room c') || lower.includes('auditorium')) return 'bg-purple-600';
  if (lower.includes('antareja')) return 'bg-amber-600';
  if (lower.includes('wisanggeni')) return 'bg-violet-600';
  if (lower.includes('foyer') || lower.includes('exhibition') || lower.includes('pameran')) return 'bg-teal-600';
  if (lower.includes('workshop') || lower.includes('hands-on')) return 'bg-cyan-600';
  return 'bg-blue-600';
}

/**
 * Normalize day string accurately without crushing Hari III or Workshop dates into Hari II
 */
export function normalizeExtractedDay(rawDayInput: unknown, fallbackDay = 'Hari I'): string {
  const original = String(rawDayInput || '').trim();
  if (!original) return fallbackDay;

  const lower = original.toLowerCase();

  // Preserve Workshop / Pre-Congress labels verbatim
  if (lower.includes('workshop') || lower.includes('pre-congress') || lower.includes('pre congress') || lower.includes('prakongres')) {
    return original;
  }

  // Check highest roman numerals / numbers FIRST so "Hari III" is never matched as "Hari II" or "Hari I"
  if (/\b(hari\s*(iv|4|keempat|ke-4)|day\s*4|day-4)\b/i.test(original)) {
    return 'Hari IV';
  }
  if (/\b(hari\s*(iii|3|ketiga|ke-3)|day\s*3|day-3)\b/i.test(original)) {
    return 'Hari III';
  }
  if (/\b(hari\s*(ii|2|kedua|ke-2)|day\s*2|day-2)\b/i.test(original)) {
    return 'Hari II';
  }
  if (/\b(hari\s*(i|1|pertama|ke-1)|day\s*1|day-1)\b/i.test(original)) {
    return 'Hari I';
  }

  // Otherwise keep the original label from the PDF intact
  return original;
}

function getDaySortRank(day: string): number {
  const lower = (day || '').toLowerCase();
  if (lower.includes('pre-congress') || lower.includes('workshop')) return 0;
  if (lower === 'hari i') return 1;
  if (lower === 'hari ii') return 2;
  if (lower === 'hari iii') return 3;
  if (lower === 'hari iv') return 4;
  return 5;
}

function normalizeTimeValue(raw: string): string {
  const match = String(raw || '').match(/(\d{1,2})[:.](\d{2})/);
  if (!match) return '';
  const hh = match[1].padStart(2, '0');
  const mm = match[2];
  return `${hh}:${mm}`;
}

export interface SanitizeSessionOptions {
  targetDayOverride?: string;
  fallbackDate?: string;
  existingSpeakers?: Speaker[];
}

/**
 * Helper to normalize and sanitize session objects returned by AI
 * while remaining strictly faithful to the uploaded PDF content.
 */
export function sanitizeExtractedSessions(
  rawSessions: any[],
  options?: SanitizeSessionOptions
): Session[] {
  if (!Array.isArray(rawSessions)) return [];

  const existingSpeakers = options?.existingSpeakers || [];
  const batchTimestamp = Date.now();

  const sanitized = rawSessions
    .filter((s) => s && typeof s === 'object')
    .map((s, index) => {
      // 1. Resolve verbatim title
      const title = String(s.title || s.judul || s.kegiatan || s.acara || s.topic || '').trim() || `Sesi ${index + 1}`;

      // 2. Resolve start/end time & timezone cleanly
      const rawTimeString = String(s.timeString || s.waktu || s.jam || '').trim();
      let startTime = normalizeTimeValue(String(s.startTime || s.start_time || s.jamMulai || s.waktuMulai || ''));
      let endTime = normalizeTimeValue(String(s.endTime || s.end_time || s.jamSelesai || s.waktuSelesai || ''));

      if ((!startTime || !endTime) && rawTimeString) {
        const rangeMatch = rawTimeString.match(/(\d{1,2}[:.]\d{2})\s*(?:-|–|—|s\/d|sd|to)\s*(\d{1,2}[:.]\d{2})/i);
        if (rangeMatch) {
          if (!startTime) startTime = normalizeTimeValue(rangeMatch[1]);
          if (!endTime) endTime = normalizeTimeValue(rangeMatch[2]);
        } else if (!startTime) {
          startTime = normalizeTimeValue(rawTimeString);
        }
      }

      startTime = startTime || '08:00';
      endTime = endTime || startTime;

      const tzMatch = rawTimeString.match(/\b(WIB|WITA|WIT)\b/i);
      const tzSuffix = tzMatch ? ` ${tzMatch[1].toUpperCase()}` : ' WIB';
      const timeString = rawTimeString && /\d{1,2}[:.]\d{2}/.test(rawTimeString)
        ? rawTimeString
        : `${startTime} - ${endTime}${tzSuffix}`;

      // 3. Resolve Day cleanly (respecting Hari I, II, III, IV, Workshop, Pre-Congress, etc.)
      const rawDay = s.day || s.hari || '';
      const day = options?.targetDayOverride
        ? normalizeExtractedDay(options.targetDayOverride)
        : normalizeExtractedDay(rawDay, 'Hari I');

      // 4. Resolve Date verbatim from PDF (do not inject fake dates)
      const date = String(s.date || s.tanggal || options?.fallbackDate || '').trim();

      // 5. Resolve Room & Floor verbatim from PDF
      const room = String(s.room || s.ruang || s.ruangan || s.lokasi || '').trim() || 'Ruang Utama';
      const floor = String(s.floor || s.lantai || '').trim();
      const roomColor = s.roomColor || getRoomColorByRoomName(room);

      // 6. Resolve Session Type
      let type: Session['type'] = 'Plenary Session';
      const lowerTitle = title.toLowerCase();
      const lowerType = String(s.type || s.tipe || '').toLowerCase();

      if (lowerType.includes('workshop') || lowerTitle.includes('workshop') || lowerTitle.includes('hands-on') || lowerTitle.includes('masterclass')) {
        type = 'Workshop Hands-On';
      } else if (lowerType.includes('paralel') || lowerType.includes('parallel') || lowerTitle.includes('paralel') || lowerTitle.includes('parallel')) {
        type = 'Simposium Paralel';
      } else if (lowerType.includes('keynote') || lowerTitle.includes('keynote')) {
        type = 'Keynote Lecture';
      } else if (lowerType.includes('panel') || lowerTitle.includes('panel')) {
        type = 'Panel Discussion';
      } else {
        type = 'Plenary Session';
      }

      // 7. Resolve Category
      let category = String(s.category || s.kategori || '').trim();
      if (!category) {
        if (lowerTitle.includes('registrasi') || lowerTitle.includes('coffee') || lowerTitle.includes('break') || lowerTitle.includes('lunch') || lowerTitle.includes('ishoma')) {
          category = 'Break & Registrasi';
        } else if (lowerTitle.includes('workshop')) {
          category = 'Workshop';
        } else if (lowerTitle.includes('opening') || lowerTitle.includes('closing') || lowerTitle.includes('munas') || lowerTitle.includes('sidang')) {
          category = 'Seremonial & Organisasi';
        } else {
          category = 'Simposium Ilmiah';
        }
      }

      // 8. Resolve Speakers faithfully (reuse existing speaker profile if matched; otherwise keep PDF fields clean without fabricating fake details)
      const rawSpeakers = s.speakers || s.pembicara || s.narasumber || s.pemateri || [];
      const speakers: Speaker[] = Array.isArray(rawSpeakers)
        ? rawSpeakers
            .map((sp: any, spIdx: number) => {
              const spName = String(typeof sp === 'string' ? sp : (sp?.name || sp?.nama || '')).trim();
              if (!spName) return null;

              const matchedExisting = existingSpeakers.find(
                (ex) => ex.name.toLowerCase().trim() === spName.toLowerCase().trim()
              );

              const spTitle = typeof sp === 'object' ? String(sp.title || sp.jabatan || '').trim() : '';
              const spInstitution = typeof sp === 'object' ? String(sp.institution || sp.institusi || '').trim() : '';
              const spSpecialty = typeof sp === 'object' ? String(sp.specialty || sp.spesialisasi || '').trim() : '';
              const spBio = typeof sp === 'object' ? String(sp.bio || '').trim() : '';
              const spEmail = typeof sp === 'object' ? String(sp.email || '').trim() : '';
              const spTalkTitle = typeof sp === 'object' ? String(sp.talkTitle || sp.materi || '').trim() : '';
              const spPhoto = typeof sp === 'object' ? String(sp.photoUrl || '').trim() : '';

              return {
                id: matchedExisting?.id || (typeof sp === 'object' && sp.id) || `sp-ai-${batchTimestamp}-${index}-${spIdx}`,
                name: spName,
                title: spTitle || matchedExisting?.title || '',
                institution: spInstitution || matchedExisting?.institution || '',
                photoUrl: spPhoto || matchedExisting?.photoUrl || buildInitialsAvatarDataUri(spName),
                bio: spBio || matchedExisting?.bio || '',
                specialty: spSpecialty || matchedExisting?.specialty || category,
                email: spEmail || matchedExisting?.email || '',
                talkTitle: spTalkTitle || title,
              } as Speaker;
            })
            .filter((sp): sp is Speaker => sp !== null)
        : [];

      // 9. Resolve Abstract & Key Takeaways faithfully (no fabricated boilerplate)
      const rawAbstract = s.abstract || s.abstrak || {};
      const background =
        typeof rawAbstract === 'string'
          ? rawAbstract.trim()
          : String(rawAbstract?.background || rawAbstract?.latarBelakang || '').trim();

      const clinicalUpdates = Array.isArray(rawAbstract?.clinicalUpdates)
        ? rawAbstract.clinicalUpdates.map((item: any) => String(item || '').trim()).filter(Boolean)
        : Array.isArray(rawAbstract?.updates)
          ? rawAbstract.updates.map((item: any) => String(item || '').trim()).filter(Boolean)
          : [];

      const conclusion =
        typeof rawAbstract === 'object'
          ? String(rawAbstract?.conclusion || rawAbstract?.kesimpulan || '').trim()
          : '';

      const keyTakeaways = Array.isArray(s.keyTakeaways)
        ? s.keyTakeaways.map((item: any) => String(item || '').trim()).filter(Boolean)
        : Array.isArray(s.takeaways)
          ? s.takeaways.map((item: any) => String(item || '').trim()).filter(Boolean)
          : [];

      return {
        id: s.id || `session-ai-${batchTimestamp}-${index + 1}`,
        day,
        date,
        startTime,
        endTime,
        timeString,
        title,
        category,
        type,
        room,
        floor,
        roomColor,
        moderator: String(s.moderator || '').trim(),
        capacity: Number(s.capacity) > 0 ? Number(s.capacity) : 300,
        speakers,
        abstract: {
          background,
          clinicalUpdates,
          conclusion,
        },
        keyTakeaways,
      } as Session;
    });

  // Sort cleanly by day order, then chronologically by startTime
  return sanitized.sort((a, b) => {
    const rankDiff = getDaySortRank(a.day) - getDaySortRank(b.day);
    if (rankDiff !== 0) return rankDiff;
    if (a.day !== b.day) return a.day.localeCompare(b.day);
    return a.startTime.localeCompare(b.startTime);
  });
}

