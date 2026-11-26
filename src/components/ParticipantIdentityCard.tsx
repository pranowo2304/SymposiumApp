import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import {
  BadgeCheck,
  Building2,
  Download,
  QrCode,
  Ticket,
  UserCheck,
} from 'lucide-react';
import { Participant, SymposiumInfo } from '../types';
import { extractParticipantIdRegistrant } from '../data/participantData';
import { SYMPOSIUM_INFO } from '../data/symposiumData';
import { getThemePalette } from '../utils/themeColors';

interface ParticipantIdentityCardProps {
  participant: Participant;
  eventInfo?: SymposiumInfo;
}

type QrPayloadMode = 'id' | 'url';

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export const ParticipantIdentityCard: React.FC<ParticipantIdentityCardProps> = ({
  participant,
  eventInfo,
}) => {
  const info = eventInfo || SYMPOSIUM_INFO;
  const palette = getThemePalette(info);
  const [qrMode, setQrMode] = useState<QrPayloadMode>('id');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrError, setQrError] = useState<boolean>(false);
  const [isDownloadingCard, setIsDownloadingCard] = useState<boolean>(false);
  const [logoLoadFailed, setLogoLoadFailed] = useState<boolean>(false);

  const qrIdCode = useMemo(() => {
    const idReg = extractParticipantIdRegistrant(participant);
    return (idReg || participant.badgeId || participant.id || 'PESERTA').trim();
  }, [participant]);

  const qrPayload = useMemo(() => {
    if (qrMode === 'url' && typeof window !== 'undefined' && window.location.origin.startsWith('http')) {
      return `${window.location.origin}${window.location.pathname}?id_registrant=${encodeURIComponent(qrIdCode)}`;
    }
    return qrIdCode;
  }, [qrIdCode, qrMode]);

  useEffect(() => {
    setLogoLoadFailed(false);
  }, [info.logoUrl]);

  useEffect(() => {
    let active = true;
    setQrError(false);
    setQrDataUrl('');

    QRCode.toDataURL(qrPayload, {
      width: 512,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (active) {
          setQrDataUrl(url);
        }
      })
      .catch((err) => {
        console.error('Failed to generate participant QR code:', err);
        if (active) {
          setQrError(true);
        }
      });

    return () => {
      active = false;
    };
  }, [qrPayload]);

  const safeFileSlug = useMemo(
    () => qrIdCode.replace(/[^a-zA-Z0-9_-]+/g, '-').toLowerCase() || 'peserta',
    [qrIdCode]
  );

  const handleDownloadQrOnly = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `qr-id-registrant-${safeFileSlug}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadIdCardPng = async () => {
    if (!qrDataUrl) return;
    setIsDownloadingCard(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 760;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Outer backdrop
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Card container background
      const cardX = 36;
      const cardY = 36;
      const cardW = canvas.width - 72;
      const cardH = canvas.height - 72;

      const headerH = 220;
      let customTemplateImg: HTMLImageElement | null = null;
      if (info.customIdentityCardUrl) {
        try {
          const img = new Image();
          if (!info.customIdentityCardUrl.startsWith('data:')) {
            img.crossOrigin = 'anonymous';
          }
          await new Promise<void>((res, rej) => {
            img.onload = () => res();
            img.onerror = () => rej();
            img.src = info.customIdentityCardUrl!;
          });
          customTemplateImg = img;
        } catch {
          customTemplateImg = null;
        }
      }

      if (customTemplateImg) {
        ctx.save();
        drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 32);
        ctx.clip();
        ctx.drawImage(customTemplateImg, cardX, cardY, cardW, cardH);
        ctx.restore();
      } else {
        ctx.fillStyle = '#ffffff';
        drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 32);
        ctx.fill();

        // Header band clipped inside card
        ctx.save();
        drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 32);
        ctx.clip();

        const headerGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + headerH);
        headerGrad.addColorStop(0, '#0f172a');
        headerGrad.addColorStop(1, palette.primaryHex || '#059669');
        ctx.fillStyle = headerGrad;
        ctx.fillRect(cardX, cardY, cardW, headerH);

        // Bottom accent strip
        ctx.fillStyle = palette.primaryHex || '#059669';
        ctx.fillRect(cardX, cardY + cardH - 16, cardW, 16);
        ctx.restore();
      }

      // Optional event logo in header
      let headerTextX = cardX + 36;
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
          const logoSize = 72;
          const logoBoxX = cardX + 36;
          const logoBoxY = cardY + 36;
          ctx.fillStyle = '#ffffff';
          drawRoundedRect(ctx, logoBoxX, logoBoxY, logoSize, logoSize, 16);
          ctx.fill();
          ctx.drawImage(logoImg, logoBoxX + 6, logoBoxY + 6, logoSize - 12, logoSize - 12);
          headerTextX = logoBoxX + logoSize + 20;
        } catch {
          // Ignore tainted/failed external logos cleanly
        }
      }

      // Header text
      ctx.textAlign = 'left';
      ctx.fillStyle = '#a7f3d0';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('KARTU IDENTITAS PESERTA', headerTextX, cardY + 56);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(info.title || 'Simposium & Workshop', headerTextX, cardY + 92, cardX + cardW - headerTextX - 36);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '500 17px sans-serif';
      const subMeta = [
        info.dateString || `${info.dates?.day1 || ''}`,
        info.location || '',
      ]
        .filter(Boolean)
        .join(' · ');
      ctx.fillText(subMeta, headerTextX, cardY + 122, cardX + cardW - headerTextX - 36);

      // Lanyard hole accent
      ctx.fillStyle = '#e2e8f0';
      drawRoundedRect(ctx, canvas.width / 2 - 48, cardY + 14, 96, 10, 5);
      ctx.fill();

      // Verified status & ID Registrant line
      const bodyStartY = cardY + headerH + 46;
      ctx.fillStyle = '#059669';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('PESERTA TERVERIFIKASI', cardX + 36, bodyStartY);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 20px monospace';
      ctx.fillText(`ID Registrant: ${qrIdCode}`, cardX + cardW - 36, bodyStartY);

      // Divider
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cardX + 36, bodyStartY + 20);
      ctx.lineTo(cardX + cardW - 36, bodyStartY + 20);
      ctx.stroke();

      // Participant Name & Title
      ctx.textAlign = 'left';
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 34px sans-serif';
      ctx.fillText(participant.name || 'Peserta Simposium', cardX + 36, bodyStartY + 72, cardW - 72);

      let metaY = bodyStartY + 106;
      if (participant.title) {
        ctx.fillStyle = '#475569';
        ctx.font = '600 20px sans-serif';
        ctx.fillText(participant.title, cardX + 36, metaY, cardW - 72);
        metaY += 34;
      }

      ctx.fillStyle = '#334155';
      ctx.font = '500 20px sans-serif';
      ctx.fillText(participant.institution || 'RS / Faskes Peserta', cardX + 36, metaY + 8, cardW - 72);

      ctx.fillStyle = '#475569';
      ctx.font = '600 18px sans-serif';
      const roleTicket = `${participant.role || 'Peserta'}  ·  ${participant.ticketType || 'Simposium Full Pass'}`;
      ctx.fillText(roleTicket, cardX + 36, metaY + 42, cardW - 72);

      // QR Code Block attached to bottom half of ID Card
      const qrImg = new Image();
      await new Promise<void>((resolve, reject) => {
        qrImg.onload = () => resolve();
        qrImg.onerror = () => reject();
        qrImg.src = qrDataUrl;
      });

      const qrBoxSize = 350;
      const qrBoxX = (canvas.width - qrBoxSize) / 2;
      const qrBoxY = metaY + 82;

      ctx.fillStyle = '#f8fafc';
      drawRoundedRect(ctx, qrBoxX - 28, qrBoxY - 24, qrBoxSize + 56, qrBoxSize + 104, 24);
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.drawImage(qrImg, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('NO. ID REGISTRANT', canvas.width / 2, qrBoxY + qrBoxSize + 24);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 26px monospace';
      ctx.fillText(qrIdCode, canvas.width / 2, qrBoxY + qrBoxSize + 54, qrBoxSize + 30);

      ctx.fillStyle = '#64748b';
      ctx.font = '600 14px sans-serif';
      ctx.fillText('Scan QR Code untuk verifikasi ID Registrant peserta', canvas.width / 2, qrBoxY + qrBoxSize + 76);

      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = `kartu-identitas-${safeFileSlug}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to render ID Card PNG:', err);
      handleDownloadQrOnly();
    } finally {
      setIsDownloadingCard(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Credential Identity Card */}
      <div 
        className="rounded-2xl overflow-hidden border border-slate-700/90 shadow-lg relative"
        style={
          info.customIdentityCardUrl
            ? {
                backgroundImage: `url(${info.customIdentityCardUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : {
                backgroundColor: '#020617',
              }
        }
      >
        {info.customIdentityCardUrl && (
          <div className="absolute inset-0 bg-slate-950/65 pointer-events-none" />
        )}

        <div className="relative z-10">
          {/* Top Event Header Band */}
          <div
            style={
              !info.customIdentityCardUrl
                ? {
                    background: `linear-gradient(135deg, #020617 0%, ${palette.primaryHex || '#059669'} 140%)`,
                  }
                : undefined
            }
            className={`px-4 py-3 border-b ${info.customIdentityCardUrl ? 'border-white/20 bg-black/30 backdrop-blur-xs' : 'border-white/10'} flex items-center justify-between gap-3`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {info.logoUrl && !logoLoadFailed ? (
                <div className="w-9 h-9 rounded-lg bg-white p-1 shrink-0 flex items-center justify-center overflow-hidden">
                  <img
                    src={info.logoUrl}
                    alt={info.title}
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                    onError={() => setLogoLoadFailed(true)}
                  />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-lg bg-white/15 border border-white/20 shrink-0 flex items-center justify-center text-white">
                  <QrCode className="w-4 h-4" />
                </div>
              )}
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-emerald-200 tracking-wide">
                  Kartu Identitas Peserta
                </div>
                <div className="text-xs font-extrabold text-white truncate">
                  {info.title || 'Simposium & Workshop'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-emerald-300 text-[11px] font-bold shrink-0">
              <BadgeCheck className="w-4 h-4 shrink-0" />
              <span>Terverifikasi</span>
            </div>
          </div>

          {/* Credential Body: Identity Details + Embedded QR Code */}
          <div className={`p-4 flex flex-col sm:flex-row sm:items-stretch gap-4 ${info.customIdentityCardUrl ? 'bg-slate-950/75 backdrop-blur-xs' : 'bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950'}`}>
          {/* Left Identity Info */}
          <div className="flex-1 min-w-0 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>ID Registrant</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono font-bold text-amber-300 tabular-nums">
                  {qrIdCode}
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-extrabold text-white leading-snug mt-1 break-words">
                {participant.name}
              </h3>
              {participant.title && (
                <p className="text-xs text-slate-300 mt-0.5">{participant.title}</p>
              )}
            </div>

            <div className="space-y-2 pt-2.5 border-t border-slate-800 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span className="leading-snug">
                  {participant.institution || 'RS / Faskes Peserta'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{participant.role || 'Peserta'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Ticket className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-emerald-300 font-semibold">
                  {participant.ticketType || 'Simposium Full Pass'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Embedded QR Code Sticker */}
          <div className="sm:w-40 shrink-0 flex flex-col items-center justify-center bg-white rounded-xl p-2.5 border border-slate-200 shadow-sm text-center self-center sm:self-stretch">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR Code ID Registrant ${qrIdCode}`}
                className="w-32 h-32 object-contain"
              />
            ) : (
              <div className="w-32 h-32 flex items-center justify-center bg-slate-100 rounded-lg text-[11px] text-slate-500 font-medium px-2">
                {qrError ? 'QR gagal dimuat' : 'Membuat QR...'}
              </div>
            )}
            <div className="mt-1.5 pt-1.5 border-t border-slate-200 w-full">
              <div className="text-[10px] font-bold text-slate-500 tracking-wide">
                ID REGISTRANT
              </div>
              <div className="font-mono text-xs font-extrabold text-slate-900 truncate tabular-nums">
                {qrIdCode}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>



      {/* Card Export Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button
          type="button"
          onClick={handleDownloadIdCardPng}
          disabled={!qrDataUrl || isDownloadingCard}
          className="sm:col-span-2 min-h-[44px] py-2 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer whitespace-nowrap"
        >
          <Download className="w-4 h-4 shrink-0" />
          <span>{isDownloadingCard ? 'Menyiapkan Kartu...' : 'Unduh Kartu ID (PNG)'}</span>
        </button>

        <button
          type="button"
          onClick={handleDownloadQrOnly}
          disabled={!qrDataUrl}
          className="min-h-[44px] py-2 px-3 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer whitespace-nowrap"
          title="Unduh gambar QR Code saja"
        >
          <QrCode className="w-4 h-4 text-amber-300 shrink-0" />
          <span>Unduh QR</span>
        </button>
      </div>
    </div>
  );
};
