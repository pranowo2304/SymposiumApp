import React, { useState } from 'react';
import { 
  Stethoscope, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Award, 
  Sparkles, 
  CheckCircle2, 
  Bookmark, 
  ChevronRight, 
  Layers, 
  AlertCircle,
  FileText,
  MessageSquare
} from 'lucide-react';
import { Session, Speaker } from '../types';
import { SESSIONS_DATA } from '../data/symposiumData';

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
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('all');

  const sourceSessions = sessions && sessions.length > 0 ? sessions : SESSIONS_DATA;
  const workshops = sourceSessions.filter(
    s => s.type === 'Workshop Hands-On' || s.category.includes('Workshop')
  );

  const availableWorkshopDays = React.useMemo(() => {
    return Array.from(new Set(workshops.map(w => w.day)));
  }, [workshops]);

  const filteredWorkshops = workshops.filter(w => {
    if (selectedDayFilter === 'all') return true;
    return w.day === selectedDayFilter;
  });

  return (
    <div className="max-w-6xl mx-auto p-2.5 sm:p-4 space-y-3 animate-in fade-in duration-200">
      
      {/* Top Banner - Compact */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white rounded-xl p-3 sm:p-4 border border-emerald-800/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-1.5 text-emerald-300 text-[11px] font-bold uppercase tracking-wider">
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Program Keterampilan Hands-On</span>
              <span>•</span>
              <span className="text-amber-300">Kuota Terbatas</span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-white">
              Jadwal Workshop & Simulasi Medis
            </h2>
          </div>

          <div className="bg-emerald-500/20 border border-emerald-400/30 rounded-lg px-2.5 py-1 text-center shrink-0 self-start sm:self-auto flex items-center gap-2">
            <span className="text-xs font-black text-amber-300">+2.5 SKP / Sesi</span>
            <span className="text-[10px] text-emerald-200 block">• Sertifikat Khusus</span>
          </div>
        </div>

        {/* Day Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-emerald-800/60 mt-2">
          <span className="text-xs font-bold text-emerald-200">Hari:</span>
          <button
            onClick={() => setSelectedDayFilter('all')}
            className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
              selectedDayFilter === 'all'
                ? 'bg-emerald-400 text-slate-950 shadow-xs font-black'
                : 'bg-emerald-900/60 hover:bg-emerald-900 text-emerald-100'
            }`}
          >
            Semua ({workshops.length})
          </button>
          {availableWorkshopDays.map(dayName => {
            const count = workshops.filter(w => w.day === dayName).length;
            const isSelected = selectedDayFilter === dayName;
            return (
              <button
                key={dayName}
                onClick={() => setSelectedDayFilter(dayName)}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-400 text-slate-950 shadow-xs font-black'
                    : 'bg-emerald-900/60 hover:bg-emerald-900 text-emerald-100'
                }`}
              >
                {dayName} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Workshop List */}
      <div className="space-y-4">
        {filteredWorkshops.map((workshop) => {
          const isBookmarked = bookmarks.includes(workshop.id);

          return (
            <div 
              key={workshop.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-500/80 shadow-xs hover:shadow-md transition-all overflow-hidden"
            >
              {/* Card Header Strip */}
              <div className="bg-slate-900 text-white px-4 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-black text-[11px] uppercase tracking-wider">
                    {workshop.day}
                  </span>
                  <span className="font-semibold text-slate-300">{workshop.date}</span>
                </div>

                <div className="flex items-center space-x-3 text-slate-300">
                  <span className="flex items-center gap-1 font-bold text-amber-300">
                    <Clock className="w-3.5 h-3.5" />
                    {workshop.timeString}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-slate-200">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    {workshop.room}
                  </span>
                </div>
              </div>

              {/* Main Content */}
              <div className="p-4 sm:p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-extrabold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        {workshop.type}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500">
                        Kapasitas Maksimal {workshop.capacity || 60} Dokter
                      </span>
                    </div>

                    <h3 
                      onClick={() => onSelectSession(workshop)}
                      className="text-base sm:text-lg font-black text-slate-900 hover:text-emerald-700 cursor-pointer transition-colors"
                    >
                      {workshop.title}
                    </h3>
                  </div>

                  <button
                    onClick={() => onToggleBookmark(workshop.id)}
                    title={isBookmarked ? "Hapus dari Jadwal Saya" : "Simpan ke Jadwal Saya"}
                    className={`p-2.5 rounded-xl border transition-all shrink-0 ${
                      isBookmarked
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 border-slate-200'
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Abstract Preview */}
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2">
                  {workshop.abstract.background}
                </p>

                {/* Skill Stations / Poin Latihan */}
                <div className="bg-slate-50 rounded-xl p-3 sm:p-4 border border-slate-200/80 space-y-2">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    Materi Stasiun Keterampilan Praktik (Hands-On):
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {workshop.abstract.clinicalUpdates.map((update, idx) => (
                      <div 
                        key={idx}
                        className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs text-slate-700 font-medium flex items-start gap-2 shadow-2xs"
                      >
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="leading-snug">{update}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Instructors List */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">Instruktur:</span>
                    <div className="flex items-center gap-2">
                      {workshop.speakers.map((sp) => (
                        <button
                          key={sp.id}
                          onClick={() => onSelectSpeaker(sp)}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 rounded-lg text-xs font-bold text-slate-800 hover:text-emerald-800 transition-colors border border-slate-200"
                        >
                          <img 
                            src={sp.photoUrl} 
                            alt={sp.name} 
                            className="w-5 h-5 rounded-full object-cover" 
                          />
                          <span>{sp.name.split(',')[0]}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectSession(workshop, 'livechat')}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                      title="Buka forum Live Chat & Tanya Pembicara"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Live Q&A</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    </button>

                    <button
                      onClick={onOpenVenue}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                    >
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span>Lihat Ruangan</span>
                    </button>

                    <button
                      onClick={() => onSelectSession(workshop, 'abstract')}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Rincian Lengkap</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
