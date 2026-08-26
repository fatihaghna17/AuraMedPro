import type { Handler, HandlerEvent } from '@netlify/functions';

// Simple in-memory rate limiting (Note: in serverless this resets per cold start, 
// but sufficient for basic demo/abuse prevention as requested)
const rateLimitCache = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export const handler: Handler = async (event: HandlerEvent) => {
  // CORS Headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  // Rate Limiting Check
  const clientIp = event.headers['x-nf-client-connection-ip'] || 'unknown';
  const now = Date.now();
  const clientLimit = rateLimitCache.get(clientIp);

  if (clientLimit) {
    if (now > clientLimit.resetAt) {
      rateLimitCache.set(clientIp, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    } else {
      if (clientLimit.count >= RATE_LIMIT_MAX) {
        return {
          statusCode: 429,
          headers,
          body: JSON.stringify({ error: 'Rate limit exceeded. Coba lagi nanti.' })
        };
      }
      clientLimit.count++;
    }
  } else {
    rateLimitCache.set(clientIp, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  }

  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      throw new Error('Server configuration error: Missing API Key');
    }

    const { question, correctAnswer, explanation, userAnswer, context, mode, followUp } = JSON.parse(event.body || '{}');

    if (!question || !mode) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    const systemInstruction = "Kamu adalah tutor medis virtual bernama MediAI di platform AuraMedPro. Jelaskan konsep kedokteran dalam Bahasa Indonesia yang jelas. Gunakan format markdown. Maks 300 kata.";
    
    let userPrompt = "";
    const baseContext = `Konteks/Topik: ${context || 'Kedokteran Umum'}\nPertanyaan: ${question}\nJawaban Benar: ${correctAnswer}\nPembahasan Resmi: ${explanation || '-'}\nJawaban User: ${userAnswer || '-'}\n\n`;

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

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemInstruction }]
        },
        contents: [
          {
            parts: [{ text: userPrompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API Error:', response.status, errText);
      // Return actual Gemini error for debugging
      throw new Error(`Gemini API ${response.status}: ${errText.substring(0, 200)}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, AI tidak dapat menghasilkan penjelasan saat ini.";

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ explanation: generatedText })
    };

  } catch (error: any) {
    console.error('AI Function Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'Internal Server Error' })
    };
  }
};
