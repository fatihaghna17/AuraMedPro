-- ==============================================================================
-- AuraMedPro: Ekspor Data Tabel Langsung dari Supabase SQL Editor
-- (Gunakan ini jika REST API Supabase terblokir HTTP 402 Quota Egress)
-- ==============================================================================
-- INSTRUKSI:
-- Jalankan masing-masing query di bawah di Supabase SQL Editor,
-- lalu simpan hasilnya sebagai file .json di folder export/<nama_tabel>.json

-- 1. export/srs_cards.json
SELECT coalesce(json_agg(t), '[]'::json) FROM public.srs_cards t;

-- 2. export/study_notes.json
SELECT coalesce(json_agg(t), '[]'::json) FROM public.study_notes t;

-- 3. export/bookmarks.json
SELECT coalesce(json_agg(t), '[]'::json) FROM public.bookmarks t;

-- 4. export/mabar_answers.json
SELECT coalesce(json_agg(t), '[]'::json) FROM public.mabar_answers t;

-- 5. export/mabar_rooms.json (opsional / jika ada data lama)
SELECT coalesce(json_agg(t), '[]'::json) FROM public.mabar_rooms t;

-- 6. export/mabar_room_players.json
SELECT coalesce(json_agg(t), '[]'::json) FROM public.mabar_room_players t;

-- 7. export/mabar_player_stats.json
SELECT coalesce(json_agg(t), '[]'::json) FROM public.mabar_player_stats t;

-- 8. export/mabar_match_history.json
SELECT coalesce(json_agg(t), '[]'::json) FROM public.mabar_match_history t;
