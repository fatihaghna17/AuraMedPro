import { verifyJwt, hashPasswordPBKDF2 } from './_utils';

interface Env {
  DB: D1Database;
  AUTH_JWT_SECRET?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: corsHeaders });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  try {
    const cookieHeader = request.headers.get('Cookie');
    let token = null;
    if (cookieHeader) {
      const match = cookieHeader.match(/cbt_auth_token=([^;]+)/);
      if (match) token = match[1];
    }

    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const secret = env.AUTH_JWT_SECRET || 'auramedpro-jwt-secret-dev-2026-key-fixed-fallback';
    const payload = await verifyJwt(token, secret);

    if (!payload || !payload.sub) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: corsHeaders });
    }

    const { newPassword } = await request.json() as any;

    if (!newPassword || newPassword.length !== 3 || !/^\d{3}$/.test(newPassword)) {
      return new Response(JSON.stringify({ error: 'Password harus 3 digit angka (000-999)' }), { status: 400, headers: corsHeaders });
    }

    const passwordHash = await hashPasswordPBKDF2(newPassword);

    await env.DB.prepare('UPDATE profiles SET password_hash = ? WHERE id = ?')
      .bind(passwordHash, payload.sub)
      .run();

    return new Response(JSON.stringify({ success: true, message: 'Password berhasil diubah' }), { status: 200, headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
};
