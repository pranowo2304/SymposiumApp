import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Cloud,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Link as LinkIcon,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  PresentationMaterial,
  Session,
  SymposiumInfo,
  WorkshopRundownPdf,
} from '../../types';
import {
  base64ToPdfBlob,
  buildExternalPdfUrls,
  deletePdfMaterialLocal,
  formatPdfFileSize,
  generateMaterialId,
  getPdfMaterialLocal,
  readPdfFileAsBase64,
  savePdfMaterialLocal,
} from '../../utils/presentationPdfStorage';
import {
  deletePdfMaterialFromFirestore,
  fetchPdfMaterialBlobFromFirestore,
  uploadPdfMaterialToFirestore,
} from '../../services/firestoreSyncService';
import {
  getWorkshopCardSlots,
  toWorkshopTemplateKey,
  WorkshopCardSlot,
} from '../../utils/workshopCardTemplates';
import { PdfViewer } from '../PdfViewer';

interface AdminWorkshopRundownUploaderProps {
  eventInfo: SymposiumInfo;
  sessions: Session[];
  onSaveEventInfo: (info: SymposiumInfo) => void;
  onShowToast: (msg: string) => void;
  isCloudAdmin?: boolean;
  onCloudAdminSignIn?: () => void;
}

export const AdminWorkshopRundownUploader: React.FC<AdminWorkshopRundownUploaderProps> = ({
  eventInfo,
  sessions,
  onSaveEventInfo,
  onShowToast,
  isCloudAdmin = false,
  onCloudAdminSignIn,
}) => {
  const rundownMap: Record<string, WorkshopRundownPdf> = eventInfo.workshopRundownPdfs || {};

  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [syncingKey, setSyncingKey] = useState<string | null>(null);
  const [linkDrafts, setLinkDrafts] = useState<Record<string, string>>({});
  const [openLinkFormKey, setOpenLinkFormKey] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewExternalUrls, setPreviewExternalUrls] = useState<{
    previewUrl: string;
    downloadUrl: string;
  } | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [newWorkshopName, setNewWorkshopName] = useState<string>('');
  const [showAddWorkshop, setShowAddWorkshop] = useState<boolean>(false);
  const [customSlots, setCustomSlots] = useState<WorkshopCardSlot[]>([]);

  const workshopSlots = useMemo(() => {
    const baseSlots = getWorkshopCardSlots(sessions, eventInfo.workshopIdentityCardTemplates);
    const map = new Map<string, WorkshopCardSlot>();
    baseSlots.forEach((s) => map.set(s.workshopKey, s));

    Object.values(rundownMap).forEach((item) => {
      if (!item?.workshopKey) return;
      if (!map.has(item.workshopKey)) {
        map.set(item.workshopKey, {
          workshopKey: item.workshopKey,
          workshopLabel: item.workshopLabel || item.workshopKey,
          shortLabel: item.workshopLabel || item.workshopKey,
          sessionCount: 0,
        });
      }
    });

    customSlots.forEach((slot) => {
      if (!map.has(slot.workshopKey)) {
        map.set(slot.workshopKey, slot);
      }
    });

    return Array.from(map.values());
  }, [sessions, eventInfo.workshopIdentityCardTemplates, rundownMap, customSlots]);

  const activePreviewPdf = previewKey ? rundownMap[previewKey] || null : null;

  useEffect(() => {
    let cancelled = false;
    let objectUrlToRevoke: string | null = null;

    setPreviewBlob(null);
    setPreviewBlobUrl(null);
    setPreviewExternalUrls(null);
    setPreviewError(null);
    setIsLoadingPreview(false);

    if (!activePreviewPdf) {
      return () => {};
    }

    if (activePreviewPdf.externalUrl) {
      setPreviewExternalUrls(buildExternalPdfUrls(activePreviewPdf.externalUrl));
      return () => {};
    }

    const loadPreview = async () => {
      setIsLoadingPreview(true);
      try {
        let blob: Blob | null = null;
        const localRec = await getPdfMaterialLocal(activePreviewPdf.materialId);
        if (localRec?.base64Data) {
          blob = base64ToPdfBlob(localRec.base64Data, activePreviewPdf.mimeType);
        } else if (activePreviewPdf.chunkCount > 0) {
          blob = await fetchPdfMaterialBlobFromFirestore(
            activePreviewPdf.materialId,
            activePreviewPdf.chunkCount,
            activePreviewPdf.fileName,
            activePreviewPdf.mimeType
          );
        }

        if (cancelled) return;
        if (!blob) {
          setPreviewError('File PDF belum tersedia di browser ini atau belum disinkronkan ke Cloud.');
          return;
        }
        objectUrlToRevoke = URL.createObjectURL(blob);
        setPreviewBlob(blob);
        setPreviewBlobUrl(objectUrlToRevoke);
      } catch (err: any) {
        if (!cancelled) {
          setPreviewError(err?.message || 'Gagal memuat pratinjau file rundown PDF.');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingPreview(false);
        }
      }
    };

    loadPreview();

    return () => {
      cancelled = true;
      if (objectUrlToRevoke) {
        URL.revokeObjectURL(objectUrlToRevoke);
      }
    };
  }, [
    activePreviewPdf?.materialId,
    activePreviewPdf?.externalUrl,
    activePreviewPdf?.chunkCount,
    activePreviewPdf?.fileName,
    activePreviewPdf?.mimeType,
  ]);

  const persistRundownMap = (nextMap: Record<string, WorkshopRundownPdf>) => {
    const updatedInfo: SymposiumInfo = {
      ...eventInfo,
      workshopRundownPdfs: nextMap,
    };
    onSaveEventInfo(updatedInfo);
  };

  const handleFileUpload = async (slot: WorkshopCardSlot, file: File) => {
    setUploadingKey(slot.workshopKey);
    try {
      const { base64Data, fileName, fileSize, mimeType } = await readPdfFileAsBase64(file);
      const previous = rundownMap[slot.workshopKey];
      const matId = generateMaterialId();
      const nowIso = new Date().toISOString();
      const title = `Rundown ${slot.workshopLabel}`;

      await savePdfMaterialLocal({
        id: matId,
        base64Data,
        fileName,
        fileSize,
        mimeType,
        savedAt: nowIso,
      });

      let materialMeta: PresentationMaterial = {
        id: matId,
        title,
        fileName,
        fileSize,
        mimeType,
        chunkCount: 0,
        uploadedAt: nowIso,
      };

      let syncedToCloud = false;
      if (isCloudAdmin) {
        materialMeta = await uploadPdfMaterialToFirestore(
          `workshop_rundown_${slot.workshopKey}`,
          materialMeta,
          base64Data
        );
        syncedToCloud = true;
      }

      const nextEntry: WorkshopRundownPdf = {
        workshopKey: slot.workshopKey,
        workshopLabel: slot.workshopLabel,
        materialId: materialMeta.id,
        title: materialMeta.title,
        fileName: materialMeta.fileName,
        fileSize: materialMeta.fileSize,
        mimeType: materialMeta.mimeType,
        chunkCount: materialMeta.chunkCount,
        uploadedAt: nowIso,
      };

      persistRundownMap({
        ...rundownMap,
        [slot.workshopKey]: nextEntry,
      });

      // Clean up replaced PDF chunks in background
      if (previous && previous.materialId && previous.materialId !== nextEntry.materialId) {
        deletePdfMaterialLocal(previous.materialId).catch(() => {});
        if (isCloudAdmin && !previous.externalUrl && previous.chunkCount > 0) {
          deletePdfMaterialFromFirestore(previous.materialId).catch(() => {});
        }
      }

      setPreviewKey(slot.workshopKey);
      onShowToast(
        syncedToCloud
          ? `Rundown PDF "${slot.shortLabel}" berhasil diunggah & disinkronkan ke Cloud!`
          : `Rundown PDF "${slot.shortLabel}" tersimpan lokal. Login Google Admin untuk menyinkronkan ke semua peserta.`
      );
    } catch (err: any) {
      console.error('Failed uploading workshop rundown PDF:', err);
      onShowToast(err?.message || 'Gagal mengunggah file rundown PDF.');
    } finally {
      setUploadingKey(null);
    }
  };

  const handleSaveExternalLink = (slot: WorkshopCardSlot) => {
    const rawUrl = (linkDrafts[slot.workshopKey] || '').trim();
    if (!rawUrl || !/^https?:\/\//i.test(rawUrl)) {
      onShowToast('Masukkan tautan PDF yang valid (diawali https:// atau http://).');
      return;
    }

    const previous = rundownMap[slot.workshopKey];
    const nextEntry: WorkshopRundownPdf = {
      workshopKey: slot.workshopKey,
      workshopLabel: slot.workshopLabel,
      materialId: generateMaterialId(),
      title: `Rundown ${slot.workshopLabel}`,
      fileName: `rundown-${slot.workshopKey.replace(/_/g, '-')}.pdf`,
      fileSize: 0,
      mimeType: 'application/pdf',
      chunkCount: 0,
      externalUrl: rawUrl,
      uploadedAt: new Date().toISOString(),
    };

    persistRundownMap({
      ...rundownMap,
      [slot.workshopKey]: nextEntry,
    });

    if (previous && previous.materialId && !previous.externalUrl) {
      deletePdfMaterialLocal(previous.materialId).catch(() => {});
      if (isCloudAdmin && previous.chunkCount > 0) {
        deletePdfMaterialFromFirestore(previous.materialId).catch(() => {});
      }
    }

    setLinkDrafts((prev) => ({ ...prev, [slot.workshopKey]: '' }));
    setOpenLinkFormKey(null);
    setPreviewKey(slot.workshopKey);
    onShowToast(`Tautan rundown PDF untuk "${slot.shortLabel}" berhasil disimpan!`);
  };

  const handleSyncLocalPdfToCloud = async (slot: WorkshopCardSlot, entry: WorkshopRundownPdf) => {
    if (!isCloudAdmin) {
      onCloudAdminSignIn?.();
      return;
    }
    setSyncingKey(slot.workshopKey);
    try {
      const localRec = await getPdfMaterialLocal(entry.materialId);
      if (!localRec?.base64Data) {
        onShowToast('File PDF lokal tidak ditemukan di browser ini. Silakan unggah ulang file PDF.');
        return;
      }

      const freshId = generateMaterialId();
      const uploaded = await uploadPdfMaterialToFirestore(
        `workshop_rundown_${slot.workshopKey}`,
        {
          id: freshId,
          title: entry.title,
          fileName: entry.fileName,
          fileSize: entry.fileSize,
          mimeType: entry.mimeType,
          chunkCount: 0,
          uploadedAt: entry.uploadedAt,
        },
        localRec.base64Data
      );

      await savePdfMaterialLocal({
        id: uploaded.id,
        base64Data: localRec.base64Data,
        fileName: entry.fileName,
        fileSize: entry.fileSize,
        mimeType: entry.mimeType,
        savedAt: new Date().toISOString(),
      });

      const nextEntry: WorkshopRundownPdf = {
        ...entry,
        materialId: uploaded.id,
        chunkCount: uploaded.chunkCount,
      };
      persistRundownMap({
        ...rundownMap,
        [slot.workshopKey]: nextEntry,
      });
      onShowToast(`Rundown PDF "${slot.shortLabel}" berhasil disinkronkan ke Cloud!`);
    } catch (err: any) {
      console.error('Failed syncing rundown PDF to cloud:', err);
      onShowToast(err?.message || 'Gagal menyinkronkan file rundown PDF ke Cloud.');
    } finally {
      setSyncingKey(null);
    }
  };

  const handleDeleteRundown = async (slot: WorkshopCardSlot, entry: WorkshopRundownPdf) => {
    try {
      await deletePdfMaterialLocal(entry.materialId);
      if (isCloudAdmin && !entry.externalUrl && entry.chunkCount > 0) {
        await deletePdfMaterialFromFirestore(entry.materialId);
      }
      const nextMap = { ...rundownMap };
      delete nextMap[slot.workshopKey];
      persistRundownMap(nextMap);
      if (previewKey === slot.workshopKey) {
        setPreviewKey(null);
      }
      onShowToast(`File rundown PDF "${slot.shortLabel}" berhasil dihapus.`);
    } catch (err: any) {
      console.error('Failed deleting workshop rundown PDF:', err);
      onShowToast(err?.message || 'Gagal menghapus file rundown PDF.');
    }
  };

  const handleAddWorkshopSlot = () => {
    const clean = newWorkshopName.trim();
    if (!clean) {
      onShowToast('Masukkan nama workshop terlebih dahulu.');
      return;
    }
    const label = /^workshop\b/i.test(clean) ? clean : `Workshop ${clean}`;
    const key = toWorkshopTemplateKey(label);
    if (workshopSlots.some((s) => s.workshopKey === key)) {
      onShowToast('Workshop dengan nama tersebut sudah tersedia.');
      return;
    }
    setCustomSlots((prev) => [
      ...prev,
      {
        workshopKey: key,
        workshopLabel: label,
        shortLabel: label,
        sessionCount: 0,
      },
    ]);
    setNewWorkshopName('');
    setShowAddWorkshop(false);
    onShowToast(`Slot unggah rundown "${label}" ditambahkan.`);
  };

  const uploadedCount = workshopSlots.filter((s) => Boolean(rundownMap[s.workshopKey])).length;

  return (
    <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>Upload File Rundown Jadwal Masing-Masing Workshop (PDF)</span>
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              {uploadedCount} / {workshopSlots.length} Terunggah
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Halaman <strong className="text-slate-200">Jadwal Workshop</strong> peserta akan langsung menampilkan file rundown PDF yang diunggah di sini (format PDF maks. 10 MB atau tautan Google Drive PDF).
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddWorkshop((prev) => !prev)}
          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 self-start sm:self-auto shrink-0 cursor-pointer transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-emerald-400" />
          <span>Tambah Slot Workshop</span>
        </button>
      </div>

      {/* Optional Add Custom Workshop Slot */}
      {showAddWorkshop && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            value={newWorkshopName}
            onChange={(e) => setNewWorkshopName(e.target.value)}
            placeholder="Contoh: Workshop USG Abdomen / Workshop Bedah..."
            className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddWorkshopSlot}
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
            >
              Tambahkan
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddWorkshop(false);
                setNewWorkshopName('');
              }}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Cloud Sync Notice when Admin is not logged into Cloud */}
      {!isCloudAdmin && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-start gap-2 text-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              Mode Lokal aktif. Hubungkan <strong className="text-white">Google Admin</strong> agar file rundown PDF yang diunggah tersinkron ke Cloud Database dan bisa dibuka dari semua perangkat peserta.
            </span>
          </div>
          {onCloudAdminSignIn && (
            <button
              type="button"
              onClick={onCloudAdminSignIn}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer self-start sm:self-auto"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Hubungkan Cloud Admin</span>
            </button>
          )}
        </div>
      )}

      {/* Workshop Rundown Upload Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {workshopSlots.map((slot, index) => {
          const entry = rundownMap[slot.workshopKey];
          const isUploading = uploadingKey === slot.workshopKey;
          const isSyncing = syncingKey === slot.workshopKey;
          const isPreviewing = previewKey === slot.workshopKey;
          const needsCloudSync = Boolean(entry && !entry.externalUrl && entry.chunkCount === 0);
          const inputId = `workshop-rundown-pdf-input-${slot.workshopKey}`;

          return (
            <div
              key={slot.workshopKey}
              className={`bg-slate-900/80 rounded-2xl border p-4 space-y-3 transition-colors ${
                entry ? 'border-emerald-500/40' : 'border-slate-800'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 mb-1">
                    Workshop {index + 1}
                  </span>
                  <h3 className="text-sm font-extrabold text-white leading-snug">
                    {slot.workshopLabel}
                  </h3>
                  {slot.roomLabel && (
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Ruangan: {slot.roomLabel}
                    </p>
                  )}
                </div>

                {entry ? (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>PDF Aktif</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
                    Belum Diunggah
                  </span>
                )}
              </div>

              {/* Hidden PDF File Input */}
              <input
                type="file"
                id={inputId}
                accept="application/pdf,.pdf"
                disabled={isUploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (file) {
                    handleFileUpload(slot, file);
                  }
                }}
                className="hidden"
              />

              {/* Active File Info or Empty Dropzone */}
              {entry ? (
                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                    <div className="p-2 rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/30 shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="text-xs font-bold text-white truncate" title={entry.fileName}>
                        {entry.fileName}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                        <span className="font-semibold text-slate-300">
                          {entry.externalUrl ? 'Tautan PDF Eksternal' : formatPdfFileSize(entry.fileSize)}
                        </span>
                        <span>•</span>
                        {entry.externalUrl ? (
                          <span className="text-sky-300 flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" />
                            Link Aktif
                          </span>
                        ) : needsCloudSync ? (
                          <span className="text-amber-300">Belum disinkronkan ke Cloud</span>
                        ) : (
                          <span className="text-emerald-300 flex items-center gap-1">
                            <Cloud className="w-3 h-3" />
                            Tersimpan di Cloud
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {needsCloudSync && (
                    <button
                      type="button"
                      disabled={isSyncing}
                      onClick={() => handleSyncLocalPdfToCloud(slot, entry)}
                      className="w-full py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      {isSyncing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {isSyncing
                          ? 'Menyinkronkan PDF ke Cloud...'
                          : isCloudAdmin
                            ? 'Sinkronkan File PDF Ini ke Cloud Sekarang'
                            : 'Login Google Admin untuk Sync ke Cloud'}
                      </span>
                    </button>
                  )}

                  <div className="flex flex-wrap items-center gap-1.5">
                    <label
                      htmlFor={inputId}
                      className="flex-1 min-w-[95px] py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-[11px] font-bold flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer transition-colors"
                    >
                      {isUploading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                      ) : (
                        <Upload className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                      <span>{isUploading ? 'Mengunggah...' : 'Ganti PDF'}</span>
                    </label>

                    <button
                      type="button"
                      onClick={() =>
                        setPreviewKey((prev) => (prev === slot.workshopKey ? null : slot.workshopKey))
                      }
                      className={`flex-1 min-w-[95px] py-1.5 px-2.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 border cursor-pointer transition-colors ${
                        isPreviewing
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      {isPreviewing ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{isPreviewing ? 'Tutup Preview' : 'Lihat PDF'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setOpenLinkFormKey((prev) =>
                          prev === slot.workshopKey ? null : slot.workshopKey
                        )
                      }
                      className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 text-[11px] font-bold flex items-center justify-center gap-1 border border-slate-700 cursor-pointer"
                      title="Gunakan tautan PDF eksternal (Google Drive / URL)"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteRundown(slot, entry)}
                      className="py-1.5 px-2.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-[11px] font-bold flex items-center justify-center border border-rose-500/30 cursor-pointer"
                      title="Hapus file rundown PDF"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label
                    htmlFor={inputId}
                    className="cursor-pointer border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-1.5 bg-slate-950/60 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400">
                      {isUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                    </div>
                    <span className="text-xs font-bold text-white">
                      {isUploading
                        ? 'Mengunggah file rundown PDF...'
                        : `Upload Rundown PDF ${slot.shortLabel}`}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Format .pdf (maks. 10 MB) · Langsung tampil di halaman Jadwal Workshop
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={() =>
                      setOpenLinkFormKey((prev) =>
                        prev === slot.workshopKey ? null : slot.workshopKey
                      )
                    }
                    className="w-full py-1.5 px-3 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] font-bold text-sky-300 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <LinkIcon className="w-3 h-3" />
                    <span>Atau Gunakan Tautan PDF Eksternal (Google Drive / URL)</span>
                  </button>
                </div>
              )}

              {/* External PDF URL Input Drawer */}
              {openLinkFormKey === slot.workshopKey && (
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <label className="block text-[11px] font-bold text-slate-300">
                    Tempel Tautan PDF (Google Drive / Link PDF Publik):
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="url"
                      value={linkDrafts[slot.workshopKey] || ''}
                      onChange={(e) =>
                        setLinkDrafts((prev) => ({ ...prev, [slot.workshopKey]: e.target.value }))
                      }
                      placeholder="https://drive.google.com/file/d/.../view"
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveExternalLink(slot)}
                      className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold cursor-pointer shrink-0"
                    >
                      Simpan
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Inline PDF Preview Panel */}
      {activePreviewPdf && (
        <div className="pt-3 border-t border-slate-800 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              <span>Pratinjau: {activePreviewPdf.title}</span>
            </span>
            <button
              type="button"
              onClick={() => setPreviewKey(null)}
              className="text-[11px] font-bold text-slate-400 hover:text-white cursor-pointer"
            >
              Tutup Pratinjau
            </button>
          </div>
          <PdfViewer
            blob={previewBlob}
            blobUrl={previewBlobUrl}
            externalPreviewUrl={previewExternalUrls?.previewUrl || null}
            externalDownloadUrl={previewExternalUrls?.downloadUrl || null}
            title={activePreviewPdf.title}
            fileName={activePreviewPdf.fileName}
            isLoading={isLoadingPreview}
            error={previewError}
          />
        </div>
      )}
    </div>
  );
};
