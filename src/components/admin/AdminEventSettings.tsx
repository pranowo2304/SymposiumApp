import React, { useEffect, useMemo, useState } from 'react';
import { 
  Building, 
  Calendar, 
  MapPin, 
  Image as ImageIcon, 
  Sparkles, 
  Upload, 
  Link as LinkIcon, 
  Check, 
  RotateCcw, 
  Award, 
  ShieldCheck, 
  FileText, 
  Phone, 
  Mail, 
  Globe, 
  Trash2, 
  Eye,
  CheckCircle2,
  AlertCircle,
  Palette,
  QrCode,
  Settings,
  Cloud,
  LayoutTemplate,
} from 'lucide-react';
import { Session, SymposiumInfo, WorkshopIdentityCardTemplate } from '../../types';
import { SYMPOSIUM_INFO } from '../../data/symposiumData';
import { COLOR_PALETTES, LogoPaletteType } from '../../utils/themeColors';
import { normalizeIdentityCardLayout } from '../../utils/identityCardLayout';
import { getWorkshopCardSlots } from '../../utils/workshopCardTemplates';
import { AdminIdentityCardLayoutEditor } from './AdminIdentityCardLayoutEditor';

interface AdminEventSettingsProps {
  eventInfo: SymposiumInfo;
  sessions?: Session[];
  onSaveEventInfo: (info: SymposiumInfo) => void;
  onShowToast: (msg: string) => void;
  isCloudAdmin?: boolean;
  onCloudAdminSignIn?: () => void;
}

const MAX_CARD_TEMPLATE_CHARS = 350000;

async function compressIdentityCardTemplate(file: File): Promise<string> {
  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string) || '');
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.readAsDataURL(file);
  });

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return rawDataUrl;
  }

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Format gambar tidak dapat dimuat.'));
    image.src = rawDataUrl;
  });

  const maxW = 900;
  const maxH = 1280;
  const scale = Math.min(1, maxW / (img.naturalWidth || maxW), maxH / (img.naturalHeight || maxH));
  const targetW = Math.max(1, Math.round((img.naturalWidth || 760) * scale));
  const targetH = Math.max(1, Math.round((img.naturalHeight || 1080) * scale));

  // If original is already compact and within dimensions, return directly
  if (rawDataUrl.length <= MAX_CARD_TEMPLATE_CHARS && scale === 1) {
    return rawDataUrl;
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return rawDataUrl;
  }

  ctx.drawImage(img, 0, 0, targetW, targetH);

  // Preserve PNG if it stays compact (keeps transparency if any)
  if (file.type === 'image/png') {
    const pngAttempt = canvas.toDataURL('image/png');
    if (pngAttempt.length <= MAX_CARD_TEMPLATE_CHARS) {
      return pngAttempt;
    }
  }

  // Otherwise compress smoothly as WebP / JPEG under MAX_CARD_TEMPLATE_CHARS
  const mimeCandidates = ['image/webp', 'image/jpeg'];
  const qualities = [0.88, 0.78, 0.68, 0.56, 0.45];

  for (const mime of mimeCandidates) {
    for (const q of qualities) {
      const attempt = canvas.toDataURL(mime, q);
      if (attempt.startsWith(`data:${mime}`) && attempt.length <= MAX_CARD_TEMPLATE_CHARS) {
        return attempt;
      }
    }
  }

  // Fallback: downscale further and encode as JPEG
  const fallbackCanvas = document.createElement('canvas');
  fallbackCanvas.width = Math.max(1, Math.round(targetW * 0.65));
  fallbackCanvas.height = Math.max(1, Math.round(targetH * 0.65));
  const fctx = fallbackCanvas.getContext('2d');
  if (fctx) {
    fctx.fillStyle = '#0f172a';
    fctx.fillRect(0, 0, fallbackCanvas.width, fallbackCanvas.height);
    fctx.drawImage(img, 0, 0, fallbackCanvas.width, fallbackCanvas.height);
    return fallbackCanvas.toDataURL('image/jpeg', 0.72);
  }

  return canvas.toDataURL('image/jpeg', 0.6);
}

// Medical & Symposium Logo Presets for quick selection
export const EVENT_LOGO_PRESETS = [
  {
    id: 'kivnahk-veterinary',
    label: 'KIVNAHK IV & MUNAS V ADHPHKI (Default)',
    description: 'Lambang Konferensi Ilmiah Veteriner Nasional Hewan Kecil & Praktisi Hewan Kecil',
    url: './pwa-512x512.png',
    themeColor: 'emerald-green' as LogoPaletteType
  },
  {
    id: 'caduceus-gold',
    label: 'Caduceus Medis Emas',
    description: 'Lambang kedokteran klasik dengan tongkat Aesculapius & dedaunan emas',
    url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=300&auto=format&fit=crop&q=80',
    themeColor: 'gold-amber' as LogoPaletteType
  },
  {
    id: 'stethoscope-blue',
    label: 'Stetoskop Modern Biru',
    description: 'Ikon stetoskop klinis dengan aksen biru kedokteran terpercaya',
    url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=300&auto=format&fit=crop&q=80',
    themeColor: 'medical-navy' as LogoPaletteType
  },
  {
    id: 'cross-hospital',
    label: 'Salib Medis & Jantung',
    description: 'Simbol kardiologi dan pelayanan kesehatan modern',
    url: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=300&auto=format&fit=crop&q=80',
    themeColor: 'crimson-ruby' as LogoPaletteType
  },
  {
    id: 'doctor-conference',
    label: 'Simposium & Riset Medis',
    description: 'Ilustrasi konferensi ilmiah kedokteran dan inovasi klinis',
    url: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=300&auto=format&fit=crop&q=80',
    themeColor: 'royal-indigo' as LogoPaletteType
  },
  {
    id: 'healthcare-emblem',
    label: 'Lencana Pelayanan Kesehatan',
    description: 'Lambang medis dengan latar biru kehormatan',
    url: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=300&auto=format&fit=crop&q=80',
    themeColor: 'cyan-teal' as LogoPaletteType
  }
];

export const AdminEventSettings: React.FC<AdminEventSettingsProps> = ({
  eventInfo,
  sessions,
  onSaveEventInfo,
  onShowToast,
  isCloudAdmin = false,
  onCloudAdminSignIn,
}) => {
  const buildFormFromEventInfo = (info: SymposiumInfo): SymposiumInfo => ({
    title: info.title || '',
    subtitle: info.subtitle || '',
    theme: info.theme || '',
    location: info.location || '',
    venueAddress: info.venueAddress || '',
    city: info.city || 'Jakarta Pusat, DKI Jakarta',
    dates: {
      workshop:
        !info.dates?.workshop || info.dates.workshop === 'Sabtu, 28 November 2026'
          ? '28 November 2026'
          : info.dates.workshop,
      munasSymposium: info.dates?.munasSymposium || '29 November 2026 - 1 Desember 2026',
      day1: info.dates?.day1 || 'Minggu, 29 November 2026',
      day2: info.dates?.day2 || 'Senin, 30 November 2026',
      day3: info.dates?.day3 || 'Selasa, 1 Desember 2026',
    },
    dateString: info.dateString || '28 November - 1 Desember 2026',
    logoUrl: info.logoUrl || '',
    themeColor: info.themeColor || 'emerald-green',
    organizer: info.organizer || 'Asosiasi Dokter Hewan Praktisi Hewan Kecil Indonesia (ADHPHKI) & PB PDHI',
    accreditation: info.accreditation || '32 SKP PB PDHI (Perhimpunan Dokter Hewan Indonesia)',
    contactEmail: info.contactEmail || 'sekretariat@adhphki.org',
    contactPhone: info.contactPhone || '+62 811-2345-6789',
    websiteUrl: info.websiteUrl || 'https://kivnahk-munas.adhphki.org',
    customIdentityCardUrl: info.customIdentityCardUrl || '',
    identityCardLayout: normalizeIdentityCardLayout(info.identityCardLayout),
    workshopIdentityCardTemplates: info.workshopIdentityCardTemplates
      ? { ...info.workshopIdentityCardTemplates }
      : {},
    certificateTemplates: info.certificateTemplates ? { ...info.certificateTemplates } : {},
    workshopRundownPdfs: info.workshopRundownPdfs ? { ...info.workshopRundownPdfs } : {},
    enableQrAttendance: false
  });

  const [formData, setFormData] = useState<SymposiumInfo>(() => buildFormFromEventInfo(eventInfo));
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [isCompressingCardTemplate, setIsCompressingCardTemplate] = useState<boolean>(false);
  const [compressingWorkshopKey, setCompressingWorkshopKey] = useState<string | null>(null);
  const [activeLayoutTarget, setActiveLayoutTarget] = useState<string>('default');
  const [logoInputType, setLogoInputType] = useState<'preset' | 'upload' | 'url'>('preset');

  const workshopCardSlots = useMemo(
    () => getWorkshopCardSlots(sessions, formData.workshopIdentityCardTemplates),
    [sessions, formData.workshopIdentityCardTemplates]
  );

  // Keep form synchronized when eventInfo loads/updates from Firestore if no unsaved draft edits exist
  useEffect(() => {
    if (!hasChanges) {
      setFormData(buildFormFromEventInfo(eventInfo));
    }
  }, [eventInfo, hasChanges]);

  const handleChange = (field: keyof SymposiumInfo, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const handleDateNestedChange = (dayKey: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      dates: {
        ...prev.dates,
        [dayKey]: value
      }
    }));
    setHasChanges(true);
  };

  // Handle Logo Upload from Local Device (converts to Base64)
  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onShowToast('Mohon pilih file gambar (PNG, JPG, SVG, atau WebP).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      onShowToast('Ukuran file gambar maksimal 2 MB agar performa aplikasi tetap cepat.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64String = uploadEvent.target?.result as string;
      handleChange('logoUrl', base64String);
      onShowToast('Logo berhasil dimuat dari file komputer!');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Handle Save
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      onShowToast('Nama event tidak boleh kosong.');
      return;
    }
    if (!formData.location.trim()) {
      onShowToast('Tempat / lokasi event tidak boleh kosong.');
      return;
    }

    onSaveEventInfo(formData);
    setHasChanges(false);
    onShowToast('Pengaturan Event & Sistem berhasil disimpan!');
  };

  // Handle Reset to Default
  const handleReset = () => {
    setFormData({
      title: SYMPOSIUM_INFO.title,
      subtitle: SYMPOSIUM_INFO.subtitle,
      theme: SYMPOSIUM_INFO.theme,
      location: SYMPOSIUM_INFO.location,
      venueAddress: SYMPOSIUM_INFO.venueAddress,
      city: SYMPOSIUM_INFO.city || 'D.I. Yogyakarta',
      dates: {
        workshop: SYMPOSIUM_INFO.dates?.workshop || '28 November 2026',
        munasSymposium: SYMPOSIUM_INFO.dates?.munasSymposium || '29 November 2026 - 1 Desember 2026',
        day1: SYMPOSIUM_INFO.dates.day1,
        day2: SYMPOSIUM_INFO.dates.day2,
        day3: SYMPOSIUM_INFO.dates?.day3 || 'Selasa, 1 Desember 2026',
      },
      dateString: SYMPOSIUM_INFO.dateString || '28 November - 1 Desember 2026',
      logoUrl: SYMPOSIUM_INFO.logoUrl || '',
      themeColor: SYMPOSIUM_INFO.themeColor || 'emerald-green',
      organizer: SYMPOSIUM_INFO.organizer,
      accreditation: SYMPOSIUM_INFO.accreditation,
      contactEmail: SYMPOSIUM_INFO.contactEmail || 'sekretariat@adhphki.org',
      contactPhone: SYMPOSIUM_INFO.contactPhone || '+62 811-2345-6789',
      websiteUrl: SYMPOSIUM_INFO.websiteUrl || 'https://kivnahk-munas.adhphki.org',
      customIdentityCardUrl: SYMPOSIUM_INFO.customIdentityCardUrl || '',
      identityCardLayout: normalizeIdentityCardLayout(SYMPOSIUM_INFO.identityCardLayout),
      workshopIdentityCardTemplates: {},
      certificateTemplates: formData.certificateTemplates ? { ...formData.certificateTemplates } : {},
      workshopRundownPdfs: {},
      enableQrAttendance: false
    });
    setHasChanges(true);
    onShowToast('Data event dikembalikan ke setelan awal KIVNAHK IV & MUNAS V ADHPHKI (klik Simpan untuk menerapkan).');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shrink-0">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-white">
                Pengaturan Sistem & Event Simposium
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Konfigurasi Sistem
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Kelola fitur sistem (seperti aktivasi Absensi QR Code), nama resmi simposium, tanggal pelaksanaan, logo brand acara, serta tempat venue gedung.
            </p>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5"
            title="Kembalikan ke data bawaan sistem"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Standar</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className={`px-5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-lg ${
              hasChanges 
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30 ring-2 ring-emerald-400/50 animate-pulse'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/30'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>{hasChanges ? 'Simpan Perubahan' : 'Simpan Pengaturan'}</span>
          </button>
        </div>
      </div>

      {/* PENGATURAN SISTEM: STATUS MODUL NONAKTIF */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl border bg-slate-800 text-slate-400 border-slate-700">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-white">
                  Status Modul Sistem: Absensi QR Code, Jadwal Saya, Live Chat &amp; Profil/Sertifikat
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Dinonaktifkan
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Sesuai konfigurasi acara saat ini, menu dan fitur <strong>Absensi QR Code</strong>, <strong>Jadwal Saya (Bookmark)</strong>, <strong>Live Chat &amp; Q&amp;A</strong>, serta <strong>Profil &amp; E-Sertifikat</strong> sedang dinonaktifkan dari antarmuka peserta agar aplikasi tetap fokus pada Jadwal Ilmiah, Pembicara, Pameran, dan Denah Venue.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Live Visual Preview Simulator Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
            <Eye className="w-4 h-4 text-indigo-400" />
            <span className="text-white font-extrabold">Pratinjau Langsung (Live Visual Preview Banner)</span>
            <span className="text-[10px] text-slate-400">• Ter-update secara instan saat Anda mengetik</span>
          </div>
          <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Tampilan Peserta</span>
          </span>
        </div>

        {/* Live Banner Mockup */}
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/80 border border-indigo-500/30 rounded-2xl p-5 sm:p-6 shadow-inner text-white relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            {/* Event Logo + Title */}
            <div className="flex items-start gap-4">
              {formData.logoUrl ? (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-1.5 shadow-md border border-slate-700 shrink-0 flex items-center justify-center overflow-hidden">
                  <img
                    src={formData.logoUrl}
                    alt={formData.title}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-xl shadow-md shrink-0 border border-blue-400/30">
                  <Award className="w-8 h-8" />
                </div>
              )}

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {formData.accreditation || 'SKP Terakreditasi'}
                  </span>
                  <span className="text-xs text-slate-400">
                    oleh <strong className="text-slate-200">{formData.organizer || 'Panitia Simposium'}</strong>
                  </span>
                </div>
                
                <h3 className="text-base sm:text-xl font-black text-white tracking-tight leading-snug">
                  {formData.title || 'Nama Event Belum Diisi'}
                </h3>

                {formData.subtitle && (
                  <p className="text-xs text-indigo-300 font-semibold">
                    {formData.subtitle}
                  </p>
                )}

                {formData.theme && (
                  <p className="text-[11px] text-slate-400 italic line-clamp-1">
                    Tema: "{formData.theme}"
                  </p>
                )}
              </div>
            </div>

            {/* Event Details Badges (Date & Venue) */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-5">
              <div className="flex items-start gap-2 text-xs text-slate-300">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0 mt-0.5">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 block">Tanggal Pelaksanaan:</span>
                  <div className="font-bold text-amber-300">
                    {formData.dateString || `${formData.dates.day1} - ${formData.dates.day2}`}
                  </div>
                  <div className="text-[11px] text-emerald-300 font-semibold">
                    Workshop: {formData.dates.workshop || '28 November 2026'}
                  </div>
                  <div className="text-[11px] text-sky-300 font-semibold">
                    Munas &amp; Symposium: {formData.dates.munasSymposium || '29 November 2026 - 1 Desember 2026'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-300">
                <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Tempat / Venue:</span>
                  <span className="font-bold text-slate-200 max-w-[220px] truncate block">
                    {formData.location || 'Lokasi Gedung Acara'}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* SECTION 1: NAMA EVENT & IDENTITAS */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">1. Nama Event & Identitas</h3>
              <p className="text-[11px] text-slate-400">Judul utama simposium, subjudul, dan penyelenggara.</p>
            </div>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Title / Nama Event */}
            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Nama Event Utama <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Contoh: SIMPOSIUM NASIONAL KEDOKTERAN 2026"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-bold placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Subtitle */}
            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Subjudul / Tagline Event
              </label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => handleChange('subtitle', e.target.value)}
                placeholder="Contoh: Advances in Clinical Practice & Multidisciplinary Patient Care"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Tema Ilmiah */}
            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Tema Ilmiah Utama
              </label>
              <textarea
                rows={2}
                value={formData.theme}
                onChange={(e) => handleChange('theme', e.target.value)}
                placeholder="Contoh: Inovasi Diagnostik dan Tata Laksana Terintegrasi di Era Medicine 5.0"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Penyelenggara */}
            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Organisasi Penyelenggara
              </label>
              <input
                type="text"
                value={formData.organizer}
                onChange={(e) => handleChange('organizer', e.target.value)}
                placeholder="Contoh: Perhimpunan Dokter Spesialis Indonesia (PDSI) & IDI"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Akreditasi SKP */}
            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Keterangan Akreditasi SKP
              </label>
              <input
                type="text"
                value={formData.accreditation}
                onChange={(e) => handleChange('accreditation', e.target.value)}
                placeholder="Contoh: 24 SKP Kemenkes RI (E-Sertifikat)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: TANGGAL EVENT */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">2. Tanggal Pelaksanaan Event</h3>
              <p className="text-[11px] text-slate-400">Jadwal pelaksanaan Workshop, Munas &amp; Symposium, serta rincian harian.</p>
            </div>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Tanggal Workshop */}
            <div>
              <label className="block font-bold text-emerald-300 mb-1">
                Workshop <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.dates.workshop || ''}
                onChange={(e) => handleDateNestedChange('workshop', e.target.value)}
                placeholder="28 November 2026"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-bold placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Tanggal Munas & Symposium */}
            <div>
              <label className="block font-bold text-sky-300 mb-1">
                Munas &amp; Symposium <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.dates.munasSymposium || ''}
                onChange={(e) => handleDateNestedChange('munasSymposium', e.target.value)}
                placeholder="29 November 2026 - 1 Desember 2026"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-bold placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Rentang Tanggal Ringkas */}
            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Rentang Tanggal Ringkas (Banner &amp; Header) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.dateString}
                onChange={(e) => handleChange('dateString', e.target.value)}
                placeholder="28 November - 1 Desember 2026"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-bold placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Rincian Hari I, II, III */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div>
                <label className="block font-bold text-slate-400 mb-1 text-[11px]">
                  Hari I
                </label>
                <input
                  type="text"
                  required
                  value={formData.dates.day1}
                  onChange={(e) => handleDateNestedChange('day1', e.target.value)}
                  placeholder="Minggu, 29 November 2026"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 text-[11px]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-400 mb-1 text-[11px]">
                  Hari II
                </label>
                <input
                  type="text"
                  required
                  value={formData.dates.day2}
                  onChange={(e) => handleDateNestedChange('day2', e.target.value)}
                  placeholder="Senin, 30 November 2026"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 text-[11px]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-400 mb-1 text-[11px]">
                  Hari III
                </label>
                <input
                  type="text"
                  value={formData.dates.day3 || ''}
                  onChange={(e) => handleDateNestedChange('day3', e.target.value)}
                  placeholder="Selasa, 1 Desember 2026"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 text-[11px]"
                />
              </div>
            </div>

            {/* Preset Tanggal Resmi Event */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    dateString: '28 November - 1 Desember 2026',
                    dates: {
                      workshop: '28 November 2026',
                      munasSymposium: '29 November 2026 - 1 Desember 2026',
                      day1: 'Minggu, 29 November 2026',
                      day2: 'Senin, 30 November 2026',
                      day3: 'Selasa, 1 Desember 2026'
                    }
                  }));
                  setHasChanges(true);
                  onShowToast('Tanggal standar KIVNAHK IV & MUNAS V ADHPHKI diterapkan.');
                }}
                className="w-full p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] font-semibold text-left transition-colors flex items-center justify-between gap-2 cursor-pointer"
              >
                <span>Gunakan Jadwal Resmi: Workshop (28 Nov 2026) &amp; Munas/Symposium (29 Nov - 1 Des 2026)</span>
                <span className="text-emerald-400 font-bold shrink-0">Terapkan</span>
              </button>
            </div>

          </div>
        </div>

        {/* SECTION 3: LOGO EVENT */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">3. Logo Resmi Event</h3>
              <p className="text-[11px] text-slate-400">Pilih dari preset medis, unggah gambar file, atau masukkan link URL.</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            {/* Logo Input Method Toggle */}
            <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => setLogoInputType('preset')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-xs transition-all ${
                  logoInputType === 'preset'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Pilihan Preset
              </button>
              <button
                type="button"
                onClick={() => setLogoInputType('upload')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-xs transition-all ${
                  logoInputType === 'upload'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Unggah File
              </button>
              <button
                type="button"
                onClick={() => setLogoInputType('url')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-xs transition-all ${
                  logoInputType === 'url'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Link URL
              </button>
            </div>

            {/* TAB: PRESET LOGOS */}
            {logoInputType === 'preset' && (
              <div className="space-y-2">
                <span className="block text-[11px] font-bold text-slate-300">
                  Pilih Salah Satu Lambang Medis Siap Pakai:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {EVENT_LOGO_PRESETS.map(preset => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          logoUrl: preset.url,
                          themeColor: preset.themeColor
                        }));
                        setHasChanges(true);
                        onShowToast(`Logo preset "${preset.label}" dipilih! Tema warna otomatis disesuaikan.`);
                      }}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-3 transition-all ${
                        formData.logoUrl === preset.url
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-xs ring-1 ring-indigo-400'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="w-10 h-10 rounded-lg object-cover bg-slate-900 border border-slate-700 shrink-0"
                      />
                      <div className="overflow-hidden">
                        <span className="font-bold text-xs text-white block truncate">
                          {preset.label}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {preset.description}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: FILE UPLOAD */}
            {logoInputType === 'upload' && (
              <div className="bg-slate-950 border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-2xl p-5 text-center">
                <input
                  type="file"
                  id="logo-file-input"
                  accept="image/*"
                  onChange={handleLogoFileUpload}
                  className="hidden"
                />
                <label 
                  htmlFor="logo-file-input"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400 shadow-inner">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-white block">
                    Klik untuk Memilih File Logo dari Komputer
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Format didukung: PNG, JPG, WebP, SVG (Maks. 2 MB)
                  </span>
                </label>
              </div>
            )}

            {/* TAB: URL INPUT */}
            {logoInputType === 'url' && (
              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  URL / Tautan Gambar Logo
                </label>
                <div className="relative">
                  <LinkIcon className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="url"
                    value={formData.logoUrl || ''}
                    onChange={(e) => handleChange('logoUrl', e.target.value)}
                    placeholder="https://example.com/logo-simposium.png"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* Active Logo Status & App Icon Synchronization Preview */}
            {formData.logoUrl && (
              <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={formData.logoUrl}
                    alt="Logo Event & Ikon Aplikasi"
                    className="w-10 h-10 rounded-xl object-contain bg-white p-1 border border-emerald-500/50 shadow-xs shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-white block truncate">
                      Logo Event &amp; Ikon Aplikasi Mobile Aktif
                    </span>
                    <span className="text-[10px] text-emerald-400 block truncate">
                      Otomatis digunakan sebagai Ikon Home Screen HP (PWA) &amp; Favicon
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleChange('logoUrl', '');
                    onShowToast('Logo dihapus. Menampilkan ikon standar.');
                  }}
                  className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 border border-rose-500/20 shrink-0"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Hapus Logo</span>
                </button>
              </div>
            )}

            {/* Sub-Section: Penyelarasan Tema Warna Logo */}
            <div className="pt-3 border-t border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-slate-300 text-xs flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-amber-400" />
                  <span>Warna Tema Desain (Menyesuaikan Logo):</span>
                </label>
                <span className="text-[10px] text-slate-400">
                  Otomatis terpasang saat memilih preset atau pilih manual
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {Object.values(COLOR_PALETTES).map((pal) => {
                  const isSelected = (formData.themeColor || 'medical-navy') === pal.id;
                  return (
                    <button
                      key={pal.id}
                      type="button"
                      onClick={() => {
                        handleChange('themeColor', pal.id);
                        onShowToast(`Tema warna diubah ke "${pal.label.split(' (')[0]}"`);
                      }}
                      className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                        isSelected
                          ? 'bg-slate-800 border-white/40 ring-2 ring-white/30 shadow-md'
                          : 'bg-slate-950 border-slate-800 hover:bg-slate-900/60'
                      }`}
                    >
                      <div 
                        className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center border border-white/20 shadow-xs"
                        style={{ backgroundColor: pal.primaryHex }}
                      >
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">
                          {pal.label.split(' (')[0]}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {pal.subtitle}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sub-Section: Upload Desain Khusus Kartu Identitas Peserta */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div>
                <label className="block font-bold text-slate-200 text-xs mb-0.5 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Template Desain Khusus Kartu Identitas Peserta (Opsional):</span>
                </label>
                <p className="text-[11px] text-slate-400">
                  Unggah gambar template ID Card khusus (PNG/JPG latar belakang kartu). Jika diisi, sistem akan menggunakan template tersebut saat peserta mengunduh Kartu ID.
                </p>
              </div>

              <div className="bg-slate-950 border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-2xl p-4 text-center">
                <input
                  type="file"
                  id="custom-card-file-input"
                  accept="image/*"
                  disabled={isCompressingCardTemplate}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (!file) return;
                    if (!file.type.startsWith('image/')) {
                      onShowToast('Mohon pilih file gambar kartu (PNG, JPG, WebP).');
                      return;
                    }
                    if (file.size > 10 * 1024 * 1024) {
                      onShowToast('Ukuran file maksimal 10 MB.');
                      return;
                    }
                    setIsCompressingCardTemplate(true);
                    try {
                      const compressedDataUrl = await compressIdentityCardTemplate(file);
                      const updated = { ...formData, customIdentityCardUrl: compressedDataUrl };
                      setFormData(updated);
                      setHasChanges(false);
                      onSaveEventInfo(updated);
                      onShowToast(
                        isCloudAdmin
                          ? 'Template kartu identitas berhasil disimpan ke Cloud & diterapkan!'
                          : 'Template kartu identitas berhasil disimpan & diterapkan di browser ini!'
                      );
                    } catch (err) {
                      console.error('Failed processing ID card template:', err);
                      onShowToast('Gagal memproses gambar template kartu identitas.');
                    } finally {
                      setIsCompressingCardTemplate(false);
                    }
                  }}
                  className="hidden"
                />
                <label
                  htmlFor="custom-card-file-input"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-1.5"
                >
                  <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 shadow-inner">
                    <Upload className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-white block">
                    {isCompressingCardTemplate
                      ? 'Mengoptimalkan & menyimpan template...'
                      : formData.customIdentityCardUrl
                        ? 'Ganti Template Kartu ID'
                        : 'Klik untuk Unggah Gambar Template Kartu ID'}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Disarankan rasio vertikal (misal 760 x 1080 px) · Otomatis dikompres agar tersimpan di Cloud
                  </span>
                </label>
              </div>

              {formData.customIdentityCardUrl && (
                <div className="space-y-2.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={formData.customIdentityCardUrl}
                        alt="Template Kartu ID Peserta"
                        className="w-12 h-16 rounded-lg object-cover bg-slate-900 border border-emerald-500/50 shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-emerald-300 block truncate">
                          Template Kartu ID Khusus Aktif
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {isCloudAdmin
                            ? 'Tersimpan di Cloud Firestore & lokal — langsung diterapkan pada kartu peserta.'
                            : 'Tersimpan di browser ini. Hubungkan Google Admin agar tersinkron ke semua peserta.'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = { ...formData, customIdentityCardUrl: '' };
                        setFormData(updated);
                        setHasChanges(false);
                        onSaveEventInfo(updated);
                        onShowToast('Template kartu ID khusus dihapus. Menggunakan desain bawaan.');
                      }}
                      className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 border border-rose-500/20 shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Hapus Template</span>
                    </button>
                  </div>

                  {!isCloudAdmin && onCloudAdminSignIn && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                      <span className="text-[11px] text-amber-300 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Sinkronisasi Cloud belum aktif — peserta di perangkat lain belum melihat template ini.</span>
                      </span>
                      <button
                        type="button"
                        onClick={onCloudAdminSignIn}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        <Cloud className="w-3.5 h-3.5" />
                        <span>Sinkronkan ke Cloud</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Sub-Section: Upload Desain Khusus ID Card per Jenis Workshop */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div>
                  <label className="block font-bold text-slate-200 text-xs mb-0.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                    <span>
                      Template Desain Khusus ID Card per Jenis Workshop ({workshopCardSlots.length} Workshop):
                    </span>
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Unggah desain template ID Card berbeda untuk masing-masing jenis workshop. Peserta yang memiliki tiket workshop tersebut akan otomatis menggunakan template workshop-nya saat melihat dan mengunduh PNG/PDF Kartu ID.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {workshopCardSlots.map((slot, index) => {
                    const savedTpl = formData.workshopIdentityCardTemplates?.[slot.workshopKey];
                    const hasTpl = Boolean(savedTpl?.templateUrl);
                    const isUploadingThis = compressingWorkshopKey === slot.workshopKey;
                    const inputId = `workshop-card-file-input-${slot.workshopKey}`;

                    return (
                      <div
                        key={slot.workshopKey}
                        className={`bg-slate-950 rounded-2xl border p-3.5 space-y-3 transition-colors ${
                          hasTpl ? 'border-sky-500/40' : 'border-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-sky-500/15 text-sky-300 border border-sky-500/30 mb-1">
                              Workshop {index + 1}
                            </span>
                            <h4 className="text-xs font-extrabold text-white leading-snug">
                              {slot.workshopLabel}
                            </h4>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {slot.roomLabel ? `${slot.roomLabel} · ` : ''}
                              {slot.sessionCount > 0 ? `${slot.sessionCount} sesi` : 'Template kustom'}
                            </p>
                          </div>

                          {hasTpl && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0">
                              Aktif
                            </span>
                          )}
                        </div>

                        <input
                          type="file"
                          id={inputId}
                          accept="image/*"
                          disabled={isUploadingThis}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            e.target.value = '';
                            if (!file) return;
                            if (!file.type.startsWith('image/')) {
                              onShowToast('Mohon pilih file gambar kartu (PNG, JPG, WebP).');
                              return;
                            }
                            if (file.size > 10 * 1024 * 1024) {
                              onShowToast('Ukuran file maksimal 10 MB.');
                              return;
                            }
                            setCompressingWorkshopKey(slot.workshopKey);
                            try {
                              const compressedDataUrl = await compressIdentityCardTemplate(file);
                              const existingEntry =
                                formData.workshopIdentityCardTemplates?.[slot.workshopKey];
                              const nextEntry: WorkshopIdentityCardTemplate = {
                                workshopKey: slot.workshopKey,
                                workshopLabel: slot.workshopLabel,
                                templateUrl: compressedDataUrl,
                                ...(existingEntry?.layout ? { layout: existingEntry.layout } : {}),
                              };
                              const updated: SymposiumInfo = {
                                ...formData,
                                workshopIdentityCardTemplates: {
                                  ...(formData.workshopIdentityCardTemplates || {}),
                                  [slot.workshopKey]: nextEntry,
                                },
                              };
                              setFormData(updated);
                              setHasChanges(false);
                              setActiveLayoutTarget(slot.workshopKey);
                              onSaveEventInfo(updated);
                              onShowToast(
                                isCloudAdmin
                                  ? `Template ID Card "${slot.shortLabel}" berhasil disimpan ke Cloud!`
                                  : `Template ID Card "${slot.shortLabel}" berhasil disimpan di browser ini!`
                              );
                            } catch (err) {
                              console.error('Failed processing workshop ID card template:', err);
                              onShowToast(
                                `Gagal memproses gambar template untuk ${slot.shortLabel}.`
                              );
                            } finally {
                              setCompressingWorkshopKey(null);
                            }
                          }}
                          className="hidden"
                        />

                        {hasTpl ? (
                          <div className="space-y-2.5">
                            <div className="flex items-center gap-3 bg-slate-900/70 p-2.5 rounded-xl border border-slate-800">
                              <img
                                src={savedTpl!.templateUrl}
                                alt={`Template ${slot.workshopLabel}`}
                                className="w-12 h-16 rounded-lg object-cover bg-slate-900 border border-sky-500/40 shrink-0"
                              />
                              <div className="min-w-0 flex-1 space-y-1">
                                <span className="text-[11px] font-bold text-emerald-300 block truncate">
                                  Template {slot.shortLabel} Terpasang
                                </span>
                                <span className="text-[10px] text-slate-400 block leading-snug">
                                  Otomatis diterapkan untuk peserta dengan tiket {slot.shortLabel}.
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5">
                              <label
                                htmlFor={inputId}
                                className="flex-1 min-w-[90px] py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer transition-colors"
                              >
                                <Upload className="w-3 h-3 text-sky-400" />
                                <span>{isUploadingThis ? 'Memproses...' : 'Ganti'}</span>
                              </label>
                              <button
                                type="button"
                                onClick={() => setActiveLayoutTarget(slot.workshopKey)}
                                className={`flex-1 min-w-[110px] py-1.5 px-2.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 border cursor-pointer transition-colors ${
                                  activeLayoutTarget === slot.workshopKey
                                    ? 'bg-sky-600 text-white border-sky-500'
                                    : 'bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border-sky-500/30'
                                }`}
                              >
                                <LayoutTemplate className="w-3 h-3" />
                                <span>Atur Posisi</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const nextMap = {
                                    ...(formData.workshopIdentityCardTemplates || {}),
                                  };
                                  delete nextMap[slot.workshopKey];
                                  const updated: SymposiumInfo = {
                                    ...formData,
                                    workshopIdentityCardTemplates: nextMap,
                                  };
                                  setFormData(updated);
                                  setHasChanges(false);
                                  if (activeLayoutTarget === slot.workshopKey) {
                                    setActiveLayoutTarget('default');
                                  }
                                  onSaveEventInfo(updated);
                                  onShowToast(
                                    `Template ID Card "${slot.shortLabel}" dihapus.`
                                  );
                                }}
                                className="py-1.5 px-2.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] font-bold flex items-center justify-center gap-1 border border-rose-500/20 cursor-pointer transition-colors"
                                title="Hapus template workshop ini"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <label
                            htmlFor={inputId}
                            className="cursor-pointer border-2 border-dashed border-slate-800 hover:border-sky-500/50 rounded-xl p-3.5 flex flex-col items-center justify-center text-center space-y-1.5 transition-colors bg-slate-900/40"
                          >
                            <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-sky-400">
                              <Upload className="w-4 h-4" />
                            </div>
                            <span className="text-[11px] font-bold text-white block">
                              {isUploadingThis
                                ? 'Mengoptimalkan & menyimpan...'
                                : `Unggah Desain ID Card ${slot.shortLabel}`}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              PNG/JPG vertikal (760 x 1080 px) · Simpan otomatis
                            </span>
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Target Template Switcher for the Interactive Layout Editor */}
              {(() => {
                const selectedWorkshopSlot =
                  activeLayoutTarget !== 'default'
                    ? workshopCardSlots.find((s) => s.workshopKey === activeLayoutTarget) || null
                    : null;
                const selectedWorkshopTpl = selectedWorkshopSlot
                  ? formData.workshopIdentityCardTemplates?.[selectedWorkshopSlot.workshopKey]
                  : undefined;
                const editorTemplateUrl = selectedWorkshopSlot
                  ? selectedWorkshopTpl?.templateUrl || formData.customIdentityCardUrl || ''
                  : formData.customIdentityCardUrl || '';
                const editorLayout = selectedWorkshopSlot
                  ? selectedWorkshopTpl?.layout || formData.identityCardLayout
                  : formData.identityCardLayout;

                return (
                  <div className="space-y-2.5">
                    {workshopCardSlots.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                          Edit Posisi Field untuk:
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveLayoutTarget('default')}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                            activeLayoutTarget === 'default'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          Template Utama (Simposium)
                        </button>
                        {workshopCardSlots.map((slot) => {
                          const hasCustomTpl = Boolean(
                            formData.workshopIdentityCardTemplates?.[slot.workshopKey]?.templateUrl
                          );
                          return (
                            <button
                              key={slot.workshopKey}
                              type="button"
                              onClick={() => setActiveLayoutTarget(slot.workshopKey)}
                              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                                activeLayoutTarget === slot.workshopKey
                                  ? 'bg-sky-600 text-white shadow-xs'
                                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                              }`}
                            >
                              <span>{slot.shortLabel}</span>
                              {hasCustomTpl && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <AdminIdentityCardLayoutEditor
                      eventInfo={formData}
                      layout={editorLayout}
                      templateUrlOverride={editorTemplateUrl}
                      templateLabel={
                        selectedWorkshopSlot
                          ? selectedWorkshopSlot.shortLabel
                          : 'Template Utama (Simposium)'
                      }
                      sampleTicketLabel={
                        selectedWorkshopSlot
                          ? `${selectedWorkshopSlot.workshopLabel} Pass`
                          : 'Simposium Full Pass'
                      }
                      onChangeLayout={(nextLayout, saveImmediately) => {
                        let updated: SymposiumInfo;
                        if (selectedWorkshopSlot) {
                          const existingEntry =
                            formData.workshopIdentityCardTemplates?.[
                              selectedWorkshopSlot.workshopKey
                            ];
                          if (!existingEntry?.templateUrl) {
                            onShowToast(
                              `Unggah dulu gambar template untuk ${selectedWorkshopSlot.shortLabel} agar posisi kustom tersimpan khusus workshop ini.`
                            );
                            return;
                          }
                          updated = {
                            ...formData,
                            workshopIdentityCardTemplates: {
                              ...(formData.workshopIdentityCardTemplates || {}),
                              [selectedWorkshopSlot.workshopKey]: {
                                ...existingEntry,
                                layout: nextLayout,
                              },
                            },
                          };
                        } else {
                          updated = {
                            ...formData,
                            identityCardLayout: nextLayout,
                          };
                        }

                        setFormData(updated);
                        if (saveImmediately) {
                          setHasChanges(false);
                          onSaveEventInfo(updated);
                        } else {
                          setHasChanges(true);
                        }
                      }}
                      onShowToast={onShowToast}
                    />
                  </div>
                );
              })()}
            </div>

          </div>
        </div>

        {/* SECTION 4: TEMPAT & VENUE EVENT */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">4. Tempat & Lokasi Event</h3>
              <p className="text-[11px] text-slate-400">Gedung pertemuan, alamat lengkap, dan info kontak acara.</p>
            </div>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Nama Tempat / Gedung */}
            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Nama Tempat / Gedung Event <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="Contoh: Jakarta Convention Center (JCC) & Grand Hotel Ballroom"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-bold placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Alamat Lengkap */}
            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Alamat Lengkap Venue
              </label>
              <input
                type="text"
                value={formData.venueAddress}
                onChange={(e) => handleChange('venueAddress', e.target.value)}
                placeholder="Contoh: Jl. Jend. Gatot Subroto No.1, Senayan, Jakarta Pusat"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Kota / Wilayah */}
            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Kota / Wilayah Penyelenggaraan
              </label>
              <input
                type="text"
                value={formData.city || ''}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="Contoh: Jakarta Pusat, DKI Jakarta"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Email & Telepon Helpdesk */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  Email Helpdesk Panitia
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="email"
                    value={formData.contactEmail || ''}
                    onChange={(e) => handleChange('contactEmail', e.target.value)}
                    placeholder="sekretariat@event.id"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-2.5 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  Nomor Kontak / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    value={formData.contactPhone || ''}
                    onChange={(e) => handleChange('contactPhone', e.target.value)}
                    placeholder="+62 811-2345-6789"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-2.5 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 text-[11px]"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* BOTTOM FULL-WIDTH SAVE BUTTON CARD */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-white">
                Simpan & Terapkan Pengaturan Event
              </h4>
              <p className="text-xs text-slate-400">
                Perubahan akan otomatis disimpan ke database browser dan langsung diperbarui di seluruh menu aplikasi.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all border border-slate-700"
            >
              Batal / Reset
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all shadow-lg shadow-emerald-900/40 flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Pengaturan Event</span>
            </button>
          </div>
        </div>

      </form>

    </div>
  );
};
