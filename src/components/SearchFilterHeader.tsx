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
  searchQuery, onSearchChange, bankFilter, onFilterChange,
}: SearchFilterHeaderProps) {
  return (
    <div className="p-4 sm:p-6 rounded-2xl liquid-glass-card">
      <div className="flex flex-col md:flex-row gap-3.5 sm:gap-4 items-stretch md:items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Perpustakaan Bank Soal
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pilih satu atau beberapa paket soal untuk menyusun sesi latihan CBT.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-stretch sm:items-center flex-1 max-w-xl justify-end">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama bank soal atau topik..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl liquid-glass-input text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-4 sm:flex gap-1 p-1 rounded-xl liquid-glass-subtle w-full sm:w-auto shrink-0">
            {FILTERS.map((btn) => (
              <button
                key={btn.id}
                onClick={() => onFilterChange(btn.id)}
                className={`px-2 sm:px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-center justify-center transition-all cursor-pointer ${
                  bankFilter === btn.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

