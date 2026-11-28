import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import {
  auth,
  signInWithGoogle,
  signOutFirebase,
  formatFirebaseAuthError,
  isFirestoreQuotaError,
} from './firebase';
import {
  ensureUserProfileAndCheckAdmin,
  seedInitialCatalogIfEmpty,
  subscribePublicCatalog,
  subscribeUserPrivateData,
  saveEventInfoToFirestore,
  syncSessionsToFirestore,
  syncSpeakersToFirestore,
  syncExhibitorsToFirestore,
  syncRoomsToFirestore,
  saveBroadcastToFirestore,
  clearBroadcastInFirestore,
  syncParticipantsToFirestore,
  syncLocalPdfMaterialsToFirestore,
  ensureRegistrantDirectorySynced,
  lookupOwnParticipantByEmailInFirestore,
  lookupParticipantByIdRegistrantInFirestore,
  subscribeParticipantByIdRegistrantInFirestore,
  isCloudWriteQuotaExhausted,
  resetCloudWriteQuotaFlag,
} from './services/firestoreSyncService';
import { Header } from './components/Header';
import { MainMenuTabs, MainTabType } from './components/MainMenuTabs';
import { BottomDock } from './components/BottomDock';
import { SymposiumScheduleView } from './components/SymposiumScheduleView';
import { WorkshopScheduleView } from './components/WorkshopScheduleView';
import { ExhibitionView } from './components/ExhibitionView';
import { SpeakerDirectory } from './components/SpeakerDirectory';
import { InteractiveVenueMap } from './components/InteractiveVenueMap';
import { SessionDetailModal } from './components/SessionDetailModal';
import { SpeakerModal } from './components/SpeakerModal';
import { BroadcastNotificationToast } from './components/BroadcastNotificationToast';
import { AdminPageView } from './components/AdminPageView';
import { LandingPageView } from './components/LandingPageView';
import { AdminLoginModal } from './components/AdminLoginModal';
import { ParticipantLoginModal } from './components/ParticipantLoginModal';
import { CertificateDownloadView } from './components/CertificateDownloadView';
import { PWAInstallModal, OfflineIndicator } from './components/PWAInstallModal';
import { AppQRCodeModal } from './components/AppQRCodeModal';
import { playBroadcastChime } from './utils/broadcastSound';
import { syncAppIconWithEventLogo } from './utils/appIconSync';
import { sortSessionsChronologically } from './utils/sessionSorting';
import { SESSIONS_DATA, SPEAKERS_DATABASE, SYMPOSIUM_INFO } from './data/symposiumData';
import { EXHIBITORS_DATA } from './data/exhibitorsData';
import { DEFAULT_ROOMS_DATA } from './data/roomsData';
import { 
  DEFAULT_PARTICIPANTS_DATABASE,
  getActiveParticipant, 
  setActiveParticipant, 
  getStoredParticipants, 
  saveStoredParticipants, 
  registerOrUpdateParticipant,
  findParticipantByEmail,
  findParticipantByIdRegistrant,
  extractParticipantIdRegistrant,
  isParticipantSessionLoggedIn,
  setParticipantSessionLoggedIn,
} from './data/participantData';
import { Session, Speaker, Exhibitor, Room, Participant, SymposiumInfo, BroadcastNotification } from './types';
import { TAB_HASH_ORDER, parseTabFromHash, syncTabToUrlHash } from './utils/hashRouter';
import { Sparkles, Lock } from 'lucide-react';

const TAB_ORDER: MainTabType[] = TAB_HASH_ORDER;

const DIRTY_LOCAL_KEYS = {
  eventInfo: 'simposium_event_info_dirty_local_v1',
  sessions: 'simposium_sessions_dirty_local_v1',
  speakers: 'simposium_speakers_dirty_local_v1',
  exhibitors: 'simposium_exhibitors_dirty_local_v1',
  rooms: 'simposium_rooms_dirty_local_v1',
  participants: 'simposium_participants_dirty_local_v1',
} as const;

type DirtyCollectionKey = keyof typeof DIRTY_LOCAL_KEYS;

function isDirtyLocal(key: DirtyCollectionKey): boolean {
  try {
    return localStorage.getItem(DIRTY_LOCAL_KEYS[key]) === 'true';
  } catch {
    return false;
  }
}

function setDirtyLocal(key: DirtyCollectionKey): void {
  try {
    localStorage.setItem(DIRTY_LOCAL_KEYS[key], 'true');
  } catch {}
}

function clearDirtyLocal(key: DirtyCollectionKey): void {
  try {
    localStorage.removeItem(DIRTY_LOCAL_KEYS[key]);
  } catch {}
}

const tabSlideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 8 : -8,
    y: 4,
    opacity: 0,
    scale: 0.997,
  }),
  center: {
    x: 0,
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.42,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -8 : 8,
    y: -3,
    opacity: 0,
    scale: 0.998,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 0.2, 1] as const,
    },
  }),
};

export default function App() {
  // Mobile Frame Simulation Mode Toggle
  const [isMobileFrame, setIsMobileFrame] = useState(false);

  // Mobile App PWA Installer & App QR Code Modal State
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);
  const [isQRCodeModalOpen, setIsQRCodeModalOpen] = useState<boolean>(false);

  // Participants Database (managed in Admin)
  const [participants, setParticipants] = useState<Participant[]>(() => getStoredParticipants());
  const [currentUser, setCurrentUser] = useState<Participant>(() => getActiveParticipant());
  const [isParticipantLoggedIn, setIsParticipantLoggedIn] = useState<boolean>(() =>
    isParticipantSessionLoggedIn()
  );
  const [isParticipantLoginModalOpen, setIsParticipantLoginModalOpen] = useState<boolean>(false);

  // Firebase Auth & Cloud Database Sync State
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [isCloudAdmin, setIsCloudAdmin] = useState<boolean>(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);

  // Admin Authentication State — always starts locked so entering Admin Page requires login
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return parseTabFromHash(window.location.hash) === 'admin';
    }
    return false;
  });

  // Clear any legacy persisted admin auth flags so Admin Page always requires explicit login
  useEffect(() => {
    try {
      sessionStorage.removeItem('simposium_admin_auth');
      localStorage.removeItem('simposium_admin_auth');
    } catch {}
  }, []);

  // Navigation Active Tab: 'home' | 'speaker' | 'workshop' | 'symposium' | 'pameran' | 'venue' | 'admin'
  // Exclusively uses URL hashes (e.g. #symposium, #workshop) so static hosts like GitHub Pages never 404
  const [activeTab, setActiveTab] = useState<MainTabType>(() => {
    if (typeof window !== 'undefined') {
      const hashTab = parseTabFromHash(window.location.hash);
      if (hashTab) {
        if (hashTab === 'admin') {
          return 'home';
        }
        return hashTab;
      }
    }
    return 'home';
  });
  const [tabDirection, setTabDirection] = useState<number>(1);

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
    if (isCloudAdmin) {
      saveBroadcastToFirestore(broadcast).catch((err) => console.error('Firestore broadcast sync failed:', err));
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
    if (isCloudAdmin) {
      clearBroadcastInFirestore().catch((err) => console.error('Firestore broadcast clear failed:', err));
    }
  };

  // Dynamic Datasets managed by Admin
  const [speakers, setSpeakers] = useState<Speaker[]>(() => {
    try {
      const saved = localStorage.getItem('simposium_speakers_custom');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const isOldDemo = parsed.some((s: any) => s.id === 's1' && s.name?.includes('Bambang Sutrisno'));
          if (!isOldDemo) {
            return parsed.map(({ talkTitle, ...rest }: any) => rest);
          }
        }
      }
      return Object.values(SPEAKERS_DATABASE);
    } catch (e) {
      return Object.values(SPEAKERS_DATABASE);
    }
  });

  const [sessions, setSessions] = useState<Session[]>(() => {
    try {
      const saved = localStorage.getItem('simposium_sessions_custom');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const isOldDemo = parsed.some((s: any) => s.id === 'session-101' || s.title?.includes('SINDROM KORONER AKUT'));
          if (!isOldDemo) {
            const storedWorkshops = parsed.filter(
              (s: Session) => s.type === 'Workshop Hands-On' || s.category?.includes('Workshop') || s.day?.includes('Workshop')
            );
            const hasOldMonolithicWorkshop = storedWorkshops.some(
              (s: Session) => (s.id === 'ws-versus-01' && s.endTime === '17:00') || (s.id === 'ws-vetnurse-02' && s.startTime === '09:00' && s.endTime === '17:00')
            );

            if (hasOldMonolithicWorkshop) {
              const nonWorkshops = parsed.filter(
                (s: Session) => s.type !== 'Workshop Hands-On' && !s.category?.includes('Workshop') && !s.day?.includes('Workshop')
              );
              const defaultWorkshops = SESSIONS_DATA.filter(
                (s: Session) => s.type === 'Workshop Hands-On' || s.category.includes('Workshop') || s.day.includes('Workshop')
              );
              const merged = sortSessionsChronologically([...defaultWorkshops, ...nonWorkshops]);
              try {
                localStorage.setItem('simposium_sessions_custom', JSON.stringify(merged));
              } catch (e) {
                console.error(e);
              }
              return merged;
            }

            return sortSessionsChronologically(parsed);
          }
        }
      }
      return sortSessionsChronologically(SESSIONS_DATA);
    } catch (e) {
      return sortSessionsChronologically(SESSIONS_DATA);
    }
  });

  const [exhibitors, setExhibitors] = useState<Exhibitor[]>(() => {
    try {
      const saved = localStorage.getItem('simposium_exhibitors_custom');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      return EXHIBITORS_DATA;
    } catch (e) {
      return EXHIBITORS_DATA;
    }
  });

  const [rooms, setRooms] = useState<Room[]>(() => {
    const dedupeRooms = (list: Room[]) => {
      const seen = new Set<string>();
      return list.filter(r => {
        if (!r?.id || seen.has(r.id)) return false;
        seen.add(r.id);
        return true;
      });
    };
    try {
      const saved = localStorage.getItem('simposium_rooms_custom');
      if (saved !== null) {
        const rawParsed = JSON.parse(saved);
        if (Array.isArray(rawParsed)) {
          const parsed = dedupeRooms(rawParsed);
          const isOldDemo = parsed.some((r: any) => r.id === 'Ruang Sulawesi' || r.name === 'Ruang Sulawesi');
          if (!isOldDemo) {
            return parsed;
          }
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
        return {
          ...SYMPOSIUM_INFO,
          ...parsed,
          dates: {
            ...SYMPOSIUM_INFO.dates,
            ...(parsed.dates || {}),
            workshop:
              !parsed.dates?.workshop || parsed.dates.workshop === 'Sabtu, 28 November 2026'
                ? '28 November 2026'
                : parsed.dates.workshop,
            munasSymposium:
              parsed.dates?.munasSymposium || '29 November 2026 - 1 Desember 2026',
          },
        };
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
    syncAppIconWithEventLogo(eventInfo);
  }, [eventInfo]);

  // Tracks active in-flight Firestore mutations per collection so intermediate onSnapshot echoes
  // never roll back rapid deletions, edits, or multi-batch Excel imports before cloud commit finishes.
  const inFlightCloudSyncRef = useRef<
    Record<'sessions' | 'speakers' | 'exhibitors' | 'rooms' | 'participants', number>
  >({
    sessions: 0,
    speakers: 0,
    exhibitors: 0,
    rooms: 0,
    participants: 0,
  });

  const QUOTA_EXCEEDED_TOAST =
    'Kuota tulis harian gratis Cloud Firestore habis (reset otomatis besok). Data Anda tetap aman tersimpan di perangkat ini.';

  const runTrackedCatalogSync = (
    key: 'sessions' | 'speakers' | 'exhibitors' | 'rooms' | 'participants',
    syncFn: () => Promise<void>,
    errorToast: string
  ) => {
    if (isCloudWriteQuotaExhausted()) {
      setDirtyLocal(key);
      showToast(QUOTA_EXCEEDED_TOAST);
      return;
    }
    clearDirtyLocal(key);
    inFlightCloudSyncRef.current[key] += 1;
    syncFn()
      .catch((err) => {
        console.error(`Firestore ${key} sync failed:`, err);
        setDirtyLocal(key);
        showToast(isFirestoreQuotaError(err) ? QUOTA_EXCEEDED_TOAST : errorToast);
      })
      .finally(() => {
        inFlightCloudSyncRef.current[key] = Math.max(0, inFlightCloudSyncRef.current[key] - 1);
      });
  };

  const handleSaveEventInfo = (newEventInfo: SymposiumInfo) => {
    setEventInfo(newEventInfo);
    try {
      localStorage.setItem('simposium_event_info_custom', JSON.stringify(newEventInfo));
      if (newEventInfo.title) {
        document.title = newEventInfo.title;
      }
      syncAppIconWithEventLogo(newEventInfo);
    } catch (e) {
      console.error('Failed saving event info locally:', e);
      showToast('Peringatan: Ukuran data terlalu besar untuk penyimpanan lokal browser.');
    }
    if (isCloudAdmin && !isCloudWriteQuotaExhausted()) {
      clearDirtyLocal('eventInfo');
      saveEventInfoToFirestore(newEventInfo, firebaseUser?.uid).catch((err) => {
        console.error('Firestore eventInfo sync failed:', err);
        setDirtyLocal('eventInfo');
        showToast(
          isFirestoreQuotaError(err)
            ? QUOTA_EXCEEDED_TOAST
            : 'Gagal menyimpan pengaturan event ke Cloud Database.'
        );
      });
    } else {
      setDirtyLocal('eventInfo');
      if (isCloudAdmin && isCloudWriteQuotaExhausted()) {
        showToast(QUOTA_EXCEEDED_TOAST);
      }
    }
  };

  const handleSaveSpeakers = (newSpeakers: Speaker[]) => {
    setSpeakers(newSpeakers);
    try {
      localStorage.setItem('simposium_speakers_custom', JSON.stringify(newSpeakers));
    } catch (e) {
      console.error(e);
    }

    // Automatically propagate speaker photo/details update to sessions only if changed
    const updatedSessions = sessions.map(session => ({
      ...session,
      speakers: (session.speakers || []).map(sessSp => {
        const masterSp = newSpeakers.find(
          m => m.id === sessSp.id || m.name.toLowerCase().trim() === sessSp.name.toLowerCase().trim()
        );
        return masterSp ? { ...sessSp, ...masterSp, photoUrl: masterSp.photoUrl || sessSp.photoUrl } : sessSp;
      })
    }));
    const sessionsChanged = JSON.stringify(updatedSessions) !== JSON.stringify(sessions);
    if (sessionsChanged) {
      setSessions(updatedSessions);
      try {
        localStorage.setItem('simposium_sessions_custom', JSON.stringify(updatedSessions));
      } catch (e) {
        console.error(e);
      }
    }

    if (isCloudAdmin) {
      runTrackedCatalogSync(
        'speakers',
        () => syncSpeakersToFirestore(newSpeakers),
        'Data pembicara tersimpan lokal, namun gagal sinkron ke Cloud Database.'
      );
      if (sessionsChanged) {
        runTrackedCatalogSync(
          'sessions',
          () => syncSessionsToFirestore(updatedSessions),
          'Jadwal sesi tersimpan lokal, namun gagal sinkron ke Cloud Database.'
        );
      }
    } else {
      setDirtyLocal('speakers');
      if (sessionsChanged) {
        setDirtyLocal('sessions');
      }
    }
  };

  const handleSaveSessions = (newSessions: Session[]) => {
    const sortedSessions = sortSessionsChronologically(newSessions);
    setSessions(sortedSessions);
    try {
      localStorage.setItem('simposium_sessions_custom', JSON.stringify(sortedSessions));
    } catch (e) {
      console.error(e);
    }
    if (isCloudAdmin) {
      runTrackedCatalogSync(
        'sessions',
        () => syncSessionsToFirestore(sortedSessions),
        'Perubahan jadwal tersimpan lokal, namun gagal sinkron ke Cloud Database.'
      );
    } else {
      setDirtyLocal('sessions');
    }
  };

  const handleSaveExhibitors = (newExhibitors: Exhibitor[]) => {
    setExhibitors(newExhibitors);
    try {
      localStorage.setItem('simposium_exhibitors_custom', JSON.stringify(newExhibitors));
    } catch (e) {
      console.error(e);
    }
    if (isCloudAdmin) {
      runTrackedCatalogSync(
        'exhibitors',
        () => syncExhibitorsToFirestore(newExhibitors),
        'Perubahan data pameran tersimpan lokal, namun gagal sinkron ke Cloud Database.'
      );
    } else {
      setDirtyLocal('exhibitors');
    }
  };

  const handleSaveRooms = (newRooms: Room[]) => {
    setRooms(newRooms);
    try {
      localStorage.setItem('simposium_rooms_custom', JSON.stringify(newRooms));
    } catch (e) {
      console.error(e);
    }
    if (isCloudAdmin) {
      runTrackedCatalogSync(
        'rooms',
        () => syncRoomsToFirestore(newRooms),
        'Perubahan data ruangan tersimpan lokal, namun gagal sinkron ke Cloud Database.'
      );
    } else {
      setDirtyLocal('rooms');
    }
  };

  const handleResetToDefault = () => {
    const defaultSpeakers = Object.values(SPEAKERS_DATABASE);
    setSpeakers(defaultSpeakers);
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
    if (isCloudAdmin) {
      clearDirtyLocal('eventInfo');
      clearDirtyLocal('sessions');
      clearDirtyLocal('speakers');
      clearDirtyLocal('exhibitors');
      clearDirtyLocal('rooms');
      setIsCloudSyncing(true);
      Promise.all([
        saveEventInfoToFirestore(SYMPOSIUM_INFO, firebaseUser?.uid),
        syncSpeakersToFirestore(defaultSpeakers),
        syncSessionsToFirestore(SESSIONS_DATA),
        syncExhibitorsToFirestore(EXHIBITORS_DATA),
        syncRoomsToFirestore(DEFAULT_ROOMS_DATA),
      ])
        .catch((err) => console.error('Firestore reset sync failed:', err))
        .finally(() => setIsCloudSyncing(false));
    } else {
      setDirtyLocal('eventInfo');
      setDirtyLocal('sessions');
      setDirtyLocal('speakers');
      setDirtyLocal('exhibitors');
      setDirtyLocal('rooms');
    }
  };

  // Participant Management Handlers
  const handleSaveParticipants = (newParticipants: Participant[]) => {
    setParticipants(newParticipants);
    saveStoredParticipants(newParticipants);
    if (isCloudAdmin) {
      runTrackedCatalogSync(
        'participants',
        () => syncParticipantsToFirestore(newParticipants),
        'Data peserta tersimpan lokal, namun gagal sinkron ke Cloud Database.'
      );
    } else {
      setDirtyLocal('participants');
    }
  };

  const handleSelectParticipant = (p: Participant) => {
    setCurrentUser(p);
    setActiveParticipant(p);
    showToast(`Identitas aktif: ${p.name}`);
  };

  const handleParticipantLoginSuccess = (p: Participant) => {
    setCurrentUser(p);
    setActiveParticipant(p);
    setParticipantSessionLoggedIn(true);
    setIsParticipantLoggedIn(true);
    showToast(`Selamat datang, ${p.name}!`);
  };

  const handleParticipantLogout = () => {
    setParticipantSessionLoggedIn(false);
    setIsParticipantLoggedIn(false);
    const fallbackUser = participants[0] || DEFAULT_PARTICIPANTS_DATABASE[0];
    setCurrentUser(fallbackUser);
    setActiveParticipant(fallbackUser);
    if (firebaseUser && !isCloudAdmin) {
      signOutFirebase().catch(() => {});
    }
    showToast('Anda telah keluar dari sesi peserta.');
  };

  const handleParticipantGoogleSignIn = async (): Promise<{ ok: boolean; error?: string }> => {
    try {
      console.log('[handleParticipantGoogleSignIn] Initiating Google Sign-In...');
      const user = await signInWithGoogle();
      await ensureUserProfileAndCheckAdmin(user);
      const userEmail = (user.email || '').trim().toLowerCase();
      console.log('[handleParticipantGoogleSignIn] Authenticated Google user email:', userEmail);

      const localMatch = findParticipantByEmail(userEmail, participants);
      console.log('[handleParticipantGoogleSignIn] Local participant match by email:', localMatch);
      if (localMatch) {
        handleParticipantLoginSuccess(localMatch);
        return { ok: true };
      }

      const cloudMatch = await lookupOwnParticipantByEmailInFirestore(userEmail);
      console.log('[handleParticipantGoogleSignIn] Cloud participant match by email:', cloudMatch);
      if (cloudMatch) {
        const { participants: merged } = registerOrUpdateParticipant(cloudMatch);
        setParticipants(merged);
        handleParticipantLoginSuccess(cloudMatch);
        return { ok: true };
      }

      console.warn('[handleParticipantGoogleSignIn] Email not found in local or cloud store:', userEmail);
      return {
        ok: false,
        error: `Email Google "${user.email || 'Anda'}" belum terdaftar di data peserta simposium. Silakan login menggunakan Id_registrant atau hubungi panitia.`,
      };
    } catch (err: unknown) {
      console.error('[handleParticipantGoogleSignIn] Error during Google Sign-In:', err);
      const formatted = formatFirebaseAuthError(err);
      return {
        ok: false,
        error: formatted || 'Gagal masuk dengan akun Google.',
      };
    }
  };

  // Filter States
  const [selectedRoom, setSelectedRoom] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua Kategori');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [selectedSessionTab, setSelectedSessionTab] = useState<'abstract' | 'materials' | 'speakers'>('abstract');
  const [selectedSpeaker, setSelectedSpeaker] = useState<Speaker | null>(null);

  const handleOpenSession = (session: Session, tab: 'abstract' | 'materials' | 'speakers' = 'abstract') => {
    setSelectedSession(session);
    setSelectedSessionTab(tab);
  };

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Ref holding latest catalog & participants for initial Firestore seed without effect churn
  const latestCatalogRef = useRef({
    eventInfo,
    sessions,
    speakers,
    exhibitors,
    rooms,
    participants,
  });
  latestCatalogRef.current = {
    eventInfo,
    sessions,
    speakers,
    exhibitors,
    rooms,
    participants,
  };

  const lastBroadcastTimestampRef = useRef<number | null>(activeBroadcast?.timestamp ?? null);

  // 1. Firebase Auth Listener + Admin Role Check + Initial Catalog Seeding
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      setAuthReady(true);

      if (!user) {
        setIsCloudAdmin(false);
        return;
      }

      try {
        const { isAdmin } = await ensureUserProfileAndCheckAdmin(user);
        setIsCloudAdmin(isAdmin);
        if (isAdmin) {
          setIsAdminAuthenticated(true);
          setIsAdminLoginModalOpen(false);
          if (typeof window !== 'undefined' && parseTabFromHash(window.location.hash) === 'admin') {
            setActiveTab('admin');
          }
          if (isCloudWriteQuotaExhausted()) {
            return;
          }
          setIsCloudSyncing(true);
          try {
            const didSeed = await seedInitialCatalogIfEmpty({
              ...latestCatalogRef.current,
              adminUid: user.uid,
            });
            if (didSeed) {
              clearDirtyLocal('eventInfo');
              clearDirtyLocal('sessions');
              clearDirtyLocal('speakers');
              clearDirtyLocal('exhibitors');
              clearDirtyLocal('rooms');
              showToast('Database Cloud Firestore berhasil diinisialisasi!');
            } else {
              const syncedLabels: string[] = [];
              if (isDirtyLocal('eventInfo')) {
                await saveEventInfoToFirestore(latestCatalogRef.current.eventInfo, user.uid);
                clearDirtyLocal('eventInfo');
                syncedLabels.push('Pengaturan Event');
              }
              if (isDirtyLocal('sessions')) {
                inFlightCloudSyncRef.current.sessions += 1;
                try {
                  await syncSessionsToFirestore(latestCatalogRef.current.sessions);
                  clearDirtyLocal('sessions');
                  syncedLabels.push('Jadwal');
                } finally {
                  inFlightCloudSyncRef.current.sessions = Math.max(0, inFlightCloudSyncRef.current.sessions - 1);
                }
              }
              if (isDirtyLocal('speakers')) {
                inFlightCloudSyncRef.current.speakers += 1;
                try {
                  await syncSpeakersToFirestore(latestCatalogRef.current.speakers);
                  clearDirtyLocal('speakers');
                  syncedLabels.push('Pembicara');
                } finally {
                  inFlightCloudSyncRef.current.speakers = Math.max(0, inFlightCloudSyncRef.current.speakers - 1);
                }
              }
              if (isDirtyLocal('exhibitors')) {
                inFlightCloudSyncRef.current.exhibitors += 1;
                try {
                  await syncExhibitorsToFirestore(latestCatalogRef.current.exhibitors);
                  clearDirtyLocal('exhibitors');
                  syncedLabels.push('Pameran');
                } finally {
                  inFlightCloudSyncRef.current.exhibitors = Math.max(0, inFlightCloudSyncRef.current.exhibitors - 1);
                }
              }
              if (isDirtyLocal('rooms')) {
                inFlightCloudSyncRef.current.rooms += 1;
                try {
                  await syncRoomsToFirestore(latestCatalogRef.current.rooms);
                  clearDirtyLocal('rooms');
                  syncedLabels.push('Ruangan');
                } finally {
                  inFlightCloudSyncRef.current.rooms = Math.max(0, inFlightCloudSyncRef.current.rooms - 1);
                }
              }
              if (syncedLabels.length > 0) {
                showToast(`Perubahan lokal (${syncedLabels.join(', ')}) disinkronkan ke Cloud!`);
              }
            }
          } finally {
            setIsCloudSyncing(false);
          }
        }
      } catch (err) {
        console.error('Auth profile check error:', err);
        setIsCloudAdmin(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // 2. Real-Time Public Conference Catalog Subscription (All Users)
  useEffect(() => {
    const unsubscribeCatalog = subscribePublicCatalog({
      onEventInfo: (info) => {
        if (isDirtyLocal('eventInfo')) {
          return;
        }
        setEventInfo((prev) => {
          const mergedInfo: SymposiumInfo = {
            ...SYMPOSIUM_INFO,
            ...info,
            workshopIdentityCardTemplates:
              info.workshopIdentityCardTemplates ?? prev.workshopIdentityCardTemplates,
            certificateTemplates:
              info.certificateTemplates ?? prev.certificateTemplates,
            dates: {
              ...SYMPOSIUM_INFO.dates,
              ...(info.dates || {}),
              workshop:
                !info.dates?.workshop || info.dates.workshop === 'Sabtu, 28 November 2026'
                  ? '28 November 2026'
                  : info.dates.workshop,
              munasSymposium:
                info.dates?.munasSymposium || '29 November 2026 - 1 Desember 2026',
            },
          };
          try {
            localStorage.setItem('simposium_event_info_custom', JSON.stringify(mergedInfo));
          } catch {}
          return mergedInfo;
        });
      },
      onWorkshopCardTemplates: (cloudTemplates) => {
        if (isDirtyLocal('eventInfo')) {
          return;
        }
        setEventInfo((prev) => {
          const mergedInfo: SymposiumInfo = {
            ...prev,
            workshopIdentityCardTemplates: cloudTemplates,
          };
          try {
            localStorage.setItem('simposium_event_info_custom', JSON.stringify(mergedInfo));
          } catch {}
          return mergedInfo;
        });
      },
      onCertificateTemplates: (cloudCertTemplates) => {
        if (isDirtyLocal('eventInfo')) {
          return;
        }
        setEventInfo((prev) => {
          const mergedInfo: SymposiumInfo = {
            ...prev,
            certificateTemplates: cloudCertTemplates,
          };
          try {
            localStorage.setItem('simposium_event_info_custom', JSON.stringify(mergedInfo));
          } catch {}
          return mergedInfo;
        });
      },
      onSessions: (cloudSessions) => {
        if (isDirtyLocal('sessions') || inFlightCloudSyncRef.current.sessions > 0) {
          return;
        }
        const sortedCloudSessions = sortSessionsChronologically(cloudSessions);
        setSessions(sortedCloudSessions);
        try {
          localStorage.setItem('simposium_sessions_custom', JSON.stringify(sortedCloudSessions));
        } catch {}
      },
      onSpeakers: (cloudSpeakers) => {
        if (isDirtyLocal('speakers') || inFlightCloudSyncRef.current.speakers > 0) {
          return;
        }
        setSpeakers(cloudSpeakers);
        try {
          localStorage.setItem('simposium_speakers_custom', JSON.stringify(cloudSpeakers));
        } catch {}
      },
      onExhibitors: (cloudExhibitors) => {
        if (isDirtyLocal('exhibitors') || inFlightCloudSyncRef.current.exhibitors > 0) {
          return;
        }
        setExhibitors(cloudExhibitors);
        try {
          localStorage.setItem('simposium_exhibitors_custom', JSON.stringify(cloudExhibitors));
        } catch {}
      },
      onRooms: (cloudRooms) => {
        if (isDirtyLocal('rooms') || inFlightCloudSyncRef.current.rooms > 0) {
          return;
        }
        setRooms(cloudRooms);
        try {
          localStorage.setItem('simposium_rooms_custom', JSON.stringify(cloudRooms));
        } catch {}
      },
      onBroadcast: (cloudBroadcast) => {
        setActiveBroadcast(cloudBroadcast);
        try {
          if (cloudBroadcast) {
            localStorage.setItem('simposium_broadcast_active', JSON.stringify(cloudBroadcast));
            if (
              cloudBroadcast.sound &&
              cloudBroadcast.timestamp !== lastBroadcastTimestampRef.current
            ) {
              playBroadcastChime(cloudBroadcast.type);
            }
            lastBroadcastTimestampRef.current = cloudBroadcast.timestamp;
          } else {
            localStorage.removeItem('simposium_broadcast_active');
            lastBroadcastTimestampRef.current = null;
          }
        } catch {}
      },
    });

    return () => unsubscribeCatalog();
  }, []);

  const lastDirSyncSigRef = useRef<string>('');

  const pendingLocalParticipantPushRef = useRef<boolean>(false);

  // 3. Authenticated User Private Data Subscription (Participants)
  useEffect(() => {
    if (!authReady || !firebaseUser) return;

    const unsubscribePrivate = subscribeUserPrivateData(
      firebaseUser.uid,
      firebaseUser.email || '',
      isCloudAdmin,
      {
        onParticipants: (cloudParticipants) => {
          if (isCloudAdmin) {
            if (
              pendingLocalParticipantPushRef.current ||
              inFlightCloudSyncRef.current.participants > 0
            ) {
              return;
            }

            const hasUnsyncedLocalEdits = isDirtyLocal('participants');

            if (hasUnsyncedLocalEdits) {
              if (isCloudWriteQuotaExhausted()) {
                return;
              }
              const localToPush = [...latestCatalogRef.current.participants];
              pendingLocalParticipantPushRef.current = true;
              inFlightCloudSyncRef.current.participants += 1;
              syncParticipantsToFirestore(localToPush)
                .then(() => {
                  clearDirtyLocal('participants');
                  showToast(`${localToPush.length} data peserta lokal disinkronkan ke Cloud!`);
                })
                .catch((err) => {
                  console.error('Auto-push local participants failed:', err);
                  if (isFirestoreQuotaError(err)) {
                    showToast(QUOTA_EXCEEDED_TOAST);
                  }
                })
                .finally(() => {
                  pendingLocalParticipantPushRef.current = false;
                  inFlightCloudSyncRef.current.participants = Math.max(
                    0,
                    inFlightCloudSyncRef.current.participants - 1
                  );
                });
              return;
            }

            setParticipants(cloudParticipants);
            saveStoredParticipants(cloudParticipants);
            const sig = cloudParticipants
              .map(
                (p) =>
                  `${p.id}:${p.idRegistrant || ''}:${p.badgeId || ''}:${p.name}:${JSON.stringify(
                    p.customFields || {}
                  )}`
              )
              .join('|');
            if (sig && sig !== lastDirSyncSigRef.current && !isCloudWriteQuotaExhausted()) {
              lastDirSyncSigRef.current = sig;
              ensureRegistrantDirectorySynced(cloudParticipants)
                .then((writtenCount) => {
                  if (writtenCount > 0) {
                    showToast(`${writtenCount} ID peserta disinkronkan ke Cloud.`);
                  }
                })
                .catch((err) => {
                  console.warn('Auto registrant_directory backfill failed:', err);
                });
            }
          } else if (cloudParticipants.length > 0) {
            const ownMatch = cloudParticipants[0];
            setCurrentUser(ownMatch);
            setActiveParticipant(ownMatch);
            setParticipantSessionLoggedIn(true);
            setIsParticipantLoggedIn(true);
            const { participants: merged } = registerOrUpdateParticipant(ownMatch);
            setParticipants(merged);
          }
        },
      }
    );

    return () => unsubscribePrivate();
  }, [authReady, firebaseUser?.uid, firebaseUser?.email, isCloudAdmin]);

  // 4. Real-time Firestore Connection for Logged-in Participant (Id_registrant)
  const loggedInIdRegistrant = isParticipantLoggedIn
    ? extractParticipantIdRegistrant(currentUser)
    : '';

  useEffect(() => {
    if (!isParticipantLoggedIn || !loggedInIdRegistrant) return;

    const unsubscribeParticipantDoc = subscribeParticipantByIdRegistrantInFirestore(
      loggedInIdRegistrant,
      (cloudParticipant) => {
        setCurrentUser((prev) => {
          const merged: Participant = {
            ...prev,
            ...cloudParticipant,
            id: prev.id || cloudParticipant.id,
            email: prev.email || cloudParticipant.email,
          };
          if (
            prev.name === merged.name &&
            prev.title === merged.title &&
            prev.institution === merged.institution &&
            prev.role === merged.role &&
            prev.ticketType === merged.ticketType &&
            prev.badgeId === merged.badgeId &&
            prev.idRegistrant === merged.idRegistrant
          ) {
            return prev;
          }
          setActiveParticipant(merged);
          return merged;
        });
      }
    );

    return () => unsubscribeParticipantDoc();
  }, [isParticipantLoggedIn, loggedInIdRegistrant]);

  // 5. Auto-login Participant via URL QR/Link (?id_registrant=... or ?registrant=...)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const paramId = (
      params.get('id_registrant') ||
      params.get('registrant') ||
      params.get('id') ||
      ''
    )
      .trim()
      .slice(0, 80);
    if (!paramId) return;

    let cancelled = false;
    (async () => {
      const cloudMatch = await lookupParticipantByIdRegistrantInFirestore(paramId);
      const localMatch = findParticipantByIdRegistrant(paramId, latestCatalogRef.current.participants);
      const resolved = cloudMatch
        ? localMatch
          ? { ...localMatch, ...cloudMatch, id: localMatch.id || cloudMatch.id }
          : cloudMatch
        : localMatch;

      if (!cancelled && resolved) {
        handleParticipantLoginSuccess(resolved);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleForceCloudSync = async () => {
    if (!isCloudAdmin || !firebaseUser) {
      showToast('Silakan masuk dengan akun Google Admin terlebih dahulu.');
      return;
    }
    resetCloudWriteQuotaFlag();
    setIsCloudSyncing(true);
    const keys: Array<'sessions' | 'speakers' | 'exhibitors' | 'rooms' | 'participants'> = [
      'sessions',
      'speakers',
      'exhibitors',
      'rooms',
      'participants',
    ];
    keys.forEach((k) => {
      inFlightCloudSyncRef.current[k] += 1;
    });
    try {
      await Promise.all([
        saveEventInfoToFirestore(eventInfo, firebaseUser.uid),
        syncSessionsToFirestore(sessions),
        syncLocalPdfMaterialsToFirestore(sessions),
        syncSpeakersToFirestore(speakers),
        syncExhibitorsToFirestore(exhibitors),
        syncRoomsToFirestore(rooms),
        syncParticipantsToFirestore(participants),
      ]);
      clearDirtyLocal('eventInfo');
      clearDirtyLocal('sessions');
      clearDirtyLocal('speakers');
      clearDirtyLocal('exhibitors');
      clearDirtyLocal('rooms');
      clearDirtyLocal('participants');
      showToast('Seluruh data berhasil disinkronkan ke Cloud Database!');
    } catch (err) {
      console.error('Force cloud sync failed:', err);
      showToast(
        isFirestoreQuotaError(err)
          ? QUOTA_EXCEEDED_TOAST
          : 'Sebagian data gagal disinkronkan ke Cloud.'
      );
    } finally {
      keys.forEach((k) => {
        inFlightCloudSyncRef.current[k] = Math.max(0, inFlightCloudSyncRef.current[k] - 1);
      });
      setIsCloudSyncing(false);
    }
  };

  const handleCloudAdminSignIn = async () => {
    try {
      const user = await signInWithGoogle();
      const { isAdmin } = await ensureUserProfileAndCheckAdmin(user);
      if (isAdmin) {
        const syncedLabels: string[] = [];
        if (isDirtyLocal('eventInfo')) {
          await saveEventInfoToFirestore(latestCatalogRef.current.eventInfo, user.uid);
          clearDirtyLocal('eventInfo');
          syncedLabels.push('Pengaturan Event');
        }
        if (isDirtyLocal('sessions')) {
          inFlightCloudSyncRef.current.sessions += 1;
          try {
            await syncSessionsToFirestore(latestCatalogRef.current.sessions);
            clearDirtyLocal('sessions');
            syncedLabels.push('Jadwal');
          } finally {
            inFlightCloudSyncRef.current.sessions = Math.max(0, inFlightCloudSyncRef.current.sessions - 1);
          }
        }
        if (isDirtyLocal('speakers')) {
          inFlightCloudSyncRef.current.speakers += 1;
          try {
            await syncSpeakersToFirestore(latestCatalogRef.current.speakers);
            clearDirtyLocal('speakers');
            syncedLabels.push('Pembicara');
          } finally {
            inFlightCloudSyncRef.current.speakers = Math.max(0, inFlightCloudSyncRef.current.speakers - 1);
          }
        }
        if (isDirtyLocal('exhibitors')) {
          inFlightCloudSyncRef.current.exhibitors += 1;
          try {
            await syncExhibitorsToFirestore(latestCatalogRef.current.exhibitors);
            clearDirtyLocal('exhibitors');
            syncedLabels.push('Pameran');
          } finally {
            inFlightCloudSyncRef.current.exhibitors = Math.max(0, inFlightCloudSyncRef.current.exhibitors - 1);
          }
        }
        if (isDirtyLocal('rooms')) {
          inFlightCloudSyncRef.current.rooms += 1;
          try {
            await syncRoomsToFirestore(latestCatalogRef.current.rooms);
            clearDirtyLocal('rooms');
            syncedLabels.push('Ruangan');
          } finally {
            inFlightCloudSyncRef.current.rooms = Math.max(0, inFlightCloudSyncRef.current.rooms - 1);
          }
        }
        setIsCloudAdmin(true);
        setIsAdminAuthenticated(true);
        showToast(
          syncedLabels.length > 0
            ? `Terhubung ke Cloud & perubahan lokal (${syncedLabels.join(', ')}) tersinkron (${user.email})`
            : `Terhubung ke Cloud Database sebagai ${user.email}`
        );
      } else {
        await signOutFirebase();
        showToast(`Akun ${user.email} belum terdaftar sebagai Administrator.`);
      }
    } catch (err: unknown) {
      const formatted = formatFirebaseAuthError(err);
      if (formatted) {
        showToast(formatted);
      }
    }
  };

  const handleCloudSignInAndSyncParticipants = async () => {
    const localSnapshot = [...latestCatalogRef.current.participants];
    pendingLocalParticipantPushRef.current = true;
    try {
      const user = await signInWithGoogle();
      const { isAdmin } = await ensureUserProfileAndCheckAdmin(user);
      if (isAdmin) {
        setIsCloudSyncing(true);
        try {
          await syncParticipantsToFirestore(localSnapshot);
          try {
            localStorage.removeItem('simposium_participants_dirty_local_v1');
          } catch {}
          setIsCloudAdmin(true);
          setIsAdminAuthenticated(true);
          showToast(`Terhubung sebagai ${user.email} & ${localSnapshot.length} data peserta tersinkron ke Cloud!`);
        } finally {
          pendingLocalParticipantPushRef.current = false;
          setIsCloudSyncing(false);
        }
      } else {
        pendingLocalParticipantPushRef.current = false;
        await signOutFirebase();
        showToast(`Akun ${user.email} belum terdaftar sebagai Administrator.`);
      }
    } catch (err: unknown) {
      pendingLocalParticipantPushRef.current = false;
      const formatted = formatFirebaseAuthError(err);
      if (formatted) {
        showToast(formatted);
      }
    }
  };

  // Directional Tab Navigation Helper for Smooth Framer Motion Slide Transitions
  // Consistently updates URL hash (e.g. #symposium) instead of History API paths for GitHub Pages compatibility
  const navigateToTab = (nextTab: MainTabType) => {
    syncTabToUrlHash(nextTab);
    if (nextTab === activeTab) return;
    const prevIdx = TAB_ORDER.indexOf(activeTab);
    const nextIdx = TAB_ORDER.indexOf(nextTab);
    const direction = prevIdx !== -1 && nextIdx !== -1 ? (nextIdx > prevIdx ? 1 : -1) : 1;
    setTabDirection(direction);
    setActiveTab(nextTab);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    // Ensure initial load sets canonical hash if none is present
    if (typeof window !== 'undefined' && !window.location.hash) {
      syncTabToUrlHash(activeTab);
    }

    const handleHashChange = () => {
      const parsedTab = parseTabFromHash(window.location.hash);
      if (!parsedTab || parsedTab === 'home') {
        if (activeTab !== 'home') {
          setTabDirection(-1);
          setActiveTab('home');
        }
        return;
      }
      if (parsedTab === 'admin' && !isAdminAuthenticated) {
        setIsAdminLoginModalOpen(true);
        syncTabToUrlHash(activeTab);
        return;
      }
      if (parsedTab !== activeTab) {
        const prevIdx = TAB_ORDER.indexOf(activeTab);
        const nextIdx = TAB_ORDER.indexOf(parsedTab);
        setTabDirection(prevIdx !== -1 && nextIdx !== -1 ? (nextIdx > prevIdx ? 1 : -1) : 1);
        setActiveTab(parsedTab);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeTab, isAdminAuthenticated]);

  // Guarded Admin Navigation and Auth Handlers
  const handleOpenAdmin = () => {
    if (isAdminAuthenticated) {
      navigateToTab('admin');
    } else {
      setIsAdminLoginModalOpen(true);
    }
  };

  const handleAdminLoginSuccess = (cloudAdmin = false) => {
    setIsAdminAuthenticated(true);
    if (cloudAdmin) {
      setIsCloudAdmin(true);
    }
    setIsAdminLoginModalOpen(false);
    navigateToTab('admin');
    showToast(
      cloudAdmin
        ? 'Login Admin Google Cloud Sync Berhasil!'
        : 'Login Admin Mode Lokal Berhasil!'
    );
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setIsQRCodeModalOpen(false);
    if (isCloudAdmin) {
      setIsCloudAdmin(false);
      signOutFirebase().catch(() => {});
    }
    try {
      sessionStorage.removeItem('simposium_admin_auth');
      localStorage.removeItem('simposium_admin_auth');
    } catch (e) {
      console.error(e);
    }
    navigateToTab('home');
    showToast("Anda telah keluar dari sesi Admin.");
  };

  const handleSelectTab = (tab: MainTabType) => {
    if (tab === 'admin') {
      handleOpenAdmin();
      return;
    }
    navigateToTab(tab);
  };

  const displaySessions = sortSessionsChronologically(
    sessions.map(session => ({
      ...session,
      speakers: (session.speakers || []).map(sessSp => {
        const masterSp = speakers.find(
          m => m.id === sessSp.id || m.name.toLowerCase().trim() === sessSp.name.toLowerCase().trim()
        );
        return masterSp ? { ...sessSp, ...masterSp, photoUrl: masterSp.photoUrl || sessSp.photoUrl } : sessSp;
      })
    }))
  );

  const workshopsCount = displaySessions.filter(
    s => s.type === 'Workshop Hands-On' || s.category.includes('Workshop') || s.day.toLowerCase().includes('workshop')
  ).length;

  const symposiumsCount = displaySessions.filter(
    s => s.type !== 'Workshop Hands-On' && !s.category.includes('Workshop') && !s.day.toLowerCase().includes('workshop')
  ).length;

  // Render main body based on tab
  const renderMainContent = () => {
    if (activeTab === 'home') {
      return (
        <LandingPageView
          onSelectTab={handleSelectTab}
          onOpenAdmin={handleOpenAdmin}
          onOpenInstallModal={() => setIsInstallModalOpen(true)}
          onOpenQRCodeModal={isAdminAuthenticated ? () => setIsQRCodeModalOpen(true) : undefined}
          onOpenParticipantLogin={() => setIsParticipantLoginModalOpen(true)}
          currentUser={currentUser}
          isParticipantLoggedIn={isParticipantLoggedIn}
          speakerCount={speakers.length}
          workshopCount={workshopsCount}
          symposiumCount={symposiumsCount}
          exhibitorCount={exhibitors.length}
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
          onBackToApp={() => navigateToTab('home')}
          onLogout={handleAdminLogout}
          onSendBroadcast={handleSendBroadcast}
          onClearActiveBroadcast={handleClearActiveBroadcast}
          activeBroadcast={activeBroadcast}
          attendances={[]}
          bookmarks={[]}
          firebaseUser={firebaseUser}
          isCloudAdmin={isCloudAdmin}
          isCloudSyncing={isCloudSyncing}
          onForceCloudSync={handleForceCloudSync}
          onCloudAdminSignIn={handleCloudAdminSignIn}
          onCloudSignInAndSyncParticipants={handleCloudSignInAndSyncParticipants}
          onOpenQRCodeModal={() => setIsQRCodeModalOpen(true)}
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
          sessions={displaySessions}
          onSelectSession={(s, tab) => handleOpenSession(s, tab || 'abstract')}
          onSelectSpeaker={(sp) => setSelectedSpeaker(sp)}
          onOpenVenue={() => navigateToTab('venue')}
          eventInfo={eventInfo}
        />
      );
    }

    if (activeTab === 'pameran') {
      return (
        <ExhibitionView
          exhibitors={exhibitors}
          onOpenVenue={() => navigateToTab('venue')}
        />
      );
    }

    if (activeTab === 'venue') {
      return (
        <InteractiveVenueMap
          rooms={rooms}
          eventInfo={eventInfo}
        />
      );
    }

    if (activeTab === 'sertifikat') {
      return (
        <CertificateDownloadView
          participants={participants}
          sessions={displaySessions}
          currentUser={currentUser}
          isParticipantLoggedIn={isParticipantLoggedIn}
          onLoginSuccess={handleParticipantLoginSuccess}
          onOpenParticipantLogin={() => setIsParticipantLoginModalOpen(true)}
          onGoogleSignIn={handleParticipantGoogleSignIn}
          eventInfo={eventInfo}
        />
      );
    }

    // Default: 'symposium'
    return (
      <SymposiumScheduleView
        sessions={displaySessions}
        rooms={rooms}
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

        {/* Offline Mode Status Banner */}
        <OfflineIndicator />

        {/* App Header */}
        <Header
          onOpenAdmin={handleOpenAdmin}
          onAdminLogout={handleAdminLogout}
          onOpenInstallModal={() => setIsInstallModalOpen(true)}
          onOpenQRCodeModal={isAdminAuthenticated ? () => setIsQRCodeModalOpen(true) : undefined}
          onOpenParticipantLogin={() => setIsParticipantLoginModalOpen(true)}
          currentUser={currentUser}
          isParticipantLoggedIn={isParticipantLoggedIn}
          isMobileFrame={isMobileFrame}
          onToggleFrame={() => setIsMobileFrame(!isMobileFrame)}
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          eventInfo={eventInfo}
          isAdminAuthenticated={isAdminAuthenticated}
        />

        {/* Main Sticky Navigation Menu Bar (only shown on sub-pages, keeping Landing Page dedicated to Header + Menus) */}
        <AnimatePresence initial={false}>
          {activeTab !== 'home' && activeTab !== 'admin' && (
            <motion.div
              key="main-menu-tabs-bar"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
              className="sticky top-[48px] sm:top-[52px] z-20"
            >
              <MainMenuTabs
                activeTab={activeTab}
                onSelectTab={handleSelectTab}
                speakerCount={speakers.length}
                workshopCount={workshopsCount}
                symposiumCount={symposiumsCount}
                exhibitorCount={exhibitors.length}
                isAdminAuthenticated={isAdminAuthenticated}
                eventInfo={eventInfo}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Area with Ultra-Soft Fade-In Transition */}
        <main className="flex-1 pb-24 sm:pb-28 overflow-x-hidden">
          <AnimatePresence mode="wait" custom={tabDirection} initial={false}>
            <motion.div
              key={activeTab}
              custom={tabDirection}
              variants={tabSlideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="will-change-transform"
            >
              {renderMainContent()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Session Detail Modal */}
        <AnimatePresence>
          {selectedSession && (
            <SessionDetailModal
              session={displaySessions.find(s => s.id === selectedSession.id) || selectedSession}
              allSessions={displaySessions}
              onClose={() => setSelectedSession(null)}
              onSelectSpeaker={(sp) => setSelectedSpeaker(sp)}
              initialTab={selectedSessionTab}
              eventInfo={eventInfo}
              currentUser={currentUser}
              isParticipantLoggedIn={isParticipantLoggedIn}
              isAdminAuthenticated={isAdminAuthenticated || isCloudAdmin}
              onRequestLogin={() => setIsParticipantLoginModalOpen(true)}
            />
          )}
        </AnimatePresence>

        {/* Speaker Profile Modal */}
        <AnimatePresence>
          {selectedSpeaker && (
            <SpeakerModal
              speaker={selectedSpeaker}
              allSessions={displaySessions}
              onClose={() => setSelectedSpeaker(null)}
              onSelectSession={(s, tab) => handleOpenSession(s, tab || 'abstract')}
            />
          )}
        </AnimatePresence>

        {/* Real-time Broadcast Notification Toast for all Participants */}
        <BroadcastNotificationToast
          broadcast={activeBroadcast}
          onClose={() => setActiveBroadcast(null)}
          onNavigateTab={(tabKey) => {
            if (TAB_ORDER.includes(tabKey as MainTabType)) {
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

        {/* Participant Login Modal (Id_registrant) */}
        <AnimatePresence>
          {isParticipantLoginModalOpen && (
            <ParticipantLoginModal
              isOpen={isParticipantLoginModalOpen}
              onClose={() => setIsParticipantLoginModalOpen(false)}
              participants={participants}
              currentUser={currentUser}
              isParticipantLoggedIn={isParticipantLoggedIn}
              onLoginSuccess={handleParticipantLoginSuccess}
              onLogout={handleParticipantLogout}
              onGoogleSignIn={handleParticipantGoogleSignIn}
              eventInfo={eventInfo}
            />
          )}
        </AnimatePresence>

        {/* Mobile App (PWA) Installer Modal */}
        <PWAInstallModal
          isOpen={isInstallModalOpen}
          onClose={() => setIsInstallModalOpen(false)}
          eventTitle={eventInfo.title}
          eventInfo={eventInfo}
        />

        {/* Application QR Code Generator Modal (Admin Only) */}
        <AnimatePresence>
          {isQRCodeModalOpen && isAdminAuthenticated && (
            <AppQRCodeModal
              isOpen={isQRCodeModalOpen}
              onClose={() => setIsQRCodeModalOpen(false)}
              eventInfo={eventInfo}
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
          symposiumCount={symposiumsCount}
          speakerCount={speakers.length}
          eventInfo={eventInfo}
        />

      </div>

    </div>
  );
}
