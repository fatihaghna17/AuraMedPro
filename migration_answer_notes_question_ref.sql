-- Migration: Add question_ref column to answer_notes table
-- Run this in Supabase SQL Editor
-- This fixes "catatan tidak tersimpan" caused by raw HTML question_text
-- exceeding PostgreSQL's 2700-byte unique index limit.

-- Step 1: Add question_ref column (nullable for now)
ALTER TABLE answer_notes ADD COLUMN IF NOT EXISTS question_ref text;

-- Step 2: Backfill existing rows — compute fingerprint from question_text
-- Using PL/pgSQL to replicate the DJB2 hash + base-36 conversion from JS
DO $$
DECLARE
  rec RECORD;
  normalized text;
  hash bigint;
  i int;
  chars text := '0123456789abcdefghijklmnopqrstuvwxyz';
  result text;
  num bigint;
BEGIN
  FOR rec IN SELECT id, question_text FROM answer_notes WHERE question_ref IS NULL LOOP
    -- Normalize: strip HTML, collapse whitespace, lowercase, trim
    normalized := btrim(
      regexp_replace(
        regexp_replace(
          lower(regexp_replace(rec.question_text, '<[^>]*>', '', 'g')),
          E'\\s+', ' ', 'g'
        ),
        '^\\s+|\\s+$', '', 'g'
      )
    );

    -- DJB2 hash
    hash := 5381;
    FOR i IN 1..length(normalized) LOOP
      hash := ((hash << 5) + hash + ascii(substring(normalized, i, 1))) & 4294967295;
    END LOOP;

    -- Convert to base-36 (same as JS hash.toString(36))
    result := '';
    num := hash;
    IF num = 0 THEN
      result := '0';
    ELSE
      WHILE num > 0 LOOP
        result := substr(chars, (num % 36)::int + 1, 1) || result;
        num := num / 36;
      END LOOP;
    END IF;

    UPDATE answer_notes SET question_ref = result WHERE id = rec.id;
  END LOOP;
END $$;

-- Step 3: Drop old unique constraint (if exists)
DO $$
BEGIN
  ALTER TABLE answer_notes DROP CONSTRAINT IF EXISTS answer_notes_user_id_question_text_key;
  ALTER TABLE answer_notes DROP CONSTRAINT IF EXISTS answer_notes_pkey;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Step 4: Add new unique constraint on (user_id, question_ref)
ALTER TABLE answer_notes ADD CONSTRAINT answer_notes_user_id_question_ref_key UNIQUE (user_id, question_ref);

-- Step 5: Make question_ref NOT NULL (all rows now have it)
ALTER TABLE answer_notes ALTER COLUMN question_ref SET NOT NULL;
