import { Participant } from '../types';

export const DEFAULT_PARTICIPANTS_DATABASE: Participant[] = [
  {
    id: 'part-001',
    email: 'pranowo.tfc@gmail.com',
    name: 'dr. Pranowo, Sp.PD',
    title: 'Sp.PD',
    npaIdi: '301.992/IDI',
    institution: 'RSUP Dr. Kariadi Semarang',
    role: 'Dokter Spesialis',
    phone: '0812-3456-7890',
    ticketType: 'All-Access (Simposium + Workshop)',
    badgeId: 'ID-SIMP-2026-001',
    registeredAt: '2026-08-15'
  },
  {
    id: 'part-002',
    email: 'ahmad.pratama@kemenkes.go.id',
    name: 'dr. Ahmad Pratama, Sp.PD',
    title: 'Sp.PD',
    npaIdi: '289.104/IDI',
    institution: 'RSUP Dr. Cipto Mangunkusumo Jakarta',
    role: 'Dokter Spesialis',
    phone: '0813-8877-2211',
    ticketType: 'Simposium Full Pass',
    badgeId: 'ID-SIMP-2026-002',
    registeredAt: '2026-08-16'
  },
  {
    id: 'part-003',
    email: 'budi.santoso@rscm.co.id',
    name: 'dr. Budi Santoso, Sp.A(K)',
    title: 'Sp.A(K)',
    npaIdi: '194.221/IDI',
    institution: 'FKUI - RSCM Jakarta',
    role: 'Dokter Spesialis',
    phone: '0811-2233-4455',
    ticketType: 'All-Access (Simposium + Workshop)',
    badgeId: 'ID-SIMP-2026-003',
    registeredAt: '2026-08-18'
  },
  {
    id: 'part-004',
    email: 'siti.rahmawati@gmail.com',
    name: 'dr. Siti Rahmawati',
    title: 'dr.',
    npaIdi: '412.553/IDI',
    institution: 'Puskesmas Gambir Jakarta Pusat',
    role: 'Dokter Umum',
    phone: '0857-1122-3344',
    ticketType: 'Simposium Full Pass',
    badgeId: 'ID-SIMP-2026-004',
    registeredAt: '2026-08-20'
  },
  {
    id: 'part-005',
    email: 'dimas.wahyudi@soedarso.go.id',
    name: 'dr. Dimas Wahyudi, Sp.JP',
    title: 'Sp.JP',
    npaIdi: '310.871/IDI',
    institution: 'RSUD dr. Soedarso Pontianak',
    role: 'Dokter Spesialis',
    phone: '0812-9988-7766',
    ticketType: 'All-Access (Simposium + Workshop)',
    badgeId: 'ID-SIMP-2026-005',
    registeredAt: '2026-08-21'
  },
  {
    id: 'part-006',
    email: 'kevin.sanjaya@ui.ac.id',
    name: 'dr. Kevin Sanjaya',
    title: 'dr.',
    npaIdi: '512.009/IDI',
    institution: 'PPDS Ilmu Penyakit Dalam FKUI - RSCM',
    role: 'Residen',
    phone: '0878-3344-5566',
    ticketType: 'Simposium Full Pass',
    badgeId: 'ID-SIMP-2026-006',
    registeredAt: '2026-08-22'
  },
  {
    id: 'part-007',
    email: 'maya.indriani@rsflores.id',
    name: 'dr. Maya Indriani',
    title: 'dr.',
    npaIdi: '489.112/IDI',
    institution: 'RS Pratama Flores NTT',
    role: 'Dokter Umum',
    phone: '0821-4455-6677',
    ticketType: 'Workshop Only',
    badgeId: 'ID-SIMP-2026-007',
    registeredAt: '2026-08-23'
  },
  {
    id: 'part-008',
    email: 'farhan.maulana@al-ihsan.id',
    name: 'dr. Farhan Maulana, Sp.PD',
    title: 'Sp.PD',
    npaIdi: '278.431/IDI',
    institution: 'RSUD Al-Ihsan Bandung',
    role: 'Dokter Spesialis',
    phone: '0813-5566-7788',
    ticketType: 'Simposium Full Pass',
    badgeId: 'ID-SIMP-2026-008',
    registeredAt: '2026-08-24'
  },
  {
    id: 'part-009',
    email: 'panitia.simposium@idi.or.id',
    name: 'dr. Ratna Setyowati, Sp.N(K)',
    title: 'Sp.N(K)',
    npaIdi: '102.394/IDI',
    institution: 'Pengurus Besar IDI / Panitia Ilmiah',
    role: 'Panitia',
    phone: '0811-9900-1122',
    ticketType: 'VIP / Speaker',
    badgeId: 'ID-SIMP-2026-009',
    registeredAt: '2026-08-10'
  }
];

const STORAGE_PARTICIPANTS_KEY = 'simposium_participants_list_v1';
const STORAGE_CURRENT_USER_KEY = 'simposium_active_participant_v1';
const STORAGE_PARTICIPANT_LOGGED_IN_KEY = 'simposium_participant_logged_in_v1';

/**
 * Load all participants from localStorage or default database
 */
export function getStoredParticipants(): Participant[] {
  try {
    const raw = localStorage.getItem(STORAGE_PARTICIPANTS_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading participants from localStorage:', e);
  }
  return DEFAULT_PARTICIPANTS_DATABASE;
}

/**
 * Save participants to localStorage
 */
export function saveStoredParticipants(participants: Participant[]): void {
  try {
    localStorage.setItem(STORAGE_PARTICIPANTS_KEY, JSON.stringify(participants));
  } catch (e) {
    console.error('Error saving participants to localStorage:', e);
  }
}

const ID_REGISTRANT_KEY_REGEX =
  /^(id[_\s-]*registran|id[_\s-]*registrant|registrant[_\s-]*id|registrant|registration[_\s-]*id|reg[_\s-]*id|no\.?\s?registrasi|kode\s?registrasi|id[_\s-]*pendaftaran|id[_\s-]*peserta|kode[_\s-]*peserta)$/i;

function isIdRegistrantFieldKey(key: string): boolean {
  const normalized = (key || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (normalized === 'id' || normalized === 'no' || normalized === '#') return false;
  return (
    ID_REGISTRANT_KEY_REGEX.test(normalized) ||
    /(id_registran|id_registrant|registrant_id|no_registrasi|kode_registrasi|id_pendaftaran|registration_id|reg_id)/i.test(
      normalized
    )
  );
}

/**
 * Extract primary Id_registrant from participant record (explicit field, customFields, or badgeId)
 */
export function extractParticipantIdRegistrant(p: Participant | undefined | null): string {
  if (!p) return '';
  const directIdReg = p.idRegistrant != null ? String(p.idRegistrant).trim() : '';
  if (directIdReg) return directIdReg;
  if (p.customFields) {
    for (const [k, v] of Object.entries(p.customFields)) {
      const val = v != null ? String(v).trim() : '';
      if (isIdRegistrantFieldKey(k) && val) {
        return val;
      }
    }
  }
  return '';
}

/**
 * Find participant by email (case insensitive, trimmed)
 */
export function findParticipantByEmail(email: string, participantsList?: Participant[]): Participant | undefined {
  if (!email || typeof email !== 'string') return undefined;
  const cleanEmail = email.trim().toLowerCase();
  const list = participantsList || getStoredParticipants();
  return list.find(p => p.email.trim().toLowerCase() === cleanEmail);
}

/**
 * Find participant by Id_registrant, badgeId, or matching custom field (case-insensitive)
 */
export function findParticipantByIdRegistrant(
  rawId: string,
  participantsList?: Participant[]
): Participant | undefined {
  if (!rawId || typeof rawId !== 'string') return undefined;
  const target = rawId.trim().toLowerCase();
  if (!target) return undefined;
  const list = participantsList || getStoredParticipants();

  return list.find((p) => {
    if (p.idRegistrant && p.idRegistrant.trim().toLowerCase() === target) return true;
    if (p.badgeId && p.badgeId.trim().toLowerCase() === target) return true;
    if (p.customFields) {
      for (const [k, v] of Object.entries(p.customFields)) {
        if (isIdRegistrantFieldKey(k) && String(v || '').trim().toLowerCase() === target) {
          return true;
        }
      }
    }
    return false;
  });
}

export function isParticipantSessionLoggedIn(): boolean {
  try {
    return localStorage.getItem(STORAGE_PARTICIPANT_LOGGED_IN_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setParticipantSessionLoggedIn(loggedIn: boolean): void {
  try {
    if (loggedIn) {
      localStorage.setItem(STORAGE_PARTICIPANT_LOGGED_IN_KEY, 'true');
    } else {
      localStorage.removeItem(STORAGE_PARTICIPANT_LOGGED_IN_KEY);
    }
  } catch {}
}

/**
 * Get active identified participant, defaulting to first participant (dr. Pranowo) or first stored
 */
export function getActiveParticipant(): Participant {
  try {
    const raw = localStorage.getItem(STORAGE_CURRENT_USER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.name) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error getting active participant:', e);
  }

  const all = getStoredParticipants();
  const defaultUser = (Array.isArray(all) && all.length > 0 && all[0]?.name) 
    ? all[0] 
    : DEFAULT_PARTICIPANTS_DATABASE[0];

  if (defaultUser) {
    setActiveParticipant(defaultUser);
    return defaultUser;
  }

  return DEFAULT_PARTICIPANTS_DATABASE[0];
}

/**
 * Set active participant in localStorage
 */
export function setActiveParticipant(participant: Participant): void {
  try {
    localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(participant));
  } catch (e) {
    console.error('Error setting active participant:', e);
  }
}

/**
 * Register a new participant or update existing
 */
export function registerOrUpdateParticipant(participant: Participant): { participants: Participant[]; saved: Participant } {
  const all = getStoredParticipants();
  const cleanEmail = participant.email.trim().toLowerCase();
  
  const existingIdx = all.findIndex(p => p.email.trim().toLowerCase() === cleanEmail || p.id === participant.id);
  let updatedList: Participant[];

  const toSave: Participant = {
    ...participant,
    email: cleanEmail,
    id: participant.id || `part-${Date.now()}`,
    badgeId: participant.badgeId || `ID-SIMP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    registeredAt: participant.registeredAt || new Date().toISOString().split('T')[0]
  };

  if (existingIdx >= 0) {
    updatedList = [...all];
    updatedList[existingIdx] = {
      ...all[existingIdx],
      ...toSave
    };
  } else {
    updatedList = [toSave, ...all];
  }

  saveStoredParticipants(updatedList);
  return { participants: updatedList, saved: toSave };
}

export type ParticipantMappingTarget =
  | 'idRegistrant'
  | 'email'
  | 'name'
  | 'title'
  | 'institution'
  | 'role'
  | 'npaIdi'
  | 'phone'
  | 'ticketType'
  | 'badgeId'
  | 'custom'
  | 'ignore';

function detectDelimiter(sampleLine: string): string {
  const tabCount = (sampleLine.match(/\t/g) || []).length;
  const semiCount = (sampleLine.match(/;/g) || []).length;
  const commaCount = (sampleLine.match(/,/g) || []).length;
  if (tabCount >= semiCount && tabCount >= commaCount && tabCount > 0) return '\t';
  if (semiCount >= commaCount && semiCount > 0) return ';';
  return ',';
}

function parseDelimitedLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

const HEADER_KEYWORDS = [
  'email', 'e-mail', 'surel', 'mail', 'nama', 'name', 'peserta',
  'institusi', 'instansi', 'rumah sakit', 'hospital', 'rs', 'afiliasi',
  'profesi', 'role', 'jabatan', 'kategori', 'npa', 'idi', 'hp', 'wa',
  'telepon', 'telp', 'phone', 'tiket', 'ticket', 'paket', 'badge', 'no', 'nik'
];

export function parseDelimitedSpreadsheetText(rawText: string): {
  headers: string[];
  rows: string[][];
  hasDetectedHeader: boolean;
} {
  const cleaned = (rawText || '').replace(/^\uFEFF/, '');
  const lines = cleaned
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.trim().length > 0);

  if (lines.length === 0) {
    return { headers: [], rows: [], hasDetectedHeader: false };
  }

  const delimiter = detectDelimiter(lines[0]);
  const parsedLines = lines.map((line) => parseDelimitedLine(line, delimiter));
  const maxCols = Math.max(...parsedLines.map((row) => row.length), 1);

  const firstRow = parsedLines[0];
  const firstRowJoined = firstRow.join(' ').toLowerCase();
  const firstRowHasEmail = firstRow.some((cell) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cell.trim()));
  const firstRowLooksLikeHeader =
    !firstRowHasEmail &&
    (HEADER_KEYWORDS.some((kw) => firstRowJoined.includes(kw)) || parsedLines.length > 1);

  const rawHeaders = firstRowLooksLikeHeader
    ? firstRow
    : Array.from({ length: maxCols }, (_, idx) => `Kolom ${idx + 1}`);

  const headers = Array.from({ length: maxCols }, (_, idx) => {
    const val = (rawHeaders[idx] || '').trim();
    return val || `Kolom ${idx + 1}`;
  });

  const dataRows = (firstRowLooksLikeHeader ? parsedLines.slice(1) : parsedLines).map((row) =>
    Array.from({ length: maxCols }, (_, idx) => (row[idx] ?? '').trim())
  );

  return {
    headers,
    rows: dataRows.filter((row) => row.some((cell) => cell.length > 0)),
    hasDetectedHeader: firstRowLooksLikeHeader,
  };
}

const EMAIL_EXTRACT_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

function cleanEmailCell(raw: string): string {
  const cleaned = (raw || '')
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, ' ')
    .replace(/^mailto:/i, '')
    .trim();
  if (!cleaned) return '';
  const extracted = cleaned.match(EMAIL_EXTRACT_REGEX);
  if (extracted) {
    return extracted[0].toLowerCase();
  }
  const compact = cleaned.replace(/\s+/g, '');
  if (compact.includes('@') && compact.length >= 3) {
    return compact.toLowerCase();
  }
  return '';
}

function normalizeNameForMatch(name: string): string {
  return (name || '')
    .toLowerCase()
    .replace(/[.,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function detectParticipantColumnMapping(
  headers: string[],
  rows: string[][]
): ParticipantMappingTarget[] {
  const usedTargets = new Set<ParticipantMappingTarget>();

  const pickUnique = (target: ParticipantMappingTarget): ParticipantMappingTarget => {
    if (usedTargets.has(target)) return 'custom';
    usedTargets.add(target);
    return target;
  };

  const initial: ParticipantMappingTarget[] = headers.map((header) => {
    const h = header.trim().toLowerCase();

    if (/^(no|no\.|#|nomor|urut)$/.test(h)) return 'ignore';
    if (isIdRegistrantFieldKey(h)) {
      return pickUnique('idRegistrant');
    }
    if (/(e-?mail|surel|\bmail\b)/.test(h)) return pickUnique('email');
    if (/(tiket|ticket|paket|jenis.?peserta|kepesertaan|pass|workshop)/.test(h)) {
      return pickUnique('ticketType');
    }
    if (
      /(nama|full.?name|\bname\b|peserta)/.test(h) &&
      !/(institusi|instansi|rs|rumah sakit|kegiatan|event|jenis|status|kategori|tipe|paket|tiket|workshop)/.test(
        h
      )
    ) {
      return pickUnique('name');
    }
    if (/(gelar|\btitle\b)/.test(h)) return pickUnique('title');
    if (/(institusi|instansi|rumah sakit|\brs\b|hospital|afiliasi|faskes|asal|lembaga|unit kerja|universitas|fk|klinik)/.test(h)) {
      return pickUnique('institution');
    }
    if (/(profesi|\brole\b|jabatan|kategori|spesialis|bidang|peran)/.test(h)) {
      return pickUnique('role');
    }
    if (/(npa|idi|\bstr\b|\bsip\b|anggota|pdhi|kta)/.test(h)) return pickUnique('npaIdi');
    if (/(\bhp\b|\bwa\b|whatsapp|telepon|telp|phone|handphone|no\.?\s?hp|kontak|seluler)/.test(h)) {
      return pickUnique('phone');
    }
    if (/(registrasi)/.test(h)) {
      return pickUnique('ticketType');
    }
    if (/(badge|kode.?peserta|id.?peserta|qr.?id)/.test(h)) {
      return pickUnique('badgeId');
    }
    return 'custom';
  });

  // Content-based fallback for headerless or non-standard headers (scan up to 50 rows)
  const sampleRows = rows.slice(0, 50);
  if (!usedTargets.has('email')) {
    const emailColIdx = headers.findIndex((_, colIdx) =>
      sampleRows.some((row) => Boolean(cleanEmailCell(row[colIdx] || '')))
    );
    if (emailColIdx >= 0) {
      initial[emailColIdx] = 'email';
      usedTargets.add('email');
    }
  }

  if (!usedTargets.has('name')) {
    const nameColIdx = initial.findIndex(
      (target, colIdx) =>
        target === 'custom' &&
        sampleRows.slice(0, 15).some((row) => {
          const val = (row[colIdx] || '').trim();
          return val.length >= 3 && !/^\d+$/.test(val) && !val.includes('@');
        })
    );
    if (nameColIdx >= 0) {
      initial[nameColIdx] = 'name';
      usedTargets.add('name');
    }
  }

  return initial;
}

function slugifyEmailLocal(text: string, fallbackIndex: number): string {
  const slug = (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .slice(0, 42);
  return slug || `peserta.${fallbackIndex + 1}`;
}

function generateUniquePlaceholderEmail(
  seedText: string,
  rowIdx: number,
  usedEmails: Set<string>
): string {
  const baseSlug = slugifyEmailLocal(seedText, rowIdx);
  let candidate = `${baseSlug}@peserta.local`;
  let suffix = 2;
  while (usedEmails.has(candidate)) {
    candidate = `${baseSlug}.${suffix}@peserta.local`;
    suffix++;
  }
  usedEmails.add(candidate);
  return candidate;
}

export function importParticipantsWithMapping(params: {
  headers: string[];
  rows: string[][];
  mapping: ParticipantMappingTarget[];
  existingParticipants?: Participant[];
  autoGeneratePlaceholderEmail?: boolean;
  defaultTicketType?: string;
  ticketImportMode?: 'from_column_with_fallback' | 'override_all';
}): {
  importedCount: number;
  updatedCount: number;
  skippedCount: number;
  generatedEmailCount: number;
  totalParticipants: Participant[];
  errors: string[];
} {
  const {
    headers,
    rows,
    mapping,
    existingParticipants,
    autoGeneratePlaceholderEmail = true,
    defaultTicketType = 'Simposium Full Pass',
    ticketImportMode = 'from_column_with_fallback',
  } = params;
  const cleanDefaultTicket = defaultTicketType.trim() || 'Simposium Full Pass';

  const baseList = existingParticipants ? [...existingParticipants] : [...getStoredParticipants()];
  const usedPlaceholderEmails = new Set<string>(
    baseList.map((p) => (p.email || '').trim().toLowerCase()).filter(Boolean)
  );

  if (rows.length === 0) {
    return {
      importedCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      generatedEmailCount: 0,
      totalParticipants: baseList,
      errors: ['Tidak ada baris data yang dapat diproses.'],
    };
  }

  const errors: string[] = [];
  let importedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let generatedEmailCount = 0;
  const nowDate = new Date().toISOString().split('T')[0];
  const batchTimestamp = Date.now();

  rows.forEach((row, idx) => {
    if (!row.some((cell) => cell.trim().length > 0)) return;

    let idRegistrant = '';
    let rawEmail = '';
    let name = '';
    let title = '';
    let institution = '';
    let role = '';
    let npaIdi = '';
    let phone = '';
    let ticketType = '';
    let badgeId = '';
    const customFields: Record<string, string> = {};

    mapping.forEach((target, colIdx) => {
      const val = (row[colIdx] ?? '').trim();
      if (!val || target === 'ignore') return;

      switch (target) {
        case 'idRegistrant':
          idRegistrant = val;
          break;
        case 'email':
          rawEmail = val;
          break;
        case 'name':
          name = val;
          break;
        case 'title':
          title = val;
          break;
        case 'institution':
          institution = val;
          break;
        case 'role':
          role = val;
          break;
        case 'npaIdi':
          npaIdi = val;
          break;
        case 'phone':
          phone = val;
          break;
        case 'ticketType':
          ticketType = val;
          break;
        case 'badgeId':
          badgeId = val;
          break;
        case 'custom': {
          const headerName = (headers[colIdx] || `Kolom_${colIdx + 1}`).trim().slice(0, 60);
          if (headerName) {
            customFields[headerName] = val.slice(0, 300);
          }
          break;
        }
      }
    });

    if (!name && !rawEmail && !idRegistrant && !badgeId && Object.keys(customFields).length === 0) {
      skippedCount++;
      return;
    }

    let email = cleanEmailCell(rawEmail);

    // Check if another cell contains an email when the mapped email cell is empty/invalid
    // (only if no explicit email column was valid)
    const cleanIdReg = idRegistrant.trim().toLowerCase();
    const normIncomingName = normalizeNameForMatch(name);

    // Match existing record safely:
    // 1) Exact Id_registrant match always identifies the same registrant.
    // 2) Email match ONLY merges when Id_registrant does not conflict AND
    //    either names match (or one is missing). This prevents overwriting
    //    distinct participants who share a hospital/clinic/admin email!
    let existingIndex = -1;
    if (cleanIdReg) {
      existingIndex = baseList.findIndex(
        (p) => p.idRegistrant && p.idRegistrant.trim().toLowerCase() === cleanIdReg
      );
    }

    if (existingIndex < 0 && email) {
      existingIndex = baseList.findIndex((p) => {
        if ((p.email || '').trim().toLowerCase() !== email) return false;
        const existingIdReg = (p.idRegistrant || '').trim().toLowerCase();
        // Different non-empty Id_registrant = definitely different people sharing an email
        if (cleanIdReg && existingIdReg && cleanIdReg !== existingIdReg) {
          return false;
        }
        const normExistingName = normalizeNameForMatch(p.name);
        // Different non-empty names sharing an email (e.g., clinic/hospital batch registration) = keep both!
        if (normIncomingName && normExistingName && normIncomingName !== normExistingName) {
          return false;
        }
        return true;
      });
    }

    if (!email) {
      const existingById = existingIndex >= 0 ? baseList[existingIndex] : undefined;
      if (existingById?.email) {
        email = existingById.email.trim().toLowerCase();
      } else if (autoGeneratePlaceholderEmail && (name || badgeId || idRegistrant || Object.keys(customFields).length > 0)) {
        email = generateUniquePlaceholderEmail(
          idRegistrant || name || badgeId || `peserta_${idx + 1}`,
          idx,
          usedPlaceholderEmails
        );
        generatedEmailCount++;
      } else {
        skippedCount++;
        errors.push(
          `Baris ${idx + 1} (${name || idRegistrant || 'Tanpa Nama'}): Email "${rawEmail || '-'}" kosong atau tidak valid.`
        );
        return;
      }
    }

    const cleanEmail = email.trim().toLowerCase();
    usedPlaceholderEmails.add(cleanEmail);
    const existing = existingIndex >= 0 ? baseList[existingIndex] : undefined;

    const mergedCustomFields = {
      ...(existing?.customFields || {}),
      ...customFields,
    };

    const resolvedIdRegistrant = idRegistrant || existing?.idRegistrant || '';
    const resolvedBadgeId =
      badgeId ||
      resolvedIdRegistrant ||
      existing?.badgeId ||
      `ID-SIMP-2026-${String(idx + 1).padStart(3, '0')}-${Math.floor(100 + Math.random() * 900)}`;

    const resolvedTicketType =
      ticketImportMode === 'override_all'
        ? cleanDefaultTicket
        : ticketType || cleanDefaultTicket || existing?.ticketType || 'Simposium Full Pass';

    const participantObj: Participant = {
      id: existing ? existing.id : `part-${batchTimestamp}-${idx}`,
      ...(resolvedIdRegistrant ? { idRegistrant: resolvedIdRegistrant } : {}),
      email: cleanEmail,
      name: name || existing?.name || cleanEmail.split('@')[0],
      title: title || existing?.title || '',
      institution: institution || existing?.institution || 'RS / Faskes Peserta',
      role: role || existing?.role || 'Peserta',
      npaIdi: npaIdi || existing?.npaIdi || '',
      phone: phone || existing?.phone || '',
      ticketType: resolvedTicketType,
      badgeId: resolvedBadgeId,
      registeredAt: existing?.registeredAt || nowDate,
      ...(Object.keys(mergedCustomFields).length > 0 ? { customFields: mergedCustomFields } : {}),
    };

    if (existingIndex >= 0) {
      baseList[existingIndex] = { ...existing, ...participantObj };
      updatedCount++;
    } else {
      baseList.unshift(participantObj);
      importedCount++;
    }
  });

  saveStoredParticipants(baseList);

  return {
    importedCount,
    updatedCount,
    skippedCount,
    generatedEmailCount,
    totalParticipants: baseList,
    errors,
  };
}

/**
 * Bulk import participants from CSV or TSV text (auto-detects columns from headers)
 */
export function importParticipantsFromCSV(
  csvText: string,
  existingParticipants?: Participant[]
): {
  importedCount: number;
  updatedCount: number;
  totalParticipants: Participant[];
  errors: string[];
} {
  const { headers, rows } = parseDelimitedSpreadsheetText(csvText);
  if (rows.length === 0) {
    return {
      importedCount: 0,
      updatedCount: 0,
      totalParticipants: existingParticipants || getStoredParticipants(),
      errors: ['Teks CSV kosong atau tidak memiliki baris data.'],
    };
  }
  const mapping = detectParticipantColumnMapping(headers, rows);
  const res = importParticipantsWithMapping({
    headers,
    rows,
    mapping,
    existingParticipants,
  });
  return {
    importedCount: res.importedCount,
    updatedCount: res.updatedCount,
    totalParticipants: res.totalParticipants,
    errors: res.errors,
  };
}

/**
 * Export participants to CSV format (including any customFields columns)
 */
export function exportParticipantsToCSV(participants: Participant[]): string {
  const customKeys = Array.from(
    new Set(
      participants.flatMap((p) => (p.customFields ? Object.keys(p.customFields) : []))
    )
  );
  const headers = [
    'Id_registrant',
    'Email',
    'Nama Lengkap & Gelar',
    'Institusi / Rumah Sakit',
    'Kategori Profesi',
    'NPA IDI',
    'No. Telepon/WA',
    'Jenis Tiket',
    'ID Badge',
    'Tanggal Daftar',
    ...customKeys,
  ];
  const escapeCsv = (val: unknown) => `"${String(val ?? '').replace(/"/g, '""')}"`;
  const rows = participants.map((p) => [
    escapeCsv(extractParticipantIdRegistrant(p) || '-'),
    escapeCsv(p.email),
    escapeCsv(p.name),
    escapeCsv(p.institution),
    escapeCsv(p.role),
    escapeCsv(p.npaIdi || '-'),
    escapeCsv(p.phone || '-'),
    escapeCsv(p.ticketType || 'Simposium Full Pass'),
    escapeCsv(p.badgeId),
    escapeCsv(p.registeredAt || '-'),
    ...customKeys.map((k) => escapeCsv(p.customFields?.[k] || '')),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Reset participants to initial preset list
 */
export function resetParticipantsToDefault(): Participant[] {
  saveStoredParticipants(DEFAULT_PARTICIPANTS_DATABASE);
  setActiveParticipant(DEFAULT_PARTICIPANTS_DATABASE[0]);
  return DEFAULT_PARTICIPANTS_DATABASE;
}

/**
 * Delete a participant by ID
 */
export function deleteStoredParticipant(id: string): Participant[] {
  const current = getStoredParticipants();
  const filtered = current.filter(p => p.id !== id);
  saveStoredParticipants(filtered);
  return filtered;
}
