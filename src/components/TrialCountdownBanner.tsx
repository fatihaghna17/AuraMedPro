import React, { useState, useEffect } from 'react';
import { Clock, Sparkles, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface TrialCountdownBannerProps {
  theme: string;
  trialEndsAt?: string | null;
  userAngkatan?: string | null;
  isSuperAdmin?: boolean;
  isAdminAngkatan?: boolean;
  compact?: boolean;
}

const TRIAL_ENDS_MAP: Record<string, string> = {
  '24': '2026-09-14T05:00:00Z',
  '25': '2026-09-17T05:00:00Z',
  '26': '2026-09-22T05:00:00Z',
};

export const TrialCountdownBanner: React.FC<TrialCountdownBannerProps> = ({
  theme,
  trialEndsAt,
  userAngkatan,
  isSuperAdmin = false,
  isAdminAngkatan = false,
  compact = false,
}) => {
  const isDark = theme === 'dark';

  // Tentukan target batas trial
  const effectiveTrialEnd =
    trialEndsAt ||
    (userAngkatan && TRIAL_ENDS_MAP[userAngkatan] ? TRIAL_ENDS_MAP[userAngkatan] : '2026-09-14T05:00:00Z');

  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const [isExpired, setIsExpired] = useState<boolean>(false);

  useEffect(() => {
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
  try {
    const endDateObj = new Date(effectiveTrialEnd);
    const datePart = endDateObj.toLocaleDateString('id-ID', {
      weekday: 'long',
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

  // Jika akun adalah Super Admin atau Admin Angkatan
  if (isSuperAdmin || isAdminAngkatan) {
    return (
      <div
        className={`w-full rounded-2xl p-3.5 border transition-all ${
          isDark
            ? 'bg-slate-900/60 border-indigo-500/30 shadow-md'
            : 'bg-indigo-50/80 border-indigo-200 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-base">👑</span>
            <div>
              <span className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isSuperAdmin ? 'Akun Super Admin' : 'Akun Admin Angkatan'}
              </span>
              <span className="text-[11px] text-slate-400 ml-2">
                Akses Penuh Permanen (Bebas Batas Trial)
              </span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            Akses Aktif
          </span>
        </div>
      </div>
    );
  }

  // JIKA MASA TRIAL SUDAH HABIS:
  // Tampilkan pesan bahwa sistem pembayaran belum siap dan trial diperpanjang otomatis
  if (isExpired) {
    return (
      <div
        className={`w-full rounded-2xl p-4 border transition-all duration-300 relative overflow-hidden ${
          isDark
            ? 'bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-emerald-950/40 border-amber-500/40 shadow-lg shadow-amber-500/10'
            : 'bg-gradient-to-r from-amber-50 via-purple-50 to-emerald-50 border-amber-300 shadow-md'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center text-lg border border-amber-500/30 shrink-0 shadow-sm">
              🎁
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  Perpanjangan Otomatis
                </span>
                {userAngkatan && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                    Angkatan '{userAngkatan}
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Akses Tetap Aktif
                </span>
              </div>
              <h3 className={`text-sm font-black mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Sistem Pembayaran Belum Siap — Masa Trial Diperpanjang
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                Masa berlaku akun Anda <span className="font-bold text-amber-500 dark:text-amber-400">diperpanjang sampai waktu yang tidak ditentukan</span>. Anda tetap dapat mengakses seluruh soal dan fitur Pro secara gratis!
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 text-xs font-black flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Akses Pro Aktif</span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  // JIKA MASA TRIAL MASIH BERJALAN (COUNTDOWN AKTIF):
  return (
    <div
      className={`w-full rounded-2xl p-4 border transition-all duration-300 relative overflow-hidden ${
        isDark
          ? 'bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-900/80 border-indigo-500/30 shadow-lg shadow-indigo-500/10'
          : 'bg-gradient-to-r from-indigo-50/95 via-purple-50/80 to-sky-50/90 border-indigo-200/90 shadow-md shadow-indigo-500/5'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left info */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
              <Clock className="w-3 h-3" />
              <span>Masa Berlaku Trial Pro</span>
            </span>
            {userAngkatan && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                Angkatan '{userAngkatan}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Free Access</span>
            </span>
          </div>

          <h3 className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Sisa Waktu Percobaan Akun Anda
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Berakhir: <span className="font-semibold text-indigo-600 dark:text-indigo-300">{formattedEndDate}</span>
          </p>
        </div>

        {/* Right Countdown boxes */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          {/* Hari */}
          <div className={`flex flex-col items-center justify-center min-w-[52px] px-2.5 py-1.5 rounded-xl border shadow-sm ${
            isDark ? 'bg-slate-900/90 border-indigo-500/30' : 'bg-white/95 border-indigo-200'
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
          <div className={`flex flex-col items-center justify-center min-w-[52px] px-2.5 py-1.5 rounded-xl border shadow-sm ${
            isDark ? 'bg-slate-900/90 border-indigo-500/30' : 'bg-white/95 border-indigo-200'
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
          <div className={`flex flex-col items-center justify-center min-w-[52px] px-2.5 py-1.5 rounded-xl border shadow-sm ${
            isDark ? 'bg-slate-900/90 border-indigo-500/30' : 'bg-white/95 border-indigo-200'
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
          <div className={`flex flex-col items-center justify-center min-w-[52px] px-2.5 py-1.5 rounded-xl border shadow-sm ${
            isDark ? 'bg-slate-900/90 border-purple-500/40' : 'bg-white/95 border-purple-300'
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
            Sistem pembayaran sedang disiapkan. Jika waktu habis, masa trial akan otomatis diperpanjang tanpa memutus akses.
          </span>
        </div>
      )}
    </div>
  );
};
