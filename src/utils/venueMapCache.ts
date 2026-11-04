import { Room, Session, SymposiumInfo } from '../types';

export interface RoomGeoPolygonCache {
  roomId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  entryDoor?: { x: number; y: number; label?: string };
}

export interface VenueMapOfflineSnapshot {
  version: number;
  cachedAt: string;
  rooms: Room[];
  sessions: Session[];
  floorPolygons: Record<string, RoomGeoPolygonCache[]>;
  eventInfo?: SymposiumInfo;
}

export interface VenueMapUIState {
  selectedFloor: string;
  activePinId: string;
  selectedDayFilter: string;
  updatedAt: string;
}

const CACHE_NAME = 'kivnahk-venue-map-cache-v1';
const CACHE_ENDPOINT = '/__offline_cache__/venue-map-snapshot.json';
const LOCAL_STORAGE_SNAPSHOT_KEY = 'simposium_venue_map_offline_v1';
const LOCAL_STORAGE_UI_STATE_KEY = 'simposium_venue_map_ui_state_v1';

/**
 * Saves the complete interactive venue map dataset (rooms, sessions, floor polygons, event info)
 * to both localStorage (instant synchronous access) and Service Worker Cache Storage API (persistent offline storage).
 */
export async function saveVenueMapToCache(
  rooms: Room[],
  sessions: Session[],
  floorPolygons: Record<string, RoomGeoPolygonCache[]>,
  eventInfo?: SymposiumInfo
): Promise<{ success: boolean; cachedAt: string; storageType: 'cache-api+local' | 'local-only' }> {
  const cachedAt = new Date().toISOString();
  const snapshot: VenueMapOfflineSnapshot = {
    version: 1,
    cachedAt,
    rooms,
    sessions,
    floorPolygons,
    eventInfo,
  };

  const serialized = JSON.stringify(snapshot);

  // Layer 1: Synchronous localStorage persistence
  try {
    localStorage.setItem(LOCAL_STORAGE_SNAPSHOT_KEY, serialized);
  } catch (err) {
    console.warn('Failed to write venue map snapshot to localStorage:', err);
  }

  // Layer 2: Browser Cache Storage API (shared with Service Worker runtime)
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const cache = await window.caches.open(CACHE_NAME);
      const response = new Response(serialized, {
        headers: {
          'Content-Type': 'application/json',
          'X-Offline-Cached-At': cachedAt,
          'Cache-Control': 'max-age=31536000',
        },
      });
      await cache.put(CACHE_ENDPOINT, response);
      return { success: true, cachedAt, storageType: 'cache-api+local' };
    } catch (err) {
      console.warn('Failed to write venue map snapshot to Cache Storage:', err);
    }
  }

  return { success: true, cachedAt, storageType: 'local-only' };
}

/**
 * Synchronously reads the cached venue map snapshot from localStorage for instant initial render.
 */
export function loadVenueMapFromLocalSync(): VenueMapOfflineSnapshot | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SNAPSHOT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as VenueMapOfflineSnapshot;
    if (parsed && Array.isArray(parsed.rooms) && parsed.rooms.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.warn('Failed to read venue map snapshot from localStorage:', err);
  }
  return null;
}

/**
 * Asynchronously loads the cached venue map snapshot from Cache Storage API first,
 * falling back to localStorage if Cache Storage is unavailable.
 */
export async function loadVenueMapFromCache(): Promise<VenueMapOfflineSnapshot | null> {
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const cache = await window.caches.open(CACHE_NAME);
      const match = await cache.match(CACHE_ENDPOINT);
      if (match) {
        const data = (await match.json()) as VenueMapOfflineSnapshot;
        if (data && Array.isArray(data.rooms) && data.rooms.length > 0) {
          // Ensure localStorage stays in sync with Cache Storage
          try {
            localStorage.setItem(LOCAL_STORAGE_SNAPSHOT_KEY, JSON.stringify(data));
          } catch (_) {}
          return data;
        }
      }
    } catch (err) {
      console.warn('Failed to read venue map snapshot from Cache Storage:', err);
    }
  }

  return loadVenueMapFromLocalSync();
}

/**
 * Persists the attendee's active navigation state (floor, selected room pin, day filter)
 * so returning to the map offline restores their exact position.
 */
export function saveVenueMapUIState(state: Omit<VenueMapUIState, 'updatedAt'>): void {
  try {
    const payload: VenueMapUIState = {
      ...state,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(LOCAL_STORAGE_UI_STATE_KEY, JSON.stringify(payload));
  } catch (_) {}
}

/**
 * Loads the attendee's last active venue map navigation state.
 */
export function loadVenueMapUIState(): VenueMapUIState | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_UI_STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as VenueMapUIState;
  } catch (_) {
    return null;
  }
}
