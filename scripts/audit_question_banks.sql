-- ============================================================
-- AUDIT EGRESS: question_banks — inline vs pointer R2
-- Jalankan di: Supabase Dashboard → SQL Editor
--
-- Tujuan:
--   Mengukur berapa banyak bank soal yang masih menyimpan JSON
--   soal utuh (inline) di kolom questions_json — ini penyebab
--   egress Supabase membengkak, karena setiap login user
--   menarik semua bank ini berulang-ulang.
--
--   - jsonb_typeof = 'array'  -> row INLINE (masih full JSON) ❌
--   - jsonb_typeof = 'object' + r2_key -> POINTER ke R2 ✅
-- ============================================================

-- 1) Ringkasan total (angka paling penting)
SELECT
  COUNT(*) FILTER (WHERE jsonb_typeof(questions_json) = 'array')                       AS bank_inline,
  COALESCE(SUM(pg_column_size(questions_json)) FILTER (WHERE jsonb_typeof(questions_json) = 'array'), 0) AS total_inline_bytes,
  pg_size_pretty(COALESCE(SUM(pg_column_size(questions_json)) FILTER (WHERE jsonb_typeof(questions_json) = 'array'), 0)) AS total_inline_human,
  COUNT(*) FILTER (WHERE jsonb_typeof(questions_json) = 'object' AND questions_json ? 'r2_key') AS bank_pointer_r2
FROM question_banks;

-- 2) Rincian per bank (urut dari yang paling berat)
SELECT
  name,
  jsonb_typeof(questions_json)                                      AS tipe_data,
  CASE
    WHEN jsonb_typeof(questions_json) = 'array' THEN 'INLINE (perlu migrasi)'
    WHEN questions_json ? 'r2_key'               THEN 'pointer R2 (OK)'
    ELSE 'pointer rusak / tidak dikenal'
  END                                                               AS status,
  pg_column_size(questions_json)                                    AS ukuran_bytes,
  questions_json->>'r2_key'                                         AS r2_key
FROM question_banks
ORDER BY ukuran_bytes DESC
LIMIT 100;
