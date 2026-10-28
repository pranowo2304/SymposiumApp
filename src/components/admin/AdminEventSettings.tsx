import React, { useState } from 'react';
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
  Palette
} from 'lucide-react';
import { SymposiumInfo } from '../../types';
import { SYMPOSIUM_INFO } from '../../data/symposiumData';
import { COLOR_PALETTES, LogoPaletteType } from '../../utils/themeColors';

interface AdminEventSettingsProps {
  eventInfo: SymposiumInfo;
  onSaveEventInfo: (info: SymposiumInfo) => void;
  onShowToast: (msg: string) => void;
}

// Medical & Symposium Logo Presets for quick selection
export const EVENT_LOGO_PRESETS = [
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
  onSaveEventInfo,
  onShowToast
}) => {
  const [formData, setFormData] = useState<SymposiumInfo>(() => ({
    title: eventInfo.title || '',
    subtitle: eventInfo.subtitle || '',
    theme: eventInfo.theme || '',
    location: eventInfo.location || '',
    venueAddress: eventInfo.venueAddress || '',
    city: eventInfo.city || 'Jakarta Pusat, DKI Jakarta',
    dates: {
      workshop: eventInfo.dates?.workshop || 'Sabtu, 28 November 2026',
      day1: eventInfo.dates?.day1 || 'Minggu, 29 November 2026',
      day2: eventInfo.dates?.day2 || 'Senin, 30 November 2026',
      day3: eventInfo.dates?.day3 || 'Selasa, 1 Desember 2026',
    },
    dateString: eventInfo.dateString || '28 November - 1 Desember 2026',
    logoUrl: eventInfo.logoUrl || '',
    themeColor: eventInfo.themeColor || 'emerald-green',
    organizer: eventInfo.organizer || 'Asosiasi Dokter Hewan Praktisi Hewan Kecil Indonesia (ADHPHKI) & PB PDHI',
    accreditation: eventInfo.accreditation || '32 SKP PB PDHI (Perhimpunan Dokter Hewan Indonesia)',
    contactEmail: eventInfo.contactEmail || 'sekretariat@adhphki.org',
    contactPhone: eventInfo.contactPhone || '+62 811-2345-6789',
    websiteUrl: eventInfo.websiteUrl || 'https://kivnahk-munas.adhphki.org'
  }));

  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [logoInputType, setLogoInputType] = useState<'preset' | 'upload' | 'url'>('preset');

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
    onShowToast('Pengaturan Event berhasil disimpan!');
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
        workshop: SYMPOSIUM_INFO.dates?.workshop || 'Sabtu, 28 November 2026',
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
      websiteUrl: SYMPOSIUM_INFO.websiteUrl || 'https://kivnahk-munas.adhphki.org'
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
            <Building className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-white">
                Pengaturan Event Simposium & Acara
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Konfigurasi Utama
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Atur nama resmi simposium, tanggal pelaksanaan, logo brand acara, serta tempat venue gedung yang ditampilkan di beranda, header, dan sertifikat peserta.
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
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Tanggal Acara:</span>
                  <span className="font-bold text-amber-300">
                    {formData.dateString || `${formData.dates.day1} - ${formData.dates.day2}`}
                  </span>
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
              <p className="text-[11px] text-slate-400">Jadwal hari pertama, hari kedua, dan rentang tanggal acara.</p>
            </div>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Rentang Tanggal Acara */}
            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Rentang Tanggal Ringkas (Tampil di Banner & Header) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.dateString}
                onChange={(e) => handleChange('dateString', e.target.value)}
                placeholder="Contoh: 15 - 16 Agustus 2026"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-bold placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Tanggal Hari I */}
            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Tanggal Hari I (Simposium & Workshop) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.dates.day1}
                onChange={(e) => handleDateNestedChange('day1', e.target.value)}
                placeholder="Contoh: Sabtu, 15 Agustus 2026"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Tanggal Hari II */}
            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Tanggal Hari II (Simposium & Plenary Closing) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.dates.day2}
                onChange={(e) => handleDateNestedChange('day2', e.target.value)}
                placeholder="Contoh: Minggu, 16 Agustus 2026"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Preset Tanggal Cepat */}
            <div className="pt-2">
              <span className="block text-[11px] font-bold text-slate-400 mb-1.5">
                Pilihan Cepat Format Tanggal:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      dateString: '15 - 16 Agustus 2026',
                      dates: {
                        day1: 'Sabtu, 15 Agustus 2026',
                        day2: 'Minggu, 16 Agustus 2026'
                      }
                    }));
                    setHasChanges(true);
                  }}
                  className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] font-semibold text-left transition-colors"
                >
                  Sabtu-Minggu, 15-16 Ags 2026
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      dateString: '24 - 25 Oktober 2026',
                      dates: {
                        day1: 'Sabtu, 24 Oktober 2026',
                        day2: 'Minggu, 25 Oktober 2026'
                      }
                    }));
                    setHasChanges(true);
                  }}
                  className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] font-semibold text-left transition-colors"
                >
                  Sabtu-Minggu, 24-25 Okt 2026
                </button>
              </div>
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

            {/* Active Logo Status & Clear Button */}
            {formData.logoUrl && (
              <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <img
                    src={formData.logoUrl}
                    alt="Logo aktif"
                    className="w-8 h-8 rounded-lg object-contain bg-white p-0.5 border border-slate-700"
                  />
                  <span className="text-xs font-semibold text-slate-300">
                    Logo Terpasang
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleChange('logoUrl', '');
                    onShowToast('Logo dihapus. Menampilkan ikon standar.');
                  }}
                  className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 border border-rose-500/20"
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
