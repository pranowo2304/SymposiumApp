import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import {
  BadgeCheck,
  Building2,
  QrCode,
  Ticket,
  UserCheck,
} from 'lucide-react';
import { Participant, SymposiumInfo } from '../types';
import { extractParticipantIdRegistrant } from '../data/participantData';
import { SYMPOSIUM_INFO } from '../data/symposiumData';
import { getThemePalette } from '../utils/themeColors';
import { resolveParticipantCardTemplates } from '../utils/workshopCardTemplates';

interface ParticipantIdentityCardProps {
  participant: Participant;
  eventInfo?: SymposiumInfo;
}

type QrPayloadMode = 'id' | 'url';

export const ParticipantIdentityCard: React.FC<ParticipantIdentityCardProps> = ({
  participant,
  eventInfo,
}) => {
  const info = eventInfo || SYMPOSIUM_INFO;
  const palette = getThemePalette(info);
  const cardResolution = useMemo(
    () => resolveParticipantCardTemplates(participant, info),
    [participant, info]
  );
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>(
    () => cardResolution.defaultOptionKey
  );

  useEffect(() => {
    setSelectedTemplateKey(cardResolution.defaultOptionKey);
  }, [cardResolution.defaultOptionKey, participant.id, participant.ticketType]);

  const activeCardOption = useMemo(
    () =>
      cardResolution.options.find((opt) => opt.key === selectedTemplateKey) ||
      cardResolution.options[0],
    [cardResolution.options, selectedTemplateKey]
  );

  const activeTemplateUrl = activeCardOption.templateUrl;
  const layout = activeCardOption.layout;

  const [qrMode] = useState<QrPayloadMode>('id');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrError, setQrError] = useState<boolean>(false);
  const [logoLoadFailed, setLogoLoadFailed] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<'card' | 'compact'>(() =>
    activeTemplateUrl ? 'card' : 'compact'
  );

  useEffect(() => {
    if (activeTemplateUrl) {
      setPreviewMode('card');
    }
  }, [activeTemplateUrl]);

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

  const getAlignTransform = (align: 'left' | 'center' | 'right') => {
    if (align === 'center') return 'translate(-50%, -50%)';
    if (align === 'right') return 'translate(-100%, -50%)';
    return 'translate(0%, -50%)';
  };

  return (
    <div className="space-y-3">
      {/* Multi-template switcher when participant qualifies for multiple uploaded ID card designs */}
      {cardResolution.options.length > 1 ? (
        <div className="space-y-1.5 bg-slate-950/90 p-2 rounded-xl border border-slate-800">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
            Pilih Desain Kartu ID ({cardResolution.options.length} Tersedia):
          </div>
          <div className="flex flex-wrap gap-1.5">
            {cardResolution.options.map((opt) => {
              const isSelected = opt.key === activeCardOption.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setSelectedTemplateKey(opt.key)}
                  className={`flex-1 min-w-[110px] py-1.5 px-2.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer truncate ${
                    isSelected
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                  title={opt.label}
                >
                  {opt.shortLabel}
                </button>
              );
            })}
          </div>
        </div>
      ) : activeCardOption.isWorkshop ? (
        <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-sky-500/15 border border-sky-500/30 text-[11px] text-sky-200">
          <span className="font-semibold">Desain Kartu Workshop:</span>
          <span className="font-extrabold text-white truncate">{activeCardOption.shortLabel}</span>
        </div>
      ) : null}

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
          Tampilan Kartu ID
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
          {activeTemplateUrl ? (
            <img
              src={activeTemplateUrl}
              alt={`Template Kartu Identitas ${activeCardOption.label}`}
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
                activeTemplateUrl ? 'bg-slate-950/70' : ''
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

          {activeTemplateUrl && layout.showContentBackdrop && (
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
          activeTemplateUrl
            ? {
                backgroundImage: `url(${activeTemplateUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : {
                backgroundColor: '#020617',
              }
        }
      >
        {activeTemplateUrl && (
          <div className="absolute inset-0 bg-slate-950/25 pointer-events-none" />
        )}

        <div className="relative z-10">
          {/* Top Event Header Band */}
          <div
            style={
              !activeTemplateUrl
                ? {
                    background: `linear-gradient(135deg, #020617 0%, ${palette.primaryHex || '#059669'} 140%)`,
                  }
                : undefined
            }
            className={`px-4 py-3 border-b ${activeTemplateUrl ? 'border-white/20 bg-slate-950/45' : 'border-white/10'} flex items-center justify-between gap-3`}
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
          <div className={`p-4 flex flex-col sm:flex-row sm:items-stretch gap-4 ${activeTemplateUrl ? 'bg-slate-950/35' : 'bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950'}`}>
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
    </div>
  );
};
