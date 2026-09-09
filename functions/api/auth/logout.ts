import { createClearAuthCookie } from './_utils';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: corsHeaders });
};

export const onRequestPost: PagesFunction = async () => {
  const headers = new Headers({
    ...corsHeaders,
    'Content-Type': 'application/json',
    'Set-Cookie': createClearAuthCookie(),
  });

  return new Response(JSON.stringify({ success: true, message: 'Berhasil logout' }), {
    status: 200,
    headers,
  });
};

export const onRequestGet: PagesFunction = onRequestPost;
