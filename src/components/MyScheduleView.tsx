import React from 'react';
import { BookmarkCheck, Trash2, Clock, MapPin, Share2, AlertTriangle, Calendar, ArrowLeft, Bell, Volume2, CheckCircle2, Sparkles } from 'lucide-react';
import { Session, Speaker } from '../types';
import { SessionCard } from './SessionCard';

interface MyScheduleViewProps {
  bookmarkedSessions: Session[];
  onToggleBookmark: (sessionId: string) => void;
  onSelectSession: (session: Session, initialTab?: 'abstract' | 'speakers' | 'livechat') => void;
  onSelectSpeaker: (speaker: Speaker) => void;
  onClearAllBookmarks: () => void;
  onBackToSchedule: () => void;
  onTriggerReminderToast?: (session: Session) => void;
}

export const MyScheduleView: React.FC<MyScheduleViewProps> = ({
  bookmarkedSessions,
  onToggleBookmark,
  onSelectSession,
  onSelectSpeaker,
  onClearAllBookmarks,
  onBackToSchedule,
  onTriggerReminderToast
}) => {
  // Separate into Hari I and Hari II
  const day1Sessions = bookmarkedSessions.filter(s => s.day === 'Hari I');
  const day2Sessions = bookmarkedSessions.filter(s => s.day === 'Hari II');

  // Check for time collisions on same day
  const hasTimeCollision = (sessions: Session[]) => {
    for (let i = 0; i < sessions.length; i++) {
      for (let j = i + 1; j < sessions.length; j++) {
        if (sessions[i].startTime === sessions[j].startTime) {
          return true;
        }
      }
    }
    return false;
  };

  const day1Collision = hasTimeCollision(day1Sessions);
  const day2Collision = hasTimeCollision(day2Sessions);

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-5 space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-sky-950 text-white rounded-2xl p-5 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-800">
        <div>
          <button
            onClick={onBackToSchedule}
            className="text-xs text-sky-300 hover:text-white flex items-center mb-2 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Kembali ke Jadwal Utama
          </button>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BookmarkCheck className="w-6 h-6 text-amber-400" />
            Jadwal Saya (Personal Itinerary)
          </h2>
          <p className="text-xs text-sky-200/80 mt-1">
            Daftar sesi simposium yang Anda simpan untuk dihadiri.
          </p>
        </div>

        {bookmarkedSessions.length > 0 && (
          <div className="flex items-center space-x-2">
            <button
              onClick={onClearAllBookmarks}
              className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Kosongkan</span>
            </button>
          </div>
        )}
      </div>

      {/* 15-Minute Reminder Status & Test Banner */}
      {bookmarkedSessions.length > 0 && (
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200/90 shadow-2xs space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-2xs mt-0.5">
                <Bell className="w-5 h-5 fill-current animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-amber-950 flex items-center gap-1.5">
                  Sistem Notifikasi Automatic 15 Menit Aktif
                  <span className="text-[10px] bg-amber-200/80 text-amber-900 font-bold px-2 py-0.5 rounded-full border border-amber-300">
                    Otomatis
                  </span>
                </h4>
                <p className="text-xs text-amber-900/80 mt-0.5 leading-relaxed">
                  Aplikasi akan memunculkan <strong>notifikasi toast & nada audio</strong> persis 15 menit sebelum setiap sesi yang disimpan di 'Jadwal Saya' dimulai.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Demo Trigger for User to Test */}
          {onTriggerReminderToast && (
            <div className="pt-2 border-t border-amber-200/70 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-amber-900 flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-600" />
                Uji Notifikasi Sekarang:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {bookmarkedSessions.slice(0, 2).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => onTriggerReminderToast(s)}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs flex items-center"
                  >
                    <Bell className="w-3 h-3 mr-1" />
                    Tes 15m: {s.title.substring(0, 18)}...
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {bookmarkedSessions.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 space-y-3 shadow-xs">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mx-auto">
            <BookmarkCheck className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            Belum Ada Sesi Tersimpan
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Tandai sesi yang ingin Anda ikuti dengan menekan ikon penanda (bookmark) pada daftar jadwal Hari I & II.
          </p>
          <button
            onClick={onBackToSchedule}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
          >
            Lihat Jadwal Simposium
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Day 1 Section */}
          {day1Sessions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-sky-600" />
                  HARI I - Sabtu, 15 Agustus 2026
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                    {day1Sessions.length} Sesi
                  </span>
                </h3>
              </div>

              {day1Collision && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-xl text-xs flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Catatan Tabrakan Jadwal:</strong> Ada sesi di Hari I yang memiliki jam pelaksanaan bersamaan.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3">
                {day1Sessions.map(session => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    isBookmarked={true}
                    onToggleBookmark={onToggleBookmark}
                    onSelectSession={onSelectSession}
                    onSelectSpeaker={onSelectSpeaker}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Day 2 Section */}
          {day2Sessions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  HARI II - Minggu, 16 Agustus 2026
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                    {day2Sessions.length} Sesi
                  </span>
                </h3>
              </div>

              {day2Collision && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-xl text-xs flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Catatan Tabrakan Jadwal:</strong> Ada sesi di Hari II yang memiliki jam pelaksanaan bersamaan.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3">
                {day2Sessions.map(session => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    isBookmarked={true}
                    onToggleBookmark={onToggleBookmark}
                    onSelectSession={onSelectSession}
                    onSelectSpeaker={onSelectSpeaker}
                  />
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
