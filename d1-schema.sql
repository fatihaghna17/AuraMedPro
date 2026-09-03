-- ==========================================================
-- Skema Database Cloudflare D1 (SQLite) untuk AuraMedPro
-- ==========================================================

-- 1. Tabel Profil Pengguna (XP, Level, Streak)
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'user',
    xp INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    total_questions_answered INTEGER DEFAULT 0,
    last_active TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_xp ON profiles(xp DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_questions ON profiles(total_questions_answered DESC);

-- 2. Tabel Bank Soal (Hanya menyimpan metadata & R2 link, 0 egress!)
CREATE TABLE IF NOT EXISTS question_banks (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    r2_key TEXT,
    r2_url TEXT,
    questions_json TEXT, -- fallback jika masih ada data JSON lama
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_question_banks_user ON question_banks(user_id);
CREATE INDEX IF NOT EXISTS idx_question_banks_name ON question_banks(name);

-- 3. Tabel Sesi Kuis Berjalan (Auto-save progress kuis)
CREATE TABLE IF NOT EXISTS quiz_sessions (
    user_id TEXT PRIMARY KEY,
    current_quiz_json TEXT NOT NULL,
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 4. Tabel Pengaturan Global Aplikasi (Custom Folders, Quiz Folder Mapping)
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- 5. Tabel Riwayat Kuis Selesai (Untuk Filter Leaderboard Harian, Mingguan, Bulanan)
CREATE TABLE IF NOT EXISTS quiz_history_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    file_name TEXT,
    score REAL DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    total_count INTEGER DEFAULT 0,
    time_spent INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_quiz_history_user ON quiz_history_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_history_created ON quiz_history_logs(created_at);

-- 6. Tabel Leaderboard Per Paket Soal
CREATE TABLE IF NOT EXISTS leaderboard (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    score REAL DEFAULT 0,
    questions_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, file_name)
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_file_score ON leaderboard(file_name, score DESC);

-- 7. Tabel Catatan Pembahasan / Jawaban (Per Soal)
CREATE TABLE IF NOT EXISTS answer_notes (
    user_id TEXT NOT NULL,
    question_text TEXT NOT NULL,
    note_content TEXT NOT NULL,
    updated_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, question_text)
);

-- 8. Tabel Prestasi Pengguna (User Achievements)
CREATE TABLE IF NOT EXISTS user_achievements (
    user_id TEXT NOT NULL,
    achievement_id TEXT NOT NULL,
    unlocked_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, achievement_id)
);

-- 9. Tabel Laporan Soal Bermasalah (Question Reports)
CREATE TABLE IF NOT EXISTS question_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    question_id TEXT,
    reason TEXT,
    details TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- 10. Tabel-Tabel Mode Mabar (Multiplayer)
CREATE TABLE IF NOT EXISTS mabar_rooms (
    id TEXT PRIMARY KEY,
    room_code TEXT UNIQUE,
    host_id TEXT NOT NULL,
    title TEXT,
    status TEXT DEFAULT 'waiting', -- waiting, in_progress, finished
    settings TEXT,
    current_question_index INTEGER DEFAULT 0,
    started_at TEXT,
    finished_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS mabar_room_players (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    score INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    is_ready INTEGER DEFAULT 0,
    last_seen TEXT,
    joined_at TEXT DEFAULT (datetime('now')),
    UNIQUE(room_id, user_id)
);

CREATE TABLE IF NOT EXISTS mabar_room_questions (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL,
    question_index INTEGER NOT NULL,
    question_data TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS mabar_player_stats (
    user_id TEXT PRIMARY KEY,
    matches_played INTEGER DEFAULT 0,
    matches_won INTEGER DEFAULT 0,
    total_score INTEGER DEFAULT 0,
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS mabar_match_history (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    rank INTEGER,
    score INTEGER,
    played_at TEXT DEFAULT (datetime('now'))
);
