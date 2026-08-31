import { Search } from 'lucide-react';

interface SearchFilterHeaderProps {
  theme: 'light' | 'dark';
  searchQuery: string;
  onSearchChange: (val: string) => void;
  bankFilter: string;
  onFilterChange: (val: 'all' | 'ukmppd' | 'flashcard' | 'custom') => void;
}

const FILTERS = [
  { id: 'all', label: 'Semua' },
  { id: 'ukmppd', label: 'UKMPPD' },
  { id: 'flashcard', label: 'Flashcard' },
  { id: 'custom', label: 'Kustom' },
] as const;

export default function SearchFilterHeader({
  theme, searchQuery, onSearchChange, bankFilter, onFilterChange,
}: SearchFilterHeaderProps) {
  return (
    <div className={`p-6 rounded-3xl border transition-all duration-300 ${
      theme === 'dark'
        ? 'bg-slate-900/40 border-white/[0.08] shadow-xl'
        : 'bg-white border-slate-200 shadow-sm'
    }`}>
      <h2 className={`text-lg font-black mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
        Daftar Bank Soal
      </h2>
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450" />
          <input
            type="text"
            placeholder="Cari bank soal..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
              theme === 'dark'
                ? 'bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-500'
                : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
            }`}
          />
        </div>
        <div className="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/50 dark:border-slate-850">
          {FILTERS.map((btn) => (
            <button
              key={btn.id}
              onClick={() => onFilterChange(btn.id)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                bankFilter === btn.id
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'text-slate-450 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
