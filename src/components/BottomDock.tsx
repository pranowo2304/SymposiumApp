import React from 'react';
import { motion } from 'motion/react';
import { 
  Home, 
  Stethoscope, 
  Calendar, 
  Users, 
  MapPin 
} from 'lucide-react';
import { MainTabType } from './MainMenuTabs';
import { SymposiumInfo } from '../types';
import { getThemePalette } from '../utils/themeColors';

export interface BottomDockProps {
  activeTab: MainTabType;
  onSelectTab: (tab: MainTabType) => void;
  workshopCount?: number;
  symposiumCount?: number;
  speakerCount?: number;
  eventInfo?: SymposiumInfo;
  className?: string;
}

interface DockItemConfig {
  id: MainTabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
  badgeLabel?: string;
  accentText: string;
  accentGlow: string;
  activeBgGradient: string;
}

export const BottomDock: React.FC<BottomDockProps> = ({
  activeTab,
  onSelectTab,
  workshopCount,
  symposiumCount,
  speakerCount,
  eventInfo,
  className = ''
}) => {
  const palette = getThemePalette(eventInfo);

  const dockItems: DockItemConfig[] = [
    {
      id: 'home',
      label: 'Beranda',
      icon: Home,
      accentText: 'text-sky-300',
      accentGlow: 'rgba(56, 189, 248, 0.35)',
      activeBgGradient: 'from-sky-600/90 to-blue-700/90'
    },
    {
      id: 'workshop',
      label: 'Workshop',
      icon: Stethoscope,
      count: workshopCount,
      accentText: 'text-emerald-300',
      accentGlow: 'rgba(52, 211, 153, 0.35)',
      activeBgGradient: 'from-emerald-600/90 to-teal-700/90'
    },
    {
      id: 'symposium',
      label: 'Symposium',
      icon: Calendar,
      count: symposiumCount,
      accentText: 'text-indigo-300',
      accentGlow: 'rgba(129, 140, 248, 0.35)',
      activeBgGradient: 'from-indigo-600/90 to-blue-700/90'
    },
    {
      id: 'speaker',
      label: 'Speaker',
      icon: Users,
      count: speakerCount,
      accentText: 'text-amber-300',
      accentGlow: 'rgba(251, 191, 36, 0.35)',
      activeBgGradient: 'from-amber-600/90 to-orange-700/90'
    },
    {
      id: 'venue',
      label: 'Venue Map',
      icon: MapPin,
      accentText: 'text-rose-300',
      accentGlow: 'rgba(251, 113, 133, 0.35)',
      activeBgGradient: 'from-rose-600/90 to-pink-700/90'
    }
  ];

  return (
    <nav
      id="bottom-dock-navigation"
      aria-label="Bottom Dock Menu Navigasi"
      className={`fixed bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.25rem)] max-w-[430px] sm:max-w-[470px] pointer-events-auto ${className}`}
    >
      <div className="relative backdrop-blur-2xl bg-slate-950/85 text-white border border-slate-700/50 shadow-[0_12px_36px_-6px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.08)] rounded-2xl sm:rounded-full px-1.5 py-1.5 sm:px-2 sm:py-1.5">
        <div 
          role="tablist" 
          aria-label="Daftar Menu Navigasi Bawah"
          className="flex items-center justify-between sm:justify-around relative"
        >
          {dockItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <motion.button
                key={item.id}
                role="tab"
                id={`dock-tab-${item.id}`}
                aria-selected={isActive}
                aria-label={`Menu ${item.label}`}
                onClick={() => onSelectTab(item.id)}
                whileTap={{ scale: 0.92 }}
                whileHover={{ scale: 1.04, y: -1 }}
                className={`relative flex-1 flex flex-col items-center justify-center py-1.5 px-1 sm:px-2 rounded-xl sm:rounded-2xl transition-all duration-200 select-none cursor-pointer group min-w-[56px] ${
                  isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {/* Active Indicator Animated Pill Background */}
                {isActive && (
                  <motion.div
                    layoutId="dockActivePill"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    style={{
                      boxShadow: `0 4px 18px ${item.accentGlow}`
                    }}
                    className={`absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-b ${item.activeBgGradient} border border-white/25`}
                  />
                )}

                {/* Icon Container with Badge */}
                <div className="relative z-10 flex items-center justify-center mb-0.5">
                  <Icon
                    className={`w-4 h-4 sm:w-4.5 sm:h-4.5 transition-transform duration-200 ${
                      isActive 
                        ? 'text-white scale-110 drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]' 
                        : 'text-slate-400 group-hover:text-slate-200 group-hover:scale-105'
                    }`}
                  />

                  {/* Micro Count Badge if available */}
                  {item.count !== undefined && item.count > 0 && !isActive && (
                    <span className="absolute -top-1 -right-2 px-1 min-w-[14px] h-3.5 flex items-center justify-center rounded-full text-[9px] font-black bg-slate-800 text-slate-300 border border-slate-700/80 leading-none">
                      {item.count}
                    </span>
                  )}
                </div>

                {/* Text Label */}
                <span
                  className={`relative z-10 text-[10px] sm:text-[11px] font-bold tracking-tight whitespace-nowrap leading-tight transition-colors duration-150 ${
                    isActive
                      ? 'text-white font-extrabold'
                      : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </span>

                {/* Active Glowing Dot Below */}
                {isActive && (
                  <motion.span
                    layoutId="dockActiveDot"
                    className="relative z-10 w-1 h-1 rounded-full bg-white shadow-[0_0_6px_#ffffff] mt-0.5"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                {!isActive && (
                  <span className="w-1 h-1 rounded-full bg-transparent mt-0.5" />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
