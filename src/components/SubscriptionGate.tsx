import React, { useState } from 'react';
import { 
  Activity, Clock, CreditCard, Copy, Check, RefreshCw, 
  ExternalLink, Sun, Moon, LogOut, Sparkles, CheckCircle2, 
  ShieldCheck, MessageCircle
} from 'lucide-react';
import { authClient, PaymentInfo } from '../lib/authClient';
import { ScenicBackground } from './ScenicBackground';

interface SubscriptionGateProps {
  theme: 'light' | 'dark';
  userId: string;
  trialEndsAt: string | null;
  subscriptionStatus?: string | null;
  subscriptionExpiresAt?: string | null;
  onRefreshStatus: () => void;
  mayarPaymentUrl?: string;
  username?: string;
  angkatan?: string;
  onLogout?: () => void;
  onToggleTheme?: () => void;
}

export default function SubscriptionGate({
  theme,
  userId,
  trialEndsAt,
  subscriptionStatus,
  subscriptionExpiresAt,
  onRefreshStatus,
  mayarPaymentUrl,
  username,
  angkatan,
  onLogout,
  onToggleTheme,
}: SubscriptionGateProps) {
  const isDark = theme === 'dark';
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);

  const handleCreatePayment = async () => {
    setLoading(true);
    const info = await authClient.createPayment(userId);
    setPaymentInfo(info);
    setLoading(false);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefresh = async () => {
    setChecking(true);
    await onRefreshStatus();
    setRefreshSuccess(true);
    setTimeout(() => {
      setChecking(false);
      setRefreshSuccess(false);
    }, 2000);
  };

  const nominal = paymentInfo?.totalAmount || 10000;
  const formattedNominal = `Rp ${nominal.toLocaleString('id-ID')}`;

  const waText = `Halo Admin AuraMedPro, saya sudah melakukan pembayaran langganan.\n\n` +
    `• Username: ${username || 'Belum diset'}\n` +
    `• Angkatan: 20${angkatan || '24'}\n` +
    `• Nominal: ${formattedNominal}\n\n` +
    `Mohon bantuannya untuk aktivasi akun saya. Terima kasih!\n` +
    `*(Lampirkan bukti transfer / screenshot scan QRIS di sini)*`;

  const waUrl = `https://wa.me/628978902467?text=${encodeURIComponent(waText)}`;

  return (
    <div className="min-h-screen w-full flex flex-col justify-between relative overflow-hidden select-none font-sans">
      {/* ATMOSPHERIC SCENIC BACKGROUND */}
      <ScenicBackground theme={theme} fixed={false} />

      {/* TOP BAR / HEADER */}
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

        {/* Right Actions: Theme Toggle & Logout / Switch Account */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onToggleTheme && (
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
          )}

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                isDark
                  ? 'bg-white/10 hover:bg-white/20 border-white/15 text-slate-200 hover:text-white'
                  : 'bg-white/60 hover:bg-white border-white/40 text-slate-700 hover:text-slate-900 shadow-sm'
              }`}
              title="Keluar dari akun saat ini"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ganti Akun</span>
            </button>
          )}
        </div>
      </header>

      {/* CENTER MAIN: Glassmorphic Payment Card */}
      <main className="relative z-10 w-full flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className={`w-full max-w-lg mx-auto rounded-[32px] p-6 sm:p-8 transition-all backdrop-blur-2xl border shadow-2xl ${
          isDark
            ? 'bg-slate-900/80 border-white/15 text-white shadow-black/40'
            : 'bg-white/80 border-white/80 text-slate-900 shadow-slate-200/50'
        }`}>
          {/* Header Icon & Title */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-teal-500 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-teal-500/20 mb-4 animate-pulse">
              <Sparkles className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Masa Akses Berakhir
            </h1>
            <p className={`text-xs mt-2 font-medium leading-relaxed max-w-sm mx-auto ${
              isDark ? 'text-slate-300' : 'text-slate-600'
            }`}>
              Akses uji coba gratis Anda telah selesai. Aktifkan langganan untuk melanjutkan akses tanpa batas ke seluruh materi dan fitur AuraMedPro.
            </p>
          </div>

          {/* Pricing Banner with Features */}
          <div className={`rounded-2xl p-4 sm:p-5 mb-6 border relative overflow-hidden backdrop-blur-md ${
            isDark
              ? 'bg-white/[0.05] border-white/10 text-white'
              : 'bg-gradient-to-b from-teal-50/80 to-indigo-50/80 border-teal-100/80 text-slate-900'
          }`}>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                isDark ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'bg-teal-500/15 text-teal-700 border border-teal-500/25'
              }`}>
                <ShieldCheck className="w-3.5 h-3.5" />
                Paket Unlimited CBT
              </span>
              <span className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                1 Bulan Akses
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-3xl sm:text-4xl font-black tracking-tight">
                Rp 10.000
              </span>
              <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                / bulan
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-semibold pt-3 border-t border-slate-200/50 dark:border-white/10">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>Simulasi CBT & Mode Blok</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>Ribuan Bank Soal & Solusi</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>Spaced Repetition (SRS)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>Grup Belajar & Leaderboard</span>
              </div>
            </div>
          </div>

          {/* QRIS Display Container */}
          <div className={`rounded-2xl p-5 mb-5 border space-y-4 ${
            isDark ? 'bg-slate-800/80 border-slate-700/80' : 'bg-slate-50/90 border-slate-200/80'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-black uppercase tracking-wider ${
                isDark ? 'text-teal-400' : 'text-teal-600'
              }`}>
                📱 Pembayaran Instan via QRIS
              </span>
              <span className="text-[10px] font-semibold text-slate-400">
                Semua Bank & E-Wallet
              </span>
            </div>

            <div className="flex flex-col items-center">
              <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200/80">
                <img 
                  src="/qris.jpg" 
                  alt="QRIS AuraMedPro" 
                  className="w-48 h-48 sm:w-52 sm:h-52 rounded-xl object-cover" 
                />
              </div>
              <p className={`text-[11px] font-medium text-center mt-3 max-w-xs ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}>
                Buka aplikasi m-Banking (BCA, Mandiri, BRI, BNI) atau E-Wallet (GoPay, OVO, ShopeePay, DANA) lalu scan kode QR di atas.
              </p>
            </div>

            {/* Nominal Box with One-Click Copy */}
            <div className={`rounded-xl p-3.5 flex items-center justify-between border ${
              isDark ? 'bg-slate-900/60 border-slate-700' : 'bg-white border-slate-200'
            }`}>
              <div>
                <span className={`block text-[10px] font-black uppercase tracking-wider ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Nominal Transfer
                </span>
                <span className="text-xl font-black">
                  {formattedNominal}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(nominal.toString())}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                  copied
                    ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                    : isDark
                      ? 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-200'
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                }`}
                title="Salin nominal transfer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Tersalin!' : 'Salin'}</span>
              </button>
            </div>
          </div>

          {/* Action Buttons: WhatsApp & Refresh */}
          <div className="space-y-2.5">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 rounded-full font-black text-xs uppercase tracking-wider text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/25 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Kirim Bukti Pembayaran ke WhatsApp</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>

            {mayarPaymentUrl && (
              <a
                href={mayarPaymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full py-3.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 border ${
                  isDark
                    ? 'bg-white/10 hover:bg-white/15 border-white/15 text-white'
                    : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800 shadow-sm'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Bayar via Mayar / Kartu Kredit</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </a>
            )}

            <button
              type="button"
              onClick={handleRefresh}
              disabled={checking}
              className={`w-full py-3 rounded-full font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 border ${
                isDark
                  ? 'bg-white/[0.05] hover:bg-white/10 border-white/10 text-slate-300'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin text-teal-400' : ''}`} />
              <span>{checking ? 'Memeriksa status...' : refreshSuccess ? '✅ Status Diperbarui!' : 'Sudah Bayar? Cek Status Langganan'}</span>
            </button>
          </div>

          {/* Footer Note */}
          <p className={`text-[10px] text-center mt-4 leading-relaxed ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            Setelah mengirim bukti pembayaran ke Admin WhatsApp, akun Anda akan diaktifkan segera.
          </p>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-20 w-full px-6 sm:px-10 py-6 text-center">
        <p className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          © 2026 AuraMedPro CBT. Platform Belajar & Simulasi UKMPPD / CBT Medis Terpadu.
        </p>
      </footer>
    </div>
  );
}
