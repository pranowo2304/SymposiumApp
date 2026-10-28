import React from 'react';
import { 
  Users, 
  Stethoscope, 
  Calendar, 
  Store, 
  MapPin, 
  BookmarkCheck, 
  QrCode, 
  Award, 
  Sliders, 
  Lock, 
  ShieldCheck, 
  Sparkles, 
  ChevronRight,
  UserCheck,
  Building,
  CalendarDays
} from 'lucide-react';
import { MainTabType } from './MainMenuTabs';
import { SymposiumInfo, Participant } from '../types';
import { SYMPOSIUM_INFO } from '../data/symposiumData';
import { getThemePalette } from '../utils/themeColors';

interface LandingPageViewProps {
  onSelectTab: (tab: MainTabType) => void;
  onOpenAdmin: () => void;
  onOpenQrScanner: () => void;
  onOpenProfile: () => void;
  onOpenBookmarks: () => void;
  speakerCount: number;
  workshopCount: number;
  symposiumCount: number;
  exhibitorCount: number;
  bookmarkCount: number;
  currentUser?: Participant;
  isAdminAuthenticated?: boolean;
  eventInfo?: SymposiumInfo;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  onSelectTab,
  onOpenAdmin,
  onOpenQrScanner,
  onOpenProfile,
  onOpenBookmarks,
  speakerCount,
  workshopCount,
  symposiumCount,
  exhibitorCount,
  bookmarkCount,
  currentUser,
  isAdminAuthenticated,
  eventInfo
}) => {
  const info = eventInfo || SYMPOSIUM_INFO;
  const palette = getThemePalette(info);

  const eventMenus = [
    {
      id: 'speaker' as MainTabType,
      title: 'Daftar Speaker',
      subtitle: `${speakerCount} Narasumber & Pakar`,
      desc: 'Profil lengkap para narasumber, dokter spesialis, konsultan, dan topik paparan ilmiah.',
      icon: Users,
      color: 'blue',
      gradient: 'from-blue-600 to-indigo-700',
      badgeBg: 'bg-blue-100 text-blue-800',
      actionText: 'Lihat Daftar Narasumber',
      onClick: () => onSelectTab('speaker')
    },
    {
      id: 'workshop' as MainTabType,
      title: 'Jadwal Workshop',
      subtitle: `${workshopCount} Hands-On Skill Lab`,
      desc: 'Pelatihan teknis praktis intensif, USG POCUS, simulasi ACLS, dan sertifikasi skill klinis.',
      icon: Stethoscope,
      color: 'emerald',
      gradient: 'from-emerald-600 to-teal-700',
      badgeBg: 'bg-emerald-100 text-emerald-800',
      actionText: 'Buka Jadwal Workshop',
      onClick: () => onSelectTab('workshop')
    },
    {
      id: 'symposium' as MainTabType,
      title: 'Jadwal Symposium',
      subtitle: `${symposiumCount} Sesi Terjadwal`,
      desc: 'Susunan lengkap Plenary Keynote, Simposium Paralel Hari I & II, serta sesi diskusi panel.',
      icon: Calendar,
      color: 'indigo',
      gradient: 'from-indigo-600 to-slate-800',
      badgeBg: 'bg-indigo-100 text-indigo-800',
      actionText: 'Buka Jadwal Ilmiah',
      onClick: () => onSelectTab('symposium')
    },
    {
      id: 'pameran' as MainTabType,
      title: 'Pameran Medis',
      subtitle: `${exhibitorCount} Booth Industri & Alkes`,
      desc: 'Eksplorasi inovasi farmasi terbaru, alat diagnostik canggih, AI kesehatan, dan demo produk.',
      icon: Store,
      color: 'amber',
      gradient: 'from-amber-600 to-orange-700',
      badgeBg: 'bg-amber-100 text-amber-800',
      actionText: 'Kunjungi Pameran',
      onClick: () => onSelectTab('pameran')
    },
    {
      id: 'venue' as MainTabType,
      title: 'Denah & Venue',
      subtitle: 'Peta Interaktif Gedung',
      desc: `Navigasi ruangan ballroom, hall simposium, ruang workshop, dan fasilitas di ${info.location}.`,
      icon: MapPin,
      color: 'rose',
      gradient: 'from-rose-600 to-pink-700',
      badgeBg: 'bg-rose-100 text-rose-800',
      actionText: 'Lihat Denah Lokasi',
      onClick: () => onSelectTab('venue')
    },
    {
      id: 'jadwal-saya' as MainTabType,
      title: 'Jadwal Saya',
      subtitle: bookmarkCount > 0 ? `${bookmarkCount} Agenda Tersimpan` : 'Agenda Pribadi',
      desc: 'Koleksi sesi dan agenda simposium yang telah Anda pilih serta pengingat notifikasi waktu.',
      icon: BookmarkCheck,
      color: 'cyan',
      gradient: 'from-cyan-600 to-blue-700',
      badgeBg: bookmarkCount > 0 ? 'bg-blue-600 text-white font-black' : 'bg-slate-100 text-slate-700',
      actionText: 'Buka Agenda Saya',
      onClick: onOpenBookmarks
    },
    {
      id: 'presensi' as any,
      title: 'Presensi QR Code',
      subtitle: 'Pindai Kehadiran Sesi',
      desc: 'Pindai barcode/QR Code sesi di ruangan untuk mencatat absensi dan perolehan poin SKP otomatis.',
      icon: QrCode,
      color: 'teal',
      gradient: 'from-teal-600 to-emerald-700',
      badgeBg: 'bg-teal-100 text-teal-800',
      actionText: 'Pindai QR Presensi',
      onClick: onOpenQrScanner
    },
    {
      id: 'profil' as any,
      title: 'Profil & Sertifikat',
      subtitle: 'Akreditasi & Unduh E-Sertifikat',
      desc: 'Lihat akumulasi SKP yang diperoleh, detail registrasi peserta, dan cetak sertifikat ber-barcode.',
      icon: Award,
      color: 'purple',
      gradient: 'from-purple-600 to-indigo-800',
      badgeBg: 'bg-purple-100 text-purple-800',
      actionText: 'Lihat Sertifikat',
      onClick: onOpenProfile
    },
    {
      id: 'admin' as MainTabType,
      title: 'Admin Page',
      subtitle: isAdminAuthenticated ? 'Admin Aktif (Terautentikasi)' : 'Perlu Login Panitia',
      desc: 'Kelola jadwal simposium & workshop, data pembicara, ruangan, peserta, dan pengaturan event.',
      icon: Lock,
      color: 'slate',
      gradient: 'from-slate-800 to-slate-950',
      badgeBg: isAdminAuthenticated ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-400 text-slate-950 font-bold',
      actionText: isAdminAuthenticated ? 'Masuk ke Panel Admin' : 'Login ke Admin Page',
      onClick: onOpenAdmin
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4 space-y-4 animate-in fade-in duration-200">
      
      {/* Event Header Showcase Banner with dynamic palette matching event logo */}
      <section className={`bg-gradient-to-br ${palette.headerFrom} to-slate-950 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-white/10 relative overflow-hidden`}>
        {/* Ambient subtle glow background */}
        <div 
          className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20 opacity-20"
          style={{ backgroundColor: palette.primaryHex }}
        ></div>
        <div 
          className="absolute bottom-0 left-0 w-60 h-60 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20 opacity-15"
          style={{ backgroundColor: palette.accentHex }}
        ></div>

        <div className="relative z-10 space-y-3">
          
          {/* Top Badges: Accreditation, Dates, Venue */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 shadow-2xs ${palette.accentBadge}`}>
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>{info.accreditation}</span>
              </span>

              <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/40 flex items-center gap-1.5 shadow-2xs">
                <CalendarDays className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{info.dateString || `${info.dates.day1} - ${info.dates.day2.split(', ')[1] || info.dates.day2}`}</span>
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium bg-white/5 px-2.5 py-0.5 rounded-lg border border-white/10">
              <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>{info.location}</span>
            </div>
          </div>

          {/* Event Identity & Title */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-0.5">
            <div className="flex items-center gap-3">
              {info.logoUrl ? (
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white p-1.5 border border-white/20 shadow-md shrink-0 flex items-center justify-center overflow-hidden">
                  <img
                    src={info.logoUrl}
                    alt={info.title}
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              ) : null}

              <div className="space-y-0.5">
                <span style={{ color: palette.accentHex }} className="text-[11px] font-extrabold uppercase tracking-widest block">
                  {info.organizer}
                </span>
                <h1 className="text-lg sm:text-2xl font-black tracking-tight text-white leading-snug">
                  {info.title}
                </h1>
                <p className="text-xs text-slate-300 max-w-2xl leading-normal line-clamp-1">
                  {info.theme}
                </p>
              </div>
            </div>

            {/* Current Identified Participant Badge */}
            {currentUser?.name && (
              <div className="self-start md:self-auto bg-white/10 backdrop-blur-xs border border-white/15 p-2 rounded-xl flex items-center gap-2.5 shrink-0">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[9px] text-emerald-300 font-bold uppercase tracking-wider">
                    Peserta Terdaftar
                  </div>
                  <div className="text-xs font-extrabold text-white max-w-[150px] truncate">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-slate-300 truncate max-w-[150px]">
                    {currentUser.institution || currentUser.role}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Event Menus Section Header */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            <h2 className="text-base sm:text-xl font-black text-slate-900">
              Menu Utama Simposium
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Pilih menu untuk menjelajahi kegiatan
          </span>
        </div>
        <p className="text-xs text-slate-600">
          Akses cepat seluruh agenda ilmiah, pelatihan keterampilan, profil pembicara, pameran alkes, serta peta denah lokasi.
        </p>
      </div>

      {/* Grid Menu-Menu Event - 3 items per row like a mobile app (3 columns grid) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3.5 lg:gap-4">
        {eventMenus.map((item) => {
          const Icon = item.icon;
          const isAdminCard = item.id === 'admin';

          return (
            <button
              type="button"
              key={item.id}
              onClick={item.onClick}
              className={`group cursor-pointer rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border text-center flex flex-col items-center justify-between transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 relative overflow-hidden active:scale-95 min-h-[125px] sm:min-h-[160px] ${
                isAdminCard
                  ? 'bg-slate-900 text-white border-slate-800 hover:border-amber-400/50'
                  : 'bg-white text-slate-900 border-slate-200 hover:border-blue-400 shadow-2xs'
              }`}
            >
              {/* Top/Center Icon with notification/badge */}
              <div className="flex flex-col items-center space-y-1.5 sm:space-y-2 w-full">
                <div className="relative">
                  <div className={`w-11 h-11 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center shadow-xs transition-transform group-hover:scale-108 ${
                    isAdminCard
                      ? 'bg-amber-400 text-slate-950'
                      : `bg-gradient-to-br ${item.gradient} text-white shadow-sm`
                  }`}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                </div>

                {/* Title & Subtitle */}
                <div className="w-full px-0.5">
                  <h3 className={`text-xs sm:text-sm font-extrabold tracking-tight leading-tight transition-colors line-clamp-2 ${
                    isAdminCard ? 'text-white group-hover:text-amber-400' : 'text-slate-900 group-hover:text-blue-600'
                  }`}>
                    {item.title}
                  </h3>
                  <p className="hidden sm:block text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                    {item.desc}
                  </p>
                </div>
              </div>

              {/* Bottom Chip / Badge Indicator */}
              <div className="mt-1.5 sm:mt-2 w-full flex justify-center">
                <span className={`px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-full text-[9px] sm:text-[10px] font-bold truncate max-w-full block ${item.badgeBg}`}>
                  {item.subtitle}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Simple Footer Event Info */}
      <div className="text-center pt-4 pb-2 border-t border-slate-200 text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-700">
          {info.title} • {info.organizer}
        </p>
        <p className="text-[11px] text-slate-500">
          Diselenggarakan di {info.location} ({info.city || 'Jakarta'}). Terakreditasi resmi {info.accreditation}.
        </p>
      </div>

    </div>
  );
};
