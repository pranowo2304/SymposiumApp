import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  Award, 
  Download, 
  CheckCircle2, 
  Lock, 
  QrCode, 
  X, 
  Building, 
  Mail, 
  ShieldCheck, 
  FileCheck, 
  Printer, 
  Sparkles, 
  ChevronRight,
  Edit3,
  Calendar,
  Check
} from 'lucide-react';
import { AttendanceRecord, Participant, SymposiumInfo } from '../types';
import { SYMPOSIUM_INFO } from '../data/symposiumData';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendances: AttendanceRecord[];
  onOpenQrScanner: () => void;
  onAddDemoAttendance?: () => void;
  currentUser: Participant;
  onUpdateCurrentUser: (user: Participant) => void;
  onOpenEmailIdentification: () => void;
  eventInfo?: SymposiumInfo;
}

export const SKP_THRESHOLD = 5.0; // Minimal threshold SKP needed to unlock certificate

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  attendances,
  onOpenQrScanner,
  onAddDemoAttendance,
  currentUser,
  onUpdateCurrentUser,
  onOpenEmailIdentification,
  eventInfo
}) => {
  const info = eventInfo || SYMPOSIUM_INFO;
  const [participantName, setParticipantName] = useState(currentUser?.name || 'dr. Peserta Simposium');
  const [npaIdi, setNpaIdi] = useState(currentUser?.npaIdi || '');
  const [institution, setInstitution] = useState(currentUser?.institution || 'RS / Faskes');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [role, setRole] = useState(currentUser?.role || 'Dokter Umum');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [isEditing, setIsEditing] = useState(false);

  // Synchronize if currentUser changes
  React.useEffect(() => {
    if (currentUser) {
      setParticipantName(currentUser.name || 'dr. Peserta Simposium');
      setNpaIdi(currentUser.npaIdi || '');
      setInstitution(currentUser.institution || 'RS / Faskes');
      setEmail(currentUser.email || '');
      setRole(currentUser.role || 'Dokter Umum');
      setPhone(currentUser.phone || '');
    }
  }, [currentUser]);

  const handleSaveProfile = () => {
    const updated: Participant = {
      ...currentUser,
      name: participantName.trim() || currentUser?.name || 'dr. Peserta Simposium',
      npaIdi: npaIdi.trim(),
      institution: institution.trim() || currentUser?.institution || 'RS / Faskes',
      email: email.trim().toLowerCase() || currentUser?.email || 'peserta@mail.com',
      role: role || currentUser?.role || 'Dokter Umum',
      phone: phone.trim()
    };
    onUpdateCurrentUser(updated);
    setIsEditing(false);
  };

  const [showCertificateView, setShowCertificateView] = useState(false);

  if (!isOpen) return null;

  // Calculate Total SKP
  const totalSkp = attendances.reduce((acc, curr) => acc + curr.skpPoints, 0);
  const isEligible = totalSkp >= SKP_THRESHOLD;
  const progressPercent = Math.min((totalSkp / SKP_THRESHOLD) * 100, 100);
  const remainingSkp = Math.max(0, SKP_THRESHOLD - totalSkp);

  // Generate Serial Certificate ID
  const certSerial = `CERT-IDI-2026-${Math.floor(100000 + Math.random() * 900000)}`;

  const handlePrintCertificate = () => {
    window.print();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="bg-white rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Certificate Fullscreen / Print Modal Overlay */}
        {showCertificateView ? (
          <div className="p-4 sm:p-6 bg-slate-100 min-h-full overflow-y-auto flex flex-col justify-between space-y-4">
            
            {/* Action Bar */}
            <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-2xs print:hidden">
              <button
                onClick={() => setShowCertificateView(false)}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center"
              >
                ← Kembali ke Profil
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrintCertificate}
                  className="px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / PDF</span>
                </button>
              </div>
            </div>

            {/* Formal Certificate Card Document Design */}
            <div className="bg-white p-6 sm:p-10 rounded-2xl border-8 border-slate-900 shadow-xl relative overflow-hidden font-serif text-center space-y-6 print:border-4 print:shadow-none">
              
              {/* Decorative Corner Borders */}
              <div className="absolute top-3 left-3 w-12 h-12 border-t-2 border-l-2 border-amber-600 pointer-events-none" />
              <div className="absolute top-3 right-3 w-12 h-12 border-t-2 border-r-2 border-amber-600 pointer-events-none" />
              <div className="absolute bottom-3 left-3 w-12 h-12 border-b-2 border-l-2 border-amber-600 pointer-events-none" />
              <div className="absolute bottom-3 right-3 w-12 h-12 border-b-2 border-r-2 border-amber-600 pointer-events-none" />

              {/* Certificate Header */}
              <div className="space-y-1">
                {info.logoUrl && (
                  <div className="flex justify-center mb-2">
                    <div className="w-14 h-14 rounded-xl bg-white p-1 border border-amber-200 shadow-2xs flex items-center justify-center overflow-hidden">
                      <img
                        src={info.logoUrl}
                        alt={info.title}
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-center space-x-3 mb-2 font-sans">
                  <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-bold uppercase tracking-widest rounded border border-amber-300">
                    Akreditasi Resmi IDI & Kemenkes RI
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 uppercase tracking-wider font-sans">
                  SERTIFIKAT KELULUSAN
                </h1>
                <p className="text-xs text-slate-500 font-sans tracking-wide">
                  Nomor Sertifikat: <span className="font-mono font-bold text-slate-800">{certSerial}</span>
                </p>
              </div>

              {/* Recipient Name */}
              <div className="py-3 border-y border-slate-200 my-4 space-y-1">
                <p className="text-xs text-slate-500 font-sans italic">Diberikan Kepada Dokter Peserta Simposium:</p>
                <h2 className="text-xl sm:text-2xl font-black text-blue-950 tracking-tight font-sans">
                  {participantName}
                </h2>
                <p className="text-xs text-slate-600 font-sans">
                  NPA IDI: <strong className="text-slate-800">{npaIdi}</strong> • {institution}
                </p>
              </div>

              {/* Achievement Text */}
              <div className="text-xs sm:text-sm text-slate-700 font-sans leading-relaxed space-y-2">
                <p>
                  Atas partisipasi aktif dan kehadiran penuh pada seluruh rangkaian ilmiah:
                </p>
                <p className="font-extrabold text-slate-900 text-sm sm:text-base">
                  "{info.title}"
                </p>
                <p className="text-xs text-slate-500">
                  Diselenggarakan oleh {info.organizer} pada {info.dateString || `${info.dates.day1} - ${info.dates.day2}`}.
                </p>
              </div>

              {/* SKP Badge Seal */}
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200/80 inline-block font-sans my-2">
                <span className="text-[10px] text-amber-800 uppercase font-bold tracking-wider block">
                  Total Nilai Kredit Profesi Terkumpul:
                </span>
                <span className="text-2xl font-black text-amber-600">
                  {totalSkp.toFixed(1)} SKP IDI
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  (Diverifikasi via Presensi QR Code {attendances.length} Sesi)
                </span>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-200 font-sans text-xs">
                <div>
                  <div className="h-10 border-b border-slate-300 w-28 mx-auto mb-1 opacity-40 flex items-end justify-center text-[10px] italic text-slate-400">
                    [Tanda Tangan Digital]
                  </div>
                  <p className="font-bold text-slate-900">Dr. dr. H. Soeharto, Sp.PD-KGEH</p>
                  <p className="text-[10px] text-slate-500">Ketua Panitia Simposium 2026</p>
                </div>

                <div>
                  <div className="h-10 border-b border-slate-300 w-28 mx-auto mb-1 opacity-40 flex items-end justify-center text-[10px] italic text-slate-400">
                    [Tanda Tangan Digital]
                  </div>
                  <p className="font-bold text-slate-900">Prof. dr. Ari Fahrial, Sp.PD</p>
                  <p className="text-[10px] text-slate-500">Pengurus PB IDI / Tim SKP</p>
                </div>
              </div>

            </div>

          </div>
        ) : (
          /* Profile & SKP Dashboard View */
          <>
            {/* Header */}
            <div className="bg-slate-900 text-white p-4 relative border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold shadow-sm">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white leading-tight">
                    Profil Peserta & Sertifikat SKP
                  </h3>
                  <p className="text-xs text-blue-300">
                    Status presensi kehadiran & klaim e-sertifikat resmi
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1">
              
              {/* Participant Info Card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/90 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    Identitas Peserta Terdaftar
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={onOpenEmailIdentification}
                      className="text-xs bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors"
                      title="Ganti akun atau cari email peserta lainnya"
                    >
                      <Mail className="w-3 h-3 text-blue-600" />
                      <span>Ganti Akun Email</span>
                    </button>
                    <button
                      onClick={() => {
                        if (isEditing) {
                          handleSaveProfile();
                        } else {
                          setIsEditing(true);
                        }
                      }}
                      className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors"
                    >
                      <Edit3 className="w-3 h-3" />
                      {isEditing ? 'Simpan Perubahan' : 'Ubah Data'}
                    </button>
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-2.5 text-xs bg-white p-3 rounded-xl border border-slate-200">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Nama & Gelar Dokter:</label>
                      <input
                        type="text"
                        value={participantName}
                        onChange={(e) => setParticipantName(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-blue-600"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Email Terdaftar:</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-hidden focus:ring-1 focus:ring-blue-600"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">NPA IDI:</label>
                        <input
                          type="text"
                          value={npaIdi}
                          onChange={(e) => setNpaIdi(e.target.value)}
                          className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold focus:outline-hidden focus:ring-1 focus:ring-blue-600"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Instansi / RS:</label>
                        <input
                          type="text"
                          value={institution}
                          onChange={(e) => setInstitution(e.target.value)}
                          className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-hidden focus:ring-1 focus:ring-blue-600"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Kategori Profesi:</label>
                        <select
                          value={role}
                          onChange={(e) => setRole(e.target.value as any)}
                          className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-hidden"
                        >
                          <option value="Dokter Spesialis">Dokter Spesialis</option>
                          <option value="Dokter Umum">Dokter Umum</option>
                          <option value="Residen">Residen</option>
                          <option value="Mahasiswa Kedokteran">Mahasiswa Kedokteran</option>
                          <option value="Panitia">Panitia</option>
                          <option value="Peserta">Peserta</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-3 py-1 text-slate-500 hover:text-slate-700 text-xs font-semibold"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveProfile}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
                      >
                        Simpan
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-extrabold text-slate-900">{participantName}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                          {role}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="text-blue-700 font-semibold">{email}</span>
                        <span>•</span>
                        <span>NPA IDI: <strong className="text-slate-800">{npaIdi || '-'}</strong></span>
                        <span>•</span>
                        <span>{institution}</span>
                      </p>
                    </div>

                    <div className="text-left sm:text-right text-[11px] text-slate-400">
                      <div>Badge: <span className="font-mono text-slate-600 font-bold">{currentUser?.badgeId || 'ID-SIMP'}</span></div>
                      <div className="text-emerald-600 font-semibold">{currentUser?.ticketType || 'All-Access'}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* SKP Requirement Progress Card */}
              <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white p-4 sm:p-5 rounded-2xl shadow-md border border-slate-800 space-y-4">
                
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <Award className="w-5 h-5 text-amber-400" />
                    <span className="text-xs font-bold text-slate-200">Kualifikasi Sertifikat SKP IDI</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${
                    isEligible ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {isEligible ? 'Syarat Terpenuhi 🎉' : 'Belum Mencapai Ambang Batas'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase font-bold block">Terkumpul Via Presensi QR:</span>
                    <span className="text-3xl font-black text-amber-400">
                      {totalSkp.toFixed(1)} <span className="text-xs font-normal text-slate-300">/ {SKP_THRESHOLD.toFixed(1)} SKP Target</span>
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 uppercase font-bold block">Target Minimal:</span>
                    <span className="text-xs font-bold text-slate-200 bg-slate-800 px-2.5 py-1 rounded-lg inline-block">
                      {SKP_THRESHOLD.toFixed(1)} SKP IDI
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700/60">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${isEligible ? 'bg-emerald-400' : 'bg-amber-400'}`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-0.5">
                    <span>{progressPercent.toFixed(0)}% Selesai</span>
                    <span>
                      {isEligible 
                        ? 'Siap diunduh!' 
                        : `Kurang ${remainingSkp.toFixed(1)} SKP lagi`}
                    </span>
                  </div>
                </div>

                {/* DOWNLOAD CERTIFICATE ACTION BUTTON */}
                <div className="pt-2">
                  {isEligible ? (
                    <button
                      onClick={() => setShowCertificateView(true)}
                      className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center justify-center space-x-2 group cursor-pointer"
                    >
                      <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                      <span>Unduh Sertifikat Resmi (PDF)</span>
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <button
                        disabled
                        className="w-full py-3 bg-slate-800 text-slate-400 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 cursor-not-allowed opacity-80 border border-slate-700"
                      >
                        <Lock className="w-4 h-4 text-slate-500" />
                        <span>Unduh Sertifikat (Terkunci)</span>
                      </button>
                      <p className="text-[11px] text-slate-400 text-center">
                        Pindai QR Code di minimal 2 sesi simposium untuk membuka tombol unduh sertifikat.
                      </p>
                    </div>
                  )}
                </div>

              </div>

              {/* Quick Action Test Helpers if not eligible yet */}
              {!isEligible && (
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-900 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                  <div>
                    <strong>Butuh Cepat Coba Sertifikat?</strong>
                    <p className="text-[11px] text-blue-800/80">
                      Anda bisa menambah presensi demo instan untuk menguji unduh sertifikat.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    {onAddDemoAttendance && (
                      <button
                        onClick={onAddDemoAttendance}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
                      >
                        + Tambah 2 Sesi (+5.0 SKP)
                      </button>
                    )}
                    <button
                      onClick={() => {
                        onClose();
                        onOpenQrScanner();
                      }}
                      className="px-3 py-1.5 bg-white border border-blue-300 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors"
                    >
                      <QrCode className="w-3.5 h-3.5 inline mr-1" />
                      Pindai QR
                    </button>
                  </div>
                </div>
              )}

              {/* Attended Sessions History */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                  <span>Sesi Yang Telah Diikuti ({attendances.length}):</span>
                  <span className="text-slate-400 text-[10px] font-normal">
                    Terverifikasi QR Code
                  </span>
                </h4>

                {attendances.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                    Belum ada presensi tercatat. Silakan pindai QR Code di ruang simposium.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                    {attendances.map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs flex items-center justify-between"
                      >
                        <div>
                          <div className="text-[10px] text-slate-400 font-bold">{item.day} • {item.room}</div>
                          <div className="font-bold text-slate-900">{item.sessionTitle}</div>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded shrink-0">
                          +{item.skpPoints} SKP
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center text-[11px]">
                <FileCheck className="w-3.5 h-3.5 text-blue-600 mr-1" />
                Sertifikat Digital Sah Ber-SKP IDI
              </span>
              <button
                onClick={onClose}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition-colors"
              >
                Tutup
              </button>
            </div>
          </>
        )}

      </motion.div>
    </motion.div>
  );
};
