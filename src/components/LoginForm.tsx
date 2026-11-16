import React, { useState, useEffect } from 'react';
import { 
  Activity, User, Lock, AlertCircle, Sun, Moon, GraduationCap, 
  Copy, Check, Sparkles, ArrowRight, Eye, EyeOff, BookOpen, 
  Users, ShieldCheck, HelpCircle, X, CheckCircle2 
} from 'lucide-react';
import { authClient } from '../lib/authClient';
import { ScenicBackground } from './ScenicBackground';

interface LoginFormProps {
  theme: 'light' | 'dark';
  isSessionKicked: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onToggleTheme: () => void;
  emailValue: string;
  onEmailChange: (val: string) => void;
  passwordValue: string;
  onPasswordChange: (val: string) => void;
}

export default function LoginForm({
  theme, isSessionKicked, onSubmit, onToggleTheme, 
  emailValue, onEmailChange, passwordValue, onPasswordChange
}: LoginFormProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  // Registration States
  const [regUsername, setRegUsername] = useState('');
  const [regProdi, setRegProdi] = useState<'kedokteran' | 'farmasi' | 'kebidanan'>('kedokteran');
  const [regAngkatan, setRegAngkatan] = useState<string>('24');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  // Info Modal (for top nav links)
  const [infoModal, setInfoModal] = useState<{ title: string; desc: string; icon: any } | null>(null);
  
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

  // Auto-fill remembered username if available
  useEffect(() => {
    const saved = localStorage.getItem('auramed_remembered_user');
    if (saved && !emailValue) {
      onEmailChange(saved);
    }
  }, []);

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

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rememberMe && emailValue.trim()) {
      localStorage.setItem('auramed_remembered_user', emailValue.trim());
    } else if (!rememberMe) {
      localStorage.removeItem('auramed_remembered_user');
    }
    onSubmit(e);
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
    <div className="min-h-screen w-full flex flex-col justify-between relative overflow-hidden select-none font-sans">
      {/* ========================================================================= */}
      {/* ATMOSPHERIC SCENIC BACKGROUND (Layered Mountains & Twilight Glow) */}
      {/* ========================================================================= */}
      <ScenicBackground theme={theme} fixed={false} />


      {/* ========================================================================= */}
      {/* TOP BAR / HEADER */}
      {/* ========================================================================= */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-10 py-6 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-500/25 ring-1 ring-white/25">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`text-lg sm:text-xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              AuraMed
            </span>
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-extrabold tracking-wider liquid-glass-subtle text-indigo-600 dark:text-indigo-300">
              PRO
            </span>
          </div>
        </div>

        {/* Center Nav Links (Informational / Feature Showcase) */}
        <nav className="hidden md:flex items-center gap-1 p-1 rounded-full liquid-glass-subtle">
          {[
            { 
              name: 'Simulasi CBT', 
              icon: Activity, 
              desc: 'Simulasi ujian adaptif, mode blok, dan timer ujian realistik dengan analisis performa instan.' 
            },
            { 
              name: 'Bank Soal', 
              icon: BookOpen, 
              desc: 'Ribuan bank soal kurikulum kedokteran & farmasi terverifikasi dengan pembahasan lengkap.' 
            },
            { 
              name: 'Grup Belajar', 
              icon: Users, 
              desc: 'Fitur grup belajar eksklusif untuk kolaborasi soal bersama teman sejawat satu angkatan.' 
            },
            { 
              name: 'Fitur Unggulan', 
              icon: Sparkles, 
              desc: 'SRS Spaced Repetition, Pomodoro timer, grafik analitik, dan sinkronisasi Cloudflare R2 super cepat.' 
            }
          ].map((item) => (
            <button
              key={item.name}
              type="button"
              onClick={() => setInfoModal({ title: item.name, desc: item.desc, icon: item.icon })}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10 transition-all cursor-pointer"
            >
              {item.name}
            </button>
          ))}
        </nav>

        {/* Right Actions: Tab Switchers & Theme Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center p-1 rounded-full liquid-glass-subtle">
            <button
              type="button"
              onClick={() => setActiveTab('login')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('register')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              Daftar
            </button>
          </div>

          <button
            type="button"
            onClick={onToggleTheme}
            className="w-9 h-9 rounded-full flex items-center justify-center liquid-glass-subtle-interactive text-amber-500 dark:text-indigo-300 cursor-pointer"
            title={`Ganti ke Mode ${isDark ? 'Terang' : 'Gelap'}`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* CENTER HERO & AUTH FORM (Liquid Glass Card) */}
      {/* ========================================================================= */}
      <main className="relative z-10 w-full flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Registration Success Modal */}
        {newAccountData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md px-4 animate-fade-in">
            <div className="w-full max-w-md rounded-3xl liquid-glass-card p-7 sm:p-8 text-slate-900 dark:text-white">
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  Pendaftaran Berhasil!
                </h3>
                <p className="text-xs mt-1.5 font-medium text-slate-500 dark:text-slate-400">
                  Simpan informasi kredensial akun Anda di bawah ini dengan aman.
                </p>
              </div>

              <div className="rounded-2xl p-4 space-y-3 mb-5 liquid-glass-subtle">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Username / Nama Akun</span>
                  <div className="flex items-center gap-1.5 font-bold text-sm">
                    <span>{newAccountData.username}</span>
                    <button
                      type="button"
                      onClick={handleCopyUsername}
                      className="p-1 text-slate-400 hover:text-indigo-500 transition-colors cursor-pointer"
                      title="Salin Username"
                    >
                      {copiedUsername ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {newAccountData.username.includes('(') && (
                  <div className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2.5 rounded-xl leading-relaxed">
                    💡 Karena nama ini sudah digunakan sebelumnya, angkatan otomatis ditambahkan untuk membedakan akun Anda.
                  </div>
                )}

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Program Studi</span>
                  <span className="font-bold text-sm">
                    {newAccountData.prodi === 'farmasi' ? '💊 Farmasi' : newAccountData.prodi === 'kebidanan' ? '👶 Kebidanan' : '🩺 Kedokteran'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs tabular-nums">
                  <span className="text-slate-500 dark:text-slate-400">Angkatan</span>
                  <span className="font-bold text-sm">20{newAccountData.angkatan}</span>
                </div>

                <div className="pt-2.5 border-t border-slate-200/60 dark:border-white/10">
                  <span className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-indigo-600 dark:text-indigo-400">
                    Kata Sandi Otomatis (4 Huruf + 2 Angka)
                  </span>
                  <div className="flex items-center justify-between p-3.5 rounded-xl font-mono text-lg font-extrabold tracking-widest bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                    <span>{newAccountData.password}</span>
                    <button
                      type="button"
                      onClick={handleCopyPassword}
                      className="p-2 rounded-lg hover:bg-emerald-500/15 transition-colors cursor-pointer"
                      title="Salin Kata Sandi"
                    >
                      {copiedPassword ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5 opacity-70" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl mb-5 text-[11px] font-semibold flex items-start gap-2.5 bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/25">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                <span>
                  Kata sandi ini hanya ditampilkan sekali. Harap catat atau salin sebelum melanjutkan ke dashboard!
                </span>
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={handleCopyAll}
                  className="w-full py-3 rounded-xl font-bold text-xs liquid-glass-subtle-interactive flex items-center justify-center gap-1.5 cursor-pointer"
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
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-600/25 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Lanjut Masuk ke Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Feature Preview Modal (Top Nav Link Popups) */}
        {infoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm px-4 animate-fade-in">
            <div className="w-full max-w-sm rounded-2xl p-6 liquid-glass-card relative text-slate-900 dark:text-white animate-scale-in">
              <button
                type="button"
                onClick={() => setInfoModal(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg liquid-glass-subtle-interactive text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="w-11 h-11 rounded-xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                <infoModal.icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold tracking-tight mb-1.5">{infoModal.title}</h3>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">{infoModal.desc}</p>
              <button
                type="button"
                onClick={() => setInfoModal(null)}
                className="mt-5 w-full py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}

        {/* Central Auth Card */}
        <div className="w-full max-w-md mx-auto animate-fade-in p-6 sm:p-8 rounded-3xl liquid-glass-card">
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {activeTab === 'login' ? 'Selamat Datang Kembali' : 'Buat Akun Baru'}
            </h1>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1.5">
              {activeTab === 'login' ? (
                <>
                  Belum memiliki akun?{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTab('register')}
                    className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Daftar di sini
                  </button>
                </>
              ) : (
                <>
                  Sudah memiliki akun?{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Masuk di sini
                  </button>
                </>
              )}
            </p>
          </div>

          {/* Session Kicked Alert */}
          {isSessionKicked && activeTab === 'login' && (
            <div className="w-full mb-4 p-3.5 bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 rounded-xl flex items-start gap-2.5 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
              <div>
                <p className="font-bold">Sesi Berakhir</p>
                <p className="opacity-90 mt-0.5">Akun Anda baru saja masuk di perangkat lain. Sesi sebelumnya telah dikeluarkan demi keamanan.</p>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* FORM: MASUK (LOGIN) */}
          {/* ========================================================================= */}
          {activeTab === 'login' && (
            <form onSubmit={handleFormSubmit} className="w-full space-y-4">
              {/* Username Input */}
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  name="username"
                  id="username"
                  autoComplete="username"
                  required
                  value={emailValue}
                  onChange={(e) => onEmailChange(e.target.value)}
                  placeholder="Username / ID Ujian"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm font-semibold liquid-glass-input text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                />
              </div>

              {/* Password Input */}
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="current-password"
                  id="current-password"
                  autoComplete="current-password"
                  required
                  value={passwordValue}
                  onChange={(e) => onPasswordChange(e.target.value)}
                  placeholder="Kata Sandi"
                  className="w-full pl-11 pr-11 py-3.5 rounded-xl text-sm font-semibold liquid-glass-input text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  title={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Remember me */}
              <div className="flex items-center justify-between px-1 text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 transition-colors cursor-pointer"
                  />
                  <span className="text-slate-600 dark:text-slate-300 font-medium">
                    Ingat Saya di Perangkat Ini
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/25 active:scale-98 transition-all cursor-pointer mt-1"
              >
                Masuk ke Dashboard
              </button>
            </form>
          )}

          {/* ========================================================================= */}
          {/* FORM: DAFTAR (REGISTER) */}
          {/* ========================================================================= */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="w-full space-y-3.5">
              {regError && (
                <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 rounded-xl flex items-center gap-2.5 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{regError}</span>
                </div>
              )}

              {/* Nama Panggilan Input */}
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  name="reg-username"
                  id="reg-username"
                  autoComplete="username"
                  required
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="Nama Panggilan / Alias"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm font-semibold liquid-glass-input text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                />
              </div>

              {/* 2-Column Selectors: Program Studi & Angkatan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Prodi Selector */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <GraduationCap className="w-4 h-4" />
                  </span>
                  <select
                    value={regProdi}
                    onChange={(e) => handleProdiChange(e.target.value as any)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-xs font-bold liquid-glass-input text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                  >
                    <option value="kedokteran" className="dark:bg-slate-900">🩺 Kedokteran</option>
                    <option value="farmasi" className="dark:bg-slate-900">💊 Farmasi</option>
                    <option value="kebidanan" className="dark:bg-slate-900">👶 Kebidanan</option>
                  </select>
                </div>

                {/* Angkatan Selector */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <GraduationCap className="w-4 h-4" />
                  </span>
                  <select
                    value={regAngkatan}
                    onChange={(e) => setRegAngkatan(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-xs font-bold liquid-glass-input text-slate-900 dark:text-white focus:outline-none cursor-pointer"
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
              </div>

              {/* Free Trial Info Badge */}
              <div className="p-3.5 rounded-xl text-[11px] font-medium liquid-glass-subtle text-slate-700 dark:text-slate-300">
                <p className="flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Sandi Otomatis & Akses Percobaan Gratis
                </p>
                <p className="leading-relaxed">
                  Kata sandi dibuat otomatis demi keamanan. Seluruh fitur simulasi CBT dan bank soal dapat diakses langsung!
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={regLoading}
                className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/25 active:scale-98 transition-all cursor-pointer mt-1 flex items-center justify-center gap-2 ${
                  regLoading ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              >
                {regLoading ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin" />
                    <span>Mendaftarkan...</span>
                  </>
                ) : (
                  <span>Daftar Akun Sekarang</span>
                )}
              </button>
            </form>
          )}
        </div>
      </main>

      {/* ========================================================================= */}
      {/* BOTTOM FOOTER (Subtle branding & copyright) */}
      {/* ========================================================================= */}
      <footer className="relative z-20 w-full max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400 gap-2">
        <div className="flex items-center gap-2">
          <span>&copy; {new Date().getFullYear()} AuraMedPro CBT. Platform Pembahasan Soal Kedokteran & Farmasi.</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Cloudflare D1 & R2 High Speed
          </span>
        </div>
      </footer>
    </div>
  );
}

