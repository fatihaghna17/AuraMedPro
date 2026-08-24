export interface QuestionMetadata {
  sub_kompetensi_klinis?: string;
  tingkat_kognitif?: string;
  tingkat_kesulitan?: string;
  xp?: number;
}

export interface FeatureFlags {
  showHints?: boolean;
  maxHintsAllowed?: number;
  hintPenalty?: number;
  shuffleCards?: boolean;
  [key: string]: any; // fallback for other custom flags
}

export interface Question {
  pertanyaan: string;
  pilihan: string[];
  jawaban_benar: string;
  pembahasan: string;
  eliminasi_opsi?: Record<string, string>;
  metadata?: QuestionMetadata;
  gambar?: string;
  gambar_url?: string;
  image?: string;
  image_url?: string;
  imageUrl?: string;
  hints?: string[];
  featureFlags?: FeatureFlags;
}

export interface HistoryEntry {
  id: number;
  date: string;
  score: number;
  correct: number;
  wrong: number;
  empty: number;
  total: number;
  files: string[];
  mode: 'utuh' | 'simulasi';
  questions?: Question[];
  userAnswers?: (string | null)[];
}

export type AppMode = 'dashboard' | 'quiz' | 'review' | 'history';
export type ScreenState = 'setup' | 'quiz' | 'result';
