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
          className="fixed inset-0 z-40 lg:hidden bg-slate-950/50"
          onClick={() => setMoreOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`fixed bottom-16 left-3 right-3 rounded-xl border p-2 shadow-xl backdrop-blur-2xl ${
              theme === 'dark'
                ? 'bg-slate-900/60 border-white/15 text-slate-100'
                : 'bg-white/60 border-white/80 text-slate-900 shadow-lg'
            }`}
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/15 dark:border-white/10 mb-1">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Menu Lainnya</span>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1">
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
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold text-left transition-colors duration-150 ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : theme === 'dark'
                          ? 'text-slate-300 hover:bg-slate-800'
                          : 'text-slate-700 hover:bg-slate-100'
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

      <nav className={`fixed bottom-0 left-0 right-0 z-40 lg:hidden grid grid-cols-5 items-center h-16 border-t px-1 backdrop-blur-xl transition-colors duration-150 ${
        theme === 'dark' ? 'bg-slate-900/80 border-slate-800/80 text-slate-400' : 'bg-white/80 border-slate-200/80 text-slate-600'
      }`}>
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
              className={`relative flex flex-col items-center justify-center h-full gap-1 transition-colors duration-150 ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] font-semibold truncate max-w-[64px]">{item.label}</span>
              {item.id === 'srs' && srsDueCount > 0 && (
                <span className="absolute top-1.5 right-3 bg-rose-600 text-white text-[9px] font-bold rounded-md min-w-[16px] h-4 px-1 flex items-center justify-center">
                  {srsDueCount > 9 ? '9+' : srsDueCount}
                </span>
              )}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setMoreOpen((prev) => !prev)}
          className={`relative flex flex-col items-center justify-center h-full gap-1 transition-colors duration-150 ${
            activeSecondary || moreOpen
              ? 'text-indigo-600 dark:text-indigo-400'
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
