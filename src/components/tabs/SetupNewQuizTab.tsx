import React from 'react';
import { BookOpen, Play, Trash, Trash2, Info } from 'lucide-react';

interface SetupNewQuizTabProps {
  theme: string;
  selectedDatabases: string[];
  setSelectedDatabases: any;
  setDashboardTab: any;
  quizMode: string;
  setQuizMode: any;
  shuffleQuestions: boolean;
  setShuffleQuestions: any;
  shuffleOptions: boolean;
  setShuffleOptions: any;
  startQuiz: any;
  globalDatabases: string[];
  removeDatabase: any;
  keyboardNavEnabled: boolean;
  setKeyboardNavEnabled: any;
  isAdaptiveMode: boolean;
  setIsAdaptiveMode: any;
  regularTimerEnabled?: boolean;
  setRegularTimerEnabled?: (enabled: boolean) => void;
}

export const SetupNewQuizTab: React.FC<SetupNewQuizTabProps> = ({
  theme, selectedDatabases, setSelectedDatabases, setDashboardTab,
  quizMode, setQuizMode, shuffleQuestions, setShuffleQuestions,
  shuffleOptions, setShuffleOptions, startQuiz, globalDatabases, removeDatabase, keyboardNavEnabled, setKeyboardNavEnabled, isAdaptiveMode, setIsAdaptiveMode,
  regularTimerEnabled = true, setRegularTimerEnabled
}) => {
  return (
    <div className="space-y-4 sm:space-y-6 max-w-2xl mx-auto animate-fade-in">
      <div className="p-4 sm:p-7 rounded-2xl liquid-glass-card space-y-5 sm:space-y-6">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Konfigurasi Kuis CBT Baru
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Atur cara penyajian soal dan mulailah simulasi try-out Anda.
          </p>
        </div>

        {selectedDatabases.length === 0 ? (
          <div className="text-center py-10 px-4 rounded-xl liquid-glass-subtle">
            <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Anda belum memilih bank soal untuk diujikan.</p>
            <button
              onClick={() => setDashboardTab('banks')}
              className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl mt-4 cursor-pointer shadow-sm shadow-indigo-600/20 transition-colors"
            >
              Pilih Bank Soal Terlebih Dahulu
            </button>
          </div>
        ) : (
          <>
            {/* Selected Databases Summary list */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider tabular-nums">
                Bank Soal Terpilih ({selectedDatabases.length})
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedDatabases.map((key) => (
                  <span 
                    key={key} 
                    className="max-w-full min-w-0 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20 flex items-center gap-2"
                  >
                    <span className="truncate min-w-0">{key.split('/').pop()}</span>
                    <button 
                      onClick={() => setSelectedDatabases((prev: string[]) => prev.filter(d => d !== key))}
                      className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold shrink-0 cursor-pointer"
                      title="Hapus dari seleksi"
                    >
                      ×
                    </button>
                    {!globalDatabases.includes(key) && (
                      <button 
                        onClick={() => {
                          let proceed = true;
                          try {
                            proceed = window.confirm(`Hapus bank soal "${key.split('/').pop()}" secara permanen?`);
                          } catch {
                            proceed = true;
                          }
                          if (proceed) {
                            removeDatabase(key, { stopPropagation: () => {} } as React.MouseEvent);
                            setSelectedDatabases((prev: string[]) => prev.filter(d => d !== key));
                          }
                        }}
                        className="text-slate-400 hover:text-rose-500 transition-colors shrink-0 cursor-pointer"
                        title="Hapus bank soal secara permanen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>

            {/* Mode selection (Utuh/Simulasi/RMO/Blok) */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Pilihan Mode Pengerjaan Kuis
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setQuizMode('utuh')}
                  className={`flex flex-col items-start p-3.5 sm:p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    quizMode === 'utuh'
                      ? 'bg-indigo-500/15 border-indigo-500/50 text-indigo-600 dark:text-indigo-300 ring-1 ring-indigo-500/25 shadow-xs'
                      : 'liquid-glass-subtle-interactive text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 w-full">
                    <span className="text-xs font-extrabold uppercase tracking-wide">Sequential (Standar)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-500/10 font-bold shrink-0">Bebas</span>
                  </div>
                  <span className="text-[11px] opacity-80 mt-1.5 leading-relaxed">
                    Latihan fleksibel dengan pembahasan langsung per nomor & urutan asli file.
                  </span>
                </button>

                {selectedDatabases.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setQuizMode('simulasi')}
                    className={`flex flex-col items-start p-3.5 sm:p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      quizMode === 'simulasi'
                        ? 'bg-indigo-500/15 border-indigo-500/50 text-indigo-600 dark:text-indigo-300 ring-1 ring-indigo-500/25 shadow-xs'
                        : 'liquid-glass-subtle-interactive text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 w-full">
                      <span className="text-xs font-extrabold uppercase tracking-wide">Simulasi Acak</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-500 font-bold shrink-0">Campuran</span>
                    </div>
                    <span className="text-[11px] opacity-80 mt-1.5 leading-relaxed">
                      Gabung seluruh bank soal terpilih & acak merata dengan fitur cek jawaban.
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setQuizMode('rmo');
                    setIsAdaptiveMode(false);
                  }}
                  className={`flex flex-col items-start p-3.5 sm:p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    quizMode === 'rmo'
                      ? 'bg-amber-500/15 border-amber-500/50 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/25 shadow-xs'
                      : 'liquid-glass-subtle-interactive text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 w-full">
                    <span className="text-xs font-extrabold uppercase tracking-wide flex items-center gap-1">
                      🏆 Simulasi RMO
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-extrabold tabular-nums shrink-0">
                      +4 / -1 / 0
                    </span>
                  </div>
                  <span className="text-[11px] opacity-80 mt-1.5 leading-relaxed">
                    Olimpiade RMO: Benar +4, Salah -1, Kosong 0. EXP × 20. Tanpa cek jawaban saat kuis.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setQuizMode('blok');
                    setIsAdaptiveMode(false);
                  }}
                  className={`flex flex-col items-start p-3.5 sm:p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    quizMode === 'blok'
                      ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/25 shadow-xs'
                      : 'liquid-glass-subtle-interactive text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 w-full">
                    <span className="text-xs font-extrabold uppercase tracking-wide flex items-center gap-1">
                      📝 Simulasi Ujian Blok
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-extrabold tabular-nums shrink-0">
                      Maks 100 Soal
                    </span>
                  </div>
                  <span className="text-[11px] opacity-80 mt-1.5 leading-relaxed">
                    Ujian Blok: 100 soal dibagi rata dari bank soal, 1 mnt/soal, Skor +1, EXP × 10.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setQuizMode('suddendeath');
                    setIsAdaptiveMode(false);
                  }}
                  className={`flex flex-col items-start p-3.5 sm:p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    quizMode === 'suddendeath'
                      ? 'bg-rose-500/15 border-rose-500/50 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500/30 shadow-xs'
                      : 'liquid-glass-subtle-interactive text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 w-full">
                    <span className="text-xs font-extrabold uppercase tracking-wide flex items-center gap-1">
                      💀 Sudden Death
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-700 dark:text-rose-300 font-extrabold shrink-0">
                      1 Nyawa
                    </span>
                  </div>
                  <span className="text-[11px] opacity-80 mt-1.5 leading-relaxed">
                    1 kali salah langsung gugur! Berapa banyak soal sanggup kamu jawab? Bonus EXP × 25 per soal.
                  </span>
                </button>
              </div>

              {/* Mode Context Info Banner */}
              {quizMode === 'rmo' && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2.5 animate-fade-in">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold block">Aturan Simulasi RMO Aktif:</strong>
                    Skor dihitung Benar +4, Salah -1, Tidak Dijawab 0. Fitur cek jawaban dinonaktifkan (pembahasan muncul setelah kuis dikumpulkan). Bonus EXP = Total Skor × 20.
                  </div>
                </div>
              )}

              {quizMode === 'suddendeath' && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5 animate-fade-in">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold block">Aturan Sudden Death (1 Nyawa) Aktif:</strong>
                    Tantangan presisi tanpa ampun: Salah satu soal saja langsung Game Over! Capai streak ≥ 20 untuk membuka Bingkai Avatar Tengkorak Emas!
                  </div>
                </div>
              )}

              {quizMode === 'blok' && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2.5 animate-fade-in">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold block">Aturan Simulasi Ujian Blok Aktif:</strong>
                    Sistem otomatis mengambil maksimal 100 butir soal secara berimbang dari bank soal terpilih. Alokasi waktu 1 menit per soal. Skor dihitung Benar +1, Salah 0, Kosong 0. EXP = Skor × 10. Pembahasan tampil di akhir.
                  </div>
                </div>
              )}
            </div>

            {/* Checkbox configs */}
            <div className="flex flex-col gap-3 pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300 max-lg-liquid-subtle max-lg:p-3 max-lg:rounded-xl">
                <input
                  type="checkbox"
                  checked={shuffleQuestions}
                  onChange={(e) => setShuffleQuestions(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 shrink-0"
                />
                <span>Acak urutan kemunculan soal</span>
              </label>

              <label className="hidden lg:flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={keyboardNavEnabled}
                  onChange={(e) => setKeyboardNavEnabled(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>Aktifkan Navigasi Keyboard (1-5, Panah, R, M)</span>
              </label>
              
              <label className={`flex items-center gap-2.5 text-xs font-semibold ${
                quizMode === 'rmo' || quizMode === 'blok'
                  ? 'opacity-40 cursor-not-allowed text-slate-400'
                  : 'cursor-pointer text-slate-700 dark:text-slate-300'
              }`}>
                <input
                  type="checkbox"
                  disabled={quizMode === 'rmo' || quizMode === 'blok'}
                  checked={quizMode === 'rmo' || quizMode === 'blok' ? false : isAdaptiveMode}
                  onChange={(e) => setIsAdaptiveMode(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>
                  Mode Adaptif (Kecerdasan Buatan menyesuaikan level kesulitan)
                  {(quizMode === 'rmo' || quizMode === 'blok') && (
                    <span className="block text-[10px] text-slate-400 font-normal mt-0.5">
                      (Tidak tersedia pada Simulasi RMO / Ujian Blok karena seluruh bobot soal disetarakan)
                    </span>
                  )}
                </span>
              </label>

              {/* Opsi Timer Pengerjaan */}
              <div className="p-4 rounded-xl liquid-glass-subtle mt-1">
                <label className="flex items-center justify-between cursor-pointer gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">⏱️</span>
                    <div>
                      <span className="text-xs font-bold block text-slate-900 dark:text-slate-100">
                        Batas Waktu (Timer)
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {quizMode === 'rmo' || quizMode === 'blok'
                          ? 'Wajib aktif untuk mode simulasi kompetisi/blok (1 menit/soal)'
                          : regularTimerEnabled
                          ? 'Timer aktif (1 menit/soal). Kuis otomatis dikumpulkan jika waktu habis.'
                          : 'Mode Santai: Kerjakan tanpa batas waktu (Timer dimatikan)'}
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    disabled={quizMode === 'rmo' || quizMode === 'blok'}
                    checked={quizMode === 'rmo' || quizMode === 'blok' ? true : regularTimerEnabled}
                    onChange={(e) => setRegularTimerEnabled && setRegularTimerEnabled(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-5 h-5 cursor-pointer disabled:opacity-50"
                  />
                </label>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200/60 dark:border-white/10">
              <button
                onClick={startQuiz}
                disabled={selectedDatabases.length === 0}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer active:scale-98"
              >
                <Play className="w-4 h-4 fill-current" />
                Mulai Simulasi Kuis
              </button>
              
              <button
                onClick={() => setDashboardTab('banks')}
                className="px-5 py-3.5 rounded-xl text-xs font-bold liquid-glass-subtle-interactive text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Kembali Ke Bank Soal
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

