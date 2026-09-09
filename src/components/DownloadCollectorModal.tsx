import React, { useState } from 'react';
import { Download, FileJson, Files, Package, X, Loader2 } from 'lucide-react';
import { Question } from '../types';

interface DownloadCollectorModalProps {
  isOpen: boolean;
  theme: string;
  onClose: () => void;
  questionDatabase: Record<string, Question[]>;
  selectedDatabases: string[];
  triggerToast: (msg: string, icon?: string) => void;
  profileUsername: string;
}

export const DownloadCollectorModal: React.FC<DownloadCollectorModalProps> = ({
  isOpen,
  theme,
  onClose,
  questionDatabase,
  selectedDatabases,
  triggerToast,
  profileUsername,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');

  if (!isOpen) return null;

  const allKeys = Object.keys(questionDatabase);
  const totalQuestions = Object.values(questionDatabase).reduce((sum: number, qList: any) => sum + (qList?.length || 0), 0);

  const selectedKeys = selectedDatabases.filter(k => questionDatabase[k]);
  const selectedQuestionsCount = selectedKeys.reduce((sum, k) => sum + (questionDatabase[k]?.length || 0), 0);

  const executeDownload = async (mode: 'bundle' | 'batch', onlySelected = false) => {
    const targetKeys = onlySelected ? selectedKeys : allKeys;

    if (targetKeys.length === 0) {
      triggerToast('Tidak ada bank soal yang dipilih', '⚠️');
      return;
    }

    setIsExporting(true);

    try {
      if (mode === 'bundle') {
        setProgressMsg('Menyiapkan berkas gabungan...');
        const bundleData: Record<string, Question[]> = {};
        let totalCount = 0;
        targetKeys.forEach(k => {
          bundleData[k] = questionDatabase[k] || [];
          totalCount += (questionDatabase[k] || []).length;
        });

        const exportPayload = {
          auramedpro_export: {
            app: 'AuraMedPro',
            version: '2.0',
            exported_at: new Date().toISOString(),
            exported_by: profileUsername || 'collector',
            scope: onlySelected ? 'selected' : 'all',
            total_banks: targetKeys.length,
            total_questions: totalCount,
          },
          databases: bundleData
        };

        const dateStr = new Date().toISOString().split('T')[0];
        const filename = onlySelected 
          ? `auramedpro_terpilih_${targetKeys.length}_bank_${dateStr}.json`
          : `auramedpro_semua_bank_soal_${dateStr}.json`;

        const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const downloadAnchor = document.createElement('a');
        downloadAnchor.href = url;
        downloadAnchor.download = filename;
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        URL.revokeObjectURL(url);

        triggerToast(`Berhasil mengunduh ${targetKeys.length} bank soal (${totalCount} soal)`, '📦');
        onClose();
      } else {
        // Mode 'batch'
        for (let i = 0; i < targetKeys.length; i++) {
          const key = targetKeys[i];
          setProgressMsg(`Mengunduh file ${i + 1} dari ${targetKeys.length}: ${key}...`);
          const questions = questionDatabase[key] || [];
          const blob = new Blob([JSON.stringify(questions, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const downloadAnchor = document.createElement('a');
          downloadAnchor.href = url;
          downloadAnchor.download = key.endsWith('.json') || key.endsWith('.yaml') || key.endsWith('.yml') ? key : `${key}.json`;
          document.body.appendChild(downloadAnchor);
          downloadAnchor.click();
          downloadAnchor.remove();
          URL.revokeObjectURL(url);

          // Stagger download agar browser tidak mendeteksi sebagai spam popup
          await new Promise(res => setTimeout(res, 200));
        }

        triggerToast(`Selesai mengunduh ${targetKeys.length} file bank soal`, '✅');
        onClose();
      }
    } catch (err) {
      console.error('Download all error:', err);
      triggerToast('Gagal mengunduh soal', '❌');
    } finally {
      setIsExporting(false);
      setProgressMsg('');
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div 
        className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl border transition-all ${
          theme === 'dark' 
            ? 'bg-slate-900 border-white/[0.08] text-white' 
            : 'bg-white border-slate-200 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black">Unduh Semua Soal</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Fitur eksklusif Akun Collector AuraMedPro
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ringkasan Bank Soal */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Bank Soal</span>
              <span className="text-lg font-black text-emerald-500">{allKeys.length} Bank</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Soal</span>
              <span className="text-lg font-black text-indigo-500">{totalQuestions.toLocaleString()} Soal</span>
            </div>
          </div>
          {selectedKeys.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-500">Bank Terpilih saat ini:</span>
              <span className="font-bold text-amber-500">{selectedKeys.length} Bank ({selectedQuestionsCount} Soal)</span>
            </div>
          )}
        </div>

        {/* Loading progress if active */}
        {isExporting && (
          <div className="mt-4 p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-indigo-500 animate-spin flex-shrink-0" />
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 truncate">
              {progressMsg || 'Sedang memproses pengunduhan...'}
            </span>
          </div>
        )}

        {/* Opsi Pilihan Pengunduhan */}
        <div className="mt-5 space-y-3">
          <button
            onClick={() => executeDownload('bundle', false)}
            disabled={isExporting}
            className={`w-full p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all group cursor-pointer ${
              theme === 'dark'
                ? 'bg-slate-950/40 border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-500/5'
                : 'bg-slate-50/70 border-slate-200 hover:border-emerald-500/50 hover:bg-emerald-50/50'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
              <Package className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-emerald-500 transition-colors">
                  1 Berkas Gabungan (.json)
                </span>
                <span className="px-2 py-0.5 text-[9px] font-extrabold bg-emerald-500/10 text-emerald-500 rounded-full">
                  Direkomendasikan
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Seluruh {allKeys.length} bank soal dan {totalQuestions} pertanyaan disatukan dalam 1 file JSON komprehensif berstruktur rapi.
              </p>
            </div>
          </button>

          <button
            onClick={() => executeDownload('batch', false)}
            disabled={isExporting}
            className={`w-full p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all group cursor-pointer ${
              theme === 'dark'
                ? 'bg-slate-950/40 border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-500/5'
                : 'bg-slate-50/70 border-slate-200 hover:border-indigo-500/50 hover:bg-indigo-50/50'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-500 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
              <Files className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-500 transition-colors">
                Semua Berkas Terpisah (Batch .json)
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Setiap bank soal akan otomatis diunduh secara berurutan sebagai file individual terpisah ({allKeys.length} file).
              </p>
            </div>
          </button>

          {selectedKeys.length > 0 && (
            <button
              onClick={() => executeDownload('bundle', true)}
              disabled={isExporting}
              className={`w-full p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all group cursor-pointer ${
                theme === 'dark'
                  ? 'bg-slate-950/40 border-slate-800 hover:border-amber-500/50 hover:bg-amber-500/5'
                  : 'bg-slate-50/70 border-slate-200 hover:border-amber-500/50 hover:bg-amber-50/50'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                <FileJson className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-amber-500 transition-colors">
                  Hanya Bank Terpilih Saja ({selectedKeys.length} Bank)
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Hanya mengekspor kuis yang saat ini sedang Anda centang/pilih ({selectedQuestionsCount} soal).
                </p>
              </div>
            </button>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            disabled={isExporting}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              theme === 'dark'
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
