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

export default function NoteEditorModal({
  theme, isOpen, editingNote, noteRefQuestion, onClose, onCreateNote, onUpdateNote, onSuccess, onError,
}: NoteEditorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className={`relative w-full max-w-lg rounded-2xl p-6 shadow-2xl animate-scale-up ${theme === 'dark' ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-200'}`}>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
          <X className="w-5 h-5" />
        </button>
        
        <h3 className="text-lg font-black mb-4">{editingNote ? 'Edit Catatan' : 'Buat Catatan Baru'}</h3>
        
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
            <label className="block text-xs font-bold text-slate-500 mb-1">Judul</label>
            <input name="title" defaultValue={editingNote?.title || ''} required className="w-full px-3 py-2 rounded-lg border bg-transparent outline-none focus:border-indigo-500 dark:border-slate-700" placeholder="Contoh: Klasifikasi Gagal Jantung" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Catatan</label>
            <textarea name="content" defaultValue={editingNote?.content || ''} required rows={4} className="w-full px-3 py-2 rounded-lg border bg-transparent outline-none focus:border-indigo-500 dark:border-slate-700" placeholder="Ketik catatan di sini..." />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Warna</label>
            <div className="flex gap-2">
              {['indigo', 'emerald', 'amber', 'rose', 'purple'].map(color => (
                <label key={color} className="relative cursor-pointer">
                  <input type="radio" name="color" value={color} defaultChecked={(editingNote?.color || 'indigo') === color} className="peer sr-only" />
                  <div className={`w-8 h-8 rounded-full bg-${color}-500 border-2 border-transparent peer-checked:border-white dark:peer-checked:border-slate-900 peer-checked:ring-2 peer-checked:ring-indigo-500 shadow-sm transition-all hover:scale-110`} />
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Tags (Pisahkan dengan koma)</label>
            <input name="tags" defaultValue={editingNote?.tags?.join(', ') || ''} className="w-full px-3 py-2 rounded-lg border bg-transparent outline-none focus:border-indigo-500 dark:border-slate-700" placeholder="Kardiologi, EKG, dll" />
          </div>
          
          <div className="pt-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
              Batal
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg font-bold bg-indigo-500 text-white hover:bg-indigo-600 transition shadow-lg shadow-indigo-500/20">
              Simpan Catatan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
