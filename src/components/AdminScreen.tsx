import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Search, Clock, CheckCircle2, AlertCircle, 
  Trash2, User, RefreshCw, Sparkles, ExternalLink, Calendar
} from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'pending' | 'search'>('pending');
  
  // Pending payments states
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // Search users states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activatingId, setActivatingId] = useState<string | null>(null);

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
    <div className="p-4 sm:p-8 bg-slate-900 min-h-screen text-slate-100 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔒</span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Admin Panel AuraMedPro
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Kelola konfirmasi pembayaran QRIS dan aktivasi akun pengguna secara instan.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center p-1.5 rounded-2xl bg-slate-800/80 border border-slate-700">
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'pending'
                  ? 'bg-teal-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pending</span>
              {payments.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white text-teal-700 font-black">
                  {payments.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('search')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'search'
                  ? 'bg-teal-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Cari & Aktivasi Akun</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: PENDING PAYMENTS */}
        {/* ========================================================================= */}
        {activeTab === 'pending' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Daftar Permintaan Pembayaran ({payments.length})
              </span>
              <button
                onClick={fetchPendingPayments}
                disabled={loading}
                className="flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 font-bold transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Segarkan</span>
              </button>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-400" />
                <p className="text-xs font-semibold">Memuat data pembayaran...</p>
              </div>
            ) : payments.length === 0 ? (
              <div className="p-12 text-center text-slate-400 bg-slate-800/40 rounded-2xl border border-dashed border-slate-700">
                <CheckCircle2 className="w-10 h-10 text-teal-400 mx-auto mb-3 opacity-80" />
                <h3 className="text-base font-bold text-white mb-1">Tidak ada pembayaran tertunda!</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Semua transaksi QRIS telah diproses. Anda juga dapat menggunakan tab <b>"Cari & Aktivasi Akun"</b> untuk mengaktifkan user langsung tanpa order pending.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {payments.map(p => (
                  <div key={p.id} className="bg-slate-800/90 p-5 rounded-2xl border border-slate-700 shadow-xl flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="font-black text-lg text-white truncate">{p.name || 'User Tanpa Nama'}</h2>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          Pending
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 capitalize">
                          {p.prodi || 'Kedokteran'}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Angkatan 20{p.angkatan || '?'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 mb-3 truncate">{p.email}</p>
                      
                      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/60 mb-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                          Nominal Transfer
                        </span>
                        <p className="text-teal-400 font-black text-2xl">
                          Rp {p.amount.toLocaleString('id-ID')}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Waktu: {new Date(p.created_at).toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-slate-700/60">
                      <button 
                        onClick={() => handleApprove(p.id, p.user_id)}
                        className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black py-2.5 rounded-xl shadow-lg transition-all active:scale-[0.98] cursor-pointer text-xs flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Setujui & Aktifkan</span>
                      </button>
                      <button 
                        onClick={() => handleReject(p.id)}
                        className="bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-400 hover:text-rose-300 font-bold py-2.5 px-3 rounded-xl transition-all cursor-pointer text-xs"
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
            <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 mb-6 shadow-lg">
              <label className="block text-xs font-bold text-slate-300 mb-2">
                🔍 Cari Akun Berdasarkan Username atau Email:
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
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
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm font-semibold focus:outline-none focus:border-teal-400 transition-colors"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleSearchUsers(searchQuery)}
                  className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Cari
                </button>
              </div>
            </div>

            {/* Results List */}
            {searchLoading ? (
              <div className="p-12 text-center text-slate-400 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-400" />
                <p className="text-xs font-semibold">Mencari akun...</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="p-12 text-center text-slate-400 bg-slate-800/40 rounded-2xl border border-dashed border-slate-700">
                <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2 opacity-80" />
                <p className="text-sm font-bold text-white">Tidak ditemukan akun dengan kata kunci "{searchQuery}"</p>
                <p className="text-xs text-slate-400 mt-1">Pastikan ejaan username atau email sudah sesuai.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {searchResults.map(user => {
                  const isActive = user.subscription_status === 'active';
                  const expiresDate = user.subscription_expires_at ? new Date(user.subscription_expires_at) : null;
                  const isExpired = expiresDate ? expiresDate.getTime() < Date.now() : true;
                  const isActivating = activatingId === user.id;

                  return (
                    <div key={user.id} className="bg-slate-800/90 p-5 rounded-2xl border border-slate-700 shadow-xl flex flex-col justify-between">
                      <div>
                        {/* Username & Status Badge */}
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-black text-lg text-white truncate">{user.username}</h3>
                          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border ${
                            isActive && !isExpired
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                          }`}>
                            {isActive && !isExpired ? 'Active' : user.subscription_status === 'trial' ? 'Trial' : 'Expired'}
                          </span>
                        </div>

                        {/* Prodi & Angkatan */}
                        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 capitalize">
                            {user.prodi || 'Kedokteran'}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Angkatan 20{user.angkatan || '?'}
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 mb-3 truncate">{user.email}</p>

                        {/* Subscription Detail Box */}
                        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/60 mb-4 space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-400">Masa Aktif:</span>
                            <span className="font-bold text-white">
                              {expiresDate ? expiresDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Belum aktif'}
                            </span>
                          </div>
                          {user.trial_ends_at && (
                            <div className="flex justify-between text-[10px] text-slate-400">
                              <span>Trial berakhir:</span>
                              <span>{new Date(user.trial_ends_at).toLocaleDateString('id-ID')}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2 pt-2 border-t border-slate-700/60">
                        <button
                          type="button"
                          disabled={isActivating}
                          onClick={() => handleManualActivate(user.id, user.username, 30)}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-600 hover:to-indigo-700 text-white text-xs font-black uppercase tracking-wider shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{isActivating ? 'Mengaktifkan...' : '⚡ Aktifkan 30 Hari'}</span>
                        </button>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            disabled={isActivating}
                            onClick={() => handleManualActivate(user.id, user.username, 60)}
                            className="py-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 text-[10px] font-bold transition-all cursor-pointer text-center"
                          >
                            +60 Hari
                          </button>
                          <button
                            type="button"
                            disabled={isActivating}
                            onClick={() => handleManualActivate(user.id, user.username, 90)}
                            className="py-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 text-[10px] font-bold transition-all cursor-pointer text-center"
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
      </div>
    </div>
  );
}

