import { SymposiumInfo } from '../types';

export interface ThemeColors {
  primary: string;         // e.g. hex #0284c7 or tailwind class
  primaryDark: string;
  primaryLight: string;
  accent: string;
  accentLight: string;
  badgeBg: string;
  badgeText: string;
  gradientHeader: string;
  cardBorder: string;
  ringColor: string;
}

export type LogoPaletteType = 'medical-navy' | 'gold-amber' | 'cyan-teal' | 'emerald-green' | 'crimson-ruby' | 'royal-indigo';

export interface ColorPresetConfig {
  id: LogoPaletteType;
  label: string;
  subtitle: string;
  primaryHex: string;
  accentHex: string;
  bgGradient: string;
  headerFrom: string;
  headerTo: string;
  accentBadge: string;
  activeNavTab: string;
  buttonClass: string;
  subtleBg: string;
}

export const COLOR_PALETTES: Record<LogoPaletteType, ColorPresetConfig> = {
  'medical-navy': {
    id: 'medical-navy',
    label: 'Navy Medis & Sky Blue (Klasik Terpercaya)',
    subtitle: 'Warna biru klinis rumah sakit & kedokteran formal',
    primaryHex: '#0284c7',
    accentHex: '#38bdf8',
    bgGradient: 'from-slate-950 via-slate-900 to-sky-950',
    headerFrom: 'from-slate-950 via-sky-950 to-slate-900',
    headerTo: 'to-sky-900',
    accentBadge: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    activeNavTab: 'bg-sky-600 text-white border-sky-600',
    buttonClass: 'bg-sky-600 hover:bg-sky-700 text-white',
    subtleBg: 'bg-sky-50 text-sky-800 border-sky-200'
  },
  'gold-amber': {
    id: 'gold-amber',
    label: 'Caduceus Gold & Bronze (Prestisius & Kehormatan)',
    subtitle: 'Warna emas kehormatan Ikatan Dokter & dewan profesor',
    primaryHex: '#d97706',
    accentHex: '#f59e0b',
    bgGradient: 'from-stone-950 via-slate-900 to-amber-950',
    headerFrom: 'from-stone-950 via-amber-950/80 to-slate-900',
    headerTo: 'to-amber-900',
    accentBadge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    activeNavTab: 'bg-amber-600 text-white border-amber-600',
    buttonClass: 'bg-amber-600 hover:bg-amber-700 text-white',
    subtleBg: 'bg-amber-50 text-amber-900 border-amber-200'
  },
  'cyan-teal': {
    id: 'cyan-teal',
    label: 'Teal & Modern Cyan (Teknologi & Medicine 5.0)',
    subtitle: 'Nuansa modern riset laboratorium & teknologi kesehatan',
    primaryHex: '#0d9488',
    accentHex: '#14b8a6',
    bgGradient: 'from-slate-950 via-slate-900 to-teal-950',
    headerFrom: 'from-slate-950 via-teal-950 to-slate-900',
    headerTo: 'to-teal-900',
    accentBadge: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    activeNavTab: 'bg-teal-600 text-white border-teal-600',
    buttonClass: 'bg-teal-600 hover:bg-teal-700 text-white',
    subtleBg: 'bg-teal-50 text-teal-900 border-teal-200'
  },
  'emerald-green': {
    id: 'emerald-green',
    label: 'Emerald Kesehatan (Kemenkes & Farmasi)',
    subtitle: 'Harmonis, segar, merepresentasikan vitalitas kehidupan',
    primaryHex: '#059669',
    accentHex: '#10b981',
    bgGradient: 'from-slate-950 via-slate-900 to-emerald-950',
    headerFrom: 'from-slate-950 via-emerald-950 to-slate-900',
    headerTo: 'to-emerald-900',
    accentBadge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    activeNavTab: 'bg-emerald-600 text-white border-emerald-600',
    buttonClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    subtleBg: 'bg-emerald-50 text-emerald-900 border-emerald-200'
  },
  'crimson-ruby': {
    id: 'crimson-ruby',
    label: 'Palang Merah & Kardiovaskular (Red Ruby)',
    subtitle: 'Enerjik, tanggap darurat, dan kardiologi klinis',
    primaryHex: '#e11d48',
    accentHex: '#f43f5e',
    bgGradient: 'from-slate-950 via-slate-900 to-rose-950',
    headerFrom: 'from-slate-950 via-rose-950 to-slate-900',
    headerTo: 'to-rose-900',
    accentBadge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    activeNavTab: 'bg-rose-600 text-white border-rose-600',
    buttonClass: 'bg-rose-600 hover:bg-rose-700 text-white',
    subtleBg: 'bg-rose-50 text-rose-900 border-rose-200'
  },
  'royal-indigo': {
    id: 'royal-indigo',
    label: 'Royal Indigo & Sapphire (Akademik & Riset)',
    subtitle: 'Keilmuan mendalam, sains neurologi, dan universitas',
    primaryHex: '#4f46e5',
    accentHex: '#6366f1',
    bgGradient: 'from-slate-950 via-indigo-950 to-slate-900',
    headerFrom: 'from-slate-950 via-indigo-950 to-slate-900',
    headerTo: 'to-indigo-900',
    accentBadge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    activeNavTab: 'bg-indigo-600 text-white border-indigo-600',
    buttonClass: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    subtleBg: 'bg-indigo-50 text-indigo-900 border-indigo-200'
  }
};

/**
 * Automatically infers or extracts the theme palette based on the symposium info,
 * user selection, or active logo.
 */
export function getThemePalette(eventInfo?: SymposiumInfo): ColorPresetConfig {
  if (eventInfo?.themeColor && COLOR_PALETTES[eventInfo.themeColor as LogoPaletteType]) {
    return COLOR_PALETTES[eventInfo.themeColor as LogoPaletteType];
  }

  // If a custom logo URL is present and matches preset keywords or patterns
  const url = (eventInfo?.logoUrl || '').toLowerCase();
  if (url.includes('gold') || url.includes('1576091160399') || url.includes('caduceus')) {
    return COLOR_PALETTES['gold-amber'];
  }
  if (url.includes('cross') || url.includes('1505751172876') || url.includes('jantung')) {
    return COLOR_PALETTES['crimson-ruby'];
  }
  if (url.includes('doctor') || url.includes('1582750433449')) {
    return COLOR_PALETTES['royal-indigo'];
  }
  if (url.includes('stethoscope') || url.includes('1584515979956') || url.includes('healthcare') || url.includes('1532938911079')) {
    return COLOR_PALETTES['medical-navy'];
  }

  // Default: Medical Navy (Formal Indonesian Medical Standard)
  return COLOR_PALETTES['medical-navy'];
}
