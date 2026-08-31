import {
  Activity, Home, BookOpen, PlusCircle, Brain, StickyNote, BarChart2, User, AlertCircle, Flame, LogOut
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

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
  const items: NavItem[] = [
    { id: 'home', label: 'Beranda', icon: Home },
    { id: 'banks', label: 'Bank Soal', icon: BookOpen },
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
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-650 text-white flex items-center justify-center font-extrabold shadow-sm">
            <Activity className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <span className="font-black text-lg tracking-tight">AuraMed</span>
            <span className="ml-1 px-1.5 py-0.5 rounded text-[8px] font-black bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/20 uppercase tracking-widest">PRO</span>
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
      <div className="p-6 border-t border-slate-200/50 dark:border-slate-800/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-500 to-indigo-650 text-white flex items-center justify-center font-black text-xs border border-white/20">
            {(username?.[0] || 'U').toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black truncate text-slate-800 dark:text-slate-200">{username}</p>
            <p className="text-[9px] font-extrabold uppercase text-slate-450">LV {userLevel}</p>
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
