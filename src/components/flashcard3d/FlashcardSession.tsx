// src/components/flashcard3d/FlashcardSession.tsx
// Layar belajar utama Flashcard 3D: header ringkas, filter segmented, panggung kartu 3D,
// aksi nilai kaca (Belum hafal / Hafal), navigasi satu baris, undo & shortcut keyboard.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Shuffle,
  Undo2,
  X,
} from 'lucide-react';
import type { Flashcard3DDeck, Flashcard3DFilter, Flashcard3DProgress } from '../../types/flashcard3d';
import { CardStack } from './CardStack';
import type { FlipCardHandle } from './FlipCard';
import { SessionSummary } from './SessionSummary';

interface FlashcardSessionProps {
  deck: Flashcard3DDeck;
  progress: Flashcard3DProgress;
  canEdit?: boolean;
  onRateCard: (cardId: string, known: boolean | undefined) => void;
  onResetProgress: () => void;
  onEditDeck: () => void;
  onBack: () => void;
  onZoomImage: (src: string) => void;
  onToast: (msg: string, icon?: string) => void;
  onConfirmReset: (onConfirm: () => void) => void;
}

interface UndoEntry {
  cardId: string;
  prevIndex: number;
  prevStatus: boolean | undefined;
}

function shuffleIds(ids: string[]): string[] {
  const arr = [...ids];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const FlashcardSession: React.FC<FlashcardSessionProps> = ({
  deck,
  progress,
  canEdit = true,
  onRateCard,
  onResetProgress,
  onEditDeck,
  onBack,
  onZoomImage,
  onToast,
  onConfirmReset,
}) => {
  const [filter, setFilter] = useState<Flashcard3DFilter>('all');
  const [shuffled, setShuffled] = useState(false);
  const [queue, setQueue] = useState<string[]>(() => deck.cards.map((c) => c.id));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [finished, setFinished] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [undoStack, setUndoStack] = useState<UndoEntry[]>([]);
  // Versi antrean untuk memastikan key FlipCard selalu segar saat reset/acak/undo
  const [runNonce, setRunNonce] = useState(0);

  const cardRef = useRef<FlipCardHandle>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const cardById = useMemo(() => new Map(deck.cards.map((c, i) => [c.id, { card: c, num: i + 1 }])), [deck.cards]);

  const knownCount = useMemo(
    () => deck.cards.reduce((acc, c) => acc + (progress[c.id] === true ? 1 : 0), 0),
    [deck.cards, progress]
  );
  const unknownCount = deck.cards.length - knownCount;
  const masteryPct = deck.cards.length > 0 ? Math.round((knownCount / deck.cards.length) * 100) : 0;

  const buildQueue = useCallback(
    (nextFilter: Flashcard3DFilter, shouldShuffle: boolean, snapshotProgress: Flashcard3DProgress) => {
      const base =
        nextFilter === 'unknown'
          ? deck.cards.filter((c) => snapshotProgress[c.id] !== true).map((c) => c.id)
          : deck.cards.map((c) => c.id);
      return shouldShuffle ? shuffleIds(base) : base;
    },
    [deck.cards]
  );

  // Sinkronkan antrean jika deck berubah (mis. balik dari editor atau ganti deck)
  useEffect(() => {
    const validIds = new Set(deck.cards.map((c) => c.id));
    setQueue((prev) => {
      const kept = prev.filter((id) => validIds.has(id));
      const added = deck.cards.filter((c) => !prev.includes(c.id)).map((c) => c.id);
      const next = [...kept, ...added];
      return next.length ? next : deck.cards.map((c) => c.id);
    });
  }, [deck.id, deck.cards]);

  // Tutup menu overflow saat klik di luar
  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    window.addEventListener('mousedown', onPointer);
    return () => window.removeEventListener('mousedown', onPointer);
  }, [menuOpen]);

  const startQueue = useCallback(
    (nextFilter: Flashcard3DFilter, shouldShuffle: boolean, snap: Flashcard3DProgress = progress) => {
      const q = buildQueue(nextFilter, shouldShuffle, snap);
      setFilter(nextFilter);
      setShuffled(shouldShuffle);
      setQueue(q);
      setIndex(0);
      setFlipped(false);
      setFinished(false);
      setUndoStack([]);
      setRunNonce((n) => n + 1);
    },
    [buildQueue, progress]
  );

  const currentId = queue[index];
  const currentEntry = currentId ? cardById.get(currentId) : undefined;
  const remainingAfter = Math.max(0, queue.length - index - 1);

  const commitRate = useCallback(
    (known: boolean) => {
      if (!currentId) return;
      setUndoStack((prev) => [...prev.slice(-19), { cardId: currentId, prevIndex: index, prevStatus: progress[currentId] }]);
      onRateCard(currentId, known);
      setFlipped(false);
      if (index + 1 >= queue.length) {
        setFinished(true);
      } else {
        setIndex((i) => i + 1);
      }
    },
    [currentId, index, progress, onRateCard, queue.length]
  );

  const triggerRate = useCallback(
    (known: boolean) => {
      if (finished || !currentEntry) return;
      if (cardRef.current) cardRef.current.throwCard(known);
      else commitRate(known);
    },
    [finished, currentEntry, commitRate]
  );

  const step = useCallback(
    (delta: -1 | 1) => {
      if (!queue.length) return;
      if (finished && delta === -1) {
        setFinished(false);
        setIndex(queue.length - 1);
        setFlipped(false);
        return;
      }
      const next = index + delta;
      if (next < 0) return;
      if (next >= queue.length) {
        setFinished(true);
        return;
      }
      setIndex(next);
      setFlipped(false);
    },
    [index, queue.length, finished]
  );

  const handleUndo = useCallback(() => {
    setUndoStack((prev) => {
      if (!prev.length) return prev;
      const last = prev[prev.length - 1];
      onRateCard(last.cardId, last.prevStatus);
      setFinished(false);
      setIndex(last.prevIndex);
      setFlipped(false);
      setRunNonce((n) => n + 1);
      return prev.slice(0, -1);
    });
  }, [onRateCard]);

  // Shortcut keyboard
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;

      if (e.key === 'Escape') {
        if (menuOpen) setMenuOpen(false);
        return;
      }
      if (finished || !currentEntry) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        triggerRate(true);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        triggerRate(false);
      } else if (e.key === 'ArrowUp' || e.key === '[') {
        e.preventDefault();
        step(-1);
      } else if (e.key === 'ArrowDown' || e.key === ']') {
        e.preventDefault();
        step(1);
      } else if ((e.key === 'z' || e.key === 'Z') && !e.metaKey && !e.ctrlKey) {
        if (undoStack.length) {
          e.preventDefault();
          handleUndo();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen, finished, currentEntry, triggerRate, step, undoStack.length, handleUndo]);

  const handleExportDeck = () => {
    setMenuOpen(false);
    const payload = {
      type: 'flashcard3d',
      title: deck.title,
      cards: deck.cards.map(({ front, back, tags }) => ({
        front: { text: front.text, ...(front.image ? { image: front.image } : {}) },
        back: { text: back.text, ...(back.image ? { image: back.image } : {}) },
        ...(tags?.length ? { tags } : {}),
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${deck.title.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'flashcard-3d'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onToast('Deck diekspor sebagai JSON.');
  };

  const handleToggleShuffle = () => {
    setMenuOpen(false);
    const nextShuffled = !shuffled;
    startQueue(filter, nextShuffled);
    onToast(nextShuffled ? 'Urutan kartu diacak.' : 'Urutan dikembalikan seperti semula.');
  };

  const handleRequestReset = () => {
    setMenuOpen(false);
    onConfirmReset(() => {
      onResetProgress();
      startQueue('all', shuffled, {});
      onToast('Progres hafalan direset.');
    });
  };

  return (
    <div className="w-full max-w-[680px] mx-auto px-1 sm:px-2 pb-4 lg:pb-10 animate-fade-in">
      {/* Header ringkas */}
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onBack}
            aria-label="Kembali ke daftar deck"
            className="w-9 h-9 rounded-xl liquid-glass-subtle-interactive flex items-center justify-center text-slate-700 dark:text-slate-200 shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-50 truncate">
              {deck.title}
            </h1>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums">
              Hafal {knownCount} dari {deck.cards.length}
              {shuffled ? ' · Acak' : ''}
            </p>
          </div>
        </div>

        {/* Overflow menu (⋯) */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Opsi deck"
            aria-expanded={menuOpen}
            className="w-9 h-9 rounded-xl liquid-glass-subtle-interactive flex items-center justify-center text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-52 rounded-2xl fc3d-popover p-1.5 z-40 animate-scale-in">
              <button
                type="button"
                onClick={handleToggleShuffle}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <Shuffle className="w-3.5 h-3.5" />
                  Acak kartu
                </span>
                {shuffled && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
              </button>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onEditDeck();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit kartu
                </button>
              )}
              <button
                type="button"
                onClick={handleExportDeck}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Unduh JSON
              </button>
              <div className="my-1 border-t border-slate-200/70 dark:border-white/10" />
              <button
                type="button"
                onClick={handleRequestReset}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset progres
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Progress strip tipis */}
      <div className="mt-2.5 h-1.5 w-full rounded-full overflow-hidden bg-slate-900/10 dark:bg-white/10">
        <div
          className="h-full rounded-full bg-indigo-500 transition-[width] duration-300 ease-out"
          style={{ width: `${masteryPct}%` }}
        />
      </div>

      {/* Filter segmented kaca */}
      <div className="mt-3 mb-4 flex items-center justify-between gap-2 min-w-0">
        <div
          role="tablist"
          aria-label="Filter kartu"
          className="relative inline-flex p-1 rounded-2xl fc3d-segment min-w-0 max-w-full overflow-x-auto scrollbar-none"
        >
          {(
            [
              { id: 'all', label: `Semua (${deck.cards.length})` },
              { id: 'unknown', label: `Belum hafal (${unknownCount})` },
            ] as const
          ).map((tab) => {
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => startQueue(tab.id, shuffled)}
                className={`relative z-10 shrink-0 whitespace-nowrap px-2.5 sm:px-3.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold tabular-nums transition-colors cursor-pointer ${
                  active ? 'text-slate-950 dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="fc3d-filter-pill"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    className="absolute inset-0 -z-10 rounded-xl fc3d-segment-pill"
                  />
                )}
                {tab.label}
              </button>
            );
          })}
        </div>

        {undoStack.length > 0 && !finished && (
          <button
            type="button"
            onClick={handleUndo}
            className="shrink-0 inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl liquid-glass-subtle-interactive text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
            title="Urungkan penilaian terakhir (Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span className="hidden min-[380px]:inline">Urungkan</span>
          </button>
        )}
      </div>

      {/* Konten utama: Ringkasan / Kosong / Panggung Kartu 3D */}
      {finished ? (
        <SessionSummary
          deckTitle={deck.title}
          totalCards={deck.cards.length}
          knownCount={knownCount}
          unknownCount={unknownCount}
          onRepeatUnknown={() => startQueue('unknown', shuffled)}
          onRepeatAll={() => startQueue('all', shuffled)}
          onBackToList={onBack}
        />
      ) : !currentEntry ? (
        <div className="w-full max-w-[520px] mx-auto fc3d-panel rounded-[28px] p-8 sm:p-10 text-center animate-fade-in">
          <div className="w-12 h-12 mx-auto rounded-2xl fc3d-chip flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="mt-4 text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-50">
            Semua kartu sudah hafal
          </h2>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
            Tidak ada lagi kartu di daftar belum hafal untuk deck ini.
          </p>
          <button
            type="button"
            onClick={() => startQueue('all', shuffled)}
            className="mt-6 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Ulangi semua kartu
          </button>
        </div>
      ) : (
        <>
          <CardStack
            ref={cardRef}
            card={currentEntry.card}
            cardKey={`${runNonce}_${currentEntry.card.id}_${index}`}
            number={currentEntry.num}
            remainingAfter={remainingAfter}
            flipped={flipped}
            status={progress[currentEntry.card.id]}
            onFlip={() => setFlipped((f) => !f)}
            onRate={commitRate}
            onZoom={onZoomImage}
          />

          {/* Tombol nilai kaca (tenang sebelum dibalik, tegas setelah dibalik) */}
          <div
            className={`w-full max-w-[560px] mx-auto grid grid-cols-2 gap-3 pt-1 transition-opacity duration-200 ${
              flipped ? 'opacity-100' : 'opacity-80'
            }`}
          >
            <button
              type="button"
              onClick={() => triggerRate(false)}
              className="fc3d-btn-unknown py-3 px-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-all"
            >
              <X className="w-4 h-4" strokeWidth={2.5} />
              <span>Belum hafal</span>
            </button>
            <button
              type="button"
              onClick={() => triggerRate(true)}
              className="fc3d-btn-known py-3 px-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-all"
            >
              <Check className="w-4 h-4" strokeWidth={2.5} />
              <span>Hafal</span>
            </button>
          </div>

          {/* Bar navigasi bawah: satu baris bersih */}
          <div className="w-full max-w-[560px] mx-auto mt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => step(-1)}
              disabled={index === 0}
              aria-label="Kartu sebelumnya"
              className="w-10 h-10 rounded-full liquid-glass-subtle-interactive flex items-center justify-center text-slate-700 dark:text-slate-200 disabled:opacity-35 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <span className="text-xs font-semibold tabular-nums text-slate-600 dark:text-slate-300">
              {index + 1} / {queue.length}
            </span>

            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Kartu berikutnya"
              className="w-10 h-10 rounded-full liquid-glass-subtle-interactive flex items-center justify-center text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Petunjuk keyboard desktop */}
          <div className="hidden md:flex items-center justify-center flex-wrap gap-x-5 gap-y-2 mt-4 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <kbd className="fc3d-kbd">Spasi</kbd> Balik
            </span>
            <span className="inline-flex items-center gap-1.5">
              <kbd className="fc3d-kbd">←</kbd> Belum hafal
            </span>
            <span className="inline-flex items-center gap-1.5">
              <kbd className="fc3d-kbd">→</kbd> Hafal
            </span>
            <span className="inline-flex items-center gap-1.5">
              <kbd className="fc3d-kbd">[</kbd>
              <kbd className="fc3d-kbd">]</kbd> Pindah
            </span>
            <span className="inline-flex items-center gap-1.5">
              <kbd className="fc3d-kbd">Z</kbd> Urungkan
            </span>
          </div>
        </>
      )}
    </div>
  );
};
