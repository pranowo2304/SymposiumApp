// Local IndexedDB storage & binary/base64 helpers for Session Presentation PDFs
// Keeps large PDF payloads out of localStorage (5 MB limit) and Firestore session docs (1 MB limit).

const DB_NAME = 'kivnahk_pdf_materials_db';
const DB_VERSION = 1;
const STORE_NAME = 'materials';

export const MAX_PDF_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB per uploaded PDF
export const PDF_CHUNK_CHAR_SIZE = 400_000; // Safe margin under Firestore 1 MiB document limit

export interface LocalPdfRecord {
  id: string;
  base64Data: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  savedAt: string;
}

export function generateMaterialId(): string {
  const rand = Math.random().toString(36).slice(2, 7).replace(/[^a-zA-Z0-9]/g, 'x');
  return `mat_${Date.now()}_${rand}`;
}

export function formatPdfFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return 'Link Eksternal';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

export async function readPdfFileAsBase64(file: File): Promise<{
  base64Data: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}> {
  const isPdfType =
    file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  if (!isPdfType) {
    throw new Error('Format file harus berupa PDF (.pdf).');
  }
  if (file.size <= 0) {
    throw new Error('File PDF kosong atau tidak valid.');
  }
  if (file.size > MAX_PDF_UPLOAD_BYTES) {
    throw new Error(
      `Ukuran file (${formatPdfFileSize(file.size)}) melebihi batas unggah langsung 10 MB. Gunakan opsi Tautan PDF Eksternal untuk file lebih besar.`
    );
  }

  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  const binaryParts: string[] = [];
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, i + chunkSize);
    binaryParts.push(String.fromCharCode(...slice));
  }
  const base64Data = btoa(binaryParts.join(''));

  return {
    base64Data,
    fileName: file.name,
    fileSize: file.size,
    mimeType: 'application/pdf',
  };
}

export function base64ToPdfBlob(base64Data: string, mimeType = 'application/pdf'): Blob {
  const clean = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
  const binary = atob(clean);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType || 'application/pdf' });
}

export function splitBase64IntoChunks(base64Data: string): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < base64Data.length; i += PDF_CHUNK_CHAR_SIZE) {
    chunks.push(base64Data.slice(i, i + PDF_CHUNK_CHAR_SIZE));
  }
  return chunks;
}

function openPdfDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB tidak tersedia pada browser ini.'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Gagal membuka IndexedDB.'));
  });
}

export async function savePdfMaterialLocal(record: LocalPdfRecord): Promise<void> {
  try {
    const db = await openPdfDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Gagal menyimpan PDF lokal.'));
    });
    db.close();
  } catch (err) {
    console.warn('IndexedDB savePdfMaterialLocal warning:', err);
  }
}

export async function getPdfMaterialLocal(materialId: string): Promise<LocalPdfRecord | null> {
  try {
    const db = await openPdfDb();
    const result = await new Promise<LocalPdfRecord | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(materialId);
      req.onsuccess = () => resolve((req.result as LocalPdfRecord) || null);
      req.onerror = () => reject(req.error || new Error('Gagal membaca PDF lokal.'));
    });
    db.close();
    return result;
  } catch (err) {
    console.warn('IndexedDB getPdfMaterialLocal warning:', err);
    return null;
  }
}

export async function deletePdfMaterialLocal(materialId: string): Promise<void> {
  try {
    const db = await openPdfDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(materialId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Gagal menghapus PDF lokal.'));
    });
    db.close();
  } catch (err) {
    console.warn('IndexedDB deletePdfMaterialLocal warning:', err);
  }
}

export function buildExternalPdfUrls(url: string): { previewUrl: string; downloadUrl: string } {
  const trimmed = url.trim();
  // Convert Google Drive sharing link to embeddable preview and direct download when possible
  const driveMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    const fileId = driveMatch[1];
    return {
      previewUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      downloadUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
    };
  }
  return {
    previewUrl: trimmed,
    downloadUrl: trimmed,
  };
}
