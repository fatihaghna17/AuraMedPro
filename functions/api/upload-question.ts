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
    const { filename, content, user_id } = (await request.json()) as any;

    if (!filename || !content) {
      return new Response(JSON.stringify({ error: 'Filename and content are required' }), { status: 400, headers: corsHeaders });
    }

    // Sanitize filename & scope per user_id + deterministic hash so "K3 3.4.json" and "K3_3.4.json" or different users never overwrite each other
    const baseName = filename.replace(/^.*[\\/]/, '');
    const sanitizedFilename = baseName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    let hash = 0;
    for (let i = 0; i < filename.length; i++) {
      hash = ((hash << 5) - hash + filename.charCodeAt(i)) | 0;
    }
    const hashHex = Math.abs(hash).toString(16).slice(0, 6);
    const safeUser = user_id ? String(user_id).replace(/[^a-zA-Z0-9\-_]/g, '') : '';
    const r2Key = safeUser
      ? `banks/${safeUser}/${hashHex}_${sanitizedFilename}`
      : `${hashHex}_${sanitizedFilename}`;

    // Langsung tulis ke R2 via binding (TANPA presigned URL!)
    await env.QUESTIONS_BUCKET.put(r2Key, JSON.stringify(content), {
      httpMetadata: { contentType: 'application/json' },
    });

    // Pastikan R2_PUBLIC_URL tidak ada trailing slash
    const cleanBaseUrl = (env.R2_PUBLIC_URL || '').replace(/\/+$/, '');
    const fileUrl = `${cleanBaseUrl}/${r2Key}`;

    return new Response(JSON.stringify({ fileUrl, key: r2Key }), { status: 200, headers: corsHeaders });

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
