import React, { useState } from 'react';
import { 
  Stethoscope, 
  Calendar, 
  Clock, 
  MapPin, 
  Search,
  Filter,
  RotateCcw
} from 'lucide-react';
import { Session, Speaker } from '../types';
import { SESSIONS_DATA } from '../data/symposiumData';
import { SessionCard } from './SessionCard';

interface WorkshopScheduleViewProps {
  sessions?: Session[];
  onSelectSession: (session: Session, initialTab?: 'abstract' | 'speakers' | 'livechat') => void;
  onSelectSpeaker: (speaker: Speaker) => void;
  bookmarks: string[];
  onToggleBookmark: (sessionId: string) => void;
  onOpenVenue: () => void;
}

export const WorkshopScheduleView: React.FC<WorkshopScheduleViewProps> = ({
  sessions,
  onSelectSession,
  onSelectSpeaker,
  bookmarks,
  onToggleBookmark,
  onOpenVenue
}) => {
  const [selectedRoom, setSelectedRoom] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const sourceSessions = sessions && sessions.length > 0 ? sessions : SESSIONS_DATA;
  const workshops = React.useMemo(() => {
    return sourceSessions
      .filter(s => s.type === 'Workshop Hands-On' || s.category.includes('Workshop') || s.day.includes('Workshop'))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [sourceSessions]);

  const availableRooms = React.useMemo(() => {
    return Array.from(new Set(workshops.map(w => w.room)));
  }, [workshops]);

  const availableCategories = React.useMemo(() => {
    return Array.from(new Set(workshops.map(w => w.category)));
  }, [workshops]);

  const filteredWorkshops = workshops.filter(session => {
    if (selectedRoom !== 'all' && session.room !== selectedRoom) {
      return false;
    }

    if (selectedCategory !== 'all' && session.category !== selectedCategory) {
      return false;
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchTitle = session.title.toLowerCase().includes(q);
      const matchTime = session.timeString.toLowerCase().includes(q);
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

      if (!matchTitle && !matchTime && !matchRoom && !matchCategory && !matchSpeaker && !matchAbstract) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="max-w-6xl mx-auto p-2.5 sm:p-4 space-y-3 animate-in fade-in duration-200">
      
      {/* Top Banner - Like Symposium Schedule */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-950 text-white rounded-xl p-3 sm:p-4 border border-emerald-800/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-1.5 text-emerald-300 text-[11px] font-bold uppercase tracking-wider mb-0.5">
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Jadwal Sesi & Jam Pre-Congress Workshop (Hands-On)</span>
          </div>
          <h2 className="text-sm sm:text-base font-black text-white">
            Sabtu, 28 November 2026 • The Sunan Hotel Solo (Ground Floor)
          </h2>
          <p className="text-xs text-emerald-100/80 mt-0.5">
            Workshop Versus - MASS Hunt (08:00 - 17:00 WIB) & Workshop Vet Nurse (09:00 - 17:00 WIB)
          </p>
        </div>

        {/* Track / Room Switcher Toggle (Like Symposium Day Switcher) */}
        <div className="bg-white/10 p-1 rounded-xl border border-white/10 flex flex-wrap items-center gap-1 self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setSelectedRoom('all')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedRoom === 'all'
                ? 'bg-emerald-500 text-slate-950 shadow-xs font-black'
                : 'text-slate-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <span>Semua Sesi</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              selectedRoom === 'all' ? 'bg-slate-950 text-emerald-300' : 'bg-white/20 text-slate-200'
            }`}>
              {workshops.length}
            </span>
          </button>

          {availableRooms.map(roomName => {
            const count = workshops.filter(w => w.room === roomName).length;
            const isActive = selectedRoom === roomName;
            return (
              <button
                key={roomName}
                type="button"
                onClick={() => setSelectedRoom(roomName)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 shadow-xs font-black'
                    : 'text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <MapPin className="w-3 h-3" />
                <span>{roomName}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  isActive ? 'bg-slate-950 text-emerald-300' : 'bg-white/20 text-slate-200'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Toolbar (Like Symposium FilterSection) */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs space-y-2.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari sesi workshop berdasarkan jam (cth: 08:30), judul sesi, ruangan, atau instruktur..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            {/* Category Filter */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">Semua Track Workshop</option>
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={onOpenVenue}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span>Peta Ruangan</span>
            </button>

            {(selectedRoom !== 'all' || selectedCategory !== 'all' || searchQuery !== '') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedRoom('all');
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-slate-100 text-[11px] text-slate-500">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-700">Track Ruangan:</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
              <Clock className="w-3 h-3 text-amber-600" />
              Antareja Room: Workshop Versus (08:00 - 17:00 WIB)
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-violet-50 text-violet-800 border border-violet-200 font-semibold">
              <Clock className="w-3 h-3 text-violet-600" />
              Wisanggeni Room: Workshop Vet Nurse (09:00 - 17:00 WIB)
            </span>
          </div>
          <span className="font-bold text-emerald-700">
            Menampilkan {filteredWorkshops.length} Sesi Workshop
          </span>
        </div>
      </div>

      {/* Workshop Sessions List - Using SessionCard just like SymposiumScheduleView */}
      {filteredWorkshops.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 my-4 space-y-3">
          <Search className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">
            Tidak Ada Sesi Workshop Ditemukan
          </h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Cobalah mengubah kata kunci pencarian atau menyetel ulang filter ruangan dan track workshop.
          </p>
          <button
            onClick={() => {
              setSelectedRoom('all');
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Reset Semua Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredWorkshops.map(session => (
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

