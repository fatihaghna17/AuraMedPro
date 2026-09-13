interface Env {
  DB: D1Database;
  MAYAR_API_KEY?: string;
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

  try {
    const payload = await request.json() as any;

    if (payload.event === 'payment.received') {
      const email = payload.data?.customer?.email || payload.data?.email;
      
      if (email) {
        const profile = await env.DB.prepare('SELECT id FROM profiles WHERE email = ?')
          .bind(email)
          .first<any>();
          
        const userId = profile?.id || payload.data?.customer?.id;

        if (userId) {
          const oneMonthFromNow = new Date();
          oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

          await env.DB.prepare(
            'UPDATE profiles SET subscription_status = ?, subscription_expires_at = ? WHERE id = ? OR email = ?'
          )
          .bind('active', oneMonthFromNow.toISOString(), userId, email)
          .run();
        }
      }
    }

    return new Response('OK', { status: 200 });
  } catch (err: any) {
    return new Response(err.message, { status: 500 });
  }
};
