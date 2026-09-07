var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// api/achievements.ts
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};
var onRequestOptions = /* @__PURE__ */ __name(async () => {
  return new Response(null, { headers: corsHeaders });
}, "onRequestOptions");
var onRequestGet = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const userId = url.searchParams.get("user_id");
  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Database D1 belum terhubung" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
  if (!userId) {
    return new Response(JSON.stringify({ error: "user_id wajib disertakan" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
  try {
    const { results } = await env.DB.prepare(
      "SELECT achievement_id FROM user_achievements WHERE user_id = ?"
    ).bind(userId).all();
    return new Response(JSON.stringify({ data: results || [] }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}, "onRequestGet");
var onRequestPost = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Database D1 belum terhubung" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
  try {
    const body = await request.json();
    const { user_id, achievement_id } = body;
    if (!user_id || !achievement_id) {
      return new Response(JSON.stringify({ error: "user_id dan achievement_id wajib diisi" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await env.DB.prepare(`
      INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
      VALUES (?, ?, ?)
      ON CONFLICT(user_id, achievement_id) DO NOTHING
    `).bind(user_id, achievement_id, now).run();
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}, "onRequestPost");

// api/ai-explain.ts
var rateLimitCache = /* @__PURE__ */ new Map();
var RATE_LIMIT_MAX = 20;
var RATE_LIMIT_WINDOW_MS = 60 * 60 * 1e3;
var MODEL_FALLBACK = [
  "auto/best-free",
  "auto/best-chat",
  "auto/fast",
  "aug/gemini-3.1-pro-preview",
  "aug/glm-5.2",
  "oc/deepseek-v4-flash-free",
  "aug/haiku4.5",
  "aug/sonnet4.5"
];
var onRequestPost2 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const corsHeaders10 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };
  try {
    if (!env.OMNIROUTE_API_KEY || !env.OMNIROUTE_BASE_URL) {
      throw new Error("Server configuration error: Missing OMNIROUTE_API_KEY or OMNIROUTE_BASE_URL");
    }
    const { question, correctAnswer, explanation, userAnswer, context: ctx, mode, followUp } = await request.json();
    if (!question || !mode) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers: corsHeaders10 });
    }
    const clientIp = request.headers.get("CF-Connecting-IP") || "unknown";
    const now = Date.now();
    const clientLimit = rateLimitCache.get(clientIp);
    if (clientLimit) {
      if (now > clientLimit.resetAt) {
        rateLimitCache.set(clientIp, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
      } else {
        if (clientLimit.count >= RATE_LIMIT_MAX) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Coba lagi nanti." }), { status: 429, headers: corsHeaders10 });
        }
        clientLimit.count++;
      }
    } else {
      rateLimitCache.set(clientIp, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    }
    const systemMessage = "Kamu adalah tutor medis virtual bernama MediAI di platform AuraMedPro. Jelaskan konsep kedokteran dalam Bahasa Indonesia yang jelas. Gunakan format markdown. Maks 300 kata.";
    let userPrompt = "";
    const baseContext = `Konteks/Topik: ${ctx || "Kedokteran Umum"}
Pertanyaan: ${question}
Jawaban Benar: ${correctAnswer}
Pembahasan Resmi: ${explanation || "-"}
Jawaban User: ${userAnswer || "-"}

`;
    switch (mode) {
      case "explain":
        userPrompt = `${baseContext}Tolong jelaskan konsep di balik soal ini dan mengapa '${correctAnswer}' adalah jawaban yang paling tepat.`;
        break;
      case "clarify":
        userPrompt = `${baseContext}Pertanyaan Lanjutan dari user: "${followUp}"
Tolong jawab pertanyaan lanjutan tersebut berdasarkan konteks soal di atas.`;
        break;
      case "mnemonic":
        userPrompt = `${baseContext}Tolong buatkan jembatan keledai (mnemonic) yang mudah diingat untuk menghafal konsep utama dari soal ini.`;
        break;
      case "compare":
        userPrompt = `${baseContext}Tolong bandingkan jawaban benar ('${correctAnswer}') dengan jawaban yang dipilih user ('${userAnswer}'). Jelaskan mengapa jawaban user kurang tepat dibandingkan jawaban benar.`;
        break;
      default:
        userPrompt = `${baseContext}Berikan penjelasan singkat.`;
    }
    const baseUrl = env.OMNIROUTE_BASE_URL.replace(/\/+$/, "");
    const endpoint = `${baseUrl}/chat/completions`;
    let lastError = "";
    for (const model of MODEL_FALLBACK) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${env.OMNIROUTE_API_KEY}`
          },
          body: JSON.stringify({
            model,
            stream: false,
            messages: [
              { role: "system", content: systemMessage },
              { role: "user", content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 800
          })
        });
        if (!response.ok) {
          const errText = await response.text();
          lastError = `${model}: ${response.status} ${errText.substring(0, 100)}`;
          continue;
        }
        const data = await response.json();
        const generatedText = data.choices?.[0]?.message?.content;
        if (!generatedText) {
          lastError = `${model}: empty response`;
          continue;
        }
        return new Response(JSON.stringify({ explanation: generatedText }), { status: 200, headers: corsHeaders10 });
      } catch (err) {
        lastError = `${model}: ${err.message}`;
        continue;
      }
    }
    throw new Error(`Semua model AI gagal. Terakhir: ${lastError}. Coba lagi beberapa saat.`);
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), { status: 500, headers: corsHeaders10 });
  }
}, "onRequestPost");
var onRequestOptions2 = /* @__PURE__ */ __name(async () => {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400"
    }
  });
}, "onRequestOptions");

// api/app-settings.ts
var corsHeaders2 = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};
var onRequestOptions3 = /* @__PURE__ */ __name(async () => {
  return new Response(null, { headers: corsHeaders2 });
}, "onRequestOptions");
var onRequestGet2 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const key = url.searchParams.get("key");
  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Database D1 belum terhubung" }), {
      status: 500,
      headers: { ...corsHeaders2, "Content-Type": "application/json" }
    });
  }
  try {
    if (key) {
      const row = await env.DB.prepare("SELECT value FROM app_settings WHERE key = ?").bind(key).first();
      let parsed = null;
      if (row?.value) {
        try {
          parsed = JSON.parse(row.value);
        } catch {
          parsed = row.value;
        }
      }
      return new Response(JSON.stringify({ data: parsed }), {
        status: 200,
        headers: { ...corsHeaders2, "Content-Type": "application/json" }
      });
    }
    const { results } = await env.DB.prepare("SELECT key, value FROM app_settings").all();
    const map = {};
    (results || []).forEach((r) => {
      try {
        map[r.key] = JSON.parse(r.value);
      } catch {
        map[r.key] = r.value;
      }
    });
    return new Response(JSON.stringify({ data: map }), {
      status: 200,
      headers: { ...corsHeaders2, "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders2, "Content-Type": "application/json" }
    });
  }
}, "onRequestGet");
var onRequestPost3 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Database D1 belum terhubung" }), {
      status: 500,
      headers: { ...corsHeaders2, "Content-Type": "application/json" }
    });
  }
  try {
    const body = await request.json();
    const { key, value } = body;
    if (!key) {
      return new Response(JSON.stringify({ error: "key wajib diisi" }), {
        status: 400,
        headers: { ...corsHeaders2, "Content-Type": "application/json" }
      });
    }
    const valStr = typeof value === "object" ? JSON.stringify(value) : String(value);
    await env.DB.prepare(`
      INSERT INTO app_settings (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).bind(key, valStr).run();
    return new Response(JSON.stringify({ success: true, key }), {
      status: 200,
      headers: { ...corsHeaders2, "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders2, "Content-Type": "application/json" }
    });
  }
}, "onRequestPost");

// api/delete-question.ts
var onRequestPost4 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const corsHeaders10 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };
  try {
    if (env.R2_SECRET_TOKEN) {
      const authHeader = request.headers.get("Authorization") || "";
      if (authHeader !== `Bearer ${env.R2_SECRET_TOKEN}`) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders10 });
      }
    }
    const { key } = await request.json();
    if (!key) {
      return new Response(JSON.stringify({ error: "Key is required" }), { status: 400, headers: corsHeaders10 });
    }
    await env.QUESTIONS_BUCKET.delete(key);
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders10 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || "Failed to delete" }), { status: 500, headers: corsHeaders10 });
  }
}, "onRequestPost");
var onRequestOptions4 = /* @__PURE__ */ __name(async () => {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400"
    }
  });
}, "onRequestOptions");

// api/leaderboard.ts
var corsHeaders3 = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};
var onRequestOptions5 = /* @__PURE__ */ __name(async () => {
  return new Response(null, { headers: corsHeaders3 });
}, "onRequestOptions");
var onRequestGet3 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const type = url.searchParams.get("type") || "global";
  const filter = url.searchParams.get("filter") || "all";
  const fileName = url.searchParams.get("file_name");
  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Database D1 belum terhubung" }), {
      status: 500,
      headers: { ...corsHeaders3, "Content-Type": "application/json" }
    });
  }
  try {
    if (type === "global") {
      if (filter === "all") {
        const { results } = await env.DB.prepare(`
          SELECT id, username, total_questions_answered, level
          FROM profiles
          WHERE total_questions_answered > 0
          ORDER BY total_questions_answered DESC
          LIMIT 100
        `).all();
        return new Response(JSON.stringify({ data: results || [] }), {
          status: 200,
          headers: { ...corsHeaders3, "Content-Type": "application/json" }
        });
      } else {
        const WIB_OFFSET_MS = 7 * 60 * 60 * 1e3;
        const nowWib = new Date(Date.now() + WIB_OFFSET_MS);
        const y = nowWib.getUTCFullYear();
        const m = nowWib.getUTCMonth();
        const d = nowWib.getUTCDate();
        const day = nowWib.getUTCDay();
        let cutoffMs;
        if (filter === "1") {
          cutoffMs = Date.UTC(y, m, d, 0, 0, 0);
        } else if (filter === "7") {
          const diffToMon = day === 0 ? 6 : day - 1;
          cutoffMs = Date.UTC(y, m, d - diffToMon, 0, 0, 0);
        } else {
          cutoffMs = Date.UTC(y, m, 1, 0, 0, 0);
        }
        const cutoffIso = new Date(cutoffMs - WIB_OFFSET_MS).toISOString();
        const { results } = await env.DB.prepare(`
          SELECT 
            p.id, 
            p.username, 
            p.level, 
            SUM(qhl.correct_count) as total_questions_answered
          FROM quiz_history_logs qhl
          JOIN profiles p ON qhl.user_id = p.id
          WHERE qhl.created_at >= ?
          GROUP BY p.id, p.username, p.level
          ORDER BY total_questions_answered DESC
          LIMIT 100
        `).bind(cutoffIso).all();
        return new Response(JSON.stringify({ data: results || [] }), {
          status: 200,
          headers: { ...corsHeaders3, "Content-Type": "application/json" }
        });
      }
    }
    if (type === "file") {
      if (!fileName) {
        return new Response(JSON.stringify({ data: [] }), {
          status: 200,
          headers: { ...corsHeaders3, "Content-Type": "application/json" }
        });
      }
      let query = `
        SELECT 
          l.user_id,
          l.score,
          l.questions_count,
          l.created_at,
          p.username,
          p.level
        FROM leaderboard l
        JOIN profiles p ON l.user_id = p.id
        WHERE l.file_name = ?
      `;
      const binds = [fileName];
      if (filter !== "all") {
        const WIB_OFFSET_MS = 7 * 60 * 60 * 1e3;
        const nowWib = new Date(Date.now() + WIB_OFFSET_MS);
        const y = nowWib.getUTCFullYear();
        const m = nowWib.getUTCMonth();
        const d = nowWib.getUTCDate();
        const day = nowWib.getUTCDay();
        let cutoffMs;
        if (filter === "1") {
          cutoffMs = Date.UTC(y, m, d, 0, 0, 0);
        } else if (filter === "7") {
          const diffToMon = day === 0 ? 6 : day - 1;
          cutoffMs = Date.UTC(y, m, d - diffToMon, 0, 0, 0);
        } else {
          cutoffMs = Date.UTC(y, m, 1, 0, 0, 0);
        }
        const cutoffIso = new Date(cutoffMs - WIB_OFFSET_MS).toISOString();
        query += " AND l.created_at >= ?";
        binds.push(cutoffIso);
      }
      query += " ORDER BY l.score DESC, l.questions_count DESC LIMIT 100";
      const { results } = await env.DB.prepare(query).bind(...binds).all();
      return new Response(JSON.stringify({ data: results || [] }), {
        status: 200,
        headers: { ...corsHeaders3, "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify({ error: "Invalid type parameter" }), {
      status: 400,
      headers: { ...corsHeaders3, "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders3, "Content-Type": "application/json" }
    });
  }
}, "onRequestGet");
var onRequestPost5 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Database D1 belum terhubung" }), {
      status: 500,
      headers: { ...corsHeaders3, "Content-Type": "application/json" }
    });
  }
  try {
    const body = await request.json();
    const { user_id, file_name, score, correct_count, total_count, time_spent } = body;
    if (!user_id || !file_name) {
      return new Response(JSON.stringify({ error: "user_id dan file_name wajib diisi" }), {
        status: 400,
        headers: { ...corsHeaders3, "Content-Type": "application/json" }
      });
    }
    const logId = crypto.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await env.DB.prepare(`
      INSERT INTO quiz_history_logs (id, user_id, file_name, score, correct_count, total_count, time_spent, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      logId,
      user_id,
      file_name,
      score || 0,
      correct_count || 0,
      total_count || 0,
      time_spent || 0,
      now
    ).run();
    const existing = await env.DB.prepare(`
      SELECT score, questions_count FROM leaderboard WHERE user_id = ? AND file_name = ?
    `).bind(user_id, file_name).first();
    if (existing) {
      if ((score || 0) > existing.score || (total_count || 0) > existing.questions_count) {
        await env.DB.prepare(`
          UPDATE leaderboard 
          SET score = ?, questions_count = ?, created_at = ?
          WHERE user_id = ? AND file_name = ?
        `).bind(
          Math.max(score || 0, existing.score),
          Math.max(total_count || 0, existing.questions_count),
          now,
          user_id,
          file_name
        ).run();
      }
    } else {
      const leaderId = crypto.randomUUID();
      await env.DB.prepare(`
        INSERT INTO leaderboard (id, user_id, file_name, score, questions_count, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(leaderId, user_id, file_name, score || 0, total_count || 0, now).run();
    }
    if (correct_count > 0) {
      await env.DB.prepare(`
        UPDATE profiles
        SET total_questions_answered = total_questions_answered + ?
        WHERE id = ?
      `).bind(correct_count, user_id).run();
    }
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders3, "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders3, "Content-Type": "application/json" }
    });
  }
}, "onRequestPost");

// api/notes.ts
var corsHeaders4 = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};
var onRequestOptions6 = /* @__PURE__ */ __name(async () => {
  return new Response(null, { headers: corsHeaders4 });
}, "onRequestOptions");
var onRequestGet4 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const userId = url.searchParams.get("user_id");
  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Database D1 belum terhubung" }), {
      status: 500,
      headers: { ...corsHeaders4, "Content-Type": "application/json" }
    });
  }
  if (!userId) {
    return new Response(JSON.stringify({ error: "user_id wajib disertakan" }), {
      status: 400,
      headers: { ...corsHeaders4, "Content-Type": "application/json" }
    });
  }
  try {
    const { results } = await env.DB.prepare(
      "SELECT question_text, note_content FROM answer_notes WHERE user_id = ?"
    ).bind(userId).all();
    return new Response(JSON.stringify({ data: results || [] }), {
      status: 200,
      headers: { ...corsHeaders4, "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders4, "Content-Type": "application/json" }
    });
  }
}, "onRequestGet");
var onRequestPost6 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Database D1 belum terhubung" }), {
      status: 500,
      headers: { ...corsHeaders4, "Content-Type": "application/json" }
    });
  }
  try {
    const body = await request.json();
    const { user_id, question_text, note_content } = body;
    if (!user_id || !question_text || !note_content) {
      return new Response(JSON.stringify({ error: "user_id, question_text, dan note_content wajib diisi" }), {
        status: 400,
        headers: { ...corsHeaders4, "Content-Type": "application/json" }
      });
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await env.DB.prepare(`
      INSERT INTO answer_notes (user_id, question_text, note_content, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id, question_text) DO UPDATE SET
        note_content = excluded.note_content,
        updated_at = excluded.updated_at
    `).bind(user_id, question_text, note_content, now).run();
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders4, "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders4, "Content-Type": "application/json" }
    });
  }
}, "onRequestPost");

// api/profiles.ts
var corsHeaders5 = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};
var onRequestOptions7 = /* @__PURE__ */ __name(async () => {
  return new Response(null, { headers: corsHeaders5 });
}, "onRequestOptions");
var onRequestGet5 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const username = url.searchParams.get("username");
  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Database D1 belum terhubung" }), {
      status: 500,
      headers: { ...corsHeaders5, "Content-Type": "application/json" }
    });
  }
  try {
    if (id) {
      const profile = await env.DB.prepare("SELECT * FROM profiles WHERE id = ?").bind(id).first();
      return new Response(JSON.stringify({ data: profile || null }), {
        status: 200,
        headers: { ...corsHeaders5, "Content-Type": "application/json" }
      });
    }
    if (username) {
      const profile = await env.DB.prepare("SELECT * FROM profiles WHERE username = ?").bind(username).first();
      return new Response(JSON.stringify({ data: profile || null }), {
        status: 200,
        headers: { ...corsHeaders5, "Content-Type": "application/json" }
      });
    }
    const { results } = await env.DB.prepare("SELECT * FROM profiles ORDER BY xp DESC LIMIT 100").all();
    return new Response(JSON.stringify({ data: results || [] }), {
      status: 200,
      headers: { ...corsHeaders5, "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders5, "Content-Type": "application/json" }
    });
  }
}, "onRequestGet");
var onRequestPost7 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Database D1 belum terhubung" }), {
      status: 500,
      headers: { ...corsHeaders5, "Content-Type": "application/json" }
    });
  }
  try {
    const body = await request.json();
    const { id, username, role, xp, streak, level, total_questions_answered, last_active } = body;
    if (!id || !username) {
      return new Response(JSON.stringify({ error: "ID dan username wajib diisi" }), {
        status: 400,
        headers: { ...corsHeaders5, "Content-Type": "application/json" }
      });
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await env.DB.prepare(`
      INSERT INTO profiles (id, username, role, xp, streak, level, total_questions_answered, last_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        username = coalesce(excluded.username, profiles.username),
        role = coalesce(excluded.role, profiles.role),
        xp = coalesce(excluded.xp, profiles.xp),
        streak = coalesce(excluded.streak, profiles.streak),
        level = coalesce(excluded.level, profiles.level),
        total_questions_answered = coalesce(excluded.total_questions_answered, profiles.total_questions_answered),
        last_active = excluded.last_active
    `).bind(
      id,
      username,
      role || "user",
      xp !== void 0 ? xp : 0,
      streak !== void 0 ? streak : 0,
      level !== void 0 ? level : 1,
      total_questions_answered !== void 0 ? total_questions_answered : 0,
      last_active || now,
      now
    ).run();
    const saved = await env.DB.prepare("SELECT * FROM profiles WHERE id = ?").bind(id).first();
    return new Response(JSON.stringify({ data: saved }), {
      status: 200,
      headers: { ...corsHeaders5, "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders5, "Content-Type": "application/json" }
    });
  }
}, "onRequestPost");

// api/question-banks.ts
var corsHeaders6 = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS"
};
var onRequestOptions8 = /* @__PURE__ */ __name(async () => {
  return new Response(null, { headers: corsHeaders6 });
}, "onRequestOptions");
var onRequestGet6 = /* @__PURE__ */ __name(async (context) => {
  const { env } = context;
  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Database D1 belum terhubung" }), {
      status: 500,
      headers: { ...corsHeaders6, "Content-Type": "application/json" }
    });
  }
  try {
    const { results } = await env.DB.prepare(`
      SELECT 
        qb.id, 
        qb.name, 
        qb.user_id, 
        qb.r2_key, 
        qb.r2_url,
        CASE WHEN qb.questions_json = 'null' THEN NULL ELSE qb.questions_json END as questions_json,
        qb.created_at,
        p.username as uploader_username
      FROM question_banks qb
      LEFT JOIN profiles p ON qb.user_id = p.id
      ORDER BY qb.name ASC
    `).all();
    return new Response(JSON.stringify({ data: results || [] }), {
      status: 200,
      headers: { ...corsHeaders6, "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders6, "Content-Type": "application/json" }
    });
  }
}, "onRequestGet");
var onRequestPost8 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Database D1 belum terhubung" }), {
      status: 500,
      headers: { ...corsHeaders6, "Content-Type": "application/json" }
    });
  }
  try {
    const body = await request.json();
    const { name, user_id, r2_key, r2_url, questions_json } = body;
    if (!name || !user_id) {
      return new Response(JSON.stringify({ error: "Name dan user_id wajib diisi" }), {
        status: 400,
        headers: { ...corsHeaders6, "Content-Type": "application/json" }
      });
    }
    const id = body.id || crypto.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await env.DB.prepare(`
      INSERT INTO question_banks (id, name, user_id, r2_key, r2_url, questions_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(name) DO UPDATE SET
        user_id = excluded.user_id,
        r2_key = coalesce(excluded.r2_key, question_banks.r2_key),
        r2_url = coalesce(excluded.r2_url, question_banks.r2_url),
        questions_json = coalesce(excluded.questions_json, question_banks.questions_json)
    `).bind(
      id,
      name,
      user_id,
      r2_key || null,
      r2_url || null,
      questions_json && typeof questions_json === "object" ? JSON.stringify(questions_json) : questions_json || null,
      now
    ).run();
    return new Response(JSON.stringify({ success: true, name }), {
      status: 200,
      headers: { ...corsHeaders6, "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders6, "Content-Type": "application/json" }
    });
  }
}, "onRequestPost");
var onRequestDelete = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const name = url.searchParams.get("name");
  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Database D1 belum terhubung" }), {
      status: 500,
      headers: { ...corsHeaders6, "Content-Type": "application/json" }
    });
  }
  if (!name) {
    return new Response(JSON.stringify({ error: "Parameter name wajib diisi" }), {
      status: 400,
      headers: { ...corsHeaders6, "Content-Type": "application/json" }
    });
  }
  try {
    const row = await env.DB.prepare("SELECT r2_key FROM question_banks WHERE name = ?").bind(name).first();
    if (row?.r2_key && env.QUESTIONS_BUCKET) {
      try {
        await env.QUESTIONS_BUCKET.delete(row.r2_key);
      } catch (e) {
        console.warn("Gagal menghapus file dari R2:", e);
      }
    }
    await env.DB.prepare("DELETE FROM question_banks WHERE name = ?").bind(name).run();
    return new Response(JSON.stringify({ success: true, deleted: name }), {
      status: 200,
      headers: { ...corsHeaders6, "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders6, "Content-Type": "application/json" }
    });
  }
}, "onRequestDelete");

// api/question-reports.ts
var corsHeaders7 = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
var onRequestOptions9 = /* @__PURE__ */ __name(async () => {
  return new Response(null, { headers: corsHeaders7 });
}, "onRequestOptions");
var onRequestPost9 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Database D1 belum terhubung" }), {
      status: 500,
      headers: { ...corsHeaders7, "Content-Type": "application/json" }
    });
  }
  try {
    const body = await request.json();
    const { user_id, question_id, reason, details } = body;
    if (!user_id || !reason) {
      return new Response(JSON.stringify({ error: "user_id dan reason wajib diisi" }), {
        status: 400,
        headers: { ...corsHeaders7, "Content-Type": "application/json" }
      });
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await env.DB.prepare(`
      INSERT INTO question_reports (user_id, question_id, reason, details, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(user_id, question_id || null, reason, details || null, now).run();
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders7, "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders7, "Content-Type": "application/json" }
    });
  }
}, "onRequestPost");

// api/quiz-sessions.ts
var corsHeaders8 = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS"
};
var onRequestOptions10 = /* @__PURE__ */ __name(async () => {
  return new Response(null, { headers: corsHeaders8 });
}, "onRequestOptions");
var onRequestGet7 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const userId = url.searchParams.get("user_id");
  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Database D1 belum terhubung" }), {
      status: 500,
      headers: { ...corsHeaders8, "Content-Type": "application/json" }
    });
  }
  if (!userId) {
    return new Response(JSON.stringify({ error: "user_id wajib disertakan" }), {
      status: 400,
      headers: { ...corsHeaders8, "Content-Type": "application/json" }
    });
  }
  try {
    const session = await env.DB.prepare("SELECT * FROM quiz_sessions WHERE user_id = ?").bind(userId).first();
    if (!session) {
      return new Response(JSON.stringify({ data: null }), {
        status: 200,
        headers: { ...corsHeaders8, "Content-Type": "application/json" }
      });
    }
    let parsed = null;
    try {
      parsed = typeof session.current_quiz_json === "string" ? JSON.parse(session.current_quiz_json) : session.current_quiz_json;
    } catch {
      parsed = session.current_quiz_json;
    }
    return new Response(JSON.stringify({ data: { ...session, current_quiz_json: parsed } }), {
      status: 200,
      headers: { ...corsHeaders8, "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders8, "Content-Type": "application/json" }
    });
  }
}, "onRequestGet");
var onRequestPost10 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Database D1 belum terhubung" }), {
      status: 500,
      headers: { ...corsHeaders8, "Content-Type": "application/json" }
    });
  }
  try {
    const body = await request.json();
    const { user_id, current_quiz_json } = body;
    if (!user_id || current_quiz_json === void 0) {
      return new Response(JSON.stringify({ error: "user_id dan current_quiz_json wajib diisi" }), {
        status: 400,
        headers: { ...corsHeaders8, "Content-Type": "application/json" }
      });
    }
    const jsonStr = typeof current_quiz_json === "object" ? JSON.stringify(current_quiz_json) : String(current_quiz_json);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await env.DB.prepare(`
      INSERT INTO quiz_sessions (user_id, current_quiz_json, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        current_quiz_json = excluded.current_quiz_json,
        updated_at = excluded.updated_at
    `).bind(user_id, jsonStr, now).run();
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders8, "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders8, "Content-Type": "application/json" }
    });
  }
}, "onRequestPost");
var onRequestDelete2 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const userId = url.searchParams.get("user_id");
  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Database D1 belum terhubung" }), {
      status: 500,
      headers: { ...corsHeaders8, "Content-Type": "application/json" }
    });
  }
  if (!userId) {
    return new Response(JSON.stringify({ error: "user_id wajib disertakan" }), {
      status: 400,
      headers: { ...corsHeaders8, "Content-Type": "application/json" }
    });
  }
  try {
    await env.DB.prepare("DELETE FROM quiz_sessions WHERE user_id = ?").bind(userId).run();
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders8, "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders8, "Content-Type": "application/json" }
    });
  }
}, "onRequestDelete");

// api/r2-questions.ts
var corsHeaders9 = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, OPTIONS"
};
var onRequestOptions11 = /* @__PURE__ */ __name(async () => {
  return new Response(null, { headers: corsHeaders9 });
}, "onRequestOptions");
var onRequestGet8 = /* @__PURE__ */ __name(async (context) => {
  const { env } = context;
  const url = new URL(context.request.url);
  const key = url.searchParams.get("key");
  if (!key) {
    return new Response(JSON.stringify({ error: "Parameter key wajib diisi" }), {
      status: 400,
      headers: { ...corsHeaders9, "Content-Type": "application/json" }
    });
  }
  if (!env.QUESTIONS_BUCKET) {
    return new Response(JSON.stringify({ error: "R2 bucket belum terhubung" }), {
      status: 500,
      headers: { ...corsHeaders9, "Content-Type": "application/json" }
    });
  }
  try {
    const object = await env.QUESTIONS_BUCKET.get(key);
    if (!object) {
      return new Response(JSON.stringify({ error: "File tidak ditemukan" }), {
        status: 404,
        headers: { ...corsHeaders9, "Content-Type": "application/json" }
      });
    }
    const body = await object.text();
    return new Response(body, {
      status: 200,
      headers: {
        ...corsHeaders9,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600"
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders9, "Content-Type": "application/json" }
    });
  }
}, "onRequestGet");

// api/upload-question.ts
var onRequestPost11 = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const corsHeaders10 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };
  try {
    const { filename, content } = await request.json();
    if (!filename || !content) {
      return new Response(JSON.stringify({ error: "Filename and content are required" }), { status: 400, headers: corsHeaders10 });
    }
    const sanitizedFilename = filename.replace(/^.*[\\/]/, "").replace(/[^a-zA-Z0-9.\-_]/g, "_");
    await env.QUESTIONS_BUCKET.put(sanitizedFilename, JSON.stringify(content), {
      httpMetadata: { contentType: "application/json" }
    });
    const cleanBaseUrl = env.R2_PUBLIC_URL.replace(/\/+$/, "");
    const fileUrl = `${cleanBaseUrl}/${sanitizedFilename}`;
    return new Response(JSON.stringify({ fileUrl, key: sanitizedFilename }), { status: 200, headers: corsHeaders10 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || "Failed to upload" }), { status: 500, headers: corsHeaders10 });
  }
}, "onRequestPost");
var onRequestOptions12 = /* @__PURE__ */ __name(async () => {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400"
    }
  });
}, "onRequestOptions");

// ../.wrangler/tmp/pages-f3keRF/functionsRoutes-0.9166046342741275.mjs
var routes = [
  {
    routePath: "/api/achievements",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/achievements",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions]
  },
  {
    routePath: "/api/achievements",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/ai-explain",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions2]
  },
  {
    routePath: "/api/ai-explain",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost2]
  },
  {
    routePath: "/api/app-settings",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet2]
  },
  {
    routePath: "/api/app-settings",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions3]
  },
  {
    routePath: "/api/app-settings",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost3]
  },
  {
    routePath: "/api/delete-question",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions4]
  },
  {
    routePath: "/api/delete-question",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost4]
  },
  {
    routePath: "/api/leaderboard",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet3]
  },
  {
    routePath: "/api/leaderboard",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions5]
  },
  {
    routePath: "/api/leaderboard",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost5]
  },
  {
    routePath: "/api/notes",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet4]
  },
  {
    routePath: "/api/notes",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions6]
  },
  {
    routePath: "/api/notes",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost6]
  },
  {
    routePath: "/api/profiles",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet5]
  },
  {
    routePath: "/api/profiles",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions7]
  },
  {
    routePath: "/api/profiles",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost7]
  },
  {
    routePath: "/api/question-banks",
    mountPath: "/api",
    method: "DELETE",
    middlewares: [],
    modules: [onRequestDelete]
  },
  {
    routePath: "/api/question-banks",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet6]
  },
  {
    routePath: "/api/question-banks",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions8]
  },
  {
    routePath: "/api/question-banks",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost8]
  },
  {
    routePath: "/api/question-reports",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions9]
  },
  {
    routePath: "/api/question-reports",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost9]
  },
  {
    routePath: "/api/quiz-sessions",
    mountPath: "/api",
    method: "DELETE",
    middlewares: [],
    modules: [onRequestDelete2]
  },
  {
    routePath: "/api/quiz-sessions",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet7]
  },
  {
    routePath: "/api/quiz-sessions",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions10]
  },
  {
    routePath: "/api/quiz-sessions",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost10]
  },
  {
    routePath: "/api/r2-questions",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet8]
  },
  {
    routePath: "/api/r2-questions",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions11]
  },
  {
    routePath: "/api/upload-question",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions12]
  },
  {
    routePath: "/api/upload-question",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost11]
  }
];

// ../../../.npm/_npx/32026684e21afda6/node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
export {
  pages_template_worker_default as default
};
