import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  IdCard,
  LogIn,
  LogOut,
  ShieldAlert,
  X,
} from 'lucide-react';
import { Participant, SymposiumInfo } from '../types';
import { SYMPOSIUM_INFO } from '../data/symposiumData';
import { findParticipantByIdRegistrant } from '../data/participantData';
import { lookupParticipantByIdRegistrantInFirestore } from '../services/firestoreSyncService';
import { resolveParticipantCertificates } from '../utils/certificateTemplates';
import { ParticipantIdentityCard } from './ParticipantIdentityCard';
import { ParticipantCertificateCard } from './ParticipantCertificateCard';

interface ParticipantLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
  currentUser: Participant;
  isParticipantLoggedIn: boolean;
  onLoginSuccess: (participant: Participant) => void;
  onLogout: () => void;
  onGoogleSignIn?: () => Promise<{ ok: boolean; error?: string }>;
  eventInfo?: SymposiumInfo;
}

export const ParticipantLoginModal: React.FC<ParticipantLoginModalProps> = ({
  isOpen,
  onClose,
  participants,
  currentUser,
  isParticipantLoggedIn,
  onLoginSuccess,
  onLogout,
  onGoogleSignIn,
  eventInfo,
}) => {
  const [idRegistrantInput, setIdRegistrantInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showSwitchForm, setShowSwitchForm] = useState(false);
  const [activeView, setActiveView] = useState<'card' | 'certificate'>('card');

  const availableCertificates = useMemo(
    () =>
      isParticipantLoggedIn
        ? resolveParticipantCertificates(currentUser, eventInfo || SYMPOSIUM_INFO)
        : [],
    [isParticipantLoggedIn, currentUser, eventInfo]
  );

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setIdRegistrantInput('');
      setShowSwitchForm(!isParticipantLoggedIn);
      setActiveView('card');
    }
  }, [isOpen, isParticipantLoggedIn]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleaned = idRegistrantInput.trim().slice(0, 80);
    if (!cleaned) {
      setErrorMsg('Silakan masukkan Id_registrant Anda terlebih dahulu.');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Check local participants store first for instant reliability
      const localMatch = findParticipantByIdRegistrant(cleaned, participants);
      // 2. Fallback to authoritative Cloud Registrant Directory
      const cloudMatch = localMatch ? null : await lookupParticipantByIdRegistrantInFirestore(cleaned);

      const resolved = localMatch
        ? cloudMatch
          ? { ...localMatch, ...cloudMatch, id: localMatch.id || cloudMatch.id }
          : localMatch
        : cloudMatch;

      if (!resolved) {
        setErrorMsg(
          `Id_registrant "${cleaned}" belum ditemukan di perangkat ini maupun Cloud Database. Pastikan kode sesuai data registrasi, dan jika panitia baru mengimpor data peserta, pastikan sudah disinkronkan via Admin Google ("Sync Id_registrant ke Cloud").`
        );
        return;
      }

      onLoginSuccess(resolved);
      setShowSwitchForm(false);
    } catch (err) {
      console.error('Participant ID login failed:', err);
      const localMatch = findParticipantByIdRegistrant(cleaned, participants);
      if (localMatch) {
        onLoginSuccess(localMatch);
        setShowSwitchForm(false);
      } else {
        setErrorMsg('Gagal memverifikasi Id_registrant. Silakan coba lagi.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!onGoogleSignIn) return;
    setErrorMsg(null);
    setIsGoogleLoading(true);
    try {
      const res = await onGoogleSignIn();
      if (res.ok) {
        setShowSwitchForm(false);
      } else if (res.error) {
        setErrorMsg(res.error);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-emerald-950/35 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`bg-white border border-emerald-100 w-full ${
          isParticipantLoggedIn && !showSwitchForm
            ? activeView === 'certificate'
              ? 'max-w-2xl'
              : 'max-w-lg'
            : 'max-w-md'
        } rounded-3xl shadow-2xl shadow-emerald-950/15 overflow-hidden text-slate-800 max-h-[92vh] overflow-y-auto transition-all`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="participant-login-title"
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-50 via-white to-green-50/90 p-5 sm:p-6 border-b border-emerald-100 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-emerald-900 hover:bg-emerald-100/70 transition-colors cursor-pointer"
            title="Tutup dialog"
            aria-label="Tutup dialog"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5 pr-10">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-600/25">
              {activeView === 'certificate' && isParticipantLoggedIn && !showSwitchForm ? (
                <Award className="w-6 h-6" />
              ) : (
                <IdCard className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
                <span className="uppercase tracking-wider">Akses Peserta</span>
                <span className="text-emerald-300" aria-hidden="true">·</span>
                <span className="text-slate-500 font-semibold">Simposium &amp; Workshop</span>
              </div>
              <h2 id="participant-login-title" className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mt-0.5">
                {isParticipantLoggedIn && !showSwitchForm
                  ? activeView === 'certificate'
                    ? 'E-Sertifikat Peserta'
                    : 'Kartu Identitas Peserta'
                  : 'Login Peserta'}
              </h2>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-4 bg-white">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {/* Active Participant Identity Card / E-Certificate View */}
          {isParticipantLoggedIn && !showSwitchForm && (
            <div className="space-y-4">
              {availableCertificates.length > 0 && (
                <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-emerald-50 border border-emerald-100">
                  <button
                    type="button"
                    onClick={() => setActiveView('card')}
                    className={`min-h-[42px] py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      activeView === 'card'
                        ? 'bg-emerald-600 text-white font-extrabold shadow-xs'
                        : 'text-slate-600 hover:text-emerald-900 hover:bg-white/70'
                    }`}
                  >
                    <IdCard className="w-3.5 h-3.5" />
                    <span>Kartu Identitas</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveView('certificate')}
                    className={`min-h-[42px] py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      activeView === 'certificate'
                        ? 'bg-emerald-600 text-white font-extrabold shadow-xs'
                        : 'text-slate-600 hover:text-emerald-900 hover:bg-white/70'
                    }`}
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>E-Sertifikat ({availableCertificates.length})</span>
                  </button>
                </div>
              )}

              {activeView === 'certificate' && availableCertificates.length > 0 ? (
                <ParticipantCertificateCard
                  participant={currentUser}
                  eventInfo={eventInfo}
                />
              ) : (
                <ParticipantIdentityCard
                  participant={currentUser}
                  eventInfo={eventInfo}
                />
              )}

              <div className="flex pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="w-full min-h-[44px] py-2.5 px-3.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}

          {/* Id_registrant Login Form */}
          {(!isParticipantLoggedIn || showSwitchForm) && (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-xs text-emerald-950 font-semibold leading-relaxed">
                  Masukkan Nomor. Registrasi Anda
                </div>

                <div>
                  <input
                    id="input-id-registrant"
                    type="text"
                    required
                    autoFocus
                    maxLength={80}
                    aria-label="Nomor Registrasi"
                    value={idRegistrantInput}
                    onChange={(e) => setIdRegistrantInput(e.target.value)}
                    className="w-full min-h-[46px] bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-colors"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  {isParticipantLoggedIn && (
                    <button
                      type="button"
                      onClick={() => setShowSwitchForm(false)}
                      className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-emerald-900 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 transition-colors cursor-pointer"
                    >
                      Kembali
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onClose}
                    className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-emerald-900 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="min-h-[44px] px-5 py-2 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/25 transition-all flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{isLoading ? 'Memeriksa...' : 'Masuk Peserta'}</span>
                  </button>
                </div>
              </form>

              {onGoogleSignIn && (
                <>
                  <div className="relative flex items-center py-1">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="shrink mx-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Atau Masuk via Akun Google
                    </span>
                    <div className="flex-grow border-t border-slate-200"></div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isGoogleLoading}
                    className="w-full min-h-[46px] py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-50/70 hover:bg-emerald-100/80 text-emerald-900 border border-emerald-200 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4 text-emerald-700" />
                    <span>
                      {isGoogleLoading
                        ? 'Menghubungkan Akun Google...'
                        : 'Masuk dengan Google (Sesuai Email Terdaftar)'}
                    </span>
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
