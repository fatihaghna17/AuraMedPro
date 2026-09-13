#!/usr/bin/env node
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const isLocal = args.includes('--local');
const cleanArgs = args.filter(a => a !== '--local');

const username = cleanArgs[0];
const password = cleanArgs[1];
const role = cleanArgs[2] || 'user'; // 'user' | 'collector' | 'admin'
const angkatan = cleanArgs[3] || null; // '24' | '25' | '26' | null

if (!username || !password) {
  console.log(`
Cara Penggunaan:
  node scripts/add_user.mjs <username> <password> [role] [angkatan] [--local]

Contoh Pembuatan Akun:
  # 1. Admin/Collector Per Angkatan (Akses penuh unduh soal angkatan tersebut):
  node scripts/add_user.mjs collector24 rahasia24 collector 24
  node scripts/add_user.mjs collector25 rahasia25 collector 25
  node scripts/add_user.mjs collector26 rahasia26 collector 26

  # 2. Akun Super Admin:
  node scripts/add_user.mjs superadmin rahasiaSuper admin

  # 3. Akun Pengguna Biasa:
  node scripts/add_user.mjs dokter_budi rahasia123 user 24

Opsi:
  [role]      : 'collector' (PJ Soal Angkatan), 'admin' (Super Admin), atau 'user' (default)
  [angkatan]  : '24', '25', atau '26'
  --local     : Tambahkan ke D1 lokal (bawaan: --remote / D1 produksi Cloudflare)
`);
  process.exit(1);
}

if (password.length < 3) {
  console.error('❌ Password minimal 3 karakter!');
  process.exit(1);
}

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
  const id = crypto.randomUUID();
  const email = `${username.toLowerCase()}@ai.online`;
  const passwordHash = await hashPasswordPBKDF2(password);
  const now = new Date().toISOString();

  const subStatus = (role === 'admin' || role === 'collector') ? 'active' : 'trial';
  const angkatanSql = angkatan ? `'${angkatan}'` : 'NULL';

  console.log(`\n⏳ Menambahkan user "${username}" (role: ${role}, angkatan: ${angkatan || 'Semua'})...`);

  const sql = `INSERT INTO profiles (id, username, email, password_hash, is_guest, role, xp, streak, level, total_questions_answered, created_at, last_active, angkatan, subscription_status) VALUES ('${id}', '${username.replace(/'/g, "''")}', '${email}', '${passwordHash}', 0, '${role}', 0, 0, 1, 0, '${now}', '${now}', ${angkatanSql}, '${subStatus}');`;

  const targetFlag = isLocal ? '--local' : '--remote';
  const wranglerArgs = ['wrangler', 'd1', 'execute', 'auramedpro-db', targetFlag, `--command=${sql}`];

  try {
    const res = spawnSync('npx', wranglerArgs, { stdio: 'inherit' });
    if (res.status !== 0) {
      console.error('\n❌ Gagal menambahkan user ke D1');
      process.exit(1);
    }
    console.log(`\n✅ Sukses! User "${username}" berhasil ditambahkan ke Cloudflare D1 (${isLocal ? 'Lokal' : 'Remote Produksi'}).`);
    console.log(`\nDetail Login:`);
    console.log(`  - Username : ${username}`);
    console.log(`  - Password : ${password}`);
    console.log(`  - Role     : ${role}`);
    console.log(`  - Angkatan : ${angkatan ? `20${angkatan}` : 'Lintas Angkatan / Bebas'}`);
    console.log(`  - Status   : ${subStatus}`);
    console.log(`  - Email    : ${email}\n`);
  } catch (err) {
    console.error('❌ Gagal menjalankan wrangler d1 execute:', err.message);
    process.exit(1);
  }
}

main();
