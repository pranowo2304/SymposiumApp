import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Download,
  CheckCircle2,
  X,
  Share,
  MoreVertical,
  PlusSquare,
  ExternalLink,
  QrCode,
  Copy,
  Check,
  WifiOff,
  Sparkles,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { usePWAInstall, useOnlineStatus } from '../hooks/usePWAInstall';
import { SymposiumInfo } from '../types';
import { SYMPOSIUM_INFO } from '../data/symposiumData';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="bg-amber-500 text-slate-950 px-4 py-2 text-center text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md z-50">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>Mode Offline Aktif — Jadwal Simposium, Workshop, dan Pembicara tetap dapat diakses tanpa sinyal internet.</span>
    </div>
  );
};

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventTitle?: string;
  eventInfo?: SymposiumInfo;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  eventTitle,
  eventInfo,
}) => {
  const info = eventInfo || SYMPOSIUM_INFO;
  const displayTitle = info.title || eventTitle || SYMPOSIUM_INFO.title;
  const shortAppName = displayTitle.length > 14 ? displayTitle.split('&')[0].trim().slice(0, 14) : displayTitle;
  const appLogoUrl = info.logoUrl || SYMPOSIUM_INFO.logoUrl || '/pwa-192x192.png';

  const { isInstallable, isInstalled, isIframe, platform, installApp } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'qr'>('android');
  const [copied, setCopied] = useState(false);
  const [installStatus, setInstallStatus] = useState<'idle' | 'installing' | 'installed'>('idle');

  const appUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';

  useEffect(() => {
    if (platform === 'ios') {
      setActiveTab('ios');
    } else if (platform === 'android') {
      setActiveTab('android');
    }
  }, [platform]);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    setInstallStatus('installing');
    const outcome = await installApp();
    if (outcome === 'accepted') {
      setInstallStatus('installed');
    } else {
      setInstallStatus('idle');
    }
  };

  const handleCopyLink = () => {
    if (!appUrl) return;
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=12&data=${encodeURIComponent(
    appUrl || 'https://aistudio.google.com'
  )}`;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Top Header */}
        <div className="relative bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 text-white p-5 sm:p-6 overflow-hidden shrink-0">
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-amber-400/15 blur-2xl pointer-events-none" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white p-1.5 border-2 border-amber-400 shadow-xl flex items-center justify-center shrink-0 overflow-hidden">
              <img
                src={appLogoUrl}
                alt={displayTitle}
                className="w-full h-full object-contain rounded-xl"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="min-w-0 pr-6">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[11px] font-bold uppercase tracking-wider mb-1">
                <Smartphone className="w-3.5 h-3.5" />
                Mobile App Installer (PWA)
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white leading-tight truncate">
                Install Aplikasi Mobile
              </h2>
              <p className="text-xs text-emerald-100/80 mt-0.5 truncate">
                {displayTitle}
              </p>
            </div>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/10 text-[11px] text-emerald-100">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Layar Penuh Tanpa Browser</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Bisa Diakses Offline</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Ikon Sesuai Logo Event</span>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Status: Already Installed */}
          {(isInstalled || installStatus === 'installed') && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-emerald-950">
                  Aplikasi Sudah Terinstall di Perangkat Ini!
                </h3>
                <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                  Anda dapat membuka aplikasi <strong>KIVNAHK IV</strong> langsung dari ikon di layar utama (Home Screen) HP atau menu aplikasi perangkat Anda.
                </p>
              </div>
            </div>
          )}

          {/* Direct 1-Click Native Install Button when available */}
          {isInstallable && !isInstalled && installStatus !== 'installed' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-900 to-teal-900 text-white shadow-lg border border-emerald-700">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="inline-block px-2 py-0.5 rounded bg-amber-400 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider mb-1">
                    Siap Diinstall Otomatis
                  </span>
                  <h3 className="text-base font-bold text-white">
                    Pasang Aplikasi ke Perangkat Sekarang
                  </h3>
                  <p className="text-xs text-emerald-100/90 mt-0.5">
                    Klik tombol di bawah untuk memunculkan installer resmi di perangkat Anda.
                  </p>
                </div>
                <button
                  onClick={handleNativeInstall}
                  disabled={installStatus === 'installing'}
                  className="px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer shrink-0"
                >
                  <Download className="w-4 h-4" />
                  {installStatus === 'installing' ? 'Memproses...' : 'Install Sekarang'}
                </button>
              </div>
            </div>
          )}

          {/* Iframe Notice: If running inside preview iframe */}
          {isIframe && !isInstallable && !isInstalled && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <h3 className="text-xs font-extrabold text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-amber-600" />
                  Tips: Buka di Tab Penuh untuk Installer 1-Klik
                </h3>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Saat ini Anda membuka aplikasi di dalam jendela pratinjau. Buka URL aplikasi di tab browser penuh (Chrome / Safari) agar tombol <strong>Install Aplikasi</strong> otomatis muncul.
                </p>
              </div>
              <a
                href={appUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 shadow-sm transition-colors"
              >
                <span>Buka Tab Penuh</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Home Screen App Icon Preview matching Event Logo */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex flex-col items-center shrink-0">
                <div className="w-14 h-14 rounded-2xl bg-white p-1 border border-slate-200 shadow-md flex items-center justify-center overflow-hidden">
                  <img
                    src={appLogoUrl}
                    alt={shortAppName}
                    className="w-full h-full object-contain rounded-xl"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-700 mt-1 max-w-[72px] truncate">
                  {shortAppName}
                </span>
              </div>
              <div className="min-w-0">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wide">
                  <CheckCircle2 className="w-3 h-3" />
                  Tersinkronisasi dengan Logo Event
                </span>
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 mt-1">
                  Pratinjau Ikon di Layar Utama HP (Home Screen)
                </h4>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  Ikon aplikasi pada perangkat Android &amp; iOS otomatis menyesuaikan <strong>Logo Resmi Event</strong> yang aktif pada sistem.
                </p>
              </div>
            </div>
          </div>

          {/* Platform Selector Tabs */}
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
              Pilih Cara Install di HP Anda:
            </div>
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('android')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'android'
                    ? 'bg-emerald-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Android</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ios')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'ios'
                    ? 'bg-emerald-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>iPhone / iOS</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('qr')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'qr'
                    ? 'bg-emerald-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Scan QR ke HP</span>
              </button>
            </div>
          </div>

          {/* Tab Content: ANDROID */}
          {activeTab === 'android' && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-extrabold text-slate-900">
                  Panduan Install di HP Android (Chrome / Edge)
                </h4>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Tanpa Play Store
                </span>
              </div>

              <ol className="space-y-3 text-xs text-slate-700">
                <li className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-200/70">
                  <span className="w-6 h-6 rounded-full bg-emerald-900 text-amber-300 font-extrabold text-xs flex items-center justify-center shrink-0">
                    1
                  </span>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900">Buka Tautan di Google Chrome</p>
                    <p className="text-slate-600 mt-0.5">
                      Buka aplikasi ini di browser <strong>Google Chrome</strong> pada HP Android Anda.
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-200/70">
                  <span className="w-6 h-6 rounded-full bg-emerald-900 text-amber-300 font-extrabold text-xs flex items-center justify-center shrink-0">
                    2
                  </span>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      Ketuk Ikon Menu Titik Tiga
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-slate-100 border border-slate-300">
                        <MoreVertical className="w-3.5 h-3.5 text-slate-700" />
                      </span>
                    </p>
                    <p className="text-slate-600 mt-0.5">
                      Ketuk tombol menu <strong>⋮</strong> di pojok kanan atas browser Chrome.
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-200/70">
                  <span className="w-6 h-6 rounded-full bg-emerald-900 text-amber-300 font-extrabold text-xs flex items-center justify-center shrink-0">
                    3
                  </span>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      Pilih &ldquo;Install Aplikasi&rdquo; atau &ldquo;Tambahkan ke Layar Utama&rdquo;
                    </p>
                    <p className="text-slate-600 mt-0.5">
                      Konfirmasi dengan mengetuk <strong>Install</strong>. Ikon aplikasi <strong>KIVNAHK IV</strong> akan langsung terpasang di HP Anda seperti aplikasi native!
                    </p>
                  </div>
                </li>
              </ol>
            </div>
          )}

          {/* Tab Content: iOS / iPhone */}
          {activeTab === 'ios' && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-extrabold text-slate-900">
                  Panduan Install di iPhone / iPad (Safari)
                </h4>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  iOS / iPadOS
                </span>
              </div>

              <ol className="space-y-3 text-xs text-slate-700">
                <li className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-200/70">
                  <span className="w-6 h-6 rounded-full bg-emerald-900 text-amber-300 font-extrabold text-xs flex items-center justify-center shrink-0">
                    1
                  </span>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      Ketuk Tombol Bagikan (Share) di Safari
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-slate-100 border border-slate-300">
                        <Share className="w-3.5 h-3.5 text-blue-600" />
                      </span>
                    </p>
                    <p className="text-slate-600 mt-0.5">
                      Buka halaman ini di browser <strong>Safari</strong> iPhone Anda, lalu ketuk ikon <strong>Share</strong> di bilah bawah layar.
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-200/70">
                  <span className="w-6 h-6 rounded-full bg-emerald-900 text-amber-300 font-extrabold text-xs flex items-center justify-center shrink-0">
                    2
                  </span>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      Pilih &ldquo;Tambah ke Layar Utama&rdquo; (Add to Home Screen)
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-slate-100 border border-slate-300">
                        <PlusSquare className="w-3.5 h-3.5 text-slate-700" />
                      </span>
                    </p>
                    <p className="text-slate-600 mt-0.5">
                      Gulir menu ke bawah dan pilih opsi <strong>Tambah ke Layar Utama</strong>.
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-200/70">
                  <span className="w-6 h-6 rounded-full bg-emerald-900 text-amber-300 font-extrabold text-xs flex items-center justify-center shrink-0">
                    3
                  </span>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900">
                      Ketuk &ldquo;Tambah&rdquo; (Add) di Pojok Kanan Atas
                    </p>
                    <p className="text-slate-600 mt-0.5">
                      Aplikasi <strong>KIVNAHK IV</strong> akan muncul di Home Screen iPhone Anda dan berjalan layar penuh tanpa bar browser.
                    </p>
                  </div>
                </li>
              </ol>
            </div>
          )}

          {/* Tab Content: QR CODE */}
          {activeTab === 'qr' && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-center gap-5">
              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm shrink-0">
                <img
                  src={qrImageUrl}
                  alt="QR Code Install Aplikasi Mobile"
                  className="w-36 h-36 sm:w-40 sm:h-40 object-contain rounded-lg"
                />
              </div>
              <div className="space-y-2.5 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 text-[11px] font-bold">
                  <QrCode className="w-3.5 h-3.5" />
                  Scan dari Kamera HP
                </div>
                <h4 className="text-sm font-extrabold text-slate-900">
                  Buka & Install Langsung di Smartphone Anda
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Arahkan kamera HP Android atau iPhone Anda ke QR Code di samping untuk membuka aplikasi mobile <strong>KIVNAHK IV</strong> dan memasangnya ke layar utama HP.
                </p>
                <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Tautan Disalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Salin URL Aplikasi</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Progressive Web App (PWA) Standar Android & iOS</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
