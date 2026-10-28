import React from 'react';
import { 
  Users, 
  Stethoscope, 
  Calendar, 
  Store, 
  MapPin, 
  Award, 
  Clock, 
  ChevronRight, 
  Sparkles, 
  ShieldCheck,
  Sliders
} from 'lucide-react';
import { SYMPOSIUM_INFO } from '../data/symposiumData';
import { MainTabType } from './MainMenuTabs';
import { SymposiumInfo } from '../types';

interface LandingHeroMenuProps {
  activeTab: MainTabType;
  onSelectTab: (tab: MainTabType) => void;
  speakerCount: number;
  workshopCount: number;
  symposiumCount: number;
  exhibitorCount: number;
  onOpenAdmin?: () => void;
  eventInfo?: SymposiumInfo;
}

export const LandingHeroMenu: React.FC<LandingHeroMenuProps> = ({
  activeTab,
  onSelectTab,
  speakerCount,
  workshopCount,
  symposiumCount,
  exhibitorCount,
  onOpenAdmin,
  eventInfo
}) => {
  const info = eventInfo || SYMPOSIUM_INFO;
  const cards = [
    {
      id: 'speaker' as MainTabType,
      title: 'Daftar Speaker',
      desc: 'Profil narasumber, instruktur workshop, pakar onkologi & presidium.',
      badge: `${speakerCount} Narasumber`,
      icon: Users,
      gradient: 'from-blue-600 to-indigo-700',
      tagColor: 'bg-blue-100 text-blue-800'
    },
    {
      id: 'workshop' as MainTabType,
      title: 'Jadwal Workshop',
      desc: 'Workshop Versus MASS Hunt & Vet Nurse Excellence Track (28 Nov 2026).',
      badge: `${workshopCount} Hands-On Skill`,
      icon: Stethoscope,
      gradient: 'from-emerald-600 to-teal-700',
      tagColor: 'bg-emerald-100 text-emerald-800'
    },
    {
      id: 'symposium' as MainTabType,
      title: 'Jadwal Symposium',
      desc: 'Plenary keynote WSAVA, simposium paralel onkologi, masterclass & sidang munas.',
      badge: `${symposiumCount} Sesi Terjadwal`,
      icon: Calendar,
      gradient: 'from-indigo-600 to-slate-800',
      tagColor: 'bg-indigo-100 text-indigo-800'
    },
    {
      id: 'pameran' as MainTabType,
      title: 'Pameran',
      desc: 'Medical expo farmasi veteriner, instrumen bedah hewan, USG & anestesi.',
      badge: `${exhibitorCount} Booth Expo`,
      icon: Store,
      gradient: 'from-amber-600 to-orange-700',
      tagColor: 'bg-amber-100 text-amber-800'
    },
    {
      id: 'venue' as MainTabType,
      title: 'Venue',
      desc: 'Denah interaktif Ballroom Amartapura A & B, Ruang Antareja, Wisanggeni & Foyer.',
      badge: info.location || 'Ballroom Amartapura',
      icon: MapPin,
      gradient: 'from-rose-600 to-pink-700',
      tagColor: 'bg-rose-100 text-rose-800'
    }
  ];

  return (
    <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white border-b border-slate-800">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 pt-5 pb-6 space-y-4">
        
        {/* Top Badges & Title */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              {info.accreditation}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
              {info.dateString || `${info.dates.day1} - ${info.dates.day2.split(', ')[1] || info.dates.day2}`}
            </span>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-1 font-medium">
            <MapPin className="w-3.5 h-3.5 text-rose-400" />
            <span>{info.location}</span>
          </div>
        </div>

        {/* Hero Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3.5">
            {info.logoUrl ? (
              <div className="w-12 h-12 rounded-xl bg-white p-1 border border-slate-700 shadow-md shrink-0 flex items-center justify-center overflow-hidden hidden sm:flex">
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
            <div className="space-y-1">
              <h2 className="text-lg sm:text-2xl font-black tracking-tight text-white">
                {info.title ? `Portal Informasi & Navigasi: ${info.title}` : 'Portal Informasi & Navigasi Simposium 2026'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                Pilih menu di bawah untuk melihat susunan acara ilmiah, direktori narasumber, pelatihan hands-on, booth pameran medis, serta denah gedung.
              </p>
            </div>
          </div>

          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="self-start sm:self-auto px-3.5 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md shrink-0"
              title="Buka Halaman Admin untuk Input dan Kelola Data"
            >
              <Sliders className="w-4 h-4 text-slate-950" />
              <span>Admin Page (Input Data)</span>
            </button>
          )}
        </div>

        {/* Main Menu Cards - 3 per row on mobile/tablet */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-1">
          {cards.map((item) => {
            const Icon = item.icon;
            const isSelected = activeTab === item.id;

            return (
              <button
                key={item.id}
                id={`hero-menu-card-${item.id}`}
                onClick={() => onSelectTab(item.id)}
                className={`text-left p-3 sm:p-3.5 rounded-2xl border transition-all flex flex-col justify-between group relative overflow-hidden ${
                  isSelected
                    ? 'bg-slate-800/95 border-amber-400 shadow-md ring-2 ring-amber-400/40'
                    : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/80 hover:border-slate-600'
                }`}
              >
                {/* Accent Top Bar */}
                <div className={`h-1 w-full absolute top-0 left-0 bg-gradient-to-r ${item.gradient}`} />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white shadow-xs`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                      isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-700 text-slate-200'
                    }`}>
                      {item.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-white group-hover:text-amber-300 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-snug">
                      {item.desc}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-700/50 flex items-center justify-between text-[11px] font-bold text-slate-300 group-hover:text-white">
                  <span>Buka Menu</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-amber-400" />
                </div>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
};
