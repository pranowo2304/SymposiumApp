import React from 'react';
import { Clock, MapPin, User, Bookmark, ChevronRight, FileText, Sparkles, Check, Bell, MessageSquare } from 'lucide-react';
import { Session, Speaker } from '../types';
import { AddToCalendarButton } from './AddToCalendarButton';

interface SessionCardProps {
  session: Session;
  isBookmarked: boolean;
  onToggleBookmark: (sessionId: string) => void;
  onSelectSession: (session: Session, initialTab?: 'abstract' | 'speakers' | 'livechat') => void;
  onSelectSpeaker: (speaker: Speaker) => void;
}

export const SessionCard: React.FC<SessionCardProps> = ({
  session,
  isBookmarked,
  onToggleBookmark,
  onSelectSession,
  onSelectSpeaker
}) => {
  return (
    <div className={`bg-white rounded-xl border transition-all duration-200 hover:shadow-md ${
      isBookmarked 
        ? 'border-blue-500 shadow-xs ring-1 ring-blue-400/30 bg-blue-50/10' 
        : 'border-slate-200/90 hover:border-blue-300'
    }`}>
      <div className="p-4 sm:p-5">
        {/* Session Top Bar: Time, Room Badge & Bookmark */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center space-x-2">
            {/* Time Badge */}
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-slate-900 text-white shadow-2xs">
              <Clock className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
              {session.timeString}
            </span>

            {/* Room Badge (Data Ruangan) */}
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded uppercase tracking-wider border border-blue-100 flex items-center">
              <MapPin className="w-3 h-3 mr-1 text-blue-600" />
              {session.room}
            </span>

            {/* 15-Minute Reminder Visual Indicator Badge */}
            {isBookmarked && (
              <span className="px-2 py-0.5 bg-amber-50 text-amber-800 text-[10px] font-bold rounded-full border border-amber-200 flex items-center shadow-2xs">
                <Bell className="w-3 h-3 mr-1 text-amber-600 fill-amber-500 animate-pulse" />
                Pengingat 15m Aktif
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
              session.type === 'Plenary Session' 
                ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                : session.type === 'Workshop Hands-On'
                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              {session.type}
            </span>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark(session.id);
              }}
              title={isBookmarked ? "Hapus dari Jadwal Saya" : "Simpan ke Jadwal Saya"}
              className={`p-1.5 rounded-lg transition-all ${
                isBookmarked 
                  ? 'bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-2xs' 
                  : 'bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200'
              }`}
            >
              {isBookmarked ? (
                <Check className="w-4 h-4" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Specialty Category */}
        <div className="mb-1">
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
            {session.category}
          </span>
        </div>

        {/* Session Theme / Title */}
        <h3 
          onClick={() => onSelectSession(session)}
          className="text-base sm:text-lg font-bold text-slate-900 hover:text-blue-600 cursor-pointer transition-colors leading-snug mb-3"
        >
          {session.title}
        </h3>

        {/* Speakers Section with Left-Accent Border */}
        <div className="space-y-2.5 mt-3 pt-3 border-t border-slate-100">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Pembicara & Biografi Singkat:</span>
            <span className="text-blue-600 font-bold hover:underline cursor-pointer" onClick={() => onSelectSession(session)}>
              Lihat Detail →
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {session.speakers.map((sp) => (
              <div
                key={sp.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectSpeaker(sp);
                }}
                className="flex items-start space-x-3 p-3 rounded-r-lg bg-slate-50 hover:bg-blue-50/60 border-l-4 border-blue-500 border-y border-r border-slate-200/60 cursor-pointer transition-all group"
              >
                <img
                  src={sp.photoUrl}
                  alt={sp.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-2xs group-hover:scale-105 transition-transform"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700 truncate">
                    {sp.name}
                  </h4>
                  <p className="text-[11px] text-slate-600 font-medium truncate">
                    {sp.title}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {sp.institution}
                  </p>
                </div>
                <div className="self-center opacity-0 group-hover:opacity-100 text-blue-600 transition-opacity">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Abstract Preview Box with Left Border */}
        <div 
          onClick={() => onSelectSession(session)}
          className="mt-3 p-3 rounded-r-lg bg-slate-50 hover:bg-slate-100/80 border-l-4 border-slate-300 border-y border-r border-slate-200/60 cursor-pointer transition-colors"
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5 flex items-center">
            <FileText className="w-3 h-3 mr-1 text-slate-400" />
            Abstrak Ringkas:
          </div>
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {session.abstract.background}
          </p>
        </div>

        {/* Card Footer Actions */}
        <div className="mt-4 pt-2.5 flex flex-wrap items-center justify-between border-t border-slate-100 text-xs gap-2">
          <div className="text-slate-500 text-[11px] flex items-center space-x-1">
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate max-w-[180px] sm:max-w-none">
              Moderator: <strong className="text-slate-700 font-medium">{session.moderator}</strong>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectSession(session, 'livechat');
              }}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-lg transition-colors"
              title="Buka forum Live Chat & ajukan pertanyaan ke narasumber"
            >
              <MessageSquare className="w-3 h-3 text-emerald-600" />
              <span>Live Q&A</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </button>

            <AddToCalendarButton session={session} variant="compact" />

            <button
              onClick={() => onSelectSession(session, 'abstract')}
              className="inline-flex items-center font-bold text-blue-600 hover:text-blue-800 text-xs transition-colors py-1 px-1.5"
            >
              <span>Detail →</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
