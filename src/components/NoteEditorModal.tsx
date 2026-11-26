import { X } from 'lucide-react';
import { generateQuestionFingerprint } from '../utils/srsAlgorithm';

interface NoteEditorModalProps {
  theme: 'light' | 'dark';
  isOpen: boolean;
  editingNote: any;
  noteRefQuestion: { q: any; bankName: string } | null;
  onClose: () => void;
  onCreateNote: (data: any) => Promise<void>;
  onUpdateNote: (id: string, data: any) => Promise<void>;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

const NOTE_SWATCH_COLORS: Record<string, string> = {
  indigo: 'bg-indigo-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  purple: 'bg-purple-500',
};

export default function NoteEditorModal({
  theme, isOpen, editingNote, noteRefQuestion, onClose, onCreateNote, onUpdateNote, onSuccess, onError,
}: NoteEditorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative w-full sm:max-w-lg max-h-[90dvh] overflow-y-auto rounded-t-[28px] sm:rounded-2xl p-5 sm:p-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-6 shadow-2xl animate-scale-up liquid-glass-card text-slate-900 dark:text-white">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-xl liquid-glass-subtle-interactive text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
          <X className="w-4 h-4" />
        </button>
        
        <h3 className="text-lg font-black mb-4 pr-8">{editingNote ? 'Edit Catatan' : 'Buat Catatan Baru'}</h3>
        
        <form onSubmit={async (e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const title = formData.get('title') as string;
          const content = formData.get('content') as string;
          const color = formData.get('color') as any;
          const tagsRaw = formData.get('tags') as string;
          const tags = tagsRaw.split(',').map(t => t.trim()).filter(t => t);
          
          try {
            if (editingNote) {
              await onUpdateNote(editingNote.id, { title, content, color, tags });
              onSuccess('Catatan berhasil diperbarui!');
            } else {
              await onCreateNote({
                title, content, color, tags, is_pinned: false,
                question_ref: noteRefQuestion ? generateQuestionFingerprint(noteRefQuestion.q) : undefined,
                question_bank_name: noteRefQuestion ? noteRefQuestion.bankName : undefined,
              });
              onSuccess('Catatan berhasil dibuat!');
            }
            onClose();
          } catch(err) {
            onError('Gagal menyimpan catatan');
          }
        }} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Judul</label>
            <input name="title" defaultValue={editingNote?.title || ''} required className="w-full px-3.5 py-2.5 rounded-xl outline-none liquid-glass-input text-sm text-slate-900 dark:text-white placeholder-slate-400" placeholder="Contoh: Klasifikasi Gagal Jantung" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Catatan</label>
            <textarea name="content" defaultValue={editingNote?.content || ''} required rows={4} className="w-full px-3.5 py-2.5 rounded-xl outline-none liquid-glass-input text-sm text-slate-900 dark:text-white placeholder-slate-400" placeholder="Ketik catatan di sini..." />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Warna</label>
            <div className="flex flex-wrap gap-2.5">
              {['indigo', 'emerald', 'amber', 'rose', 'purple'].map(color => (
                <label key={color} className="relative cursor-pointer">
                  <input type="radio" name="color" value={color} defaultChecked={(editingNote?.color || 'indigo') === color} className="peer sr-only" />
                  <div className={`w-8 h-8 rounded-full ${NOTE_SWATCH_COLORS[color]} border-2 border-transparent peer-checked:border-white dark:peer-checked:border-slate-900 peer-checked:ring-2 peer-checked:ring-indigo-500 shadow-sm transition-all hover:scale-110`} />
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Tags (Pisahkan dengan koma)</label>
            <input name="tags" defaultValue={editingNote?.tags?.join(', ') || ''} className="w-full px-3.5 py-2.5 rounded-xl outline-none liquid-glass-input text-sm text-slate-900 dark:text-white placeholder-slate-400" placeholder="Kardiologi, EKG, dll" />
          </div>
          
          <div className="pt-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 sm:py-2 rounded-xl text-xs font-bold liquid-glass-subtle-interactive text-slate-700 dark:text-slate-300 transition cursor-pointer">
              Batal
            </button>
            <button type="submit" className="px-4 py-2.5 sm:py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500 transition shadow-lg shadow-indigo-500/20 cursor-pointer">
              Simpan Catatan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
