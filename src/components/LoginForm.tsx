import React, { useState, useEffect } from 'react';
import { 
  Activity, User, Lock, AlertCircle, Sun, Moon, GraduationCap, 
  Copy, Check, Sparkles, ArrowRight, Eye, EyeOff, BookOpen, 
  Users, ShieldCheck, HelpCircle, X, CheckCircle2 
} from 'lucide-react';
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
  theme, isSessionKicked, onSubmit, onToggleTheme, 
  emailValue, onEmailChange, passwordValue, onPasswordChange, onGuestJoin
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

  // Guest Mode Modal
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [guestNickname, setGuestNickname] = useState('');
  const [guestRoomCode, setGuestRoomCode] = useState('');
  
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
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Sky Base Gradient */}
        <div 
          className={`absolute inset-0 transition-colors duration-700 ${
            isDark 
              ? 'bg-gradient-to-b from-[#070b14] via-[#10172a] to-[#1e1b4b]' 
              : 'bg-gradient-to-b from-[#e0f2fe] via-[#f1f5f9] to-[#fed7aa]'
          }`} 
        />

        {/* Cinematic Sunset/Twilight Horizon Glow */}
        <div 
          className={`absolute bottom-0 left-0 right-0 h-[65vh] transition-opacity duration-700 ${
            isDark 
              ? 'bg-gradient-to-t from-amber-600/20 via-rose-500/15 via-teal-500/10 to-transparent' 
              : 'bg-gradient-to-t from-orange-400/30 via-amber-300/20 to-transparent'
          }`} 
        />

        {/* Subtle Ambient Radial Light Orb (Behind center form) */}
        <div 
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full blur-[140px] pointer-events-none ${
            isDark ? 'bg-gradient-to-tr from-teal-500/15 via-indigo-500/20 to-amber-500/10' : 'bg-gradient-to-tr from-teal-300/30 via-amber-200/30 to-rose-200/20'
          }`}
        />

        {/* Mountain Layer 1: Far Distant Peaks */}
        <svg
          className="absolute bottom-0 left-0 right-0 w-full h-[36vh] min-h-[220px] max-h-[420px] object-cover preserve-3d"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,192L60,181.3C120,171,240,149,360,165.3C480,181,600,235,720,229.3C840,224,960,160,1080,149.3C1200,139,1320,181,1380,202.7L1440,224L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
            className={isDark ? 'fill-[#131c31]/60' : 'fill-[#cbd5e1]/70'}
          />
        </svg>

        {/* Mountain Layer 2: Midground Sharp Ridges */}
        <svg
          className="absolute bottom-0 left-0 right-0 w-full h-[30vh] min-h-[190px] max-h-[360px] object-cover"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,224L48,208C96,192,192,160,288,165.3C384,171,480,213,576,218.7C672,224,768,192,864,170.7C960,149,1056,139,1152,154.7C1248,171,1344,213,1392,234.7L1440,256L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            className={isDark ? 'fill-[#0d1527]/85' : 'fill-[#94a3b8]/80'}
          />
        </svg>

        {/* Mountain Layer 3: Foreground Majestic Silhouettes */}
        <svg
          className="absolute bottom-0 left-0 right-0 w-full h-[22vh] min-h-[140px] max-h-[260px] object-cover"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,256L40,245.3C80,235,160,213,240,218.7C320,224,400,256,480,250.7C560,245,640,203,720,192C800,181,880,203,960,218.7C1040,235,1120,245,1200,240C1280,235,1360,213,1400,202.7L1440,192L1440,320L1400,320C1360,320,1280,320,1200,320C1120,320,1040,320,960,320C880,320,800,320,720,320C640,320,560,320,480,320C400,320,320,320,240,320C160,320,80,320,40,320L0,320Z"
            className={isDark ? 'fill-[#070b14]' : 'fill-[#64748b]/90'}
          />
        </svg>
      </div>

      {/* ========================================================================= */}
      {/* TOP BAR / HEADER (Inspired by reference LOGO . | Nav | Sign In / Sign Up) */}
      {/* ========================================================================= */}
      <header className="relative z-20 w-full px-6 sm:px-10 py-6 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-650 text-white flex items-center justify-center font-black shadow-lg shadow-teal-500/20">
            <Activity className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`text-lg sm:text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              AURAMED<span className="text-teal-400 font-extrabold">PRO</span>
            </span>
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping inline-block" />
          </div>
        </div>

        {/* Center Nav Links (Informational / Feature Showcase) */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-2 px-3 py-1.5 rounded-full bg-white/10 dark:bg-white/[0.05] backdrop-blur-md border border-white/20 dark:border-white/10 shadow-sm">
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
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                isDark 
                  ? 'text-slate-200 hover:text-white hover:bg-white/10' 
                  : 'text-slate-700 hover:text-slate-950 hover:bg-white/60'
              }`}
            >
              {item.name}
            </button>
          ))}
        </nav>

        {/* Right Actions: Tab Switchers & Theme Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center p-1 rounded-full bg-white/15 dark:bg-white/[0.08] backdrop-blur-md border border-white/20 dark:border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('login')}
              className={`px-4 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                activeTab === 'login'
                  ? isDark 
                    ? 'bg-white text-slate-900 shadow-md scale-[1.02]' 
                    : 'bg-slate-900 text-white shadow-md scale-[1.02]'
                  : isDark 
                    ? 'text-slate-300 hover:text-white' 
                    : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('register')}
              className={`px-4 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                activeTab === 'register'
                  ? isDark 
                    ? 'bg-white text-slate-900 shadow-md scale-[1.02]' 
                    : 'bg-slate-900 text-white shadow-md scale-[1.02]'
                  : isDark 
                    ? 'text-slate-300 hover:text-white' 
                    : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              Daftar
            </button>
          </div>

          <button
            type="button"
            onClick={onToggleTheme}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer border ${
              isDark 
                ? 'bg-white/10 hover:bg-white/20 border-white/15 text-amber-300' 
                : 'bg-white/60 hover:bg-white border-white/40 text-indigo-600 shadow-sm'
            }`}
            title={`Ganti ke Mode ${isDark ? 'Terang' : 'Gelap'}`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* CENTER HERO & AUTH FORM (Pill Inputs & Glassmorphism Model) */}
      {/* ========================================================================= */}
      <main className="relative z-10 w-full flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Registration Success Modal */}
        {newAccountData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl px-4 animate-fade-in">
            <div className={`w-full max-w-md rounded-[32px] shadow-2xl p-8 border ${
              isDark ? 'bg-slate-900/95 border-white/15 text-white' : 'bg-white/95 border-slate-200 text-slate-900'
            }`}>
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/25 mb-4 animate-bounce">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black tracking-tight">
                  Pendaftaran Berhasil!
                </h3>
                <p className={`text-xs mt-1.5 font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Simpan informasi akun Anda di bawah ini dengan aman.
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
                      className="p-1 text-slate-400 hover:text-teal-400 transition-colors cursor-pointer"
                      title="Salin Username"
                    >
                      {copiedUsername ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {newAccountData.username.includes('(') && (
                  <div className="text-[10px] text-amber-500 bg-amber-500/10 p-2.5 rounded-xl leading-relaxed">
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
                  <div className={`flex items-center justify-between p-3.5 rounded-2xl font-mono text-lg font-black tracking-widest ${
                    isDark ? 'bg-slate-950 text-emerald-400 border border-emerald-500/30' : 'bg-white text-emerald-600 border border-emerald-300 shadow-inner'
                  }`}>
                    <span>{newAccountData.password}</span>
                    <button
                      type="button"
                      onClick={handleCopyPassword}
                      className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Salin Kata Sandi"
                    >
                      {copiedPassword ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5 opacity-60" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className={`p-3.5 rounded-2xl mb-6 text-[11px] font-semibold flex items-start gap-2.5 ${
                isDark ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' : 'bg-amber-50 text-amber-900 border border-amber-200'
              }`}>
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                <span>
                  Kata sandi ini hanya ditampilkan sekali. Harap catat atau salin sebelum melanjutkan ke dashboard!
                </span>
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={handleCopyAll}
                  className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-full font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedAll ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
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
                  className="w-full py-4 bg-gradient-to-r from-teal-400 via-emerald-400 to-indigo-500 text-slate-950 rounded-full font-black text-xs uppercase tracking-wider shadow-xl shadow-teal-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4 animate-fade-in">
            <div className={`w-full max-w-sm rounded-[28px] p-6 border shadow-2xl relative ${
              isDark ? 'bg-slate-900/90 border-white/15 text-white' : 'bg-white/90 border-slate-200 text-slate-900'
            }`}>
              <button
                type="button"
                onClick={() => setInfoModal(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center mb-4">
                <infoModal.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black tracking-tight mb-2">{infoModal.title}</h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{infoModal.desc}</p>
              <button
                type="button"
                onClick={() => setInfoModal(null)}
                className="mt-6 w-full py-2.5 rounded-full bg-teal-500 text-white text-xs font-bold hover:bg-teal-600 transition-colors"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}

        {/* Guest Mode Modal */}
        {showGuestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md px-4 animate-fade-in">
            <div className={`w-full max-w-sm rounded-[28px] p-6 border shadow-2xl relative ${
              isDark ? 'bg-slate-900/90 border-white/15 text-white' : 'bg-white/90 border-slate-200 text-slate-900'
            }`}>
              <button
                type="button"
                onClick={() => setShowGuestModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black tracking-tight mb-1">Masuk sebagai Tamu</h3>
              <p className={`text-xs mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Bergabung ke ruang belajar bersama (Study Room) tanpa perlu mendaftar akun.
              </p>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Nama Panggilan Anda"
                  value={guestNickname}
                  onChange={(e) => setGuestNickname(e.target.value)}
                  className={`w-full px-4 py-3 rounded-full text-xs font-semibold border ${
                    isDark ? 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
                <input
                  type="text"
                  placeholder="Kode Room (Opsional)"
                  value={guestRoomCode}
                  onChange={(e) => setGuestRoomCode(e.target.value)}
                  className={`w-full px-4 py-3 rounded-full text-xs font-semibold border uppercase tracking-wider ${
                    isDark ? 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (guestNickname.trim() && onGuestJoin) {
                      onGuestJoin(guestNickname.trim(), guestRoomCode.trim());
                      setShowGuestModal(false);
                    }
                  }}
                  disabled={!guestNickname.trim()}
                  className="w-full py-3 rounded-full bg-gradient-to-r from-teal-400 to-indigo-500 text-slate-950 font-black text-xs uppercase tracking-wider disabled:opacity-50 transition-all cursor-pointer mt-2"
                >
                  Mulai Sesi Tamu
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Central Auth Container */}
        <div className="w-full max-w-md mx-auto animate-fade-in flex flex-col items-center">
          {/* Subtitle / Mode Switcher Link (Matching reference 'Have an account? Login') */}
          <div className="text-center mb-3">
            {activeTab === 'login' ? (
              <p className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Belum punya akun?{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className="font-bold underline text-teal-400 hover:text-teal-300 transition-colors cursor-pointer"
                >
                  Daftar di sini
                </button>
              </p>
            ) : (
              <p className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Sudah punya akun?{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="font-bold underline text-teal-400 hover:text-teal-300 transition-colors cursor-pointer"
                >
                  Masuk di sini
                </button>
              </p>
            )}

            {/* Main Form Title */}
            <h1 className={`text-3xl sm:text-4xl font-black tracking-tight mt-2 ${
              isDark ? 'text-white drop-shadow-md' : 'text-slate-900'
            }`}>
              {activeTab === 'login' ? 'Masuk Akun' : 'Daftar Akun'}
            </h1>
          </div>

          {/* Session Kicked Alert */}
          {isSessionKicked && activeTab === 'login' && (
            <div className="w-full mb-4 p-4 bg-amber-500/15 backdrop-blur-md border border-amber-500/30 text-amber-300 rounded-2xl flex items-start gap-3 text-xs animate-shake shadow-lg">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <div>
                <p className="font-bold">Sesi Berakhir</p>
                <p className="opacity-90">Akun Anda baru saja masuk di perangkat lain. Sesi sebelumnya telah dikeluarkan demi keamanan.</p>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* FORM: MASUK (LOGIN) */}
          {/* ========================================================================= */}
          {activeTab === 'login' && (
            <form onSubmit={handleFormSubmit} className="w-full space-y-4 mt-3">
              {/* Username Pill Input */}
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-400 transition-colors">
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
                  className={`w-full pl-12 pr-6 py-4 rounded-full text-sm font-semibold transition-all backdrop-blur-xl border shadow-lg focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400 ${
                    isDark 
                      ? 'bg-white/[0.08] hover:bg-white/[0.12] border-white/15 text-white placeholder-slate-400 shadow-black/20' 
                      : 'bg-white/80 hover:bg-white/95 border-slate-300/80 text-slate-900 placeholder-slate-400 shadow-slate-200/50'
                  }`}
                />
              </div>

              {/* Password Pill Input */}
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-400 transition-colors">
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
                  className={`w-full pl-12 pr-12 py-4 rounded-full text-sm font-semibold transition-all backdrop-blur-xl border shadow-lg focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400 ${
                    isDark 
                      ? 'bg-white/[0.08] hover:bg-white/[0.12] border-white/15 text-white placeholder-slate-400 shadow-black/20' 
                      : 'bg-white/80 hover:bg-white/95 border-slate-300/80 text-slate-900 placeholder-slate-400 shadow-slate-200/50'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  title={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Submit Pill Button (Wide rounded-full like reference 'Register' button) */}
              <button
                type="submit"
                className="w-full py-4 rounded-full font-black text-xs uppercase tracking-widest text-slate-950 bg-gradient-to-r from-teal-400 via-emerald-400 to-indigo-400 hover:from-teal-300 hover:via-emerald-300 hover:to-indigo-300 shadow-xl shadow-teal-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer mt-2"
              >
                Masuk Dashboard
              </button>

              {/* Bottom Controls (Remember me & Links) */}
              <div className="flex items-center justify-between pt-2 px-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-500 bg-white/20 border-white/30 focus:ring-teal-400 focus:ring-offset-0 transition-colors cursor-pointer"
                  />
                  <span className={isDark ? 'text-slate-300 font-medium' : 'text-slate-600 font-medium'}>
                    Ingat Saya
                  </span>
                </label>

                {onGuestJoin && (
                  <button
                    type="button"
                    onClick={() => setShowGuestModal(true)}
                    className={`font-semibold underline transition-colors cursor-pointer ${
                      isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Masuk Tamu
                  </button>
                )}
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* FORM: DAFTAR (REGISTER) */}
          {/* ========================================================================= */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="w-full space-y-3.5 mt-3">
              {regError && (
                <div className="p-3.5 bg-red-500/15 backdrop-blur-md border border-red-500/30 text-red-300 rounded-2xl flex items-center gap-2.5 text-xs shadow-lg">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{regError}</span>
                </div>
              )}

              {/* Nama Panggilan Pill Input */}
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-400 transition-colors">
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
                  className={`w-full pl-12 pr-6 py-4 rounded-full text-sm font-semibold transition-all backdrop-blur-xl border shadow-lg focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400 ${
                    isDark 
                      ? 'bg-white/[0.08] hover:bg-white/[0.12] border-white/15 text-white placeholder-slate-400 shadow-black/20' 
                      : 'bg-white/80 hover:bg-white/95 border-slate-300/80 text-slate-900 placeholder-slate-400 shadow-slate-200/50'
                  }`}
                />
              </div>

              {/* 2-Column Pill Selectors: Program Studi & Angkatan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Prodi Selector */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <GraduationCap className="w-4 h-4" />
                  </span>
                  <select
                    value={regProdi}
                    onChange={(e) => handleProdiChange(e.target.value as any)}
                    className={`w-full pl-10 pr-6 py-3.5 rounded-full text-xs font-bold transition-all backdrop-blur-xl border shadow-md focus:outline-none focus:ring-2 focus:ring-teal-400/40 cursor-pointer ${
                      isDark 
                        ? 'bg-slate-900/80 border-white/15 text-white' 
                        : 'bg-white/90 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="kedokteran" className="dark:bg-slate-900">🩺 Kedokteran</option>
                    <option value="farmasi" className="dark:bg-slate-900">💊 Farmasi</option>
                    <option value="kebidanan" className="dark:bg-slate-900">👶 Kebidanan</option>
                  </select>
                </div>

                {/* Angkatan Selector */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <GraduationCap className="w-4 h-4" />
                  </span>
                  <select
                    value={regAngkatan}
                    onChange={(e) => setRegAngkatan(e.target.value)}
                    className={`w-full pl-10 pr-6 py-3.5 rounded-full text-xs font-bold transition-all backdrop-blur-xl border shadow-md focus:outline-none focus:ring-2 focus:ring-teal-400/40 cursor-pointer ${
                      isDark 
                        ? 'bg-slate-900/80 border-white/15 text-white' 
                        : 'bg-white/90 border-slate-300 text-slate-900'
                    }`}
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
              <div className={`p-3.5 rounded-2xl text-[11px] font-semibold backdrop-blur-md border ${
                isDark ? 'bg-teal-500/10 text-teal-200 border-teal-500/25' : 'bg-teal-50/90 text-teal-900 border-teal-200'
              }`}>
                <p className="flex items-center gap-1.5 font-bold mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                  Sandi Otomatis & Akses Percobaan Gratis
                </p>
                <p className="opacity-90 leading-relaxed">
                  Kata sandi dibuat otomatis demi keamanan. Seluruh fitur simulasi CBT dan bank soal dapat diakses bebas!
                </p>
              </div>

              {/* Submit Pill Button */}
              <button
                type="submit"
                disabled={regLoading}
                className={`w-full py-4 rounded-full font-black text-xs uppercase tracking-widest text-slate-950 bg-gradient-to-r from-teal-400 via-emerald-400 to-indigo-400 hover:from-teal-300 hover:via-emerald-300 hover:to-indigo-300 shadow-xl shadow-teal-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer mt-2 flex items-center justify-center gap-2 ${
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
      <footer className="relative z-20 w-full px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-[11px] font-medium text-slate-400/80 dark:text-slate-500 gap-2">
        <div className="flex items-center gap-2">
          <span>&copy; {new Date().getFullYear()} AuraMedPro CBT. Platform Pembahasan Soal Kedokteran & Farmasi.</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Cloudflare D1 & R2 High Speed
          </span>
        </div>
      </footer>
    </div>
  );
}
