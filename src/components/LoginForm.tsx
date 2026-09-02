import React from 'react';
import { Activity, User, Lock, AlertCircle, Sun, Moon } from 'lucide-react';

interface LoginFormProps {
  theme: 'light' | 'dark';
  isSessionKicked: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onToggleTheme: () => void;
  emailValue: string;
  onEmailChange: (val: string) => void;
  passwordValue: string;
  onPasswordChange: (val: string) => void;
  onGuestJoin?: (nickname: string, roomCode: string) => void;
}

export default function LoginForm({
  theme, isSessionKicked, onSubmit, onToggleTheme, emailValue, onEmailChange, passwordValue, onPasswordChange, onGuestJoin
}: LoginFormProps) {
  const [isGuestMode, setIsGuestMode] = React.useState(false);
  const [guestName, setGuestName] = React.useState('');
  const [guestRoom, setGuestRoom] = React.useState('');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative z-10 px-4">
      <div className="w-full max-w-md backdrop-blur-md bg-white/75 dark:bg-slate-900/75 border border-slate-200/50 dark:border-slate-800/60 rounded-3xl shadow-2xl p-8 transition-all duration-300">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-650 text-white flex items-center justify-center font-extrabold text-xl mx-auto shadow-lg shadow-teal-500/10 mb-4">
            <Activity className="w-6 h-6 text-white animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight font-sans">
            Masuk ke AuraMed
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-semibold">
            Platform Evaluasi Kompetensi Klinis & Sains Terintegrasi
          </p>
        </div>

        {isSessionKicked && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl flex items-start gap-3 text-xs animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Sesi Berakhir</p>
              <p className="opacity-90">Akun Anda baru saja masuk di perangkat lain. Sesi sebelumnya telah dikeluarkan demi keamanan.</p>
            </div>
          </div>
        )}

        
        {isGuestMode ? (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">Join Mabar</h3>
              <p className="text-xs text-gray-500">Bermain tanpa perlu login akun</p>
            </div>
            
            <div>
              <label className="block text-[10px] font-black text-slate-500 dark:text-slate-450 uppercase tracking-widest mb-1.5 pl-1">Nama Panggilan</label>
              <input type="text" value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="Misal: Budi" className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white font-semibold" />
            </div>
            
            <div>
              <label className="block text-[10px] font-black text-slate-500 dark:text-slate-450 uppercase tracking-widest mb-1.5 pl-1">Kode Room</label>
              <input type="text" value={guestRoom} onChange={e => setGuestRoom(e.target.value.toUpperCase())} placeholder="Misal: ABCD12" className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white font-bold tracking-widest" />
            </div>
            
            <button type="button" onClick={() => onGuestJoin && onGuestJoin(guestName, guestRoom)} className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-500/10 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer mt-4">
              Masuk Room
            </button>
            <button type="button" onClick={() => setIsGuestMode(false)} className="w-full py-2 text-gray-500 font-bold text-xs hover:underline mt-2">Batal</button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 dark:text-slate-450 uppercase tracking-widest mb-1.5 pl-1">
                Username / ID Ujian
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={emailValue}
                  onChange={(e) => onEmailChange(e.target.value)}
                  placeholder="Masukkan username"
                  className="w-full pl-9 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-white font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 dark:text-slate-450 uppercase tracking-widest mb-1.5 pl-1">
                Kata Sandi
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  value={passwordValue}
                  onChange={(e) => onPasswordChange(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-white font-semibold"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-indigo-650 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-teal-500/10 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer mt-4"
            >
              Masuk Dashboard
            </button>
            
            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-800 text-center">
              <button type="button" onClick={() => setIsGuestMode(true)} className="text-blue-500 font-bold hover:underline text-sm">
                Join Mabar (Guest)
              </button>
            </div>
          </form>
        )}

      </div>
      <button
        onClick={onToggleTheme}
        className="mt-6 p-2.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 text-xs font-semibold"
      >
        {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
        Mode {theme === 'dark' ? 'Terang' : 'Gelap'}
      </button>
    </div>
  );
}
