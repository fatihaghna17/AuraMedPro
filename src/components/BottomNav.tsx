import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home,
  BookOpen,
  PlusCircle,
  Brain,
  StickyNote,
  BarChart2,
  User,
  AlertCircle,
  Users,
  Layers,
  MoreHorizontal,
  X,
  Flame,
  Snowflake,
  LogOut,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  CultivatorAvatar,
  getEffectiveCultivatorTier,
  getSavedCultivatorGender,
} from '../utils/cultivatorAvatars';
import { AVATAR_FRAMES, getSavedAvatarFrame } from '../utils/avatarFrames';

interface NavItem {
  id: string;
  label: string;
  shortLabel?: string;
  icon: LucideIcon;
  dotColor?: string;
  dotGlow?: string;
}

interface BottomNavProps {
  theme: 'light' | 'dark';
  activeTab: string;
  srsDueCount: number;
  isAdmin: boolean;
  currentStreak?: number;
  streakFreezeLeft?: number;
  username?: string;
  userLevel?: number;
  onLogout?: () => void;
  onTabChange: (tab: string) => void;
}

export default function BottomNav({
  theme,
  activeTab,
  srsDueCount,
  isAdmin,
  currentStreak = 0,
  streakFreezeLeft = 0,
  username,
  userLevel = 1,
  onLogout,
  onTabChange,
}: BottomNavProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const isDark = theme === 'dark';

  const primaryItems: NavItem[] = [
    { id: 'home', label: 'Beranda', icon: Home },
    { id: 'banks', label: 'Bank Soal', icon: BookOpen },
    { id: 'flashcard', label: 'Flashcard', icon: Layers },
    { id: 'new', label: 'Mulai Kuis', icon: PlusCircle },
  ];

  const secondaryItems: NavItem[] = [
    {
      id: 'srs',
      label: 'Repetisi SRS',
      shortLabel: 'SRS',
      icon: Brain,
      dotColor: isDark ? '#38bdf8' : '#0284c7',
      dotGlow: 'rgba(56, 189, 248, 0.5)',
    },
    {
      id: 'notes',
      label: 'Study Room',
      shortLabel: 'Catatan',
      icon: StickyNote,
      dotColor: isDark ? '#fbbf24' : '#f59e0b',
      dotGlow: 'rgba(251, 191, 36, 0.5)',
    },
    {
      id: 'groups',
      label: 'Grup Belajar',
      shortLabel: 'Grup',
      icon: Users,
      dotColor: isDark ? '#34d399' : '#10b981',
      dotGlow: 'rgba(52, 211, 153, 0.5)',
    },
    {
      id: 'analysis',
      label: 'Analisis',
      shortLabel: 'Analisis',
      icon: BarChart2,
      dotColor: isDark ? '#f472b6' : '#ec4899',
      dotGlow: 'rgba(244, 114, 182, 0.5)',
    },
    {
      id: 'profile',
      label: 'Profil & Avatar',
      shortLabel: 'Profil',
      icon: User,
      dotColor: isDark ? '#a78bfa' : '#7c3aed',
      dotGlow: 'rgba(167, 139, 250, 0.5)',
    },
    ...(isAdmin
      ? [
          {
            id: 'reports',
            label: 'Laporan Soal',
            shortLabel: 'Laporan',
            icon: AlertCircle,
            dotColor: isDark ? '#fb7185' : '#f43f5e',
            dotGlow: 'rgba(251, 113, 133, 0.5)',
          },
        ]
      : []),
  ];

  const activeSecondary = secondaryItems.find((item) => item.id === activeTab);
  const savedFrameId = getSavedAvatarFrame();
  const activeFrame = AVATAR_FRAMES.find((f) => f.id === savedFrameId) || AVATAR_FRAMES[0];
  const tier = getEffectiveCultivatorTier(userLevel);
  const gender = getSavedCultivatorGender();

  return (
    <>
      <AnimatePresence>
        {moreOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 lg:hidden bg-slate-950/45 backdrop-blur-xs"
            onClick={() => setMoreOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className={`fixed left-3 right-3 bottom-[calc(5.15rem+env(safe-area-inset-bottom))] max-w-md mx-auto rounded-[28px] p-3.5 mobile-glass-shell ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              {/* Top Profile & Streak Quick Strip (Mirrors Desktop Sidebar V10 Footer) */}
              <div
                className={`flex items-center justify-between gap-2 p-2.5 rounded-2xl mb-3 border ${
                  isDark
                    ? 'bg-white/[0.07] border-white/[0.14]'
                    : 'bg-white/60 border-white/85 shadow-2xs'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    onTabChange('profile');
                    setMoreOpen(false);
                  }}
                  className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer"
                >
                  <div className={`w-9 h-9 rounded-full overflow-hidden shrink-0 ${activeFrame.ringClass}`}>
                    <CultivatorAvatar
                      tier={tier}
                      gender={gender}
                      className="w-full h-full"
                      uid="mobile_sheet_avatar"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-extrabold truncate leading-tight">
                      {username || 'Mahasiswa'}
                    </p>
                    <p
                      className={`text-[10.5px] font-semibold tabular-nums truncate mt-0.5 ${
                        isDark ? 'text-sky-100/75' : 'text-slate-600'
                      }`}
                    >
                      Tier {tier} • Lv {userLevel}
                    </p>
                  </div>
                </button>

                <div className="flex items-center gap-1.5 shrink-0">
                  <div
                    className={`px-2 py-1 rounded-full text-[10.5px] font-extrabold tabular-nums flex items-center gap-1 border ${
                      isDark
                        ? 'bg-amber-400/15 border-amber-300/30 text-amber-200'
                        : 'bg-amber-500/12 border-amber-500/25 text-amber-700'
                    }`}
                    title={`${currentStreak} Hari Streak • ${streakFreezeLeft} Freeze`}
                  >
                    <Flame className="w-3 h-3 fill-current text-amber-500" />
                    <span>{currentStreak}</span>
                    <span className="opacity-40">•</span>
                    <Snowflake className="w-2.5 h-2.5 text-sky-400" />
                    <span>{streakFreezeLeft}</span>
                  </div>

                  {onLogout && (
                    <button
                      type="button"
                      onClick={() => {
                        setMoreOpen(false);
                        onLogout();
                      }}
                      title="Keluar Sesi"
                      aria-label="Keluar Sesi"
                      className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                        isDark
                          ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-200 border border-rose-400/25'
                          : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 border border-rose-500/20'
                      }`}
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setMoreOpen(false)}
                    aria-label="Tutup Menu"
                    className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                      isDark
                        ? 'bg-white/10 hover:bg-white/20 text-sky-100'
                        : 'bg-slate-900/[0.06] hover:bg-slate-900/[0.12] text-slate-700'
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="px-1 pb-2 flex items-center justify-between">
                <span
                  className={`text-[10px] font-extrabold uppercase tracking-[0.14em] ${
                    isDark ? 'text-sky-100/70' : 'text-slate-500'
                  }`}
                >
                  Ruang Belajar & Akun
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {secondaryItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onTabChange(item.id);
                        setMoreOpen(false);
                      }}
                      className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-2xl text-xs font-bold text-left transition-all cursor-pointer border ${
                        isActive
                          ? isDark
                            ? 'bg-gradient-to-b from-[#2f4578] to-[#1e2d54] text-white border-[#7dd3fc]/55 shadow-[0_6px_18px_-4px_rgba(56,189,248,0.38)]'
                            : 'bg-white text-[#1d4ed8] border-blue-400/35 shadow-[0_6px_16px_-4px_rgba(29,78,216,0.20)]'
                          : isDark
                          ? 'bg-white/[0.07] hover:bg-white/[0.13] text-white/90 border-white/[0.12]'
                          : 'bg-white/55 hover:bg-white/80 text-slate-800 border-white/80'
                      }`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 relative ${
                            isDark ? 'bg-white/[0.10]' : 'bg-slate-900/[0.05]'
                          }`}
                        >
                          <Icon
                            className={`w-3.5 h-3.5 ${
                              isActive
                                ? isDark
                                  ? 'text-[#7dd3fc]'
                                  : 'text-[#1d4ed8]'
                                : ''
                            }`}
                          />
                          {item.dotColor && (
                            <span
                              style={{
                                backgroundColor: item.dotColor,
                                boxShadow: `0 0 6px ${item.dotGlow}`,
                              }}
                              className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full"
                            />
                          )}
                        </span>
                        <span className="truncate">{item.label}</span>
                      </span>

                      {item.id === 'srs' && srsDueCount > 0 && (
                        <span
                          className={`text-[10px] font-extrabold tabular-nums rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center shrink-0 ${
                            isActive
                              ? isDark
                                ? 'bg-[#38bdf8] text-[#0b1226]'
                                : 'bg-[#1d4ed8] text-white'
                              : 'bg-[#fbbf24] text-[#0f172a]'
                          }`}
                        >
                          {srsDueCount > 99 ? '99+' : srsDueCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOATING LIQUID GLASS V10 DOCK CAPSULE */}
      <nav
        aria-label="Navigasi Utama Mobile"
        className={`fixed left-3 right-3 bottom-[max(0.6rem,env(safe-area-inset-bottom))] z-40 lg:hidden max-w-md mx-auto grid grid-cols-5 items-center h-[62px] p-1.5 rounded-[28px] mobile-glass-shell select-none ${
          isDark ? 'text-white' : 'text-slate-800'
        }`}
      >
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id && !moreOpen;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setMoreOpen(false);
                onTabChange(item.id);
              }}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center h-full rounded-[22px] gap-0.5 transition-colors cursor-pointer ${
                isActive
                  ? isDark
                    ? 'text-[#7dd3fc] font-extrabold'
                    : 'text-[#1d4ed8] font-extrabold'
                  : isDark
                  ? 'text-white/75 hover:text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900 font-semibold'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="mobileLiquidDockPill"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="absolute inset-0 rounded-[22px] mobile-dock-active-pill z-0"
                />
              )}
              <Icon className={`relative z-10 w-[18px] h-[18px] ${isActive ? 'stroke-[2.4]' : 'stroke-[2]'}`} />
              <span className="relative z-10 text-[10px] leading-tight tracking-tight truncate max-w-[62px]">
                {item.label}
              </span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setMoreOpen((prev) => !prev)}
          aria-expanded={moreOpen}
          className={`relative flex flex-col items-center justify-center h-full rounded-[22px] gap-0.5 transition-colors cursor-pointer ${
            activeSecondary || moreOpen
              ? isDark
                ? 'text-[#7dd3fc] font-extrabold'
                : 'text-[#1d4ed8] font-extrabold'
              : isDark
              ? 'text-white/75 hover:text-white font-semibold'
              : 'text-slate-600 hover:text-slate-900 font-semibold'
          }`}
        >
          {(activeSecondary || moreOpen) && (
            <motion.span
              layoutId="mobileLiquidDockPill"
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="absolute inset-0 rounded-[22px] mobile-dock-active-pill z-0"
            />
          )}
          {activeSecondary ? (
            <activeSecondary.icon className="relative z-10 w-[18px] h-[18px] stroke-[2.4]" />
          ) : (
            <MoreHorizontal className="relative z-10 w-[18px] h-[18px] stroke-[2.2]" />
          )}
          <span className="relative z-10 text-[10px] leading-tight tracking-tight truncate max-w-[62px]">
            {activeSecondary ? activeSecondary.shortLabel || activeSecondary.label : 'Lainnya'}
          </span>
          {srsDueCount > 0 && (
            <span
              className={`absolute top-1 right-2 z-20 bg-[#fbbf24] text-[#0f172a] text-[9px] font-extrabold tabular-nums rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center ring-2 ${
                isDark ? 'ring-[#162344]' : 'ring-white'
              }`}
            >
              {srsDueCount > 99 ? '99+' : srsDueCount}
            </span>
          )}
        </button>
      </nav>
    </>
  );
}
