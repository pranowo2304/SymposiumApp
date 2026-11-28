import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  BadgeCheck,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  Edit3,
  FileText,
  IdCard,
  Loader2,
  LogIn,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  Ticket,
} from 'lucide-react';
import { Participant, Session, SymposiumInfo } from '../types';
import { SYMPOSIUM_INFO } from '../data/symposiumData';
import {
  extractParticipantIdRegistrant,
  findParticipantByIdRegistrant,
} from '../data/participantData';
import { lookupParticipantByIdRegistrantInFirestore } from '../services/firestoreSyncService';
import {
  downloadCertificateAsPdf,
  downloadCertificateAsPng,
  getCertificateTemplateSlots,
  getDefaultCertificateDisplayName,
  getSavedCertificateCustomName,
  resolveParticipantCertificates,
  saveCertificateCustomName,
  withCertificateDisplayName,
} from '../utils/certificateTemplates';
import { describeTicketAccessSummary } from '../utils/materialAccess';
import { getThemePalette } from '../utils/themeColors';
import { ParticipantCertificateCard } from './ParticipantCertificateCard';

interface CertificateDownloadViewProps {
  participants: Participant[];
  sessions: Session[];
  currentUser: Participant;
  isParticipantLoggedIn: boolean;
  onLoginSuccess: (participant: Participant) => void;
  onOpenParticipantLogin: () => void;
  onGoogleSignIn?: () => Promise<{ ok: boolean; error?: string }>;
  eventInfo?: SymposiumInfo;
}

export const CertificateDownloadView: React.FC<CertificateDownloadViewProps> = ({
  participants,
  sessions,
  currentUser,
  isParticipantLoggedIn,
  onLoginSuccess,
  onOpenParticipantLogin,
  onGoogleSignIn,
  eventInfo,
}) => {
  const info = eventInfo || SYMPOSIUM_INFO;
  const palette = getThemePalette(info);

  const [idInput, setIdInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);

  const defaultDisplayName = useMemo(
    () => getDefaultCertificateDisplayName(currentUser),
    [currentUser]
  );
  const [customPrintName, setCustomPrintName] = useState<string>(
    () => getSavedCertificateCustomName(currentUser) || defaultDisplayName
  );
  const [nameSavedNotice, setNameSavedNotice] = useState<boolean>(false);

  useEffect(() => {
    setCustomPrintName(getSavedCertificateCustomName(currentUser) || defaultDisplayName);
    setNameSavedNotice(false);
  }, [currentUser.id, currentUser.badgeId, defaultDisplayName]);

  const handleCustomPrintNameChange = (nextVal: string) => {
    setCustomPrintName(nextVal);
    saveCertificateCustomName(currentUser, nextVal);
    setNameSavedNotice(false);
  };

  const handleConfirmSaveName = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleaned = customPrintName.trim() || defaultDisplayName;
    setCustomPrintName(cleaned);
    saveCertificateCustomName(currentUser, cleaned);
    setNameSavedNotice(true);
  };

  const handleResetPrintName = () => {
    setCustomPrintName(defaultDisplayName);
    saveCertificateCustomName(currentUser, defaultDisplayName);
    setNameSavedNotice(false);
  };

  const isCustomNameModified =
    customPrintName.trim().length > 0 && customPrintName.trim() !== defaultDisplayName;

  const effectiveParticipant = useMemo(
    () => withCertificateDisplayName(currentUser, customPrintName || defaultDisplayName),
    [currentUser, customPrintName, defaultDisplayName]
  );

  const templateSlots = useMemo(
    () => getCertificateTemplateSlots(sessions, info),
    [sessions, info]
  );

  const uploadedTemplateCount = useMemo(
    () =>
      templateSlots.filter((slot) => Boolean(info.certificateTemplates?.[slot.templateKey]?.templateUrl))
        .length,
    [templateSlots, info.certificateTemplates]
  );

  const eligibleCertificates = useMemo(
    () => (isParticipantLoggedIn ? resolveParticipantCertificates(currentUser, info) : []),
    [isParticipantLoggedIn, currentUser, info]
  );

  const ticketAccessSummary = useMemo(
    () =>
      isParticipantLoggedIn
        ? describeTicketAccessSummary(currentUser.ticketType || '', sessions, info)
        : '',
    [isParticipantLoggedIn, currentUser.ticketType, sessions, info]
  );

  const activeIdReg = extractParticipantIdRegistrant(currentUser);

  const handleVerifyId = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const cleaned = idInput.trim().slice(0, 80);
    if (!cleaned) {
      setErrorMsg('Silakan masukkan Id_registrant Anda terlebih dahulu.');
      return;
    }

    setIsVerifying(true);
    try {
      const localMatch = findParticipantByIdRegistrant(cleaned, participants);
      const cloudMatch = localMatch ? null : await lookupParticipantByIdRegistrantInFirestore(cleaned);
      const resolved = localMatch || cloudMatch;

      if (!resolved) {
        setErrorMsg(
          `Id_registrant "${cleaned}" belum ditemukan. Pastikan kode sesuai data registrasi Anda dari panitia.`
        );
        return;
      }

      onLoginSuccess(resolved);
      setIdInput('');
    } catch (err) {
      console.error('Certificate page ID verification failed:', err);
      const localMatch = findParticipantByIdRegistrant(cleaned, participants);
      if (localMatch) {
        onLoginSuccess(localMatch);
        setIdInput('');
      } else {
        setErrorMsg('Gagal memverifikasi Id_registrant. Silakan coba lagi.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!onGoogleSignIn) return;
    setErrorMsg(null);
    setIsGoogleLoading(true);
    try {
      const res = await onGoogleSignIn();
      if (!res.ok && res.error) {
        setErrorMsg(res.error);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleQuickDownload = async (
    certTemplate: (typeof eligibleCertificates)[number]['template'],
    format: 'png' | 'pdf'
  ) => {
    const busyId = `${certTemplate.templateKey}-${format}`;
    setDownloadingKey(busyId);
    try {
      if (format === 'png') {
        await downloadCertificateAsPng(effectiveParticipant, certTemplate, info);
      } else {
        await downloadCertificateAsPdf(effectiveParticipant, certTemplate, info);
      }
    } catch (err) {
      console.error('Certificate download error:', err);
    } finally {
      setDownloadingKey(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 space-y-5">
      {/* Header Banner */}
      <section
        className={`bg-gradient-to-br ${palette.headerFrom} to-slate-950 text-white rounded-2xl p-5 sm:p-6 shadow-lg border border-white/10 relative overflow-hidden`}
      >
        <div
          className="absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20 opacity-20"
          style={{ backgroundColor: palette.accentHex }}
        />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center shadow-md shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-300">
                E-Sertifikat Resmi Peserta
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-0.5">
                Unduh E-Sertifikat Simposium &amp; Workshop
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Sertifikat digital diterbitkan otomatis sesuai paket tiket yang Anda ikuti (Simposium, Workshop, atau Bundling Simposium + Workshop) dalam format PNG HD maupun PDF ukuran A4 Landscape.
              </p>
            </div>
          </div>

          <div className="self-start sm:self-center shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs font-bold text-amber-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {uploadedTemplateCount} / {templateSlots.length} Template Tersedia
            </span>
          </div>
        </div>
      </section>

      {/* State 1: Participant Not Logged In */}
      {!isParticipantLoggedIn && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Login Verification Card */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <IdCard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">
                  Verifikasi Identitas Peserta
                </h2>
                <p className="text-xs text-slate-500">
                  Masukkan Id_registrant Anda untuk membuka E-Sertifikat sesuai paket tiket terdaftar.
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleVerifyId} className="space-y-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="cert-id-registrant-input"
                  className="text-xs font-bold text-slate-700 flex items-center gap-1.5"
                >
                  <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Id_registrant / ID Badge Registrasi</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    id="cert-id-registrant-input"
                    type="text"
                    required
                    maxLength={80}
                    value={idInput}
                    onChange={(e) => setIdInput(e.target.value)}
                    placeholder="Contoh: ID-SIMP-2026-001"
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={isVerifying}
                    className="px-5 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer shrink-0"
                  >
                    {isVerifying ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <LogIn className="w-4 h-4" />
                    )}
                    <span>{isVerifying ? 'Memeriksa...' : 'Cek & Buka Sertifikat'}</span>
                  </button>
                </div>
              </div>
            </form>

            {onGoogleSignIn && (
              <>
                <div className="relative flex items-center py-1">
                  <div className="flex-grow border-t border-slate-200" />
                  <span className="shrink mx-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Atau Masuk via Google
                  </span>
                  <div className="flex-grow border-t border-slate-200" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isGoogleLoading}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  <LogIn className="w-4 h-4 text-sky-600" />
                  <span>
                    {isGoogleLoading
                      ? 'Menghubungkan Akun Google...'
                      : 'Masuk dengan Akun Google (Sesuai Email Terdaftar)'}
                  </span>
                </button>
              </>
            )}
          </div>

          {/* Available Certificate Tracks Status */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              Daftar Sertifikat Event
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Setelah verifikasi, sistem otomatis menampilkan sertifikat yang sesuai dengan paket tiket registrasi Anda:
            </p>
            <div className="space-y-2">
              {templateSlots.map((slot) => {
                const isReady = Boolean(info.certificateTemplates?.[slot.templateKey]?.templateUrl);
                return (
                  <div
                    key={slot.templateKey}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-2.5"
                  >
                    <div className="min-w-0">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                        {slot.badgeLabel}
                      </span>
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {slot.templateLabel}
                      </p>
                    </div>
                    {isReady ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 shrink-0">
                        Siap Unduh
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600 shrink-0">
                        Menunggu Desain
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* State 2: Participant Logged In */}
      {isParticipantLoggedIn && (
        <div className="space-y-4">
          {/* Logged-in Participant Identity & Ticket Summary */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <BadgeCheck className="w-6 h-6" />
              </div>
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-black text-slate-900 truncate">
                    {currentUser.title && !currentUser.name.toLowerCase().includes(currentUser.title.toLowerCase())
                      ? `${currentUser.title} ${currentUser.name}`
                      : currentUser.name}
                  </h2>
                  {activeIdReg && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-mono font-bold">
                      {activeIdReg}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  {currentUser.institution || currentUser.role || 'Peserta Terdaftar'}
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold">
                    <Ticket className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{currentUser.ticketType || 'Simposium Full Pass'}</span>
                  </span>
                  {ticketAccessSummary && (
                    <span className="text-[11px] text-slate-500">{ticketAccessSummary}</span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenParticipantLogin}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer self-start md:self-center"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Kartu / Ganti Peserta</span>
            </button>
          </div>

          {/* Always-Visible Edit Nama yang Akan Dicetak di Sertifikat */}
          <form
            onSubmit={handleConfirmSaveName}
            className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-2.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="cert-edit-print-name"
                className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Edit Nama yang Akan Dicetak di Sertifikat</span>
                {isCustomNameModified && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                    Nama Disesuaikan
                  </span>
                )}
              </label>

              {isCustomNameModified && (
                <button
                  type="button"
                  onClick={handleResetPrintName}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset ke Nama Registrasi</span>
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="cert-edit-print-name"
                type="text"
                value={customPrintName}
                onChange={(e) => handleCustomPrintNameChange(e.target.value)}
                maxLength={120}
                placeholder="Ketik nama lengkap & gelar (contoh: drh. Budi Santoso, M.Si.)"
                className="flex-1 bg-white border border-amber-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-400/40"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Terapkan Nama</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-600 flex flex-wrap items-center justify-between gap-2">
              <span>
                Pastikan penulisan nama lengkap serta gelar depan/belakang sudah benar sebelum mengunduh E-Sertifikat.
              </span>
              {nameSavedNotice && (
                <span className="text-emerald-700 font-extrabold inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Nama cetak sertifikat berhasil diperbarui!
                </span>
              )}
            </p>
          </form>

          {/* Certificates List & Interactive Preview */}
          {eligibleCertificates.length > 0 ? (
            <div className="space-y-4">
              {/* Quick list of all certificates matched to participant's ticket */}
              {eligibleCertificates.length > 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {eligibleCertificates.map((cert) => {
                    const isPngBusy = downloadingKey === `${cert.template.templateKey}-png`;
                    const isPdfBusy = downloadingKey === `${cert.template.templateKey}-pdf`;
                    return (
                      <div
                        key={cert.template.templateKey}
                        className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                              cert.template.category === 'symposium'
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-teal-100 text-teal-800'
                            }`}
                          >
                            {cert.template.category === 'symposium' ? 'SYMPOSIUM' : 'WORKSHOP'}
                          </span>
                          <h3 className="text-sm font-black text-slate-900">
                            {cert.template.templateLabel}
                          </h3>
                          <p className="text-[11px] text-slate-500 font-mono">
                            No. {cert.certificateNumber}
                            {cert.dateText ? ` · ${cert.dateText}` : ''}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={Boolean(downloadingKey)}
                            onClick={() => handleQuickDownload(cert.template, 'png')}
                            className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                          >
                            {isPngBusy ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Download className="w-3.5 h-3.5 text-emerald-600" />
                            )}
                            <span>PNG</span>
                          </button>
                          <button
                            type="button"
                            disabled={Boolean(downloadingKey)}
                            onClick={() => handleQuickDownload(cert.template, 'pdf')}
                            className="flex-1 py-2 px-3 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                          >
                            {isPdfBusy ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <FileText className="w-3.5 h-3.5" />
                            )}
                            <span>PDF (A4)</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Full Interactive Landscape Preview & Download Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    Pratinjau &amp; Unduh E-Sertifikat Anda ({eligibleCertificates.length})
                  </h3>
                  <span className="text-[11px] text-slate-400 hidden sm:inline">
                    Ukuran A4 Landscape · Resolusi Cetak HD
                  </span>
                </div>

                <ParticipantCertificateCard
                  participant={currentUser}
                  eventInfo={info}
                  customPrintName={customPrintName}
                  onCustomPrintNameChange={handleCustomPrintNameChange}
                  hideNameEditor
                />
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-900">
                E-Sertifikat Belum Tersedia untuk Paket Tiket Anda
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                {uploadedTemplateCount === 0
                  ? 'Panitia belum mengunggah desain template sertifikat. Silakan cek kembali setelah desain sertifikat diterbitkan oleh panitia.'
                  : `Tiket Anda saat ini adalah "${currentUser.ticketType || 'Simposium Full Pass'}". Desain template sertifikat untuk sesi pada tiket Anda belum diunggah oleh panitia.`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
