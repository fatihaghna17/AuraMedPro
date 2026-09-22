import React, { useState, useEffect } from 'react';
import { 
  Activity, ShieldCheck, Search, Clock, CheckCircle2, AlertCircle, 
  Trash2, User, RefreshCw, Sparkles, ExternalLink, Calendar,
  Sun, Moon, ArrowLeft, Database, Check, Users, ShieldAlert
} from 'lucide-react';
import { ScenicBackground } from './ScenicBackground';

interface Payment {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  created_at: string;
  name: string;
  email: string;
  angkatan?: string;
  prodi?: string;
}

interface UserProfile {
  id: string;
  username: string;
  email: string;
  angkatan?: string;
  prodi?: string;
  subscription_status: string;
  subscription_expires_at: string | null;
  trial_ends_at: string | null;
  created_at: string;
}

export default function AdminScreen() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('theme');
      return (saved === 'dark' || saved === 'light') ? saved : 'dark';
    } catch {
      return 'dark';
    }
  });

  const [activeTab, setActiveTab] = useState<'pending' | 'search'>('pending');
  
  // Pending payments states
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // Search users states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  const isDark = theme === 'dark';

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('theme', next);
        if (next === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch {}
      return next;
    });
  };

  const fetchPendingPayments = () => {
    setLoading(true);
    fetch('/api/admin/pending-payments')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPayments(data);
        } else {
          console.error("Gagal mengambil data", data);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const handleSearchUsers = (query: string) => {
    setSearchLoading(true);
    fetch(`/api/admin/search-users?q=${encodeURIComponent(query)}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setSearchResults(data);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setSearchLoading(false));
  };

  // Trigger search on mount for search tab or when tab changes
  useEffect(() => {
    if (activeTab === 'search') {
      handleSearchUsers(searchQuery);
    }
  }, [activeTab]);

  const handleApprove = async (paymentId: string, userId: string) => {
    if (!confirm('Yakin ingin mengaktifkan akun user ini? Pastikan struk di WA sudah sesuai.')) return;
    
    try {
      const res = await fetch('/api/admin/approve-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, userId })
      });
      
      const data = await res.json();
      if (data.success) {
        alert('User berhasil diaktifkan! 🎉');
        setPayments(payments.filter(p => p.id !== paymentId));
      } else {
        alert('Gagal menyetujui: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan.');
    }
  };

  const handleReject = async (paymentId: string) => {
    if (!confirm('Yakin ingin menghapus request ini? Tindakan ini tidak bisa dibatalkan.')) return;
    
    try {
      const res = await fetch('/api/admin/reject-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId })
      });
      
      const data = await res.json();
      if (data.success) {
        setPayments(payments.filter(p => p.id !== paymentId));
      } else {
        alert('Gagal menghapus: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan.');
    }
  };

  const handleManualActivate = async (userId: string, username: string, days = 30) => {
    if (!confirm(`Aktifkan akun "${username}" selama ${days} hari dari sekarang?`)) return;

    setActivatingId(userId);
    try {
      const res = await fetch('/api/admin/manual-activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, days })
      });

      const data = await res.json();
      if (data.success) {
        alert(`Akun "${username}" berhasil diaktifkan selama ${days} hari! 🎉`);
        // Update local search results
        setSearchResults(prev => prev.map(u => {
          if (u.id === userId) {
            return {
              ...u,
              subscription_status: 'active',
              subscription_expires_at: data.expiresAt
            };
          }
          return u;
        }));
      } else {
        alert('Gagal mengaktifkan: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan.');
    } finally {
      setActivatingId(null);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between relative overflow-hidden select-none font-sans">
      {/* ATMOSPHERIC SCENIC BACKGROUND */}
      <ScenicBackground theme={theme} fixed={false} />

      {/* TOP BAR / HEADER */}
      <header className="relative z-20 w-full px-6 sm:px-10 py-6 flex items-center justify-between">
        {/* Brand Logo & Admin Badge */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-650 text-white flex items-center justify-center font-black shadow-lg shadow-teal-500/20">
            <Activity className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-lg sm:text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              AURAMED<span className="text-teal-400 font-extrabold">PRO</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Admin
            </span>
          </div>
        </div>

        {/* Right Actions: Theme Toggle & Back to App */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer border ${
              isDark 
                ? 'bg-white/10 hover:bg-white/20 border-white/15 text-amber-300' 
                : 'bg-white/80 hover:bg-white border-white/80 text-indigo-600 shadow-sm'
            }`}
            title={`Ganti ke Mode ${isDark ? 'Terang' : 'Gelap'}`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <a
            href="/"
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
              isDark
                ? 'bg-white/10 hover:bg-white/20 border-white/15 text-slate-200 hover:text-white'
                : 'bg-white/80 hover:bg-white border-white/80 text-slate-700 hover:text-slate-900 shadow-sm'
            }`}
            title="Kembali ke Beranda Aplikasi"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ke Beranda</span>
          </a>
        </div>
      </header>

      {/* MAIN ADMIN DASHBOARD CONTENT */}
      <main className="relative z-10 w-full flex-1 max-w-6xl mx-auto px-4 sm:px-8 py-4 sm:py-6">
        {/* TOP STAT METRIC CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className={`p-4 sm:p-5 rounded-3xl border transition-all backdrop-blur-xl ${
            isDark 
              ? 'bg-slate-900/60 border-white/10 shadow-xl' 
              : 'bg-white/80 border-white/80 shadow-sm'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[11px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Menunggu Konfirmasi
              </span>
              <span className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl sm:text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {payments.length}
              </span>
              <span className="text-[10px] font-bold text-amber-500 uppercase">Order QRIS</span>
            </div>
          </div>

          <div className={`p-4 sm:p-5 rounded-3xl border transition-all backdrop-blur-xl ${
            isDark 
              ? 'bg-slate-900/60 border-white/10 shadow-xl' 
              : 'bg-white/80 border-white/80 shadow-sm'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[11px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Biaya Langganan
              </span>
              <span className="w-8 h-8 rounded-xl bg-teal-500/15 text-teal-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl sm:text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Rp 10k
              </span>
              <span className="text-[10px] font-bold text-teal-500 uppercase">/ 30 Hari</span>
            </div>
          </div>

          <div className={`p-4 sm:p-5 rounded-3xl border transition-all backdrop-blur-xl ${
            isDark 
              ? 'bg-slate-900/60 border-white/10 shadow-xl' 
              : 'bg-white/80 border-white/80 shadow-sm'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[11px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Basis Data
              </span>
              <span className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
                <Database className="w-4 h-4" />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-base sm:text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                D1 SQLite
              </span>
              <span className="text-[10px] font-bold text-emerald-500">● Cloudflare</span>
            </div>
          </div>

          <div className={`p-4 sm:p-5 rounded-3xl border transition-all backdrop-blur-xl ${
            isDark 
              ? 'bg-slate-900/60 border-white/10 shadow-xl' 
              : 'bg-white/80 border-white/80 shadow-sm'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[11px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Mode Akses
              </span>
              <span className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-base sm:text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Superadmin
              </span>
              <span className="text-[10px] font-bold text-purple-400">Full Access</span>
            </div>
          </div>
        </div>

        {/* TAB CONTROLS */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <div className={`flex items-center p-1 rounded-full border backdrop-blur-xl ${
            isDark ? 'bg-white/[0.08] border-white/10' : 'bg-white/80 border-white/80 shadow-sm'
          }`}>
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-black transition-all cursor-pointer ${
                activeTab === 'pending'
                  ? isDark 
                    ? 'bg-white text-slate-900 shadow-md scale-[1.02]' 
                    : 'bg-slate-900 text-white shadow-md scale-[1.02]'
                  : isDark 
                    ? 'text-slate-300 hover:text-white' 
                    : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Permintaan Pending</span>
              {payments.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-black">
                  {payments.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('search')}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-black transition-all cursor-pointer ${
                activeTab === 'search'
                  ? isDark 
                    ? 'bg-white text-slate-900 shadow-md scale-[1.02]' 
                    : 'bg-slate-900 text-white shadow-md scale-[1.02]'
                  : isDark 
                    ? 'text-slate-300 hover:text-white' 
                    : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Cari & Aktivasi Akun</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (activeTab === 'pending') fetchPendingPayments();
                else handleSearchUsers(searchQuery);
              }}
              disabled={loading || searchLoading}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer backdrop-blur-xl ${
                isDark 
                  ? 'bg-white/10 hover:bg-white/15 border-white/15 text-slate-200' 
                  : 'bg-white/80 hover:bg-white border-white/80 text-slate-700 shadow-sm'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${(loading || searchLoading) ? 'animate-spin text-teal-400' : ''}`} />
              <span>Segarkan Data</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: PENDING PAYMENTS */}
        {/* ========================================================================= */}
        {activeTab === 'pending' && (
          <div>
            {loading ? (
              <div className={`p-16 text-center rounded-[32px] border backdrop-blur-xl ${
                isDark ? 'bg-slate-900/60 border-white/10' : 'bg-white/80 border-white/80 shadow-sm'
              }`}>
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-teal-400" />
                <p className="text-xs font-bold text-slate-400">Memuat daftar pembayaran pending...</p>
              </div>
            ) : payments.length === 0 ? (
              <div className={`p-16 text-center rounded-[32px] border border-dashed backdrop-blur-xl ${
                isDark ? 'bg-slate-900/40 border-white/15' : 'bg-white/80 border-slate-300/80 shadow-sm'
              }`}>
                <div className="w-16 h-16 rounded-3xl bg-teal-500/15 text-teal-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-500/10">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className={`text-lg font-black mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Hore! Tidak Ada Pembayaran Tertunda
                </h3>
                <p className={`text-xs max-w-md mx-auto leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Semua transaksi QRIS telah diproses. Anda juga dapat menggunakan tab <b>"Cari & Aktivasi Akun"</b> untuk mengaktifkan user langsung tanpa order pending.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {payments.map(p => (
                  <div 
                    key={p.id} 
                    className={`p-6 rounded-[32px] border transition-all backdrop-blur-xl shadow-xl flex flex-col justify-between ${
                      isDark 
                        ? 'bg-slate-900/80 border-white/15 text-white' 
                        : 'bg-white/90 border-white/80 text-slate-900 shadow-slate-200/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-black text-lg truncate">{p.name || 'User Tanpa Nama'}</h3>
                        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase bg-amber-500/20 text-amber-500 border border-amber-500/30">
                          Pending
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 capitalize">
                          {p.prodi || 'Kedokteran'}
                        </span>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                          Angkatan 20{p.angkatan || '?'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 mb-4 truncate">{p.email}</p>

                      <div className={`p-4 rounded-2xl border mb-4 ${
                        isDark ? 'bg-white/[0.04] border-white/10' : 'bg-slate-50 border-slate-200/80'
                      }`}>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                          Nominal Transfer QRIS
                        </span>
                        <p className="text-teal-400 font-black text-2xl">
                          Rp {p.amount.toLocaleString('id-ID')}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Waktu Order: {new Date(p.created_at).toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-3 border-t border-slate-200/50 dark:border-white/10">
                      <button 
                        onClick={() => handleApprove(p.id, p.user_id)}
                        className="flex-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-600 text-white font-black py-3 rounded-full shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] cursor-pointer text-xs flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Setujui & Aktifkan</span>
                      </button>
                      <button 
                        onClick={() => handleReject(p.id)}
                        className="bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 font-bold py-3 px-4 rounded-full transition-all cursor-pointer text-xs"
                        title="Tolak / Hapus Request"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: SEARCH & DIRECT MANUAL ACTIVATION */}
        {/* ========================================================================= */}
        {activeTab === 'search' && (
          <div>
            {/* Search Box */}
            <div className={`p-4 sm:p-5 rounded-[32px] border backdrop-blur-xl mb-6 shadow-xl ${
              isDark ? 'bg-slate-900/80 border-white/15' : 'bg-white/80 border-white/80 shadow-slate-200/50'
            }`}>
              <label className={`block text-xs font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                🔍 Cari Akun Berdasarkan Username atau Email:
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      handleSearchUsers(e.target.value);
                    }}
                    placeholder="Ketik username (contoh: din, nadine, fatih)..."
                    className={`w-full pl-11 pr-4 py-3 rounded-full text-sm font-semibold transition-all border focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400 ${
                      isDark 
                        ? 'bg-white/[0.08] border-white/15 text-white placeholder-slate-400' 
                        : 'bg-white border-slate-300/80 text-slate-900 placeholder-slate-400 shadow-inner'
                    }`}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleSearchUsers(searchQuery)}
                  className="px-6 py-3 rounded-full bg-gradient-to-r from-teal-500 to-indigo-650 hover:from-teal-600 hover:to-indigo-700 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-teal-500/20"
                >
                  Cari
                </button>
              </div>
            </div>

            {/* Results Grid */}
            {searchLoading ? (
              <div className={`p-16 text-center rounded-[32px] border backdrop-blur-xl ${
                isDark ? 'bg-slate-900/60 border-white/10' : 'bg-white/80 border-white/80 shadow-sm'
              }`}>
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-teal-400" />
                <p className="text-xs font-bold text-slate-400">Mencari akun...</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className={`p-16 text-center rounded-[32px] border border-dashed backdrop-blur-xl ${
                isDark ? 'bg-slate-900/40 border-white/15' : 'bg-white/80 border-slate-300/80 shadow-sm'
              }`}>
                <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3 opacity-80" />
                <h3 className={`text-base font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Tidak ditemukan akun dengan kata kunci "{searchQuery}"
                </h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Pastikan ejaan username atau email sudah sesuai.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {searchResults.map(user => {
                  const isActive = user.subscription_status === 'active';
                  const expiresDate = user.subscription_expires_at ? new Date(user.subscription_expires_at) : null;
                  const isExpired = expiresDate ? expiresDate.getTime() < Date.now() : true;
                  const isActivating = activatingId === user.id;

                  return (
                    <div 
                      key={user.id} 
                      className={`p-6 rounded-[32px] border transition-all backdrop-blur-xl shadow-xl flex flex-col justify-between ${
                        isDark 
                          ? 'bg-slate-900/80 border-white/15 text-white' 
                          : 'bg-white/90 border-white/80 text-slate-900 shadow-slate-200/50'
                      }`}
                    >
                      <div>
                        {/* Username & Status Badge */}
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-black text-lg truncate">{user.username}</h3>
                          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border ${
                            isActive && !isExpired
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : user.angkatan === '26'
                              ? 'bg-teal-500/20 text-teal-400 border-teal-500/30'
                              : user.subscription_status === 'trial'
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                          }`}>
                            {isActive && !isExpired
                              ? 'Active'
                              : user.angkatan === '26'
                              ? 'Trial Diperpanjang'
                              : user.subscription_status === 'trial'
                              ? 'Trial'
                              : 'Expired'}
                          </span>
                        </div>

                        {/* Prodi & Angkatan */}
                        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 capitalize">
                            {user.prodi || 'Kedokteran'}
                          </span>
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                            Angkatan 20{user.angkatan || '?'}
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 mb-4 truncate">{user.email}</p>

                        {/* Subscription Detail Box */}
                        <div className={`p-4 rounded-2xl border mb-4 space-y-1.5 ${
                          isDark ? 'bg-white/[0.04] border-white/10' : 'bg-slate-50 border-slate-200/80'
                        }`}>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Masa Aktif:</span>
                            <span className="font-bold">
                              {expiresDate ? expiresDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : (user.angkatan === '26' ? 'Trial Aktif' : 'Belum aktif')}
                            </span>
                          </div>
                          {user.angkatan === '26' && !isActive ? (
                            <div className="flex justify-between text-[10px] text-teal-400 font-medium">
                              <span>Masa Trial:</span>
                              <span>Diperpanjang (Waktu belum ditentukan)</span>
                            </div>
                          ) : user.trial_ends_at ? (
                            <div className="flex justify-between text-[10px] text-slate-400">
                              <span>Trial berakhir:</span>
                              <span>{new Date(user.trial_ends_at).toLocaleDateString('id-ID')}</span>
                            </div>
                          ) : null}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2 pt-3 border-t border-slate-200/50 dark:border-white/10">
                        <button
                          type="button"
                          disabled={isActivating}
                          onClick={() => handleManualActivate(user.id, user.username, 30)}
                          className="w-full py-3 rounded-full bg-gradient-to-r from-teal-500 to-indigo-650 hover:from-teal-600 hover:to-indigo-700 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-teal-500/20 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>{isActivating ? 'Mengaktifkan...' : '⚡ Aktifkan 30 Hari'}</span>
                        </button>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            disabled={isActivating}
                            onClick={() => handleManualActivate(user.id, user.username, 60)}
                            className={`py-2 rounded-full text-[10px] font-bold border transition-all cursor-pointer text-center ${
                              isDark 
                                ? 'bg-white/[0.05] hover:bg-white/10 border-white/10 text-slate-300' 
                                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                            }`}
                          >
                            +60 Hari
                          </button>
                          <button
                            type="button"
                            disabled={isActivating}
                            onClick={() => handleManualActivate(user.id, user.username, 90)}
                            className={`py-2 rounded-full text-[10px] font-bold border transition-all cursor-pointer text-center ${
                              isDark 
                                ? 'bg-white/[0.05] hover:bg-white/10 border-white/10 text-slate-300' 
                                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                            }`}
                          >
                            +90 Hari
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="relative z-20 w-full px-6 sm:px-10 py-6 text-center">
        <p className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          © 2026 AuraMedPro CBT. Panel Pengelolaan Akun & Konfirmasi Pembayaran Admin.
        </p>
      </footer>
    </div>
  );
}


