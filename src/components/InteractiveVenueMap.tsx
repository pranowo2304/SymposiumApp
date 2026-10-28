import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  Compass, 
  Layers, 
  Users, 
  Clock, 
  Info, 
  ChevronRight, 
  Search, 
  Sparkles, 
  Calendar, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Radio, 
  Maximize2, 
  Minimize2, 
  Move, 
  Activity, 
  MapPin, 
  Volume2, 
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle,
  PanelRightClose,
  PanelRightOpen,
  ArrowUp,
  ArrowDown,
  X
} from 'lucide-react';
import { SESSIONS_DATA, SYMPOSIUM_INFO } from '../data/symposiumData';
import { DEFAULT_ROOMS_DATA } from '../data/roomsData';
import { Session, Speaker, Room, SymposiumInfo } from '../types';
import { getThemePalette } from '../utils/themeColors';

interface InteractiveVenueMapProps {
  rooms?: Room[];
  sessions?: Session[];
  onSelectSession: (session: Session) => void;
  onSelectSpeaker?: (speaker: Speaker) => void;
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
}

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
      label: "Foyer & Exhibition Area Amartapura",
      entryDoor: { x: 50, y: 70, label: "Lobby Pameran Amartapura" }
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
      label: "Foyer Ballroom & Exhibition Area",
      entryDoor: { x: 50, y: 72, label: "Akses Lobby Utama" }
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

// Helper: check if session is happening at a given time or simulation
function parseMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return 0;
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

export const InteractiveVenueMap: React.FC<InteractiveVenueMapProps> = ({
  rooms,
  sessions,
  onSelectSession,
  onSelectSpeaker,
  eventInfo
}) => {
  const currentRooms = rooms && rooms.length > 0 ? rooms : DEFAULT_ROOMS_DATA;
  const currentSessions = sessions && sessions.length > 0 ? sessions : SESSIONS_DATA;
  const info = eventInfo || SYMPOSIUM_INFO;
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

  // Floor Selection & Smooth Transition Animation States
  const [selectedFloor, setSelectedFloor] = useState<string>(() => {
    return currentRooms[0]?.floor || 'Ground Floor';
  });
  const [isFloorTransitioning, setIsFloorTransitioning] = useState<boolean>(false);
  const [floorTransitionDirection, setFloorTransitionDirection] = useState<'up' | 'down' | 'fade'>('fade');
  const [showFloorToast, setShowFloorToast] = useState<boolean>(false);
  const floorToastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [activePinId, setActivePinId] = useState<string>(currentRooms[0]?.id || 'Antareja Room');
  const [popupRoomId, setPopupRoomId] = useState<string | null>(null);
  const [popupTimingFilter, setPopupTimingFilter] = useState<'all' | 'ongoing' | 'upcoming'>('all');
  const [mapSearchQuery, setMapSearchQuery] = useState<string>('');
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('Semua');
  const [roomSessionTimingFilter, setRoomSessionTimingFilter] = useState<'all' | 'ongoing' | 'upcoming'>('all');

  // Interactive Live Session Simulation Filter
  // Allows the user to select or simulate specific time slots to see rooms actively holding sessions
  const [simulatedTimeSlot, setSimulatedTimeSlot] = useState<string>('09:00'); // Default morning active session
  const [isLiveClockMode, setIsLiveClockMode] = useState<boolean>(false);
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState<number>(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  // Keep live time ticking when live mode is active
  useEffect(() => {
    if (!isLiveClockMode) return;
    const update = () => {
      const now = new Date();
      setCurrentTimeMinutes(now.getHours() * 60 + now.getMinutes());
    };
    update();
    const timer = setInterval(update, 10000);
    return () => clearInterval(timer);
  }, [isLiveClockMode]);

  const activeComparisonMinutes = useMemo(() => {
    if (isLiveClockMode) return currentTimeMinutes;
    return parseMinutes(simulatedTimeSlot);
  }, [isLiveClockMode, currentTimeMinutes, simulatedTimeSlot]);

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

  // Determine which rooms currently have an ongoing session
  const roomOngoingSessionsMap = useMemo(() => {
    const map = new Map<string, Session>();

    currentSessions.forEach(session => {
      // Check day filter
      if (selectedDayFilter !== 'Semua' && session.day !== selectedDayFilter) {
        return;
      }

      const start = parseMinutes(session.startTime);
      const end = parseMinutes(session.endTime);

      if (start > 0 && end > 0 && activeComparisonMinutes >= start && activeComparisonMinutes < end) {
        // Match room
        const matchedRoom = currentRooms.find(r => {
          const rName = r.name.toLowerCase();
          const rId = r.id.toLowerCase();
          const sRoom = session.room.toLowerCase();
          return sRoom.includes(rName) || rName.includes(sRoom) || sRoom.includes(rId) || rId.includes(sRoom);
        });

        if (matchedRoom) {
          map.set(matchedRoom.id, session);
        }
      }
    });

    return map;
  }, [currentSessions, currentRooms, selectedDayFilter, activeComparisonMinutes]);

  // Filter pins based on floor and search
  const filteredPins = useMemo(() => {
    return currentRooms.filter(pin => {
      if (selectedFloor !== 'Semua' && pin.floor !== selectedFloor) return false;
      if (mapSearchQuery.trim()) {
        const q = mapSearchQuery.toLowerCase();
        return (
          pin.name.toLowerCase().includes(q) ||
          pin.shortName.toLowerCase().includes(q) ||
          pin.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [currentRooms, selectedFloor, mapSearchQuery]);

  const activePin = useMemo(() => {
    return currentRooms.find(p => p.id === activePinId) || currentRooms[0] || DEFAULT_ROOMS_DATA[0];
  }, [currentRooms, activePinId]);

  // Universal helper to retrieve sessions scheduled in any specific room
  const getSessionsForRoom = useCallback((roomId: string, timing: 'all' | 'ongoing' | 'upcoming' = 'all') => {
    const pin = currentRooms.find(r => r.id === roomId);
    const pinNameClean = (pin?.name || roomId).toLowerCase();

    return currentSessions.filter(s => {
      const sessionRoomClean = s.room.toLowerCase();
      const isMatch = sessionRoomClean.includes(pinNameClean) || pinNameClean.includes(sessionRoomClean);

      if (!isMatch) return false;
      if (selectedDayFilter !== 'Semua' && s.day !== selectedDayFilter) return false;

      if (timing !== 'all') {
        const startMin = parseMinutes(s.startTime);
        const endMin = parseMinutes(s.endTime);
        const isOngoing = activeComparisonMinutes >= startMin && activeComparisonMinutes <= endMin;
        const isUpcoming = startMin > activeComparisonMinutes;

        if (timing === 'ongoing' && !isOngoing) return false;
        if (timing === 'upcoming' && !isUpcoming) return false;
      }

      return true;
    });
  }, [currentRooms, currentSessions, selectedDayFilter, activeComparisonMinutes]);

  // Total session count map per room (useful for pins badge indicator)
  const roomSessionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    currentRooms.forEach(room => {
      const list = getSessionsForRoom(room.id, 'all');
      counts[room.id] = list.length;
    });
    return counts;
  }, [currentRooms, getSessionsForRoom]);

  // Sessions for the active pin
  const roomSessions = useMemo(() => {
    return getSessionsForRoom(activePin.id, roomSessionTimingFilter);
  }, [activePin.id, roomSessionTimingFilter, getSessionsForRoom]);

  // Active session in selected room right now (if any)
  const currentOngoingInActivePin = roomOngoingSessionsMap.get(activePin.id);

  // Active polygons for current floor
  const currentFloorPolygons = useMemo(() => {
    if (selectedFloor === 'Semua') {
      return Object.values(FLOOR_ROOM_POLYGONS).flat();
    }
    return FLOOR_ROOM_POLYGONS[selectedFloor] || [];
  }, [selectedFloor]);

  // Direct Interactive Pin Click Handler (pops up session schedule directly on canvas)
  const handlePinClick = useCallback((pinId: string) => {
    setActivePinId(pinId);
    setPopupRoomId(pinId);
    setPopupTimingFilter('all');

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

  // Data for the active interactive popup
  const popupRoom = useMemo(() => {
    if (!popupRoomId) return null;
    return currentRooms.find(r => r.id === popupRoomId) || null;
  }, [currentRooms, popupRoomId]);

  const popupSessions = useMemo(() => {
    if (!popupRoomId) return [];
    return getSessionsForRoom(popupRoomId, popupTimingFilter);
  }, [popupRoomId, popupTimingFilter, getSessionsForRoom]);

  const popupOngoingSession = useMemo(() => {
    if (!popupRoomId) return undefined;
    return roomOngoingSessionsMap.get(popupRoomId);
  }, [popupRoomId, roomOngoingSessionsMap]);

  // Center view on specific room
  const handleFocusRoom = (pinId: string) => {
    setActivePinId(pinId);
    setPopupRoomId(pinId);
    const pin = currentRooms.find(r => r.id === pinId);
    if (pin) {
      if (selectedFloor !== 'Semua' && pin.floor !== selectedFloor) {
        handleSelectFloor(pin.floor);
      }
      // Calculate target offset to bring pin to center
      // x: percentage 0-100 -> center is 50
      const offsetX = (50 - pin.x) * 3;
      const offsetY = (50 - pin.y) * 3;
      setPanOffset({ x: offsetX, y: offsetY });
      if (zoomLevel < 1.2) {
        setZoomLevel(1.3);
      }
    }
  };

  // Shared sub-component: Room Details Card (used in standard grid and fullscreen sidebar)
  const renderRoomDetailsCard = (isSidebar = false) => (
    <div className={isSidebar ? 'h-full flex flex-col justify-between space-y-4 text-white' : 'space-y-4'}>
      <div className="space-y-4">
        {/* Fullscreen Sidebar Top Bar */}
        {isSidebar && (
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Detail Ruangan & Jadwal</span>
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

            {/* Ongoing Status Indicator Badge */}
            {currentOngoingInActivePin ? (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 text-[10px] font-black flex items-center gap-1.5 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span>SESI SEDANG BERLANGSUNG</span>
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 font-medium">
                Tidak ada sesi aktif saat ini
              </span>
            )}
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

        {/* LIVE ONGOING SESSION HIGHLIGHT CARD (IF ACTIVE) */}
        {currentOngoingInActivePin && (
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-950 border-2 border-emerald-500/60 shadow-lg space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-emerald-400 font-black text-[11px] uppercase tracking-wider">
                <Activity className="w-4 h-4 animate-pulse text-emerald-400" />
                <span>Sesi Sedang Berlangsung Sekarang</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-black text-[10px]">
                {currentOngoingInActivePin.timeString}
              </span>
            </div>

            <h4 className="text-xs sm:text-sm font-black text-white leading-snug">
              {currentOngoingInActivePin.title}
            </h4>

            <div className="text-xs text-slate-300">
              <span className="text-slate-400">Moderator:</span> {currentOngoingInActivePin.moderator || '-'}
            </div>

            <div className="pt-1 flex items-center justify-between">
              <span className="text-[10px] text-emerald-300 font-semibold">
                Kategori: {currentOngoingInActivePin.category}
              </span>
              <button
                onClick={() => onSelectSession(currentOngoingInActivePin)}
                className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-black transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Buka Detail Sesi</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

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

        {/* Agenda/Sessions Scheduled in this Room */}
        <div className="space-y-2.5 pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1 text-sky-400" />
              Agenda di Ruangan Ini:
            </h4>

            {/* Day Filter inside info box */}
            <div className="flex items-center space-x-1 text-[10px] font-bold">
              {(['Semua', 'Hari I', 'Hari II'] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setSelectedDayFilter(d)}
                  className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                    selectedDayFilter === d ? 'bg-sky-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* 1-Click Room Session Timing Filter (Semua, Sedang Berlangsung / Live, Akan Datang) */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/70 rounded-lg border border-slate-800 text-[11px]">
            <button
              onClick={() => setRoomSessionTimingFilter('all')}
              className={`flex-1 py-1 px-2 rounded-md font-bold text-center transition-all cursor-pointer ${
                roomSessionTimingFilter === 'all'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setRoomSessionTimingFilter('ongoing')}
              className={`flex-1 py-1 px-2 rounded-md font-bold text-center transition-all flex items-center justify-center gap-1 cursor-pointer ${
                roomSessionTimingFilter === 'ongoing'
                  ? 'bg-emerald-600 text-white shadow-sm font-black'
                  : 'text-emerald-400 hover:text-emerald-300'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Sedang Live</span>
            </button>
            <button
              onClick={() => setRoomSessionTimingFilter('upcoming')}
              className={`flex-1 py-1 px-2 rounded-md font-bold text-center transition-all cursor-pointer ${
                roomSessionTimingFilter === 'upcoming'
                  ? 'bg-sky-600 text-white shadow-sm font-black'
                  : 'text-sky-400 hover:text-sky-300'
              }`}
            >
              Akan Datang
            </button>
          </div>

          {roomSessions.length === 0 ? (
            <div className="p-4 bg-slate-800/60 rounded-xl text-center text-slate-400 text-xs border border-slate-700/60">
              {activePin.type === 'facility' 
                ? "Area fasilitas umum tidak memiliki agenda ceramah simposium."
                : roomSessionTimingFilter === 'ongoing'
                ? "Tidak ada sesi yang sedang berlangsung di ruangan ini pada jam yang dipilih."
                : roomSessionTimingFilter === 'upcoming'
                ? "Tidak ada sesi yang akan datang di ruangan ini untuk jadwal hari ini."
                : "Tidak ada agenda simposium terjadwal untuk filter yang dipilih."
              }
            </div>
          ) : (
            <div className={`space-y-2 ${isSidebar ? 'max-h-[300px]' : 'max-h-[220px]'} overflow-y-auto pr-1`}>
              {roomSessions.map(sess => {
                const isCurrent = currentOngoingInActivePin?.id === sess.id;

                return (
                  <div
                    key={sess.id}
                    onClick={() => onSelectSession(sess)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer group ${
                      isCurrent
                        ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-sm'
                        : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mb-1">
                      <span className={`px-1.5 py-0.2 rounded font-black ${
                        isCurrent ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-200'
                      }`}>
                        {isCurrent ? 'SEDANG LIVE' : sess.day}
                      </span>
                      <span className="flex items-center text-slate-300 font-mono">
                        <Clock className="w-3 h-3 mr-1 text-sky-400" />
                        {sess.timeString}
                      </span>
                    </div>

                    <h5 className="text-xs font-bold text-white group-hover:text-sky-300 line-clamp-2">
                      {sess.title}
                    </h5>

                    <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                      <span>{sess.type}</span>
                      <span className="text-sky-400 font-bold group-hover:underline flex items-center">
                        Detail Sesi <ChevronRight className="w-3 h-3 ml-0.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

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
              {/* Active room glow filter */}
              <filter id="liveGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
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
              <pattern id="diagonalHatch" width="4" height="4" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="4" stroke="#0ea5e9" strokeWidth="0.8" opacity="0.15" />
              </pattern>
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

            {/* Room Boundary Polygons with Dynamic Ongoing & Selected Highlights */}
            {currentFloorPolygons.map((poly) => {
              const isOngoing = roomOngoingSessionsMap.has(poly.roomId);
              const isSelected = activePinId === poly.roomId || popupRoomId === poly.roomId;

              return (
                <g 
                  key={poly.roomId}
                  className="cursor-pointer pointer-events-auto group/polygon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePinClick(poly.roomId);
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
                        ? 'stroke-sky-300 fill-sky-500/35 group-hover/polygon:fill-sky-500/45'
                        : isOngoing
                        ? 'stroke-emerald-400 fill-emerald-950/40 group-hover/polygon:fill-emerald-900/60'
                        : 'stroke-slate-700 fill-slate-800/30 group-hover/polygon:stroke-sky-400 group-hover/polygon:fill-slate-800/70'
                    }`}
                    strokeWidth={isSelected ? '2' : isOngoing ? '1.4' : '0.7'}
                    filter={isSelected ? 'url(#selectedGlow)' : isOngoing ? 'url(#liveGlow)' : undefined}
                  />

                  {/* Pulsating dashed highlight outline for selected room on blueprint */}
                  {isSelected && (
                    <rect
                      x={poly.x - 0.7}
                      y={poly.y - 0.7}
                      width={poly.width + 1.4}
                      height={poly.height + 1.4}
                      rx="2.8"
                      className="stroke-sky-300 fill-none stroke-[1.3] animate-pulse pointer-events-none"
                      strokeDasharray="2.5 1.5"
                      filter="url(#selectedGlow)"
                    />
                  )}

                  {/* Pattern fill for ongoing session rooms */}
                  {isOngoing && !isSelected && (
                    <rect
                      x={poly.x}
                      y={poly.y}
                      width={poly.width}
                      height={poly.height}
                      rx="2"
                      fill="url(#diagonalHatch)"
                      className="pointer-events-none"
                    />
                  )}

                  {/* Room Name Label directly on SVG Floorplan */}
                  <text
                    x={poly.x + poly.width / 2}
                    y={poly.y + poly.height / 2 - 2}
                    textAnchor="middle"
                    className={`font-bold text-[2.8px] select-none pointer-events-none transition-colors ${
                      isSelected ? 'fill-sky-200 font-black' : 'fill-slate-300 group-hover/polygon:fill-white'
                    }`}
                  >
                    {poly.label}
                  </text>
                  <text
                    x={poly.x + poly.width / 2}
                    y={poly.y + poly.height / 2 + 2.5}
                    textAnchor="middle"
                    className={`text-[2.1px] font-bold select-none pointer-events-none ${
                      isSelected
                        ? 'fill-sky-300 font-black'
                        : isOngoing
                        ? 'fill-emerald-400 font-black'
                        : 'fill-sky-400/80 group-hover/polygon:fill-sky-300'
                    }`}
                  >
                    {isSelected ? '★ RUANGAN AKTIF' : isOngoing ? '● LIVE SEKARANG' : 'Ketuk untuk sesi'}
                  </text>

                  {/* Entry Door Mark */}
                  {poly.entryDoor && (
                    <circle
                      cx={poly.entryDoor.x}
                      cy={poly.entryDoor.y}
                      r={isSelected ? '1.5' : '1.2'}
                      className={isSelected ? 'fill-sky-300' : isOngoing ? 'fill-emerald-400' : 'fill-sky-400'}
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
            const isPopup = popupRoomId === pin.id;
            const ongoingSession = roomOngoingSessionsMap.get(pin.id);
            const isOngoing = Boolean(ongoingSession);
            const sessionCount = roomSessionCounts[pin.id] || 0;

            return (
              <div
                key={pin.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handlePinClick(pin.id);
                }}
                style={{ top: `${pin.y}%`, left: `${pin.x}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 z-20 group/pin"
                title={`${pin.name} - Ketuk untuk melihat daftar sesi`}
              >
                {/* Luminous Pulsing Sonar / Radar Waves when selected */}
                {(isSelected || isPopup) && (
                  <>
                    <span className="absolute -inset-7 rounded-full bg-sky-400/20 animate-ping pointer-events-none duration-1000" />
                    <span className="absolute -inset-4 rounded-full border-2 border-sky-400/70 animate-pulse pointer-events-none" />
                    <span className="absolute -inset-2 rounded-full bg-sky-400/30 blur-xs pointer-events-none" />
                  </>
                )}

                {/* Glowing Ping Ripple Effect for Ongoing Session (if not selected) */}
                {isOngoing && !isSelected && !isPopup && (
                  <>
                    <span className="absolute -inset-3 rounded-full bg-emerald-500/40 animate-ping pointer-events-none" />
                    <span className="absolute -inset-1 rounded-full bg-emerald-400/30 animate-pulse pointer-events-none" />
                  </>
                )}

                {/* Floating Pin Location Beacon Badge with Bounce Animation */}
                {(isSelected || isPopup) && (
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-30 animate-bounce">
                    <div className="px-2 py-0.5 rounded-full bg-gradient-to-r from-sky-400 via-sky-300 to-blue-500 text-slate-950 font-black text-[9px] shadow-lg shadow-sky-500/60 flex items-center gap-1 uppercase tracking-wider whitespace-nowrap border border-white">
                      <Sparkles className="w-2.5 h-2.5 text-slate-950 fill-slate-950" />
                      <span>RUANGAN TERPILIH</span>
                    </div>
                    <div className="w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-sky-400" />
                  </div>
                )}

                {/* Pin Card Element */}
                <div 
                  className={`relative px-2.5 py-1.5 rounded-xl border flex items-center space-x-1.5 shadow-xl transition-all duration-300 backdrop-blur-sm ${
                    isSelected || isPopup
                      ? 'bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white border-2 border-white scale-120 ring-4 ring-sky-400/80 shadow-[0_0_25px_rgba(56,189,248,0.85)] z-30 font-bold'
                      : isOngoing
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-emerald-300 scale-105 ring-2 ring-emerald-400 ring-offset-1 ring-offset-slate-900 shadow-emerald-500/40'
                      : 'bg-slate-900/90 text-slate-200 border-slate-700 hover:bg-slate-800 hover:scale-105 hover:border-slate-500'
                  }`}
                >
                  {/* Status / Category Dot */}
                  <span 
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      isSelected || isPopup
                        ? 'bg-white ring-2 ring-sky-300 animate-pulse'
                        : isOngoing
                        ? 'bg-emerald-300 animate-pulse'
                        : pin.color
                    }`} 
                  />

                  {/* Room Label */}
                  <span className="text-[11px] font-black whitespace-nowrap">
                    {pin.shortName}
                  </span>

                  {/* Live Badge or Session Count Badge */}
                  {isOngoing ? (
                    <span className="text-[9px] px-1.5 py-0.2 bg-emerald-950/80 text-emerald-200 border border-emerald-400/50 rounded-full font-black uppercase tracking-wider animate-pulse flex items-center gap-0.5">
                      <span className="w-1 h-1 rounded-full bg-emerald-300"></span>
                      LIVE
                    </span>
                  ) : pin.type !== 'facility' ? (
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-mono font-bold ${
                      isSelected || isPopup
                        ? 'bg-white/20 text-white border border-white/40'
                        : 'bg-sky-950/80 text-sky-300 border border-sky-700/50'
                    }`}>
                      {sessionCount > 0 ? `${sessionCount} Sesi` : `${pin.capacity} K`}
                    </span>
                  ) : null}
                </div>

                {/* Little downward pointer for active pin */}
                {(isPopup || isSelected) && (
                  <div className="w-0 h-0 border-x-5 border-x-transparent border-t-5 border-t-sky-300 mx-auto -mt-0.5 pointer-events-none drop-shadow-[0_2px_4px_rgba(56,189,248,0.9)]" />
                )}
              </div>
            );
          })}
        </div>

      </div>

      {/* Interactive Direct Room Sessions Popover Overlay */}
      {popupRoom && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-3 sm:max-w-md w-auto sm:w-[410px] bg-slate-900/95 backdrop-blur-xl rounded-2xl border-2 border-sky-500/70 shadow-2xl z-40 p-3.5 sm:p-4 text-white animate-in fade-in slide-in-from-bottom-2 select-text"
        >
          {/* Popover Header */}
          <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-800">
            <div className="flex items-start gap-2 min-w-0">
              <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 shrink-0 mt-0.5 border border-sky-500/30">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-black uppercase tracking-wider ${popupRoom.badgeBg || 'bg-slate-700 text-white'}`}>
                    {popupRoom.floor}
                  </span>
                  {popupRoom.capacity ? (
                    <span className="text-[10px] font-bold text-slate-400 flex items-center">
                      <Users className="w-3 h-3 mr-0.5 text-sky-400" />
                      {popupRoom.capacity} Kursi
                    </span>
                  ) : null}
                  {popupOngoingSession && (
                    <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-slate-950 text-[9px] font-black animate-pulse flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                      LIVE SEKARANG
                    </span>
                  )}
                </div>
                <h4 className="text-sm sm:text-base font-black text-white truncate leading-snug mt-0.5">
                  {popupRoom.name}
                </h4>
              </div>
            </div>

            <button
              onClick={() => setPopupRoomId(null)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
              title="Tutup jendela sesi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Ongoing Session Spotlight Card (if active) */}
          {popupOngoingSession && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border border-emerald-500/60 shadow-md">
              <div className="flex items-center justify-between text-[10px] mb-1 font-bold">
                <span className="text-emerald-400 flex items-center gap-1">
                  <Activity className="w-3 h-3 animate-pulse" />
                  <span>Sesi Sedang Berlangsung:</span>
                </span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-300 font-mono">
                  {popupOngoingSession.timeString}
                </span>
              </div>
              <p className="text-xs font-black text-white line-clamp-1">
                {popupOngoingSession.title}
              </p>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-[10px] text-slate-300 truncate max-w-[200px]">
                  {popupOngoingSession.moderator ? `Mod: ${popupOngoingSession.moderator}` : popupOngoingSession.category}
                </span>
                <button
                  onClick={() => onSelectSession(popupOngoingSession)}
                  className="px-2 py-0.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded text-[11px] font-black transition-colors flex items-center gap-0.5 cursor-pointer shrink-0"
                >
                  <span>Buka Sesi</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Filter Bar for Popover Session List */}
          <div className="mt-2.5 flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-300">
              <Calendar className="w-3 h-3 text-sky-400" />
              <span>Daftar Sesi ({popupSessions.length}):</span>
            </div>

            <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px]">
              {(['all', 'ongoing', 'upcoming'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setPopupTimingFilter(mode)}
                  className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                    popupTimingFilter === mode
                      ? 'bg-sky-500 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {mode === 'all' ? 'Semua' : mode === 'ongoing' ? 'Live' : 'Mendatang'}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable List of Sessions in Selected Room */}
          <div className="mt-2 max-h-48 overflow-y-auto space-y-1.5 pr-1">
            {popupSessions.length === 0 ? (
              <div className="py-3 px-2 text-center text-xs text-slate-400 bg-slate-950/60 rounded-xl border border-slate-800">
                {popupRoom.type === 'facility'
                  ? 'Area fasilitas umum tidak memiliki agenda ceramah simposium.'
                  : 'Tidak ada sesi untuk filter jadwal yang dipilih.'}
              </div>
            ) : (
              popupSessions.map((session) => {
                const isOngoing = popupOngoingSession?.id === session.id;
                return (
                  <div
                    key={session.id}
                    onClick={() => onSelectSession(session)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer group flex flex-col gap-1 ${
                      isOngoing
                        ? 'bg-emerald-950/40 border-emerald-500/70 hover:bg-emerald-950/60'
                        : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80 hover:border-sky-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-mono text-sky-300 font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-sky-400" />
                        {session.timeString}
                      </span>
                      <span className={`px-1.5 py-0.2 rounded font-black text-[9px] ${
                        isOngoing ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-300'
                      }`}>
                        {isOngoing ? 'SEDANG LIVE' : session.category}
                      </span>
                    </div>

                    <h5 className="text-xs font-bold text-white group-hover:text-sky-300 line-clamp-2 leading-tight">
                      {session.title}
                    </h5>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                      <span className="truncate max-w-[220px]">
                        {session.moderator ? `Mod: ${session.moderator}` : session.type}
                      </span>
                      <span className="text-sky-400 font-bold group-hover:underline flex items-center shrink-0">
                        Lihat Detail <ChevronRight className="w-3 h-3 ml-0.5" />
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Popover Footer Action */}
          <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <button
              onClick={() => handleFocusRoom(popupRoom.id)}
              className="text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <MapPin className="w-3 h-3" />
              <span>Pusatkan Kamera</span>
            </button>

            <span className="text-[10px] text-slate-500">
              Ketuk sesi untuk detail lengkap
            </span>
          </div>
        </div>
      )}

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
      <div className={`absolute bottom-2.5 left-2.5 right-2.5 bg-slate-900/95 backdrop-blur-md p-2 rounded-xl border border-slate-800 text-[10px] text-slate-300 flex flex-wrap items-center justify-between gap-2 z-30 shadow-md transition-all ${
        popupRoom ? 'hidden md:flex md:right-[430px]' : 'flex'
      }`}>
        <div className="flex items-center space-x-3 flex-wrap">
          <span className="flex items-center font-bold text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 mr-1 animate-ping" />
            Sesi Sedang Berlangsung (LIVE)
          </span>
          <span className="flex items-center">
            <span className="w-2 h-2 rounded-full bg-rose-500 mr-1" /> Ballroom Pleno
          </span>
          <span className="flex items-center">
            <span className="w-2 h-2 rounded-full bg-amber-500 mr-1" /> Hall Paralel
          </span>
          <span className="flex items-center">
            <span className="w-2 h-2 rounded-full bg-indigo-500 mr-1" /> Workshop Skill
          </span>
        </div>
        <div className="text-sky-400 font-medium hidden sm:inline">
          *Ketuk pin / ruangan untuk melihat daftar sesi langsung
        </div>
      </div>

    </div>
  );

  // Shared sub-component: Quick Room Selector Chips below Map
  const renderQuickRoomChips = () => (
    <div className="pt-2">
      <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
        <span>Daftar Ruangan {selectedFloor}:</span>
        <span className="text-[10px] text-sky-400 lowercase">klik pin/ruangan untuk melihat jadwal</span>
      </div>
      <div className="flex flex-wrap gap-1.5 max-h-20 sm:max-h-24 overflow-y-auto pr-1">
        {filteredPins.map(pin => {
          const isOngoing = roomOngoingSessionsMap.has(pin.id);
          const isPopup = popupRoomId === pin.id;
          const count = roomSessionCounts[pin.id] || 0;
          return (
            <button
              key={pin.id}
              onClick={() => handlePinClick(pin.id)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                isPopup || activePinId === pin.id
                  ? 'bg-sky-500 text-slate-950 border-sky-400 font-black shadow-md'
                  : isOngoing
                  ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/60 hover:bg-emerald-900'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isOngoing ? 'bg-emerald-400 animate-pulse' : pin.color}`} />
              <span>{pin.name}</span>
              {isOngoing ? (
                <span className="text-[9px] px-1 bg-emerald-500 text-slate-950 rounded font-black">
                  LIVE
                </span>
              ) : count > 0 ? (
                <span className="text-[9px] px-1 bg-slate-900/60 text-slate-300 rounded font-mono">
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
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

          {/* Center: Floor Switcher, Day Filter & Search */}
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

            {/* Day selection */}
            <div className="hidden md:flex items-center bg-slate-950 rounded-lg p-1 border border-slate-800 text-xs shrink-0">
              {(['Hari I', 'Hari II'] as const).map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDayFilter(day)}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    selectedDayFilter === day ? 'bg-sky-400 text-slate-950 font-black' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {day}
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
          </div>
          <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
            Denah Ruangan & Highlight Sesi Berlangsung
          </h2>
        </div>

        {/* Floor Switcher & Fullscreen Mode Action */}
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

      {/* Live Time Simulator & Session Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-4 text-white shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        
        {/* Left: Ongoing Sessions Count Indicator */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping absolute"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
          </div>
          <div>
            <div className="text-xs font-black text-white flex items-center gap-1.5">
              <span>Status Live Session:</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold">
                {roomOngoingSessionsMap.size} Ruangan Sedang Berlangsung
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Ruangan aktif ditandai dengan outline hijau menyala, ripple visual, dan badge 'LIVE'.
            </div>
          </div>
        </div>

        {/* Right: Interactive Timeline / Time Simulator Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Day selection */}
          <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700 text-xs">
            {(['Hari I', 'Hari II'] as const).map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDayFilter(day)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  selectedDayFilter === day ? 'bg-sky-500 text-slate-950 font-black' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Time Preset Picker */}
          <div className="flex items-center gap-1.5 bg-slate-800 rounded-lg px-2.5 py-1.5 border border-slate-700">
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[11px] text-slate-400 font-medium">Jam Sesi:</span>
            <select
              value={simulatedTimeSlot}
              onChange={(e) => {
                setSimulatedTimeSlot(e.target.value);
                setIsLiveClockMode(false);
              }}
              disabled={isLiveClockMode}
              className="bg-slate-900 border border-slate-700 text-white text-xs rounded px-2 py-0.5 font-mono focus:outline-none focus:border-sky-400"
            >
              <option value="08:30">08:30 WIB (Plenary Pagi)</option>
              <option value="09:00">09:00 WIB (Simposium Paralel)</option>
              <option value="10:45">10:45 WIB (Sesi Siang)</option>
              <option value="13:30">13:30 WIB (Workshop Siang)</option>
              <option value="15:30">15:30 WIB (Diskusi Panel Sore)</option>
              <option value="17:00">17:00 WIB (Selesai)</option>
            </select>
          </div>

          {/* Realtime Clock Toggle */}
          <button
            onClick={() => setIsLiveClockMode(!isLiveClockMode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
              isLiveClockMode
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="Gunakan jam aktual perangkat Anda saat ini"
          >
            <Radio className={`w-3.5 h-3.5 ${isLiveClockMode ? 'animate-pulse text-white' : 'text-slate-400'}`} />
            <span>{isLiveClockMode ? 'Waktu Riil Aktif' : 'Gunakan Jam Riil'}</span>
          </button>
        </div>

      </div>

      {/* Main Grid: Interactive Map Stage (7 cols) + Room Detail Panel (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Map Stage Canvas (7 Columns) */}
        <div className="lg:col-span-7 bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-xl flex flex-col space-y-3 relative">
          
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

        {/* Selected Room Details Panel (5 Columns) */}
        <div className="lg:col-span-5 bg-slate-900 rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-xl flex flex-col justify-between space-y-4 text-white">
          {renderRoomDetailsCard(false)}
        </div>

      </div>

    </div>
  );
};
