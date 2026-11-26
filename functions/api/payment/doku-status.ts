// functions/api/payment/doku-status.ts
// Cek status invoice langsung ke DOKU Order Status API (GET /orders/v1/status/{invoice_number}).
// Berfungsi sebagai verifikasi instan saat user kembali dari DOKU Checkout maupun fallback bila webhook tertunda.

import { extractAuthToken, verifyJwt } from '../auth/_utils';
import { activateDokuPayment, dokuFetch, type DokuEnv } from '../../_lib/doku';

interface Env extends DokuEnv {
  DB: D1Database;
  AUTH_JWT_SECRET?: string;
}

const jsonHeaders = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const clientId = env.DOKU_CLIENT_ID?.trim();
  const secretKey = env.DOKU_SECRET_KEY?.trim();
  if (!clientId || !secretKey) {
    return json({ error: 'Pembayaran online belum dikonfigurasi.' }, 500);
  }

  // 1. Verifikasi sesi user
  const token = extractAuthToken(request);
  const jwtSecret = env.AUTH_JWT_SECRET || 'auramedpro-jwt-secret-dev-2026-key-fixed-fallback';
  const payload = token ? await verifyJwt(token, jwtSecret) : null;
  if (!payload?.sub) {
    return json({ error: 'Silakan login terlebih dahulu.' }, 401);
  }
  const userId = payload.sub;

  const url = new URL(request.url);
  const requestedInvoice = url.searchParams.get('invoice')?.trim();

  // 2. Ambil transaksi DOKU milik user (spesifik invoice atau transaksi DOKU terbaru milik user)
  const payment = requestedInvoice
    ? await env.DB.prepare(
        "SELECT id, user_id, reference_id, amount, status FROM payments WHERE user_id = ? AND source = 'doku' AND reference_id = ? LIMIT 1"
      )
        .bind(userId, requestedInvoice)
        .first<{ id: string; user_id: string; reference_id: string; amount: number; status: string }>()
    : await env.DB.prepare(
        "SELECT id, user_id, reference_id, amount, status FROM payments WHERE user_id = ? AND source = 'doku' AND reference_id IS NOT NULL ORDER BY created_at DESC LIMIT 1"
      )
        .bind(userId)
        .first<{ id: string; user_id: string; reference_id: string; amount: number; status: string }>();

  if (!payment || !payment.reference_id) {
    return json({ data: { status: 'NONE', paid: false, invoiceNumber: null } });
  }

  // Jika sudah tercatat lunas oleh webhook, langsung kembalikan SUCCESS
  if (payment.status === 'paid') {
    return json({
      data: {
        status: 'SUCCESS',
        paid: true,
        invoiceNumber: payment.reference_id,
      },
    });
  }

  // 3. Tanya langsung ke DOKU Order Status API (GET tanpa body -> tanpa Digest)
  const targetPath = `/orders/v1/status/${encodeURIComponent(payment.reference_id)}`;

  try {
    const { res, data } = await dokuFetch({
      env,
      method: 'GET',
      targetPath,
    });
    if (!res.ok) {
      return json({
        data: {
          status: payment.status === 'expired' ? 'EXPIRED' : 'PENDING',
          paid: false,
          invoiceNumber: payment.reference_id,
        },
      });
    }

    const txStatus = String(
      data?.transaction?.status ?? data?.response?.transaction?.status ?? ''
    ).toUpperCase();
    const orderAmount = Number(
      data?.order?.amount ?? data?.response?.order?.amount ?? NaN
    );

    if (txStatus === 'SUCCESS') {
      if (Number.isFinite(orderAmount) && orderAmount !== payment.amount) {
        console.error('[doku-status] nominal tidak cocok', payment.reference_id, orderAmount, payment.amount);
        return json({ error: 'Nominal pembayaran tidak sesuai.' }, 400);
      }
      await activateDokuPayment(env.DB, payment.id, payment.user_id);
      return json({
        data: {
          status: 'SUCCESS',
          paid: true,
          invoiceNumber: payment.reference_id,
        },
      });
    }

    if (txStatus === 'FAILED' || txStatus === 'EXPIRED') {
      await env.DB.prepare(
        "UPDATE payments SET status = 'expired' WHERE id = ? AND status = 'pending'"
      )
        .bind(payment.id)
        .run();
      return json({
        data: {
          status: txStatus,
          paid: false,
          invoiceNumber: payment.reference_id,
        },
      });
    }

    return json({
      data: {
        status: txStatus || 'PENDING',
        paid: false,
        invoiceNumber: payment.reference_id,
      },
    });
  } catch (err: any) {
    console.error('[doku-status] gagal cek status ke DOKU:', err?.message);
    return json({
      data: {
        status: 'PENDING',
        paid: false,
        invoiceNumber: payment.reference_id,
      },
    });
  }
};
