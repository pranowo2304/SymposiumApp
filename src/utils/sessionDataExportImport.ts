import { Session, Speaker, Room } from '../types';

/**
 * Escape a CSV cell: quote it if it contains commas, quotes, newlines, or semicolons
 */
function escapeCSV(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  if (str.includes('"') || str.includes(',') || str.includes(';') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Split a CSV row respecting double quotes
 */
export function parseCSVLine(line: string, delimiter: string = ','): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip next escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Export sessions array to standard CSV format
 */
export function exportSessionsToCSV(sessions: Session[]): string {
  const headers = [
    'ID',
    'Hari',
    'Tanggal',
    'Jam_Mulai',
    'Jam_Selesai',
    'Waktu_Lengkap',
    'Judul_Sesi',
    'Kategori',
    'Tipe_Sesi',
    'Ruangan',
    'Lantai',
    'Moderator',
    'Kapasitas',
    'Narasumber',
    'Abstrak_LatarBelakang',
    'Pembaruan_Klinis',
    'Kesimpulan',
    'Key_Takeaways'
  ];

  const rows = sessions.map(s => {
    const speakerNames = s.speakers.map(sp => sp.name).join(' | ');
    const clinicalUpdatesStr = (s.abstract?.clinicalUpdates || []).join(' | ');
    const keyTakeawaysStr = (s.keyTakeaways || []).join(' | ');

    return [
      escapeCSV(s.id),
      escapeCSV(s.day),
      escapeCSV(s.date),
      escapeCSV(s.startTime),
      escapeCSV(s.endTime),
      escapeCSV(s.timeString || `${s.startTime} - ${s.endTime} WIB`),
      escapeCSV(s.title),
      escapeCSV(s.category),
      escapeCSV(s.type),
      escapeCSV(s.room),
      escapeCSV(s.floor),
      escapeCSV(s.moderator || ''),
      escapeCSV(s.capacity || 200),
      escapeCSV(speakerNames),
      escapeCSV(s.abstract?.background || ''),
      escapeCSV(clinicalUpdatesStr),
      escapeCSV(s.abstract?.conclusion || ''),
      escapeCSV(keyTakeawaysStr)
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * Generate CSV template with instructions & sample data
 */
export function generateSessionsCSVTemplate(): string {
  const sampleSessions: Session[] = [
    {
      id: 'session-sample-1',
      day: 'Hari I',
      date: 'Sabtu, 15 Agustus 2026',
      startTime: '08:00',
      endTime: '09:30',
      timeString: '08:00 - 09:30 WIB',
      title: 'Plenary Keynote: Terobosan Terapi Kardiovaskular Terintegrasi',
      category: 'Kardiologi',
      type: 'Plenary Session',
      room: 'Grand Ballroom A (Lt. 1)',
      floor: 'Lantai 1',
      roomColor: 'bg-rose-500',
      moderator: 'dr. Budi Setiawan, Sp.JP',
      capacity: 350,
      speakers: [
        {
          id: 'sp-1',
          name: 'Prof. dr. Bambang Sutrisno, Sp.JP(K)',
          title: 'Guru Besar Kardiologi',
          institution: 'RSUPN Cipto Mangunkusumo, Jakarta',
          photoUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80',
          bio: 'Konsultan intervensi vaskular terkemuka.',
          specialty: 'Kardiologi'
        }
      ],
      abstract: {
        background: 'Update tatalaksana sindrom koroner akut dan pencegahan sekunder terintegrasi.',
        clinicalUpdates: [
          'Protokol revaskularisasi cepat < 90 menit',
          'Aplikasi antikoagulan oral generasi baru',
          'Pemantauan biomarka hs-Troponin serial'
        ],
        conclusion: 'Penanganan komprehensif sedini mungkin memperbaiki luaran klinis jangka panjang.'
      },
      keyTakeaways: [
        'Waktu adalah miokardium',
        'Pemberian DAPT sesuai stratifikasi risiko'
      ]
    },
    {
      id: 'session-sample-2',
      day: 'Hari I',
      date: 'Sabtu, 15 Agustus 2026',
      startTime: '13:00',
      endTime: '15:30',
      timeString: '13:00 - 15:30 WIB',
      title: 'Workshop Hands-On: Ultrasonografi Vaskular & Emergency Echocardiography',
      category: 'Workshop Hands-On',
      type: 'Workshop Hands-On',
      room: 'Ruang Workshop C (Lt. 3)',
      floor: 'Lantai 3',
      roomColor: 'bg-indigo-500',
      moderator: 'dr. Lukman Hakim, Sp.PD',
      capacity: 40,
      speakers: [
        {
          id: 'sp-2',
          name: 'dr. Ratna Setyowati, Sp.N(K)',
          title: 'Konsultan Vaskular',
          institution: 'RSUP Dr. Sardjito Yogyakarta',
          photoUrl: 'https://images.unsplash.com/photo-1594824813566-88855ce78347?w=400&auto=format&fit=crop&q=80',
          bio: 'Instruktur bersertifikasi simulasi klinis ultrasound.',
          specialty: 'Neurologi'
        }
      ],
      abstract: {
        background: 'Pelatihan langsung teknik ultrasound point-of-care (POCUS) pada pasien gawat darurat.',
        clinicalUpdates: [
          'Stasiun 1: Teknik scanning vaskular karotis & femoralis',
          'Stasiun 2: Evaluasi fungsi sistolik ventrikel kiri',
          'Stasiun 3: Deteksi efusi perikardial & tamponade'
        ],
        conclusion: 'Peserta menguasai interpretasi cepat ultrasound bedside secara mandiri.'
      },
      keyTakeaways: [
        'Hands-on practice pada model phantom & relawan',
        'Sertifikat kompetensi workshop berskredit IDI'
      ]
    }
  ];

  return exportSessionsToCSV(sampleSessions);
}

/**
 * Export sessions to formatted JSON string
 */
export function exportSessionsToJSON(sessions: Session[]): string {
  const exportPayload = {
    metadata: {
      exportedAt: new Date().toISOString(),
      formatVersion: '2.0',
      totalSessions: sessions.length,
      symposiumCount: sessions.filter(s => s.type !== 'Workshop Hands-On').length,
      workshopCount: sessions.filter(s => s.type === 'Workshop Hands-On').length
    },
    sessions
  };

  return JSON.stringify(exportPayload, null, 2);
}

export interface SessionImportResult {
  importedSessions: Session[];
  errors: string[];
  parsedCount: number;
}

/**
 * Parse CSV text into Session array
 */
export function importSessionsFromCSV(
  csvText: string,
  existingSpeakers: Speaker[] = [],
  existingRooms: Room[] = []
): SessionImportResult {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) {
    return {
      importedSessions: [],
      errors: ['File CSV kosong atau tidak memiliki baris data setelah header.'],
      parsedCount: 0
    };
  }

  // Detect delimiter (, or ;)
  const firstLine = lines[0];
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const delimiter = semicolonCount > commaCount ? ';' : ',';

  // Parse header
  const rawHeaders = parseCSVLine(firstLine, delimiter).map(h => 
    h.toLowerCase().replace(/[^a-z0-9]/g, '')
  );

  // Map header indexes
  const colIdx = {
    id: rawHeaders.findIndex(h => h === 'id' || h.includes('idsesi')),
    day: rawHeaders.findIndex(h => h.includes('hari') || h === 'day'),
    date: rawHeaders.findIndex(h => h.includes('tanggal') || h === 'date'),
    startTime: rawHeaders.findIndex(h => h.includes('jammulai') || h.includes('waktumulai') || h === 'starttime'),
    endTime: rawHeaders.findIndex(h => h.includes('jamselesai') || h.includes('waktuselesai') || h === 'endtime'),
    timeString: rawHeaders.findIndex(h => h.includes('waktulengkap') || h.includes('timestring')),
    title: rawHeaders.findIndex(h => h.includes('judul') || h.includes('title') || h.includes('tema')),
    category: rawHeaders.findIndex(h => h.includes('kategori') || h.includes('category') || h.includes('spesialisasi')),
    type: rawHeaders.findIndex(h => h.includes('tipe') || h.includes('type') || h.includes('jenis')),
    room: rawHeaders.findIndex(h => h.includes('ruang') || h === 'room'),
    floor: rawHeaders.findIndex(h => h.includes('lantai') || h === 'floor'),
    moderator: rawHeaders.findIndex(h => h.includes('moderator')),
    capacity: rawHeaders.findIndex(h => h.includes('kapasitas') || h.includes('capacity') || h.includes('kuota')),
    speakers: rawHeaders.findIndex(h => h.includes('narasumber') || h.includes('pembicara') || h.includes('speaker')),
    background: rawHeaders.findIndex(h => h.includes('abstrak') || h.includes('latar') || h.includes('background')),
    clinicalUpdates: rawHeaders.findIndex(h => h.includes('pembaruan') || h.includes('clinical') || h.includes('update')),
    conclusion: rawHeaders.findIndex(h => h.includes('kesimpulan') || h.includes('conclusion')),
    keyTakeaways: rawHeaders.findIndex(h => h.includes('takeaway') || h.includes('poinpenting') || h.includes('ringkasan'))
  };

  const importedSessions: Session[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const cols = parseCSVLine(line, delimiter);
    const getVal = (idx: number, fallback = '') => (idx >= 0 && cols[idx] ? cols[idx].trim() : fallback);

    const rawTitle = getVal(colIdx.title);
    if (!rawTitle) {
      errors.push(`Baris ${i + 1}: Judul sesi kosong, dilewati.`);
      continue;
    }

    // Day resolution
    let dayVal: 'Hari I' | 'Hari II' = 'Hari I';
    const rawDay = getVal(colIdx.day);
    if (rawDay.includes('2') || rawDay.toLowerCase().includes('ii') || rawDay.toLowerCase().includes('minggu')) {
      dayVal = 'Hari II';
    }

    // Date resolution
    const dateVal = getVal(colIdx.date, dayVal === 'Hari I' ? 'Sabtu, 15 Agustus 2026' : 'Minggu, 16 Agustus 2026');

    // Time
    const startTime = getVal(colIdx.startTime, '08:00');
    const endTime = getVal(colIdx.endTime, '09:30');
    const timeString = getVal(colIdx.timeString, `${startTime} - ${endTime} WIB`);

    // Category & Type
    const category = getVal(colIdx.category, 'Simposium Klinis');
    let sessionType: Session['type'] = 'Simposium Paralel';
    const rawType = getVal(colIdx.type).toLowerCase();
    if (rawType.includes('plenary')) sessionType = 'Plenary Session';
    else if (rawType.includes('workshop') || rawTitle.toLowerCase().includes('workshop')) sessionType = 'Workshop Hands-On';
    else if (rawType.includes('keynote')) sessionType = 'Keynote Lecture';
    else if (rawType.includes('panel')) sessionType = 'Panel Discussion';

    // Room & Floor
    const roomName = getVal(colIdx.room, sessionType === 'Workshop Hands-On' ? 'Ruang Workshop A' : 'Grand Ballroom A');
    const matchedRoom = existingRooms.find(r => r.name.toLowerCase() === roomName.toLowerCase());
    const floor = getVal(colIdx.floor, matchedRoom?.floor || 'Lantai 1');
    const roomColor = matchedRoom?.color || (sessionType === 'Workshop Hands-On' ? 'bg-indigo-500' : 'bg-blue-600');

    // Moderator
    const moderator = getVal(colIdx.moderator, 'dr. Moderator Simposium, Sp.PD');

    // Capacity
    const capacityRaw = parseInt(getVal(colIdx.capacity), 10);
    const capacity = !isNaN(capacityRaw) && capacityRaw > 0 ? capacityRaw : (sessionType === 'Workshop Hands-On' ? 50 : 250);

    // Speakers resolution
    const speakersStr = getVal(colIdx.speakers);
    const speakerNames = speakersStr ? speakersStr.split(/[|;]/).map(s => s.trim()).filter(Boolean) : [];
    const resolvedSpeakers: Speaker[] = [];

    if (speakerNames.length > 0) {
      speakerNames.forEach((name, spIdx) => {
        // Try match existing
        const existing = existingSpeakers.find(sp => sp.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(sp.name.toLowerCase()));
        if (existing) {
          resolvedSpeakers.push(existing);
        } else {
          // Create speaker stub
          resolvedSpeakers.push({
            id: `sp-imp-${Date.now()}-${spIdx}`,
            name,
            title: 'Narasumber Simposium',
            institution: 'RS / Fakultas Kedokteran Mitra',
            photoUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80',
            bio: `Narasumber ahli pada sesi: ${rawTitle}.`,
            specialty: category
          });
        }
      });
    } else if (existingSpeakers.length > 0) {
      resolvedSpeakers.push(existingSpeakers[0]);
    }

    // Abstract
    const background = getVal(colIdx.background, 'Pembahasan klinis terkini dan integrasi bukti ilmiah terbaru.');
    const clinicalUpdatesStr = getVal(colIdx.clinicalUpdates);
    const clinicalUpdates = clinicalUpdatesStr 
      ? clinicalUpdatesStr.split(/[|;]/).map(u => u.trim()).filter(Boolean)
      : ['Pembaruan pedoman tatalaksana', 'Studi komparatif efikasi klinis', 'Rekomendasi implementasi praktis'];

    const conclusion = getVal(colIdx.conclusion, 'Penerapan protokol mutakhir meningkatkan luaran klinis pasien.');
    
    // Key Takeaways
    const takeawaysStr = getVal(colIdx.keyTakeaways);
    const keyTakeaways = takeawaysStr 
      ? takeawaysStr.split(/[|;]/).map(t => t.trim()).filter(Boolean)
      : ['Evidence-based approach', 'Protokol klinis standar'];

    const id = getVal(colIdx.id, `session-imp-${Date.now()}-${i}`);

    importedSessions.push({
      id,
      day: dayVal,
      date: dateVal,
      startTime,
      endTime,
      timeString,
      title: rawTitle,
      category,
      type: sessionType,
      room: roomName,
      floor,
      roomColor,
      moderator,
      capacity,
      speakers: resolvedSpeakers,
      abstract: {
        background,
        clinicalUpdates,
        conclusion
      },
      keyTakeaways
    });
  }

  return {
    importedSessions,
    errors,
    parsedCount: importedSessions.length
  };
}

/**
 * Parse JSON text into Session array
 */
export function importSessionsFromJSON(jsonText: string): SessionImportResult {
  try {
    const parsed = JSON.parse(jsonText);
    let sessionList: any[] = [];

    if (Array.isArray(parsed)) {
      sessionList = parsed;
    } else if (parsed && Array.isArray(parsed.sessions)) {
      sessionList = parsed.sessions;
    } else {
      return {
        importedSessions: [],
        errors: ['Format JSON tidak valid. Harus berupa array of sessions atau objek { sessions: [...] }'],
        parsedCount: 0
      };
    }

    const importedSessions: Session[] = [];
    const errors: string[] = [];

    sessionList.forEach((item, idx) => {
      if (!item.title) {
        errors.push(`Item ke-${idx + 1}: Judul sesi kosong, dilewati.`);
        return;
      }

      const session: Session = {
        id: item.id || `session-json-${Date.now()}-${idx}`,
        day: item.day === 'Hari II' ? 'Hari II' : 'Hari I',
        date: item.date || 'Sabtu, 15 Agustus 2026',
        startTime: item.startTime || '08:00',
        endTime: item.endTime || '09:30',
        timeString: item.timeString || `${item.startTime || '08:00'} - ${item.endTime || '09:30'} WIB`,
        title: item.title,
        category: item.category || 'Simposium Umum',
        type: item.type || 'Simposium Paralel',
        room: item.room || 'Grand Ballroom A',
        floor: item.floor || 'Lantai 1',
        roomColor: item.roomColor || 'bg-blue-600',
        moderator: item.moderator || 'dr. Moderator Konsultan',
        capacity: item.capacity || 250,
        speakers: Array.isArray(item.speakers) ? item.speakers : [],
        abstract: {
          background: item.abstract?.background || 'Ringkasan materi ilmiah.',
          clinicalUpdates: Array.isArray(item.abstract?.clinicalUpdates) ? item.abstract.clinicalUpdates : ['Poin klinis 1', 'Poin klinis 2'],
          conclusion: item.abstract?.conclusion || 'Kesimpulan sesi klinis.'
        },
        keyTakeaways: Array.isArray(item.keyTakeaways) ? item.keyTakeaways : []
      };

      importedSessions.push(session);
    });

    return {
      importedSessions,
      errors,
      parsedCount: importedSessions.length
    };
  } catch (err: any) {
    return {
      importedSessions: [],
      errors: [`Gagal membaca JSON: ${err.message || 'Sintaks tidak valid'}`],
      parsedCount: 0
    };
  }
}

/**
 * Parse raw text copied from PDF timetables or schedules
 */
export function importSessionsFromScheduleText(rawText: string, existingSpeakers: Speaker[] = [], existingRooms: Room[] = []): SessionImportResult {
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  const importedSessions: Session[] = [];
  const errors: string[] = [];

  const timeRegex = /(\d{1,2}[:.]\d{2})\s*(?:-|–|—|to|s\/d)\s*(\d{1,2}[:.]\d{2})/i;
  
  let currentSession: Partial<Session> | null = null;
  let counter = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const timeMatch = line.match(timeRegex);

    if (timeMatch) {
      if (currentSession && currentSession.title) {
        importedSessions.push(finalizeSession(currentSession, counter++, existingSpeakers, existingRooms));
      }

      const startTime = timeMatch[1].replace('.', ':').padStart(5, '0');
      const endTime = timeMatch[2].replace('.', ':').padStart(5, '0');
      const timeString = `${startTime} - ${endTime} WIB`;

      // The rest of the line could be the title or room
      let restOfLine = line.replace(timeMatch[0], '').replace(/^[|\-–—:\s]+|[|\-–—:\s]+$/g, '').trim();

      currentSession = {
        id: `pdf-session-${Date.now()}-${counter}`,
        day: 'Hari I',
        date: 'Minggu, 29 November 2026',
        startTime,
        endTime,
        timeString,
        title: restOfLine || '',
        category: 'Simposium & Konferensi',
        type: 'Plenary Session',
        room: 'Ballroom Amartapura A',
        floor: 'Lantai 1',
        roomColor: 'bg-indigo-600',
        moderator: '',
        capacity: 350,
        speakers: [],
        abstract: {
          background: 'Sesi ilmiah simposium veteriner/kedokteran.',
          clinicalUpdates: ['Pembaruan ilmu klinis dan studi kasus terkini.'],
          conclusion: 'Rangkuman dan implikasi klinis.'
        },
        keyTakeaways: []
      };
    } else if (currentSession) {
      // Line after time: could be title, room, moderator, or speaker
      const lower = line.toLowerCase();
      if (!currentSession.title) {
        currentSession.title = line;
      } else if (lower.includes('ballroom') || lower.includes('ruang') || lower.includes('hall') || lower.includes('foyer')) {
        currentSession.room = line;
      } else if (lower.startsWith('moderator:') || lower.startsWith('mod:') || lower.includes('moderator')) {
        currentSession.moderator = line.replace(/^(moderator|mod)\s*:\s*/i, '').trim();
      } else if (lower.startsWith('speaker:') || lower.startsWith('pembicara:') || lower.startsWith('dr.') || lower.startsWith('drh.') || lower.startsWith('prof.')) {
        const speakerName = line.replace(/^(speaker|pembicara)\s*:\s*/i, '').trim();
        // check if speaker in database
        const found = existingSpeakers.find(s => s.name.toLowerCase().includes(speakerName.toLowerCase()) || speakerName.toLowerCase().includes(s.name.toLowerCase()));
        if (found) {
          currentSession.speakers = [...(currentSession.speakers || []), found];
        } else {
          currentSession.speakers = [...(currentSession.speakers || []), {
            id: `sp-pdf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name: speakerName,
            title: 'Narasumber Simposium',
            institution: 'Instansi / Asosiasi Profesi',
            photoUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80',
            bio: `Narasumber ahli pada sesi ${currentSession.title}.`,
            specialty: currentSession.category || 'Spesialisasi Klinis'
          }];
        }
      } else if (currentSession.title && !currentSession.moderator && line.length < 80) {
        // Maybe category or subtitle
        if (lower.includes('plenary') || lower.includes('keynote') || lower.includes('workshop') || lower.includes('paralel')) {
          if (lower.includes('workshop')) currentSession.type = 'Workshop Hands-On';
          else if (lower.includes('keynote')) currentSession.type = 'Keynote Lecture';
          else if (lower.includes('paralel')) currentSession.type = 'Simposium Paralel';
          else currentSession.type = 'Plenary Session';
        } else {
          currentSession.category = line;
        }
      }
    }
  }

  if (currentSession && currentSession.title) {
    importedSessions.push(finalizeSession(currentSession, counter++, existingSpeakers, existingRooms));
  }

  if (importedSessions.length === 0) {
    errors.push('Tidak menemukan format jam/waktu seperti "08:00 - 09:30" dalam teks.');
  }

  return {
    importedSessions,
    errors,
    parsedCount: importedSessions.length
  };
}

function finalizeSession(session: Partial<Session>, idx: number, speakers: Speaker[], rooms: Room[]): Session {
  const matchedRoom = rooms.find(r => r.name.toLowerCase() === (session.room || '').toLowerCase() || (session.room || '').toLowerCase().includes(r.shortName?.toLowerCase() || ''));
  return {
    id: session.id || `session-parsed-${Date.now()}-${idx}`,
    day: session.day === 'Hari II' ? 'Hari II' : 'Hari I',
    date: session.date || 'Minggu, 29 November 2026',
    startTime: session.startTime || '08:00',
    endTime: session.endTime || '09:00',
    timeString: session.timeString || `${session.startTime || '08:00'} - ${session.endTime || '09:00'} WIB`,
    title: session.title || `Sesi Ilmiah ${idx}`,
    category: session.category || 'Simposium',
    type: session.type || 'Plenary Session',
    room: matchedRoom ? matchedRoom.name : (session.room || 'Ballroom Amartapura A'),
    floor: matchedRoom ? matchedRoom.floor : 'Lantai 1',
    roomColor: matchedRoom ? matchedRoom.color : 'bg-indigo-600',
    moderator: session.moderator || 'Panitia Pelaksana',
    capacity: session.capacity || 300,
    speakers: session.speakers || [],
    abstract: session.abstract || {
      background: 'Sesi ilmiah konferensi.',
      clinicalUpdates: ['Pembaruan materi klinis terkini.'],
      conclusion: 'Rangkuman sesi.'
    },
    keyTakeaways: session.keyTakeaways || []
  };
}

/**
 * Trigger file download directly in browser
 */
export function downloadFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
