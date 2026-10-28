import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, 
  User, 
  CheckCircle2, 
  Building, 
  Award, 
  Search, 
  X, 
  UserPlus, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  HelpCircle,
  LogOut,
  Check
} from 'lucide-react';
import { Participant } from '../types';
import { findParticipantByEmail, registerOrUpdateParticipant, getActiveParticipant } from '../data/participantData';

interface EmailIdentificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: Participant;
  currentParticipant?: Participant;
  allParticipants?: Participant[];
  onSelectUser?: (user: Participant) => void;
  onSelectParticipant?: (user: Participant) => void;
  onParticipantCreated?: (user: Participant) => void;
  onRegisterNew?: (user: Participant) => void;
}

export const EmailIdentificationModal: React.FC<EmailIdentificationModalProps> = ({
  isOpen,
  onClose,
  currentUser: propCurrentUser,
  currentParticipant,
  allParticipants = [],
  onSelectUser,
  onSelectParticipant,
  onParticipantCreated,
  onRegisterNew
}) => {
  const activeUser = propCurrentUser || currentParticipant || getActiveParticipant();
  const [emailInput, setEmailInput] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // New participant registration form state
  const [newName, setNewName] = useState('');
  const [newInstitution, setNewInstitution] = useState('');
  const [newRole, setNewRole] = useState<Participant['role']>('Dokter Spesialis');
  const [newNpaIdi, setNewNpaIdi] = useState('');
  const [newPhone, setNewPhone] = useState('');

  // Live matching participants
  const searchResults = useMemo(() => {
    if (!emailInput.trim()) return [];
    const query = emailInput.trim().toLowerCase();
    return (allParticipants || []).filter(p => 
      (p?.email && p.email.toLowerCase().includes(query)) || 
      (p?.name && p.name.toLowerCase().includes(query)) ||
      (p?.institution && p.institution.toLowerCase().includes(query))
    );
  }, [emailInput, allParticipants]);

  const exactMatch = useMemo(() => {
    if (!emailInput.trim()) return null;
    return findParticipantByEmail(emailInput.trim(), allParticipants);
  }, [emailInput, allParticipants]);

  if (!isOpen) return null;

  const handleSelectExact = (user: Participant) => {
    if (onSelectParticipant) onSelectParticipant(user);
    if (onSelectUser) onSelectUser(user);
    onClose();
  };

  const handleCreateNewParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !newName.trim()) return;

    const newParticipant: Participant = {
      id: `part-${Date.now()}`,
      email: emailInput.trim().toLowerCase(),
      name: newName.trim(),
      institution: newInstitution.trim() || 'RS / Klinik Mandiri',
      role: newRole,
      npaIdi: newNpaIdi.trim() || `${Math.floor(100 + Math.random() * 800)}.${Math.floor(100 + Math.random() * 800)}/IDI`,
      phone: newPhone.trim(),
      ticketType: 'All-Access (Simposium + Workshop)',
      badgeId: `ID-SIMP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      registeredAt: new Date().toISOString().split('T')[0]
    };

    const result = registerOrUpdateParticipant(newParticipant);
    if (onParticipantCreated) {
      onParticipantCreated(result.saved);
    }
    if (onRegisterNew) {
      onRegisterNew(result.saved);
    }
    if (onSelectParticipant) {
      onSelectParticipant(result.saved);
    }
    if (onSelectUser) {
      onSelectUser(result.saved);
    }
    setIsRegisterMode(false);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col my-auto transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-300 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2.5 mb-1.5">
            <span className="p-2 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-300">
              <Mail className="w-5 h-5" />
            </span>
            <div>
              <span className="text-[11px] uppercase tracking-wider font-extrabold text-blue-400 block">
                Sistem Identifikasi Peserta
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
                Identifikasi Peserta via Email
              </h2>
            </div>
          </div>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            Masukkan alamat email yang Anda gunakan saat registrasi untuk menyinkronkan nama, gelar, institusi, dan riwayat presensi SKP IDI Anda.
          </p>

          {/* Current Active Badge */}
          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-slate-400">Pengguna Aktif Saat Ini:</span>
            <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full font-bold text-white">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="truncate max-w-[200px]">{activeUser?.name || 'Peserta Simposium'}</span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Email Search Box */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Cari atau Masukkan Alamat Email:
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="email"
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  setIsRegisterMode(false);
                }}
                placeholder="contoh: pranowo.tfc@gmail.com atau nama dokter..."
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl pl-10 pr-10 py-2.5 text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all placeholder:text-slate-400"
                autoFocus
              />
              {emailInput && (
                <button
                  type="button"
                  onClick={() => {
                    setEmailInput('');
                    setIsRegisterMode(false);
                  }}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Exact Match Card Preview */}
          {exactMatch && !isRegisterMode && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-50/80 border-2 border-emerald-300 rounded-2xl p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center space-x-2">
                  <span className="p-1.5 rounded-lg bg-emerald-600 text-white">
                    <CheckCircle2 className="w-4 h-4" />
                  </span>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">
                      Email Terdaftar Ditemukan!
                    </span>
                    <h3 className="text-sm font-black text-slate-900">
                      {exactMatch.name}
                    </h3>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                  {exactMatch.role}
                </span>
              </div>

              <div className="space-y-1 text-xs text-slate-600 mt-2 bg-white/70 p-3 rounded-xl border border-emerald-200/60">
                <p className="flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-700">{exactMatch.institution}</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>NPA IDI: <strong className="text-slate-800">{exactMatch.npaIdi || '-'}</strong></span>
                </p>
                <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <span>Badge ID: {exactMatch.badgeId} • Tiket: {exactMatch.ticketType || 'Simposium'}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleSelectExact(exactMatch)}
                className="mt-3 w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <span>Terapkan & Masuk sebagai {exactMatch.name ? exactMatch.name.split(',')[0] : 'Peserta'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* If No Match Found and Email is typed */}
          {!exactMatch && emailInput.trim().length > 3 && !isRegisterMode && (
            <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 text-xs">
              <div className="flex items-start space-x-2.5">
                <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-bold text-amber-900">
                    Email "{emailInput}" belum ada di database
                  </h4>
                  <p className="text-amber-800 text-[11px] mt-0.5">
                    Apakah Anda peserta baru? Anda dapat langsung mendaftarkan nama dan institusi Anda sekarang.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegisterMode(true);
                      setNewName('');
                      setNewInstitution('');
                    }}
                    className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-2xs transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Daftarkan Identitas Peserta Baru</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quick Registration Form */}
          {isRegisterMode && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleCreateNewParticipant}
              className="bg-slate-50 border border-slate-300 rounded-2xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-blue-600" />
                  Pendaftaran Identitas Peserta Baru
                </span>
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs"
                >
                  Batal
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nama Lengkap & Gelar <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="misal: dr. Pranowo, Sp.PD atau dr. Budi"
                  className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Kategori Profesi
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-900 focus:outline-hidden"
                  >
                    <option value="Dokter Spesialis">Dokter Spesialis</option>
                    <option value="Dokter Umum">Dokter Umum</option>
                    <option value="Residen">Residen / PPDS</option>
                    <option value="Mahasiswa Kedokteran">Mahasiswa Kedokteran</option>
                    <option value="Panitia">Panitia</option>
                    <option value="Peserta">Peserta Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nomor NPA IDI
                  </label>
                  <input
                    type="text"
                    value={newNpaIdi}
                    onChange={(e) => setNewNpaIdi(e.target.value)}
                    placeholder="misal: 301.992/IDI"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Institusi / Rumah Sakit / Klinik
                </label>
                <input
                  type="text"
                  value={newInstitution}
                  onChange={(e) => setNewInstitution(e.target.value)}
                  placeholder="misal: RSUP Dr. Kariadi Semarang"
                  className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 mt-2"
              >
                <Check className="w-4 h-4" />
                <span>Simpan & Masuk sebagai Peserta</span>
              </button>
            </motion.form>
          )}

          {/* Quick Select Preset List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">
                Pilih Cepat dari Database Peserta Terdaftar ({allParticipants.length}):
              </span>
              <span className="text-[10px] text-slate-400">Klik untuk langsung beralih</span>
            </div>

            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {(searchResults.length > 0 ? searchResults : allParticipants).map((part) => {
                const isActive = !!(activeUser?.email && part?.email && part.email.toLowerCase() === activeUser.email.toLowerCase());
                return (
                  <button
                    key={part.id}
                    type="button"
                    onClick={() => handleSelectExact(part)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between group ${
                      isActive
                        ? 'bg-blue-50 border-blue-300 shadow-2xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 group-hover:bg-slate-200'
                      }`}>
                        {part?.name ? part.name.replace(/dr\.|drg\.|Prof\.|Sp\.[A-Z]+/gi, '').trim().slice(0, 2).toUpperCase() || 'DR' : 'DR'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {part?.name || 'Peserta'}
                          </span>
                          {isActive && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full bg-blue-600 text-white">
                              Aktif
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">
                          {part.email} • {part.institution}
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-semibold text-slate-400 group-hover:text-blue-600 shrink-0 ml-2">
                      Pilih →
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Data tersinkron otomatis ke Presensi & Live Q&A</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors"
          >
            Tutup
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
