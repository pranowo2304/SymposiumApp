import { IdentityCardFieldConfig, IdentityCardLayoutConfig, IdentityCardQrConfig } from '../types';

export const DEFAULT_IDENTITY_CARD_LAYOUT: IdentityCardLayoutConfig = {
  showEventHeader: true,
  showContentBackdrop: true,
  idRegistrant: {
    visible: true,
    x: 92,
    y: 26,
    fontSize: 20,
    color: '#0f172a',
    align: 'right',
  },
  name: {
    visible: true,
    x: 8,
    y: 34,
    fontSize: 34,
    color: '#0f172a',
    align: 'left',
  },
  title: {
    visible: true,
    x: 8,
    y: 39,
    fontSize: 20,
    color: '#475569',
    align: 'left',
  },
  institution: {
    visible: true,
    x: 8,
    y: 43.5,
    fontSize: 20,
    color: '#334155',
    align: 'left',
  },
  roleTicket: {
    visible: true,
    x: 8,
    y: 47.5,
    fontSize: 18,
    color: '#475569',
    align: 'left',
  },
  qrCode: {
    visible: true,
    x: 50,
    y: 72,
    size: 310,
    showFrame: true,
    showCaption: true,
  },
};

export const IDENTITY_CARD_LAYOUT_PRESETS: Array<{
  id: string;
  label: string;
  description: string;
  layout: IdentityCardLayoutConfig;
}> = [
  {
    id: 'standard-panel',
    label: 'Standar + Panel Putih',
    description: 'Header event & panel putih transparan agar selalu jelas di segala template',
    layout: DEFAULT_IDENTITY_CARD_LAYOUT,
  },
  {
    id: 'clean-centered',
    label: 'Template Penuh (Teks Tengah)',
    description: 'Tanpa header & panel tambahan — cocok untuk template Canva/desain penuh',
    layout: {
      showEventHeader: false,
      showContentBackdrop: false,
      name: {
        visible: true,
        x: 50,
        y: 38,
        fontSize: 34,
        color: '#0f172a',
        align: 'center',
      },
      title: {
        visible: true,
        x: 50,
        y: 43,
        fontSize: 20,
        color: '#334155',
        align: 'center',
      },
      institution: {
        visible: true,
        x: 50,
        y: 47.5,
        fontSize: 20,
        color: '#334155',
        align: 'center',
      },
      roleTicket: {
        visible: true,
        x: 50,
        y: 52,
        fontSize: 18,
        color: '#059669',
        align: 'center',
      },
      idRegistrant: {
        visible: true,
        x: 50,
        y: 57,
        fontSize: 22,
        color: '#0f172a',
        align: 'center',
      },
      qrCode: {
        visible: true,
        x: 50,
        y: 76,
        size: 280,
        showFrame: true,
        showCaption: true,
      },
    },
  },
  {
    id: 'light-on-dark',
    label: 'Teks Putih (Template Gelap)',
    description: 'Teks putih rata tengah + QR di bawah untuk template latar warna gelap',
    layout: {
      showEventHeader: false,
      showContentBackdrop: false,
      name: {
        visible: true,
        x: 50,
        y: 37,
        fontSize: 34,
        color: '#ffffff',
        align: 'center',
      },
      title: {
        visible: true,
        x: 50,
        y: 42,
        fontSize: 20,
        color: '#e2e8f0',
        align: 'center',
      },
      institution: {
        visible: true,
        x: 50,
        y: 46.5,
        fontSize: 20,
        color: '#cbd5e1',
        align: 'center',
      },
      roleTicket: {
        visible: true,
        x: 50,
        y: 51,
        fontSize: 18,
        color: '#6ee7b7',
        align: 'center',
      },
      idRegistrant: {
        visible: true,
        x: 50,
        y: 56,
        fontSize: 22,
        color: '#fde68a',
        align: 'center',
      },
      qrCode: {
        visible: true,
        x: 50,
        y: 76,
        size: 270,
        showFrame: true,
        showCaption: true,
      },
    },
  },
];

function clampNum(val: unknown, min: number, max: number, fallback: number): number {
  if (typeof val !== 'number' || !Number.isFinite(val)) return fallback;
  return Math.max(min, Math.min(max, Math.round(val * 10) / 10));
}

function sanitizeColor(val: unknown, fallback: string): string {
  if (typeof val === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(val.trim())) {
    return val.trim();
  }
  return fallback;
}

function sanitizeAlign(val: unknown, fallback: 'left' | 'center' | 'right'): 'left' | 'center' | 'right' {
  if (val === 'left' || val === 'center' || val === 'right') return val;
  return fallback;
}

function sanitizeField(
  raw: Partial<IdentityCardFieldConfig> | undefined,
  defaults: IdentityCardFieldConfig
): IdentityCardFieldConfig {
  return {
    visible: typeof raw?.visible === 'boolean' ? raw.visible : defaults.visible,
    x: clampNum(raw?.x, 0, 100, defaults.x),
    y: clampNum(raw?.y, 0, 100, defaults.y),
    fontSize: clampNum(raw?.fontSize, 10, 64, defaults.fontSize),
    color: sanitizeColor(raw?.color, defaults.color),
    align: sanitizeAlign(raw?.align, defaults.align),
  };
}

function sanitizeQrField(
  raw: Partial<IdentityCardQrConfig> | undefined,
  defaults: IdentityCardQrConfig
): IdentityCardQrConfig {
  return {
    visible: typeof raw?.visible === 'boolean' ? raw.visible : defaults.visible,
    x: clampNum(raw?.x, 5, 95, defaults.x),
    y: clampNum(raw?.y, 5, 95, defaults.y),
    size: clampNum(raw?.size, 100, 440, defaults.size),
    showFrame: typeof raw?.showFrame === 'boolean' ? raw.showFrame : defaults.showFrame,
    showCaption: typeof raw?.showCaption === 'boolean' ? raw.showCaption : defaults.showCaption,
  };
}

export function normalizeIdentityCardLayout(
  raw?: Partial<IdentityCardLayoutConfig> | null
): IdentityCardLayoutConfig {
  return {
    showEventHeader:
      typeof raw?.showEventHeader === 'boolean'
        ? raw.showEventHeader
        : DEFAULT_IDENTITY_CARD_LAYOUT.showEventHeader,
    showContentBackdrop:
      typeof raw?.showContentBackdrop === 'boolean'
        ? raw.showContentBackdrop
        : DEFAULT_IDENTITY_CARD_LAYOUT.showContentBackdrop,
    name: sanitizeField(raw?.name, DEFAULT_IDENTITY_CARD_LAYOUT.name),
    title: sanitizeField(raw?.title, DEFAULT_IDENTITY_CARD_LAYOUT.title),
    institution: sanitizeField(raw?.institution, DEFAULT_IDENTITY_CARD_LAYOUT.institution),
    roleTicket: sanitizeField(raw?.roleTicket, DEFAULT_IDENTITY_CARD_LAYOUT.roleTicket),
    idRegistrant: sanitizeField(raw?.idRegistrant, DEFAULT_IDENTITY_CARD_LAYOUT.idRegistrant),
    qrCode: sanitizeQrField(raw?.qrCode, DEFAULT_IDENTITY_CARD_LAYOUT.qrCode),
  };
}
