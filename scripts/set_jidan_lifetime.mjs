#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const isLocal = process.argv.includes('--local');
const targetFlag = isLocal ? '--local' : '--remote';

console.log(`\n⏳ Mengaktifkan akun Lifetime untuk "jidan" (${isLocal ? 'Lokal' : 'Remote Produksi Cloudflare D1'})...`);

const sqlFile = path.join(rootDir, 'migration_jidan_lifetime.sql');
const wranglerArgs = ['wrangler', 'd1', 'execute', 'auramedpro-db', targetFlag, `--file=${sqlFile}`];

try {
  const res = spawnSync('npx', wranglerArgs, { cwd: rootDir, stdio: 'inherit' });
  if (res.status !== 0) {
    console.error('\n❌ Gagal menjalankan migrasi D1');
    process.exit(1);
  }
  console.log(`\n🎉 SUKSES! Akun "jidan" resmi menjadi LIFETIME member (${isLocal ? 'Lokal' : 'Remote Produksi'})!`);
  console.log(`- Username: jidan`);
  console.log(`- Email: jidan@ai.online`);
  console.log(`- Status: lifetime`);
  console.log(`- Total Soal: 11.000 Soal Pertama\n`);
} catch (err) {
  console.error('❌ Error executing wrangler:', err.message);
  process.exit(1);
}
