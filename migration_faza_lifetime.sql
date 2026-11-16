-- ==========================================================
-- Migration: Set Akun Faza Jadi Lifetime
-- Penghargaan: Telah menyelesaikan 11.000 soal (sama seperti Jidan)
-- ==========================================================
-- Jalankan via: npx wrangler d1 execute auramedpro-db --remote --file=migration_faza_lifetime.sql

-- 1. Update profil Faza jika sudah ada
UPDATE profiles 
SET 
  subscription_status = 'lifetime', 
  subscription_expires_at = NULL, 
  total_questions_answered = MAX(COALESCE(total_questions_answered, 0), 11000)
WHERE 
  LOWER(username) = 'faza' 
  OR LOWER(email) = 'faza@ai.online' 
  OR LOWER(email) LIKE '%faza%';

-- 2. Pastikan record Faza terbuat jika belum ada di database
INSERT INTO profiles (
  id, username, email, password_hash, is_guest, role, xp, streak, level, 
  total_questions_answered, created_at, last_active, angkatan, prodi, 
  subscription_status, subscription_expires_at, trial_ends_at
)
SELECT 
  'faza-lifetime-profile-id',
  'faza',
  'faza@ai.online',
  'pbkdf2$100000$u+KOiSHmnPioqJSRVQpETg==$f1fi2qT7HMZ9m3wpEWDhRECg6SM5OFWhKD8802EUUcU=',
  0,
  'user',
  110000,
  30,
  25,
  11000,
  datetime('now'),
  datetime('now'),
  '24',
  'kedokteran',
  'lifetime',
  NULL,
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM profiles WHERE LOWER(username) = 'faza' OR LOWER(email) = 'faza@ai.online' OR LOWER(email) LIKE '%faza%'
);
