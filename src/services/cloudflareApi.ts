// src/services/cloudflareApi.ts
// Cloudflare Pages Functions & D1 API Client with graceful fallback

const API_BASE = '/api';

export interface ProfileData {
  id: string;
  username: string;
  role?: string;
  xp?: number;
  streak?: number;
  level?: number;
  total_questions_answered?: number;
  last_active?: string;
  created_at?: string;
  active_session_id?: string;
}

export interface QuestionBankMeta {
  id: string;
  name: string;
  user_id: string;
  r2_key?: string;
  r2_url?: string;
  questions_json?: any;
  created_at?: string;
  uploader_username?: string;
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<{ data?: T; error?: string; success?: boolean }> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      return { error: errBody.error || `HTTP error ${res.status}` };
    }

    return await res.json();
  } catch (err: any) {
    console.warn(`[CloudflareApi] Request to ${url} failed:`, err.message);
    return { error: err.message || 'Network error' };
  }
}

export const cloudflareApi = {
  // Profiles
  async getProfile(id: string): Promise<ProfileData | null> {
    const res = await fetchJson<ProfileData>(`${API_BASE}/profiles?id=${encodeURIComponent(id)}`);
    return res.data || null;
  },

  async getProfileByUsername(username: string): Promise<ProfileData | null> {
    const res = await fetchJson<ProfileData>(`${API_BASE}/profiles?username=${encodeURIComponent(username)}`);
    return res.data || null;
  },

  async saveProfile(profile: ProfileData): Promise<ProfileData | null> {
    const res = await fetchJson<ProfileData>(`${API_BASE}/profiles`, {
      method: 'POST',
      body: JSON.stringify(profile),
    });
    return res.data || null;
  },

  // Question Banks
  async getQuestionBanks(): Promise<QuestionBankMeta[]> {
    const res = await fetchJson<QuestionBankMeta[]>(`${API_BASE}/question-banks`);
    return res.data || [];
  },

  async saveQuestionBank(bank: {
    name: string;
    user_id: string;
    r2_key?: string;
    r2_url?: string;
    questions_json?: any;
  }): Promise<boolean> {
    const res = await fetchJson(`${API_BASE}/question-banks`, {
      method: 'POST',
      body: JSON.stringify(bank),
    });
    return !res.error;
  },

  async deleteQuestionBank(name: string): Promise<boolean> {
    const res = await fetchJson(`${API_BASE}/question-banks?name=${encodeURIComponent(name)}`, {
      method: 'DELETE',
    });
    return !res.error;
  },

  // Leaderboard
  async getGlobalLeaderboard(timeFilter: 'all' | '1' | '7' | '30'): Promise<any[]> {
    const res = await fetchJson<any[]>(`${API_BASE}/leaderboard?type=global&filter=${timeFilter}`);
    return res.data || [];
  },

  async getFileLeaderboard(fileName: string, timeFilter: 'all' | '1' | '7' | '30'): Promise<any[]> {
    const res = await fetchJson<any[]>(
      `${API_BASE}/leaderboard?type=file&file_name=${encodeURIComponent(fileName)}&filter=${timeFilter}`
    );
    return res.data || [];
  },

  async recordQuizResult(data: {
    user_id: string;
    file_name: string;
    score: number;
    correct_count: number;
    total_count: number;
    time_spent?: number;
  }): Promise<boolean> {
    const res = await fetchJson(`${API_BASE}/leaderboard`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return !res.error;
  },

  // Quiz Sessions
  async getQuizSession(userId: string): Promise<any | null> {
    const res = await fetchJson<any>(`${API_BASE}/quiz-sessions?user_id=${encodeURIComponent(userId)}`);
    return res.data ? res.data.current_quiz_json : null;
  },

  async saveQuizSession(userId: string, currentQuizJson: any): Promise<boolean> {
    const res = await fetchJson(`${API_BASE}/quiz-sessions`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, current_quiz_json: currentQuizJson }),
    });
    return !res.error;
  },

  async deleteQuizSession(userId: string): Promise<boolean> {
    const res = await fetchJson(`${API_BASE}/quiz-sessions?user_id=${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    });
    return !res.error;
  },

  // App Settings
  async getAppSettings(key?: string): Promise<any> {
    const url = key ? `${API_BASE}/app-settings?key=${encodeURIComponent(key)}` : `${API_BASE}/app-settings`;
    const res = await fetchJson<any>(url);
    return res.data;
  },

  async saveAppSettings(key: string, value: any): Promise<boolean> {
    const res = await fetchJson(`${API_BASE}/app-settings`, {
      method: 'POST',
      body: JSON.stringify({ key, value }),
    });
    return !res.error;
  },

  // Answer Notes
  async getAnswerNotes(userId: string): Promise<Array<{ question_text: string; note_content: string }>> {
    const res = await fetchJson<Array<{ question_text: string; note_content: string }>>(
      `${API_BASE}/notes?user_id=${encodeURIComponent(userId)}`
    );
    return res.data || [];
  },

  async saveAnswerNote(userId: string, questionText: string, noteContent: string): Promise<boolean> {
    const res = await fetchJson(`${API_BASE}/notes`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, question_text: questionText, note_content: noteContent }),
    });
    return !res.error;
  },

  async deleteAnswerNote(userId: string, questionText: string): Promise<boolean> {
    const res = await fetchJson(
      `${API_BASE}/notes?user_id=${encodeURIComponent(userId)}&question_text=${encodeURIComponent(questionText)}`,
      { method: 'DELETE' }
    );
    return !res.error;
  },

  // Achievements
  async getAchievements(userId: string): Promise<string[]> {
    const res = await fetchJson<Array<{ achievement_id: string }>>(
      `${API_BASE}/achievements?user_id=${encodeURIComponent(userId)}`
    );
    return (res.data || []).map(r => r.achievement_id);
  },

  async saveAchievement(userId: string, achievementId: string): Promise<boolean> {
    const res = await fetchJson(`${API_BASE}/achievements`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, achievement_id: achievementId }),
    });
    return !res.error;
  },

  // Question Reports
  async reportQuestion(data: {
    user_id: string;
    question_id?: string;
    reason: string;
    details?: string;
  }): Promise<boolean> {
    const res = await fetchJson(`${API_BASE}/question-reports`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return !res.error;
  },

  // SRS Cards
  async getSRSCards(userId: string): Promise<any[]> {
    const res = await fetchJson<any[]>(`${API_BASE}/srs?user_id=${encodeURIComponent(userId)}`);
    return res.data || [];
  },

  async saveSRSCards(cards: any[]): Promise<boolean> {
    const res = await fetchJson(`${API_BASE}/srs`, {
      method: 'POST',
      body: JSON.stringify(cards),
    });
    return !res.error;
  },

  async updateSRSCard(card: any): Promise<boolean> {
    const res = await fetchJson(`${API_BASE}/srs`, {
      method: 'POST',
      body: JSON.stringify(card),
    });
    return !res.error;
  },

  async deleteSRSCard(cardId: string): Promise<boolean> {
    const res = await fetchJson(`${API_BASE}/srs?id=${encodeURIComponent(cardId)}`, {
      method: 'DELETE',
    });
    return !res.error;
  },

  // Study Room (Notes & Bookmarks)
  async getStudyData(userId: string): Promise<{ notes: any[]; bookmarks: any[] }> {
    const res = await fetchJson<{ notes: any[]; bookmarks: any[] }>(
      `${API_BASE}/study?user_id=${encodeURIComponent(userId)}`
    );
    return res.data || { notes: [], bookmarks: [] };
  },

  async saveStudyNote(note: any): Promise<boolean> {
    const res = await fetchJson(`${API_BASE}/study`, {
      method: 'POST',
      body: JSON.stringify({ type: 'note', ...note }),
    });
    return !res.error;
  },

  async deleteStudyNote(id: string): Promise<boolean> {
    const res = await fetchJson(`${API_BASE}/study?type=note&id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return !res.error;
  },

  async saveBookmark(bookmark: any): Promise<boolean> {
    const res = await fetchJson(`${API_BASE}/study`, {
      method: 'POST',
      body: JSON.stringify({ type: 'bookmark', ...bookmark }),
    });
    return !res.error;
  },

  async deleteBookmark(userId: string, questionRef: string): Promise<boolean> {
    const res = await fetchJson(
      `${API_BASE}/study?type=bookmark&user_id=${encodeURIComponent(userId)}&question_ref=${encodeURIComponent(questionRef)}`,
      { method: 'DELETE' }
    );
    return !res.error;
  },

  // Atomically increment total answered questions in profiles
  async incrementTotalAnswered(userId: string, count: number): Promise<boolean> {
    const profile = await this.getProfile(userId);
    if (!profile) return false;
    const current = profile.total_questions_answered || 0;
    const updated = await this.saveProfile({
      ...profile,
      total_questions_answered: current + count,
    });
    return Boolean(updated);
  },

  // Mabar (Multiplayer)
  async mabarAction(body: any): Promise<{ data?: any; error?: string; success?: boolean }> {
    return fetchJson(`${API_BASE}/mabar/action`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async mabarGetState(room: string, since?: string): Promise<{ data?: any; error?: string }> {
    const q = new URLSearchParams({ room });
    if (since) q.set('since', since);
    return fetchJson(`${API_BASE}/mabar/state?${q.toString()}`);
  },

  async mabarGetPlayerStats(userId: string): Promise<any | null> {
    const res = await fetchJson<any>(`${API_BASE}/mabar/stats?user_id=${encodeURIComponent(userId)}`);
    return res.data || null;
  },

  async mabarGetMatchHistory(userId: string): Promise<any[]> {
    const res = await fetchJson<any[]>(`${API_BASE}/mabar/history?user_id=${encodeURIComponent(userId)}`);
    return res.data || [];
  },
};

