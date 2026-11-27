import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  where,
  serverTimestamp,
  runTransaction,
  type Unsubscribe,
  type Timestamp,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db, OperationType, handleFirestoreError, toFirestoreDocId } from '../firebase';
import type {
  SymposiumInfo,
  Session,
  Speaker,
  Exhibitor,
  Room,
  Participant,
  BroadcastNotification,
  AttendanceRecord,
  ChatMessage,
  PresentationMaterial,
  WorkshopIdentityCardTemplate,
  WorkshopRundownPdf,
} from '../types';
import {
  base64ToPdfBlob,
  getPdfMaterialLocal,
  savePdfMaterialLocal,
  splitBase64IntoChunks,
} from '../utils/presentationPdfStorage';
import { normalizeIdentityCardLayout } from '../utils/identityCardLayout';

const BOOTSTRAP_ADMIN_EMAIL = 'pranowo.tfc@gmail.com';

const VALID_THEME_COLORS = [
  'medical-navy',
  'gold-amber',
  'cyan-teal',
  'emerald-green',
  'crimson-ruby',
  'royal-indigo',
] as const;

const VALID_SESSION_TYPES = [
  'Plenary Session',
  'Simposium Paralel',
  'Workshop Hands-On',
  'Keynote Lecture',
  'Panel Discussion',
] as const;

const VALID_EXHIBITOR_CATEGORIES = [
  'Farmasi',
  'Alat Medis & Diagnostik',
  'Teknologi & AI',
  'Rumah Sakit & Lab',
] as const;

const VALID_ROOM_TYPES = [
  'ballroom',
  'hall',
  'auditorium',
  'workshop',
  'facility',
] as const;

const VALID_CHAT_ROLES = [
  'Peserta',
  'Dokter Spesialis',
  'Dokter Umum',
  'Residen',
  'Moderator',
  'Pembicara',
  'Panitia',
] as const;

const VALID_BROADCAST_TYPES = ['info', 'warning', 'urgent', 'success'] as const;

function clampStr(val: unknown, maxLen: number, fallback = ''): string {
  const str = typeof val === 'string' ? val.trim() : fallback;
  return (str || fallback).slice(0, maxLen);
}

function clampStringArray(val: unknown, maxItems: number, maxItemLen = 500): string[] {
  if (!Array.isArray(val)) return [];
  return val
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .slice(0, maxItems)
    .map((item) => item.trim().slice(0, maxItemLen));
}

// ============================================================================
// Payload Sanitizers matching firebase-blueprint.json & firestore.rules
// ============================================================================

function sanitizeWorkshopRundownPdfsMap(
  rawMap?: Record<string, WorkshopRundownPdf>
): Record<string, WorkshopRundownPdf> {
  const result: Record<string, WorkshopRundownPdf> = {};
  if (!rawMap || typeof rawMap !== 'object') return result;

  Object.entries(rawMap)
    .slice(0, 15)
    .forEach(([key, val]) => {
      if (!val || typeof val !== 'object') return;
      const safeKey = toFirestoreDocId(val.workshopKey || key, 'ws_rundown').slice(0, 120);
      const safeMatId = toFirestoreDocId(val.materialId, 'mat').slice(0, 128);
      result[safeKey] = {
        workshopKey: safeKey,
        workshopLabel: clampStr(val.workshopLabel, 200, safeKey),
        materialId: safeMatId,
        title: clampStr(val.title, 300, `Rundown ${val.workshopLabel || safeKey}`),
        fileName: clampStr(val.fileName, 250, 'rundown-workshop.pdf'),
        fileSize: Math.max(0, Math.min(15728640, Math.round(Number(val.fileSize) || 0))),
        mimeType: clampStr(val.mimeType, 100, 'application/pdf'),
        chunkCount: Math.max(0, Math.min(40, Math.round(Number(val.chunkCount) || 0))),
        ...(val.externalUrl ? { externalUrl: clampStr(val.externalUrl, 1000) } : {}),
        uploadedAt: clampStr(val.uploadedAt, 60, new Date().toISOString()),
      };
    });

  return result;
}

function sanitizeEventInfoPayload(info: SymposiumInfo, updatedBy?: string) {
  const themeColor = VALID_THEME_COLORS.includes(info.themeColor as any)
    ? info.themeColor
    : 'emerald-green';

  const payload: Record<string, any> = {
    title: clampStr(info.title, 200, 'Simposium Nasional 2026'),
    subtitle: clampStr(info.subtitle, 400),
    theme: clampStr(info.theme, 500),
    location: clampStr(info.location, 250, 'Grand Ballroom & Convention Hall'),
    venueAddress: clampStr(info.venueAddress, 300),
    city: clampStr(info.city, 120),
    dateString: clampStr(info.dateString, 120),
    dates: info.dates || { day1: '', day2: '' },
    organizer: clampStr(info.organizer, 250, 'Panitia Simposium'),
    accreditation: clampStr(info.accreditation, 200),
    logoUrl: clampStr(info.logoUrl, 500000),
    customIdentityCardUrl: clampStr(info.customIdentityCardUrl, 500000),
    identityCardLayout: normalizeIdentityCardLayout(info.identityCardLayout),
    workshopRundownPdfs: sanitizeWorkshopRundownPdfsMap(info.workshopRundownPdfs),
    themeColor,
    contactEmail: clampStr(info.contactEmail, 160),
    contactPhone: clampStr(info.contactPhone, 60),
    websiteUrl: clampStr(info.websiteUrl, 300),
    enableQrAttendance: Boolean(info.enableQrAttendance),
    isPublished: true,
    updatedAt: serverTimestamp(),
  };

  if (updatedBy) {
    payload.updatedBy = clampStr(updatedBy, 128);
  }
  return payload;
}

function sanitizeIdentityCardTemplatePayload(
  tpl: WorkshopIdentityCardTemplate,
  updatedBy?: string
) {
  const docId = toFirestoreDocId(tpl.workshopKey || tpl.workshopLabel, 'workshop_card').slice(
    0,
    120
  );
  const payload: Record<string, any> = {
    id: docId,
    workshopKey: docId,
    workshopLabel: clampStr(tpl.workshopLabel, 200, docId),
    templateUrl: clampStr(tpl.templateUrl, 500000),
    isPublished: true,
    updatedAt: serverTimestamp(),
  };
  if (tpl.layout) {
    payload.layout = normalizeIdentityCardLayout(tpl.layout);
  }
  if (updatedBy) {
    payload.updatedBy = clampStr(updatedBy, 128);
  }
  return { docId, data: payload };
}

function sanitizeSessionPayload(session: Session) {
  const docId = toFirestoreDocId(session.id, 'session');
  const sessionType = VALID_SESSION_TYPES.includes(session.type as any)
    ? session.type
    : 'Plenary Session';

  const speakers = Array.isArray(session.speakers)
    ? session.speakers.slice(0, 20).map((sp) => ({
        id: clampStr(sp.id, 128, `sp_${Date.now()}`),
        name: clampStr(sp.name, 200),
        title: clampStr(sp.title, 200),
        institution: clampStr(sp.institution, 250),
        photoUrl: clampStr(sp.photoUrl, 500000),
        bio: clampStr(sp.bio, 3000),
        specialty: clampStr(sp.specialty, 200),
        talkTitle: clampStr(sp.talkTitle, 300),
      }))
    : [];

  const rundown = Array.isArray(session.rundown)
    ? session.rundown.slice(0, 50).map((item) => ({
        id: clampStr(item.id, 128, `rd_${Date.now()}`),
        startTime: clampStr(item.startTime, 10),
        endTime: clampStr(item.endTime, 10),
        activity: clampStr(item.activity, 300),
        pic: clampStr(item.pic, 150),
        notes: clampStr(item.notes, 300),
      }))
    : [];

  const presentationMaterials = Array.isArray(session.presentationMaterials)
    ? session.presentationMaterials.slice(0, 20).map((mat) => ({
        id: toFirestoreDocId(mat.id, 'mat'),
        title: clampStr(mat.title, 300, 'Materi Presentasi'),
        fileName: clampStr(mat.fileName, 250, 'materi.pdf'),
        fileSize:
          typeof mat.fileSize === 'number' && Number.isFinite(mat.fileSize)
            ? Math.max(0, Math.min(15728640, Math.round(mat.fileSize)))
            : 0,
        mimeType: clampStr(mat.mimeType, 100, 'application/pdf'),
        chunkCount:
          typeof mat.chunkCount === 'number' && Number.isFinite(mat.chunkCount)
            ? Math.max(0, Math.min(40, Math.round(mat.chunkCount)))
            : 0,
        externalUrl: clampStr(mat.externalUrl, 1000),
        speakerName: clampStr(mat.speakerName, 200),
        uploadedAt: clampStr(mat.uploadedAt, 60, new Date().toISOString()),
      }))
    : [];

  return {
    docId,
    data: {
      id: clampStr(session.id || docId, 128),
      day: clampStr(session.day, 80, 'Hari I'),
      date: clampStr(session.date, 100, '-'),
      startTime: clampStr(session.startTime, 10, '08:00'),
      endTime: clampStr(session.endTime, 10, '09:00'),
      timeString: clampStr(session.timeString, 50, '08:00 - 09:00 WIB'),
      title: clampStr(session.title, 300, 'Sesi Simposium'),
      category: clampStr(session.category, 120, 'Umum'),
      type: sessionType,
      room: clampStr(session.room, 120, 'Main Hall'),
      floor: clampStr(session.floor, 80, 'Lantai 1'),
      roomColor: clampStr(session.roomColor, 80, 'bg-indigo-600'),
      moderator: clampStr(session.moderator, 200),
      speakers,
      abstract: {
        background: clampStr(session.abstract?.background, 5000),
        clinicalUpdates: clampStringArray(session.abstract?.clinicalUpdates, 30, 500),
        conclusion: clampStr(session.abstract?.conclusion, 3000),
      },
      keyTakeaways: clampStringArray(session.keyTakeaways, 20, 500),
      capacity:
        typeof session.capacity === 'number' && Number.isFinite(session.capacity)
          ? Math.max(0, Math.min(10000, Math.round(session.capacity)))
          : 100,
      rundown,
      pdfUrl: clampStr(session.pdfUrl, 1000),
      presentationMaterials,
      isPublished: true,
      updatedAt: serverTimestamp(),
    },
  };
}

function sanitizeSpeakerPayload(speaker: Speaker) {
  const docId = toFirestoreDocId(speaker.id, 'sp');
  return {
    docId,
    data: {
      id: clampStr(speaker.id || docId, 128),
      name: clampStr(speaker.name, 200, 'Pembicara'),
      title: clampStr(speaker.title, 200),
      institution: clampStr(speaker.institution, 250),
      photoUrl: clampStr(speaker.photoUrl, 500000),
      bio: clampStr(speaker.bio, 3000),
      specialty: clampStr(speaker.specialty, 200),
      talkTitle: clampStr(speaker.talkTitle, 300),
      isPublished: true,
      updatedAt: serverTimestamp(),
    },
  };
}

function sanitizeExhibitorPayload(exhibitor: Exhibitor) {
  const docId = toFirestoreDocId(exhibitor.id, 'exh');
  const category = VALID_EXHIBITOR_CATEGORIES.includes(exhibitor.category as any)
    ? exhibitor.category
    : 'Farmasi';
  return {
    docId,
    data: {
      id: clampStr(exhibitor.id || docId, 128),
      name: clampStr(exhibitor.name, 200, 'Exhibitor'),
      boothNumber: clampStr(exhibitor.boothNumber, 40, 'A1'),
      category,
      zone: clampStr(exhibitor.zone, 120, 'Exhibition Hall'),
      tagline: clampStr(exhibitor.tagline, 250),
      description: clampStr(exhibitor.description, 2000),
      featuredProducts: clampStringArray(exhibitor.featuredProducts, 20, 200),
      contactEmail: clampStr(exhibitor.contactEmail, 160),
      website: clampStr(exhibitor.website, 300),
      phone: clampStr(exhibitor.phone, 60),
      demoSchedule: clampStr(exhibitor.demoSchedule, 200),
      highlight: clampStr(exhibitor.highlight, 200),
      isPublished: true,
      updatedAt: serverTimestamp(),
    },
  };
}

function sanitizeRoomPayload(room: Room) {
  const docId = toFirestoreDocId(room.id || room.name, 'room');
  const type = VALID_ROOM_TYPES.includes(room.type as any) ? room.type : 'hall';
  return {
    docId,
    data: {
      id: clampStr(room.id || docId, 128),
      name: clampStr(room.name, 150, 'Ruangan'),
      shortName: clampStr(room.shortName || room.name, 80),
      floor: clampStr(room.floor, 80, 'Lantai 1'),
      capacity:
        typeof room.capacity === 'number' && Number.isFinite(room.capacity)
          ? Math.max(0, Math.min(10000, Math.round(room.capacity)))
          : 100,
      description: clampStr(room.description, 1500),
      facilities: clampStringArray(room.facilities, 30, 150),
      type,
      color: clampStr(room.color, 80),
      badgeBg: clampStr(room.badgeBg, 80),
      x: typeof room.x === 'number' && Number.isFinite(room.x) ? Math.max(0, Math.min(100, room.x)) : 50,
      y: typeof room.y === 'number' && Number.isFinite(room.y) ? Math.max(0, Math.min(100, room.y)) : 50,
      isPublished: true,
      updatedAt: serverTimestamp(),
    },
  };
}

function sanitizeBroadcastPayload(broadcast: BroadcastNotification) {
  const docId = toFirestoreDocId(broadcast.id, 'bc');
  const type = VALID_BROADCAST_TYPES.includes(broadcast.type as any) ? broadcast.type : 'info';
  return {
    docId,
    data: {
      id: clampStr(broadcast.id || docId, 128),
      title: clampStr(broadcast.title, 200, 'Pengumuman Panitia'),
      message: clampStr(broadcast.message, 1000, '-'),
      type,
      category: clampStr(broadcast.category, 100, 'Informasi'),
      actionTab: clampStr(broadcast.actionTab, 50),
      actionLabel: clampStr(broadcast.actionLabel, 80),
      durationSeconds:
        typeof broadcast.durationSeconds === 'number' && Number.isFinite(broadcast.durationSeconds)
          ? Math.max(0, Math.min(3600, Math.round(broadcast.durationSeconds)))
          : 0,
      sound: Boolean(broadcast.sound),
      timestamp: typeof broadcast.timestamp === 'number' ? broadcast.timestamp : Date.now(),
      sentBy: clampStr(broadcast.sentBy, 160, 'Panitia'),
      isPublished: true,
      updatedAt: serverTimestamp(),
    },
  };
}

function sanitizeCustomFields(
  raw: unknown
): Record<string, string> | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const entries = Object.entries(raw as Record<string, unknown>)
    .filter(([k, v]) => k.trim().length > 0 && v !== undefined && v !== null && String(v).trim().length > 0)
    .slice(0, 30);
  if (entries.length === 0) return undefined;
  const result: Record<string, string> = {};
  for (const [key, value] of entries) {
    const cleanKey = key.trim().slice(0, 60);
    const cleanVal = String(value).trim().slice(0, 300);
    if (cleanKey && cleanVal) {
      result[cleanKey] = cleanVal;
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

function isIdRegistrantCustomKey(key: string): boolean {
  const normalized = (key || '').trim().replace(/[\s-]+/g, '_');
  return (
    /^(id|id_registrant|id_registrasi|registrant_id|registrant|registration_id|reg_id|no_registrasi|kode_registrasi|id_pendaftaran|id_peserta|kode_peserta)$/i.test(
      normalized
    ) ||
    /(id_registrant|id_registrasi|registrant_id|no_registrasi|kode_registrasi|id_pendaftaran|registration_id|reg_id)/i.test(
      normalized
    )
  );
}

function resolveIdRegistrantValue(participant: Participant): string {
  if (participant.idRegistrant && participant.idRegistrant.trim()) {
    return participant.idRegistrant.trim();
  }
  if (participant.customFields) {
    for (const [k, v] of Object.entries(participant.customFields)) {
      if (isIdRegistrantCustomKey(k) && String(v || '').trim()) {
        return String(v).trim();
      }
    }
  }
  return '';
}

function buildRegistrantDirectoryEntries(participant: Participant): Array<{
  lookupId: string;
  data: Record<string, any>;
}> {
  const rawKeys = new Set<string>();
  const primaryIdReg = resolveIdRegistrantValue(participant);
  if (primaryIdReg) rawKeys.add(primaryIdReg);
  if (participant.badgeId?.trim()) rawKeys.add(participant.badgeId.trim());
  if (participant.customFields) {
    for (const [k, v] of Object.entries(participant.customFields)) {
      if (isIdRegistrantCustomKey(k) && String(v || '').trim()) {
        rawKeys.add(String(v).trim());
      }
    }
  }

  const seenDocIds = new Set<string>();
  const entries: Array<{ lookupId: string; data: Record<string, any> }> = [];

  for (const rawKey of rawKeys) {
    const lookupId = toFirestoreDocId(rawKey.toUpperCase(), 'reg');
    if (seenDocIds.has(lookupId)) continue;
    seenDocIds.add(lookupId);

    entries.push({
      lookupId,
      data: {
        id: lookupId,
        idRegistrant: clampStr(primaryIdReg || rawKey, 80, lookupId),
        name: clampStr(participant.name, 180, 'Peserta'),
        title: clampStr(participant.title, 60),
        institution: clampStr(participant.institution, 200, 'RS / Faskes Peserta'),
        role: clampStr(participant.role, 100, 'Peserta'),
        ticketType: clampStr(participant.ticketType, 120, 'Simposium Full Pass'),
        badgeId: clampStr(participant.badgeId || primaryIdReg, 80, lookupId),
        isActive: true,
        updatedAt: serverTimestamp(),
      },
    });
  }

  return entries;
}

function sanitizeParticipantPayload(
  participant: Participant,
  existingCreatedAt?: Timestamp | null,
  ownerUid?: string
) {
  const docId = toFirestoreDocId(participant.id || participant.email, 'part');
  const role = clampStr(participant.role, 100, 'Peserta');
  const ticketType = clampStr(participant.ticketType, 120, 'Simposium Full Pass');
  const safeEmail = clampStr(participant.email, 180).toLowerCase();
  const resolvedIdRegistrant = resolveIdRegistrantValue(participant);

  const data: Record<string, any> = {
    id: clampStr(participant.id || docId, 128),
    idRegistrant: clampStr(resolvedIdRegistrant, 80),
    email: safeEmail.length >= 3 ? safeEmail : `${docId}@peserta.local`,
    name: clampStr(participant.name, 180, 'Peserta'),
    title: clampStr(participant.title, 60),
    npaIdi: clampStr(participant.npaIdi, 80),
    institution: clampStr(participant.institution, 200),
    role,
    phone: clampStr(participant.phone, 50),
    ticketType,
    badgeId: clampStr(participant.badgeId || resolvedIdRegistrant, 80, `ID-SIMP-2026`),
    registeredAt: clampStr(participant.registeredAt, 40, new Date().toISOString().split('T')[0]),
    createdAt: existingCreatedAt || serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const cleanCustomFields = sanitizeCustomFields(participant.customFields);
  if (cleanCustomFields) {
    data.customFields = cleanCustomFields;
  }

  if (ownerUid) {
    data.userId = clampStr(ownerUid, 128);
  }

  return { docId, data };
}

// ============================================================================
// Auth Profile & Admin Role Check
// ============================================================================

const pendingProfileChecks = new Map<string, Promise<{ isAdmin: boolean }>>();

export async function ensureUserProfileAndCheckAdmin(user: User): Promise<{ isAdmin: boolean }> {
  const uid = toFirestoreDocId(user.uid, 'user');
  const existingPromise = pendingProfileChecks.get(uid);
  if (existingPromise) {
    return existingPromise;
  }

  const task = (async (): Promise<{ isAdmin: boolean }> => {
    const userPath = `users/${uid}`;
    const email = (user.email || '').trim().toLowerCase();
    const isBootstrappedAdmin =
      Boolean(user.emailVerified) && email === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();

    let isAdminInDb = false;
    try {
      const adminSnap = await getDoc(doc(db, 'admins', uid));
      isAdminInDb = adminSnap.exists();
    } catch {
      isAdminInDb = false;
    }

    const isAdmin = isBootstrappedAdmin || isAdminInDb;

    try {
      const userRef = doc(db, 'users', uid);
      await runTransaction(db, async (tx) => {
        const userSnap = await tx.get(userRef);
        const safeDisplayName = clampStr(
          user.displayName || email.split('@')[0] || 'Peserta',
          180
        );
        const safePhotoUrl = clampStr(user.photoURL, 500);

        if (!userSnap.exists()) {
          tx.set(userRef, {
            uid,
            email: clampStr(email || `${uid}@firebase.local`, 180),
            displayName: safeDisplayName,
            photoURL: safePhotoUrl,
            role: isAdmin ? 'admin' : 'attendee',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          const existingData = userSnap.data() as Record<string, any> | undefined;
          const updatePayload: Record<string, any> = {
            displayName: safeDisplayName,
            photoURL: safePhotoUrl,
            updatedAt: serverTimestamp(),
          };
          if (isAdmin && existingData?.role !== 'admin') {
            updatePayload.role = 'admin';
          }
          tx.update(userRef, updatePayload);
        }
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, userPath);
    }

    return { isAdmin };
  })().finally(() => {
    pendingProfileChecks.delete(uid);
  });

  pendingProfileChecks.set(uid, task);
  return task;
}

// ============================================================================
// Initial Catalog Seed (Idempotent for first-time Firestore setup by Admin)
// ============================================================================

async function commitBatchOps(
  ops: Array<{ type: 'set' | 'delete'; ref: ReturnType<typeof doc>; data?: any }>,
  pathLabel: string
) {
  const CHUNK_SIZE = 400;
  for (let i = 0; i < ops.length; i += CHUNK_SIZE) {
    const batch = writeBatch(db);
    const slice = ops.slice(i, i + CHUNK_SIZE);
    for (const op of slice) {
      if (op.type === 'set') {
        batch.set(op.ref, op.data);
      } else {
        batch.delete(op.ref);
      }
    }
    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, pathLabel);
    }
  }
}

let pendingSeedPromise: Promise<boolean> | null = null;

export async function seedInitialCatalogIfEmpty(defaults: {
  eventInfo: SymposiumInfo;
  sessions: Session[];
  speakers: Speaker[];
  exhibitors: Exhibitor[];
  rooms: Room[];
  participants: Participant[];
  adminUid: string;
}): Promise<boolean> {
  if (pendingSeedPromise) {
    return pendingSeedPromise;
  }

  pendingSeedPromise = (async (): Promise<boolean> => {
    try {
      const eventSnap = await getDoc(doc(db, 'event_info', 'main'));
      if (eventSnap.exists()) {
        return false; // Already seeded
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'event_info/main');
    }

    const ops: Array<{ type: 'set'; ref: ReturnType<typeof doc>; data: any }> = [];

    ops.push({
      type: 'set',
      ref: doc(db, 'event_info', 'main'),
      data: sanitizeEventInfoPayload(defaults.eventInfo, defaults.adminUid),
    });

    for (const s of defaults.sessions) {
      const { docId, data } = sanitizeSessionPayload(s);
      ops.push({ type: 'set', ref: doc(db, 'sessions', docId), data });
    }
    for (const sp of defaults.speakers) {
      const { docId, data } = sanitizeSpeakerPayload(sp);
      ops.push({ type: 'set', ref: doc(db, 'speakers', docId), data });
    }
    for (const ex of defaults.exhibitors) {
      const { docId, data } = sanitizeExhibitorPayload(ex);
      ops.push({ type: 'set', ref: doc(db, 'exhibitors', docId), data });
    }
    for (const r of defaults.rooms) {
      const { docId, data } = sanitizeRoomPayload(r);
      ops.push({ type: 'set', ref: doc(db, 'rooms', docId), data });
    }
    for (const p of defaults.participants) {
      const { docId, data } = sanitizeParticipantPayload(p);
      ops.push({ type: 'set', ref: doc(db, 'participants', docId), data });
      for (const dirEntry of buildRegistrantDirectoryEntries(p)) {
        ops.push({
          type: 'set',
          ref: doc(db, 'registrant_directory', dirEntry.lookupId),
          data: dirEntry.data,
        });
      }
    }

    await commitBatchOps(ops, 'catalog_seed');
    return true;
  })().finally(() => {
    pendingSeedPromise = null;
  });

  return pendingSeedPromise;
}

// ============================================================================
// Public Real-Time Subscriptions (All Attendees)
// ============================================================================

export function subscribePublicCatalog(callbacks: {
  onEventInfo: (info: SymposiumInfo) => void;
  onWorkshopCardTemplates?: (templates: Record<string, WorkshopIdentityCardTemplate>) => void;
  onSessions: (sessions: Session[]) => void;
  onSpeakers: (speakers: Speaker[]) => void;
  onExhibitors: (exhibitors: Exhibitor[]) => void;
  onRooms: (rooms: Room[]) => void;
  onBroadcast: (broadcast: BroadcastNotification | null) => void;
}): () => void {
  const unsubscribers: Unsubscribe[] = [];

  unsubscribers.push(
    onSnapshot(
      query(collection(db, 'event_info'), where('isPublished', '==', true)),
      (snapshot) => {
        if (!snapshot.empty) {
          const mainDoc = snapshot.docs.find((d) => d.id === 'main') || snapshot.docs[0];
          const docData = mainDoc.data() as any;
          const { isPublished, updatedAt, updatedBy, ...rest } = docData;
          callbacks.onEventInfo(rest as SymposiumInfo);
        }
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'event_info')
    )
  );

  if (callbacks.onWorkshopCardTemplates) {
    unsubscribers.push(
      onSnapshot(
        query(collection(db, 'identity_card_templates'), where('isPublished', '==', true)),
        (snapshot) => {
          const templatesMap: Record<string, WorkshopIdentityCardTemplate> = {};
          snapshot.docs.forEach((d) => {
            const raw = d.data() as any;
            const key = typeof raw.workshopKey === 'string' && raw.workshopKey ? raw.workshopKey : d.id;
            if (typeof raw.templateUrl === 'string' && raw.templateUrl.trim()) {
              templatesMap[key] = {
                workshopKey: key,
                workshopLabel: typeof raw.workshopLabel === 'string' ? raw.workshopLabel : key,
                templateUrl: raw.templateUrl,
                ...(raw.layout ? { layout: normalizeIdentityCardLayout(raw.layout) } : {}),
              };
            }
          });
          callbacks.onWorkshopCardTemplates?.(templatesMap);
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'identity_card_templates')
      )
    );
  }

  unsubscribers.push(
    onSnapshot(
      query(collection(db, 'sessions'), where('isPublished', '==', true)),
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => {
            const { isPublished, updatedAt, ...rest } = d.data() as any;
            return rest as Session;
          });
          callbacks.onSessions(list);
        }
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'sessions')
    )
  );

  unsubscribers.push(
    onSnapshot(
      query(collection(db, 'speakers'), where('isPublished', '==', true)),
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => {
            const { isPublished, updatedAt, ...rest } = d.data() as any;
            return rest as Speaker;
          });
          callbacks.onSpeakers(list);
        }
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'speakers')
    )
  );

  unsubscribers.push(
    onSnapshot(
      query(collection(db, 'exhibitors'), where('isPublished', '==', true)),
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => {
            const { isPublished, updatedAt, ...rest } = d.data() as any;
            return rest as Exhibitor;
          });
          callbacks.onExhibitors(list);
        }
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'exhibitors')
    )
  );

  unsubscribers.push(
    onSnapshot(
      query(collection(db, 'rooms'), where('isPublished', '==', true)),
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => {
            const { isPublished, updatedAt, ...rest } = d.data() as any;
            return rest as Room;
          });
          callbacks.onRooms(list);
        }
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'rooms')
    )
  );

  unsubscribers.push(
    onSnapshot(
      query(collection(db, 'broadcasts'), where('isPublished', '==', true)),
      (snapshot) => {
        if (snapshot.empty) {
          callbacks.onBroadcast(null);
          return;
        }
        const activeDocs = snapshot.docs
          .map((d) => {
            const { isPublished, updatedAt, ...rest } = d.data() as any;
            return rest as BroadcastNotification;
          })
          .filter((b) => Date.now() - (b.timestamp || 0) < 2 * 3600 * 1000)
          .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        callbacks.onBroadcast(activeDocs[0] || null);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'broadcasts')
    )
  );

  return () => {
    unsubscribers.forEach((unsub) => unsub());
  };
}

// ============================================================================
// Authenticated User Private Data Subscriptions
// ============================================================================

export function subscribeUserPrivateData(
  uid: string,
  email: string,
  isAdmin: boolean,
  callbacks: {
    onBookmarks?: (sessionIds: string[]) => void;
    onAttendances?: (records: AttendanceRecord[]) => void;
    onParticipants: (participants: Participant[]) => void;
  }
): () => void {
  const safeUid = toFirestoreDocId(uid, 'user');
  const cleanEmail = email.trim().toLowerCase();
  const unsubscribers: Unsubscribe[] = [];

  if (callbacks.onBookmarks) {
    unsubscribers.push(
      onSnapshot(
        query(collection(db, 'users', safeUid, 'bookmarks'), where('userId', '==', safeUid)),
        (snapshot) => {
          const ids = snapshot.docs.map((d) => (d.data().sessionId as string) || d.id);
          callbacks.onBookmarks?.(ids);
        },
        (error) => handleFirestoreError(error, OperationType.LIST, `users/${safeUid}/bookmarks`)
      )
    );
  }

  if (callbacks.onAttendances) {
    unsubscribers.push(
      onSnapshot(
        query(collection(db, 'users', safeUid, 'attendances'), where('userId', '==', safeUid)),
        (snapshot) => {
          const records = snapshot.docs.map((d) => {
            const { userId, createdAt, ...rest } = d.data() as any;
            return rest as AttendanceRecord;
          });
          callbacks.onAttendances?.(records);
        },
        (error) => handleFirestoreError(error, OperationType.LIST, `users/${safeUid}/attendances`)
      )
    );
  }

  if (isAdmin) {
    unsubscribers.push(
      onSnapshot(
        collection(db, 'participants'),
        (snapshot) => {
          const list = snapshot.docs.map((d) => {
            const { createdAt, updatedAt, userId, ...rest } = d.data() as any;
            return rest as Participant;
          });
          callbacks.onParticipants(list);
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'participants')
      )
    );
  } else if (cleanEmail) {
    unsubscribers.push(
      onSnapshot(
        query(collection(db, 'participants'), where('email', '==', cleanEmail)),
        (snapshot) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map((d) => {
              const { createdAt, updatedAt, userId, ...rest } = d.data() as any;
              return rest as Participant;
            });
            callbacks.onParticipants(list);
          }
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'participants')
      )
    );
  }

  return () => {
    unsubscribers.forEach((unsub) => unsub());
  };
}

// ============================================================================
// Admin Catalog Mutations
// ============================================================================

export async function saveEventInfoToFirestore(info: SymposiumInfo, adminUid?: string): Promise<void> {
  try {
    await setDoc(doc(db, 'event_info', 'main'), sanitizeEventInfoPayload(info, adminUid));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'event_info/main');
  }

  // Sync per-workshop ID card templates in their own documents to avoid the 1 MiB document limit
  if (info.workshopIdentityCardTemplates !== undefined) {
    let existingIds: string[] = [];
    try {
      const snap = await getDocs(collection(db, 'identity_card_templates'));
      existingIds = snap.docs.map((d) => d.id);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'identity_card_templates');
    }

    const activeTemplates = Object.values(info.workshopIdentityCardTemplates || {}).filter(
      (tpl) => Boolean(tpl && tpl.templateUrl && tpl.templateUrl.trim())
    );
    const targetIds = new Set<string>();

    for (const tpl of activeTemplates) {
      const { docId, data } = sanitizeIdentityCardTemplatePayload(tpl, adminUid);
      targetIds.add(docId);
      try {
        await setDoc(doc(db, 'identity_card_templates', docId), data);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `identity_card_templates/${docId}`);
      }
    }

    for (const oldId of existingIds) {
      if (!targetIds.has(oldId)) {
        try {
          await deleteDoc(doc(db, 'identity_card_templates', oldId));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `identity_card_templates/${oldId}`);
        }
      }
    }
  }
}

async function syncCollectionDocs<T>(
  collectionName: string,
  items: T[],
  serializer: (item: T) => { docId: string; data: Record<string, any> }
): Promise<void> {
  let existingIds: string[] = [];
  try {
    const snap = await getDocs(collection(db, collectionName));
    existingIds = snap.docs.map((d) => d.id);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionName);
  }

  const targetIds = new Set<string>();
  const ops: Array<{ type: 'set' | 'delete'; ref: ReturnType<typeof doc>; data?: any }> = [];

  for (const item of items) {
    const { docId, data } = serializer(item);
    targetIds.add(docId);
    ops.push({ type: 'set', ref: doc(db, collectionName, docId), data });
  }

  for (const oldId of existingIds) {
    if (!targetIds.has(oldId)) {
      ops.push({ type: 'delete', ref: doc(db, collectionName, oldId) });
    }
  }

  await commitBatchOps(ops, collectionName);
}

export async function syncSessionsToFirestore(sessions: Session[]): Promise<void> {
  return syncCollectionDocs('sessions', sessions, sanitizeSessionPayload);
}

export async function syncSpeakersToFirestore(speakers: Speaker[]): Promise<void> {
  return syncCollectionDocs('speakers', speakers, sanitizeSpeakerPayload);
}

export async function syncExhibitorsToFirestore(exhibitors: Exhibitor[]): Promise<void> {
  return syncCollectionDocs('exhibitors', exhibitors, sanitizeExhibitorPayload);
}

export async function syncRoomsToFirestore(rooms: Room[]): Promise<void> {
  return syncCollectionDocs('rooms', rooms, sanitizeRoomPayload);
}

export async function saveBroadcastToFirestore(broadcast: BroadcastNotification): Promise<void> {
  try {
    await setDoc(doc(db, 'broadcasts', 'active'), sanitizeBroadcastPayload(broadcast).data);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'broadcasts/active');
  }
}

export async function clearBroadcastInFirestore(): Promise<void> {
  try {
    await deleteDoc(doc(db, 'broadcasts', 'active'));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'broadcasts/active');
  }
}

export async function syncParticipantsToFirestore(participants: Participant[]): Promise<void> {
  let existingDocsMap = new Map<string, Timestamp>();
  let existingIds: string[] = [];
  try {
    const snap = await getDocs(collection(db, 'participants'));
    existingIds = snap.docs.map((d) => {
      const createdAt = d.data()?.createdAt as Timestamp | undefined;
      if (createdAt) existingDocsMap.set(d.id, createdAt);
      return d.id;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'participants');
  }

  const targetIds = new Set<string>();
  const ops: Array<{ type: 'set' | 'delete'; ref: ReturnType<typeof doc>; data?: any }> = [];

  for (const p of participants) {
    const docId = toFirestoreDocId(p.id || p.email, 'part');
    targetIds.add(docId);
    const { data } = sanitizeParticipantPayload(p, existingDocsMap.get(docId) || null);
    ops.push({ type: 'set', ref: doc(db, 'participants', docId), data });
  }

  for (const oldId of existingIds) {
    if (!targetIds.has(oldId)) {
      ops.push({ type: 'delete', ref: doc(db, 'participants', oldId) });
    }
  }

  await commitBatchOps(ops, 'participants');

  // Sync non-PII single-document lookup directory keyed by Id_registrant
  try {
    const existingDirSnap = await getDocs(collection(db, 'registrant_directory'));
    const existingDirIds = existingDirSnap.docs.map((d) => d.id);
    const targetDirIds = new Set<string>();
    const dirOps: Array<{ type: 'set' | 'delete'; ref: ReturnType<typeof doc>; data?: any }> = [];

    for (const p of participants) {
      for (const dirEntry of buildRegistrantDirectoryEntries(p)) {
        if (!targetDirIds.has(dirEntry.lookupId)) {
          targetDirIds.add(dirEntry.lookupId);
          dirOps.push({
            type: 'set',
            ref: doc(db, 'registrant_directory', dirEntry.lookupId),
            data: dirEntry.data,
          });
        }
      }
    }

    for (const oldDirId of existingDirIds) {
      if (!targetDirIds.has(oldDirId)) {
        dirOps.push({ type: 'delete', ref: doc(db, 'registrant_directory', oldDirId) });
      }
    }

    if (dirOps.length > 0) {
      await commitBatchOps(dirOps, 'registrant_directory');
    }
  } catch (error) {
    console.warn('Registrant directory sync skipped or failed:', error);
  }
}

export async function ensureRegistrantDirectorySynced(
  participants: Participant[]
): Promise<number> {
  const existingDirSnap = await getDocs(collection(db, 'registrant_directory'));
  const existingDirMap = new Map<string, Record<string, any>>();
  for (const d of existingDirSnap.docs) {
    existingDirMap.set(d.id, d.data() as Record<string, any>);
  }

  const targetDirIds = new Set<string>();
  const dirOps: Array<{ type: 'set' | 'delete'; ref: ReturnType<typeof doc>; data?: any }> = [];

  for (const p of participants) {
    for (const dirEntry of buildRegistrantDirectoryEntries(p)) {
      if (targetDirIds.has(dirEntry.lookupId)) continue;
      targetDirIds.add(dirEntry.lookupId);

      const prev = existingDirMap.get(dirEntry.lookupId);
      const needsWrite =
        !prev ||
        prev.idRegistrant !== dirEntry.data.idRegistrant ||
        prev.name !== dirEntry.data.name ||
        prev.title !== dirEntry.data.title ||
        prev.institution !== dirEntry.data.institution ||
        prev.role !== dirEntry.data.role ||
        prev.ticketType !== dirEntry.data.ticketType ||
        prev.badgeId !== dirEntry.data.badgeId ||
        prev.isActive !== true;

      if (needsWrite) {
        dirOps.push({
          type: 'set',
          ref: doc(db, 'registrant_directory', dirEntry.lookupId),
          data: dirEntry.data,
        });
      }
    }
  }

  for (const oldDirId of existingDirMap.keys()) {
    if (!targetDirIds.has(oldDirId)) {
      dirOps.push({ type: 'delete', ref: doc(db, 'registrant_directory', oldDirId) });
    }
  }

  if (dirOps.length > 0) {
    await commitBatchOps(dirOps, 'registrant_directory');
  }
  return dirOps.length;
}

export async function lookupParticipantByIdRegistrantInFirestore(
  rawId: string
): Promise<Participant | null> {
  const cleaned = (rawId || '').trim();
  if (!cleaned) {
    console.warn('[lookupParticipantByIdRegistrantInFirestore] Empty rawId passed');
    return null;
  }

  const candidates = Array.from(
    new Set([
      toFirestoreDocId(cleaned.toUpperCase(), 'reg'),
      toFirestoreDocId(cleaned, 'reg'),
      toFirestoreDocId(cleaned.toLowerCase(), 'reg'),
    ])
  );

  console.log('[lookupParticipantByIdRegistrantInFirestore] Searching for ID:', cleaned, 'Candidates:', candidates);

  for (const lookupId of candidates) {
    try {
      const docRef = doc(db, 'registrant_directory', lookupId);
      const snap = await getDoc(docRef);
      console.log(`[lookupParticipantByIdRegistrantInFirestore] Doc path 'registrant_directory/${lookupId}' exists:`, snap.exists());
      if (snap.exists()) {
        const d = snap.data() as Record<string, any>;
        console.log('[lookupParticipantByIdRegistrantInFirestore] Retrieved doc data:', d);
        if (d.isActive !== false) {
          return {
            id: `reg_${lookupId}`,
            idRegistrant: String(d.idRegistrant || cleaned),
            email: '',
            name: String(d.name || 'Peserta'),
            title: String(d.title || ''),
            institution: String(d.institution || 'RS / Faskes Peserta'),
            role: String(d.role || 'Peserta'),
            ticketType: String(d.ticketType || 'Simposium Full Pass'),
            badgeId: String(d.badgeId || d.idRegistrant || cleaned),
          };
        } else {
          console.warn('[lookupParticipantByIdRegistrantInFirestore] Record is marked isActive: false', d);
        }
      }
    } catch (err) {
      console.error(`[lookupParticipantByIdRegistrantInFirestore] Error reading doc '${lookupId}':`, err);
    }
  }

  console.warn('[lookupParticipantByIdRegistrantInFirestore] No matching registrant_directory doc found for:', cleaned);
  return null;
}

export function subscribeParticipantByIdRegistrantInFirestore(
  rawId: string,
  onUpdate: (participant: Participant) => void
): Unsubscribe {
  const cleaned = (rawId || '').trim();
  if (!cleaned) return () => {};

  const primaryLookupId = toFirestoreDocId(cleaned.toUpperCase(), 'reg');
  return onSnapshot(
    doc(db, 'registrant_directory', primaryLookupId),
    (snap) => {
      if (snap.exists()) {
        const d = snap.data() as Record<string, any>;
        if (d.isActive !== false) {
          onUpdate({
            id: `reg_${primaryLookupId}`,
            idRegistrant: String(d.idRegistrant || cleaned),
            email: '',
            name: String(d.name || 'Peserta'),
            title: String(d.title || ''),
            institution: String(d.institution || 'RS / Faskes Peserta'),
            role: String(d.role || 'Peserta'),
            ticketType: String(d.ticketType || 'Simposium Full Pass'),
            badgeId: String(d.badgeId || d.idRegistrant || cleaned),
          });
        }
      }
    },
    () => {
      // Gracefully ignore permission/offline errors if record is local-only or offline
    }
  );
}

export async function lookupOwnParticipantByEmailInFirestore(
  email: string
): Promise<Participant | null> {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) return null;

  try {
    const snap = await getDocs(
      query(collection(db, 'participants'), where('email', '==', cleanEmail))
    );
    if (!snap.empty) {
      const { createdAt, updatedAt, userId, ...rest } = snap.docs[0].data() as any;
      return rest as Participant;
    }
  } catch {
    // Ignore permission or offline errors
  }
  return null;
}

export async function saveOwnParticipantToFirestore(
  participant: Participant,
  uid: string
): Promise<void> {
  const safeUid = toFirestoreDocId(uid, 'user');
  const docId = toFirestoreDocId(participant.id || participant.email, 'part');
  const docRef = doc(db, 'participants', docId);
  try {
    const existingSnap = await getDoc(docRef);
    const existingCreatedAt = existingSnap.exists()
      ? (existingSnap.data()?.createdAt as Timestamp | undefined)
      : undefined;
    const { data } = sanitizeParticipantPayload(participant, existingCreatedAt || null, safeUid);
    await setDoc(docRef, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `participants/${docId}`);
  }
}

// ============================================================================
// User Bookmarks & Attendance Mutations
// ============================================================================

export async function toggleBookmarkInFirestore(
  uid: string,
  sessionId: string,
  shouldBookmark: boolean
): Promise<void> {
  const safeUid = toFirestoreDocId(uid, 'user');
  const safeSessionId = toFirestoreDocId(sessionId, 'session');
  const path = `users/${safeUid}/bookmarks/${safeSessionId}`;
  const ref = doc(db, 'users', safeUid, 'bookmarks', safeSessionId);
  try {
    if (shouldBookmark) {
      await setDoc(ref, {
        sessionId: safeSessionId,
        userId: safeUid,
        createdAt: serverTimestamp(),
      });
    } else {
      await deleteDoc(ref);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function clearBookmarksInFirestore(uid: string, sessionIds: string[]): Promise<void> {
  const safeUid = toFirestoreDocId(uid, 'user');
  const ops = sessionIds.map((id) => ({
    type: 'delete' as const,
    ref: doc(db, 'users', safeUid, 'bookmarks', toFirestoreDocId(id, 'session')),
  }));
  await commitBatchOps(ops, `users/${safeUid}/bookmarks`);
}

export async function saveAttendanceToFirestore(
  uid: string,
  record: AttendanceRecord
): Promise<void> {
  const safeUid = toFirestoreDocId(uid, 'user');
  const safeAttId = toFirestoreDocId(record.id || record.sessionId, 'att');
  const safeSessionId = toFirestoreDocId(record.sessionId, 'session');
  const path = `users/${safeUid}/attendances/${safeAttId}`;
  try {
    await setDoc(doc(db, 'users', safeUid, 'attendances', safeAttId), {
      id: safeAttId,
      userId: safeUid,
      sessionId: safeSessionId,
      sessionTitle: clampStr(record.sessionTitle, 300, 'Sesi Simposium'),
      room: clampStr(record.room, 120, 'Main Hall'),
      timestamp: clampStr(record.timestamp, 60, new Date().toLocaleTimeString('id-ID')),
      skpPoints:
        typeof record.skpPoints === 'number' && Number.isFinite(record.skpPoints)
          ? Math.max(0, Math.min(50, record.skpPoints))
          : 1,
      participantName: clampStr(record.participantName, 180, 'Peserta'),
      badgeId: clampStr(record.badgeId, 80, 'ID-SIMP-2026'),
      day: clampStr(record.day, 80, 'Hari I'),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// ============================================================================
// Live Session Chat & Q&A Real-Time Sync
// ============================================================================

export function subscribeSessionChatFirestore(
  sessionId: string,
  currentUid: string | null,
  onMessages: (messages: ChatMessage[]) => void
): Unsubscribe {
  const safeSessionId = toFirestoreDocId(sessionId, 'session');
  const chatPath = `sessions/${safeSessionId}/chat_messages`;
  return onSnapshot(
    query(collection(db, 'sessions', safeSessionId, 'chat_messages'), where('isVisible', '==', true)),
    (snapshot) => {
      const msgs = snapshot.docs.map((d) => {
        const raw = d.data() as any;
        const upvotedBy: string[] = Array.isArray(raw.upvotedBy) ? raw.upvotedBy : [];
        return {
          id: raw.id || d.id,
          sessionId: raw.sessionId || safeSessionId,
          senderName: raw.senderName || 'Peserta',
          senderRole: raw.senderRole || 'Peserta',
          senderInstitution: raw.senderInstitution || '',
          message: raw.message || '',
          timestamp: raw.timestamp || '',
          isQuestion: Boolean(raw.isQuestion),
          targetSpeaker: raw.targetSpeaker,
          upvotes: typeof raw.upvotes === 'number' ? raw.upvotes : upvotedBy.length,
          hasUpvoted: currentUid ? upvotedBy.includes(currentUid) : false,
          isAnswered: Boolean(raw.isAnswered),
          answer: raw.answer,
          replies: Array.isArray(raw.replies) ? raw.replies : [],
          tag: raw.tag,
        } as ChatMessage;
      });
      onMessages(msgs);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, chatPath)
  );
}

export async function createSessionChatMessageFirestore(
  sessionId: string,
  authorUid: string,
  message: ChatMessage
): Promise<void> {
  const safeSessionId = toFirestoreDocId(sessionId, 'session');
  const safeMsgId = toFirestoreDocId(message.id, 'chat');
  const safeUid = toFirestoreDocId(authorUid, 'user');
  const path = `sessions/${safeSessionId}/chat_messages/${safeMsgId}`;
  const senderRole = VALID_CHAT_ROLES.includes(message.senderRole as any)
    ? message.senderRole
    : 'Peserta';

  try {
    await setDoc(doc(db, 'sessions', safeSessionId, 'chat_messages', safeMsgId), {
      id: safeMsgId,
      sessionId: safeSessionId,
      authorUid: safeUid,
      senderName: clampStr(message.senderName, 150, 'Peserta'),
      senderRole,
      senderInstitution: clampStr(message.senderInstitution, 200),
      message: clampStr(message.message, 2000),
      timestamp: clampStr(message.timestamp, 60, 'Baru saja'),
      isQuestion: Boolean(message.isQuestion),
      targetSpeaker: clampStr(message.targetSpeaker, 200),
      upvotes: 1,
      upvotedBy: [safeUid],
      isAnswered: false,
      replies: [],
      tag: clampStr(message.tag, 80),
      isVisible: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function toggleChatUpvoteFirestore(
  sessionId: string,
  messageId: string,
  uid: string
): Promise<void> {
  const safeSessionId = toFirestoreDocId(sessionId, 'session');
  const safeMsgId = toFirestoreDocId(messageId, 'chat');
  const safeUid = toFirestoreDocId(uid, 'user');
  const path = `sessions/${safeSessionId}/chat_messages/${safeMsgId}`;
  const ref = doc(db, 'sessions', safeSessionId, 'chat_messages', safeMsgId);

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const raw = snap.data() as any;
    const existingUpvotedBy: string[] = Array.isArray(raw.upvotedBy) ? raw.upvotedBy : [];
    const alreadyUpvoted = existingUpvotedBy.includes(safeUid);
    const nextUpvotedBy = alreadyUpvoted
      ? existingUpvotedBy.filter((id) => id !== safeUid)
      : [...existingUpvotedBy, safeUid].slice(0, 500);
    const nextUpvotes = alreadyUpvoted
      ? Math.max(0, (raw.upvotes || 1) - 1)
      : (raw.upvotes || 0) + 1;

    await updateDoc(ref, {
      upvotes: nextUpvotes,
      upvotedBy: nextUpvotedBy,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function replyToChatMessageFirestore(
  sessionId: string,
  messageId: string,
  replyText: string,
  senderName: string,
  senderRole: string
): Promise<void> {
  const safeSessionId = toFirestoreDocId(sessionId, 'session');
  const safeMsgId = toFirestoreDocId(messageId, 'chat');
  const path = `sessions/${safeSessionId}/chat_messages/${safeMsgId}`;
  const ref = doc(db, 'sessions', safeSessionId, 'chat_messages', safeMsgId);

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const raw = snap.data() as any;
    const existingReplies = Array.isArray(raw.replies) ? raw.replies : [];
    const newReply = {
      id: `reply_${Date.now()}`,
      senderName: clampStr(senderName, 150, 'Peserta'),
      senderRole: clampStr(senderRole, 80, 'Peserta'),
      message: clampStr(replyText, 1000),
      timestamp:
        new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
    };
    const nextReplies = [...existingReplies, newReply].slice(0, 50);

    await updateDoc(ref, {
      replies: nextReplies,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function answerChatQuestionFirestore(
  sessionId: string,
  messageId: string,
  answerText: string,
  answeredBy: string
): Promise<void> {
  const safeSessionId = toFirestoreDocId(sessionId, 'session');
  const safeMsgId = toFirestoreDocId(messageId, 'chat');
  const path = `sessions/${safeSessionId}/chat_messages/${safeMsgId}`;

  try {
    await updateDoc(doc(db, 'sessions', safeSessionId, 'chat_messages', safeMsgId), {
      isAnswered: true,
      answer: {
        answeredBy: clampStr(answeredBy, 180, 'Narasumber'),
        answerText: clampStr(answerText, 2000),
        timestamp:
          new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      },
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ============================================================================
// Session Presentation PDF Materials (Chunked Firestore Storage)
// ============================================================================

export async function uploadPdfMaterialToFirestore(
  sessionId: string,
  material: PresentationMaterial,
  base64Data: string
): Promise<PresentationMaterial> {
  const safeMatId = toFirestoreDocId(material.id, 'mat');
  const safeSessionId = toFirestoreDocId(sessionId, 'session');
  const chunks = splitBase64IntoChunks(base64Data);

  if (chunks.length > 40) {
    throw new Error('Ukuran file PDF melebihi kapasitas maksimal penyimpanan Cloud.');
  }

  const materialPath = `presentation_materials/${safeMatId}`;
  try {
    await setDoc(doc(db, 'presentation_materials', safeMatId), {
      id: safeMatId,
      sessionId: safeSessionId,
      title: clampStr(material.title, 300, 'Materi Presentasi'),
      fileName: clampStr(material.fileName, 250, 'materi.pdf'),
      fileSize: Math.max(0, Math.min(15728640, Math.round(material.fileSize || 0))),
      mimeType: clampStr(material.mimeType, 100, 'application/pdf'),
      chunkCount: chunks.length,
      externalUrl: clampStr(material.externalUrl, 1000),
      speakerName: clampStr(material.speakerName, 200),
      isPublished: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, materialPath);
  }

  if (chunks.length > 0) {
    const chunkOps = chunks.map((chunkStr, idx) => {
      const chunkId = `chunk_${idx}`;
      return {
        type: 'set' as const,
        ref: doc(db, 'presentation_materials', safeMatId, 'chunks', chunkId),
        data: {
          id: chunkId,
          materialId: safeMatId,
          index: idx,
          data: chunkStr,
          updatedAt: serverTimestamp(),
        },
      };
    });
    await commitBatchOps(chunkOps, `${materialPath}/chunks`);
  }

  return {
    ...material,
    id: safeMatId,
    chunkCount: chunks.length,
  };
}

export async function fetchPdfMaterialBlobFromFirestore(
  materialId: string,
  expectedChunkCount: number,
  fileName = 'materi.pdf',
  mimeType = 'application/pdf'
): Promise<Blob | null> {
  const safeMatId = toFirestoreDocId(materialId, 'mat');
  let chunkCount = expectedChunkCount;

  try {
    const metaSnap = await getDoc(doc(db, 'presentation_materials', safeMatId));
    if (metaSnap.exists()) {
      const meta = metaSnap.data() as Record<string, any>;
      if (typeof meta.chunkCount === 'number' && meta.chunkCount > 0) {
        chunkCount = meta.chunkCount;
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `presentation_materials/${safeMatId}`);
  }

  if (!chunkCount || chunkCount <= 0) {
    return null;
  }

  const indices = Array.from({ length: chunkCount }, (_, i) => i);
  const chunkStrings = await Promise.all(
    indices.map(async (idx) => {
      const chunkId = `chunk_${idx}`;
      const chunkPath = `presentation_materials/${safeMatId}/chunks/${chunkId}`;
      try {
        const snap = await getDoc(doc(db, 'presentation_materials', safeMatId, 'chunks', chunkId));
        if (!snap.exists()) {
          throw new Error(`Bagian file ${chunkId} tidak ditemukan di Cloud.`);
        }
        return (snap.data()?.data as string) || '';
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, chunkPath);
        return '';
      }
    })
  );

  const combinedBase64 = chunkStrings.join('');
  if (!combinedBase64) return null;

  const blob = base64ToPdfBlob(combinedBase64, mimeType);
  await savePdfMaterialLocal({
    id: safeMatId,
    base64Data: combinedBase64,
    fileName,
    fileSize: blob.size,
    mimeType,
    savedAt: new Date().toISOString(),
  });

  return blob;
}

export async function deletePdfMaterialFromFirestore(materialId: string): Promise<void> {
  const safeMatId = toFirestoreDocId(materialId, 'mat');
  const materialPath = `presentation_materials/${safeMatId}`;

  try {
    const chunksSnap = await getDocs(collection(db, 'presentation_materials', safeMatId, 'chunks'));
    const deleteOps = chunksSnap.docs.map((d) => ({
      type: 'delete' as const,
      ref: doc(db, 'presentation_materials', safeMatId, 'chunks', d.id),
    }));
    deleteOps.push({
      type: 'delete' as const,
      ref: doc(db, 'presentation_materials', safeMatId),
    });
    await commitBatchOps(deleteOps, materialPath);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, materialPath);
  }
}

export async function syncLocalPdfMaterialsToFirestore(sessions: Session[]): Promise<void> {
  for (const session of sessions) {
    const materials = session.presentationMaterials || [];
    for (const mat of materials) {
      if (!mat.id || mat.externalUrl || mat.chunkCount <= 0) continue;
      const safeMatId = toFirestoreDocId(mat.id, 'mat');
      try {
        const existingSnap = await getDoc(doc(db, 'presentation_materials', safeMatId));
        if (existingSnap.exists()) continue;
        const localRec = await getPdfMaterialLocal(mat.id);
        if (localRec?.base64Data) {
          await uploadPdfMaterialToFirestore(session.id, mat, localRec.base64Data);
        }
      } catch (err) {
        console.warn('syncLocalPdfMaterialsToFirestore warning:', err);
      }
    }
  }
}

