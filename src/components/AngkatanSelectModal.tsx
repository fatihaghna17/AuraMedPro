import React from 'react';
import { GraduationCap } from 'lucide-react';

interface AngkatanSelectModalProps {
  theme: 'light' | 'dark';
  onSelect: (angkatan: '24' | '25' | '26') => void;
  loading?: boolean;
}

export default function AngkatanSelectModal({ theme, onSelect, loading }: AngkatanSelectModalProps) {
  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className={`w-full max-w-sm rounded-3xl shadow-2xl p-8 transition-all duration-300 ${
        isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-200'
      }`}>
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg mb-4">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h2 className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
            Pilih Angkatan
          </h2>
          <p className={`text-xs mt-2 font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Pilih angkatan kamu untuk melihat soal yang sesuai
          </p>
        </div>

        <div className="space-y-3">
          {(['24', '25', '26'] as const).map((angkatan) => (
            <button
              key={angkatan}
              onClick={() => !loading && onSelect(angkatan)}
              disabled={loading}
              className={`w-full py-4 rounded-2xl font-black text-lg transition-all cursor-pointer
                ${isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 hover:border-indigo-500'
                  : 'bg-slate-50 hover:bg-indigo-50 text-slate-800 border border-slate-200 hover:border-indigo-400'
                }
                ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'}
              `}
            >
              Angkatan 20{angkatan}
            </button>
          ))}
        </div>

        <p className={`text-[10px] text-center mt-6 font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          Pilihan ini tidak bisa diubah setelah dipilih
        </p>
      </div>
    </div>
  );
}
