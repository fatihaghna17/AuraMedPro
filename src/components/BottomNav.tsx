import { Home, BookOpen, PlusCircle, Brain, StickyNote, BarChart2, User, AlertCircle , Gamepad2 } from 'lucide-react';
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
  const items: NavItem[] = [
    { id: 'mabar', label: 'Mabar', icon: Gamepad2 },
    { id: 'home', label: 'Beranda', icon: Home },
    { id: 'banks', label: 'Bank Soal', icon: BookOpen },
    { id: 'new', label: 'Baru', icon: PlusCircle },
    { id: 'srs', label: 'SRS', icon: Brain },
    { id: 'notes', label: 'Notes', icon: StickyNote },
    { id: 'analysis', label: 'Analisis', icon: BarChart2 },
    { id: 'profile', label: 'Profil', icon: User },
    ...(isAdmin ? [{ id: 'reports', label: 'Laporan', icon: AlertCircle }] : []),
  ];

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-40 lg:hidden flex justify-around items-center h-16 border-t transition-colors ${
      theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-655'
    }`}>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`relative flex flex-col items-center justify-center w-14 h-full gap-1 transition-all ${
              isActive
                ? 'text-indigo-500 dark:text-indigo-400 scale-105'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[9px] font-bold">{item.label}</span>
            {item.id === 'srs' && srsDueCount > 0 && (
              <span className="absolute top-1 right-2 bg-rose-500 text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {srsDueCount > 9 ? '9+' : srsDueCount}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
