#!/usr/bin/env node
/**
 * migrate_banks_to_r2.mjs — Migrasi one-time bank soal inline Supabase → Cloudflare R2
 *
 * LATAR BELAKANG:
 *   Kolom question_banks.questions_json yang berisi ARRAY (full JSON soal) menimbulkan
 *   egress besar di Supabase, karena setiap login user menarik semua bank berulang-ulang.
 *   Solusi: simpan JSON soal di Cloudflare R2 (egress gratis), dan ganti kolom menjadi
 *   pointer kecil { r2_url, r2_key }.
 *
 * CARA PAKAI:
 *   1) Dry-run (tidak menulis apa pun — hanya menampilkan rencana):
 *        SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/migrate_banks_to_r2.mjs
 *
 *   2) Terapkan (upload ke R2 + update Supabase):
 *        ... node scripts/migrate_banks_to_r2.mjs --apply
 *
 *   Transport upload R2 (pilih salah satu, urutan prioritas):
 *      a) Kredensial S3 R2 (langsung, tanpa lewat website):
 *           R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET
 *           (buat di Cloudflare Dashboard → R2 → Manage R2 API Tokens)
 *      b) URL website yang sudah deploy (memakai endpoint /api/upload-question):
 *           SITE_URL=https://auramedpro.pages.dev
 *
 *   Opsional: R2_PUBLIC_URL (default: https://pub-f0707ec9f2b24a6e8ffc24ef68b6c995.r2.dev)
 *
 * CATATAN:
 *   - Pakai SERVICE ROLE KEY (bypass RLS). JANGAN commit kredensial — set lewat env.
 *   - Key file mengikuti konvensi sanitizer yang sama dengan worker upload
 *     (filename → [a-zA-Z0-9.\-_]) supaya konsisten dengan backup R2 lama.
 *   - Jika ada bank bernama sama milik user berbeda, key diberi prefix per-user
 *     agar tidak saling menimpa.
 */

import { createHash, createHmac } from 'node:crypto';

// ---------- Konfigurasi ----------
const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const APPLY = process.argv.includes('--apply');

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET = process.env.R2_BUCKET || '';
const SITE_URL = (process.env.SITE_URL || '').replace(/\/+$/, '');
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || 'https://pub-f0707ec9f2b24a6e8ffc24ef68b6c995.r2.dev').replace(/\/+$/, '');

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib di-set sebagai environment variable.');
  process.exit(1);
}

const restHeaders = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

// Sama persis dengan workers/upload-question.ts
const sanitizeKey = (filename) => filename.replace(/^.*[\\/]/, '').replace(/[^a-zA-Z0-9.\-_]/g, '_');
const humanSize = (n) => (n >= 1048576 ? `${(n / 1048576).toFixed(2)} MB` : n >= 1024 ? `${(n / 1024).toFixed(1)} KB` : `${n} B`);

// ---------- Transport A: langsung ke R2 via S3 API (SigV4, zero-dependency) ----------
function hmac(key, data) {
  return createHmac('sha256', key).update(data).digest();
}
async function r2PutViaS3(key, body, contentType) {
  const host = `${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const region = 'auto';
  const service = 's3';
  const canonicalUri = `/${R2_BUCKET}/${key}`; // key sudah aman [a-zA-Z0-9.\-_] (atau prefix u<id>/)
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = createHash('sha256').update(body).digest('hex');

  const canonicalHeaders = `content-type:${contentType}\nhost:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
  const canonicalRequest = ['PUT', canonicalUri, '', canonicalHeaders, signedHeaders, payloadHash].join('\n');
  const scope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, createHash('sha256').update(canonicalRequest).digest('hex')].join('\n');
  const kSigning = hmac(hmac(hmac(hmac(`AWS4${R2_SECRET_ACCESS_KEY}`, dateStamp), region), service), 'aws4_request');
  const signature = createHmac('sha256', kSigning).update(stringToSign).digest('hex');
  const authorization = `AWS4-HMAC-SHA256 Credential=${R2_ACCESS_KEY_ID}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const res = await fetch(`https://${host}${canonicalUri}`, {
    method: 'PUT',
    headers: {
      Authorization: authorization,
      'x-amz-date': amzDate,
      'x-amz-content-sha256': payloadHash,
      'Content-Type': contentType,
    },
    body,
  });
  if (!res.ok) throw new Error(`R2 S3 PUT gagal (HTTP ${res.status}): ${await res.text().catch(() => '')}`);
}

// ---------- Transport B: endpoint /api/upload-question di website yang sudah deploy ----------
async function r2PutViaSite(filename, questions) {
  const res = await fetch(`${SITE_URL}/api/upload-question`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, content: questions }),
  });
  if (!res.ok) throw new Error(`Upload via site gagal (HTTP ${res.status})`);
  const { fileUrl, key } = await res.json();
  return { fileUrl, key };
}

// ---------- Main ----------
async function main() {
  const useS3 = !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET);
  const useSite = !!SITE_URL;
  const canUpload = useS3 || useSite;

  console.log(`Mode: ${APPLY ? '✅ APPLY (akan menulis)' : '🔍 DRY-RUN (tidak menulis apa pun)'}`);
  console.log(`Transport R2: ${useS3 ? `S3 langsung (bucket: ${R2_BUCKET})` : useSite ? `via site ${SITE_URL}` : '— TIDAK TERSEDIA —'}`);
  if (APPLY && !canUpload) {
    console.error('❌ --apply membutuhkan transport R2 (R2_* atau SITE_URL). Lihat header script.');
    process.exit(1);
  }

  // 1) Tarik semua row (hanya untuk audit; setelah migrasi kolom akan jadi pointer kecil)
  console.log('\n⏳ Mengambil data question_banks dari Supabase...');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/question_banks?select=name,user_id,questions_json`, { headers: restHeaders });
  if (!res.ok) {
    console.error(`❌ Gagal mengambil data (HTTP ${res.status}): ${await res.text().catch(() => '')}`);
    process.exit(1);
  }
  const rows = await res.json();
  console.log(`Ditemukan ${rows.length} bank soal.\n`);

  // 2) Deteksi collision nama (user berbeda, nama sama → butuh prefix per-user)
  const nameCounts = {};
  rows.forEach((r) => { nameCounts[r.name] = (nameCounts[r.name] || 0) + 1; });

  let totalInlineBytes = 0;
  let migrated = 0, skippedPointer = 0, failed = 0;

  for (const row of rows) {
    let qj = row.questions_json;
    if (typeof qj === 'string') {
      try { qj = JSON.parse(qj); } catch { /* biarkan → masuk kategori tak dikenal */ }
    }

    // Sudah pointer?
    if (qj && !Array.isArray(qj) && qj.r2_key) {
      skippedPointer++;
      console.log(`↩︎  SKIP (sudah pointer R2): ${row.name}`);
      continue;
    }

    if (!Array.isArray(qj)) {
      console.log(`⚠️  UNKNOWN (bukan array / bukan pointer, dilewati): ${row.name}`);
      continue;
    }

    // Row inline → rencanakan migrasi
    const sizeBytes = Buffer.byteLength(JSON.stringify(qj), 'utf8');
    totalInlineBytes += sizeBytes;
    const baseName = sanitizeKey(row.name);
    const hasCollision = nameCounts[row.name] > 1; // nama sama, user berbeda → anti-timpa
    const uid8 = String(row.user_id).replace(/-/g, '').slice(0, 8);
    // S3: key bebas (boleh mengandung '/'); via-site: worker menurunkan key dari filename,
    // jadi prefix disuntik ke segmen terakhir dan harus lolos sanitizer [a-zA-Z0-9.\-_]
    const keyS3 = hasCollision ? `u${uid8}/${baseName}` : baseName;
    const keySite = hasCollision ? `u${uid8}__${baseName}` : baseName;
    const planKey = useS3 ? keyS3 : keySite;
    const r2Url = `${R2_PUBLIC_URL}/${planKey}`;

    console.log(`📦 INLINE ${humanSize(sizeBytes).padStart(10)} | ${row.name} → ${planKey}${hasCollision ? '  (nama bentrok antar-user → pakai prefix)' : ''}`);

    if (!APPLY) continue;

    try {
      if (useS3) {
        await r2PutViaS3(keyS3, JSON.stringify(qj), 'application/json');
        await patchRow(row, { r2_url: r2Url, r2_key: keyS3 });
      } else {
        const up = await r2PutViaSite(keySite, qj);
        const finalKey = up.key || keySite;
        await patchRow(row, { r2_url: up.fileUrl || `${R2_PUBLIC_URL}/${finalKey}`, r2_key: finalKey });
      }
      migrated++;
    } catch (err) {
      failed++;
      console.error(`   ❌ Gagal: ${err.message}`);
    }
  }

  console.log('\n========== RINGKASAN ==========');
  console.log(`Total bank          : ${rows.length}`);
  console.log(`Sudah pointer       : ${skippedPointer}`);
  console.log(`Bank inline         : ${totalInlineBytes > 0 ? rows.length - skippedPointer : 0}${totalInlineBytes ? ` (${humanSize(totalInlineBytes)})` : ''}`);
  if (APPLY) {
    console.log(`Berhasil dimigrasi  : ${migrated}`);
    console.log(`Gagal               : ${failed}`);
    console.log('\n✅ Selesai. Jalankan lagi TANPA --apply (dry-run) untuk verifikasi: semua row harusnya SKIP/pointer.');
  } else {
    console.log(`Potensi hemat egress: ~${humanSize(totalInlineBytes)} per login per user (di-supabase, diulang tiap sesi!)`);
    console.log('\nℹ️  Ini dry-run. Jalankan ulang dengan --apply untuk menerapkan migrasi.');
  }
}

async function patchRow(row, pointer) {
  const url = `${SUPABASE_URL}/rest/v1/question_banks?name=eq.${encodeURIComponent(row.name)}&user_id=eq.${encodeURIComponent(row.user_id)}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { ...restHeaders, Prefer: 'return=minimal' },
    body: JSON.stringify({ questions_json: pointer }),
  });
  if (!res.ok) throw new Error(`Update Supabase gagal (HTTP ${res.status}): ${await res.text().catch(() => '')}`);
}

main().catch((e) => { console.error('❌ Fatal:', e); process.exit(1); });
