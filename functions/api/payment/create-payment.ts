interface Env {
  DB: D1Database;
  PAYMENT_BANK_NAME?: string;
  PAYMENT_ACCOUNT_NUMBER?: string;
  PAYMENT_ACCOUNT_NAME?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Cache-Control': 'no-store, no-cache, must-revalidate',
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: corsHeaders });
};

function generateUniqueId() {
  return crypto.randomUUID();
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const body = (await request.json()) as any;
    const { user_id } = body;

    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id wajib diisi' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const amount = 10000;

    // Cek apakah user sudah punya transaksi pending agar tidak membuat ratusan duplikat saat refresh
    const existingPending = await env.DB.prepare(
      "SELECT id FROM payments WHERE user_id = ? AND status = 'pending' ORDER BY created_at DESC LIMIT 1"
    )
      .bind(user_id)
      .first<{ id: string }>();

    let paymentId: string;
    if (existingPending?.id) {
      paymentId = existingPending.id;
      await env.DB.prepare(
        "UPDATE payments SET created_at = datetime('now') WHERE id = ?"
      )
        .bind(paymentId)
        .run();
    } else {
      paymentId = generateUniqueId();
      await env.DB.prepare(`
        INSERT INTO payments (id, user_id, source, amount, unique_code, status, plan)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
        .bind(paymentId, user_id, 'manual', amount, 0, 'pending', '1_month')
        .run();
    }

    const resultPayload = {
      paymentId,
      amount,
      uniqueCode: 0,
      totalAmount: amount,
      bankInfo: {
        bank: 'QRIS',
        accountNumber: '-',
        accountName: 'AuraMedPro',
      },
    };

    return new Response(
      JSON.stringify({
        data: resultPayload,
        ...resultPayload,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};
