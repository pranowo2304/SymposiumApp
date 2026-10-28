import React, { useEffect, useState, useRef } from 'react';
import { 
  Megaphone, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  X, 
  ArrowRight, 
  Clock, 
  Volume2, 
  BellRing 
} from 'lucide-react';
import { BroadcastNotification, BroadcastType } from '../types';

interface BroadcastNotificationToastProps {
  broadcast: BroadcastNotification | null;
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const BroadcastNotificationToast: React.FC<BroadcastNotificationToastProps> = ({
  broadcast,
  onClose,
  onNavigateTab
}) => {
  const [progress, setProgress] = useState<number>(100);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const isPausedRef = useRef<boolean>(false);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!broadcast) return;
    if (broadcast.durationSeconds <= 0) return; // Persistent

    setProgress(100);
    const intervalMs = 100;
    const totalMs = broadcast.durationSeconds * 1000;
    let remainingMs = totalMs;

    const timer = setInterval(() => {
      if (isPausedRef.current) return;

      remainingMs -= intervalMs;
      if (remainingMs <= 0) {
        clearInterval(timer);
        setProgress(0);
        onCloseRef.current();
      } else {
        setProgress((remainingMs / totalMs) * 100);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [broadcast?.id, broadcast?.durationSeconds]);

  if (!broadcast) return null;

  const typeConfig: Record<BroadcastType, {
    border: string;
    bg: string;
    badgeBg: string;
    badgeText: string;
    icon: React.ComponentType<{ className?: string }>;
    iconBg: string;
    iconColor: string;
    accentGlow: string;
    progressBg: string;
    btnClass: string;
  }> = {
    info: {
      border: 'border-blue-500/60',
      bg: 'bg-slate-950/95',
      badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
      badgeText: 'PENGUMUMAN PANITIA',
      icon: Megaphone,
      iconBg: 'bg-blue-600 text-white',
      iconColor: 'text-blue-400',
      accentGlow: 'shadow-blue-500/20',
      progressBg: 'bg-blue-500',
      btnClass: 'bg-blue-600 hover:bg-blue-500 text-white'
    },
    warning: {
      border: 'border-amber-500/70',
      bg: 'bg-slate-950/95',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
      badgeText: 'PERHATIAN / PERUBAHAN',
      icon: AlertTriangle,
      iconBg: 'bg-amber-500 text-slate-950',
      iconColor: 'text-amber-400',
      accentGlow: 'shadow-amber-500/20',
      progressBg: 'bg-amber-400',
      btnClass: 'bg-amber-400 hover:bg-amber-300 text-slate-950'
    },
    urgent: {
      border: 'border-rose-500/80',
      bg: 'bg-slate-950/95',
      badgeBg: 'bg-rose-500/25 text-rose-300 border-rose-400/40',
      badgeText: 'PENTING / URGENT',
      icon: BellRing,
      iconBg: 'bg-rose-600 text-white',
      iconColor: 'text-rose-400',
      accentGlow: 'shadow-rose-500/30',
      progressBg: 'bg-rose-500',
      btnClass: 'bg-rose-600 hover:bg-rose-500 text-white'
    },
    success: {
      border: 'border-emerald-500/70',
      bg: 'bg-slate-950/95',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
      badgeText: 'INFORMASI RESMI',
      icon: CheckCircle2,
      iconBg: 'bg-emerald-600 text-white',
      iconColor: 'text-emerald-400',
      accentGlow: 'shadow-emerald-500/20',
      progressBg: 'bg-emerald-400',
      btnClass: 'bg-emerald-600 hover:bg-emerald-500 text-white'
    }
  };

  const current = typeConfig[broadcast.type] || typeConfig.info;
  const IconComponent = current.icon;

  const formattedTime = new Date(broadcast.timestamp).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const handleActionClick = () => {
    if (broadcast.actionTab && onNavigateTab) {
      onNavigateTab(broadcast.actionTab);
    }
    onClose();
  };

  return (
    <div 
      className="fixed top-4 sm:top-5 right-3 sm:right-5 z-50 max-w-md w-[calc(100vw-1.5rem)] sm:w-[420px] transition-all animate-in slide-in-from-top-4 sm:slide-in-from-right-4 duration-300 pointer-events-auto"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="alert"
      aria-live="assertive"
    >
      <div className={`relative overflow-hidden rounded-2xl border-2 ${current.border} ${current.bg} text-white shadow-2xl ${current.accentGlow} backdrop-blur-md`}>
        
        {/* Animated Countdown Progress Bar */}
        {broadcast.durationSeconds > 0 && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800/80 overflow-hidden">
            <div 
              className={`h-full ${current.progressBg} transition-[width] duration-100 ease-linear`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <div className="p-4 sm:p-4.5 space-y-2.5">
          
          {/* Header Row: Badge, Category, Time, Close */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border flex items-center gap-1 ${current.badgeBg}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping shrink-0"></span>
                <span>{current.badgeText}</span>
              </span>

              {broadcast.category && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800/90 text-slate-300 border border-slate-700">
                  {broadcast.category}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>{formattedTime} WIB</span>
              </span>

              <button
                onClick={onClose}
                className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                title="Tutup pengumuman"
                aria-label="Tutup"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex items-start gap-3 pt-0.5">
            <div className={`w-9 h-9 rounded-xl ${current.iconBg} flex items-center justify-center shrink-0 shadow-sm mt-0.5`}>
              <IconComponent className="w-5 h-5" />
            </div>

            <div className="space-y-1 flex-1 min-w-0">
              <h4 className="text-sm font-black text-white leading-tight">
                {broadcast.title}
              </h4>
              <p className="text-xs text-slate-200 leading-relaxed font-normal whitespace-pre-line">
                {broadcast.message}
              </p>
            </div>
          </div>

          {/* Footer Action Bar */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
            <div className="text-[10px] text-slate-400 truncate">
              {broadcast.sentBy ? `Dari: ${broadcast.sentBy}` : 'Dari Panitia Pelaksana Simposium'}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {broadcast.actionTab && (
                <button
                  onClick={handleActionClick}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 transition-transform active:scale-95 ${current.btnClass}`}
                >
                  <span>{broadcast.actionLabel || 'Buka Halaman'}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}

              <button
                onClick={onClose}
                className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
