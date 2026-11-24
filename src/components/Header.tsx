import React, { useState } from 'react';
import { Search, Smartphone, Monitor, Sliders, Lock, Download, LogOut } from 'lucide-react';
import { SYMPOSIUM_INFO } from '../data/symposiumData';
import { SymposiumInfo } from '../types';
import { getThemePalette } from '../utils/themeColors';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface HeaderProps {
  onOpenAdmin: () => void;
  onAdminLogout?: () => void;
  onOpenInstallModal?: () => void;
  isMobileFrame: boolean;
  onToggleFrame: () => void;
  activeTab: string;
  onSelectTab: (tab: any) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  eventInfo?: SymposiumInfo;
  isAdminAuthenticated?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAdmin,
  onAdminLogout,
  onOpenInstallModal,
  isMobileFrame,
  onToggleFrame,
  activeTab,
  onSelectTab,
  searchQuery,
  onSearchChange,
  eventInfo,
  isAdminAuthenticated
}) => {
  const info = eventInfo || SYMPOSIUM_INFO;
  const palette = getThemePalette(info);
  const [showSearchMobile, setShowSearchMobile] = useState(false);
  const { isInstallable, isInstalled, installApp } = usePWAInstall();

  const handleInstallClick = async () => {
    if (isInstallable) {
      const outcome = await installApp();
      if (outcome === 'unavailable' && onOpenInstallModal) {
        onOpenInstallModal();
      }
    } else if (onOpenInstallModal) {
      onOpenInstallModal();
    }
  };

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

            {/* Install Aplikasi Mobile (PWA) Button */}
            {!isInstalled && (
              <button
                onClick={handleInstallClick}
                title="Install Aplikasi Mobile ke Layar Utama HP"
                className="px-2 py-1.5 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg transition-all text-xs font-bold flex items-center gap-1 shadow-2xs shrink-0 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span className="hidden md:inline">Install App</span>
              </button>
            )}

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

            {/* Admin Logout Button (visible when authenticated as Admin) */}
            {isAdminAuthenticated && onAdminLogout && (
              <button
                id="header-btn-admin-logout"
                type="button"
                onClick={onAdminLogout}
                title="Logout dari Admin"
                className="px-2 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white border border-rose-700 transition-colors text-xs font-black flex items-center gap-1 shadow-2xs shrink-0 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}

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
