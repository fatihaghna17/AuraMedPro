import React, { useState, useEffect } from 'react';
import { Download, Upload, LogOut, Volume2, Sparkles, Check, Play } from 'lucide-react';
import { getRarityColor, getRarityBg } from '../../utils/achievements';
import { getLevelInfo } from '../../utils/appHelpers';
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
    <div className="space-y-6 w-full max-w-5xl mx-auto animate-fade-in px-3 sm:px-6 pb-32 sm:pb-16 pt-1">
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ----------------------------------------------------------------------- */}
        {/* LEFT COLUMN: IDENTITAS KULTIVATOR, STATS & KEAMANAN AKUN (lg:col-span-5) */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Card 1: Identitas Kultivator & Statistik */}
          <div className={`p-5 sm:p-6 rounded-3xl border transition-all duration-300 space-y-5 relative overflow-hidden animate-fade-in-up animation-delay-75 ${getAuraCardClass(activeFrame.id)} ${
            theme === 'dark'
              ? 'bg-slate-900/40 border-white/[0.08] shadow-xl'
              : 'bg-white border-slate-200 shadow-sm'
          }`}>
            {/* Active Aura Prestige Badge */}
            {activeFrame.auraClass && (
              <div className="flex justify-center -mt-1 mb-1">
                <div className={`px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg border animate-pulse ${
                  activeFrame.id === 'demon_king_100'
                    ? 'bg-gradient-to-r from-black via-red-950 to-red-800 text-red-100 border-red-500 shadow-red-900/50'
                    : activeFrame.id === 'caduceus_mythic'
                    ? 'bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-slate-950 border-yellow-200 shadow-amber-500/30'
                    : activeFrame.id === 'veteran_3000'
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white border-teal-300 shadow-teal-500/30'
                    : activeFrame.id === 'quest_500_today'
                    ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 text-white border-purple-300 shadow-purple-500/30'
                    : 'bg-gradient-to-r from-rose-600 to-amber-600 text-white border-rose-300 shadow-rose-500/30'
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
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-2 transition-all group-hover:scale-105 animate-pop-in ${activeFrame.ringClass} ${activeFrame.glowClass}`}>
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
              <div className="flex items-center gap-1.5 mb-2.5">
                <button
                  onClick={() => {
                    setCultivatorGender('pria');
                    setSavedCultivatorGender('pria');
                    triggerToast('Wujud avatar diubah ke Kultivator Pria', '👨');
                  }}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold transition cursor-pointer flex items-center gap-1 ${
                    cultivatorGender === 'pria'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-200/60 dark:bg-slate-800 text-slate-400 hover:text-slate-200'
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
                  className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold transition cursor-pointer flex items-center gap-1 ${
                    cultivatorGender === 'wanita'
                      ? 'bg-pink-600 text-white shadow-sm'
                      : 'bg-slate-200/60 dark:bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>👩</span>
                  <span>Wanita</span>
                </button>
              </div>

              {/* Customize Avatar & Frame Button */}
              <button
                onClick={() => setIsFrameModalOpen(true)}
                className="px-3.5 py-1.5 rounded-full text-[11px] font-black bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 hover:bg-indigo-500/20 transition flex items-center gap-1.5 cursor-pointer mb-2.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Kustomisasi Avatar & Bingkai</span>
              </button>

              <h2 className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                {profileUsername}
              </h2>
              <div className="flex items-center gap-1.5 flex-wrap justify-center mt-1">
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {currentTierInfo.badge} Tingkat {currentTierInfo.tier}: {currentTierInfo.name}
                </span>
                {(suddenDeathBest >= 100 || currentFrameId === 'demon_king_100') ? (
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-black via-red-950 to-red-900 text-red-200 border border-red-600/80 shadow-[0_0_12px_rgba(220,38,38,0.5)] flex items-center gap-1 animate-pulse">
                    <span>👹</span>
                    <span>Gelar: Raja Iblis</span>
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-500/10 text-slate-400 border border-slate-500/20">
                    Gelar: {levelInfo.rank}
                  </span>
                )}
                {userAngkatan && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    '{userAngkatan}
                  </span>
                )}
                {userProdi && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/10 text-purple-500 border border-purple-500/20 capitalize">
                    {userProdi === 'farmasi' ? '💊 Farmasi' : userProdi === 'kebidanan' ? '👶 Kebidanan' : '🩺 Kedokteran'}
                  </span>
                )}
              </div>
            </div>

            {/* Stats 2-Col Grid */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className={`p-3.5 rounded-2xl border text-center ${
                theme === 'dark' ? 'bg-slate-950/30 border-slate-800/80' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="text-lg font-extrabold text-indigo-500">
                  {getLevelInfo(userXP).level}
                </div>
                <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 mt-1">
                  Kultivator Level
                </div>
              </div>
              
              <div className={`p-3.5 rounded-2xl border text-center ${
                theme === 'dark' ? 'bg-slate-950/30 border-slate-800/80' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="text-lg font-extrabold text-teal-500">
                  {userXP}
                </div>
                <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 mt-1">
                  Total XP
                </div>
              </div>
            </div>

            {/* Divide-y stats */}
            <div className={`divide-y text-xs ${theme === 'dark' ? 'divide-slate-800/60' : 'divide-slate-100'}`}>
              <div className="py-2.5 flex justify-between">
                <span className="font-semibold text-slate-400">Total Soal Benar</span>
                <span className="font-extrabold text-slate-700 dark:text-slate-200">{currentUser?.total_questions_answered || 0} Soal</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="font-semibold text-slate-400">Streak Saat Ini</span>
                <span className="font-extrabold text-amber-500">{currentStreak} Hari</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="font-semibold text-slate-400">Streak Tertinggi</span>
                <span className="font-extrabold text-slate-700 dark:text-slate-200">{longestStreak} Hari</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="font-semibold text-slate-400">Streak Freeze (❄️)</span>
                <span className="font-extrabold text-sky-500">{streakFreezeLeft} Tersisa</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="font-semibold text-slate-400">Tipe Akun</span>
                <span className="font-extrabold text-teal-500 uppercase tracking-widest text-[9px] bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">Pro</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="font-semibold text-slate-400">Masa Berlaku</span>
                <span className="font-extrabold text-indigo-500 dark:text-indigo-400 text-[10px] flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  {isSuperAdmin
                    ? 'Akses Permanen'
                    : subscriptionStatus === 'active' && subscriptionExpiresAt
                    ? `Aktif s.d. ${new Date(subscriptionExpiresAt).toLocaleDateString('id-ID')}`
                    : userAngkatan === '26'
                    ? 'Trial Diperpanjang (Waktu belum ditentukan)'
                    : trialEndsAt
                    ? `Trial s.d. ${new Date(trialEndsAt).toLocaleDateString('id-ID')}`
                    : 'Trial Diperpanjang (Gratis)'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Keamanan Akun & Logout */}
          <div className={`p-5 sm:p-6 rounded-3xl border transition-all duration-300 space-y-5 animate-fade-in-up animation-delay-150 ${
            theme === 'dark'
              ? 'bg-slate-900/40 border-white/[0.08] shadow-xl'
              : 'bg-white border-slate-200 shadow-sm'
          }`}>
            {/* Ganti Password Section */}
            <div>
              <h3 className={`text-xs font-black uppercase tracking-wider mb-3 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                Ganti Password 🔐
              </h3>
              <div className="flex gap-2">
                <input 
                  type="password"
                  maxLength={3}
                  placeholder="3 Digit (Misal: 123)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value.replace(/[^0-9]/g, ''))}
                  className={`flex-1 px-3 py-2.5 rounded-xl border-2 text-center text-base font-bold tracking-[0.4em] transition-all focus:outline-none ${
                    theme === 'dark'
                      ? 'bg-slate-900/50 border-slate-700 text-white placeholder-slate-600 focus:border-indigo-500'
                      : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-500'
                  }`}
                />
                <button
                  onClick={handleChangePassword}
                  disabled={isChangingPassword || newPassword.length !== 3}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  {isChangingPassword ? '...' : 'Simpan'}
                </button>
              </div>
              <p className={`text-[10px] mt-1.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Password harus berupa 3 digit angka.
              </p>
            </div>

            <hr className={`border-t ${theme === 'dark' ? 'border-slate-800/60' : 'border-slate-100'}`} />

            {/* Profile Summary Card above logout */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-100/60 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50">
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
                <div className="text-xs font-black truncate text-slate-800 dark:text-slate-200">
                  {profileUsername}
                </div>
                <div className="text-[10px] font-extrabold text-indigo-400">
                  {currentTierInfo.badge} Tingkat {currentTierInfo.tier} • LV {levelInfo.level}
                </div>
              </div>
            </div>

            <button
              onClick={async () => {
                await authClient.signOut();
                triggerToast('Sampai jumpa lagi!', '👋');
              }}
              className="w-full py-3 rounded-2xl text-xs font-black uppercase tracking-wider bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/15 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout Akun</span>
            </button>
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* RIGHT COLUMN: QUEST, SOUND PACK, ACHIEVEMENTS & DATA (lg:col-span-7)     */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-7 space-y-6">

          {/* Card 3: Quest Harian Section */}
          <div className={`p-5 sm:p-6 rounded-3xl border transition-all animate-fade-in-up animation-delay-200 ${
            isQuestDone
              ? 'bg-gradient-to-br from-purple-950/30 via-indigo-950/20 to-purple-950/30 border-purple-500/40 shadow-lg shadow-purple-500/10'
              : theme === 'dark'
              ? 'bg-slate-900/40 border-white/[0.08] shadow-xl'
              : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-lg border border-purple-500/30 shadow-sm shrink-0">
                  🔥
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className={`text-xs font-black ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                      Quest Harian: Maraton 500 Soal
                    </h4>
                    <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase bg-purple-500/20 text-purple-400 border border-purple-500/30">
                      Hard
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Selesaikan 500 soal hari ini untuk mendapatkan bingkai <span className="font-extrabold text-purple-400">Aura Maraton</span>
                  </p>
                </div>
              </div>
              {isQuestDone && (
                <span className="shrink-0 px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Selesai
                </span>
              )}
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400 font-semibold">Progres Hari Ini:</span>
                <span className="font-black text-purple-500 dark:text-purple-300">
                  {todayQuestions} / 500 Soal ({Math.min(100, Math.round((todayQuestions / 500) * 100))}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-500 rounded-full"
                  style={{ width: `${Math.min(100, (todayQuestions / 500) * 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 flex-wrap gap-1">
                <span>
                  {isQuestDone ? '🎉 Bingkai Aura Maraton siap digunakan!' : `Kurang ${Math.max(0, 500 - todayQuestions)} soal lagi.`}
                </span>
                {isQuestDone && currentFrameId !== 'quest_500_today' && (
                  <button
                    type="button"
                    onClick={() => handleSelectFrame('quest_500_today')}
                    className="text-purple-400 hover:text-purple-300 font-extrabold underline cursor-pointer"
                  >
                    Pasang Aura Ini ✨
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Card 4: Sound Pack Selector */}
          <div className={`p-5 sm:p-6 rounded-3xl border transition-all space-y-3.5 animate-fade-in-up animation-delay-250 ${
            theme === 'dark'
              ? 'bg-slate-900/40 border-white/[0.08] shadow-xl'
              : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-indigo-500" />
                <h3 className={`text-xs font-black uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                  Efek Suara Kuis (Sound Pack)
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-bold">Web Audio API</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SOUND_PACKS.map((pack) => {
                const isSelected = currentSoundPack === pack.id;
                return (
                  <div
                    key={pack.id}
                    onClick={() => handleSelectSoundPack(pack.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-500/10 border-indigo-500/50 shadow-sm'
                        : 'bg-slate-100/50 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/80 hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base shrink-0">{pack.icon}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-extrabold truncate">{pack.name}</span>
                          {isSelected && (
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-indigo-500 text-white shrink-0">
                              Aktif
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-450 line-clamp-1">
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
                        className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-indigo-500 hover:text-white text-[10px] font-bold flex items-center gap-1 transition shrink-0 ml-1.5"
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
          <div className={`p-5 sm:p-6 rounded-3xl border transition-all animate-fade-in-up animation-delay-300 ${
            theme === 'dark'
              ? 'bg-slate-900/40 border-white/[0.08] shadow-xl'
              : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-sm font-black ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                Achievements 🏆
              </h3>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                {achievements.unlockedIds.length} / {achievements.getAllAchievements().length} Unlocked
              </span>
            </div>
            
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2 custom-scrollbar">
              {['all', 'quiz', 'streak', 'mastery'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setAchievementFilter(filter as any)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap transition cursor-pointer ${
                    achievementFilter === filter 
                      ? 'bg-indigo-500 text-white shadow-sm' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {filter === 'all' ? 'Semua' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
              {achievements.getAllAchievements()
                .filter(a => achievementFilter === 'all' || a.category === achievementFilter)
                .map((ach, achIdx) => (
                <div 
                  key={ach.id}
                  title={ach.description}
                  style={{ animationDelay: `${Math.min(achIdx * 20, 200)}ms` }}
                  className={`relative p-3 rounded-2xl border flex flex-col items-center justify-center text-center transition-all animate-fade-in-up ${
                    ach.isUnlocked 
                      ? `${getRarityBg(ach.rarity, theme === 'dark')} opacity-100 transform hover:scale-102` 
                      : 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-200/50 dark:border-slate-800/50 opacity-40 grayscale'
                  }`}
                >
                  {!ach.isUnlocked && (
                    <div className="absolute top-1.5 right-1.5">
                      <span className="text-[10px]">🔒</span>
                    </div>
                  )}
                  <div className="text-2xl mb-1">{ach.icon}</div>
                  <div className={`text-[9px] font-black leading-tight ${ach.isUnlocked ? getRarityColor(ach.rarity, theme === 'dark') : 'text-slate-500'}`}>
                    {ach.title}
                  </div>
                  {ach.isUnlocked && (
                    <div className="mt-1 text-[8px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
                      +{ach.xpReward} XP
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Card 6: Data Management Section */}
          <div className={`p-5 sm:p-6 rounded-3xl border transition-all animate-fade-in-up animation-delay-350 ${
            theme === 'dark'
              ? 'bg-slate-900/40 border-white/[0.08] shadow-xl'
              : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <h3 className={`text-xs font-black uppercase tracking-wider mb-2 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
              <Download className="w-4 h-4 text-indigo-500" /> Ekspor & Impor Data
            </h3>
            <p className={`text-xs mb-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              Backup riwayat kuis, catatan Study Room, dan progres SRS Anda, atau pulihkan dari file backup sebelumnya.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={exportData}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border-2 border-indigo-500/20 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-500/20 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Ekspor JSON
              </button>
              
              <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer">
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
