import React, { useState } from 'react';
import { Activity, User, Lock, AlertCircle, Sun, Moon, GraduationCap, Copy, Check, Sparkles, ArrowRight } from 'lucide-react';
import { authClient } from '../lib/authClient';

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
  theme, isSessionKicked, onSubmit, onToggleTheme, emailValue, onEmailChange, passwordValue, onPasswordChange
}: LoginFormProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [regUsername, setRegUsername] = useState('');
  const [regProdi, setRegProdi] = useState<'kedokteran' | 'farmasi' | 'kebidanan'>('kedokteran');
  const [regAngkatan, setRegAngkatan] = useState<string>('24');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  
  // State modal password yang di-generate setelah registrasi sukses
  const [newAccountData, setNewAccountData] = useState<{
    username: string;
    password: string;
    angkatan: string;
    prodi: string;
    session: any;
  } | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [copiedUsername, setCopiedUsername] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  const handleProdiChange = (newProdi: 'kedokteran' | 'farmasi' | 'kebidanan') => {
    setRegProdi(newProdi);
    if (newProdi === 'farmasi') {
      if (regAngkatan !== '23' && regAngkatan !== '24') {
        setRegAngkatan('24');
      }
    } else {
      if (regAngkatan === '23') {
        setRegAngkatan('24');
      }
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    if (!regUsername.trim()) {
      setRegError('Nama panggilan wajib diisi');
      return;
    }

    setRegLoading(true);
    try {
      const res = await authClient.signUp({
        username: regUsername.trim(),
        angkatan: regAngkatan,
        prodi: regProdi,
      });

      if (res.error) {
        setRegError(res.error.message);
      } else if (res.generatedPassword) {
        setNewAccountData({
          username: res.createdUsername || res.data?.user?.user_metadata?.username || regUsername.trim(),
          password: res.generatedPassword,
          angkatan: regAngkatan,
          prodi: regProdi,
          session: res.data?.session,
        });
      }
    } catch (err: any) {
      setRegError(err.message || 'Terjadi kesalahan saat pendaftaran');
    } finally {
      setRegLoading(false);
    }
  };

  const handleCopyPassword = () => {
    if (newAccountData?.password) {
      navigator.clipboard.writeText(newAccountData.password);
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    }
  };

  const handleCopyUsername = () => {
    if (newAccountData?.username) {
      navigator.clipboard.writeText(newAccountData.username);
      setCopiedUsername(true);
      setTimeout(() => setCopiedUsername(false), 2000);
    }
  };

  const handleCopyAll = () => {
    if (newAccountData) {
      const prodiLabel = newAccountData.prodi === 'farmasi' ? 'Farmasi' : newAccountData.prodi === 'kebidanan' ? 'Kebidanan' : 'Kedokteran';
      const text = `Akun AuraMedPro:\nUsername: ${newAccountData.username}\nPassword: ${newAccountData.password}\nProdi: ${prodiLabel}\nAngkatan: 20${newAccountData.angkatan}`;
      navigator.clipboard.writeText(text);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative z-10 px-4">
      {/* Modal Kata Sandi Baru */}
      {newAccountData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md px-4 animate-fade-in">
          <div className={`w-full max-w-md rounded-3xl shadow-2xl p-8 border ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 mb-4">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black tracking-tight">
                Pendaftaran Berhasil!
              </h3>
              <p className={`text-xs mt-1 font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Simpan informasi akun Anda di bawah ini dengan baik.
              </p>
            </div>

            <div className={`rounded-2xl p-4 space-y-3 mb-6 ${
              isDark ? 'bg-slate-800/80 border border-slate-700' : 'bg-slate-50 border border-slate-200'
            }`}>
              <div className="flex justify-between items-center text-xs">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Username / Nama Akun</span>
                <div className="flex items-center gap-1.5 font-bold text-sm">
                  <span>{newAccountData.username}</span>
                  <button
                    type="button"
                    onClick={handleCopyUsername}
                    className="p-1 text-slate-400 hover:text-teal-500 transition-colors cursor-pointer"
                    title="Salin Username"
                  >
                    {copiedUsername ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {newAccountData.username.includes('(') && (
                <div className="text-[10px] text-amber-500 bg-amber-500/10 p-2 rounded-lg leading-relaxed">
                  💡 Karena nama ini sudah digunakan sebelumnya, angkatan otomatis ditambahkan untuk membedakan akun Anda.
                </div>
              )}

              <div className="flex justify-between items-center text-xs">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Program Studi</span>
                <span className="font-bold text-sm">
                  {newAccountData.prodi === 'farmasi' ? '💊 Farmasi' : newAccountData.prodi === 'kebidanan' ? '👶 Kebidanan' : '🩺 Kedokteran'}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Angkatan</span>
                <span className="font-bold text-sm">20{newAccountData.angkatan}</span>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className={`block text-[10px] font-black uppercase tracking-wider mb-1 ${
                  isDark ? 'text-teal-400' : 'text-teal-600'
                }`}>
                  Kata Sandi Otomatis (4 Huruf + 2 Angka)
                </span>
                <div className={`flex items-center justify-between p-3 rounded-xl font-mono text-lg font-black tracking-widest ${
                  isDark ? 'bg-slate-950 text-emerald-400 border border-emerald-500/30' : 'bg-white text-emerald-600 border border-emerald-300'
                }`}>
                  <span>{newAccountData.password}</span>
                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Salin Kata Sandi"
                  >
                    {copiedPassword ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5 opacity-60" />}
                  </button>
                </div>
              </div>
            </div>

            <div className={`p-3 rounded-xl mb-6 text-[11px] font-semibold flex items-start gap-2 ${
              isDark ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}>
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Kata sandi ini hanya ditampilkan sekali. Pastikan Anda sudah mencatat atau menyalinnya sebelum lanjut!
              </span>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleCopyAll}
                className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiedAll ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copiedAll ? 'Username & Password Tersalin!' : 'Salin Username & Password'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (newAccountData.session) {
                    authClient.completeSignUpSession(newAccountData.session);
                  } else {
                    window.location.reload();
                  }
                }}
                className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-indigo-650 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-teal-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Lanjut Masuk ke Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-md backdrop-blur-md bg-white/75 dark:bg-slate-900/75 border border-slate-200/50 dark:border-slate-800/60 rounded-3xl shadow-2xl p-8 transition-all duration-300">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-650 text-white flex items-center justify-center font-extrabold text-xl mx-auto shadow-lg shadow-teal-500/10 mb-4">
            <Activity className="w-6 h-6 text-white animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight font-sans">
            AuraMedPro
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold tracking-wide">
            Aura-Infused Question Drilling Platform
          </p>
        </div>

        {/* Tab Switcher: Masuk vs Daftar */}
        <div className="flex p-1 mb-6 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
              activeTab === 'login'
                ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            Masuk
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
              activeTab === 'register'
                ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            Buat Akun
          </button>
        </div>

        {isSessionKicked && activeTab === 'login' && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl flex items-start gap-3 text-xs animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Sesi Berakhir</p>
              <p className="opacity-90">Akun Anda baru saja masuk di perangkat lain. Sesi sebelumnya telah dikeluarkan demi keamanan.</p>
            </div>
          </div>
        )}

        {/* FORM MASUK (LOGIN) */}
        {activeTab === 'login' && (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 pl-1">
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
              <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 pl-1">
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
          </form>
        )}

        {/* FORM DAFTAR (REGISTER) */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            {regError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-2xl flex items-center gap-2 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{regError}</span>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 pl-1">
                Nama Panggilan
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="Masukkan nama panggilan kamu"
                  className="w-full pl-9 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all dark:text-white font-semibold"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1 pl-1">
                Jika ada nama panggilan yang sama, sistem otomatis menambahkan angkatan untuk membedakannya.
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 pl-1">
                Program Studi (Prodi)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <GraduationCap className="w-4 h-4" />
                </span>
                <select
                  value={regProdi}
                  onChange={(e) => handleProdiChange(e.target.value as any)}
                  className="w-full pl-9 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all dark:text-white font-semibold cursor-pointer"
                >
                  <option value="kedokteran" className="dark:bg-slate-900">🩺 Kedokteran</option>
                  <option value="farmasi" className="dark:bg-slate-900">💊 Farmasi</option>
                  <option value="kebidanan" className="dark:bg-slate-900">👶 Kebidanan</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 pl-1">
                Angkatan
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <GraduationCap className="w-4 h-4" />
                </span>
                <select
                  value={regAngkatan}
                  onChange={(e) => setRegAngkatan(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all dark:text-white font-semibold cursor-pointer"
                >
                  {regProdi === 'farmasi' ? (
                    <>
                      <option value="23" className="dark:bg-slate-900">Angkatan 2023</option>
                      <option value="24" className="dark:bg-slate-900">Angkatan 2024</option>
                    </>
                  ) : (
                    <>
                      <option value="24" className="dark:bg-slate-900">Angkatan 2024</option>
                      <option value="25" className="dark:bg-slate-900">Angkatan 2025</option>
                      <option value="26" className="dark:bg-slate-900">Angkatan 2026</option>
                    </>
                  )}
                </select>
              </div>
              {regProdi === 'farmasi' && (
                <p className="text-[10px] text-amber-500 mt-1 pl-1 font-semibold">
                  Khusus prodi Farmasi, angkatan yang tersedia adalah 2023 dan 2024.
                </p>
              )}
            </div>

            <div className={`p-3 rounded-2xl text-[11px] font-semibold ${
              isDark ? 'bg-teal-500/10 text-teal-300 border border-teal-500/20' : 'bg-teal-50 text-teal-800 border border-teal-200'
            }`}>
              <p className="flex items-center gap-1.5 font-bold mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                Sandi Otomatis & Akses Trial
              </p>
              <p className="opacity-90">
                Kata sandi Anda akan dibuat otomatis (4 huruf + 2 angka). Selama masa trial (Angkatan 20{regAngkatan}: sampai {
                  regAngkatan === '23' || regAngkatan === '24'
                    ? '14 September 2026 jam 12.00 WIB'
                    : regAngkatan === '25'
                    ? '17 September 2026 jam 12.00 WIB'
                    : '22 September 2026 jam 12.00 WIB'
                }), seluruh fitur dapat diakses penuh secara gratis!
              </p>
            </div>

            <button
              type="submit"
              disabled={regLoading}
              className={`w-full py-3.5 bg-gradient-to-r from-teal-500 to-indigo-650 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-teal-500/10 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer mt-4 flex items-center justify-center gap-2 ${
                regLoading ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {regLoading ? 'Mendaftarkan...' : 'Daftar Akun Sekarang'}
            </button>
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
