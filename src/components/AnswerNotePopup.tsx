import { X, StickyNote, Trash2, Save } from 'lucide-react';

interface NotePopupData {
  isOpen: boolean;
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

interface AnswerNotePopupProps {
  theme: 'light' | 'dark';
  data: NotePopupData | null;
  noteInput: string;
  onNoteInputChange: (val: string) => void;
  isSaving: boolean;
  existingNote: string | undefined;
  onClose: () => void;
  onSave: (questionText: string, content: string) => void;
  onDelete: (questionText: string) => void;
}

export default function AnswerNotePopup({
  theme, data, noteInput, onNoteInputChange, isSaving, existingNote, onClose, onSave, onDelete,
}: AnswerNotePopupProps) {
  if (!data?.isOpen) return null;

  const stripped = data.questionText.replace(/<[^>]*>/g, '');
  const truncated = stripped.length > 200 ? stripped.substring(0, 200) + '...' : stripped;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-lg rounded-2xl shadow-2xl p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200"
        style={{
          backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
          border: theme === 'dark' ? '1px solid rgb(51 65 85)' : '1px solid rgb(226 232 240)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: data.isCorrect ? 'rgb(34 197 94 / 0.15)' : 'rgb(245 158 11 / 0.15)' }}
            >
              <StickyNote
                className="w-4 h-4"
                style={{ color: data.isCorrect ? '#22c55e' : '#f59e0b' }}
              />
            </div>
            <h3 className="text-sm font-bold" style={{ color: theme === 'dark' ? '#f1f5f9' : '#0f172a' }}>
              {existingNote ? 'Edit Catatan' : 'Tambah Catatan'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
            style={{
              color: theme === 'dark' ? '#94a3b8' : '#64748b',
              backgroundColor: theme === 'dark' ? 'rgb(51 65 85 / 0.5)' : 'rgb(241 245 249)',
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Question Context */}
        <div
          className="rounded-xl p-3 text-xs leading-relaxed line-clamp-3"
          style={{
            backgroundColor: theme === 'dark' ? 'rgb(15 23 42 / 0.6)' : 'rgb(248 250 252)',
            color: theme === 'dark' ? '#cbd5e1' : '#475569',
          }}
        >
          <span className="font-semibold" style={{ color: theme === 'dark' ? '#e2e8f0' : '#334155' }}>Soal:</span>{' '}
          {truncated}
        </div>

        {!data.isCorrect && (
          <div className="flex gap-2">
            <div
              className="flex-1 rounded-xl p-3 text-xs"
              style={{
                backgroundColor: 'rgb(239 68 68 / 0.08)',
                border: '1px solid rgb(239 68 68 / 0.2)',
              }}
            >
              <span className="font-semibold text-red-400">Jawabanmu:</span>
              <p className="mt-1" style={{ color: theme === 'dark' ? '#fca5a5' : '#dc2626' }}>
                {data.userAnswer || '-'}
              </p>
            </div>
            <div
              className="flex-1 rounded-xl p-3 text-xs"
              style={{
                backgroundColor: 'rgb(34 197 94 / 0.08)',
                border: '1px solid rgb(34 197 94 / 0.2)',
              }}
            >
              <span className="font-semibold text-green-400">Jawaban Benar:</span>
              <p className="mt-1" style={{ color: theme === 'dark' ? '#86efac' : '#16a34a' }}>
                {data.correctAnswer || '-'}
              </p>
            </div>
          </div>
        )}

        {/* Note Textarea */}
        <textarea
          value={noteInput}
          onChange={(e) => onNoteInputChange(e.target.value)}
          placeholder="Tulis catatan belajar di sini... (misal: konsep yang perlu diingat, tips mnemonik, referensi halaman buku, dll)"
          rows={5}
          className="w-full rounded-xl p-4 text-sm leading-relaxed resize-none outline-none transition-all"
          style={{
            backgroundColor: theme === 'dark' ? 'rgb(15 23 42 / 0.6)' : 'rgb(248 250 252)',
            color: theme === 'dark' ? '#e2e8f0' : '#1e293b',
            border: `1px solid ${theme === 'dark' ? 'rgb(51 65 85)' : 'rgb(226 232 240)'}`,
          }}
          autoFocus
        />

        {/* Footer Buttons */}
        <div className="flex items-center justify-between gap-2">
          {existingNote ? (
            <button
              onClick={() => onDelete(data.questionText)}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" /> Hapus
            </button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              style={{
                color: theme === 'dark' ? '#94a3b8' : '#64748b',
                backgroundColor: theme === 'dark' ? 'rgb(51 65 85 / 0.5)' : 'rgb(241 245 249)',
              }}
            >
              Batal
            </button>
            <button
              onClick={() => onSave(data.questionText, noteInput)}
              disabled={isSaving || !noteInput.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-indigo-500 hover:bg-indigo-600 shadow-lg shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
