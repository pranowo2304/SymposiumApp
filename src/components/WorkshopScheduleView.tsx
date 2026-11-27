import React, { useEffect, useMemo, useState } from 'react';
import {
  Stethoscope,
  MapPin,
  FileText,
  Download,
  ExternalLink,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { Session, Speaker, SymposiumInfo, WorkshopRundownPdf } from '../types';
import { SYMPOSIUM_INFO } from '../data/symposiumData';
import {
  getWorkshopCardSlots,
  WorkshopCardSlot,
} from '../utils/workshopCardTemplates';
import {
  base64ToPdfBlob,
  buildExternalPdfUrls,
  formatPdfFileSize,
  getPdfMaterialLocal,
} from '../utils/presentationPdfStorage';
import { fetchPdfMaterialBlobFromFirestore } from '../services/firestoreSyncService';
import { PdfViewer } from './PdfViewer';

interface WorkshopScheduleViewProps {
  sessions?: Session[];
  onSelectSession: (session: Session, initialTab?: 'abstract' | 'materials' | 'speakers') => void;
  onSelectSpeaker: (speaker: Speaker) => void;
  onOpenVenue: () => void;
  eventInfo?: SymposiumInfo;
}

export const WorkshopScheduleView: React.FC<WorkshopScheduleViewProps> = ({
  sessions,
  onOpenVenue,
  eventInfo,
}) => {
  const info = eventInfo || SYMPOSIUM_INFO;
  const rundownMap: Record<string, WorkshopRundownPdf> = info.workshopRundownPdfs || {};

  const workshopSlots = useMemo<WorkshopCardSlot[]>(() => {
    const base = getWorkshopCardSlots(sessions, info.workshopIdentityCardTemplates);
    const map = new Map<string, WorkshopCardSlot>();
    base.forEach((slot) => map.set(slot.workshopKey, slot));

    Object.values(rundownMap).forEach((pdf) => {
      if (!pdf?.workshopKey) return;
      if (!map.has(pdf.workshopKey)) {
        map.set(pdf.workshopKey, {
          workshopKey: pdf.workshopKey,
          workshopLabel: pdf.workshopLabel || pdf.workshopKey,
          shortLabel: pdf.workshopLabel || pdf.workshopKey,
          sessionCount: 0,
        });
      }
    });

    return Array.from(map.values());
  }, [sessions, info.workshopIdentityCardTemplates, rundownMap]);

  const [selectedWorkshopKey, setSelectedWorkshopKey] = useState<string>(() => {
    const firstWithPdf = workshopSlots.find((s) => Boolean(rundownMap[s.workshopKey]));
    return firstWithPdf?.workshopKey || workshopSlots[0]?.workshopKey || '';
  });

  useEffect(() => {
    if (
      workshopSlots.length > 0 &&
      !workshopSlots.some((s) => s.workshopKey === selectedWorkshopKey)
    ) {
      const firstWithPdf = workshopSlots.find((s) => Boolean(rundownMap[s.workshopKey]));
      setSelectedWorkshopKey(firstWithPdf?.workshopKey || workshopSlots[0].workshopKey);
    }
  }, [workshopSlots, selectedWorkshopKey, rundownMap]);

  const activeSlot =
    workshopSlots.find((s) => s.workshopKey === selectedWorkshopKey) || workshopSlots[0] || null;
  const activePdf = activeSlot ? rundownMap[activeSlot.workshopKey] || null : null;

  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [blobPreviewUrl, setBlobPreviewUrl] = useState<string | null>(null);
  const [externalUrls, setExternalUrls] = useState<{
    previewUrl: string;
    downloadUrl: string;
  } | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrlToRevoke: string | null = null;

    setPdfBlob(null);
    setBlobPreviewUrl(null);
    setExternalUrls(null);
    setPdfError(null);
    setIsLoadingPdf(false);

    if (!activePdf) {
      return () => {};
    }

    if (activePdf.externalUrl) {
      setExternalUrls(buildExternalPdfUrls(activePdf.externalUrl));
      return () => {};
    }

    const loadRundownPdf = async () => {
      setIsLoadingPdf(true);
      try {
        let blob: Blob | null = null;
        const localRec = await getPdfMaterialLocal(activePdf.materialId);
        if (localRec?.base64Data) {
          blob = base64ToPdfBlob(localRec.base64Data, activePdf.mimeType);
        } else if (activePdf.chunkCount > 0) {
          blob = await fetchPdfMaterialBlobFromFirestore(
            activePdf.materialId,
            activePdf.chunkCount,
            activePdf.fileName,
            activePdf.mimeType
          );
        }

        if (cancelled) return;
        if (!blob) {
          setPdfError(
            'File rundown PDF belum tersedia di perangkat ini atau belum disinkronkan ke Cloud oleh panitia.'
          );
          return;
        }

        objectUrlToRevoke = URL.createObjectURL(blob);
        setPdfBlob(blob);
        setBlobPreviewUrl(objectUrlToRevoke);
      } catch (err: any) {
        if (!cancelled) {
          setPdfError(err?.message || 'Gagal memuat file rundown jadwal PDF.');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingPdf(false);
        }
      }
    };

    loadRundownPdf();

    return () => {
      cancelled = true;
      if (objectUrlToRevoke) {
        URL.revokeObjectURL(objectUrlToRevoke);
      }
    };
  }, [
    activePdf?.materialId,
    activePdf?.externalUrl,
    activePdf?.chunkCount,
    activePdf?.fileName,
    activePdf?.mimeType,
  ]);

  const activeDownloadUrl = blobPreviewUrl || externalUrls?.downloadUrl || null;
  const otherSlotsWithPdf = workshopSlots.filter(
    (s) => s.workshopKey !== activeSlot?.workshopKey && Boolean(rundownMap[s.workshopKey])
  );

  return (
    <div className="max-w-6xl mx-auto p-2.5 sm:p-4 space-y-3.5">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-950 text-white rounded-xl p-3.5 sm:p-4 border border-emerald-800/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-1.5 text-emerald-300 text-[11px] font-bold uppercase tracking-wider mb-0.5">
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Jadwal &amp; Rundown Workshop (PDF)</span>
          </div>
          <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>
              {info.dates?.workshop || '28 November 2026'} • {info.location}
            </span>
          </h2>
          <p className="text-xs text-emerald-100/80 mt-0.5">
            Pilih jenis workshop di bawah untuk melihat dan mengunduh file rundown jadwal resmi dalam format PDF.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenVenue}
          className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/15 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 self-start sm:self-auto shrink-0 cursor-pointer"
        >
          <MapPin className="w-3.5 h-3.5 text-rose-300" />
          <span>Peta Ruangan</span>
        </button>
      </div>

      {/* Workshop Switcher Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {workshopSlots.map((slot, idx) => {
          const isSelected = activeSlot?.workshopKey === slot.workshopKey;
          const slotPdf = rundownMap[slot.workshopKey];

          return (
            <button
              key={slot.workshopKey}
              type="button"
              onClick={() => setSelectedWorkshopKey(slot.workshopKey)}
              className={`text-left p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 cursor-pointer ${
                isSelected
                  ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50/70'
              }`}
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                      isSelected
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Workshop {idx + 1}
                  </span>
                  {slot.roomLabel && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                      <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                      {slot.roomLabel}
                    </span>
                  )}
                </div>

                <h3
                  className={`text-xs sm:text-sm font-extrabold leading-snug ${
                    isSelected ? 'text-emerald-950' : 'text-slate-900'
                  }`}
                >
                  {slot.workshopLabel}
                </h3>

                <div className="text-[11px]">
                  {slotPdf ? (
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate max-w-[220px]">{slotPdf.fileName}</span>
                    </span>
                  ) : (
                    <span className="text-slate-400 font-medium">
                      File rundown PDF belum diunggah
                    </span>
                  )}
                </div>
              </div>

              <div
                className={`p-2 rounded-xl shrink-0 ${
                  slotPdf
                    ? isSelected
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                <FileText className="w-4 h-4" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Workshop Rundown PDF Panel */}
      {activeSlot && activePdf ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                {activePdf.title || `Rundown ${activeSlot.workshopLabel}`}
              </h3>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {activePdf.fileName} •{' '}
                <strong className="text-slate-700">
                  {activePdf.externalUrl
                    ? 'Tautan PDF Eksternal'
                    : formatPdfFileSize(activePdf.fileSize)}
                </strong>
                {activeSlot.roomLabel ? ` • ${activeSlot.roomLabel}` : ''}
              </p>
            </div>

            {activeDownloadUrl &&
              (activePdf.externalUrl ? (
                <a
                  href={activeDownloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka / Unduh Rundown PDF</span>
                </a>
              ) : (
                <a
                  href={activeDownloadUrl}
                  download={activePdf.fileName}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Rundown PDF</span>
                </a>
              ))}
          </div>

          <PdfViewer
            blob={pdfBlob}
            blobUrl={blobPreviewUrl}
            externalPreviewUrl={externalUrls?.previewUrl || null}
            externalDownloadUrl={externalUrls?.downloadUrl || null}
            title={activePdf.title || `Rundown ${activeSlot.workshopLabel}`}
            fileName={activePdf.fileName}
            isLoading={isLoadingPdf}
            error={pdfError}
          />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
            <FileText className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-md">
            <h3 className="text-sm sm:text-base font-extrabold text-slate-800">
              File Rundown Jadwal PDF Belum Diunggah
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Panitia belum mengunggah file rundown jadwal PDF untuk{' '}
              <strong className="text-slate-700">
                {activeSlot?.workshopLabel || 'workshop ini'}
              </strong>
              . Silakan periksa kembali secara berkala atau hubungi panitia.
            </p>
          </div>

          {otherSlotsWithPdf.length > 0 && (
            <div className="pt-1 flex flex-wrap items-center justify-center gap-2">
              {otherSlotsWithPdf.map((slot) => (
                <button
                  key={slot.workshopKey}
                  type="button"
                  onClick={() => setSelectedWorkshopKey(slot.workshopKey)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Lihat Rundown {slot.shortLabel}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
