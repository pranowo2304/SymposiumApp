import { Participant, Session, SymposiumInfo } from '../types';
import { SESSIONS_DATA } from '../data/symposiumData';

export type SessionTrackType = 'workshop' | 'symposium';

export type MaterialAccessReason =
  | 'admin'
  | 'privileged_role'
  | 'all_access'
  | 'ticket_matched'
  | 'login_required'
  | 'ticket_restricted';

export interface MaterialAccessResult {
  allowed: boolean;
  reason: MaterialAccessReason;
  sessionTrack: SessionTrackType;
  workshopTypeLabel?: string;
  requiredAccessLabel: string;
  currentTicketLabel: string | null;
  grantedBadgeLabel?: string;
  title: string;
  description: string;
}

export interface TicketPassOptionGroups {
  general: string[];
  workshopOnly: string[];
  symposiumAndWorkshop: string[];
  all: string[];
}

export const BASE_TICKET_OPTIONS: string[] = [
  'All-Access (Simposium + Workshop)',
  'Simposium Full Pass',
  'Workshop Full Pass (Semua Workshop)',
  'Workshop Only',
  'VIP / Speaker',
];

const NEGATIVE_FIELD_VALUES = new Set([
  '',
  '-',
  '0',
  'no',
  'none',
  'tidak',
  'belum',
  'false',
  'n/a',
  'na',
]);

const GENERIC_WORKSHOP_STOPWORDS = new Set([
  'workshop',
  'ws',
  'pass',
  'only',
  'saja',
  'full',
  'all',
  'access',
  'semua',
  'simposium',
  'symposium',
  'dan',
  'and',
  'with',
  'plus',
  'paket',
  'tiket',
  'ticket',
  'hands',
  'on',
  'handson',
  'sesi',
  'session',
  'track',
  'peserta',
  'member',
  'vip',
  'speaker',
  'pembicara',
  'panitia',
  'clinical',
  'pre',
  'congress',
  'untuk',
  'khusus',
  'from',
  'to',
  'the',
  'of',
  'in',
  'di',
  'ke',
]);

function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function clampTicketLabel(label: string): string {
  const cleaned = label.replace(/\s+/g, ' ').trim();
  return cleaned.length <= 115 ? cleaned : `${cleaned.slice(0, 112).trim()}...`;
}

export function getSessionTrackType(session: Session | null | undefined): SessionTrackType {
  if (!session) return 'symposium';
  const typeStr = (session.type || '').toLowerCase();
  const dayStr = (session.day || '').toLowerCase();
  const categoryStr = (session.category || '').toLowerCase();

  if (
    typeStr.includes('workshop') ||
    typeStr.includes('hands-on') ||
    dayStr.includes('workshop') ||
    categoryStr.includes('workshop')
  ) {
    return 'workshop';
  }
  return 'symposium';
}

const GENERIC_ONLY_WORKSHOP_CATEGORY_RE =
  /^(workshop|ws|workshop\s+hands[\s-]*on|hands[\s-]*on|workshop\s+pre[\s-]*congress|pre[\s-]*congress\s+workshop|pelatihan|praktikum|wetlab|drylab|workshop\s+umum)$/i;

export function getWorkshopTypeLabel(session: Session | null | undefined): string {
  if (!session) return 'Workshop';
  const rawCategory = (session.category || '').trim();
  const isGenericCategory = !rawCategory || GENERIC_ONLY_WORKSHOP_CATEGORY_RE.test(rawCategory);

  if (rawCategory && !isGenericCategory) {
    if (/^workshop\b/i.test(rawCategory)) {
      return rawCategory;
    }
    return `Workshop ${rawCategory}`;
  }

  const rawTitle = (session.title || '').trim();
  if (rawTitle) {
    const cleanedTitle = clampTicketLabel(rawTitle);
    return /\bworkshop\b/i.test(cleanedTitle) ? cleanedTitle : clampTicketLabel(`Workshop ${cleanedTitle}`);
  }
  return rawCategory || 'Workshop';
}

export function extractWorkshopTypes(
  sessions?: Session[],
  eventInfo?: SymposiumInfo
): string[] {
  const seen = new Map<string, string>();
  const addLabel = (rawLabel?: string | null) => {
    const cleaned = (rawLabel || '').trim();
    if (!cleaned || GENERIC_ONLY_WORKSHOP_CATEGORY_RE.test(cleaned)) return;
    const normalizedLabel = /^workshop\b/i.test(cleaned) ? cleaned : `Workshop ${cleaned}`;
    const key = normalizeText(normalizedLabel);
    if (key && !seen.has(key)) {
      seen.set(key, clampTicketLabel(normalizedLabel));
    }
  };

  // 1. Workshop sessions currently configured in active schedule
  if (Array.isArray(sessions) && sessions.length > 0) {
    sessions.forEach((session) => {
      if (getSessionTrackType(session) !== 'workshop') return;
      addLabel(getWorkshopTypeLabel(session));
    });
  }

  // 2. Workshop labels configured in Event Info (ID Card Templates, Certificate Templates, Rundown PDFs)
  if (eventInfo) {
    Object.values(eventInfo.workshopIdentityCardTemplates || {}).forEach((tpl) => {
      addLabel(tpl?.workshopLabel);
    });
    Object.values(eventInfo.certificateTemplates || {}).forEach((tpl) => {
      if (tpl && tpl.category === 'workshop') {
        addLabel(tpl.templateLabel);
      }
    });
    Object.values(eventInfo.workshopRundownPdfs || {}).forEach((pdf) => {
      addLabel(pdf?.workshopLabel);
    });
    Object.values(eventInfo.workshopMaterials || {}).forEach((list) => {
      if (Array.isArray(list)) {
        list.forEach((mat) => addLabel(mat?.workshopLabel));
      }
    });
  }

  // 3. Fallback to default event workshops if active sessions currently have no workshop entries
  //    (e.g., admin deleted demo schedules or has only imported Symposium sessions so far).
  if (seen.size === 0) {
    SESSIONS_DATA.forEach((session) => {
      if (getSessionTrackType(session) !== 'workshop') return;
      addLabel(getWorkshopTypeLabel(session));
    });
  }

  return Array.from(seen.values());
}

export function buildWorkshopPassLabel(workshopTypeLabel: string): string {
  const clean = workshopTypeLabel.trim();
  if (/\bpass$/i.test(clean)) return clampTicketLabel(clean);
  return clampTicketLabel(`${clean} Pass`);
}

export function buildSymposiumWorkshopBundleLabel(workshopTypeLabel: string): string {
  const clean = workshopTypeLabel.trim();
  return clampTicketLabel(`Bundling Simposium + ${clean}`);
}

export function buildTicketPassOptionGroups(
  sessions?: Session[],
  eventInfo?: SymposiumInfo
): TicketPassOptionGroups {
  const workshopTypes = extractWorkshopTypes(sessions, eventInfo);
  const general = [...BASE_TICKET_OPTIONS];
  const workshopOnly = workshopTypes.map((ws) => buildWorkshopPassLabel(ws));
  const symposiumAndWorkshop = workshopTypes.map((ws) =>
    buildSymposiumWorkshopBundleLabel(ws)
  );

  const uniqueAll = Array.from(
    new Set<string>([...general, ...workshopOnly, ...symposiumAndWorkshop])
  );

  return {
    general,
    workshopOnly,
    symposiumAndWorkshop,
    all: uniqueAll,
  };
}

function getDistinctiveWorkshopTokens(workshopLabel: string): string[] {
  const normalized = normalizeText(workshopLabel);
  if (!normalized) return [];
  return Array.from(
    new Set(
      normalized
        .split(' ')
        .filter((tok) => tok.length >= 3 && !GENERIC_WORKSHOP_STOPWORDS.has(tok))
    )
  );
}

function getWorkshopCorePhrase(workshopLabel: string): string {
  return normalizeText(workshopLabel)
    .replace(/^workshop\s+/, '')
    .trim();
}

function scoreTicketAgainstWorkshop(normalizedTicket: string, workshopLabel: string): number {
  if (!normalizedTicket) return 0;
  const paddedTicket = ` ${normalizedTicket} `;
  const corePhrase = getWorkshopCorePhrase(workshopLabel);

  if (corePhrase.length >= 4 && paddedTicket.includes(` ${corePhrase} `)) {
    return 100 + corePhrase.length;
  }

  const tokens = getDistinctiveWorkshopTokens(workshopLabel);
  if (tokens.length === 0) return 0;

  let matchedCount = 0;
  for (const tok of tokens) {
    if (paddedTicket.includes(` ${tok} `)) {
      matchedCount += 1;
    }
  }

  if (matchedCount === 0) return 0;
  // Combine absolute count and coverage ratio so more specific matches always win
  return matchedCount * 10 + (matchedCount / tokens.length) * 5;
}

function getCustomFieldWorkshopText(
  customFields: Record<string, string> | undefined
): string {
  if (!customFields || typeof customFields !== 'object') return '';
  const values: string[] = [];
  Object.entries(customFields).forEach(([key, rawVal]) => {
    if (!/workshop|\bws\b|hands[\s-]*on|wetlab|paket|tiket|pass/i.test(key)) return;
    const val = String(rawVal ?? '').trim();
    if (!NEGATIVE_FIELD_VALUES.has(val.toLowerCase())) {
      values.push(val);
    }
  });
  return values.join(' ');
}

function checkCustomFieldsForTrack(
  customFields: Record<string, string> | undefined,
  pattern: RegExp
): boolean {
  if (!customFields || typeof customFields !== 'object') return false;
  return Object.entries(customFields).some(([key, rawVal]) => {
    if (!pattern.test(key)) return false;
    const normalizedVal = String(rawVal ?? '').trim().toLowerCase();
    return !NEGATIVE_FIELD_VALUES.has(normalizedVal);
  });
}

export function describeTicketAccessSummary(
  ticketType: string,
  sessions?: Session[],
  eventInfo?: SymposiumInfo
): string {
  const raw = (ticketType || '').trim();
  if (!raw) return 'Akses default: Materi Simposium';

  const workshopTypes = extractWorkshopTypes(sessions, eventInfo);
  const lower = raw.toLowerCase();
  const normalized = normalizeText(raw);

  const matchedWorkshops = workshopTypes.filter(
    (ws) => scoreTicketAgainstWorkshop(normalized, ws) > 0
  );

  const hasSymposium =
    /simposium|symposium|munas|kongres|congress|plenary|full\s*pass|member|peserta|regular|reguler/i.test(
      lower
    ) && !/^workshop\s*full\s*pass/i.test(lower);

  const isGlobalAllAccess =
    /all[\s-]*access|full[\s-]*access|vip|speaker|pembicara|panitia|moderator|instruktur|paket\s*lengkap|bundle|semua\s*workshop|all\s*workshop/i.test(
      lower
    );

  if (matchedWorkshops.length > 0) {
    const wsSummary = matchedWorkshops.join(', ');
    return hasSymposium
      ? `Akses Bundling: Materi Simposium + ${wsSummary} (termasuk kartu & e-sertifikat keduanya)`
      : `Akses Materi: Khusus ${wsSummary}`;
  }

  if (isGlobalAllAccess && !/workshop\s*full\s*pass|semua\s*workshop/i.test(lower)) {
    return 'Akses Penuh: Semua materi Simposium & seluruh Workshop';
  }

  const isAllWorkshopsOnly =
    /workshop\s*full\s*pass|semua\s*workshop|all\s*workshop/i.test(lower);

  if (isAllWorkshopsOnly) {
    return hasSymposium
      ? 'Akses Penuh: Materi Simposium & seluruh jenis Workshop'
      : 'Akses Materi: Seluruh jenis Workshop (tanpa Simposium)';
  }

  const hasGenericWorkshop =
    /workshop|\bws\b|hands[\s-]*on|wetlab|drylab|pelatihan|praktikum/i.test(lower);

  if (hasGenericWorkshop && hasSymposium) {
    return 'Akses Penuh: Materi Simposium & Workshop';
  }
  if (hasGenericWorkshop) {
    return 'Akses Materi: Semua sesi Workshop (tanpa Simposium)';
  }
  return 'Akses Materi: Sesi Simposium (belum termasuk Workshop)';
}

export function evaluateSessionMaterialAccess(params: {
  session: Session | null | undefined;
  allSessions?: Session[];
  currentUser?: Participant | null;
  isParticipantLoggedIn: boolean;
  isAdmin: boolean;
}): MaterialAccessResult {
  const { session, allSessions, currentUser, isParticipantLoggedIn, isAdmin } = params;
  const sessionTrack = getSessionTrackType(session);
  const isWorkshop = sessionTrack === 'workshop';
  const workshopTypeLabel = isWorkshop ? getWorkshopTypeLabel(session) : undefined;
  const workshopPassLabel = workshopTypeLabel
    ? buildWorkshopPassLabel(workshopTypeLabel)
    : 'Workshop Pass';

  const requiredAccessLabel = isWorkshop
    ? `${workshopPassLabel} / All-Access`
    : 'Peserta Terdaftar (Tiket Simposium / All-Access)';

  if (isAdmin) {
    return {
      allowed: true,
      reason: 'admin',
      sessionTrack,
      workshopTypeLabel,
      requiredAccessLabel,
      currentTicketLabel: 'Admin / Panitia',
      grantedBadgeLabel: 'Akses Admin',
      title: 'Akses Materi Terbuka',
      description: 'Anda masuk sebagai Admin / Panitia dengan akses penuh ke seluruh materi.',
    };
  }

  if (!isParticipantLoggedIn || !currentUser) {
    return {
      allowed: false,
      reason: 'login_required',
      sessionTrack,
      workshopTypeLabel,
      requiredAccessLabel,
      currentTicketLabel: null,
      title: 'Registrasi Diperlukan',
      description: isWorkshop
        ? `Materi presentasi untuk ${workshopTypeLabel} hanya dapat dibuka oleh peserta terdaftar dengan ${workshopPassLabel}, Workshop Full Pass, atau All-Access. Silakan login menggunakan Id_registrant Anda.`
        : 'Materi presentasi sesi ini hanya dapat dibuka oleh peserta yang telah mendaftar. Silakan login menggunakan Id_registrant Anda untuk melihat dan mengunduh materi.',
    };
  }

  const roleStr = (currentUser.role || '').trim();
  const ticketRaw = (currentUser.ticketType || '').trim();
  const currentTicketLabel = ticketRaw || 'Peserta Terdaftar';

  // Privileged event roles always have full access to materials
  if (
    /(panitia|admin|committee|speaker|pembicara|narasumber|moderator|instruktur|vip)/i.test(
      roleStr
    )
  ) {
    return {
      allowed: true,
      reason: 'privileged_role',
      sessionTrack,
      workshopTypeLabel,
      requiredAccessLabel,
      currentTicketLabel,
      grantedBadgeLabel: `Akses ${roleStr}`,
      title: 'Akses Materi Terbuka',
      description: `Akses penuh diberikan untuk peran ${roleStr}.`,
    };
  }

  const ticketLower = ticketRaw.toLowerCase();
  const customWorkshopText = getCustomFieldWorkshopText(currentUser.customFields);
  const combinedWorkshopSource = normalizeText(`${ticketRaw} ${customWorkshopText}`);

  const customHasWorkshop = checkCustomFieldsForTrack(
    currentUser.customFields,
    /workshop|\bws\b|hands[\s-]*on|wetlab|drylab/i
  );
  const customHasSymposium = checkCustomFieldsForTrack(
    currentUser.customFields,
    /simposium|symposium|munas|kongres|congress/i
  );

  const hasWorkshopKeyword =
    /workshop|\bws\b|hands[\s-]*on|wetlab|drylab|pelatihan|praktikum/i.test(ticketLower) ||
    customHasWorkshop;

  const isWorkshopFullPass =
    /workshop\s*full\s*pass|semua\s*workshop|all\s*workshop/i.test(ticketLower);

  const hasSymposiumKeyword =
    (!isWorkshopFullPass &&
      /simposium|symposium|munas|kongres|congress|plenary|full\s*pass|member|peserta|regular|reguler/i.test(
        ticketLower
      )) ||
    customHasSymposium;

  // Explicit global all-access passes cover both Symposium and ALL Workshop types
  const isExplicitGlobalAllAccess =
    /all[\s-]*access|full[\s-]*access|vip|speaker|pembicara|panitia|moderator|instruktur|paket\s*lengkap|bundle/i.test(
      ticketLower
    );

  // Known workshop types in the symposium schedule (for specific workshop pass matching)
  const knownWorkshopTypes = extractWorkshopTypes(allSessions);
  if (
    workshopTypeLabel &&
    !knownWorkshopTypes.some((w) => normalizeText(w) === normalizeText(workshopTypeLabel))
  ) {
    knownWorkshopTypes.push(workshopTypeLabel);
  }

  // Evaluate whether the ticket targets one or more SPECIFIC workshop types
  const workshopScores = knownWorkshopTypes.map((wsLabel) => ({
    wsLabel,
    score: scoreTicketAgainstWorkshop(combinedWorkshopSource, wsLabel),
  }));
  const bestWorkshopScore = workshopScores.reduce(
    (max, item) => (item.score > max ? item.score : max),
    0
  );
  const targetsSpecificWorkshop = bestWorkshopScore > 0;

  if (isExplicitGlobalAllAccess && !targetsSpecificWorkshop) {
    return {
      allowed: true,
      reason: 'all_access',
      sessionTrack,
      workshopTypeLabel,
      requiredAccessLabel,
      currentTicketLabel,
      grantedBadgeLabel: currentTicketLabel,
      title: 'Akses Materi Terbuka',
      description: `Tiket Anda (${currentTicketLabel}) mencakup seluruh materi Simposium & Workshop.`,
    };
  }

  if (isWorkshop) {
    if (isWorkshopFullPass || (isExplicitGlobalAllAccess && !targetsSpecificWorkshop)) {
      return {
        allowed: true,
        reason: 'all_access',
        sessionTrack,
        workshopTypeLabel,
        requiredAccessLabel,
        currentTicketLabel,
        grantedBadgeLabel: currentTicketLabel,
        title: 'Akses Materi Terbuka',
        description: `Tiket Anda (${currentTicketLabel}) memberikan akses ke seluruh materi Workshop.`,
      };
    }

    if (targetsSpecificWorkshop && workshopTypeLabel) {
      const targetScore = scoreTicketAgainstWorkshop(combinedWorkshopSource, workshopTypeLabel);
      // Allow if this session's workshop matches cleanly and isn't beaten by a much more specific workshop match
      const isStrongMatch =
        targetScore > 0 && (targetScore >= 100 || targetScore >= bestWorkshopScore);

      if (isStrongMatch) {
        return {
          allowed: true,
          reason: 'ticket_matched',
          sessionTrack,
          workshopTypeLabel,
          requiredAccessLabel,
          currentTicketLabel,
          grantedBadgeLabel: currentTicketLabel,
          title: 'Akses Materi Terbuka',
          description: `Tiket Anda (${currentTicketLabel}) memberikan akses ke materi ${workshopTypeLabel}.`,
        };
      }

      return {
        allowed: false,
        reason: 'ticket_restricted',
        sessionTrack,
        workshopTypeLabel,
        requiredAccessLabel: `${workshopPassLabel} / Simposium + ${workshopTypeLabel} / All-Access`,
        currentTicketLabel,
        title: `Akses Khusus ${workshopTypeLabel}`,
        description: `Materi sesi ini khusus untuk peserta yang terdaftar pada ${workshopTypeLabel} (atau paket All-Access / Workshop Full Pass). Tiket aktif Anda saat ini untuk paket lain.`,
      };
    }

    // Generic workshop pass without a specific workshop name (e.g. "Workshop Only" or "Simposium + Workshop")
    if (hasWorkshopKeyword) {
      return {
        allowed: true,
        reason: 'ticket_matched',
        sessionTrack,
        workshopTypeLabel,
        requiredAccessLabel,
        currentTicketLabel,
        grantedBadgeLabel: currentTicketLabel,
        title: 'Akses Materi Terbuka',
        description: `Tiket Anda (${currentTicketLabel}) memberikan akses ke materi Workshop ini.`,
      };
    }

    return {
      allowed: false,
      reason: 'ticket_restricted',
      sessionTrack,
      workshopTypeLabel,
      requiredAccessLabel: `${workshopPassLabel} / Simposium + ${workshopTypeLabel} / All-Access`,
      currentTicketLabel,
      title: `Akses Khusus ${workshopTypeLabel || 'Peserta Workshop'}`,
      description: `Materi sesi ${workshopTypeLabel || 'Workshop'} ini hanya tersedia untuk peserta dengan ${workshopPassLabel}, Workshop Full Pass, atau All-Access.`,
    };
  }

  // Symposium session track
  const isWorkshopOnlyTicket =
    (hasWorkshopKeyword || targetsSpecificWorkshop || isWorkshopFullPass) &&
    !hasSymposiumKeyword &&
    !isExplicitGlobalAllAccess;

  if (isWorkshopOnlyTicket) {
    return {
      allowed: false,
      reason: 'ticket_restricted',
      sessionTrack,
      requiredAccessLabel: 'Simposium Full Pass / Paket Simposium + Workshop / All-Access',
      currentTicketLabel,
      title: 'Akses Khusus Peserta Simposium',
      description:
        'Materi sesi Simposium ini hanya tersedia untuk peserta yang terdaftar pada paket Simposium atau All-Access.',
    };
  }

  return {
    allowed: true,
    reason: 'ticket_matched',
    sessionTrack,
    requiredAccessLabel,
    currentTicketLabel,
    grantedBadgeLabel: currentTicketLabel,
    title: 'Akses Materi Terbuka',
    description: `Tiket Anda (${currentTicketLabel}) memberikan akses ke materi sesi Simposium ini.`,
  };
}

/**
 * Evaluate whether a participant (or admin) can view & download PDF materials
 * belonging to a specific workshop track based on their registered ticket/package.
 */
export function evaluateWorkshopTrackMaterialAccess(params: {
  workshopLabel: string;
  allSessions?: Session[];
  eventInfo?: SymposiumInfo;
  currentUser?: Participant | null;
  isParticipantLoggedIn: boolean;
  isAdmin: boolean;
}): MaterialAccessResult {
  const {
    workshopLabel,
    allSessions,
    eventInfo,
    currentUser,
    isParticipantLoggedIn,
    isAdmin,
  } = params;

  const cleanLabel = (workshopLabel || '').trim() || 'Workshop';
  const normalizedWorkshopLabel = /^workshop\b/i.test(cleanLabel)
    ? cleanLabel
    : `Workshop ${cleanLabel}`;

  const syntheticSession: Session = {
    id: `ws-access-${normalizeText(normalizedWorkshopLabel).replace(/\s+/g, '-')}`,
    day: 'Workshop',
    date: eventInfo?.dates?.workshop || '',
    startTime: '08:00',
    endTime: '17:00',
    timeString: '08:00 - 17:00 WIB',
    title: normalizedWorkshopLabel,
    category: normalizedWorkshopLabel,
    type: 'Workshop Hands-On',
    room: 'Workshop Room',
    floor: 'Ground Floor',
    roomColor: 'bg-emerald-600',
    moderator: '',
    speakers: [],
    abstract: {
      background: '',
      clinicalUpdates: [],
      conclusion: '',
    },
  };

  // Merge known workshops from eventInfo so cross-workshop matching always sees every workshop
  const knownFromEvent = extractWorkshopTypes(allSessions, eventInfo);
  const augmentedSessions: Session[] = [...(allSessions || [])];
  knownFromEvent.forEach((wsName, idx) => {
    const alreadyExists = augmentedSessions.some(
      (s) =>
        getSessionTrackType(s) === 'workshop' &&
        normalizeText(getWorkshopTypeLabel(s)) === normalizeText(wsName)
    );
    if (!alreadyExists) {
      augmentedSessions.push({
        ...syntheticSession,
        id: `ws-known-${idx}`,
        title: wsName,
        category: wsName,
      });
    }
  });

  return evaluateSessionMaterialAccess({
    session: syntheticSession,
    allSessions: augmentedSessions,
    currentUser,
    isParticipantLoggedIn,
    isAdmin,
  });
}
