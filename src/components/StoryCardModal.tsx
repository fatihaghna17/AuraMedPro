import React, { useRef, useEffect, useState } from 'react';
import { X, Download, Share2, Sparkles, Check, Image as ImageIcon, Copy, CheckCheck, MessageCircle } from 'lucide-react';
import { AVATAR_FRAMES, AvatarFrameId } from '../utils/avatarFrames';

interface StoryCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  userLevel: number;
  userRankTitle: string;
  userXP: number;
  currentStreak: number;
  totalQuestionsAnswered: number;
  angkatan?: string | null;
  frameId: AvatarFrameId;
  quizResult?: {
    score: number | string;
    correct: number;
    total: number;
    quizMode?: string;
    suddenDeathStreak?: number;
  };
  theme: string;
  triggerToast?: (msg: string, icon?: string) => void;
}

export const getBraggingCaption = (params: {
  username: string;
  score?: number | string;
  correct?: number;
  total?: number;
  quizMode?: string;
  suddenDeathStreak?: number;
}): string => {
  const { score, correct = 0, total = 0, quizMode, suddenDeathStreak = 0 } = params;

  // 1. Mode Sudden Death (1 Nyawa)
  if (quizMode === 'suddendeath') {
    const streak = suddenDeathStreak || correct;
    if (streak >= 15) {
      return `Babat habis ${streak} soal berturut-turut di mode Sudden Death cuma modal 1 nyawa 💀🔥 Yang lain baru salah 1 udah panik, aku santai melaju tanpa henti. Aura calon dokter spesialis emang beda kelas! 🩺✨\n\nBerani adu mental dan ketahanan CBT lawan gue? Coba taklukkan Sudden Death di AuraMedPro:\n🔗 https://auramedpro.pages.dev`;
    } else if (streak >= 7) {
      return `Tembus ${streak} combo streak tanpa ampun di Sudden Death CBT! ⚡ Jantung boleh berdegup kencang, tapi Aura dokter dingin tetap dominan 😎💉 Yang berani nantang, jangan cuma wacana!\n\nYuk adu nyali drilling soal di AuraMedPro:\n🔗 https://auramedpro.pages.dev`;
    } else {
      return `Baru pemanasan tes ombak di Sudden Death, sengaja gugur lebih awal biar yang lain gak minder 🤫🔥 Tunggu aksi comeback gue besok dengan Aura penuh!\n\nCobain sensasi drilling 1 nyawa paling nagih di AuraMedPro:\n🔗 https://auramedpro.pages.dev`;
    }
  }

  // 2. Mode RMO (Negative Scoring)
  if (quizMode === 'rmo') {
    const scoreVal = typeof score === 'number' ? score : parseFloat(String(score)) || 0;
    if (scoreVal >= 60) {
      return `Mode RMO dengan penalti minus bukan tandingan buat insting klinisku 🧠⚡ Skor +${scoreVal} (${correct} benar) dikantongi dengan mudah! Aura dokter kompeten makin menyala 🩺✨\n\nSini adu strategi drilling berbobot di AuraMedPro:\n🔗 https://auramedpro.pages.dev`;
    } else {
      return `Simulasi RMO kelar, taktik baru sedang diracik 🛡️ Menghindari jebakan soal medis butuh jam terbang. Siap sapu bersih di sesi berikutnya!\n\nCoba drilling simulasi RMO di AuraMedPro:\n🔗 https://auramedpro.pages.dev`;
    }
  }

  // 3. Mode Reguler / Blok / UKMPPD
  const scoreNum = typeof score === 'number' ? score : parseFloat(String(score)) || (total > 0 ? Math.round((correct / total) * 100) : 0);

  if (scoreNum >= 100) {
    return `Soal CBT kayak gini terlalu gampang buat calon dokter ber-Aura Sultan sepertiku 🥱💅 100% akurat (${correct}/${total} soal) tanpa ragu sedikitpun! Yang lain masih sibuk bolak-balik diktat, aku udah santai di puncak leaderboard 🏆✨\n\nBerani tanding Aura CBT sama gue? Buktiin kemampuan lo di AuraMedPro:\n🔗 https://auramedpro.pages.dev`;
  } else if (scoreNum >= 85) {
    return `Cuma salah dikit gara-gara kepeleset jempol, tapi tetap memancarkan Aura superioritas medis tak terbendung ⚡🩺 Skor ${scoreNum}% (${correct}/${total} soal) bukan hoki, ini bukti jam terbang drilling kasta tertinggi!\n\nSini kalau berani adu skor bareng gue di AuraMedPro:\n🔗 https://auramedpro.pages.dev`;
  } else if (scoreNum >= 70) {
    return `Standar kelulusan UKMPPD mah udah lewat jauh di belakang 🚀💉 Skor ${scoreNum}% (${correct}/${total} benar), Aura calon dokter masa depan emang udah terpancar terang. Belajar konsisten, hasil nyata!\n\nDrilling soal seru dan kompetitif cuma di AuraMedPro:\n🔗 https://auramedpro.pages.dev`;
  } else if (scoreNum >= 50) {
    return `Ini baru pemanasan 20% kapasitas Aura gue, sengaja ngalah biar kalian gak insecure 🤫🔥 Baru permulaan, tunggu comeback gue di puncak klasemen!\n\nYuk drilling soal medis seru bareng gue di AuraMedPro:\n🔗 https://auramedpro.pages.dev`;
  } else {
    return `Lagi mode riset kelemahan sistem soal aja ini mah 🧠 Tetap pede, calon dokter tangguh lahir dari ratusan evaluasi soal! Siap balas dendam di sesi berikutnya 🔥\n\nAyo asah pisau bedah ilmu lo di AuraMedPro:\n🔗 https://auramedpro.pages.dev`;
  }
};

export const StoryCardModal: React.FC<StoryCardModalProps> = ({
  isOpen,
  onClose,
  username,
  userLevel,
  userRankTitle,
  userXP,
  currentStreak,
  totalQuestionsAnswered,
  angkatan,
  frameId,
  quizResult,
  theme,
  triggerToast
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const activeFrame = AVATAR_FRAMES.find(f => f.id === frameId) || AVATAR_FRAMES[0];

  const renderCardToCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High Resolution 9:16 Aspect Ratio (1080 x 1920)
    const W = 1080;
    const H = 1920;
    canvas.width = W;
    canvas.height = H;

    // 1. Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, '#0a0d18');
    bgGrad.addColorStop(0.35, '#111827');
    bgGrad.addColorStop(0.7, '#0f172a');
    bgGrad.addColorStop(1, '#05070e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // 2. Ambient Glowing Orbs
    const drawGlow = (x: number, y: number, r: number, color: string) => {
      const glow = ctx.createRadialGradient(x, y, 0, x, y, r);
      glow.addColorStop(0, color);
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    };

    drawGlow(200, 260, 420, 'rgba(99, 102, 241, 0.22)');
    drawGlow(880, 850, 450, 'rgba(20, 184, 166, 0.20)');
    drawGlow(400, 1600, 480, 'rgba(245, 158, 11, 0.18)');

    // 3. Subtle Medical Grid Pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 60; x < W; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 60; y < H; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // 4. Header Branding
    ctx.textAlign = 'center';
    ctx.fillStyle = '#6366f1';
    ctx.font = '900 36px sans-serif';
    ctx.letterSpacing = '6px';
    ctx.fillText('🩺 AURAMEDPRO', W / 2, 130);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '700 20px sans-serif';
    ctx.letterSpacing = '3px';
    ctx.fillText('AURA-INFUSED QUESTION DRILLING PLATFORM', W / 2, 170);

    // Header Divider Line
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 120, 200);
    ctx.lineTo(W / 2 + 120, 200);
    ctx.stroke();

    // 5. User Avatar Circle & Frame
    const avatarCenterX = W / 2;
    const avatarCenterY = 340;
    const avatarRadius = 80;

    // Frame ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarCenterX, avatarCenterY, avatarRadius + 8, 0, Math.PI * 2);
    if (activeFrame.id === 'caduceus_mythic') {
      const ringGrad = ctx.createLinearGradient(avatarCenterX - 90, avatarCenterY - 90, avatarCenterX + 90, avatarCenterY + 90);
      ringGrad.addColorStop(0, '#facc15');
      ringGrad.addColorStop(0.5, '#a855f7');
      ringGrad.addColorStop(1, '#ec4899');
      ctx.fillStyle = ringGrad;
    } else if (activeFrame.id === 'veteran_3000') {
      const ringGrad = ctx.createLinearGradient(avatarCenterX - 90, avatarCenterY - 90, avatarCenterX + 90, avatarCenterY + 90);
      ringGrad.addColorStop(0, '#14b8a6');
      ringGrad.addColorStop(0.5, '#06b6d4');
      ringGrad.addColorStop(1, '#3b82f6');
      ctx.fillStyle = ringGrad;
    } else if (activeFrame.id === 'quest_500_today') {
      const ringGrad = ctx.createLinearGradient(avatarCenterX - 90, avatarCenterY - 90, avatarCenterX + 90, avatarCenterY + 90);
      ringGrad.addColorStop(0, '#9333ea');
      ringGrad.addColorStop(0.5, '#6366f1');
      ringGrad.addColorStop(1, '#ec4899');
      ctx.fillStyle = ringGrad;
    } else if (activeFrame.id === 'sudden_death_master') {
      const ringGrad = ctx.createLinearGradient(avatarCenterX - 90, avatarCenterY - 90, avatarCenterX + 90, avatarCenterY + 90);
      ringGrad.addColorStop(0, '#ef4444');
      ringGrad.addColorStop(0.5, '#f97316');
      ringGrad.addColorStop(1, '#eab308');
      ctx.fillStyle = ringGrad;
    } else if (activeFrame.id === 'ekg_neon') {
      ctx.fillStyle = '#10b981';
    } else if (activeFrame.id === 'stethoscope_gold') {
      ctx.fillStyle = '#f59e0b';
    } else {
      ctx.fillStyle = '#6366f1';
    }
    ctx.fill();

    // Inner avatar fill
    ctx.beginPath();
    ctx.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();

    // Initials
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 56px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(username.slice(0, 2).toUpperCase(), avatarCenterX, avatarCenterY);
    ctx.restore();

    // 6. Username & Titles
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 48px sans-serif';
    ctx.fillText(username, W / 2, 490);

    // Title badge
    const badgeText = `${activeFrame.badge} ${userRankTitle || 'Kultivator Medis'}${angkatan ? ` • Angkatan '${angkatan}` : ''}`;
    ctx.fillStyle = '#38bdf8';
    ctx.font = '800 24px sans-serif';
    ctx.fillText(badgeText, W / 2, 535);

    // 7. Highlight Card (Quiz Result or Sudden Death Record)
    const cardX = 100;
    const cardY = 590;
    const cardW = 880;
    const cardH = 500;
    const cardR = 36;

    // Rounded rectangle card background
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, cardR);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fill();
    ctx.strokeStyle = quizResult?.quizMode === 'suddendeath' ? 'rgba(239, 68, 68, 0.6)' : 'rgba(99, 102, 241, 0.4)';
    ctx.lineWidth = 3;
    ctx.stroke();

    if (quizResult?.quizMode === 'suddendeath') {
      // Sudden Death Hero Card
      ctx.fillStyle = '#ef4444';
      ctx.font = '900 30px sans-serif';
      ctx.fillText('💀 HASIL SUDDEN DEATH (1 NYAWA)', W / 2, cardY + 70);

      // Big streak number
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 130px sans-serif';
      ctx.fillText(String(quizResult.suddenDeathStreak ?? quizResult.correct), W / 2, cardY + 230);

      ctx.fillStyle = '#f97316';
      ctx.font = '800 28px sans-serif';
      ctx.fillText('SOAL BENAR BERTURUT-TURUT', W / 2, cardY + 280);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 22px sans-serif';
      ctx.fillText(`Ketahanan mental teruji • Gugur di soal ke-${quizResult.total || (Number(quizResult.suddenDeathStreak ?? 0) + 1)}`, W / 2, cardY + 340);

      // XP bonus banner
      ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
      ctx.beginPath();
      ctx.roundRect(cardX + 80, cardY + 390, cardW - 160, 65, 20);
      ctx.fill();
      ctx.fillStyle = '#fca5a5';
      ctx.font = '800 24px sans-serif';
      ctx.fillText(`⚡ Bonus EXP: +${(quizResult.suddenDeathStreak ?? quizResult.correct) * 25} XP Diperoleh`, W / 2, cardY + 432);
    } else {
      // Standard Quiz Score Hero Card
      const scoreNum = quizResult ? quizResult.score : Math.min(100, Math.round((totalQuestionsAnswered / 30) * 10));
      const correctNum = quizResult ? quizResult.correct : totalQuestionsAnswered;
      const totalNum = quizResult ? quizResult.total : totalQuestionsAnswered;

      ctx.fillStyle = '#6366f1';
      ctx.font = '900 28px sans-serif';
      ctx.fillText('🎯 RAPOR EVALUASI KUIS CBT', W / 2, cardY + 75);

      // Score Big Circle
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 120px sans-serif';
      ctx.fillText(`${scoreNum}%`, W / 2, cardY + 225);

      ctx.fillStyle = '#34d399';
      ctx.font = '800 28px sans-serif';
      ctx.fillText(`Akurasi Sempurna • ${correctNum} dari ${totalNum} Soal Benar`, W / 2, cardY + 280);

      // Performance badge
      const praise = Number(scoreNum) >= 80 ? '🌟 Sangat Memuaskan (Siap Ujian)' : Number(scoreNum) >= 60 ? '⚡ Kompeten & Terus Meningkat' : '📚 Terus Berjuang Membangun Fondasi';
      ctx.fillStyle = 'rgba(99, 102, 241, 0.25)';
      ctx.beginPath();
      ctx.roundRect(cardX + 80, cardY + 370, cardW - 160, 65, 20);
      ctx.fill();
      ctx.fillStyle = '#c7d2fe';
      ctx.font = '800 24px sans-serif';
      ctx.fillText(praise, W / 2, cardY + 412);
    }
    ctx.restore();

    // 8. Key Milestone Grid (3 Cards)
    const gridY = 1140;
    const boxW = 270;
    const boxH = 200;
    const gap = 35;
    const startX = (W - (boxW * 3 + gap * 2)) / 2;

    const stats = [
      { label: 'TOTAL SOAL', value: `${totalQuestionsAnswered.toLocaleString()}+`, sub: 'Ditaklukkan', color: '#14b8a6', icon: '⚡' },
      { label: 'DAILY STREAK', value: `${currentStreak} HARI`, sub: 'Konsistensi Aktif', color: '#f59e0b', icon: '🔥' },
      { label: 'KULTIVATOR', value: `LV. ${userLevel}`, sub: `${userXP.toLocaleString()} XP`, color: '#a855f7', icon: '👑' }
    ];

    stats.forEach((item, i) => {
      const bx = startX + i * (boxW + gap);
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(bx, gridY, boxW, boxH, 24);
      ctx.fillStyle = 'rgba(30, 41, 59, 0.65)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '700 18px sans-serif';
      ctx.fillText(`${item.icon} ${item.label}`, bx + boxW / 2, gridY + 45);

      ctx.fillStyle = item.color;
      ctx.font = '900 36px sans-serif';
      ctx.fillText(item.value, bx + boxW / 2, gridY + 110);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '600 18px sans-serif';
      ctx.fillText(item.sub, bx + boxW / 2, gridY + 155);
      ctx.restore();
    });

    // 9. Motivational Quote
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'italic 700 28px Georgia, serif';
    ctx.fillText('“Future Physician in the Making • One Question at a Time”', W / 2, 1430);

    // 10. Frame Prestige Callout
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.beginPath();
    ctx.roundRect(140, 1490, W - 280, 80, 20);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.font = '700 22px sans-serif';
    ctx.fillText(`Equipped Frame: ${activeFrame.name} (${activeFrame.rarity.toUpperCase()})`, W / 2, 1538);

    // 11. Footer & Date
    const today = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    ctx.fillStyle = '#64748b';
    ctx.font = '600 20px sans-serif';
    ctx.fillText(`Diterbitkan pada ${today} • auramedpro.pages.dev`, W / 2, 1830);

    // Export preview image
    const dataUrl = canvas.toDataURL('image/png');
    setPreviewUrl(dataUrl);
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        renderCardToCanvas();
      }, 100);
    }
  }, [isOpen, username, userLevel, userXP, currentStreak, totalQuestionsAnswered, frameId, quizResult]);

  const [copiedCaption, setCopiedCaption] = useState(false);

  const braggingCaption = getBraggingCaption({
    username,
    score: quizResult?.score,
    correct: quizResult?.correct,
    total: quizResult?.total,
    quizMode: quizResult?.quizMode,
    suddenDeathStreak: quizResult?.suddenDeathStreak
  });

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(braggingCaption);
      setCopiedCaption(true);
      triggerToast?.('Caption sombong berhasil disalin ke clipboard! 📋', '🔥');
      setTimeout(() => setCopiedCaption(false), 2500);
    } catch (e) {
      triggerToast?.('Gagal menyalin caption ke clipboard.', '⚠️');
    }
  };

  const handleShareWhatsApp = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(braggingCaption)}`;
    window.open(waUrl, '_blank');
  };

  const handleDownload = () => {
    if (!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = `auramedpro-rapor-${username.toLowerCase()}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    triggerToast?.('Kartu Rapor 9:16 berhasil diunduh ke galeri!', '✅');
  };

  const handleShare = async () => {
    if (!canvasRef.current) return;

    // Otomatis salin caption ke clipboard agar pengguna siap paste di aplikasi tujuan
    try {
      await navigator.clipboard.writeText(braggingCaption);
    } catch (_) {}

    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `auramedpro-rapor-${username.toLowerCase()}.png`, { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: 'Rapor Prestasi AuraMedPro',
              text: braggingCaption,
              url: 'https://auramedpro.pages.dev'
            });
            triggerToast?.('Berhasil membagikan ke Story / Medsos!', '🚀');
          } catch (err: any) {
            if (err.name !== 'AbortError') {
              handleDownload();
              triggerToast?.('Gambar diunduh & caption sombong tersalin di clipboard!', '📋');
            }
          }
        } else {
          // Web Share dengan file tidak didukung (misal di sebagian desktop/webview)
          handleDownload();
          triggerToast?.('Gambar diunduh & caption sombong tersalin di clipboard! Siap diposting 🚀', '📋');
        }
      });
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        handleDownload();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      {/* Hidden off-screen canvas for rendering HD 1080x1920 */}
      <canvas ref={canvasRef} className="hidden" />

      <div 
        className={`w-full max-w-md sm:max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh] ${
          theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-slate-200/40 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center text-white text-xs font-black shadow-md">
              📸
            </div>
            <div>
              <h3 className="text-sm font-black">Kartu Rapor Prestasi (Story 9:16)</h3>
              <p className="text-[10px] text-slate-400">Pamerkan ke Instagram Story, status WA, atau grup</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="overflow-y-auto flex-1 p-3 sm:p-4 space-y-3.5 custom-scrollbar">
          {/* Live Preview Container (Constrained 9:16) */}
          <div className="flex flex-col items-center bg-slate-950/40 p-2.5 sm:p-3 rounded-2xl border border-white/5">
            {previewUrl ? (
              <div className="relative rounded-xl overflow-hidden shadow-2xl border border-white/10 max-h-[34vh] sm:max-h-[42vh] aspect-[9/16]">
                <img 
                  src={previewUrl} 
                  alt="Story Card Preview" 
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="h-60 w-36 flex flex-col items-center justify-center text-slate-400 gap-2">
                <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                <span className="text-xs font-bold">Menyiapkan kartu HD...</span>
              </div>
            )}
          </div>

          {/* 🔥 Caption Sombong Medsos Box */}
          <div className={`p-3.5 rounded-2xl border transition-all ${
            theme === 'dark' ? 'bg-slate-800/60 border-slate-750' : 'bg-indigo-50/70 border-indigo-200/80'
          }`}>
            <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">🔥</span>
                <span className="text-xs font-black uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
                  Caption Sombong Medsos
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 transition flex items-center gap-1 cursor-pointer border border-emerald-500/20"
                  title="Bagikan teks langsung ke WhatsApp"
                >
                  <MessageCircle className="w-3 h-3" />
                  <span>WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyCaption}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer border ${
                    copiedCaption
                      ? 'bg-emerald-500 text-white border-emerald-500'
                      : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-500/25 border-indigo-500/30'
                  }`}
                >
                  {copiedCaption ? <CheckCheck className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCaption ? 'Tersalin! ✅' : 'Salin Caption'}</span>
                </button>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-200 whitespace-pre-line bg-black/10 dark:bg-black/30 p-2.5 rounded-xl font-medium select-all border border-black/5 dark:border-white/5">
              {braggingCaption}
            </p>
          </div>
        </div>

        {/* Action Buttons (Footer: Pilihan Download vs Share) */}
        <div className="p-3 sm:p-4 border-t border-slate-200/40 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          <button
            onClick={handleDownload}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer active:scale-98"
          >
            <Download className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Unduh Gambar (HD PNG)</span>
          </button>

          <button
            onClick={handleShare}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-teal-500 hover:from-purple-700 hover:to-teal-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition cursor-pointer active:scale-98"
          >
            <Share2 className="w-4 h-4 shrink-0" />
            <span>Bagikan (Gambar + Caption)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
