interface Env {
  OMNIROUTE_API_KEY: string;
  OMNIROUTE_BASE_URL: string;
}

const rateLimitCache = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

// Ordered list of models to try (fallback chain)
const MODEL_FALLBACK = [
  'auto/best-free',
  'auto/best-chat',
  'auto/fast',
  'aug/gemini-3.1-pro-preview',
  'aug/glm-5.2',
  'oc/deepseek-v4-flash-free',
  'aug/haiku4.5',
  'aug/sonnet4.5',
];

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  try {
    if (!env.OMNIROUTE_API_KEY || !env.OMNIROUTE_BASE_URL) {
      throw new Error('Server configuration error: Missing OMNIROUTE_API_KEY or OMNIROUTE_BASE_URL');
    }

    const { question, correctAnswer, explanation, userAnswer, context: ctx, mode, followUp } = await request.json();

    if (!question || !mode) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: corsHeaders });
    }

    // Rate Limiting
    const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
    const now = Date.now();
    const clientLimit = rateLimitCache.get(clientIp);
    if (clientLimit) {
      if (now > clientLimit.resetAt) {
        rateLimitCache.set(clientIp, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
      } else {
        if (clientLimit.count >= RATE_LIMIT_MAX) {
          return new Response(JSON.stringify({ error: 'Rate limit exceeded. Coba lagi nanti.' }), { status: 429, headers: corsHeaders });
        }
        clientLimit.count++;
      }
    } else {
      rateLimitCache.set(clientIp, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    }

    const systemMessage = "Kamu adalah tutor medis virtual bernama MediAI di platform AuraMedPro. Jelaskan konsep kedokteran dalam Bahasa Indonesia yang jelas. Gunakan format markdown. Maks 300 kata.";
    
    let userPrompt = "";
    const baseContext = `Konteks/Topik: ${ctx || 'Kedokteran Umum'}\nPertanyaan: ${question}\nJawaban Benar: ${correctAnswer}\nPembahasan Resmi: ${explanation || '-'}\nJawaban User: ${userAnswer || '-'}\n\n`;

    switch (mode) {
      case 'explain':
        userPrompt = `${baseContext}Tolong jelaskan konsep di balik soal ini dan mengapa '${correctAnswer}' adalah jawaban yang paling tepat.`;
        break;
      case 'clarify':
        userPrompt = `${baseContext}Pertanyaan Lanjutan dari user: "${followUp}"\nTolong jawab pertanyaan lanjutan tersebut berdasarkan konteks soal di atas.`;
        break;
      case 'mnemonic':
        userPrompt = `${baseContext}Tolong buatkan jembatan keledai (mnemonic) yang mudah diingat untuk menghafal konsep utama dari soal ini.`;
        break;
      case 'compare':
        userPrompt = `${baseContext}Tolong bandingkan jawaban benar ('${correctAnswer}') dengan jawaban yang dipilih user ('${userAnswer}'). Jelaskan mengapa jawaban user kurang tepat dibandingkan jawaban benar.`;
        break;
      default:
        userPrompt = `${baseContext}Berikan penjelasan singkat.`;
    }

    // OmniRoute: OpenAI-compatible API with model fallback
    const baseUrl = env.OMNIROUTE_BASE_URL.replace(/\/+$/, '');
    const endpoint = `${baseUrl}/chat/completions`;

    let lastError = '';

    for (const model of MODEL_FALLBACK) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env.OMNIROUTE_API_KEY}`,
          },
          body: JSON.stringify({
            model,
            stream: false,
            messages: [
              { role: 'system', content: systemMessage },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 800,
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          lastError = `${model}: ${response.status} ${errText.substring(0, 100)}`;
          continue; // Try next model
        }

        const data = await response.json();
        const generatedText = data.choices?.[0]?.message?.content;

        if (!generatedText) {
          lastError = `${model}: empty response`;
          continue; // Try next model
        }

        return new Response(JSON.stringify({ explanation: generatedText }), { status: 200, headers: corsHeaders });

      } catch (err: any) {
        lastError = `${model}: ${err.message}`;
        continue; // Try next model
      }
    }

    // All models failed
    throw new Error(`Semua model AI gagal. Terakhir: ${lastError}. Coba lagi beberapa saat.`);

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500, headers: corsHeaders });
  }
};

// CORS preflight
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
