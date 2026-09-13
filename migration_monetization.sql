-- Migration: Monetisasi + Multi-Angkatan AuraMedPro
-- Jalankan via: wrangler d1 execute auramedpro-db --remote --file=migration_monetization.sql

-- 1. Tambah kolom di profiles
ALTER TABLE profiles ADD COLUMN angkatan TEXT;
ALTER TABLE profiles ADD COLUMN subscription_status TEXT DEFAULT 'trial';
ALTER TABLE profiles ADD COLUMN trial_ends_at TEXT DEFAULT '2026-09-14T05:00:00Z';
ALTER TABLE profiles ADD COLUMN subscription_expires_at TEXT;

-- 2. Tambah kolom di question_banks
ALTER TABLE question_banks ADD COLUMN angkatan TEXT DEFAULT 'all';

-- 3. Tabel payments baru
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    source TEXT NOT NULL,
    reference_id TEXT,
    amount INTEGER NOT NULL,
    unique_code INTEGER,
    status TEXT DEFAULT 'pending',
    plan TEXT DEFAULT '1_month',
    paid_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_unique_code ON payments(unique_code);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- 4. Set semua akun existing sebagai trial
UPDATE profiles SET subscription_status = 'trial', trial_ends_at = '2026-09-14T05:00:00Z' WHERE subscription_status IS NULL;

-- 5. Set semua soal existing sebagai soal bersama (all)
UPDATE question_banks SET angkatan = 'all' WHERE angkatan IS NULL;
