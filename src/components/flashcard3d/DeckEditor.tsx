// src/components/flashcard3d/DeckEditor.tsx
// Editor kartu Flashcard 3D langsung di app: teks (markdown) + gambar (upload kompres WebP / URL).
import React, { useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ImagePlus,
  Link2,
  Maximize2,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import type { Flashcard3DCard, Flashcard3DDeck, Flashcard3DFace } from '../../types/flashcard3d';
import { compressImageFile, makeId } from '../../utils/flashcard3dStorage';

interface DeckEditorProps {
  initialDeck?: Flashcard3DDeck | null;
  onSave: (deck: Flashcard3DDeck) => Promise<void>;
  onCancel: () => void;
  onZoomImage: (src: string) => void;
  onToast: (msg: string, icon?: string) => void;
}

function emptyCard(): Flashcard3DCard {
  return { id: makeId('c'), front: { text: '', image: null }, back: { text: '', image: null } };
}

export const DeckEditor: React.FC<DeckEditorProps> = ({
  initialDeck,
  onSave,
  onCancel,
  onZoomImage,
  onToast,
}) => {
  const [title, setTitle] = useState(initialDeck?.title || '');
  const [cards, setCards] = useState<Flashcard3DCard[]>(() =>
    initialDeck?.cards.length
      ? initialDeck.cards.map((c) => ({ ...c, front: { ...c.front }, back: { ...c.back } }))
      : [emptyCard()]
  );
  const [urlInputOpen, setUrlInputOpen] = useState<Record<string, boolean>>({});
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  const updateFace = (cardId: string, side: 'front' | 'back', patch: Partial<Flashcard3DFace>) => {
    setError(null);
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, [side]: { ...c[side], ...patch } } : c))
    );
  };

  const handleImageUpload = async (cardId: string, side: 'front' | 'back', file?: File | null) => {
    if (!file) return;
    const key = `${cardId}_${side}`;
    setUploadingKey(key);
    try {
      const dataUrl = await compressImageFile(file);
      updateFace(cardId, side, { image: dataUrl });
      onToast('Gambar ditambahkan.');
    } catch (err: any) {
      setError(err?.message || 'Gagal memproses gambar. Coba file JPG/PNG/WebP lain.');
    } finally {
      setUploadingKey(null);
    }
  };

  const addCard = () => {
    setCards((prev) => [...prev, emptyCard()]);
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }));
  };

  const removeCard = (cardId: string) => {
    setCards((prev) => (prev.length <= 1 ? [emptyCard()] : prev.filter((c) => c.id !== cardId)));
  };

  const moveCard = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= cards.length) return;
    setCards((prev) => {
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Judul deck belum diisi. Beri nama singkat agar mudah ditemukan.');
      return;
    }

    const cleaned: Flashcard3DCard[] = [];
    for (let i = 0; i < cards.length; i++) {
      const c = cards[i];
      const fText = c.front.text.trim();
      const bText = c.back.text.trim();
      const fImg = c.front.image?.trim() || null;
      const bImg = c.back.image?.trim() || null;
      const frontEmpty = !fText && !fImg;
      const backEmpty = !bText && !bImg;
      if (frontEmpty && backEmpty) continue; // Abaikan baris benar-benar kosong
      if (frontEmpty || backEmpty) {
        setError(`Kartu #${i + 1} belum lengkap: isi teks atau gambar di kedua sisi (depan dan belakang).`);
        return;
      }
      cleaned.push({ id: c.id, front: { text: fText, image: fImg }, back: { text: bText, image: bImg }, tags: c.tags });
    }

    if (!cleaned.length) {
      setError('Minimal harus ada 1 kartu lengkap sebelum menyimpan deck.');
      return;
    }

    setSaving(true);
    try {
      const now = Date.now();
      const deck: Flashcard3DDeck = {
        id: initialDeck?.id || makeId('d'),
        title: trimmedTitle,
        cards: cleaned,
        createdAt: initialDeck?.createdAt || now,
        updatedAt: now,
        lastOpenedAt: initialDeck?.lastOpenedAt ?? null,
      };
      await onSave(deck);
    } catch {
      setError('Gagal menyimpan deck ke perangkat. Coba kurangi ukuran gambar atau ulangi.');
    } finally {
      setSaving(false);
    }
  };

  const renderFaceEditor = (card: Flashcard3DCard, side: 'front' | 'back') => {
    const face = card[side];
    const key = `${card.id}_${side}`;
    const isUploading = uploadingKey === key;
    const isUrlOpen = !!urlInputOpen[key];
    const label = side === 'front' ? 'Muka depan' : 'Muka belakang';
    const placeholder =
      side === 'front'
        ? 'Pertanyaan klinis, istilah, atau deskripsi kasus...'
        : 'Jawaban atau keterangan (mendukung **tebal**, *miring*, dan daftar)...';

    return (
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor={`fc3d-ta-${key}`}
            className={`text-xs font-bold ${
              side === 'back' ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            {label}
          </label>
          <div className="flex items-center gap-1.5">
            <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg liquid-glass-subtle-interactive text-[11px] font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
              <ImagePlus className="w-3.5 h-3.5" />
              <span>{isUploading ? 'Memproses...' : 'Gambar'}</span>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={isUploading}
                onChange={(e) => {
                  handleImageUpload(card.id, side, e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </label>
            <button
              type="button"
              onClick={() => setUrlInputOpen((prev) => ({ ...prev, [key]: !prev[key] }))}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                isUrlOpen
                  ? 'bg-indigo-600/15 text-indigo-700 dark:text-indigo-300'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Tempel URL gambar"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>URL</span>
            </button>
          </div>
        </div>

        {isUrlOpen && (
          <input
            type="url"
            value={face.image && !face.image.startsWith('data:') ? face.image : ''}
            onChange={(e) => updateFace(card.id, side, { image: e.target.value || null })}
            placeholder="https://contoh.com/gambar.jpg"
            className="w-full px-3 py-2 rounded-xl text-xs liquid-glass-input text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
          />
        )}

        {face.image && (
          <div className="relative inline-flex items-center gap-3 p-2 rounded-xl fc3d-chip w-fit max-w-full">
            <img
              src={face.image}
              alt={`Pratinjau ${label.toLowerCase()}`}
              className="h-16 w-24 object-contain rounded-lg bg-slate-950/5 dark:bg-black/25"
            />
            <div className="flex flex-col gap-1 pr-1">
              <button
                type="button"
                onClick={() => onZoomImage(face.image!)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
              >
                <Maximize2 className="w-3 h-3" /> Lihat
              </button>
              <button
                type="button"
                onClick={() => updateFace(card.id, side, { image: null })}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 cursor-pointer"
              >
                <X className="w-3 h-3" /> Hapus
              </button>
            </div>
          </div>
        )}

        <textarea
          id={`fc3d-ta-${key}`}
          rows={4}
          value={face.text}
          onChange={(e) => updateFace(card.id, side, { text: e.target.value })}
          placeholder={placeholder}
          className="w-full px-3.5 py-2.5 rounded-xl text-sm leading-relaxed liquid-glass-input text-slate-900 dark:text-slate-100 placeholder:text-slate-400 resize-y fc3d-scroll"
        />
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto pb-28 lg:pb-12 animate-fade-in">
      {/* Header sticky */}
      <div className="sticky top-2 z-20 mb-6 px-4 py-3 rounded-2xl liquid-glass-card flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onCancel}
            aria-label="Batal"
            className="w-9 h-9 rounded-xl liquid-glass-subtle-interactive flex items-center justify-center text-slate-700 dark:text-slate-200 shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-50 truncate">
              {initialDeck ? 'Edit Deck' : 'Buat Deck Baru'}
            </h1>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums">
              {cards.length} kartu
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer inline-flex items-center gap-2 shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Menyimpan...' : 'Simpan'}</span>
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 px-4 py-3 rounded-2xl bg-rose-500/12 border border-rose-500/30 text-xs sm:text-sm font-semibold text-rose-700 dark:text-rose-300"
        >
          {error}
        </div>
      )}

      {/* Judul deck */}
      <div className="mb-6">
        <label htmlFor="fc3d-deck-title" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
          Judul deck
        </label>
        <input
          id="fc3d-deck-title"
          type="text"
          value={title}
          onChange={(e) => {
            setError(null);
            setTitle(e.target.value);
          }}
          placeholder="Mis. Kunci Latihan Soal 2018 atau Farmakologi Kardiovaskular"
          className="w-full px-4 py-3 rounded-2xl text-sm sm:text-base font-semibold liquid-glass-input text-slate-900 dark:text-slate-50 placeholder:text-slate-400"
        />
      </div>

      {/* Daftar kartu */}
      <div className="space-y-4">
        {cards.map((card, idx) => (
          <section key={card.id} className="fc3d-panel rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200/70 dark:border-white/10">
              <span className="text-xs font-bold tabular-nums text-slate-600 dark:text-slate-300">
                Kartu {idx + 1}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveCard(idx, -1)}
                  disabled={idx === 0}
                  aria-label="Geser kartu ke atas"
                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveCard(idx, 1)}
                  disabled={idx === cards.length - 1}
                  aria-label="Geser kartu ke bawah"
                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => removeCard(card.id)}
                  aria-label="Hapus kartu"
                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {renderFaceEditor(card, 'front')}
              {renderFaceEditor(card, 'back')}
            </div>
          </section>
        ))}
      </div>

      {/* Tambah kartu */}
      <div ref={bottomRef} className="mt-5">
        <button
          type="button"
          onClick={addCard}
          className="w-full py-3.5 rounded-2xl liquid-glass-subtle-interactive text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Tambah kartu baru
        </button>
      </div>
    </form>
  );
};
