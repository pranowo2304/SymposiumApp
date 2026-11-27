import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  MapPin,
  User,
  FileText,
  Check,
  Share2,
  Copy,
  Sparkles,
  Building,
  BookOpen,
  AlertCircle,
  Download,
  Eye,
  FileSpreadsheet,
  ExternalLink,
  Lock,
  LogIn,
  ShieldCheck,
  Ticket,
  RefreshCw,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  Session,
  Speaker,
  SymposiumInfo,
  PresentationMaterial,
  Participant,
} from '../types';
import { getThemePalette } from '../utils/themeColors';
import {
  base64ToPdfBlob,
  buildExternalPdfUrls,
  formatPdfFileSize,
  getPdfMaterialLocal,
} from '../utils/presentationPdfStorage';
import { fetchPdfMaterialBlobFromFirestore } from '../services/firestoreSyncService';
import { evaluateSessionMaterialAccess } from '../utils/materialAccess';
import { extractParticipantIdRegistrant } from '../data/participantData';
import { PdfViewer } from './PdfViewer';

export type SessionDetailTab = 'abstract' | 'materials' | 'speakers';

interface SessionDetailModalProps {
  session: Session | null;
  allSessions?: Session[];
  onClose: () => void;
  onSelectSpeaker: (speaker: Speaker) => void;
  initialTab?: SessionDetailTab;
  eventInfo?: SymposiumInfo;
  currentUser?: Participant | null;
  isParticipantLoggedIn?: boolean;
  isAdminAuthenticated?: boolean;
  onRequestLogin?: () => void;
}

export const SessionDetailModal: React.FC<SessionDetailModalProps> = ({
  session,
  allSessions,
  onClose,
  onSelectSpeaker,
  initialTab = 'abstract',
  eventInfo,
  currentUser = null,
  isParticipantLoggedIn = false,
  isAdminAuthenticated = false,
  onRequestLogin,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<SessionDetailTab>(initialTab);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [blobPreviewUrl, setBlobPreviewUrl] = useState<string | null>(null);
  const [externalUrls, setExternalUrls] = useState<{
    previewUrl: string;
    downloadUrl: string;
  } | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const palette = getThemePalette(eventInfo);
  const uploadedMaterials: PresentationMaterial[] = session?.presentationMaterials || [];
  const directPdfUrl = typeof session?.pdfUrl === 'string' ? session.pdfUrl.trim() : '';
  const materials: PresentationMaterial[] =
    uploadedMaterials.length > 0
      ? uploadedMaterials
      : directPdfUrl
      ? [
          {
            id: `${session?.id || 'session'}_pdf`,
            title: session?.title ? `Materi: ${session.title}` : 'Materi Presentasi',
            fileName: 'materi-presentasi.pdf',
            fileSize: 0,
            mimeType: 'application/pdf',
            chunkCount: 0,
            externalUrl: directPdfUrl,
            uploadedAt: '',
          },
        ]
      : [];

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, session?.id]);

  useEffect(() => {
    if (materials.length > 0) {
      setSelectedMaterialId((prev) =>
        prev && materials.some((m) => m.id === prev) ? prev : materials[0].id
      );
    } else {
      setSelectedMaterialId(null);
    }
  }, [session?.id, materials.length]);

  const materialAccess = evaluateSessionMaterialAccess({
    session,
    allSessions,
    currentUser,
    isParticipantLoggedIn,
    isAdmin: isAdminAuthenticated,
  });

  const activeMaterial =
    materials.find((m) => m.id === selectedMaterialId) || materials[0] || null;

  useEffect(() => {
    let cancelled = false;
    let objectUrlToRevoke: string | null = null;

    setPdfError(null);
    setExternalUrls(null);
    setPdfBlob(null);
    setBlobPreviewUrl(null);
    setIsLoadingPdf(false);

    if (activeTab !== 'materials' || !activeMaterial || !materialAccess.allowed) {
      return () => {};
    }

    if (activeMaterial.externalUrl) {
      setExternalUrls(buildExternalPdfUrls(activeMaterial.externalUrl));
      return () => {};
    }

    const loadPdfBlob = async () => {
      setIsLoadingPdf(true);
      try {
        let blob: Blob | null = null;
        const localRec = await getPdfMaterialLocal(activeMaterial.id);
        if (localRec?.base64Data) {
          blob = base64ToPdfBlob(localRec.base64Data, activeMaterial.mimeType);
        } else if (activeMaterial.chunkCount > 0) {
          blob = await fetchPdfMaterialBlobFromFirestore(
            activeMaterial.id,
            activeMaterial.chunkCount,
            activeMaterial.fileName,
            activeMaterial.mimeType
          );
        }

        if (cancelled) return;

        if (!blob) {
          setPdfError(
            'File PDF belum tersedia di perangkat ini atau belum disinkronkan ke Cloud oleh Admin.'
          );
          return;
        }

        objectUrlToRevoke = URL.createObjectURL(blob);
        setPdfBlob(blob);
        setBlobPreviewUrl(objectUrlToRevoke);
      } catch (err: any) {
        if (!cancelled) {
          setPdfError(err?.message || 'Gagal memuat pratinjau file PDF.');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingPdf(false);
        }
      }
    };

    loadPdfBlob();

    return () => {
      cancelled = true;
      if (objectUrlToRevoke) {
        URL.revokeObjectURL(objectUrlToRevoke);
      }
    };
  }, [
    activeTab,
    activeMaterial?.id,
    activeMaterial?.externalUrl,
    activeMaterial?.chunkCount,
    materialAccess.allowed,
  ]);

  if (!session) return null;

  const handleCopySummary = () => {
    const text = `
*${session.title}*
📅 ${session.day}, ${session.date} | ${session.timeString}
📍 ${session.room} (${session.floor})
👤 Moderator: ${session.moderator}

*Pembicara:*
${session.speakers.map((s) => `- ${s.name} (${s.institution})`).join('\n')}

*Abstrak Latar Belakang:*
${session.abstract.background}

*Poin Penting Klinis:*
${session.keyTakeaways?.map((k) => `• ${k}`).join('\n') || ''}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const eventTitle = eventInfo?.title || 'Simposium Nasional Kedokteran 2026';
    const speakersList = session.speakers
      .map((s) => `• *${s.name}* (${s.institution})`)
      .join('\n');
    const takeawaysList =
      session.keyTakeaways && session.keyTakeaways.length > 0
        ? `\n💡 *Poin Utama:*\n${session.keyTakeaways
            .slice(0, 2)
            .map((k) => `✓ ${k}`)
            .join('\n')}`
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

  const activeDownloadUrl = materialAccess.allowed
    ? blobPreviewUrl || externalUrls?.downloadUrl || null
    : null;
  const activeParticipantCode = currentUser
    ? extractParticipantIdRegistrant(currentUser) || currentUser.badgeId
    : '';

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
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header Bar */}
        <div
          className="text-white p-4 sm:p-5 relative border-b border-white/10"
          style={{ backgroundColor: palette.primaryHex }}
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white/90 hover:text-white transition-colors cursor-pointer"
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
        <div className="flex border-b border-slate-200 bg-slate-50 px-3 sm:px-4 pt-2 space-x-2 sm:space-x-4 text-xs font-bold overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('abstract')}
            className={`pb-2.5 px-2 border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'abstract'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>Abstrak &amp; Ringkasan Materi</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('materials')}
            className={`pb-2.5 px-2 border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'materials'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {materialAccess.allowed ? (
              <FileSpreadsheet className="w-4 h-4 shrink-0" />
            ) : (
              <Lock className="w-3.5 h-3.5 shrink-0 text-amber-600" />
            )}
            <span>Materi Presentasi</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                !materialAccess.allowed
                  ? 'bg-amber-100 text-amber-700'
                  : activeTab === 'materials'
                  ? 'bg-blue-100 text-blue-700'
                  : materials.length > 0
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {materials.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('speakers')}
            className={`pb-2.5 px-2 border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'speakers'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4 shrink-0" />
            <span>Pembicara &amp; Biografi ({session.speakers.length})</span>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 text-sm">
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

              {/* Rundown Workshop (Mulai s/d Selesai) */}
              {session.rundown && session.rundown.length > 0 && (
                <div className="bg-emerald-50/60 p-3.5 sm:p-4 rounded-xl border border-emerald-200/80 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                      Rundown Acara ({session.startTime} – {session.endTime} WIB)
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {session.rundown.length} Sesi
                    </span>
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-emerald-200/70 bg-white">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[10px] uppercase tracking-wider">
                          <th className="py-1.5 px-2.5 w-8 text-center">No</th>
                          <th className="py-1.5 px-2.5 w-28">Waktu</th>
                          <th className="py-1.5 px-2.5">Kegiatan / Materi</th>
                          <th className="py-1.5 px-2.5 w-36">Instruktur / PIC</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {session.rundown.map((item, idx) => (
                          <tr key={item.id || idx} className="hover:bg-emerald-50/40">
                            <td className="py-1.5 px-2.5 text-center font-bold text-slate-400">
                              {idx + 1}
                            </td>
                            <td className="py-1.5 px-2.5 font-mono font-bold text-emerald-700 whitespace-nowrap">
                              {item.startTime} - {item.endTime}
                            </td>
                            <td className="py-1.5 px-2.5 font-semibold text-slate-800">
                              {item.activity}
                            </td>
                            <td className="py-1.5 px-2.5 text-slate-500">{item.pic || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Abstract: Clinical Updates */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center">
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                  Poin Pembahasan &amp; Update Klinis Terbaru
                </h3>
                <ul className="space-y-2">
                  {session.abstract.clinicalUpdates.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-start text-xs sm:text-sm bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100"
                    >
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
                <p className="text-emerald-800 leading-normal">{session.abstract.conclusion}</p>
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

          {activeTab === 'materials' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {!materialAccess.allowed ? (
                <div className="bg-amber-50/70 border border-amber-200 rounded-2xl px-5 py-7 sm:px-8 sm:py-9 text-center flex flex-col items-center justify-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-300/80 flex items-center justify-center text-amber-700 shadow-xs">
                    <Lock className="w-7 h-7" />
                  </div>

                  <div className="space-y-1.5 max-w-md">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider">
                      <span>
                        {materialAccess.reason === 'login_required'
                          ? 'Akses Terbatas'
                          : 'Tiket Tidak Mencakup Sesi Ini'}
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      {materialAccess.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {materialAccess.description}
                    </p>
                  </div>

                  <div className="w-full max-w-md bg-white rounded-xl border border-amber-200/80 p-3.5 text-left space-y-2 text-xs shadow-2xs">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-slate-500 font-medium">Akses Diperlukan:</span>
                      <span className="font-bold text-slate-900 text-right">
                        {materialAccess.requiredAccessLabel}
                      </span>
                    </div>

                    {materialAccess.reason === 'ticket_restricted' && currentUser && (
                      <>
                        <div className="flex items-start justify-between gap-2 pt-2 border-t border-slate-100">
                          <span className="text-slate-500 font-medium">Peserta Aktif:</span>
                          <span className="font-semibold text-slate-800 text-right">
                            {currentUser.name}
                            {activeParticipantCode ? ` (${activeParticipantCode})` : ''}
                          </span>
                        </div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-slate-500 font-medium flex items-center gap-1">
                            <Ticket className="w-3.5 h-3.5 text-amber-600" />
                            <span>Tiket Anda:</span>
                          </span>
                          <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md text-[11px] text-right">
                            {materialAccess.currentTicketLabel}
                          </span>
                        </div>
                      </>
                    )}

                    {materials.length > 0 && (
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                        <span>Materi Tersedia:</span>
                        <span className="font-bold text-indigo-700">
                          {materials.length} file PDF siap dibuka setelah verifikasi
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                    {onRequestLogin && (
                      <button
                        type="button"
                        onClick={onRequestLogin}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
                      >
                        {materialAccess.reason === 'login_required' ? (
                          <>
                            <LogIn className="w-4 h-4" />
                            <span>Login dengan Id_registrant</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4" />
                            <span>Ganti Akun / Id_registrant</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {materialAccess.reason === 'ticket_restricted' &&
                    (eventInfo?.contactEmail || eventInfo?.contactPhone) && (
                      <p className="text-[11px] text-slate-500 max-w-sm">
                        Jika Anda merasa sudah mendaftar paket ini, silakan hubungi panitia
                        {eventInfo.contactPhone ? ` (${eventInfo.contactPhone})` : ''}
                        {eventInfo.contactEmail ? ` • ${eventInfo.contactEmail}` : ''}.
                      </p>
                    )}
                </div>
              ) : materials.length === 0 ? (
                <div className="bg-slate-50/90 border border-dashed border-slate-300 rounded-2xl px-6 py-10 text-center flex flex-col items-center justify-center space-y-3">
                  {/* Ilustrasi Sederhana Dokumen Materi Presentasi */}
                  <svg
                    viewBox="0 0 120 96"
                    className="w-28 h-22 text-slate-300"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <rect
                      x="18"
                      y="10"
                      width="84"
                      height="64"
                      rx="10"
                      fill="#ffffff"
                      stroke="#cbd5e1"
                      strokeWidth="2.5"
                    />
                    <rect
                      x="28"
                      y="22"
                      width="36"
                      height="6"
                      rx="3"
                      fill="#e2e8f0"
                    />
                    <rect
                      x="28"
                      y="34"
                      width="64"
                      height="4"
                      rx="2"
                      fill="#e2e8f0"
                    />
                    <rect
                      x="28"
                      y="44"
                      width="52"
                      height="4"
                      rx="2"
                      fill="#e2e8f0"
                    />
                    <rect
                      x="28"
                      y="54"
                      width="40"
                      height="4"
                      rx="2"
                      fill="#f1f5f9"
                    />
                    <line
                      x1="60"
                      y1="74"
                      x2="60"
                      y2="86"
                      stroke="#cbd5e1"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <line
                      x1="44"
                      y1="86"
                      x2="76"
                      y2="86"
                      stroke="#cbd5e1"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <circle cx="94" cy="20" r="14" fill="#eef2ff" stroke="#c7d2fe" strokeWidth="2" />
                    <path
                      d="M89 20h10M94 15v10"
                      stroke="#94a3b8"
                      strokeWidth="2"
                      strokeLinecap="round"
                      transform="rotate(45 94 20)"
                    />
                  </svg>

                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-800">
                      Materi belum tersedia
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                      File materi presentasi (PDF) untuk sesi ini belum diunggah oleh panitia atau pembicara. Silakan periksa kembali secara berkala.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Verified Material Access Status Bar */}
                  {materialAccess.grantedBadgeLabel && (
                    <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200/80 text-[11px] text-emerald-900">
                      <span className="flex items-center gap-1.5 font-semibold">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Akses Materi Terverifikasi</span>
                      </span>
                      <span className="font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                        {materialAccess.grantedBadgeLabel}
                      </span>
                    </div>
                  )}

                  {/* Material Selector Cards */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Daftar File Materi PDF ({materials.length})
                    </h3>
                    <div className="grid grid-cols-1 gap-2">
                      {materials.map((mat) => {
                        const isSelected = activeMaterial?.id === mat.id;
                        return (
                          <div
                            key={mat.id}
                            onClick={() => setSelectedMaterialId(mat.id)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                              isSelected
                                ? 'bg-indigo-50 border-indigo-400 shadow-xs'
                                : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                            }`}
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div
                                className={`p-2 rounded-lg shrink-0 ${
                                  isSelected
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-rose-100 text-rose-600'
                                }`}
                              >
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                  {mat.title}
                                </h4>
                                <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                                  <span className="truncate max-w-[200px]">{mat.fileName}</span>
                                  <span>•</span>
                                  <span className="font-semibold text-slate-700">
                                    {mat.externalUrl
                                      ? 'Tautan PDF Eksternal'
                                      : formatPdfFileSize(mat.fileSize)}
                                  </span>
                                  {mat.speakerName && (
                                    <>
                                      <span>•</span>
                                      <span className="text-indigo-700 font-semibold">
                                        {mat.speakerName}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <span
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 shrink-0 ${
                                isSelected
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-white border border-slate-200 text-slate-700'
                              }`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>{isSelected ? 'Ditampilkan' : 'Lihat PDF'}</span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active PDF Viewer & Download Bar */}
                  {activeMaterial && (
                    <div className="space-y-2.5 pt-2 border-t border-slate-200">
                      <PdfViewer
                        blob={pdfBlob}
                        blobUrl={blobPreviewUrl}
                        externalPreviewUrl={externalUrls?.previewUrl || null}
                        externalDownloadUrl={externalUrls?.downloadUrl || null}
                        title={activeMaterial.title}
                        fileName={activeMaterial.fileName}
                        isLoading={isLoadingPdf}
                        error={pdfError}
                      />

                      {activeDownloadUrl && (
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                          <span className="truncate">
                            File: <strong className="text-slate-700">{activeMaterial.fileName}</strong>
                            {activeMaterial.speakerName ? ` • ${activeMaterial.speakerName}` : ''}
                          </span>
                          {activeMaterial.externalUrl ? (
                            <a
                              href={activeDownloadUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Buka / Unduh PDF</span>
                            </a>
                          ) : (
                            <a
                              href={activeDownloadUrl}
                              download={activeMaterial.fileName}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Unduh File PDF</span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
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
                      <p className="text-xs font-semibold text-sky-700 mt-0.5">{speaker.title}</p>
                      <p className="text-xs text-slate-500 flex items-center mt-1">
                        <Building className="w-3 h-3 mr-1 text-slate-400 shrink-0" />
                        <span className="truncate">{speaker.institution}</span>
                      </p>

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
            <button
              onClick={handleCopySummary}
              className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4 text-slate-500" />
              )}
              <span>{copied ? 'Tersalin!' : 'Salin Info'}</span>
            </button>

            {/* Tombol Bagikan Sesi ke WhatsApp */}
            <button
              id="btn-share-session-whatsapp"
              onClick={handleShareWhatsApp}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-xs cursor-pointer"
              title="Bagikan jadwal sesi ini melalui pesan WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Bagikan Sesi (WhatsApp)</span>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
