interface Env {
  QUESTIONS_BUCKET: R2Bucket;
  R2_PUBLIC_URL: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  try {
    const { filename, content } = await request.json();

    if (!filename || !content) {
      return new Response(JSON.stringify({ error: 'Filename and content are required' }), { status: 400, headers: corsHeaders });
    }

    // Sanitize filename
    const sanitizedFilename = filename.replace(/^.*[\\/]/, '').replace(/[^a-zA-Z0-9.\-_]/g, '_');

    // Langsung tulis ke R2 via binding (TANPA presigned URL!)
    await env.QUESTIONS_BUCKET.put(sanitizedFilename, JSON.stringify(content), {
      httpMetadata: { contentType: 'application/json' },
    });

    const fileUrl = `${env.R2_PUBLIC_URL}/${sanitizedFilename}`;

    return new Response(JSON.stringify({ fileUrl, key: sanitizedFilename }), { status: 200, headers: corsHeaders });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Failed to upload' }), { status: 500, headers: corsHeaders });
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
