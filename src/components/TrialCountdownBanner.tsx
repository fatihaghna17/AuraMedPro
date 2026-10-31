import React, { useState, useEffect } from 'react';
import { Clock, Sparkles, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface TrialCountdownBannerProps {
  theme: string;
  trialEndsAt?: string | null; subscriptionStatus?: string | null; subscriptionExpiresAt?: string | null;
  userAngkatan?: string | null;
  isSuperAdmin?: boolean;
  isAdminAngkatan?: boolean;
  compact?: boolean;
}

const TRIAL_ENDS_MAP: Record<string, string> = {
  '24': '2026-09-14T05:00:00Z',
  '25': '2026-09-17T05:00:00Z',
};

export const TrialCountdownBanner: React.FC<TrialCountdownBannerProps> = ({
  theme,
  trialEndsAt, subscriptionStatus, subscriptionExpiresAt,
  userAngkatan,
  isSuperAdmin = false,
  isAdminAngkatan = false,
  compact = false,
}) => {
  const isDark = theme === 'dark';

  const isLifetime = subscriptionStatus === 'lifetime';
  const isActiveSubscription = (subscriptionStatus === 'active' && !!subscriptionExpiresAt) || isLifetime;
  const isAngkatan26 = userAngkatan === '26';
  const isTrialExtended = isAngkatan26 || subscriptionStatus === 'trial_extended';

  // Tentukan target batas trial
  const effectiveTrialEnd = isLifetime
    ? null
    : isActiveSubscription
    ? subscriptionExpiresAt
    : (isTrialExtended ? null : (trialEndsAt || (userAngkatan && TRIAL_ENDS_MAP[userAngkatan] ? TRIAL_ENDS_MAP[userAngkatan] : '2026-09-14T05:00:00Z')));

  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const [isExpired, setIsExpired] = useState<boolean>(false);

  useEffect(() => {
    if (!effectiveTrialEnd) return;

    const calculateTime = () => {
      const targetTime = new Date(effectiveTrialEnd).getTime();
      const now = Date.now();
      const difference = targetTime - now;

      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setIsExpired(false);
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds });
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [effectiveTrialEnd]);

  // Format tanggal berakhir ke WIB (Waktu Indonesia Barat)
  let formattedEndDate = '';
  if (effectiveTrialEnd) {
    try {
      const endDateObj = new Date(effectiveTrialEnd);
      const datePart = endDateObj.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Jakarta'
      });
      const timePart = endDateObj.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta'
      });
      formattedEndDate = `${datePart} pukul ${timePart} WIB`;
    } catch (e) {
      formattedEndDate = effectiveTrialEnd;
    }
  }

  // Jika akun adalah Super Admin atau Admin Angkatan
  if (isSuperAdmin || isAdminAngkatan) {
    return (
      <div
        className={`w-full rounded-2xl p-3.5 border transition-all backdrop-blur-xl animate-fade-in-down ${
          isDark
            ? 'bg-gradient-to-b from-white/[0.08] via-slate-900/35 to-slate-900/45 border-indigo-500/30 shadow-md'
            : 'liquid-glass-card border-indigo-200/80 shadow-[0_12px_36px_0_rgba(31,38,135,0.06)]'
        }`}
      >
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-base">👑</span>
            <div>
              <span className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isSuperAdmin ? 'Akun Super Admin' : 'Akun Admin Angkatan'}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 ml-2">
                Akses Penuh Permanen (Bebas Batas Trial)
              </span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            Akses Aktif
          </span>
        </div>
      </div>
    );
  }

  // JIKA AKUN ADALAH LIFETIME PRO MEMBER:
  if (isLifetime) {
    return (
      <div
        className={`w-full rounded-2xl p-4 border transition-all duration-300 relative overflow-hidden backdrop-blur-xl animate-fade-in-down ${
          isDark
            ? 'bg-gradient-to-r from-amber-950/40 via-yellow-950/30 to-slate-900/50 border-amber-500/40 shadow-lg shadow-amber-500/10'
            : 'liquid-glass-card border-amber-300/80 shadow-[0_12px_36px_0_rgba(245,158,11,0.12)]'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-sm">
                <span>👑</span>
                <span>Akun Lifetime Pro</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Akses Permanen Selamanya</span>
              </span>
            </div>

            <h3 className={`text-sm sm:text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Selamat! Akun Anda Telah Menjadi Lifetime 🎉
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Pencapaian luar biasa 11.000 soal pertama telah membuka akses penuh permanen tanpa batas masa berlaku.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border backdrop-blur-md shadow-xs ${
              isDark ? 'bg-white/[0.06] border-amber-500/30 text-amber-300' : 'bg-white/70 border-amber-300 text-amber-700'
            }`}>
              <Sparkles className="w-5 h-5 text-amber-400 shrink-0 animate-bounce" />
              <div>
                <div className="text-[9px] font-black uppercase tracking-wider opacity-75">Status Keanggotaan</div>
                <div className="text-xs font-black">Lifetime Member</div>
              </div>
            </div>
          </div>
        </div>

        {!compact && (
          <div className={`mt-3 pt-2.5 border-t flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 ${
            isDark ? 'border-white/10' : 'border-slate-200/60'
          }`}>
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              Nikmati seluruh bank soal, simulasi CBT, SRS kartu pintar, grup belajar, dan fitur eksklusif lainnya tanpa batas waktu.
            </span>
          </div>
        )}
      </div>
    );
  }

  // JIKA TRIAL DIPERPANJANG (KHUSUS ANGKATAN 26 / TRIAL EXTENDED):
  if (isTrialExtended && !isActiveSubscription) {
    return (
      <div
        className={`w-full rounded-2xl p-4 border transition-all duration-300 relative overflow-hidden backdrop-blur-xl animate-fade-in-down ${
          isDark
            ? 'bg-gradient-to-r from-teal-950/40 via-emerald-950/30 to-slate-900/50 border-teal-500/30 shadow-lg shadow-teal-500/10'
            : 'liquid-glass-card border-teal-300/80 shadow-[0_12px_36px_0_rgba(20,184,166,0.08)]'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/30">
                <Sparkles className="w-3 h-3 text-teal-500" />
                <span>Masa Trial Diperpanjang</span>
              </span>
              {userAngkatan && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                  Angkatan '{userAngkatan}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Free Access Aktif</span>
              </span>
            </div>

            <h3 className={`text-sm sm:text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Trial Diperpanjang Bebas Batas Waktu 🎁
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Masa percobaan gratis untuk Angkatan 2026 diperpanjang sampai batas waktu yang belum ditentukan.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <div className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border backdrop-blur-md shadow-xs ${
              isDark ? 'bg-white/[0.06] border-teal-500/30' : 'bg-white/55 border-teal-300/70'
            }`}>
              <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
              <div>
                <div className="text-[9px] font-black uppercase tracking-wider text-teal-600 dark:text-teal-400">Status Akses</div>
                <div className="text-xs font-black text-slate-800 dark:text-slate-100">Bebas Akses Fitur CBT</div>
              </div>
            </div>
          </div>
        </div>

        {!compact && (
          <div className={`mt-3 pt-2.5 border-t flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 ${
            isDark ? 'border-white/10' : 'border-slate-200/60'
          }`}>
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              Manfaatkan masa trial diperpanjang ini untuk latihan ribuan bank soal, SRS flashcard, dan simulasi ujian tanpa batas!
            </span>
          </div>
        )}
      </div>
    );
  }

  if (isExpired && !isActiveSubscription) {
    return null; // Ini tidak akan terjadi kecuali glitch (biasanya ke-block SubscriptionGate)
  }

  // JIKA MASA TRIAL ATAU SUBSCRIPTION MASIH BERJALAN (COUNTDOWN AKTIF):
  return (
    <div
      className={`w-full rounded-2xl p-4 border transition-all duration-300 relative overflow-hidden backdrop-blur-xl animate-fade-in-down ${
        isDark
          ? 'bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900/50 border-indigo-500/30 shadow-lg shadow-indigo-500/10'
          : 'liquid-glass-card border-indigo-300/80 shadow-[0_12px_36px_0_rgba(99,102,241,0.08)]'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left info */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
              <Clock className="w-3 h-3" />
              <span>{isActiveSubscription ? 'Langganan Pro Aktif' : 'Masa Berlaku Trial Pro'}</span>
            </span>
            {userAngkatan && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                Angkatan '{userAngkatan}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{isActiveSubscription ? 'Akses Premium' : 'Free Access'}</span>
            </span>
          </div>

          <h3 className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {isActiveSubscription ? 'Sisa Masa Berlaku Langganan Anda' : 'Sisa Waktu Percobaan Akun Anda'}
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Berakhir: <span className="font-semibold text-indigo-600 dark:text-indigo-300">{formattedEndDate}</span>
          </p>
        </div>

        {/* Right Countdown boxes */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          {/* Hari */}
          <div className={`flex flex-col items-center justify-center min-w-[52px] px-2.5 py-1.5 rounded-xl border backdrop-blur-md shadow-xs ${
            isDark ? 'bg-white/[0.06] border-white/15' : 'liquid-glass-subtle'
          }`}>
            <span className="text-base sm:text-lg font-black font-mono text-indigo-600 dark:text-indigo-400">
              {String(timeLeft.days).padStart(2, '0')}
            </span>
            <span className="text-[8px] font-extrabold uppercase tracking-wider text-slate-400">
              Hari
            </span>
          </div>

          <span className="font-black text-indigo-400 text-sm">:</span>

          {/* Jam */}
          <div className={`flex flex-col items-center justify-center min-w-[52px] px-2.5 py-1.5 rounded-xl border backdrop-blur-md shadow-xs ${
            isDark ? 'bg-white/[0.06] border-white/15' : 'liquid-glass-subtle'
          }`}>
            <span className="text-base sm:text-lg font-black font-mono text-indigo-600 dark:text-indigo-400">
              {String(timeLeft.hours).padStart(2, '0')}
            </span>
            <span className="text-[8px] font-extrabold uppercase tracking-wider text-slate-400">
              Jam
            </span>
          </div>

          <span className="font-black text-indigo-400 text-sm">:</span>

          {/* Menit */}
          <div className={`flex flex-col items-center justify-center min-w-[52px] px-2.5 py-1.5 rounded-xl border backdrop-blur-md shadow-xs ${
            isDark ? 'bg-white/[0.06] border-white/15' : 'liquid-glass-subtle'
          }`}>
            <span className="text-base sm:text-lg font-black font-mono text-indigo-600 dark:text-indigo-400">
              {String(timeLeft.minutes).padStart(2, '0')}
            </span>
            <span className="text-[8px] font-extrabold uppercase tracking-wider text-slate-400">
              Menit
            </span>
          </div>

          <span className="font-black text-indigo-400 text-sm">:</span>

          {/* Detik */}
          <div className={`flex flex-col items-center justify-center min-w-[52px] px-2.5 py-1.5 rounded-xl border backdrop-blur-md shadow-xs ${
            isDark ? 'bg-white/[0.06] border-purple-500/30' : 'liquid-glass-subtle'
          }`}>
            <span className="text-base sm:text-lg font-black font-mono text-purple-600 dark:text-purple-400 animate-pulse">
              {String(timeLeft.seconds).padStart(2, '0')}
            </span>
            <span className="text-[8px] font-extrabold uppercase tracking-wider text-slate-400">
              Detik
            </span>
          </div>
        </div>
      </div>

      {!compact && (
        <div className={`mt-3 pt-2.5 border-t flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 ${
          isDark ? 'border-slate-800' : 'border-slate-200/80'
        }`}>
          <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>
            {isActiveSubscription 
              ? 'Terima kasih telah berlangganan AuraMedPro. Pastikan untuk memperpanjang sebelum waktu habis agar akses belajar Anda tidak terputus.'
              : 'Waktu trial Anda terus berjalan. Silakan lakukan pembayaran jika waktu sudah habis untuk melanjutkan akses tanpa henti.'}
          </span>
        </div>
      )}
    </div>
  );
};
