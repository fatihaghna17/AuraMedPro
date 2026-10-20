import React, { useState, useEffect } from 'react';
import { 
  X, CheckCircle, Clock, AlertCircle, ArrowLeft, ArrowRight, 
  Send, Eye, FileText, Check, Award, MessageSquare, Maximize2, 
  ShieldAlert, Minimize2, ZoomIn, ZoomOut, RefreshCw, Wand2, LogOut, ChevronRight
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
  theme = 'dark',
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
  const [showConfirmExit, setShowConfirmExit] = useState(false);
  const [imgZoom, setImgZoom] = useState(1);
  const [invertColors, setInvertColors] = useState(false);

  const currentQ = questions[currentIdx] || null;

  useEffect(() => {
    loadSubmission();
  }, [packet.id, currentUser?.id]);

  // Reset image controls on question change
  useEffect(() => {
    setImgZoom(1);
    setInvertColors(false);
  }, [currentIdx]);

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

  const handleInsertTemplate = (type: 'thorax' | 'abdomen') => {
    if (!currentQ || isReadOnly) return;
    const existing = answers[currentQ.id] || '';
    if (existing.trim().length > 10) {
      if (!confirm('Ganti jawaban saat ini dengan template sistematika pembacaan?')) return;
    }

    const thoraxTemplate = `1. DATA DEMOGRAFI PASIEN
- Nama: ${currentQ.identitas_pasien?.nama || ''}
- Tanggal Lahir / Usia: ${currentQ.identitas_pasien?.tanggal_lahir || ''}
- Jenis Kelamin: ${currentQ.identitas_pasien?.jenis_kelamin || ''}
- No RM: ${currentQ.identitas_pasien?.no_rm || ''}

2. DETAIL & KUALITAS FOTO
- Tanggal & Proyeksi: 
- Keadekuatan (Area terpotong, Inspirasi, Simetrisitas, Eksposure): 

3. INTERPRETASI FOTO SISTEMATIS
- Jantung & Mediastinum (CTR): 
- Paru: 
- Sinus Kostofrenikus: 
- Hemidiafragma: 
- Trakhea: 
- Tulang & Dinding Dada: 
- Medical Devices: 

4. ABNORMALITAS YANG DIDAPAT
- Temuan Utama: 

5. KESIMPULAN & DIAGNOSIS
- Kesan Radiologis: 
- Diagnosis Banding: `;

    const abdomenTemplate = `1. DATA DEMOGRAFI PASIEN
- Nama: ${currentQ.identitas_pasien?.nama || ''}
- Tanggal Lahir / Usia: ${currentQ.identitas_pasien?.tanggal_lahir || ''}
- Jenis Kelamin: ${currentQ.identitas_pasien?.jenis_kelamin || ''}
- No RM: ${currentQ.identitas_pasien?.no_rm || ''}

2. DETAIL & KUALITAS FOTO
- Tanggal & Posisi/Proyeksi (Supine/Erect/LLD): 
- Keadekuatan Foto (Diafragma s.d. Simfisis Pubis, Eksposure): 

3. INTERPRETASI FOTO SISTEMATIS
- Preperitoneal Fat Line: 
- Psoas Line & Kontur Ginjal: 
- Distribusi Udara Usus & Fecal Material: 
- Udara Bebas Intraperitoneal (Pneumoperitoneum): 
- Distensi Usus & Air-Fluid Level: 
- Kalsifikasi / Bayangan Radiopak: 
- Tulang / Skelet: 

4. ABNORMALITAS YANG DIDAPAT
- Temuan Utama: 

5. KESIMPULAN & DIAGNOSIS
- Kesan Radiologis: 
- Diagnosis Banding: `;

    setAnswers(prev => ({
      ...prev,
      [currentQ.id]: type === 'thorax' ? thoraxTemplate : abdomenTemplate
    }));
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
    <div className="fixed inset-0 z-[9999] w-screen h-screen min-h-screen bg-slate-950 text-slate-100 flex flex-col m-0 p-0 overflow-hidden select-none animate-in fade-in duration-200">
      
      {/* ========================================================================= */}
      {/* 1. TOP EXAM HEADER (CLEAN CBT HEADER, NO GROUP NAME / DASHBOARD ON TOP)   */}
      {/* ========================================================================= */}
      <header className="h-16 px-4 sm:px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0 z-20">
        
        {/* LEFT: EXAM BADGE & QUICK QUESTION NAV */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0 flex items-center gap-1">
              <span>🩺</span>
              <span className="hidden sm:inline">CBT RADIOLOGI</span>
            </span>
          </div>

          <div className="h-5 w-px bg-slate-800 hidden sm:block" />

          {/* QUESTION SELECTOR PILLS */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-[200px] sm:max-w-md py-1">
            {questions.map((q, idx) => {
              const isAnswered = Boolean((answers[q.id] || '').trim());
              const isCurrent = idx === currentIdx;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(idx)}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs font-black transition-all flex items-center justify-center shrink-0 cursor-pointer ${
                    isCurrent
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40 ring-2 ring-indigo-400'
                      : isAnswered
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                  }`}
                  title={`Soal ${idx + 1}: ${q.region.toUpperCase()}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* CENTER: SOAL DETAIL (DESKTOP) */}
        <div className="hidden md:flex flex-col items-center text-center">
          <span className="text-xs font-extrabold text-slate-200">
            {packet.title}
          </span>
          <span className="text-[10px] font-semibold text-slate-400">
            Soal {currentIdx + 1} dari {questions.length} • Region: <strong className="text-indigo-400 uppercase">{currentQ?.region}</strong> • Kasus: {currentQ?.metadata?.kasus || 'Radiologi Klinis'}
          </span>
        </div>

        {/* RIGHT: STATUS & EXIT */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* STATUS PILL */}
          {isGraded ? (
            <span className="px-3 py-1 bg-green-500/15 text-green-400 border border-green-500/30 rounded-full text-xs font-black flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" /> Skor: {submission?.score}/100
            </span>
          ) : isPending ? (
            <span className="px-3 py-1 bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded-full text-xs font-black flex items-center gap-1.5 animate-pulse">
              <Clock className="w-3.5 h-3.5" /> Menunggu Koreksi
            </span>
          ) : (
            <span className="hidden sm:inline-flex px-3 py-1 bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-bold">
              Ujian Berlangsung
            </span>
          )}

          {/* EXIT EXAM BUTTON */}
          <button
            onClick={() => {
              if (!isReadOnly && Object.keys(answers).length > 0) {
                setShowConfirmExit(true);
              } else {
                onClose();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
            title="Keluar dari lembar ujian"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN WORKSPACE (FULLSCREEN SPLIT: LEFT VIGNETTE+XRAY, RIGHT ESSAY)    */}
      {/* ========================================================================= */}
      <main className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 bg-slate-950">
        
        {/* ----------------------------------------------------------------------- */}
        {/* SISI KIRI (LG: COL-SPAN-6): SKENARIO KLINIS & X-RAY VIEWER               */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-6 h-full overflow-y-auto p-4 sm:p-6 border-r border-slate-800/80 space-y-4">
          
          {/* SKENARIO KLINIS (VIGNETTE) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-indigo-400">
                Skenario Kasus #{currentIdx + 1}
              </span>
              {currentQ?.metadata?.tingkat_kesulitan && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  Tingkat: {currentQ.metadata.tingkat_kesulitan}
                </span>
              )}
            </div>
            <p className="text-sm leading-relaxed text-slate-200 font-medium">
              {currentQ?.vignette}
            </p>

            {/* IDENTITAS DEMOGRAFI PASIEN */}
            {currentQ?.identitas_pasien && (
              <div className="mt-3.5 pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs text-slate-400 font-medium">
                <div><strong className="text-slate-300">Nama:</strong> {currentQ.identitas_pasien.nama}</div>
                <div><strong className="text-slate-300">TTL / Usia:</strong> {currentQ.identitas_pasien.tanggal_lahir}</div>
                <div><strong className="text-slate-300">Jenis Kelamin:</strong> {currentQ.identitas_pasien.jenis_kelamin}</div>
                <div><strong className="text-slate-300">No RM:</strong> {currentQ.identitas_pasien.no_rm}</div>
              </div>
            )}
          </div>

          {/* RADIOLOGY X-RAY VIEWER DENGAN TOOLBAR */}
          {currentQ?.image_url && (
            <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm flex flex-col">
              
              {/* VIEWER TOOLBAR */}
              <div className="px-4 py-2.5 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  Foto Rontgen ({currentQ.region.toUpperCase()})
                </span>

                <div className="flex items-center gap-1 text-slate-300">
                  <button
                    onClick={() => setImgZoom(z => Math.max(0.7, z - 0.25))}
                    className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] font-mono font-bold px-1 text-slate-400">
                    {Math.round(imgZoom * 100)}%
                  </span>
                  <button
                    onClick={() => setImgZoom(z => Math.min(3, z + 0.25))}
                    className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setInvertColors(inv => !inv)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                      invertColors
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        : 'border-slate-700 hover:bg-slate-700 text-slate-400'
                    }`}
                    title="Invert Warna Rontgen (Negatif)"
                  >
                    Invert
                  </button>
                  <button
                    onClick={() => { setImgZoom(1); setInvertColors(false); }}
                    className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                    title="Reset Ukuran"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setLightboxImg(currentQ.image_url)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition ml-1 cursor-pointer"
                    title="Buka Layar Penuh"
                  >
                    <Maximize2 className="w-3 h-3" />
                    <span>Perbesar</span>
                  </button>
                </div>
              </div>

              {/* IMAGE CANVAS CONTAINER */}
              <div 
                className="relative bg-black flex items-center justify-center min-h-[300px] max-h-[440px] overflow-hidden cursor-zoom-in group"
                onClick={() => setLightboxImg(currentQ.image_url)}
              >
                <img 
                  src={currentQ.image_url} 
                  alt="Foto Radiologi" 
                  style={{
                    transform: `scale(${imgZoom})`,
                    filter: invertColors ? 'invert(1) contrast(1.2)' : 'none',
                    transition: 'transform 0.2s ease-out'
                  }}
                  className="w-full h-auto max-h-[440px] object-contain"
                  onError={(e) => {
                    (e.target as any).src = 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1000&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold uppercase tracking-wider">
                  Klik untuk Zoom Layar Penuh
                </div>
              </div>
            </div>
          )}

          {/* INSTRUKSI INTERPRETASI */}
          <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-xs font-medium text-indigo-300">
            <strong className="block text-indigo-400 font-black mb-1">Instruksi Soal:</strong>
            {currentQ?.pertanyaan}
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* SISI KANAN (LG: COL-SPAN-6): LEMBAR JAWABAN ESSAY / FEEDBACK / PEMBAHASAN */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-6 h-full overflow-y-auto p-4 sm:p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            
            {/* TOOLBAR TEMPLATE SISTEMATIKA & WORD COUNT */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                    Lembar Jawaban Essay
                  </span>
                </div>
                <span className="text-xs font-semibold text-slate-400">
                  {(answers[currentQ?.id || ''] || '').trim().split(/\s+/).filter(Boolean).length} kata
                </span>
              </div>

              {/* TOMBOL BANTUAN TEMPLATE SISTEMATIKA */}
              {!isReadOnly && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80 flex-wrap">
                  <span className="text-[11px] font-semibold text-slate-400">Sisipkan Format:</span>
                  <button
                    type="button"
                    onClick={() => handleInsertTemplate(currentQ?.region || 'thorax')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 transition cursor-pointer"
                  >
                    <Wand2 className="w-3 h-3" />
                    <span>+ Template {currentQ?.region === 'abdomen' ? 'Abdomen' : 'Thorax'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertTemplate(currentQ?.region === 'abdomen' ? 'thorax' : 'abdomen')}
                    className="text-[11px] font-semibold text-slate-400 hover:text-slate-200 transition cursor-pointer"
                  >
                    Template {currentQ?.region === 'abdomen' ? 'Thorax' : 'Abdomen'}
                  </button>
                </div>
              )}
            </div>

            {/* TEXTAREA INPUT ESSAY */}
            <div className="relative">
              <textarea
                rows={12}
                disabled={isReadOnly}
                value={answers[currentQ?.id || ''] || ''}
                onChange={(e) => handleAnswerChange(e.target.value)}
                placeholder="Tuliskan pembacaan radiologi Anda secara sistematis di sini:&#10;1. Data Demografi Pasien&#10;2. Penilaian Gambar & Kualitas Foto&#10;3. Interpretasi Organ Sistematik&#10;4. Abnormalitas yang Didapat&#10;5. Kesimpulan & Diagnosis Kerja..."
                className={`w-full p-4 rounded-2xl text-sm font-medium leading-relaxed transition focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-y min-h-[220px] max-h-[380px] bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 ${
                  isReadOnly ? 'opacity-90 cursor-not-allowed bg-slate-900/60' : ''
                }`}
              />

              {isPending && (
                <div className="mt-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-center gap-2.5 font-semibold">
                  <Clock className="w-4 h-4 shrink-0 animate-spin" />
                  Jawaban telah dikirim. Saat ini sedang menunggu admin/korektor paket soal ini untuk memeriksa checklist & memberikan feedback.
                </div>
              )}
            </div>

            {/* JIKA SUDAH DIKOREKSI: TAMPILKAN NILAI, FEEDBACK & BREAKDOWN CHECKLIST */}
            {isGraded && (
              <div className="p-5 rounded-2xl bg-slate-900 border border-green-500/30 space-y-4 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-green-400" />
                    <h4 className="font-black text-sm text-slate-100">Hasil Koreksi Manual Admin</h4>
                  </div>
                  <div className="text-xl font-black text-green-400">
                    {submission?.score} <span className="text-xs font-normal text-slate-400">/ 100</span>
                  </div>
                </div>

                {/* FEEDBACK KOREKTOR */}
                {submission?.feedback && (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 mb-1">
                      <MessageSquare className="w-3.5 h-3.5" /> Catatan / Feedback Korektor ({submission.graded_by || 'Admin'}):
                    </div>
                    <p className="text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-line text-slate-200">
                      {submission.feedback}
                    </p>
                  </div>
                )}

                {/* RINCIAN CHECKLIST YANG DITERIMA */}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider mb-2 text-slate-400">
                    Rincian Item Checklist Terpenuhi:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {(currentQ?.region === 'thorax' ? THORAX_CHECKLIST_ITEMS : ABDOMEN_CHECKLIST_ITEMS)
                      .flatMap(c => c.items)
                      .map(item => {
                        const isChecked = currentQ?.region === 'thorax'
                          ? !!submission?.checklist?.thorax?.[item.id]
                          : !!submission?.checklist?.abdomen?.[item.id];
                        return (
                          <div 
                            key={item.id}
                            className={`p-2 rounded-lg flex items-center justify-between border ${
                              isChecked 
                                ? 'bg-green-500/10 border-green-500/30 text-green-300 font-bold'
                                : 'bg-slate-800/40 border-slate-800 text-slate-500 line-through'
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

            {/* JIKA SUDAH DIKOREKSI: KUNCI PEMBAHASAN RESMI TERBUKA */}
            {isGraded ? (
              <div className="p-5 rounded-2xl bg-slate-900 border border-indigo-500/30 space-y-3 animate-in fade-in duration-300">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-indigo-400" />
                  <h4 className="font-black text-sm text-indigo-300">
                    Kunci Jawaban & Pembahasan Resmi
                  </h4>
                </div>

                <div className="space-y-3 text-xs sm:text-sm leading-relaxed text-slate-200">
                  {currentQ?.kunci_interpretasi.data_demografi && (
                    <div>
                      <strong className="block text-indigo-400">1. Data Demografi:</strong>
                      <span>{currentQ.kunci_interpretasi.data_demografi}</span>
                    </div>
                  )}
                  {currentQ?.kunci_interpretasi.kualitas_foto && (
                    <div>
                      <strong className="block text-indigo-400">2. Kualitas & Detail Foto:</strong>
                      <span>{currentQ.kunci_interpretasi.kualitas_foto}</span>
                    </div>
                  )}
                  {currentQ?.kunci_interpretasi.interpretasi && (
                    <div>
                      <strong className="block text-indigo-400">3. Interpretasi Anatomi:</strong>
                      <span>{currentQ.kunci_interpretasi.interpretasi}</span>
                    </div>
                  )}
                  {currentQ?.kunci_interpretasi.abnormalitas && (
                    <div>
                      <strong className="block text-indigo-400">4. Abnormalitas yang Didapat:</strong>
                      <span>{currentQ.kunci_interpretasi.abnormalitas}</span>
                    </div>
                  )}
                  {currentQ?.kunci_interpretasi.kesimpulan && (
                    <div className="p-3 rounded-xl bg-indigo-950/60 border border-indigo-500/20">
                      <strong className="block text-indigo-400 font-black">5. Kesimpulan & Diagnosis Kerja:</strong>
                      <span className="font-semibold">{currentQ.kunci_interpretasi.kesimpulan}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* PEMBAHASAN MASIH DIKUNCI */
              <div className="p-4 rounded-xl border border-dashed border-slate-800 bg-slate-900/50 flex items-center gap-3 text-slate-400">
                <ShieldAlert className="w-5 h-5 shrink-0 text-amber-500" />
                <span className="text-xs font-semibold">
                  Kunci pembahasan resmi terkunci demi menjaga objektivitas ujian. Pembahasan akan terbuka otomatis setelah dikoreksi oleh admin.
                </span>
              </div>
            )}

          </div>

          {/* DUMMY SPACER */}
          <div className="h-6" />
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 3. BOTTOM EXAM FOOTER BAR                                                 */}
      {/* ========================================================================= */}
      <footer className="h-16 px-4 sm:px-6 bg-slate-900 border-t border-slate-800 flex items-center justify-between shrink-0 z-20">
        
        {/* NAVIGASI PREV / NEXT */}
        <div className="flex items-center gap-2">
          <button
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-700 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Sebelumnya
          </button>
          <button
            disabled={currentIdx >= questions.length - 1}
            onClick={() => setCurrentIdx(prev => Math.min(questions.length - 1, prev + 1))}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-700 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
          >
            Selanjutnya <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="flex items-center gap-3">
          {!isReadOnly ? (
            <button
              onClick={() => setShowConfirmFinish(true)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 hover:scale-105 active:scale-95 transition text-xs sm:text-sm cursor-pointer"
            >
              <Send className="w-4 h-4" /> Kumpulkan Ujian
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm border border-slate-700 transition cursor-pointer"
            >
              Tutup Lembar Ujian
            </button>
          )}
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 4. MODAL DIALOGS (CONFIRM SUBMIT, CONFIRM EXIT, LIGHTBOX)                 */}
      {/* ========================================================================= */}
      
      {/* CONFIRM FINISH MODAL */}
      {showConfirmFinish && (
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-150">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 text-slate-100 shadow-2xl">
            <h3 className="text-xl font-black mb-2">Kumpulkan Jawaban Essay?</h3>
            <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
              Setelah dikumpulkan, lembar jawaban akan langsung masuk ke antrean koreksi manual Admin ({packet.admin_name || 'Admin'}). Anda tidak dapat mengubah jawaban sampai selesai dinilai.
            </p>
            <div className="flex justify-end gap-3">
              <button
                disabled={submitting}
                onClick={() => setShowConfirmFinish(false)}
                className="px-4 py-2 rounded-xl font-bold border border-slate-700 text-slate-300 hover:bg-slate-800 transition text-xs cursor-pointer"
              >
                Kembali Periksa
              </button>
              <button
                disabled={submitting}
                onClick={handleSubmitExam}
                className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 transition text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                {submitting ? 'Mengirim...' : 'Ya, Kumpulkan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM EXIT MODAL */}
      {showConfirmExit && (
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-150">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 text-slate-100 shadow-2xl">
            <h3 className="text-xl font-black mb-2">Keluar dari Halaman Ujian?</h3>
            <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
              Jawaban essay yang sedang Anda ketik belum dikumpulkan ke admin. Anda dapat kembali sewaktu-waktu untuk melanjutkannya.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmExit(false)}
                className="px-4 py-2 rounded-xl font-bold border border-slate-700 text-slate-300 hover:bg-slate-800 transition text-xs cursor-pointer"
              >
                Lanjutkan Ujian
              </button>
              <button
                onClick={() => { setShowConfirmExit(false); onClose(); }}
                className="px-5 py-2 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-500 transition text-xs cursor-pointer shadow-lg shadow-rose-600/30"
              >
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN LIGHTBOX IMAGE VIEWER */}
      {lightboxImg && (
        <div 
          onClick={() => setLightboxImg(null)}
          className="fixed inset-0 z-[10001] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
        >
          <img 
            src={lightboxImg} 
            alt="Perbesar Foto Rontgen" 
            className="max-w-full max-h-[92vh] object-contain rounded-xl shadow-2xl" 
          />
          <button 
            onClick={() => setLightboxImg(null)}
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}

    </div>
  );
};
