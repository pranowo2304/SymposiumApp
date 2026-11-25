import React, { useRef, useState } from 'react';
import {
  FileText,
  Upload,
  Trash2,
  Link as LinkIcon,
  Plus,
  Loader2,
  Cloud,
  HardDrive,
  AlertCircle,
  User,
} from 'lucide-react';
import { PresentationMaterial, Speaker } from '../../types';
import {
  deletePdfMaterialLocal,
  formatPdfFileSize,
  generateMaterialId,
  readPdfFileAsBase64,
  savePdfMaterialLocal,
  splitBase64IntoChunks,
} from '../../utils/presentationPdfStorage';
import {
  deletePdfMaterialFromFirestore,
  uploadPdfMaterialToFirestore,
} from '../../services/firestoreSyncService';

interface AdminPresentationMaterialsEditorProps {
  sessionId: string;
  speakers?: Speaker[];
  materials: PresentationMaterial[];
  isCloudAdmin?: boolean;
  onMaterialsChange: (updated: PresentationMaterial[]) => void;
  onNotify?: (msg: string) => void;
}

export const AdminPresentationMaterialsEditor: React.FC<
  AdminPresentationMaterialsEditorProps
> = ({
  sessionId,
  speakers = [],
  materials,
  isCloudAdmin = false,
  onMaterialsChange,
  onNotify,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [materialTitle, setMaterialTitle] = useState<string>('');
  const [speakerName, setSpeakerName] = useState<string>('');
  const [externalUrl, setExternalUrl] = useState<string>('');
  const [inputMode, setInputMode] = useState<'file' | 'url'>('file');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);
    setIsUploading(true);

    try {
      const { base64Data, fileName, fileSize, mimeType } =
        await readPdfFileAsBase64(file);

      const matId = generateMaterialId();
      const cleanTitle =
        materialTitle.trim() ||
        fileName.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ').trim() ||
        'Materi Presentasi';

      const chunks = splitBase64IntoChunks(base64Data);

      await savePdfMaterialLocal({
        id: matId,
        base64Data,
        fileName,
        fileSize,
        mimeType,
        savedAt: new Date().toISOString(),
      });

      let material: PresentationMaterial = {
        id: matId,
        title: cleanTitle,
        fileName,
        fileSize,
        mimeType,
        chunkCount: chunks.length,
        speakerName: speakerName.trim() || undefined,
        uploadedAt: new Date().toISOString(),
      };

      if (isCloudAdmin) {
        material = await uploadPdfMaterialToFirestore(
          sessionId,
          material,
          base64Data
        );
      }

      const nextList = [...materials, material];
      onMaterialsChange(nextList);
      setMaterialTitle('');
      onNotify?.(
        isCloudAdmin
          ? `PDF "${material.title}" berhasil diunggah & disinkronkan ke Cloud!`
          : `PDF "${material.title}" berhasil disimpan untuk sesi ini.`
      );
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal mengunggah file PDF.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleAddExternalUrl = () => {
    setErrorMsg(null);
    const url = externalUrl.trim();
    if (!url || (!url.startsWith('https://') && !url.startsWith('http://'))) {
      setErrorMsg('Masukkan URL PDF yang valid (diawali https:// atau http://).');
      return;
    }

    const title = materialTitle.trim() || 'Materi Presentasi (Tautan PDF)';
    const newMat: PresentationMaterial = {
      id: generateMaterialId(),
      title,
      fileName: `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'materi'}.pdf`,
      fileSize: 0,
      mimeType: 'application/pdf',
      chunkCount: 0,
      externalUrl: url,
      speakerName: speakerName.trim() || undefined,
      uploadedAt: new Date().toISOString(),
    };

    onMaterialsChange([...materials, newMat]);
    setMaterialTitle('');
    setExternalUrl('');
    onNotify?.(`Tautan PDF "${newMat.title}" berhasil ditambahkan.`);
  };

  const handleRemoveMaterial = async (mat: PresentationMaterial) => {
    setDeletingId(mat.id);
    setErrorMsg(null);
    try {
      await deletePdfMaterialLocal(mat.id);
      if (isCloudAdmin && mat.chunkCount > 0) {
        await deletePdfMaterialFromFirestore(mat.id);
      }
      const nextList = materials.filter((m) => m.id !== mat.id);
      onMaterialsChange(nextList);
      onNotify?.(`Materi "${mat.title}" dihapus.`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal menghapus materi.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-4 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <span className="text-[11px] font-black text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            Materi Presentasi (File PDF)
          </span>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Unggah slide atau handout dalam format <strong className="text-slate-200">.pdf</strong> (maks. 10 MB per file) agar peserta dapat membaca &amp; mengunduhnya di tab <strong className="text-indigo-300">Materi Presentasi</strong>.
          </p>
        </div>

        <div className="inline-flex bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto shrink-0 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => {
              setInputMode('file');
              setErrorMsg(null);
            }}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer ${
              inputMode === 'file'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-3 h-3" />
            <span>Upload PDF</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setInputMode('url');
              setErrorMsg(null);
            }}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer ${
              inputMode === 'url'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LinkIcon className="w-3 h-3" />
            <span>Link URL PDF</span>
          </button>
        </div>
      </div>

      {/* Metadata inputs (Title + Speaker attribution) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-300 block">
            Judul Materi Presentasi (Opsional):
          </label>
          <input
            type="text"
            value={materialTitle}
            onChange={(e) => setMaterialTitle(e.target.value)}
            placeholder="Otomatis dari nama file jika dikosongkan"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-300 block">
            Pembicara / Narasumber (Opsional):
          </label>
          {speakers.length > 0 ? (
            <select
              value={speakerName}
              onChange={(e) => setSpeakerName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">-- Umum / Semua Pembicara Sesi --</option>
              {speakers.map((sp) => (
                <option key={sp.id} value={sp.name}>
                  {sp.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={speakerName}
              onChange={(e) => setSpeakerName(e.target.value)}
              placeholder="Nama narasumber (opsional)"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          )}
        </div>
      </div>

      {/* Input Area: File PDF Upload OR External URL */}
      {inputMode === 'file' ? (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleFileSelected}
            className="hidden"
            disabled={isUploading}
          />
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-indigo-500/40 hover:border-indigo-400 bg-slate-950/70 hover:bg-indigo-950/30 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 text-center transition-all cursor-pointer disabled:opacity-60"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                <span className="text-xs font-black text-indigo-300">
                  {isCloudAdmin
                    ? 'Mengunggah PDF & Menyinkronkan ke Cloud...'
                    : 'Menyimpan File PDF...'}
                </span>
              </>
            ) : (
              <>
                <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-300">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-xs font-black text-white">
                  Klik untuk Pilih &amp; Upload File PDF
                </span>
                <span className="text-[11px] text-slate-400">
                  Format: .pdf • Maksimal 10 MB per file
                </span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="url"
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
            placeholder="https://drive.google.com/file/d/... atau tautan langsung .pdf"
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
          <button
            type="button"
            onClick={handleAddExternalUrl}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Link PDF</span>
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Uploaded Materials List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          <span>Daftar Materi Presentasi ({materials.length})</span>
          {materials.length > 0 && (
            <span className="text-emerald-400 normal-case font-semibold">
              Tampil di tab &quot;Materi Presentasi&quot; peserta
            </span>
          )}
        </div>

        {materials.length === 0 ? (
          <div className="text-center py-4 px-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-500">
            Belum ada file materi PDF yang diunggah untuk sesi ini.
          </div>
        ) : (
          <div className="space-y-2">
            {materials.map((mat) => (
              <div
                key={mat.id}
                className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="p-2 rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/20 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">
                      {mat.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                      <span className="truncate max-w-[180px]">{mat.fileName}</span>
                      <span>•</span>
                      <span className="text-slate-300 font-semibold">
                        {mat.externalUrl ? 'Link Eksternal' : formatPdfFileSize(mat.fileSize)}
                      </span>
                      {mat.speakerName && (
                        <>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 text-sky-300">
                            <User className="w-3 h-3" />
                            {mat.speakerName}
                          </span>
                        </>
                      )}
                      {mat.chunkCount > 0 && (
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            isCloudAdmin
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {isCloudAdmin ? (
                            <Cloud className="w-2.5 h-2.5" />
                          ) : (
                            <HardDrive className="w-2.5 h-2.5" />
                          )}
                          {isCloudAdmin ? 'Cloud Ready' : 'Lokal'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={deletingId === mat.id}
                  onClick={() => handleRemoveMaterial(mat)}
                  className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                  title="Hapus materi PDF"
                >
                  {deletingId === mat.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
