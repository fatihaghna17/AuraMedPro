#!/usr/bin/env node
// ============================================================
// AuraMed PRO — Migration Script: Supabase -> Cloudflare D1 & R2
//
// Mentransfer 30 bank soal dari Supabase ke Cloudflare:
// 1. Baca metadata & soal dari Supabase REST API
// 2. Upload isi soal (JSON) ke Cloudflare R2 via /api/upload-question (0 egress)
// 3. Daftarkan pointer (r2_key, r2_url) ke Cloudflare D1 via /api/question-banks
//
// Penggunaan:
//   node scripts/fill_d1_from_supabase.mjs          # Dry-run (hanya melihat rencana)
//   node scripts/fill_d1_from_supabase.mjs --apply  # Eksekusi migrasi sungguhan
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Baca .env untuk Supabase URL & Anon Key
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
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL || 'https://ukshyuaxwuwlzejslgbl.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
const CLOUDFLARE_API_BASE = process.env.CF_API_BASE || 'https://auramedpro.pages.dev/api';

const isApply = process.argv.includes('--apply');

console.log('====================================================');
console.log('  MIGRASI BANK SOAL: SUPABASE -> CLOUDFLARE D1 + R2  ');
console.log('====================================================');
console.log(`Mode:           ${isApply ? '⚡ EKSEKUSI (--apply)' : '🔍 DRY-RUN (simulasi, gunakan --apply untuk eksekusi)'}`);
console.log(`Supabase URL:   ${SUPABASE_URL}`);
console.log(`Cloudflare API: ${CLOUDFLARE_API_BASE}`);
console.log('----------------------------------------------------');

if (!SUPABASE_ANON_KEY) {
  console.error('❌ Error: VITE_SUPABASE_ANON_KEY tidak ditemukan di file .env');
  process.exit(1);
}

async function run() {
  // Step 1: Ambil semua baris question_banks dari Supabase
  console.log('\n📥 Mengambil daftar bank soal dari Supabase...');
  const supaRes = await fetch(`${SUPABASE_URL}/rest/v1/question_banks?select=id,name,user_id,questions_json,created_at`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  if (!supaRes.ok) {
    console.error(`❌ Gagal mengambil dari Supabase: HTTP ${supaRes.status} ${supaRes.statusText}`);
    const errText = await supaRes.text();
    console.error(errText);
    process.exit(1);
  }

  const supaBanks = await supaRes.json();
  console.log(`✅ Berhasil mengambil ${supaBanks.length} bank soal dari Supabase.`);

  // Step 2: Ambil bank soal yang sudah ada di D1 Cloudflare saat ini
  console.log('🔎 Memeriksa data yang saat ini ada di Cloudflare D1...');
  let existingD1 = [];
  try {
    const cfRes = await fetch(`${CLOUDFLARE_API_BASE}/question-banks`);
    if (cfRes.ok) {
      const cfJson = await cfRes.json();
      existingD1 = cfJson.data || [];
    }
  } catch (err) {
    console.warn('⚠️ Tidak dapat menghubungi /api/question-banks:', err.message);
  }
  const existingNames = new Set(existingD1.map(b => b.name));
  console.log(`ℹ️ D1 saat ini memiliki ${existingD1.length} bank soal.`);

  let uploadedCount = 0;
  let skippedCount = 0;
  let totalBytesUploaded = 0;

  for (let i = 0; i < supaBanks.length; i++) {
    const bank = supaBanks[i];
    const { id, name, user_id, questions_json, created_at } = bank;
    const prefix = `[${i + 1}/${supaBanks.length}] "${name}"`;

    let questions = null;
    let existingR2Key = null;
    let existingR2Url = null;

    if (typeof questions_json === 'string') {
      try {
        const parsed = JSON.parse(questions_json);
        if (Array.isArray(parsed)) {
          questions = parsed;
        } else if (parsed && parsed.r2_key) {
          existingR2Key = parsed.r2_key;
          existingR2Url = parsed.r2_url;
        }
      } catch {
        console.warn(`  ${prefix}: Format JSON tidak valid, dilewati.`);
        skippedCount++;
        continue;
      }
    } else if (Array.isArray(questions_json)) {
      questions = questions_json;
    } else if (questions_json && questions_json.r2_key) {
      existingR2Key = questions_json.r2_key;
      existingR2Url = questions_json.r2_url;
    }

    let finalR2Key = existingR2Key;
    let finalR2Url = existingR2Url;

    if (questions && questions.length > 0) {
      const jsonStr = JSON.stringify(questions);
      const sizeKB = (Buffer.byteLength(jsonStr, 'utf8') / 1024).toFixed(1);
      const cleanName = name.replace(/\.json$/i, '');
      const filename = `${cleanName.replace(/[^a-zA-Z0-9.\-_]/g, '_')}.json`;

      console.log(`\n📌 ${prefix}: ${questions.length} soal (${sizeKB} KB)`);

      if (isApply) {
        // Upload isi soal ke R2 via /api/upload-question
        process.stdout.write(`   ↳ Mengunggah ke R2 (${filename})... `);
        try {
          const uploadRes = await fetch(`${CLOUDFLARE_API_BASE}/upload-question`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename, content: questions })
          });

          if (!uploadRes.ok) {
            const errBody = await uploadRes.text();
            console.log(`❌ GAGAL (HTTP ${uploadRes.status}): ${errBody}`);
            continue;
          }

          const uploadJson = await uploadRes.json();
          finalR2Key = uploadJson.key;
          finalR2Url = uploadJson.fileUrl;
          console.log(`✅ Sukses (key: ${finalR2Key})`);
          totalBytesUploaded += Buffer.byteLength(jsonStr, 'utf8');
        } catch (err) {
          console.log(`❌ Error: ${err.message}`);
          continue;
        }
      } else {
        console.log(`   [DRY-RUN] Akan diunggah ke R2 sebagai: ${filename}`);
        finalR2Key = filename;
        finalR2Url = `https://pub-f0707ec9f2b24a6e8ffc24ef68b6c995.r2.dev/${filename}`;
      }
    } else if (existingR2Key) {
      console.log(`\n📌 ${prefix}: Sudah berupa R2 pointer (key: ${existingR2Key})`);
    } else {
      console.log(`\n⚠️ ${prefix}: Kosong / tidak ada soal.`);
      skippedCount++;
      continue;
    }

    // Step 3: Daftarkan pointer ke D1 Cloudflare
    if (isApply) {
      process.stdout.write(`   ↳ Mendaftarkan ke Cloudflare D1... `);
      try {
        const d1Res = await fetch(`${CLOUDFLARE_API_BASE}/question-banks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: id || crypto.randomUUID(),
            name,
            user_id,
            r2_key: finalR2Key,
            r2_url: finalR2Url,
            questions_json: null // Soal tersimpan di R2, D1 hanya menyimpan pointer
          })
        });

        if (d1Res.ok) {
          console.log(`✅ Berhasil terdaftar di D1!`);
          uploadedCount++;
        } else {
          const d1Err = await d1Res.text();
          console.log(`❌ GAGAL daftarkan ke D1: ${d1Err}`);
        }
      } catch (err) {
        console.log(`❌ Error D1: ${err.message}`);
      }
    } else {
      console.log(`   [DRY-RUN] Akan didaftarkan ke D1 dengan pointer r2_key="${finalR2Key}"`);
      uploadedCount++;
    }
  }

  console.log('\n====================================================');
  console.log('                  RINGKASAN MIGRASI                 ');
  console.log('====================================================');
  console.log(`Total Bank Soal Diproses: ${uploadedCount}`);
  console.log(`Dilewati / Kosong:        ${skippedCount}`);
  if (isApply) {
    console.log(`Total Ukuran Terunggah:   ${(totalBytesUploaded / 1024 / 1024).toFixed(2)} MB`);
    console.log('\n🎉 Verifikasi hasil dengan:');
    console.log('   curl https://auramedpro.pages.dev/api/question-banks');
    console.log('Sekarang setiap kali user login, data ditarik dari Cloudflare R2/D1 (0 egress Supabase)!');
  } else {
    console.log('\n💡 Untuk mengeksekusi migrasi sungguhan, jalankan:');
    console.log('   node scripts/fill_d1_from_supabase.mjs --apply');
  }
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
