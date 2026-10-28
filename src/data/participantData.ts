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

/**
 * Load all participants from localStorage or default database
 */
export function getStoredParticipants(): Participant[] {
  try {
    const raw = localStorage.getItem(STORAGE_PARTICIPANTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
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
 * Get active identified participant, defaulting to first participant (dr. Pranowo) or first stored
 */
export function getActiveParticipant(): Participant {
  try {
    const raw = localStorage.getItem(STORAGE_CURRENT_USER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.name && parsed.email) {
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

/**
 * Bulk import participants from CSV or TSV text
 * Supports header line: email, name, institution, role, npa_idi, phone, ticket_type
 */
export function importParticipantsFromCSV(csvText: string): {
  importedCount: number;
  updatedCount: number;
  totalParticipants: Participant[];
  errors: string[];
} {
  const currentList = getStoredParticipants();
  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  if (lines.length === 0) {
    return { importedCount: 0, updatedCount: 0, totalParticipants: currentList, errors: ['Teks CSV kosong.'] };
  }

  const errors: string[] = [];
  const listCopy = [...currentList];
  let importedCount = 0;
  let updatedCount = 0;

  // Check if first line is a header
  const firstLine = lines[0].toLowerCase();
  const hasHeader = firstLine.includes('email') || firstLine.includes('nama') || firstLine.includes('name');
  const dataLines = hasHeader ? lines.slice(1) : lines;

  dataLines.forEach((line, idx) => {
    // Delimiter can be comma or semicolon or tab
    const delimiter = line.includes('\t') ? '\t' : line.includes(';') ? ';' : ',';
    const parts = line.split(delimiter).map(p => p.trim().replace(/^["']|["']$/g, ''));

    if (parts.length < 2) {
      errors.push(`Baris ${idx + (hasHeader ? 2 : 1)}: Format tidak lengkap (minimal butuh email dan nama)`);
      return;
    }

    const email = parts[0]?.trim();
    const name = parts[1]?.trim();
    const institution = parts[2]?.trim() || 'RS / Faskes Peserta';
    const roleRaw = parts[3]?.trim() || 'Dokter Spesialis';
    const npaIdi = parts[4]?.trim() || `${Math.floor(100 + Math.random() * 800)}.${Math.floor(100 + Math.random() * 800)}/IDI`;
    const phone = parts[5]?.trim() || '';
    const ticketTypeRaw = parts[6]?.trim() || 'Simposium Full Pass';

    if (!email || !email.includes('@')) {
      errors.push(`Baris ${idx + (hasHeader ? 2 : 1)}: Alamat email "${email}" tidak valid.`);
      return;
    }

    // Normalize role
    let role: Participant['role'] = 'Dokter Spesialis';
    const lowerRole = roleRaw.toLowerCase();
    if (lowerRole.includes('umum')) role = 'Dokter Umum';
    else if (lowerRole.includes('residen') || lowerRole.includes('ppds')) role = 'Residen';
    else if (lowerRole.includes('mahasiswa') || lowerRole.includes('koas')) role = 'Mahasiswa Kedokteran';
    else if (lowerRole.includes('panitia')) role = 'Panitia';
    else if (lowerRole.includes('peserta')) role = 'Peserta';

    // Normalize ticket
    let ticketType: Participant['ticketType'] = 'Simposium Full Pass';
    const lowerTicket = ticketTypeRaw.toLowerCase();
    if (lowerTicket.includes('workshop')) ticketType = 'Workshop Only';
    else if (lowerTicket.includes('all') || lowerTicket.includes('semua')) ticketType = 'All-Access (Simposium + Workshop)';
    else if (lowerTicket.includes('vip') || lowerTicket.includes('speaker')) ticketType = 'VIP / Speaker';

    const cleanEmail = email.toLowerCase();
    const existingIndex = listCopy.findIndex(p => p.email.trim().toLowerCase() === cleanEmail);

    const participantObj: Participant = {
      id: existingIndex >= 0 ? listCopy[existingIndex].id : `part-${Date.now()}-${idx}`,
      email: cleanEmail,
      name: name || email.split('@')[0],
      institution,
      role,
      npaIdi,
      phone,
      ticketType,
      badgeId: existingIndex >= 0 ? listCopy[existingIndex].badgeId : `ID-SIMP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      registeredAt: new Date().toISOString().split('T')[0]
    };

    if (existingIndex >= 0) {
      listCopy[existingIndex] = { ...listCopy[existingIndex], ...participantObj };
      updatedCount++;
    } else {
      listCopy.unshift(participantObj);
      importedCount++;
    }
  });

  saveStoredParticipants(listCopy);

  return {
    importedCount,
    updatedCount,
    totalParticipants: listCopy,
    errors
  };
}

/**
 * Export participants to CSV format
 */
export function exportParticipantsToCSV(participants: Participant[]): string {
  const headers = ['Email', 'Nama Lengkap & Gelar', 'Institusi / Rumah Sakit', 'Kategori Profesi', 'NPA IDI', 'No. Telepon/WA', 'Jenis Tiket', 'ID Badge', 'Tanggal Daftar'];
  const rows = participants.map(p => [
    `"${p.email}"`,
    `"${p.name}"`,
    `"${p.institution}"`,
    `"${p.role}"`,
    `"${p.npaIdi || '-'}"`,
    `"${p.phone || '-'}"`,
    `"${p.ticketType || 'Simposium Full Pass'}"`,
    `"${p.badgeId}"`,
    `"${p.registeredAt || '-'}"`
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
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
