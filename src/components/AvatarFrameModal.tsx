import React from 'react';
import { X, Check, Lock, Sparkles, Shield } from 'lucide-react';
import { AVATAR_FRAMES, AvatarFrameId, setSavedAvatarFrame } from '../utils/avatarFrames';

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
  };
  username: string;
  theme: string;
}

export const AvatarFrameModal: React.FC<AvatarFrameModalProps> = ({
  isOpen,
  onClose,
  currentFrameId,
  onSelectFrame,
  userStats,
  username,
  theme
}) => {
  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div 
        className={`w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden ${
          theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200/40 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black">
              ✨
            </div>
            <div>
              <h3 className="text-base font-black">Koleksi Bingkai & Aura Avatar</h3>
              <p className="text-[11px] text-slate-400">Pilih dan pasang aura bingkai profil kebanggaanmu</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Frames List */}
        <div className="p-5 overflow-y-auto space-y-3.5 custom-scrollbar">
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
                      ? 'border-indigo-500 bg-indigo-500/10 shadow-md shadow-indigo-500/10 cursor-default ring-2 ring-indigo-500/30'
                      : 'border-slate-200 dark:border-slate-800/80 hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:bg-slate-100/50 dark:hover:bg-slate-800/30 cursor-pointer'
                    : 'border-slate-200/50 dark:border-slate-800/40 bg-slate-100/30 dark:bg-slate-900/30 opacity-60 cursor-not-allowed'
                }`}
              >
                {/* Avatar Preview */}
                <div className="relative shrink-0">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${frame.ringClass} ${frame.glowClass}`}>
                    <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center font-black text-sm text-white">
                      {username.slice(0, 2).toUpperCase()}
                    </div>
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
                        Terbuka
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

        {/* Footer info */}
        <div className="p-4 border-t border-slate-200/40 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-[11px] text-slate-450">
          <span>Kultivator Level: <strong className="text-indigo-400">{userStats.level}</strong></span>
          <span>Total Soal: <strong className="text-teal-400">{userStats.totalQuestions}</strong></span>
          <span>Best Sudden Death: <strong className="text-rose-400">{userStats.suddenDeathBest}</strong></span>
        </div>
      </div>
    </div>
  );
};
