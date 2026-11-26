// functions/api/payment/doku-create.ts
// Membuat invoice + halaman DOKU Checkout untuk user yang sedang login.
// POST /api/payment/doku-create  (tanpa body; user diambil dari cookie sesi)

import { extractAuthToken, verifyJwt } from '../auth/_utils';
import { PLANS, dokuFetch, type DokuEnv } from '../../_lib/doku';

interface Env extends DokuEnv {
  DB: D1Database;
  AUTH_JWT_SECRET?: string;
}

const CHECKOUT_PATH = '/checkout/v1/payment';
const PAYMENT_DUE_MINUTES = 60;

const jsonHeaders = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

function newInvoiceNumber(): string {
  const rand = crypto.getRandomValues(new Uint8Array(3));
  const hex = Array.from(rand, (b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  return `AURA-${Date.now()}-${hex}`;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const clientId = env.DOKU_CLIENT_ID?.trim();
  const secretKey = env.DOKU_SECRET_KEY?.trim();
  if (!clientId || !secretKey) {
    console.error('[doku-create] DOKU_CLIENT_ID / DOKU_SECRET_KEY belum di-set');
    return json({ error: 'Pembayaran online DOKU belum dikonfigurasi di server.' }, 500);
  }

  // 1. Identitas user dari cookie sesi (BUKAN dari body)
  const token = extractAuthToken(request);
  const jwtSecret = env.AUTH_JWT_SECRET || 'auramedpro-jwt-secret-dev-2026-key-fixed-fallback';
  const payload = token ? await verifyJwt(token, jwtSecret) : null;
  if (!payload?.sub) {
    return json({ error: 'Silakan login terlebih dahulu.' }, 401);
  }
  const userId = payload.sub;

  const profile = await env.DB.prepare('SELECT id, username FROM profiles WHERE id = ?')
    .bind(userId)
    .first<{ id: string; username?: string }>();
  if (!profile) return json({ error: 'Profil tidak ditemukan.' }, 404);

  // 2. Harga ditentukan server
  const planKey = '1_month';
  const plan = PLANS[planKey];
  const invoiceNumber = newInvoiceNumber();
  const paymentId = crypto.randomUUID();

  // 3. Pastikan index unik reference_id ada, expire invoice lama, lalu catat invoice baru
  await env.DB.batch([
    env.DB.prepare(
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_reference_unique ON payments(reference_id) WHERE reference_id IS NOT NULL'
    ),
    env.DB.prepare(
      "UPDATE payments SET status = 'expired' WHERE user_id = ? AND source = 'doku' AND status = 'pending'"
    ).bind(userId),
    env.DB.prepare(
      `INSERT INTO payments (id, user_id, source, reference_id, amount, unique_code, status, plan)
       VALUES (?, ?, 'doku', ?, ?, 0, 'pending', ?)`
    ).bind(paymentId, userId, invoiceNumber, plan.amount, planKey),
  ]);

  // 4. Minta halaman checkout ke DOKU
  const origin = new URL(request.url).origin;
  const customerName =
    (profile.username || 'Member AuraMed')
      .replace(/[^\w\s.-]/g, '')
      .trim()
      .slice(0, 50) || 'Member AuraMed';

  const bodyObj = {
    order: {
      amount: plan.amount,
      invoice_number: invoiceNumber,
      currency: 'IDR',
      callback_url: `${origin}/?payment=doku&invoice=${invoiceNumber}`,
      callback_url_cancel: `${origin}/?payment=doku_cancel`,
      auto_redirect: true,
      line_items: [
        {
          id: planKey,
          name: plan.label,
          quantity: 1,
          price: plan.amount,
        },
      ],
    },
    payment: {
      payment_due_date: PAYMENT_DUE_MINUTES,
    },
    customer: {
      id: userId.slice(0, 64),
      name: customerName,
    },
  };
  const rawBody = JSON.stringify(bodyObj);

  try {
    const { res, data } = await dokuFetch({
      env,
      method: 'POST',
      targetPath: CHECKOUT_PATH,
      rawBody,
    });

    const paymentUrl: string | undefined = data?.response?.payment?.url;

    if (!res.ok || !paymentUrl) {
      console.error('[doku-create] DOKU menolak request', res.status, JSON.stringify(data?.message ?? data));
      await env.DB.prepare("UPDATE payments SET status = 'expired' WHERE id = ?").bind(paymentId).run();
      return json({ error: 'Gagal membuat tagihan DOKU. Pastikan Client-Id & Secret-Key sesuai.' }, 502);
    }

    return json({
      data: {
        paymentId,
        invoiceNumber,
        amount: plan.amount,
        paymentUrl,
        expiredDate: data?.response?.payment?.expired_date ?? null,
      },
    });
  } catch (err: any) {
    console.error('[doku-create] error jaringan', err?.message);
    await env.DB.prepare("UPDATE payments SET status = 'expired' WHERE id = ?").bind(paymentId).run();
    return json({ error: 'Tidak dapat menghubungi penyedia pembayaran.' }, 502);
  }
};
