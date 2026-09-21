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
    <aside className={`fixed top-0 bottom-0 left-0 z-30 w-60 hidden lg:flex flex-col justify-between border-r transition-colors ${
      theme === 'dark' ? 'bg-slate-900 border-slate-800/80 text-white' : 'bg-white border-slate-200 text-slate-900'
    }`}>
      {/* Logo & Header */}
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-650 text-white flex items-center justify-center font-extrabold shadow-sm shrink-0">
            <Activity className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center">
              <span className="font-black text-lg tracking-tight">AuraMed</span>
              <span className="ml-1 px-1.5 py-0.5 rounded text-[8px] font-black bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/20 uppercase tracking-widest">PRO</span>
            </div>
            <p className="text-[9px] font-bold text-slate-400 tracking-tight leading-tight mt-0.5">
              Aura-Infused Question Drilling Platform
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
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/10 scale-[1.02]'
                    : theme === 'dark'
                      ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.id === 'srs' && srsDueCount > 0 && (
                  <span className={`text-[9px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 ${
                    isActive ? 'bg-white text-rose-500' : 'bg-rose-500 text-white'
                  }`}>
                    {srsDueCount > 9 ? '9+' : srsDueCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Streak Overview */}
      <div className="px-6 py-4 border-t border-slate-200/50 dark:border-slate-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{currentStreak} Hari</span>
          </div>
          <div className="flex items-center gap-1.5" title={`${streakFreezeLeft} Freeze Tersedia`}>
            <span className="text-xs font-black text-sky-500">{streakFreezeLeft}</span>
            <span className="text-[10px]">❄️</span>
          </div>
        </div>
      </div>

      {/* Profile & Logout */}
      <div className="p-4 sm:p-5 border-t border-slate-200/50 dark:border-slate-800/50">
        {/* Cultivator Avatar Card above Logout Logo */}
        <div 
          onClick={() => onTabChange('profile')}
          className="flex items-center gap-3 mb-3.5 p-2 rounded-2xl hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition cursor-pointer group"
          title="Buka Halaman Profil & Kustomisasi Avatar"
        >
          <div className="relative shrink-0">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-105 ${activeFrame.ringClass} ${activeFrame.glowClass}`}>
              <CultivatorAvatar 
                tier={tier}
                gender={cultivatorGender}
                className="w-full h-full"
                uid="sidebar_avatar"
              />
            </div>
            <span className="absolute -bottom-1 -right-1 text-xs drop-shadow">
              {activeFrame.badge}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black truncate text-slate-800 dark:text-slate-200 group-hover:text-indigo-400 transition">
              {username}
            </p>
            <div className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase text-slate-400 mt-0.5">
              <span className="text-indigo-400 font-black">{tierInfo.badge} T{tier}</span>
              <span>•</span>
              <span>LV {userLevel}</span>
            </div>
          </div>
        </div>

        <button
          onClick={onLogout}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
            theme === 'dark'
              ? 'bg-slate-800/80 hover:bg-red-500/10 border-slate-700 text-slate-400 hover:text-red-400'
              : 'bg-white hover:bg-red-50 border-slate-200 text-slate-500 hover:text-red-500'
          }`}
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
}
