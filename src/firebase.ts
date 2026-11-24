import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid ?? null,
      email: auth.currentUser?.email ?? null,
      emailVerified: auth.currentUser?.emailVerified ?? null,
      isAnonymous: auth.currentUser?.isAnonymous ?? null,
      tenantId: auth.currentUser?.tenantId ?? null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Normalizes any identifier into a Firestore-safe document ID matching `^[a-zA-Z0-9_-]+$`.
 */
export function toFirestoreDocId(rawId: string, fallbackPrefix = 'doc'): string {
  const cleaned = (rawId || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 128);
  return cleaned || `${fallbackPrefix}_${Date.now()}`;
}

export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export function formatFirebaseAuthError(error: unknown): string | null {
  const code = (error as { code?: string })?.code || '';
  const message = error instanceof Error ? error.message : String(error || '');

  if (
    code === 'auth/popup-closed-by-user' ||
    code === 'auth/cancelled-popup-request' ||
    message.includes('popup-closed-by-user')
  ) {
    return null;
  }

  if (code === 'auth/unauthorized-domain' || message.includes('unauthorized-domain')) {
    const host = typeof window !== 'undefined' ? window.location.hostname : 'domain ini';
    return `Domain "${host}" belum didaftarkan di Firebase Authentication → Settings → Authorized domains (proyek ${firebaseConfig.projectId}).`;
  }

  if (code === 'auth/popup-blocked' || message.includes('popup-blocked')) {
    return 'Popup Login Google diblokir browser. Izinkan pop-up untuk situs ini lalu coba lagi.';
  }

  if (code === 'auth/network-request-failed' || message.includes('network-request-failed')) {
    return 'Koneksi internet gagal menghubungi server Firebase Auth.';
  }

  return message || 'Gagal login dengan Google. Silakan coba kembali.';
}

export async function signOutFirebase(): Promise<void> {
  await signOut(auth);
}

/**
 * Startup connectivity validation against Firestore server.
 */
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration. Firestore client is offline.');
      return false;
    }
    return true;
  }
}

testConnection();
