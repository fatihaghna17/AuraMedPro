-- ==============================================================================
-- AuraMedPro Migration: Export auth.users dari Supabase SQL Editor
-- ==============================================================================
-- INSTRUKSI PENGGUNAAN:
-- 1. Buka dashboard Supabase proyek AuraMedPro: https://supabase.com/dashboard/project/_/sql
-- 2. Buat query baru di SQL Editor.
-- 3. Paste dan jalankan query di bawah ini:
--
--    SELECT json_agg(
--      json_build_object(
--        'id', id,
--        'email', email,
--        'encrypted_password', encrypted_password
--      )
--    ) AS users_json
--    FROM auth.users;
--
-- 4. Salin (copy) hasil output JSON atau klik tombol Download/Export -> JSON.
-- 5. Simpan file hasil ekspor ke dalam repo pada path:
--    export/auth_users.json
--
-- Catatan: Format yang diharapkan di export/auth_users.json adalah array JSON:
-- [
--   {
--     "id": "47c2368d-792a-4c69-9386-4b7d2139ddc3",
--     "email": "admin@ai.online",
--     "encrypted_password": "$2a$10$..."
--   },
--   ...
-- ]
-- ==============================================================================

SELECT json_agg(
  json_build_object(
    'id', id,
    'email', email,
    'encrypted_password', encrypted_password
  )
) AS users_json
FROM auth.users;
