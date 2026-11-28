import React, { useEffect, useRef } from 'react';
import { motion, LayoutGroup } from 'motion/react';
import { 
  Users, 
  Calendar, 
  Store, 
  MapPin, 
  Stethoscope,
  Sliders,
  Home,
  Lock,
  Award
} from 'lucide-react';

import { SymposiumInfo } from '../types';
import { getThemePalette } from '../utils/themeColors';

export type MainTabType = 'home' | 'speaker' | 'workshop' | 'symposium' | 'pameran' | 'venue' | 'sertifikat' | 'admin';

interface MainMenuTabsProps {
  activeTab: MainTabType;
  onSelectTab: (tab: MainTabType) => void;
  speakerCount: number;
  workshopCount: number;
  symposiumCount: number;
  exhibitorCount: number;
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
  isAdminAuthenticated,
  eventInfo
}) => {
  const palette = getThemePalette(eventInfo);
  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!navRef.current) return;
    const activeButton = navRef.current.querySelector(`#menu-tab-${activeTab}`) as HTMLElement | null;
    if (activeButton) {
      activeButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeTab]);

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
      id: 'sertifikat' as MainTabType,
      label: 'E-Sertifikat',
      icon: Award,
      badge: 'Unduh',
      badgeHighlight: true,
      color: 'amber'
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
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs"
    >
      <div className="max-w-6xl mx-auto px-2 sm:px-4">
        <LayoutGroup id="main-menu-tabs">
          <nav 
            ref={navRef}
            id="main-navigation-menu"
            aria-label="Menu Utama Simposium"
            className="flex items-center overflow-x-auto no-scrollbar space-x-1 sm:space-x-1.5 py-1.5"
          >
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <motion.button
                  key={item.id}
                  id={`menu-tab-${item.id}`}
                  onClick={() => onSelectTab(item.id)}
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ y: -0.5 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className={`relative py-1.5 px-2.5 sm:px-3 rounded-lg text-xs font-bold transition-all duration-500 ease-out flex items-center justify-center gap-1.5 border shrink-0 cursor-pointer overflow-hidden ${
                    isActive
                      ? 'text-white border-transparent shadow-sm'
                      : 'bg-slate-50/90 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="mainMenuActiveTabPill"
                      initial={{ opacity: 0.5 }}
                      animate={{ opacity: 1 }}
                      style={{ backgroundColor: palette.primaryHex }}
                      className="absolute inset-0 rounded-lg shadow-xs"
                      transition={{
                        layout: { type: 'spring', stiffness: 220, damping: 28, mass: 1 },
                        opacity: { duration: 0.38, ease: [0.16, 1, 0.3, 1] }
                      }}
                    />
                  )}

                  <Icon className={`relative z-10 w-3.5 h-3.5 shrink-0 transition-all duration-500 ease-out ${
                    isActive 
                      ? 'text-amber-200 scale-105' 
                      : item.id === 'workshop' 
                        ? 'text-emerald-600' 
                        : item.id === 'symposium' 
                          ? 'text-blue-600' 
                          : item.id === 'pameran' 
                            ? 'text-amber-600' 
                            : item.id === 'venue' 
                              ? 'text-rose-600' 
                              : item.id === 'sertifikat'
                                ? 'text-amber-500'
                                : 'text-indigo-600'
                  }`} />
                  <span className="relative z-10 whitespace-nowrap tracking-tight transition-colors duration-500 ease-out">
                    {item.label}
                  </span>

                  <span className={`relative z-10 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold whitespace-nowrap leading-none transition-all duration-500 ease-out ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : item.badgeHighlight 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-slate-200 text-slate-700'
                  }`}>
                    {item.badge}
                  </span>
                </motion.button>
              );
            })}
          </nav>
        </LayoutGroup>
      </div>
    </motion.div>
  );
};
