import React, { useState } from 'react';
import { X, Check, Lock, Sparkles, User, Shield, RefreshCw } from 'lucide-react';
import { AVATAR_FRAMES, AvatarFrameId, setSavedAvatarFrame } from '../utils/avatarFrames';
import { 
  CULTIVATOR_TIERS, 
  CultivatorGender, 
  CultivatorAvatar, 
  getCultivatorTier, 
  getSavedCultivatorGender, 
  setSavedCultivatorGender, 
  getSavedCultivatorTier, 
  setSavedCultivatorTier,
  getEffectiveCultivatorTier
} from '../utils/cultivatorAvatars';

interface AvatarFrameModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFrameId: AvatarFrameId;
  onSelectFrame: (id: AvatarFrameId) => void;
  userStats: {
    level: number;
    totalQuestions: number;
    suddenDeathBest: number;
    todayQuestions?: number;
    isAdmin?: boolean;
  };
  username: string;
  theme: string;
  initialTab?: 'avatar' | 'frame';
  onSelectAvatarTier?: (tier: number | 'auto') => void;
  onSelectGender?: (gender: CultivatorGender) => void;
}

export const AvatarFrameModal: React.FC<AvatarFrameModalProps> = ({
  isOpen,
  onClose,
  currentFrameId,
  onSelectFrame,
  userStats,
  username,
  theme,
  initialTab = 'avatar',
  onSelectAvatarTier,
  onSelectGender
}) => {
  const [activeTab, setActiveTab] = useState<'avatar' | 'frame'>(initialTab);
  const [gender, setGender] = useState<CultivatorGender>(getSavedCultivatorGender());
  const [selectedTier, setSelectedTier] = useState<number | 'auto'>(getSavedCultivatorTier());

  if (!isOpen) return null;

  const currentLevel = userStats.level || 1;
  const maxUnlockedTier = getCultivatorTier(currentLevel);
  const equippedTier = getEffectiveCultivatorTier(currentLevel);
  const activeFrame = AVATAR_FRAMES.find(f => f.id === currentFrameId) || AVATAR_FRAMES[0];

  const handleGenderChange = (newGender: CultivatorGender) => {
    setGender(newGender);
    setSavedCultivatorGender(newGender);
    onSelectGender?.(newGender);
  };

  const handleTierSelect = (tier: number | 'auto') => {
    setSelectedTier(tier);
    setSavedCultivatorTier(tier);
    onSelectAvatarTier?.(tier);
  };

  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case 'mythic':
        return 'bg-gradient-to-r from-yellow-400 to-pink-500 text-white font-black';
      case 'legendary':
        return 'bg-amber-500/20 text-amber-500 border border-amber-500/30';
      case 'epic':
        return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
      case 'rare':
        return 'bg-sky-500/20 text-sky-400 border border-sky-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div 
        className={`w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden ${
          theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200/40 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-black text-base">
                🧘
              </div>
              <div>
                <h3 className="text-base font-black">Koleksi Avatar & Bingkai Kultivasi</h3>
                <p className="text-[11px] text-slate-400">Pilih wujud kultivator dan aura kebanggaanmu</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mt-4 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-2xl">
            <button
              onClick={() => setActiveTab('avatar')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'avatar'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Avatar Kultivator (10 Tingkat)</span>
            </button>
            <button
              onClick={() => setActiveTab('frame')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'frame'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Bingkai & Aura ({AVATAR_FRAMES.length})</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: AVATAR KULTIVATOR                                                  */}
        {/* ========================================================================= */}
        {activeTab === 'avatar' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
            
            {/* Gender Toggle & Auto-Mode Control */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
              {/* Gender Selector */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <span className="text-[11px] font-bold text-slate-400 mr-1 shrink-0">Wujud:</span>
                <button
                  onClick={() => handleGenderChange('pria')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                    gender === 'pria'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span>👨</span>
                  <span>Kultivator Pria</span>
                </button>
                <button
                  onClick={() => handleGenderChange('wanita')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                    gender === 'wanita'
                      ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
                      : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span>👩</span>
                  <span>Kultivator Wanita</span>
                </button>
              </div>

              {/* Auto Tier Button */}
              <button
                onClick={() => handleTierSelect('auto')}
                className={`w-full sm:w-auto px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedTier === 'auto'
                    ? 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-200/50 dark:bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
                title="Otomatis mengikuti tingkat tertinggi yang telah kamu capai"
              >
                <RefreshCw className={`w-3 h-3 ${selectedTier === 'auto' ? 'animate-spin' : ''}`} />
                <span>Mode Otomatis Level ({maxUnlockedTier})</span>
              </button>
            </div>

            {/* List of 10 Cultivator Tiers */}
            <div className="space-y-3">
              {CULTIVATOR_TIERS.map((t) => {
                const isUnlocked = Boolean(userStats.isAdmin || currentLevel >= t.minLevel);
                const isEquipped = equippedTier === t.tier;

                return (
                  <div
                    key={t.tier}
                    onClick={() => {
                      if (isUnlocked) {
                        handleTierSelect(t.tier);
                      }
                    }}
                    className={`relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 ${
                      isUnlocked
                        ? isEquipped
                          ? 'border-indigo-500 bg-indigo-500/10 shadow-md shadow-indigo-500/10 ring-2 ring-indigo-500/30 cursor-default'
                          : 'border-slate-200 dark:border-slate-800/80 hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:bg-slate-100/50 dark:hover:bg-slate-800/30 cursor-pointer'
                        : 'border-slate-200/50 dark:border-slate-800/40 bg-slate-100/30 dark:bg-slate-900/30 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    {/* Cultivator Avatar Preview */}
                    <div className="relative shrink-0">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${activeFrame.ringClass} ${activeFrame.glowClass}`}>
                        <CultivatorAvatar 
                          tier={t.tier} 
                          gender={gender} 
                          className="w-full h-full"
                          uid={`modal_t${t.tier}`}
                        />
                      </div>
                      <span className="absolute -bottom-1 -right-1 text-xs drop-shadow">
                        {t.badge}
                      </span>
                    </div>

                    {/* Tier Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          Tingkat {t.tier}
                        </span>
                        <h4 className="text-xs font-black truncate">{t.name}</h4>
                      </div>
                      <div className="text-[10px] font-bold text-indigo-400 mt-0.5">
                        {t.realm}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        {t.description}
                      </p>

                      {/* Status / Requirement */}
                      <div className="mt-2 flex items-center gap-1.5 text-[10px]">
                        {isUnlocked ? (
                          <span className="text-emerald-500 dark:text-emerald-400 font-bold flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            Terbuka {userStats.isAdmin && <span className="text-[8px] px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-400 uppercase font-black">Admin</span>}
                          </span>
                        ) : (
                          <span className="text-rose-500 dark:text-rose-400 font-bold flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            Syarat: Capai Level {t.minLevel} (Levelmu: {currentLevel})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action button */}
                    <div className="shrink-0">
                      {isEquipped ? (
                        <span className="px-3 py-1.5 rounded-xl bg-indigo-500 text-white text-[11px] font-black flex items-center gap-1 shadow-sm">
                          <Check className="w-3.5 h-3.5" />
                          Terpasang
                        </span>
                      ) : isUnlocked ? (
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-500 hover:text-white text-[11px] font-bold transition cursor-pointer"
                        >
                          Pasang
                        </button>
                      ) : (
                        <div className="p-2 rounded-xl bg-slate-800/40 text-slate-500">
                          <Lock className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: BINGKAI & AURA                                                     */}
        {/* ========================================================================= */}
        {activeTab === 'frame' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-3.5 custom-scrollbar">
            {AVATAR_FRAMES.map((frame) => {
              const unlocked = frame.isUnlocked(userStats);
              const isEquipped = currentFrameId === frame.id;

              return (
                <div
                  key={frame.id}
                  onClick={() => {
                    if (unlocked) {
                      setSavedAvatarFrame(frame.id);
                      onSelectFrame(frame.id);
                    }
                  }}
                  className={`relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 ${
                    unlocked
                      ? isEquipped
                        ? 'border-indigo-500 bg-indigo-500/10 shadow-md shadow-indigo-500/10 ring-2 ring-indigo-500/30 cursor-default'
                        : 'border-slate-200 dark:border-slate-800/80 hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:bg-slate-100/50 dark:hover:bg-slate-800/30 cursor-pointer'
                      : 'border-slate-200/50 dark:border-slate-800/40 bg-slate-100/30 dark:bg-slate-900/30 opacity-60 cursor-not-allowed'
                  }`}
                >
                  {/* Cultivator Avatar Preview inside the frame */}
                  <div className="relative shrink-0">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${frame.ringClass} ${frame.glowClass}`}>
                      <CultivatorAvatar 
                        tier={equippedTier} 
                        gender={gender} 
                        className="w-full h-full"
                        uid={`modal_frame_${frame.id}`}
                      />
                    </div>
                    <span className="absolute -bottom-1 -right-1 text-sm drop-shadow">
                      {frame.badge}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-black truncate">{frame.name}</h4>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${getRarityBadge(frame.rarity)}`}>
                        {frame.rarity}
                      </span>
                      {frame.auraClass && (
                        <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/30">
                          Efek Aura
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-450 mt-0.5 leading-relaxed">
                      {frame.description}
                    </p>
                    
                    {/* Requirement / Status */}
                    <div className="mt-2 flex items-center gap-1.5 text-[10px]">
                      {unlocked ? (
                        <span className="text-emerald-500 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Terbuka {userStats.isAdmin && <span className="text-[8px] px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-400 uppercase font-black">Admin</span>}
                        </span>
                      ) : (
                        <span className="text-rose-500 dark:text-rose-400 font-bold flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          Syarat: {frame.requirementText}
                          {frame.id === 'quest_500_today' && ` (${userStats.todayQuestions || 0}/500)`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action button */}
                  <div className="shrink-0">
                    {isEquipped ? (
                      <span className="px-3 py-1.5 rounded-xl bg-indigo-500 text-white text-[11px] font-black flex items-center gap-1 shadow-sm">
                        <Check className="w-3.5 h-3.5" />
                        Terpasang
                      </span>
                    ) : unlocked ? (
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-500 hover:text-white text-[11px] font-bold transition cursor-pointer"
                      >
                        Pasang
                      </button>
                    ) : (
                      <div className="p-2 rounded-xl bg-slate-800/40 text-slate-500">
                        <Lock className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer info */}
        <div className="p-4 border-t border-slate-200/40 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-450">
          <span>Tingkat Kultivasi: <strong className="text-indigo-400">Tingkat {equippedTier} ({CULTIVATOR_TIERS[equippedTier - 1]?.name})</strong></span>
          <span>Level: <strong className="text-indigo-400">{userStats.level}</strong></span>
          <span>Sudden Death Best: <strong className="text-rose-400">{userStats.suddenDeathBest}</strong></span>
        </div>
      </div>
    </div>
  );
};
