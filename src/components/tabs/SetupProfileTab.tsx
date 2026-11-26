import React, { useState, useEffect } from 'react';
import { Download, Upload, LogOut, Volume2, Sparkles, Check, Play, Flame } from 'lucide-react';
import { getRarityColor, getRarityBg } from '../../utils/achievements';
import { getLevelInfo, getStreakFlameStyle } from '../../utils/appHelpers';
import { authClient } from '../../lib/authClient';
import { SOUND_PACKS, SoundPackId, getSavedSoundPack, setSavedSoundPack, playCorrectSound } from '../../utils/audioEffects';
import { 
  AVATAR_FRAMES, 
  AvatarFrameId, 
  getSavedAvatarFrame, 
  setSavedAvatarFrame, 
  getSuddenDeathBestStreak,
  getTodayQuestionsAnswered,
  isQuest500Completed
} from '../../utils/avatarFrames';
import {
  CultivatorAvatar,
  CULTIVATOR_TIERS,
  CultivatorGender,
  getSavedCultivatorGender,
  setSavedCultivatorGender,
  getEffectiveCultivatorTier,
  getSavedCultivatorTier,
  setSavedCultivatorTier,
  getCultivatorTier
} from '../../utils/cultivatorAvatars';
import { AvatarFrameModal } from '../AvatarFrameModal';
import { TrialCountdownBanner } from '../TrialCountdownBanner';

interface SetupProfileTabProps {
  theme: string;
  currentUser: any;
  profileUsername: string;
  userXP: number;
  currentStreak: number;
  longestStreak: number;
  totalQuestionsAnswered: number;
  streakFreezeLeft: number;
  lastActiveDate: string | null;
  exportData: any;
  importData: any;
  triggerToast: any;
  achievementFilter: string;
  setAchievementFilter: any;
  achievements: any[];
  userAngkatan?: string | null;
  userProdi?: string | null;
  quizHistory?: any[];
  trialEndsAt?: string | null; subscriptionStatus?: string | null; subscriptionExpiresAt?: string | null;
  isSuperAdmin?: boolean;
}

export const SetupProfileTab: React.FC<SetupProfileTabProps> = ({
  theme, currentUser, profileUsername, userXP, currentStreak, longestStreak,
  totalQuestionsAnswered, streakFreezeLeft, lastActiveDate, exportData,
  importData, triggerToast, achievementFilter, setAchievementFilter, achievements,
  userAngkatan, userProdi, quizHistory = [], trialEndsAt, subscriptionStatus, subscriptionExpiresAt, isSuperAdmin
}) => {
  const isUserAdmin = Boolean(
    isSuperAdmin ||
    profileUsername === 'admin' ||
    profileUsername?.toLowerCase().startsWith('admin') ||
    currentUser?.role === 'admin' ||
    currentUser?.role === 'super_admin' ||
    currentUser?.user_metadata?.role === 'admin' ||
    currentUser?.user_metadata?.role === 'super_admin' ||
    currentUser?.user_metadata?.username === 'admin'
  );

  const [isFrameModalOpen, setIsFrameModalOpen] = useState(false);
  const [currentFrameId, setCurrentFrameId] = useState<AvatarFrameId>(getSavedAvatarFrame());
  const [cultivatorGender, setCultivatorGender] = useState<CultivatorGender>(getSavedCultivatorGender());
  const [cultivatorTier, setCultivatorTier] = useState<number | 'auto'>(getSavedCultivatorTier());
  const [currentSoundPack, setCurrentSoundPack] = useState<SoundPackId>(getSavedSoundPack());
  const streakFlame = getStreakFlameStyle(currentStreak);
  const longestFlame = getStreakFlameStyle(longestStreak);
  
  useEffect(() => {
    const handleGender = () => setCultivatorGender(getSavedCultivatorGender());
    const handleTier = () => setCultivatorTier(getSavedCultivatorTier());
    const handleFrame = () => setCurrentFrameId(getSavedAvatarFrame());
    window.addEventListener('auramedpro_avatar_gender_changed', handleGender);
    window.addEventListener('auramedpro_avatar_tier_changed', handleTier);
    window.addEventListener('auramedpro_frame_changed', handleFrame);
    window.addEventListener('storage', handleGender);
    window.addEventListener('storage', handleTier);
    window.addEventListener('storage', handleFrame);
    return () => {
      window.removeEventListener('auramedpro_avatar_gender_changed', handleGender);
      window.removeEventListener('auramedpro_avatar_tier_changed', handleTier);
      window.removeEventListener('auramedpro_frame_changed', handleFrame);
      window.removeEventListener('storage', handleGender);
      window.removeEventListener('storage', handleTier);
      window.removeEventListener('storage', handleFrame);
    };
  }, []);
  
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword.length !== 3 || !/^\d{3}$/.test(newPassword)) {
      triggerToast('Password harus 3 digit angka!', '⚠️');
      return;
    }
    setIsChangingPassword(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword })
      });
      const data = await res.json();
      if (data.success) {
        triggerToast('Password berhasil diubah!', '✅');
        setNewPassword('');
      } else {
        triggerToast('Gagal mengubah password', '❌');
      }
    } catch (err) {
      triggerToast('Terjadi kesalahan jaringan', '❌');
    }
    setIsChangingPassword(false);
  };

  const suddenDeathBest = getSuddenDeathBestStreak();
  const todayQuestions = getTodayQuestionsAnswered(quizHistory);
  const isQuestDone = isQuest500Completed() || todayQuestions >= 500;
  const activeFrame = AVATAR_FRAMES.find(f => f.id === currentFrameId) || AVATAR_FRAMES[0];
  const levelInfo = getLevelInfo(userXP);
  const effectiveTier = getEffectiveCultivatorTier(levelInfo.level);
  const currentTierInfo = CULTIVATOR_TIERS[effectiveTier - 1] || CULTIVATOR_TIERS[0];

  const handleSelectFrame = (id: AvatarFrameId) => {
    setCurrentFrameId(id);
    setSavedAvatarFrame(id);
    const chosen = AVATAR_FRAMES.find(f => f.id === id);
    triggerToast(`Bingkai "${chosen?.name}" berhasil dipasang!`, '✨');
  };

  const handleSelectSoundPack = (packId: SoundPackId) => {
    setCurrentSoundPack(packId);
    setSavedSoundPack(packId);
    playCorrectSound(packId);
    triggerToast(`Sound pack diubah ke: ${SOUND_PACKS.find(p => p.id === packId)?.name}`, '🔊');
  };

  const getAuraCardClass = (frameId: AvatarFrameId) => {
    switch (frameId) {
      case 'demon_king_100':
        return 'aura-demon-king-row border-red-600/90 shadow-[0_0_36px_rgba(220,38,38,0.6)]';
      case 'caduceus_mythic':
        return 'aura-mythic-row border-amber-400/90 shadow-[0_0_32px_rgba(245,158,11,0.45)]';
      case 'veteran_3000':
        return 'aura-veteran-row border-teal-400/80 shadow-[0_0_24px_rgba(20,184,166,0.35)]';
      case 'quest_500_today':
        return 'aura-quest-row border-purple-400/80 shadow-[0_0_24px_rgba(168,85,247,0.35)]';
      case 'sudden_death_master':
        return 'aura-suddendeath-row border-rose-500/80 shadow-[0_0_24px_rgba(244,63,94,0.4)]';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6 w-full max-w-5xl mx-auto animate-fade-in pb-4 sm:pb-12">
      {/* ⏱️ Top Trial Countdown Banner */}
      <TrialCountdownBanner
        theme={theme}
        trialEndsAt={trialEndsAt} 
        subscriptionStatus={subscriptionStatus} 
        subscriptionExpiresAt={subscriptionExpiresAt}
        userAngkatan={userAngkatan}
        isSuperAdmin={isUserAdmin}
      />
              
      {/* ========================================================================= */}
      {/* DESKTOP 2-COLUMN / MOBILE 1-COLUMN RESPONSIVE LAYOUT                     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        
        {/* ----------------------------------------------------------------------- */}
        {/* LEFT COLUMN: IDENTITAS KULTIVATOR, STATS & KEAMANAN AKUN (lg:col-span-5) */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-5 space-y-5 sm:space-y-6 min-w-0">
          
          {/* Card 1: Identitas Kultivator & Statistik */}
          <div className={`p-4 sm:p-6 rounded-2xl liquid-glass-card space-y-5 relative overflow-hidden ${getAuraCardClass(activeFrame.id)}`}>
            {/* Active Aura Prestige Badge */}
            {activeFrame.auraClass && (
              <div className="flex justify-center -mt-1 mb-1">
                <div className={`px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg border animate-pulse ${
                  activeFrame.id === 'demon_king_100'
                    ? 'bg-gradient-to-r from-black via-red-950 to-red-800 text-red-100 border-red-500 shadow-red-900/50'
                    : activeFrame.id === 'caduceus_mythic'
                    ? 'bg-amber-400 text-slate-950 border-yellow-200 shadow-amber-500/30'
                    : activeFrame.id === 'veteran_3000'
                    ? 'bg-teal-600 text-white border-teal-300 shadow-teal-500/30'
                    : activeFrame.id === 'quest_500_today'
                    ? 'bg-purple-600 text-white border-purple-300 shadow-purple-500/30'
                    : 'bg-rose-600 text-white border-rose-300 shadow-rose-500/30'
                }`}>
                  <span>✨</span>
                  <span>AURA AKTIF: {activeFrame.name.toUpperCase()}</span>
                </div>
              </div>
            )}

            <div className="flex flex-col items-center text-center">
              {/* Interactive Framed Cultivator Avatar */}
              <div 
                className="relative group cursor-pointer"
                onClick={() => setIsFrameModalOpen(true)}
                title="Klik untuk kustomisasi avatar & bingkai"
              >
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-2.5 transition-all group-hover:scale-105 ${activeFrame.ringClass} ${activeFrame.glowClass}`}>
                  <CultivatorAvatar 
                    tier={effectiveTier}
                    gender={cultivatorGender}
                    className="w-full h-full"
                    uid="profile_main"
                  />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 text-base drop-shadow bg-slate-900 rounded-full p-1 border border-slate-700 shadow-md">
                  {activeFrame.badge}
                </span>
              </div>

              {/* Quick Gender Selector */}
              <div className="flex items-center gap-1.5 p-1 rounded-full liquid-glass-subtle mb-3">
                <button
                  onClick={() => {
                    setCultivatorGender('pria');
                    setSavedCultivatorGender('pria');
                    triggerToast('Wujud avatar diubah ke Kultivator Pria', '👨');
                  }}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                    cultivatorGender === 'pria'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <span>👨</span>
                  <span>Pria</span>
                </button>
                <button
                  onClick={() => {
                    setCultivatorGender('wanita');
                    setSavedCultivatorGender('wanita');
                    triggerToast('Wujud avatar diubah ke Kultivator Wanita', '👩');
                  }}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                    cultivatorGender === 'wanita'
                      ? 'bg-pink-600 text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <span>👩</span>
                  <span>Wanita</span>
                </button>
              </div>

              {/* Customize Avatar & Frame Button */}
              <button
                onClick={() => setIsFrameModalOpen(true)}
                className="px-3.5 py-1.5 rounded-full text-[11px] font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/25 hover:bg-indigo-500/25 transition flex items-center gap-1.5 cursor-pointer mb-3"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Kustomisasi Avatar & Bingkai</span>
              </button>

              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                {profileUsername}
              </h2>
              <div className="flex items-center gap-1.5 flex-wrap justify-center mt-1.5">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  {currentTierInfo.badge} Tingkat {currentTierInfo.tier}: {currentTierInfo.name}
                </span>
                {(suddenDeathBest >= 100 || currentFrameId === 'demon_king_100') ? (
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-red-950 text-red-200 border border-red-600/80 shadow-xs flex items-center gap-1 animate-pulse">
                    <span>👹</span>
                    <span>Gelar: Raja Iblis</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider liquid-glass-subtle text-slate-600 dark:text-slate-300">
                    Gelar: {levelInfo.rank}
                  </span>
                )}
                {userAngkatan && (
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    &apos;{userAngkatan}
                  </span>
                )}
                {userProdi && (
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 capitalize">
                    {userProdi === 'farmasi' ? '💊 Farmasi' : userProdi === 'kebidanan' ? '👶 Kebidanan' : '🩺 Kedokteran'}
                  </span>
                )}
              </div>
            </div>

            {/* Stats 2-Col Grid */}
            <div className="grid grid-cols-2 gap-3 pt-1 tabular-nums">
              <div className="p-3.5 rounded-xl liquid-glass-subtle text-center">
                <div className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">
                  {getLevelInfo(userXP).level}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-0.5">
                  Level
                </div>
              </div>
              
              <div className="p-3.5 rounded-xl liquid-glass-subtle text-center">
                <div className="text-lg font-extrabold text-teal-600 dark:text-teal-400">
                  {userXP}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-0.5">
                  Total XP
                </div>
              </div>
            </div>

            {/* Divide-y stats */}
            <div className="divide-y divide-slate-200/60 dark:divide-white/10 text-xs tabular-nums">
              <div className="py-2.5 flex justify-between gap-2 flex-wrap">
                <span className="font-semibold text-slate-500 dark:text-slate-400">Total Soal Benar</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{currentUser?.total_questions_answered || 0} Soal</span>
              </div>
              <div className="py-2.5 flex justify-between items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-500 dark:text-slate-400">Streak Saat Ini</span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-bold transition-all duration-300 ${streakFlame.badgeClass}`} title={`${currentStreak} Hari • ${streakFlame.tierName}`}>
                  <Flame className={`w-3.5 h-3.5 fill-current ${streakFlame.flameColor} ${streakFlame.glowClass} ${streakFlame.iconAnimClass}`} />
                  <span>{currentStreak} Hari</span>
                  <span className="opacity-75 font-medium text-[10px]">({streakFlame.tierName})</span>
                </span>
              </div>
              <div className="py-2.5 flex justify-between items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-500 dark:text-slate-400">Streak Tertinggi</span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-bold transition-all duration-300 ${longestFlame.badgeClass}`} title={`Rekor: ${longestStreak} Hari • ${longestFlame.tierName}`}>
                  <Flame className={`w-3.5 h-3.5 fill-current ${longestFlame.flameColor} ${longestFlame.glowClass}`} />
                  <span>{longestStreak} Hari</span>
                  <span className="opacity-75 font-medium text-[10px]">({longestFlame.tierName})</span>
                </span>
              </div>
              <div className="py-2.5 flex justify-between gap-2 flex-wrap">
                <span className="font-semibold text-slate-500 dark:text-slate-400">Streak Freeze (❄️)</span>
                <span className="font-bold text-sky-600 dark:text-sky-400">{streakFreezeLeft} Tersisa</span>
              </div>
              <div className="py-2.5 flex justify-between items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-500 dark:text-slate-400">Tipe Akun</span>
                <span className={`font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-md border ${
                  subscriptionStatus === 'lifetime'
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                    : 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20'
                }`}>
                  {subscriptionStatus === 'lifetime' ? '👑 Lifetime Pro' : 'Pro'}
                </span>
              </div>
              <div className="py-2.5 flex justify-between items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-500 dark:text-slate-400">Masa Berlaku</span>
                <span className={`font-bold text-[11px] flex items-center gap-1 ${
                  subscriptionStatus === 'lifetime' ? 'text-amber-600 dark:text-amber-400' : 'text-indigo-600 dark:text-indigo-400'
                }`}>
                  <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                  {isSuperAdmin
                    ? 'Akses Permanen'
                    : subscriptionStatus === 'lifetime'
                    ? '👑 Lifetime (Permanen)'
                    : subscriptionStatus === 'active' && subscriptionExpiresAt
                    ? `Aktif s.d. ${new Date(subscriptionExpiresAt).toLocaleDateString('id-ID')}`
                    : userAngkatan === '26'
                    ? 'Trial Diperpanjang'
                    : trialEndsAt
                    ? `Trial s.d. ${new Date(trialEndsAt).toLocaleDateString('id-ID')}`
                    : 'Trial Diperpanjang (Gratis)'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Keamanan Akun & Logout */}
          <div className="p-4 sm:p-6 rounded-2xl liquid-glass-card space-y-5">
            {/* Ganti Password Section */}
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider mb-3 text-slate-900 dark:text-slate-100">
                Ganti Password 🔐
              </h3>
              <div className="flex gap-2">
                <input 
                  type="password"
                  maxLength={3}
                  placeholder="3 Digit (Misal: 123)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value.replace(/[^0-9]/g, ''))}
                  className="flex-1 min-w-0 px-3 py-2.5 rounded-xl liquid-glass-input text-center text-sm font-bold tracking-[0.35em] placeholder:tracking-normal sm:placeholder:tracking-[0.35em] placeholder:text-xs sm:placeholder:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                />
                <button
                  onClick={handleChangePassword}
                  disabled={isChangingPassword || newPassword.length !== 3}
                  className="shrink-0 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm shadow-indigo-600/20"
                >
                  {isChangingPassword ? '...' : 'Simpan'}
                </button>
              </div>
              <p className="text-[11px] mt-1.5 text-slate-500 dark:text-slate-400">
                Password harus berupa 3 digit angka.
              </p>
            </div>

            <hr className="border-t border-slate-200/60 dark:border-white/10" />

            {/* Profile Summary Card above logout */}
            <div className="flex items-center gap-3 p-3 rounded-xl liquid-glass-subtle">
              <div className="relative shrink-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activeFrame.ringClass} ${activeFrame.glowClass}`}>
                  <CultivatorAvatar 
                    tier={effectiveTier}
                    gender={cultivatorGender}
                    className="w-full h-full"
                    uid="profile_bottom_logout"
                  />
                </div>
                <span className="absolute -bottom-1 -right-1 text-xs drop-shadow">
                  {activeFrame.badge}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold truncate text-slate-900 dark:text-slate-100">
                  {profileUsername}
                </div>
                <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                  {currentTierInfo.badge} Tingkat {currentTierInfo.tier} • LV {levelInfo.level}
                </div>
              </div>
            </div>

            <button
              onClick={async () => {
                await authClient.signOut();
                triggerToast('Sampai jumpa lagi!', '👋');
              }}
              className="w-full py-3 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar Sesi Akun</span>
            </button>
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* RIGHT COLUMN: QUEST, SOUND PACK, ACHIEVEMENTS & DATA (lg:col-span-7)     */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-7 space-y-5 sm:space-y-6 min-w-0">

          {/* Card 3: Quest Harian Section */}
          <div className="p-4 sm:p-6 rounded-2xl liquid-glass-card">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-500 flex items-center justify-center text-lg border border-purple-500/25 shrink-0">
                  🔥
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Quest Harian: Maraton 500 Soal
                    </h4>
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/25">
                      Hard
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Selesaikan 500 soal hari ini untuk membuka bingkai <span className="font-bold text-purple-600 dark:text-purple-400">Aura Maraton</span>
                  </p>
                </div>
              </div>
              {isQuestDone && (
                <span className="shrink-0 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Selesai
                </span>
              )}
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5 tabular-nums">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500 dark:text-slate-400 font-semibold">Progres Hari Ini:</span>
                <span className="font-bold text-purple-600 dark:text-purple-400">
                  {todayQuestions} / 500 Soal ({Math.min(100, Math.round((todayQuestions / 500) * 100))}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-200/80 dark:bg-slate-800/80 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-600 transition-all duration-500 rounded-full"
                  style={{ width: `${Math.min(100, (todayQuestions / 500) * 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex-wrap gap-1">
                <span>
                  {isQuestDone ? '🎉 Bingkai Aura Maraton siap digunakan!' : `Kurang ${Math.max(0, 500 - todayQuestions)} soal lagi.`}
                </span>
                {isQuestDone && currentFrameId !== 'quest_500_today' && (
                  <button
                    type="button"
                    onClick={() => handleSelectFrame('quest_500_today')}
                    className="text-purple-600 dark:text-purple-400 hover:underline font-bold cursor-pointer"
                  >
                    Pasang Aura Ini ✨
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Card 4: Sound Pack Selector */}
          <div className="p-4 sm:p-6 rounded-2xl liquid-glass-card space-y-3.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  Efek Suara Kuis (Sound Pack)
                </h3>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Web Audio API</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {SOUND_PACKS.map((pack) => {
                const isSelected = currentSoundPack === pack.id;
                return (
                  <div
                    key={pack.id}
                    onClick={() => handleSelectSoundPack(pack.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-500/15 border-indigo-500/50 ring-1 ring-indigo-500/20 shadow-xs'
                        : 'liquid-glass-subtle-interactive'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base shrink-0">{pack.icon}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold truncate text-slate-900 dark:text-slate-100">{pack.name}</span>
                          {isSelected && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-600 text-white shrink-0">
                              Aktif
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                          {pack.description}
                        </span>
                      </div>
                    </div>

                    {pack.id !== 'mute' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          playCorrectSound(pack.id);
                        }}
                        className="px-2.5 py-1 rounded-lg liquid-glass-subtle hover:bg-indigo-600 hover:text-white text-[10px] font-bold flex items-center gap-1 transition shrink-0 ml-1.5 cursor-pointer"
                        title="Tes Bunyi"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Tes</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 5: Achievements Section */}
          <div className="p-4 sm:p-6 rounded-2xl liquid-glass-card">
            <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Achievements 🏆
              </h3>
              <span className="text-[11px] font-bold tabular-nums text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-md">
                {achievements.unlockedIds.length} / {achievements.getAllAchievements().length} Terbuka
              </span>
            </div>
            
            <div className="grid grid-cols-4 sm:flex gap-1.5 p-1 rounded-xl liquid-glass-subtle w-full sm:w-auto lg:w-max mb-4 overflow-x-auto max-w-full scrollbar-none">
              {['all', 'quiz', 'streak', 'mastery'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setAchievementFilter(filter as any)}
                  className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold text-center justify-center whitespace-nowrap transition cursor-pointer ${
                    achievementFilter === filter 
                      ? 'bg-indigo-600 text-white shadow-xs' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {filter === 'all' ? 'Semua' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
              {achievements.getAllAchievements()
                .filter((a: any) => achievementFilter === 'all' || a.category === achievementFilter)
                .map((ach: any) => (
                <div 
                  key={ach.id}
                  title={ach.description}
                  className={`relative p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                    ach.isUnlocked 
                      ? `${getRarityBg(ach.rarity, theme === 'dark')} opacity-100` 
                      : 'liquid-glass-subtle opacity-45 grayscale'
                  }`}
                >
                  {!ach.isUnlocked && (
                    <div className="absolute top-1.5 right-1.5">
                      <span className="text-[10px]">🔒</span>
                    </div>
                  )}
                  <div className="text-2xl mb-1">{ach.icon}</div>
                  <div className={`text-[10px] font-bold leading-tight ${ach.isUnlocked ? getRarityColor(ach.rarity, theme === 'dark') : 'text-slate-500'}`}>
                    {ach.title}
                  </div>
                  {ach.isUnlocked && (
                    <div className="mt-1 text-[9px] font-bold tabular-nums text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                      +{ach.xpReward} XP
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Card 6: Data Management Section */}
          <div className="p-4 sm:p-6 rounded-2xl liquid-glass-card">
            <h3 className="text-xs font-extrabold uppercase tracking-wider mb-1.5 flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <Download className="w-4 h-4 text-indigo-500" /> Ekspor & Impor Data Cadangan
            </h3>
            <p className="text-xs mb-4 text-slate-500 dark:text-slate-400 leading-relaxed">
              Simpan cadangan riwayat kuis, catatan Study Room, dan progres SRS Anda, atau pulihkan dari berkas JSON sebelumnya.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={exportData}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-indigo-500/25 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-500/20 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Ekspor JSON
              </button>
              
              <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl liquid-glass-subtle-interactive text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer">
                <Upload className="w-4 h-4" />
                Impor JSON
                <input 
                  type="file" 
                  accept=".json" 
                  className="hidden" 
                  onChange={importData}
                />
              </label>
            </div>
          </div>

        </div>
      </div>

      {/* Avatar Frame Modal */}
      {isFrameModalOpen && (
        <AvatarFrameModal
          isOpen={isFrameModalOpen}
          onClose={() => setIsFrameModalOpen(false)}
          currentFrameId={currentFrameId}
          onSelectFrame={handleSelectFrame}
          onSelectAvatarTier={(tier) => {
            setCultivatorTier(tier);
            triggerToast(tier === 'auto' ? 'Avatar disetel ke mode otomatis sesuai level!' : `Avatar Tingkat ${tier} berhasil dipasang!`, '🧘');
          }}
          onSelectGender={(g) => {
            setCultivatorGender(g);
          }}
          userStats={{
            level: levelInfo.level,
            totalQuestions: currentUser?.total_questions_answered || totalQuestionsAnswered || 0,
            suddenDeathBest,
            todayQuestions,
            isAdmin: isUserAdmin
          }}
          username={profileUsername}
          theme={theme}
        />
      )}
              
    </div>
  );
};
