import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  FileCode, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  ArrowRight,
  FileText,
  RefreshCw,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { Session, Speaker, Room, SymposiumInfo } from '../../types';
import { 
  exportSessionsToCSV, 
  exportSessionsToJSON, 
  generateSessionsCSVTemplate, 
  importSessionsFromCSV, 
  importSessionsFromJSON, 
  importSessionsFromScheduleText,
  downloadFile,
  SessionImportResult
} from '../../utils/sessionDataExportImport';
import { extractScheduleFromPdf } from '../../services/aiScheduleService';
import { 
  MUNAS_SESSIONS, 
  MUNAS_SPEAKERS, 
  MUNAS_ROOMS, 
  MUNAS_ADHPHKI_EVENT_INFO 
} from '../../data/munasAdhphkiData';

interface SessionImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: Session[];
  onSaveSessions: (sessions: Session[]) => void;
  speakers: Speaker[];
  rooms: Room[];
  onSaveSpeakers?: (speakers: Speaker[]) => void;
  onSaveRooms?: (rooms: Room[]) => void;
  onSaveEventInfo?: (info: SymposiumInfo) => void;
  initialMode?: 'export' | 'import';
  initialFilter?: 'all' | 'symposium' | 'workshop';
  onShowToast: (msg: string) => void;
}

export const SessionImportExportModal: React.FC<SessionImportExportModalProps> = ({
  isOpen,
  onClose,
  sessions,
  onSaveSessions,
  speakers,
  rooms,
  onSaveSpeakers,
  onSaveRooms,
  onSaveEventInfo,
  initialMode = 'export',
  initialFilter = 'all',
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>(initialMode);
  const [exportFilter, setExportFilter] = useState<'all' | 'symposium' | 'workshop'>(initialFilter);
  
  // Import states
  const [importMode, setImportMode] = useState<'append' | 'replace' | 'upsert'>('replace');
  const [importText, setImportText] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [fileType, setFileType] = useState<'csv' | 'json' | 'pdf_text' | null>(null);
  const [previewResult, setPreviewResult] = useState<SessionImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isMunasPresetActive, setIsMunasPresetActive] = useState<boolean>(false);
  const [syncEventAndRooms, setSyncEventAndRooms] = useState<boolean>(true);

  if (!isOpen) return null;

  // Filter sessions for export
  const getFilteredSessions = () => {
    if (exportFilter === 'symposium') {
      return sessions.filter(s => s.type !== 'Workshop Hands-On' && !s.category.includes('Workshop'));
    }
    if (exportFilter === 'workshop') {
      return sessions.filter(s => s.type === 'Workshop Hands-On' || s.category.includes('Workshop'));
    }
    return sessions;
  };

  const currentExportSessions = getFilteredSessions();

  // Handle Export CSV
  const handleExportCSV = () => {
    const csvContent = exportSessionsToCSV(currentExportSessions);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `jadwal_${exportFilter}_simposium_${dateStr}.csv`;
    downloadFile(filename, csvContent, 'text/csv;charset=utf-8;');
    onShowToast(`Berhasil mengunduh ${currentExportSessions.length} sesi ke file CSV!`);
  };

  // Handle Export JSON
  const handleExportJSON = () => {
    const jsonContent = exportSessionsToJSON(currentExportSessions);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `jadwal_${exportFilter}_simposium_${dateStr}.json`;
    downloadFile(filename, jsonContent, 'application/json;charset=utf-8;');
    onShowToast(`Berhasil mengunduh ${currentExportSessions.length} sesi ke file JSON!`);
  };

  // Handle Download CSV Template
  const handleDownloadTemplate = () => {
    const templateContent = generateSessionsCSVTemplate();
    downloadFile('template_jadwal_simposium_workshop.csv', templateContent, 'text/csv;charset=utf-8;');
    onShowToast('Template format CSV berhasil diunduh. Anda dapat membukanya di Excel.');
  };

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setIsMunasPresetActive(false);

    if (file.name.endsWith('.pdf')) {
      setFileType('pdf_text');
      setIsProcessing(true);
      extractScheduleFromPdf(file)
        .then((res) => {
          if (res.success && res.data) {
            setPreviewResult({
              importedSessions: res.data.sessions,
              errors: [],
              parsedCount: res.data.sessions.length
            });
            onShowToast(`AI Gemini berhasil mengekstrak ${res.data.sessions.length} sesi dari PDF ${file.name}!`);
          } else {
            setPreviewResult({
              importedSessions: [],
              errors: [res.error || 'Gagal mengekstrak jadwal dari PDF dengan AI.'],
              parsedCount: 0
            });
          }
        })
        .catch((err) => {
          setPreviewResult({
            importedSessions: [],
            errors: [err.message || 'Gagal memproses file PDF.'],
            parsedCount: 0
          });
        })
        .finally(() => {
          setIsProcessing(false);
        });
      e.target.value = '';
      return;
    }

    const isJson = file.name.endsWith('.json');
    const isTxt = file.name.endsWith('.txt');
    const type = isJson ? 'json' : isTxt ? 'pdf_text' : 'csv';
    setFileType(type);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportText(content);
      processPreview(content, type);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Load Extracted PDF MUNAS 5 ADHPHKI Preset
  const handleLoadMunasPdfPreset = () => {
    setIsMunasPresetActive(true);
    setUploadedFileName('Time Table Day 1.pdf (MUNAS 5 ADHPHKI & KIVNAHK 4)');
    setFileType('pdf_text');
    setImportText('');
    setPreviewResult({
      importedSessions: MUNAS_SESSIONS,
      errors: [],
      parsedCount: MUNAS_SESSIONS.length
    });
    onShowToast('Berhasil memuat 12 sesi jadwal hasil ekstraksi Time Table Day 1.pdf!');
  };

  // Process and preview import data
  const processPreview = (content: string, type: 'csv' | 'json' | 'pdf_text') => {
    if (!content.trim()) {
      setPreviewResult(null);
      return;
    }

    setIsProcessing(true);
    try {
      if (type === 'json') {
        const res = importSessionsFromJSON(content);
        setPreviewResult(res);
      } else if (type === 'pdf_text') {
        const res = importSessionsFromScheduleText(content, speakers, rooms);
        setPreviewResult(res);
      } else {
        const res = importSessionsFromCSV(content, speakers, rooms);
        setPreviewResult(res);
      }
    } catch (err: any) {
      setPreviewResult({
        importedSessions: [],
        errors: [`Gagal memproses file: ${err.message}`],
        parsedCount: 0
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Trigger manual preview if user typed or pasted in textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setImportText(val);
    setIsMunasPresetActive(false);
    if (!val.trim()) {
      setPreviewResult(null);
      return;
    }
    let detectedType: 'csv' | 'json' | 'pdf_text' = 'csv';
    if (val.trim().startsWith('{') || val.trim().startsWith('[')) {
      detectedType = 'json';
    } else if (val.includes(',') && (val.toLowerCase().includes('hari') || val.toLowerCase().includes('tanggal'))) {
      detectedType = 'csv';
    } else if (/\d{1,2}[:.]\d{2}/.test(val)) {
      detectedType = 'pdf_text';
    }
    setFileType(detectedType);
    processPreview(val, detectedType);
  };

  // Apply Import to Global Sessions
  const handleApplyImport = () => {
    if (!previewResult || previewResult.importedSessions.length === 0) {
      onShowToast('Tidak ada data sesi valid yang dapat diimpor.');
      return;
    }

    const newSessions = previewResult.importedSessions;
    let finalSessions: Session[] = [];

    if (importMode === 'replace') {
      finalSessions = newSessions;
    } else if (importMode === 'append') {
      // Avoid duplicate IDs
      const existingIds = new Set(sessions.map(s => s.id));
      const adjustedNewSessions = newSessions.map((s, idx) => {
        if (existingIds.has(s.id)) {
          return { ...s, id: `${s.id}-${Date.now()}-${idx}` };
        }
        return s;
      });
      finalSessions = [...sessions, ...adjustedNewSessions];
    } else if (importMode === 'upsert') {
      // Upsert: update matching title/id, append rest
      const existingMap = new Map<string, Session>(sessions.map(s => [s.id, s]));
      const titleMap = new Map<string, string>(sessions.map(s => [s.title.toLowerCase().trim(), s.id]));

      const appended: Session[] = [];
      newSessions.forEach(incoming => {
        const matchedById = existingMap.get(incoming.id);
        const matchedIdByTitle = titleMap.get(incoming.title.toLowerCase().trim());
        const targetId = matchedById ? incoming.id : matchedIdByTitle;

        if (targetId && existingMap.has(targetId)) {
          // Update existing
          existingMap.set(targetId, { ...incoming, id: targetId });
        } else {
          appended.push(incoming);
        }
      });
      finalSessions = [...Array.from(existingMap.values()), ...appended];
    }

    // Save sessions
    onSaveSessions(finalSessions);

    // If syncEventAndRooms is enabled
    if (syncEventAndRooms) {
      if (isMunasPresetActive) {
        if (onSaveRooms) onSaveRooms(MUNAS_ROOMS);
        if (onSaveSpeakers) onSaveSpeakers(Object.values(MUNAS_SPEAKERS));
        if (onSaveEventInfo) onSaveEventInfo(MUNAS_ADHPHKI_EVENT_INFO);
      } else {
        // Automatically sync new rooms from imported sessions
        if (onSaveRooms) {
          const existingRoomNames = new Set(rooms.map(r => r.name.toLowerCase()));
          const newRoomNames: string[] = Array.from(new Set(newSessions.map(s => String(s.room || '')).filter(Boolean)));
          const additionalRooms: Room[] = newRoomNames
            .filter(rName => !existingRoomNames.has(rName.toLowerCase()))
            .map((rName) => ({
              id: rName,
              name: rName,
              shortName: rName.replace('Ballroom ', '').replace('Area ', ''),
              floor: 'Lantai 1',
              capacity: 350,
              description: `Ruangan terdaftar dari sesi impor.`,
              facilities: ['Videotron / Layar Proyektor', 'Audio HD', 'Mic'],
              type: rName.toLowerCase().includes('workshop') ? ('workshop' as const) : ('ballroom' as const),
              color: 'bg-indigo-600',
              badgeBg: 'bg-indigo-600 text-white'
            }));
          if (additionalRooms.length > 0) {
            onSaveRooms([...rooms, ...additionalRooms]);
          }
        }

        // Automatically sync new speakers from imported sessions
        if (onSaveSpeakers) {
          const existingSpeakerNames = new Set(speakers.map(sp => sp.name.toLowerCase()));
          const allNewSpeakers: Speaker[] = [];
          newSessions.forEach(s => {
            (s.speakers || []).forEach(sp => {
              if (sp && sp.name && !existingSpeakerNames.has(sp.name.toLowerCase()) && !allNewSpeakers.some(x => x.name.toLowerCase() === sp.name.toLowerCase())) {
                allNewSpeakers.push(sp);
              }
            });
          });
          if (allNewSpeakers.length > 0) {
            onSaveSpeakers([...speakers, ...allNewSpeakers]);
          }
        }
      }
    }

    onShowToast(`Berhasil mengimpor ${newSessions.length} sesi jadwal (${importMode === 'replace' ? 'Gantikan Semua' : importMode === 'append' ? 'Ditambahkan' : 'Disinkronkan'})!`);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ duration: 0.2 }}
        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  Ekspor & Impor Data Jadwal Sesi
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  CSV & JSON
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Kelola jadwal simposium & workshop secara massal tanpa perlu input satu per satu.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Toggle Navigation */}
        <div className="px-6 pt-4 bg-slate-950/50 border-b border-slate-800 flex gap-2">
          <button
            onClick={() => setActiveTab('export')}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'export'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Unduh / Ekspor Jadwal</span>
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'import'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Unggah / Impor Jadwal</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          
          {/* TAB 1: EXPORT */}
          {activeTab === 'export' && (
            <div className="space-y-5">
              
              {/* Filter selection */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Pilih Cakupan Data Sesi yang Akan Diekspor:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setExportFilter('all')}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                      exportFilter === 'all'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-xs'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <span>Semua Sesi</span>
                    <span className="text-[10px] text-slate-400">({sessions.length} Sesi)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportFilter('symposium')}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                      exportFilter === 'symposium'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-xs'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <Calendar className="w-4 h-4 text-blue-400" />
                    <span>Simposium Ilmiah</span>
                    <span className="text-[10px] text-slate-400">
                      ({sessions.filter(s => s.type !== 'Workshop Hands-On' && !s.category.includes('Workshop')).length} Sesi)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportFilter('workshop')}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                      exportFilter === 'workshop'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-xs'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>Workshop Hands-On</span>
                    <span className="text-[10px] text-slate-400">
                      ({sessions.filter(s => s.type === 'Workshop Hands-On' || s.category.includes('Workshop')).length} Sesi)
                    </span>
                  </button>
                </div>
              </div>

              {/* Download Buttons Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* CSV Button Card */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-emerald-500/50 transition-all group">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-extrabold text-white">
                      Unduh Format CSV (Excel / Spreadsheet)
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Format tabel standar kolom terpisah koma. Cocok untuk dibuka, diedit, atau dicetak menggunakan Microsoft Excel dan Google Sheets.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="mt-4 w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 group-hover:shadow-emerald-900/30"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh CSV ({currentExportSessions.length} Sesi)</span>
                  </button>
                </div>

                {/* JSON Button Card */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-blue-500/50 transition-all group">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                      <FileCode className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-extrabold text-white">
                      Unduh Format JSON Terstruktur
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Format data komprehensif lengkap dengan relasi narasumber, abstrak klinis, dan key takeaways. Ideal untuk backup & migrasi sistem.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleExportJSON}
                    className="mt-4 w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 group-hover:shadow-blue-900/30"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh JSON ({currentExportSessions.length} Sesi)</span>
                  </button>
                </div>
              </div>

              {/* Template Download Help Box */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-bold text-slate-200">Butuh template kolom CSV untuk pengisian manual?</span>
                    <p className="text-slate-400 mt-0.5">
                      Unduh template contoh berisikan format header lengkap (Hari, Tanggal, Jam, Judul, Kategori, Ruangan, Moderator, Pembicara, Abstrak).
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Template CSV</span>
                </button>
              </div>

            </div>
          )}

          {/* TAB 2: IMPORT */}
          {activeTab === 'import' && (
            <div className="space-y-5">
              
              {/* PDF Extracted Preset: MUNAS 5 ADHPHKI Day 1 */}
              <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-indigo-950/70 border-2 border-emerald-500/40 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider">
                        PDF Terdeteksi: Time Table Day 1.pdf
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Minggu, 29 Nov 2026
                      </span>
                    </div>
                    <h4 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                      <span>Jadwal MUNAS V ADHPHKI & KIVNAHK IV 2026</span>
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                      Hasil ekstraksi file jadwal PDF: 12 sesi lengkap (Plenary WSAVA Mastectomy, Parallel Session Oncology Dr. Ivan Satriawan di Ballroom Amartapura B, hingga Sidang Pleno Munas ADHPHKI).
                    </p>
                  </div>

                  <div className="flex flex-col sm:items-end gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleLoadMunasPdfPreset}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm shadow-md hover:shadow-emerald-900/50 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Muat Jadwal dari PDF Ini (12 Sesi)</span>
                    </button>
                    {isMunasPresetActive && (
                      <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Preset PDF Sedang Aktif di Preview
                      </span>
                    )}
                  </div>
                </div>

                {/* Additional option to sync Event Title & Rooms */}
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none">
                    <input 
                      type="checkbox" 
                      checked={syncEventAndRooms}
                      onChange={(e) => setSyncEventAndRooms(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-950 border-slate-700"
                    />
                    <span>Sinkronkan juga Nama Acara, Ruangan Amartapura A & B, serta Pembicara (Dr. Ivan Satriawan, drh. Listriani Wistawan, dll)</span>
                  </label>
                </div>
              </div>

              {/* Import Mode Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Metode Penerapan Data Impor:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <label 
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      importMode === 'replace'
                        ? 'bg-rose-600/20 border-rose-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-rose-400">1. Gantikan Semua (Rekomendasi)</span>
                      <input 
                        type="radio" 
                        name="importMode" 
                        value="replace" 
                        checked={importMode === 'replace'} 
                        onChange={() => setImportMode('replace')}
                        className="text-rose-600"
                      />
                    </div>
                    <span className="text-[11px] text-slate-400 leading-snug">
                      Gantikan jadwal saat ini dengan 12 sesi dari jadwal MUNAS PDF.
                    </span>
                  </label>

                  <label 
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      importMode === 'append'
                        ? 'bg-emerald-600/20 border-emerald-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-emerald-400">2. Tambahkan (Append)</span>
                      <input 
                        type="radio" 
                        name="importMode" 
                        value="append" 
                        checked={importMode === 'append'} 
                        onChange={() => setImportMode('append')}
                        className="text-emerald-600"
                      />
                    </div>
                    <span className="text-[11px] text-slate-400 leading-snug">
                      Menambahkan jadwal baru ke jadwal yang sudah ada (tidak menghapus data lama).
                    </span>
                  </label>

                  <label 
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      importMode === 'upsert'
                        ? 'bg-blue-600/20 border-blue-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-blue-400">3. Sinkronkan (Upsert)</span>
                      <input 
                        type="radio" 
                        name="importMode" 
                        value="upsert" 
                        checked={importMode === 'upsert'} 
                        onChange={() => setImportMode('upsert')}
                        className="text-blue-600"
                      />
                    </div>
                    <span className="text-[11px] text-slate-400 leading-snug">
                      Perbarui sesi dengan Judul/ID yang sama, tambahkan jika belum ada.
                    </span>
                  </label>
                </div>
              </div>

              {/* Upload Dropzone / File Picker */}
              <div className="bg-slate-950 border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-2xl p-6 text-center transition-all">
                <input
                  type="file"
                  id="session-file-input"
                  accept=".csv,.json,.txt,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label 
                  htmlFor="session-file-input"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                >
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 shadow-inner">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-white block">
                      Klik untuk Memilih File PDF, CSV, JSON, atau Teks Jadwal
                    </span>
                    <span className="text-xs text-slate-400 block mt-0.5">
                      Mendukung format file <strong className="text-indigo-400">.pdf</strong> (Ekstraksi Otomatis AI Gemini), <strong className="text-emerald-400">.csv</strong> (Excel), <strong className="text-blue-400">.json</strong>, atau <strong className="text-amber-400">.txt</strong>
                    </span>
                  </div>
                  {uploadedFileName && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mt-2">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>File / Preset terpilih: {uploadedFileName}</span>
                    </div>
                  )}
                </label>
              </div>

              {/* Or Paste Raw Content */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Atau Tempel (Paste) Teks Jadwal / CSV / JSON di Sini:
                  </label>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>Unduh Contoh Template CSV</span>
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={importText}
                  onChange={handleTextareaChange}
                  placeholder={`Contoh teks jadwal dari PDF yang bisa ditempel langsung:\n08:30 - 09:15 Opening Ceremony & Sambutan\nBallroom Amartapura A\n\n09:15 - 10:45 WSAVA Keynote: Surgical Oncology\nBallroom Amartapura A\nModerator: drh. Listriani Wistawan\nSpeaker: Prof. Dr. Michael Henderson\n\n13:30 - 15:00 Simposium Paralel 1A: Advanced Oncology & Skin Flap\nBallroom Amartapura B\nSpeaker: Dr. Ivan Satriawan\nModerator: drh. Listriani Wistawan`}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>

              {/* Preview Result Card */}
              {previewResult && (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-xs font-bold text-white">
                        Hasil Deteksi & Validasi: {previewResult.parsedCount} Sesi Ditemukan
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-bold">
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                        {previewResult.importedSessions.filter(s => s.type !== 'Workshop Hands-On').length} Simposium
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                        {previewResult.importedSessions.filter(s => s.type === 'Workshop Hands-On').length} Workshop
                      </span>
                    </div>
                  </div>

                  {/* Errors / Warnings */}
                  {previewResult.errors.length > 0 && (
                    <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-3 text-xs text-amber-300 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <span>Peringatan Pembacaan:</span>
                      </div>
                      <ul className="list-disc list-inside text-[11px] text-amber-200/80 space-y-0.5 max-h-20 overflow-y-auto">
                        {previewResult.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Preview Table of First Few Rows */}
                  {previewResult.importedSessions.length > 0 && (
                    <div className="overflow-x-auto rounded-xl border border-slate-800">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-900 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                          <tr>
                            <th className="p-2">Hari & Waktu</th>
                            <th className="p-2">Judul Sesi</th>
                            <th className="p-2">Tipe & Ruangan</th>
                            <th className="p-2">Narasumber</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80 text-slate-300">
                          {previewResult.importedSessions.slice(0, 4).map((s, idx) => (
                            <tr key={idx} className="hover:bg-slate-900/50">
                              <td className="p-2 whitespace-nowrap">
                                <span className="font-bold text-white block">{s.day}</span>
                                <span className="text-[10px] text-slate-400 font-mono">{s.timeString}</span>
                              </td>
                              <td className="p-2 max-w-[220px]">
                                <span className="font-bold text-white line-clamp-1">{s.title}</span>
                                <span className="text-[10px] text-indigo-400 block">{s.category}</span>
                              </td>
                              <td className="p-2 whitespace-nowrap">
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-800 text-slate-300 inline-block mb-0.5">
                                  {s.type}
                                </span>
                                <div className="text-[10px] text-slate-400">{s.room}</div>
                              </td>
                              <td className="p-2 text-[11px] max-w-[160px] truncate text-slate-300">
                                {s.speakers.map(sp => sp.name.split(',')[0]).join(', ') || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {previewResult.importedSessions.length > 4 && (
                        <div className="p-2 text-center text-[10px] text-slate-400 bg-slate-900/60 font-semibold">
                          ... dan {previewResult.importedSessions.length - 4} sesi lainnya siap diimpor.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Apply Button */}
                  <button
                    type="button"
                    onClick={handleApplyImport}
                    disabled={previewResult.importedSessions.length === 0}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      Terapkan & Simpan {previewResult.importedSessions.length} Sesi ke Jadwal
                    </span>
                  </button>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Format didukung: <strong>.csv</strong>, <strong>.json</strong></span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold transition-colors"
          >
            Tutup
          </button>
        </div>

      </motion.div>
    </div>
  );
};
