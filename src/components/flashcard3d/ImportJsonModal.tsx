// src/components/flashcard3d/ImportJsonModal.tsx
// Modal import JSON massal (file .json atau tempel teks) + unduh template + salin prompt AI.
import React, { useMemo, useRef, useState } from 'react';
import { Check, Download, FileUp, Sparkles, X } from 'lucide-react';
import { parseDecksFromJson } from '../../utils/flashcard3dStorage';
import { FLASHCARD3D_AI_PROMPT } from './sampleDeck';

interface ImportJsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (jsonText: string, fallbackTitle?: string) => Promise<void>;
  onToast: (msg: string, icon?: string) => void;
}

export const ImportJsonModal: React.FC<ImportJsonModalProps> = ({
  isOpen,
  onClose,
  onImport,
  onToast,
}) => {
  const [rawJson, setRawJson] = useState('');
  const [fileTitle, setFileTitle] = useState<string | undefined>(undefined);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [importing, setImporting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
      await onImport(rawJson, fileTitle);
      setRawJson('');
      setFileTitle(undefined);
      onClose();
    } catch (err: any) {
      setSubmitError(err?.message || 'Gagal mengimpor deck.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/55 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="fc3d-import-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl max-h-[88dvh] overflow-y-auto fc3d-scroll rounded-[24px] liquid-glass-card p-5 sm:p-6 text-slate-900 dark:text-slate-100 animate-scale-in"
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

        {/* Textarea paste JSON */}
        <div className="mt-4">
          <textarea
            rows={8}
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
            {importing ? 'Mengimpor...' : 'Import Deck'}
          </button>
        </div>
      </div>
    </div>
  );
};
