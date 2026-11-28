import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Check, Award, MessageSquare, Maximize2, FileText, 
  CheckCircle2, Clock, Save, User, Sparkles, ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';
import { 
  RadiologyPacket, RadiologyQuestion, RadiologySubmission, 
  THORAX_CHECKLIST_ITEMS, ABDOMEN_CHECKLIST_ITEMS 
} from '../../types/radiology';
import { getQuestionImages, getUserDisplayName, radiologyApi } from '../../services/radiologyApi';

interface RadiologyAdminGradingModalProps {
  packet: RadiologyPacket;
  submission: RadiologySubmission;
  currentUser: any;
  profileUsername?: string;
  theme?: 'light' | 'dark';
  onClose: () => void;
  onGraded: () => void;
}

export const RadiologyAdminGradingModal: React.FC<RadiologyAdminGradingModalProps> = ({
  packet,
  submission,
  currentUser,
  profileUsername,
  theme = 'light',
  onClose,
  onGraded
}) => {
  const isDark = theme === 'dark';
  const questions: RadiologyQuestion[] = packet.questions || [];
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);

  interface QuestionRubricState {
    thorax: Record<string, boolean>;
    abdomen: Record<string, boolean>;
  }

  // Checklist states PER SOAL (tiap soal memiliki rubric mandiri)
  const [questionChecklists, setQuestionChecklists] = useState<Record<string, QuestionRubricState>>(() => {
    const initial: Record<string, QuestionRubricState> = {};
    const byQ = (submission.checklist as any)?.by_question;

    questions.forEach((q, idx) => {
      if (byQ && byQ[q.id]) {
        initial[q.id] = {
          thorax: byQ[q.id]?.thorax || {},
          abdomen: byQ[q.id]?.abdomen || {}
        };
      } else if (idx === 0 && (submission.checklist?.thorax || submission.checklist?.abdomen)) {
        initial[q.id] = {
          thorax: submission.checklist.thorax || {},
          abdomen: submission.checklist.abdomen || {}
        };
      } else {
        initial[q.id] = {
          thorax: {},
          abdomen: {}
        };
      }
    });

    return initial;
  });

  const [feedback, setFeedback] = useState<string>(submission.feedback || '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showAnswerKey, setShowAnswerKey] = useState(true);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  const currentQ = questions[activeQuestionIdx] || questions[0];
  const currentQuestionId = currentQ?.id || `q-${activeQuestionIdx}`;
  const currentChecklist = questionChecklists[currentQuestionId] || { thorax: {}, abdomen: {} };
  const thoraxChecklist = currentChecklist.thorax || {};
  const abdomenChecklist = currentChecklist.abdomen || {};

  const adminImages = getQuestionImages(currentQ);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('radiology-exam-active');
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.classList.remove('radiology-exam-active');
    };
  }, []);

  // Kalkulasi Skor per butir soal
  const calculateScoreForQuestion = (qId: string, region?: string): number => {
    const qState = questionChecklists[qId];
    if (!qState) return 0;
    let score = 0;

    if (!region || region === 'thorax') {
      THORAX_CHECKLIST_ITEMS.forEach(cat => {
        cat.items.forEach(item => {
          if (qState.thorax?.[item.id]) {
            score += item.weight;
          }
        });
      });
    }

    if (!region || region === 'abdomen') {
      ABDOMEN_CHECKLIST_ITEMS.forEach(cat => {
        cat.items.forEach(item => {
          if (qState.abdomen?.[item.id]) {
            score += item.weight;
          }
        });
      });
    }

    return Math.min(100, Math.round(score));
  };

  // Kalkulasi Rata-rata Nilai Total Paket
  const calculateTotalScore = (): number => {
    if (questions.length === 0) return 0;
    let total = 0;
    questions.forEach(q => {
      total += calculateScoreForQuestion(q.id, q.region);
    });
    return Math.min(100, Math.round(total / questions.length));
  };

  const calculatedScore = calculateTotalScore();
  const currentQScore = calculateScoreForQuestion(currentQuestionId, currentQ?.region);

  const handleToggleThorax = (itemId: string) => {
    if (!currentQuestionId) return;
    setQuestionChecklists(prev => {
      const prevQ = prev[currentQuestionId] || { thorax: {}, abdomen: {} };
      return {
        ...prev,
        [currentQuestionId]: {
          ...prevQ,
          thorax: {
            ...prevQ.thorax,
            [itemId]: !prevQ.thorax?.[itemId]
          }
        }
      };
    });
  };

  const handleToggleAbdomen = (itemId: string) => {
    if (!currentQuestionId) return;
    setQuestionChecklists(prev => {
      const prevQ = prev[currentQuestionId] || { thorax: {}, abdomen: {} };
      return {
        ...prev,
        [currentQuestionId]: {
          ...prevQ,
          abdomen: {
            ...prevQ.abdomen,
            [itemId]: !prevQ.abdomen?.[itemId]
          }
        }
      };
    });
  };

  const handleFillPerfectCurrent = () => {
    if (!currentQuestionId || !currentQ) return;
    const isThorax = currentQ.region === 'thorax';
    const all: Record<string, boolean> = {};
    if (isThorax) {
      THORAX_CHECKLIST_ITEMS.forEach(c => c.items.forEach(i => (all[i.id] = true)));
    } else {
      ABDOMEN_CHECKLIST_ITEMS.forEach(c => c.items.forEach(i => (all[i.id] = true)));
    }

    setQuestionChecklists(prev => {
      const prevQ = prev[currentQuestionId] || { thorax: {}, abdomen: {} };
      return {
        ...prev,
        [currentQuestionId]: {
          thorax: isThorax ? all : prevQ.thorax,
          abdomen: !isThorax ? all : prevQ.abdomen
        }
      };
    });
  };

  const handleResetCurrent = () => {
    if (!currentQuestionId) return;
    setQuestionChecklists(prev => ({
      ...prev,
      [currentQuestionId]: {
        thorax: {},
        abdomen: {}
      }
    }));
  };

  const handleSubmitGrade = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const graderDisplayName = getUserDisplayName(
        currentUser,
        profileUsername,
        packet.admin_name || 'Admin Korektor'
      );
      const res = await radiologyApi.gradeSubmission(
        submission.id,
        packet.group_id,
        {
          thorax: questionChecklists[questions[0]?.id]?.thorax || {},
          abdomen: questionChecklists[questions[0]?.id]?.abdomen || {},
          by_question: questionChecklists
        },
        calculatedScore,
        feedback,
        currentUser?.id || 'admin',
        graderDisplayName
      );
      if (!res.success) {
        setSaveError(res.error || 'Gagal menyimpan hasil penilaian ke server cloud.');
        setSaving(false);
        return;
      }
      onGraded();
      onClose();
    } catch (e: any) {
      console.error(e);
      setSaveError(e?.message || 'Gagal menyimpan hasil penilaian ke server cloud.');
    }
    setSaving(false);
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[999999] bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className={`w-full max-w-7xl h-[100dvh] sm:h-auto sm:max-h-[96vh] flex flex-col rounded-none sm:rounded-3xl shadow-2xl overflow-hidden border max-lg-liquid-card ${
        isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* TOP BAR */}
        <div className={`px-3.5 sm:px-5 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 sm:py-5 flex flex-wrap items-center justify-between gap-2.5 border-b shrink-0 max-lg-liquid-subtle ${
          isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-amber-500/20 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
                <h2 className="text-sm sm:text-lg font-black">Ruang Koreksi Manual Admin</h2>
                <span className="text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 shrink-0">
                  Rubrik Terintegrasi
                </span>
              </div>
              <p className="text-xs font-semibold opacity-70 truncate">
                Peserta: <strong className="text-indigo-500">{submission.username}</strong> • Paket: {packet.title}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 w-full sm:w-auto">
            {/* REAL-TIME SCORE DISPLAY */}
            <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl bg-green-500/15 border border-green-500/30 text-green-600 dark:text-green-400 font-black text-xs sm:text-sm tabular-nums">
              <span className="opacity-75 hidden sm:inline">Skor Soal #{activeQuestionIdx + 1}:</span>
              <span className="text-xs sm:text-base text-green-400 font-extrabold">{currentQScore} pts</span>
              <span className="opacity-30">|</span>
              <span className="opacity-75">Total:</span>
              <span className="text-sm sm:text-lg">{calculatedScore}</span>
              <span className="text-xs font-normal opacity-70">/ 100</span>
            </div>

            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition cursor-pointer shrink-0 max-lg-liquid-interactive ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SELECTOR SOAL JIKA LEBIH DARI 1 */}
        {questions.length > 1 && (
          <div className={`px-3.5 sm:px-5 py-2.5 flex items-center gap-2 border-b text-xs font-bold shrink-0 overflow-x-auto scrollbar-none ${
            isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-100/70 border-slate-200'
          }`}>
            <span className="opacity-70 shrink-0">Pilih Soal:</span>
            {questions.map((q, idx) => {
              const qScore = calculateScoreForQuestion(q.id, q.region);
              return (
                <button
                  key={q.id}
                  onClick={() => setActiveQuestionIdx(idx)}
                  className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    activeQuestionIdx === idx
                      ? 'bg-indigo-600 text-white font-black shadow-md'
                      : isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span>Soal {idx + 1} ({q.region.toUpperCase()})</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                    qScore > 0 ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-slate-700/50 text-slate-400'
                  }`}>
                    {qScore} pts
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* BODY (TWO COLUMNS): 
            KOLOM 1: SOAL, GAMBAR, JAWABAN PESERTA & KOLOM FEEDBACK
            KOLOM 2: DUAL CHECKLIST (KIRI THORAX, KANAN ABDOMEN) 
        */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 grid grid-cols-1 xl:grid-cols-12 gap-5 sm:gap-6">
          
          {/* SISI KIRI (XL: 5 COLUMNS): DETAIL SOAL & JAWABAN MAHASISWA & FEEDBACK */}
          <div className="xl:col-span-5 space-y-4 sm:space-y-5 min-w-0">
            {/* IDENTITAS SOAL & VIGNETTE */}
            <div className={`p-4 rounded-2xl border max-lg-liquid-subtle ${
              isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between flex-wrap gap-1.5 mb-2">
                <span className="text-xs font-black uppercase text-indigo-500">
                  Kasus Soal #{activeQuestionIdx + 1} ({currentQ?.region.toUpperCase()})
                </span>
                {currentQ?.identitas_pasien && (
                  <span className="text-xs font-semibold opacity-70">
                    No RM: {currentQ.identitas_pasien.no_rm}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm font-medium leading-relaxed break-words">
                {currentQ?.vignette}
              </p>
            </div>

            {/* GAMBAR RONTGEN (MENDUKUNG MULTI-CITRA) */}
            {adminImages.length > 0 && (
              <div className={`p-3 rounded-2xl border max-lg-liquid-subtle space-y-2.5 ${
                isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold opacity-70 uppercase tracking-wider">
                    Foto Rontgen Kasus ({adminImages.length} Citra)
                  </span>
                  <button
                    type="button"
                    onClick={() => setLightboxImg(adminImages[0])}
                    className="flex items-center gap-1 text-[11px] font-bold text-indigo-500 hover:underline cursor-pointer"
                  >
                    <Maximize2 className="w-3 h-3" /> Zoom Foto
                  </button>
                </div>
                <div className={`grid gap-2 ${adminImages.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {adminImages.map((imgUrl, imgIdx) => (
                    <div
                      key={`${currentQuestionId}-admimg-${imgIdx}`}
                      onClick={() => setLightboxImg(imgUrl)}
                      className="rounded-xl overflow-hidden bg-black/90 max-h-[220px] flex items-center justify-center cursor-zoom-in group"
                    >
                      <img
                        src={imgUrl}
                        alt={`Foto Radiologi #${imgIdx + 1}`}
                        className="w-full h-auto max-h-[220px] object-contain transition group-hover:scale-105 duration-200"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* JAWABAN ESSAY MAHASISWA */}
            <div className={`p-4 sm:p-5 rounded-2xl border max-lg-liquid-subtle ${
              isDark ? 'bg-slate-800 border-indigo-500/30' : 'bg-white border-indigo-200'
            } shadow-sm`}>
              <div className="flex items-center justify-between flex-wrap gap-1.5 mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-500 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 shrink-0" /> Jawaban Peserta ({submission.username})
                </span>
                <span className="text-[11px] font-semibold opacity-60">
                  {submission.created_at ? new Date(submission.created_at).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
              <div className={`p-3.5 rounded-xl text-sm font-medium leading-relaxed whitespace-pre-line break-words min-h-[120px] max-h-[260px] overflow-y-auto ${
                isDark ? 'bg-slate-900/90 text-slate-100 border border-slate-700' : 'bg-slate-50 text-slate-800 border border-slate-200'
              }`}>
                {submission.answers?.[currentQ?.id] ? (
                  submission.answers[currentQ.id]
                ) : (
                  <span className="italic text-slate-400">Peserta belum mengisi jawaban untuk nomor soal ini.</span>
                )}
              </div>
            </div>

            {/* KUNCI INTERPRETASI RESMI (REFERENSI KOREKTOR) */}
            {currentQ?.kunci_interpretasi &&
              Object.values(currentQ.kunci_interpretasi).some((v) => typeof v === 'string' && v.trim()) && (
              <div className={`p-4 rounded-2xl border max-lg-liquid-subtle ${
                isDark ? 'bg-indigo-950/30 border-indigo-500/30' : 'bg-indigo-50/70 border-indigo-200'
              }`}>
                <button
                  type="button"
                  onClick={() => setShowAnswerKey((prev) => !prev)}
                  className="w-full flex items-center justify-between gap-2 text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    Kunci Interpretasi Resmi (Referensi Korektor)
                  </span>
                  {showAnswerKey ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
                </button>
                {showAnswerKey && (
                  <div className="mt-3 space-y-2 text-xs leading-relaxed">
                    {currentQ.kunci_interpretasi.data_demografi && (
                      <div>
                        <strong className="text-indigo-600 dark:text-indigo-300 block">Demografi:</strong>
                        <span className="opacity-90">{currentQ.kunci_interpretasi.data_demografi}</span>
                      </div>
                    )}
                    {(currentQ.kunci_interpretasi.kualitas_foto || currentQ.kunci_interpretasi.syarat_layak_baca) && (
                      <div>
                        <strong className="text-indigo-600 dark:text-indigo-300 block">Kualitas Foto:</strong>
                        <span className="opacity-90">
                          {currentQ.kunci_interpretasi.kualitas_foto || currentQ.kunci_interpretasi.syarat_layak_baca}
                        </span>
                      </div>
                    )}
                    {(currentQ.kunci_interpretasi.interpretasi || currentQ.kunci_interpretasi.sistematika_organ) && (
                      <div>
                        <strong className="text-indigo-600 dark:text-indigo-300 block">Interpretasi Sistematis:</strong>
                        <span className="opacity-90">
                          {currentQ.kunci_interpretasi.interpretasi || currentQ.kunci_interpretasi.sistematika_organ}
                        </span>
                      </div>
                    )}
                    {currentQ.kunci_interpretasi.abnormalitas && (
                      <div>
                        <strong className="text-indigo-600 dark:text-indigo-300 block">Abnormalitas:</strong>
                        <span className="opacity-90">{currentQ.kunci_interpretasi.abnormalitas}</span>
                      </div>
                    )}
                    {currentQ.kunci_interpretasi.kesimpulan && (
                      <div className={`p-2.5 rounded-xl border ${
                        isDark ? 'bg-slate-900/70 border-indigo-500/20' : 'bg-white/80 border-indigo-200/80'
                      }`}>
                        <strong className="text-indigo-600 dark:text-indigo-300 block">Kesimpulan:</strong>
                        <span className="font-semibold">{currentQ.kunci_interpretasi.kesimpulan}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* KOLOM FEEDBACK UNTUK KOREKTOR (DI BAWAH SOAL/JAWABAN) */}
            <div className={`p-4 sm:p-5 rounded-2xl border max-lg-liquid-subtle ${
              isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
            } shadow-sm`}>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-500 shrink-0" /> Kolom Feedback untuk Korektor
              </label>
              <textarea
                rows={4}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Berikan catatan, evaluasi kekurangan, atau masukan bimbingan kepada peserta di sini... (Catatan ini akan langsung tampil di lembar hasil ujian peserta)."
                className={`w-full p-3 rounded-xl text-sm font-medium leading-relaxed transition focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-y max-lg-liquid-input ${
                  isDark
                    ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>
          </div>

          {/* SISI KANAN (XL: 7 COLUMNS): CHECKLIST DUAL (KIRI THORAX, KANAN ABDOMEN) */}
          <div className="xl:col-span-7 space-y-4 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wide">
                  Lembar Penilaian Checklist Interaktif
                </h3>
                <p className="text-xs font-semibold opacity-60">
                  Centang item yang terjawab dengan tepat oleh peserta. Sisi kiri untuk Thorax, sisi kanan untuk Abdomen.
                </p>
              </div>

              <div className="flex items-center flex-wrap gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleFillPerfectCurrent}
                  className="text-[11px] font-bold text-indigo-500 hover:underline cursor-pointer"
                >
                  Centang Sempurna ({currentQ?.region?.toUpperCase() || 'SOAL'})
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={handleResetCurrent}
                  className="text-[11px] font-bold text-rose-500 hover:underline cursor-pointer"
                >
                  Reset Checklist Soal Ini
                </button>
              </div>
            </div>

            {/* DUAL CHECKLIST GRID: KIRI THORAX, KANAN ABDOMEN */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* CHECKLIST 1: FOTO THORAX (SISI KIRI) */}
              <div className={`p-4 rounded-2xl border flex flex-col justify-between max-lg-liquid-subtle ${
                currentQ?.region === 'thorax' 
                  ? isDark ? 'bg-indigo-950/20 border-indigo-500/40' : 'bg-indigo-50/40 border-indigo-200'
                  : isDark ? 'bg-slate-800/60 border-slate-700 opacity-90' : 'bg-slate-50 border-slate-200 opacity-90'
              }`}>
                <div>
                  <div className="flex items-center justify-between gap-2 pb-3 border-b mb-3">
                    <span className="font-black text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      Checklist Foto Thorax (Kiri)
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500 shrink-0">
                      FK UNS
                    </span>
                  </div>

                  <div className="space-y-4">
                    {THORAX_CHECKLIST_ITEMS.map((cat, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="text-[11px] font-black uppercase tracking-wider opacity-60">
                          {cat.category}
                        </div>
                        <div className="space-y-1">
                          {cat.items.map(item => {
                            const isChecked = !!thoraxChecklist[item.id];
                            return (
                              <label
                                key={item.id}
                                className={`flex items-start gap-2.5 p-2 rounded-xl text-xs font-semibold cursor-pointer transition select-none ${
                                  isChecked 
                                    ? 'bg-green-500/15 text-green-700 dark:text-green-300 font-bold border border-green-500/30' 
                                    : isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleThorax(item.id)}
                                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer shrink-0"
                                />
                                <span className="flex-1 leading-snug">{item.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* CHECKLIST 2: FOTO ABDOMEN (SISI KANAN) */}
              <div className={`p-4 rounded-2xl border flex flex-col justify-between max-lg-liquid-subtle ${
                currentQ?.region === 'abdomen' 
                  ? isDark ? 'bg-teal-950/20 border-teal-500/40' : 'bg-teal-50/40 border-teal-200'
                  : isDark ? 'bg-slate-800/60 border-slate-700 opacity-90' : 'bg-slate-50 border-slate-200 opacity-90'
              }`}>
                <div>
                  <div className="flex items-center justify-between gap-2 pb-3 border-b mb-3">
                    <span className="font-black text-xs uppercase tracking-wider text-teal-600 dark:text-teal-400">
                      Checklist Foto Abdomen (Kanan)
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-500/10 text-teal-500 shrink-0">
                      BNO / 3 Posisi
                    </span>
                  </div>

                  <div className="space-y-4">
                    {ABDOMEN_CHECKLIST_ITEMS.map((cat, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="text-[11px] font-black uppercase tracking-wider opacity-60">
                          {cat.category}
                        </div>
                        <div className="space-y-1">
                          {cat.items.map(item => {
                            const isChecked = !!abdomenChecklist[item.id];
                            return (
                              <label
                                key={item.id}
                                className={`flex items-start gap-2.5 p-2 rounded-xl text-xs font-semibold cursor-pointer transition select-none ${
                                  isChecked 
                                    ? 'bg-teal-500/15 text-teal-700 dark:text-teal-300 font-bold border border-teal-500/30' 
                                    : isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleAbdomen(item.id)}
                                  className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer shrink-0"
                                />
                                <span className="flex-1 leading-snug">{item.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* BOTTOM ACTION BAR */}
        <div className={`px-3.5 sm:px-5 pt-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] sm:py-5 flex flex-col gap-3 border-t shrink-0 max-lg-liquid-subtle ${
          isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-slate-50 border-slate-200'
        }`}>
          {saveError && (
            <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="opacity-70">Status Penilaian:</span>
            {submission.status === 'graded' ? (
              <span className="text-green-500 font-black flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Sudah Pernah Dikoreksi
              </span>
            ) : (
              <span className="text-amber-500 font-black flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Menunggu Submit Koreksi
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 max-lg-liquid-interactive transition text-xs sm:text-sm cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleSubmitGrade}
              disabled={saving}
              className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 hover:scale-105 active:scale-95 transition text-xs sm:text-sm disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4 shrink-0" />
              <span className="truncate">{saving ? 'Menyimpan ke Cloud...' : 'Submit Penilaian & Buka Pembahasan'}</span>
            </button>
          </div>
          </div>
        </div>
      </div>

      {/* LIGHTBOX PERBESAR GAMBAR */}
      {lightboxImg && (
        <div 
          onClick={() => setLightboxImg(null)}
          className="fixed inset-0 z-70 bg-black/95 flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
        >
          <img 
            src={lightboxImg} 
            alt="Perbesar Foto Rontgen" 
            className="max-w-full max-h-[92vh] object-contain rounded-xl shadow-2xl" 
          />
          <button 
            onClick={() => setLightboxImg(null)}
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>,
    document.body
  );
};
