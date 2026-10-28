import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Send, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  BellRing, 
  Volume2, 
  VolumeX, 
  History, 
  Trash2, 
  RotateCcw, 
  Sparkles, 
  ArrowRight, 
  Eye, 
  XCircle, 
  Layers, 
  Radio, 
  Check, 
  Copy,
  Info
} from 'lucide-react';
import { BroadcastNotification, BroadcastType } from '../../types';
import { playBroadcastChime } from '../../utils/broadcastSound';

interface AdminBroadcastManagerProps {
  onSendBroadcast: (broadcast: BroadcastNotification) => void;
  onClearActiveBroadcast: () => void;
  activeBroadcast: BroadcastNotification | null;
  onShowToast: (msg: string) => void;
}

// Pre-crafted broadcast templates for medical symposium committee
const BROADCAST_TEMPLATES: Array<{
  id: string;
  category: string;
  type: BroadcastType;
  title: string;
  message: string;
  actionTab?: string;
  actionLabel?: string;
  durationSeconds: number;
}> = [
  {
    id: 'plenary-starting',
    category: 'Plenary',
    type: 'warning',
    title: 'Sesi Plenary 2 Segera Dimulai',
    message: 'Sesi Plenary Keynote akan dimulai dalam 10 menit di Grand Ballroom Lantai 1. Mohon seluruh peserta segera memasuki ruangan.',
    actionTab: 'symposium',
    actionLabel: 'Lihat Jadwal Plenary',
    durationSeconds: 12
  },
  {
    id: 'room-change',
    category: 'Ruangan',
    type: 'urgent',
    title: 'Pemberitahuan Perubahan Ruangan',
    message: 'Perhatian: Workshop USG POCUS dipindahkan ke Ruang Workshop B Lantai 2 karena kapasitas peserta. Harap periksa denah venue.',
    actionTab: 'venue',
    actionLabel: 'Lihat Denah Ruangan',
    durationSeconds: 15
  },
  {
    id: 'attendance-open',
    category: 'Presensi',
    type: 'success',
    title: 'Presensi QR Code Sesi Telah Dibuka',
    message: 'Barcode presensi kehadiran Sesi Simposium Siang telah diaktifkan di pintu masuk ruangan. Silakan pindai untuk akumulasi poin SKP.',
    actionTab: 'presensi',
    actionLabel: 'Buka Scanner QR',
    durationSeconds: 15
  },
  {
    id: 'lunch-exhibition',
    category: 'Pameran',
    type: 'info',
    title: 'Waktu Ishoma & Kunjungan Pameran',
    message: 'Sesi Ishoma telah dimulai. Peserta dipersilakan menikmati makan siang di Foyer dan mengunjungi 8 Booth Pameran Alat Medis & Farmasi.',
    actionTab: 'pameran',
    actionLabel: 'Jelajahi Pameran',
    durationSeconds: 12
  },
  {
    id: 'certificate-ready',
    category: 'Sertifikat',
    type: 'success',
    title: 'E-Sertifikat SKP IDI/Kemenkes Tersedia',
    message: 'Sertifikat kepesertaan resmi ber-barcode dengan akumulasi poin SKP telah diterbitkan dan dapat diunduh di tab Profil & Sertifikat.',
    actionTab: 'profil',
    actionLabel: 'Unduh E-Sertifikat',
    durationSeconds: 20
  },
  {
    id: 'coffee-break',
    category: 'Umum',
    type: 'info',
    title: 'Coffee Break & Networking',
    message: 'Coffee break dan hidangan rehat sore telah tersedia di Foyer Ballroom. Sesi berikutnya akan dimulai pukul 15.30 WIB.',
    actionTab: 'symposium',
    actionLabel: 'Cek Jadwal Sesi',
    durationSeconds: 10
  }
];

export const AdminBroadcastManager: React.FC<AdminBroadcastManagerProps> = ({
  onSendBroadcast,
  onClearActiveBroadcast,
  activeBroadcast,
  onShowToast
}) => {
  // Form state
  const [title, setTitle] = useState<string>('Sesi Plenary 2 Segera Dimulai');
  const [message, setMessage] = useState<string>('Sesi Plenary Keynote akan dimulai dalam 10 menit di Grand Ballroom Lantai 1. Mohon seluruh peserta segera memasuki ruangan.');
  const [type, setType] = useState<BroadcastType>('warning');
  const [category, setCategory] = useState<string>('Plenary');
  const [actionTab, setActionTab] = useState<string>('symposium');
  const [actionLabel, setActionLabel] = useState<string>('Lihat Jadwal Plenary');
  const [durationSeconds, setDurationSeconds] = useState<number>(12);
  const [sound, setSound] = useState<boolean>(true);
  const [sentBy, setSentBy] = useState<string>('Panitia Pelaksana Simposium');

  // Broadcast History
  const [history, setHistory] = useState<BroadcastNotification[]>(() => {
    try {
      const saved = localStorage.getItem('simposium_broadcast_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    // Default initial sample history
    return [
      {
        id: 'hist-1',
        title: 'Registrasi Ulang Peserta Dibuka',
        message: 'Selamat datang di Simposium Kedokteran 2026. Registrasi ulang peserta dibuka di Meja Sekretariat Lantai 1.',
        type: 'info',
        category: 'Umum',
        actionTab: 'home',
        actionLabel: 'Buka Beranda',
        durationSeconds: 10,
        sound: true,
        timestamp: Date.now() - 3600000 * 3,
        sentBy: 'Sekretariat Panitia'
      }
    ];
  });

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('simposium_broadcast_history', JSON.stringify(history));
    } catch (e) {
      console.error(e);
    }
  }, [history]);

  const handleApplyTemplate = (tmpl: typeof BROADCAST_TEMPLATES[0]) => {
    setTitle(tmpl.title);
    setMessage(tmpl.message);
    setType(tmpl.type);
    setCategory(tmpl.category);
    setActionTab(tmpl.actionTab || '');
    setActionLabel(tmpl.actionLabel || '');
    setDurationSeconds(tmpl.durationSeconds);
    onShowToast(`Template "${tmpl.title}" dimuat ke formulir.`);
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!title.trim() || !message.trim()) {
      onShowToast('Mohon masukkan Judul dan Isi Pesan siaran.');
      return;
    }

    const newBroadcast: BroadcastNotification = {
      id: `bc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      message: message.trim(),
      type,
      category: category.trim() || 'Pengumuman',
      actionTab: actionTab || undefined,
      actionLabel: actionLabel.trim() || undefined,
      durationSeconds: Number(durationSeconds),
      sound,
      timestamp: Date.now(),
      sentBy: sentBy.trim() || 'Panitia Pelaksana Simposium'
    };

    // Play chime if enabled
    if (sound) {
      playBroadcastChime(type);
    }

    // Trigger broadcast
    onSendBroadcast(newBroadcast);

    // Add to history
    setHistory(prev => [newBroadcast, ...prev.slice(0, 19)]); // keep last 20
    onShowToast('Pesan siaran (broadcast) berhasil dikirim ke seluruh perangkat peserta!');
  };

  const handleResendHistory = (item: BroadcastNotification) => {
    const refreshed: BroadcastNotification = {
      ...item,
      id: `bc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now()
    };
    if (refreshed.sound) {
      playBroadcastChime(refreshed.type);
    }
    onSendBroadcast(refreshed);
    setHistory(prev => [refreshed, ...prev.filter(h => h.id !== item.id)]);
    onShowToast(`Siaran "${item.title}" dikirim ulang ke seluruh peserta.`);
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
    onShowToast('Pesan dihapus dari riwayat.');
  };

  const handleClearHistory = () => {
    setHistory([]);
    onShowToast('Riwayat broadcast telah dikosongkan.');
  };

  const handleTestChime = () => {
    playBroadcastChime(type);
    onShowToast('Memutar nada chime audio notifikasi...');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner / Explainer */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-800/50 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-md">
              <Megaphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                  REAL-TIME BROADCAST
                </span>
                <span className="text-xs text-indigo-200 font-semibold">
                  Notifikasi Pengumuman Panitia
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-1">
                Kirim Siaran Notifikasi ke Seluruh Peserta
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl mt-0.5 leading-relaxed">
                Pesan yang Anda kirimkan akan langsung muncul seketika sebagai toast notifikasi interaktif di layar perangkat seluruh peserta simposium, dilengkapi pilihan nada pengingat dan tombol aksi cepat.
              </p>
            </div>
          </div>

          {/* Quick Active Broadcast Status Bar */}
          {activeBroadcast ? (
            <div className="bg-slate-800/90 border border-amber-400/40 p-3 rounded-xl flex items-center gap-3 shrink-0">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></div>
              <div>
                <div className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">
                  Siaran Aktif Saat Ini
                </div>
                <div className="text-xs font-black text-white truncate max-w-[180px]">
                  {activeBroadcast.title}
                </div>
              </div>
              <button
                onClick={() => {
                  onClearActiveBroadcast();
                  onShowToast('Siaran aktif berhasil ditarik dari layar.');
                }}
                className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 text-xs font-bold border border-rose-500/40 transition-colors flex items-center gap-1"
                title="Tutup siaran dari layar semua peserta sekarang"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Tarik Siaran</span>
              </button>
            </div>
          ) : (
            <div className="text-xs text-slate-400 bg-slate-800/40 px-3 py-2 rounded-xl border border-slate-700/50 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-500"></span>
              <span>Tidak ada siaran aktif yang sedang tayang.</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Template Presets */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Pilihan Template Pesan Cepat (1-Klik):</span>
          </label>
          <span className="text-[11px] text-slate-500">Klik template untuk mengisi formulir</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {BROADCAST_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              type="button"
              onClick={() => handleApplyTemplate(tmpl)}
              className="text-left p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/80 transition-all text-white group flex flex-col justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700 group-hover:border-indigo-400">
                    {tmpl.category}
                  </span>
                  <span className={`text-[10px] font-bold ${
                    tmpl.type === 'urgent' ? 'text-rose-400' :
                    tmpl.type === 'warning' ? 'text-amber-400' :
                    tmpl.type === 'success' ? 'text-emerald-400' : 'text-blue-400'
                  }`}>
                    {tmpl.type.toUpperCase()}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                  {tmpl.title}
                </h4>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {tmpl.message}
                </p>
              </div>

              <div className="pt-2 mt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-indigo-400 font-bold">
                <span>Gunakan Draf Ini</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Broadcast Composer Form (Left) + Real-time Live Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Form Composer (8 Columns) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-amber-400 animate-pulse" />
              <h3 className="text-base font-black text-white">
                Formulir Buat Siaran Notifikasi
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              Karakter Pesan: {message.length}/300
            </span>
          </div>

          <form onSubmit={handleSend} className="space-y-4">
            
            {/* Urgency / Type Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <span>Tingkat Urgensi & Warna Notifikasi</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { key: 'info' as BroadcastType, label: 'Informasi', color: 'border-blue-500 bg-blue-950/40 text-blue-300' },
                  { key: 'warning' as BroadcastType, label: 'Perhatian / Perubahan', color: 'border-amber-500 bg-amber-950/40 text-amber-300' },
                  { key: 'urgent' as BroadcastType, label: 'Penting / Urgent', color: 'border-rose-500 bg-rose-950/40 text-rose-300' },
                  { key: 'success' as BroadcastType, label: 'Resmi / Berhasil', color: 'border-emerald-500 bg-emerald-950/40 text-emerald-300' }
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setType(item.key)}
                    className={`px-3 py-2 rounded-xl text-xs font-extrabold border transition-all text-center flex items-center justify-center gap-1.5 ${
                      type === item.key 
                        ? `${item.color} ring-2 ring-white/20 shadow-md` 
                        : 'border-slate-800 bg-slate-800/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {type === item.key && <Check className="w-3.5 h-3.5" />}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Judul Notifikasi
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Sesi Plenary 2 Segera Dimulai"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Kategori
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="Plenary">Plenary</option>
                  <option value="Simposium">Simposium</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Ruangan">Ruangan</option>
                  <option value="Presensi">Presensi</option>
                  <option value="Pameran">Pameran</option>
                  <option value="Sertifikat">Sertifikat</option>
                  <option value="Konsumsi">Konsumsi</option>
                  <option value="Umum">Umum</option>
                </select>
              </div>
            </div>

            {/* Message Body */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>Isi Pesan Siaran</span>
                <span className="text-[10px] text-slate-400">Gunakan kalimat yang jelas dan padat</span>
              </label>
              <textarea
                required
                rows={3}
                maxLength={300}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tuliskan pesan lengkap yang akan dibaca oleh peserta..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 leading-relaxed"
              />
            </div>

            {/* Action Link & Action Button Label */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Tautan Aksi (Buka Tab Ketika Diklik)
                </label>
                <select
                  value={actionTab}
                  onChange={(e) => {
                    const tab = e.target.value;
                    setActionTab(tab);
                    if (tab === 'symposium') setActionLabel('Lihat Jadwal Symposium');
                    else if (tab === 'workshop') setActionLabel('Buka Jadwal Workshop');
                    else if (tab === 'pameran') setActionLabel('Jelajahi Pameran Medis');
                    else if (tab === 'venue') setActionLabel('Lihat Denah Ruangan');
                    else if (tab === 'presensi') setActionLabel('Buka Presensi QR');
                    else if (tab === 'profil') setActionLabel('Lihat E-Sertifikat');
                    else if (tab === 'jadwal-saya') setActionLabel('Buka Jadwal Saya');
                    else if (tab === 'speaker') setActionLabel('Lihat Pembicara');
                    else if (tab === 'home') setActionLabel('Buka Beranda');
                    else setActionLabel('');
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="">-- Tanpa Tombol Tautan (Hanya Baca) --</option>
                  <option value="symposium">Jadwal Symposium</option>
                  <option value="workshop">Jadwal Workshop</option>
                  <option value="pameran">Pameran Medis</option>
                  <option value="venue">Denah Venue & Ruangan</option>
                  <option value="presensi">Presensi QR Code</option>
                  <option value="profil">Profil & Sertifikat</option>
                  <option value="jadwal-saya">Jadwal Saya (Bookmark)</option>
                  <option value="speaker">Daftar Speaker</option>
                  <option value="home">Beranda Simposium</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Teks Tombol Aksi
                </label>
                <input
                  type="text"
                  disabled={!actionTab}
                  value={actionLabel}
                  onChange={(e) => setActionLabel(e.target.value)}
                  placeholder="Contoh: Buka Jadwal Sesi"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Display Duration & Sound */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Durasi Tampil Toast</span>
                </label>
                <select
                  value={durationSeconds}
                  onChange={(e) => setDurationSeconds(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value={8}>8 Detik (Cepat)</option>
                  <option value={12}>12 Detik (Rekomendasi)</option>
                  <option value={18}>18 Detik (Panjang)</option>
                  <option value={30}>30 Detik</option>
                  <option value={0}>Tetap Tampil (Sampai Ditutup Peserta)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <span>Nama Pengirim Notifikasi</span>
                </label>
                <input
                  type="text"
                  value={sentBy}
                  onChange={(e) => setSentBy(e.target.value)}
                  placeholder="Panitia Pelaksana Simposium"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Audio Chime Options */}
            <div className="flex flex-wrap items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 gap-2">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={sound}
                  onChange={(e) => setSound(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-400"
                />
                <span className="flex items-center gap-1.5">
                  {sound ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                  <span>Putar Nada Chime Notifikasi di Perangkat Peserta</span>
                </span>
              </label>

              <button
                type="button"
                onClick={handleTestChime}
                className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] font-bold transition-colors flex items-center gap-1"
                title="Coba dengarkan nada chime ini di perangkat Anda"
              >
                <Volume2 className="w-3 h-3 text-amber-400" />
                <span>Tes Suara</span>
              </button>
            </div>

            {/* Submit Action */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 text-xs font-black shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>KIRIM BROADCAST SEKARANG</span>
              </button>
            </div>

          </form>
        </div>

        {/* Live Preview Box (5 Columns) */}
        <div className="lg:col-span-5 space-y-4">
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-black text-white">
                  Pratinjau Langsung (Live Preview)
                </h3>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-800 px-2 py-0.5 rounded">
                Tampilan di Peserta
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Berikut adalah bentuk toast yang akan muncul seketika di atas layar aplikasi para peserta saat tombol kirim ditekan:
            </p>

            {/* Interactive Mock Toast Box */}
            <div className="pt-2">
              <div className={`p-4 rounded-2xl border-2 shadow-2xl space-y-3 ${
                type === 'urgent' ? 'border-rose-500 bg-slate-950 text-white shadow-rose-500/20' :
                type === 'warning' ? 'border-amber-500 bg-slate-950 text-white shadow-amber-500/20' :
                type === 'success' ? 'border-emerald-500 bg-slate-950 text-white shadow-emerald-500/20' :
                'border-blue-500 bg-slate-950 text-white shadow-blue-500/20'
              }`}>
                {/* Fake progress bar */}
                <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div className={`h-full ${
                    type === 'urgent' ? 'bg-rose-500' :
                    type === 'warning' ? 'bg-amber-400' :
                    type === 'success' ? 'bg-emerald-400' : 'bg-blue-500'
                  }`} style={{ width: '75%' }}></div>
                </div>

                {/* Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
                      type === 'urgent' ? 'bg-rose-500/20 text-rose-300 border-rose-400/40' :
                      type === 'warning' ? 'bg-amber-500/20 text-amber-300 border-amber-400/40' :
                      type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40' :
                      'bg-blue-500/20 text-blue-300 border-blue-400/40'
                    }`}>
                      {type === 'urgent' ? 'PENTING / URGENT' :
                       type === 'warning' ? 'PERHATIAN / PERUBAHAN' :
                       type === 'success' ? 'INFORMASI RESMI' : 'PENGUMUMAN PANITIA'}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-300">
                      {category}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Baru Saja
                  </span>
                </div>

                {/* Content */}
                <div className="flex items-start gap-3 pt-1">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    type === 'urgent' ? 'bg-rose-600 text-white' :
                    type === 'warning' ? 'bg-amber-400 text-slate-950' :
                    type === 'success' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
                  }`}>
                    {type === 'urgent' ? <BellRing className="w-4 h-4" /> :
                     type === 'warning' ? <AlertTriangle className="w-4 h-4" /> :
                     type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <Megaphone className="w-4 h-4" />}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="text-xs font-black text-white">
                      {title || 'Judul Notifikasi'}
                    </div>
                    <div className="text-[11px] text-slate-300 leading-relaxed whitespace-pre-line">
                      {message || 'Isi teks pesan siaran Anda akan muncul di sini.'}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                    {sentBy}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {actionTab && (
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${
                        type === 'urgent' ? 'bg-rose-600 text-white' :
                        type === 'warning' ? 'bg-amber-400 text-slate-950' :
                        type === 'success' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
                      }`}>
                        {actionLabel || 'Buka Halaman'}
                      </span>
                    )}
                    <span className="px-2 py-1 rounded-lg bg-slate-800 text-slate-400 text-[10px]">
                      Tutup
                    </span>
                  </div>
                </div>

              </div>
            </div>

            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 text-[11px] text-slate-400 space-y-1">
              <div className="font-bold text-slate-300 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-blue-400" />
                <span>Teknologi Broadcast:</span>
              </div>
              <p>
                Sistem memanfaatkan *Event Broadcasting & Storage Sync* sehingga pesan dikirimkan secara instan ke seluruh tab/perangkat peserta yang sedang membuka aplikasi tanpa perlu reload.
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* Broadcast History Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-400" />
            <h3 className="text-base font-black text-white">
              Riwayat Broadcast Terkirim ({history.length})
            </h3>
          </div>

          {history.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 transition-colors self-start sm:self-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Kosongkan Riwayat</span>
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            Belum ada riwayat broadcast yang dikirim.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80 space-y-2">
            {history.map((item) => (
              <div 
                key={item.id}
                className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                      item.type === 'urgent' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                      item.type === 'warning' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      item.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    }`}>
                      {item.type}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-300">
                      {item.category}
                    </span>
                    <h4 className="text-xs font-bold text-white">
                      {item.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(item.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                    {item.message}
                  </p>

                  <div className="text-[10px] text-slate-400 flex items-center gap-2">
                    <span>Oleh: {item.sentBy || 'Panitia'}</span>
                    {item.actionTab && <span>• Tautan: {item.actionLabel || item.actionTab}</span>}
                    <span>• Durasi: {item.durationSeconds > 0 ? `${item.durationSeconds} detik` : 'Tetap Tampil'}</span>
                  </div>
                </div>

                {/* Actions: Resend, Copy to Form, Delete */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setTitle(item.title);
                      setMessage(item.message);
                      setType(item.type);
                      setCategory(item.category);
                      setActionTab(item.actionTab || '');
                      setActionLabel(item.actionLabel || '');
                      setDurationSeconds(item.durationSeconds);
                      if (item.sentBy) setSentBy(item.sentBy);
                      onShowToast('Pesan dimuat ke formulir editor.');
                    }}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-xs font-bold flex items-center gap-1"
                    title="Muat kembali pesan ini ke formulir"
                  >
                    <Copy className="w-3 h-3 text-indigo-400" />
                    <span className="hidden md:inline">Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleResendHistory(item)}
                    className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-colors flex items-center gap-1"
                    title="Kirim ulang siaran ini sekarang"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Kirim Ulang</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteHistoryItem(item.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    title="Hapus dari riwayat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
