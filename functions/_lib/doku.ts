// functions/_lib/doku.ts
// Helper DOKU Checkout (Non-SNAP): pembuatan signature, verifikasi webhook, & aktivasi atomik.
// Dokumentasi: https://developers.doku.com/accept-payments/doku-checkout

export interface DokuEnv {
  DOKU_CLIENT_ID?: string;
  DOKU_SECRET_KEY?: string;
  DOKU_BASE_URL?: string; // sandbox: https://api-sandbox.doku.com | production: https://api.doku.com
}

// Satu-satunya sumber kebenaran harga. Nominal TIDAK pernah diambil dari client.
export const PLANS: Record<string, { amount: number; label: string }> = {
  '1_month': { amount: 10000, label: 'AuraMedPro 1 Bulan' },
};

const enc = new TextEncoder();

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

export async function sha256Base64(text: string): Promise<string> {
  return toBase64(await crypto.subtle.digest('SHA-256', enc.encode(text)));
}

async function hmacSha256Base64(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return toBase64(await crypto.subtle.sign('HMAC', key, enc.encode(message)));
}

/** Timestamp ISO 8601 UTC tanpa milidetik, mis. 2026-11-26T10:15:30Z */
export function isoTimestamp(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/**
 * Signature = "HMACSHA256=" + base64(HMAC-SHA256(secretKey, component))
 * component = Client-Id, Request-Id, Request-Timestamp, Request-Target, [Digest]
 * Digest hanya disertakan bila request memiliki body: base64(SHA-256(rawBody)).
 */
export async function buildSignature(opts: {
  clientId: string;
  requestId: string;
  timestamp: string;
  target: string; // path endpoint, mis. /checkout/v1/payment
  secretKey: string;
  body?: string; // body mentah persis seperti yang dikirim/diterima
}): Promise<string> {
  let component =
    `Client-Id:${opts.clientId}\n` +
    `Request-Id:${opts.requestId}\n` +
    `Request-Timestamp:${opts.timestamp}\n` +
    `Request-Target:${opts.target}`;
  if (opts.body !== undefined) {
    component += `\nDigest:${await sha256Base64(opts.body)}`;
  }
  return 'HMACSHA256=' + (await hmacSha256Base64(opts.secretKey, component));
}

function timingSafeEqual(a: string, b: string): boolean {
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  if (ab.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i];
  return diff === 0;
}

/** Verifikasi bahwa HTTP Notification benar-benar berasal dari DOKU. */
export async function verifyNotificationSignature(
  request: Request,
  rawBody: string,
  env: DokuEnv
): Promise<boolean> {
  const envClientId = env.DOKU_CLIENT_ID?.trim();
  const envSecretKey = env.DOKU_SECRET_KEY?.trim();
  if (!envClientId || !envSecretKey) return false;

  const clientId = request.headers.get('Client-Id')?.trim();
  const requestId = request.headers.get('Request-Id')?.trim();
  const timestamp = request.headers.get('Request-Timestamp')?.trim();
  const signature = request.headers.get('Signature')?.trim();
  if (!clientId || !requestId || !timestamp || !signature) return false;
  if (clientId !== envClientId) return false;

  const expected = await buildSignature({
    clientId,
    requestId,
    timestamp,
    target: new URL(request.url).pathname,
    secretKey: envSecretKey,
    body: rawBody,
  });

  return timingSafeEqual(expected, signature);
}

/**
 * Kirim request bertanda tangan ke DOKU API.
 * Bila DOKU_BASE_URL diset eksplisit, hanya gunakan URL tersebut.
 * Bila tidak diset, coba Production (https://api.doku.com) lebih dulu, lalu otomatis
 * fallback ke Sandbox (https://api-sandbox.doku.com) jika Client-Id terdaftar di Sandbox.
 */
export async function dokuFetch(opts: {
  env: DokuEnv;
  method: 'GET' | 'POST';
  targetPath: string;
  rawBody?: string;
}): Promise<{ res: Response; data: any }> {
  const clientId = opts.env.DOKU_CLIENT_ID!.trim();
  const secretKey = opts.env.DOKU_SECRET_KEY!.trim();
  const explicitBase = opts.env.DOKU_BASE_URL?.trim().replace(/\/+$/, '');
  const baseCandidates = explicitBase
    ? [explicitBase]
    : ['https://api.doku.com', 'https://api-sandbox.doku.com'];

  let lastResult: { res: Response; data: any } | null = null;

  for (const baseUrl of baseCandidates) {
    const requestId = crypto.randomUUID();
    const timestamp = isoTimestamp();
    const signature = await buildSignature({
      clientId,
      requestId,
      timestamp,
      target: opts.targetPath,
      secretKey,
      body: opts.rawBody,
    });

    const headers: Record<string, string> = {
      'Client-Id': clientId,
      'Request-Id': requestId,
      'Request-Timestamp': timestamp,
      Signature: signature,
    };
    if (opts.rawBody !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${baseUrl}${opts.targetPath}`, {
      method: opts.method,
      headers,
      body: opts.rawBody,
    });
    const data = (await res.json().catch(() => ({}))) as any;
    lastResult = { res, data };

    if (data?.error?.code === 'invalid_client_id' && baseCandidates.length > 1) {
      continue;
    }
    return lastResult;
  }

  return lastResult!;
}

/**
 * Aktifkan langganan 1 bulan secara atomik & idempoten untuk pembayaran DOKU yang sah.
 * - Jika langganan masih aktif, masa berlaku diperpanjang +1 bulan dari tanggal kedaluwarsa.
 * - Akun 'lifetime' tidak diturunkan menjadi 'active'.
 * - Guard `status != 'paid'` memastikan aman walau dipanggil berulang (webhook + cek status).
 */
export async function activateDokuPayment(
  db: D1Database,
  paymentId: string,
  userId: string
): Promise<void> {
  const nowIso = new Date().toISOString();
  await db.batch([
    db
      .prepare(
        `UPDATE profiles
         SET subscription_status = 'active',
             subscription_expires_at = strftime('%Y-%m-%dT%H:%M:%SZ', datetime(
               CASE WHEN subscription_status = 'active'
                         AND subscription_expires_at IS NOT NULL
                         AND subscription_expires_at > ?
                    THEN subscription_expires_at ELSE ? END,
               '+1 month'))
         WHERE id = ?
           AND COALESCE(subscription_status, '') != 'lifetime'
           AND EXISTS (SELECT 1 FROM payments WHERE id = ? AND status != 'paid')`
      )
      .bind(nowIso, nowIso, userId, paymentId),
    db
      .prepare(
        "UPDATE payments SET status = 'paid', paid_at = datetime('now') WHERE id = ? AND status != 'paid'"
      )
      .bind(paymentId),
    db
      .prepare(
        "DELETE FROM payments WHERE user_id = ? AND status = 'pending' AND id != ?"
      )
      .bind(userId, paymentId),
  ]);
}
