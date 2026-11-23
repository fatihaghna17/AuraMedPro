// src/hooks/useFlashcardDecks.ts
// Sinkronisasi offline-first: cache cepat di IndexedDB + cloud D1/R2 untuk publikasi admin
// dan sinkronisasi lintas perangkat (deck & progres hafalan per user).
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Flashcard3DDeck, Flashcard3DProgress } from '../types/flashcard3d';
import {
  getAllDecks,
  getAllProgress,
  parseDecksFromJson,
  putDeck,
  putProgress,
  removeDeck,
} from '../utils/flashcard3dStorage';
import {
  deleteCloudDeck,
  fetchCloudFlashcard3D,
  saveCloudDeck,
  saveCloudProgress,
} from '../services/flashcard3dApi';

export interface FlashcardDecksOptions {
  userId?: string | null;
  isAdmin?: boolean;
  isGuest?: boolean;
  userAngkatan?: string | null;
  userProdi?: string | null;
}

export interface PublishOptions {
  isPublic?: boolean;
  angkatan?: string;
  prodi?: string;
}

function progressStorageKey(userId: string | null | undefined, deckId: string): string {
  return userId ? `${userId}::${deckId}` : deckId;
}

export function useFlashcardDecks(opts: FlashcardDecksOptions = {}) {
  const { userId = null, isAdmin = false, isGuest = false, userAngkatan = null, userProdi = null } = opts;

  const [decks, setDecks] = useState<Flashcard3DDeck[]>([]);
  const [progress, setProgress] = useState<Record<string, Flashcard3DProgress>>({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const progressTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const sortDecks = (list: Flashcard3DDeck[]) =>
    [...list].sort((a, b) => {
      // Deck publik terbaru atau yang terakhir dibuka naik ke atas
      const timeA = a.lastOpenedAt || a.updatedAt;
      const timeB = b.lastOpenedAt || b.updatedAt;
      return timeB - timeA;
    });

  const filterVisibleLocal = useCallback(
    (localDecks: Flashcard3DDeck[]) =>
      localDecks.filter((d) => {
        if (d.isPublic) return true;
        if (!d.userId) return true; // Deck lokal lama (sebelum fitur sync) tetap terlihat
        return !userId || d.userId === userId;
      }),
    [userId]
  );

  const extractUserProgress = useCallback(
    (raw: Record<string, Flashcard3DProgress>) => {
      const out: Record<string, Flashcard3DProgress> = {};
      const prefix = userId ? `${userId}::` : null;
      for (const [k, v] of Object.entries(raw)) {
        if (prefix && k.startsWith(prefix)) {
          out[k.slice(prefix.length)] = v;
        } else if (!k.includes('::')) {
          // Progres lama sebelum namespacing: pakai hanya jika belum ada versi scoped
          if (!out[k]) out[k] = v;
        }
      }
      return out;
    },
    [userId]
  );

  const syncFromCloud = useCallback(async () => {
    setSyncing(true);
    try {
      const [localDecks, localProgRaw] = await Promise.all([getAllDecks(), getAllProgress()]);
      const localMap = new Map(localDecks.map((d) => [d.id, d]));

      const cloud = await fetchCloudFlashcard3D({
        angkatan: userAngkatan,
        prodi: userProdi,
      });

      const cloudIds = new Set(cloud.decks.map((d) => d.id));
      const mergedCloud: Flashcard3DDeck[] = cloud.decks.map((cd) => {
        const prevLocal = localMap.get(cd.id);
        return {
          ...cd,
          synced: true,
          lastOpenedAt: prevLocal?.lastOpenedAt ?? cd.lastOpenedAt ?? null,
        };
      });

      // Simpan salinan deck cloud di IndexedDB untuk cache offline cepat
      for (const d of mergedCloud) {
        putDeck(d).catch(() => {});
      }

      // Pertahankan deck lokal yang memang belum tersinkron (synced !== true) agar tidak hilang
      const unsyncedLocal = filterVisibleLocal(localDecks).filter(
        (d) => !d.synced && !cloudIds.has(d.id)
      );

      // Bersihkan deck cache lama yang sudah dihapus di server
      for (const d of localDecks) {
        if (d.synced && !cloudIds.has(d.id)) {
          // Hanya hapus dari cache jika milik user ini atau publik (jangan hapus cache akun lain bila offline)
          if (d.isPublic || (userId && d.userId === userId)) {
            removeDeck(d.id).catch(() => {});
          }
        }
      }

      setDecks(sortDecks([...mergedCloud, ...unsyncedLocal]));

      // Gabungkan progres lokal & cloud (cloud menimpa jika tersedia)
      const localProg = extractUserProgress(localProgRaw);
      const mergedProg: Record<string, Flashcard3DProgress> = { ...localProg };
      for (const [deckId, prog] of Object.entries(cloud.progress)) {
        mergedProg[deckId] = prog;
        putProgress(progressStorageKey(userId, deckId), prog).catch(() => {});
      }
      setProgress(mergedProg);
      setError(null);
    } catch {
      // Offline / dev tanpa worker: tetap tampilkan data lokal tanpa memblokir
    } finally {
      setSyncing(false);
    }
  }, [userId, userAngkatan, userProdi, filterVisibleLocal, extractUserProgress]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([getAllDecks(), getAllProgress()])
      .then(([d, p]) => {
        if (!alive) return;
        setDecks(sortDecks(filterVisibleLocal(d)));
        setProgress(extractUserProgress(p));
      })
      .catch(() => alive && setError('Penyimpanan lokal tidak bisa dibuka. Coba muat ulang halaman.'))
      .finally(() => {
        if (!alive) return;
        setLoading(false);
        syncFromCloud();
      });
    return () => {
      alive = false;
      Object.values(progressTimers.current).forEach(clearTimeout);
    };
  }, [userId, filterVisibleLocal, extractUserProgress, syncFromCloud]);

  const canEditDeck = useCallback(
    (deck: Flashcard3DDeck): boolean => {
      if (isAdmin) return true;
      if (!deck.synced) return true; // Deck lokal milik browser ini
      if (deck.isPublic) return false;
      return !!userId && deck.userId === userId;
    },
    [isAdmin, userId]
  );

  const saveDeck = useCallback(
    async (deck: Flashcard3DDeck): Promise<{ deck: Flashcard3DDeck; synced: boolean; syncError?: string }> => {
      const prepared: Flashcard3DDeck = {
        ...deck,
        userId: deck.userId || userId || undefined,
        isPublic: isAdmin ? Boolean(deck.isPublic) : false,
        angkatan: isAdmin && deck.isPublic ? deck.angkatan || 'all' : 'all',
        prodi: isAdmin && deck.isPublic ? deck.prodi || 'all' : 'all',
        updatedAt: Date.now(),
      };

      // Simpan lokal dulu agar instan
      await putDeck(prepared);
      let finalDeck = prepared;
      let synced = false;
      let syncError: string | undefined;

      // Sinkronkan ke cloud bila sudah login (bukan guest lokal)
      if (userId && !isGuest) {
        try {
          const cloudDeck = await saveCloudDeck(prepared);
          finalDeck = { ...cloudDeck, lastOpenedAt: prepared.lastOpenedAt ?? null, synced: true };
          await putDeck(finalDeck);
          synced = true;
        } catch (err: any) {
          syncError = err?.message || 'Gagal sinkron ke server';
          finalDeck = { ...prepared, synced: false };
          await putDeck(finalDeck);
        }
      }

      setDecks((prev) => {
        const exists = prev.some((d) => d.id === finalDeck.id);
        const list = exists ? prev.map((d) => (d.id === finalDeck.id ? finalDeck : d)) : [finalDeck, ...prev];
        return sortDecks(list);
      });

      // Buang progres kartu yang sudah dihapus dari deck
      setProgress((prev) => {
        const p = prev[finalDeck.id];
        if (!p) return prev;
        const ids = new Set(finalDeck.cards.map((c) => c.id));
        const cleaned: Flashcard3DProgress = {};
        Object.entries<boolean>(p).forEach(([k, v]) => {
          if (ids.has(k)) cleaned[k] = v;
        });
        putProgress(progressStorageKey(userId, finalDeck.id), cleaned).catch(() => {});
        return { ...prev, [finalDeck.id]: cleaned };
      });

      return { deck: finalDeck, synced, syncError };
    },
    [userId, isAdmin, isGuest]
  );

  const publishDeck = useCallback(
    async (deck: Flashcard3DDeck, pubOpts?: PublishOptions) => {
      const next: Flashcard3DDeck = {
        ...deck,
        isPublic: pubOpts?.isPublic ?? (isAdmin ? true : false),
        angkatan: pubOpts?.angkatan ?? deck.angkatan ?? 'all',
        prodi: pubOpts?.prodi ?? deck.prodi ?? 'all',
      };
      return saveDeck(next);
    },
    [isAdmin, saveDeck]
  );

  const deleteDeck = useCallback(
    async (id: string) => {
      const target = decks.find((d) => d.id === id);
      if (target?.synced && userId && !isGuest) {
        await deleteCloudDeck(id);
      }
      await removeDeck(id);
      setDecks((prev) => prev.filter((d) => d.id !== id));
      setProgress((prev) => {
        const { [id]: _, ...rest } = prev;
        return rest;
      });
    },
    [decks, userId, isGuest]
  );

  const importJson = useCallback(
    async (json: string, fallbackTitle?: string, pubOpts?: PublishOptions) => {
      const parsed = parseDecksFromJson(json, fallbackTitle);
      const savedList: Flashcard3DDeck[] = [];
      let syncedCount = 0;
      let lastSyncError: string | undefined;

      for (const rawDeck of parsed) {
        const deckWithMeta: Flashcard3DDeck = {
          ...rawDeck,
          userId: userId || undefined,
          isPublic: isAdmin ? (pubOpts?.isPublic ?? true) : false,
          angkatan: pubOpts?.angkatan || 'all',
          prodi: pubOpts?.prodi || 'all',
          synced: false,
        };
        const res = await saveDeck(deckWithMeta);
        savedList.push(res.deck);
        if (res.synced) syncedCount += 1;
        else if (res.syncError) lastSyncError = res.syncError;
      }

      return { decks: savedList, syncedCount, syncError: lastSyncError };
    },
    [userId, isAdmin, saveDeck]
  );

  const pushProgressDebounced = useCallback(
    (deckId: string, nextProg: Flashcard3DProgress, immediate = false) => {
      if (!userId || isGuest) return;
      if (progressTimers.current[deckId]) clearTimeout(progressTimers.current[deckId]);
      const run = () => {
        saveCloudProgress(deckId, nextProg).catch(() => {});
      };
      if (immediate) run();
      else progressTimers.current[deckId] = setTimeout(run, 650);
    },
    [userId, isGuest]
  );

  const setCardKnown = useCallback(
    (deckId: string, cardId: string, known: boolean | undefined) => {
      setProgress((prev) => {
        const next = { ...(prev[deckId] || {}) };
        if (known === undefined) delete next[cardId];
        else next[cardId] = known;
        putProgress(progressStorageKey(userId, deckId), next).catch(() => {});
        pushProgressDebounced(deckId, next);
        return { ...prev, [deckId]: next };
      });
    },
    [userId, pushProgressDebounced]
  );

  const resetProgress = useCallback(
    (deckId: string) => {
      setProgress((prev) => {
        putProgress(progressStorageKey(userId, deckId), {}).catch(() => {});
        pushProgressDebounced(deckId, {}, true);
        return { ...prev, [deckId]: {} };
      });
    },
    [userId, pushProgressDebounced]
  );

  const touchDeck = useCallback((deckId: string) => {
    setDecks((prev) =>
      prev.map((d) => {
        if (d.id !== deckId) return d;
        const next = { ...d, lastOpenedAt: Date.now() };
        putDeck(next).catch(() => {});
        return next;
      })
    );
  }, []);

  const unsyncedDecks = decks.filter((d) => !d.synced);

  return {
    decks,
    unsyncedDecks,
    progress,
    loading,
    syncing,
    error,
    canEditDeck,
    saveDeck,
    publishDeck,
    deleteDeck,
    importJson,
    setCardKnown,
    resetProgress,
    touchDeck,
    refreshFromCloud: syncFromCloud,
  };
}

export type FlashcardDecksApi = ReturnType<typeof useFlashcardDecks>;
