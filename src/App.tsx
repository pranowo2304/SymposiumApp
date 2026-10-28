import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from './components/Header';
import { LandingHeroMenu } from './components/LandingHeroMenu';
import { MainMenuTabs, MainTabType } from './components/MainMenuTabs';
import { BottomDock } from './components/BottomDock';
import { SymposiumScheduleView } from './components/SymposiumScheduleView';
import { WorkshopScheduleView } from './components/WorkshopScheduleView';
import { ExhibitionView } from './components/ExhibitionView';
import { SpeakerDirectory } from './components/SpeakerDirectory';
import { InteractiveVenueMap } from './components/InteractiveVenueMap';
import { MyScheduleView } from './components/MyScheduleView';
import { SessionDetailModal } from './components/SessionDetailModal';
import { SpeakerModal } from './components/SpeakerModal';
import { QRScannerModal } from './components/QRScannerModal';
import { UserProfileModal } from './components/UserProfileModal';
import { EmailIdentificationModal } from './components/EmailIdentificationModal';
import { ReminderNotificationToast } from './components/ReminderNotificationToast';
import { BroadcastNotificationToast } from './components/BroadcastNotificationToast';
import { AdminPageView } from './components/AdminPageView';
import { LandingPageView } from './components/LandingPageView';
import { AdminLoginModal } from './components/AdminLoginModal';
import { playBroadcastChime } from './utils/broadcastSound';
import { SESSIONS_DATA, SPEAKERS_DATABASE, SYMPOSIUM_INFO } from './data/symposiumData';
import { EXHIBITORS_DATA } from './data/exhibitorsData';
import { DEFAULT_ROOMS_DATA } from './data/roomsData';
import { 
  getActiveParticipant, 
  setActiveParticipant, 
  getStoredParticipants, 
  saveStoredParticipants, 
  registerOrUpdateParticipant 
} from './data/participantData';
import { Session, Speaker, AttendanceRecord, Exhibitor, Room, Participant, SymposiumInfo, BroadcastNotification } from './types';
import { Sparkles, Lock } from 'lucide-react';

export default function App() {
  // Mobile Frame Simulation Mode Toggle
  const [isMobileFrame, setIsMobileFrame] = useState(false);

  // Active Identified Participant & Participants Database
  const [participants, setParticipants] = useState<Participant[]>(() => getStoredParticipants());
  const [currentUser, setCurrentUser] = useState<Participant>(() => getActiveParticipant());
  const [isEmailModalOpen, setIsEmailModalOpen] = useState<boolean>(false);

  // Navigation Active Tab: 'home' (Landing page default) | 'speaker' | 'workshop' | 'symposium' | 'pameran' | 'venue' | 'jadwal-saya' | 'admin'
  const [activeTab, setActiveTab] = useState<MainTabType>('home');

  // Admin Authentication State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('simposium_admin_auth') === 'true' || 
             localStorage.getItem('simposium_admin_auth') === 'true';
    } catch (e) {
      return false;
    }
  });
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState<boolean>(false);

  // Broadcast Notification State (Cross-Tab & Real-Time Sync)
  const [activeBroadcast, setActiveBroadcast] = useState<BroadcastNotification | null>(() => {
    try {
      const saved = localStorage.getItem('simposium_broadcast_active');
      if (saved) {
        const parsed: BroadcastNotification = JSON.parse(saved);
        // Display if within 2 hours
        if (Date.now() - parsed.timestamp < 2 * 3600 * 1000) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse saved broadcast', e);
    }
    return null;
  });

  // Storage and Custom Event Listener for real-time broadcasts across tabs & window
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'simposium_broadcast_active') {
        if (e.newValue) {
          try {
            const parsed: BroadcastNotification = JSON.parse(e.newValue);
            setActiveBroadcast(parsed);
            if (parsed.sound) {
              playBroadcastChime(parsed.type);
            }
          } catch (err) {
            console.error(err);
          }
        } else {
          setActiveBroadcast(null);
        }
      }
    };

    const handleCustomBroadcast = (e: Event) => {
      const customEvent = e as CustomEvent<BroadcastNotification | null>;
      if (customEvent.detail) {
        setActiveBroadcast(customEvent.detail);
      } else {
        setActiveBroadcast(null);
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('simposium_broadcast', handleCustomBroadcast);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('simposium_broadcast', handleCustomBroadcast);
    };
  }, []);

  const handleSendBroadcast = (broadcast: BroadcastNotification) => {
    setActiveBroadcast(broadcast);
    try {
      localStorage.setItem('simposium_broadcast_active', JSON.stringify(broadcast));
      window.dispatchEvent(new CustomEvent('simposium_broadcast', { detail: broadcast }));
    } catch (e) {
      console.error('Failed to save broadcast to localStorage', e);
    }
  };

  const handleClearActiveBroadcast = () => {
    setActiveBroadcast(null);
    try {
      localStorage.removeItem('simposium_broadcast_active');
      window.dispatchEvent(new CustomEvent('simposium_broadcast', { detail: null }));
    } catch (e) {
      console.error('Failed to remove active broadcast', e);
    }
  };

  // Dynamic Datasets managed by Admin
  const [speakers, setSpeakers] = useState<Speaker[]>(() => {
    try {
      const saved = localStorage.getItem('simposium_speakers_custom');
      if (saved) {
        const parsed = JSON.parse(saved);
        const isOldDemo = parsed.some((s: any) => s.id === 's1' && s.name?.includes('Bambang Sutrisno'));
        if (!isOldDemo && parsed.length > 0) return parsed;
      }
      return Object.values(SPEAKERS_DATABASE);
    } catch (e) {
      return Object.values(SPEAKERS_DATABASE);
    }
  });

  const [sessions, setSessions] = useState<Session[]>(() => {
    try {
      const saved = localStorage.getItem('simposium_sessions_custom');
      if (saved) {
        const parsed = JSON.parse(saved);
        const isOldDemo = parsed.some((s: any) => s.id === 'session-101' || s.title?.includes('SINDROM KORONER AKUT'));
        if (!isOldDemo && parsed.length > 0) {
          const hasVersus = parsed.some((s: any) => s.title?.includes('Workshop Versus') || s.id === 'ws-versus-01');
          const hasVetNurse = parsed.some((s: any) => s.title?.includes('Workshop Vet Nurse') || s.id === 'ws-vetnurse-02');
          if (hasVersus && hasVetNurse) {
            return parsed;
          }
          const workshopsToAdd: Session[] = [];
          if (!hasVersus) {
            const vs = SESSIONS_DATA.find(s => s.id === 'ws-versus-01');
            if (vs) workshopsToAdd.push(vs);
          }
          if (!hasVetNurse) {
            const vn = SESSIONS_DATA.find(s => s.id === 'ws-vetnurse-02');
            if (vn) workshopsToAdd.push(vn);
          }
          const merged = [...workshopsToAdd, ...parsed];
          try {
            localStorage.setItem('simposium_sessions_custom', JSON.stringify(merged));
          } catch (e) {
            console.error(e);
          }
          return merged;
        }
      }
      return SESSIONS_DATA;
    } catch (e) {
      return SESSIONS_DATA;
    }
  });

  const [exhibitors, setExhibitors] = useState<Exhibitor[]>(() => {
    try {
      const saved = localStorage.getItem('simposium_exhibitors_custom');
      return saved ? JSON.parse(saved) : EXHIBITORS_DATA;
    } catch (e) {
      return EXHIBITORS_DATA;
    }
  });

  const [rooms, setRooms] = useState<Room[]>(() => {
    try {
      const saved = localStorage.getItem('simposium_rooms_custom');
      if (saved) {
        const parsed = JSON.parse(saved);
        const isOldDemo = parsed.some((r: any) => r.id === 'Ruang Sulawesi' || r.name === 'Ruang Sulawesi');
        if (!isOldDemo && parsed.length > 0) {
          const hasAntareja = parsed.some((r: any) => r.name === 'Antareja Room' || r.id === 'Antareja Room');
          const hasWisanggeni = parsed.some((r: any) => r.name === 'Wisanggeni Room' || r.id === 'Wisanggeni Room');
          if (hasAntareja && hasWisanggeni) {
            return parsed;
          }
          const roomsToAdd: Room[] = [];
          if (!hasAntareja) {
            const r1 = DEFAULT_ROOMS_DATA.find(r => r.id === 'Antareja Room');
            if (r1) roomsToAdd.push(r1);
          }
          if (!hasWisanggeni) {
            const r2 = DEFAULT_ROOMS_DATA.find(r => r.id === 'Wisanggeni Room');
            if (r2) roomsToAdd.push(r2);
          }
          const mergedRooms = [...roomsToAdd, ...parsed];
          try {
            localStorage.setItem('simposium_rooms_custom', JSON.stringify(mergedRooms));
          } catch (e) {
            console.error(e);
          }
          return mergedRooms;
        }
      }
      return DEFAULT_ROOMS_DATA;
    } catch (e) {
      return DEFAULT_ROOMS_DATA;
    }
  });

  // Global Event Info managed by Admin
  const [eventInfo, setEventInfo] = useState<SymposiumInfo>(() => {
    try {
      const saved = localStorage.getItem('simposium_event_info_custom');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.title?.includes('SIMPOSIUM NASIONAL KEDOKTERAN')) {
          return SYMPOSIUM_INFO;
        }
        return { ...SYMPOSIUM_INFO, ...parsed };
      }
      return SYMPOSIUM_INFO;
    } catch (e) {
      return SYMPOSIUM_INFO;
    }
  });

  useEffect(() => {
    if (eventInfo?.title) {
      document.title = eventInfo.title;
    }
  }, [eventInfo?.title]);

  const handleSaveEventInfo = (newEventInfo: SymposiumInfo) => {
    setEventInfo(newEventInfo);
    try {
      localStorage.setItem('simposium_event_info_custom', JSON.stringify(newEventInfo));
      if (newEventInfo.title) {
        document.title = newEventInfo.title;
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveSpeakers = (newSpeakers: Speaker[]) => {
    setSpeakers(newSpeakers);
    try {
      localStorage.setItem('simposium_speakers_custom', JSON.stringify(newSpeakers));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveSessions = (newSessions: Session[]) => {
    setSessions(newSessions);
    try {
      localStorage.setItem('simposium_sessions_custom', JSON.stringify(newSessions));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveExhibitors = (newExhibitors: Exhibitor[]) => {
    setExhibitors(newExhibitors);
    try {
      localStorage.setItem('simposium_exhibitors_custom', JSON.stringify(newExhibitors));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveRooms = (newRooms: Room[]) => {
    setRooms(newRooms);
    try {
      localStorage.setItem('simposium_rooms_custom', JSON.stringify(newRooms));
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetToDefault = () => {
    setSpeakers(Object.values(SPEAKERS_DATABASE));
    setSessions(SESSIONS_DATA);
    setExhibitors(EXHIBITORS_DATA);
    setRooms(DEFAULT_ROOMS_DATA);
    setEventInfo(SYMPOSIUM_INFO);
    try {
      localStorage.removeItem('simposium_speakers_custom');
      localStorage.removeItem('simposium_sessions_custom');
      localStorage.removeItem('simposium_exhibitors_custom');
      localStorage.removeItem('simposium_rooms_custom');
      localStorage.removeItem('simposium_event_info_custom');
      document.title = SYMPOSIUM_INFO.title;
    } catch (e) {
      console.error(e);
    }
  };

  // Participant Management Handlers
  const handleSaveParticipants = (newParticipants: Participant[]) => {
    setParticipants(newParticipants);
    saveStoredParticipants(newParticipants);
  };

  const handleUpdateCurrentUser = (updatedUser: Participant) => {
    setCurrentUser(updatedUser);
    setActiveParticipant(updatedUser);
    const { participants: updatedList } = registerOrUpdateParticipant(updatedUser);
    setParticipants(updatedList);
    showToast(`Profil ${updatedUser.name} berhasil diperbarui!`);
  };

  const handleSelectParticipant = (p: Participant) => {
    setCurrentUser(p);
    setActiveParticipant(p);
    showToast(`Identitas aktif: ${p.name}`);
  };

  const handleRegisterNewParticipant = (p: Participant) => {
    const { participants: updatedList, saved } = registerOrUpdateParticipant(p);
    setParticipants(updatedList);
    setCurrentUser(saved);
    setActiveParticipant(saved);
    showToast(`Registrasi berhasil! Selamat datang, ${saved.name}`);
  };

  // QR Code Scanner & User Profile Modals
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // Attendance Records saved in LocalStorage
  const [attendances, setAttendances] = useState<AttendanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem('symposium_attendance_2026');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const totalSkpPoints = attendances.reduce((acc, curr) => acc + curr.skpPoints, 0);

  useEffect(() => {
    try {
      localStorage.setItem('symposium_attendance_2026', JSON.stringify(attendances));
    } catch (e) {
      console.error("Failed to save attendances", e);
    }
  }, [attendances]);

  const handleAttendanceSaved = (record: AttendanceRecord) => {
    setAttendances(prev => {
      // Prevent duplicates if same session
      if (prev.some(r => r.sessionId === record.sessionId)) {
        return prev;
      }
      return [record, ...prev];
    });
    showToast(`Presensi Berhasil! (+${record.skpPoints} SKP IDI)`);
  };

  const handleAddDemoAttendance = () => {
    const demo1: AttendanceRecord = {
      id: `att-demo-1-${Date.now()}`,
      sessionId: 'sess-p1',
      sessionTitle: SESSIONS_DATA[0]?.title || 'Sesi Pleno Kardiologi',
      room: SESSIONS_DATA[0]?.room || 'Grand Ballroom A',
      timestamp: new Date().toLocaleTimeString('id-ID'),
      skpPoints: 2.5,
      participantName: 'dr. Ahmad Pratama, Sp.PD',
      badgeId: 'ID-SIMP-8891',
      day: 'Hari I'
    };
    const demo2: AttendanceRecord = {
      id: `att-demo-2-${Date.now()}`,
      sessionId: 'sess-p2',
      sessionTitle: SESSIONS_DATA[1]?.title || 'Workshop Hands-On EKG',
      room: SESSIONS_DATA[1]?.room || 'Hall B (Lt. 2)',
      timestamp: new Date().toLocaleTimeString('id-ID'),
      skpPoints: 2.5,
      participantName: 'dr. Ahmad Pratama, Sp.PD',
      badgeId: 'ID-SIMP-8891',
      day: 'Hari I'
    };

    setAttendances(prev => {
      const exists1 = prev.some(r => r.sessionId === demo1.sessionId);
      const exists2 = prev.some(r => r.sessionId === demo2.sessionId);
      const newItems = [...prev];
      if (!exists1) newItems.unshift(demo1);
      if (!exists2) newItems.unshift(demo2);
      return newItems;
    });

    showToast('Presensi Demo Berhasil Ditambahkan (+5.0 SKP IDI)');
  };

  // Filter States
  const [selectedRoom, setSelectedRoom] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua Kategori');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Reminders
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [selectedSessionTab, setSelectedSessionTab] = useState<'abstract' | 'speakers' | 'livechat'>('abstract');
  const [selectedSpeaker, setSelectedSpeaker] = useState<Speaker | null>(null);
  const [activeReminderSession, setActiveReminderSession] = useState<Session | null>(null);

  const handleOpenSession = (session: Session, tab: 'abstract' | 'speakers' | 'livechat' = 'abstract') => {
    setSelectedSession(session);
    setSelectedSessionTab(tab);
  };

  // Trigger 15-Minute Reminder Notification Toast with Audio Chime
  const triggerReminderToast = (session: Session) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.3); // G5
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      }
    } catch (e) {
      console.log('Audio chime error:', e);
    }

    setActiveReminderSession(session);

    // Browser Notification API
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`🔔 15 Menit Lagi: ${session.title}`, {
          body: `Sesi akan dimulai jam ${session.startTime} WIB di ${session.room}`,
          icon: '/favicon.ico'
        });
      } catch (e) {
        console.log('Notification API error:', e);
      }
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  };

  // Bookmarks saved in LocalStorage
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('symposium_bookmarks_2026');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('symposium_bookmarks_2026', JSON.stringify(bookmarks));
    } catch (e) {
      console.error("Failed to save bookmarks", e);
    }
  }, [bookmarks]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Guarded Admin Navigation and Auth Handlers
  const handleOpenAdmin = () => {
    if (isAdminAuthenticated) {
      setActiveTab('admin');
    } else {
      setIsAdminLoginModalOpen(true);
    }
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminAuthenticated(true);
    setIsAdminLoginModalOpen(false);
    setActiveTab('admin');
    showToast("Login Admin Berhasil! Selamat datang di Panel Pengaturan.");
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    try {
      sessionStorage.removeItem('simposium_admin_auth');
      localStorage.removeItem('simposium_admin_auth');
    } catch (e) {
      console.error(e);
    }
    setActiveTab('home');
    showToast("Anda telah keluar dari sesi Admin.");
  };

  const handleSelectTab = (tab: MainTabType) => {
    if (tab === 'admin') {
      handleOpenAdmin();
      return;
    }
    setActiveTab(tab);
  };

  const handleToggleBookmark = (sessionId: string) => {
    setBookmarks(prev => {
      const exists = prev.includes(sessionId);
      if (exists) {
        showToast("Sesi dihapus dari Jadwal Saya");
        return prev.filter(id => id !== sessionId);
      } else {
        showToast("Sesi berhasil disimpan ke Jadwal Saya!");
        return [...prev, sessionId];
      }
    });
  };

  const handleClearAllBookmarks = () => {
    setBookmarks([]);
    showToast("Semua simpanan jadwal dibersihkan");
  };

  const workshopsCount = sessions.filter(
    s => s.type === 'Workshop Hands-On' || s.category.includes('Workshop')
  ).length;

  const bookmarkedSessionObjects = sessions.filter(s => bookmarks.includes(s.id));

  // Render main body based on tab
  const renderMainContent = () => {
    if (activeTab === 'home') {
      return (
        <LandingPageView
          onSelectTab={handleSelectTab}
          onOpenAdmin={handleOpenAdmin}
          onOpenQrScanner={() => setIsQrModalOpen(true)}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          onOpenBookmarks={() => setActiveTab('jadwal-saya')}
          speakerCount={speakers.length}
          workshopCount={workshopsCount}
          symposiumCount={sessions.length}
          exhibitorCount={exhibitors.length}
          bookmarkCount={bookmarks.length}
          currentUser={currentUser}
          isAdminAuthenticated={isAdminAuthenticated}
          eventInfo={eventInfo}
        />
      );
    }

    if (activeTab === 'admin') {
      if (!isAdminAuthenticated) {
        return (
          <div className="max-w-md mx-auto p-6 text-center space-y-4 bg-white rounded-2xl shadow-md border border-slate-200 mt-10">
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Akses Admin Terkunci</h2>
            <p className="text-xs text-slate-600">
              Anda harus melakukan login dengan kata sandi administrator untuk mengakses panel pengelolaan simposium.
            </p>
            <button
              onClick={() => setIsAdminLoginModalOpen(true)}
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer"
            >
              Buka Form Login Admin
            </button>
          </div>
        );
      }

      return (
        <AdminPageView
          eventInfo={eventInfo}
          onSaveEventInfo={handleSaveEventInfo}
          speakers={speakers}
          onSaveSpeakers={handleSaveSpeakers}
          sessions={sessions}
          onSaveSessions={handleSaveSessions}
          exhibitors={exhibitors}
          onSaveExhibitors={handleSaveExhibitors}
          rooms={rooms}
          onSaveRooms={handleSaveRooms}
          participants={participants}
          onSaveParticipants={handleSaveParticipants}
          activeParticipant={currentUser}
          onSetActiveParticipant={handleSelectParticipant}
          onResetToDefault={handleResetToDefault}
          onBackToApp={() => setActiveTab('home')}
          onLogout={handleAdminLogout}
          onSendBroadcast={handleSendBroadcast}
          onClearActiveBroadcast={handleClearActiveBroadcast}
          activeBroadcast={activeBroadcast}
          attendances={attendances}
          bookmarks={bookmarks}
        />
      );
    }

    if (activeTab === 'jadwal-saya') {
      return (
        <MyScheduleView
          bookmarkedSessions={bookmarkedSessionObjects}
          onToggleBookmark={handleToggleBookmark}
          onSelectSession={(s, tab) => handleOpenSession(s, tab || 'abstract')}
          onSelectSpeaker={(sp) => setSelectedSpeaker(sp)}
          onClearAllBookmarks={handleClearAllBookmarks}
          onBackToSchedule={() => setActiveTab('symposium')}
          onTriggerReminderToast={triggerReminderToast}
        />
      );
    }

    if (activeTab === 'speaker') {
      return (
        <SpeakerDirectory
          speakers={speakers}
          onSelectSpeaker={(sp) => setSelectedSpeaker(sp)}
        />
      );
    }

    if (activeTab === 'workshop') {
      return (
        <WorkshopScheduleView
          sessions={sessions}
          onSelectSession={(s, tab) => handleOpenSession(s, tab || 'abstract')}
          onSelectSpeaker={(sp) => setSelectedSpeaker(sp)}
          bookmarks={bookmarks}
          onToggleBookmark={handleToggleBookmark}
          onOpenVenue={() => setActiveTab('venue')}
        />
      );
    }

    if (activeTab === 'pameran') {
      return (
        <ExhibitionView
          exhibitors={exhibitors}
          onOpenVenue={() => setActiveTab('venue')}
        />
      );
    }

    if (activeTab === 'venue') {
      return (
        <InteractiveVenueMap
          rooms={rooms}
          sessions={sessions}
          onSelectSession={(s) => handleOpenSession(s, 'abstract')}
          onSelectSpeaker={(sp) => setSelectedSpeaker(sp)}
          eventInfo={eventInfo}
        />
      );
    }

    // Default: 'symposium'
    return (
      <SymposiumScheduleView
        sessions={sessions}
        bookmarks={bookmarks}
        onToggleBookmark={handleToggleBookmark}
        onSelectSession={(s, tab) => handleOpenSession(s, tab || 'abstract')}
        onSelectSpeaker={(sp) => setSelectedSpeaker(sp)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        eventInfo={eventInfo}
      />
    );
  };

  return (
    <div className={`min-h-screen bg-slate-100 font-sans text-slate-900 antialiased selection:bg-sky-500 selection:text-white ${
      isMobileFrame ? 'py-4 px-2 flex justify-center bg-slate-950' : ''
    }`}>
      
      {/* Mobile Device Frame Mockup wrapper if enabled */}
      <div className={`w-full transition-all ${
        isMobileFrame 
          ? 'max-w-[420px] bg-slate-50 rounded-[40px] shadow-2xl border-[10px] border-slate-800 overflow-hidden relative min-h-[820px] flex flex-col' 
          : 'min-h-screen flex flex-col'
      }`}>
        
        {/* Mobile Mockup Top Notch */}
        {isMobileFrame && (
          <div className="bg-slate-900 text-white text-[11px] px-6 py-1.5 flex justify-between items-center select-none border-b border-slate-800">
            <span className="font-bold">08:30</span>
            <div className="w-16 h-3 bg-slate-800 rounded-full mx-auto"></div>
            <span className="text-[10px] text-emerald-400">5G 100%</span>
          </div>
        )}

        {/* App Header */}
        <Header
          bookmarkedCount={bookmarks.length}
          onOpenBookmarks={() => setActiveTab('jadwal-saya')}
          onOpenQrScanner={() => setIsQrModalOpen(true)}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          onOpenAdmin={handleOpenAdmin}
          totalSkpPoints={totalSkpPoints}
          isMobileFrame={isMobileFrame}
          onToggleFrame={() => setIsMobileFrame(!isMobileFrame)}
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          currentUser={currentUser}
          onOpenEmailIdentification={() => setIsEmailModalOpen(true)}
          eventInfo={eventInfo}
          isAdminAuthenticated={isAdminAuthenticated}
        />

        {/* Main Sticky Navigation Menu Bar (only shown on sub-pages, keeping Landing Page dedicated to Header + Menus) */}
        {activeTab !== 'home' && activeTab !== 'admin' && (
          <MainMenuTabs
            activeTab={activeTab}
            onSelectTab={handleSelectTab}
            speakerCount={speakers.length}
            workshopCount={workshopsCount}
            symposiumCount={sessions.length}
            exhibitorCount={exhibitors.length}
            bookmarkCount={bookmarks.length}
            isAdminAuthenticated={isAdminAuthenticated}
            eventInfo={eventInfo}
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 pb-24 sm:pb-28 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
            >
              {renderMainContent()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Session Detail Modal */}
        <AnimatePresence>
          {selectedSession && (
            <SessionDetailModal
              session={selectedSession}
              onClose={() => setSelectedSession(null)}
              isBookmarked={bookmarks.includes(selectedSession.id)}
              onToggleBookmark={handleToggleBookmark}
              onSelectSpeaker={(sp) => setSelectedSpeaker(sp)}
              onOpenQrScanner={() => setIsQrModalOpen(true)}
              initialTab={selectedSessionTab}
              currentUser={currentUser}
              eventInfo={eventInfo}
            />
          )}
        </AnimatePresence>

        {/* QR Code Presensi Modal */}
        <AnimatePresence>
          {isQrModalOpen && (
            <QRScannerModal
              isOpen={isQrModalOpen}
              onClose={() => setIsQrModalOpen(false)}
              onAttendanceSaved={handleAttendanceSaved}
              savedAttendances={attendances}
              onOpenProfile={() => setIsProfileModalOpen(true)}
              currentUser={currentUser}
            />
          )}
        </AnimatePresence>

        {/* User Profile & Certificate Modal */}
        <AnimatePresence>
          {isProfileModalOpen && (
            <UserProfileModal
              isOpen={isProfileModalOpen}
              onClose={() => setIsProfileModalOpen(false)}
              attendances={attendances}
              onOpenQrScanner={() => setIsQrModalOpen(true)}
              onAddDemoAttendance={handleAddDemoAttendance}
              currentUser={currentUser}
              onUpdateCurrentUser={handleUpdateCurrentUser}
              onOpenEmailIdentification={() => {
                setIsProfileModalOpen(false);
                setIsEmailModalOpen(true);
              }}
              eventInfo={eventInfo}
            />
          )}
        </AnimatePresence>

        {/* Email Identification & Account Switcher Modal */}
        <AnimatePresence>
          {isEmailModalOpen && (
            <EmailIdentificationModal
              isOpen={isEmailModalOpen}
              onClose={() => setIsEmailModalOpen(false)}
              onSelectParticipant={handleSelectParticipant}
              onSelectUser={handleSelectParticipant}
              onRegisterNew={handleRegisterNewParticipant}
              allParticipants={participants}
              currentUser={currentUser}
              currentParticipant={currentUser}
            />
          )}
        </AnimatePresence>

        {/* Speaker Profile Modal */}
        <AnimatePresence>
          {selectedSpeaker && (
            <SpeakerModal
              speaker={selectedSpeaker}
              allSessions={sessions}
              onClose={() => setSelectedSpeaker(null)}
              onSelectSession={(s, tab) => handleOpenSession(s, tab || 'abstract')}
            />
          )}
        </AnimatePresence>

        {/* 15-Minute Session Reminder Toast */}
        <ReminderNotificationToast
          session={activeReminderSession}
          onClose={() => setActiveReminderSession(null)}
          onOpenSession={(s) => {
            handleOpenSession(s, 'abstract');
            setActiveReminderSession(null);
          }}
        />

        {/* Real-time Broadcast Notification Toast for all Participants */}
        <BroadcastNotificationToast
          broadcast={activeBroadcast}
          onClose={() => setActiveBroadcast(null)}
          onNavigateTab={(tabKey) => {
            if (tabKey === 'presensi') {
              setIsQrModalOpen(true);
            } else if (tabKey === 'profil') {
              setIsProfileModalOpen(true);
            } else {
              handleSelectTab(tabKey as MainTabType);
            }
          }}
        />

        {/* Admin Login Modal */}
        <AnimatePresence>
          {isAdminLoginModalOpen && (
            <AdminLoginModal
              isOpen={isAdminLoginModalOpen}
              onClose={() => setIsAdminLoginModalOpen(false)}
              onLoginSuccess={handleAdminLoginSuccess}
            />
          )}
        </AnimatePresence>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-20 sm:bottom-22 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white text-xs px-4 py-2.5 rounded-2xl shadow-xl border border-sky-500/40 flex items-center space-x-2 animate-in slide-in-from-bottom duration-200">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Floating Bottom Dock Navigation Menu */}
        <BottomDock
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          workshopCount={workshopsCount}
          symposiumCount={sessions.length}
          speakerCount={speakers.length}
          eventInfo={eventInfo}
        />

      </div>

    </div>
  );
}
