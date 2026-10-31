#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const isLocal = process.argv.includes('--local');
const targetFlag = isLocal ? '--local' : '--remote';

// 1. Generate PBKDF2 Hash untuk password "177"
async function hashPasswordPBKDF2(pass) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(pass),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const derived = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
  const saltB64 = Buffer.from(salt).toString('base64');
  const hashB64 = Buffer.from(derived).toString('base64');
  return `pbkdf2$100000$${saltB64}$${hashB64}`;
}

async function main() {
  const NEW_PASSWORD = '177';
  const TARGET_USERNAME = 'nao';
  const hash = await hashPasswordPBKDF2(NEW_PASSWORD);

  console.log(`\n⏳ Mengubah password akun "${TARGET_USERNAME}" menjadi "${NEW_PASSWORD}"...`);
  console.log(`🔑 PBKDF2 Hash: ${hash}`);

  // SQL Update & Fallback Insert jika belum ada di database lokal
  const sql = `
UPDATE profiles 
SET password_hash = '${hash}' 
WHERE LOWER(username) = '${TARGET_USERNAME}' OR LOWER(email) = '${TARGET_USERNAME}@ai.online';

INSERT INTO profiles (
  id, username, email, password_hash, is_guest, role, xp, streak, level, 
  total_questions_answered, created_at, last_active, angkatan, prodi, subscription_status
)
SELECT 
  '${crypto.randomUUID()}',
  '${TARGET_USERNAME}',
  '${TARGET_USERNAME}@ai.online',
  '${hash}',
  0,
  'user',
  0,
  0,
  1,
  0,
  datetime('now'),
  datetime('now'),
  '24',
  'kedokteran',
  'trial'
WHERE NOT EXISTS (
  SELECT 1 FROM profiles WHERE LOWER(username) = '${TARGET_USERNAME}' OR LOWER(email) = '${TARGET_USERNAME}@ai.online'
);
`.trim();

  const sqlFile = path.join(rootDir, 'migration_change_nao_password.sql');
  fs.writeFileSync(sqlFile, sql, 'utf8');

  const wranglerArgs = ['wrangler', 'd1', 'execute', 'auramedpro-db', targetFlag, `--file=${sqlFile}`];

  try {
    const res = spawnSync('npx', wranglerArgs, { cwd: rootDir, stdio: 'inherit' });
    if (res.status !== 0) {
      console.error('\n❌ Gagal menjalankan migrasi ke Cloudflare D1');
      process.exit(1);
    }
    console.log(`\n✅ SUKSES! Password akun "${TARGET_USERNAME}" berhasil diubah menjadi "${NEW_PASSWORD}" (${isLocal ? 'Lokal' : 'Remote Produksi Cloudflare D1'}).`);
    console.log(`Detail Akun:`);
    console.log(`  - Username : ${TARGET_USERNAME}`);
    console.log(`  - Password : ${NEW_PASSWORD}`);
    console.log(`  - Email    : ${TARGET_USERNAME}@ai.online\n`);
  } catch (err) {
    console.error('❌ Error executing wrangler:', err.message);
    process.exit(1);
  }
}

main();
