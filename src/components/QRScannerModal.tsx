import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  QrCode, 
  X, 
  Camera, 
  RotateCcw, 
  Zap, 
  ZapOff, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Clock, 
  MapPin, 
  Award, 
  User, 
  Sparkles, 
  History, 
  Download, 
  ChevronRight, 
  Building, 
  Search,
  Volume2,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import jsQR from 'jsqr';
import { SESSIONS_DATA, SYMPOSIUM_INFO } from '../data/symposiumData';
import { Session, AttendanceRecord, Participant } from '../types';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAttendanceSaved?: (record: AttendanceRecord) => void;
  savedAttendances: AttendanceRecord[];
  onOpenProfile?: () => void;
  currentUser?: Participant;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onAttendanceSaved,
  savedAttendances,
  onOpenProfile,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'scanner' | 'history' | 'presets'>('scanner');
  const [cameraPermission, setCameraPermission] = useState<'idle' | 'granted' | 'denied' | 'unsupported'>('idle');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(true);
  
  // Participant Info from currentUser or default
  const [participantName, setParticipantName] = useState<string>(currentUser?.name || 'dr. Ahmad Pratama, Sp.PD');
  const badgeId = currentUser?.badgeId || 'ID-SIMP-2026-8891';

  useEffect(() => {
    if (currentUser?.name) {
      setParticipantName(currentUser.name);
    }
  }, [currentUser?.name]);

  // Scan Result State
  const [lastScannedSession, setLastScannedSession] = useState<Session | null>(null);
  const [scanSuccessRecord, setScanSuccessRecord] = useState<AttendanceRecord | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  // References
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Web Audio Beep Feedback
  const playSuccessBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      }
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    } catch (e) {
      console.log('Audio feedback not available', e);
    }
  };

  // Start Camera Stream
  const startCamera = async () => {
    stopCamera();
    setScanError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraPermission('unsupported');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraPermission('granted');
        setIsScanning(true);
        requestAnimationFrame(tickScan);
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setCameraPermission('denied');
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Toggle Torch/Flashlight
  const toggleTorch = async () => {
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      if (track && 'applyConstraints' in track) {
        try {
          const newTorchState = !isTorchOn;
          await (track as any).applyConstraints({
            advanced: [{ torch: newTorchState }],
          });
          setIsTorchOn(newTorchState);
        } catch (e) {
          console.warn('Torch constraint not supported', e);
        }
      }
    }
  };

  // QR Scanning Loop using jsQR
  const tickScan = () => {
    if (!isScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && video.readyState === video.HAVE_ENOUGH_DATA && canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
          handleQRScannedData(code.data);
          return; // Pause scanning on match
        }
      }
    }

    if (isScanning) {
      animationFrameRef.current = requestAnimationFrame(tickScan);
    }
  };

  // Process QR Data String
  const handleQRScannedData = (qrText: string) => {
    playSuccessBeep();
    setIsScanning(false);

    // Try to match QR string with session ID, title, or room code
    let matchedSession = SESSIONS_DATA.find((s) => 
      qrText.toLowerCase().includes(s.id.toLowerCase()) ||
      qrText.toLowerCase().includes(s.title.toLowerCase()) ||
      s.id.toLowerCase().includes(qrText.toLowerCase())
    );

    // If generic QR or fallback to first session if unrecognized format
    if (!matchedSession) {
      // Find session matching keyword or default to a prominent session
      const textClean = qrText.toLowerCase();
      if (textClean.includes('cardio') || textClean.includes('kardiologi')) {
        matchedSession = SESSIONS_DATA.find((s) => s.category.toLowerCase().includes('kardiologi'));
      } else if (textClean.includes('usg') || textClean.includes('workshop')) {
        matchedSession = SESSIONS_DATA.find((s) => s.type.includes('Workshop'));
      }
    }

    if (!matchedSession) {
      matchedSession = SESSIONS_DATA[0];
    }

    // Generate Attendance Record
    const now = new Date();
    const timeFormatted = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    
    const record: AttendanceRecord = {
      id: 'ATT-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      sessionId: matchedSession.id,
      sessionTitle: matchedSession.title,
      room: matchedSession.room,
      timestamp: `${matchedSession.day}, ${timeFormatted}`,
      skpPoints: matchedSession.type.includes('Workshop') ? 3.5 : 2.5,
      participantName: participantName || 'dr. Peserta Simposium',
      badgeId: badgeId,
      day: matchedSession.day,
    };

    setLastScannedSession(matchedSession);
    setScanSuccessRecord(record);

    if (onAttendanceSaved) {
      onAttendanceSaved(record);
    }
  };

  // Reset Scanner State for Next Scan
  const handleScanNext = () => {
    setScanSuccessRecord(null);
    setLastScannedSession(null);
    setIsScanning(true);
    if (cameraPermission === 'granted') {
      requestAnimationFrame(tickScan);
    }
  };

  // Effect when modal visibility or facingMode changes
  useEffect(() => {
    if (isOpen && activeTab === 'scanner') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, facingMode]);

  if (!isOpen) return null;

  // Calculate Total Accumulated SKP
  const totalSkpPoints = savedAttendances.reduce((acc, r) => acc + r.skpPoints, 0);

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
        className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="bg-slate-900 text-white p-4 relative border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold leading-tight text-white">
                Presensi & Absensi QR Code
              </h3>
              <p className="text-[11px] text-blue-300">
                Pindai QR Code di pintu ruangan untuk klaim nilai SKP IDI
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

        {/* Navigation Tabs Bar */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold px-3 pt-2 space-x-2">
          <button
            onClick={() => setActiveTab('scanner')}
            className={`pb-2.5 px-3 border-b-2 flex items-center space-x-1.5 transition-colors ${
              activeTab === 'scanner'
                ? 'border-blue-600 text-blue-600 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Kamera Pindai</span>
          </button>

          <button
            onClick={() => setActiveTab('presets')}
            className={`pb-2.5 px-3 border-b-2 flex items-center space-x-1.5 transition-colors ${
              activeTab === 'presets'
                ? 'border-blue-600 text-blue-600 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Contoh QR Sesi</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 px-3 border-b-2 flex items-center space-x-1.5 transition-colors relative ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Riwayat Kehadiran</span>
            {savedAttendances.length > 0 && (
              <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1">
                {savedAttendances.length}
              </span>
            )}
          </button>
        </div>

        {/* Main Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">

          {/* TAB 1: LIVE SCANNER CAMERA */}
          {activeTab === 'scanner' && (
            <div className="space-y-4">

              {/* Scan Success Card Overlay */}
              {scanSuccessRecord && lastScannedSession ? (
                <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4 space-y-3 animate-fadeIn">
                  <div className="flex items-center space-x-2 text-emerald-800 font-extrabold text-sm border-b border-emerald-200/80 pb-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>Presensi Berhasil Dicatat!</span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-800">
                    <div className="font-extrabold text-sm text-slate-900 leading-snug">
                      {lastScannedSession.title}
                    </div>
                    <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600">
                      <span className="flex items-center text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded">
                        <MapPin className="w-3 h-3 mr-1" />
                        {lastScannedSession.room}
                      </span>
                      <span className="flex items-center text-slate-700 bg-slate-200/70 px-2 py-0.5 rounded">
                        <Clock className="w-3 h-3 mr-1 text-blue-600" />
                        {scanSuccessRecord.timestamp}
                      </span>
                    </div>

                    <div className="mt-2 p-2.5 bg-white rounded-lg border border-emerald-200/80 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Peserta</span>
                        <span className="text-xs font-bold text-slate-800">{scanSuccessRecord.participantName}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-emerald-600 font-bold uppercase block">+Poin SKP</span>
                        <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full inline-block">
                          +{scanSuccessRecord.skpPoints} SKP IDI
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      onClick={handleScanNext}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center justify-center"
                    >
                      <Camera className="w-3.5 h-3.5 mr-1.5" />
                      Pindai QR Sesi Lainnya
                    </button>
                    <button
                      onClick={() => setActiveTab('history')}
                      className="py-2 px-3 bg-white border border-emerald-300 text-emerald-800 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors"
                    >
                      Lihat Total SKP
                    </button>
                  </div>
                </div>
              ) : (
                /* Active Viewfinder Canvas */
                <div className="relative aspect-square w-full max-w-xs mx-auto rounded-2xl bg-slate-900 overflow-hidden border-2 border-slate-800 shadow-lg group">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Scanning Target Box Graphic */}
                  <div className="absolute inset-0 flex items-center justify-center p-8 pointer-events-none">
                    <div className="w-full h-full border-2 border-blue-400/70 rounded-2xl relative">
                      {/* Corner Accents */}
                      <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-blue-500 rounded-tl-lg" />
                      <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-blue-500 rounded-tr-lg" />
                      <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-blue-500 rounded-bl-lg" />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-blue-500 rounded-br-lg" />

                      {/* Animated Laser Scanning Line */}
                      <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_8px_#38bdf8] animate-bounce mt-12" />
                    </div>
                  </div>

                  {/* Camera Control Overlays */}
                  <div className="absolute top-2 right-2 flex items-center space-x-1">
                    <button
                      onClick={toggleTorch}
                      title="Senter Flashlight"
                      className={`p-2 rounded-full ${isTorchOn ? 'bg-amber-400 text-slate-950' : 'bg-slate-900/80 text-white hover:bg-slate-800'}`}
                    >
                      {isTorchOn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => setFacingMode(facingMode === 'environment' ? 'user' : 'environment')}
                      title="Ganti Kamera Front/Back"
                      className="p-2 rounded-full bg-slate-900/80 text-white hover:bg-slate-800"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Status Overlay */}
                  <div className="absolute bottom-2 inset-x-2 bg-slate-950/80 backdrop-blur-xs p-2 rounded-lg text-center text-[11px] text-slate-200">
                    Arahkan kamera ke gambar QR Code sesi
                  </div>
                </div>
              )}

              {/* Participant Badge & Simulated Quick Scan Bar */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 flex items-center">
                    <User className="w-3.5 h-3.5 mr-1 text-blue-600" />
                    Profil ID Peserta Simposium:
                  </span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-mono font-bold px-1.5 py-0.2 rounded">
                    {badgeId}
                  </span>
                </div>
                <input
                  type="text"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  placeholder="Nama & Gelar Dokter..."
                  className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 font-semibold text-slate-800"
                />
              </div>

              {/* Instant One-Click Demo QR Trigger */}
              <div className="pt-2 border-t border-slate-100">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Simulasi Pindai Cepat (Tanpa Kamera):</span>
                  <span className="text-blue-600 font-medium cursor-pointer" onClick={() => setActiveTab('presets')}>
                    Lihat Semua →
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {SESSIONS_DATA.slice(0, 3).map((sess) => (
                    <button
                      key={sess.id}
                      onClick={() => handleQRScannedData(sess.id)}
                      className="p-2 rounded-lg bg-slate-100 hover:bg-blue-50 border border-slate-200/80 text-left transition-all group flex items-center justify-between"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="text-[10px] font-bold text-blue-600 block">{sess.day} • {sess.room}</span>
                        <h5 className="text-xs font-bold text-slate-800 group-hover:text-blue-700 truncate">
                          {sess.title}
                        </h5>
                      </div>
                      <span className="px-2 py-1 bg-blue-600 text-white rounded text-[10px] font-bold shrink-0">
                        Absen
                      </span>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: PRESET QR BADGES */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-900 leading-relaxed">
                <strong>Panduan:</strong> Berikut adalah daftar QR Code resmi untuk setiap ruangan simposium. Anda dapat mengeklik tombol <strong>"Klaim Presensi"</strong> untuk melakukan tes pemindaian langsung.
              </div>

              <div className="space-y-3">
                {SESSIONS_DATA.map((sess) => (
                  <div
                    key={sess.id}
                    className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3 hover:border-blue-300 transition-all"
                  >
                    {/* Simulated SVG QR Code Box */}
                    <div className="w-16 h-16 bg-slate-900 p-1.5 rounded-lg shrink-0 flex items-center justify-center relative group">
                      <svg className="w-full h-full text-white fill-current" viewBox="0 0 24 24">
                        <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm11-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm13-2h2v2h-2v-2zm-2 2h2v2h-2v-2zm4 0h2v2h-2v-2zm-2 2h2v2h-2v-2zm2 2h2v2h-2v-2zm-4 0h2v2h-2v-2z" />
                      </svg>
                    </div>

                    <div className="flex-1 min-w-0">
                      <span className="px-1.5 py-0.2 bg-blue-50 text-blue-700 text-[10px] font-bold rounded uppercase">
                        {sess.day} • {sess.room}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1 mt-0.5">
                        {sess.title}
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Bobot SKP: <strong className="text-emerald-700">+{sess.type.includes('Workshop') ? '3.5' : '2.5'} SKP IDI</strong>
                      </p>
                    </div>

                    <button
                      onClick={() => handleQRScannedData(sess.id)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shrink-0 transition-colors shadow-2xs"
                    >
                      Klaim SKP
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: ATTENDANCE HISTORY LOG & SKP SUMMARY */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              
              {/* Accumulated SKP Scorecard */}
              <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white p-4 rounded-xl shadow-md border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center space-x-2">
                    <Award className="w-5 h-5 text-amber-400" />
                    <span className="text-xs font-extrabold text-slate-200">Akre SKP Kemenkes / IDI</span>
                  </div>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold border border-amber-500/30">
                    Sertifikat Terverifikasi
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase font-bold block">Total Perolehan SKP:</span>
                    <span className="text-2xl font-black text-amber-400">
                      {totalSkpPoints.toFixed(1)} <span className="text-xs font-normal text-slate-300">/ 20.0 SKP</span>
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 uppercase font-bold block">Sesi Dihadiri:</span>
                    <span className="text-lg font-bold text-white">
                      {savedAttendances.length} Sesi
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-amber-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((totalSkpPoints / 20) * 100, 100)}%` }}
                  />
                </div>

                {/* Certificate Action Link */}
                {onOpenProfile && (
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-300">
                      {totalSkpPoints >= 5.0 ? '🎓 Syarat Sertifikat 5.0 SKP Terpenuhi!' : '🔒 Minimal 5.0 SKP untuk klaim sertifikat'}
                    </span>
                    <button
                      onClick={() => {
                        onClose();
                        onOpenProfile();
                      }}
                      className="px-2.5 py-1 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black rounded-lg text-[11px] transition-colors"
                    >
                      {totalSkpPoints >= 5.0 ? 'Unduh Sertifikat' : 'Lihat Syarat & Profil'}
                    </button>
                  </div>
                )}
              </div>

              {/* Attendance Log List */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Daftar Presensi Terdaftar:</span>
                  <span className="text-slate-400 text-[10px] font-normal">
                    {savedAttendances.length} Data Recorded
                  </span>
                </h4>

                {savedAttendances.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 space-y-2">
                    <QrCode className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="text-xs font-medium">Belum ada riwayat presensi yang dicatat.</p>
                    <button
                      onClick={() => setActiveTab('scanner')}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
                    >
                      Buka Kamera Pindai Sekarang
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                    {savedAttendances.map((rec) => (
                      <div
                        key={rec.id}
                        className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-bold">
                            <span className="text-blue-600">{rec.day}</span>
                            <span>•</span>
                            <span className="text-slate-600">{rec.room}</span>
                          </div>
                          <h5 className="text-xs font-bold text-slate-900 truncate mt-0.5">
                            {rec.sessionTitle}
                          </h5>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Check-in: {rec.timestamp}
                          </span>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full inline-block">
                            +{rec.skpPoints} SKP
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px] flex items-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 mr-1" />
            Terhubung Sistem E-Sertifikat Simposium 2026
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>

      </motion.div>
    </motion.div>
  );
};
