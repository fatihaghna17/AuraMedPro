// src/types/flashcard3d.ts
// Flashcard 3D (kartu bolak-balik). Terpisah dari Flashcard Isian Singkat lama.

export interface Flashcard3DFace {
  text: string;
  image?: string | null; // URL atau data URL (webp terkompres)
}

export interface Flashcard3DCard {
  id: string;
  front: Flashcard3DFace;
  back: Flashcard3DFace;
  tags?: string[];
}

export interface Flashcard3DDeck {
  id: string;
  title: string;
  cards: Flashcard3DCard[];
  createdAt: number;
  updatedAt: number;
  lastOpenedAt?: number | null;
  /** Cloud sync & publikasi global */
  userId?: string;
  uploaderUsername?: string;
  isPublic?: boolean;
  angkatan?: string; // 'all' atau '2024', '2025', '2026'
  prodi?: string;    // 'all' atau 'kedokteran', 'farmasi', 'kebidanan'
  synced?: boolean;  // true jika tersimpan di D1/R2
}

/** cardId -> true (Hafal) | false (Belum hafal). Kartu yang belum dinilai tidak ada di map. */
export type Flashcard3DProgress = Record<string, boolean>;

export type Flashcard3DFilter = 'all' | 'unknown';
