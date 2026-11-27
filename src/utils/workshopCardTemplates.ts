import {
  IdentityCardLayoutConfig,
  Participant,
  Session,
  SymposiumInfo,
  WorkshopIdentityCardTemplate,
} from '../types';
import { SESSIONS_DATA } from '../data/symposiumData';
import { normalizeIdentityCardLayout } from './identityCardLayout';
import { getWorkshopTypeLabel } from './materialAccess';

export interface WorkshopCardSlot {
  workshopKey: string;
  workshopLabel: string;
  shortLabel: string;
  sessionCount: number;
  roomLabel?: string;
}

export interface ResolvedIdentityCardOption {
  key: string; // 'default' or workshopKey
  label: string;
  shortLabel: string;
  isWorkshop: boolean;
  templateUrl: string;
  layout: IdentityCardLayoutConfig;
  fileSlugSuffix: string;
}

export interface ParticipantCardResolution {
  defaultOptionKey: string;
  options: ResolvedIdentityCardOption[];
}

const WORKSHOP_STOPWORDS = new Set([
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
  'untuk',
  'khusus',
]);

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

function normalizeWords(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function toWorkshopTemplateKey(workshopLabel: string): string {
  const slug = workshopLabel
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 100);
  return slug || 'workshop_custom';
}

function makeShortWorkshopLabel(workshopLabel: string): string {
  const trimmed = workshopLabel.trim();
  const dashSplit = trimmed.split(/\s+[-–—]\s+/);
  if (dashSplit.length > 1 && dashSplit[0].length >= 8) {
    return dashSplit[0].trim();
  }
  return trimmed.length <= 28 ? trimmed : `${trimmed.slice(0, 26).trim()}…`;
}

/**
 * Extracts the dedicated workshop template slots (the 2 primary pre-congress workshop types
 * such as "Workshop Versus - MASS Hunt" & "Workshop Vet Nurse - Nurse Excellence", plus any
 * additional workshop categories created on Workshop day or already saved as custom templates).
 */
export function getWorkshopCardSlots(
  sessions?: Session[],
  existingTemplates?: Record<string, WorkshopIdentityCardTemplate>
): WorkshopCardSlot[] {
  const source = sessions && sessions.length > 0 ? sessions : SESSIONS_DATA;
  const map = new Map<string, WorkshopCardSlot>();

  // 1. Primary workshop tracks (day or category explicitly marked Workshop)
  source.forEach((s) => {
    const dayLower = (s.day || '').toLowerCase();
    const catLower = (s.category || '').toLowerCase();
    const isPrimaryWorkshop = dayLower.includes('workshop') || catLower.includes('workshop');
    if (!isPrimaryWorkshop) return;

    const label = getWorkshopTypeLabel(s);
    const key = toWorkshopTemplateKey(label);
    const existing = map.get(key);
    if (existing) {
      existing.sessionCount += 1;
    } else {
      map.set(key, {
        workshopKey: key,
        workshopLabel: label,
        shortLabel: makeShortWorkshopLabel(label),
        sessionCount: 1,
        roomLabel: s.room || undefined,
      });
    }
  });

  // Fallback if an admin removed all primary workshop day names: include any Workshop Hands-On
  if (map.size === 0) {
    source.forEach((s) => {
      if (s.type !== 'Workshop Hands-On') return;
      const label = getWorkshopTypeLabel(s);
      const key = toWorkshopTemplateKey(label);
      const existing = map.get(key);
      if (existing) {
        existing.sessionCount += 1;
      } else {
        map.set(key, {
          workshopKey: key,
          workshopLabel: label,
          shortLabel: makeShortWorkshopLabel(label),
          sessionCount: 1,
          roomLabel: s.room || undefined,
        });
      }
    });
  }

  // Ensure any previously saved custom workshop templates stay visible so admin can edit/delete them
  if (existingTemplates && typeof existingTemplates === 'object') {
    Object.values(existingTemplates).forEach((tpl) => {
      if (!tpl || !tpl.workshopKey) return;
      if (!map.has(tpl.workshopKey)) {
        const label = tpl.workshopLabel || tpl.workshopKey;
        map.set(tpl.workshopKey, {
          workshopKey: tpl.workshopKey,
          workshopLabel: label,
          shortLabel: makeShortWorkshopLabel(label),
          sessionCount: 0,
        });
      }
    });
  }

  return Array.from(map.values());
}

function scoreParticipantTextForWorkshop(normalizedText: string, workshopLabel: string): number {
  if (!normalizedText) return 0;
  const padded = ` ${normalizedText} `;
  const core = normalizeWords(workshopLabel).replace(/^workshop\s+/, '').trim();

  if (core.length >= 4 && padded.includes(` ${core} `)) {
    return 100 + core.length;
  }

  const tokens = Array.from(
    new Set(
      normalizeWords(workshopLabel)
        .split(' ')
        .filter((tok) => tok.length >= 3 && !WORKSHOP_STOPWORDS.has(tok))
    )
  );
  if (tokens.length === 0) return 0;

  let matches = 0;
  for (const tok of tokens) {
    if (padded.includes(` ${tok} `)) {
      matches += 1;
    }
  }
  if (matches === 0) return 0;
  return matches * 10 + (matches / tokens.length) * 5;
}

function buildParticipantTicketContext(participant: Participant): {
  combinedNormalized: string;
  ticketLower: string;
  isAllAccessOrPrivileged: boolean;
  isWorkshopFullPass: boolean;
  hasSymposiumTicket: boolean;
  hasGenericWorkshopKeyword: boolean;
} {
  const ticketRaw = (participant.ticketType || '').trim();
  const ticketLower = ticketRaw.toLowerCase();
  const roleLower = (participant.role || '').trim().toLowerCase();

  const customParts: string[] = [];
  if (participant.customFields && typeof participant.customFields === 'object') {
    Object.entries(participant.customFields).forEach(([key, val]) => {
      if (!/workshop|\bws\b|paket|tiket|pass|track/i.test(key)) return;
      const cleaned = String(val ?? '').trim();
      if (!NEGATIVE_FIELD_VALUES.has(cleaned.toLowerCase())) {
        customParts.push(cleaned);
      }
    });
  }

  const combinedNormalized = normalizeWords(`${ticketRaw} ${customParts.join(' ')}`);

  const isPrivilegedRole =
    /(panitia|admin|committee|speaker|pembicara|narasumber|moderator|instruktur|vip)/i.test(
      roleLower
    );
  const isWorkshopFullPass =
    /workshop\s*full\s*pass|semua\s*workshop|all\s*workshop/i.test(ticketLower);
  const isAllAccessOrPrivileged =
    isPrivilegedRole ||
    /all[\s-]*access|full[\s-]*access|vip|speaker|pembicara|panitia|paket\s*lengkap|bundle/i.test(
      ticketLower
    );
  const hasSymposiumTicket =
    (!isWorkshopFullPass &&
      /simposium|symposium|munas|kongres|congress|plenary|full\s*pass|member|peserta|regular|reguler/i.test(
        ticketLower
      )) ||
    isAllAccessOrPrivileged ||
    !ticketRaw;
  const hasGenericWorkshopKeyword =
    /workshop|\bws\b|hands[\s-]*on|wetlab|drylab/i.test(ticketLower) || customParts.length > 0;

  return {
    combinedNormalized,
    ticketLower,
    isAllAccessOrPrivileged,
    isWorkshopFullPass,
    hasSymposiumTicket,
    hasGenericWorkshopKeyword,
  };
}

/**
 * Resolves which ID Card template(s) and field layout(s) should be used for a given participant
 * based on their ticketType/registration and the uploaded workshop ID card templates.
 */
export function resolveParticipantCardTemplates(
  participant: Participant,
  eventInfo: SymposiumInfo
): ParticipantCardResolution {
  const defaultLayout = normalizeIdentityCardLayout(eventInfo.identityCardLayout);
  const defaultOption: ResolvedIdentityCardOption = {
    key: 'default',
    label: 'Kartu Utama (Simposium)',
    shortLabel: 'Simposium',
    isWorkshop: false,
    templateUrl: eventInfo.customIdentityCardUrl || '',
    layout: defaultLayout,
    fileSlugSuffix: '',
  };

  const uploadedWorkshopTemplates = Object.values(
    eventInfo.workshopIdentityCardTemplates || {}
  ).filter((tpl) => Boolean(tpl && tpl.workshopKey && tpl.templateUrl));

  if (uploadedWorkshopTemplates.length === 0) {
    return {
      defaultOptionKey: 'default',
      options: [defaultOption],
    };
  }

  const ctx = buildParticipantTicketContext(participant);

  // Score each uploaded workshop template against the participant's ticket/customFields
  const scored = uploadedWorkshopTemplates.map((tpl) => ({
    tpl,
    score: scoreParticipantTextForWorkshop(ctx.combinedNormalized, tpl.workshopLabel),
  }));
  const maxScore = scored.reduce((m, item) => (item.score > m ? item.score : m), 0);

  const matchedTemplates =
    maxScore > 0
      ? scored
          .filter((item) => item.score > 0 && (item.score >= 100 || item.score >= maxScore))
          .map((item) => item.tpl)
      : [];

  const toOption = (tpl: WorkshopIdentityCardTemplate): ResolvedIdentityCardOption => ({
    key: tpl.workshopKey,
    label: tpl.workshopLabel,
    shortLabel: makeShortWorkshopLabel(tpl.workshopLabel),
    isWorkshop: true,
    templateUrl: tpl.templateUrl,
    layout: tpl.layout ? normalizeIdentityCardLayout(tpl.layout) : defaultLayout,
    fileSlugSuffix: `-${tpl.workshopKey.replace(/_/g, '-')}`,
  });

  // Case 1: Participant ticket specifically matches one or more uploaded workshop templates
  if (matchedTemplates.length > 0) {
    const wsOptions = matchedTemplates.map(toOption);
    // If participant also has Symposium access (e.g. "Simposium + Workshop Versus..."), offer both
    const options = ctx.hasSymposiumTicket ? [...wsOptions, defaultOption] : wsOptions;
    return {
      defaultOptionKey: wsOptions[0].key,
      options,
    };
  }

  // Case 2: All-Access / VIP / Workshop Full Pass / Generic Workshop Only (no specific workshop name)
  if (ctx.isAllAccessOrPrivileged || ctx.isWorkshopFullPass || ctx.hasGenericWorkshopKeyword) {
    const wsOptions = uploadedWorkshopTemplates.map(toOption);
    if (ctx.isWorkshopFullPass || (ctx.hasGenericWorkshopKeyword && !ctx.hasSymposiumTicket)) {
      return {
        defaultOptionKey: wsOptions[0].key,
        options: wsOptions,
      };
    }
    return {
      defaultOptionKey: 'default',
      options: [defaultOption, ...wsOptions],
    };
  }

  // Case 3: Symposium-only participant
  return {
    defaultOptionKey: 'default',
    options: [defaultOption],
  };
}
