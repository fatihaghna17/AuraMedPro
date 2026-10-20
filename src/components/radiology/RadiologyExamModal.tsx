import React, { useState, useEffect } from 'react';
import { 
  X, CheckCircle, Clock, AlertCircle, ArrowLeft, ArrowRight, 
  Send, Eye, FileText, Check, Award, MessageSquare, Maximize2, 
  ShieldAlert, Minimize2, ZoomIn, ZoomOut, RefreshCw, Wand2, LogOut, 
  ChevronRight, Sparkles, ShieldCheck, Flame, Stethoscope, Play
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
  
  // Stages: 'briefing' (gerbang peralihan) -> 'transitioning' (animasi masuk) -> 'exam' (ruang ujian penuh)
  const [stage, setStage] = useState<'briefing' | 'transitioning' | 'exam'>('briefing');
  const [transitionCountdown, setTransitionCountdown] = useState(3);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  // Lock body scroll and sync fullscreen status
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleFsChange = () => {
      const doc = document as any;
      const isFs = Boolean(
        document.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );
      setIsFullscreen(isFs);
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    document.addEventListener('mozfullscreenchange', handleFsChange);
    document.addEventListener('MSFullscreenChange', handleFsChange);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      document.removeEventListener('mozfullscreenchange', handleFsChange);
      document.removeEventListener('MSFullscreenChange', handleFsChange);
    };
  }, []);

  useEffect(() => {
    loadSubmission();
  }, [packet.id, currentUser?.id]);

  // Reset image zoom & invert on question change
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

  const requestBrowserFullscreen = async () => {
    try {
      const el = document.documentElement as any;
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen();
      } else if (el.mozRequestFullScreen) {
        await el.mozRequestFullScreen();
      } else if (el.msRequestFullscreen) {
        await el.msRequestFullscreen();
      }
    } catch (err) {
      console.log('Fullscreen request bypassed:', err);
    }
  };

  const exitBrowserFullscreen = async () => {
    try {
      const doc = document as any;
      if (document.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
          await doc.mozCancelFullScreen();
        }
      }
    } catch (err) {
      console.log('Exit fullscreen error:', err);
    }
  };

  const toggleFullscreen = () => {
    if (isFullscreen) {
      exitBrowserFullscreen();
    } else {
      requestBrowserFullscreen();
    }
  };

  const handleStartExam = async () => {
    await requestBrowserFullscreen();
    setStage('transitioning');
    setTransitionCountdown(3);

    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        clearInterval(interval);
        setStage('exam');
      } else {
        setTransitionCountdown(count);
      }
    }, 450);
  };

  const handleExit = () => {
    exitBrowserFullscreen();
    onClose();
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

  // =========================================================================
  // 1. TAHAP PERALIHAN: GERBANG MASUK CBT RADIOLOGI (BRIEFING & FULLSCREEN GATE)
  // =========================================================================
  if (stage === 'briefing') {
    return (
      <div className="fixed inset-0 z-[9999] w-screen h-[100dvh] max-h-[100dvh] bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 overflow-y-auto select-none animate-in fade-in duration-200">
        <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden my-auto">
          {/* Glowing background accents */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

          {/* Top Badge */}
          <div className="flex items-center justify-between mb-4 relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gerbang CBT Radiologi</span>
            </span>
            <button
              onClick={handleExit}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Title & Metadata */}
          <div className="relative z-10 mb-6">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
              {packet.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              {packet.description || 'Latihan interpretasi radiologi klinis interaktif berbasis essay dengan koreksi manual terstandar.'}
            </p>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 relative z-10">
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Format Soal</span>
              <span className="text-sm font-black text-indigo-300 mt-1">{questions.length} Kasus Essay</span>
              <span className="text-[10px] text-slate-500">Thorax & Abdomen</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Korektor Manual</span>
              <span className="text-sm font-black text-amber-300 mt-1 truncate">{packet.admin_name || 'Admin'}</span>
              <span className="text-[10px] text-slate-500">1 Paket 1 Korektor</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Penilaian</span>
              <span className="text-sm font-black text-emerald-300 mt-1">Checklist FK UNS</span>
              <span className="text-[10px] text-slate-500">52 Rubrik Objektif</span>
            </div>
          </div>

          {/* Petunjuk Sistematis & Keamanan Layar Penuh */}
          <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 mb-6 relative z-10 space-y-2.5">
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs uppercase tracking-wider">
              <Stethoscope className="w-4 h-4 text-indigo-400" />
              <span>Sistematika & Ketentuan Ujian</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside leading-relaxed">
              <li>
                Sediakan interpretasi sistematis: <strong className="text-indigo-200">Identitas, Kelayakan Foto, Organ, Abnormalitas, dan Kesimpulan</strong>.
              </li>
              <li>
                Gunakan fitur <strong className="text-indigo-200">Zoom</strong> & <strong className="text-indigo-200">Invert Warna Film</strong> pada citra rontgen untuk memperjelas corakan atau udara bebas.
              </li>
              <li>
                Mode <strong className="text-indigo-200">Layar Penuh (Distraction-Free)</strong> akan diaktifkan secara otomatis saat Anda masuk untuk mengoptimalkan ruang pandang citra rontgen.
              </li>
              {isGraded ? (
                <li className="text-green-400 font-bold">
                  Ujian Anda telah selesai dikoreksi! Skor Anda: {submission?.score}/100.
                </li>
              ) : isPending ? (
                <li className="text-amber-400 font-bold">
                  Jawaban Anda sedang dalam antrean koreksi oleh {packet.admin_name || 'Admin'}.
                </li>
              ) : null}
            </ul>
          </div>

          {/* Action CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 relative z-10">
            <button
              onClick={handleExit}
              className="w-full sm:w-auto px-5 py-3.5 rounded-2xl border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold text-xs sm:text-sm transition cursor-pointer"
            >
              Kembali ke Grup
            </button>

            <button
              onClick={handleStartExam}
              className="w-full flex-1 py-3.5 px-6 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Maximize2 className="w-4 h-4" />
              <span>
                {isGraded
                  ? 'Buka Lembar Ujian & Pembahasan (Layar Penuh)'
                  : isPending
                  ? 'Buka Lembar Jawaban (Layar Penuh)'
                  : 'Masuk Ruang Ujian (Mode Layar Penuh)'}
              </span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. TAHAP PERALIHAN ANIMASI COUNTDOWN (TRANSITIONING SCREEN)
  // =========================================================================
  if (stage === 'transitioning') {
    return (
      <div 
        onClick={() => setStage('exam')}
        className="fixed inset-0 z-[9999] w-screen h-[100dvh] max-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 select-none cursor-pointer animate-in fade-in duration-150"
      >
        <div className="relative flex items-center justify-center mb-8">
          {/* Animated concentric rings */}
          <div className="absolute w-36 h-36 rounded-full border border-indigo-500/20 animate-ping" />
          <div className="absolute w-28 h-28 rounded-full border border-indigo-500/40 animate-pulse" />
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center shadow-2xl shadow-indigo-500/50">
            <span className="text-3xl font-black text-white">{transitionCountdown}</span>
          </div>
        </div>

        <div className="text-center max-w-sm space-y-2">
          <h3 className="text-xl font-black text-white tracking-tight">
            Memasuki Ruang Ujian CBT
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Mengunci mode layar penuh dan mengalibrasi citra rontgen resolusi tinggi...
          </p>
        </div>

        <div className="mt-8 text-[11px] text-slate-500 font-semibold flex items-center gap-1.5 hover:text-slate-300 transition">
          <span>Klik layar untuk langsung masuk</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. TAHAP RUANG UJIAN PENUH (DISTRACTION-FREE FULLSCREEN EXAM MODE)
  // =========================================================================
  return (
    <div className="fixed inset-0 z-[9999] w-screen h-[100dvh] max-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col m-0 p-0 overflow-hidden select-none animate-in fade-in duration-200">
      
      {/* ----------------------------------------------------------------------- */}
      {/* TOP CBT HEADER (NO DASHBOARD, NO GROUP HEADER, CLEAN EXAM BAR)          */}
      {/* ----------------------------------------------------------------------- */}
      <header className="h-16 px-4 sm:px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0 z-20">
        
        {/* LEFT: EXAM BADGE & QUESTION PILLS */}
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

        {/* RIGHT: TOGGLE FULLSCREEN, STATUS & EXIT */}
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

          {/* TOGGLE FULLSCREEN BUTTON */}
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Mode Layar Penuh'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-indigo-400" /> : <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Kecilkan' : 'Fullscreen'}</span>
          </button>

          {/* EXIT EXAM BUTTON */}
          <button
            onClick={() => {
              if (!isReadOnly && Object.keys(answers).length > 0) {
                setShowConfirmExit(true);
              } else {
                handleExit();
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

      {/* ----------------------------------------------------------------------- */}
      {/* MAIN WORKSPACE (FULLSCREEN SPLIT: LEFT VIGNETTE+XRAY, RIGHT ESSAY)      */}
      {/* ----------------------------------------------------------------------- */}
      <main className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 bg-slate-950">
        
        {/* SISI KIRI (LG: COL-SPAN-6): SKENARIO KLINIS & X-RAY VIEWER */}
        <div className="lg:col-span-6 h-full overflow-y-auto p-4 sm:p-6 border-r border-slate-800/80 space-y-4">
          
          {/* IDENTITAS PASIEN & KASUS KLINIS */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                Skenario Klinis Pasien
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                Region: {currentQ?.region.toUpperCase()}
              </span>
            </div>

            {/* Demografi Pasien */}
            {currentQ?.identitas_pasien && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px]">
                <div>
                  <span className="text-slate-500 block font-semibold">Nama:</span>
                  <span className="font-bold text-slate-200">{currentQ.identitas_pasien.nama || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block font-semibold">Tanggal Lahir/Usia:</span>
                  <span className="font-bold text-slate-200">{currentQ.identitas_pasien.tanggal_lahir || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block font-semibold">Jenis Kelamin:</span>
                  <span className="font-bold text-slate-200">{currentQ.identitas_pasien.jenis_kelamin || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block font-semibold">No RM:</span>
                  <span className="font-bold text-slate-200">{currentQ.identitas_pasien.no_rm || '-'}</span>
                </div>
              </div>
            )}

            {/* Vignette / Kasus */}
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
              {currentQ?.vignette}
            </p>

            {/* Pertanyaan Spesifik */}
            {currentQ?.pertanyaan && (
              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-xs text-indigo-200">
                <strong className="block text-indigo-300 font-bold mb-1">Instruksi Pemeriksaan:</strong>
                {currentQ.pertanyaan}
              </div>
            )}
          </div>

          {/* CITRA RADIOLOGI INTERAKTIF */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-indigo-400" />
                Foto Rontgen ({currentQ?.image_urls.length || 0} Citra)
              </span>

              {/* TOOLBAR X-RAY */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setImgZoom(prev => Math.min(prev + 0.25, 3))}
                  className="p-1.5 hover:bg-slate-800 text-slate-300 rounded-lg transition"
                  title="Perbesar (Zoom In)"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setImgZoom(prev => Math.max(prev - 0.25, 0.75))}
                  className="p-1.5 hover:bg-slate-800 text-slate-300 rounded-lg transition"
                  title="Perkecil (Zoom Out)"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setInvertColors(prev => !prev)}
                  className={`p-1.5 rounded-lg transition ${invertColors ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}
                  title="Invert Warna Film Negatif"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => { setImgZoom(1); setInvertColors(false); }}
                  className="p-1.5 hover:bg-slate-800 text-slate-300 rounded-lg transition"
                  title="Reset Tampilan"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* CONTAINER GAMBAR */}
            <div className="grid grid-cols-1 gap-3">
              {currentQ?.image_urls.map((url, i) => (
                <div 
                  key={i} 
                  className="relative group rounded-xl overflow-hidden bg-black border border-slate-800 flex items-center justify-center p-2 min-h-[300px] max-h-[460px]"
                >
                  <img
                    src={url}
                    alt={`Rontgen Soal ${currentIdx + 1} #${i + 1}`}
                    style={{
                      transform: `scale(${imgZoom})`,
                      filter: invertColors ? 'invert(1) contrast(1.2)' : 'none',
                      transition: 'transform 0.2s ease-out'
                    }}
                    className="max-h-[440px] max-w-full object-contain cursor-zoom-in"
                    onClick={() => setLightboxImg(url)}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold uppercase tracking-wider pointer-events-none">
                    <span className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700 flex items-center gap-1.5 shadow-lg">
                      <Maximize2 className="w-3.5 h-3.5" /> Klik untuk Perbesar Penuh
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-[11px] text-slate-400 text-center italic">
              Tips: Gunakan tombol Zoom & Invert Warna di atas untuk membedakan densitas radiopak/radiolusen.
            </div>
          </div>

          <div className="h-4" />
        </div>

        {/* SISI KANAN (LG: COL-SPAN-6): LEMBAR JAWABAN ESSAY & PEMBAHASAN */}
        <div className="lg:col-span-6 h-full overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* HEADER JAWABAN & TEMPLATE SHORTCUT */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-black text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-400" />
                Lembar Jawaban Interpretasi Essay
              </h4>
              <p className="text-[11px] text-slate-400">
                Tuliskan analisis interpretasi foto rontgen secara sistematis.
              </p>
            </div>

            {/* TOMBOL TEMPLATE SISTEMATIS */}
            {!isReadOnly && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleInsertTemplate(currentQ?.region === 'abdomen' ? 'abdomen' : 'thorax')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 transition cursor-pointer"
                  title="Sisipkan format pembacaan standar FK UNS"
                >
                  <Wand2 className="w-3 h-3" />
                  <span>+ Template {currentQ?.region === 'abdomen' ? 'Abdomen' : 'Thorax'}</span>
                </button>
              </div>
            )}
          </div>

          {/* TEXTAREA JAWABAN ESSAY */}
          <div className="space-y-1.5">
            <textarea
              rows={11}
              disabled={isReadOnly}
              value={answers[currentQ?.id || ''] || ''}
              onChange={e => handleAnswerChange(e.target.value)}
              placeholder="Ketik interpretasi radiologi Anda di sini...&#10;&#10;Contoh:&#10;1. Data Pasien: Tn. A, 45 tahun&#10;2. Kualitas: Foto Thorax PA erect, inspirasi cukup, simetris&#10;3. Interpretasi: Paru corakan bronkovaskular dalam batas normal, sinus lancip, diafragma licin...&#10;4. Abnormalitas: Tampak hiperlusen avaskular pada hemithorax dextra...&#10;5. Kesimpulan: Tension Pneumothorax dextra"
              className={`w-full p-4 rounded-2xl text-sm font-medium leading-relaxed transition focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-y min-h-[220px] max-h-[380px] bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 ${
                isReadOnly ? 'opacity-85 cursor-not-allowed bg-slate-900/60' : ''
              }`}
            />
            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
              <span>Panjang jawaban: {(answers[currentQ?.id || ''] || '').length} karakter</span>
              {!isReadOnly && (
                <span className="text-indigo-400 font-semibold">Tersimpan otomatis saat Anda mengetik</span>
              )}
            </div>
          </div>

          {/* HASIL KOREKSI ADMIN JIKA SUDAH GRADED */}
          {isGraded && (
            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-2xl bg-green-950/40 border border-green-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-green-400 flex items-center gap-1.5">
                    <Award className="w-4 h-4" />
                    Hasil Penilaian Korektor ({packet.admin_name || 'Admin'})
                  </span>
                  <span className="text-lg font-black text-green-300">
                    Skor: {submission?.score}/100
                  </span>
                </div>

                {/* FEEDBACK DARI ADMIN */}
                {submission?.feedback && (
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                    <strong className="text-xs font-bold text-amber-400 flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" />
                      Catatan & Feedback Korektor:
                    </strong>
                    <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {submission.feedback}
                    </p>
                  </div>
                )}

                {/* RINCIAN CHECKLIST YANG DIVERIFIKASI ADMIN */}
                {submission?.graded_checklists && currentQ && (
                  <div className="space-y-2 pt-2 border-t border-green-500/20">
                    <span className="text-[11px] font-bold text-slate-300 block">
                      Rincian Checklist Yang Tercapai Pada Soal Ini:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto p-1">
                      {(currentQ.region === 'thorax' ? THORAX_CHECKLIST_ITEMS : ABDOMEN_CHECKLIST_ITEMS).map(item => {
                        const isChecked = Boolean(submission.graded_checklists?.[currentQ.id]?.[item.id]);
                        return (
                          <div 
                            key={item.id}
                            className={`p-2 rounded-xl text-xs flex items-start gap-2 border ${
                              isChecked 
                                ? 'bg-green-500/10 border-green-500/30 text-green-200' 
                                : 'bg-slate-900/50 border-slate-800 text-slate-500 opacity-60'
                            }`}
                          >
                            <span className="mt-0.5">
                              {isChecked ? <Check className="w-3.5 h-3.5 text-green-400 shrink-0" /> : <X className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
                            </span>
                            <span className="text-[11px] leading-snug">{item.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PEMBAHASAN RESMI SOAL */}
          {isGraded ? (
            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-indigo-400" />
                Kunci Interpretasi Resmi & Pembahasan
              </span>

              <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                {currentQ?.kunci_interpretasi.syarat_layak_baca && (
                  <div>
                    <strong className="block text-indigo-400">1. Syarat Layak Baca:</strong>
                    <span>{currentQ.kunci_interpretasi.syarat_layak_baca}</span>
                  </div>
                )}
                {currentQ?.kunci_interpretasi.sistematika_organ && (
                  <div>
                    <strong className="block text-indigo-400">2. Sistematika Organ:</strong>
                    <span>{currentQ.kunci_interpretasi.sistematika_organ}</span>
                  </div>
                )}
                {currentQ?.kunci_interpretasi.abnormalitas && (
                  <div>
                    <strong className="block text-indigo-400">3. Abnormalitas yang Didapat:</strong>
                    <span>{currentQ.kunci_interpretasi.abnormalitas}</span>
                  </div>
                )}
                {currentQ?.kunci_interpretasi.kesimpulan && (
                  <div className="p-3 rounded-xl bg-indigo-950/60 border border-indigo-500/20">
                    <strong className="block text-indigo-400 font-black">4. Kesimpulan & Diagnosis Kerja:</strong>
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

          <div className="h-6" />
        </div>
      </main>

      {/* ----------------------------------------------------------------------- */}
      {/* BOTTOM CBT FOOTER BAR                                                   */}
      {/* ----------------------------------------------------------------------- */}
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
              onClick={handleExit}
              className="px-6 py-2 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm border border-slate-700 transition cursor-pointer"
            >
              Tutup Lembar Ujian
            </button>
          )}
        </div>
      </footer>

      {/* ----------------------------------------------------------------------- */}
      {/* MODAL DIALOGS (CONFIRM SUBMIT, CONFIRM EXIT, LIGHTBOX)                   */}
      {/* ----------------------------------------------------------------------- */}
      
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
                onClick={() => { setShowConfirmExit(false); handleExit(); }}
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
