import React from 'react';
import { Bell, Clock, MapPin, X, ChevronRight, Sparkles, Volume2 } from 'lucide-react';
import { Session } from '../types';

interface ReminderNotificationToastProps {
  session: Session | null;
  onClose: () => void;
  onOpenSession: (session: Session) => void;
}

export const ReminderNotificationToast: React.FC<ReminderNotificationToastProps> = ({
  session,
  onClose,
  onOpenSession,
}) => {
  if (!session) return null;

  return (
    <div className="fixed bottom-20 right-3 sm:bottom-5 sm:right-5 z-50 max-w-sm w-[calc(100vw-1.5rem)] sm:w-96 bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border-2 border-amber-400 animate-bounce duration-300">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0">
            <Bell className="w-4 h-4 fill-current animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 block">
              Pengingat Jadwal Saya
            </span>
            <span className="text-xs font-bold text-slate-200">
              Sesi Mulai dalam 15 Menit!
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-6 h-6 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Session Title & Info */}
      <div className="space-y-2">
        <h4 className="text-xs sm:text-sm font-extrabold text-white leading-snug line-clamp-2">
          {session.title}
        </h4>

        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-300">
          <span className="flex items-center px-2 py-0.5 rounded bg-blue-900/80 text-blue-300 border border-blue-700/60">
            <Clock className="w-3 h-3 mr-1 text-blue-400" />
            {session.timeString}
          </span>
          <span className="flex items-center px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            <MapPin className="w-3 h-3 mr-1 text-rose-400" />
            {session.room}
          </span>
        </div>

        <div className="text-[11px] text-slate-400 italic">
          *Persiapkan diri Anda untuk menuju ruangan tepat waktu.
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between gap-2">
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-[11px] font-bold text-slate-400 hover:text-white transition-colors"
        >
          Nanti Dulu
        </button>

        <button
          onClick={() => {
            onClose();
            onOpenSession(session);
          }}
          className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-lg text-xs font-black transition-all shadow-md flex items-center space-x-1"
        >
          <span>Buka Detail Sesi</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
};
