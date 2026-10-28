import { Session, Speaker, SymposiumInfo } from '../types';
import { 
  MUNAS_ADHPHKI_EVENT_INFO, 
  MUNAS_SPEAKERS, 
  MUNAS_SESSIONS, 
  MUNAS_ROOMS 
} from './munasAdhphkiData';

export const SYMPOSIUM_INFO: SymposiumInfo = MUNAS_ADHPHKI_EVENT_INFO;

export const SPEAKERS_DATABASE: Record<string, Speaker> = MUNAS_SPEAKERS;

export const SESSIONS_DATA: Session[] = MUNAS_SESSIONS;

export const ROOMS_LIST = [
  { id: "all", name: "Semua Ruangan", floor: "Semua" },
  { id: "Antareja Room", name: "Antareja Room", floor: "Ground Floor", color: "border-l-amber-500 text-amber-700 bg-amber-50" },
  { id: "Wisanggeni Room", name: "Wisanggeni Room", floor: "Ground Floor", color: "border-l-violet-500 text-violet-700 bg-violet-50" },
  { id: "Ballroom Amartapura A", name: "Ballroom Amartapura A", floor: "Lantai 1", color: "border-l-indigo-500 text-indigo-700 bg-indigo-50" },
  { id: "Ballroom Amartapura B", name: "Ballroom Amartapura B", floor: "Lantai 1", color: "border-l-emerald-500 text-emerald-700 bg-emerald-50" },
  { id: "Foyer & Exhibition Amartapura", name: "Foyer & Exhibition Area Amartapura", floor: "Lantai 1", color: "border-l-teal-500 text-teal-700 bg-teal-50" }
];

export const CATEGORIES_LIST = [
  "Semua Kategori",
  "Workshop Pre-Congress",
  "Veterinary Nursing",
  "Bedah & Rekonstruksi",
  "Onkologi & Sitologi",
  "Emergency & Critical Care",
  "Kardiologi Veteriner",
  "Dermatologi Veteriner",
  "Penyakit Dalam Kucing",
  "Organisasi & Munas",
  "Pameran & Networking"
];
