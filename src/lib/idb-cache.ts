// Minimal IndexedDB cache for the last generation result.
// 24-hour expiry — after that the cache is silently discarded.
// Stores the original image blob, result image blob, and metadata so the
// Image to Image page can survive a full page refresh.

const DB_NAME = 'styleforge-cache';
const DB_VERSION = 1;
const STORE = 'generations';
const KEY = 'last';
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CachedGeneration {
  originalBlob: Blob;
  resultBlob: Blob;
  styleId: string;
  styleLabel: string;
  createdAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveLastGeneration(data: CachedGeneration): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(data, KEY);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadLastGeneration(): Promise<CachedGeneration | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(KEY);
    req.onsuccess = () => {
      db.close();
      const data = req.result as CachedGeneration | null;
      if (data && Date.now() - data.createdAt > MAX_AGE_MS) {
        // Expired — silently discard.
        clearLastGeneration();
        resolve(null);
      } else {
        resolve(data ?? null);
      }
    };
    req.onerror = () => reject(tx.error);
  });
}

export async function clearLastGeneration(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(KEY);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => reject(tx.error);
  });
}