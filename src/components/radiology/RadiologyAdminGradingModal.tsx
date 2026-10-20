import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Check, Award, MessageSquare, Maximize2, FileText, 
  CheckCircle2, Clock, Save, User, Sparkles
} from 'lucide-react';
import { 
  RadiologyPacket, RadiologyQuestion, RadiologySubmission, 
  THORAX_CHECKLIST_ITEMS, ABDOMEN_CHECKLIST_ITEMS 
} from '../../types/radiology';
import { radiologyApi } from '../../services/radiologyApi';

interface RadiologyAdminGradingModalProps {
  packet: RadiologyPacket;
  submission: RadiologySubmission;
  currentUser: any;
  theme?: 'light' | 'dark';
  onClose: () => void;
  onGraded: () => void;
}

export const RadiologyAdminGradingModal: React.FC<RadiologyAdminGradingModalProps> = ({
  packet,
  submission,
  currentUser,
  theme = 'light',
  onClose,
  onGraded
}) => {
  const isDark = theme === 'dark';
  const questions: RadiologyQuestion[] = packet.questions || [];
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  
  // Checklist states
  const [thoraxChecklist, setThoraxChecklist] = useState<Record<string, boolean>>(
    submission.checklist?.thorax || {}
  );
  const [abdomenChecklist, setAbdomenChecklist] = useState<Record<string, boolean>>(
    submission.checklist?.abdomen || {}
  );
  const [feedback, setFeedback] = useState<string>(submission.feedback || '');
  const [saving, setSaving] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  const currentQ = questions[activeQuestionIdx] || questions[0];
  const adminImage = (currentQ as any)?.image_url || (Array.isArray((currentQ as any)?.image_urls) ? (currentQ as any)?.image_urls[0] : null);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('radiology-exam-active');
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.classList.remove('radiology-exam-active');
    };
  }, []);

  // Kalkulasi Skor Otomatis berdasarkan checklist yang dicentang
  const calculateTotalScore = (): number => {
    let score = 0;
    
    // Hitung Thorax jika ada yang dicentang
    THORAX_CHECKLIST_ITEMS.forEach(cat => {
      cat.items.forEach(item => {
        if (thoraxChecklist[item.id]) {
          score += item.weight;
        }
      });
    });

    // Hitung Abdomen jika ada yang dicentang
    ABDOMEN_CHECKLIST_ITEMS.forEach(cat => {
      cat.items.forEach(item => {
        if (abdomenChecklist[item.id]) {
          score += item.weight;
        }
      });
    });

    // Jika kedua checklist terisi, atau salah satu, batasi dan bulatkan ke 100
    return Math.min(100, Math.round(score));
  };

  const calculatedScore = calculateTotalScore();

  const handleToggleThorax = (itemId: string) => {
    setThoraxChecklist(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const handleToggleAbdomen = (itemId: string) => {
    setAbdomenChecklist(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const handleSubmitGrade = async () => {
    setSaving(true);
    try {
      await radiologyApi.gradeSubmission(
        submission.id,
        packet.group_id,
        {
          thorax: thoraxChecklist,
          abdomen: abdomenChecklist
        },
        calculatedScore,
        feedback,
        currentUser?.id || 'admin',
        currentUser?.username || packet.admin_name || 'Admin Korektor'
      );
      onGraded();
      onClose();
    } catch (e) {
      console.error(e);
      alert('Gagal menyimpan hasil penilaian');
    }
    setSaving(false);
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[999999] bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className={`w-full max-w-7xl max-h-[96vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden border ${
        isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* TOP BAR */}
        <div className={`p-4 sm:p-5 flex items-center justify-between border-b shrink-0 ${
          isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-amber-500/20">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black">Ruang Koreksi Manual Admin</h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                  Rubrik Terintegrasi
                </span>
              </div>
              <p className="text-xs font-semibold opacity-70">
                Peserta: <strong className="text-indigo-500">{submission.username}</strong> • Paket: {packet.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* REAL-TIME TOTAL SCORE ACCUMULATION */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-green-500/15 border border-green-500/30 text-green-600 dark:text-green-400 font-black text-sm">
              <span>Total Skor:</span>
              <span className="text-base">{calculatedScore}</span>
              <span className="text-xs font-normal opacity-70">/ 100</span>
            </div>

            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SELECTOR SOAL JIKA LEBIH DARI 1 */}
        {questions.length > 1 && (
          <div className={`px-5 py-2.5 flex items-center gap-2 border-b text-xs font-bold shrink-0 ${
            isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-100/70 border-slate-200'
          }`}>
            <span className="opacity-70">Pilih Soal yang Dinilai:</span>
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setActiveQuestionIdx(idx)}
                className={`px-3 py-1 rounded-lg transition ${
                  activeQuestionIdx === idx
                    ? 'bg-indigo-600 text-white font-black'
                    : isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-200 text-slate-700'
                }`}
              >
                Soal {idx + 1} ({q.region.toUpperCase()})
              </button>
            ))}
          </div>
        )}

        {/* BODY (TWO COLUMNS): 
            KOLOM 1: SOAL, GAMBAR, JAWABAN PESERTA & KOLOM FEEDBACK
            KOLOM 2: DUAL CHECKLIST (KIRI THORAX, KANAN ABDOMEN) 
        */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 xl:grid-cols-12 gap-6">
          
          {/* SISI KIRI (XL: 5 COLUMNS): DETAIL SOAL & JAWABAN MAHASISWA & FEEDBACK */}
          <div className="xl:col-span-5 space-y-5">
            {/* IDENTITAS SOAL & VIGNETTE */}
            <div className={`p-4 rounded-2xl border ${
              isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase text-indigo-500">
                  Kasus Soal #{activeQuestionIdx + 1} ({currentQ?.region.toUpperCase()})
                </span>
                {currentQ?.identitas_pasien && (
                  <span className="text-xs font-semibold opacity-70">
                    No RM: {currentQ.identitas_pasien.no_rm}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm font-medium leading-relaxed">
                {currentQ?.vignette}
              </p>
            </div>

            {/* GAMBAR RONTGEN */}
            {adminImage && (
              <div className={`p-3 rounded-2xl border ${
                isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] font-bold opacity-70 uppercase tracking-wider">
                    Foto Rontgen Kasus
                  </span>
                  <button
                    onClick={() => setLightboxImg(adminImage)}
                    className="flex items-center gap-1 text-[11px] font-bold text-indigo-500 hover:underline"
                  >
                    <Maximize2 className="w-3 h-3" /> Zoom Foto
                  </button>
                </div>
                <div 
                  onClick={() => setLightboxImg(adminImage)}
                  className="rounded-xl overflow-hidden bg-black/90 max-h-[220px] flex items-center justify-center cursor-zoom-in group"
                >
                  <img
                    src={adminImage}
                    alt="Foto Radiologi"
                    className="w-full h-auto max-h-[220px] object-contain transition group-hover:scale-105 duration-200"
                    onError={(e) => {
                      (e.target as any).src = 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                </div>
              </div>
            )}

            {/* JAWABAN ESSAY MAHASISWA */}
            <div className={`p-5 rounded-2xl border ${
              isDark ? 'bg-slate-800 border-indigo-500/30' : 'bg-white border-indigo-200'
            } shadow-sm`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-500 flex items-center gap-1.5">
                  <FileText className="w-4 h-4" /> Jawaban Peserta ({submission.username})
                </span>
                <span className="text-[11px] font-semibold opacity-60">
                  {submission.created_at ? new Date(submission.created_at).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
              <div className={`p-3.5 rounded-xl text-sm font-medium leading-relaxed whitespace-pre-line min-h-[120px] max-h-[260px] overflow-y-auto ${
                isDark ? 'bg-slate-900/90 text-slate-100 border border-slate-700' : 'bg-slate-50 text-slate-800 border border-slate-200'
              }`}>
                {submission.answers?.[currentQ?.id] ? (
                  submission.answers[currentQ.id]
                ) : (
                  <span className="italic text-slate-400">Peserta belum mengisi jawaban untuk nomor soal ini.</span>
                )}
              </div>
            </div>

            {/* KOLOM FEEDBACK UNTUK KOREKTOR (DI BAWAH SOAL/JAWABAN) */}
            <div className={`p-5 rounded-2xl border ${
              isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
            } shadow-sm`}>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-500" /> Kolom Feedback untuk Korektor
              </label>
              <textarea
                rows={4}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Berikan catatan, evaluasi kekurangan, atau masukan bimbingan kepada peserta di sini... (Catatan ini akan langsung tampil di lembar hasil ujian peserta)."
                className={`w-full p-3 rounded-xl text-sm font-medium leading-relaxed transition focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-y ${
                  isDark
                    ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>
          </div>

          {/* SISI KANAN (XL: 7 COLUMNS): CHECKLIST DUAL (KIRI THORAX, KANAN ABDOMEN) */}
          <div className="xl:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wide">
                  Lembar Penilaian Checklist Interaktif
                </h3>
                <p className="text-xs font-semibold opacity-60">
                  Centang item yang terjawab dengan tepat oleh peserta. Sisi kiri untuk Thorax, sisi kanan untuk Abdomen.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    // Cepat centang semua sesuai region soal
                    if (currentQ?.region === 'thorax') {
                      const all: Record<string, boolean> = {};
                      THORAX_CHECKLIST_ITEMS.forEach(c => c.items.forEach(i => all[i.id] = true));
                      setThoraxChecklist(all);
                    } else {
                      const all: Record<string, boolean> = {};
                      ABDOMEN_CHECKLIST_ITEMS.forEach(c => c.items.forEach(i => all[i.id] = true));
                      setAbdomenChecklist(all);
                    }
                  }}
                  className="text-[11px] font-bold text-indigo-500 hover:underline"
                >
                  Centang Sempurna ({currentQ?.region.toUpperCase()})
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => {
                    setThoraxChecklist({});
                    setAbdomenChecklist({});
                  }}
                  className="text-[11px] font-bold text-red-500 hover:underline"
                >
                  Reset Checklist
                </button>
              </div>
            </div>

            {/* DUAL CHECKLIST GRID: KIRI THORAX, KANAN ABDOMEN */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* CHECKLIST 1: FOTO THORAX (SISI KIRI) */}
              <div className={`p-4 rounded-2xl border flex flex-col justify-between ${
                currentQ?.region === 'thorax' 
                  ? isDark ? 'bg-indigo-950/20 border-indigo-500/40' : 'bg-indigo-50/40 border-indigo-200'
                  : isDark ? 'bg-slate-800/60 border-slate-700 opacity-90' : 'bg-slate-50 border-slate-200 opacity-90'
              }`}>
                <div>
                  <div className="flex items-center justify-between pb-3 border-b mb-3">
                    <span className="font-black text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      Checklist Foto Thorax (Kiri)
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500">
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
                                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
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
              <div className={`p-4 rounded-2xl border flex flex-col justify-between ${
                currentQ?.region === 'abdomen' 
                  ? isDark ? 'bg-teal-950/20 border-teal-500/40' : 'bg-teal-50/40 border-teal-200'
                  : isDark ? 'bg-slate-800/60 border-slate-700 opacity-90' : 'bg-slate-50 border-slate-200 opacity-90'
              }`}>
                <div>
                  <div className="flex items-center justify-between pb-3 border-b mb-3">
                    <span className="font-black text-xs uppercase tracking-wider text-teal-600 dark:text-teal-400">
                      Checklist Foto Abdomen (Kanan)
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-500/10 text-teal-500">
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
                                  className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
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
        <div className={`p-4 sm:p-5 flex items-center justify-between border-t shrink-0 ${
          isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-slate-50 border-slate-200'
        }`}>
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

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-xs sm:text-sm"
            >
              Batal
            </button>
            <button
              onClick={handleSubmitGrade}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 hover:scale-105 active:scale-95 transition text-xs sm:text-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Menyimpan...' : 'Submit Penilaian & Buka Pembahasan'}
            </button>
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
