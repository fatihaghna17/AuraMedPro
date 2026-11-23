// src/components/tabs/SetupFlashcardTab.tsx
// Tab utama Flashcard 3D: daftar deck, empty state dengan kartu 3D interaktif,
// sesi belajar, editor deck, dan modal import JSON.
import React, { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  CheckCircle2,
  FileUp,
  Layers,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import type { Flashcard3DDeck } from '../../types/flashcard3d';
import { useFlashcardDecks } from '../../hooks/useFlashcardDecks';
import { FlashcardSession } from '../flashcard3d/FlashcardSession';
import { DeckEditor } from '../flashcard3d/DeckEditor';
import { ImportJsonModal } from '../flashcard3d/ImportJsonModal';
import { SAMPLE_DECK_JSON } from '../flashcard3d/sampleDeck';
import ConfirmModal from '../ConfirmModal';

interface SetupFlashcardTabProps {
  theme: 'light' | 'dark';
  triggerToast: (text: string, icon?: string) => void;
  setLightboxImage: (url: string | null) => void;
}

type SubView =
  | { kind: 'list' }
  | { kind: 'session'; deckId: string }
  | { kind: 'editor'; deckId?: string; returnToSession?: boolean };

function formatRelativeTime(ts?: number | null): string {
  if (!ts) return 'Belum dibuka';
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 60) return 'Baru saja';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} mnt lalu`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam lalu`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay} hari lalu`;
  return new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

/** Kartu 3D mini interaktif untuk empty state agar user langsung merasakan interaksi flip. */
const PreviewMiniCard: React.FC = () => {
  const [flipped, setFlipped] = useState(false);
  const reduce = useReducedMotion();

  return (
    <div className="fc3d-stage relative w-full max-w-[310px] h-[176px] mx-auto my-2">
      <div
        aria-hidden="true"
        className="fc3d-stack-lip pointer-events-none absolute inset-x-0 bottom-0 h-8 rounded-b-[24px]"
        style={{ transform: 'translateY(14px) scaleX(0.88)', opacity: 0.5 }}
      />
      <div
        aria-hidden="true"
        className="fc3d-stack-lip fc3d-stack-lip-near pointer-events-none absolute inset-x-0 bottom-0 h-9 rounded-b-[24px]"
        style={{ transform: 'translateY(7px) scaleX(0.94)', opacity: 0.76 }}
      />
      <motion.button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        animate={{ rotateY: reduce ? 0 : flipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 230, damping: 22 }}
        style={{ transformStyle: 'preserve-3d' }}
        className="relative w-full h-full cursor-pointer text-left rounded-[24px]"
        aria-label="Contoh kartu 3D, ketuk untuk membalik"
      >
        <div
          className={`fc3d-face absolute inset-0 rounded-[24px] p-5 flex flex-col justify-between transition-opacity duration-200 ${
            reduce ? (flipped ? 'opacity-0' : 'opacity-100') : ''
          }`}
          style={reduce ? undefined : { transform: 'rotateY(0deg)' }}
        >
          <span className="text-[11px] font-semibold tabular-nums text-slate-500 dark:text-slate-400">
            No. 1
          </span>
          <p className="text-sm sm:text-[15px] font-semibold text-center text-slate-900 dark:text-slate-50 leading-snug text-balance">
            Ketuk kartu ini untuk mencoba efek balik 3D
          </p>
          <span className="flex items-center justify-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            <RotateCcw className="w-3 h-3" /> Muka depan
          </span>
        </div>

        <div
          className={`fc3d-face fc3d-face-back absolute inset-0 rounded-[24px] p-5 flex flex-col justify-between transition-opacity duration-200 ${
            reduce ? (flipped ? 'opacity-100' : 'opacity-0') : ''
          }`}
          style={reduce ? undefined : { transform: 'rotateY(180deg)' }}
        >
          <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300">Jawaban</span>
          <p className="text-xs sm:text-sm font-medium text-center text-slate-800 dark:text-slate-100 leading-relaxed text-balance">
            Geser kanan saat <strong>Hafal</strong>, geser kiri jika <strong>Belum hafal</strong>.
          </p>
          <span className="flex items-center justify-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            <RotateCcw className="w-3 h-3" /> Ketuk untuk kembali
          </span>
        </div>
      </motion.button>
    </div>
  );
};

export const SetupFlashcardTab: React.FC<SetupFlashcardTabProps> = ({
  theme,
  triggerToast,
  setLightboxImage,
}) => {
  const {
    decks,
    progress,
    loading,
    error,
    saveDeck,
    deleteDeck,
    importJson,
    setCardKnown,
    resetProgress,
    touchDeck,
  } = useFlashcardDecks();

  const [view, setView] = useState<SubView>({ kind: 'list' });
  const [search, setSearch] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: (() => void) | null;
  }>({ open: false, title: '', description: '', onConfirm: null });

  const openConfirm = (title: string, description: string, onConfirm: () => void) => {
    setConfirmState({ open: true, title, description, onConfirm });
  };

  const closeConfirm = () => setConfirmState((s) => ({ ...s, open: false, onConfirm: null }));

  const filteredDecks = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return decks;
    return decks.filter((d) => d.title.toLowerCase().includes(q));
  }, [decks, search]);

  const totalCardsAll = useMemo(() => decks.reduce((sum, d) => sum + d.cards.length, 0), [decks]);

  const openSession = (deckId: string) => {
    touchDeck(deckId);
    setView({ kind: 'session', deckId });
  };

  const handleLoadSample = async () => {
    try {
      const added = await importJson(SAMPLE_DECK_JSON);
      if (added[0]) {
        triggerToast(`Deck contoh "${added[0].title}" siap dicoba.`);
        openSession(added[0].id);
      }
    } catch {
      triggerToast('Gagal memuat deck contoh.');
    }
  };

  const handleImportJson = async (jsonText: string, fallbackTitle?: string) => {
    const added = await importJson(jsonText, fallbackTitle);
    const total = added.reduce((s, d) => s + d.cards.length, 0);
    triggerToast(
      added.length > 1
        ? `${added.length} deck (${total} kartu) berhasil diimpor.`
        : `"${added[0].title}" (${total} kartu) berhasil diimpor.`
    );
  };

  const handleSaveEditor = async (deck: Flashcard3DDeck) => {
    const saved = await saveDeck(deck);
    triggerToast(`Deck "${saved.title}" disimpan (${saved.cards.length} kartu).`);
    if (view.kind === 'editor' && view.returnToSession) {
      setView({ kind: 'session', deckId: saved.id });
    } else {
      setView({ kind: 'list' });
    }
  };

  // --- SUB-VIEW: SESI BELAJAR ---
  if (view.kind === 'session') {
    const activeDeck = decks.find((d) => d.id === view.deckId);
    if (!activeDeck) {
      setView({ kind: 'list' });
      return null;
    }
    return (
      <>
        <FlashcardSession
          deck={activeDeck}
          progress={progress[activeDeck.id] || {}}
          onRateCard={(cardId, known) => setCardKnown(activeDeck.id, cardId, known)}
          onResetProgress={() => resetProgress(activeDeck.id)}
          onEditDeck={() => setView({ kind: 'editor', deckId: activeDeck.id, returnToSession: true })}
          onBack={() => setView({ kind: 'list' })}
          onZoomImage={(src) => setLightboxImage(src)}
          onToast={(msg) => triggerToast(msg)}
          onConfirmReset={(onConfirm) =>
            openConfirm(
              'Reset progres hafalan?',
              `Semua tanda "Hafal" dan "Belum hafal" pada "${activeDeck.title}" akan dikosongkan. Kartu di dalam deck tidak dihapus.`,
              onConfirm
            )
          }
        />
        <ConfirmModal
          isOpen={confirmState.open}
          theme={theme}
          title={confirmState.title}
          description={confirmState.description}
          onConfirm={confirmState.onConfirm}
          onClose={closeConfirm}
        />
      </>
    );
  }

  // --- SUB-VIEW: EDITOR DECK ---
  if (view.kind === 'editor') {
    const editingDeck = view.deckId ? decks.find((d) => d.id === view.deckId) : null;
    return (
      <DeckEditor
        initialDeck={editingDeck}
        onSave={handleSaveEditor}
        onCancel={() =>
          view.returnToSession && view.deckId
            ? setView({ kind: 'session', deckId: view.deckId })
            : setView({ kind: 'list' })
        }
        onZoomImage={(src) => setLightboxImage(src)}
        onToast={(msg) => triggerToast(msg)}
      />
    );
  }

  // --- SUB-VIEW: DAFTAR DECK ---
  return (
    <div className="w-full max-w-5xl mx-auto pb-24 lg:pb-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            Flashcard 3D
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 tabular-nums">
            {decks.length > 0
              ? `${decks.length} deck · ${totalCardsAll} kartu tersimpan di perangkat`
              : 'Kartu bolak-balik untuk hafalan cepat dengan teks dan gambar.'}
          </p>
        </div>

        {decks.length > 0 && (
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="px-3.5 py-2.5 rounded-xl liquid-glass-subtle-interactive text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 inline-flex items-center gap-2 cursor-pointer"
            >
              <FileUp className="w-4 h-4" />
              <span>Import JSON</span>
            </button>
            <button
              type="button"
              onClick={() => setView({ kind: 'editor' })}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/20 transition-all inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Deck</span>
            </button>
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div
          role="alert"
          className="mb-5 px-4 py-3 rounded-2xl bg-rose-500/12 border border-rose-500/30 text-sm font-semibold text-rose-700 dark:text-rose-300"
        >
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-36 rounded-2xl fc3d-panel animate-pulse" />
          ))}
        </div>
      ) : decks.length === 0 ? (
        /* Empty state dengan kartu 3D hidup */
        <div className="fc3d-panel rounded-[28px] px-6 py-10 sm:py-12 text-center">
          <PreviewMiniCard />

          <h2 className="mt-8 text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            Belum ada deck flashcard
          </h2>
          <p className="mt-1.5 max-w-md mx-auto text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Buat kartu satu per satu dengan teks atau gambar, atau impor langsung ratusan kartu lewat JSON.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={() => setView({ kind: 'editor' })}
              className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-600/20 transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Buat Deck Baru
            </button>
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="px-5 py-3 rounded-2xl liquid-glass-subtle-interactive text-slate-800 dark:text-slate-100 text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
            >
              <FileUp className="w-4 h-4" />
              Import JSON
            </button>
          </div>

          <button
            type="button"
            onClick={handleLoadSample}
            className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:underline underline-offset-4 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Muat contoh deck UKMPPD (5 kartu)
          </button>
        </div>
      ) : (
        <>
          {/* Pencarian ringkas bila deck sudah cukup banyak */}
          {decks.length > 4 && (
            <div className="relative mb-5 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari judul deck..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm liquid-glass-input text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              />
            </div>
          )}

          {filteredDecks.length === 0 ? (
            <div className="fc3d-panel rounded-2xl p-8 text-center">
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Tidak ada deck yang cocok dengan &ldquo;{search}&rdquo;.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredDecks.map((deck) => {
                const prog = progress[deck.id] || {};
                const known = deck.cards.reduce((acc, c) => acc + (prog[c.id] === true ? 1 : 0), 0);
                const total = deck.cards.length;
                const pct = total > 0 ? Math.round((known / total) * 100) : 0;
                const done = total > 0 && known === total;

                return (
                  <div
                    key={deck.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openSession(deck.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openSession(deck.id);
                      }
                    }}
                    className="fc3d-deck-tile group relative rounded-[22px] p-5 flex flex-col justify-between min-h-[156px] text-left cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-50 line-clamp-2 leading-snug">
                          {deck.title}
                        </h2>
                        <p className="mt-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums">
                          {total} kartu · {formatRelativeTime(deck.lastOpenedAt)}
                        </p>
                      </div>

                      <div className="flex items-center gap-0.5 shrink-0 opacity-85 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 transition-opacity">
                        <button
                          type="button"
                          aria-label={`Edit ${deck.title}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setView({ kind: 'editor', deckId: deck.id });
                          }}
                          className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10 transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Hapus ${deck.title}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            openConfirm(
                              'Hapus deck ini?',
                              `"${deck.title}" (${total} kartu) beserta progres hafalannya akan dihapus permanen dari perangkat ini.`,
                              () => {
                                deleteDeck(deck.id);
                                triggerToast(`Deck "${deck.title}" dihapus.`);
                              }
                            );
                          }}
                          className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Progres hafal */}
                    <div className="mt-5">
                      <div className="flex items-center justify-between text-xs font-semibold tabular-nums mb-1.5">
                        <span
                          className={`inline-flex items-center gap-1 ${
                            done
                              ? 'text-emerald-700 dark:text-emerald-300'
                              : 'text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {done ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" /> Semua hafal
                            </>
                          ) : (
                            <>
                              <Layers className="w-3.5 h-3.5 opacity-70" /> Hafal {known}/{total}
                            </>
                          )}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">{pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden bg-slate-900/10 dark:bg-white/10">
                        <div
                          className={`h-full rounded-full transition-[width] duration-300 ${
                            done ? 'bg-emerald-500' : 'bg-indigo-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <ImportJsonModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={handleImportJson}
        onToast={(msg) => triggerToast(msg)}
      />

      <ConfirmModal
        isOpen={confirmState.open}
        theme={theme}
        title={confirmState.title}
        description={confirmState.description}
        onConfirm={confirmState.onConfirm}
        onClose={closeConfirm}
      />
    </div>
  );
};
