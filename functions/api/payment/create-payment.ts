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
    const body = await request.json() as any;
    const { user_id } = body;

    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id wajib diisi' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate unique code (100 - 999)
    let uniqueCode = 0;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      uniqueCode = Math.floor(Math.random() * 900) + 100;
      
      const existing = await env.DB.prepare(
        'SELECT id FROM payments WHERE unique_code = ? AND status = ?'
      )
      .bind(uniqueCode, 'pending')
      .first();

      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return new Response(JSON.stringify({ error: 'Gagal membuat kode unik' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const paymentId = generateUniqueId();
    const amount = 10000;
    
    await env.DB.prepare(`
      INSERT INTO payments (id, user_id, source, amount, unique_code, status, plan)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(paymentId, user_id, 'moota', amount, uniqueCode, 'pending', '1_month')
    .run();

    const resultPayload = {
      paymentId,
      amount,
      uniqueCode,
      totalAmount: amount + uniqueCode,
      bankInfo: {
        bank: env.PAYMENT_BANK_NAME || 'BCA',
        accountNumber: env.PAYMENT_ACCOUNT_NUMBER || 'Hubungi Admin',
        accountName: env.PAYMENT_ACCOUNT_NAME || 'AuraMedPro'
      }
    };

    return new Response(JSON.stringify({
      data: resultPayload,
      ...resultPayload
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};
