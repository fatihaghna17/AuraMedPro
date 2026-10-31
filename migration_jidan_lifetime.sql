-- ==========================================================
-- Migration: Set Akun Jidan Jadi Lifetime
-- Penghargaan: Telah menyelesaikan 11.000 soal pertama
-- ==========================================================
-- Jalankan via: npx wrangler d1 execute auramedpro-db --remote --file=migration_jidan_lifetime.sql

-- 1. Update profil Jidan jika sudah ada
UPDATE profiles 
SET 
  subscription_status = 'lifetime', 
  subscription_expires_at = NULL, 
  total_questions_answered = MAX(COALESCE(total_questions_answered, 0), 11000)
WHERE 
  LOWER(username) = 'jidan' 
  OR LOWER(email) = 'jidan@ai.online' 
  OR id = '3f7bbfa8-27c0-4e92-bd71-23567802c7e0';

-- 2. Pastikan record Jidan terbuat jika belum ada di database
INSERT INTO profiles (
  id, username, email, password_hash, is_guest, role, xp, streak, level, 
  total_questions_answered, created_at, last_active, angkatan, prodi, 
  subscription_status, subscription_expires_at, trial_ends_at
)
SELECT 
  '3f7bbfa8-27c0-4e92-bd71-23567802c7e0',
  'jidan',
  'jidan@ai.online',
  '$2a$10$Vt4xmUully1nSM9cIwqaA.6eP0/byLd3VbMANggfYHPRyiJxK8N.2',
  0,
  'user',
  110000,
  30,
  25,
  11000,
  '2026-07-10T16:49:21.081292+00:00',
  datetime('now'),
  '24',
  'kedokteran',
  'lifetime',
  NULL,
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM profiles WHERE LOWER(username) = 'jidan' OR id = '3f7bbfa8-27c0-4e92-bd71-23567802c7e0'
);
