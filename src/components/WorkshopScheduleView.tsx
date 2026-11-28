import React, { useEffect, useMemo, useState } from 'react';
import {
  Stethoscope,
  MapPin,
  FileText,
  Download,
  ExternalLink,
  CheckCircle2,
  Calendar,
  BookOpen,
  Lock,
  Unlock,
  LogIn,
  ShieldCheck,
  User,
  Loader2,
  Eye,
  Ticket,
} from 'lucide-react';
import {
  Participant,
  Session,
  Speaker,
  SymposiumInfo,
  WorkshopMaterialPdf,
  WorkshopRundownPdf,
} from '../types';
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
import { evaluateWorkshopTrackMaterialAccess } from '../utils/materialAccess';
import { PdfViewer } from './PdfViewer';

interface WorkshopScheduleViewProps {
  sessions?: Session[];
  onSelectSession: (session: Session, initialTab?: 'abstract' | 'materials' | 'speakers') => void;
  onSelectSpeaker: (speaker: Speaker) => void;
  onOpenVenue: () => void;
  eventInfo?: SymposiumInfo;
  currentUser?: Participant | null;
  isParticipantLoggedIn?: boolean;
  isAdminAuthenticated?: boolean;
  onOpenParticipantLogin?: () => void;
}

export const WorkshopScheduleView: React.FC<WorkshopScheduleViewProps> = ({
  sessions,
  onOpenVenue,
  eventInfo,
  currentUser,
  isParticipantLoggedIn = false,
  isAdminAuthenticated = false,
  onOpenParticipantLogin,
}) => {
  const info = eventInfo || SYMPOSIUM_INFO;
  const rundownMap: Record<string, WorkshopRundownPdf> = info.workshopRundownPdfs || {};
  const materialsMap: Record<string, WorkshopMaterialPdf[]> = info.workshopMaterials || {};

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

    Object.entries(materialsMap).forEach(([key, list]) => {
      if (!Array.isArray(list) || list.length === 0) return;
      const first = list[0];
      const wsKey = first?.workshopKey || key;
      if (!map.has(wsKey)) {
        map.set(wsKey, {
          workshopKey: wsKey,
          workshopLabel: first?.workshopLabel || wsKey,
          shortLabel: first?.workshopLabel || wsKey,
          sessionCount: 0,
        });
      }
    });

    return Array.from(map.values());
  }, [sessions, info.workshopIdentityCardTemplates, rundownMap, materialsMap]);

  const [selectedWorkshopKey, setSelectedWorkshopKey] = useState<string>(() => {
    const firstWithContent = workshopSlots.find(
      (s) => Boolean(rundownMap[s.workshopKey]) || (materialsMap[s.workshopKey]?.length || 0) > 0
    );
    return firstWithContent?.workshopKey || workshopSlots[0]?.workshopKey || '';
  });

  const [activeSubTab, setActiveSubTab] = useState<'rundown' | 'materials'>('rundown');

  useEffect(() => {
    if (
      workshopSlots.length > 0 &&
      !workshopSlots.some((s) => s.workshopKey === selectedWorkshopKey)
    ) {
      const firstWithContent = workshopSlots.find(
        (s) => Boolean(rundownMap[s.workshopKey]) || (materialsMap[s.workshopKey]?.length || 0) > 0
      );
      setSelectedWorkshopKey(firstWithContent?.workshopKey || workshopSlots[0].workshopKey);
    }
  }, [workshopSlots, selectedWorkshopKey, rundownMap, materialsMap]);

  const activeSlot =
    workshopSlots.find((s) => s.workshopKey === selectedWorkshopKey) || workshopSlots[0] || null;
  const activePdf = activeSlot ? rundownMap[activeSlot.workshopKey] || null : null;
  const activeMaterials = activeSlot ? materialsMap[activeSlot.workshopKey] || [] : [];

  const materialAccess = useMemo(() => {
    return evaluateWorkshopTrackMaterialAccess({
      workshopLabel: activeSlot?.workshopLabel || 'Workshop',
      allSessions: sessions,
      eventInfo: info,
      currentUser,
      isParticipantLoggedIn,
      isAdmin: isAdminAuthenticated,
    });
  }, [
    activeSlot?.workshopLabel,
    sessions,
    info,
    currentUser,
    isParticipantLoggedIn,
    isAdminAuthenticated,
  ]);

  // Check which other workshops this logged-in participant has material access to
  const otherAccessibleMaterialSlots = useMemo(() => {
    if (!isParticipantLoggedIn && !isAdminAuthenticated) return [];
    return workshopSlots.filter((slot) => {
      if (slot.workshopKey === activeSlot?.workshopKey) return false;
      const access = evaluateWorkshopTrackMaterialAccess({
        workshopLabel: slot.workshopLabel,
        allSessions: sessions,
        eventInfo: info,
        currentUser,
        isParticipantLoggedIn,
        isAdmin: isAdminAuthenticated,
      });
      return access.allowed;
    });
  }, [
    workshopSlots,
    activeSlot?.workshopKey,
    sessions,
    info,
    currentUser,
    isParticipantLoggedIn,
    isAdminAuthenticated,
  ]);

  // Rundown PDF state
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [blobPreviewUrl, setBlobPreviewUrl] = useState<string | null>(null);
  const [externalUrls, setExternalUrls] = useState<{
    previewUrl: string;
    downloadUrl: string;
  } | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Selected Workshop Material PDF state
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
  const [matBlob, setMatBlob] = useState<Blob | null>(null);
  const [matBlobUrl, setMatBlobUrl] = useState<string | null>(null);
  const [matExternalUrls, setMatExternalUrls] = useState<{
    previewUrl: string;
    downloadUrl: string;
  } | null>(null);
  const [isLoadingMatPdf, setIsLoadingMatPdf] = useState<boolean>(false);
  const [matPdfError, setMatPdfError] = useState<string | null>(null);
  const [downloadingMaterialId, setDownloadingMaterialId] = useState<string | null>(null);

  useEffect(() => {
    if (activeMaterials.length > 0) {
      setSelectedMaterialId((prev) =>
        prev && activeMaterials.some((m) => m.id === prev) ? prev : activeMaterials[0].id
      );
    } else {
      setSelectedMaterialId(null);
    }
  }, [activeSlot?.workshopKey, activeMaterials.length]);

  const activeMaterial =
    activeMaterials.find((m) => m.id === selectedMaterialId) || activeMaterials[0] || null;

  // Load Rundown PDF
  useEffect(() => {
    let cancelled = false;
    let objectUrlToRevoke: string | null = null;

    setPdfBlob(null);
    setBlobPreviewUrl(null);
    setExternalUrls(null);
    setPdfError(null);
    setIsLoadingPdf(false);

    if (activeSubTab !== 'rundown' || !activePdf) {
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
    activeSubTab,
    activePdf?.materialId,
    activePdf?.externalUrl,
    activePdf?.chunkCount,
    activePdf?.fileName,
    activePdf?.mimeType,
  ]);

  // Load Selected Workshop Material PDF (strictly gated by materialAccess.allowed)
  useEffect(() => {
    let cancelled = false;
    let objectUrlToRevoke: string | null = null;

    setMatBlob(null);
    setMatBlobUrl(null);
    setMatExternalUrls(null);
    setMatPdfError(null);
    setIsLoadingMatPdf(false);

    if (activeSubTab !== 'materials' || !activeMaterial || !materialAccess.allowed) {
      return () => {};
    }

    if (activeMaterial.externalUrl) {
      setMatExternalUrls(buildExternalPdfUrls(activeMaterial.externalUrl));
      return () => {};
    }

    const loadMaterialPdf = async () => {
      setIsLoadingMatPdf(true);
      try {
        let blob: Blob | null = null;
        const localRec = await getPdfMaterialLocal(activeMaterial.id);
        if (localRec?.base64Data) {
          blob = base64ToPdfBlob(localRec.base64Data, activeMaterial.mimeType);
        } else if (activeMaterial.chunkCount > 0) {
          blob = await fetchPdfMaterialBlobFromFirestore(
            activeMaterial.id,
            activeMaterial.chunkCount,
            activeMaterial.fileName,
            activeMaterial.mimeType
          );
        }

        if (cancelled) return;
        if (!blob) {
          setMatPdfError(
            'File materi PDF belum tersedia di perangkat ini atau belum disinkronkan ke Cloud oleh panitia.'
          );
          return;
        }

        objectUrlToRevoke = URL.createObjectURL(blob);
        setMatBlob(blob);
        setMatBlobUrl(objectUrlToRevoke);
      } catch (err: any) {
        if (!cancelled) {
          setMatPdfError(err?.message || 'Gagal memuat file materi workshop PDF.');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingMatPdf(false);
        }
      }
    };

    loadMaterialPdf();

    return () => {
      cancelled = true;
      if (objectUrlToRevoke) {
        URL.revokeObjectURL(objectUrlToRevoke);
      }
    };
  }, [
    activeSubTab,
    activeMaterial?.id,
    activeMaterial?.externalUrl,
    activeMaterial?.chunkCount,
    activeMaterial?.fileName,
    activeMaterial?.mimeType,
    materialAccess.allowed,
  ]);

  const handleDirectDownloadMaterial = async (item: WorkshopMaterialPdf) => {
    if (!materialAccess.allowed) return;

    if (item.externalUrl) {
      const urls = buildExternalPdfUrls(item.externalUrl);
      const link = document.createElement('a');
      link.href = urls.downloadUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    setDownloadingMaterialId(item.id);
    try {
      let blob: Blob | null = null;
      if (activeMaterial?.id === item.id && matBlob) {
        blob = matBlob;
      } else {
        const localRec = await getPdfMaterialLocal(item.id);
        if (localRec?.base64Data) {
          blob = base64ToPdfBlob(localRec.base64Data, item.mimeType);
        } else if (item.chunkCount > 0) {
          blob = await fetchPdfMaterialBlobFromFirestore(
            item.id,
            item.chunkCount,
            item.fileName,
            item.mimeType
          );
        }
      }

      if (!blob) {
        setMatPdfError(
          'File materi PDF belum tersedia di perangkat ini atau belum disinkronkan ke Cloud oleh panitia.'
        );
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = item.fileName || `${item.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 3000);
    } catch (err: any) {
      console.error('Failed downloading workshop material PDF:', err);
      setMatPdfError(err?.message || 'Gagal mengunduh file materi workshop PDF.');
    } finally {
      setDownloadingMaterialId(null);
    }
  };

  const activeDownloadUrl = blobPreviewUrl || externalUrls?.downloadUrl || null;
  const activeMatDownloadUrl = matBlobUrl || matExternalUrls?.downloadUrl || null;
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
            <span>Jadwal &amp; Materi Workshop (PDF)</span>
          </div>
          <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>
              {info.dates?.workshop || '28 November 2026'} • {info.location}
            </span>
          </h2>
          <p className="text-xs text-emerald-100/80 mt-0.5">
            Pilih workshop untuk melihat rundown jadwal resmi dan mengakses modul materi PDF sesuai paket tiket Anda.
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
          const slotMaterialsCount = materialsMap[slot.workshopKey]?.length || 0;
          const slotAccess = evaluateWorkshopTrackMaterialAccess({
            workshopLabel: slot.workshopLabel,
            allSessions: sessions,
            eventInfo: info,
            currentUser,
            isParticipantLoggedIn,
            isAdmin: isAdminAuthenticated,
          });

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
              <div className="min-w-0 space-y-1.5">
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

                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  {slotPdf ? (
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Rundown PDF</span>
                    </span>
                  ) : (
                    <span className="text-slate-400 font-medium">Rundown belum diunggah</span>
                  )}

                  <span className="text-slate-300">•</span>

                  <span
                    className={`inline-flex items-center gap-1 font-bold ${
                      slotMaterialsCount > 0
                        ? slotAccess.allowed
                          ? 'text-indigo-700'
                          : 'text-amber-700'
                        : 'text-slate-400 font-medium'
                    }`}
                  >
                    {slotMaterialsCount > 0 ? (
                      slotAccess.allowed ? (
                        <Unlock className="w-3 h-3 shrink-0" />
                      ) : (
                        <Lock className="w-3 h-3 shrink-0" />
                      )
                    ) : (
                      <BookOpen className="w-3 h-3 shrink-0" />
                    )}
                    <span>
                      {slotMaterialsCount > 0
                        ? `${slotMaterialsCount} Materi PDF`
                        : 'Belum ada materi'}
                    </span>
                  </span>
                </div>
              </div>

              <div
                className={`p-2 rounded-xl shrink-0 ${
                  slotPdf || slotMaterialsCount > 0
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

      {/* Sub-Tab Switcher: Rundown Jadwal vs Materi Workshop */}
      {activeSlot && (
        <div className="bg-white rounded-xl border border-slate-200 p-1.5 flex items-center gap-1.5 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveSubTab('rundown')}
            className={`flex-1 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'rundown'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4 shrink-0" />
            <span>Rundown Jadwal (PDF)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('materials')}
            className={`flex-1 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'materials'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {materialAccess.allowed ? (
              <BookOpen className="w-4 h-4 shrink-0" />
            ) : (
              <Lock className="w-4 h-4 shrink-0" />
            )}
            <span>Materi Workshop (PDF)</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                activeSubTab === 'materials'
                  ? 'bg-white/20 text-white'
                  : 'bg-indigo-100 text-indigo-700'
              }`}
            >
              {activeMaterials.length}
            </span>
          </button>
        </div>
      )}

      {/* TAB 1: Selected Workshop Rundown PDF Panel */}
      {activeSubTab === 'rundown' && (
        <>
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
        </>
      )}

      {/* TAB 2: Package-Gated Workshop Materials (PDF) */}
      {activeSubTab === 'materials' && activeSlot && (
        <div className="space-y-3">
          {/* Access Gate: Locked */}
          {!materialAccess.allowed ? (
            <div className="bg-white rounded-2xl border border-amber-200 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                  <Lock className="w-6 h-6" />
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm sm:text-base font-black text-slate-900">
                      {materialAccess.title}
                    </h3>
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold uppercase tracking-wider">
                      Akses Terbatas
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {materialAccess.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-semibold">
                      <Ticket className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Paket Diperlukan: {materialAccess.requiredAccessLabel}</span>
                    </span>

                    {materialAccess.currentTicketLabel && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold">
                        <span>Paket Aktif Anda: {materialAccess.currentTicketLabel}</span>
                      </span>
                    )}
                  </div>

                  <div className="pt-2 flex flex-wrap items-center gap-2">
                    {materialAccess.reason === 'login_required' && onOpenParticipantLogin && (
                      <button
                        type="button"
                        onClick={onOpenParticipantLogin}
                        className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm cursor-pointer transition-colors"
                      >
                        <LogIn className="w-4 h-4" />
                        <span>Login Peserta (Id_registrant)</span>
                      </button>
                    )}

                    {otherAccessibleMaterialSlots.map((slot) => (
                      <button
                        key={slot.workshopKey}
                        type="button"
                        onClick={() => setSelectedWorkshopKey(slot.workshopKey)}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Buka Materi {slot.shortLabel}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Preview of locked material titles (no file download / preview access) */}
              {activeMaterials.length > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Daftar Materi Tersedia di {activeSlot.shortLabel} ({activeMaterials.length} File PDF):
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeMaterials.map((item, idx) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2.5 opacity-80"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-black shrink-0">
                            {idx + 1}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-800 truncate">
                              {item.title}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">
                              {item.speakerName ? `${item.speakerName} • ` : ''}
                              {item.externalUrl
                                ? 'PDF Eksternal'
                                : formatPdfFileSize(item.fileSize)}
                            </div>
                          </div>
                        </div>
                        <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Access Granted */
            <div className="space-y-3">
              {/* Verified Access Strip */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>Akses Materi Terbuka</strong> untuk{' '}
                    <strong>{activeSlot.workshopLabel}</strong>
                  </span>
                </div>
                {materialAccess.grantedBadgeLabel && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                    {materialAccess.grantedBadgeLabel}
                  </span>
                )}
              </div>

              {activeMaterials.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center flex flex-col items-center justify-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-400">
                    <BookOpen className="w-7 h-7" />
                  </div>
                  <div className="space-y-1 max-w-md">
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-800">
                      Belum Ada File Materi PDF untuk Workshop Ini
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                      Panitia belum mengunggah modul atau materi PDF untuk{' '}
                      <strong className="text-slate-700">{activeSlot.workshopLabel}</strong>.
                      Silakan cek kembali secara berkala.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* List of Downloadable / Viewable Materials */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-indigo-600" />
                        <span>
                          Daftar Modul &amp; Materi PDF ({activeMaterials.length} File)
                        </span>
                      </h3>
                      <span className="text-[11px] text-slate-500">
                        Klik materi untuk pratinjau langsung
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {activeMaterials.map((item, idx) => {
                        const isSelectedMat = activeMaterial?.id === item.id;
                        const isDownloading = downloadingMaterialId === item.id;

                        return (
                          <div
                            key={item.id}
                            className={`p-3 rounded-xl border transition-all flex flex-col justify-between gap-2.5 ${
                              isSelectedMat
                                ? 'bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-500/15'
                                : 'bg-slate-50/70 border-slate-200 hover:border-indigo-300'
                            }`}
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 mt-0.5 ${
                                  isSelectedMat
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white border border-slate-200 text-slate-700'
                                }`}
                              >
                                {idx + 1}
                              </div>
                              <div className="min-w-0 flex-1 space-y-0.5">
                                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug break-words">
                                  {item.title}
                                </h4>
                                {item.speakerName && (
                                  <p className="text-[11px] text-indigo-700 font-semibold flex items-center gap-1">
                                    <User className="w-3 h-3 shrink-0" />
                                    <span className="truncate">{item.speakerName}</span>
                                  </p>
                                )}
                                <p className="text-[11px] text-slate-500 truncate">
                                  {item.fileName} •{' '}
                                  <strong className="text-slate-700">
                                    {item.externalUrl
                                      ? 'Tautan PDF Eksternal'
                                      : formatPdfFileSize(item.fileSize)}
                                  </strong>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 pt-1 border-t border-slate-200/70">
                              <button
                                type="button"
                                onClick={() => setSelectedMaterialId(item.id)}
                                className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                                  isSelectedMat
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200'
                                }`}
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>{isSelectedMat ? 'Sedang Dibuka' : 'Lihat PDF'}</span>
                              </button>

                              <button
                                type="button"
                                disabled={isDownloading}
                                onClick={() => handleDirectDownloadMaterial(item)}
                                className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                              >
                                {isDownloading ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : item.externalUrl ? (
                                  <ExternalLink className="w-3.5 h-3.5" />
                                ) : (
                                  <Download className="w-3.5 h-3.5" />
                                )}
                                <span>{isDownloading ? 'Mengunduh...' : 'Unduh PDF'}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active Material Inline PDF Viewer */}
                  {activeMaterial && (
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-2xs space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
                        <div className="min-w-0">
                          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                            {activeMaterial.title}
                          </h3>
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {activeMaterial.speakerName ? `${activeMaterial.speakerName} • ` : ''}
                            {activeMaterial.fileName} •{' '}
                            <strong className="text-slate-700">
                              {activeMaterial.externalUrl
                                ? 'Tautan PDF Eksternal'
                                : formatPdfFileSize(activeMaterial.fileSize)}
                            </strong>
                          </p>
                        </div>

                        {activeMatDownloadUrl &&
                          (activeMaterial.externalUrl ? (
                            <a
                              href={activeMatDownloadUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors shrink-0"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Buka / Unduh Materi PDF</span>
                            </a>
                          ) : (
                            <a
                              href={activeMatDownloadUrl}
                              download={activeMaterial.fileName}
                              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors shrink-0"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Unduh Materi PDF</span>
                            </a>
                          ))}
                      </div>

                      <PdfViewer
                        blob={matBlob}
                        blobUrl={matBlobUrl}
                        externalPreviewUrl={matExternalUrls?.previewUrl || null}
                        externalDownloadUrl={matExternalUrls?.downloadUrl || null}
                        title={activeMaterial.title}
                        fileName={activeMaterial.fileName}
                        isLoading={isLoadingMatPdf}
                        error={matPdfError}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
