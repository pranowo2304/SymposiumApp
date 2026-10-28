import React, { useState } from 'react';
import { Bookmark, MapPin, Search, Smartphone, Monitor, Award, QrCode, User, Sliders, Lock, ShieldCheck, ChevronDown } from 'lucide-react';
import { SYMPOSIUM_INFO } from '../data/symposiumData';
import { Participant, SymposiumInfo } from '../types';
import { getThemePalette } from '../utils/themeColors';

interface HeaderProps {
  bookmarkedCount: number;
  onOpenBookmarks: () => void;
  onOpenQrScanner: () => void;
  onOpenProfile: () => void;
  onOpenAdmin: () => void;
  totalSkpPoints: number;
  isMobileFrame: boolean;
  onToggleFrame: () => void;
  activeTab: string;
  onSelectTab: (tab: any) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  currentUser: Participant;
  onOpenEmailIdentification: () => void;
  eventInfo?: SymposiumInfo;
  isAdminAuthenticated?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  bookmarkedCount,
  onOpenBookmarks,
  onOpenQrScanner,
  onOpenProfile,
  onOpenAdmin,
  totalSkpPoints,
  isMobileFrame,
  onToggleFrame,
  activeTab,
  onSelectTab,
  searchQuery,
  onSearchChange,
  currentUser,
  onOpenEmailIdentification,
  eventInfo,
  isAdminAuthenticated
}) => {
  const info = eventInfo || SYMPOSIUM_INFO;
  const palette = getThemePalette(info);
  const [showSearchMobile, setShowSearchMobile] = useState(false);

  return (
    <header className="bg-white/95 backdrop-blur-md text-slate-900 shadow-xs sticky top-0 z-30 border-b border-slate-200/80">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2">
        {/* Compact Single Row Header */}
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          
          {/* Brand Logo & Compact Title */}
          <div 
            className="cursor-pointer flex items-center gap-2 sm:gap-2.5 min-w-0 shrink group" 
            onClick={() => onSelectTab('home')}
            title="Klik untuk ke Beranda"
          >
            {info.logoUrl ? (
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-slate-50 border border-slate-200 p-0.5 shrink-0 flex items-center justify-center overflow-hidden shadow-2xs group-hover:border-slate-300 transition-colors">
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

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-base font-extrabold text-slate-900 truncate leading-tight group-hover:text-blue-600 transition-colors">
                  {info.title}
                </h1>
                <span 
                  style={{ color: palette.primaryHex }} 
                  className="hidden lg:inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 shrink-0"
                >
                  {info.accreditation}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate hidden md:block font-normal">
                {info.theme} • <span className="text-slate-400">{info.location}</span>
              </p>
            </div>
          </div>

          {/* Center Search Input (Desktop/Tablet) */}
          <div className="hidden sm:block relative w-48 md:w-60 lg:w-72 shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari tema, pembicara, sesi..."
              style={{
                borderColor: searchQuery ? palette.primaryHex : undefined
              }}
              className="w-full bg-slate-50 hover:bg-slate-100/80 text-slate-800 text-xs pl-8 pr-7 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:bg-white transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Right Action Icons & Badges */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            
            {/* Search Toggle for Mobile */}
            <button
              onClick={() => setShowSearchMobile(!showSearchMobile)}
              className="sm:hidden p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              title="Cari"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Presensi QR */}
            <button
              onClick={onOpenQrScanner}
              title="Absensi & Pindai QR Code SKP"
              className="px-2 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors text-xs font-bold flex items-center gap-1 border border-blue-200 shrink-0"
            >
              <QrCode className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="hidden sm:inline">Presensi QR</span>
            </button>

            {/* Jadwal Saya */}
            <button
              onClick={onOpenBookmarks}
              title="Jadwal Saya"
              className={`relative px-2 py-1.5 rounded-lg flex items-center gap-1 text-xs font-bold transition-all shrink-0 ${
                bookmarkedCount > 0
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 fill-current shrink-0" />
              <span className="hidden md:inline">Jadwal Saya</span>
              {bookmarkedCount > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] bg-white text-blue-700 rounded-full font-black">
                  {bookmarkedCount}
                </span>
              )}
            </button>

            {/* Profil Peserta / SKP */}
            <button
              onClick={onOpenProfile}
              title={`Profil & Sertifikat (${totalSkpPoints.toFixed(1)} SKP)`}
              className={`px-2 py-1.5 rounded-lg transition-colors text-xs font-bold flex items-center gap-1 border shrink-0 ${
                totalSkpPoints >= 5.0
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="hidden lg:inline">Sertifikat</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                totalSkpPoints >= 5.0 ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-700'
              }`}>
                {totalSkpPoints.toFixed(1)} SKP
              </span>
            </button>

            {/* Identifikasi Email User Button */}
            <button
              onClick={onOpenEmailIdentification}
              title={currentUser?.name ? `Akun: ${currentUser.name} (${currentUser.email || ''}). Klik untuk ganti.` : 'Identifikasi'}
              className="px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 rounded-lg transition-colors text-xs font-bold flex items-center gap-1 border border-emerald-200 shrink-0"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              <span className="max-w-[70px] sm:max-w-[100px] truncate text-[11px] font-bold">
                {currentUser?.name ? currentUser.name.split(' ')[0] : 'Akun'}
              </span>
            </button>

            {/* Admin Access Button */}
            <button
              id="header-btn-admin"
              onClick={onOpenAdmin}
              title={isAdminAuthenticated ? "Buka Panel Admin Simposium" : "Login Admin"}
              className={`px-2 py-1.5 rounded-lg transition-colors text-xs font-black flex items-center gap-1 border shadow-2xs shrink-0 ${
                isAdminAuthenticated 
                  ? 'bg-amber-400 text-slate-950 border-amber-500 hover:bg-amber-300' 
                  : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-slate-700'
              }`}
            >
              {isAdminAuthenticated ? (
                <>
                  <Sliders className="w-3.5 h-3.5 text-slate-950" />
                  <span className="hidden sm:inline">Admin</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Admin</span>
                </>
              )}
            </button>

            {/* Frame switcher (desktop only) */}
            <button
              onClick={onToggleFrame}
              title={isMobileFrame ? "Mode Monitor Penuh" : "Mode Ponsel"}
              className="hidden xl:flex p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {isMobileFrame ? <Monitor className="w-3.5 h-3.5 text-blue-600" /> : <Smartphone className="w-3.5 h-3.5 text-slate-500" />}
            </button>

          </div>
        </div>

        {/* Expandable Mobile Search Bar */}
        {showSearchMobile && (
          <div className="sm:hidden pt-2 pb-1">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Cari tema, pembicara, sesi..."
                autoFocus
                className="w-full bg-slate-100 text-slate-800 text-xs pl-8 pr-7 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:bg-white"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2 top-1.5 text-slate-400 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
