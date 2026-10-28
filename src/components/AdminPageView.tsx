import React, { useState } from 'react';
import { 
  Users, 
  Calendar, 
  Stethoscope, 
  FileText, 
  Store, 
  MapPin, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  RotateCcw, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Search, 
  Building, 
  Clock, 
  Sparkles, 
  ShieldCheck, 
  Eye, 
  ArrowLeft,
  ChevronRight,
  Sliders,
  Check,
  UserCheck,
  FileSpreadsheet,
  Settings,
  LogOut,
  Megaphone,
  Radio,
  BarChart3
} from 'lucide-react';
import { Speaker, Session, Exhibitor, Room, Participant, SymposiumInfo, BroadcastNotification, AttendanceRecord } from '../types';
import { AdminParticipantsManager } from './admin/AdminParticipantsManager';
import { SessionImportExportModal } from './admin/SessionImportExportModal';
import { AdminEventSettings } from './admin/AdminEventSettings';
import { AdminBroadcastManager } from './admin/AdminBroadcastManager';
import { AdminAnalyticsDashboard } from './admin/AdminAnalyticsDashboard';
import { AdminAiPdfScheduleExtractor } from './admin/AdminAiPdfScheduleExtractor';
import { 
  MUNAS_SESSIONS, 
  MUNAS_SPEAKERS, 
  MUNAS_ROOMS, 
  MUNAS_ADHPHKI_EVENT_INFO 
} from '../data/munasAdhphkiData';

type AdminTab = 'analytics' | 'ai_pdf' | 'event' | 'broadcast' | 'speakers' | 'symposium' | 'workshop' | 'abstracts' | 'pameran' | 'ruangan' | 'participants';

interface AdminPageViewProps {
  eventInfo: SymposiumInfo;
  onSaveEventInfo: (info: SymposiumInfo) => void;
  speakers: Speaker[];
  onSaveSpeakers: (speakers: Speaker[]) => void;
  sessions: Session[];
  onSaveSessions: (sessions: Session[]) => void;
  exhibitors: Exhibitor[];
  onSaveExhibitors: (exhibitors: Exhibitor[]) => void;
  rooms: Room[];
  onSaveRooms: (rooms: Room[]) => void;
  participants: Participant[];
  onSaveParticipants: (participants: Participant[]) => void;
  activeParticipant: Participant;
  onSetActiveParticipant: (participant: Participant) => void;
  onResetToDefault: () => void;
  onBackToApp: () => void;
  onLogout?: () => void;
  onSendBroadcast: (broadcast: BroadcastNotification) => void;
  onClearActiveBroadcast: () => void;
  activeBroadcast: BroadcastNotification | null;
  attendances?: AttendanceRecord[];
  bookmarks?: string[];
}

// Sample doctor avatar presets for quick input convenience
const DOCTOR_AVATAR_PRESETS = [
  { label: 'Dokter Pria 1', url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80' },
  { label: 'Dokter Wanita 1', url: 'https://images.unsplash.com/photo-1594824813566-88855ce78347?w=400&auto=format&fit=crop&q=80' },
  { label: 'Dokter Pria 2', url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&auto=format&fit=crop&q=80' },
  { label: 'Dokter Wanita 2', url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80' },
  { label: 'Dokter Pria 3', url: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&auto=format&fit=crop&q=80' },
  { label: 'Dokter Wanita 3', url: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&auto=format&fit=crop&q=80' },
];

export const AdminPageView: React.FC<AdminPageViewProps> = ({
  eventInfo,
  onSaveEventInfo,
  speakers,
  onSaveSpeakers,
  sessions,
  onSaveSessions,
  exhibitors,
  onSaveExhibitors,
  rooms,
  onSaveRooms,
  participants,
  onSaveParticipants,
  activeParticipant,
  onSetActiveParticipant,
  onResetToDefault,
  onBackToApp,
  onLogout,
  onSendBroadcast,
  onClearActiveBroadcast,
  activeBroadcast,
  attendances = [],
  bookmarks = []
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('analytics');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // SESSIONS CSV / JSON IMPORT & EXPORT MODAL STATE
  const [isSessionImportExportModalOpen, setIsSessionImportExportModalOpen] = useState<boolean>(false);
  const [sessionModalMode, setSessionModalMode] = useState<'export' | 'import'>('export');
  const [sessionModalFilter, setSessionModalFilter] = useState<'all' | 'symposium' | 'workshop'>('all');

  const handleOpenSessionImportExport = (mode: 'export' | 'import', filter: 'all' | 'symposium' | 'workshop' = 'all') => {
    setSessionModalMode(mode);
    setSessionModalFilter(filter);
    setIsSessionImportExportModalOpen(true);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // -------------------------------------------------------------
  // 1. SPEAKER MANAGEMENT
  // -------------------------------------------------------------
  const [isSpeakerModalOpen, setIsSpeakerModalOpen] = useState<boolean>(false);
  const [editingSpeakerId, setEditingSpeakerId] = useState<string | null>(null);
  const [speakerForm, setSpeakerForm] = useState<Omit<Speaker, 'id'>>({
    name: '',
    title: '',
    institution: '',
    photoUrl: DOCTOR_AVATAR_PRESETS[0].url,
    specialty: 'Kardiologi',
    bio: '',
    email: '',
    talkTitle: ''
  });

  const handleOpenSpeakerModal = (speaker?: Speaker) => {
    if (speaker) {
      setEditingSpeakerId(speaker.id);
      setSpeakerForm({
        name: speaker.name,
        title: speaker.title,
        institution: speaker.institution,
        photoUrl: speaker.photoUrl,
        specialty: speaker.specialty,
        bio: speaker.bio,
        email: speaker.email || '',
        talkTitle: speaker.talkTitle || ''
      });
    } else {
      setEditingSpeakerId(null);
      setSpeakerForm({
        name: '',
        title: 'Spesialis / Konsultan',
        institution: 'RSUPN Dr. Cipto Mangunkusumo, Jakarta',
        photoUrl: DOCTOR_AVATAR_PRESETS[Math.floor(Math.random() * DOCTOR_AVATAR_PRESETS.length)].url,
        specialty: 'Kardiologi',
        bio: '',
        email: '',
        talkTitle: ''
      });
    }
    setIsSpeakerModalOpen(true);
  };

  const handleSaveSpeaker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!speakerForm.name.trim()) return;

    if (editingSpeakerId) {
      // Update existing
      const updated = speakers.map(sp => 
        sp.id === editingSpeakerId ? { ...speakerForm, id: editingSpeakerId } : sp
      );
      onSaveSpeakers(updated);
      showToast(`Speaker "${speakerForm.name}" berhasil diperbarui.`);
    } else {
      // Create new
      const newSpeaker: Speaker = {
        ...speakerForm,
        id: `sp-${Date.now()}`
      };
      onSaveSpeakers([newSpeaker, ...speakers]);
      showToast(`Speaker "${speakerForm.name}" berhasil ditambahkan.`);
    }
    setIsSpeakerModalOpen(false);
  };

  const handleDeleteSpeaker = (id: string, name: string) => {
    onSaveSpeakers(speakers.filter(s => s.id !== id));
    showToast(`Speaker "${name}" telah dihapus.`);
  };

  // -------------------------------------------------------------
  // 2. SYMPOSIUM & WORKSHOP SESSION MANAGEMENT
  // -------------------------------------------------------------
  const [isSessionModalOpen, setIsSessionModalOpen] = useState<boolean>(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [sessionFormType, setSessionFormType] = useState<'symposium' | 'workshop'>('symposium');

  const [sessionForm, setSessionForm] = useState<Omit<Session, 'id'>>({
    day: 'Workshop (28 Nov)',
    date: 'Sabtu, 28 November 2026',
    startTime: '08:00',
    endTime: '17:00',
    timeString: '08:00 - 17:00 WIB',
    title: '',
    category: 'Workshop Pre-Congress',
    type: 'Workshop Hands-On',
    room: rooms[0]?.name || 'Antareja Room',
    floor: rooms[0]?.floor || 'Ground Floor',
    roomColor: 'bg-amber-600',
    moderator: '',
    speakers: [],
    abstract: {
      background: '',
      clinicalUpdates: ['', '', ''],
      conclusion: ''
    },
    keyTakeaways: [],
    capacity: 60
  });

  const handleOpenSessionModal = (targetType: 'symposium' | 'workshop', session?: Session) => {
    setSessionFormType(targetType);
    if (session) {
      setEditingSessionId(session.id);
      setSessionForm({
        day: session.day,
        date: session.date,
        startTime: session.startTime,
        endTime: session.endTime,
        timeString: session.timeString,
        title: session.title,
        category: session.category,
        type: session.type,
        room: session.room,
        floor: session.floor,
        roomColor: session.roomColor,
        moderator: session.moderator,
        speakers: [...session.speakers],
        abstract: {
          background: session.abstract.background,
          clinicalUpdates: [...session.abstract.clinicalUpdates],
          conclusion: session.abstract.conclusion
        },
        keyTakeaways: session.keyTakeaways ? [...session.keyTakeaways] : [],
        capacity: session.capacity || (targetType === 'workshop' ? 50 : 250)
      });
    } else {
      setEditingSessionId(null);
      const isWs = targetType === 'workshop';
      const defaultRoom = isWs 
        ? rooms.find(r => r.id === 'Antareja Room' || r.type === 'workshop') || rooms[0]
        : rooms.find(r => r.type === 'ballroom' || r.type === 'hall') || rooms[0];

      setSessionForm({
        day: isWs ? 'Workshop (28 Nov)' : 'Hari I',
        date: isWs ? 'Sabtu, 28 November 2026' : 'Minggu, 29 November 2026',
        startTime: isWs ? '08:00' : '09:00',
        endTime: isWs ? '17:00' : '10:30',
        timeString: isWs ? '08:00 - 17:00 WIB' : '09:00 - 10:30 WIB',
        title: isWs ? 'Workshop Hands-On: Keterampilan Veteriner Klinis' : 'Simposium Klinis KIVNAHK IV & MUNAS V ADHPHKI',
        category: isWs ? 'Workshop Pre-Congress' : 'Onkologi & Bedah',
        type: isWs ? 'Workshop Hands-On' : 'Simposium Paralel',
        room: defaultRoom?.name || 'Antareja Room',
        floor: defaultRoom?.floor || 'Ground Floor',
        roomColor: isWs ? 'bg-amber-600' : 'bg-indigo-600',
        moderator: 'drh. Moderator Sesi',
        speakers: speakers.length > 0 ? [speakers[0]] : [],
        abstract: {
          background: isWs 
            ? 'Pelatihan hands-on intensif dengan panduan klinis veteriner terkini dan simulasi keterampilan langsung.' 
            : 'Pembahasan menyeluruh mengenai pembaruan diagnosis dan tata laksana klinis hewan kecil berbasis bukti.',
          clinicalUpdates: [
            'Stasiun 1: Kalibrasi alat diagnostik & instrumen bedah.',
            'Stasiun 2: Prosedur simulasi kasus gawat darurat & triase.',
            'Stasiun 3: Interpretasi data & keputusan terapi cepat.'
          ],
          conclusion: 'Peserta diharapkan mampu menerapkan keterampilan praktis secara mandiri pada fasilitas klinik hewan.'
        },
        keyTakeaways: ['Evidence-Based Protocol', 'Hands-On Skill Certification', 'Direct Expert Guidance'],
        capacity: isWs ? 60 : 350
      });
    }
    setIsSessionModalOpen(true);
  };

  const handleSaveSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionForm.title.trim()) return;

    // recalculate timeString
    const fullTimeString = `${sessionForm.startTime} - ${sessionForm.endTime} WIB`;
    const selectedRoomObj = rooms.find(r => r.name === sessionForm.room || r.id === sessionForm.room);
    const resolvedFloor = selectedRoomObj ? selectedRoomObj.floor : sessionForm.floor;

    const payload: Session = {
      ...sessionForm,
      id: editingSessionId || `session-${Date.now()}`,
      timeString: fullTimeString,
      floor: resolvedFloor
    };

    if (editingSessionId) {
      onSaveSessions(sessions.map(s => s.id === editingSessionId ? payload : s));
      showToast(`Sesi "${payload.title}" berhasil diperbarui.`);
    } else {
      onSaveSessions([payload, ...sessions]);
      showToast(`Sesi "${payload.title}" berhasil ditambahkan.`);
    }
    setIsSessionModalOpen(false);
  };

  const handleDeleteSession = (id: string, title: string) => {
    onSaveSessions(sessions.filter(s => s.id !== id));
    showToast(`Sesi "${title}" telah dihapus.`);
  };

  // Toggle speaker selection for session
  const toggleSpeakerInSession = (sp: Speaker) => {
    const exists = sessionForm.speakers.some(s => s.id === sp.id);
    if (exists) {
      setSessionForm({
        ...sessionForm,
        speakers: sessionForm.speakers.filter(s => s.id !== sp.id)
      });
    } else {
      setSessionForm({
        ...sessionForm,
        speakers: [...sessionForm.speakers, sp]
      });
    }
  };

  // -------------------------------------------------------------
  // 3. ABSTRACT SPEAKER MANAGEMENT
  // -------------------------------------------------------------
  const [selectedSessionForAbstract, setSelectedSessionForAbstract] = useState<Session | null>(
    sessions[0] || null
  );
  const [abstractBackground, setAbstractBackground] = useState<string>(
    selectedSessionForAbstract?.abstract.background || ''
  );
  const [abstractUpdates, setAbstractUpdates] = useState<string[]>(
    selectedSessionForAbstract?.abstract.clinicalUpdates || ['', '', '']
  );
  const [abstractConclusion, setAbstractConclusion] = useState<string>(
    selectedSessionForAbstract?.abstract.conclusion || ''
  );

  const handleSelectSessionForAbstract = (s: Session) => {
    setSelectedSessionForAbstract(s);
    setAbstractBackground(s.abstract.background);
    setAbstractUpdates(s.abstract.clinicalUpdates && s.abstract.clinicalUpdates.length > 0 
      ? [...s.abstract.clinicalUpdates] 
      : ['', '', '']
    );
    setAbstractConclusion(s.abstract.conclusion);
  };

  const handleSaveAbstract = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionForAbstract) return;

    const filteredUpdates = abstractUpdates.filter(u => u.trim() !== '');

    const updatedSessions = sessions.map(s => {
      if (s.id === selectedSessionForAbstract.id) {
        return {
          ...s,
          abstract: {
            background: abstractBackground,
            clinicalUpdates: filteredUpdates,
            conclusion: abstractConclusion
          }
        };
      }
      return s;
    });

    onSaveSessions(updatedSessions);
    showToast(`Abstrak untuk sesi "${selectedSessionForAbstract.title}" berhasil disimpan.`);
  };

  // -------------------------------------------------------------
  // 4. PAMERAN / EXHIBITORS MANAGEMENT
  // -------------------------------------------------------------
  const [isExhibitorModalOpen, setIsExhibitorModalOpen] = useState<boolean>(false);
  const [editingExhibitorId, setEditingExhibitorId] = useState<string | null>(null);
  const [exhibitorForm, setExhibitorForm] = useState<Omit<Exhibitor, 'id'>>({
    name: '',
    boothNumber: '',
    category: 'Farmasi',
    zone: 'Zona A (Main Pharma Hall)',
    tagline: '',
    description: '',
    featuredProducts: [],
    contactEmail: '',
    website: '',
    phone: '',
    demoSchedule: '',
    highlight: ''
  });
  const [productsRaw, setProductsRaw] = useState<string>('');

  const handleOpenExhibitorModal = (exhibitor?: Exhibitor) => {
    if (exhibitor) {
      setEditingExhibitorId(exhibitor.id);
      setExhibitorForm({
        name: exhibitor.name,
        boothNumber: exhibitor.boothNumber,
        category: exhibitor.category,
        zone: exhibitor.zone,
        tagline: exhibitor.tagline,
        description: exhibitor.description,
        featuredProducts: exhibitor.featuredProducts,
        contactEmail: exhibitor.contactEmail || '',
        website: exhibitor.website || '',
        phone: exhibitor.phone || '',
        demoSchedule: exhibitor.demoSchedule || '',
        highlight: exhibitor.highlight || ''
      });
      setProductsRaw(exhibitor.featuredProducts.join(', '));
    } else {
      setEditingExhibitorId(null);
      setExhibitorForm({
        name: '',
        boothNumber: 'A-05',
        category: 'Farmasi',
        zone: 'Zona A (Main Pharma Hall)',
        tagline: 'Inovasi Terapi Medis Terdepan',
        description: '',
        featuredProducts: [],
        contactEmail: 'info@perusahaan.co.id',
        website: 'https://www.perusahaan.co.id',
        phone: '+62 21 555 1234',
        demoSchedule: 'Pukul 11:00 WIB: Live Demo & Diskusi',
        highlight: 'Sample Produk Medis Gratis'
      });
      setProductsRaw('Produk Farmasi A, Produk Diagnostik B, Terapi C');
    }
    setIsExhibitorModalOpen(true);
  };

  const handleSaveExhibitor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exhibitorForm.name.trim() || !exhibitorForm.boothNumber.trim()) return;

    const prods = productsRaw
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0);

    const payload: Exhibitor = {
      ...exhibitorForm,
      featuredProducts: prods,
      id: editingExhibitorId || `ex-${Date.now()}`
    };

    if (editingExhibitorId) {
      onSaveExhibitors(exhibitors.map(ex => ex.id === editingExhibitorId ? payload : ex));
      showToast(`Booth "${payload.name}" berhasil diperbarui.`);
    } else {
      onSaveExhibitors([payload, ...exhibitors]);
      showToast(`Booth "${payload.name}" berhasil ditambahkan.`);
    }
    setIsExhibitorModalOpen(false);
  };

  const handleDeleteExhibitor = (id: string, name: string) => {
    onSaveExhibitors(exhibitors.filter(e => e.id !== id));
    showToast(`Booth pameran "${name}" telah dihapus.`);
  };

  // -------------------------------------------------------------
  // 5. RUANGAN / ROOMS MANAGEMENT
  // -------------------------------------------------------------
  const [isRoomModalOpen, setIsRoomModalOpen] = useState<boolean>(false);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [roomForm, setRoomForm] = useState<Omit<Room, 'id'>>({
    name: '',
    shortName: '',
    floor: 'Lantai 1',
    capacity: 100,
    description: '',
    facilities: [],
    type: 'hall',
    color: 'bg-blue-500',
    badgeBg: 'bg-blue-600 text-white'
  });
  const [facilitiesRaw, setFacilitiesRaw] = useState<string>('');

  const handleOpenRoomModal = (room?: Room) => {
    if (room) {
      setEditingRoomId(room.id);
      setRoomForm({
        name: room.name,
        shortName: room.shortName,
        floor: room.floor,
        capacity: room.capacity,
        description: room.description,
        facilities: room.facilities,
        type: room.type,
        color: room.color || 'bg-blue-500',
        badgeBg: room.badgeBg || 'bg-blue-600 text-white'
      });
      setFacilitiesRaw(room.facilities.join(', '));
    } else {
      setEditingRoomId(null);
      setRoomForm({
        name: 'Hall Baru Simposium',
        shortName: 'Hall Baru',
        floor: 'Lantai 2',
        capacity: 150,
        description: 'Ruang simposium dilengkapi fasilitas audio visual canggih.',
        facilities: ['Layar Proyektor HD', 'Sound System', 'AC Sentral', 'WiFi Cepat'],
        type: 'hall',
        color: 'bg-indigo-500',
        badgeBg: 'bg-indigo-600 text-white'
      });
      setFacilitiesRaw('Layar Proyektor HD, Sound System, AC Sentral, WiFi Cepat');
    }
    setIsRoomModalOpen(true);
  };

  const handleSaveRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomForm.name.trim()) return;

    const facs = facilitiesRaw
      .split(',')
      .map(f => f.trim())
      .filter(f => f.length > 0);

    const payload: Room = {
      ...roomForm,
      facilities: facs,
      id: editingRoomId || `room-${Date.now()}`
    };

    if (editingRoomId) {
      onSaveRooms(rooms.map(r => r.id === editingRoomId ? payload : r));
      showToast(`Ruangan "${payload.name}" berhasil diperbarui.`);
    } else {
      onSaveRooms([...rooms, payload]);
      showToast(`Ruangan "${payload.name}" berhasil ditambahkan.`);
    }
    setIsRoomModalOpen(false);
  };

  const handleDeleteRoom = (id: string, name: string) => {
    onSaveRooms(rooms.filter(r => r.id !== id));
    showToast(`Ruangan "${name}" telah dihapus.`);
  };

  // -------------------------------------------------------------
  // EXPORT / IMPORT JSON
  // -------------------------------------------------------------
  const handleExportJSON = () => {
    const bundle = {
      exportDate: new Date().toISOString(),
      symposiumVersion: '2026.1',
      speakers,
      sessions,
      exhibitors,
      rooms
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(bundle, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `data_simposium_kedokteran_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("File data simposium berhasil diekspor ke JSON!");
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.speakers && Array.isArray(parsed.speakers)) onSaveSpeakers(parsed.speakers);
        if (parsed.sessions && Array.isArray(parsed.sessions)) onSaveSessions(parsed.sessions);
        if (parsed.exhibitors && Array.isArray(parsed.exhibitors)) onSaveExhibitors(parsed.exhibitors);
        if (parsed.rooms && Array.isArray(parsed.rooms)) onSaveRooms(parsed.rooms);
        showToast("Data simposium berhasil dipulihkan dari file JSON!");
      } catch (err) {
        showToast("Gagal membaca file JSON. Pastikan format file valid.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Categorize sessions
  const symposiumSessions = sessions.filter(s => s.type !== 'Workshop Hands-On' && !s.category.includes('Workshop'));
  const workshopSessions = sessions.filter(s => s.type === 'Workshop Hands-On' || s.category.includes('Workshop'));

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-16">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs sm:text-sm font-bold animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Top Bar */}
      <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToApp}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors flex items-center gap-1 text-xs font-bold"
              title="Kembali ke portal simposium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Kembali ke Portal</span>
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                  ADMIN PANEL
                </span>
                <span className="text-xs text-slate-400 font-semibold truncate max-w-[200px] sm:max-w-none">
                  {eventInfo?.title || 'Simposium Kedokteran 2026'}
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-black text-white leading-tight">
                Kelola & Input Data Simposium
              </h1>
            </div>
          </div>

          {/* Action buttons: Reset, Export, Import, Broadcast */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={() => { setActiveAdminTab('ai_pdf'); setSearchTerm(''); }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
                activeAdminTab === 'ai_pdf'
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 text-white font-black shadow-md'
                  : 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40'
              }`}
              title="Ekstrak jadwal simposium dari dokumen PDF secara otomatis dengan AI Gemini"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Ekstraksi AI PDF</span>
            </button>

            <button
              onClick={() => { setActiveAdminTab('broadcast'); setSearchTerm(''); }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shadow-xs flex items-center gap-1.5 ${
                activeAdminTab === 'broadcast'
                  ? 'bg-amber-400 text-slate-950 font-black'
                  : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/30'
              }`}
              title="Kirim pesan notifikasi siaran (toast) ke seluruh peserta"
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span>Broadcast Toast</span>
              {activeBroadcast && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              )}
            </button>

            <button
              onClick={() => handleOpenSessionImportExport('import', 'all')}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-xs flex items-center gap-1.5"
              title="Unggah dan impor jadwal sesi dari file CSV atau JSON"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Impor Jadwal (CSV/JSON)</span>
            </button>

            <button
              onClick={() => handleOpenSessionImportExport('export', 'all')}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold border border-slate-700 transition-colors flex items-center gap-1.5"
              title="Unduh dan ekspor jadwal sesi ke CSV atau JSON"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Ekspor Jadwal</span>
            </button>

            <button
              onClick={handleExportJSON}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 font-bold border border-slate-800 transition-colors flex items-center gap-1"
              title="Ekspor seluruh database aplikasi ke JSON lengkap"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Cadangan Penuh</span>
            </button>

            <button
              onClick={() => {
                onResetToDefault();
                showToast("Seluruh data telah di-reset ke data awal.");
              }}
              className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/25 text-rose-300 font-bold border border-rose-500/30 transition-colors flex items-center gap-1 cursor-pointer"
              title="Kembalikan semua data ke setelan awal bawaan"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Awal</span>
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-rose-300 hover:text-rose-200 font-bold border border-slate-700 hover:border-rose-500/40 transition-colors flex items-center gap-1.5"
                title="Keluar dari sesi Administrator"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>Keluar Admin</span>
              </button>
            )}
          </div>

        </div>

        {/* PDF Import Notification Banner */}
        <div className="max-w-7xl mx-auto px-4 pt-3 pb-1">
          <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/80 border border-emerald-500/30 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0 mt-0.5">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-white">
                    File PDF Terdeteksi: Time Table Day 1.pdf
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    MUNAS 5 ADHPHKI & KIVNAHK 4 (29 Nov 2026)
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Jadwal 12 sesi lengkap (Plenary WSAVA Mastectomy, Parallel Session Oncology Dr. Ivan Satriawan di Ballroom Amartapura B, hingga Sidang Pleno Munas) siap diekstrak oleh AI dan diimpor ke database aplikasi secara otomatis.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                onClick={() => { setActiveAdminTab('ai_pdf'); setSearchTerm(''); }}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white text-xs font-black shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Buka AI Extractor (Gemini)</span>
              </button>

              <button
                onClick={() => {
                  onSaveSessions(MUNAS_SESSIONS);
                  if (onSaveRooms) onSaveRooms(MUNAS_ROOMS);
                  if (onSaveSpeakers) onSaveSpeakers(Object.values(MUNAS_SPEAKERS));
                  if (onSaveEventInfo) onSaveEventInfo(MUNAS_ADHPHKI_EVENT_INFO);
                  showToast("Jadwal & Master KIVNAHK IV & MUNAS V ADHPHKI (2 Workshop 28 Nov, Ballroom Amartapura A & B, Antareja & Wisanggeni Room) berhasil diterapkan!");
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                title="Terapkan jadwal lengkap KIVNAHK IV & MUNAS V ADHPHKI (28 Nov - 1 Des 2026), Master Ruangan, dan Master Acara"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                <span>Terapkan KIVNAHK IV & MUNAS V Lengkap</span>
              </button>

              <button
                onClick={() => handleOpenSessionImportExport('import', 'all')}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
              >
                <span>Lihat Preview Impor</span>
              </button>
            </div>
          </div>
        </div>

        {/* Category Tabs: Event Settings + Broadcast + Content Tabs */}
        <div className="max-w-7xl mx-auto px-4 overflow-x-auto no-scrollbar border-t border-slate-800/80">
          <div className="flex space-x-1 py-2">
            
            <button
              id="admin-tab-analytics"
              onClick={() => { setActiveAdminTab('analytics'); setSearchTerm(''); }}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeAdminTab === 'analytics'
                  ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-md font-black'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <BarChart3 className={`w-4 h-4 ${activeAdminTab === 'analytics' ? 'text-white' : 'text-indigo-400'}`} />
              <span>Dashboard Analitik</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeAdminTab === 'analytics' ? 'bg-white/20 text-white' : 'bg-indigo-500/20 text-indigo-300'
              }`}>
                Grafik
              </span>
            </button>

            <button
              id="admin-tab-ai-pdf"
              onClick={() => { setActiveAdminTab('ai_pdf'); setSearchTerm(''); }}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeAdminTab === 'ai_pdf'
                  ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white shadow-md font-black'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Sparkles className={`w-4 h-4 ${activeAdminTab === 'ai_pdf' ? 'text-amber-300' : 'text-emerald-400'}`} />
              <span>Ekstraksi AI dari PDF</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-amber-400 text-slate-950">
                AI
              </span>
            </button>

            <button
              id="admin-tab-event"
              onClick={() => { setActiveAdminTab('event'); setSearchTerm(''); }}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeAdminTab === 'event'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Settings className="w-4 h-4 text-indigo-400" />
              <span>Pengaturan Event</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-500/30 text-indigo-200 font-black">
                Info
              </span>
            </button>

            <button
              id="admin-tab-broadcast"
              onClick={() => { setActiveAdminTab('broadcast'); setSearchTerm(''); }}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeAdminTab === 'broadcast'
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black shadow-xs'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Megaphone className={`w-4 h-4 ${activeAdminTab === 'broadcast' ? 'text-slate-950' : 'text-amber-400'}`} />
              <span>Broadcast Notifikasi</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeAdminTab === 'broadcast' ? 'bg-slate-950/20 text-slate-950' : 'bg-amber-500/20 text-amber-300'
              }`}>
                Toast
              </span>
              {activeBroadcast && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              )}
            </button>

            <button
              id="admin-tab-speakers"
              onClick={() => { setActiveAdminTab('speakers'); setSearchTerm(''); }}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeAdminTab === 'speakers'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4 text-blue-400" />
              <span>Daftar Speaker</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-black">
                {speakers.length}
              </span>
            </button>

            <button
              id="admin-tab-symposium"
              onClick={() => { setActiveAdminTab('symposium'); setSearchTerm(''); }}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeAdminTab === 'symposium'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>Jadwal Symposium</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-black">
                {symposiumSessions.length}
              </span>
            </button>

            <button
              id="admin-tab-workshop"
              onClick={() => { setActiveAdminTab('workshop'); setSearchTerm(''); }}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeAdminTab === 'workshop'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Stethoscope className="w-4 h-4 text-emerald-400" />
              <span>Jadwal Workshop</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-black">
                {workshopSessions.length}
              </span>
            </button>

            <button
              id="admin-tab-abstracts"
              onClick={() => { setActiveAdminTab('abstracts'); setSearchTerm(''); }}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeAdminTab === 'abstracts'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Abstract Speaker</span>
            </button>

            <button
              id="admin-tab-pameran"
              onClick={() => { setActiveAdminTab('pameran'); setSearchTerm(''); }}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeAdminTab === 'pameran'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Store className="w-4 h-4 text-orange-400" />
              <span>Pameran</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-black">
                {exhibitors.length}
              </span>
            </button>

            <button
              id="admin-tab-ruangan"
              onClick={() => { setActiveAdminTab('ruangan'); setSearchTerm(''); }}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeAdminTab === 'ruangan'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <MapPin className="w-4 h-4 text-rose-400" />
              <span>Daftar Ruangan</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-black">
                {rooms.length}
              </span>
            </button>

            <button
              id="admin-tab-participants"
              onClick={() => { setActiveAdminTab('participants'); setSearchTerm(''); }}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeAdminTab === 'participants'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Peserta & Email</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-black">
                {participants.length}
              </span>
            </button>

          </div>
        </div>
      </header>

      {/* Main Admin Content Container */}
      <main className="max-w-7xl mx-auto px-4 pt-6 space-y-6">

        {/* ------------------------------------------------------------- */}
        {/* SECTION -3: DASHBOARD ANALITIK DENGAN GRAFIK RECHARTS */}
        {/* ------------------------------------------------------------- */}
        {activeAdminTab === 'analytics' && (
          <AdminAnalyticsDashboard
            sessions={sessions}
            participants={participants}
            attendances={attendances}
            bookmarks={bookmarks}
            onShowToast={showToast}
            onNavigateToSessionTab={(type) => {
              setActiveAdminTab(type as AdminTab);
              setSearchTerm('');
            }}
          />
        )}

        {/* ------------------------------------------------------------- */}
        {/* SECTION -2.5: EKSTRAKSI JADWAL PDF DENGAN AI GEMINI */}
        {/* ------------------------------------------------------------- */}
        {activeAdminTab === 'ai_pdf' && (
          <AdminAiPdfScheduleExtractor
            sessions={sessions}
            onSaveSessions={onSaveSessions}
            speakers={speakers}
            onSaveSpeakers={onSaveSpeakers}
            rooms={rooms}
            onSaveRooms={onSaveRooms}
            eventInfo={eventInfo}
            onSaveEventInfo={onSaveEventInfo}
            onShowToast={showToast}
            onNavigateTab={(tab) => {
              setActiveAdminTab(tab as AdminTab);
              setSearchTerm('');
            }}
          />
        )}

        {/* ------------------------------------------------------------- */}
        {/* SECTION -2: BROADCAST NOTIFIKASI PANITIA */}
        {/* ------------------------------------------------------------- */}
        {activeAdminTab === 'broadcast' && (
          <AdminBroadcastManager
            onSendBroadcast={onSendBroadcast}
            onClearActiveBroadcast={onClearActiveBroadcast}
            activeBroadcast={activeBroadcast}
            onShowToast={showToast}
          />
        )}

        {/* ------------------------------------------------------------- */}
        {/* SECTION -1: PENGATURAN EVENT (NAMA, TANGGAL, LOGO, TEMPAT) */}
        {/* ------------------------------------------------------------- */}
        {activeAdminTab === 'event' && (
          <AdminEventSettings
            eventInfo={eventInfo}
            onSaveEventInfo={onSaveEventInfo}
            onShowToast={showToast}
          />
        )}

        {/* ------------------------------------------------------------- */}
        {/* SECTION 0: PESERTA & DATA EMAIL */}
        {/* ------------------------------------------------------------- */}
        {activeAdminTab === 'participants' && (
          <AdminParticipantsManager
            participants={participants}
            onParticipantsChange={onSaveParticipants}
            activeParticipant={activeParticipant}
            onSetActiveParticipant={onSetActiveParticipant}
            onShowToast={showToast}
          />
        )}

        {/* ------------------------------------------------------------- */}
        {/* SECTION 1: DAFTAR SPEAKER */}
        {/* ------------------------------------------------------------- */}
        {activeAdminTab === 'speakers' && (
          <div className="space-y-4">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  Manajemen Daftar Speaker & Narasumber
                </h2>
                <p className="text-xs text-slate-400">
                  Input data profil pembicara, gelar akademis, institusi tempat bertugas, keahlian subspesialis, dan topik materi.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenSpeakerModal()}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Speaker Baru</span>
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Cari narasumber berdasarkan nama, spesialisasi, atau institusi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs sm:text-sm pl-9 pr-3 py-2.5 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Speakers List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {speakers
                .filter(sp => 
                  sp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  sp.institution.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  sp.specialty.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((sp) => (
                  <div 
                    key={sp.id}
                    className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-slate-700 transition-all shadow-xs"
                  >
                    <div className="flex items-start gap-3">
                      <img 
                        src={sp.photoUrl} 
                        alt={sp.name} 
                        className="w-14 h-14 rounded-xl object-cover bg-slate-800 border border-slate-700 shrink-0" 
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 uppercase">
                          {sp.specialty}
                        </span>
                        <h3 className="text-sm font-bold text-white mt-1 leading-tight line-clamp-2">
                          {sp.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {sp.title}
                        </p>
                        <p className="text-[11px] text-slate-500 line-clamp-1 flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3 text-slate-400 shrink-0" />
                          {sp.institution}
                        </p>
                      </div>
                    </div>

                    {sp.talkTitle && (
                      <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80 text-[11px] text-slate-300">
                        <span className="font-extrabold text-blue-400 block mb-0.5">Materi Kuliah / Sesi:</span>
                        <p className="line-clamp-2 leading-relaxed">{sp.talkTitle}</p>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-slate-500 font-mono">ID: {sp.id}</span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenSpeakerModal(sp)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteSpeaker(sp.id, sp.name)}
                          className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition-colors"
                          title="Hapus speaker"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* SECTION 2: JADWAL SYMPOSIUM */}
        {/* ------------------------------------------------------------- */}
        {activeAdminTab === 'symposium' && (
          <div className="space-y-4">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-400" />
                  Manajemen Jadwal Symposium Ilmiah
                </h2>
                <p className="text-xs text-slate-400">
                  Input sesi plenary, keynote, simposium paralel spesialisasi, alokasi ruangan, moderator, dan jadwal waktu.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onSaveSessions(MUNAS_SESSIONS);
                    if (onSaveRooms) onSaveRooms(MUNAS_ROOMS);
                    if (onSaveSpeakers) onSaveSpeakers(Object.values(MUNAS_SPEAKERS));
                    if (onSaveEventInfo) onSaveEventInfo(MUNAS_ADHPHKI_EVENT_INFO);
                    showToast("Jadwal & Master KIVNAHK IV & MUNAS V ADHPHKI berhasil diterapkan!");
                  }}
                  className="px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer"
                  title="Terapkan jadwal lengkap KIVNAHK IV & MUNAS V ADHPHKI (Workshops 28 Nov & Sesi Konferensi), Master Ruangan, dan Master Acara"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  <span>Terapkan KIVNAHK IV & MUNAS V Lengkap</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveAdminTab('ai_pdf'); setSearchTerm(''); }}
                  className="px-3 py-2 bg-gradient-to-r from-emerald-600/25 to-indigo-600/25 hover:from-emerald-600/40 hover:to-indigo-600/40 text-emerald-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-emerald-500/40 shrink-0 cursor-pointer"
                  title="Ekstrak jadwal dari dokumen PDF secara otomatis dengan AI Gemini"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Ekstraksi AI PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenSessionImportExport('import', 'symposium')}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700 shrink-0"
                  title="Impor jadwal simposium dari file CSV atau JSON"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Impor CSV/JSON</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenSessionImportExport('export', 'symposium')}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700 shrink-0"
                  title="Unduh jadwal simposium ke format CSV atau JSON"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Ekspor CSV/JSON</span>
                </button>

                <button
                  onClick={() => handleOpenSessionModal('symposium')}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Sesi Simposium</span>
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Cari sesi simposium berdasarkan judul, kategori, ruangan, atau nama speaker..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs sm:text-sm pl-9 pr-3 py-2.5 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* List */}
            <div className="space-y-3">
              {symposiumSessions
                .filter(s => 
                  s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  s.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  s.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  s.speakers.some(sp => sp.name.toLowerCase().includes(searchTerm.toLowerCase()))
                )
                .map((session) => (
                  <div 
                    key={session.id}
                    className="bg-slate-950 border border-slate-800 rounded-2xl p-4 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-black">
                          {session.day}
                        </span>
                        <span className="text-slate-400 font-semibold">{session.date}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-amber-400 font-bold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {session.timeString}
                        </span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-300 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-rose-400" />
                          {session.room}
                        </span>
                      </div>

                      <h3 className="text-base font-black text-white">
                        {session.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        <span>Kategori: <strong className="text-slate-200">{session.category}</strong></span>
                        <span>•</span>
                        <span>Moderator: <strong className="text-slate-200">{session.moderator || '-'}</strong></span>
                        <span>•</span>
                        <span>Narasumber ({session.speakers.length}): <strong className="text-slate-200">{session.speakers.map(s => s.name.split(',')[0]).join(', ') || 'Belum dipilih'}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
                      <button
                        onClick={() => handleOpenSessionModal('symposium', session)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Edit Sesi</span>
                      </button>

                      <button
                        onClick={() => handleDeleteSession(session.id, session.title)}
                        className="p-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition-colors"
                        title="Hapus sesi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* SECTION 3: JADWAL WORKSHOP */}
        {/* ------------------------------------------------------------- */}
        {activeAdminTab === 'workshop' && (
          <div className="space-y-4">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-emerald-400" />
                  Manajemen Jadwal Workshop (Hands-On Clinical Skills)
                </h2>
                <p className="text-xs text-slate-400">
                  Input sesi workshop praktik hands-on, stasiun simulasi manekin/alat, instruktur konsultan, dan kuota peserta.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setActiveAdminTab('ai_pdf'); setSearchTerm(''); }}
                  className="px-3 py-2 bg-gradient-to-r from-emerald-600/25 to-indigo-600/25 hover:from-emerald-600/40 hover:to-indigo-600/40 text-emerald-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-emerald-500/40 shrink-0 cursor-pointer"
                  title="Ekstrak jadwal dari dokumen PDF secara otomatis dengan AI Gemini"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Ekstraksi AI PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenSessionImportExport('import', 'workshop')}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700 shrink-0"
                  title="Impor jadwal workshop dari file CSV atau JSON"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Impor CSV/JSON</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenSessionImportExport('export', 'workshop')}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700 shrink-0"
                  title="Unduh jadwal workshop ke format CSV atau JSON"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Ekspor CSV/JSON</span>
                </button>

                <button
                  onClick={() => handleOpenSessionModal('workshop')}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Workshop Baru</span>
                </button>
              </div>
            </div>

            {/* List */}
            <div className="space-y-4">
              {workshopSessions.map((ws) => (
                <div 
                  key={ws.id}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 hover:border-emerald-800/80 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-black uppercase">
                        {ws.day} • {ws.type}
                      </span>
                      <span className="text-amber-400 font-bold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {ws.timeString}
                      </span>
                      <span className="text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-400" />
                        {ws.room}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                        Kuota: {ws.capacity || 50} Peserta
                      </span>
                      <button
                        onClick={() => handleOpenSessionModal('workshop', ws)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Edit Workshop</span>
                      </button>
                      <button
                        onClick={() => handleDeleteSession(ws.id, ws.title)}
                        className="p-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition-colors"
                        title="Hapus workshop"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-white">
                    {ws.title}
                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {ws.abstract.background}
                  </p>

                  {/* Stasiun Keterampilan */}
                  <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800/80 space-y-1.5">
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider block">
                      Stasiun Keterampilan / Poin Hands-On ({ws.abstract.clinicalUpdates.length}):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {ws.abstract.clinicalUpdates.map((st, i) => (
                        <div key={i} className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-xs text-slate-300 flex items-start gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <span className="line-clamp-2">{st}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-900 text-xs text-slate-400">
                    <span>Instruktur ({ws.speakers.length}):</span>
                    {ws.speakers.map(sp => (
                      <span key={sp.id} className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 font-semibold border border-slate-800">
                        {sp.name.split(',')[0]}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* SECTION 4: ABSTRACT SPEAKER */}
        {/* ------------------------------------------------------------- */}
        {activeAdminTab === 'abstracts' && (
          <div className="space-y-4">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-400" />
                  Manajemen & Input Abstract Speaker
                </h2>
                <p className="text-xs text-slate-400">
                  Pilih sesi atau materi narasumber untuk mengedit latar belakang klinis (*background*), rangkuman evidence-based updates, dan kesimpulan / key takeaways.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Sesi Selector */}
              <div className="space-y-2">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">
                  Pilih Sesi Simposium / Workshop:
                </span>

                <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
                  {sessions.map((s) => {
                    const isSelected = selectedSessionForAbstract?.id === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => handleSelectSessionForAbstract(s)}
                        className={`w-full text-left p-3 rounded-xl border transition-all text-xs flex flex-col gap-1 ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-500 shadow-md ring-1 ring-blue-400'
                            : 'bg-slate-950 hover:bg-slate-900 text-slate-300 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {s.day} • {s.timeString.split(' ')[0]}
                          </span>
                          <span className="text-[10px] truncate opacity-80">{s.room}</span>
                        </div>
                        <span className="font-bold line-clamp-2 leading-snug">
                          {s.title}
                        </span>
                        <span className="text-[10px] opacity-75">
                          Speaker: {s.speakers.map(sp => sp.name.split(',')[0]).join(', ') || '-'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Abstract Editor Form */}
              <div className="lg:col-span-2">
                {selectedSessionForAbstract ? (
                  <form onSubmit={handleSaveAbstract} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                    
                    <div className="border-b border-slate-800 pb-3">
                      <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider">
                        Editor Abstrak Ilmiah
                      </span>
                      <h3 className="text-base font-black text-white mt-1">
                        {selectedSessionForAbstract.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-400">
                        <span>{selectedSessionForAbstract.category}</span>
                        <span>•</span>
                        <span>{selectedSessionForAbstract.speakers.map(s => s.name).join(' & ')}</span>
                      </div>
                    </div>

                    {/* Latar Belakang (Background) */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-300 block">
                        Latar Belakang Klinis (Clinical Background / Pendahuluan):
                      </label>
                      <textarea
                        rows={4}
                        value={abstractBackground}
                        onChange={(e) => setAbstractBackground(e.target.value)}
                        placeholder="Uraikan latar belakang masalah klinis, urgensi kasus di fasilitas kesehatan, serta tantangan diagnostik saat ini..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500 leading-relaxed"
                        required
                      />
                    </div>

                    {/* Poin-poin Pembahasan (Clinical Updates) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-slate-300">
                          Poin-Poin Pembahasan / Pembaruan Panduan Klinis:
                        </label>
                        <button
                          type="button"
                          onClick={() => setAbstractUpdates([...abstractUpdates, ''])}
                          className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Tambah Poin</span>
                        </button>
                      </div>

                      {abstractUpdates.map((update, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-xs font-bold text-amber-500 w-5 shrink-0 text-center">
                            #{idx + 1}
                          </span>
                          <input
                            type="text"
                            value={update}
                            onChange={(e) => {
                              const copy = [...abstractUpdates];
                              copy[idx] = e.target.value;
                              setAbstractUpdates(copy);
                            }}
                            placeholder={`Poin pembahasan klinis ke-${idx + 1}`}
                            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                          />
                          {abstractUpdates.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                setAbstractUpdates(abstractUpdates.filter((_, i) => i !== idx));
                              }}
                              className="p-2 text-rose-400 hover:bg-rose-500/20 rounded-lg"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Kesimpulan (Conclusion) */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-300 block">
                        Kesimpulan & Clinical Takeaway:
                      </label>
                      <textarea
                        rows={3}
                        value={abstractConclusion}
                        onChange={(e) => setAbstractConclusion(e.target.value)}
                        placeholder="Rangkuman pesan penting untuk dibawa pulang (take-home message) oleh para klinisi dan dokter peserta..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500 leading-relaxed"
                        required
                      />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md"
                      >
                        <Save className="w-4 h-4" />
                        <span>Simpan Perubahan Abstrak</span>
                      </button>
                    </div>

                  </form>
                ) : (
                  <div className="p-8 text-center text-slate-500 bg-slate-950 rounded-2xl border border-slate-800">
                    Pilih sesi di sebelah kiri untuk melihat atau mengedit abstrak.
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* SECTION 5: PAMERAN */}
        {/* ------------------------------------------------------------- */}
        {activeAdminTab === 'pameran' && (
          <div className="space-y-4">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Store className="w-5 h-5 text-orange-400" />
                  Manajemen Booth Pameran Medis (Exhibitors)
                </h2>
                <p className="text-xs text-slate-400">
                  Input data perusahaan farmasi, distributor alat diagnostik, startup teknologi AI kesehatan, dan penerbit buku kedokteran.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenExhibitorModal()}
                  className="px-3.5 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Booth Pameran</span>
                </button>
              </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exhibitors.map((ex) => (
                <div 
                  key={ex.id}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg bg-orange-500/20 text-orange-300 font-black text-xs">
                        BOOTH {ex.boothNumber}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                        {ex.category}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-black text-white">
                        {ex.name}
                      </h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-rose-400" />
                        <span>{ex.zone}</span>
                      </p>
                    </div>

                    <p className="text-xs font-semibold text-amber-300 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                      {ex.tagline}
                    </p>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {ex.description}
                    </p>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {ex.featuredProducts.map((p, i) => (
                        <span key={i} className="text-[10px] bg-slate-900 text-slate-300 px-2 py-0.5 rounded border border-slate-800">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500">
                      {ex.demoSchedule ? 'Ada jadwal demo' : 'Stan regular'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenExhibitorModal(ex)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-orange-400" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteExhibitor(ex.id, ex.name)}
                        className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition-colors"
                        title="Hapus booth"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* SECTION 6: DAFTAR RUANGAN */}
        {/* ------------------------------------------------------------- */}
        {activeAdminTab === 'ruangan' && (
          <div className="space-y-4">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-rose-400" />
                  Manajemen Daftar Ruangan & Fasilitas Simposium
                </h2>
                <p className="text-xs text-slate-400">
                  Input data ruangan ballroom, hall simposium, ruang workshop, kapasitas tempat duduk, fasilitas AV, dan lantai gedung.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenRoomModal()}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Ruangan Baru</span>
                </button>
              </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => (
                <div 
                  key={room.id}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-slate-700 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-xs">
                        {room.floor}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {room.type.toUpperCase()}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-black text-white">
                        {room.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Kapasitas: <strong className="text-slate-200">{room.capacity} Orang</strong>
                      </p>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {room.description}
                    </p>

                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                        Fasilitas Ruangan:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {room.facilities.map((fac, i) => (
                          <span key={i} className="text-[10px] bg-slate-900 text-slate-300 px-2 py-0.5 rounded border border-slate-800">
                            {fac}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-500 font-mono">
                      {room.shortName}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenRoomModal(room)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-rose-400" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteRoom(room.id, room.name)}
                        className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition-colors"
                        title="Hapus ruangan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* ============================================================= */}
      {/* MODAL 1: FORM SPEAKER */}
      {/* ============================================================= */}
      {isSpeakerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span>{editingSpeakerId ? 'Edit Data Speaker' : 'Input Speaker / Narasumber Baru'}</span>
              </h3>
              <button 
                onClick={() => setIsSpeakerModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSpeaker} className="p-4 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm">
              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">Nama Lengkap & Gelar:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Prof. dr. Ahmad Fauzi, Sp.JP(K), FIHA"
                  value={speakerForm.name}
                  onChange={(e) => setSpeakerForm({ ...speakerForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Jabatan / Gelar Profesi:</label>
                  <input
                    type="text"
                    placeholder="Guru Besar Kardiologi / Konsultan Stroke"
                    value={speakerForm.title}
                    onChange={(e) => setSpeakerForm({ ...speakerForm, title: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Bidang Spesialisasi:</label>
                  <input
                    type="text"
                    placeholder="Kardiologi, Neurologi, dll"
                    value={speakerForm.specialty}
                    onChange={(e) => setSpeakerForm({ ...speakerForm, specialty: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">Asal Institusi / Rumah Sakit:</label>
                <input
                  type="text"
                  placeholder="RSUPN Cipto Mangunkusumo / FKUI Jakarta"
                  value={speakerForm.institution}
                  onChange={(e) => setSpeakerForm({ ...speakerForm, institution: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">Foto URL (atau pilih avatar cepat di bawah):</label>
                <input
                  type="url"
                  value={speakerForm.photoUrl}
                  onChange={(e) => setSpeakerForm({ ...speakerForm, photoUrl: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-xs"
                />
                
                {/* Preset Avatar Picker */}
                <div className="flex items-center gap-2 pt-1 overflow-x-auto no-scrollbar">
                  {DOCTOR_AVATAR_PRESETS.map((av, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSpeakerForm({ ...speakerForm, photoUrl: av.url })}
                      className={`relative p-0.5 rounded-lg border shrink-0 ${
                        speakerForm.photoUrl === av.url ? 'border-amber-400 ring-2 ring-amber-400/50' : 'border-slate-800'
                      }`}
                    >
                      <img src={av.url} alt={av.label} className="w-8 h-8 rounded-md object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">Judul Materi Pembahasan:</label>
                <input
                  type="text"
                  placeholder="Judul presentasi / kuliah pakar"
                  value={speakerForm.talkTitle}
                  onChange={(e) => setSpeakerForm({ ...speakerForm, talkTitle: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">Biografi Singkat Narasumber:</label>
                <textarea
                  rows={3}
                  placeholder="Tuliskan pengalaman klinis, publikasi penelitian, atau riwayat pendidikan..."
                  value={speakerForm.bio}
                  onChange={(e) => setSpeakerForm({ ...speakerForm, bio: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">Email Kontak (Opsional):</label>
                <input
                  type="email"
                  placeholder="dokter@institusi.ac.id"
                  value={speakerForm.email}
                  onChange={(e) => setSpeakerForm({ ...speakerForm, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSpeakerModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Speaker</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 2: FORM SESI (SYMPOSIUM / WORKSHOP) */}
      {/* ============================================================= */}
      {isSessionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                {sessionFormType === 'workshop' ? (
                  <Stethoscope className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Calendar className="w-4 h-4 text-indigo-400" />
                )}
                <span>
                  {editingSessionId 
                    ? `Edit ${sessionFormType === 'workshop' ? 'Workshop' : 'Sesi Simposium'}`
                    : `Input ${sessionFormType === 'workshop' ? 'Workshop Hands-On' : 'Sesi Simposium'} Baru`}
                </span>
              </h3>
              <button 
                onClick={() => setIsSessionModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSession} className="p-4 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm">
              
              {/* Judul */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">Judul Sesi / Tema Pembahasan:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Manajemen Terintegrasi Krisis Hipertensi di IGD"
                  value={sessionForm.title}
                  onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Hari, Jam Mulai, Jam Selesai */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Hari Penyelenggaraan:</label>
                  <select
                    value={sessionForm.day}
                    onChange={(e) => {
                      const day = e.target.value;
                      let dateStr = 'Minggu, 29 November 2026';
                      if (day === 'Workshop (28 Nov)') dateStr = 'Sabtu, 28 November 2026';
                      else if (day === 'Hari I') dateStr = 'Minggu, 29 November 2026';
                      else if (day === 'Hari II') dateStr = 'Senin, 30 November 2026';
                      else if (day === 'Hari III') dateStr = 'Selasa, 1 Desember 2026';
                      setSessionForm({
                        ...sessionForm,
                        day,
                        date: dateStr
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Workshop (28 Nov)">Workshop (Sabtu, 28 Nov 2026)</option>
                    <option value="Hari I">Hari I (Minggu, 29 Nov 2026)</option>
                    <option value="Hari II">Hari II (Senin, 30 Nov 2026)</option>
                    <option value="Hari III">Hari III (Selasa, 1 Des 2026)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Jam Mulai (WIB):</label>
                  <input
                    type="time"
                    required
                    value={sessionForm.startTime}
                    onChange={(e) => setSessionForm({ ...sessionForm, startTime: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Jam Selesai (WIB):</label>
                  <input
                    type="time"
                    required
                    value={sessionForm.endTime}
                    onChange={(e) => setSessionForm({ ...sessionForm, endTime: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Tipe Sesi & Ruangan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Tipe Format Sesi:</label>
                  <select
                    value={sessionForm.type}
                    onChange={(e) => setSessionForm({ ...sessionForm, type: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Plenary Session">Plenary Session</option>
                    <option value="Simposium Paralel">Simposium Paralel</option>
                    <option value="Workshop Hands-On">Workshop Hands-On</option>
                    <option value="Keynote Lecture">Keynote Lecture</option>
                    <option value="Panel Discussion">Panel Discussion</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Pilih Ruangan:</label>
                  <select
                    value={sessionForm.room}
                    onChange={(e) => {
                      const selRoom = rooms.find(r => r.name === e.target.value || r.id === e.target.value);
                      setSessionForm({ 
                        ...sessionForm, 
                        room: e.target.value,
                        floor: selRoom ? selRoom.floor : sessionForm.floor
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    {rooms.map((r) => (
                      <option key={r.id} value={r.name}>
                        {r.name} ({r.floor})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Kategori & Moderator */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Kategori Spesialisasi:</label>
                  <input
                    type="text"
                    value={sessionForm.category}
                    onChange={(e) => setSessionForm({ ...sessionForm, category: e.target.value })}
                    placeholder="Kardiologi, Neurologi, Pediatri, dll"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Nama Moderator:</label>
                  <input
                    type="text"
                    value={sessionForm.moderator}
                    onChange={(e) => setSessionForm({ ...sessionForm, moderator: e.target.value })}
                    placeholder="dr. Ahmad Santoso, Sp.PD"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Speaker Selector (Multi-select) */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 block">
                  Pilih Narasumber / Instruktur untuk Sesi Ini:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto bg-slate-950 p-2 rounded-xl border border-slate-800">
                  {speakers.map((sp) => {
                    const isChecked = sessionForm.speakers.some(s => s.id === sp.id);
                    return (
                      <div 
                        key={sp.id}
                        onClick={() => toggleSpeakerInSession(sp)}
                        className={`p-2 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-all ${
                          isChecked 
                            ? 'bg-blue-600/30 border-blue-500 text-white' 
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="truncate">
                          <p className="font-bold truncate">{sp.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{sp.specialty}</p>
                        </div>
                        {isChecked ? (
                          <Check className="w-4 h-4 text-amber-400 shrink-0" />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Kuota Kapasitas */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">Kapasitas Maksimal Peserta:</label>
                <input
                  type="number"
                  value={sessionForm.capacity || 100}
                  onChange={(e) => setSessionForm({ ...sessionForm, capacity: parseInt(e.target.value) || 50 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSessionModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Sesi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 3: FORM PAMERAN / EXHIBITOR */}
      {/* ============================================================= */}
      {isExhibitorModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Store className="w-4 h-4 text-orange-400" />
                <span>{editingExhibitorId ? 'Edit Booth Pameran' : 'Input Booth Pameran Baru'}</span>
              </h3>
              <button 
                onClick={() => setIsExhibitorModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExhibitor} className="p-4 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Nama Perusahaan / Eksibitor:</label>
                  <input
                    type="text"
                    required
                    placeholder="PT Kalbe Farma Tbk"
                    value={exhibitorForm.name}
                    onChange={(e) => setExhibitorForm({ ...exhibitorForm, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Nomor Booth:</label>
                  <input
                    type="text"
                    required
                    placeholder="A-01, B-03, dll"
                    value={exhibitorForm.boothNumber}
                    onChange={(e) => setExhibitorForm({ ...exhibitorForm, boothNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Kategori Eksibitor:</label>
                  <select
                    value={exhibitorForm.category}
                    onChange={(e) => setExhibitorForm({ ...exhibitorForm, category: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="Farmasi">Farmasi</option>
                    <option value="Alat Medis & Diagnostik">Alat Medis & Diagnostik</option>
                    <option value="Teknologi & AI">Teknologi & AI</option>
                    <option value="Rumah Sakit & Lab">Rumah Sakit & Lab</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Zona Pameran:</label>
                  <input
                    type="text"
                    placeholder="Zona A (Main Pharma Hall)"
                    value={exhibitorForm.zone}
                    onChange={(e) => setExhibitorForm({ ...exhibitorForm, zone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">Tagline / Slogan Inovasi:</label>
                <input
                  type="text"
                  placeholder="Solusi Terpadu Kardiometabolik & Nutrisi Klinis"
                  value={exhibitorForm.tagline}
                  onChange={(e) => setExhibitorForm({ ...exhibitorForm, tagline: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">Deskripsi Profil Eksibitor:</label>
                <textarea
                  rows={3}
                  value={exhibitorForm.description}
                  onChange={(e) => setExhibitorForm({ ...exhibitorForm, description: e.target.value })}
                  placeholder="Profil singkat perusahaan dan inovasi yang dipamerkan pada simposium..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">Produk / Layanan Unggulan (pisahkan dengan tanda koma):</label>
                <input
                  type="text"
                  placeholder="Contoh: Mesin POCUS Nirkabel, Reagen Lab, Sistem RME"
                  value={productsRaw}
                  onChange={(e) => setProductsRaw(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">Jadwal Presentasi / Live Demo di Booth (Opsional):</label>
                <input
                  type="text"
                  placeholder="Pukul 11:00 WIB: Uji Coba Probe USG Hands-On"
                  value={exhibitorForm.demoSchedule}
                  onChange={(e) => setExhibitorForm({ ...exhibitorForm, demoSchedule: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Email Kontak:</label>
                  <input
                    type="email"
                    value={exhibitorForm.contactEmail}
                    onChange={(e) => setExhibitorForm({ ...exhibitorForm, contactEmail: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Website Resmi:</label>
                  <input
                    type="text"
                    value={exhibitorForm.website}
                    onChange={(e) => setExhibitorForm({ ...exhibitorForm, website: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsExhibitorModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Booth</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 4: FORM RUANGAN */}
      {/* ============================================================= */}
      {isRoomModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-400" />
                <span>{editingRoomId ? 'Edit Data Ruangan' : 'Input Ruangan Baru'}</span>
              </h3>
              <button 
                onClick={() => setIsRoomModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRoom} className="p-4 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Nama Lengkap Ruangan:</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Grand Ballroom B (Lt. 1)"
                    value={roomForm.name}
                    onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Nama Singkat (Label Denah):</label>
                  <input
                    type="text"
                    required
                    placeholder="Ballroom B"
                    value={roomForm.shortName}
                    onChange={(e) => setRoomForm({ ...roomForm, shortName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Lantai Gedung:</label>
                  <select
                    value={roomForm.floor}
                    onChange={(e) => setRoomForm({ ...roomForm, floor: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="Ground Floor">Ground Floor (Lantai Dasar)</option>
                    <option value="Lantai 1">Lantai 1</option>
                    <option value="Lantai 2">Lantai 2</option>
                    <option value="Lantai 3">Lantai 3</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Tipe Ruangan:</label>
                  <select
                    value={roomForm.type}
                    onChange={(e) => setRoomForm({ ...roomForm, type: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="ballroom">Ballroom</option>
                    <option value="hall">Hall Simposium</option>
                    <option value="workshop">Ruang Workshop</option>
                    <option value="auditorium">Auditorium</option>
                    <option value="facility">Fasilitas / Pos</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Kapasitas (Kursi):</label>
                  <input
                    type="number"
                    value={roomForm.capacity}
                    onChange={(e) => setRoomForm({ ...roomForm, capacity: parseInt(e.target.value) || 50 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">Fasilitas Ruangan (pisahkan dengan koma):</label>
                <input
                  type="text"
                  placeholder="Layar LED 4K, Audio Surround HD, AC Sentral, WiFi"
                  value={facilitiesRaw}
                  onChange={(e) => setFacilitiesRaw(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">Deskripsi Ruangan:</label>
                <textarea
                  rows={3}
                  value={roomForm.description}
                  onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })}
                  placeholder="Deskripsi fungsi ruangan, panggung ganda, atau peruntukan khusus..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRoomModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Ruangan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Session CSV & JSON Import / Export Modal */}
      <SessionImportExportModal
        isOpen={isSessionImportExportModalOpen}
        onClose={() => setIsSessionImportExportModalOpen(false)}
        sessions={sessions}
        onSaveSessions={onSaveSessions}
        speakers={speakers}
        rooms={rooms}
        onSaveSpeakers={onSaveSpeakers}
        onSaveRooms={onSaveRooms}
        onSaveEventInfo={onSaveEventInfo}
        initialMode={sessionModalMode}
        initialFilter={sessionModalFilter}
        onShowToast={showToast}
      />

    </div>
  );
};
