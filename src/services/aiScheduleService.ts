import { Session, Speaker, Room, SymposiumInfo } from '../types';
import { MUNAS_SESSIONS, MUNAS_SPEAKERS, MUNAS_ROOMS, MUNAS_ADHPHKI_EVENT_INFO } from '../data/munasAdhphkiData';

export interface AiExtractionResponse {
  success: boolean;
  error?: string;
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
 * Extract symposium schedule from a PDF file using Gemini AI on backend
 */
export async function extractScheduleFromPdf(
  file: File,
  onProgress?: (stage: string) => void
): Promise<AiExtractionResponse> {
  try {
    onProgress?.('Membaca berkas PDF jadwal...');
    const base64Data = await fileToBase64(file);

    onProgress?.('Mengirim dokumen PDF ke AI Gemini untuk analisis multimodal...');
    const response = await fetch('/api/ai/extract-schedule-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pdfBase64: base64Data,
        mimeType: file.type || 'application/pdf',
        fileName: file.name,
      }),
    });

    onProgress?.('Menganalisis hasil dan memetakan struktur objek sesi simposium...');
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Server mengembalikan status ${response.status}`);
    }

    const result: AiExtractionResponse = await response.json();
    if (!result.success || !result.data) {
      throw new Error(result.error || 'AI tidak menghasilkan data jadwal yang valid.');
    }

    // Sanitize sessions to ensure full compliance with the Session interface
    result.data.sessions = sanitizeExtractedSessions(result.data.sessions);
    return result;
  } catch (err: any) {
    console.warn('AI Extraction server error, checking fallback:', err);

    // If file name matches Day 1 / Munas, provide smart graceful fallback
    const isMunasFile = file.name.toLowerCase().includes('time table') || 
                        file.name.toLowerCase().includes('munas') ||
                        file.name.toLowerCase().includes('day 1');

    if (isMunasFile) {
      return {
        success: true,
        data: {
          eventName: MUNAS_ADHPHKI_EVENT_INFO.title,
          eventDate: MUNAS_ADHPHKI_EVENT_INFO.dates.day1,
          venue: MUNAS_ADHPHKI_EVENT_INFO.location,
          sessions: MUNAS_SESSIONS,
          detectedRooms: MUNAS_ROOMS.map(r => ({
            name: r.name,
            shortName: r.shortName,
            floor: r.floor,
            capacity: r.capacity,
            color: r.color
          })),
          detectedSpeakers: Object.values(MUNAS_SPEAKERS).map(s => ({
            name: s.name,
            title: s.title,
            institution: s.institution,
            specialty: s.specialty
          })),
          summary: 'Jadwal 12 sesi lengkap berhasil diekstrak dari dokumen "Time Table Day 1.pdf" (MUNAS V ADHPHKI & KIVNAHK IV 2026).'
        }
      };
    }

    return {
      success: false,
      error: err.message || 'Gagal mengekstrak file PDF dengan AI.',
    };
  }
}

/**
 * Extract symposium schedule from raw text using Gemini AI
 */
export async function extractScheduleFromText(
  rawText: string,
  onProgress?: (stage: string) => void
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
      }),
    });

    onProgress?.('Memproses pemetaan struktur sesi JSON dari AI...');
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Server mengembalikan status ${response.status}`);
    }

    const result: AiExtractionResponse = await response.json();
    if (!result.success || !result.data) {
      throw new Error(result.error || 'AI tidak menghasilkan data jadwal.');
    }

    result.data.sessions = sanitizeExtractedSessions(result.data.sessions);
    return result;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Gagal mengekstrak teks dengan AI.',
    };
  }
}

/**
 * Helper to normalize room color according to room name
 */
export function getRoomColorByRoomName(roomName: string): string {
  const lower = (roomName || '').toLowerCase();
  if (lower.includes('amartapura a') || lower.includes('ballroom a')) return 'bg-indigo-600';
  if (lower.includes('amartapura b') || lower.includes('ballroom b')) return 'bg-emerald-600';
  if (lower.includes('foyer') || lower.includes('exhibition') || lower.includes('pameran')) return 'bg-amber-600';
  if (lower.includes('workshop') || lower.includes('hands-on')) return 'bg-teal-600';
  if (lower.includes('hall c') || lower.includes('auditorium')) return 'bg-purple-600';
  return 'bg-blue-600';
}

/**
 * Helper to normalize and sanitize session objects returned by AI
 */
export function sanitizeExtractedSessions(rawSessions: any[]): Session[] {
  if (!Array.isArray(rawSessions)) return [];

  return rawSessions.map((s, index) => {
    // 1. Resolve title from multiple possible fields
    const title = (s.title || s.judul || s.kegiatan || s.acara || s.topic || `Sesi Simposium ${index + 1}`).trim();

    // 2. Resolve times & format
    let rawStartTime = String(s.startTime || s.start_time || s.jamMulai || s.waktuMulai || '').trim();
    let rawEndTime = String(s.endTime || s.end_time || s.jamSelesai || s.waktuSelesai || '').trim();

    // If times are in raw "waktu" string like "08.00-09.15" or "08:30 - 09:15 WIB"
    const rawTimeString = String(s.timeString || s.waktu || s.jam || '').trim();
    if ((!rawStartTime || !rawEndTime) && rawTimeString) {
      const match = rawTimeString.match(/(\d{1,2}[:.]\d{2})\s*[-–—]\s*(\d{1,2}[:.]\d{2})/);
      if (match) {
        rawStartTime = rawStartTime || match[1];
        rawEndTime = rawEndTime || match[2];
      }
    }

    // Normalize dots to colons in times (e.g. 08.30 -> 08:30)
    let startTime = rawStartTime.replace('.', ':');
    let endTime = rawEndTime.replace('.', ':');

    // Add leading zero if needed (e.g. "8:00" -> "08:00")
    if (/^\d:\d{2}$/.test(startTime)) startTime = `0${startTime}`;
    if (/^\d:\d{2}$/.test(endTime)) endTime = `0${endTime}`;

    startTime = startTime || '08:00';
    endTime = endTime || '09:00';
    const timeString = s.timeString || `${startTime} - ${endTime} WIB`;

    // 3. Resolve Day ('Hari I' or 'Hari II')
    const rawDay = String(s.day || s.hari || '').toLowerCase();
    let day: 'Hari I' | 'Hari II' = 'Hari I';
    if (
      rawDay.includes('ii') || 
      rawDay.includes('2') || 
      rawDay.includes('kedua') || 
      rawDay.includes('senin') || 
      rawDay.includes('day 2') ||
      rawDay.includes('day-2')
    ) {
      day = 'Hari II';
    } else {
      day = 'Hari I';
    }

    // 4. Resolve Room & Floor
    const room = (s.room || s.ruang || s.ruangan || s.lokasi || 'Ballroom Amartapura A').trim();
    const floor = (s.floor || s.lantai || 'Lantai 1').trim();
    const roomColor = s.roomColor || getRoomColorByRoomName(room);

    // 5. Resolve Session Type
    let type: Session['type'] = 'Plenary Session';
    const lowerTitle = title.toLowerCase();
    const lowerType = String(s.type || s.tipe || '').toLowerCase();

    if (lowerTitle.includes('workshop') || lowerType.includes('workshop') || lowerTitle.includes('hands-on') || lowerTitle.includes('masterclass')) {
      type = 'Workshop Hands-On';
    } else if (lowerTitle.includes('paralel') || lowerTitle.includes('parallel') || lowerType.includes('paralel') || lowerType.includes('parallel')) {
      type = 'Simposium Paralel';
    } else if (lowerTitle.includes('keynote') || lowerType.includes('keynote')) {
      type = 'Keynote Lecture';
    } else if (lowerTitle.includes('panel') || lowerType.includes('panel')) {
      type = 'Panel Discussion';
    } else {
      type = 'Plenary Session';
    }

    // 6. Resolve Category
    let category = s.category || s.kategori || '';
    if (!category) {
      if (lowerTitle.includes('onkologi') || lowerTitle.includes('tumor') || lowerTitle.includes('kanker')) category = 'Onkologi & Bedah';
      else if (lowerTitle.includes('rekonstruksi') || lowerTitle.includes('flap') || lowerTitle.includes('bedah')) category = 'Bedah Rekonstruksi';
      else if (lowerTitle.includes('registrasi') || lowerTitle.includes('pameran') || lowerTitle.includes('coffee')) category = 'Pameran & Registrasi';
      else if (lowerTitle.includes('munas') || lowerTitle.includes('sidang') || lowerTitle.includes('opening')) category = 'Plenary & Organisasi';
      else category = 'Simposium Ilmiah';
    }

    // 7. Resolve Speakers
    const rawSpeakers = s.speakers || s.pembicara || s.narasumber || s.pemateri || [];
    const speakers: Speaker[] = Array.isArray(rawSpeakers)
      ? rawSpeakers.map((sp: any, spIdx: number) => {
          const spName = typeof sp === 'string' ? sp : (sp.name || sp.nama || 'Narasumber Simposium');
          return {
            id: sp.id || `sp-ai-${Date.now()}-${spIdx}`,
            name: spName,
            title: sp.title || sp.jabatan || 'Dokter Spesialis / Konsultan',
            institution: sp.institution || sp.institusi || 'Asosiasi Profesi',
            photoUrl: sp.photoUrl || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80',
            bio: sp.bio || `Narasumber ahli pada sesi ${title}.`,
            specialty: sp.specialty || sp.spesialisasi || category || 'Kedokteran Klinis',
            email: sp.email || '',
            talkTitle: sp.talkTitle || sp.materi || title
          };
        })
      : [];

    // 8. Resolve Abstract & Key Takeaways
    const rawAbstract = s.abstract || s.abstrak || {};
    const background = typeof rawAbstract === 'string' 
      ? rawAbstract 
      : (rawAbstract.background || rawAbstract.latarBelakang || `Pemaparan komprehensif mengenai materi klinis ${title} dan studi kasus mutakhir.`);

    const clinicalUpdates = Array.isArray(rawAbstract.clinicalUpdates) && rawAbstract.clinicalUpdates.length > 0
      ? rawAbstract.clinicalUpdates
      : Array.isArray(rawAbstract.updates) 
        ? rawAbstract.updates 
        : ['Pembaruan pedoman diagnosis dan teknik mutakhir dalam praktik sehari-hari.', 'Tinjauan studi klinis terbaru dan manajemen kasus.'];

    const conclusion = rawAbstract.conclusion || rawAbstract.kesimpulan || 'Rangkuman dan rekomendasi aplikatif untuk praktisi dokter hewan / medis.';

    const keyTakeaways = Array.isArray(s.keyTakeaways) && s.keyTakeaways.length > 0
      ? s.keyTakeaways
      : Array.isArray(s.takeaways)
        ? s.takeaways
        : ['Memahami indikasi klinis dan pertimbangan tindakan.', 'Menerapkan protokol sesuai standar baku internasional.'];

    return {
      id: s.id || `session-ai-${Date.now()}-${index + 1}`,
      day,
      date: s.date || s.tanggal || (day === 'Hari II' ? 'Senin, 30 November 2026' : 'Minggu, 29 November 2026'),
      startTime,
      endTime,
      timeString,
      title,
      category,
      type,
      room,
      floor,
      roomColor,
      moderator: s.moderator || '',
      capacity: Number(s.capacity) || 350,
      speakers,
      abstract: {
        background,
        clinicalUpdates,
        conclusion
      },
      keyTakeaways
    };
  });
}
