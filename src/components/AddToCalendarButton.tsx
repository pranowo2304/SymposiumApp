import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, ExternalLink, Download, Check } from 'lucide-react';
import { Session } from '../types';
import { getGoogleCalendarUrl, downloadICSFile } from '../utils/calendarUtils';

interface AddToCalendarButtonProps {
  session: Session;
  variant?: 'primary' | 'secondary' | 'compact' | 'outline';
  className?: string;
}

export const AddToCalendarButton: React.FC<AddToCalendarButtonProps> = ({
  session,
  variant = 'compact',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGoogleCalendar = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getGoogleCalendarUrl(session);
    window.open(url, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  const handleICSDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    downloadICSFile(session);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
    setIsOpen(false);
  };

  // Button styling variants
  let btnStyle = 'px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ';
  if (variant === 'compact') {
    btnStyle += 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 ';
  } else if (variant === 'primary') {
    btnStyle += 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xs ';
  } else if (variant === 'outline') {
    btnStyle += 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 ';
  } else {
    btnStyle += 'bg-slate-100 hover:bg-slate-200 text-slate-800 ';
  }

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`${btnStyle}`}
        title="Simpan Jadwal ke Kalender Anda"
      >
        <Calendar className="w-3.5 h-3.5 shrink-0 text-blue-600" />
        <span className="whitespace-nowrap">Tambah ke Kalender</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden text-xs py-1 animate-in fade-in zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
            Pilih Aplikasi Kalender
          </div>

          <button
            onClick={handleGoogleCalendar}
            className="w-full text-left px-3 py-2 hover:bg-blue-50 text-slate-800 hover:text-blue-700 flex items-center justify-between font-bold transition-colors"
          >
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span>Google Calendar</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <button
            onClick={handleICSDownload}
            className="w-full text-left px-3 py-2 hover:bg-blue-50 text-slate-800 hover:text-blue-700 flex items-center justify-between font-bold transition-colors"
          >
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Apple / Outlook (.ics)</span>
            </div>
            {downloaded ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Download className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>
        </div>
      )}
    </div>
  );
};
