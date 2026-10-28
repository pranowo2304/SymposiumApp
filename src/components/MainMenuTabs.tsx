import React from 'react';
import { 
  Users, 
  Sparkles, 
  Calendar, 
  Store, 
  MapPin, 
  BookmarkCheck,
  Stethoscope,
  Sliders,
  Home,
  Lock
} from 'lucide-react';

import { SymposiumInfo } from '../types';
import { getThemePalette } from '../utils/themeColors';

export type MainTabType = 'home' | 'speaker' | 'workshop' | 'symposium' | 'pameran' | 'venue' | 'jadwal-saya' | 'admin';

interface MainMenuTabsProps {
  activeTab: MainTabType;
  onSelectTab: (tab: MainTabType) => void;
  speakerCount: number;
  workshopCount: number;
  symposiumCount: number;
  exhibitorCount: number;
  bookmarkCount: number;
  isAdminAuthenticated?: boolean;
  eventInfo?: SymposiumInfo;
}

export const MainMenuTabs: React.FC<MainMenuTabsProps> = ({
  activeTab,
  onSelectTab,
  speakerCount,
  workshopCount,
  symposiumCount,
  exhibitorCount,
  bookmarkCount,
  isAdminAuthenticated,
  eventInfo
}) => {
  const palette = getThemePalette(eventInfo);

  const menuItems = [
    {
      id: 'home' as MainTabType,
      label: 'Beranda',
      icon: Home,
      badge: 'Portal',
      color: 'slate'
    },
    {
      id: 'speaker' as MainTabType,
      label: 'Daftar Speaker',
      icon: Users,
      badge: `${speakerCount}`,
      color: 'blue'
    },
    {
      id: 'workshop' as MainTabType,
      label: 'Jadwal Workshop',
      icon: Stethoscope,
      badge: `${workshopCount} Hands-On`,
      badgeHighlight: true,
      color: 'emerald'
    },
    {
      id: 'symposium' as MainTabType,
      label: 'Jadwal Symposium',
      icon: Calendar,
      badge: `${symposiumCount} Sesi`,
      color: 'indigo'
    },
    {
      id: 'pameran' as MainTabType,
      label: 'Pameran',
      icon: Store,
      badge: `${exhibitorCount} Booth`,
      color: 'amber'
    },
    {
      id: 'venue' as MainTabType,
      label: 'Venue',
      icon: MapPin,
      badge: 'Denah 3 Lt',
      color: 'rose'
    },
    {
      id: 'admin' as MainTabType,
      label: 'Admin Page',
      icon: isAdminAuthenticated ? Sliders : Lock,
      badge: isAdminAuthenticated ? 'Aktif' : 'Login',
      badgeHighlight: false,
      color: 'amber'
    }
  ];

  return (
    <div className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-[48px] sm:top-[52px] z-20 shadow-2xs">
      <div className="max-w-6xl mx-auto px-2 sm:px-4">
        <nav 
          id="main-navigation-menu"
          aria-label="Menu Utama Simposium"
          className="flex items-center overflow-x-auto no-scrollbar space-x-1 sm:space-x-1.5 py-1"
        >
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                id={`menu-tab-${item.id}`}
                onClick={() => onSelectTab(item.id)}
                style={isActive ? { backgroundColor: palette.primaryHex, borderColor: palette.primaryHex } : undefined}
                className={`py-1.5 px-2.5 sm:px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 border shrink-0 ${
                  isActive
                    ? 'text-white shadow-xs ring-1 ring-white/20'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${
                  isActive 
                    ? 'text-amber-200' 
                    : item.id === 'workshop' 
                      ? 'text-emerald-600' 
                      : item.id === 'symposium' 
                        ? 'text-blue-600' 
                        : item.id === 'pameran' 
                          ? 'text-amber-600' 
                          : item.id === 'venue' 
                            ? 'text-rose-600' 
                            : 'text-indigo-600'
                }`} />
                <span className="whitespace-nowrap tracking-tight">{item.label}</span>

                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold whitespace-nowrap leading-none ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : item.badgeHighlight 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-slate-200 text-slate-700'
                }`}>
                  {item.badge}
                </span>
              </button>
            );
          })}

          {/* Optional bookmark tab shortcut if user has bookmarks */}
          {bookmarkCount > 0 && (
            <button
              id="menu-tab-jadwal-saya"
              onClick={() => onSelectTab('jadwal-saya')}
              style={activeTab === 'jadwal-saya' ? { backgroundColor: palette.primaryHex, borderColor: palette.primaryHex } : undefined}
              className={`py-1.5 px-2.5 sm:px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 border whitespace-nowrap shrink-0 ${
                activeTab === 'jadwal-saya'
                  ? 'text-white shadow-xs'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200'
              }`}
            >
              <BookmarkCheck className={`w-3.5 h-3.5 ${activeTab === 'jadwal-saya' ? 'text-white' : 'text-blue-500'} fill-current`} />
              <span>Jadwal Saya</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === 'jadwal-saya' ? 'bg-white text-slate-900' : 'bg-blue-600 text-white'
              }`}>
                {bookmarkCount}
              </span>
            </button>
          )}
        </nav>
      </div>
    </div>
  );
};
