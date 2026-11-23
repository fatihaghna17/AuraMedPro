// src/utils/flashcard3dStorage.ts
// IndexedDB storage untuk deck Flashcard 3D. Progres disimpan terpisah dari deck
// agar menilai kartu tidak perlu menulis ulang deck (yang bisa berisi gambar besar).
import type { Flashcard3DCard, Flashcard3DDeck, Flashcard3DFace, Flashcard3DProgress } from '../types/flashcard3d';

const DB_NAME = 'auramed_flashcard3d';
const DB_VERSION = 1;
const DECKS = 'decks';
const PROGRESS = 'progress';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = window.indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(DECKS)) db.createObjectStore(DECKS, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(PROGRESS)) db.createObjectStore(PROGRESS);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      dbPromise = null;
      reject(req.error);
    };
  });
  return dbPromise;
}

function tx<T>(store: string, mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  return openDB().then(
    (db) =>
      new Promise<T | undefined>((resolve, reject) => {
        const t = db.transaction(store, mode);
        const s = t.objectStore(store);
        const req = run(s);
        let result: T | undefined;
        if (req) req.onsuccess = () => { result = req.result; };
        t.oncomplete = () => resolve(result);
        t.onerror = () => reject(t.error);
        t.onabort = () => reject(t.error);
      })
  );
}

export async function getAllDecks(): Promise<Flashcard3DDeck[]> {
  const decks = (await tx<Flashcard3DDeck[]>(DECKS, 'readonly', (s) => s.getAll())) || [];
  return decks.sort((a, b) => (b.lastOpenedAt || b.updatedAt) - (a.lastOpenedAt || a.updatedAt));
}

export async function putDeck(deck: Flashcard3DDeck): Promise<void> {
  await tx(DECKS, 'readwrite', (s) => s.put(deck));
}

export async function removeDeck(id: string): Promise<void> {
  await tx(DECKS, 'readwrite', (s) => s.delete(id));
  await tx(PROGRESS, 'readwrite', (s) => s.delete(id));
}

export async function getAllProgress(): Promise<Record<string, Flashcard3DProgress>> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const out: Record<string, Flashcard3DProgress> = {};
    const t = db.transaction(PROGRESS, 'readonly');
    const req = t.objectStore(PROGRESS).openCursor();
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        out[String(cursor.key)] = cursor.value as Flashcard3DProgress;
        cursor.continue();
      }
    };
    t.oncomplete = () => resolve(out);
    t.onerror = () => reject(t.error);
  });
}

export async function putProgress(deckId: string, progress: Flashcard3DProgress): Promise<void> {
  await tx(PROGRESS, 'readwrite', (s) => s.put(progress, deckId));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function makeId(prefix = 'fc'): string {
  const rand = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
}

function toFace(v: unknown): Flashcard3DFace {
  if (typeof v === 'string') return { text: v.trim(), image: null };
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    const text = [o.text, o.teks, o.content].find((x) => typeof x === 'string') as string | undefined;
    const image = [o.image, o.gambar, o.img, o.imageUrl].find((x) => typeof x === 'string') as string | undefined;
    return { text: (text || '').trim(), image: image?.trim() || null };
  }
  return { text: '', image: null };
}

function toCard(raw: unknown): Flashcard3DCard | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const frontRaw = o.front ?? o.depan ?? o.question ?? o.pertanyaan ?? o.term;
  const backRaw = o.back ?? o.belakang ?? o.answer ?? o.jawaban ?? o.keterangan ?? o.definition;
  const front = toFace(frontRaw);
  const back = toFace(backRaw);
  if (typeof o.frontImage === 'string') front.image = o.frontImage;
  if (typeof o.backImage === 'string') back.image = o.backImage;
  if (!front.text && !front.image) return null;
  if (!back.text && !back.image) return null;
  const tags = Array.isArray(o.tags) ? o.tags.filter((t): t is string => typeof t === 'string') : undefined;
  return { id: makeId('c'), front, back, tags };
}

/**
 * Parse JSON Flashcard 3D. Menerima:
 *  - { title, cards: [...] }
 *  - [ { title, cards }, ... ]  (beberapa deck)
 *  - [ { front, back }, ... ]   (satu deck tanpa judul)
 * Kartu memakai front/back (string atau { text, image }).
 */
export function parseDecksFromJson(input: string, fallbackTitle = 'Deck tanpa judul'): Flashcard3DDeck[] {
  let data: unknown;
  try {
    data = JSON.parse(input);
  } catch {
    throw new Error('JSON tidak valid. Periksa tanda kurung dan koma.');
  }

  const now = Date.now();
  const buildDeck = (title: string, rawCards: unknown[]): Flashcard3DDeck | null => {
    const cards = rawCards.map(toCard).filter((c): c is Flashcard3DCard => !!c);
    if (!cards.length) return null;
    return { id: makeId('d'), title: title.trim() || fallbackTitle, cards, createdAt: now, updatedAt: now, lastOpenedAt: null };
  };

  const fromObj = (o: Record<string, unknown>): Flashcard3DDeck | null => {
    const cards = (o.cards ?? o.kartu ?? o.flashcards) as unknown;
    if (!Array.isArray(cards)) return null;
    const title = (o.title ?? o.judul ?? o.name ?? fallbackTitle) as string;
    return buildDeck(String(title), cards);
  };

  let decks: (Flashcard3DDeck | null)[] = [];
  if (Array.isArray(data)) {
    const looksLikeDecks = data.some((d) => d && typeof d === 'object' && Array.isArray((d as any).cards ?? (d as any).kartu));
    decks = looksLikeDecks ? data.map((d) => fromObj(d as Record<string, unknown>)) : [buildDeck(fallbackTitle, data)];
  } else if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>;
    if (Array.isArray(o.decks)) decks = o.decks.map((d) => fromObj(d as Record<string, unknown>));
    else decks = [fromObj(o)];
  }

  const valid = decks.filter((d): d is Flashcard3DDeck => !!d);
  if (!valid.length) {
    throw new Error('Tidak ada kartu valid. Setiap kartu butuh "front" dan "back" (teks atau gambar).');
  }
  return valid;
}

/** Kompres gambar dari perangkat menjadi data URL webp (sisi terpanjang maks 1280px). */
export async function compressImageFile(file: File, maxSide = 1280, quality = 0.82): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('File bukan gambar.');
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Gambar tidak bisa dibaca.'));
      el.src = url;
    });
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Browser tidak mendukung kompresi gambar.');
    ctx.drawImage(img, 0, 0, w, h);
    const webp = canvas.toDataURL('image/webp', quality);
    return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}
