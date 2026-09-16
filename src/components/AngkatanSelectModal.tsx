import React, { useState } from 'react';
import { GraduationCap, Stethoscope, Pill, Baby } from 'lucide-react';

interface AngkatanSelectModalProps {
  theme: 'light' | 'dark';
  onSelect: (angkatan: string, prodi: string) => void;
  loading?: boolean;
  initialProdi?: string | null;
}

export default function AngkatanSelectModal({ theme, onSelect, loading, initialProdi }: AngkatanSelectModalProps) {
  const isDark = theme === 'dark';
  const [selectedProdi, setSelectedProdi] = useState<'kedokteran' | 'farmasi' | 'kebidanan'>(
    (initialProdi as any) || 'kedokteran'
  );

  const prodiOptions = [
    { id: 'kedokteran', label: 'Kedokteran', icon: Stethoscope, desc: 'Pendidikan Dokter' },
    { id: 'farmasi', label: 'Farmasi', icon: Pill, desc: 'Farmasi & Apoteker' },
    { id: 'kebidanan', label: 'Kebidanan', icon: Baby, desc: 'Kebidanan' },
  ] as const;

  const angkatanList = selectedProdi === 'farmasi'
    ? (['23', '24'] as const)
    : (['24', '25', '26'] as const);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className={`w-full max-w-sm rounded-3xl shadow-2xl p-6 sm:p-8 transition-all duration-300 ${
        isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-200'
      }`}>
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg mb-3">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h2 className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
            Pilih Prodi & Angkatan
          </h2>
          <p className={`text-xs mt-1 font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Sesuaikan prodi dan angkatan kamu untuk melihat materi yang tepat
          </p>
        </div>

        {/* Pemilihan Program Studi */}
        <div className="mb-5">
          <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 text-center">
            1. Pilih Program Studi
          </label>
          <div className="grid grid-cols-3 gap-2">
            {prodiOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = selectedProdi === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => !loading && setSelectedProdi(opt.id)}
                  disabled={loading}
                  className={`p-2.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer border text-center ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/25 ring-2 ring-indigo-500/40 scale-[1.02]'
                      : isDark
                      ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[11px] font-bold leading-tight">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Pemilihan Angkatan */}
        <div>
          <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 text-center">
            2. Pilih Angkatan
          </label>
          <div className="space-y-2.5">
            {angkatanList.map((angkatan) => (
              <button
                key={angkatan}
                type="button"
                onClick={() => !loading && onSelect(angkatan, selectedProdi)}
                disabled={loading}
                className={`w-full py-3.5 rounded-2xl font-black text-base transition-all cursor-pointer ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 hover:border-indigo-500'
                    : 'bg-slate-50 hover:bg-indigo-50 text-slate-800 border border-slate-200 hover:border-indigo-400'
                } ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
              >
                Angkatan 20{angkatan}
              </button>
            ))}
          </div>
        </div>

        <p className={`text-[10px] text-center mt-5 font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          Pilihan prodi & angkatan akan menentukan distribusi soal di akun Anda
        </p>
      </div>
    </div>
  );
}
