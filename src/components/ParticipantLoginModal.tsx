import React, { useEffect, useState } from 'react';
import {
  BadgeCheck,
  Building2,
  CreditCard,
  IdCard,
  LogIn,
  LogOut,
  RefreshCw,
  ShieldAlert,
  Ticket,
  UserCheck,
  X,
} from 'lucide-react';
import { Participant } from '../types';
import {
  extractParticipantIdRegistrant,
  findParticipantByIdRegistrant,
} from '../data/participantData';
import { lookupParticipantByIdRegistrantInFirestore } from '../services/firestoreSyncService';

interface ParticipantLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
  currentUser: Participant;
  isParticipantLoggedIn: boolean;
  onLoginSuccess: (participant: Participant) => void;
  onLogout: () => void;
  onGoogleSignIn?: () => Promise<{ ok: boolean; error?: string }>;
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
}) => {
  const [idRegistrantInput, setIdRegistrantInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showSwitchForm, setShowSwitchForm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setIdRegistrantInput('');
      setShowSwitchForm(!isParticipantLoggedIn);
    }
  }, [isOpen, isParticipantLoggedIn]);

  if (!isOpen) return null;

  const currentIdRegistrant = extractParticipantIdRegistrant(currentUser);

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
      // 1. Check authoritative Cloud Registrant Directory first (handles imported participants across devices)
      const cloudMatch = await lookupParticipantByIdRegistrantInFirestore(cleaned);
      // 2. Fallback to local participants store (handles offline or local-only admin imports)
      const localMatch = findParticipantByIdRegistrant(cleaned, participants);

      const resolved = cloudMatch
        ? localMatch
          ? { ...localMatch, ...cloudMatch, id: localMatch.id || cloudMatch.id }
          : cloudMatch
        : localMatch;

      if (!resolved) {
        setErrorMsg(
          `Id_registrant "${cleaned}" tidak ditemukan. Periksa kembali kode registrasi Anda atau hubungi panitia registrasi.`
        );
        return;
      }

      onLoginSuccess(resolved);
      onClose();
    } catch (err) {
      console.error('Participant ID login failed:', err);
      const localMatch = findParticipantByIdRegistrant(cleaned, participants);
      if (localMatch) {
        onLoginSuccess(localMatch);
        onClose();
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
        onClose();
      } else if (res.error) {
        setErrorMsg(res.error);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden text-slate-100 max-h-[92vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="participant-login-title"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-emerald-950/80 to-slate-900 p-5 border-b border-slate-800 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Tutup dialog"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-xs">
              <IdCard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950">
                  AKSES PESERTA
                </span>
                <span className="text-xs text-slate-400 font-medium">Simposium &amp; Workshop</span>
              </div>
              <h2 id="participant-login-title" className="text-lg font-black text-white mt-0.5">
                {isParticipantLoggedIn && !showSwitchForm
                  ? 'Kartu Identitas Peserta'
                  : 'Login Peserta'}
              </h2>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2 animate-in fade-in">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Active Participant Identity Card */}
          {isParticipantLoggedIn && !showSwitchForm && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-950 border border-emerald-500/40 space-y-3 shadow-inner">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider">
                    <BadgeCheck className="w-3.5 h-3.5" />
                    Peserta Terverifikasi
                  </span>
                  {currentIdRegistrant && (
                    <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-amber-300 font-mono text-[11px] font-bold">
                      {currentIdRegistrant}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-black text-white leading-snug">
                    {currentUser.name}
                  </h3>
                  {currentUser.title && (
                    <p className="text-xs text-slate-400">{currentUser.title}</p>
                  )}
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{currentUser.institution || 'RS / Faskes Peserta'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{currentUser.role || 'Peserta'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Ticket className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-emerald-300 font-semibold">
                      {currentUser.ticketType || 'Simposium Full Pass'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setShowSwitchForm(true);
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Ganti Id_registrant</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold bg-rose-600/90 hover:bg-rose-500 text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout Peserta</span>
                </button>
              </div>
            </div>
          )}

          {/* Id_registrant Login Form */}
          {(!isParticipantLoggedIn || showSwitchForm) && (
            <>
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-300 leading-relaxed">
                  Masukkan <strong className="text-emerald-300 font-mono">Id_registrant</strong> (atau ID Badge registrasi) yang Anda terima dari panitia untuk mengaktifkan identitas peserta Anda.
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="input-id-registrant"
                    className="text-xs font-bold text-slate-300 flex items-center gap-1.5"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Id_registrant</span>
                  </label>
                  <input
                    id="input-id-registrant"
                    type="text"
                    required
                    autoFocus
                    maxLength={80}
                    value={idRegistrantInput}
                    onChange={(e) => setIdRegistrantInput(e.target.value)}
                    placeholder="Contoh: ID-SIMP-2026-001"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-colors"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  {isParticipantLoggedIn && (
                    <button
                      type="button"
                      onClick={() => setShowSwitchForm(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
                    >
                      Kembali
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-5 py-2 rounded-xl text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md transition-all flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>{isLoading ? 'Memeriksa...' : 'Masuk Peserta'}</span>
                  </button>
                </div>
              </form>

              {onGoogleSignIn && (
                <>
                  <div className="relative flex items-center py-1">
                    <div className="flex-grow border-t border-slate-800"></div>
                    <span className="shrink mx-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Atau Masuk via Akun Google
                    </span>
                    <div className="flex-grow border-t border-slate-800"></div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isGoogleLoading}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4 text-sky-400" />
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
