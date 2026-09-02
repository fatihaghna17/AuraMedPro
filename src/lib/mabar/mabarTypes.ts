export type MabarGameMode = 'kahoot' | 'cerdas_cermat';
export type MabarSubMode = 'classic_1v1' | 'team' | 'speed' | 'tebak_diagnosis';
export type MabarRoomStatus = 'waiting' | 'in_progress' | 'finished' | 'cancelled';

export interface MabarRoom {
  id: string;
  code: string;
  host_id: string;
  mode: MabarGameMode;
  sub_mode?: MabarSubMode;
  topic: string;
  status: MabarRoomStatus;
  max_players: number;
  current_question_index: number;
  total_questions: number;
  time_limit_per_question: number;
  created_at: string;
  started_at?: string;
  finished_at?: string;
}

export interface MabarRoomPlayer {
  id: string;
  room_id: string;
  user_id: string;
  display_name: string;
  avatar_url?: string;
  score: number;
  streak: number;
  correct_count: number;
  is_ready: boolean;
  joined_at: string;
}

export interface MabarRoomQuestion {
  id: string;
  room_id: string;
  question_id: string;
  order_index: number;
  correct_answer: string;
  created_at: string;
}

export interface MabarAnswer {
  id: string;
  room_id: string;
  user_id: string;
  question_order_index: number;
  selected_answer: string;
  is_correct: boolean;
  response_time_ms: number;
  answered_at: string;
}

export interface MabarMatchHistory {
  id: string;
  room_id?: string;
  user_id: string;
  mode: string;
  result: 'win' | 'lose' | 'draw';
  score: number;
  opponent_score?: number;
  played_at: string;
}

export interface MabarPlayerStats {
  id: string;
  user_id: string;
  total_matches: number;
  total_wins: number;
  total_losses: number;
  total_draws: number;
  total_kahoot_played: number;
  total_cerdas_cermat_played: number;
  highest_score: number;
  total_correct_answers: number;
  average_response_time_ms: number;
  current_streak: number;
  best_streak: number;
  elo_rating: number;
  updated_at: string;
}

// Realtime Events Union Type
export type MabarRealtimeEvent =
  | { type: 'player_joined'; payload: { player: MabarRoomPlayer } }
  | { type: 'player_left'; payload: { userId: string } }
  | { type: 'player_kicked'; payload: { userId: string } }
  | { type: 'game_starting'; payload: { totalQuestions: number; timeLimit: number } }
  | { type: 'question_start'; payload: { questionIndex: number; question: any; startTime: number } }
  | { type: 'player_answered'; payload: { userId: string; isCorrect: boolean; score: number; responseTime: number } }
  | { type: 'question_end'; payload: { questionIndex: number; correctAnswer: string; allAnswers: MabarAnswer[] } }
  | { type: 'game_finished'; payload: { finalScores: MabarRoomPlayer[]; podium: [any, any, any] } }
  | { type: 'room_cancelled'; payload: { reason: string } }
  | { type: 'host_transferred'; payload: { newHostId: string } };

