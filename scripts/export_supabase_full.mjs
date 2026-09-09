#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const exportDir = path.join(rootDir, 'export');

if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir, { recursive: true });
}

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
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_KEY || env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Error: SUPABASE_URL / SUPABASE_KEY tidak ditemukan di environment atau .env!');
  process.exit(1);
}

const tables = [
  'profiles',
  'quiz_sessions',
  'app_settings',
  'leaderboard',
  'quiz_history_logs',
  'answer_notes',
  'user_achievements',
  'question_reports',
  'srs_cards',
  'study_notes',
  'bookmarks',
  'mabar_rooms',
  'mabar_room_players',
  'mabar_room_questions',
  'mabar_answers',
  'mabar_player_stats',
  'mabar_match_history'
];

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AuraMedPro-Exporter/1.0'
};

async function fetchTable(table) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=*`;
  try {
    const res = await fetch(url, { headers });
    if (res.status === 402) {
      console.warn(`⚠️ [402 Quota Exceeded] Tabel "${table}" terblokir kuota egress Supabase.`);
      return { status: 402, error: 'exceed_egress_quota', data: null };
    }
    if (res.status === 404) {
      console.warn(`ℹ️ [404 Not Found] Tabel "${table}" tidak ditemukan di Supabase.`);
      return { status: 404, error: 'not_found', data: [] };
    }
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.warn(`⚠️ HTTP ${res.status} saat menarik "${table}": ${errText}`);
      return { status: res.status, error: errText, data: null };
    }
    const data = await res.json();
    return { status: 200, data };
  } catch (err) {
    console.error(`❌ Network error fetching "${table}":`, err.message);
    return { status: 0, error: err.message, data: null };
  }
}

async function run() {
  console.log('🚀 Memulai ekspor data dari Supabase...');
  console.log(`📡 URL: ${SUPABASE_URL}`);
  console.log(`📁 Target folder: ${exportDir}\n`);

  let quotaBlocked = false;
  const summary = [];

  for (const table of tables) {
    process.stdout.write(`Fetching ${table.padEnd(22)} ... `);
    const result = await fetchTable(table);

    if (result.status === 402) {
      quotaBlocked = true;
      summary.push({ table, status: 'HTTP 402 Egress Quota', count: 0, columns: [] });
      console.log('BLOCKED (402)');
      continue;
    }

    if (result.status === 200 && Array.isArray(result.data)) {
      const filePath = path.join(exportDir, `${table}.json`);
      fs.writeFileSync(filePath, JSON.stringify(result.data, null, 2), 'utf8');
      const cols = result.data.length > 0 ? Object.keys(result.data[0]) : [];
      summary.push({ table, status: 'OK', count: result.data.length, columns: cols });
      console.log(`OK (${result.data.length} baris)`);
    } else {
      summary.push({ table, status: `Error (${result.status})`, count: 0, columns: [] });
      console.log(`FAILED (${result.status})`);
    }
  }

  console.log('\n================ RINGKASAN EKSPOR ================');
  console.table(summary.map(s => ({
    Tabel: s.table,
    Status: s.status,
    Baris: s.count,
    'Jumlah Kolom': s.columns.length,
    SampleKolom: s.columns.slice(0, 5).join(', ')
  })));

  if (quotaBlocked) {
    console.log('\n⚠️ PERHATIAN PENTING:');
    console.log('Supabase saat ini membatasi REST API karena melebihi kuota egress (HTTP 402).');
    console.log('Untuk tabel yang belum ada di D1 (srs_cards, study_notes, bookmarks, auth.users):');
    console.log('1. Buka Supabase Dashboard -> SQL Editor');
    console.log('2. Jalankan query dari scripts/export_auth_users.sql dan scripts/export_all_from_supabase.sql');
    console.log('3. Simpan outputnya ke file export/<nama_tabel>.json.');
  }

  console.log('\n✅ Proses selesai.');
}

run().catch(console.error);
