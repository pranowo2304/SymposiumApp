import {
  CertificateFieldConfig,
  CertificateLayoutConfig,
  CertificateReleaseStatus,
  CertificateTemplate,
  Participant,
  Session,
  SymposiumInfo,
} from '../types';
import { getWorkshopCardSlots } from './workshopCardTemplates';
import { extractParticipantIdRegistrant } from '../data/participantData';

export const CERTIFICATE_CANVAS_W = 1600;
export const CERTIFICATE_CANVAS_H = 1131; // Exact A4 Landscape aspect ratio (297 x 210 mm)
export const MAX_CERTIFICATE_TEMPLATE_CHARS = 420000;

export const DEFAULT_CERTIFICATE_LAYOUT: CertificateLayoutConfig = {
  name: {
    visible: true,
    x: 50,
    y: 47,
    fontSize: 64,
    color: '#0f172a',
    align: 'center',
    fontFamily: 'serif',
    fontWeight: 'bold',
  },
  role: {
    visible: true,
    x: 50,
    y: 56,
    fontSize: 28,
    color: '#0f766e',
    align: 'center',
    fontFamily: 'sans',
    fontWeight: 'bold',
  },
  institution: {
    visible: false,
    x: 50,
    y: 62,
    fontSize: 24,
    color: '#334155',
    align: 'center',
    fontFamily: 'sans',
    fontWeight: 'normal',
  },
  certificateNumber: {
    visible: true,
    x: 50,
    y: 28,
    fontSize: 20,
    color: '#475569',
    align: 'center',
    fontFamily: 'sans',
    fontWeight: 'normal',
  },
  dateLine: {
    visible: false,
    x: 50,
    y: 72,
    fontSize: 22,
    color: '#334155',
    align: 'center',
    fontFamily: 'sans',
    fontWeight: 'normal',
  },
  accreditation: {
    visible: false,
    x: 50,
    y: 77,
    fontSize: 20,
    color: '#b45309',
    align: 'center',
    fontFamily: 'sans',
    fontWeight: 'bold',
  },
};

export const CERTIFICATE_LAYOUT_PRESETS: Array<{
  id: string;
  label: string;
  description: string;
  layout: CertificateLayoutConfig;
}> = [
  {
    id: 'classic-center',
    label: 'Tengah Klasik',
    description: 'Nama besar di tengah dengan nomor sertifikat di atas & peran di bawah',
    layout: DEFAULT_CERTIFICATE_LAYOUT,
  },
  {
    id: 'name-only-clean',
    label: 'Nama Saja (Minimalis)',
    description: 'Hanya menampilkan Nama Lengkap di tengah (cocok jika desain sudah penuh teks)',
    layout: {
      ...DEFAULT_CERTIFICATE_LAYOUT,
      name: { ...DEFAULT_CERTIFICATE_LAYOUT.name, x: 50, y: 49, fontSize: 68 },
      role: { ...DEFAULT_CERTIFICATE_LAYOUT.role, visible: false },
      institution: { ...DEFAULT_CERTIFICATE_LAYOUT.institution, visible: false },
      certificateNumber: { ...DEFAULT_CERTIFICATE_LAYOUT.certificateNumber, visible: false },
      dateLine: { ...DEFAULT_CERTIFICATE_LAYOUT.dateLine, visible: false },
      accreditation: { ...DEFAULT_CERTIFICATE_LAYOUT.accreditation, visible: false },
    },
  },
  {
    id: 'modern-left',
    label: 'Modern Rata Kiri',
    description: 'Semua field sejajar rapi di sisi kiri untuk desain modern asimetris',
    layout: {
      name: {
        visible: true,
        x: 12,
        y: 46,
        fontSize: 60,
        color: '#0f172a',
        align: 'left',
        fontFamily: 'sans',
        fontWeight: 'bold',
      },
      role: {
        visible: true,
        x: 12,
        y: 55,
        fontSize: 26,
        color: '#0f766e',
        align: 'left',
        fontFamily: 'sans',
        fontWeight: 'bold',
      },
      institution: {
        visible: true,
        x: 12,
        y: 61,
        fontSize: 22,
        color: '#475569',
        align: 'left',
        fontFamily: 'sans',
        fontWeight: 'normal',
      },
      certificateNumber: {
        visible: true,
        x: 12,
        y: 30,
        fontSize: 20,
        color: '#64748b',
        align: 'left',
        fontFamily: 'sans',
        fontWeight: 'normal',
      },
      dateLine: {
        visible: false,
        x: 12,
        y: 72,
        fontSize: 20,
        color: '#475569',
        align: 'left',
        fontFamily: 'sans',
        fontWeight: 'normal',
      },
      accreditation: {
        visible: false,
        x: 12,
        y: 78,
        fontSize: 20,
        color: '#b45309',
        align: 'left',
        fontFamily: 'sans',
        fontWeight: 'bold',
      },
    },
  },
];

function clampNum(val: unknown, min: number, max: number, fallback: number): number {
  const n = Number(val);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function normalizeField(
  raw: Partial<CertificateFieldConfig> | undefined,
  defaults: CertificateFieldConfig
): CertificateFieldConfig {
  const align = raw?.align === 'left' || raw?.align === 'right' || raw?.align === 'center'
    ? raw.align
    : defaults.align;
  const fontFamily = raw?.fontFamily === 'serif' || raw?.fontFamily === 'sans'
    ? raw.fontFamily
    : defaults.fontFamily;
  const fontWeight = raw?.fontWeight === 'normal' || raw?.fontWeight === 'bold'
    ? raw.fontWeight
    : defaults.fontWeight;
  const color = typeof raw?.color === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(raw.color.trim())
    ? raw.color.trim()
    : defaults.color;

  return {
    visible: typeof raw?.visible === 'boolean' ? raw.visible : defaults.visible,
    x: clampNum(raw?.x, 2, 98, defaults.x),
    y: clampNum(raw?.y, 3, 97, defaults.y),
    fontSize: clampNum(raw?.fontSize, 12, 120, defaults.fontSize),
    color,
    align,
    fontFamily,
    fontWeight,
  };
}

export function normalizeCertificateLayout(
  raw?: Partial<CertificateLayoutConfig> | null
): CertificateLayoutConfig {
  return {
    name: normalizeField(raw?.name, DEFAULT_CERTIFICATE_LAYOUT.name),
    role: normalizeField(raw?.role, DEFAULT_CERTIFICATE_LAYOUT.role),
    institution: normalizeField(raw?.institution, DEFAULT_CERTIFICATE_LAYOUT.institution),
    certificateNumber: normalizeField(
      raw?.certificateNumber,
      DEFAULT_CERTIFICATE_LAYOUT.certificateNumber
    ),
    dateLine: normalizeField(raw?.dateLine, DEFAULT_CERTIFICATE_LAYOUT.dateLine),
    accreditation: normalizeField(raw?.accreditation, DEFAULT_CERTIFICATE_LAYOUT.accreditation),
  };
}

export interface CertificateTemplateSlot {
  templateKey: string;
  templateLabel: string;
  shortLabel: string;
  badgeLabel: string;
  category: 'symposium' | 'workshop';
  subtitle: string;
  defaultPrefix: string;
}

/**
 * Builds the ordered slots for Certificate Templates:
 * 1) Symposium (always first)
 * 2) Workshop 1 & Workshop 2 (and any additional workshop tracks detected in sessions)
 * 3) Any previously saved custom certificate templates so none are ever orphaned.
 */
export function getCertificateTemplateSlots(
  sessions?: Session[],
  eventInfo?: SymposiumInfo
): CertificateTemplateSlot[] {
  const existingMap = eventInfo?.certificateTemplates || {};
  const slots: CertificateTemplateSlot[] = [
    {
      templateKey: 'symposium',
      templateLabel: 'Sertifikat Symposium',
      shortLabel: 'Symposium',
      badgeLabel: 'SYMPOSIUM',
      category: 'symposium',
      subtitle:
        eventInfo?.dates?.munasSymposium ||
        eventInfo?.dateString ||
        'Sertifikat utama peserta Simposium & Munas',
      defaultPrefix: 'CERT-SYMP-2026-',
    },
  ];

  const workshopSlots = getWorkshopCardSlots(sessions, eventInfo?.workshopIdentityCardTemplates);
  workshopSlots.forEach((ws, idx) => {
    slots.push({
      templateKey: ws.workshopKey,
      templateLabel: ws.workshopLabel,
      shortLabel: ws.shortLabel,
      badgeLabel: `WORKSHOP ${idx + 1}`,
      category: 'workshop',
      subtitle: `${ws.roomLabel ? `${ws.roomLabel} · ` : ''}${
        eventInfo?.dates?.workshop || 'Pre-Congress Workshop'
      }`,
      defaultPrefix: `CERT-WS${idx + 1}-2026-`,
    });
  });

  // Preserve any custom saved templates not already listed
  Object.values(existingMap).forEach((tpl) => {
    if (!tpl?.templateKey) return;
    if (!slots.some((s) => s.templateKey === tpl.templateKey)) {
      slots.push({
        templateKey: tpl.templateKey,
        templateLabel: tpl.templateLabel || tpl.templateKey,
        shortLabel: tpl.templateLabel || tpl.templateKey,
        badgeLabel: tpl.category === 'symposium' ? 'SYMPOSIUM' : 'WORKSHOP',
        category: tpl.category === 'symposium' ? 'symposium' : 'workshop',
        subtitle: 'Template sertifikat kustom',
        defaultPrefix: 'CERT-2026-',
      });
    }
  });

  return slots;
}

/**
 * Compresses an uploaded PNG/JPG/WebP or 1-page PDF certificate design into a sharp
 * landscape A4-proportioned data URL under MAX_CERTIFICATE_TEMPLATE_CHARS (~420 KB)
 * so it stores reliably in Firestore & localStorage without hitting document limits.
 */
export async function compressCertificateTemplateFile(file: File): Promise<string> {
  const lowerName = file.name.toLowerCase();
  const isPdf = file.type === 'application/pdf' || lowerName.endsWith('.pdf');

  let sourceCanvas: HTMLCanvasElement;

  if (isPdf) {
    const [pdfjsLib, workerMod] = await Promise.all([
      import('pdfjs-dist'),
      import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
    ]);
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerMod.default;
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDoc = await loadingTask.promise;
    const page = await pdfDoc.getPage(1);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = Math.min(
      CERTIFICATE_CANVAS_W / baseViewport.width,
      CERTIFICATE_CANVAS_H / baseViewport.height
    );
    const viewport = page.getViewport({ scale: Math.max(0.5, scale) });

    sourceCanvas = document.createElement('canvas');
    sourceCanvas.width = Math.max(1, Math.round(viewport.width));
    sourceCanvas.height = Math.max(1, Math.round(viewport.height));
    const ctx = sourceCanvas.getContext('2d');
    if (!ctx) throw new Error('Canvas tidak tersedia di browser.');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, sourceCanvas.width, sourceCanvas.height);

    await page.render({
      canvas: sourceCanvas,
      canvasContext: ctx,
      viewport,
    } as any).promise;
  } else {
    const rawDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string) || '');
      reader.onerror = () => reject(new Error('Gagal membaca file gambar sertifikat.'));
      reader.readAsDataURL(file);
    });

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Format gambar tidak dapat dimuat.'));
      image.src = rawDataUrl;
    });

    const scale = Math.min(
      1,
      CERTIFICATE_CANVAS_W / (img.naturalWidth || CERTIFICATE_CANVAS_W),
      CERTIFICATE_CANVAS_H / (img.naturalHeight || CERTIFICATE_CANVAS_H)
    );
    const targetW = Math.max(1, Math.round((img.naturalWidth || CERTIFICATE_CANVAS_W) * scale));
    const targetH = Math.max(1, Math.round((img.naturalHeight || CERTIFICATE_CANVAS_H) * scale));

    if (rawDataUrl.length <= MAX_CERTIFICATE_TEMPLATE_CHARS && scale === 1) {
      return rawDataUrl;
    }

    sourceCanvas = document.createElement('canvas');
    sourceCanvas.width = targetW;
    sourceCanvas.height = targetH;
    const ctx = sourceCanvas.getContext('2d');
    if (!ctx) return rawDataUrl;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetW, targetH);
    ctx.drawImage(img, 0, 0, targetW, targetH);
  }

  // Try crisp WebP then JPEG at descending quality levels until safely under limit
  const mimeCandidates = ['image/webp', 'image/jpeg'];
  const qualities = [0.9, 0.82, 0.74, 0.65, 0.55, 0.45];

  for (const mime of mimeCandidates) {
    for (const q of qualities) {
      const attempt = sourceCanvas.toDataURL(mime, q);
      if (attempt.startsWith(`data:${mime}`) && attempt.length <= MAX_CERTIFICATE_TEMPLATE_CHARS) {
        return attempt;
      }
    }
  }

  // Final downscale fallback if image has extreme visual detail
  const fallbackCanvas = document.createElement('canvas');
  fallbackCanvas.width = Math.max(1, Math.round(sourceCanvas.width * 0.75));
  fallbackCanvas.height = Math.max(1, Math.round(sourceCanvas.height * 0.75));
  const fctx = fallbackCanvas.getContext('2d');
  if (fctx) {
    fctx.fillStyle = '#ffffff';
    fctx.fillRect(0, 0, fallbackCanvas.width, fallbackCanvas.height);
    fctx.drawImage(sourceCanvas, 0, 0, fallbackCanvas.width, fallbackCanvas.height);
    return fallbackCanvas.toDataURL('image/jpeg', 0.72);
  }

  return sourceCanvas.toDataURL('image/jpeg', 0.6);
}

const STOPWORDS = new Set([
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

function normalizeWords(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreTicketForWorkshop(normalizedText: string, workshopLabel: string): number {
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
        .filter((tok) => tok.length >= 3 && !STOPWORDS.has(tok))
    )
  );
  if (tokens.length === 0) return 0;
  let matches = 0;
  for (const tok of tokens) {
    if (padded.includes(` ${tok} `)) matches += 1;
  }
  return matches > 0 ? matches * 10 + (matches / tokens.length) * 5 : 0;
}

export function getCertificateReleaseStatus(eventInfo?: SymposiumInfo): CertificateReleaseStatus {
  return {
    symposium: eventInfo?.certificateReleaseStatus?.symposium !== false,
    workshop: eventInfo?.certificateReleaseStatus?.workshop !== false,
  };
}

export function isCertificateCategoryReleased(
  category: 'symposium' | 'workshop',
  eventInfo?: SymposiumInfo
): boolean {
  const status = getCertificateReleaseStatus(eventInfo);
  return category === 'symposium' ? status.symposium : status.workshop;
}

export interface ResolvedParticipantCertificate {
  template: CertificateTemplate;
  layout: CertificateLayoutConfig;
  certificateNumber: string;
  dateText: string;
}

/**
 * Resolves which uploaded certificates are available for a participant based on their ticket/role.
 * By default filters out categories not yet released by Admin unless includeUnreleased is true.
 */
export function resolveParticipantCertificates(
  participant: Participant,
  eventInfo: SymposiumInfo,
  options?: { includeUnreleased?: boolean }
): ResolvedParticipantCertificate[] {
  const uploadedList = Object.values(eventInfo.certificateTemplates || {}).filter(
    (tpl) => Boolean(tpl && tpl.templateKey && tpl.templateUrl)
  );
  if (uploadedList.length === 0) return [];

  const ticketRaw = (participant.ticketType || '').trim();
  const ticketLower = ticketRaw.toLowerCase();
  const roleLower = (participant.role || '').trim().toLowerCase();

  const customParts: string[] = [];
  if (participant.customFields && typeof participant.customFields === 'object') {
    Object.entries(participant.customFields).forEach(([key, val]) => {
      if (!/workshop|\bws\b|paket|tiket|pass|track/i.test(key)) return;
      const cleaned = String(val ?? '').trim();
      if (cleaned && !['-', '0', 'no', 'none', 'tidak', 'false', 'n/a'].includes(cleaned.toLowerCase())) {
        customParts.push(cleaned);
      }
    });
  }

  const combinedNormalized = normalizeWords(`${ticketRaw} ${customParts.join(' ')}`);
  const isPrivileged = /(panitia|admin|committee|speaker|pembicara|narasumber|moderator|instruktur|vip)/i.test(roleLower);
  const isWorkshopFullPass = /workshop\s*full\s*pass|semua\s*workshop|all\s*workshop/i.test(ticketLower);
  const hasGenericWorkshop =
    /workshop|\bws\b|hands[\s-]*on|wetlab|drylab/i.test(ticketLower) || customParts.length > 0;
  const hasExplicitSymposium = /simposium|symposium|munas|kongres|congress|plenary/i.test(ticketLower);
  const isAllAccess =
    isPrivileged ||
    /all[\s-]*access|full[\s-]*access|vip|speaker|pembicara|panitia|paket\s*lengkap/i.test(ticketLower);
  const hasSymposium =
    hasExplicitSymposium ||
    isAllAccess ||
    (!hasGenericWorkshop &&
      !isWorkshopFullPass &&
      (/full\s*pass|member|peserta|regular|reguler/i.test(ticketLower) || !ticketRaw));

  const idCode = (extractParticipantIdRegistrant(participant) || participant.badgeId || participant.id || '001').trim();

  const sympTemplates = uploadedList.filter((t) => t.category === 'symposium' || t.templateKey === 'symposium');
  const wsTemplates = uploadedList.filter((t) => t.category !== 'symposium' && t.templateKey !== 'symposium');

  const eligible: CertificateTemplate[] = [];

  if (hasSymposium) {
    eligible.push(...sympTemplates);
  }

  if (wsTemplates.length > 0) {
    const scored = wsTemplates.map((tpl) => ({
      tpl,
      score: scoreTicketForWorkshop(combinedNormalized, tpl.templateLabel),
    }));
    const maxScore = scored.reduce((m, item) => (item.score > m ? item.score : m), 0);
    if (maxScore > 0) {
      scored
        .filter((item) => item.score > 0 && (item.score >= 100 || item.score >= maxScore))
        .forEach((item) => eligible.push(item.tpl));
    } else if (isAllAccess || isWorkshopFullPass || hasGenericWorkshop) {
      eligible.push(...wsTemplates);
    }
  }

  // Fallback only for non-workshop custom ticket labels when symposium template exists
  if (eligible.length === 0 && !hasGenericWorkshop && !isWorkshopFullPass && sympTemplates.length > 0) {
    eligible.push(sympTemplates[0]);
  }

  const finalTemplates = options?.includeUnreleased
    ? eligible
    : eligible.filter((tpl) => {
        const category: 'symposium' | 'workshop' =
          tpl.category === 'symposium' || tpl.templateKey === 'symposium'
            ? 'symposium'
            : 'workshop';
        return isCertificateCategoryReleased(category, eventInfo);
      });

  return finalTemplates.map((tpl) => {
    const prefix = (tpl.certificateNumberPrefix || (tpl.category === 'symposium' ? 'CERT-SYMP-2026-' : 'CERT-WS-2026-')).trim();
    const certNumber = prefix ? `${prefix}${idCode}` : idCode;
    const dateText =
      tpl.category === 'workshop'
        ? eventInfo.dates?.workshop || eventInfo.dateString || ''
        : eventInfo.dates?.munasSymposium || eventInfo.dateString || '';
    return {
      template: tpl,
      layout: normalizeCertificateLayout(tpl.layout),
      certificateNumber: certNumber,
      dateText,
    };
  });
}

const CERT_CUSTOM_NAME_STORAGE_PREFIX = 'simposium_cert_custom_name_v1_';

function getParticipantStorageKey(participant: Participant): string {
  const code = (
    extractParticipantIdRegistrant(participant) ||
    participant.badgeId ||
    participant.id ||
    participant.email ||
    'default'
  )
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_');
  return `${CERT_CUSTOM_NAME_STORAGE_PREFIX}${code}`;
}

export function getDefaultCertificateDisplayName(participant: Participant): string {
  const name = (participant.name || '').trim();
  const title = (participant.title || '').trim();
  if (title && !name.toLowerCase().includes(title.toLowerCase())) {
    return `${title} ${name}`.trim();
  }
  return name || 'Nama Peserta';
}

export function getSavedCertificateCustomName(participant: Participant): string {
  try {
    const saved = localStorage.getItem(getParticipantStorageKey(participant));
    return saved ? saved.trim() : '';
  } catch {
    return '';
  }
}

export function saveCertificateCustomName(participant: Participant, customName: string): void {
  try {
    const key = getParticipantStorageKey(participant);
    const cleaned = customName.trim().slice(0, 120);
    const defaultName = getDefaultCertificateDisplayName(participant);
    if (!cleaned || cleaned === defaultName) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, cleaned);
    }
  } catch {}
}

export function withCertificateDisplayName(
  participant: Participant,
  customName?: string
): Participant {
  const cleaned = (customName || '').trim().slice(0, 120);
  if (!cleaned) return participant;
  return {
    ...participant,
    name: cleaned,
    title: '',
  };
}

export function buildCertificateFieldTexts(
  participant: Participant,
  template: CertificateTemplate,
  eventInfo: SymposiumInfo
): Record<keyof CertificateLayoutConfig, string> {
  const fullName = getDefaultCertificateDisplayName(participant);
  const idCode = (extractParticipantIdRegistrant(participant) || participant.badgeId || participant.id || '001').trim();
  const prefix = (template.certificateNumberPrefix || '').trim();
  const certNo = prefix ? `${prefix}${idCode}` : idCode;
  const dateText =
    template.category === 'workshop'
      ? eventInfo.dates?.workshop || eventInfo.dateString || ''
      : eventInfo.dates?.munasSymposium || eventInfo.dateString || '';

  return {
    name: fullName || 'Nama Peserta',
    role: (participant.role || 'Peserta').toUpperCase(),
    institution: participant.institution || '',
    certificateNumber: `No. ${certNo}`,
    dateLine: dateText,
    accreditation: eventInfo.accreditation || '',
  };
}

/**
 * Renders a personalized certificate onto a 1600x1131 A4-landscape Canvas matching
 * the interactive layout editor 1:1.
 */
export async function renderCertificateToCanvas(
  participant: Participant,
  template: CertificateTemplate,
  eventInfo: SymposiumInfo,
  scale = 1
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(CERTIFICATE_CANVAS_W * scale);
  canvas.height = Math.round(CERTIFICATE_CANVAS_H * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas tidak tersedia di browser.');

  ctx.scale(scale, scale);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, CERTIFICATE_CANVAS_W, CERTIFICATE_CANVAS_H);

  // Draw uploaded background design
  if (template.templateUrl) {
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        if (!template.templateUrl.startsWith('data:')) {
          image.crossOrigin = 'anonymous';
        }
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Gagal memuat gambar template sertifikat.'));
        image.src = template.templateUrl;
      });

      const imgW = img.naturalWidth || CERTIFICATE_CANVAS_W;
      const imgH = img.naturalHeight || CERTIFICATE_CANVAS_H;
      const coverScale = Math.max(CERTIFICATE_CANVAS_W / imgW, CERTIFICATE_CANVAS_H / imgH);
      const drawW = imgW * coverScale;
      const drawH = imgH * coverScale;
      const drawX = (CERTIFICATE_CANVAS_W - drawW) / 2;
      const drawY = (CERTIFICATE_CANVAS_H - drawH) / 2;
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
    } catch (err) {
      console.warn('Certificate template image draw warning:', err);
    }
  } else {
    // Clean placeholder frame when rendering without uploaded image
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 8;
    ctx.strokeRect(36, 36, CERTIFICATE_CANVAS_W - 72, CERTIFICATE_CANVAS_H - 72);
    ctx.strokeStyle = '#0f766e';
    ctx.lineWidth = 2;
    ctx.strokeRect(52, 52, CERTIFICATE_CANVAS_W - 104, CERTIFICATE_CANVAS_H - 104);
  }

  const layout = normalizeCertificateLayout(template.layout);
  const texts = buildCertificateFieldTexts(participant, template, eventInfo);
  const fieldOrder: Array<keyof CertificateLayoutConfig> = [
    'certificateNumber',
    'name',
    'role',
    'institution',
    'dateLine',
    'accreditation',
  ];

  fieldOrder.forEach((fieldKey) => {
    const cfg = layout[fieldKey];
    const text = (texts[fieldKey] || '').trim();
    if (!cfg.visible || !text) return;

    const xPx = (cfg.x / 100) * CERTIFICATE_CANVAS_W;
    const yPx = (cfg.y / 100) * CERTIFICATE_CANVAS_H;
    const fontFamilyCss =
      cfg.fontFamily === 'serif'
        ? 'Georgia, "Times New Roman", serif'
        : 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
    const fontWeightCss = cfg.fontWeight === 'bold' ? '700' : '400';

    ctx.save();
    ctx.fillStyle = cfg.color;
    ctx.textAlign = cfg.align;
    ctx.textBaseline = 'middle';

    // Auto-shrink font slightly if a very long name exceeds 86% of canvas width
    let fontSize = cfg.fontSize;
    const maxAllowedWidth = CERTIFICATE_CANVAS_W * 0.86;
    ctx.font = `${fontWeightCss} ${fontSize}px ${fontFamilyCss}`;
    while (ctx.measureText(text).width > maxAllowedWidth && fontSize > 16) {
      fontSize -= 2;
      ctx.font = `${fontWeightCss} ${fontSize}px ${fontFamilyCss}`;
    }

    ctx.fillText(text, xPx, yPx);
    ctx.restore();
  });

  return canvas;
}

export async function downloadCertificateAsPng(
  participant: Participant,
  template: CertificateTemplate,
  eventInfo: SymposiumInfo
): Promise<void> {
  const canvas = await renderCertificateToCanvas(participant, template, eventInfo, 1.5);
  const dataUrl = canvas.toDataURL('image/png');
  const slugName = (participant.name || 'peserta')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const slugTpl = template.templateKey.replace(/_/g, '-');
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `sertifikat-${slugTpl}-${slugName || 'peserta'}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function downloadCertificateAsPdf(
  participant: Participant,
  template: CertificateTemplate,
  eventInfo: SymposiumInfo
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const canvas = await renderCertificateToCanvas(participant, template, eventInfo, 1.5);
  const imgData = canvas.toDataURL('image/jpeg', 0.94);
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });
  pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210);
  const slugName = (participant.name || 'peserta')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const slugTpl = template.templateKey.replace(/_/g, '-');
  pdf.save(`sertifikat-${slugTpl}-${slugName || 'peserta'}.pdf`);
}
