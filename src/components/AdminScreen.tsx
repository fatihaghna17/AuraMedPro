import React, { useState, useEffect } from 'react';

interface Payment {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  created_at: string;
  name: string;
  email: string;
}

export default function AdminScreen() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, []);

  const handleApprove = async (paymentId: string, userId: string) => {
    if (!confirm('Yakin ingin mengaktifkan akun user ini? Pastikan struk di WA sudah benar.')) return;
    
    try {
      const res = await fetch('/api/admin/approve-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, userId })
      });
      
      const data = await res.json();
      if (data.success) {
        alert('User berhasil diaktifkan! 🎉');
        // Hapus dari daftar layar setelah di-approve
        setPayments(payments.filter(p => p.id !== paymentId));
      } else {
        alert('Gagal menyetujui: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan.');
    }
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen font-sans">
      <h1 className="text-2xl font-bold mb-2 text-gray-800">🔒 Admin: Konfirmasi Pembayaran</h1>
      <p className="mb-6 text-gray-600">Cocokkan nama/nominal di bawah ini dengan struk yang dikirim ke WhatsApp.</p>
      
      {loading ? (
        <p className="text-gray-500">Memuat data pembayaran...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {payments.map(p => (
            <div key={p.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <h2 className="font-bold text-lg text-gray-800">{p.name || 'User Tanpa Nama'}</h2>
              <p className="text-sm font-normal text-gray-500 mb-2">{p.email}</p>
              
              <p className="text-blue-600 font-bold text-xl mb-1">Rp {p.amount.toLocaleString('id-ID')}</p>
              <p className="text-xs text-gray-400 mb-5">Waktu Order: {new Date(p.created_at).toLocaleString('id-ID')}</p>

              <button 
                onClick={() => handleApprove(p.id, p.user_id)}
                className="w-full bg-green-500 hover:bg-green-600 transition-colors text-white font-bold py-3 rounded-lg shadow cursor-pointer"
              >
                ✅ Setujui & Aktifkan
              </button>
            </div>
          ))}

          {payments.length === 0 && (
            <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-xl border border-dashed">
              Hore! Tidak ada pembayaran yang tertunda.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
