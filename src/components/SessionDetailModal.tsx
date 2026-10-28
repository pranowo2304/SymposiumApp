import React, { useState } from 'react';
import { X, Clock, MapPin, User, Bookmark, FileText, Check, Share2, Copy, Sparkles, Building, BookOpen, AlertCircle, Award, QrCode, MessageSquare, Send } from 'lucide-react';
import { motion } from 'motion/react';
import { Session, Speaker, Participant, SymposiumInfo } from '../types';
import { AddToCalendarButton } from './AddToCalendarButton';
import { SessionLiveChat } from './SessionLiveChat';
import { getThemePalette } from '../utils/themeColors';

interface SessionDetailModalProps {
  session: Session | null;
  onClose: () => void;
  isBookmarked: boolean;
  onToggleBookmark: (sessionId: string) => void;
  onSelectSpeaker: (speaker: Speaker) => void;
  onOpenQrScanner?: () => void;
  initialTab?: 'abstract' | 'speakers' | 'livechat';
  currentUser?: Participant;
  eventInfo?: SymposiumInfo;
}

export const SessionDetailModal: React.FC<SessionDetailModalProps> = ({
  session,
  onClose,
  isBookmarked,
  onToggleBookmark,
  onSelectSpeaker,
  onOpenQrScanner,
  initialTab = 'abstract',
  currentUser,
  eventInfo
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'abstract' | 'speakers' | 'livechat'>(initialTab);
  const palette = getThemePalette(eventInfo);

  if (!session) return null;

  const handleCopySummary = () => {
    const text = `
*${session.title}*
📅 ${session.day}, ${session.date} | ${session.timeString}
📍 ${session.room} (${session.floor})
👤 Moderator: ${session.moderator}

*Pembicara:*
${session.speakers.map(s => `- ${s.name} (${s.institution})`).join('\n')}

*Abstrak Latar Belakang:*
${session.abstract.background}

*Poin Penting Klinis:*
${session.keyTakeaways?.map(k => `• ${k}`).join('\n') || ''}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const eventTitle = eventInfo?.title || 'Simposium Nasional Kedokteran 2026';
    const speakersList = session.speakers.map(s => `• *${s.name}* (${s.institution})`).join('\n');
    const takeawaysList = session.keyTakeaways && session.keyTakeaways.length > 0
      ? `\n💡 *Poin Utama:*\n${session.keyTakeaways.slice(0, 2).map(k => `✓ ${k}`).join('\n')}`
      : '';

    const waText = `🏥 *${eventTitle.toUpperCase()}*

📌 *SESI SIMPOSIUM:*
*${session.title}*
🏷️ Kategori: ${session.category} | ${session.type}

🗓️ *WAKTU & TEMPAT:*
• Hari/Tgl: ${session.day}, ${session.date}
• Jam: ${session.timeString} WIB
• Ruangan: ${session.room} (${session.floor})
• Akreditasi: 4 SKP Kemenkes RI

👨‍⚕️ *PEMBICARA:*
${speakersList}
👤 *Moderator:* ${session.moderator}
${takeawaysList}

🔗 Jangan lewatkan sesi ini! Informasi lengkap & jadwal interaktif tersedia di aplikasi Simposium.`.trim();

    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(waText)}`;
    window.open(waUrl, '_blank');
  };

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
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header Bar */}
        <div 
          className="text-white p-4 sm:p-5 relative border-b border-white/10"
          style={{ backgroundColor: palette.primaryHex }}
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white/90 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2 text-xs text-amber-200 mb-1.5 font-bold uppercase tracking-wider">
            <span>{session.day}</span>
            <span>•</span>
            <span>{session.type}</span>
          </div>

          <h2 className="text-lg sm:text-xl font-extrabold leading-snug pr-8 mb-2 text-white">
            {session.title}
          </h2>

          <div className="flex flex-wrap items-center gap-3 text-xs text-white/90 font-medium">
            <span className="flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1 text-amber-200" />
              {session.timeString}
            </span>
            <span className="flex items-center">
              <MapPin className="w-3.5 h-3.5 mr-1 text-rose-300" />
              {session.room} ({session.floor})
            </span>
          </div>
        </div>

        {/* Navigation Tabs Inside Modal */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 space-x-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('abstract')}
            className={`pb-2.5 px-2 border-b-2 flex items-center space-x-1.5 transition-colors ${
              activeTab === 'abstract'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Abstrak & Ringkasan Materi</span>
          </button>

          <button
            onClick={() => setActiveTab('speakers')}
            className={`pb-2.5 px-2 border-b-2 flex items-center space-x-1.5 transition-colors ${
              activeTab === 'speakers'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Pembicara & Biografi ({session.speakers.length})</span>
          </button>

          <button
            id="tab-btn-livechat"
            onClick={() => setActiveTab('livechat')}
            className={`pb-2.5 px-2 border-b-2 flex items-center space-x-1.5 transition-colors relative ${
              activeTab === 'livechat'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Live Chat & Q&A</span>
            <span className="ml-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              LIVE
            </span>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 text-sm">
          
          {activeTab === 'livechat' && (
            <SessionLiveChat 
              session={session} 
              currentUserName={currentUser?.name}
              currentUserRole={currentUser?.role}
            />
          )}

          {activeTab === 'abstract' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              
              {/* Abstract: Background */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center">
                  <BookOpen className="w-3.5 h-3.5 mr-1 text-sky-600" />
                  Latar Belakang Sesi (Background)
                </h3>
                <p className="text-slate-700 leading-relaxed text-xs sm:text-sm">
                  {session.abstract.background}
                </p>
              </div>

              {/* Abstract: Clinical Updates */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center">
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                  Poin Pembahasan & Update Klinis Terbaru
                </h3>
                <ul className="space-y-2">
                  {session.abstract.clinicalUpdates.map((item, idx) => (
                    <li key={idx} className="flex items-start text-xs sm:text-sm bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold mr-2.5 shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="text-slate-800">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Abstract: Conclusion */}
              <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 text-xs sm:text-sm">
                <h4 className="font-bold text-emerald-900 mb-1 flex items-center">
                  <Check className="w-4 h-4 mr-1 text-emerald-600" />
                  Implikasi Praktis Bagi Dokter
                </h4>
                <p className="text-emerald-800 leading-normal">
                  {session.abstract.conclusion}
                </p>
              </div>

              {/* Key Takeaways */}
              {session.keyTakeaways && session.keyTakeaways.length > 0 && (
                <div className="bg-amber-50/80 p-3.5 rounded-xl border border-amber-200/80">
                  <h4 className="font-bold text-amber-900 text-xs uppercase tracking-wide mb-2 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1 text-amber-600" />
                    Key Takeaways (Poin Penting)
                  </h4>
                  <div className="space-y-1.5 text-xs text-amber-950">
                    {session.keyTakeaways.map((point, i) => (
                      <div key={i} className="flex items-start">
                        <span className="mr-2 text-amber-600 font-bold">•</span>
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Moderator Info */}
              <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                <span>Moderator Sesi:</span>
                <span className="font-semibold text-slate-800">{session.moderator}</span>
              </div>

            </div>
          )}

          {activeTab === 'speakers' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <p className="text-xs text-slate-500">
                Klik profil pembicara untuk melihat biografi lengkap dan riwayat penelitian/publikasi.
              </p>

              {session.speakers.map((speaker) => (
                <div
                  key={speaker.id}
                  onClick={() => onSelectSpeaker(speaker)}
                  className="bg-slate-50 hover:bg-sky-50/80 border border-slate-200 hover:border-sky-300 rounded-2xl p-4 transition-all cursor-pointer group"
                >
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <img
                      src={speaker.photoUrl}
                      alt={speaker.name}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-sm shrink-0 group-hover:scale-105 transition-transform"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-sky-800">
                          {speaker.name}
                        </h4>
                        <span className="text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-semibold">
                          Pembicara
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-sky-700 mt-0.5">
                        {speaker.title}
                      </p>
                      <p className="text-xs text-slate-500 flex items-center mt-1">
                        <Building className="w-3 h-3 mr-1 text-slate-400 shrink-0" />
                        <span className="truncate">{speaker.institution}</span>
                      </p>

                      {speaker.talkTitle && (
                        <div className="mt-2 text-xs bg-white p-2 rounded-lg border border-slate-200/80 text-slate-800 font-medium italic">
                          "{speaker.talkTitle}"
                        </div>
                      )}

                      {/* Biografi Singkat (Short Bio) */}
                      <div className="mt-2.5 pt-2 border-t border-slate-200/60">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Biografi Singkat:
                        </span>
                        <p className="text-xs text-slate-600 line-clamp-3 mt-0.5 leading-relaxed">
                          {speaker.bio}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <AddToCalendarButton session={session} variant="outline" />

            <button
              onClick={handleCopySummary}
              className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
              <span>{copied ? 'Tersalin!' : 'Salin Info'}</span>
            </button>

            {/* Tombol Bagikan Sesi ke WhatsApp */}
            <button
              id="btn-share-session-whatsapp"
              onClick={handleShareWhatsApp}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-xs"
              title="Bagikan jadwal sesi ini melalui pesan WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Bagikan Sesi (WhatsApp)</span>
            </button>

            {onOpenQrScanner && (
              <button
                onClick={() => {
                  onClose();
                  onOpenQrScanner();
                }}
                className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors"
              >
                <QrCode className="w-4 h-4 text-blue-600" />
                <span>Absen QR</span>
              </button>
            )}

            {activeTab !== 'livechat' && (
              <button
                id="btn-switch-to-livechat"
                onClick={() => setActiveTab('livechat')}
                className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors"
                title="Buka forum Live Chat dan ajukan pertanyaan ke narasumber"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tanya Pembicara (Live)</span>
              </button>
            )}
          </div>

          <button
            onClick={() => onToggleBookmark(session.id)}
            style={!isBookmarked ? { backgroundColor: palette.primaryHex } : undefined}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all shadow-sm ${
              isBookmarked
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                : 'hover:opacity-90 text-white'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
            <span>{isBookmarked ? 'Tersimpan' : 'Simpan Ke Jadwal'}</span>
          </button>
        </div>

      </motion.div>
    </motion.div>
  );
};
