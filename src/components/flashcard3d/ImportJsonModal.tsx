// src/components/flashcard3d/ImportJsonModal.tsx
// Modal import JSON massal (file .json atau tempel teks) + unduh template + salin prompt AI.
// Untuk admin: menyediakan opsi publikasi ke semua user (dengan target Prodi & Angkatan opsional).
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Download, FileUp, Globe, Lock, Sparkles, X } from 'lucide-react';
import { parseDecksFromJson } from '../../utils/flashcard3dStorage';
import type { PublishOptions } from '../../hooks/useFlashcardDecks';
import { FLASHCARD3D_AI_PROMPT } from './sampleDeck';

interface ImportJsonModalProps {
  isOpen: boolean;
  isAdmin?: boolean;
  onClose: () => void;
  onImport: (jsonText: string, fallbackTitle?: string, pubOpts?: PublishOptions) => Promise<void>;
  onToast: (msg: string, icon?: string) => void;
}

export const ImportJsonModal: React.FC<ImportJsonModalProps> = ({
  isOpen,
  isAdmin = false,
  onClose,
  onImport,
  onToast,
}) => {
  const [rawJson, setRawJson] = useState('');
  const [fileTitle, setFileTitle] = useState<string | undefined>(undefined);
  const [isPublic, setIsPublic] = useState(isAdmin);
  const [prodi, setProdi] = useState('all');
  const [angkatan, setAngkatan] = useState('all');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [importing, setImporting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) setIsPublic(isAdmin);
  }, [isOpen, isAdmin]);

  const preview = useMemo(() => {
    const trimmed = rawJson.trim();
    if (!trimmed) return { status: 'empty' as const };
    try {
      const decks = parseDecksFromJson(trimmed, fileTitle || 'Deck Impor');
      const totalCards = decks.reduce((sum, d) => sum + d.cards.length, 0);
      return { status: 'valid' as const, decksCount: decks.length, totalCards, firstTitle: decks[0].title };
    } catch (err: any) {
      return { status: 'error' as const, message: err?.message || 'Format JSON belum sesuai.' };
    }
  }, [rawJson, fileTitle]);

  if (!isOpen) return null;

  const handleFile = (file?: File | null) => {
    if (!file) return;
    setSubmitError(null);
    const baseName = file.name.replace(/\.json$/i, '').replace(/[_-]+/g, ' ').trim();
    setFileTitle(baseName || undefined);
    const reader = new FileReader();
    reader.onload = () => setRawJson(String(reader.result || ''));
    reader.onerror = () => setSubmitError('File tidak bisa dibaca. Pastikan berkas berupa JSON teks.');
    reader.readAsText(file);
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(FLASHCARD3D_AI_PROMPT);
      setCopiedPrompt(true);
      onToast('Prompt AI disalin. Tempel di ChatGPT/Gemini lalu masukkan materimu.');
      setTimeout(() => setCopiedPrompt(false), 2200);
    } catch {
      onToast('Gagal menyalin otomatis. Unduh panduan dari tombol template.');
    }
  };

  const handleSubmit = async () => {
    if (preview.status !== 'valid') return;
    setImporting(true);
    setSubmitError(null);
    try {
      await onImport(
        rawJson,
        fileTitle,
        isAdmin ? { isPublic, prodi, angkatan } : { isPublic: false }
      );
      setRawJson('');
      setFileTitle(undefined);
      onClose();
    } catch (err: any) {
      setSubmitError(err?.message || 'Gagal mengimpor deck.');
    } finally {
      setImporting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/55 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="fc3d-import-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-xl max-h-[90dvh] sm:max-h-[88dvh] overflow-y-auto fc3d-scroll rounded-t-[28px] sm:rounded-[24px] liquid-glass-card p-4 sm:p-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-6 text-slate-900 dark:text-slate-100 animate-scale-in"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="fc3d-import-title" className="text-lg font-extrabold tracking-tight">
              Import Flashcard JSON
            </h2>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              Unggah file <code className="font-mono text-[11px]">.json</code> atau tempel hasil generate AI.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Utility bar: Template & Prompt AI */}
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href="/template_flashcard3d.json"
            download="template_flashcard3d.json"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl liquid-glass-subtle-interactive text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <Download className="w-3.5 h-3.5" />
            Unduh template
          </a>
          <button
            type="button"
            onClick={handleCopyPrompt}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl liquid-glass-subtle-interactive text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Sparkles className="w-3.5 h-3.5 text-indigo-500" />}
            {copiedPrompt ? 'Prompt tersalin' : 'Salin prompt AI'}
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl liquid-glass-subtle-interactive text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <FileUp className="w-3.5 h-3.5" />
            Pilih file .json
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="sr-only"
            onChange={(e) => {
              handleFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </div>

        {/* Opsi distribusi (khusus Admin) */}
        {isAdmin && (
          <div className="mt-4 pt-3.5 border-t border-slate-200/70 dark:border-white/10 flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Visibilitas deck</span>
              <div className="inline-flex p-1 rounded-xl fc3d-segment">
                <button
                  type="button"
                  onClick={() => setIsPublic(true)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    isPublic
                      ? 'fc3d-segment-pill text-slate-950 dark:text-white'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  Publik (Semua User)
                </button>
                <button
                  type="button"
                  onClick={() => setIsPublic(false)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    !isPublic
                      ? 'fc3d-segment-pill text-slate-950 dark:text-white'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  Pribadi
                </button>
              </div>
            </div>

            {isPublic && (
              <div className="grid grid-cols-2 gap-2.5">
                <select
                  aria-label="Target Prodi"
                  value={prodi}
                  onChange={(e) => setProdi(e.target.value)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold liquid-glass-input text-slate-800 dark:text-slate-100"
                >
                  <option value="all">Semua Prodi</option>
                  <option value="kedokteran">Kedokteran</option>
                  <option value="farmasi">Farmasi</option>
                  <option value="kebidanan">Kebidanan</option>
                </select>
                <select
                  aria-label="Target Angkatan"
                  value={angkatan}
                  onChange={(e) => setAngkatan(e.target.value)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold liquid-glass-input text-slate-800 dark:text-slate-100"
                >
                  <option value="all">Semua Angkatan</option>
                  <option value="2024">Angkatan 2024</option>
                  <option value="2025">Angkatan 2025</option>
                  <option value="2026">Angkatan 2026</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* Textarea paste JSON */}
        <div className="mt-4">
          <textarea
            rows={7}
            value={rawJson}
            onChange={(e) => {
              setSubmitError(null);
              setRawJson(e.target.value);
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFile(e.dataTransfer.files?.[0]);
            }}
            placeholder={`{\n  "type": "flashcard3d",\n  "title": "Kunci Latihan Soal 2018",\n  "cards": [\n    { "front": { "text": "Pertanyaan..." }, "back": { "text": "Keterangan..." } }\n  ]\n}`}
            className="w-full px-3.5 py-3 rounded-2xl font-mono text-xs leading-relaxed liquid-glass-input text-slate-900 dark:text-slate-100 placeholder:text-slate-400 resize-y fc3d-scroll"
          />
        </div>

        {/* Status validasi */}
        <div className="mt-3 min-h-[24px]">
          {submitError && (
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">{submitError}</p>
          )}
          {!submitError && preview.status === 'error' && (
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">{preview.message}</p>
          )}
          {!submitError && preview.status === 'valid' && (
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 tabular-nums">
              <Check className="w-3.5 h-3.5" />
              Siap diimpor: {preview.decksCount > 1 ? `${preview.decksCount} deck (${preview.totalCards} kartu)` : `"${preview.firstTitle}" (${preview.totalCards} kartu)`}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold liquid-glass-subtle-interactive text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={preview.status !== 'valid' || importing}
            onClick={handleSubmit}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-45 disabled:pointer-events-none text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            {importing ? 'Mengunggah...' : isAdmin && isPublic ? 'Import & Publikasikan' : 'Import Deck'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
