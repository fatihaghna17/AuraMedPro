#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load .env
function loadEnv() {
  const envPath = path.join(rootDir, '.env');
  const env = {};
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const match = line.trim().match(/^([A-Z0-9_]+)=(.*)$/);
      if (match) {
        let val = match[2].trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        env[match[1]] = val;
      }
    }
  }
  return env;
}

const env = loadEnv();
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const headers = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
};

async function fetchAll(endpoint) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, { headers });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${endpoint}: ${res.status} ${res.statusText}`);
  }
  return await res.json();
}

function escapeSql(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return Number.isFinite(val) ? val : 'NULL';
  if (typeof val === 'boolean') return val ? 1 : 0;
  return `'${String(val).replace(/'/g, "''")}'`;
}

async function main() {
  console.log('Fetching data from Supabase...');
  const [profiles, logs, lb] = await Promise.all([
    fetchAll('profiles?select=*'),
    fetchAll('quiz_history_logs?select=*'),
    fetchAll('leaderboard?select=*'),
  ]);

  console.log(`Retrieved:
  - Profiles: ${profiles.length}
  - Quiz History Logs: ${logs.length}
  - Leaderboard Entries: ${lb.length}
  `);

  const sqlStatements = [];

  // 1. Profiles
  for (const p of profiles) {
    const id = escapeSql(p.id);
    const username = escapeSql(p.username || 'user');
    const role = escapeSql(p.username === 'admin' ? 'admin' : (p.username === 'collector' ? 'collector' : 'user'));
    const xp = escapeSql(p.xp || 0);
    const streak = escapeSql(p.current_streak ?? p.streak ?? 0);
    const level = escapeSql(p.level || 1);
    const totalAnswered = escapeSql(p.total_questions_answered || 0);
    const lastActive = escapeSql(p.last_active_date || p.updated_at || new Date().toISOString());

    sqlStatements.push(`
INSERT INTO profiles (id, username, role, xp, streak, level, total_questions_answered, last_active)
VALUES (${id}, ${username}, ${role}, ${xp}, ${streak}, ${level}, ${totalAnswered}, ${lastActive})
ON CONFLICT(id) DO UPDATE SET
  username = excluded.username,
  xp = MAX(profiles.xp, excluded.xp),
  streak = MAX(profiles.streak, excluded.streak),
  level = MAX(profiles.level, excluded.level),
  total_questions_answered = MAX(profiles.total_questions_answered, excluded.total_questions_answered),
  last_active = excluded.last_active;
`.trim());
  }

  // 2. Quiz History Logs
  for (const l of logs) {
    const id = escapeSql(String(l.id));
    const userId = escapeSql(l.user_id);
    const fileName = escapeSql(l.file_name || 'Kuis');
    const score = escapeSql(l.score || 0);
    const correctCount = escapeSql(l.correct_count || 0);
    const totalCount = escapeSql(l.total_count || 0);
    const timeSpent = escapeSql(l.time_spent || 0);
    const createdAt = escapeSql(l.created_at || new Date().toISOString());

    sqlStatements.push(`
INSERT INTO quiz_history_logs (id, user_id, file_name, score, correct_count, total_count, time_spent, created_at)
VALUES (${id}, ${userId}, ${fileName}, ${score}, ${correctCount}, ${totalCount}, ${timeSpent}, ${createdAt})
ON CONFLICT(id) DO UPDATE SET
  score = excluded.score,
  correct_count = excluded.correct_count,
  total_count = excluded.total_count;
`.trim());
  }

  // 3. Leaderboard
  for (const entry of lb) {
    const id = escapeSql(String(entry.id));
    const userId = escapeSql(entry.user_id);
    const fileName = escapeSql(entry.file_name);
    const score = escapeSql(entry.score || 0);
    const questionsCount = escapeSql(entry.questions_count || 0);
    const createdAt = escapeSql(entry.created_at || new Date().toISOString());

    sqlStatements.push(`
INSERT INTO leaderboard (id, user_id, file_name, score, questions_count, created_at)
VALUES (${id}, ${userId}, ${fileName}, ${score}, ${questionsCount}, ${createdAt})
ON CONFLICT(user_id, file_name) DO UPDATE SET
  score = MAX(leaderboard.score, excluded.score),
  questions_count = MAX(leaderboard.questions_count, excluded.questions_count);
`.trim());
  }

  const outPath = path.join(rootDir, 'migration_sync_supabase_to_d1.sql');
  fs.writeFileSync(outPath, sqlStatements.join('\n\n'));
  console.log(`Generated SQL file at: ${outPath} (${sqlStatements.length} statements)`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
