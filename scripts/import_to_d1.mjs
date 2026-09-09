#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const exportDir = path.join(rootDir, 'export');
const tempDir = path.join(rootDir, '.tmp_import');

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

function escapeSql(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return Number.isFinite(val) ? String(val) : 'NULL';
  if (typeof val === 'boolean') return val ? '1' : '0';
  if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  return `'${String(val).replace(/'/g, "''")}'`;
}

function runSqlBatch(sqlStatements, batchName = 'batch') {
  if (sqlStatements.length === 0) return;
  const tempFile = path.join(tempDir, `${batchName}.sql`);
  fs.writeFileSync(tempFile, sqlStatements.join(';\n') + ';\n', 'utf8');

  try {
    const cmd = `./node_modules/.bin/wrangler d1 execute auramedpro-db --remote -y --file="${tempFile}"`;
    execSync(cmd, { cwd: rootDir, stdio: 'inherit' });
  } finally {
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }
}

async function importAuthUsers() {
  const authUsersFile = path.join(exportDir, 'auth_users.json');
  if (!fs.existsSync(authUsersFile)) {
    console.log('ℹ️ auth_users.json tidak ditemukan di folder export/. Lewati import password.');
    return;
  }

  const raw = fs.readFileSync(authUsersFile, 'utf8');
  let users = [];
  try {
    const parsed = JSON.parse(raw);
    users = parsed[0]?.data || parsed?.data || parsed[0]?.users_json || parsed?.users_json || (Array.isArray(parsed) ? parsed : [parsed]);
  } catch (err) {
    console.error('❌ Gagal parse export/auth_users.json:', err.message);
    return;
  }

  console.log(`\n📦 Mengimpor ${users.length} user dari export/auth_users.json...`);
  const statements = [];

  for (const u of users) {
    const id = escapeSql(u.id);
    const email = escapeSql(u.email || null);
    const hash = u.encrypted_password ? escapeSql(u.encrypted_password) : 'NULL';
    const isGuest = u.encrypted_password ? '0' : '1';
    const username = escapeSql(u.email ? u.email.split('@')[0] : `user-${u.id.slice(0, 6)}`);

    // Update jika profil sudah ada, atau buat jika belum ada
    statements.push(`
      INSERT INTO profiles (id, username, email, password_hash, is_guest)
      VALUES (${id}, ${username}, ${email}, ${hash}, ${isGuest})
      ON CONFLICT(id) DO UPDATE SET
        password_hash = coalesce(${hash}, profiles.password_hash),
        email = coalesce(${email}, profiles.email),
        is_guest = CASE WHEN ${hash} IS NOT NULL THEN 0 ELSE profiles.is_guest END
    `.trim());
  }

  // Jalankan dalam batch 50 baris
  const BATCH_SIZE = 50;
  for (let i = 0; i < statements.length; i += BATCH_SIZE) {
    const chunk = statements.slice(i, i + BATCH_SIZE);
    console.log(`Menjalankan auth batch ${Math.floor(i / BATCH_SIZE) + 1} (${chunk.length} items)...`);
    runSqlBatch(chunk, `auth_batch_${i}`);
  }
  console.log('✅ Import auth_users selesai.');
}

async function importGenericTable(tableName, primaryKeyCols = ['id']) {
  const filePath = path.join(exportDir, `${tableName}.json`);
  if (!fs.existsSync(filePath)) {
    return;
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  let rows = [];
  try {
    rows = JSON.parse(raw);
  } catch (e) {
    console.error(`❌ Gagal membaca ${filePath}:`, e.message);
    return;
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    console.log(`ℹ️ ${tableName}.json kosong. Lewati.`);
    return;
  }

  console.log(`\n📦 Mengimpor ${rows.length} baris ke tabel ${tableName}...`);
  const statements = [];

  for (const row of rows) {
    const cols = Object.keys(row);
    const values = cols.map(c => escapeSql(row[c]));
    statements.push(`
      INSERT OR IGNORE INTO ${tableName} (${cols.join(', ')})
      VALUES (${values.join(', ')})
    `.trim());
  }

  const BATCH_SIZE = 50;
  for (let i = 0; i < statements.length; i += BATCH_SIZE) {
    const chunk = statements.slice(i, i + BATCH_SIZE);
    console.log(`Menjalankan ${tableName} batch ${Math.floor(i / BATCH_SIZE) + 1} (${chunk.length} items)...`);
    runSqlBatch(chunk, `${tableName}_batch_${i}`);
  }
  console.log(`✅ Import ${tableName} selesai.`);
}

async function main() {
  console.log('🚀 Memulai proses impor data ke Cloudflare D1...');

  // 1. Auth & Profiles
  await importAuthUsers();

  // 2. Fitur Belajar (SRS, Notes, Bookmarks)
  await importGenericTable('srs_cards');
  await importGenericTable('study_notes');
  await importGenericTable('bookmarks');

  // 3. Mabar
  await importGenericTable('mabar_rooms');
  await importGenericTable('mabar_room_players');
  await importGenericTable('mabar_room_questions');
  await importGenericTable('mabar_answers');
  await importGenericTable('mabar_player_stats');
  await importGenericTable('mabar_match_history');

  // 4. Bersihkan temp
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  console.log('\n📊 Menjalankan verifikasi jumlah baris di D1...');
  try {
    execSync(
      `./node_modules/.bin/wrangler d1 execute auramedpro-db --remote --command="` +
      `SELECT 'profiles' as tbl, count(*) as count FROM profiles UNION ALL ` +
      `SELECT 'srs_cards', count(*) FROM srs_cards UNION ALL ` +
      `SELECT 'study_notes', count(*) FROM study_notes UNION ALL ` +
      `SELECT 'bookmarks', count(*) FROM bookmarks;"`,
      { cwd: rootDir, stdio: 'inherit' }
    );
  } catch (err) {
    console.warn('Verifikasi selesai dengan catatan.');
  }

  console.log('\n🎉 Proses impor selesai.');
}

main().catch(console.error);
