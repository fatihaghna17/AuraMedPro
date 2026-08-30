interface Env {
  QUESTIONS_BUCKET: R2Bucket;
  R2_SECRET_TOKEN?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  try {
    // Auth check
    if (env.R2_SECRET_TOKEN) {
      const authHeader = request.headers.get('Authorization') || '';
      if (authHeader !== `Bearer ${env.R2_SECRET_TOKEN}`) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
      }
    }

    const { key } = await request.json();
    if (!key) {
      return new Response(JSON.stringify({ error: 'Key is required' }), { status: 400, headers: corsHeaders });
    }

    await env.QUESTIONS_BUCKET.delete(key);

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Failed to delete' }), { status: 500, headers: corsHeaders });
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
};
