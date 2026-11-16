import React from 'react';
import { Brain, CheckCircle, Play, Trash, Trash2, X, CheckCircle2 } from 'lucide-react';
import { getCorrectLetterForQuestion, renderHtmlText } from '../../utils/quizUtils';
import { getIntervalLabel } from '../../utils/srsAlgorithm';

interface SetupSRSTabProps {
  theme: string;
  srs: any;
  triggerToast: any;
  srsAnswerRevealed: boolean;
  setSrsAnswerRevealed: any;
  srsPendingRating: number | null;
  setSrsPendingRating: any;
}

export const SetupSRSTab: React.FC<SetupSRSTabProps> = ({
  srs, srsAnswerRevealed, setSrsAnswerRevealed,
  srsPendingRating, setSrsPendingRating
}) => {
  return (
    <div className="p-5 sm:p-6 rounded-2xl liquid-glass-card min-h-[60vh] relative animate-fade-in">
      {srs.isReviewing ? (
        <div className="p-2 flex flex-col min-h-[55vh]">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200/60 dark:border-white/10">
            <h2 className="text-lg font-extrabold flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <Brain className="w-5 h-5 text-indigo-500" /> Review Spaced Repetition
            </h2>
            <button
              onClick={srs.stopReview}
              className="p-2 liquid-glass-subtle-interactive rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {srs.dueCards[srs.currentReviewIndex] ? (
            <div className="flex-1 flex flex-col">
              <div className="mb-3 text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                Kartu {srs.currentReviewIndex + 1} dari {srs.dueCards.length}
              </div>
              <div className="flex-1 overflow-y-auto mb-6 p-5 sm:p-6 rounded-xl liquid-glass-subtle">
                <div className="text-sm sm:text-base font-semibold leading-relaxed text-slate-900 dark:text-slate-100">
                  {renderHtmlText(srs.dueCards[srs.currentReviewIndex].question_json.pertanyaan)}
                </div>
                {srs.dueCards[srs.currentReviewIndex].question_json.pilihan && (
                  <div className="mt-6 space-y-2.5">
                    {Object.entries(srs.dueCards[srs.currentReviewIndex].question_json.pilihan).map(([key, val]: any) => (
                      <div key={key} className="p-3.5 rounded-xl bg-white/50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/10 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">
                        <strong className="font-bold mr-1.5">{key.toUpperCase()}.</strong> {val}
                      </div>
                    ))}
                  </div>
                )}
                {srsAnswerRevealed && (() => {
                  const currentCard = srs.dueCards[srs.currentReviewIndex];
                  const q = currentCard.question_json;
                  const isIsian = !q.pilihan || q.pilihan.length === 0;
                  const displayAnswer = isIsian
                    ? q.jawaban_benar
                    : getCorrectLetterForQuestion(q);
                  return (
                    <div className="mt-6 p-4 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 rounded-xl border border-emerald-500/30 text-sm font-bold">
                      Jawaban Benar: {displayAnswer}
                    </div>
                  );
                })()}
              </div>
              {!srsAnswerRevealed ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  <button onClick={() => { setSrsPendingRating(0); setSrsAnswerRevealed(true); }} className="py-3 text-xs font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition cursor-pointer">0: Blackout</button>
                  <button onClick={() => { setSrsPendingRating(1); setSrsAnswerRevealed(true); }} className="py-3 text-xs font-bold text-white bg-orange-500 rounded-xl hover:bg-orange-600 transition cursor-pointer">1: Salah</button>
                  <button onClick={() => { setSrsPendingRating(2); setSrsAnswerRevealed(true); }} className="py-3 text-xs font-bold text-white bg-amber-500 rounded-xl hover:bg-amber-600 transition cursor-pointer">2: Hampir</button>
                  <button onClick={() => { setSrsPendingRating(3); setSrsAnswerRevealed(true); }} className="py-3 text-xs font-bold text-white bg-lime-600 rounded-xl hover:bg-lime-700 transition cursor-pointer">3: Sulit</button>
                  <button onClick={() => { setSrsPendingRating(4); setSrsAnswerRevealed(true); }} className="py-3 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition cursor-pointer">4: Ragu</button>
                  <button onClick={() => { setSrsPendingRating(5); setSrsAnswerRevealed(true); }} className="py-3 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition cursor-pointer">5: Sempurna</button>
                </div>
              ) : (
                <button 
                  onClick={() => { if (srsPendingRating !== null) srs.submitRating(srsPendingRating); }}
                  className="w-full py-3.5 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  Lanjut ke Kartu Berikutnya →
                </button>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-16">
              <CheckCircle2 className="w-14 h-14 text-emerald-500 mb-3" />
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100">Review Selesai!</span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Seluruh kartu jatuh tempo hari ini telah ditinjau.</p>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <Brain className="w-5 h-5 text-indigo-500" /> Spaced Repetition (SRS)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Review soal yang pernah salah dengan algoritma interval adaptif agar ilmu menempel permanen.
              </p>
            </div>
            <button 
              onClick={srs.startReview}
              disabled={srs.stats.dueCount === 0}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition tabular-nums shrink-0 ${
                srs.stats.dueCount > 0
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/20 cursor-pointer'
                  : 'liquid-glass-subtle text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Mulai Review ({srs.stats.dueCount})
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6 tabular-nums">
            <div className="p-4 rounded-xl liquid-glass-subtle">
              <div className="text-[11px] font-bold text-rose-500 uppercase tracking-wider mb-1">Jatuh Tempo</div>
              <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">{srs.stats.dueCount}</div>
            </div>
            <div className="p-4 rounded-xl liquid-glass-subtle">
              <div className="text-[11px] font-bold text-sky-500 uppercase tracking-wider mb-1">Total Kartu</div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{srs.stats.total}</div>
            </div>
            <div className="p-4 rounded-xl liquid-glass-subtle">
              <div className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider mb-1">Retensi</div>
              <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{srs.stats.retentionRate}%</div>
            </div>
            <div className="p-4 rounded-xl liquid-glass-subtle">
              <div className="text-[11px] font-bold text-amber-500 uppercase tracking-wider mb-1">Kartu Matang</div>
              <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{srs.stats.mature.length}</div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl liquid-glass-subtle">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs tabular-nums">
                <thead>
                  <tr className="border-b border-slate-200/60 dark:border-white/10 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-white/40 dark:bg-white/[0.04]">
                    <th className="py-3 px-4">Ringkasan Soal</th>
                    <th className="py-3 px-4 whitespace-nowrap">Review Berikutnya</th>
                    <th className="py-3 px-4 text-center">Ease Factor</th>
                    <th className="py-3 px-4 text-center">Repetisi</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {srs.cards.map((c: any, i: number) => (
                    <tr key={i} className="border-b border-slate-200/40 dark:border-white/[0.06] last:border-0 hover:bg-white/50 dark:hover:bg-white/[0.04] transition">
                      <td className="py-3.5 px-4 max-w-[280px] truncate font-medium text-slate-800 dark:text-slate-200">
                        {String(c.question_json.pertanyaan || '').replace(/<[^>]*>?/gm, '')}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {new Date(c.next_review_date) <= new Date() ? (
                          <span className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold text-[11px]">Sekarang</span>
                        ) : (
                          <span className="text-slate-600 dark:text-slate-400 font-medium">{getIntervalLabel(c.interval_days)}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-slate-600 dark:text-slate-400">{c.ease_factor}</td>
                      <td className="py-3.5 px-4 text-center font-semibold text-slate-600 dark:text-slate-400">{c.repetitions}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => srs.removeCard(c.id!)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                          title="Hapus kartu SRS"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {srs.cards.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-500 dark:text-slate-400">
                        Belum ada kartu SRS. Kerjakan kuis dan jawaban yang salah akan otomatis terjadwal di sini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

