import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Sparkles, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Calendar, 
  Users, 
  MapPin, 
  Copy, 
  Download, 
  Check, 
  Trash2, 
  Layers, 
  RefreshCw, 
  ArrowRight,
  Eye,
  FileCode,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Edit3,
  Plus,
  X,
  Save,
  Search,
  CheckSquare,
  Square,
  Tag,
  Stethoscope
} from 'lucide-react';
import { Session, Speaker, Room, SymposiumInfo } from '../../types';
import { extractScheduleFromPdf, extractScheduleFromText, getRoomColorByRoomName } from '../../services/aiScheduleService';
import { 
  MUNAS_SESSIONS, 
  MUNAS_SPEAKERS, 
  MUNAS_ROOMS, 
  MUNAS_ADHPHKI_EVENT_INFO 
} from '../../data/munasAdhphkiData';

interface AdminAiPdfScheduleExtractorProps {
  sessions: Session[];
  onSaveSessions: (sessions: Session[]) => void;
  speakers: Speaker[];
  onSaveSpeakers?: (speakers: Speaker[]) => void;
  rooms: Room[];
  onSaveRooms?: (rooms: Room[]) => void;
  eventInfo: SymposiumInfo;
  onSaveEventInfo?: (info: SymposiumInfo) => void;
  onShowToast: (message: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export const AdminAiPdfScheduleExtractor: React.FC<AdminAiPdfScheduleExtractorProps> = ({
  sessions,
  onSaveSessions,
  speakers,
  onSaveRooms,
  onSaveSpeakers,
  rooms,
  eventInfo,
  onSaveEventInfo,
  onShowToast,
  onNavigateTab
}) => {
  // Input Mode: 'pdf' or 'text'
  const [inputMode, setInputMode] = useState<'pdf' | 'text'>('pdf');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractionProgress, setExtractionProgress] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Extracted Results State
  const [extractedSessions, setExtractedSessions] = useState<Session[]>([]);
  const [selectedSessionIds, setSelectedSessionIds] = useState<Set<string>>(new Set());
  const [detectedEventInfo, setDetectedEventInfo] = useState<Partial<SymposiumInfo> | null>(null);
  const [detectedRooms, setDetectedRooms] = useState<any[]>([]);
  const [detectedSpeakers, setDetectedSpeakers] = useState<any[]>([]);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [hasExtracted, setHasExtracted] = useState<boolean>(false);

  // View, Filter & Apply Options
  const [viewTab, setViewTab] = useState<'sessions' | 'json' | 'metadata'>('sessions');
  const [previewFilterRoom, setPreviewFilterRoom] = useState<string>('all');
  const [previewFilterDay, setPreviewFilterDay] = useState<string>('all');
  const [previewSearch, setPreviewSearch] = useState<string>('');
  const [importMode, setImportMode] = useState<'replace' | 'append' | 'upsert'>('replace');
  const [syncRooms, setSyncRooms] = useState<boolean>(true);
  const [syncSpeakers, setSyncSpeakers] = useState<boolean>(true);
  const [syncEventInfo, setSyncEventInfo] = useState<boolean>(true);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  // Edit / Add Session Modal State
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [isNewSessionModal, setIsNewSessionModal] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        setSelectedFile(file);
        setErrorMessage(null);
      } else {
        setErrorMessage('Format file tidak didukung. Harap unggah file dokumen PDF (.pdf).');
      }
    }
  };

  // Handle File Input Change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        setSelectedFile(file);
        setErrorMessage(null);
      } else {
        setErrorMessage('Format file tidak didukung. Harap unggah file dokumen PDF (.pdf).');
      }
    }
  };

  // Load Complete 12-session MUNAS 5 ADHPHKI Time Table Day 1
  const handleLoadSamplePdf = () => {
    setExtractedSessions(MUNAS_SESSIONS);
    setSelectedSessionIds(new Set(MUNAS_SESSIONS.map(s => s.id)));
    setDetectedRooms(MUNAS_ROOMS.map(r => ({
      name: r.name,
      shortName: r.shortName,
      floor: r.floor,
      capacity: r.capacity,
      color: r.color
    })));
    setDetectedSpeakers(Object.values(MUNAS_SPEAKERS).map(s => ({
      name: s.name,
      title: s.title,
      institution: s.institution,
      specialty: s.specialty
    })));
    setDetectedEventInfo({
      title: MUNAS_ADHPHKI_EVENT_INFO.title,
      dateString: MUNAS_ADHPHKI_EVENT_INFO.dates.day1,
      location: MUNAS_ADHPHKI_EVENT_INFO.location
    });
    setAiSummary('12 sesi jadwal lengkap dari dokumen "Time Table Day 1.pdf" (MUNAS V ADHPHKI & KIVNAHK IV 2026) berhasil dimuat dengan seluruh narasumber dan sesi paralel.');
    setHasExtracted(true);
    setErrorMessage(null);
    onShowToast('12 sesi lengkap jadwal MUNAS V ADHPHKI berhasil dimuat ke daftar pratinjau!');
  };

  // Run AI Extraction
  const handleStartExtraction = async () => {
    if (inputMode === 'pdf' && !selectedFile) {
      setErrorMessage('Pilih atau unggah file PDF terlebih dahulu.');
      return;
    }
    if (inputMode === 'text' && !rawText.trim()) {
      setErrorMessage('Masukkan atau tempelkan teks jadwal terlebih dahulu.');
      return;
    }

    setIsExtracting(true);
    setErrorMessage(null);
    setExtractionProgress('Menghubungkan ke model AI Gemini...');

    try {
      let result;
      if (inputMode === 'pdf' && selectedFile) {
        result = await extractScheduleFromPdf(selectedFile, (stage) => {
          setExtractionProgress(stage);
        });
      } else {
        result = await extractScheduleFromText(rawText, (stage) => {
          setExtractionProgress(stage);
        });
      }

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Ekstraksi gagal dilakukan.');
      }

      const sessionsList = result.data.sessions || [];
      if (sessionsList.length === 0) {
        throw new Error('AI tidak menemukan sesi yang valid dalam dokumen. Periksa isi dokumen.');
      }

      setExtractedSessions(sessionsList);
      setSelectedSessionIds(new Set(sessionsList.map(s => s.id)));
      setDetectedRooms(result.data.detectedRooms || []);
      setDetectedSpeakers(result.data.detectedSpeakers || []);
      setAiSummary(result.data.summary || `Berhasil mengekstrak ${sessionsList.length} sesi secara detail.`);
      
      if (result.data.eventName) {
        setDetectedEventInfo({
          title: result.data.eventName,
          dateString: result.data.eventDate,
          location: result.data.venue
        });
      }

      setHasExtracted(true);
      onShowToast(`AI berhasil mengekstrak ${sessionsList.length} sesi jadwal simposium!`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat memproses ekstraksi dengan AI.');
    } finally {
      setIsExtracting(false);
      setExtractionProgress('');
    }
  };

  // Toggle Selection for a Session
  const handleToggleSelectSession = (id: string) => {
    setSelectedSessionIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Select / Deselect All
  const handleSelectAll = () => {
    if (selectedSessionIds.size === extractedSessions.length) {
      setSelectedSessionIds(new Set());
    } else {
      setSelectedSessionIds(new Set(extractedSessions.map(s => s.id)));
    }
  };

  // Batch Day Change
  const handleBatchSetDay = (targetDay: 'Hari I' | 'Hari II') => {
    if (selectedSessionIds.size === 0) {
      onShowToast('Pilih minimal satu sesi terlebih dahulu.');
      return;
    }
    setExtractedSessions(prev =>
      prev.map(s => {
        if (selectedSessionIds.has(s.id)) {
          return {
            ...s,
            day: targetDay,
            date: targetDay === 'Hari II' ? 'Senin, 30 November 2026' : 'Minggu, 29 November 2026'
          };
        }
        return s;
      })
    );
    onShowToast(`${selectedSessionIds.size} sesi berhasil diubah ke ${targetDay}.`);
  };

  // Delete a session
  const handleDeleteExtractedSession = (id: string) => {
    setExtractedSessions(prev => prev.filter(s => s.id !== id));
    setSelectedSessionIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    onShowToast('Sesi dihapus dari daftar pratinjau.');
  };

  // Open Edit Session Modal
  const handleOpenEditSession = (session: Session) => {
    setEditingSession({ ...session });
    setIsNewSessionModal(false);
  };

  // Open Add Session Modal
  const handleOpenAddSession = () => {
    const newSession: Session = {
      id: `sess-manual-${Date.now()}`,
      day: 'Hari I',
      date: 'Minggu, 29 November 2026',
      startTime: '10:00',
      endTime: '11:00',
      timeString: '10:00 - 11:00 WIB',
      title: '',
      category: 'Onkologi & Bedah',
      type: 'Simposium Paralel',
      room: 'Ballroom Amartapura B',
      floor: 'Lantai 1',
      roomColor: 'bg-emerald-600',
      moderator: '',
      capacity: 350,
      speakers: [],
      abstract: {
        background: '',
        clinicalUpdates: [],
        conclusion: ''
      },
      keyTakeaways: []
    };
    setEditingSession(newSession);
    setIsNewSessionModal(true);
  };

  // Save Edited Session
  const handleSaveEditedSession = () => {
    if (!editingSession || !editingSession.title.trim()) {
      onShowToast('Judul sesi wajib diisi.');
      return;
    }

    const updated = {
      ...editingSession,
      timeString: `${editingSession.startTime} - ${editingSession.endTime} WIB`,
      roomColor: getRoomColorByRoomName(editingSession.room)
    };

    if (isNewSessionModal) {
      setExtractedSessions(prev => [...prev, updated]);
      setSelectedSessionIds(prev => new Set([...prev, updated.id]));
      onShowToast(`Sesi "${updated.title}" berhasil ditambahkan!`);
    } else {
      setExtractedSessions(prev => prev.map(s => s.id === updated.id ? updated : s));
      onShowToast(`Sesi "${updated.title}" berhasil diperbarui!`);
    }

    setEditingSession(null);
  };

  // Apply to Application Database
  const handleApplyToDatabase = () => {
    const sessionsToApply = extractedSessions.filter(s => selectedSessionIds.has(s.id));

    if (sessionsToApply.length === 0) {
      onShowToast('Pilih minimal satu sesi yang akan diterapkan ke database.');
      return;
    }

    let finalSessions: Session[] = [];

    if (importMode === 'replace') {
      finalSessions = sessionsToApply;
    } else if (importMode === 'append') {
      const existingIds = new Set(sessions.map(s => s.id));
      const adjusted = sessionsToApply.map((s, idx) => {
        if (existingIds.has(s.id)) {
          return { ...s, id: `${s.id}-ai-${Date.now()}-${idx}` };
        }
        return s;
      });
      finalSessions = [...sessions, ...adjusted];
    } else if (importMode === 'upsert') {
      const existingMap = new Map<string, Session>(sessions.map(s => [s.id, s]));
      const titleMap = new Map<string, string>(sessions.map(s => [s.title.toLowerCase().trim(), s.id]));

      const appended: Session[] = [];
      sessionsToApply.forEach(incoming => {
        const matchedById = existingMap.get(incoming.id);
        const matchedIdByTitle = titleMap.get(incoming.title.toLowerCase().trim());
        const targetId = matchedById ? incoming.id : matchedIdByTitle;

        if (targetId && existingMap.has(targetId)) {
          existingMap.set(targetId, { ...incoming, id: targetId });
        } else {
          appended.push(incoming);
        }
      });
      finalSessions = [...Array.from(existingMap.values()), ...appended];
    }

    // Save sessions to database
    onSaveSessions(finalSessions);

    // Sync Rooms if enabled
    if (syncRooms && onSaveRooms) {
      const allExtractedRooms = detectedRooms.length > 0 ? detectedRooms : MUNAS_ROOMS;
      const existingRoomNames = new Set(rooms.map(r => r.name.toLowerCase()));
      const newRooms: Room[] = allExtractedRooms
        .filter(dr => !existingRoomNames.has((dr.name || '').toLowerCase()))
        .map((dr, idx) => ({
          id: dr.name || `room-ai-${Date.now()}-${idx}`,
          name: dr.name,
          shortName: dr.shortName || dr.name,
          floor: dr.floor || 'Lantai 1',
          capacity: dr.capacity || 300,
          description: `Ruangan terdaftar dari dokumen simposium.`,
          facilities: ['Audio Visual HD', 'Layar Proyektor / Videotron', 'Wireless Mic', 'WiFi'],
          type: dr.name?.toLowerCase().includes('workshop') ? 'workshop' : 'ballroom',
          color: dr.color || getRoomColorByRoomName(dr.name),
          badgeBg: `${dr.color || getRoomColorByRoomName(dr.name)} text-white`
        }));
      
      if (newRooms.length > 0) {
        onSaveRooms([...rooms, ...newRooms]);
      }
    }

    // Sync Speakers if enabled
    if (syncSpeakers && onSaveSpeakers) {
      const allExtractedSpeakers: Speaker[] = [];
      sessionsToApply.forEach(s => {
        if (Array.isArray(s.speakers)) {
          s.speakers.forEach(sp => {
            if (sp.name && !allExtractedSpeakers.some(existing => existing.name.toLowerCase() === sp.name.toLowerCase())) {
              allExtractedSpeakers.push(sp);
            }
          });
        }
      });

      if (allExtractedSpeakers.length > 0) {
        const existingSpeakerNames = new Set(speakers.map(sp => sp.name.toLowerCase()));
        const newSpeakers = allExtractedSpeakers.filter(sp => !existingSpeakerNames.has(sp.name.toLowerCase()));
        if (newSpeakers.length > 0) {
          onSaveSpeakers([...speakers, ...newSpeakers]);
        }
      }
    }

    // Sync Event Info if enabled
    if (syncEventInfo && detectedEventInfo && onSaveEventInfo) {
      onSaveEventInfo({
        ...eventInfo,
        title: detectedEventInfo.title || eventInfo.title,
        dates: {
          ...eventInfo.dates,
          day1: detectedEventInfo.dateString || eventInfo.dates.day1
        },
        location: detectedEventInfo.location || eventInfo.location
      });
    }

    onShowToast(`Database aplikasi berhasil diperbarui dengan ${sessionsToApply.length} sesi jadwal simposium!`);
    
    // Switch to symposium schedule tab to inspect
    if (onNavigateTab) {
      onNavigateTab('symposium');
    }
  };

  // Copy JSON to clipboard
  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(extractedSessions, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
    onShowToast('Struktur JSON sesi berhasil disalin ke clipboard!');
  };

  // Download JSON file
  const handleDownloadJson = () => {
    const jsonStr = JSON.stringify(extractedSessions, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sesi_simposium_ai_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onShowToast('File JSON jadwal simposium berhasil diunduh!');
  };

  // Filtered Sessions in Preview
  const filteredPreviewSessions = extractedSessions.filter(s => {
    if (previewFilterDay !== 'all' && s.day !== previewFilterDay) return false;
    if (previewFilterRoom !== 'all' && s.room !== previewFilterRoom) return false;
    if (previewSearch.trim()) {
      const q = previewSearch.toLowerCase();
      const matchTitle = s.title.toLowerCase().includes(q);
      const matchRoom = s.room.toLowerCase().includes(q);
      const matchSpeaker = s.speakers?.some(sp => sp.name.toLowerCase().includes(q));
      if (!matchTitle && !matchRoom && !matchSpeaker) return false;
    }
    return true;
  });

  const uniqueRoomsInPreview = Array.from(new Set(extractedSessions.map(s => s.room)));

  return (
    <div className="space-y-6">
      
      {/* Top AI Extractor Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-sky-950 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-black tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>AI-POWERED SCHEDULE EXTRACTOR & JSON MAPPER</span>
            </div>
            
            <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
              Ekstraksi Jadwal Simposium dari PDF / Dokumen ke Database
            </h2>
            
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Unggah berkas PDF jadwal simposium atau tempelkan teks tabel. AI akan membaca seluruh sesi (termasuk sesi paralel dan narasumber), memetakan ke struktur JSON standar aplikasi, dan memungkinkan Anda meninjau atau mengedit sesi sebelum disimpan secara otomatis.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch md:items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                onSaveSessions(MUNAS_SESSIONS);
                if (onSaveRooms) onSaveRooms(MUNAS_ROOMS);
                if (onSaveSpeakers) onSaveSpeakers(Object.values(MUNAS_SPEAKERS));
                if (onSaveEventInfo) onSaveEventInfo(MUNAS_ADHPHKI_EVENT_INFO);
                onShowToast("Jadwal & Master KIVNAHK IV & MUNAS V ADHPHKI (2 Workshop 28 Nov, Ballroom Amartapura A & B, Antareja & Wisanggeni Room) berhasil diterapkan!");
                if (onNavigateTab) onNavigateTab('symposium');
              }}
              className="px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg hover:shadow-emerald-900/50 transition-all flex items-center justify-center gap-2 cursor-pointer"
              title="Terapkan jadwal lengkap KIVNAHK IV & MUNAS V ADHPHKI (28 Nov - 1 Des 2026), Master Ruangan, dan Master Acara"
            >
              <CheckCircle2 className="w-4 h-4 text-amber-300" />
              <span>Terapkan KIVNAHK IV & MUNAS V Lengkap</span>
            </button>

            <button
              type="button"
              onClick={handleLoadSamplePdf}
              className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 hover:border-slate-600 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Muat Sesi Lengkap di Pratinjau</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Upload & Controls on Left, Results & Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Upload / Text Input Card */}
        <div className="lg:col-span-1 space-y-4">
          
          {/* Input Method Switcher */}
          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setInputMode('pdf')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                inputMode === 'pdf'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Upload PDF</span>
            </button>
            <button
              type="button"
              onClick={() => setInputMode('text')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                inputMode === 'text'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Teks / Tabel Jadwal</span>
            </button>
          </div>

          {inputMode === 'pdf' ? (
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[240px] ${
                isDragging 
                  ? 'border-indigo-400 bg-indigo-950/40 scale-[1.01]' 
                  : selectedFile
                    ? 'border-emerald-500/50 bg-emerald-950/10'
                    : 'border-slate-800 bg-slate-950 hover:border-slate-700'
              }`}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".pdf,application/pdf" 
                onChange={handleFileChange}
                className="hidden" 
              />

              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition-transform ${
                selectedFile 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
              }`}>
                {selectedFile ? <FileText className="w-7 h-7" /> : <Upload className="w-7 h-7" />}
              </div>

              {selectedFile ? (
                <div className="space-y-1">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase">
                    Berkas PDF Siap
                  </span>
                  <p className="text-sm font-black text-white break-all max-w-[220px]">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {(selectedFile.size / 1024).toFixed(1)} KB &bull; Klik untuk ganti
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm font-black text-white">
                    Tarik & Lepas File PDF ke Sini
                  </p>
                  <p className="text-xs text-slate-400 max-w-xs">
                    Atau klik untuk memilih file dari komputer Anda (format <strong className="text-white">.pdf</strong>).
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-4 space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                Tempelkan Teks Jadwal / Timetable:
              </label>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Contoh:&#10;08.00 - 09.00: Registrasi Ulang di Foyer&#10;09.15 - 10.45: WSAVA Keynote oleh Prof. Michael Henderson di Ballroom A&#10;10.45 - 12.00: Simposium Paralel Bedah Onkologi oleh Dr. Ivan Satriawan di Ballroom B"
                className="w-full h-44 bg-slate-900 border border-slate-800 rounded-2xl p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-mono leading-relaxed resize-none"
              />
            </div>
          )}

          {/* Action Button: Start Extraction */}
          <button
            type="button"
            disabled={(inputMode === 'pdf' ? !selectedFile : !rawText.trim()) || isExtracting}
            onClick={handleStartExtraction}
            className={`w-full py-3.5 px-5 rounded-2xl font-black text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
              (inputMode === 'pdf' ? !selectedFile : !rawText.trim()) || isExtracting
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white shadow-indigo-900/30'
            }`}
          >
            {isExtracting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                <span>Mengekstrak dengan AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Mulai Ekstraksi AI Sekarang</span>
              </>
            )}
          </button>

          {/* Progress Indicator */}
          {isExtracting && (
            <div className="bg-slate-950 border border-indigo-500/30 rounded-2xl p-4 space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>
                <span>Proses Ekstraksi:</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-mono">
                {extractionProgress || 'Menganalisis jadwal...'}
              </p>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-rose-950/40 border border-rose-500/40 rounded-2xl p-4 flex items-start gap-3 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div>
                <span className="font-bold block">Pemberitahuan Ekstraksi</span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Extraction Tips */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs text-slate-400">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Fitur Cerdas AI:</span>
            </span>
            <ul className="space-y-1.5 list-disc list-inside text-[11px] text-slate-400">
              <li>Mendeteksi sesi paralel di jam yang sama</li>
              <li>Menyimpan narasumber lengkap dengan gelar</li>
              <li>Mengelompokkan ruangan & warna tag visual</li>
              <li>Hasil dapat diedit secara bebas sebelum disimpan</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Preview & Management Area */}
        <div className="lg:col-span-2 space-y-4">
          
          {!hasExtracted ? (
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center justify-center min-h-[380px] space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-300">
                Belum Ada Hasil Ekstraksi
              </h3>
              <p className="text-xs text-slate-500 max-w-md">
                Unggah berkas PDF jadwal di sebelah kiri atau klik tombol "Muat 12 Sesi Lengkap Time Table Day 1.pdf" untuk melihat hasil ekstraksi dan memetakan datanya ke database.
              </p>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in">
              
              {/* Event Stats Header Card */}
              <div className="bg-gradient-to-r from-emerald-950/50 via-slate-950 to-indigo-950/50 border border-emerald-500/30 rounded-3xl p-5 shadow-lg">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase">
                      Hasil Ekstraksi AI Siap
                    </span>
                    <h3 className="text-lg font-black text-white mt-1">
                      {detectedEventInfo?.title || 'Jadwal Simposium Terdeteksi'}
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
                      {aiSummary}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="bg-slate-900/80 border border-slate-800 px-3 py-2 rounded-xl text-center">
                      <span className="text-xs text-slate-400 block font-medium">Total Sesi</span>
                      <span className="text-lg font-black text-emerald-400">{extractedSessions.length}</span>
                    </div>

                    <div className="bg-slate-900/80 border border-slate-800 px-3 py-2 rounded-xl text-center">
                      <span className="text-xs text-slate-400 block font-medium">Terpilih</span>
                      <span className="text-lg font-black text-indigo-400">{selectedSessionIds.size}</span>
                    </div>

                    <div className="bg-slate-900/80 border border-slate-800 px-3 py-2 rounded-xl text-center">
                      <span className="text-xs text-slate-400 block font-medium">Ruangan</span>
                      <span className="text-lg font-black text-amber-400">
                        {uniqueRoomsInPreview.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* View Selector & Export Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setViewTab('sessions')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      viewTab === 'sessions'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Daftar Sesi ({extractedSessions.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewTab('json')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      viewTab === 'json'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>Struktur Objek JSON</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewTab('metadata')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      viewTab === 'metadata'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Ruangan & Narasumber</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenAddSession}
                    className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Sesi Manual</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyJson}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors flex items-center gap-1"
                  >
                    {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedJson ? 'Tersalin' : 'Salin JSON'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadJson}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5 text-sky-400" />
                    <span>Unduh JSON</span>
                  </button>
                </div>
              </div>

              {/* View 1: Visual Session Cards with Edit, Select, and Batch Actions */}
              {viewTab === 'sessions' && (
                <div className="space-y-3">
                  
                  {/* Filter & Batch Action Toolbar */}
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={handleSelectAll}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold border border-slate-700 flex items-center gap-1.5"
                      >
                        {selectedSessionIds.size === extractedSessions.length ? (
                          <>
                            <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Batal Pilih Semua</span>
                          </>
                        ) : (
                          <>
                            <Square className="w-3.5 h-3.5 text-slate-400" />
                            <span>Pilih Semua ({selectedSessionIds.size}/{extractedSessions.length})</span>
                          </>
                        )}
                      </button>

                      {/* Batch Set Day */}
                      <span className="text-slate-600">|</span>
                      <span className="text-slate-400 font-medium">Set Hari:</span>
                      <button
                        type="button"
                        onClick={() => handleBatchSetDay('Hari I')}
                        className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 font-bold"
                      >
                        Hari I
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBatchSetDay('Hari II')}
                        className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 font-bold"
                      >
                        Hari II
                      </button>
                    </div>

                    {/* Room & Day Filters */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={previewFilterDay}
                        onChange={(e) => setPreviewFilterDay(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-300 text-xs font-medium"
                      >
                        <option value="all">Semua Hari</option>
                        <option value="Hari I">Hari I</option>
                        <option value="Hari II">Hari II</option>
                      </select>

                      <select
                        value={previewFilterRoom}
                        onChange={(e) => setPreviewFilterRoom(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-300 text-xs font-medium"
                      >
                        <option value="all">Semua Ruangan</option>
                        {uniqueRoomsInPreview.map((rm, idx) => (
                          <option key={idx} value={rm}>{rm}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* List of Sessions */}
                  <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                    {filteredPreviewSessions.length === 0 ? (
                      <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-500">
                        Tidak ada sesi yang cocok dengan filter.
                      </div>
                    ) : (
                      filteredPreviewSessions.map((session, index) => {
                        const isExpanded = expandedSessionId === session.id;
                        const isSelected = selectedSessionIds.has(session.id);

                        return (
                          <div 
                            key={session.id || index}
                            className={`border rounded-2xl p-4 transition-all space-y-2 group ${
                              isSelected 
                                ? 'bg-slate-950 border-slate-800 hover:border-slate-700' 
                                : 'bg-slate-950/50 border-slate-900 opacity-60'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              
                              {/* Checkbox & Time/Room Header */}
                              <div className="flex items-start gap-3 flex-1">
                                <button
                                  type="button"
                                  onClick={() => handleToggleSelectSession(session.id)}
                                  className="mt-0.5 text-slate-400 hover:text-white"
                                  title={isSelected ? 'Hapus pilihan impor' : 'Pilih sesi untuk diimpor'}
                                >
                                  {isSelected ? (
                                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                                  ) : (
                                    <Square className="w-4 h-4 text-slate-600" />
                                  )}
                                </button>

                                <div className="space-y-1 flex-1">
                                  <div className="flex flex-wrap items-center gap-2 text-xs">
                                    <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-mono font-bold flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {session.timeString || `${session.startTime} - ${session.endTime}`}
                                    </span>

                                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium">
                                      {session.room}
                                    </span>

                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                      session.day === 'Hari II' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
                                    }`}>
                                      {session.day}
                                    </span>

                                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                                      {session.type}
                                    </span>
                                  </div>

                                  <h4 className="text-sm font-bold text-white leading-snug group-hover:text-indigo-300 transition-colors">
                                    {session.title}
                                  </h4>
                                </div>
                              </div>

                              {/* Action Buttons: Edit, Expand, Delete */}
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditSession(session)}
                                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-indigo-950 text-slate-400 hover:text-indigo-300 transition-colors"
                                  title="Edit detail sesi ini"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
                                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                                  title={isExpanded ? 'Tutup detail' : 'Buka detail'}
                                >
                                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteExtractedSession(session.id)}
                                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950 text-slate-500 hover:text-rose-400 transition-colors"
                                  title="Hapus sesi dari pratinjau"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Speaker & Moderator Preview */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 pt-1 border-t border-slate-900">
                              {session.speakers && session.speakers.length > 0 && (
                                <span className="flex items-center gap-1 text-slate-300">
                                  <Users className="w-3.5 h-3.5 text-amber-400" />
                                  <span>{session.speakers.map(s => s.name).join(', ')}</span>
                                </span>
                              )}

                              {session.moderator && (
                                <span className="text-slate-400">
                                  Mod: <strong className="text-slate-300">{session.moderator}</strong>
                                </span>
                              )}

                              <span className="text-[11px] text-slate-500">
                                Kategori: {session.category}
                              </span>
                            </div>

                            {/* Expanded Details: Abstract & Key Takeaways */}
                            {isExpanded && (
                              <div className="pt-2 mt-2 border-t border-slate-800/80 space-y-2 text-xs text-slate-300 bg-slate-900/50 p-3 rounded-xl">
                                {session.abstract?.background && (
                                  <div>
                                    <span className="font-bold text-slate-400 block text-[11px]">Latar Belakang Klinis:</span>
                                    <p className="text-slate-300 mt-0.5">{session.abstract.background}</p>
                                  </div>
                                )}

                                {session.abstract?.clinicalUpdates && session.abstract.clinicalUpdates.length > 0 && (
                                  <div>
                                    <span className="font-bold text-slate-400 block text-[11px]">Poin Materi / Update Klinis:</span>
                                    <ul className="list-disc list-inside space-y-0.5 text-slate-300 mt-0.5">
                                      {session.abstract.clinicalUpdates.map((update, uIdx) => (
                                        <li key={uIdx}>{update}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* View 2: Structured JSON Code */}
              {viewTab === 'json' && (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 max-h-[460px] overflow-y-auto">
                  <pre className="text-xs font-mono text-emerald-400 whitespace-pre-wrap leading-relaxed">
                    {JSON.stringify(extractedSessions, null, 2)}
                  </pre>
                </div>
              )}

              {/* View 3: Metadata (Rooms & Speakers) */}
              {viewTab === 'metadata' && (
                <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
                  
                  {/* Detected Rooms */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-indigo-400" />
                      <span>Ruangan yang Terdeteksi dari Dokumen PDF ({uniqueRoomsInPreview.length})</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {uniqueRoomsInPreview.map((roomName, idx) => (
                        <div key={idx} className="bg-slate-900 border border-slate-800 p-3 rounded-xl space-y-1">
                          <span className="font-bold text-white block">{roomName}</span>
                          <span className="text-slate-400 block text-[11px]">
                            {extractedSessions.filter(s => s.room === roomName).length} Sesi Terjadwal
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Detected Speakers */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-amber-400" />
                      <span>Narasumber / Pembicara yang Terdeteksi</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {Array.from(
                        new Map<string, Speaker>(
                          extractedSessions
                            .flatMap(s => s.speakers || [])
                            .filter(sp => sp && sp.name)
                            .map(sp => [sp.name, sp])
                        ).values()
                      ).map((speaker, idx) => (
                        <div key={idx} className="bg-slate-900 border border-slate-800 p-3 rounded-xl space-y-1">
                          <span className="font-bold text-white block">{speaker.name}</span>
                          <span className="text-slate-400 block text-[11px]">{speaker.title || speaker.specialty || 'Narasumber Ahli'}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* Database Integration Controls */}
              <div className="bg-slate-950 border border-indigo-500/30 rounded-3xl p-5 space-y-4">
                
                {/* Method selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">
                    Pilih Metode Pembaruan Database Aplikasi:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <label 
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                        importMode === 'replace'
                          ? 'bg-rose-600/20 border-rose-500 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-rose-400">1. Gantikan Semua (Replace)</span>
                        <input 
                          type="radio" 
                          name="aiImportMode" 
                          checked={importMode === 'replace'} 
                          onChange={() => setImportMode('replace')}
                          className="text-rose-600"
                        />
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Gantikan seluruh jadwal saat ini dengan {selectedSessionIds.size} sesi terpilih dari hasil ekstraksi.
                      </span>
                    </label>

                    <label 
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                        importMode === 'append'
                          ? 'bg-emerald-600/20 border-emerald-500 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-emerald-400">2. Tambahkan (Append)</span>
                        <input 
                          type="radio" 
                          name="aiImportMode" 
                          checked={importMode === 'append'} 
                          onChange={() => setImportMode('append')}
                          className="text-emerald-600"
                        />
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Tambahkan {selectedSessionIds.size} sesi tanpa menghapus sesi yang sudah ada di database.
                      </span>
                    </label>

                    <label 
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                        importMode === 'upsert'
                          ? 'bg-blue-600/20 border-blue-500 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-blue-400">3. Sinkronkan (Upsert)</span>
                        <input 
                          type="radio" 
                          name="aiImportMode" 
                          checked={importMode === 'upsert'} 
                          onChange={() => setImportMode('upsert')}
                          className="text-blue-600"
                        />
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Perbarui sesi yang memiliki judul sama, dan tambahkan sesi yang baru.
                      </span>
                    </label>
                  </div>
                </div>

                {/* Additional Sync Checkboxes */}
                <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row flex-wrap gap-3 text-xs text-slate-300">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={syncRooms}
                      onChange={(e) => setSyncRooms(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700"
                    />
                    <span>Sinkronkan Ruangan Baru ke Database</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={syncSpeakers}
                      onChange={(e) => setSyncSpeakers(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700"
                    />
                    <span>Daftarkan Narasumber Baru ke Direktori Speaker</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={syncEventInfo}
                      onChange={(e) => setSyncEventInfo(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700"
                    />
                    <span>Perbarui Info Acara (Judul & Tanggal)</span>
                  </label>
                </div>

                {/* Master Apply Button */}
                <button
                  type="button"
                  onClick={handleApplyToDatabase}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-black text-sm shadow-xl hover:shadow-emerald-900/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  <span>Terapkan {selectedSessionIds.size} Sesi Hasil Ekstraksi ke Database Aplikasi Secara Otomatis</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* Edit / Add Session Modal */}
      {editingSession && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-400" />
                <span>{isNewSessionModal ? 'Tambah Sesi Simposium Baru' : 'Edit Sesi Hasil Ekstraksi'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingSession(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Judul Sesi / Tema Presentasi:</label>
                <input
                  type="text"
                  value={editingSession.title}
                  onChange={(e) => setEditingSession({ ...editingSession, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                  placeholder="Judul presentasi / nama acara"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Hari:</label>
                  <select
                    value={editingSession.day}
                    onChange={(e) => setEditingSession({ 
                      ...editingSession, 
                      day: e.target.value as any,
                      date: e.target.value === 'Hari II' ? 'Senin, 30 November 2026' : 'Minggu, 29 November 2026'
                    })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Hari I">Hari I</option>
                    <option value="Hari II">Hari II</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Tipe Sesi:</label>
                  <select
                    value={editingSession.type}
                    onChange={(e) => setEditingSession({ ...editingSession, type: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Plenary Session">Plenary Session</option>
                    <option value="Simposium Paralel">Simposium Paralel</option>
                    <option value="Workshop Hands-On">Workshop Hands-On</option>
                    <option value="Keynote Lecture">Keynote Lecture</option>
                    <option value="Panel Discussion">Panel Discussion</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Jam Mulai (HH:mm):</label>
                  <input
                    type="text"
                    value={editingSession.startTime}
                    onChange={(e) => setEditingSession({ ...editingSession, startTime: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                    placeholder="08:30"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Jam Selesai (HH:mm):</label>
                  <input
                    type="text"
                    value={editingSession.endTime}
                    onChange={(e) => setEditingSession({ ...editingSession, endTime: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                    placeholder="09:15"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Ruangan:</label>
                  <input
                    type="text"
                    value={editingSession.room}
                    onChange={(e) => setEditingSession({ ...editingSession, room: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    placeholder="Ballroom Amartapura A"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Kategori:</label>
                  <input
                    type="text"
                    value={editingSession.category}
                    onChange={(e) => setEditingSession({ ...editingSession, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    placeholder="Onkologi & Bedah"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Moderator:</label>
                <input
                  type="text"
                  value={editingSession.moderator || ''}
                  onChange={(e) => setEditingSession({ ...editingSession, moderator: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  placeholder="Nama dokter moderator jika ada"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Nama Pembicara (Narasumber):</label>
                <input
                  type="text"
                  value={editingSession.speakers?.[0]?.name || ''}
                  onChange={(e) => {
                    const spName = e.target.value;
                    const updatedSpeakers = spName ? [{
                      id: editingSession.speakers?.[0]?.id || `sp-${Date.now()}`,
                      name: spName,
                      title: editingSession.speakers?.[0]?.title || 'Dokter Spesialis / Konsultan',
                      institution: editingSession.speakers?.[0]?.institution || 'Asosiasi Profesi',
                      photoUrl: editingSession.speakers?.[0]?.photoUrl || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80',
                      bio: `Narasumber ahli pada sesi ilmiah.`,
                      specialty: editingSession.category,
                      talkTitle: editingSession.title
                    }] : [];
                    setEditingSession({ ...editingSession, speakers: updatedSpeakers });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  placeholder="dr. / drh. / Prof. ..."
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Latar Belakang / Ringkasan Abstrak:</label>
                <textarea
                  value={editingSession.abstract?.background || ''}
                  onChange={(e) => setEditingSession({
                    ...editingSession,
                    abstract: {
                      ...editingSession.abstract,
                      background: e.target.value
                    }
                  })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white h-20 resize-none"
                  placeholder="Penjelasan singkat latar belakang materi klinis..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingSession(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveEditedSession}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan Sesi</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
