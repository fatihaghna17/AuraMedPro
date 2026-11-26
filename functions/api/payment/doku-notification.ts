// functions/api/payment/doku-notification.ts
// Endpoint HTTP Notification (webhook) DOKU: POST /api/payment/doku-notification
// Daftarkan URL ini di DOKU Back Office > Settings > Payment Settings > Notification URL:
//   https://<domain-kamu>/api/payment/doku-notification

import { activateDokuPayment, verifyNotificationSignature, type DokuEnv } from '../../_lib/doku';

interface Env extends DokuEnv {
  DB: D1Database;
}

const ok = () =>
  new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // 1. Baca body mentah (wajib untuk verifikasi Digest) lalu cek Signature HMAC-SHA256
  const rawBody = await request.text();
  const valid = await verifyNotificationSignature(request, rawBody, env);
  if (!valid) {
    console.warn('[doku-notification] signature tidak valid');
    return new Response('Invalid signature', { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const invoiceNumber: string | undefined = payload?.order?.invoice_number;
  const txStatus: string = String(payload?.transaction?.status || '').toUpperCase();
  const notifAmount = Number(payload?.order?.amount);

  if (!invoiceNumber) return new Response('Missing invoice_number', { status: 400 });

  // 2. Cari transaksi DOKU milik kita
  const payment = await env.DB.prepare(
    "SELECT id, user_id, amount, status FROM payments WHERE source = 'doku' AND reference_id = ?"
  )
    .bind(invoiceNumber)
    .first<{ id: string; user_id: string; amount: number; status: string }>();

  if (!payment) {
    // Signature sah tapi invoice tidak dikenal: balas 200 agar DOKU tidak retry terus
    console.warn('[doku-notification] invoice tidak dikenal:', invoiceNumber);
    return ok();
  }

  // 3. Pembayaran gagal / kedaluwarsa
  if (txStatus === 'FAILED' || txStatus === 'EXPIRED') {
    await env.DB.prepare("UPDATE payments SET status = 'expired' WHERE id = ? AND status = 'pending'")
      .bind(payment.id)
      .run();
    return ok();
  }

  if (txStatus !== 'SUCCESS') return ok();

  // 4. Nominal harus sama persis dengan tagihan yang kita buat
  if (notifAmount !== payment.amount) {
    console.error('[doku-notification] nominal tidak cocok', invoiceNumber, notifAmount, payment.amount);
    return ok();
  }

  // 5. Aktifkan langganan 1 bulan secara atomik & idempoten
  await activateDokuPayment(env.DB, payment.id, payment.user_id);

  return ok();
};
