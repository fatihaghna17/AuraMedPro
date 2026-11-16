import React, { useState } from 'react';
import { Home, BookOpen, PlusCircle, Brain, StickyNote, BarChart2, User, AlertCircle, Users, MoreHorizontal, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface BottomNavProps {
  theme: 'light' | 'dark';
  activeTab: string;
  srsDueCount: number;
  isAdmin: boolean;
  onTabChange: (tab: string) => void;
}

export default function BottomNav({ theme, activeTab, srsDueCount, isAdmin, onTabChange }: BottomNavProps) {
  const [moreOpen, setMoreOpen] = useState(false);

  const primaryItems: NavItem[] = [
    { id: 'home', label: 'Beranda', icon: Home },
    { id: 'banks', label: 'Bank Soal', icon: BookOpen },
    { id: 'new', label: 'Mulai Kuis', icon: PlusCircle },
    { id: 'srs', label: 'SRS', icon: Brain },
  ];

  const secondaryItems: NavItem[] = [
    { id: 'notes', label: 'Study Room & Catatan', icon: StickyNote },
    { id: 'groups', label: 'Grup Belajar', icon: Users },
    { id: 'analysis', label: 'Analisis Performa', icon: BarChart2 },
    { id: 'profile', label: 'Profil & Akun', icon: User },
    ...(isAdmin ? [{ id: 'reports', label: 'Laporan Soal', icon: AlertCircle }] : []),
  ];

  const activeSecondary = secondaryItems.find((item) => item.id === activeTab);

  return (
    <>
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden bg-slate-950/50 backdrop-blur-xs animate-fade-in"
          onClick={() => setMoreOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="fixed bottom-20 left-3 right-3 rounded-2xl liquid-glass-card p-3 text-slate-900 dark:text-slate-100 animate-fade-in-up"
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200/60 dark:border-white/10 mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Navigasi Lainnya</span>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
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
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all duration-150 ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden grid grid-cols-5 items-center h-16 liquid-glass-card border-t px-1.5 text-slate-700 dark:text-slate-300">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setMoreOpen(false);
                onTabChange(item.id);
              }}
              className={`relative flex flex-col items-center justify-center h-12 rounded-xl gap-1 transition-all duration-150 ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] font-semibold truncate max-w-[64px]">{item.label}</span>
              {item.id === 'srs' && srsDueCount > 0 && (
                <span className="absolute top-1 right-2.5 bg-rose-600 text-white text-[9px] font-bold tabular-nums rounded-md min-w-[16px] h-4 px-1 flex items-center justify-center">
                  {srsDueCount > 9 ? '9+' : srsDueCount}
                </span>
              )}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setMoreOpen((prev) => !prev)}
          className={`relative flex flex-col items-center justify-center h-12 rounded-xl gap-1 transition-all duration-150 ${
            activeSecondary || moreOpen
              ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          {activeSecondary ? <activeSecondary.icon className="w-4 h-4" /> : <MoreHorizontal className="w-4 h-4" />}
          <span className="text-[10px] font-semibold truncate max-w-[64px]">
            {activeSecondary ? activeSecondary.label.split(' ')[0] : 'Lainnya'}
          </span>
        </button>
      </nav>
    </>
  );
}
