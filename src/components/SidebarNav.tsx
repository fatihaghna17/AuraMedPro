import React, { useState, useEffect } from 'react';
import {
  Activity, Home, BookOpen, PlusCircle, Brain, StickyNote, BarChart2, User, AlertCircle, Flame, LogOut
, Gamepad2, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  CultivatorAvatar,
  CULTIVATOR_TIERS,
  getEffectiveCultivatorTier,
  getSavedCultivatorGender,
  CultivatorGender
} from '../utils/cultivatorAvatars';
import { AVATAR_FRAMES, getSavedAvatarFrame, AvatarFrameId } from '../utils/avatarFrames';
import { getStreakFlameStyle } from '../utils/appHelpers';

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface SidebarNavProps {
  theme: 'light' | 'dark';
  activeTab: string;
  srsDueCount: number;
  currentStreak: number;
  streakFreezeLeft: number;
  username: string;
  userLevel: number;
  isAdmin: boolean;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

export default function SidebarNav({
  theme, activeTab, srsDueCount, currentStreak, streakFreezeLeft, username, userLevel, isAdmin, onTabChange, onLogout,
}: SidebarNavProps) {
  const [savedFrameId, setSavedFrameId] = useState<AvatarFrameId>(getSavedAvatarFrame());
  const [cultivatorGender, setCultivatorGender] = useState<CultivatorGender>(getSavedCultivatorGender());
  const streakFlame = getStreakFlameStyle(currentStreak);

  useEffect(() => {
    const handleUpdate = () => {
      setSavedFrameId(getSavedAvatarFrame());
      setCultivatorGender(getSavedCultivatorGender());
    };
    handleUpdate();
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('auramedpro_frame_changed', handleUpdate);
    window.addEventListener('auramedpro_avatar_gender_changed', handleUpdate);
    window.addEventListener('auramedpro_avatar_tier_changed', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('auramedpro_frame_changed', handleUpdate);
      window.removeEventListener('auramedpro_avatar_gender_changed', handleUpdate);
      window.removeEventListener('auramedpro_avatar_tier_changed', handleUpdate);
    };
  }, []);

  const activeFrame = AVATAR_FRAMES.find(f => f.id === savedFrameId) || AVATAR_FRAMES[0];
  const tier = getEffectiveCultivatorTier(userLevel);
  const tierInfo = CULTIVATOR_TIERS[tier - 1] || CULTIVATOR_TIERS[0];

  const items: NavItem[] = [
    { id: 'home', label: 'Beranda', icon: Home },
    { id: 'banks', label: 'Bank Soal', icon: BookOpen },
    { id: 'groups', label: 'Grup Belajar', icon: Users },
    { id: 'new', label: 'Baru', icon: PlusCircle },
    { id: 'srs', label: 'Spaced Repetition', icon: Brain },
    { id: 'notes', label: 'Study Room', icon: StickyNote },
    { id: 'analysis', label: 'Analisis', icon: BarChart2 },
    { id: 'profile', label: 'Profil', icon: User },
    ...(isAdmin ? [{ id: 'reports', label: 'Laporan', icon: AlertCircle }] : []),
  ];

  return (
    <aside className="fixed top-0 bottom-0 left-0 z-30 w-64 hidden lg:flex flex-col justify-between liquid-glass-card border-r text-slate-900 dark:text-slate-100 transition-all duration-200">
      {/* Logo & Header */}
      <div className="p-5">
        <div className="flex items-center gap-3 mb-7 px-1.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0 shadow-md shadow-indigo-500/25 ring-1 ring-white/25">
            <Activity className="w-4.5 h-4.5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">AuraMed</span>
              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold tracking-wider liquid-glass-subtle text-indigo-600 dark:text-indigo-300">
                PRO
              </span>
            </div>
            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 tracking-tight leading-tight mt-0.5 truncate">
              Clinical Question Drilling
            </p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer relative group ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 ring-1 ring-white/20'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-white/55 dark:hover:bg-white/[0.08]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isActive ? 'scale-105' : ' opacity-80 group-hover:opacity-100'}`} />
                  <span>{item.label}</span>
                </div>
                {item.id === 'srs' && srsDueCount > 0 && (
                  <span className={`text-[10px] font-bold tabular-nums rounded-md min-w-[20px] h-5 flex items-center justify-center px-1.5 ${
                    isActive ? 'bg-white text-indigo-600 shadow-xs' : 'bg-rose-600 text-white'
                  }`}>
                    {srsDueCount > 99 ? '99+' : srsDueCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-4 space-y-3">
        {/* Streak Overview Card */}
        <div className="p-3 rounded-xl liquid-glass-subtle flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0" title={`Streak Belajar: ${currentStreak} Hari • ${streakFlame.tierName}`}>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Flame className={`w-4 h-4 fill-current ${streakFlame.flameColor}`} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold tabular-nums leading-tight text-slate-900 dark:text-slate-100">{currentStreak} Hari Streak</span>
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-tight truncate mt-0.5">{streakFlame.tierName}</span>
            </div>
          </div>
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 shrink-0"
            title={`${streakFreezeLeft} Streak Freeze Tersedia`}
          >
            <span className="text-xs font-bold tabular-nums text-sky-600 dark:text-sky-400">{streakFreezeLeft}</span>
            <span className="text-[10px]">❄️</span>
          </div>
        </div>

        {/* Profile & Logout */}
        <div className="p-2.5 rounded-xl liquid-glass-subtle space-y-2.5">
          <div 
            onClick={() => onTabChange('profile')}
            className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-white/60 dark:hover:bg-white/[0.08] transition-colors duration-150 cursor-pointer group"
            title="Buka Halaman Profil & Kustomisasi Avatar"
          >
            <div className="relative shrink-0">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${activeFrame.ringClass}`}>
                <CultivatorAvatar 
                  tier={tier}
                  gender={cultivatorGender}
                  className="w-full h-full"
                  uid="sidebar_avatar"
                />
              </div>
              <span className="absolute -bottom-1 -right-1 text-xs">
                {activeFrame.badge}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold truncate text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {username}
              </p>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                <span className="text-indigo-600 dark:text-indigo-400">{tierInfo.badge} T{tier}</span>
                <span>•</span>
                <span>Lv {userLevel}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-200/70 dark:border-white/10 bg-white/50 dark:bg-white/[0.04] hover:bg-rose-500/10 dark:hover:bg-rose-500/15 hover:border-rose-500/30 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-all duration-150 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Sesi</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
