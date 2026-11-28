import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Compass,
  Layers,
  Users,
  Info,
  Search,
  Sparkles,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Move,
  MapPin,
  PanelRightClose,
  PanelRightOpen,
  ArrowUp,
  ArrowDown,
  WifiOff,
  Check,
  DownloadCloud,
  RefreshCw,
  X,
  Store,
  Calendar,
  Clock,
  ChevronRight,
  Mic2
} from 'lucide-react';
import { SYMPOSIUM_INFO } from '../data/symposiumData';
import { DEFAULT_ROOMS_DATA } from '../data/roomsData';
import { EXHIBITORS_DATA } from '../data/exhibitorsData';
import { Session, Speaker, Room, SymposiumInfo, Exhibitor } from '../types';
import { getThemePalette } from '../utils/themeColors';
import {
  sortSessionsChronologically,
  getSessionTimeRangeMinutes
} from '../utils/sessionSorting';
import {
  saveVenueMapToCache,
  loadVenueMapFromCache,
  loadVenueMapFromLocalSync,
  saveVenueMapUIState,
  loadVenueMapUIState,
  VenueMapOfflineSnapshot
} from '../utils/venueMapCache';

interface InteractiveVenueMapProps {
  rooms?: Room[];
  sessions?: Session[];
  exhibitors?: Exhibitor[];
  initialFocusTarget?: {
    focusBoothArea?: boolean;
    nonce: number;
  } | null;
  onSelectSession?: (session: Session) => void;
  onSelectSpeaker?: (speaker: Speaker) => void;
  onOpenExhibition?: () => void;
  eventInfo?: SymposiumInfo;
}

// Architectural SVG Room boundaries definition mapped to Room ID for rich visual floor plans
interface RoomGeoPolygon {
  roomId: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // percentage
  height: number; // percentage
  label: string;
  entryDoor?: { x: number; y: number; label?: string };
  isBoothArea?: boolean;
}

const DEFAULT_BOOTH_FOYER_ROOM: Room = {
  id: 'Foyer & Exhibition Amartapura',
  name: 'Foyer Amartapura Ballroom (Area Booth Pameran)',
  shortName: 'Foyer Amartapura',
  floor: 'Lantai 1',
  capacity: 300,
  x: 50,
  y: 81,
  color: 'bg-amber-500',
  badgeBg: 'bg-amber-600 text-white',
  description:
    'Lokasi seluruh Booth Pameran Industri Farmasi & Alat Kesehatan di Foyer Amartapura Ballroom Lantai 1, dilengkapi coffee break counter dan meja registrasi.',
  facilities: [
    'Area Booth Pameran Industri',
    'Coffee Break Counter',
    'Meja Registrasi Barcode QR',
    'Helpdesk SKP PDHI'
  ],
  type: 'facility'
};

const isBoothFoyerRoom = (room?: Room | null): boolean => {
  if (!room) return false;
  if (room.id === 'Foyer & Exhibition Amartapura') return true;
  const text = `${room.id} ${room.name} ${room.shortName}`.toLowerCase();
  const floorText = (room.floor || '').toLowerCase();
  return (
    (text.includes('foyer') && text.includes('amartapura')) ||
    ((text.includes('foyer') || text.includes('exhibition') || text.includes('booth')) &&
      (floorText.includes('1') || floorText.includes('atas')))
  );
};

const MONTH_NAME_MAP: Record<string, number> = {
  jan: 0,
  januari: 0,
  january: 0,
  feb: 1,
  februari: 1,
  february: 1,
  mar: 2,
  maret: 2,
  march: 2,
  apr: 3,
  april: 3,
  mei: 4,
  may: 4,
  jun: 5,
  juni: 5,
  june: 5,
  jul: 6,
  juli: 6,
  july: 6,
  agu: 7,
  agt: 7,
  agustus: 7,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  okt: 9,
  oktober: 9,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  des: 11,
  desember: 11,
  dec: 11,
  december: 11
};

const parseCalendarDateFromText = (
  raw?: string | null
): { year?: number; month: number; day: number } | null => {
  if (!raw) return null;
  const text = String(raw).trim();
  if (!text) return null;

  // ISO format: YYYY-MM-DD
  const iso = text.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/);
  if (iso) {
    const year = parseInt(iso[1], 10);
    const month = parseInt(iso[2], 10) - 1;
    const day = parseInt(iso[3], 10);
    if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
      return { year, month, day };
    }
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = text.match(/\b(\d{1,2})[/-](\d{1,2})[/-](20\d{2})\b/);
  if (dmy) {
    const day = parseInt(dmy[1], 10);
    const month = parseInt(dmy[2], 10) - 1;
    const year = parseInt(dmy[3], 10);
    if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
      return { year, month, day };
    }
  }

  // DD MonthName [YYYY], e.g. "Sabtu, 28 November 2026" or "Workshop (28 Nov)"
  const named = text.match(/\b(\d{1,2})\s+([A-Za-z]+)(?:\s+(20\d{2}))?\b/);
  if (named) {
    const day = parseInt(named[1], 10);
    const monthKey = named[2].toLowerCase();
    const month = MONTH_NAME_MAP[monthKey];
    const year = named[3] ? parseInt(named[3], 10) : undefined;
    if (month !== undefined && day >= 1 && day <= 31) {
      return { year, month, day };
    }
  }

  return null;
};

const isSessionOnToday = (session: Session, now: Date): boolean => {
  const parsed =
    parseCalendarDateFromText(session.date) ||
    parseCalendarDateFromText(session.day);
  if (!parsed) return false;
  if (parsed.day !== now.getDate() || parsed.month !== now.getMonth()) {
    return false;
  }
  if (parsed.year !== undefined && parsed.year !== now.getFullYear()) {
    return false;
  }
  return true;
};

type SessionLiveStatus = 'live' | 'upcoming' | 'finished' | 'scheduled';

const getSessionLiveStatus = (
  session: Session,
  now: Date
): SessionLiveStatus => {
  if (!isSessionOnToday(session, now)) return 'scheduled';
  const { start, end } = getSessionTimeRangeMinutes(session);
  if (start === Number.MAX_SAFE_INTEGER) return 'upcoming';
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const effectiveEnd = end > start ? end : start + 45;
  if (nowMinutes >= start && nowMinutes < effectiveEnd) return 'live';
  if (nowMinutes < start) return 'upcoming';
  return 'finished';
};

const normalizeRoomToken = (val?: string | null): string =>
  String(val || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const escapeRegExp = (str: string): string =>
  str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const doesSessionMatchRoom = (session: Session, room: Room): boolean => {
  const sRoom = normalizeRoomToken(session.room);
  if (!sRoom) return false;

  const rId = normalizeRoomToken(room.id);
  const rName = normalizeRoomToken(room.name);
  const rShort = normalizeRoomToken(room.shortName);

  if (sRoom === rId || sRoom === rName || (rShort && sRoom === rShort)) {
    return true;
  }

  if (isBoothFoyerRoom(room)) {
    if (
      (sRoom.includes('foyer') || sRoom.includes('exhibition') || sRoom.includes('pameran')) &&
      !sRoom.includes('ground')
    ) {
      return true;
    }
  }

  if (rShort && rShort.length >= 4) {
    const shortRegex = new RegExp(`\\b${escapeRegExp(rShort)}\\b`, 'i');
    if (shortRegex.test(sRoom)) return true;
  }

  if (rId && rId.length >= 4) {
    const idRegex = new RegExp(`\\b${escapeRegExp(rId)}\\b`, 'i');
    if (idRegex.test(sRoom)) return true;
  }

  return false;
};

const FLOOR_ROOM_POLYGONS: Record<string, RoomGeoPolygon[]> = {
  'Ground Floor': [
    {
      roomId: "Antareja Room",
      x: 8,
      y: 16,
      width: 40,
      height: 48,
      label: "Antareja Room (Workshop Versus)",
      entryDoor: { x: 48, y: 40, label: "Pintu Antareja" }
    },
    {
      roomId: "Wisanggeni Room",
      x: 52,
      y: 16,
      width: 40,
      height: 48,
      label: "Wisanggeni Room (Workshop Vet Nurse)",
      entryDoor: { x: 52, y: 40, label: "Pintu Wisanggeni" }
    },
    {
      roomId: "Foyer Ground Floor",
      x: 8,
      y: 68,
      width: 84,
      height: 24,
      label: "Lobby & Foyer Registrasi Ground Floor",
      entryDoor: { x: 50, y: 68, label: "Pintu Masuk Utama" }
    }
  ],
  'Lantai 1': [
    {
      roomId: "Ballroom Amartapura A",
      x: 8,
      y: 16,
      width: 40,
      height: 50,
      label: "Ballroom Amartapura A (Plenary & Munas)",
      entryDoor: { x: 28, y: 66, label: "Pintu Masuk Ballroom A" }
    },
    {
      roomId: "Ballroom Amartapura B",
      x: 52,
      y: 16,
      width: 40,
      height: 50,
      label: "Ballroom Amartapura B (Paralel & Klinis)",
      entryDoor: { x: 72, y: 66, label: "Pintu Masuk Ballroom B" }
    },
    {
      roomId: "Foyer & Exhibition Amartapura",
      x: 8,
      y: 70,
      width: 84,
      height: 22,
      label: "Foyer Amartapura Ballroom (Area Booth Pameran)",
      entryDoor: { x: 50, y: 70, label: "Akses Foyer & Booth Pameran" },
      isBoothArea: true
    }
  ],
  'Lantai Dasar': [
    {
      roomId: "Antareja Room",
      x: 8,
      y: 16,
      width: 40,
      height: 48,
      label: "Antareja Room (Workshop Versus)",
      entryDoor: { x: 48, y: 40, label: "Pintu Antareja" }
    },
    {
      roomId: "Wisanggeni Room",
      x: 52,
      y: 16,
      width: 40,
      height: 48,
      label: "Wisanggeni Room (Workshop Vet Nurse)",
      entryDoor: { x: 52, y: 40, label: "Pintu Wisanggeni" }
    },
    {
      roomId: "Ruang Sulawesi",
      x: 10,
      y: 16,
      width: 36,
      height: 32,
      label: "Ruang Sulawesi",
      entryDoor: { x: 46, y: 32, label: "Pintu Sulawesi" }
    },
    {
      roomId: "Ruang Kalimantan",
      x: 54,
      y: 16,
      width: 36,
      height: 32,
      label: "Ruang Kalimantan",
      entryDoor: { x: 54, y: 32, label: "Pintu Kalimantan" }
    },
    {
      roomId: "Registrasi & Foyer Dasar",
      x: 36,
      y: 42,
      width: 28,
      height: 20,
      label: "Foyer & Registrasi Utama",
      entryDoor: { x: 50, y: 62, label: "Meja Registrasi" }
    },
    {
      roomId: "Ruang Maluku",
      x: 10,
      y: 56,
      width: 36,
      height: 32,
      label: "Ruang Maluku",
      entryDoor: { x: 46, y: 72, label: "Pintu Maluku" }
    },
    {
      roomId: "Ruang Jawa",
      x: 54,
      y: 56,
      width: 36,
      height: 32,
      label: "Ruang Jawa",
      entryDoor: { x: 54, y: 72, label: "Pintu Jawa" }
    }
  ],
  'Lantai Atas': [
    {
      roomId: "Ballroom Amartapura A",
      x: 8,
      y: 16,
      width: 40,
      height: 50,
      label: "Ballroom Amartapura A",
      entryDoor: { x: 28, y: 66, label: "Pintu Masuk Ballroom A" }
    },
    {
      roomId: "Ballroom Amartapura B",
      x: 52,
      y: 16,
      width: 40,
      height: 50,
      label: "Ballroom Amartapura B",
      entryDoor: { x: 72, y: 66, label: "Pintu Masuk Ballroom B" }
    },
    {
      roomId: "Ballroom 1",
      x: 8,
      y: 16,
      width: 26,
      height: 52,
      label: "Ballroom 1",
      entryDoor: { x: 21, y: 68, label: "Pintu Masuk Ballroom 1" }
    },
    {
      roomId: "Ballroom 2",
      x: 37,
      y: 16,
      width: 26,
      height: 52,
      label: "Ballroom 2",
      entryDoor: { x: 50, y: 68, label: "Pintu Masuk Ballroom 2" }
    },
    {
      roomId: "Ballroom 3",
      x: 66,
      y: 16,
      width: 26,
      height: 52,
      label: "Ballroom 3",
      entryDoor: { x: 79, y: 68, label: "Pintu Masuk Ballroom 3" }
    },
    {
      roomId: "Foyer Ballroom & Pameran (Lt. 1)",
      x: 8,
      y: 72,
      width: 84,
      height: 20,
      label: "Foyer Amartapura Ballroom (Area Booth Pameran)",
      entryDoor: { x: 50, y: 72, label: "Akses Foyer & Booth Pameran" },
      isBoothArea: true
    }
  ],
  'Lantai 2': [
    {
      roomId: "Hall B Kardiologi & Internal (Lt. 2)",
      x: 10,
      y: 16,
      width: 38,
      height: 36,
      label: "Hall B (Kardiologi)",
      entryDoor: { x: 48, y: 34, label: "Pintu Hall B" }
    },
    {
      roomId: "Hall C Respirologi & Pediatri (Lt. 2)",
      x: 52,
      y: 16,
      width: 38,
      height: 36,
      label: "Hall C (Pediatri)",
      entryDoor: { x: 52, y: 34, label: "Pintu Hall C" }
    },
    {
      roomId: "Exhibition Hall",
      x: 10,
      y: 56,
      width: 80,
      height: 32,
      label: "Exhibition Hall & Sponsor Booths",
      entryDoor: { x: 50, y: 56, label: "Pintu Pameran" }
    }
  ],
  'Lantai 3': [
    {
      roomId: "Auditorium Utama (Lt. 3)",
      x: 10,
      y: 16,
      width: 40,
      height: 68,
      label: "Auditorium Utama",
      entryDoor: { x: 50, y: 50, label: "Akses Teater" }
    },
    {
      roomId: "Ruang Workshop 1 (Lt. 3)",
      x: 54,
      y: 16,
      width: 36,
      height: 32,
      label: "Workshop 1 (POCUS)",
      entryDoor: { x: 54, y: 32, label: "Pintu Lab A" }
    },
    {
      roomId: "Ruang Workshop 2 (Lt. 3)",
      x: 54,
      y: 52,
      width: 36,
      height: 32,
      label: "Workshop 2 (ACLS)",
      entryDoor: { x: 54, y: 68, label: "Pintu Lab B" }
    }
  ]
};

export const InteractiveVenueMap: React.FC<InteractiveVenueMapProps> = ({
  rooms,
  sessions,
  exhibitors,
  initialFocusTarget,
  onSelectSession,
  onOpenExhibition,
  eventInfo
}) => {
  // Offline Cache Snapshot & Connectivity State
  const [cachedSnapshot, setCachedSnapshot] = useState<VenueMapOfflineSnapshot | null>(() =>
    loadVenueMapFromLocalSync()
  );
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isSyncingCache, setIsSyncingCache] = useState<boolean>(false);
  const [lastCachedAt, setLastCachedAt] = useState<string | null>(() => {
    const initial = loadVenueMapFromLocalSync();
    return initial?.cachedAt || null;
  });

  // Live clock for "Hari Ini" & "Sedang Berlangsung" status
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const todayFormatted = useMemo(() => {
    try {
      return now.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return now.toDateString();
    }
  }, [now]);

  const currentSessions = useMemo(() => {
    const raw =
      sessions && sessions.length > 0
        ? sessions
        : cachedSnapshot?.sessions && cachedSnapshot.sessions.length > 0
        ? cachedSnapshot.sessions
        : [];
    return sortSessionsChronologically(raw);
  }, [sessions, cachedSnapshot]);

  const sortedExhibitors = useMemo(() => {
    const source = exhibitors !== undefined ? exhibitors : EXHIBITORS_DATA;
    return [...source].sort((a, b) =>
      (a.boothNumber || '').localeCompare(b.boothNumber || '', 'id', {
        numeric: true,
        sensitivity: 'base'
      })
    );
  }, [exhibitors]);

  const currentRooms = useMemo(() => {
    const rawRooms =
      rooms && rooms.length > 0
        ? rooms
        : cachedSnapshot?.rooms && cachedSnapshot.rooms.length > 0
        ? cachedSnapshot.rooms
        : DEFAULT_ROOMS_DATA;
    const seen = new Set<string>();
    const deduped = rawRooms.filter(r => {
      if (!r?.id || seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });
    if (!deduped.some((r) => isBoothFoyerRoom(r))) {
      return [...deduped, DEFAULT_BOOTH_FOYER_ROOM];
    }
    return deduped;
  }, [rooms, cachedSnapshot]);

  const boothFoyerRoom = useMemo(() => {
    return currentRooms.find((r) => isBoothFoyerRoom(r)) || DEFAULT_BOOTH_FOYER_ROOM;
  }, [currentRooms]);

  const activeFloorPolygonsMap = useMemo(() => {
    if (!isOnline && cachedSnapshot?.floorPolygons && Object.keys(cachedSnapshot.floorPolygons).length > 0) {
      return cachedSnapshot.floorPolygons;
    }
    return FLOOR_ROOM_POLYGONS;
  }, [isOnline, cachedSnapshot]);

  const info = eventInfo || cachedSnapshot?.eventInfo || SYMPOSIUM_INFO;
  const palette = getThemePalette(info);

  // Compute available floors dynamically from actual rooms list
  const availableFloors = useMemo(() => {
    const fSet = new Set<string>();
    currentRooms.forEach(r => {
      if (r.floor) fSet.add(r.floor);
    });
    const list = Array.from(fSet);
    return list.length > 0 ? [...list, 'Semua'] : ['Ground Floor', 'Lantai 1', 'Semua'];
  }, [currentRooms]);

  const savedUIState = useMemo(() => loadVenueMapUIState(), []);

  // Floor Selection & Smooth Transition Animation States
  const [selectedFloor, setSelectedFloor] = useState<string>(() => {
    if (initialFocusTarget?.focusBoothArea) {
      return boothFoyerRoom.floor || 'Lantai 1';
    }
    if (savedUIState?.selectedFloor) return savedUIState.selectedFloor;
    return currentRooms[0]?.floor || 'Ground Floor';
  });
  const [isFloorTransitioning, setIsFloorTransitioning] = useState<boolean>(false);
  const [floorTransitionDirection, setFloorTransitionDirection] = useState<'up' | 'down' | 'fade'>('fade');
  const [showFloorToast, setShowFloorToast] = useState<boolean>(false);
  const floorToastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [activePinId, setActivePinId] = useState<string>(() => {
    if (initialFocusTarget?.focusBoothArea) {
      return boothFoyerRoom.id;
    }
    if (savedUIState?.activePinId && currentRooms.some(r => r.id === savedUIState.activePinId)) {
      return savedUIState.activePinId;
    }
    return currentRooms[0]?.id || 'Antareja Room';
  });
  const [mapSearchQuery, setMapSearchQuery] = useState<string>('');

  // Listen to online/offline connectivity changes & hydrate from Cache Storage API on mount
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    loadVenueMapFromCache().then(snapshot => {
      if (snapshot) {
        setCachedSnapshot(snapshot);
        setLastCachedAt(snapshot.cachedAt);
      }
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Automatically cache the venue map data (rooms, sessions, floor polygons, eventInfo) for offline access
  const handleManualSyncOfflineCache = useCallback(async () => {
    setIsSyncingCache(true);
    try {
      const result = await saveVenueMapToCache(
        currentRooms,
        currentSessions,
        FLOOR_ROOM_POLYGONS,
        info
      );
      if (result.success) {
        setLastCachedAt(result.cachedAt);
      }
    } finally {
      setTimeout(() => setIsSyncingCache(false), 350);
    }
  }, [currentRooms, currentSessions, info]);

  useEffect(() => {
    let isMounted = true;
    saveVenueMapToCache(currentRooms, currentSessions, FLOOR_ROOM_POLYGONS, info).then(res => {
      if (isMounted && res.success) {
        setLastCachedAt(res.cachedAt);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [currentRooms, currentSessions, info]);

  // Persist user's active floor and pin for seamless offline navigation
  useEffect(() => {
    saveVenueMapUIState({
      selectedFloor,
      activePinId,
      selectedDayFilter: 'Semua',
    });
  }, [selectedFloor, activePinId]);

  // Smooth Zoom & Pan Engine State
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showDetailInFullscreen, setShowDetailInFullscreen] = useState<boolean>(true);

  const rootContainerRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapContentRef = useRef<HTMLDivElement>(null);

  // Toggle fullscreen mode with safe HTML5 fullscreen API integration
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => {
      const next = !prev;
      if (next) {
        try {
          if (rootContainerRef.current?.requestFullscreen) {
            rootContainerRef.current.requestFullscreen().catch(() => {});
          }
        } catch (_) {}
      } else {
        try {
          if (document.fullscreenElement && document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
          }
        } catch (_) {}
      }
      return next;
    });
  }, []);

  // Keyboard shortcut listener (Escape to exit fullscreen) & sync with browser fullscreen state
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
        try {
          if (document.fullscreenElement && document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
          }
        } catch (_) {}
      }
    };
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isFullscreen]);

  // Lock body scroll when fullscreen is active
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  // Zoom helpers with clamping
  const handleZoom = useCallback((direction: 'in' | 'out', step = 0.25) => {
    setZoomLevel(prev => {
      const next = direction === 'in' ? prev + step : prev - step;
      return Math.min(Math.max(Number(next.toFixed(2)), 0.8), 3.5);
    });
  }, []);

  const handleResetView = useCallback(() => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  // Helper function to rank floor levels for up/down transition direction determination
  const getFloorLevelRank = (floorName: string): number => {
    const f = floorName.toLowerCase();
    if (f.includes('dasar') || f.includes('ground') || f.includes('gf')) return 0;
    if (f.includes('1') || f.includes('atas') || f.includes('first')) return 1;
    if (f.includes('2') || f.includes('second')) return 2;
    if (f.includes('3') || f.includes('third')) return 3;
    return 1;
  };

  // Smooth Floor Switch Transition Handler
  const handleSelectFloor = useCallback((nextFloor: string) => {
    if (nextFloor === selectedFloor && !isFloorTransitioning) return;

    const currentRank = getFloorLevelRank(selectedFloor);
    const nextRank = getFloorLevelRank(nextFloor);
    let direction: 'up' | 'down' | 'fade' = 'fade';
    if (nextFloor !== 'Semua' && selectedFloor !== 'Semua') {
      if (nextRank > currentRank) direction = 'up';
      else if (nextRank < currentRank) direction = 'down';
    }

    setFloorTransitionDirection(direction);
    setIsFloorTransitioning(true);
    setShowFloorToast(true);

    if (floorToastTimerRef.current) {
      clearTimeout(floorToastTimerRef.current);
    }

    // Step 1: Smoothly fade out & slide current floor
    setTimeout(() => {
      setSelectedFloor(nextFloor);
      setPanOffset({ x: 0, y: 0 });

      // Step 2: Smoothly reveal new floor level
      setTimeout(() => {
        setIsFloorTransitioning(false);
      }, 50);

      // Dismiss HUD notification after 1.5s
      floorToastTimerRef.current = setTimeout(() => {
        setShowFloorToast(false);
      }, 1500);
    }, 220);
  }, [selectedFloor, isFloorTransitioning]);

  // Wheel zoom with smooth delta
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.15 : -0.15;
    setZoomLevel(prev => Math.min(Math.max(Number((prev + zoomDelta).toFixed(2)), 0.8), 3.0));
  };

  // Drag Pan Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch support for mobile pinch/drag
  const touchStartRef = useRef<{ x: number; y: number; dist?: number }>({ x: 0, y: 0 });
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      touchStartRef.current = {
        x: e.touches[0].clientX - panOffset.x,
        y: e.touches[0].clientY - panOffset.y
      };
    } else if (e.touches.length === 2) {
      // Pinch to zoom start
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartRef.current.dist = dist;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1 && isDragging) {
      setPanOffset({
        x: e.touches[0].clientX - touchStartRef.current.x,
        y: e.touches[0].clientY - touchStartRef.current.y
      });
    } else if (e.touches.length === 2 && touchStartRef.current.dist) {
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = currentDist / touchStartRef.current.dist;
      setZoomLevel(prev => Math.min(Math.max(Number((prev * (ratio > 1 ? 1.03 : 0.97)).toFixed(2)), 0.8), 3.0));
      touchStartRef.current.dist = currentDist;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchStartRef.current.dist = undefined;
  };

  // Filter pins based on floor and search (including booth/exhibitor search)
  const filteredPins = useMemo(() => {
    return currentRooms.filter(pin => {
      if (selectedFloor !== 'Semua' && pin.floor !== selectedFloor) return false;
      if (mapSearchQuery.trim()) {
        const q = mapSearchQuery.toLowerCase();
        const matchesRoom =
          pin.name.toLowerCase().includes(q) ||
          pin.shortName.toLowerCase().includes(q) ||
          pin.description.toLowerCase().includes(q);
        if (matchesRoom) return true;
        if (isBoothFoyerRoom(pin)) {
          if ('booth pameran foyer amartapura lantai 1'.includes(q)) return true;
          return sortedExhibitors.some(
            (ex) =>
              (ex.name || '').toLowerCase().includes(q) ||
              (ex.boothNumber || '').toLowerCase().includes(q) ||
              (ex.zone || '').toLowerCase().includes(q)
          );
        }
        return false;
      }
      return true;
    });
  }, [currentRooms, selectedFloor, mapSearchQuery, sortedExhibitors]);

  const activePin = useMemo(() => {
    return currentRooms.find(p => p.id === activePinId) || currentRooms[0] || DEFAULT_ROOMS_DATA[0];
  }, [currentRooms, activePinId]);

  // Active polygons for current floor (deduplicated by roomId)
  const currentFloorPolygons = useMemo(() => {
    const seen = new Set<string>();
    if (selectedFloor === 'Semua') {
      const activeFloors = availableFloors.filter(f => f !== 'Semua');
      const polys = activeFloors.length > 0
        ? activeFloors.flatMap(f => activeFloorPolygonsMap[f] || [])
        : Object.values(activeFloorPolygonsMap).flat();
      return polys.filter(p => {
        if (seen.has(p.roomId)) return false;
        seen.add(p.roomId);
        return true;
      });
    }
    return (activeFloorPolygonsMap[selectedFloor] || []).filter(p => {
      if (seen.has(p.roomId)) return false;
      seen.add(p.roomId);
      return true;
    });
  }, [selectedFloor, availableFloors, activeFloorPolygonsMap]);

  // Direct Interactive Pin Click Handler
  const handlePinClick = useCallback((pinId: string) => {
    setActivePinId(pinId);

    const pin = currentRooms.find(r => r.id === pinId);
    if (pin) {
      if (selectedFloor !== 'Semua' && pin.floor !== selectedFloor) {
        handleSelectFloor(pin.floor);
      }
      // Gently nudge pan so the room is clearly visible
      const offsetX = (50 - pin.x) * 2;
      const offsetY = (50 - pin.y) * 2;
      setPanOffset({ x: offsetX, y: offsetY });
    }
  }, [currentRooms, selectedFloor, handleSelectFloor]);

  // Center view on specific room
  const handleFocusRoom = useCallback((pinId: string) => {
    setActivePinId(pinId);
    const pin = currentRooms.find(r => r.id === pinId);
    if (pin) {
      if (selectedFloor !== 'Semua' && pin.floor !== selectedFloor) {
        handleSelectFloor(pin.floor);
      }
      const offsetX = (50 - (pin.x ?? 50)) * 2.5;
      const offsetY = (50 - (pin.y ?? 50)) * 2.5;
      setPanOffset({ x: offsetX, y: offsetY });
      setZoomLevel(prev => (prev < 1.15 ? 1.2 : prev));
    }
  }, [currentRooms, selectedFloor, handleSelectFloor]);

  const handleFocusBoothArea = useCallback(() => {
    setMapSearchQuery('');
    setActivePinId(boothFoyerRoom.id);
    const targetFloor = boothFoyerRoom.floor || 'Lantai 1';
    if (selectedFloor !== targetFloor) {
      handleSelectFloor(targetFloor);
    }
    setPanOffset({ x: 0, y: -35 });
    setZoomLevel(1.1);
  }, [boothFoyerRoom, selectedFloor, handleSelectFloor]);

  // Auto-focus Foyer Amartapura Ballroom Lantai 1 when navigated from Booth/Exhibition page
  useEffect(() => {
    if (!initialFocusTarget?.focusBoothArea) return;
    setSelectedFloor(boothFoyerRoom.floor || 'Lantai 1');
    setActivePinId(boothFoyerRoom.id);
    setPanOffset({ x: 0, y: -30 });
    setZoomLevel(1.08);
  }, [initialFocusTarget?.nonce, initialFocusTarget?.focusBoothArea, boothFoyerRoom]);

  // Schedule tab inside room details card: defaults to 'TODAY' (Hari Ini) whenever a room is clicked
  const [roomScheduleDayFilter, setRoomScheduleDayFilter] = useState<string>('TODAY');
  useEffect(() => {
    setRoomScheduleDayFilter('TODAY');
  }, [activePinId]);

  // Per-room today session counts & live status for map pins
  const roomTodayStats = useMemo(() => {
    const map = new Map<string, { todayCount: number; hasLive: boolean }>();
    for (const room of currentRooms) {
      let todayCount = 0;
      let hasLive = false;
      for (const session of currentSessions) {
        if (!doesSessionMatchRoom(session, room)) continue;
        if (isSessionOnToday(session, now)) {
          todayCount += 1;
          if (getSessionLiveStatus(session, now) === 'live') {
            hasLive = true;
          }
        }
      }
      map.set(room.id, { todayCount, hasLive });
    }
    return map;
  }, [currentRooms, currentSessions, now]);

  // Sessions matching the currently selected room
  const activeRoomAllSessions = useMemo(() => {
    return currentSessions.filter((s) => doesSessionMatchRoom(s, activePin));
  }, [currentSessions, activePin]);

  const activeRoomTodaySessions = useMemo(() => {
    return activeRoomAllSessions.filter((s) => isSessionOnToday(s, now));
  }, [activeRoomAllSessions, now]);

  const activeRoomAvailableDays = useMemo(() => {
    const seen = new Set<string>();
    const days: string[] = [];
    for (const s of activeRoomAllSessions) {
      const label = (s.day || '').trim();
      if (label && !seen.has(label)) {
        seen.add(label);
        days.push(label);
      }
    }
    return days;
  }, [activeRoomAllSessions]);

  const displayedRoomSessions = useMemo(() => {
    if (roomScheduleDayFilter === 'TODAY') {
      return activeRoomTodaySessions;
    }
    return activeRoomAllSessions.filter(
      (s) => (s.day || '').trim() === roomScheduleDayFilter
    );
  }, [roomScheduleDayFilter, activeRoomTodaySessions, activeRoomAllSessions]);

  const hasLiveInActiveRoom = useMemo(() => {
    return activeRoomTodaySessions.some(
      (s) => getSessionLiveStatus(s, now) === 'live'
    );
  }, [activeRoomTodaySessions, now]);

  // Shared sub-component: Room Details Card (used in standard grid and fullscreen sidebar)
  const renderRoomDetailsCard = (isSidebar = false) => (
    <div className={isSidebar ? 'h-full flex flex-col justify-between space-y-4 text-white' : 'space-y-4'}>
      <div className="space-y-4">
        {/* Fullscreen Sidebar Top Bar */}
        {isSidebar && (
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Informasi Ruangan</span>
            </div>
            <button
              onClick={() => setShowDetailInFullscreen(false)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Tutup Panel (Perluas Peta)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Header Info of Active Room Pin */}
        <div className="border-b border-slate-800 pb-3.5">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${activePin.badgeBg}`}>
              {activePin.floor} • {activePin.type.toUpperCase()}
            </span>
          </div>

          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg sm:text-xl font-black text-white leading-tight">
              {activePin.name}
            </h3>

            {activePin.type !== 'facility' && (
              <div className="text-right shrink-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Kapasitas</span>
                <span className="text-xs font-black text-sky-400 flex items-center justify-end">
                  <Users className="w-3.5 h-3.5 mr-1 text-sky-400" />
                  {activePin.capacity} Kursi
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Today's Events in Selected Room */}
        <div className="bg-slate-950/75 border border-sky-500/30 rounded-xl p-3 space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <h4 className="text-xs font-black text-white uppercase tracking-wide">
                  {roomScheduleDayFilter === 'TODAY'
                    ? 'Acara Hari Ini'
                    : `Jadwal ${roomScheduleDayFilter}`}
                </h4>
              </div>
              {roomScheduleDayFilter === 'TODAY' && (
                <p className="text-[10px] text-slate-400 font-medium">
                  {todayFormatted}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {roomScheduleDayFilter === 'TODAY' && hasLiveInActiveRoom && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 text-[10px] font-black">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  LIVE
                </span>
              )}
              <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 border border-sky-400/30 text-[10px] font-black">
                {displayedRoomSessions.length} Sesi
              </span>
            </div>
          </div>

          {/* Day Filter Switcher (Hari Ini default + other days in this room) */}
          {activeRoomAvailableDays.length > 0 && (
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
              <button
                type="button"
                onClick={() => setRoomScheduleDayFilter('TODAY')}
                className={`px-2 py-1 rounded-md text-[10px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  roomScheduleDayFilter === 'TODAY'
                    ? 'bg-sky-500 text-slate-950 font-black'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Hari Ini ({activeRoomTodaySessions.length})
              </button>
              {activeRoomAvailableDays.map((dayLabel) => (
                <button
                  key={dayLabel}
                  type="button"
                  onClick={() => setRoomScheduleDayFilter(dayLabel)}
                  className={`px-2 py-1 rounded-md text-[10px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    roomScheduleDayFilter === dayLabel
                      ? 'bg-sky-500 text-slate-950 font-black'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {dayLabel}
                </button>
              ))}
            </div>
          )}

          {/* Sessions List */}
          {displayedRoomSessions.length === 0 ? (
            <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-3 text-center space-y-2">
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {roomScheduleDayFilter === 'TODAY'
                  ? `Tidak ada acara yang dijadwalkan hari ini di ${activePin.shortName}.`
                  : `Belum ada jadwal sesi untuk ${roomScheduleDayFilter} di ${activePin.shortName}.`}
              </p>
              {roomScheduleDayFilter === 'TODAY' && activeRoomAvailableDays.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-0.5">
                  {activeRoomAvailableDays.map((dayLabel) => (
                    <button
                      key={dayLabel}
                      type="button"
                      onClick={() => setRoomScheduleDayFilter(dayLabel)}
                      className="px-2 py-1 rounded-md bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-400/30 text-[10px] font-bold cursor-pointer"
                    >
                      Lihat {dayLabel}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {displayedRoomSessions.map((session) => {
                const liveStatus = getSessionLiveStatus(session, now);
                const isLive = liveStatus === 'live';
                const timeDisplay =
                  (session.timeString || '').trim() ||
                  `${session.startTime || ''}${session.endTime ? ` - ${session.endTime}` : ''}`;
                const speakerNames = (session.speakers || [])
                  .map((sp) => sp.name)
                  .filter(Boolean)
                  .slice(0, 2)
                  .join(', ');

                return (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => onSelectSession?.(session)}
                    disabled={!onSelectSession}
                    className={`w-full text-left rounded-lg p-2.5 border transition-all space-y-1 ${
                      isLive
                        ? 'bg-emerald-500/15 border-emerald-400/60 hover:bg-emerald-500/20'
                        : 'bg-slate-900/90 border-slate-800 hover:border-sky-500/50 hover:bg-slate-800/80'
                    } ${onSelectSession ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-sky-300">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span>{timeDisplay || 'Jadwal Sesi'}</span>
                      </span>

                      {liveStatus === 'live' ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950 text-[9px] font-black uppercase tracking-wider shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-pulse" />
                          Berlangsung
                        </span>
                      ) : liveStatus === 'upcoming' ? (
                        <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[9px] font-bold shrink-0">
                          Akan Datang
                        </span>
                      ) : liveStatus === 'finished' ? (
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[9px] font-bold shrink-0">
                          Selesai
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[9px] font-bold shrink-0">
                          {session.date || session.day}
                        </span>
                      )}
                    </div>

                    <div className="flex items-start justify-between gap-1.5">
                      <p className="text-xs font-bold text-white leading-snug line-clamp-2">
                        {session.title}
                      </p>
                      {onSelectSession && (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      )}
                    </div>

                    {(speakerNames || session.moderator) && (
                      <p className="text-[10px] text-slate-400 flex items-center gap-1 truncate">
                        <Mic2 className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate">
                          {speakerNames || `Moderator: ${session.moderator}`}
                        </span>
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Room Description */}
        <p className="text-xs text-slate-300 leading-relaxed">
          {activePin.description}
        </p>

        {/* Facilities Chips */}
        <div>
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Fasilitas Ruangan:
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {activePin.facilities.map((fac, i) => (
              <span
                key={i}
                className="px-2.5 py-1 bg-slate-800 text-slate-200 text-[11px] rounded-lg font-medium flex items-center border border-slate-700"
              >
                <Sparkles className="w-3 h-3 text-sky-400 mr-1" />
                {fac}
              </span>
            ))}
          </div>
        </div>

        {/* Dedicated Booth Exhibition Directory when Foyer Amartapura Ballroom (Lantai 1) is selected */}
        {isBoothFoyerRoom(activePin) && (
          <div className="bg-amber-500/10 border border-amber-400/35 rounded-xl p-3 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Store className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-xs font-black text-amber-200">
                  Lokasi Booth Pameran (Lt. 1)
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 text-[10px] font-black shrink-0">
                {sortedExhibitors.length} Booth
              </span>
            </div>

            <p className="text-[11px] text-amber-100/85 leading-relaxed">
              Seluruh booth pameran industri berada di <strong className="text-white">Foyer Amartapura Ballroom, Lantai 1</strong> (tepat di depan pintu masuk Ballroom Amartapura A &amp; B).
            </p>

            {sortedExhibitors.length > 0 && (
              <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                {sortedExhibitors.map((ex) => (
                  <div
                    key={ex.id}
                    className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg bg-slate-950/70 border border-amber-500/20 text-[11px]"
                  >
                    <span className="font-bold text-slate-100 truncate">{ex.name}</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold text-[10px] shrink-0">
                      {ex.boothNumber}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {onOpenExhibition && (
              <button
                type="button"
                onClick={onOpenExhibition}
                className="w-full py-2 px-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Lihat Daftar Lengkap Booth</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom Info Footer */}
      <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center text-[11px]">
          <Info className="w-3.5 h-3.5 text-sky-400 mr-1.5 shrink-0" />
          Tersedia lift & eskalator di Foyer Utama.
        </span>

        <button
          onClick={() => handleFocusRoom(activePin.id)}
          className="text-[11px] text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1 transition-colors cursor-pointer"
        >
          <MapPin className="w-3 h-3" />
          <span>Fokuskan Peta</span>
        </button>
      </div>
    </div>
  );

  // Shared sub-component: Interactive Zoom & Pan Viewport Canvas
  const renderInteractiveViewport = (isFull: boolean) => (
    <div 
      ref={mapContainerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`relative w-full ${isFull ? 'flex-1 h-full min-h-0' : 'aspect-[4/3]'} bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center select-none ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
    >
      {/* Architectural Grid Background */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#38bdf8 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Floating Floor Level Elevation HUD Notification */}
      {showFloorToast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-1.5 rounded-full bg-slate-900/95 border border-sky-400/80 backdrop-blur-md shadow-2xl flex items-center gap-2 text-white animate-in fade-in zoom-in duration-200 pointer-events-none">
          <div className="w-5 h-5 rounded-full bg-sky-500/25 text-sky-300 flex items-center justify-center shrink-0">
            {floorTransitionDirection === 'up' ? (
              <ArrowUp className="w-3.5 h-3.5 text-sky-300 animate-bounce" />
            ) : floorTransitionDirection === 'down' ? (
              <ArrowDown className="w-3.5 h-3.5 text-sky-300 animate-bounce" />
            ) : (
              <Layers className="w-3.5 h-3.5 text-sky-300 animate-pulse" />
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold whitespace-nowrap">
            <span className="text-slate-400 text-[10px] uppercase font-black tracking-wider">Lantai:</span>
            <span className="text-white font-extrabold">{selectedFloor}</span>
          </div>
        </div>
      )}

      {/* Transform Container with Smooth Transition & Pan Offset */}
      <div 
        ref={mapContentRef}
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)'
        }}
        className={`relative w-full h-full will-change-transform flex items-center justify-center ${
          isFull ? 'max-w-[1500px] max-h-[920px] aspect-[4/3] m-auto' : ''
        }`}
      >

        {/* Architectural SVG Floor Blueprint Layer */}
        <div 
          className={`relative w-full h-full transition-all duration-300 ease-out transform ${
            isFloorTransitioning
              ? floorTransitionDirection === 'up'
                ? 'opacity-0 -translate-y-8 scale-[0.97] blur-[1px]'
                : floorTransitionDirection === 'down'
                ? 'opacity-0 translate-y-8 scale-[0.97] blur-[1px]'
                : 'opacity-0 scale-[0.97] blur-[1px]'
              : 'opacity-100 translate-y-0 scale-100 blur-0'
          }`}
        >
          <svg 
            className="absolute inset-0 w-full h-full pointer-events-none select-none"
            viewBox="0 0 100 100" 
            preserveAspectRatio="none"
          >
            <defs>
              {/* Selected room beacon glow filter */}
              <filter id="selectedGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComponentTransfer in="blur" result="boost">
                  <feFuncA type="linear" slope="2.5" />
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode in="boost" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Outer Building Perimeter Wall */}
            <rect 
              x="6" 
              y="8" 
              width="88" 
              height="84" 
              rx="4" 
              className="stroke-slate-700 fill-slate-900/40" 
              strokeWidth="0.8" 
            />

            {/* Main Hallways & Corridor Lines */}
            <line x1="6" y1="50" x2="94" y2="50" stroke="#334155" strokeWidth="0.6" strokeDasharray="1.5 1.5" />
            <line x1="50" y1="8" x2="50" y2="92" stroke="#334155" strokeWidth="0.6" strokeDasharray="1.5 1.5" />

            {/* Room Boundary Polygons with Selected Highlights */}
            {currentFloorPolygons.map((poly) => {
              const targetRoomId = poly.isBoothArea ? boothFoyerRoom.id : poly.roomId;
              const isSelected = activePinId === targetRoomId || activePinId === poly.roomId;
              const isBooth = Boolean(poly.isBoothArea);

              return (
                <g 
                  key={poly.roomId}
                  className="cursor-pointer pointer-events-auto group/polygon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePinClick(targetRoomId);
                  }}
                >
                  {/* Room Area Rectangle */}
                  <rect
                    x={poly.x}
                    y={poly.y}
                    width={poly.width}
                    height={poly.height}
                    rx="2"
                    className={`transition-all duration-300 ${
                      isSelected
                        ? isBooth
                          ? 'stroke-amber-300 fill-amber-500/35 group-hover/polygon:fill-amber-500/45'
                          : 'stroke-sky-300 fill-sky-500/35 group-hover/polygon:fill-sky-500/45'
                        : isBooth
                          ? 'stroke-amber-500/80 fill-amber-500/15 group-hover/polygon:stroke-amber-300 group-hover/polygon:fill-amber-500/30'
                          : 'stroke-slate-700 fill-slate-800/30 group-hover/polygon:stroke-sky-400 group-hover/polygon:fill-slate-800/70'
                    }`}
                    strokeWidth={isSelected ? '2' : isBooth ? '1.1' : '0.7'}
                    filter={isSelected ? 'url(#selectedGlow)' : undefined}
                  />

                  {/* Visual Booth Slots Row inside Foyer Amartapura Ballroom (Lantai 1) */}
                  {isBooth && (
                    <g className="pointer-events-none">
                      {[12, 20, 28, 36, 56, 64, 72, 80].map((bx, idx) => (
                        <rect
                          key={idx}
                          x={bx}
                          y={poly.y + poly.height - 5.2}
                          width="6"
                          height="3.2"
                          rx="0.7"
                          className={
                            isSelected
                              ? 'fill-amber-300/85 stroke-amber-100'
                              : 'fill-amber-400/50 stroke-amber-300/70'
                          }
                          strokeWidth="0.35"
                        />
                      ))}
                    </g>
                  )}

                  {/* Pulsating dashed highlight outline for selected room on blueprint */}
                  {isSelected && (
                    <rect
                      x={poly.x - 0.7}
                      y={poly.y - 0.7}
                      width={poly.width + 1.4}
                      height={poly.height + 1.4}
                      rx="2.8"
                      className={`${isBooth ? 'stroke-amber-300' : 'stroke-sky-300'} fill-none stroke-[1.3] animate-pulse pointer-events-none`}
                      strokeDasharray="2.5 1.5"
                      filter="url(#selectedGlow)"
                    />
                  )}

                  {/* Room Name Label directly on SVG Floorplan */}
                  <text
                    x={poly.x + poly.width / 2}
                    y={poly.y + (isBooth ? 6.5 : poly.height / 2 - 2)}
                    textAnchor="middle"
                    className={`font-bold text-[2.8px] select-none pointer-events-none transition-colors ${
                      isSelected
                        ? isBooth
                          ? 'fill-amber-100 font-black'
                          : 'fill-sky-200 font-black'
                        : isBooth
                          ? 'fill-amber-200 group-hover/polygon:fill-white'
                          : 'fill-slate-300 group-hover/polygon:fill-white'
                    }`}
                  >
                    {poly.label}
                  </text>
                  <text
                    x={poly.x + poly.width / 2}
                    y={poly.y + (isBooth ? 10.5 : poly.height / 2 + 2.5)}
                    textAnchor="middle"
                    className={`text-[2.1px] font-bold select-none pointer-events-none ${
                      isSelected
                        ? isBooth
                          ? 'fill-amber-300 font-black'
                          : 'fill-sky-300 font-black'
                        : isBooth
                          ? 'fill-amber-300/90 group-hover/polygon:fill-amber-200'
                          : 'fill-sky-400/80 group-hover/polygon:fill-sky-300'
                    }`}
                  >
                    {isBooth
                      ? isSelected
                        ? `★ LOKASI BOOTH PAMERAN (${sortedExhibitors.length} BOOTH • LT. 1)`
                        : `${sortedExhibitors.length} Booth Pameran • Ketuk untuk lihat daftar booth`
                      : isSelected
                        ? '★ RUANGAN TERPILIH'
                        : 'Ketuk untuk info ruangan'}
                  </text>

                  {/* Entry Door Mark */}
                  {poly.entryDoor && (
                    <circle
                      cx={poly.entryDoor.x}
                      cy={poly.entryDoor.y}
                      r={isSelected ? '1.5' : '1.2'}
                      className={
                        isBooth
                          ? 'fill-amber-300'
                          : isSelected
                            ? 'fill-sky-300'
                            : 'fill-sky-400'
                      }
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Watermark Floor Text in Map Canvas */}
          <div className="absolute top-4 left-4 text-white/10 text-4xl sm:text-5xl font-black uppercase tracking-widest pointer-events-none">
            {selectedFloor === 'Semua' ? 'All Levels' : selectedFloor}
          </div>

          {/* Interactive Room Pins Overlay */}
          {filteredPins.map((pin) => {
            const isSelected = activePinId === pin.id;
            const isBoothPin = isBoothFoyerRoom(pin);
            const todayStat = roomTodayStats.get(pin.id);
            const hasLiveNow = Boolean(todayStat?.hasLive);
            const todayCount = todayStat?.todayCount || 0;

            return (
              <div
                key={pin.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handlePinClick(pin.id);
                }}
                style={{ top: `${pin.y}%`, left: `${pin.x}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 z-20 group/pin"
                title={
                  isBoothPin
                    ? `${pin.name} (${sortedExhibitors.length} Booth) - Ketuk untuk melihat daftar booth & acara hari ini`
                    : `${pin.name}${todayCount > 0 ? ` (${todayCount} acara hari ini)` : ''} - Ketuk untuk melihat acara hari ini`
                }
              >
                {/* Luminous Pulsing Sonar / Radar Waves when selected */}
                {isSelected && (
                  <>
                    <span className={`absolute -inset-7 rounded-full ${isBoothPin ? 'bg-amber-400/20' : 'bg-sky-400/20'} animate-ping pointer-events-none duration-1000`} />
                    <span className={`absolute -inset-4 rounded-full border-2 ${isBoothPin ? 'border-amber-400/75' : 'border-sky-400/70'} animate-pulse pointer-events-none`} />
                    <span className={`absolute -inset-2 rounded-full ${isBoothPin ? 'bg-amber-400/30' : 'bg-sky-400/30'} blur-xs pointer-events-none`} />
                  </>
                )}

                {/* Floating Pin Location Beacon Badge with Bounce Animation */}
                {isSelected && (
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-30 animate-bounce">
                    <div className={`px-2 py-0.5 rounded-full font-black text-[9px] shadow-lg flex items-center gap-1 uppercase tracking-wider whitespace-nowrap border border-white ${
                      isBoothPin
                        ? 'bg-gradient-to-r from-amber-400 via-amber-300 to-orange-400 text-slate-950 shadow-amber-500/60'
                        : 'bg-gradient-to-r from-sky-400 via-sky-300 to-blue-500 text-slate-950 shadow-sky-500/60'
                    }`}>
                      {isBoothPin ? (
                        <Store className="w-2.5 h-2.5 text-slate-950" />
                      ) : (
                        <Sparkles className="w-2.5 h-2.5 text-slate-950 fill-slate-950" />
                      )}
                      <span>{isBoothPin ? 'LOKASI BOOTH PAMERAN' : 'RUANGAN TERPILIH'}</span>
                    </div>
                    <div className={`w-0 h-0 border-x-4 border-x-transparent border-t-4 ${isBoothPin ? 'border-t-amber-400' : 'border-t-sky-400'}`} />
                  </div>
                )}

                {/* Pin Card Element */}
                <div 
                  className={`relative px-2.5 py-1.5 rounded-xl border flex items-center space-x-1.5 shadow-xl transition-all duration-300 backdrop-blur-sm ${
                    isSelected
                      ? isBoothPin
                        ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-white border-2 border-white scale-115 ring-4 ring-amber-400/80 shadow-[0_0_25px_rgba(251,191,36,0.85)] z-30 font-bold'
                        : 'bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white border-2 border-white scale-120 ring-4 ring-sky-400/80 shadow-[0_0_25px_rgba(56,189,248,0.85)] z-30 font-bold'
                      : isBoothPin
                        ? 'bg-amber-950/90 text-amber-100 border-amber-500/70 hover:bg-amber-900 hover:scale-105 hover:border-amber-300'
                        : 'bg-slate-900/90 text-slate-200 border-slate-700 hover:bg-slate-800 hover:scale-105 hover:border-slate-500'
                  }`}
                >
                  {/* Status / Category Dot or Store Icon */}
                  {isBoothPin ? (
                    <Store className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-amber-400'}`} />
                  ) : (
                    <span 
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        hasLiveNow
                          ? 'bg-emerald-400 ring-2 ring-emerald-300/80 animate-pulse'
                          : isSelected
                            ? 'bg-white ring-2 ring-sky-300 animate-pulse'
                            : pin.color
                      }`} 
                    />
                  )}

                  {/* Room Label */}
                  <span className="text-[11px] font-black whitespace-nowrap">
                    {pin.shortName}
                  </span>

                  {/* Live / Today Sessions / Booth Count / Capacity Badge */}
                  {hasLiveNow ? (
                    <span className="text-[9px] px-1.5 py-0.2 rounded-md font-black uppercase bg-emerald-400 text-slate-950 whitespace-nowrap">
                      LIVE
                    </span>
                  ) : isBoothPin ? (
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-mono font-bold whitespace-nowrap ${
                      isSelected
                        ? 'bg-white/25 text-white border border-white/40'
                        : 'bg-amber-500/25 text-amber-200 border border-amber-400/50'
                    }`}>
                      {sortedExhibitors.length} Booth
                    </span>
                  ) : todayCount > 0 ? (
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-mono font-bold whitespace-nowrap ${
                      isSelected
                        ? 'bg-white/25 text-white border border-white/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                    }`}>
                      {todayCount} Hari Ini
                    </span>
                  ) : pin.type !== 'facility' && pin.capacity > 0 ? (
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-mono font-bold ${
                      isSelected
                        ? 'bg-white/20 text-white border border-white/40'
                        : 'bg-sky-950/80 text-sky-300 border border-sky-700/50'
                    }`}>
                      {pin.capacity} K
                    </span>
                  ) : null}
                </div>

                {/* Little downward pointer for active pin */}
                {isSelected && (
                  <div className={`w-0 h-0 border-x-5 border-x-transparent border-t-5 mx-auto -mt-0.5 pointer-events-none ${
                    isBoothPin
                      ? 'border-t-amber-300 drop-shadow-[0_2px_4px_rgba(251,191,36,0.9)]'
                      : 'border-t-sky-300 drop-shadow-[0_2px_4px_rgba(56,189,248,0.9)]'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

      </div>

      {/* Smooth Zoom Controls Floating Widget in Map Viewport */}
      <div className="absolute top-3 right-3 flex flex-col items-center bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-lg space-y-1 z-30">
        <button
          onClick={() => handleZoom('in')}
          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-colors cursor-pointer"
          title="Perbesar Peta (Zoom In)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        
        <div className="text-[9px] font-mono font-bold text-slate-400 py-0.5 select-none">
          {Math.round(zoomLevel * 100)}%
        </div>

        <button
          onClick={() => handleZoom('out')}
          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-colors cursor-pointer"
          title="Perkecil Peta (Zoom Out)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          onClick={handleResetView}
          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          title="Reset Zoom & Geser"
        >
          <Move className="w-3.5 h-3.5" />
        </button>

        {/* Fullscreen Toggle within Floating Controls */}
        <button
          onClick={toggleFullscreen}
          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border-t border-slate-700/60 pt-0.5"
          title={isFull ? 'Keluar Fullscreen (Esc)' : 'Perbesar Layar Penuh'}
        >
          {isFull ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Bottom Legend Overlay */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-slate-900/95 backdrop-blur-md p-2 rounded-xl border border-slate-800 text-[10px] text-slate-300 flex flex-wrap items-center justify-between gap-2 z-30 shadow-md transition-all">
        <div className="flex items-center space-x-3 flex-wrap gap-y-1">
          <span className="flex items-center">
            <span className="w-2 h-2 rounded-full bg-indigo-500 mr-1" /> Ballroom Amartapura
          </span>
          <span className="flex items-center">
            <span className="w-2 h-2 rounded-full bg-amber-400 mr-1" /> Booth Pameran (Foyer Amartapura Lt. 1)
          </span>
          <span className="flex items-center">
            <span className="w-2 h-2 rounded-full bg-violet-500 mr-1" /> Workshop Skill
          </span>
        </div>
        <div className="text-sky-400 font-medium hidden sm:inline">
          *Ketuk pin / ruangan untuk melihat informasi ruangan
        </div>
      </div>

    </div>
  );

  // Shared sub-component: Quick Room Selector Chips below Map
  const renderQuickRoomChips = () => (
    <div className="pt-2">
      <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
        <span>Daftar Ruangan {selectedFloor}:</span>
        <span className="text-[10px] text-sky-400 lowercase">klik ruangan untuk menyorot lokasi pada denah</span>
      </div>
      <div className="flex flex-wrap gap-1.5 max-h-20 sm:max-h-24 overflow-y-auto pr-1">
        {filteredPins.map(pin => (
          <button
            key={pin.id}
            onClick={() => handlePinClick(pin.id)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
              activePinId === pin.id
                ? 'bg-sky-500 text-slate-950 border-sky-400 font-black shadow-md'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${pin.color}`} />
            <span>{pin.name}</span>
          </button>
        ))}
      </div>
    </div>
  );

  // 1. FULLSCREEN MODE LAYOUT (EXPANDED TO FULL VIEWPORT)
  if (isFullscreen) {
    return (
      <div 
        ref={rootContainerRef}
        className="interactive-venue-map fixed inset-0 z-50 bg-slate-950 flex flex-col text-white overflow-hidden select-none animate-in fade-in duration-200"
      >
        {/* Fullscreen Header & Controls Bar */}
        <div className="shrink-0 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3 sm:px-5 py-2.5 flex items-center justify-between gap-2 sm:gap-4 z-30 shadow-md">
          {/* Left: Exit Fullscreen button & Title */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={toggleFullscreen}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
              title="Tutup Mode Layar Penuh (ESC)"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tutup Layar Penuh</span>
              <span className="sm:hidden">Keluar</span>
              <kbd className="hidden md:inline-block px-1.5 py-0.2 text-[9px] bg-rose-800 rounded font-mono font-bold">ESC</kbd>
            </button>

            <div className="hidden lg:flex items-center gap-2 border-l border-slate-800 pl-3">
              <div className="flex items-center gap-1 text-xs font-bold text-slate-300">
                <Compass className="w-3.5 h-3.5 text-sky-400" />
                <span>{info.location}</span>
              </div>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-sky-400 font-bold">
                {selectedFloor === 'Semua' ? 'Denah Seluruh Gedung' : `Denah ${selectedFloor}`}
              </span>
            </div>
          </div>

          {/* Center: Floor Switcher & Search */}
          <div className="flex items-center gap-2 flex-1 justify-center max-w-xl">
            {/* Floor Switcher */}
            <div className="flex flex-wrap items-center bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0">
              {availableFloors.map((fl) => (
                <button
                  key={fl}
                  onClick={() => handleSelectFloor(fl)}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    selectedFloor === fl
                      ? 'bg-sky-500 text-slate-950 font-black shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {fl}
                </button>
              ))}
            </div>

            {/* Quick Search */}
            <div className="relative flex-1 max-w-[160px] sm:max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={mapSearchQuery}
                onChange={(e) => setMapSearchQuery(e.target.value)}
                placeholder="Cari ruangan..."
                className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
              />
            </div>
          </div>

          {/* Right: Zoom controls & Detail panel toggle */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => handleZoom('in')}
                className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Perbesar Peta (+)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono px-1.5 text-slate-300 font-bold min-w-[38px] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => handleZoom('out')}
                className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Perkecil Peta (-)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleResetView}
                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Reset Posisi & Zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Toggle Detail Sidebar */}
            <button
              onClick={() => setShowDetailInFullscreen(!showDetailInFullscreen)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                showDetailInFullscreen
                  ? 'bg-slate-800 text-sky-400 border-sky-500/40 shadow-sm'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
              title="Tampilkan / Sembunyikan Panel Informasi Ruangan"
            >
              {showDetailInFullscreen ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
              <span className="hidden xl:inline">{showDetailInFullscreen ? 'Tutup Panel' : 'Buka Panel'}</span>
            </button>
          </div>
        </div>

        {/* Fullscreen Body Area */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden relative">
          {/* Map Viewport Area (fills available full screen) */}
          <div className="flex-1 h-full min-h-0 relative flex flex-col bg-slate-950 p-2 sm:p-4 overflow-hidden space-y-2">
            {renderInteractiveViewport(true)}
            {renderQuickRoomChips()}
          </div>

          {/* Collapsible Detail Sidebar in Fullscreen */}
          {showDetailInFullscreen && (
            <div className="w-full lg:w-[420px] shrink-0 h-72 lg:h-full border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-900/95 overflow-y-auto p-4 flex flex-col justify-between shadow-2xl z-20">
              {renderRoomDetailsCard(true)}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. STANDARD IN-PAGE LAYOUT
  return (
    <div ref={rootContainerRef} className="interactive-venue-map max-w-6xl mx-auto p-3 sm:p-5 space-y-5">
      
      {/* Top Header Banner - Compact */}
      <div className={`bg-gradient-to-r ${palette.headerFrom} to-slate-950 text-white rounded-xl p-3 sm:p-4 border border-white/10 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3 relative overflow-hidden`}>
        <div 
          className="absolute top-0 right-0 w-60 h-60 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20 opacity-20"
          style={{ backgroundColor: palette.accentHex }}
        ></div>

        <div className="relative z-10 space-y-0.5">
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider" style={{ color: palette.accentHex }}>
            <span className="flex items-center gap-1">
              <Compass className="w-3.5 h-3.5" />
              <span>Denah Interaktif</span>
            </span>
            <span>•</span>
            <span className="text-slate-300">{info.location}</span>
            <span>•</span>
            {!isOnline ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[10px] font-black tracking-wide normal-case">
                <WifiOff className="w-3 h-3 text-amber-400" />
                <span>Mode Offline Aktif (Denah Tersimpan)</span>
              </span>
            ) : lastCachedAt ? (
              <button
                type="button"
                onClick={handleManualSyncOfflineCache}
                disabled={isSyncingCache}
                title={`Denah tersimpan untuk navigasi offline. Terakhir disinkronkan: ${new Date(lastCachedAt).toLocaleTimeString('id-ID')}. Klik untuk memperbarui cache offline.`}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 text-[10px] font-bold tracking-wide normal-case transition-colors cursor-pointer"
              >
                {isSyncingCache ? (
                  <RefreshCw className="w-3 h-3 text-emerald-300 animate-spin" />
                ) : (
                  <Check className="w-3 h-3 text-emerald-400" />
                )}
                <span>{isSyncingCache ? 'Menyimpan Cache...' : 'Siap Offline'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleManualSyncOfflineCache}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-400/40 text-[10px] font-bold tracking-wide normal-case transition-colors cursor-pointer"
              >
                <DownloadCloud className="w-3 h-3 text-sky-400" />
                <span>Simpan Denah Offline</span>
              </button>
            )}
          </div>
          <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
            Denah Ruangan & Lokasi Venue
          </h2>
        </div>

        {/* Floor Switcher, Booth Shortcut & Fullscreen Mode Action */}
        <div className="relative z-10 flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex flex-wrap items-center gap-1 bg-slate-800/90 p-1 rounded-lg border border-slate-700/80">
            {availableFloors.map((fl) => (
              <button
                key={fl}
                onClick={() => handleSelectFloor(fl)}
                style={selectedFloor === fl ? { backgroundColor: palette.primaryHex } : undefined}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  selectedFloor === fl
                    ? 'text-white shadow-md font-black'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                {fl}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleFocusBoothArea}
            className="px-3 py-1.5 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-400/50 font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            title="Fokus ke lokasi Booth Pameran di Foyer Amartapura Ballroom Lantai 1"
          >
            <Store className="w-3.5 h-3.5 text-amber-300" />
            <span>Lokasi Booth (Foyer Lt. 1)</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer hover:shadow-sky-500/25 active:scale-95"
            title="Perbesar Tampilan Denah Ruangan ke Mode Layar Penuh (Fullscreen)"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mode Layar Penuh</span>
            <span className="sm:hidden">Fullscreen</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive Map Stage (8 cols) + Room Info Panel (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Map Stage Canvas (8 Columns) */}
        <div className="lg:col-span-8 bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-xl flex flex-col space-y-3 relative">
          
          {/* Controls Bar Above Map */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-800">
            
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <Layers className="w-4 h-4 text-sky-400" />
              <span>Denah {selectedFloor === 'Semua' ? 'Seluruh Gedung' : selectedFloor}</span>
              <span className="text-[10px] text-slate-500 font-mono">
                [Zoom: {Math.round(zoomLevel * 100)}%]
              </span>
            </div>

            {/* Quick Search Room */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-48">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={mapSearchQuery}
                  onChange={(e) => setMapSearchQuery(e.target.value)}
                  placeholder="Cari ruangan / hall..."
                  className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
                />
              </div>

              {/* Reset View Button */}
              <button
                onClick={handleResetView}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                title="Reset Posisi & Zoom (100%)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* Fullscreen Toggle */}
              <button
                onClick={toggleFullscreen}
                className="px-2.5 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 hover:text-white border border-sky-500/40 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-sm active:scale-95"
                title="Perbesar Layar Penuh"
              >
                <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline">Layar Penuh</span>
              </button>
            </div>
          </div>

          {/* Interactive Zoomable Viewport */}
          {renderInteractiveViewport(false)}

          {/* Quick Room Selector Chips below Map */}
          {renderQuickRoomChips()}

        </div>

        {/* Selected Room Info Panel (4 Columns) */}
        <div className="lg:col-span-4 bg-slate-900 rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-xl flex flex-col justify-between space-y-4 text-white">
          {renderRoomDetailsCard(false)}
        </div>

      </div>

    </div>
  );
};
