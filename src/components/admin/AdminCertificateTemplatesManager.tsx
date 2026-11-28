import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Award,
  CheckCircle2,
  Cloud,
  Download,
  Eye,
  EyeOff,
  FileImage,
  FileText,
  Loader2,
  Move,
  Palette,
  RotateCcw,
  Save,
  Sliders,
  Sparkles,
  Trash2,
  Upload,
  User,
} from 'lucide-react';
import {
  CertificateFieldConfig,
  CertificateLayoutConfig,
  CertificateTemplate,
  Participant,
  Session,
  SymposiumInfo,
} from '../../types';
import {
  buildCertificateFieldTexts,
  CERTIFICATE_CANVAS_H,
  CERTIFICATE_CANVAS_W,
  CERTIFICATE_LAYOUT_PRESETS,
  compressCertificateTemplateFile,
  DEFAULT_CERTIFICATE_LAYOUT,
  downloadCertificateAsPdf,
  downloadCertificateAsPng,
  getCertificateTemplateSlots,
  normalizeCertificateLayout,
} from '../../utils/certificateTemplates';

interface AdminCertificateTemplatesManagerProps {
  eventInfo: SymposiumInfo;
  sessions: Session[];
  participants: Participant[];
  onSaveEventInfo: (info: SymposiumInfo) => void;
  onShowToast: (msg: string) => void;
  isCloudAdmin?: boolean;
  onCloudAdminSignIn?: () => void;
}

type FieldKey = keyof CertificateLayoutConfig;

const FIELD_METADATA: Array<{
  key: FieldKey;
  label: string;
  shortLabel: string;
}> = [
  { key: 'name', label: 'Nama Lengkap Peserta', shortLabel: 'Nama' },
  { key: 'role', label: 'Peran / Status (Peserta/Pembicara)', shortLabel: 'Peran' },
  { key: 'institution', label: 'Institusi / Klinik / Kampus', shortLabel: 'Institusi' },
  { key: 'certificateNumber', label: 'Nomor Sertifikat', shortLabel: 'No. Sertifikat' },
  { key: 'dateLine', label: 'Tanggal Pelaksanaan', shortLabel: 'Tanggal' },
  { key: 'accreditation', label: 'Akreditasi SKP', shortLabel: 'Akreditasi' },
];

const COLOR_SWATCHES = [
  '#0f172a',
  '#1e293b',
  '#0f766e',
  '#1d4ed8',
  '#b45309',
  '#991b1b',
  '#ffffff',
  '#f8fafc',
];

const FALLBACK_PREVIEW_PARTICIPANT: Participant = {
  id: 'preview-sample',
  name: 'drh. Budi Santoso, M.Si',
  title: '',
  email: 'budi.santoso@adhphki.org',
  institution: 'Klinik Hewan Nusantara Jakarta',
  badgeId: 'ID-SIMP-2026-001',
  ticketType: 'Full Access (Symposium + Workshop)',
  role: 'Peserta',
};

export const AdminCertificateTemplatesManager: React.FC<AdminCertificateTemplatesManagerProps> = ({
  eventInfo,
  sessions,
  participants,
  onSaveEventInfo,
  onShowToast,
  isCloudAdmin = false,
  onCloudAdminSignIn,
}) => {
  const slots = useMemo(
    () => getCertificateTemplateSlots(sessions, eventInfo),
    [sessions, eventInfo]
  );

  const [activeSlotKey, setActiveSlotKey] = useState<string>('symposium');
  const [selectedField, setSelectedField] = useState<FieldKey>('name');
  const [uploadingSlotKey, setUploadingSlotKey] = useState<string | null>(null);
  const [downloadingType, setDownloadingType] = useState<'png' | 'pdf' | null>(null);
  const [previewParticipantId, setPreviewParticipantId] = useState<string>('sample');
  const [draggingField, setDraggingField] = useState<FieldKey | null>(null);
  const [isSnappedCenter, setIsSnappedCenter] = useState<boolean>(false);

  // Local draft of active template layout & prefix for smooth dragging without spamming saves
  const [draftLayout, setDraftLayout] = useState<CertificateLayoutConfig>(DEFAULT_CERTIFICATE_LAYOUT);
  const [draftPrefix, setDraftPrefix] = useState<string>('CERT-SYMP-2026-');
  const [hasUnsavedLayout, setHasUnsavedLayout] = useState<boolean>(false);

  const previewContainerRef = useRef<HTMLDivElement | null>(null);
  const editorSectionRef = useRef<HTMLDivElement | null>(null);
  const [previewWidth, setPreviewWidth] = useState<number>(800);

  // Ensure activeSlotKey always points to an existing slot
  useEffect(() => {
    if (slots.length > 0 && !slots.some((s) => s.templateKey === activeSlotKey)) {
      setActiveSlotKey(slots[0].templateKey);
    }
  }, [slots, activeSlotKey]);

  const activeSlot = useMemo(
    () => slots.find((s) => s.templateKey === activeSlotKey) || slots[0],
    [slots, activeSlotKey]
  );

  const savedTemplatesMap = eventInfo.certificateTemplates || {};
  const activeSavedTemplate: CertificateTemplate | undefined = activeSlot
    ? savedTemplatesMap[activeSlot.templateKey]
    : undefined;

  // Sync draft editor state whenever the selected slot or its saved config changes
  useEffect(() => {
    if (!activeSlot) return;
    const saved = savedTemplatesMap[activeSlot.templateKey];
    setDraftLayout(normalizeCertificateLayout(saved?.layout));
    setDraftPrefix(saved?.certificateNumberPrefix ?? activeSlot.defaultPrefix);
    setHasUnsavedLayout(false);
  }, [activeSlot?.templateKey, activeSavedTemplate?.templateUrl, activeSavedTemplate?.certificateNumberPrefix]);

  // Measure preview container width so font sizes scale 1:1 with 1600x1131 export canvas
  useEffect(() => {
    const el = previewContainerRef.current;
    if (!el) return;
    const updateWidth = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0) setPreviewWidth(rect.width);
    };
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const uploadedCount = useMemo(
    () => slots.filter((slot) => Boolean(savedTemplatesMap[slot.templateKey]?.templateUrl)).length,
    [slots, savedTemplatesMap]
  );

  const previewParticipant = useMemo(() => {
    if (previewParticipantId === 'sample') return FALLBACK_PREVIEW_PARTICIPANT;
    return (
      participants.find((p) => p.id === previewParticipantId) || FALLBACK_PREVIEW_PARTICIPANT
    );
  }, [previewParticipantId, participants]);

  const effectivePreviewTemplate: CertificateTemplate = useMemo(
    () => ({
      templateKey: activeSlot?.templateKey || 'symposium',
      templateLabel: activeSlot?.templateLabel || 'Sertifikat Symposium',
      category: activeSlot?.category || 'symposium',
      templateUrl: activeSavedTemplate?.templateUrl || '',
      layout: draftLayout,
      certificateNumberPrefix: draftPrefix,
    }),
    [activeSlot, activeSavedTemplate?.templateUrl, draftLayout, draftPrefix]
  );

  const previewTexts = useMemo(
    () => buildCertificateFieldTexts(previewParticipant, effectivePreviewTemplate, eventInfo),
    [previewParticipant, effectivePreviewTemplate, eventInfo]
  );

  const scaleRatio = previewWidth / CERTIFICATE_CANVAS_W;

  const commitTemplatesMap = (
    nextMap: Record<string, CertificateTemplate>,
    toastMessage: string
  ) => {
    const updatedInfo: SymposiumInfo = {
      ...eventInfo,
      certificateTemplates: nextMap,
    };
    onSaveEventInfo(updatedInfo);
    onShowToast(toastMessage);
  };

  const handleUploadTemplateFile = async (
    slotKey: string,
    slotLabel: string,
    category: 'symposium' | 'workshop',
    defaultPrefix: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    const isValid =
      file.type.startsWith('image/') ||
      file.type === 'application/pdf' ||
      lowerName.endsWith('.pdf');
    if (!isValid) {
      onShowToast('Format tidak didukung. Unggah gambar PNG, JPG, WebP, atau file PDF 1 halaman.');
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      onShowToast('Ukuran file terlalu besar (maksimal 12 MB).');
      return;
    }

    setUploadingSlotKey(slotKey);
    try {
      const compressedDataUrl = await compressCertificateTemplateFile(file);
      const existing = savedTemplatesMap[slotKey];
      const nextTemplate: CertificateTemplate = {
        templateKey: slotKey,
        templateLabel: slotLabel,
        category,
        templateUrl: compressedDataUrl,
        layout: normalizeCertificateLayout(existing?.layout || DEFAULT_CERTIFICATE_LAYOUT),
        certificateNumberPrefix: existing?.certificateNumberPrefix ?? defaultPrefix,
      };
      const nextMap: Record<string, CertificateTemplate> = {
        ...savedTemplatesMap,
        [slotKey]: nextTemplate,
      };
      commitTemplatesMap(
        nextMap,
        `Template desain "${slotLabel}" berhasil diunggah & disimpan!`
      );
      setActiveSlotKey(slotKey);
      setDraftLayout(nextTemplate.layout!);
      setDraftPrefix(nextTemplate.certificateNumberPrefix || defaultPrefix);
      setHasUnsavedLayout(false);
    } catch (err) {
      console.error('Upload certificate template error:', err);
      onShowToast(
        err instanceof Error
          ? err.message
          : 'Gagal memproses file desain sertifikat. Pastikan file tidak rusak.'
      );
    } finally {
      setUploadingSlotKey(null);
    }
  };

  const handleDeleteTemplate = (slotKey: string, slotLabel: string) => {
    const nextMap = { ...savedTemplatesMap };
    delete nextMap[slotKey];
    commitTemplatesMap(nextMap, `Desain sertifikat "${slotLabel}" telah dihapus.`);
    if (activeSlotKey === slotKey) {
      setHasUnsavedLayout(false);
    }
  };

  const updateFieldConfig = (field: FieldKey, patch: Partial<CertificateFieldConfig>) => {
    setDraftLayout((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        ...patch,
      },
    }));
    setHasUnsavedLayout(true);
  };

  const handleApplyPreset = (presetLayout: CertificateLayoutConfig, presetLabel: string) => {
    setDraftLayout(normalizeCertificateLayout(presetLayout));
    setHasUnsavedLayout(true);
    onShowToast(`Preset tata letak "${presetLabel}" diterapkan. Klik Simpan untuk menyimpan.`);
  };

  const handleSaveLayout = () => {
    if (!activeSlot) return;
    if (!activeSavedTemplate?.templateUrl) {
      onShowToast('Unggah terlebih dahulu gambar/PDF desain sertifikat untuk slot ini.');
      return;
    }
    const nextMap: Record<string, CertificateTemplate> = {
      ...savedTemplatesMap,
      [activeSlot.templateKey]: {
        ...activeSavedTemplate,
        templateKey: activeSlot.templateKey,
        templateLabel: activeSlot.templateLabel,
        category: activeSlot.category,
        layout: normalizeCertificateLayout(draftLayout),
        certificateNumberPrefix: draftPrefix.trim(),
      },
    };
    commitTemplatesMap(
      nextMap,
      `Tata letak & nomor sertifikat "${activeSlot.shortLabel}" berhasil disimpan!`
    );
    setHasUnsavedLayout(false);
  };

  // Drag-and-drop handlers on the A4 landscape preview canvas
  const updateFieldFromPointer = (field: FieldKey, clientX: number, clientY: number) => {
    const container = previewContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    let xPct = ((clientX - rect.left) / rect.width) * 100;
    let yPct = ((clientY - rect.top) / rect.height) * 100;

    xPct = Math.max(2, Math.min(98, xPct));
    yPct = Math.max(3, Math.min(97, yPct));

    if (Math.abs(xPct - 50) <= 1.4) {
      xPct = 50;
      setIsSnappedCenter(true);
    } else {
      setIsSnappedCenter(false);
    }

    updateFieldConfig(field, {
      x: Math.round(xPct * 10) / 10,
      y: Math.round(yPct * 10) / 10,
    });
  };

  const handleFieldPointerDown = (
    field: FieldKey,
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedField(field);
    setDraggingField(field);
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFieldFromPointer(field, e.clientX, e.clientY);
  };

  const handleFieldPointerMove = (
    field: FieldKey,
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    if (draggingField !== field) return;
    updateFieldFromPointer(field, e.clientX, e.clientY);
  };

  const handleFieldPointerUp = (
    field: FieldKey,
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    if (draggingField !== field) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    setDraggingField(null);
    setIsSnappedCenter(false);
  };

  const handleTestDownload = async (format: 'png' | 'pdf') => {
    if (!activeSavedTemplate?.templateUrl) {
      onShowToast('Unggah desain sertifikat terlebih dahulu untuk uji unduh.');
      return;
    }
    setDownloadingType(format);
    try {
      if (format === 'png') {
        await downloadCertificateAsPng(previewParticipant, effectivePreviewTemplate, eventInfo);
        onShowToast('File uji sertifikat PNG (HD) berhasil diunduh.');
      } else {
        await downloadCertificateAsPdf(previewParticipant, effectivePreviewTemplate, eventInfo);
        onShowToast('File uji sertifikat PDF (A4 Landscape) berhasil diunduh.');
      }
    } catch (err) {
      console.error('Certificate test download error:', err);
      onShowToast('Gagal membuat file sertifikat. Silakan coba lagi.');
    } finally {
      setDownloadingType(null);
    }
  };

  const currentFieldCfg = draftLayout[selectedField];

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 flex items-center justify-center text-slate-950 shadow-lg shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-white">
                Desain Template E-Sertifikat
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {uploadedCount} / {slots.length} Template Terpasang
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Unggah desain background sertifikat untuk <strong className="text-slate-200">Symposium</strong> dan masing-masing <strong className="text-slate-200">2 Workshop</strong> (PNG, JPG, WebP, atau PDF 1 halaman ukuran A4 Landscape). Atur posisi nama &amp; nomor sertifikat agar peserta dapat langsung mengunduh E-Sertifikat mereka.
            </p>
          </div>
        </div>

        {/* Cloud sync indicator */}
        <div className="flex items-center gap-2.5 self-start lg:self-auto">
          {isCloudAdmin ? (
            <div className="px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
              <Cloud className="w-4 h-4 shrink-0" />
              <span>Sinkron Cloud Aktif</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={onCloudAdminSignIn}
              className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 text-amber-200 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Cloud className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Login Google Admin agar Terbaca Semua Peserta</span>
            </button>
          )}
        </div>
      </div>

      {/* Template Upload Cards Grid (Symposium + Workshop 1 + Workshop 2) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {slots.map((slot) => {
          const saved = savedTemplatesMap[slot.templateKey];
          const isUploaded = Boolean(saved?.templateUrl);
          const isActive = activeSlot?.templateKey === slot.templateKey;
          const isUploading = uploadingSlotKey === slot.templateKey;
          const isSymposium = slot.category === 'symposium';

          return (
            <div
              key={slot.templateKey}
              className={`bg-slate-900 rounded-2xl border p-4 flex flex-col justify-between gap-3.5 transition-all ${
                isActive
                  ? 'border-amber-400/70 ring-1 ring-amber-400/30 shadow-lg shadow-amber-950/20'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Card Top Meta */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                      isSymposium
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                    }`}
                  >
                    {slot.badgeLabel}
                  </span>
                  {isUploaded ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Terpasang
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-500">
                      Belum Diunggah
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-black text-white leading-snug line-clamp-2">
                    {slot.templateLabel}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">{slot.subtitle}</p>
                </div>

                {/* Landscape Preview Thumbnail */}
                <div
                  onClick={() => {
                    setActiveSlotKey(slot.templateKey);
                    editorSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="relative w-full aspect-[1600/1131] rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center cursor-pointer group"
                >
                  {isUploaded && saved?.templateUrl ? (
                    <>
                      <img
                        src={saved.templateUrl}
                        alt={slot.templateLabel}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/40 transition-colors flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 rounded-lg bg-slate-950/90 text-white text-[11px] font-bold border border-slate-700">
                          Klik untuk Atur Tata Letak
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center px-4 py-5 space-y-1.5">
                      <FileImage className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="text-xs font-bold text-slate-400">
                        Belum ada desain sertifikat
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Rekomendasi: A4 Landscape (1600 × 1131 px) · PNG / JPG / WebP / PDF
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <label
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isUploaded
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm font-black'
                  } ${isUploading ? 'opacity-60 pointer-events-none' : ''}`}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploaded ? 'Ganti Desain' : 'Unggah Desain'}</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*,.pdf,application/pdf"
                    className="hidden"
                    disabled={isUploading}
                    onChange={(e) =>
                      handleUploadTemplateFile(
                        slot.templateKey,
                        slot.templateLabel,
                        slot.category,
                        slot.defaultPrefix,
                        e
                      )
                    }
                  />
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setActiveSlotKey(slot.templateKey);
                    editorSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                  title="Atur posisi nama & teks"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Atur</span>
                </button>

                {isUploaded && (
                  <button
                    type="button"
                    onClick={() => handleDeleteTemplate(slot.templateKey, slot.templateLabel)}
                    className="p-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-colors cursor-pointer"
                    title="Hapus template desain"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Landscape Layout Editor & Preview */}
      {activeSlot && (
        <div
          ref={editorSectionRef}
          className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-5 shadow-xl"
        >
          {/* Editor Header + Slot Switcher */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <Move className="w-4 h-4 text-amber-400" />
                Editor Tata Letak Teks: {activeSlot.shortLabel}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Seret langsung teks pada pratinjau sertifikat atau gunakan panel kontrol di kanan untuk mengatur posisi, ukuran, font, dan warna.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {slots.map((slot) => {
                const selected = slot.templateKey === activeSlot.templateKey;
                const uploaded = Boolean(savedTemplatesMap[slot.templateKey]?.templateUrl);
                return (
                  <button
                    key={slot.templateKey}
                    type="button"
                    onClick={() => setActiveSlotKey(slot.templateKey)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      selected
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <span>{slot.shortLabel}</span>
                    {uploaded && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          selected ? 'bg-slate-950' : 'bg-emerald-400'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            {/* Left: Interactive 1600x1131 A4 Landscape Canvas */}
            <div className="xl:col-span-8 space-y-3">
              <div
                ref={previewContainerRef}
                className="relative w-full aspect-[1600/1131] rounded-2xl overflow-hidden bg-white border-2 border-slate-700 shadow-2xl select-none touch-none"
              >
                {/* Background image or clean formal placeholder */}
                {activeSavedTemplate?.templateUrl ? (
                  <img
                    src={activeSavedTemplate.templateUrl}
                    alt={activeSlot.templateLabel}
                    draggable={false}
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-amber-50/40 pointer-events-none">
                    <div className="absolute inset-4 border-4 border-slate-300 rounded-lg" />
                    <div className="absolute inset-6 border border-teal-700/40 rounded-md" />
                    <div className="absolute top-[14%] inset-x-0 text-center">
                      <p className="text-[10px] sm:text-xs font-bold tracking-[0.28em] text-teal-800/70 uppercase">
                        Pratinjau Frame — Unggah Desain Anda di Kartu Atas
                      </p>
                      <p className="text-base sm:text-2xl font-serif font-bold text-slate-800/60 mt-1">
                        SERTIFIKAT PENGHARGAAN
                      </p>
                    </div>
                  </div>
                )}

                {/* Center snap vertical guide */}
                {draggingField && (
                  <div
                    className={`absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px pointer-events-none transition-colors ${
                      isSnappedCenter ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.9)]' : 'bg-slate-400/50 border-l border-dashed border-slate-500/60'
                    }`}
                  />
                )}

                {/* Draggable Fields */}
                {FIELD_METADATA.map(({ key, shortLabel }) => {
                  const cfg = draftLayout[key];
                  const text = previewTexts[key];
                  if (!cfg.visible || !text) return null;

                  const isSelected = selectedField === key;
                  const isDragging = draggingField === key;
                  const scaledPx = Math.max(8, cfg.fontSize * scaleRatio);
                  const translateX =
                    cfg.align === 'left' ? '0%' : cfg.align === 'right' ? '-100%' : '-50%';

                  return (
                    <div
                      key={key}
                      onPointerDown={(e) => handleFieldPointerDown(key, e)}
                      onPointerMove={(e) => handleFieldPointerMove(key, e)}
                      onPointerUp={(e) => handleFieldPointerUp(key, e)}
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
                      className={`absolute whitespace-nowrap px-1.5 py-0.5 rounded cursor-grab active:cursor-grabbing transition-shadow ${
                        isSelected
                          ? 'ring-2 ring-amber-400 bg-amber-400/10 shadow-md'
                          : 'hover:ring-1 hover:ring-sky-400/80'
                      } ${isDragging ? 'z-30' : 'z-10'}`}
                      title={`Seret untuk memindahkan ${shortLabel}`}
                    >
                      {text}
                      {isSelected && (
                        <span className="absolute -top-5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-slate-950/90 text-amber-300 text-[9px] font-sans font-bold tracking-normal whitespace-nowrap pointer-events-none border border-amber-400/40">
                          {shortLabel} ({cfg.x}%, {cfg.y}%)
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Participant Test Preview & Download Bar */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <User className="w-4 h-4 text-sky-400 shrink-0" />
                  <select
                    value={previewParticipantId}
                    onChange={(e) => setPreviewParticipantId(e.target.value)}
                    className="flex-1 min-w-0 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="sample">
                      Contoh Peserta: {FALLBACK_PREVIEW_PARTICIPANT.name}
                    </option>
                    {participants.slice(0, 150).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.ticketType || p.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={Boolean(downloadingType) || !activeSavedTemplate?.templateUrl}
                    onClick={() => handleTestDownload('png')}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 flex items-center gap-1.5 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {downloadingType === 'png' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    <span>Uji Unduh PNG</span>
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(downloadingType) || !activeSavedTemplate?.templateUrl}
                    onClick={() => handleTestDownload('pdf')}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {downloadingType === 'pdf' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FileText className="w-3.5 h-3.5" />
                    )}
                    <span>Uji Unduh PDF A4</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Inspector & Controls */}
            <div className="xl:col-span-4 space-y-4 bg-slate-950 border border-slate-800 rounded-2xl p-4">
              {/* Quick Presets */}
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Preset Tata Letak Cepat
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {CERTIFICATE_LAYOUT_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyPreset(preset.layout, preset.label)}
                      className="px-2 py-2 rounded-xl text-[11px] font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-amber-400/50 transition-colors cursor-pointer text-center"
                      title={preset.description}
                    >
                      {preset.label.split(' ')[0]} {preset.label.split(' ')[1] || ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Field Selector List */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  Elemen Teks Sertifikat
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {FIELD_METADATA.map(({ key, shortLabel }) => {
                    const cfg = draftLayout[key];
                    const isSelected = selectedField === key;
                    return (
                      <div
                        key={key}
                        className={`flex items-center justify-between gap-1 px-2.5 py-2 rounded-xl border text-xs font-bold transition-colors ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-400/60 text-amber-200'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedField(key)}
                          className="flex-1 text-left truncate cursor-pointer"
                        >
                          {shortLabel}
                        </button>
                        <button
                          type="button"
                          onClick={() => updateFieldConfig(key, { visible: !cfg.visible })}
                          className={`p-1 rounded-md transition-colors cursor-pointer ${
                            cfg.visible
                              ? 'text-emerald-400 hover:bg-emerald-500/15'
                              : 'text-slate-600 hover:bg-slate-800'
                          }`}
                          title={cfg.visible ? 'Sembunyikan teks' : 'Tampilkan teks'}
                        >
                          {cfg.visible ? (
                            <Eye className="w-3.5 h-3.5" />
                          ) : (
                            <EyeOff className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Active Field Inspector */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white">
                    {FIELD_METADATA.find((f) => f.key === selectedField)?.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateFieldConfig(selectedField, { x: 50, align: 'center' })}
                    className="text-[10px] font-bold text-amber-300 hover:text-amber-200 underline cursor-pointer"
                  >
                    Tengahkan (50%)
                  </button>
                </div>

                {/* X & Y Sliders */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Posisi X</span>
                      <span className="font-mono text-slate-200">{currentFieldCfg.x}%</span>
                    </div>
                    <input
                      type="range"
                      min={2}
                      max={98}
                      step={0.5}
                      value={currentFieldCfg.x}
                      onChange={(e) =>
                        updateFieldConfig(selectedField, { x: Number(e.target.value) })
                      }
                      className="w-full accent-amber-400"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Posisi Y</span>
                      <span className="font-mono text-slate-200">{currentFieldCfg.y}%</span>
                    </div>
                    <input
                      type="range"
                      min={3}
                      max={97}
                      step={0.5}
                      value={currentFieldCfg.y}
                      onChange={(e) =>
                        updateFieldConfig(selectedField, { y: Number(e.target.value) })
                      }
                      className="w-full accent-amber-400"
                    />
                  </div>
                </div>

                {/* Font Size Slider */}
                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>Ukuran Huruf</span>
                    <span className="font-mono text-slate-200">{currentFieldCfg.fontSize} px</span>
                  </div>
                  <input
                    type="range"
                    min={14}
                    max={110}
                    step={1}
                    value={currentFieldCfg.fontSize}
                    onChange={(e) =>
                      updateFieldConfig(selectedField, { fontSize: Number(e.target.value) })
                    }
                    className="w-full accent-amber-400"
                  />
                </div>

                {/* Font Family, Weight & Align */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex rounded-xl overflow-hidden border border-slate-800">
                    <button
                      type="button"
                      onClick={() => updateFieldConfig(selectedField, { fontFamily: 'serif' })}
                      className={`flex-1 py-1.5 text-[11px] font-serif font-bold cursor-pointer ${
                        currentFieldCfg.fontFamily === 'serif'
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-900 text-slate-300'
                      }`}
                    >
                      Serif
                    </button>
                    <button
                      type="button"
                      onClick={() => updateFieldConfig(selectedField, { fontFamily: 'sans' })}
                      className={`flex-1 py-1.5 text-[11px] font-sans font-bold cursor-pointer ${
                        currentFieldCfg.fontFamily === 'sans'
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-900 text-slate-300'
                      }`}
                    >
                      Sans
                    </button>
                  </div>

                  <div className="flex rounded-xl overflow-hidden border border-slate-800">
                    <button
                      type="button"
                      onClick={() => updateFieldConfig(selectedField, { fontWeight: 'bold' })}
                      className={`flex-1 py-1.5 text-[11px] font-black cursor-pointer ${
                        currentFieldCfg.fontWeight === 'bold'
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-900 text-slate-300'
                      }`}
                    >
                      Bold
                    </button>
                    <button
                      type="button"
                      onClick={() => updateFieldConfig(selectedField, { fontWeight: 'normal' })}
                      className={`flex-1 py-1.5 text-[11px] font-normal cursor-pointer ${
                        currentFieldCfg.fontWeight === 'normal'
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-900 text-slate-300'
                      }`}
                    >
                      Reg
                    </button>
                  </div>

                  <div className="flex rounded-xl overflow-hidden border border-slate-800">
                    {(['left', 'center', 'right'] as const).map((align) => (
                      <button
                        key={align}
                        type="button"
                        onClick={() => updateFieldConfig(selectedField, { align })}
                        className={`flex-1 py-1.5 flex items-center justify-center cursor-pointer ${
                          currentFieldCfg.align === align
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-900 text-slate-300'
                        }`}
                      >
                        {align === 'left' && <AlignLeft className="w-3.5 h-3.5" />}
                        {align === 'center' && <AlignCenter className="w-3.5 h-3.5" />}
                        {align === 'right' && <AlignRight className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Picker */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Palette className="w-3 h-3" /> Warna Teks
                    </span>
                    <span className="font-mono text-slate-300">{currentFieldCfg.color}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {COLOR_SWATCHES.map((swatch) => (
                      <button
                        key={swatch}
                        type="button"
                        onClick={() => updateFieldConfig(selectedField, { color: swatch })}
                        style={{ backgroundColor: swatch }}
                        className={`w-6 h-6 rounded-lg border cursor-pointer transition-transform ${
                          currentFieldCfg.color.toLowerCase() === swatch.toLowerCase()
                            ? 'border-amber-400 scale-110 ring-2 ring-amber-400/50'
                            : 'border-slate-600'
                        }`}
                        title={swatch}
                      />
                    ))}
                    <input
                      type="color"
                      value={currentFieldCfg.color}
                      onChange={(e) =>
                        updateFieldConfig(selectedField, { color: e.target.value })
                      }
                      className="w-7 h-6 rounded border border-slate-700 bg-slate-900 cursor-pointer"
                      title="Pilih warna kustom"
                    />
                  </div>
                </div>
              </div>

              {/* Certificate Number Prefix */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  Prefix Nomor Sertifikat
                </label>
                <input
                  type="text"
                  maxLength={60}
                  value={draftPrefix}
                  onChange={(e) => {
                    setDraftPrefix(e.target.value);
                    setHasUnsavedLayout(true);
                  }}
                  placeholder={activeSlot.defaultPrefix}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                />
                <p className="text-[10px] text-slate-500">
                  Hasil: <span className="text-slate-300 font-mono">{previewTexts.certificateNumber}</span>
                </p>
              </div>

              {/* Save / Reset Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setDraftLayout(DEFAULT_CERTIFICATE_LAYOUT);
                    setDraftPrefix(activeSlot.defaultPrefix);
                    setHasUnsavedLayout(true);
                  }}
                  className="px-3 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                  title="Kembalikan posisi default"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveLayout}
                  disabled={!activeSavedTemplate?.templateUrl}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 ${
                    hasUnsavedLayout
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-950/40'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{hasUnsavedLayout ? 'Simpan Perubahan' : 'Simpan Tata Letak'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
