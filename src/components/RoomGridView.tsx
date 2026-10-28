import React, { useState } from 'react';
import { DoorOpen, Clock, Calendar, User, FileText, ChevronRight } from 'lucide-react';
import { Session, Speaker, Room } from '../types';
import { SESSIONS_DATA, ROOMS_LIST } from '../data/symposiumData';

interface RoomGridViewProps {
  rooms?: Room[];
  sessions?: Session[];
  onSelectSession: (session: Session) => void;
  onSelectSpeaker: (speaker: Speaker) => void;
}

export const RoomGridView: React.FC<RoomGridViewProps> = ({
  rooms,
  sessions,
  onSelectSession,
  onSelectSpeaker
}) => {
  const sourceSessions = sessions && sessions.length > 0 ? sessions : SESSIONS_DATA;

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

  const [selectedDay, setSelectedDay] = useState<string>('Hari I');

  const daySessions = selectedDay === 'all'
    ? sourceSessions
    : sourceSessions.filter(s => s.day === selectedDay);

  // Derive rooms list from props or ROOMS_LIST
  const activeRooms = rooms && rooms.length > 0 
    ? rooms.map(r => ({ id: r.name, label: r.name, floor: r.floor }))
    : ROOMS_LIST.filter(r => r.id !== 'all');

  return (
    <div className="max-w-5xl mx-auto p-3 sm:p-5 space-y-5 animate-in fade-in duration-200">
      
      {/* View Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <DoorOpen className="w-5 h-5 text-emerald-600" />
            Matriks Jadwal Berdasarkan Ruangan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Lihat susunan agenda simposium per lokasi hall & ruang workshop.
          </p>
        </div>

        {/* Toggle Day */}
        <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto gap-1">
          {availableDays.map(d => {
            const isSelected = selectedDay === d.key;
            return (
              <button
                key={d.key}
                type="button"
                onClick={() => setSelectedDay(d.key)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
                title={d.dateString}
              >
                {d.label} ({d.count})
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setSelectedDay('all')}
            className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              selectedDay === 'all'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            Semua ({sourceSessions.length})
          </button>
        </div>
      </div>

      {/* Grid of Rooms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activeRooms.map(roomObj => {
          const roomSessions = daySessions.filter(s => s.room === roomObj.id);
          
          if (roomSessions.length === 0) return null;

          return (
            <div 
              key={roomObj.id} 
              className={`bg-white rounded-2xl border-2 border-l-4 p-4 shadow-xs ${roomObj.color}`}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                <div className="flex items-center space-x-2">
                  <DoorOpen className="w-4 h-4 text-slate-700" />
                  <h3 className="font-bold text-sm text-slate-900">
                    {roomObj.name}
                  </h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full">
                  {roomObj.floor}
                </span>
              </div>

              <div className="space-y-3">
                {roomSessions.map(session => (
                  <div
                    key={session.id}
                    onClick={() => onSelectSession(session)}
                    className="p-3 bg-white hover:bg-sky-50/60 rounded-xl border border-slate-200/80 hover:border-sky-300 transition-all cursor-pointer group space-y-2"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="inline-flex items-center font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        <Clock className="w-3 h-3 mr-1 text-sky-600" />
                        {session.timeString}
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                        {session.category}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-sky-800 leading-snug">
                      {session.title}
                    </h4>

                    {/* Speakers avatars */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                      <div className="flex -space-x-2 overflow-hidden">
                        {session.speakers.map(sp => (
                          <img
                            key={sp.id}
                            src={sp.photoUrl}
                            alt={sp.name}
                            title={sp.name}
                            className="w-6 h-6 rounded-full object-cover ring-2 ring-white"
                          />
                        ))}
                      </div>
                      <span className="text-sky-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center text-[10px]">
                        Detail <ChevronRight className="w-3 h-3 ml-0.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
