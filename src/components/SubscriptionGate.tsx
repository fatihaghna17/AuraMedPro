import React, { useState, useEffect } from 'react';
import { ShieldX, CreditCard, Clock, Copy, Check, RefreshCw, ExternalLink } from 'lucide-react';
import { authClient, PaymentInfo } from '../lib/authClient';

interface SubscriptionGateProps {
  theme: 'light' | 'dark';
  userId: string;
  trialEndsAt: string | null;
  onRefreshStatus: () => void;
  mayarPaymentUrl?: string;
  username?: string;
  angkatan?: string;
}

export default function SubscriptionGate({
  theme, userId, trialEndsAt, onRefreshStatus, mayarPaymentUrl, username, angkatan
}: SubscriptionGateProps) {
  const isDark = theme === 'dark';
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);

  // Hitung sisa trial
  const trialEnd = trialEndsAt ? new Date(trialEndsAt) : null;
  const isTrialExpired = trialEnd ? trialEnd.getTime() < Date.now() : true;

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
    setTimeout(() => setChecking(false), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className={`w-full max-w-md rounded-3xl shadow-2xl p-8 ${
        isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-200'
      }`}>
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg mb-4">
            <Clock className="w-7 h-7" />
          </div>
          <h2 className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
            Masa Trial Habis
          </h2>
          <p className={`text-xs mt-2 font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            Akses langganan Anda telah berakhir. Silakan lakukan pembayaran untuk melanjutkan akses ke seluruh fitur AuraMedPro.
          </p>
        </div>

        {/* Harga */}
        <div className={`rounded-2xl p-4 mb-6 text-center ${
          isDark ? 'bg-slate-800 border border-slate-700' : 'bg-indigo-50 border border-indigo-100'
        }`}>
          <p className={`text-xs font-bold mb-1 ${isDark ? 'text-slate-400' : 'text-indigo-600'}`}>Biaya Langganan</p>
          <p className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>
            Rp 10.000<span className="text-sm font-semibold opacity-60">/bulan</span>
          </p>
        </div>

        {/* Mayar Payment Link */}
        {mayarPaymentUrl && (
          <a
            href={mayarPaymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 mb-4"
          >
            <CreditCard className="w-4 h-4" />
            Bayar via Mayar
            <ExternalLink className="w-3 h-3" />
          </a>
        )}

        {/* Transfer Manual */}
        {!paymentInfo ? (
          <button
            onClick={handleCreatePayment}
            disabled={loading}
            className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
              mayarPaymentUrl
                ? `${isDark ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-slate-100 text-slate-700 border border-slate-200'}`
                : 'bg-gradient-to-r from-teal-500 to-indigo-600 text-white shadow-lg'
            } ${loading ? 'opacity-50' : 'hover:scale-[1.01] active:scale-[0.99]'}`}
          >
            <CreditCard className="w-4 h-4" />
            {loading ? 'Memproses...' : 'Bayar via QRIS'}
          </button>
        ) : (
          <div className={`rounded-2xl p-4 space-y-3 ${
            isDark ? 'bg-slate-800 border border-slate-700' : 'bg-amber-50 border border-amber-200'
          }`}>
            <p className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
              Instruksi Pembayaran
            </p>
            
            <div className="space-y-4">
              <div className="flex justify-center mb-2">
                <img src="/qris.jpg" alt="QRIS AuraMedPro" className="w-48 h-48 rounded-xl shadow-lg border-2 border-white object-cover" />
              </div>
              <p className={`text-center text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Silakan scan QRIS di atas menggunakan aplikasi m-banking atau e-wallet kamu.
              </p>
              
              <div className={`rounded-xl p-4 text-center ${isDark ? 'bg-indigo-900/30' : 'bg-indigo-100'}`}>
                <p className={`text-[10px] font-bold uppercase mb-1 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                  Nominal Pembayaran
                </p>
                <button onClick={() => handleCopy(paymentInfo.totalAmount.toString())} className="flex items-center gap-2 mx-auto cursor-pointer">
                  <p className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    Rp 10.000
                  </p>
                  {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-slate-400" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Konfirmasi WhatsApp */}
        {paymentInfo && (
          <a
            href={`https://wa.me/628978902467?text=${encodeURIComponent(`Halo Admin, saya sudah melakukan pembayaran langganan AuraMedPro.\n\nUsername: ${username || 'Belum diset'}\nAngkatan: ${angkatan || 'Belum diset'}\nNominal: Rp ${paymentInfo.totalAmount.toLocaleString('id-ID')}\n\n*Lampirkan bukti transfer di sini*`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-full mt-4 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 text-white bg-green-500 hover:bg-green-600 shadow-lg hover:scale-[1.01] active:scale-[0.99]`}
          >
            📱 Konfirmasi Bukti ke WhatsApp
          </a>
        )}

        {/* Info */}
        <p className={`text-[10px] text-center mt-4 leading-relaxed ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
          Kirimkan bukti pembayaran Anda ke WhatsApp Admin untuk diaktifkan. 
          <br/><span className="font-bold text-amber-500">Jika sudah dikonfirmasi, silakan muat ulang (refresh) browser Anda.</span>
        </p>
      </div>
    </div>
  );
}
