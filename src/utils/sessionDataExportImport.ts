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
    'Key_Takeaways',
    'Rundown_Workshop'
  ];

  const rows = sessions.map(s => {
    const speakerNames = s.speakers.map(sp => sp.name).join(' | ');
    const clinicalUpdatesStr = (s.abstract?.clinicalUpdates || []).join(' | ');
    const keyTakeawaysStr = (s.keyTakeaways || []).join(' | ');
    const rundownStr = (s.rundown || [])
      .map(r => `${r.startTime}-${r.endTime}::${r.activity}${r.pic ? `::${r.pic}` : ''}`)
      .join(' | ');

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
      escapeCSV(s.capacity || (s.type === 'Workshop Hands-On' ? 60 : 300)),
      escapeCSV(speakerNames),
      escapeCSV(s.abstract?.background || ''),
      escapeCSV(clinicalUpdatesStr),
      escapeCSV(s.abstract?.conclusion || ''),
      escapeCSV(keyTakeawaysStr),
      escapeCSV(rundownStr)
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * Generate CSV template with instructions & sample data for Workshop & Symposium
 */
export function generateSessionsCSVTemplate(filter: 'all' | 'symposium' | 'workshop' = 'all'): string {
  const workshopSamples: Session[] = [
    {
      id: 'ws-sample-1',
      day: 'Workshop (28 Nov)',
      date: 'Sabtu, 28 November 2026',
      startTime: '08:30',
      endTime: '10:00',
      timeString: '08:30 - 10:00 WIB',
      title: 'Approach to Cutaneous Masses: From Cytology to Biopsy Planning',
      category: 'Workshop Versus - MASS Hunt',
      type: 'Workshop Hands-On',
      room: 'Antareja Room',
      floor: 'Ground Floor',
      roomColor: 'bg-amber-600',
      moderator: 'drh. Moderator Workshop',
      capacity: 60,
      speakers: [
        {
          id: 'sp-ws-1',
          name: 'Prof. Dr. Kelvinesen',
          title: 'Veterinary Surgical Oncologist',
          institution: 'WSAVA Oncology Faculty',
          photoUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80',
          bio: 'Instruktur bedah onkologi veteriner.',
          specialty: 'Bedah Onkologi'
        }
      ],
      abstract: {
        background: 'Pendekatan diagnostik sistematis massa kulit dari sitologi FNA hingga perencanaan margin biopsi.',
        clinicalUpdates: [
          'Teknik Fine Needle Aspiration (FNA) bebas artefak',
          'Penentuan margin eksisi lateral dan deep fascial plane',
          'Interpretasi sitologi cepat di klinik'
        ],
        conclusion: 'Perencanaan biopsi yang tepat mencegah re-eksisi dan meningkatkan keberhasilan operasi.'
      },
      keyTakeaways: [
        'FNA wajib sebelum eksisi massa kulit',
        'Tandai batas tumor sebelum anestesi'
      ],
      rundown: [
        { id: 'rd-1', startTime: '08:30', endTime: '09:15', activity: 'Pemaparan Teori & Studi Kasus Sitologi Massa Kulit', pic: 'Prof. Dr. Kelvinesen' },
        { id: 'rd-2', startTime: '09:15', endTime: '10:00', activity: 'Hands-On Wet Lab: Teknik Biopsi Punch, Wedge & Pemetaan Margin', pic: 'Tim Instruktur Versus' }
      ]
    },
    {
      id: 'ws-sample-2',
      day: 'Workshop (28 Nov)',
      date: 'Sabtu, 28 November 2026',
      startTime: '09:00',
      endTime: '10:30',
      timeString: '09:00 - 10:30 WIB',
      title: 'Patient Preparation & Aseptic Technique in Veterinary Surgery',
      category: 'Workshop Vet Nurse / Paramedis',
      type: 'Workshop Hands-On',
      room: 'Wisanggeni Room',
      floor: 'Ground Floor',
      roomColor: 'bg-emerald-600',
      moderator: 'drh. Koordinator Paramedis',
      capacity: 60,
      speakers: [
        {
          id: 'sp-ws-2',
          name: 'drh. Rina Kusumawati, M.Vet',
          title: 'Instruktur Keperawatan Bedah Veteriner',
          institution: 'ADHPHKI Surgical Nursing Division',
          photoUrl: 'https://images.unsplash.com/photo-1594824813566-88855ce78347?w=400&auto=format&fit=crop&q=80',
          bio: 'Praktisi keperawatan perioperatif hewan kecil.',
          specialty: 'Veterinary Nursing'
        }
      ],
      abstract: {
        background: 'Standar persiapan pasien pra-bedah, pencukuran area operasi, dan teknik aseptik ruang bedah.',
        clinicalUpdates: [
          'Protokol scrubbing chlorhexidine vs povidone iodine',
          'Teknik draping empat kuadran bebas kontaminasi',
          'Checklist keselamatan anestesi & instrumen pra-insisi'
        ],
        conclusion: 'Kepatuhan teknik aseptik menekan risiko infeksi luka operasi (SSI) secara signifikan.'
      },
      keyTakeaways: [
        'Persiapan area insisi minimal 3x lebar margin',
        'Sterilitas instrumen dan draping wajib terjaga'
      ],
      rundown: [
        { id: 'rd-3', startTime: '09:00', endTime: '09:45', activity: 'Materi Persiapan Pasien & Aseptik Bedah', pic: 'drh. Rina Kusumawati, M.Vet' },
        { id: 'rd-4', startTime: '09:45', endTime: '10:30', activity: 'Praktik Gowning, Gloving & Draping Pasien', pic: 'Tim Instruktur Vet Nurse' }
      ]
    }
  ];

  const symposiumSamples: Session[] = [
    {
      id: 'sym-sample-1',
      day: 'Hari I',
      date: 'Minggu, 29 November 2026',
      startTime: '09:15',
      endTime: '10:45',
      timeString: '09:15 - 10:45 WIB',
      title: 'Plenary WSAVA Lecture: Contemporary Surgical Management of Feline & Canine Mammary Tumors',
      category: 'Onkologi & Bedah',
      type: 'Plenary Session',
      room: 'Ballroom Amartapura A',
      floor: 'Lantai 1',
      roomColor: 'bg-indigo-600',
      moderator: 'drh. Listriani Wistawan',
      capacity: 400,
      speakers: [
        {
          id: 'sp-sym-1',
          name: 'Prof. Dr. Kelvinesen',
          title: 'WSAVA Keynote Speaker',
          institution: 'WSAVA Oncology Committee',
          photoUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80',
          bio: 'Pakar bedah onkologi hewan kecil internasional.',
          specialty: 'Onkologi Veteriner'
        }
      ],
      abstract: {
        background: 'Pembaruan pedoman WSAVA terkait klasifikasi klinis dan strategi mastektomi radikal maupun regional pada anjing dan kucing.',
        clinicalUpdates: [
          'Indikasi unilateral vs bilateral chain mastectomy pada kucing',
          'Evaluasi limfonodus sentinel inguinalis dan aksilaris',
          'Kombinasi kemoterapi adjuvan pasca-mastektomi'
        ],
        conclusion: 'Pendekatan bedah agresif pada tumor mamaria kucing memberikan angka bebas penyakit (DFS) terbaik.'
      },
      keyTakeaways: [
        'Chain mastectomy direkomendasikan untuk tumor mamaria kucing',
        'Staging TNM dan histopatologi limfonodus wajib dilakukan'
      ]
    },
    {
      id: 'sym-sample-2',
      day: 'Hari I',
      date: 'Minggu, 29 November 2026',
      startTime: '13:30',
      endTime: '15:00',
      timeString: '13:30 - 15:00 WIB',
      title: 'Parallel Session Oncology: Reconstructive Axial Pattern Flaps After Wide Tumor Excision',
      category: 'Bedah Rekonstruksi',
      type: 'Simposium Paralel',
      room: 'Ballroom Amartapura B',
      floor: 'Lantai 1',
      roomColor: 'bg-blue-600',
      moderator: 'drh. Listriani Wistawan',
      capacity: 300,
      speakers: [
        {
          id: 'sp-sym-2',
          name: 'Dr. Ivan Satriawan, drh.',
          title: 'Praktisi Bedah & Onkologi Hewan Kecil',
          institution: 'ADHPHKI',
          photoUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&auto=format&fit=crop&q=80',
          bio: 'Spesialis bedah jaringan lunak dan rekonstruksi kulit veteriner.',
          specialty: 'Bedah Jaringan Lunak'
        }
      ],
      abstract: {
        background: 'Penutupan defek kulit luas pasca-eksisi tumor menggunakan teknik subdermal plexus flap dan axial pattern flap.',
        clinicalUpdates: [
          'Perencanaan thoracodorsal dan caudal superficial epigastric flap',
          'Manajemen tegangan tepi luka (tension-relieving sutures)',
          'Pencegahan nekrosis tepi flap dan seroma pasca-operasi'
        ],
        conclusion: 'Pemahaman vaskularisasi kulit memastikan viabilitas flap pada defek onkologi ekstrem.'
      },
      keyTakeaways: [
        'Jaga arteri dan vena kutaneus direk saat diseksi flap',
        'Hindari tegangan berlebih pada garis jahitan utama'
      ]
    }
  ];

  if (filter === 'workshop') {
    return exportSessionsToCSV(workshopSamples);
  }
  if (filter === 'symposium') {
    return exportSessionsToCSV(symposiumSamples);
  }
  return exportSessionsToCSV([...workshopSamples, ...symposiumSamples]);
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
    speakers: rawHeaders.findIndex(h => h.includes('narasumber') || h.includes('pembicara') || h.includes('speaker') || h.includes('instruktur')),
    background: rawHeaders.findIndex(h => h.includes('abstrak') || h.includes('latar') || h.includes('background')),
    clinicalUpdates: rawHeaders.findIndex(h => h.includes('pembaruan') || h.includes('clinical') || h.includes('update')),
    conclusion: rawHeaders.findIndex(h => h.includes('kesimpulan') || h.includes('conclusion')),
    keyTakeaways: rawHeaders.findIndex(h => h.includes('takeaway') || h.includes('poinpenting') || h.includes('ringkasan')),
    rundown: rawHeaders.findIndex(h => h.includes('rundown') || h.includes('agenda'))
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

    // Category & Type resolution first so Day can use it as fallback
    const category = getVal(colIdx.category, 'Simposium Klinis');
    let sessionType: Session['type'] = 'Simposium Paralel';
    const rawType = getVal(colIdx.type).toLowerCase();
    if (rawType.includes('plenary')) sessionType = 'Plenary Session';
    else if (rawType.includes('workshop') || category.toLowerCase().includes('workshop') || rawTitle.toLowerCase().includes('workshop')) sessionType = 'Workshop Hands-On';
    else if (rawType.includes('keynote')) sessionType = 'Keynote Lecture';
    else if (rawType.includes('panel')) sessionType = 'Panel Discussion';

    // Flexible Day resolution supporting Workshop (28 Nov), Hari I, Hari II, Hari III
    const rawDay = getVal(colIdx.day);
    let dayVal: string = 'Hari I';
    if (rawDay) {
      const lowerDay = rawDay.toLowerCase();
      if (lowerDay.includes('workshop') || lowerDay.includes('28') || lowerDay.includes('pre')) {
        dayVal = 'Workshop (28 Nov)';
      } else if (lowerDay.includes('iii') || lowerDay.includes('3') || lowerDay.includes('selasa') || lowerDay.includes('1 des')) {
        dayVal = 'Hari III';
      } else if (lowerDay.includes('ii') || lowerDay.includes('2') || lowerDay.includes('senin') || lowerDay.includes('30')) {
        dayVal = 'Hari II';
      } else if (lowerDay.includes('i') || lowerDay.includes('1') || lowerDay.includes('minggu') || lowerDay.includes('29')) {
        dayVal = 'Hari I';
      } else {
        dayVal = rawDay;
      }
    } else if (sessionType === 'Workshop Hands-On') {
      dayVal = 'Workshop (28 Nov)';
    }

    // Date resolution
    const defaultDateMap: Record<string, string> = {
      'Workshop (28 Nov)': 'Sabtu, 28 November 2026',
      'Hari I': 'Minggu, 29 November 2026',
      'Hari II': 'Senin, 30 November 2026',
      'Hari III': 'Selasa, 1 Desember 2026'
    };
    const dateVal = getVal(colIdx.date, defaultDateMap[dayVal] || 'Minggu, 29 November 2026');

    // Time
    const startTime = getVal(colIdx.startTime, '08:30');
    const endTime = getVal(colIdx.endTime, '10:00');
    const timeString = getVal(colIdx.timeString, `${startTime} - ${endTime} WIB`);

    // Room & Floor
    const roomName = getVal(colIdx.room, sessionType === 'Workshop Hands-On' ? 'Antareja Room' : 'Ballroom Amartapura A');
    const matchedRoom = existingRooms.find(r => r.name.toLowerCase() === roomName.toLowerCase());
    const floor = getVal(colIdx.floor, matchedRoom?.floor || (sessionType === 'Workshop Hands-On' ? 'Ground Floor' : 'Lantai 1'));
    const roomColor = matchedRoom?.color || (sessionType === 'Workshop Hands-On' ? 'bg-amber-600' : 'bg-indigo-600');

    // Moderator
    const moderator = getVal(colIdx.moderator, 'drh. Moderator Sesi');

    // Capacity
    const capacityRaw = parseInt(getVal(colIdx.capacity), 10);
    const capacity = !isNaN(capacityRaw) && capacityRaw > 0 ? capacityRaw : (sessionType === 'Workshop Hands-On' ? 60 : 300);

    // Speakers resolution
    const speakersStr = getVal(colIdx.speakers);
    const speakerNames = speakersStr ? speakersStr.split(/[|;]/).map(s => s.trim()).filter(Boolean) : [];
    const resolvedSpeakers: Speaker[] = [];

    if (speakerNames.length > 0) {
      speakerNames.forEach((name, spIdx) => {
        const existing = existingSpeakers.find(sp => sp.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(sp.name.toLowerCase()));
        if (existing) {
          resolvedSpeakers.push(existing);
        } else {
          resolvedSpeakers.push({
            id: `sp-imp-${Date.now()}-${i}-${spIdx}`,
            name,
            title: sessionType === 'Workshop Hands-On' ? 'Instruktur Workshop' : 'Narasumber Simposium',
            institution: 'ADHPHKI / Praktisi Klinis',
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

    // Optional Workshop Rundown parsing ("08:30-09:15::Materi 1::Prof. Kelvin | 09:15-10:00::Wet Lab::Tim Instruktur")
    const rundownStr = getVal(colIdx.rundown);
    const rundown = rundownStr
      ? rundownStr
          .split('|')
          .map((itemStr, rIdx) => {
            const parts = itemStr.split('::').map(p => p.trim());
            const timeRange = parts[0] || '';
            const [rStart, rEnd] = timeRange.split('-').map(t => t.trim());
            const activity = parts[1] || parts[0] || '';
            const pic = parts[2] || resolvedSpeakers[0]?.name || 'Instruktur';
            return {
              id: `rd-imp-${Date.now()}-${i}-${rIdx}`,
              startTime: rStart || startTime,
              endTime: rEnd || endTime,
              activity,
              pic
            };
          })
          .filter(r => r.activity.length > 0)
      : undefined;

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
      keyTakeaways,
      rundown: rundown && rundown.length > 0 ? rundown : undefined
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
