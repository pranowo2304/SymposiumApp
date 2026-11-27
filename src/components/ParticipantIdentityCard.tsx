import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import {
  BadgeCheck,
  Building2,
  Download,
  Printer,
  QrCode,
  Ticket,
  UserCheck,
} from 'lucide-react';
import { Participant, SymposiumInfo } from '../types';
import { extractParticipantIdRegistrant } from '../data/participantData';
import { SYMPOSIUM_INFO } from '../data/symposiumData';
import { getThemePalette } from '../utils/themeColors';
import { normalizeIdentityCardLayout } from '../utils/identityCardLayout';

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
  const layout = useMemo(
    () => normalizeIdentityCardLayout(info.identityCardLayout),
    [info.identityCardLayout]
  );
  const [qrMode, setQrMode] = useState<QrPayloadMode>('id');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrError, setQrError] = useState<boolean>(false);
  const [isDownloadingCard, setIsDownloadingCard] = useState<boolean>(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [logoLoadFailed, setLogoLoadFailed] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<'card' | 'compact'>(() =>
    info.customIdentityCardUrl ? 'card' : 'compact'
  );

  useEffect(() => {
    if (info.customIdentityCardUrl) {
      setPreviewMode('card');
    }
  }, [info.customIdentityCardUrl]);

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

  const renderIdentityCardCanvas = async (
    scale = 2,
    options: { printMode?: boolean } = {}
  ): Promise<HTMLCanvasElement | null> => {
    if (!qrDataUrl) return null;

    const baseW = 760;
    const baseH = 1080;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(baseW * scale);
    canvas.height = Math.round(baseH * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.scale(scale, scale);

    // Outer backdrop (clean white in printMode to save ink; dark slate in digital PNG)
    ctx.fillStyle = options.printMode ? '#ffffff' : '#0f172a';
    ctx.fillRect(0, 0, baseW, baseH);

    // Card container geometry
    const cardX = options.printMode ? 0 : 36;
    const cardY = options.printMode ? 0 : 36;
    const cardW = options.printMode ? baseW : baseW - 72;
    const cardH = options.printMode ? baseH : baseH - 72;
    const cardRadius = options.printMode ? 24 : 32;

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
      drawRoundedRect(ctx, cardX, cardY, cardW, cardH, cardRadius);
      ctx.clip();

      // Cover-fit custom template so aspect ratio is never distorted
      const imgW = customTemplateImg.naturalWidth || cardW;
      const imgH = customTemplateImg.naturalHeight || cardH;
      const coverScale = Math.max(cardW / imgW, cardH / imgH);
      const drawW = imgW * coverScale;
      const drawH = imgH * coverScale;
      const drawX = cardX + (cardW - drawW) / 2;
      const drawY = cardY + (cardH - drawH) / 2;
      ctx.drawImage(customTemplateImg, drawX, drawY, drawW, drawH);

      if (layout.showEventHeader) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.70)';
        ctx.fillRect(cardX, cardY, cardW, headerH);
      }

      if (layout.showContentBackdrop) {
        const panelMarginX = 24;
        const panelY = layout.showEventHeader ? cardY + headerH + 16 : cardY + 36;
        const panelH = cardY + cardH - panelY - 28;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.90)';
        drawRoundedRect(ctx, cardX + panelMarginX, panelY, cardW - panelMarginX * 2, panelH, 24);
        ctx.fill();
        ctx.strokeStyle = 'rgba(226, 232, 240, 0.95)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.restore();
    } else {
      ctx.fillStyle = '#ffffff';
      drawRoundedRect(ctx, cardX, cardY, cardW, cardH, cardRadius);
      ctx.fill();

      if (options.printMode) {
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.save();
      drawRoundedRect(ctx, cardX, cardY, cardW, cardH, cardRadius);
      ctx.clip();

      if (layout.showEventHeader) {
        const headerGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + headerH);
        headerGrad.addColorStop(0, '#0f172a');
        headerGrad.addColorStop(1, palette.primaryHex || '#059669');
        ctx.fillStyle = headerGrad;
        ctx.fillRect(cardX, cardY, cardW, headerH);
      }

      // Bottom accent strip
      ctx.fillStyle = palette.primaryHex || '#059669';
      ctx.fillRect(cardX, cardY + cardH - 16, cardW, 16);
      ctx.restore();
    }

    // Optional event logo & title header band
    if (layout.showEventHeader) {
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
          const logoBoxY = cardY + 42;
          ctx.fillStyle = '#ffffff';
          drawRoundedRect(ctx, logoBoxX, logoBoxY, logoSize, logoSize, 16);
          ctx.fill();
          ctx.drawImage(logoImg, logoBoxX + 6, logoBoxY + 6, logoSize - 12, logoSize - 12);
          headerTextX = logoBoxX + logoSize + 20;
        } catch {
          // Ignore tainted/failed external logos cleanly
        }
      }

      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#a7f3d0';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('KARTU IDENTITAS PESERTA', headerTextX, cardY + 62);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(
        info.title || 'Simposium & Workshop',
        headerTextX,
        cardY + 98,
        cardX + cardW - headerTextX - 36
      );

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '500 17px sans-serif';
      const subMeta = [
        info.dateString || `${info.dates?.day1 || ''}`,
        info.location || '',
      ]
        .filter(Boolean)
        .join(' · ');
      ctx.fillText(subMeta, headerTextX, cardY + 128, cardX + cardW - headerTextX - 36);

      if (!customTemplateImg) {
        // Lanyard hole accent on default template
        ctx.fillStyle = '#e2e8f0';
        drawRoundedRect(ctx, baseW / 2 - 48, cardY + 14, 96, 10, 5);
        ctx.fill();
      }
    }

    // Helper to render positioned text fields matching AdminIdentityCardLayoutEditor 1:1
    const scaleFactor = cardW / 760;
    const drawPositionedText = (
      cfg: typeof layout.name,
      text: string,
      fontFamily = 'sans-serif',
      fontWeight = 'bold'
    ) => {
      if (!cfg.visible || !text.trim()) return;
      const posX = cardX + (cfg.x / 100) * cardW;
      const posY = cardY + (cfg.y / 100) * cardH;
      const scaledFontSize = Math.max(10, Math.round(cfg.fontSize * scaleFactor));
      const pad = 24 * scaleFactor;
      const maxWidth =
        cfg.align === 'left'
          ? Math.max(80, cardX + cardW - posX - pad)
          : cfg.align === 'right'
            ? Math.max(80, posX - cardX - pad)
            : Math.max(120, cardW - pad * 2);

      ctx.save();
      ctx.textBaseline = 'middle';
      ctx.textAlign = cfg.align;
      ctx.fillStyle = cfg.color || '#0f172a';
      ctx.font = `${fontWeight} ${scaledFontSize}px ${fontFamily}`;
      ctx.fillText(text, posX, posY, maxWidth);
      ctx.restore();
    };

    drawPositionedText(layout.idRegistrant, `ID_Registrant: ${qrIdCode}`, 'monospace', 'bold');
    drawPositionedText(layout.name, participant.name || 'Peserta Simposium', 'sans-serif', 'bold');
    if (participant.title) {
      drawPositionedText(layout.title, participant.title, 'sans-serif', '600');
    }
    drawPositionedText(
      layout.institution,
      participant.institution || 'RS / Faskes Peserta',
      'sans-serif',
      '600'
    );
    drawPositionedText(
      layout.roleTicket,
      `${participant.role || 'Peserta'}  ·  ${participant.ticketType || 'Simposium Full Pass'}`,
      'sans-serif',
      '600'
    );

    // Dynamically positioned QR Code block
    if (layout.qrCode.visible) {
      const qrImg = new Image();
      await new Promise<void>((resolve, reject) => {
        qrImg.onload = () => resolve();
        qrImg.onerror = () => reject();
        qrImg.src = qrDataUrl;
      });

      const qrBoxSize = Math.round(layout.qrCode.size * scaleFactor);
      const centerX = cardX + (layout.qrCode.x / 100) * cardW;
      const centerY = cardY + (layout.qrCode.y / 100) * cardH;
      const captionH = layout.qrCode.showCaption ? Math.round(58 * scaleFactor) : 0;
      const padFrame = layout.qrCode.showFrame ? Math.round(20 * scaleFactor) : 0;
      const totalH = qrBoxSize + captionH + padFrame * 2;
      const totalW = qrBoxSize + padFrame * 2;
      const frameX = centerX - totalW / 2;
      const frameY = centerY - totalH / 2;

      if (layout.qrCode.showFrame) {
        ctx.fillStyle = '#f8fafc';
        drawRoundedRect(ctx, frameX, frameY, totalW, totalH, Math.round(20 * scaleFactor));
        ctx.fill();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      const qrX = centerX - qrBoxSize / 2;
      const qrY = frameY + padFrame;
      ctx.drawImage(qrImg, qrX, qrY, qrBoxSize, qrBoxSize);

      if (layout.qrCode.showCaption) {
        ctx.textBaseline = 'alphabetic';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#475569';
        ctx.font = `bold ${Math.max(10, Math.round(13 * scaleFactor))}px sans-serif`;
        ctx.fillText('NO. ID_REGISTRANT', centerX, qrY + qrBoxSize + Math.round(20 * scaleFactor));

        ctx.fillStyle = '#0f172a';
        ctx.font = `bold ${Math.max(12, Math.round(23 * scaleFactor))}px monospace`;
        ctx.fillText(qrIdCode, centerX, qrY + qrBoxSize + Math.round(46 * scaleFactor), qrBoxSize + 24);
      }
    }

    return canvas;
  };

  const handleDownloadIdCardPng = async () => {
    if (!qrDataUrl) return;
    setIsDownloadingCard(true);
    try {
      const canvas = await renderIdentityCardCanvas(1, { printMode: false });
      if (!canvas) return;
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

  const handleDownloadIdCardPdf = async () => {
    if (!qrDataUrl) return;
    setIsDownloadingPdf(true);
    try {
      // Render at 2x resolution (1520 x 2160 px -> ~398 DPI on A6 badge)
      const canvas = await renderIdentityCardCanvas(2, { printMode: true });
      if (!canvas) return;

      const cardPngDataUrl = canvas.toDataURL('image/png');

      // Standard A6 portrait print sheet (105mm x 148mm), ideal for lanyard ID badges & A4 100% scale prints
      const pageW = 105;
      const pageH = 148;
      const margin = 4;
      const cardPrintW = pageW - margin * 2; // 97mm
      const cardPrintH = pageH - margin * 2; // 140mm

      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [pageW, pageH],
        compress: true,
      });

      pdf.setProperties({
        title: `Kartu Identitas Peserta - ${participant.name || 'Peserta'} (${qrIdCode})`,
        subject: `ID Card & QR Code - ${info.title || 'Simposium'}`,
        creator: info.organizer || 'ADHPHKI',
      });

      // Clean white sheet background
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, pageW, pageH, 'F');

      // Embed crisp high-DPI ID Card with uploaded template, name, ID_Registrant & QR Code
      pdf.addImage(cardPngDataUrl, 'PNG', margin, margin, cardPrintW, cardPrintH, undefined, 'FAST');

      // Subtle corner trim/crop marks for print cutting
      pdf.setDrawColor(148, 163, 184);
      pdf.setLineWidth(0.2);
      const mark = 2.5;
      // Top-left
      pdf.line(margin - mark, margin, margin - 0.5, margin);
      pdf.line(margin, margin - mark, margin, margin - 0.5);
      // Top-right
      pdf.line(pageW - margin + 0.5, margin, pageW - margin + mark, margin);
      pdf.line(pageW - margin, margin - mark, pageW - margin, margin - 0.5);
      // Bottom-left
      pdf.line(margin - mark, pageH - margin, margin - 0.5, pageH - margin);
      pdf.line(margin, pageH - margin + 0.5, margin, pageH - margin + mark);
      // Bottom-right
      pdf.line(pageW - margin + 0.5, pageH - margin, pageW - margin + mark, pageH - margin);
      pdf.line(pageW - margin, pageH - margin + 0.5, pageW - margin, pageH - margin + mark);

      pdf.save(`kartu-identitas-${safeFileSlug}.pdf`);
    } catch (err) {
      console.error('Failed to render printable ID Card PDF:', err);
      await handleDownloadIdCardPng();
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const getAlignTransform = (align: 'left' | 'center' | 'right') => {
    if (align === 'center') return 'translate(-50%, -50%)';
    if (align === 'right') return 'translate(-100%, -50%)';
    return 'translate(0%, -50%)';
  };

  return (
    <div className="space-y-3">
      {/* Preview Mode Switcher */}
      <div className="flex items-center justify-between gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
        <button
          type="button"
          onClick={() => setPreviewMode('card')}
          className={`flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
            previewMode === 'card'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Pratinjau Kartu Cetak
        </button>
        <button
          type="button"
          onClick={() => setPreviewMode('compact')}
          className={`flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
            previewMode === 'compact'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Tampilan Ringkas
        </button>
      </div>

      {previewMode === 'card' ? (
        <div
          style={{ containerType: 'inline-size' }}
          className="relative w-full max-w-[300px] mx-auto aspect-[760/1080] rounded-2xl overflow-hidden border border-slate-700 bg-white shadow-xl select-none"
        >
          {info.customIdentityCardUrl ? (
            <img
              src={info.customIdentityCardUrl}
              alt="Template Kartu Identitas"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-white">
              <div
                className="w-full h-[20.4%]"
                style={{
                  background: `linear-gradient(135deg, #0f172a 0%, ${palette.primaryHex || '#059669'} 100%)`,
                }}
              />
              <div
                className="absolute bottom-0 inset-x-0 h-[1.5%]"
                style={{ backgroundColor: palette.primaryHex || '#059669' }}
              />
            </div>
          )}

          {layout.showEventHeader && (
            <div
              className={`absolute top-0 inset-x-0 h-[20.4%] px-[5%] flex items-center gap-[3%] ${
                info.customIdentityCardUrl ? 'bg-slate-950/70' : ''
              }`}
            >
              {info.logoUrl && !logoLoadFailed && (
                <div className="w-[10cqw] h-[10cqw] rounded-[2cqw] bg-white p-[0.8cqw] shrink-0 flex items-center justify-center overflow-hidden">
                  <img
                    src={info.logoUrl}
                    alt={info.title}
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                    onError={() => setLogoLoadFailed(true)}
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-[2.1cqw] font-bold text-emerald-200 tracking-wide">
                  KARTU IDENTITAS PESERTA
                </div>
                <div className="text-[3.1cqw] font-bold text-white truncate">
                  {info.title || 'Simposium & Workshop'}
                </div>
                <div className="text-[2.1cqw] text-slate-300 truncate">
                  {info.dateString || info.dates?.day1}
                </div>
              </div>
            </div>
          )}

          {info.customIdentityCardUrl && layout.showContentBackdrop && (
            <div
              className="absolute left-[3.5%] right-[3.5%] rounded-[3cqw] bg-white/90 border border-slate-200/90"
              style={{
                top: layout.showEventHeader ? '22%' : '4%',
                bottom: '3.5%',
              }}
            />
          )}

          {layout.idRegistrant.visible && (
            <div
              style={{
                left: `${layout.idRegistrant.x}%`,
                top: `${layout.idRegistrant.y}%`,
                transform: getAlignTransform(layout.idRegistrant.align),
                fontSize: `${(layout.idRegistrant.fontSize / 760) * 100}cqw`,
                color: layout.idRegistrant.color,
                textAlign: layout.idRegistrant.align,
              }}
              className="absolute z-10 max-w-[90%] font-mono font-bold whitespace-nowrap leading-tight"
            >
              {`ID_Registrant: ${qrIdCode}`}
            </div>
          )}

          {layout.name.visible && (
            <div
              style={{
                left: `${layout.name.x}%`,
                top: `${layout.name.y}%`,
                transform: getAlignTransform(layout.name.align),
                fontSize: `${(layout.name.fontSize / 760) * 100}cqw`,
                color: layout.name.color,
                textAlign: layout.name.align,
              }}
              className="absolute z-10 max-w-[90%] font-bold truncate leading-tight"
            >
              {participant.name || 'Peserta Simposium'}
            </div>
          )}

          {layout.title.visible && participant.title && (
            <div
              style={{
                left: `${layout.title.x}%`,
                top: `${layout.title.y}%`,
                transform: getAlignTransform(layout.title.align),
                fontSize: `${(layout.title.fontSize / 760) * 100}cqw`,
                color: layout.title.color,
                textAlign: layout.title.align,
              }}
              className="absolute z-10 max-w-[90%] font-semibold truncate leading-tight"
            >
              {participant.title}
            </div>
          )}

          {layout.institution.visible && (
            <div
              style={{
                left: `${layout.institution.x}%`,
                top: `${layout.institution.y}%`,
                transform: getAlignTransform(layout.institution.align),
                fontSize: `${(layout.institution.fontSize / 760) * 100}cqw`,
                color: layout.institution.color,
                textAlign: layout.institution.align,
              }}
              className="absolute z-10 max-w-[90%] font-semibold truncate leading-tight"
            >
              {participant.institution || 'RS / Faskes Peserta'}
            </div>
          )}

          {layout.roleTicket.visible && (
            <div
              style={{
                left: `${layout.roleTicket.x}%`,
                top: `${layout.roleTicket.y}%`,
                transform: getAlignTransform(layout.roleTicket.align),
                fontSize: `${(layout.roleTicket.fontSize / 760) * 100}cqw`,
                color: layout.roleTicket.color,
                textAlign: layout.roleTicket.align,
              }}
              className="absolute z-10 max-w-[90%] font-semibold truncate leading-tight"
            >
              {`${participant.role || 'Peserta'} · ${participant.ticketType || 'Simposium Full Pass'}`}
            </div>
          )}

          {layout.qrCode.visible && (
            <div
              style={{
                left: `${layout.qrCode.x}%`,
                top: `${layout.qrCode.y}%`,
                transform: 'translate(-50%, -50%)',
                width: `${(layout.qrCode.size / 760) * 100}%`,
              }}
              className={`absolute z-10 flex flex-col items-center rounded-xl ${
                layout.qrCode.showFrame
                  ? 'bg-slate-50 border border-slate-300 p-[2.6cqw] shadow-sm'
                  : 'p-1'
              }`}
            >
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR Code ID Registrant ${qrIdCode}`}
                  className="w-full aspect-square object-contain"
                />
              ) : (
                <div className="w-full aspect-square flex items-center justify-center bg-slate-100 rounded-lg text-[10px] text-slate-500">
                  {qrError ? 'QR gagal' : 'Membuat QR...'}
                </div>
              )}
              {layout.qrCode.showCaption && (
                <div className="mt-[1cqw] text-center w-full">
                  <div className="text-[1.7cqw] font-bold text-slate-500 leading-none">
                    NO. ID_REGISTRANT
                  </div>
                  <div className="text-[3cqw] font-mono font-bold text-slate-900 truncate leading-tight">
                    {qrIdCode}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Credential Identity Card (Compact Info View) */
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
          <div className="absolute inset-0 bg-slate-950/25 pointer-events-none" />
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
            className={`px-4 py-3 border-b ${info.customIdentityCardUrl ? 'border-white/20 bg-slate-950/45' : 'border-white/10'} flex items-center justify-between gap-3`}
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
          <div className={`p-4 flex flex-col sm:flex-row sm:items-stretch gap-4 ${info.customIdentityCardUrl ? 'bg-slate-950/35' : 'bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950'}`}>
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
      )}



      {/* Card Export Controls */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={handleDownloadIdCardPdf}
          disabled={!qrDataUrl || isDownloadingPdf}
          className="w-full min-h-[44px] py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer whitespace-nowrap shadow-sm"
        >
          <Printer className="w-4 h-4 shrink-0" />
          <span>{isDownloadingPdf ? 'Menyiapkan PDF Siap Cetak...' : 'Unduh Kartu ID (PDF Siap Cetak)'}</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleDownloadIdCardPng}
            disabled={!qrDataUrl || isDownloadingCard}
            className="min-h-[42px] py-2 px-3 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer whitespace-nowrap"
          >
            <Download className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{isDownloadingCard ? 'Menyiapkan...' : 'Unduh PNG'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadQrOnly}
            disabled={!qrDataUrl}
            className="min-h-[42px] py-2 px-3 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer whitespace-nowrap"
            title="Unduh gambar QR Code saja"
          >
            <QrCode className="w-4 h-4 text-amber-300 shrink-0" />
            <span>Unduh QR</span>
          </button>
        </div>
      </div>
    </div>
  );
};
