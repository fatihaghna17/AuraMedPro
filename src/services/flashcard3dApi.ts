// src/services/flashcard3dApi.ts
// Client API untuk sinkronisasi deck & progres Flashcard 3D ke Cloudflare D1/R2.
import type { Flashcard3DDeck, Flashcard3DProgress } from '../types/flashcard3d';

const ENDPOINT = '/api/flashcard3d';

async function parseJsonSafe(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export async function fetchCloudFlashcard3D(params?: {
  angkatan?: string | null;
  prodi?: string | null;
}): Promise<{ decks: Flashcard3DDeck[]; progress: Record<string, Flashcard3DProgress> }> {
  const qs = new URLSearchParams();
  if (params?.angkatan) qs.set('angkatan', params.angkatan);
  if (params?.prodi) qs.set('prodi', params.prodi);
  const url = qs.toString() ? `${ENDPOINT}?${qs.toString()}` : ENDPOINT;

  const res = await fetch(url, { method: 'GET', credentials: 'include' });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(body?.error || `Gagal memuat Flashcard 3D (${res.status})`);
  }
  return {
    decks: Array.isArray(body?.decks) ? body.decks : [],
    progress: body?.progress && typeof body.progress === 'object' ? body.progress : {},
  };
}

export async function saveCloudDeck(deck: Flashcard3DDeck): Promise<Flashcard3DDeck> {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deck }),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(body?.error || `Gagal menyimpan deck ke server (${res.status})`);
  }
  return body.deck as Flashcard3DDeck;
}

export async function saveCloudProgress(deckId: string, progress: Flashcard3DProgress): Promise<void> {
  const res = await fetch(ENDPOINT, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deckId, progress }),
  });
  if (!res.ok) {
    const body = await parseJsonSafe(res);
    throw new Error(body?.error || `Gagal menyimpan progres (${res.status})`);
  }
}

export async function deleteCloudDeck(deckId: string): Promise<void> {
  const res = await fetch(`${ENDPOINT}?id=${encodeURIComponent(deckId)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const body = await parseJsonSafe(res);
    throw new Error(body?.error || `Gagal menghapus deck di server (${res.status})`);
  }
}
