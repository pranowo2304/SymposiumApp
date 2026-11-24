import React, { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import { motion } from 'motion/react';
import {
  QrCode,
  X,
  Download,
  Copy,
  Check,
  Share2,
  RotateCcw,
  Sparkles,
  Link as LinkIcon,
  Image as ImageIcon,
  CalendarDays,
  MapPin
} from 'lucide-react';
import { SymposiumInfo } from '../types';
import { SYMPOSIUM_INFO } from '../data/symposiumData';
import { getThemePalette } from '../utils/themeColors';

interface AppQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventInfo?: SymposiumInfo;
}

const TARGET_ROUTES = [
  { id: 'root', label: 'Beranda Utama', hash: '' },
  { id: 'symposium', label: 'Jadwal Symposium', hash: '#symposium' },
  { id: 'workshop', label: 'Jadwal Workshop', hash: '#workshop' },
  { id: 'speaker', label: 'Daftar Speaker', hash: '#speaker' },
  { id: 'pameran', label: 'Pameran Medis', hash: '#pameran' },
  { id: 'venue', label: 'Denah & Venue', hash: '#venue' },
] as const;

export const AppQRCodeModal: React.FC<AppQRCodeModalProps> = ({
  isOpen,
  onClose,
  eventInfo,
}) => {
  const info = eventInfo || SYMPOSIUM_INFO;
  const palette = getThemePalette(info);

  const defaultBaseUrl = useMemo(() => {
    if (typeof window === 'undefined') return 'https://aistudio.google.com';
    return window.location.origin + window.location.pathname;
  }, []);

  const [baseUrl, setBaseUrl] = useState<string>(defaultBaseUrl);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('root');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isDownloadingPoster, setIsDownloadingPoster] = useState<boolean>(false);

  const selectedRoute = useMemo(
    () => TARGET_ROUTES.find((r) => r.id === selectedRouteId) || TARGET_ROUTES[0],
    [selectedRouteId]
  );

  const targetUrl = useMemo(() => {
    const cleanBase = baseUrl.trim().split('#')[0] || defaultBaseUrl;
    return `${cleanBase}${selectedRoute.hash}`;
  }, [baseUrl, defaultBaseUrl, selectedRoute.hash]);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    QRCode.toDataURL(targetUrl, {
      width: 640,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('Failed to generate QR code:', err);
      });

    return () => {
      active = false;
    };
  }, [isOpen, targetUrl]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: info.title || 'MUNAS 5 ADHPHKI 2026',
          text: `Akses jadwal, pembicara, dan denah venue ${info.title} melalui tautan ini:`,
          url: targetUrl,
        });
        return;
      } catch {
        // user cancelled or unsupported
      }
    }
    handleCopyLink();
  };

  const handleDownloadQRCodeOnly = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `qr-aplikasi-${selectedRoute.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPosterCard = async () => {
    if (!qrDataUrl) return;
    setIsDownloadingPoster(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1000;
      canvas.height = 1320;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Background Gradient
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, palette.primaryHex || '#065f46');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Subtle decorative circles
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.beginPath();
      ctx.arc(880, 120, 220, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(120, 1200, 240, 0, Math.PI * 2);
      ctx.fill();

      // White card container
      const cardX = 80;
      const cardY = 80;
      const cardW = 840;
      const cardH = 1160;
      const r = 44;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(cardX + r, cardY);
      ctx.lineTo(cardX + cardW - r, cardY);
      ctx.quadraticCurveTo(cardX + cardW, cardY, cardX + cardW, cardY + r);
      ctx.lineTo(cardX + cardW, cardY + cardH - r);
      ctx.quadraticCurveTo(cardX + cardW, cardY + cardH, cardX + cardW - r, cardY + cardH);
      ctx.lineTo(cardX + r, cardY + cardH);
      ctx.quadraticCurveTo(cardX, cardY + cardH, cardX, cardY + cardH - r);
      ctx.lineTo(cardX, cardY + r);
      ctx.quadraticCurveTo(cardX, cardY, cardX + r, cardY);
      ctx.closePath();
      ctx.fill();

      // Header Accent Strip inside card
      ctx.save();
      ctx.clip();
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(cardX, cardY, cardW, 250);
      ctx.fillStyle = palette.primaryHex || '#065f46';
      ctx.fillRect(cardX, cardY, cardW, 18);
      ctx.restore();

      // Draw Event Logo if available
      let textStartY = 175;
      if (info.logoUrl) {
        try {
          const logoImg = new Image();
          if (!info.logoUrl.startsWith('data:')) {
            logoImg.crossOrigin = 'anonymous';
          }
          await new Promise<void>((resolve, reject) => {
            logoImg.onload = () => resolve();
            logoImg.onerror = () => reject();
            logoImg.src = info.logoUrl!;
          });
          const logoBoxSize = 110;
          const logoX = (canvas.width - logoBoxSize) / 2;
          const logoY = 118;
          ctx.drawImage(logoImg, logoX, logoY, logoBoxSize, logoBoxSize);
          textStartY = 265;
        } catch {
          textStartY = 165;
        }
      }

      // Title
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      ctx.font = 'bold 34px sans-serif';
      const titleText = info.title || 'MUNAS 5 ADHPHKI 2026';
      ctx.fillText(titleText, canvas.width / 2, textStartY, 760);

      // Subtitle / Date & Location
      ctx.fillStyle = '#475569';
      ctx.font = '600 22px sans-serif';
      const dateLoc = `${info.dateString || '28 Nov - 1 Des 2026'}  •  ${info.location || ''}`;
      ctx.fillText(dateLoc, canvas.width / 2, textStartY + 42, 760);

      // QR Code Frame
      const qrImg = new Image();
      await new Promise<void>((resolve, reject) => {
        qrImg.onload = () => resolve();
        qrImg.onerror = () => reject();
        qrImg.src = qrDataUrl;
      });

      const qrSize = 540;
      const qrX = (canvas.width - qrSize) / 2;
      const qrY = 395;

      // QR frame border
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 4;
      ctx.strokeRect(qrX - 24, qrY - 24, qrSize + 48, qrSize + 48);

      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      // Badge label below QR
      const pillW = 480;
      const pillH = 54;
      const pillX = (canvas.width - pillW) / 2;
      const pillY = qrY + qrSize + 54;
      ctx.fillStyle = palette.primaryHex || '#065f46';
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, 27);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(`SCAN UNTUK BUKA: ${selectedRoute.label.toUpperCase()}`, canvas.width / 2, pillY + 35, pillW - 32);

      // Bottom instruction & URL
      ctx.fillStyle = '#334155';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('Arahkan Kamera HP ke QR Code di atas', canvas.width / 2, pillY + 102);

      ctx.fillStyle = '#64748b';
      ctx.font = '18px monospace';
      ctx.fillText(targetUrl, canvas.width / 2, pillY + 142, 760);

      const posterUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = posterUrl;
      link.download = `poster-qr-munas-5-adhphki-2026-${selectedRoute.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Poster download failed:', err);
      handleDownloadQRCodeOnly();
    } finally {
      setIsDownloadingPoster(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-qrcode-modal-title"
      >
        {/* Modal Header */}
        <div
          style={{ backgroundColor: palette.primaryHex }}
          className="text-white p-4 sm:p-5 relative shrink-0 border-b border-white/10"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 hover:bg-black/35 text-white/90 hover:text-white transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 pr-8">
            <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
              <QrCode className="w-6 h-6 text-amber-300" />
            </div>
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider mb-0.5">
                <Sparkles className="w-3 h-3" />
                <span>QR Code Aplikasi</span>
              </div>
              <h2 id="app-qrcode-modal-title" className="text-base sm:text-lg font-extrabold text-white truncate">
                Bagikan &amp; Akses Cepat via QR Code
              </h2>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* QR Card Preview */}
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-4 sm:p-5 flex flex-col items-center text-center shadow-xs">
            <div className="flex items-center gap-2.5 mb-3">
              {info.logoUrl && (
                <div className="w-9 h-9 rounded-xl bg-white p-1 border border-slate-200 shadow-2xs shrink-0 flex items-center justify-center overflow-hidden">
                  <img
                    src={info.logoUrl}
                    alt={info.title}
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
              <div className="text-left min-w-0">
                <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-tight line-clamp-1">
                  {info.title}
                </h3>
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10px] text-slate-500 font-medium mt-0.5">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-3 h-3 text-amber-600" />
                    {info.dateString || `${info.dates.day1} - ${info.dates.day2}`}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-rose-500" />
                    {info.location}
                  </span>
                </div>
              </div>
            </div>

            {/* Crisp Scannable QR Box */}
            <div className="bg-white p-3 rounded-2xl border-2 border-slate-200 shadow-sm">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR Code ${selectedRoute.label}`}
                  className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
                />
              ) : (
                <div className="w-48 h-48 sm:w-52 sm:h-52 flex items-center justify-center bg-slate-100 rounded-xl text-xs text-slate-400 font-medium">
                  Membuat QR Code...
                </div>
              )}
            </div>

            <div className="mt-3 space-y-1">
              <span
                style={{ backgroundColor: palette.primaryHex }}
                className="inline-block px-3 py-1 rounded-full text-[11px] font-extrabold text-white tracking-wide shadow-2xs"
              >
                Tujuan: {selectedRoute.label}
              </span>
              <p className="text-[11px] text-slate-500 pt-0.5">
                Arahkan kamera HP untuk langsung membuka aplikasi &amp; menginstall ke layar utama.
              </p>
            </div>
          </div>

          {/* Target Route Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Pilih Halaman Tujuan QR Code:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {TARGET_ROUTES.map((route) => {
                const isSelected = selectedRouteId === route.id;
                return (
                  <button
                    key={route.id}
                    type="button"
                    onClick={() => setSelectedRouteId(route.id)}
                    style={isSelected ? { backgroundColor: palette.primaryHex } : undefined}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                      isSelected
                        ? 'text-white border-transparent shadow-2xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {route.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target URL Preview & Customizer */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <LinkIcon className="w-3 h-3 text-slate-400" />
                <span>Tautan URL Aplikasi</span>
              </label>
              {baseUrl !== defaultBaseUrl && (
                <button
                  type="button"
                  onClick={() => setBaseUrl(defaultBaseUrl)}
                  className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset URL Aktif</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-mono focus:outline-none focus:border-blue-500 focus:bg-white"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                title="Salin URL Lengkap"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Disalin' : 'Salin'}</span>
              </button>
            </div>
          </div>

          {/* Export & Share Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleDownloadPosterCard}
              disabled={!qrDataUrl || isDownloadingPoster}
              style={{ backgroundColor: palette.primaryHex }}
              className="py-2.5 px-3.5 rounded-xl text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:opacity-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <ImageIcon className="w-4 h-4 text-amber-300 shrink-0" />
              <span>{isDownloadingPoster ? 'Membuat Poster...' : 'Unduh Poster QR (PNG)'}</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleDownloadQRCodeOnly}
                disabled={!qrDataUrl}
                className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>QR PNG</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 shrink-0" />
                <span>Bagikan</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
