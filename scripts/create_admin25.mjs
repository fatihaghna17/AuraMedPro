#!/usr/bin/env node
/**
 * Script untuk membuat akun admin angkatan 25
 * Menggunakan PBKDF2 hashing yang kompatibel dengan _utils.ts
 * 
 * Usage: node scripts/create_admin25.mjs
 * Lalu jalankan SQL yang dihasilkan via wrangler d1 execute
 */

import { webcrypto } from 'node:crypto';

const crypto = webcrypto;

// === CONFIG ===
const USERNAME = 'Admin 25';
const EMAIL = 'admin25@ai.online';
const PASSWORD = '250';  // 3 digit angka
const ANGKATAN = '25';
const ROLE = 'admin';

// === PBKDF2 Hashing (sama persis dengan _utils.ts) ===
async function hashPasswordPBKDF2(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iterations = 100000;
  const enc = new TextEncoder();

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derived = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  const saltB64 = btoa(String.fromCharCode(...salt));
  const hashB64 = btoa(String.fromCharCode(...new Uint8Array(derived)));

  return `pbkdf2$${iterations}$${saltB64}$${hashB64}`;
}

async function main() {
  const userId = crypto.randomUUID();
  const passwordHash = await hashPasswordPBKDF2(PASSWORD);
  const now = new Date().toISOString();

  const sql = `INSERT INTO profiles (id, username, email, password_hash, is_guest, role, xp, streak, level, total_questions_answered, created_at, last_active, angkatan, subscription_status, trial_ends_at)
VALUES ('${userId}', '${USERNAME}', '${EMAIL}', '${passwordHash}', 0, '${ROLE}', 0, 0, 1, 0, '${now}', '${now}', '${ANGKATAN}', 'active', NULL);`;

  console.log('=== AKUN ADMIN ANGKATAN 25 ===');
  console.log(`Username : ${USERNAME}`);
  console.log(`Email    : ${EMAIL}`);
  console.log(`Password : ${PASSWORD}`);
  console.log(`Role     : ${ROLE}`);
  console.log(`Angkatan : ${ANGKATAN}`);
  console.log(`User ID  : ${userId}`);
  console.log('');
  console.log('=== SQL INSERT ===');
  console.log(sql);
  console.log('');
  console.log('Menjalankan SQL ke D1 remote...');

  // Tulis SQL ke file temp
  const fs = await import('node:fs');
  const tmpFile = '/tmp/admin25_insert.sql';
  fs.writeFileSync(tmpFile, sql);
  
  // Jalankan via wrangler d1 execute
  const { execSync } = await import('node:child_process');
  try {
    const result = execSync(`npx wrangler d1 execute auramedpro-db --remote --file=${tmpFile}`, {
      cwd: '/home/kkskr/Proyek/cbt-latihan-soal-pro',
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    console.log(result);
    console.log('✅ Akun admin berhasil dibuat!');
  } catch (err) {
    console.error('❌ Gagal:', err.stderr || err.message);
    console.log('');
    console.log('Jalankan manual:');
    console.log(`npx wrangler d1 execute auramedpro-db --remote --file=${tmpFile}`);
  }
}

main();
