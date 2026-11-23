interface Env {
  DB: D1Database;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Cache-Control': 'no-store, no-cache, must-revalidate',
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: corsHeaders });
};

let tablesInitialized = false;

async function ensureUserSyncTables(db: D1Database) {
  if (tablesInitialized) return;
  try {
    await db.batch([
      db.prepare(`
        CREATE TABLE IF NOT EXISTS user_settings (
          user_id TEXT PRIMARY KEY,
          settings_json TEXT NOT NULL,
          updated_at TEXT DEFAULT (datetime('now'))
        )
      `),
      db.prepare(`
        CREATE TABLE IF NOT EXISTS user_quiz_history (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          entry_id INTEGER NOT NULL,
          entry_json TEXT NOT NULL,
          is_deleted INTEGER DEFAULT 0,
          created_at TEXT DEFAULT (datetime('now')),
          UNIQUE(user_id, entry_id)
        )
      `),
      db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_user_quiz_history_user
        ON user_quiz_history(user_id, entry_id DESC)
      `),
    ]);
    tablesInitialized = true;
  } catch (err) {
    console.warn('[user-sync] Table initialization warning:', err);
  }
}

// Seed default folder organization for axon if not yet synced from laptop
const AXON_USER_ID = '83c7b725-713b-44d6-aa65-e32101ab6160';
const AXON_INITIAL_SETTINGS = {
  customFolders: ['3.1', 'UB 3.3', '3.4', 'COURSE 3', 'UB 3.1'],
  quizFolderMap: {
    'UB 3.1 Acromio (modifan).json': '3.1',
    'UB ACRO.json': '3.1',
    'K1 3.3.json': 'UB 3.3',
    'K2 3.3.json': 'UB 3.3',
    'K3 3.3.json': 'UB 3.3',
    'K4 3.3.json': 'UB 3.3',
    'K5 3.3.json': 'UB 3.3',
    'K6 3.3.json': 'UB 3.3',
    'K7 3.3.json': 'UB 3.3',
    'UB 3.3 gemini .json': 'UB 3.3',
    'UB 3.3/gemini-code-1794117933101.json': 'UB 3.3',
    'UB 3.3/gemini-code-1794119078319.json': 'UB 3.3',
    'azyt 3.3.json': 'UB 3.3',
    'K10 3.4 .json': '3.4',
    'K12 JAMUR 3.4.json': '3.4',
    'K3 3.4 2.json': '3.4',
    'K3_3.4.json': '3.4',
    'K5 3.4.json': '3.4',
    'K6 3.4.json': '3.4',
    'Parasit 2 pretest 2.json': '3.4',
    'bank_soal_parasitologi_blok_3_4_200_soal.json': '3.4',
    'C3 K3.json': 'COURSE 3',
    'C3 K8.json': 'COURSE 3',
    'c3 k2.json': 'COURSE 3',
    'c3 k4.json': 'COURSE 3',
    'c3 k6.json': 'COURSE 3',
    'c3 k7.json': 'COURSE 3',
    'c3 k9.json': 'COURSE 3',
    'Acro 3.1 modified + clarify all ppt.json': 'UB 3.1',
    'Azyt 41 31 + remed (clarify + kurasi).json': 'UB 3.1',
    'costra  mix 31 41 clarify + kurasi.json': 'UB 3.1',
  },
  parentFolders: [],
  folderParentMap: {},
  minimizedFolders: {
    '3.1': true,
    'UB 3.3': true,
    'UB 3.1': true,
  },
  avatarFrame: 'demon_king_100',
  suddenDeathBest: 100,
  isSeededDefault: true,
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const userId = url.searchParams.get('user_id');

  if (!env.DB) {
    return new Response(JSON.stringify({ error: 'Database D1 belum terhubung' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!userId) {
    return new Response(JSON.stringify({ error: 'user_id wajib disertakan' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  await ensureUserSyncTables(env.DB);

  try {
    // 1. Ambil pengaturan folder & preferensi personal user
    const settingsRow = (await env.DB.prepare(
      'SELECT settings_json, updated_at FROM user_settings WHERE user_id = ?'
    )
      .bind(userId)
      .first()) as any;

    let settings: any = null;
    if (settingsRow?.settings_json) {
      try {
        settings = JSON.parse(settingsRow.settings_json);
        if (settings && typeof settings === 'object') {
          settings.updated_at = settingsRow.updated_at;
        }
      } catch {
        settings = null;
      }
    } else if (userId === AXON_USER_ID) {
      const now = new Date().toISOString();
      settings = { ...AXON_INITIAL_SETTINGS, updated_at: now };
      await env.DB.prepare(`
        INSERT OR IGNORE INTO user_settings (user_id, settings_json, updated_at)
        VALUES (?, ?, ?)
      `)
        .bind(userId, JSON.stringify(AXON_INITIAL_SETTINGS), now)
        .run();
    }

    const historyClearedAtMs = settings?.historyClearedAt
      ? new Date(settings.historyClearedAt).getTime()
      : 0;

    // 2. Ambil riwayat kuis tersinkron dari user_quiz_history
    const { results: historyRows } = await env.DB.prepare(`
      SELECT entry_id, entry_json, is_deleted, created_at
      FROM user_quiz_history
      WHERE user_id = ?
      ORDER BY entry_id DESC
      LIMIT 150
    `)
      .bind(userId)
      .all();

    const activeHistory: any[] = [];
    const deletedHistoryIds: number[] = [];
    const allKnownTimestamps: { timeMs: number; score: number; total: number; files: string[] }[] = [];

    for (const row of (historyRows || []) as any[]) {
      const entryId = Number(row.entry_id);
      if (row.is_deleted) {
        deletedHistoryIds.push(entryId);
        try {
          const parsed = JSON.parse(row.entry_json || '{}');
          const t = parsed.date ? new Date(parsed.date).getTime() : entryId;
          allKnownTimestamps.push({
            timeMs: t,
            score: Number(parsed.score) || 0,
            total: Number(parsed.total) || 0,
            files: Array.isArray(parsed.files) ? parsed.files : [],
          });
        } catch {
          allKnownTimestamps.push({ timeMs: entryId, score: -1, total: -1, files: [] });
        }
        continue;
      }
      try {
        const parsed = JSON.parse(row.entry_json);
        if (parsed && parsed.id) {
          const t = parsed.date ? new Date(parsed.date).getTime() : Number(parsed.id);
          if (historyClearedAtMs && t <= historyClearedAtMs) {
            continue;
          }
          activeHistory.push(parsed);
          allKnownTimestamps.push({
            timeMs: t,
            score: Number(parsed.score) || 0,
            total: Number(parsed.total) || 0,
            files: Array.isArray(parsed.files) ? parsed.files : [],
          });
        }
      } catch {
        // Ignore malformed row
      }
    }

    // 3. Backfill otomatis dari quiz_history_logs & leaderboard di D1
    // (Agar riwayat kuis yang pernah dikerjakan di perangkat lain langsung muncul)
    try {
      const { results: logRows } = await env.DB.prepare(`
        SELECT id, file_name, score, correct_count, total_count, created_at
        FROM quiz_history_logs
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 60
      `)
        .bind(userId)
        .all();

      for (const log of (logRows || []) as any[]) {
        const logTime = log.created_at ? new Date(log.created_at).getTime() : 0;
        if (!logTime) continue;
        if (historyClearedAtMs && logTime <= historyClearedAtMs) continue;

        const score = Math.round(Number(log.score) || 0);
        const total = Number(log.total_count) || 0;
        const correct = Number(log.correct_count) || 0;
        const rawFile = String(log.file_name || 'Kuis');

        // Cek apakah sudah ada di user_quiz_history (dalam rentang ±180 detik & skor/total sama)
        const alreadyExists = allKnownTimestamps.some((k) => {
          const timeDiff = Math.abs(k.timeMs - logTime);
          if (timeDiff <= 180_000 && (k.score === score || k.score === -1)) {
            return true;
          }
          return false;
        });

        if (!alreadyExists) {
          let files: string[] = [rawFile];
          const matchGabungan = rawFile.match(/^Gabungan \d+ Paket \((.+)\)$/);
          if (matchGabungan) {
            files = matchGabungan[1].split(',').map((s: string) => s.trim()).filter(Boolean);
          }

          const backfilled = {
            id: logTime,
            date: log.created_at,
            score,
            correct,
            wrong: Math.max(0, total - correct),
            empty: 0,
            total,
            files,
            mode: 'utuh',
            fromServerLog: true,
          };

          activeHistory.push(backfilled);
          allKnownTimestamps.push({
            timeMs: logTime,
            score,
            total,
            files,
          });
        }
      }

      // Cek juga tabel leaderboard per-file jika ada paket soal yang pernah dikerjakan sebelum quiz_history_logs
      const { results: lbRows } = await env.DB.prepare(`
        SELECT file_name, score, questions_count, created_at
        FROM leaderboard
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 60
      `)
        .bind(userId)
        .all();

      for (const lb of (lbRows || []) as any[]) {
        const lbTime = lb.created_at ? new Date(lb.created_at).getTime() : 0;
        if (!lbTime) continue;
        if (historyClearedAtMs && lbTime <= historyClearedAtMs) continue;

        const rawFile = String(lb.file_name || '');
        if (!rawFile) continue;

        // Jika file_name ini belum ada sama sekali di riwayat aktif, tambahkan entri terbaiknya
        const fileAlreadyInHistory = allKnownTimestamps.some(
          (k) => k.files.includes(rawFile) || Math.abs(k.timeMs - lbTime) <= 180_000
        );

        if (!fileAlreadyInHistory) {
          const score = Math.round(Number(lb.score) || 0);
          const total = Number(lb.questions_count) || 0;
          const correct = total > 0 ? Math.round((score / 100) * total) : 0;

          const backfilledLb = {
            id: lbTime,
            date: lb.created_at,
            score,
            correct,
            wrong: Math.max(0, total - correct),
            empty: 0,
            total,
            files: [rawFile],
            mode: 'utuh',
            fromServerLog: true,
          };

          activeHistory.push(backfilledLb);
          allKnownTimestamps.push({
            timeMs: lbTime,
            score,
            total,
            files: [rawFile],
          });
        }
      }
    } catch (backfillErr) {
      console.warn('[user-sync] Backfill warning:', backfillErr);
    }

    activeHistory.sort((a, b) => {
      const tA = a.date ? new Date(a.date).getTime() : Number(a.id) || 0;
      const tB = b.date ? new Date(b.date).getTime() : Number(b.id) || 0;
      return tB - tA;
    });

    return new Response(
      JSON.stringify({
        data: {
          settings,
          history: activeHistory.slice(0, 50),
          deletedHistoryIds,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (!env.DB) {
    return new Response(JSON.stringify({ error: 'Database D1 belum terhubung' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  await ensureUserSyncTables(env.DB);

  try {
    const body = (await request.json()) as any;
    const { user_id, settings, history, action, entry_id } = body;

    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id wajib diisi' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const now = new Date().toISOString();

    // 1. Action: Hapus satu item riwayat kuis
    if (action === 'delete_history_item' && entry_id !== undefined) {
      const numericId = Number(entry_id);
      const rowId = `${user_id}_${numericId}`;
      await env.DB.prepare(`
        INSERT INTO user_quiz_history (id, user_id, entry_id, entry_json, is_deleted, created_at)
        VALUES (?, ?, ?, ?, 1, ?)
        ON CONFLICT(user_id, entry_id) DO UPDATE SET
          is_deleted = 1
      `)
        .bind(rowId, user_id, numericId, JSON.stringify({ id: numericId }), now)
        .run();

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Action: Kosongkan seluruh riwayat kuis
    if (action === 'clear_history') {
      await env.DB.prepare(`
        UPDATE user_quiz_history SET is_deleted = 1 WHERE user_id = ?
      `)
        .bind(user_id)
        .run();

      // Simpan timestamp historyClearedAt di user_settings agar backfill log lama tidak muncul lagi
      const existingSettingsRow = (await env.DB.prepare(
        'SELECT settings_json FROM user_settings WHERE user_id = ?'
      )
        .bind(user_id)
        .first()) as any;

      let currentSettings: any = {};
      if (existingSettingsRow?.settings_json) {
        try {
          currentSettings = JSON.parse(existingSettingsRow.settings_json) || {};
        } catch {}
      }
      currentSettings.historyClearedAt = now;

      await env.DB.prepare(`
        INSERT INTO user_settings (user_id, settings_json, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          settings_json = excluded.settings_json,
          updated_at = excluded.updated_at
      `)
        .bind(user_id, JSON.stringify(currentSettings), now)
        .run();

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Upsert pengaturan folder & preferensi personal
    if (settings && typeof settings === 'object') {
      const existingSettingsRow = (await env.DB.prepare(
        'SELECT settings_json FROM user_settings WHERE user_id = ?'
      )
        .bind(user_id)
        .first()) as any;

      let prevSettings: any = {};
      if (existingSettingsRow?.settings_json) {
        try {
          prevSettings = JSON.parse(existingSettingsRow.settings_json) || {};
        } catch {}
      }

      const mergedSettings = {
        ...prevSettings,
        ...settings,
        isSeededDefault: false,
        updated_at: now,
      };

      await env.DB.prepare(`
        INSERT INTO user_settings (user_id, settings_json, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          settings_json = excluded.settings_json,
          updated_at = excluded.updated_at
      `)
        .bind(user_id, JSON.stringify(mergedSettings), now)
        .run();
    }

    // 4. Batch upsert riwayat kuis
    if (Array.isArray(history) && history.length > 0) {
      const statements: D1PreparedStatement[] = [];
      for (const entry of history.slice(0, 50)) {
        if (!entry || !entry.id) continue;
        const entryId = Number(entry.id);
        if (!Number.isFinite(entryId)) continue;

        const rowId = `${user_id}_${entryId}`;
        const entryJson = JSON.stringify(entry);
        const createdAt = entry.date || now;

        statements.push(
          env.DB.prepare(`
            INSERT INTO user_quiz_history (id, user_id, entry_id, entry_json, is_deleted, created_at)
            VALUES (?, ?, ?, ?, 0, ?)
            ON CONFLICT(user_id, entry_id) DO UPDATE SET
              entry_json = CASE
                WHEN user_quiz_history.is_deleted = 1 THEN user_quiz_history.entry_json
                ELSE excluded.entry_json
              END
          `).bind(rowId, user_id, entryId, entryJson, createdAt)
        );
      }

      if (statements.length > 0) {
        await env.DB.batch(statements);
      }
    }

    return new Response(JSON.stringify({ success: true, updated_at: now }), {
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
