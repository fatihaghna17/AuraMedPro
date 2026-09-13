interface Env {
  DB: D1Database;
  MOOTA_WEBHOOK_TOKEN?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: corsHeaders });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const url = new URL(request.url);
  const queryToken = url.searchParams.get('token');
  const headerToken = request.headers.get('Authorization')?.replace('Bearer ', '');
  const token = queryToken || headerToken;

  if (env.MOOTA_WEBHOOK_TOKEN && token !== env.MOOTA_WEBHOOK_TOKEN) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const mutations = await request.json() as any[];

    if (!Array.isArray(mutations)) {
      return new Response('Invalid payload', { status: 400 });
    }

    for (const mutation of mutations) {
      if (mutation.type === 'CR' && mutation.amount) {
        // Ambil nominal bersih mutasi (misal: 10142)
        const mutationAmount = parseInt(mutation.amount.toString().replace(/[^0-9]/g, ''), 10);

        if (!isNaN(mutationAmount) && mutationAmount > 0) {
          // Cocokkan persis: nominal tagihan (amount + unique_code) dan status masih pending
          const payment = await env.DB.prepare(
            'SELECT * FROM payments WHERE (amount + unique_code) = ? AND status = ?'
          )
          .bind(mutationAmount, 'pending')
          .first<any>();

          if (payment) {
            await env.DB.prepare(
              'UPDATE payments SET status = ? WHERE id = ?'
            )
            .bind('paid', payment.id)
            .run();

            const oneMonthFromNow = new Date();
            oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

            await env.DB.prepare(
              'UPDATE profiles SET subscription_status = ?, subscription_expires_at = ? WHERE id = ?'
            )
            .bind('active', oneMonthFromNow.toISOString(), payment.user_id)
            .run();
          }
        }
      }
    }

    return new Response('OK', { status: 200 });
  } catch (err: any) {
    return new Response(err.message, { status: 500 });
  }
};
