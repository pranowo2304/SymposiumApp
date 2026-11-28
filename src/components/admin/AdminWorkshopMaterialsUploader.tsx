import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Cloud,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Link as LinkIcon,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  User,
} from 'lucide-react';
import {
  PresentationMaterial,
  Session,
  SymposiumInfo,
  WorkshopMaterialPdf,
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
import {
  buildSymposiumWorkshopBundleLabel,
  buildWorkshopPassLabel,
} from '../../utils/materialAccess';
import { PdfViewer } from '../PdfViewer';

interface AdminWorkshopMaterialsUploaderProps {
  eventInfo: SymposiumInfo;
  sessions: Session[];
  onSaveEventInfo: (info: SymposiumInfo) => void;
  onShowToast: (msg: string) => void;
  isCloudAdmin?: boolean;
  onCloudAdminSignIn?: () => void;
}

export const AdminWorkshopMaterialsUploader: React.FC<AdminWorkshopMaterialsUploaderProps> = ({
  eventInfo,
  sessions,
  onSaveEventInfo,
  onShowToast,
  isCloudAdmin = false,
  onCloudAdminSignIn,
}) => {
  const materialsMap: Record<string, WorkshopMaterialPdf[]> = eventInfo.workshopMaterials || {};

  const [titleDrafts, setTitleDrafts] = useState<Record<string, string>>({});
  const [speakerDrafts, setSpeakerDrafts] = useState<Record<string, string>>({});
  const [linkDrafts, setLinkDrafts] = useState<Record<string, string>>({});
  const [openLinkFormKey, setOpenLinkFormKey] = useState<string | null>(null);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [syncingMaterialId, setSyncingMaterialId] = useState<string | null>(null);
  const [previewMaterial, setPreviewMaterial] = useState<WorkshopMaterialPdf | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewExternalUrls, setPreviewExternalUrls] = useState<{
    previewUrl: string;
    downloadUrl: string;
  } | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [showAddWorkshop, setShowAddWorkshop] = useState<boolean>(false);
  const [newWorkshopName, setNewWorkshopName] = useState<string>('');
  const [customSlots, setCustomSlots] = useState<WorkshopCardSlot[]>([]);

  const workshopSlots = useMemo(() => {
    const baseSlots = getWorkshopCardSlots(sessions, eventInfo.workshopIdentityCardTemplates);
    const map = new Map<string, WorkshopCardSlot>();
    baseSlots.forEach((s) => map.set(s.workshopKey, s));

    const rundownList: WorkshopRundownPdf[] = Object.values(
      eventInfo.workshopRundownPdfs || {}
    );
    rundownList.forEach((item) => {
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

    customSlots.forEach((slot) => {
      if (!map.has(slot.workshopKey)) {
        map.set(slot.workshopKey, slot);
      }
    });

    return Array.from(map.values());
  }, [
    sessions,
    eventInfo.workshopIdentityCardTemplates,
    eventInfo.workshopRundownPdfs,
    materialsMap,
    customSlots,
  ]);

  useEffect(() => {
    let cancelled = false;
    let objectUrlToRevoke: string | null = null;

    setPreviewBlob(null);
    setPreviewBlobUrl(null);
    setPreviewExternalUrls(null);
    setPreviewError(null);
    setIsLoadingPreview(false);

    if (!previewMaterial) {
      return () => {};
    }

    if (previewMaterial.externalUrl) {
      setPreviewExternalUrls(buildExternalPdfUrls(previewMaterial.externalUrl));
      return () => {};
    }

    const loadPreview = async () => {
      setIsLoadingPreview(true);
      try {
        let blob: Blob | null = null;
        const localRec = await getPdfMaterialLocal(previewMaterial.id);
        if (localRec?.base64Data) {
          blob = base64ToPdfBlob(localRec.base64Data, previewMaterial.mimeType);
        } else if (previewMaterial.chunkCount > 0) {
          blob = await fetchPdfMaterialBlobFromFirestore(
            previewMaterial.id,
            previewMaterial.chunkCount,
            previewMaterial.fileName,
            previewMaterial.mimeType
          );
        }

        if (cancelled) return;
        if (!blob) {
          setPreviewError('File PDF belum tersedia di perangkat ini atau belum disinkronkan ke Cloud.');
          return;
        }
        objectUrlToRevoke = URL.createObjectURL(blob);
        setPreviewBlob(blob);
        setPreviewBlobUrl(objectUrlToRevoke);
      } catch (err: any) {
        if (!cancelled) {
          setPreviewError(err?.message || 'Gagal memuat pratinjau file materi PDF.');
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
    previewMaterial?.id,
    previewMaterial?.externalUrl,
    previewMaterial?.chunkCount,
    previewMaterial?.fileName,
    previewMaterial?.mimeType,
  ]);

  const persistMaterialsMap = (nextMap: Record<string, WorkshopMaterialPdf[]>) => {
    const updatedInfo: SymposiumInfo = {
      ...eventInfo,
      workshopMaterials: nextMap,
    };
    onSaveEventInfo(updatedInfo);
  };

  const handleFilesUpload = async (slot: WorkshopCardSlot, files: FileList) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const existingList = materialsMap[slot.workshopKey] || [];
    if (existingList.length + fileArray.length > 20) {
      onShowToast('Maksimal 20 file materi PDF per workshop.');
      return;
    }

    setUploadingKey(slot.workshopKey);
    try {
      const customTitle = (titleDrafts[slot.workshopKey] || '').trim();
      const speakerName = (speakerDrafts[slot.workshopKey] || '').trim();
      const addedItems: WorkshopMaterialPdf[] = [];
      let allSyncedToCloud = isCloudAdmin;

      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        const { base64Data, fileName, fileSize, mimeType } = await readPdfFileAsBase64(file);
        const matId = generateMaterialId();
        const nowIso = new Date().toISOString();
        const cleanBaseTitle = fileName.replace(/\.pdf$/i, '').trim() || `Materi ${slot.shortLabel}`;
        const resolvedTitle =
          fileArray.length === 1 && customTitle ? customTitle : cleanBaseTitle;

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
          title: resolvedTitle,
          fileName,
          fileSize,
          mimeType,
          chunkCount: 0,
          speakerName: speakerName || undefined,
          uploadedAt: nowIso,
        };

        if (isCloudAdmin) {
          materialMeta = await uploadPdfMaterialToFirestore(
            `workshop_mat_${slot.workshopKey}`,
            materialMeta,
            base64Data
          );
        } else {
          allSyncedToCloud = false;
        }

        addedItems.push({
          id: materialMeta.id,
          workshopKey: slot.workshopKey,
          workshopLabel: slot.workshopLabel,
          title: materialMeta.title,
          ...(speakerName ? { speakerName } : {}),
          fileName: materialMeta.fileName,
          fileSize: materialMeta.fileSize,
          mimeType: materialMeta.mimeType,
          chunkCount: materialMeta.chunkCount,
          uploadedAt: nowIso,
        });
      }

      const nextList = [...existingList, ...addedItems];
      persistMaterialsMap({
        ...materialsMap,
        [slot.workshopKey]: nextList,
      });

      setTitleDrafts((prev) => ({ ...prev, [slot.workshopKey]: '' }));
      setSpeakerDrafts((prev) => ({ ...prev, [slot.workshopKey]: '' }));
      if (addedItems.length > 0) {
        setPreviewMaterial(addedItems[addedItems.length - 1]);
      }

      onShowToast(
        allSyncedToCloud
          ? `${addedItems.length} materi PDF untuk "${slot.shortLabel}" berhasil diunggah & disinkronkan ke Cloud!`
          : `${addedItems.length} materi PDF tersimpan lokal. Hubungkan Cloud Admin agar peserta di perangkat lain bisa mengunduh.`
      );
    } catch (err: any) {
      console.warn('Upload workshop material PDF notice:', err);
      onShowToast(err?.message || 'Gagal mengunggah file materi workshop PDF.');
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

    const existingList = materialsMap[slot.workshopKey] || [];
    if (existingList.length >= 20) {
      onShowToast('Maksimal 20 file materi PDF per workshop.');
      return;
    }

    const customTitle = (titleDrafts[slot.workshopKey] || '').trim();
    const speakerName = (speakerDrafts[slot.workshopKey] || '').trim();
    const nextItem: WorkshopMaterialPdf = {
      id: generateMaterialId(),
      workshopKey: slot.workshopKey,
      workshopLabel: slot.workshopLabel,
      title: customTitle || `Materi ${slot.shortLabel} #${existingList.length + 1}`,
      ...(speakerName ? { speakerName } : {}),
      fileName: `materi-${slot.workshopKey.replace(/_/g, '-')}-${existingList.length + 1}.pdf`,
      fileSize: 0,
      mimeType: 'application/pdf',
      chunkCount: 0,
      externalUrl: rawUrl,
      uploadedAt: new Date().toISOString(),
    };

    persistMaterialsMap({
      ...materialsMap,
      [slot.workshopKey]: [...existingList, nextItem],
    });

    setTitleDrafts((prev) => ({ ...prev, [slot.workshopKey]: '' }));
    setSpeakerDrafts((prev) => ({ ...prev, [slot.workshopKey]: '' }));
    setLinkDrafts((prev) => ({ ...prev, [slot.workshopKey]: '' }));
    setOpenLinkFormKey(null);
    setPreviewMaterial(nextItem);
    onShowToast(`Tautan materi PDF untuk "${slot.shortLabel}" berhasil disimpan!`);
  };

  const handleSyncMaterialToCloud = async (slot: WorkshopCardSlot, item: WorkshopMaterialPdf) => {
    if (!isCloudAdmin) {
      onCloudAdminSignIn?.();
      return;
    }

    setSyncingMaterialId(item.id);
    try {
      const localRec = await getPdfMaterialLocal(item.id);
      if (!localRec?.base64Data) {
        onShowToast('File PDF lokal tidak ditemukan di browser ini. Silakan unggah ulang file PDF.');
        return;
      }

      const freshId = generateMaterialId();
      const uploaded = await uploadPdfMaterialToFirestore(
        `workshop_mat_${slot.workshopKey}`,
        {
          id: freshId,
          title: item.title,
          fileName: item.fileName,
          fileSize: item.fileSize,
          mimeType: item.mimeType,
          chunkCount: 0,
          speakerName: item.speakerName,
          uploadedAt: item.uploadedAt,
        },
        localRec.base64Data
      );

      await savePdfMaterialLocal({
        id: uploaded.id,
        base64Data: localRec.base64Data,
        fileName: item.fileName,
        fileSize: item.fileSize,
        mimeType: item.mimeType,
        savedAt: new Date().toISOString(),
      });

      const currentList = materialsMap[slot.workshopKey] || [];
      const updatedList = currentList.map((m) =>
        m.id === item.id
          ? {
              ...m,
              id: uploaded.id,
              chunkCount: uploaded.chunkCount,
            }
          : m
      );

      persistMaterialsMap({
        ...materialsMap,
        [slot.workshopKey]: updatedList,
      });

      if (previewMaterial?.id === item.id) {
        setPreviewMaterial({
          ...item,
          id: uploaded.id,
          chunkCount: uploaded.chunkCount,
        });
      }

      onShowToast(`Materi "${item.title}" berhasil disinkronkan ke Cloud!`);
    } catch (err: any) {
      console.error('Failed syncing workshop material PDF to cloud:', err);
      onShowToast(err?.message || 'Gagal menyinkronkan file materi PDF ke Cloud.');
    } finally {
      setSyncingMaterialId(null);
    }
  };

  const handleDeleteMaterial = async (slot: WorkshopCardSlot, item: WorkshopMaterialPdf) => {
    try {
      await deletePdfMaterialLocal(item.id);
      if (isCloudAdmin && !item.externalUrl && item.chunkCount > 0) {
        await deletePdfMaterialFromFirestore(item.id);
      }

      const currentList = materialsMap[slot.workshopKey] || [];
      const nextList = currentList.filter((m) => m.id !== item.id);
      const nextMap = { ...materialsMap };
      if (nextList.length > 0) {
        nextMap[slot.workshopKey] = nextList;
      } else {
        delete nextMap[slot.workshopKey];
      }

      persistMaterialsMap(nextMap);

      if (previewMaterial?.id === item.id) {
        setPreviewMaterial(null);
      }
      onShowToast(`Materi "${item.title}" berhasil dihapus.`);
    } catch (err: any) {
      console.error('Failed deleting workshop material PDF:', err);
      onShowToast(err?.message || 'Gagal menghapus file materi PDF.');
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
    onShowToast(`Slot materi "${label}" ditambahkan.`);
  };

  const totalMaterialsCount = workshopSlots.reduce(
    (sum, s) => sum + (materialsMap[s.workshopKey]?.length || 0),
    0
  );

  return (
    <div className="bg-slate-950 border border-indigo-500/35 rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400 shrink-0" />
              <span>Upload Materi &amp; Modul Per Workshop (PDF)</span>
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/35">
              {totalMaterialsCount} File Materi Aktif
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Unggah modul, handout, atau slide presentasi PDF (maks. <strong className="text-slate-200">40 MB</strong> per file atau via Link PDF Google Drive) untuk masing-masing workshop. Peserta dapat melihat &amp; mengunduh materi di menu <strong className="text-slate-200">Workshop</strong> hanya jika memiliki <strong className="text-indigo-300">paket tiket yang sesuai</strong>.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddWorkshop((prev) => !prev)}
          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 self-start sm:self-auto shrink-0 cursor-pointer transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-indigo-400" />
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
            className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddWorkshopSlot}
              className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
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
              Mode Lokal aktif. Hubungkan <strong className="text-white">Google Admin</strong> agar file materi workshop PDF tersinkron ke Cloud Database dan dapat diunduh dari perangkat peserta.
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

      {/* Workshop Material Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {workshopSlots.map((slot, index) => {
          const list = materialsMap[slot.workshopKey] || [];
          const isUploading = uploadingKey === slot.workshopKey;
          const inputId = `workshop-material-pdf-input-${slot.workshopKey}`;
          const passLabel = buildWorkshopPassLabel(slot.workshopLabel);
          const bundleLabel = buildSymposiumWorkshopBundleLabel(slot.workshopLabel);

          return (
            <div
              key={slot.workshopKey}
              className={`bg-slate-900/80 rounded-2xl border p-4 space-y-3.5 flex flex-col justify-between transition-colors ${
                list.length > 0 ? 'border-indigo-500/40' : 'border-slate-800'
              }`}
            >
              <div className="space-y-3">
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/35">
                        Workshop {index + 1}
                      </span>
                      {slot.roomLabel && (
                        <span className="text-[11px] text-slate-400 font-medium">
                          • {slot.roomLabel}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-extrabold text-white leading-snug">
                      {slot.workshopLabel}
                    </h3>
                  </div>

                  {list.length > 0 ? (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{list.length} PDF</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
                      0 Materi
                    </span>
                  )}
                </div>

                {/* Eligible Packages Info Pill */}
                <div className="px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800/90 text-[11px] text-slate-400 flex items-start gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    Akses peserta:{' '}
                    <strong className="text-slate-200">{passLabel}</strong>,{' '}
                    <strong className="text-slate-200">{bundleLabel}</strong>, Workshop Full Pass, atau All-Access.
                  </span>
                </div>

                {/* Upload Controls */}
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={titleDrafts[slot.workshopKey] || ''}
                      onChange={(e) =>
                        setTitleDrafts((prev) => ({
                          ...prev,
                          [slot.workshopKey]: e.target.value,
                        }))
                      }
                      placeholder="Judul materi (opsional, otomatis dari nama file)"
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    <input
                      type="text"
                      value={speakerDrafts[slot.workshopKey] || ''}
                      onChange={(e) =>
                        setSpeakerDrafts((prev) => ({
                          ...prev,
                          [slot.workshopKey]: e.target.value,
                        }))
                      }
                      placeholder="Nama pemateri / instruktur (opsional)"
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <input
                    type="file"
                    id={inputId}
                    accept="application/pdf,.pdf"
                    multiple
                    disabled={isUploading}
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files.length > 0) {
                        handleFilesUpload(slot, files);
                      }
                      e.target.value = '';
                    }}
                    className="hidden"
                  />

                  <div className="flex flex-wrap items-center gap-2">
                    <label
                      htmlFor={inputId}
                      className={`flex-1 min-w-[150px] py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-colors ${
                        isUploading ? 'opacity-60 pointer-events-none' : ''
                      }`}
                    >
                      {isUploading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {isUploading ? 'Mengunggah PDF...' : 'Upload Materi PDF (Bisa Banyak)'}
                      </span>
                    </label>

                    <button
                      type="button"
                      onClick={() =>
                        setOpenLinkFormKey((prev) =>
                          prev === slot.workshopKey ? null : slot.workshopKey
                        )
                      }
                      className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer transition-colors"
                      title="Tambahkan materi via tautan Google Drive / PDF eksternal"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>Link PDF</span>
                    </button>
                  </div>

                  {/* External Link Form */}
                  {openLinkFormKey === slot.workshopKey && (
                    <div className="pt-2 border-t border-slate-800 space-y-1.5">
                      <label className="block text-[11px] font-bold text-slate-300">
                        Tempel Tautan Materi PDF (Google Drive / URL Publik):
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="url"
                          value={linkDrafts[slot.workshopKey] || ''}
                          onChange={(e) =>
                            setLinkDrafts((prev) => ({
                              ...prev,
                              [slot.workshopKey]: e.target.value,
                            }))
                          }
                          placeholder="https://drive.google.com/file/d/.../view"
                          className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
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

                {/* Uploaded Materials List */}
                {list.length > 0 ? (
                  <div className="space-y-2">
                    {list.map((item, idx) => {
                      const isPreviewing = previewMaterial?.id === item.id;
                      const isSyncing = syncingMaterialId === item.id;
                      const needsCloudSync = !item.externalUrl && item.chunkCount === 0;

                      return (
                        <div
                          key={item.id}
                          className={`p-3 rounded-xl bg-slate-950 border transition-colors space-y-2 ${
                            isPreviewing ? 'border-indigo-500/70' : 'border-slate-800'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5">
                                {idx + 1}
                              </div>
                              <div className="min-w-0 space-y-0.5">
                                <div className="text-xs font-bold text-white leading-snug break-words">
                                  {item.title}
                                </div>
                                {item.speakerName && (
                                  <div className="text-[11px] text-indigo-300 flex items-center gap-1">
                                    <User className="w-3 h-3 shrink-0" />
                                    <span className="truncate">{item.speakerName}</span>
                                  </div>
                                )}
                                <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
                                  <span className="truncate max-w-[160px]" title={item.fileName}>
                                    {item.fileName}
                                  </span>
                                  <span>•</span>
                                  <span className="text-slate-300 font-semibold">
                                    {item.externalUrl
                                      ? 'Tautan Eksternal'
                                      : formatPdfFileSize(item.fileSize)}
                                  </span>
                                  <span>•</span>
                                  {item.externalUrl ? (
                                    <span className="text-sky-300 inline-flex items-center gap-0.5">
                                      <ExternalLink className="w-2.5 h-2.5" />
                                      Link Aktif
                                    </span>
                                  ) : needsCloudSync ? (
                                    <span className="text-amber-300">Lokal (Belum Cloud)</span>
                                  ) : (
                                    <span className="text-emerald-300 inline-flex items-center gap-0.5">
                                      <Cloud className="w-2.5 h-2.5" />
                                      Cloud
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewMaterial((prev) =>
                                    prev?.id === item.id ? null : item
                                  )
                                }
                                className={`p-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-colors ${
                                  isPreviewing
                                    ? 'bg-indigo-600 text-white border-indigo-500'
                                    : 'bg-slate-900 hover:bg-slate-800 text-indigo-300 border-slate-700'
                                }`}
                                title={isPreviewing ? 'Tutup Pratinjau PDF' : 'Lihat Pratinjau PDF'}
                              >
                                {isPreviewing ? (
                                  <EyeOff className="w-3.5 h-3.5" />
                                ) : (
                                  <Eye className="w-3.5 h-3.5" />
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteMaterial(slot, item)}
                                className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 cursor-pointer transition-colors"
                                title="Hapus file materi PDF"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {needsCloudSync && (
                            <button
                              type="button"
                              disabled={isSyncing}
                              onClick={() => handleSyncMaterialToCloud(slot, item)}
                              className="w-full py-1.5 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                            >
                              {isSyncing ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <RefreshCw className="w-3 h-3" />
                              )}
                              <span>
                                {isSyncing
                                  ? 'Menyinkronkan ke Cloud...'
                                  : isCloudAdmin
                                    ? 'Sinkronkan File Ini ke Cloud'
                                    : 'Login Google Admin untuk Sync ke Cloud'}
                              </span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500 flex flex-col items-center gap-1">
                    <FileText className="w-5 h-5 text-slate-600" />
                    <span>Belum ada materi PDF yang diunggah untuk {slot.shortLabel}.</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Inline PDF Preview Panel */}
      {previewMaterial && (
        <div className="pt-3 border-t border-slate-800 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              <span>
                Pratinjau Materi ({previewMaterial.workshopLabel}): {previewMaterial.title}
              </span>
            </span>
            <button
              type="button"
              onClick={() => setPreviewMaterial(null)}
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
            title={previewMaterial.title}
            fileName={previewMaterial.fileName}
            isLoading={isLoadingPreview}
            error={previewError}
          />
        </div>
      )}
    </div>
  );
};
