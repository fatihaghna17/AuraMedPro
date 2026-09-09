-- ==============================================================================
-- AuraMedPro: Skema Database Cloudflare D1 V2 (Migrasi Total dari Supabase)
-- ==============================================================================

-- 1. Perluasan Kolom pada Tabel profiles untuk Otentikasi & Session
ALTER TABLE profiles ADD COLUMN password_hash TEXT;
ALTER TABLE profiles ADD COLUMN is_guest INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN email TEXT;
ALTER TABLE profiles ADD COLUMN active_session_id TEXT;

-- 2. Tabel SRS (Spaced Repetition System) Cards
CREATE TABLE IF NOT EXISTS srs_cards (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    question_ref TEXT NOT NULL,
    question_bank_name TEXT,
    question_json TEXT NOT NULL,
    ease_factor REAL DEFAULT 2.5,
    interval_days INTEGER DEFAULT 1,
    repetitions INTEGER DEFAULT 0,
    next_review_date TEXT NOT NULL,
    total_reviews INTEGER DEFAULT 0,
    correct_reviews INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, question_ref)
);

CREATE INDEX IF NOT EXISTS idx_srs_cards_user ON srs_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_srs_cards_due ON srs_cards(user_id, next_review_date);

-- 3. Tabel Study Notes (Ruang Belajar)
CREATE TABLE IF NOT EXISTS study_notes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    question_ref TEXT,
    question_bank_name TEXT,
    tags TEXT, -- JSON array string
    color TEXT DEFAULT 'indigo',
    is_pinned INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_study_notes_user ON study_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_study_notes_pinned ON study_notes(user_id, is_pinned DESC, updated_at DESC);

-- 4. Tabel Bookmarks (Soal Tersimpan)
CREATE TABLE IF NOT EXISTS bookmarks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    question_ref TEXT NOT NULL,
    question_bank_name TEXT,
    question_json TEXT NOT NULL,
    note TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, question_ref)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);

-- 5. Tabel Mabar Answers
CREATE TABLE IF NOT EXISTS mabar_answers (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    question_order_index INTEGER NOT NULL,
    selected_answer TEXT,
    is_correct INTEGER DEFAULT 0,
    response_time_ms INTEGER DEFAULT 0,
    answered_at TEXT DEFAULT (datetime('now')),
    UNIQUE(room_id, user_id, question_order_index)
);

CREATE INDEX IF NOT EXISTS idx_mabar_answers_room ON mabar_answers(room_id);
CREATE INDEX IF NOT EXISTS idx_mabar_answers_user ON mabar_answers(user_id);

-- 6. Perluasan Kolom Mabar untuk kompatibilitas frontend mabarTypes & mabarRoomManager
ALTER TABLE mabar_rooms ADD COLUMN code TEXT;
ALTER TABLE mabar_rooms ADD COLUMN mode TEXT;
ALTER TABLE mabar_rooms ADD COLUMN sub_mode TEXT;
ALTER TABLE mabar_rooms ADD COLUMN topic TEXT;
ALTER TABLE mabar_rooms ADD COLUMN total_questions INTEGER;
ALTER TABLE mabar_rooms ADD COLUMN time_limit_per_question INTEGER;
ALTER TABLE mabar_rooms ADD COLUMN max_players INTEGER;

ALTER TABLE mabar_room_players ADD COLUMN display_name TEXT;
ALTER TABLE mabar_room_players ADD COLUMN avatar_url TEXT;
ALTER TABLE mabar_room_players ADD COLUMN correct_count INTEGER DEFAULT 0;

ALTER TABLE mabar_player_stats ADD COLUMN total_draws INTEGER DEFAULT 0;
ALTER TABLE mabar_player_stats ADD COLUMN total_losses INTEGER DEFAULT 0;
ALTER TABLE mabar_player_stats ADD COLUMN total_kahoot_played INTEGER DEFAULT 0;
ALTER TABLE mabar_player_stats ADD COLUMN total_cerdas_cermat_played INTEGER DEFAULT 0;
ALTER TABLE mabar_player_stats ADD COLUMN highest_score INTEGER DEFAULT 0;
ALTER TABLE mabar_player_stats ADD COLUMN total_correct_answers INTEGER DEFAULT 0;
ALTER TABLE mabar_player_stats ADD COLUMN average_response_time_ms INTEGER DEFAULT 0;
ALTER TABLE mabar_player_stats ADD COLUMN current_streak INTEGER DEFAULT 0;
ALTER TABLE mabar_player_stats ADD COLUMN best_streak INTEGER DEFAULT 0;
ALTER TABLE mabar_player_stats ADD COLUMN elo_rating INTEGER DEFAULT 1000;

ALTER TABLE mabar_match_history ADD COLUMN mode TEXT;
ALTER TABLE mabar_match_history ADD COLUMN result TEXT;
ALTER TABLE mabar_match_history ADD COLUMN opponent_score INTEGER;

CREATE INDEX IF NOT EXISTS idx_mabar_rooms_code ON mabar_rooms(code);
CREATE INDEX IF NOT EXISTS idx_mabar_rooms_room_code ON mabar_rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_mabar_players_room ON mabar_room_players(room_id);
