import React from 'react';
import { X, Building, Mail, Award, BookOpen, Calendar, Clock, MapPin, ChevronRight, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { Speaker, Session } from '../types';

interface SpeakerModalProps {
  speaker: Speaker | null;
  allSessions: Session[];
  onClose: () => void;
  onSelectSession: (session: Session, initialTab?: 'abstract' | 'speakers' | 'livechat') => void;
}

export const SpeakerModal: React.FC<SpeakerModalProps> = ({
  speaker,
  allSessions,
  onClose,
  onSelectSession
}) => {
  if (!speaker) return null;

  // Filter sessions presented by this speaker
  const speakerSessions = allSessions.filter(s =>
    s.speakers.some(sp => sp.id === speaker.id)
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs"
      onClick={onClose}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="bg-slate-900 text-white p-5 relative border-b border-slate-800">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-4">
            <img
              src={speaker.photoUrl}
              alt={speaker.name}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-400 shadow-md shrink-0"
            />
            <div className="pr-6 min-w-0">
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white uppercase tracking-wider mb-1">
                {speaker.specialty}
              </span>
              <h2 className="text-base sm:text-lg font-extrabold text-white leading-snug">
                {speaker.name}
              </h2>
              <p className="text-xs text-blue-300 font-medium mt-0.5">
                {speaker.title}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-slate-700 text-xs sm:text-sm">
          
          {/* Institution & Contact */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
            <div className="flex items-start text-xs text-slate-700">
              <Building className="w-4 h-4 mr-2 text-blue-600 shrink-0 mt-0.5" />
              <span><strong>Institusi:</strong> {speaker.institution}</span>
            </div>
            {speaker.email && (
              <div className="flex items-center text-xs text-slate-600">
                <Mail className="w-4 h-4 mr-2 text-blue-600 shrink-0" />
                <span>{speaker.email}</span>
              </div>
            )}
          </div>

          {/* Biografi Singkat */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center">
              <BookOpen className="w-4 h-4 mr-1.5 text-blue-600" />
              Biografi Singkat
            </h3>
            <div className="p-4 rounded-r-lg bg-slate-50 border-l-4 border-blue-500 border-y border-r border-slate-200 text-slate-800 text-xs sm:text-sm leading-relaxed">
              {speaker.bio}
            </div>
          </div>

          {/* Scheduled Sessions for this speaker */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center">
              <Calendar className="w-4 h-4 mr-1.5 text-indigo-600" />
              Jadwal Sesi Pembicara ({speakerSessions.length})
            </h3>

            <div className="space-y-2">
              {speakerSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => {
                    onClose();
                    onSelectSession(session);
                  }}
                  className="p-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-sky-300 rounded-xl cursor-pointer transition-all group flex items-center justify-between"
                >
                  <div className="space-y-1 pr-2">
                    <div className="flex items-center space-x-2 text-[11px] font-semibold text-sky-700">
                      <span className="bg-sky-100 px-2 py-0.2 rounded text-sky-800">{session.day}</span>
                      <span>•</span>
                      <span className="flex items-center"><Clock className="w-3 h-3 mr-1" />{session.timeString}</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-sky-800 line-clamp-2">
                      {session.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 flex items-center">
                      <MapPin className="w-3 h-3 mr-1 text-rose-500" />
                      {session.room}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                        onSelectSession(session, 'livechat');
                      }}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                      title="Ajukan pertanyaan langsung kepada pembicara ini"
                    >
                      <MessageSquare className="w-3 h-3 text-emerald-600" />
                      <span>Live Q&A</span>
                    </button>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Tutup
          </button>
        </div>

      </motion.div>
    </motion.div>
  );
};
