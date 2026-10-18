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
    <aside className={`fixed top-0 bottom-0 left-0 z-30 w-60 hidden lg:flex flex-col justify-between border-r transition-colors duration-150 ${
      theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
    }`}>
      {/* Logo & Header */}
      <div className="p-5">
        <div className="flex items-center gap-2.5 mb-6 px-1">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight">AuraMed</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate leading-tight mt-0.5">
              Latihan Soal CBT & UKMPPD
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
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : theme === 'dark'
                      ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.id === 'srs' && srsDueCount > 0 && (
                  <span className={`text-[10px] font-bold rounded-md min-w-[20px] h-5 flex items-center justify-center px-1.5 ${
                    isActive ? 'bg-white text-indigo-600' : 'bg-rose-600 text-white'
                  }`}>
                    {srsDueCount > 99 ? '99+' : srsDueCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto">
        {/* Streak Overview */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5" title={`Streak Belajar: ${currentStreak} Hari • ${streakFlame.tierName}`}>
              <Flame className={`w-4 h-4 fill-current ${streakFlame.flameColor}`} />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold leading-tight text-slate-800 dark:text-slate-200">{currentStreak} Hari Streak</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight truncate">{streakFlame.tierName}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" title={`${streakFreezeLeft} Streak Freeze Tersedia`}>
              <span className="text-xs font-bold text-sky-600 dark:text-sky-400">{streakFreezeLeft}</span>
              <span className="text-[10px]">❄️</span>
            </div>
          </div>
        </div>

        {/* Profile & Logout */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div 
            onClick={() => onTabChange('profile')}
            className="flex items-center gap-3 mb-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-150 cursor-pointer group"
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
              <p className="text-xs font-bold truncate text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {username}
              </p>
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{tierInfo.badge} T{tier}</span>
                <span>•</span>
                <span>Lv {userLevel}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onLogout}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors duration-150 cursor-pointer ${
              theme === 'dark'
                ? 'bg-slate-800 hover:bg-rose-950/40 border-slate-700 hover:border-rose-800 text-slate-300 hover:text-rose-400'
                : 'bg-white hover:bg-rose-50 border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-600'
            }`}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
