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
    <>
              <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
                <div className={`p-6 rounded-3xl border transition-all duration-300 space-y-6 ${
                  theme === 'dark'
                    ? 'bg-slate-900/40 border-white/[0.08] shadow-2xl'
                    : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div>
                    <h2 className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                      Konfigurasi Kuis CBT Baru
                    </h2>
                    <p className="text-xs text-slate-450 mt-1">
                      Atur cara penyajian soal dan mulailah simulasi try-out Anda.
                    </p>
                  </div>

                  {selectedDatabases.length === 0 ? (
                    <div className="text-center py-8">
                      <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                      <p className="text-xs font-extrabold text-slate-500">Anda belum memilih bank soal untuk diujikan.</p>
                      <button
                        onClick={() => setDashboardTab('banks')}
                        className="px-4 py-2 bg-indigo-500 text-white text-xs font-bold rounded-xl mt-4 cursor-pointer"
                      >
                        Pilih Bank Soal Terlebih Dahulu
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Selected Databases Summary list */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Bank Soal Terpilih ({selectedDatabases.length})
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {selectedDatabases.map((key) => (
                            <span 
                              key={key} 
                              className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/15 flex items-center gap-1.5"
                            >
                              <span>{key.split('/').pop()}</span>
                              <button 
                                onClick={() => setSelectedDatabases(prev => prev.filter(d => d !== key))}
                                className="text-slate-450 hover:text-slate-700 dark:hover:text-slate-200 font-extrabold"
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
                                      setSelectedDatabases(prev => prev.filter(d => d !== key));
                                    }
                                  }}
                                  className="text-slate-400 hover:text-rose-500 transition-colors"
                                  title="Hapus bank soal secara permanen"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Mode selection (Utuh/Simulasi/RMO/Blok) */}
                      <div className="space-y-2.5">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Pilihan Mode Pengerjaan Kuis
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setQuizMode('utuh')}
                            className={`flex flex-col items-start p-3.5 rounded-2xl border text-left transition-all cursor-pointer animate-fade-in-up animation-delay-75 ${
                              quizMode === 'utuh'
                                ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-500 dark:text-indigo-400 font-bold shadow-sm'
                                : 'bg-slate-950/20 dark:bg-slate-900/10 border-slate-200/60 dark:border-slate-800/80 text-slate-500 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xs font-extrabold uppercase tracking-wide">Sequential (Standar)</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-500/10 font-bold">Bebas</span>
                            </div>
                            <span className="text-[10px] opacity-70 mt-1 leading-relaxed">
                              Latihan fleksibel dengan pembahasan langsung per nomor & urutan asli file.
                            </span>
                          </button>

                          {selectedDatabases.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setQuizMode('simulasi')}
                              className={`flex flex-col items-start p-3.5 rounded-2xl border text-left transition-all cursor-pointer animate-fade-in-up animation-delay-100 ${
                                quizMode === 'simulasi'
                                  ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-500 dark:text-indigo-400 font-bold shadow-sm'
                                  : 'bg-slate-950/20 dark:bg-slate-900/10 border-slate-200/60 dark:border-slate-800/80 text-slate-500 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className="text-xs font-extrabold uppercase tracking-wide">Simulasi Acak</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-500 font-bold">Campuran</span>
                              </div>
                              <span className="text-[10px] opacity-70 mt-1 leading-relaxed">
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
                            className={`flex flex-col items-start p-3.5 rounded-2xl border text-left transition-all cursor-pointer animate-fade-in-up animation-delay-150 ${
                              quizMode === 'rmo'
                                ? 'bg-amber-500/10 border-amber-500/50 text-amber-600 dark:text-amber-400 font-bold shadow-sm'
                                : 'bg-slate-950/20 dark:bg-slate-900/10 border-slate-200/60 dark:border-slate-800/80 text-slate-500 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xs font-extrabold uppercase tracking-wide flex items-center gap-1">
                                🏆 Simulasi RMO
                              </span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300 font-black">
                                +4 / -1 / 0
                              </span>
                            </div>
                            <span className="text-[10px] opacity-70 mt-1 leading-relaxed">
                              Olimpiade RMO: Benar +4, Salah -1, Kosong 0. EXP × 20. Tanpa cek jawaban saat kuis.
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setQuizMode('blok');
                              setIsAdaptiveMode(false);
                            }}
                            className={`flex flex-col items-start p-3.5 rounded-2xl border text-left transition-all cursor-pointer animate-fade-in-up animation-delay-200 ${
                              quizMode === 'blok'
                                ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-600 dark:text-emerald-400 font-bold shadow-sm'
                                : 'bg-slate-950/20 dark:bg-slate-900/10 border-slate-200/60 dark:border-slate-800/80 text-slate-500 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xs font-extrabold uppercase tracking-wide flex items-center gap-1">
                                📝 Simulasi Ujian Blok
                              </span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-black">
                                Maks 100 Soal
                              </span>
                            </div>
                            <span className="text-[10px] opacity-70 mt-1 leading-relaxed">
                              Ujian Blok: 100 soal dibagi rata dari bank soal, 1 mnt/soal, Skor +1, EXP × 10.
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setQuizMode('suddendeath');
                              setIsAdaptiveMode(false);
                            }}
                            className={`flex flex-col items-start p-3.5 rounded-2xl border text-left transition-all cursor-pointer animate-fade-in-up animation-delay-250 ${
                              quizMode === 'suddendeath'
                                ? 'bg-rose-500/10 border-rose-500/50 text-rose-600 dark:text-rose-400 font-bold shadow-sm ring-1 ring-rose-500/30'
                                : 'bg-slate-950/20 dark:bg-slate-900/10 border-slate-200/60 dark:border-slate-800/80 text-slate-500 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xs font-extrabold uppercase tracking-wide flex items-center gap-1">
                                💀 Sudden Death
                              </span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-600 dark:text-rose-300 font-black">
                                1 Nyawa
                              </span>
                            </div>
                            <span className="text-[10px] opacity-70 mt-1 leading-relaxed">
                              1 kali salah langsung gugur! Berapa banyak soal sanggup kamu jawab? Bonus EXP × 25 per soal.
                            </span>
                          </button>
                        </div>

                        {/* Mode Context Info Banner */}
                        {quizMode === 'rmo' && (
                          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-600 dark:text-amber-300 flex items-start gap-2 animate-fade-in">
                            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <div>
                              <strong className="font-extrabold block">Aturan Simulasi RMO Aktif:</strong>
                              Skor dihitung Benar +4, Salah -1, Tidak Dijawab 0. Fitur cek jawaban dinonaktifkan (pembahasan muncul setelah kuis dikumpulkan). Bonus EXP = Total Skor × 20. Bobot kesulitan XP dinonaktifkan.
                            </div>
                          </div>
                        )}

                        {quizMode === 'suddendeath' && (
                          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-600 dark:text-rose-300 flex items-start gap-2 animate-fade-in">
                            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <div>
                              <strong className="font-extrabold block">Aturan Sudden Death (1 Nyawa) Aktif:</strong>
                              Tantangan presisi tanpa ampun: Salah satu soal saja langsung Game Over! Capai rekor streak benar beruntun setinggi mungkin. Capai streak ≥ 20 untuk membuka Bingkai Avatar Tengkorak Emas!
                            </div>
                          </div>
                        )}

                        {quizMode === 'blok' && (
                          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-600 dark:text-emerald-300 flex items-start gap-2 animate-fade-in">
                            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <div>
                              <strong className="font-extrabold block">Aturan Simulasi Ujian Blok Aktif:</strong>
                              Sistem otomatis mengambil maksimal 100 butir soal secara berimbang dari bank soal terpilih. Alokasi waktu 1 menit per soal. Skor dihitung Benar +1, Salah 0, Kosong 0. EXP = Skor × 10. Pembahasan tampil di akhir.
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Checkbox configs */}
                      <div className="flex flex-col gap-3.5 pt-2">
                        <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={shuffleQuestions}
                            onChange={(e) => setShuffleQuestions(e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                          />
                          <span>Acak urutan kemunculan soal</span>
                        </label>

                        <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={shuffleOptions}
                            onChange={(e) => setShuffleOptions(e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                          />
                          <span>Acak opsi jawaban (Pilihan Ganda)</span>
                        </label>

                        <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={keyboardNavEnabled}
                            onChange={(e) => setKeyboardNavEnabled(e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                          />
                          <span>Aktifkan Navigasi Keyboard (1-5, Panah, R, M)</span>
                        </label>
                        
                        <label className={`flex items-center gap-2.5 text-xs font-bold ${
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
                        <div className={`p-3.5 rounded-2xl border transition-all ${
                          (quizMode === 'rmo' || quizMode === 'blok' || regularTimerEnabled)
                            ? theme === 'dark' ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-indigo-50/50 border-indigo-500/20'
                            : theme === 'dark' ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <label className="flex items-center justify-between cursor-pointer">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">⏱️</span>
                              <div>
                                <span className={`text-xs font-bold block ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                                  Batas Waktu (Timer)
                                </span>
                                <span className="text-[11px] text-slate-400">
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

                      <hr className={`border-t my-2 ${theme === 'dark' ? 'border-slate-800/80' : 'border-slate-200/60'}`} />

                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <button
                          onClick={startQuiz}
                          disabled={selectedDatabases.length === 0}
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/10 hover:scale-[1.01] transition-all disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer animate-scale-in animation-delay-300"
                        >
                          <Play className="w-4 h-4 fill-current" />
                          Mulai Simulasi Kuis
                        </button>
                        
                        <button
                          onClick={() => setDashboardTab('banks')}
                          className={`px-5 py-4 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all border ${
                            theme === 'dark'
                              ? 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          Kembali Ke Bank Soal
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
    </>
  );
};
