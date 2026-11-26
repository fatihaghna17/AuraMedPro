import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, ShieldCheck, Search, Clock, CheckCircle2, AlertCircle, 
  Trash2, RefreshCw, Sparkles, Sun, Moon, ArrowLeft, Database, Key, X, Check
} from 'lucide-react';
import { ScenicBackground } from './ScenicBackground';
import { BrandLogo } from './BrandLogo';

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

interface AdminToast {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function AdminScreen() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('cbt_theme') || localStorage.getItem('theme');
      return (saved === 'dark' || saved === 'light') ? saved : 'dark';
    } catch {
      return 'dark';
    }
  });

  const [activeTab, setActiveTab] = useState<'pending' | 'search'>('pending');
  
  // Toast notification state (menggantikan native window.alert yang sering diblokir browser/PWA)
  const [toast, setToast] = useState<AdminToast | null>(null);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setToast({ id, type, message });
    setTimeout(() => {
      setToast(prev => (prev?.id === id ? null : prev));
    }, 4000);
  };

  // Pending payments states
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingFilter, setPendingFilter] = useState('');
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  // Search users states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);

  // Custom Confirmation Modal (menggantikan native window.confirm yang sering gagal di WebView/Electron/Browser)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    variant: 'emerald' | 'amber' | 'rose';
    onConfirm: () => void;
  } | null>(null);

  // Reset Password states
  const [resetPasswordModal, setResetPasswordModal] = useState<{
    isOpen: boolean;
    userId: string;
    username: string;
    newPassword: string;
    loading: boolean;
  }>({
    isOpen: false,
    userId: '',
    username: '',
    newPassword: '',
    loading: false,
  });

  const isDark = theme === 'dark';

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('theme', next);
        localStorage.setItem('cbt_theme', next);
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
    fetch(`/api/admin/pending-payments?_t=${Date.now()}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Deduplikasi per user_id di sisi client juga agar 1 user hanya tampil 1 kartu
          const seenUsers = new Set<string>();
          const uniqueList: Payment[] = [];
          for (const item of data) {
            const key = item.user_id || item.id;
            if (!seenUsers.has(key)) {
              seenUsers.add(key);
              uniqueList.push(item);
            }
          }
          setPayments(uniqueList);
        } else {
          console.error('Gagal mengambil data', data);
          showToast('Gagal memuat daftar pembayaran pending', 'error');
        }
      })
      .catch(err => {
        console.error(err);
        showToast('Gagal terhubung ke server', 'error');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const handleSearchUsers = (query: string) => {
    if (searchAbortRef.current) {
      searchAbortRef.current.abort();
    }
    const controller = new AbortController();
    searchAbortRef.current = controller;

    setSearchLoading(true);
    fetch(`/api/admin/search-users?q=${encodeURIComponent(query)}&_t=${Date.now()}`, {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setSearchResults(data);
        }
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error(err);
        }
      })
      .finally(() => {
        if (searchAbortRef.current === controller) {
          setSearchLoading(false);
        }
      });
  };

  useEffect(() => {
    if (activeTab === 'search') {
      handleSearchUsers(searchQuery);
    }
  }, [activeTab]);

  const executeApprove = async (paymentId: string, userId: string, name?: string) => {
    setApprovingId(paymentId);
    try {
      const res = await fetch('/api/admin/approve-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, userId }),
      });

      const data = (await res.json().catch(() => ({}))) as any;
      if (res.ok && data.success) {
        showToast(`✅ Akun "${name || 'User'}" berhasil disetujui & diaktifkan (30 Hari)! 🎉`, 'success');
        setPayments(prev => prev.filter(p => p.id !== paymentId && p.user_id !== userId));
        // Update juga jika user ada di searchResults
        setSearchResults(prev =>
          prev.map(u =>
            u.id === userId
              ? {
                  ...u,
                  subscription_status: data.status || 'active',
                  subscription_expires_at: data.expiresAt || new Date(Date.now() + 30 * 86400000).toISOString(),
                }
              : u
          )
        );
      } else {
        showToast('❌ Gagal menyetujui: ' + (data.error || `HTTP ${res.status}`), 'error');
      }
    } catch (err: any) {
      showToast('❌ Terjadi kesalahan jaringan saat menyetujui akun.', 'error');
    } finally {
      setApprovingId(null);
    }
  };

  const executeReject = async (paymentId: string, userId: string, name?: string) => {
    setRejectingId(paymentId);
    try {
      const res = await fetch('/api/admin/reject-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, userId }),
      });

      const data = (await res.json().catch(() => ({}))) as any;
      if (res.ok && data.success) {
        showToast(`🗑️ Request pembayaran "${name || 'User'}" telah dihapus.`, 'info');
        setPayments(prev => prev.filter(p => p.id !== paymentId && p.user_id !== userId));
      } else {
        showToast('❌ Gagal menghapus: ' + (data.error || `HTTP ${res.status}`), 'error');
      }
    } catch (err) {
      showToast('❌ Terjadi kesalahan jaringan saat menghapus request.', 'error');
    } finally {
      setRejectingId(null);
    }
  };

  const executeManualActivate = async (userId: string, username: string, days: number | string = 30) => {
    const isLifetime = days === 'lifetime' || days === 99999;
    setActivatingId(userId);
    try {
      const res = await fetch('/api/admin/manual-activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, days: isLifetime ? 'lifetime' : days }),
      });

      const data = (await res.json().catch(() => ({}))) as any;
      if (res.ok && data.success) {
        showToast(
          isLifetime
            ? `👑 Akun "${username}" berhasil diaktifkan LIFETIME! 🎉`
            : `⚡ Akun "${username}" berhasil diaktifkan selama ${days} hari! 🎉`,
          'success'
        );
        // Update local search results
        setSearchResults(prev =>
          prev.map(u => {
            if (u.id === userId) {
              return {
                ...u,
                subscription_status: isLifetime ? 'lifetime' : 'active',
                subscription_expires_at: data.expiresAt,
              };
            }
            return u;
          })
        );
        // Bersihkan juga dari daftar pending jika ada
        setPayments(prev => prev.filter(p => p.user_id !== userId));
      } else {
        showToast('❌ Gagal mengaktifkan: ' + (data.error || `HTTP ${res.status}`), 'error');
      }
    } catch (err) {
      showToast('❌ Terjadi kesalahan jaringan saat mengaktifkan akun.', 'error');
    } finally {
      setActivatingId(null);
    }
  };

  const handleManualActivateClick = (userId: string, username: string, days: number | string = 30) => {
    const isLifetime = days === 'lifetime' || days === 99999;
    if (isLifetime) {
      setConfirmDialog({
        isOpen: true,
        title: 'Konfirmasi Aktivasi Lifetime',
        message: `Aktifkan akun "${username}" sebagai member LIFETIME (Permanen tanpa batas waktu)?`,
        confirmLabel: '👑 Ya, Aktifkan Lifetime',
        variant: 'amber',
        onConfirm: () => {
          setConfirmDialog(null);
          executeManualActivate(userId, username, 'lifetime');
        },
      });
    } else {
      // Langsung aktifkan 1-klik untuk 30 / 90 hari tanpa terblokir popup confirm native
      executeManualActivate(userId, username, days);
    }
  };

  const openResetPasswordModal = (userId: string, username: string) => {
    const random3Digit = Math.floor(100 + Math.random() * 900).toString();
    setResetPasswordModal({
      isOpen: true,
      userId,
      username,
      newPassword: random3Digit,
      loading: false,
    });
  };

  const handleResetPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const { userId, username, newPassword } = resetPasswordModal;
    if (!newPassword || newPassword.trim().length < 3) {
      showToast('⚠️ Password minimal 3 karakter!', 'error');
      return;
    }

    setResetPasswordModal(prev => ({ ...prev, loading: true }));
    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newPassword: newPassword.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as any;
      if (res.ok && data.success) {
        showToast(`🔑 Password akun "${username}" berhasil diubah menjadi: ${newPassword.trim()}`, 'success');
        setResetPasswordModal({
          isOpen: false,
          userId: '',
          username: '',
          newPassword: '',
          loading: false,
        });
      } else {
        showToast('❌ Gagal mengubah password: ' + (data.error || 'Unknown error'), 'error');
        setResetPasswordModal(prev => ({ ...prev, loading: false }));
      }
    } catch {
      showToast('❌ Terjadi kesalahan jaringan saat mengubah password.', 'error');
      setResetPasswordModal(prev => ({ ...prev, loading: false }));
    }
  };

  const filteredPayments = pendingFilter.trim()
    ? payments.filter(
        p =>
          (p.name || '').toLowerCase().includes(pendingFilter.trim().toLowerCase()) ||
          (p.email || '').toLowerCase().includes(pendingFilter.trim().toLowerCase())
      )
    : payments;

  return (
    <div className="min-h-screen w-full flex flex-col justify-between relative overflow-hidden select-none font-sans">
      {/* ATMOSPHERIC SCENIC BACKGROUND */}
      <ScenicBackground theme={theme} fixed={false} />

      {/* FLOATING TOAST BANNER */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] max-w-md w-[92%] animate-in fade-in slide-in-from-top-3 duration-200">
          <div
            className={`px-4 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-xl flex items-center justify-between gap-3 ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200 shadow-emerald-950/50'
                : toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/40 text-rose-200 shadow-rose-950/50'
                : 'bg-slate-900/90 border-white/20 text-slate-100'
            }`}
          >
            <span className="text-xs sm:text-sm font-bold leading-snug">{toast.message}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* TOP BAR / HEADER */}
      <header className="relative z-20 w-full px-6 sm:px-10 py-6 flex items-center justify-between">
        {/* Brand Logo & Admin Badge */}
        <div className="flex items-center gap-3">
          <BrandLogo theme={isDark ? 'dark' : 'light'} variant="auto" className="w-10 h-10 shrink-0 drop-shadow-md" />
          <div className="flex items-center gap-2">
            <span className={`text-lg sm:text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              AuraMed
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
              <span className="text-[10px] font-bold text-amber-500 uppercase">Akun Pending</span>
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
              <span className="text-[10px] font-bold text-purple-400">1-Click ACC</span>
            </div>
          </div>
        </div>

        {/* TAB CONTROLS */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <div className={`flex items-center p-1 rounded-full border backdrop-blur-xl ${
            isDark ? 'bg-white/[0.08] border-white/10' : 'bg-white/80 border-white/80 shadow-sm'
          }`}>
            <button
              type="button"
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
              type="button"
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
              type="button"
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
            {payments.length > 0 && (
              <div className={`p-3.5 sm:p-4 rounded-3xl border backdrop-blur-xl mb-5 shadow-lg ${
                isDark ? 'bg-slate-900/70 border-white/10' : 'bg-white/80 border-white/80'
              }`}>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={pendingFilter}
                    onChange={e => setPendingFilter(e.target.value)}
                    placeholder="Filter cepat nama atau email di antrean pending..."
                    className={`w-full pl-11 pr-9 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all border focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400 ${
                      isDark
                        ? 'bg-white/[0.06] border-white/15 text-white placeholder-slate-400'
                        : 'bg-white border-slate-300/80 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                  {pendingFilter && (
                    <button
                      type="button"
                      onClick={() => setPendingFilter('')}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {loading ? (
              <div className={`p-16 text-center rounded-[32px] border backdrop-blur-xl ${
                isDark ? 'bg-slate-900/60 border-white/10' : 'bg-white/80 border-white/80 shadow-sm'
              }`}>
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-teal-400" />
                <p className="text-xs font-bold text-slate-400">Memuat daftar pembayaran pending...</p>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className={`p-16 text-center rounded-[32px] border border-dashed backdrop-blur-xl ${
                isDark ? 'bg-slate-900/40 border-white/15' : 'bg-white/80 border-slate-300/80 shadow-sm'
              }`}>
                <div className="w-16 h-16 rounded-3xl bg-teal-500/15 text-teal-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-500/10">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className={`text-lg font-black mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {pendingFilter ? `Tidak ada antrean dengan nama "${pendingFilter}"` : 'Hore! Tidak Ada Pembayaran Tertunda'}
                </h3>
                <p className={`text-xs max-w-md mx-auto leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Semua transaksi QRIS telah diproses. Anda juga dapat menggunakan tab <b>"Cari & Aktivasi Akun"</b> untuk mengaktifkan user langsung tanpa order pending.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredPayments.map(p => {
                  const isApproving = approvingId === p.id;
                  const isRejecting = rejectingId === p.id;

                  return (
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
                            Rp {(p.amount || 10000).toLocaleString('id-ID')}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            Waktu Order: {new Date(p.created_at).toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-3 border-t border-slate-200/50 dark:border-white/10">
                        <button 
                          type="button"
                          disabled={isApproving || isRejecting}
                          onClick={() => executeApprove(p.id, p.user_id, p.name)}
                          className="flex-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-600 text-white font-black py-3 rounded-full shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] cursor-pointer text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          {isApproving ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                          <span>{isApproving ? 'Mengaktifkan...' : 'Setujui & Aktifkan'}</span>
                        </button>
                        <button 
                          type="button"
                          disabled={isApproving || isRejecting}
                          onClick={() => executeReject(p.id, p.user_id, p.name)}
                          className="bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 font-bold py-3 px-4 rounded-full transition-all cursor-pointer text-xs disabled:opacity-50"
                          title="Tolak / Hapus Request"
                        >
                          {isRejecting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
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
                    placeholder="Ketik username (contoh: ar&, dapa, nadine, fatih)..."
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
                  const isLifetime = user.subscription_status === 'lifetime';
                  const isActive = user.subscription_status === 'active' || isLifetime;
                  const expiresDate = user.subscription_expires_at ? new Date(user.subscription_expires_at) : null;
                  const isExpired = isLifetime ? false : (expiresDate ? expiresDate.getTime() < Date.now() : true);
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
                            isLifetime
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 font-black'
                              : isActive && !isExpired
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : user.angkatan === '26'
                              ? 'bg-teal-500/20 text-teal-400 border-teal-500/30'
                              : user.subscription_status === 'trial'
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                          }`}>
                            {isLifetime
                              ? '👑 Lifetime'
                              : isActive && !isExpired
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
                              {isLifetime
                                ? '👑 Lifetime (Permanen)'
                                : expiresDate
                                ? expiresDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                                : (user.angkatan === '26' ? 'Trial Aktif' : 'Belum aktif')}
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
                          onClick={() => handleManualActivateClick(user.id, user.username, 30)}
                          className="w-full py-3 rounded-full bg-gradient-to-r from-teal-500 to-indigo-650 hover:from-teal-600 hover:to-indigo-700 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-teal-500/20 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          {isActivating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                          <span>{isActivating ? 'Mengaktifkan...' : '⚡ Aktifkan 30 Hari'}</span>
                        </button>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            disabled={isActivating}
                            onClick={() => handleManualActivateClick(user.id, user.username, 90)}
                            className={`py-2 rounded-full text-[10px] font-bold border transition-all cursor-pointer text-center disabled:opacity-50 ${
                              isDark 
                                ? 'bg-white/[0.05] hover:bg-white/10 border-white/10 text-slate-300' 
                                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                            }`}
                          >
                            +90 Hari
                          </button>
                          <button
                            type="button"
                            disabled={isActivating}
                            onClick={() => handleManualActivateClick(user.id, user.username, 'lifetime')}
                            className="py-2 rounded-full text-[10px] font-extrabold border transition-all cursor-pointer text-center bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/30 text-amber-500 disabled:opacity-50"
                          >
                            👑 Lifetime
                          </button>
                        </div>

                        {/* Ganti Password Button */}
                        <button
                          type="button"
                          onClick={() => openResetPasswordModal(user.id, user.username)}
                          className={`w-full py-2.5 rounded-full text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            isDark 
                              ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20 text-amber-300' 
                              : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-800'
                          }`}
                        >
                          <Key className="w-3.5 h-3.5 text-amber-400" />
                          <span>Ganti Password</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Custom Confirmation Modal */}
      {confirmDialog?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className={`w-full max-w-md rounded-2xl p-6 shadow-2xl border ${
              isDark ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <h3 className="text-base font-bold mb-2">{confirmDialog.title}</h3>
            <p className={`text-xs leading-relaxed mb-5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {confirmDialog.message}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                  isDark ? 'border-white/10 hover:bg-white/5 text-slate-400' : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className={`flex-1 py-2.5 rounded-xl text-white text-xs font-bold shadow-lg cursor-pointer ${
                  confirmDialog.variant === 'amber'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-amber-500/20'
                    : confirmDialog.variant === 'rose'
                    ? 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 shadow-rose-500/20'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/20'
                }`}
              >
                {confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reset Password */}
      {resetPasswordModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className={`w-full max-w-md rounded-2xl p-6 shadow-2xl border ${
              isDark 
                ? 'bg-slate-900 border-white/10 text-white' 
                : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Ganti Password Akun</h3>
                  <p className="text-xs text-slate-400">User: <span className="font-semibold text-teal-400">{resetPasswordModal.username}</span></p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResetPasswordModal(prev => ({ ...prev, isOpen: false }))}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-300">
                  Password Baru (misal: 3 digit angka / teks):
                </label>
                <input
                  type="text"
                  value={resetPasswordModal.newPassword}
                  onChange={(e) => setResetPasswordModal(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Masukkan password baru..."
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-mono tracking-wider border outline-none transition-all ${
                    isDark 
                      ? 'bg-black/30 border-white/10 focus:border-amber-400 text-white' 
                      : 'bg-slate-50 border-slate-200 focus:border-amber-500 text-slate-900'
                  }`}
                  autoFocus
                />
              </div>

              {/* Preset buttons */}
              <div>
                <p className="text-[11px] text-slate-400 mb-2">Preset Cepat:</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const rand = Math.floor(100 + Math.random() * 900).toString();
                      setResetPasswordModal(prev => ({ ...prev, newPassword: rand }));
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer ${
                      isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    🎲 Acak 3 Digit
                  </button>
                  <button
                    type="button"
                    onClick={() => setResetPasswordModal(prev => ({ ...prev, newPassword: '177' }))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer ${
                      isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 text-amber-300' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-amber-700'
                    }`}
                  >
                    177
                  </button>
                  <button
                    type="button"
                    onClick={() => setResetPasswordModal(prev => ({ ...prev, newPassword: '123' }))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer ${
                      isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    123
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetPasswordModal(prev => ({ ...prev, isOpen: false }))}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                    isDark ? 'border-white/10 hover:bg-white/5 text-slate-400' : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={resetPasswordModal.loading || !resetPasswordModal.newPassword}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {resetPasswordModal.loading ? 'Menyimpan...' : 'Simpan Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="relative z-20 w-full px-6 sm:px-10 py-6 text-center">
        <p className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          © 2026 AuraMed CBT. Panel Pengelolaan Akun & Konfirmasi Pembayaran Admin.
        </p>
      </footer>
    </div>
  );
}
