import React, { useState } from 'react';
import { Calendar, Search, MapPin, Sparkles, Filter, Bookmark, Users, Clock, Award } from 'lucide-react';
import { Session, Speaker, SymposiumInfo } from '../types';
import { SESSIONS_DATA, SYMPOSIUM_INFO } from '../data/symposiumData';
import { getThemePalette } from '../utils/themeColors';
import { FilterSection } from './FilterSection';
import { SessionCard } from './SessionCard';

interface SymposiumScheduleViewProps {
  sessions?: Session[];
  bookmarks: string[];
  onToggleBookmark: (sessionId: string) => void;
  onSelectSession: (session: Session, initialTab?: 'abstract' | 'speakers' | 'livechat') => void;
  onSelectSpeaker: (speaker: Speaker) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  eventInfo?: SymposiumInfo;
}

export const SymposiumScheduleView: React.FC<SymposiumScheduleViewProps> = ({
  sessions,
  bookmarks,
  onToggleBookmark,
  onSelectSession,
  onSelectSpeaker,
  searchQuery,
  onSearchChange,
  eventInfo
}) => {
  const info = eventInfo || SYMPOSIUM_INFO;
  const palette = getThemePalette(info);

  const sourceSessions = sessions && sessions.length > 0 ? sessions : SESSIONS_DATA;

  // Compute available days dynamically from actual sessions
  const availableDays = React.useMemo(() => {
    const orderPriority = ['Workshop (28 Nov)', 'Pre-Congress', 'Hari I', 'Hari II', 'Hari III'];
    const uniqueDays = Array.from(new Set<string>(sourceSessions.map(s => s.day)));

    const sortedDays = uniqueDays.sort((a: string, b: string) => {
      const idxA = orderPriority.indexOf(a);
      const idxB = orderPriority.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    return sortedDays.map(dayKey => {
      const matching = sourceSessions.filter(s => s.day === dayKey);
      return {
        key: dayKey,
        label: dayKey,
        dateString: matching[0]?.date || '',
        count: matching.length
      };
    });
  }, [sourceSessions]);

  const [activeDay, setActiveDay] = useState<string>(() => {
    return 'Hari I';
  });

  const [selectedRoom, setSelectedRoom] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua Kategori');

  const daySessions = activeDay === 'all' 
    ? sourceSessions 
    : sourceSessions.filter(s => s.day === activeDay);

  const filteredSessions = daySessions.filter(session => {
    // Room Filter
    if (selectedRoom !== 'all' && session.room !== selectedRoom) {
      return false;
    }

    // Category Filter
    if (selectedCategory !== 'Semua Kategori' && !session.category.includes(selectedCategory)) {
      return false;
    }

    // Search Query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchTitle = session.title.toLowerCase().includes(q);
      const matchRoom = session.room.toLowerCase().includes(q);
      const matchCategory = session.category.toLowerCase().includes(q);
      const matchSpeaker = session.speakers.some(sp => 
        sp.name.toLowerCase().includes(q) || 
        sp.specialty.toLowerCase().includes(q) ||
        sp.institution.toLowerCase().includes(q)
      );
      const matchAbstract = 
        session.abstract.background.toLowerCase().includes(q) ||
        session.abstract.clinicalUpdates.some(u => u.toLowerCase().includes(q));

      if (!matchTitle && !matchRoom && !matchCategory && !matchSpeaker && !matchAbstract) {
        return false;
      }
    }

    return true;
  });

  const currentDayInfo = availableDays.find(d => d.key === activeDay);
  const bannerTitle = activeDay === 'all'
    ? `Seluruh Jadwal Acara (${info.dateString || '28 November - 1 Desember 2026'})`
    : currentDayInfo?.dateString
      ? `${activeDay}: ${currentDayInfo.dateString}`
      : activeDay;

  return (
    <div className="max-w-6xl mx-auto p-2.5 sm:p-4 space-y-3 animate-in fade-in duration-200">
      
      {/* Day Selector Banner - Compact */}
      <div className={`bg-gradient-to-r ${palette.headerFrom} to-slate-950 text-white rounded-xl p-3 sm:p-4 shadow-xs border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3`}>
        <div>
          <div className="flex items-center space-x-1.5 text-[11px] font-bold uppercase tracking-wider mb-0.5" style={{ color: palette.accentHex }}>
            <Calendar className="w-3.5 h-3.5" />
            <span>Jadwal Konferensi & Simposium Ilmiah</span>
          </div>
          <h2 className="text-sm sm:text-base font-black text-white">
            {bannerTitle}
          </h2>
          <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">
            {info.title} • {info.location}
          </p>
        </div>

        {/* Day Switcher Toggle - Multi-day buttons */}
        <div className="bg-white/10 p-1 rounded-xl border border-white/10 flex flex-wrap items-center gap-1 self-start md:self-auto shrink-0">
          {availableDays.map(dayItem => {
            const isActive = activeDay === dayItem.key;
            return (
              <button
                key={dayItem.key}
                type="button"
                onClick={() => setActiveDay(dayItem.key)}
                style={isActive ? { backgroundColor: palette.primaryHex } : undefined}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'text-white shadow-xs font-black'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
                title={dayItem.dateString ? `${dayItem.label} (${dayItem.dateString})` : dayItem.label}
              >
                <span>{dayItem.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  isActive ? 'bg-white text-slate-900' : 'bg-white/20 text-slate-300'
                }`}>
                  {dayItem.count}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setActiveDay('all')}
            style={activeDay === 'all' ? { backgroundColor: palette.primaryHex } : undefined}
            className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeDay === 'all'
                ? 'text-white shadow-xs font-black'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>Semua ({sourceSessions.length})</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <FilterSection
        selectedRoom={selectedRoom}
        onSelectRoom={setSelectedRoom}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onResetFilters={() => {
          setSelectedRoom('all');
          setSelectedCategory('Semua Kategori');
          onSearchChange('');
        }}
        totalResults={filteredSessions.length}
      />

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 my-4 space-y-3">
          <Search className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">
            Tidak Ada Sesi Ditemukan
          </h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Cobalah merubah pencarian kata kunci atau menyetel ulang filter ruangan dan kategori.
          </p>
          <button
            onClick={() => {
              setSelectedRoom('all');
              setSelectedCategory('Semua Kategori');
              onSearchChange('');
            }}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Reset Semua Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredSessions.map(session => (
            <SessionCard
              key={session.id}
              session={session}
              isBookmarked={bookmarks.includes(session.id)}
              onToggleBookmark={onToggleBookmark}
              onSelectSession={onSelectSession}
              onSelectSpeaker={onSelectSpeaker}
            />
          ))}
        </div>
      )}

    </div>
  );
};
