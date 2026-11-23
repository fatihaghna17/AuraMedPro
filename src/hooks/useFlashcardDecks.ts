// src/hooks/useFlashcardDecks.ts
import { useCallback, useEffect, useState } from 'react';
import type { Flashcard3DDeck, Flashcard3DProgress } from '../types/flashcard3d';
import {
  getAllDecks,
  getAllProgress,
  parseDecksFromJson,
  putDeck,
  putProgress,
  removeDeck,
} from '../utils/flashcard3dStorage';

export function useFlashcardDecks() {
  const [decks, setDecks] = useState<Flashcard3DDeck[]>([]);
  const [progress, setProgress] = useState<Record<string, Flashcard3DProgress>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([getAllDecks(), getAllProgress()])
      .then(([d, p]) => {
        if (!alive) return;
        setDecks(d);
        setProgress(p);
      })
      .catch(() => alive && setError('Penyimpanan lokal tidak bisa dibuka. Coba muat ulang halaman.'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const saveDeck = useCallback(async (deck: Flashcard3DDeck) => {
    const next = { ...deck, updatedAt: Date.now() };
    await putDeck(next);
    setDecks((prev) => {
      const exists = prev.some((d) => d.id === next.id);
      return exists ? prev.map((d) => (d.id === next.id ? next : d)) : [next, ...prev];
    });
    // Buang progres kartu yang sudah dihapus dari deck.
    setProgress((prev) => {
      const p = prev[next.id];
      if (!p) return prev;
      const ids = new Set(next.cards.map((c) => c.id));
      const cleaned: Flashcard3DProgress = {};
      Object.entries<boolean>(p).forEach(([k, v]) => {
        if (ids.has(k)) cleaned[k] = v;
      });
      putProgress(next.id, cleaned).catch(() => {});
      return { ...prev, [next.id]: cleaned };
    });
    return next;
  }, []);

  const deleteDeck = useCallback(async (id: string) => {
    await removeDeck(id);
    setDecks((prev) => prev.filter((d) => d.id !== id));
    setProgress((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const importJson = useCallback(async (json: string, fallbackTitle?: string) => {
    const parsed = parseDecksFromJson(json, fallbackTitle);
    for (const d of parsed) await putDeck(d);
    setDecks((prev) => [...parsed, ...prev]);
    return parsed;
  }, []);

  const setCardKnown = useCallback((deckId: string, cardId: string, known: boolean | undefined) => {
    setProgress((prev) => {
      const next = { ...(prev[deckId] || {}) };
      if (known === undefined) delete next[cardId];
      else next[cardId] = known;
      putProgress(deckId, next).catch(() => {});
      return { ...prev, [deckId]: next };
    });
  }, []);

  const resetProgress = useCallback((deckId: string) => {
    setProgress((prev) => {
      putProgress(deckId, {}).catch(() => {});
      return { ...prev, [deckId]: {} };
    });
  }, []);

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

  return { decks, progress, loading, error, saveDeck, deleteDeck, importJson, setCardKnown, resetProgress, touchDeck };
}

export type FlashcardDecksApi = ReturnType<typeof useFlashcardDecks>;
