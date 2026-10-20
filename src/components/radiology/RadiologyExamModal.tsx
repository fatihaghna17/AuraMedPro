import React, { useState, useEffect } from 'react';
import { 
  X, CheckCircle, Clock, AlertCircle, ArrowLeft, ArrowRight, 
  Send, Eye, FileText, Check, Award, MessageSquare, Maximize2, ShieldAlert
} from 'lucide-react';
import { RadiologyPacket, RadiologyQuestion, RadiologySubmission, THORAX_CHECKLIST_ITEMS, ABDOMEN_CHECKLIST_ITEMS } from '../../types/radiology';
import { radiologyApi } from '../../services/radiologyApi';

interface RadiologyExamModalProps {
  packet: RadiologyPacket;
  groupId: string;
  currentUser: any;
  theme?: 'light' | 'dark';
  onClose: () => void;
  onSubmitted?: () => void;
}

export const RadiologyExamModal: React.FC<RadiologyExamModalProps> = ({
  packet,
  groupId,
  currentUser,
  theme = 'light',
  onClose,
  onSubmitted
}) => {
  const isDark = theme === 'dark';
  const questions: RadiologyQuestion[] = packet.questions || [];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submission, setSubmission] = useState<RadiologySubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);

  const currentQ = questions[currentIdx] || null;

  useEffect(() => {
    loadSubmission();
  }, [packet.id, currentUser?.id]);

  const loadSubmission = async () => {
    if (!currentUser?.id) return;
    setLoading(true);
    try {
      const sub = await radiologyApi.getUserSubmission(packet.id, currentUser.id, groupId);
      if (sub) {
        setSubmission(sub);
        setAnswers(sub.answers || {});
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleAnswerChange = (val: string) => {
    if (!currentQ || submission?.status === 'graded') return;
    setAnswers(prev => ({ ...prev, [currentQ.id]: val }));
  };

  const handleSubmitExam = async () => {
    if (!currentUser?.id) return;
    setSubmitting(true);
    try {
      const sub = await radiologyApi.submitAnswers(
        packet.id,
        groupId,
        currentUser.id,
        currentUser.username || 'Peserta',
        answers
      );
      setSubmission(sub);
      setShowConfirmFinish(false);
      if (onSubmitted) onSubmitted();
    } catch (e) {
      console.error(e);
      alert('Gagal mengumpulkan jawaban');
    }
    setSubmitting(false);
  };

  const isGraded = submission?.status === 'graded';
  const isPending = submission?.status === 'pending';
  const isReadOnly = isGraded || isPending;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className={`w-full max-w-6xl max-h-[94vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden border ${
        isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* TOP BAR */}
        <div className={`p-4 sm:p-5 flex items-center justify-between border-b shrink-0 ${
          isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 text-indigo-500 flex items-center justify-center font-black">
              {currentIdx + 1}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black line-clamp-1">{packet.title}</h2>
              <div className="flex items-center gap-2 text-xs font-semibold opacity-70">
                <span>Soal {currentIdx + 1} dari {questions.length}</span>
                <span>•</span>
                <span className="capitalize">{currentQ?.region || 'Radiologi'}</span>
                <span>•</span>
                <span>Korektor: <strong className="text-indigo-500">{packet.admin_name || 'Admin'}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* STATUS BADGES */}
            {isGraded ? (
              <span className="px-3 py-1 bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/30 rounded-full text-xs font-black flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" /> Sudah Dikoreksi ({submission?.score}/100)
              </span>
            ) : isPending ? (
              <span className="px-3 py-1 bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-full text-xs font-black flex items-center gap-1.5 animate-pulse">
                <Clock className="w-3.5 h-3.5" /> Menunggu Koreksi
              </span>
            ) : (
              <span className="px-3 py-1 bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 rounded-full text-xs font-black">
                Mode Ujian Mandiri
              </span>
            )}

            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* BODY CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {loading ? (
            <div className="py-20 text-center animate-pulse">
              <div className="w-12 h-12 mx-auto rounded-full bg-indigo-500/20 mb-3"></div>
              <p className="font-bold opacity-60">Memuat data kuis radiologi...</p>
            </div>
          ) : !currentQ ? (
            <div className="py-20 text-center">
              <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
              <p className="font-bold">Belum ada butir soal dalam paket ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* KOLOM KIRI (VIGNETTE & GAMBAR RONTGEN) */}
              <div className="lg:col-span-6 space-y-5">
                {/* VIGNETTE KASUS KLINIS */}
                <div className={`p-5 rounded-2xl border ${
                  isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-indigo-500">
                      Skenario Kasus Klinis
                    </span>
                    {currentQ.metadata?.tingkat_kesulitan && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400">
                        {currentQ.metadata.tingkat_kesulitan}
                      </span>
                    )}
                  </div>
                  <p className="text-sm sm:text-base leading-relaxed font-medium">
                    {currentQ.vignette}
                  </p>

                  {/* IDENTITAS DEMOGRAFI RUJUKAN */}
                  {currentQ.identitas_pasien && (
                    <div className={`mt-4 pt-3 border-t grid grid-cols-2 gap-2 text-xs font-medium ${isDark ? 'border-slate-700 text-slate-300' : 'border-slate-200 text-slate-600'}`}>
                      <div><strong>Nama:</strong> {currentQ.identitas_pasien.nama}</div>
                      <div><strong>TTL / Usia:</strong> {currentQ.identitas_pasien.tanggal_lahir}</div>
                      <div><strong>Jenis Kelamin:</strong> {currentQ.identitas_pasien.jenis_kelamin}</div>
                      <div><strong>No RM:</strong> {currentQ.identitas_pasien.no_rm}</div>
                    </div>
                  )}
                </div>

                {/* GAMBAR RADIOLOGI DENGAN ZOOM */}
                {currentQ.image_url && (
                  <div className={`p-4 rounded-2xl border ${
                    isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Foto Rontgen ({currentQ.region.toUpperCase()})
                      </span>
                      <button
                        onClick={() => setLightboxImg(currentQ.image_url)}
                        className="flex items-center gap-1.5 text-xs font-bold text-indigo-500 hover:text-indigo-400 transition"
                      >
                        <Maximize2 className="w-3.5 h-3.5" /> Perbesar Foto
                      </button>
                    </div>
                    
                    <div 
                      onClick={() => setLightboxImg(currentQ.image_url)}
                      className="relative rounded-xl overflow-hidden bg-black/90 cursor-zoom-in group max-h-[360px] flex items-center justify-center border border-slate-700/50"
                    >
                      <img 
                        src={currentQ.image_url} 
                        alt="Foto Radiologi" 
                        className="w-full h-auto max-h-[360px] object-contain transition group-hover:scale-105 duration-300"
                        onError={(e) => {
                          // Fallback placeholder jika gambar rontgen belum diset
                          (e.target as any).src = 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1000&q=80';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-black tracking-wider uppercase">
                        Klik untuk Perbesar
                      </div>
                    </div>
                  </div>
                )}

                {/* INSTRUKSI PERTANYAAN */}
                <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-xs sm:text-sm font-semibold">
                  <div className="font-black mb-1">Instruksi Interpretasi:</div>
                  {currentQ.pertanyaan}
                </div>
              </div>

              {/* KOLOM KANAN (INPUT JAWABAN ESSAY / FEEDBACK / PEMBAHASAN) */}
              <div className="lg:col-span-6 space-y-5">
                
                {/* 1. KOTAK JAWABAN PESERTA */}
                <div className={`p-5 rounded-2xl border ${
                  isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                } shadow-sm`}>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-black flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-500" /> Lembar Jawaban Essay Anda
                    </label>
                    <span className="text-xs font-semibold opacity-60">
                      {(answers[currentQ.id] || '').trim().split(/\s+/).filter(Boolean).length} kata
                    </span>
                  </div>

                  <textarea
                    rows={8}
                    disabled={isReadOnly}
                    value={answers[currentQ.id] || ''}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    placeholder="Tuliskan interpretasi sistematis Anda di sini:&#10;1. Data Demografi Pasien (Nama, TTL, JK, No RM)&#10;2. Kualitas & Keadekuatan Foto&#10;3. Interpretasi Sistematik Organ&#10;4. Abnormalitas yang ditemukan&#10;5. Kesimpulan & Diagnosis Kerja..."
                    className={`w-full p-3.5 rounded-xl text-sm font-medium leading-relaxed transition focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-y min-h-[180px] ${
                      isDark 
                        ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                    } ${isReadOnly ? 'opacity-85 cursor-not-allowed' : ''}`}
                  />

                  {isPending && (
                    <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex items-center gap-2 font-semibold">
                      <Clock className="w-4 h-4 shrink-0 animate-spin" />
                      Jawaban tersimpan dan sedang menunggu koreksi oleh admin/korektor paket soal ini.
                    </div>
                  )}
                </div>

                {/* 2. JIKA SUDAH DIKOREKSI: HASIL SKOR & FEEDBACK DARI KOREKTOR */}
                {isGraded && (
                  <div className={`p-5 rounded-2xl border space-y-4 animate-in zoom-in-95 duration-200 ${
                    isDark ? 'bg-slate-800/90 border-green-500/30' : 'bg-green-50/50 border-green-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-green-500" />
                        <h4 className="font-black text-base">Hasil Koreksi Manual Admin</h4>
                      </div>
                      <div className="text-xl font-black text-green-500">
                        {submission?.score} <span className="text-xs font-normal opacity-70">/ 100</span>
                      </div>
                    </div>

                    {/* FEEDBACK KOREKTOR */}
                    {submission?.feedback ? (
                      <div className={`p-4 rounded-xl border ${
                        isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-green-200'
                      }`}>
                        <div className="flex items-center gap-2 text-xs font-bold text-indigo-500 mb-1">
                          <MessageSquare className="w-3.5 h-3.5" /> Catatan / Feedback Korektor:
                        </div>
                        <p className="text-sm font-medium leading-relaxed whitespace-pre-line text-slate-700 dark:text-slate-200">
                          {submission.feedback}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs italic opacity-60">Tidak ada catatan feedback tambahan dari korektor.</p>
                    )}

                    {/* RINCIAN CHECKLIST YANG DITERIMA */}
                    <div className="pt-2">
                      <div className="text-xs font-bold uppercase tracking-wider mb-2 opacity-75">
                        Rincian Item Checklist Terpenuhi:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {(currentQ.region === 'thorax' ? THORAX_CHECKLIST_ITEMS : ABDOMEN_CHECKLIST_ITEMS)
                          .flatMap(c => c.items)
                          .map(item => {
                            const isChecked = currentQ.region === 'thorax' 
                              ? !!submission?.checklist?.thorax?.[item.id]
                              : !!submission?.checklist?.abdomen?.[item.id];
                            return (
                              <div 
                                key={item.id} 
                                className={`p-2 rounded-lg flex items-center justify-between border ${
                                  isChecked 
                                    ? 'bg-green-500/10 border-green-500/25 text-green-600 dark:text-green-400 font-bold' 
                                    : 'bg-slate-500/5 border-slate-500/10 opacity-50 line-through'
                                }`}
                              >
                                <span>{item.label}</span>
                                <span>{isChecked ? '✓' : '✗'}</span>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. KUNCI INTERPRETASI & PEMBAHASAN RESMI (HANYA MUNCUL JIKA SUDAH DIKOREKSI) */}
                {isGraded ? (
                  <div className={`p-5 rounded-2xl border space-y-4 animate-in fade-in duration-300 ${
                    isDark ? 'bg-slate-800/80 border-indigo-500/30' : 'bg-indigo-50/50 border-indigo-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-indigo-500" />
                      <h4 className="font-black text-base text-indigo-600 dark:text-indigo-400">
                        Kunci Jawaban & Pembahasan Resmi
                      </h4>
                    </div>

                    <div className="space-y-3 text-xs sm:text-sm font-medium leading-relaxed">
                      {currentQ.kunci_interpretasi.data_demografi && (
                        <div>
                          <strong className="block text-indigo-500">1. Data Demografi:</strong>
                          <span>{currentQ.kunci_interpretasi.data_demografi}</span>
                        </div>
                      )}
                      {currentQ.kunci_interpretasi.kualitas_foto && (
                        <div>
                          <strong className="block text-indigo-500">2. Kualitas & Detail Foto:</strong>
                          <span>{currentQ.kunci_interpretasi.kualitas_foto}</span>
                        </div>
                      )}
                      {currentQ.kunci_interpretasi.interpretasi && (
                        <div>
                          <strong className="block text-indigo-500">3. Interpretasi Anatomi Sistematis:</strong>
                          <span>{currentQ.kunci_interpretasi.interpretasi}</span>
                        </div>
                      )}
                      {currentQ.kunci_interpretasi.abnormalitas && (
                        <div>
                          <strong className="block text-indigo-500">4. Abnormalitas yang Didapat:</strong>
                          <span>{currentQ.kunci_interpretasi.abnormalitas}</span>
                        </div>
                      )}
                      {currentQ.kunci_interpretasi.kesimpulan && (
                        <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                          <strong className="block text-indigo-500 font-black">5. Kesimpulan & Diagnosis Kerja:</strong>
                          <span className="font-semibold">{currentQ.kunci_interpretasi.kesimpulan}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* PEMBAHASAN MASIH DIKUNCI */
                  <div className={`p-4 rounded-xl border border-dashed flex items-center gap-3 ${
                    isDark ? 'border-slate-700 text-slate-400' : 'border-slate-300 text-slate-500'
                  }`}>
                    <ShieldAlert className="w-5 h-5 shrink-0 text-amber-500" />
                    <span className="text-xs font-semibold">
                      Kunci jawaban & pembahasan resmi terkunci demi menjaga objektivitas. Pembahasan akan terbuka otomatis setelah dikoreksi oleh admin paket soal.
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className={`p-4 sm:p-5 flex items-center justify-between border-t shrink-0 ${
          isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
        }`}>
          {/* NAVIGASI PREV / NEXT */}
          <div className="flex items-center gap-2">
            <button
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 disabled:opacity-40 disabled:pointer-events-none hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Sebelumnya
            </button>
            <button
              disabled={currentIdx >= questions.length - 1}
              onClick={() => setCurrentIdx(prev => Math.min(questions.length - 1, prev + 1))}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 disabled:opacity-40 disabled:pointer-events-none hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              Selanjutnya <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* TOMBOL SUBMIT */}
          {!isReadOnly ? (
            <button
              onClick={() => setShowConfirmFinish(true)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 hover:scale-105 active:scale-95 transition"
            >
              <Send className="w-4 h-4" /> Kumpulkan Ujian
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-xs sm:text-sm"
            >
              Tutup Lembar Ujian
            </button>
          )}
        </div>
      </div>

      {/* CONFIRMATION SUBMIT MODAL */}
      {showConfirmFinish && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-150">
          <div className={`w-full max-w-md p-6 rounded-3xl shadow-2xl border ${
            isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className="text-xl font-black mb-2">Kumpulkan Jawaban Essay?</h3>
            <p className="text-sm opacity-70 mb-6">
              Setelah dikumpulkan, jawaban akan masuk ke antrean koreksi manual Admin ({packet.admin_name || 'Admin'}). Anda tidak dapat mengubah jawaban sampai selesai dinilai.
            </p>
            <div className="flex justify-end gap-3">
              <button
                disabled={submitting}
                onClick={() => setShowConfirmFinish(false)}
                className="px-4 py-2 rounded-xl font-bold border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition text-sm"
              >
                Kembali Periksa
              </button>
              <button
                disabled={submitting}
                onClick={handleSubmitExam}
                className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition text-sm flex items-center gap-2 shadow-lg shadow-indigo-500/30"
              >
                {submitting ? 'Mengirim...' : 'Ya, Kumpulkan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL */}
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
    </div>
  );
};
