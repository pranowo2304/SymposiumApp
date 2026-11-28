import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Award, Download, Edit3, FileText, Loader2, RotateCcw } from 'lucide-react';
import { CertificateLayoutConfig, Participant, SymposiumInfo } from '../types';
import { SYMPOSIUM_INFO } from '../data/symposiumData';
import {
  buildCertificateFieldTexts,
  CERTIFICATE_CANVAS_W,
  downloadCertificateAsPdf,
  downloadCertificateAsPng,
  getDefaultCertificateDisplayName,
  getSavedCertificateCustomName,
  resolveParticipantCertificates,
  saveCertificateCustomName,
  withCertificateDisplayName,
} from '../utils/certificateTemplates';

interface ParticipantCertificateCardProps {
  participant: Participant;
  eventInfo?: SymposiumInfo;
  customPrintName?: string;
  onCustomPrintNameChange?: (name: string) => void;
  hideNameEditor?: boolean;
}

const FIELD_ORDER: Array<keyof CertificateLayoutConfig> = [
  'certificateNumber',
  'name',
  'role',
  'institution',
  'dateLine',
  'accreditation',
];

export const ParticipantCertificateCard: React.FC<ParticipantCertificateCardProps> = ({
  participant,
  eventInfo,
  customPrintName,
  onCustomPrintNameChange,
  hideNameEditor = false,
}) => {
  const effectiveInfo = eventInfo || SYMPOSIUM_INFO;
  const defaultDisplayName = useMemo(
    () => getDefaultCertificateDisplayName(participant),
    [participant]
  );

  const [internalName, setInternalName] = useState<string>(
    () => getSavedCertificateCustomName(participant) || defaultDisplayName
  );

  // Sync internal name if participant switches
  useEffect(() => {
    if (customPrintName === undefined) {
      setInternalName(getSavedCertificateCustomName(participant) || defaultDisplayName);
    }
  }, [participant.id, participant.badgeId, defaultDisplayName, customPrintName]);

  const activePrintName = customPrintName !== undefined ? customPrintName : internalName;
  const isCustomModified =
    activePrintName.trim().length > 0 && activePrintName.trim() !== defaultDisplayName;

  const handlePrintNameChange = (nextVal: string) => {
    if (onCustomPrintNameChange) {
      onCustomPrintNameChange(nextVal);
    } else {
      setInternalName(nextVal);
      saveCertificateCustomName(participant, nextVal);
    }
  };

  const handleResetName = () => {
    handlePrintNameChange(defaultDisplayName);
  };

  const effectiveParticipant = useMemo(
    () => withCertificateDisplayName(participant, activePrintName || defaultDisplayName),
    [participant, activePrintName, defaultDisplayName]
  );

  const certificates = useMemo(
    () => resolveParticipantCertificates(participant, effectiveInfo),
    [participant, effectiveInfo]
  );

  const [selectedKey, setSelectedKey] = useState<string>(
    certificates[0]?.template.templateKey || ''
  );
  const [downloadingFormat, setDownloadingFormat] = useState<'png' | 'pdf' | null>(null);
  const [previewWidth, setPreviewWidth] = useState<number>(600);
  const previewRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (certificates.length > 0 && !certificates.some((c) => c.template.templateKey === selectedKey)) {
      setSelectedKey(certificates[0].template.templateKey);
    }
  }, [certificates, selectedKey]);

  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const updateWidth = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0) setPreviewWidth(rect.width);
    };
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);
    return () => observer.disconnect();
  }, [selectedKey]);

  if (certificates.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-2">
        <Award className="w-9 h-9 text-slate-600 mx-auto" />
        <p className="text-sm font-bold text-slate-300">E-Sertifikat Belum Tersedia</p>
        <p className="text-xs text-slate-500">
          E-Sertifikat untuk sesi Anda belum dibagikan atau desain template belum diunggah oleh panitia.
        </p>
      </div>
    );
  }

  const activeCert =
    certificates.find((c) => c.template.templateKey === selectedKey) || certificates[0];

  const fieldTexts = buildCertificateFieldTexts(
    effectiveParticipant,
    activeCert.template,
    effectiveInfo
  );
  const scaleRatio = previewWidth / CERTIFICATE_CANVAS_W;

  const handleDownload = async (format: 'png' | 'pdf') => {
    setDownloadingFormat(format);
    try {
      if (format === 'png') {
        await downloadCertificateAsPng(effectiveParticipant, activeCert.template, effectiveInfo);
      } else {
        await downloadCertificateAsPdf(effectiveParticipant, activeCert.template, effectiveInfo);
      }
    } catch (err) {
      console.error('Participant certificate download error:', err);
    } finally {
      setDownloadingFormat(null);
    }
  };

  return (
    <div className="space-y-3.5">
      {/* Certificate Switcher if participant qualifies for multiple (Symposium + Workshop) */}
      {certificates.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {certificates.map((cert) => {
            const isSelected = cert.template.templateKey === activeCert.template.templateKey;
            return (
              <button
                key={cert.template.templateKey}
                type="button"
                onClick={() => setSelectedKey(cert.template.templateKey)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                }`}
              >
                {cert.template.templateLabel}
              </button>
            );
          })}
        </div>
      )}

      {/* Edit Name to Print on Certificate (when used standalone, e.g. in modal) */}
      {!hideNameEditor && (
        <div className="bg-slate-950/90 border border-amber-500/30 rounded-xl p-3 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="modal-cert-edit-name"
              className="text-[11px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Nama yang Dicetak di Sertifikat</span>
            </label>

            {isCustomModified && (
              <button
                type="button"
                onClick={handleResetName}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                title="Kembalikan ke nama registrasi awal"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          <input
            id="modal-cert-edit-name"
            type="text"
            value={activePrintName}
            onChange={(e) => handlePrintNameChange(e.target.value)}
            maxLength={120}
            placeholder="Ketik nama lengkap beserta gelar (misal: drh. Nama Lengkap, M.Si.)"
            className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
          />
          <p className="text-[11px] text-slate-400">
            Pratinjau sertifikat di bawah langsung berubah mengikuti nama &amp; gelar yang Anda ketik sebelum diunduh.
          </p>
        </div>
      )}

      {/* Live 1:1 Scaled Landscape Certificate Preview */}
      <div
        ref={previewRef}
        className="relative w-full aspect-[1600/1131] rounded-2xl overflow-hidden bg-white border border-slate-700 shadow-xl select-none"
      >
        <img
          src={activeCert.template.templateUrl}
          alt={activeCert.template.templateLabel}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {FIELD_ORDER.map((fieldKey) => {
          const cfg = activeCert.layout[fieldKey];
          const text = (fieldTexts[fieldKey] || '').trim();
          if (!cfg.visible || !text) return null;

          const scaledPx = Math.max(7, cfg.fontSize * scaleRatio);
          const translateX =
            cfg.align === 'left' ? '0%' : cfg.align === 'right' ? '-100%' : '-50%';

          return (
            <div
              key={fieldKey}
              style={{
                left: `${cfg.x}%`,
                top: `${cfg.y}%`,
                transform: `translate(${translateX}, -50%)`,
                fontSize: `${scaledPx}px`,
                color: cfg.color,
                fontFamily:
                  cfg.fontFamily === 'serif'
                    ? 'Georgia, "Times New Roman", serif'
                    : 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                fontWeight: cfg.fontWeight === 'bold' ? 700 : 400,
                textAlign: cfg.align,
                lineHeight: 1.15,
              }}
              className="absolute whitespace-nowrap pointer-events-none"
            >
              {text}
            </div>
          );
        })}
      </div>

      {/* Certificate Meta & Download Buttons */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black text-white truncate">
            {activeCert.template.templateLabel}
          </p>
          <p className="text-[11px] text-slate-400 font-mono truncate">
            No. {activeCert.certificateNumber}
            {activeCert.dateText ? ` · ${activeCert.dateText}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={Boolean(downloadingFormat)}
            onClick={() => handleDownload('png')}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {downloadingFormat === 'png' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span>Unduh PNG</span>
          </button>
          <button
            type="button"
            disabled={Boolean(downloadingFormat)}
            onClick={() => handleDownload('pdf')}
            className="px-3.5 py-2 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {downloadingFormat === 'pdf' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5" />
            )}
            <span>Unduh PDF (A4)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
