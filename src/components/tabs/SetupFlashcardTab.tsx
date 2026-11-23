// src/components/tabs/SetupFlashcardTab.tsx
// Tab utama Flashcard 3D: daftar deck (publik admin & pribadi tersinkron cloud),
// empty state dengan kartu 3D interaktif, sesi belajar, editor deck, dan modal import JSON.
import React, { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  CheckCircle2,
  CloudOff,
  CloudUpload,
  FileUp,
  Globe,
  Layers,
  Lock,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import type { Flashcard3DDeck } from '../../types/flashcard3d';
import { useFlashcardDecks, type PublishOptions } from '../../hooks/useFlashcardDecks';
import { FlashcardSession } from '../flashcard3d/FlashcardSession';
import { DeckEditor } from '../flashcard3d/DeckEditor';
import { ImportJsonModal } from '../flashcard3d/ImportJsonModal';
import { SAMPLE_DECK_JSON } from '../flashcard3d/sampleDeck';
import ConfirmModal from '../ConfirmModal';

interface SetupFlashcardTabProps {
  theme: 'light' | 'dark';
  currentUser?: any;
  isAdmin?: boolean;
  userAngkatan?: string | null;
  userProdi?: string | null;
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

function formatTargetLabel(deck: Flashcard3DDeck): string {
  const parts: string[] = [];
  if (deck.prodi && deck.prodi !== 'all') {
    parts.push(deck.prodi.charAt(0).toUpperCase() + deck.prodi.slice(1));
  }
  if (deck.angkatan && deck.angkatan !== 'all') {
    parts.push(deck.angkatan);
  }
  return parts.length ? `Publik · ${parts.join(' ')}` : 'Publik';
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
  currentUser,
  isAdmin = false,
  userAngkatan = null,
  userProdi = null,
  triggerToast,
  setLightboxImage,
}) => {
  const userId = currentUser?.id ? String(currentUser.id) : null;
  const isGuest = Boolean(currentUser?.is_anonymous || currentUser?.user_metadata?.is_guest);

  const {
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
    refreshFromCloud,
  } = useFlashcardDecks({ userId, isAdmin, isGuest, userAngkatan, userProdi });

  const [view, setView] = useState<SubView>({ kind: 'list' });
  const [search, setSearch] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [publishingAll, setPublishingAll] = useState(false);
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
      const res = await importJson(SAMPLE_DECK_JSON, undefined, { isPublic: false });
      if (res.decks[0]) {
        triggerToast(`Deck contoh "${res.decks[0].title}" siap dicoba.`);
        openSession(res.decks[0].id);
      }
    } catch {
      triggerToast('Gagal memuat deck contoh.');
    }
  };

  const handleImportJson = async (jsonText: string, fallbackTitle?: string, pubOpts?: PublishOptions) => {
    const res = await importJson(jsonText, fallbackTitle, pubOpts);
    const total = res.decks.reduce((s, d) => s + d.cards.length, 0);
    const label =
      res.decks.length > 1
        ? `${res.decks.length} deck (${total} kartu)`
        : `"${res.decks[0].title}" (${total} kartu)`;

    if (res.syncedCount === res.decks.length) {
      triggerToast(
        isAdmin && pubOpts?.isPublic
          ? `${label} dipublikasikan ke semua user.`
          : `${label} tersimpan & tersinkron ke cloud.`
      );
    } else if (res.syncError) {
      triggerToast(`${label} tersimpan lokal. Sinkron server gagal: ${res.syncError}`);
    } else {
      triggerToast(`${label} berhasil diimpor.`);
    }
  };

  const handleSaveEditor = async (deck: Flashcard3DDeck) => {
    const res = await saveDeck(deck);
    if (res.synced) {
      triggerToast(
        res.deck.isPublic
          ? `"${res.deck.title}" dipublikasikan ke semua user (${res.deck.cards.length} kartu).`
          : `"${res.deck.title}" disimpan ke cloud (${res.deck.cards.length} kartu).`
      );
    } else if (res.syncError) {
      triggerToast(`Disimpan lokal. Gagal unggah ke server: ${res.syncError}`);
    } else {
      triggerToast(`Deck "${res.deck.title}" disimpan (${res.deck.cards.length} kartu).`);
    }

    if (view.kind === 'editor' && view.returnToSession) {
      setView({ kind: 'session', deckId: res.deck.id });
    } else {
      setView({ kind: 'list' });
    }
  };

  const handlePublishSingle = async (deck: Flashcard3DDeck) => {
    setPublishingId(deck.id);
    try {
      const res = await publishDeck(deck, {
        isPublic: isAdmin,
        prodi: deck.prodi || 'all',
        angkatan: deck.angkatan || 'all',
      });
      if (res.synced) {
        triggerToast(
          isAdmin
            ? `"${deck.title}" sekarang tampil di semua akun user.`
            : `"${deck.title}" tersinkron ke cloud.`
        );
      } else {
        triggerToast(res.syncError || 'Gagal mengunggah ke server.');
      }
    } finally {
      setPublishingId(null);
    }
  };

  const handlePublishAllLocal = async () => {
    if (!unsyncedDecks.length) return;
    setPublishingAll(true);
    let ok = 0;
    let lastErr: string | undefined;
    try {
      for (const d of unsyncedDecks) {
        const res = await publishDeck(d, { isPublic: isAdmin, prodi: 'all', angkatan: 'all' });
        if (res.synced) ok += 1;
        else if (res.syncError) lastErr = res.syncError;
      }
      if (ok === unsyncedDecks.length) {
        triggerToast(
          isAdmin
            ? `${ok} deck berhasil dipublikasikan ke semua user.`
            : `${ok} deck berhasil disinkronkan ke cloud.`
        );
      } else {
        triggerToast(`Berhasil ${ok}/${unsyncedDecks.length}. ${lastErr || 'Periksa koneksi.'}`);
      }
    } finally {
      setPublishingAll(false);
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
          canEdit={canEditDeck(activeDeck)}
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
        isAdmin={isAdmin}
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
              ? `${decks.length} deck · ${totalCardsAll} kartu siap dipelajari`
              : 'Kartu bolak-balik untuk hafalan cepat dengan teks dan gambar.'}
          </p>
        </div>

        {decks.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => refreshFromCloud()}
              disabled={syncing}
              aria-label="Muat ulang deck dari server"
              title="Muat ulang dari server"
              className="w-10 h-10 rounded-xl liquid-glass-subtle-interactive flex items-center justify-center text-slate-700 dark:text-slate-200 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            </button>
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

      {/* Banner sinkronisasi untuk deck lokal yang belum naik ke server */}
      {unsyncedDecks.length > 0 && userId && !isGuest && (
        <div className="mb-5 px-4 py-3.5 rounded-2xl fc3d-panel flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl fc3d-chip flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <CloudUpload className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-50">
                {isAdmin
                  ? `${unsyncedDecks.length} deck masih tersimpan lokal di browser ini`
                  : `${unsyncedDecks.length} deck belum tersinkron ke cloud`}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                {isAdmin
                  ? 'Publikasikan agar langsung muncul di semua akun user.'
                  : 'Unggah ke akunmu supaya bisa dibuka di HP dan laptop.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={publishingAll}
            onClick={handlePublishAllLocal}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-55 text-white text-xs font-bold shadow-sm transition-all cursor-pointer shrink-0 inline-flex items-center justify-center gap-1.5"
          >
            <CloudUpload className="w-3.5 h-3.5" />
            {publishingAll
              ? 'Mengunggah...'
              : isAdmin
              ? 'Publikasikan Semua'
              : 'Sinkronkan Semua'}
          </button>
        </div>
      )}

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
      {loading || (syncing && decks.length === 0) ? (
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
                const editable = canEditDeck(deck);

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
                    className="fc3d-deck-tile group relative rounded-[22px] p-5 flex flex-col justify-between min-h-[164px] text-left cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-50 line-clamp-2 leading-snug">
                          {deck.title}
                        </h2>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums">
                          <span>{total} kartu</span>
                          <span>·</span>
                          <span>{formatRelativeTime(deck.lastOpenedAt)}</span>
                        </div>

                        {/* Status sinkron / visibilitas */}
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          {deck.isPublic ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold fc3d-chip text-indigo-700 dark:text-indigo-300">
                              <Globe className="w-3 h-3" />
                              {formatTargetLabel(deck)}
                            </span>
                          ) : deck.synced ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold fc3d-chip text-slate-600 dark:text-slate-300">
                              <Lock className="w-3 h-3" />
                              Pribadi
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold fc3d-chip text-amber-700 dark:text-amber-300">
                              <CloudOff className="w-3 h-3" />
                              Lokal
                            </span>
                          )}

                          {!deck.synced && userId && !isGuest && (
                            <button
                              type="button"
                              disabled={publishingId === deck.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePublishSingle(deck);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-700 dark:text-indigo-300 transition-colors cursor-pointer"
                            >
                              <CloudUpload className="w-3 h-3" />
                              {publishingId === deck.id
                                ? 'Mengunggah...'
                                : isAdmin
                                ? 'Publikasikan'
                                : 'Sinkronkan'}
                            </button>
                          )}
                        </div>
                      </div>

                      {editable && (
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
                                deck.isPublic
                                  ? `"${deck.title}" (${total} kartu) akan dihapus untuk semua user.`
                                  : `"${deck.title}" (${total} kartu) beserta progres hafalannya akan dihapus permanen.`,
                                async () => {
                                  try {
                                    await deleteDeck(deck.id);
                                    triggerToast(`Deck "${deck.title}" dihapus.`);
                                  } catch (err: any) {
                                    triggerToast(err?.message || 'Gagal menghapus deck.');
                                  }
                                }
                              );
                            }}
                            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Progres hafal */}
                    <div className="mt-4">
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
        isAdmin={isAdmin}
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
