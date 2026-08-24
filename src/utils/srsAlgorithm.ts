// src/utils/srsAlgorithm.ts

export interface SRSCard {
  id?: string;
  user_id?: string;
  question_ref: string;
  question_bank_name: string;
  question_json: any;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_date: string;
  last_review_date?: string;
  last_quality?: number;
  total_reviews: number;
  correct_reviews: number;
}

export type QualityRating = 0 | 1 | 2 | 3 | 4 | 5;
/*
  0 = Complete blackout
  1 = Incorrect, but recognized after answer shown
  2 = Incorrect, but answer seemed easy to recall
  3 = Correct with serious difficulty
  4 = Correct after hesitation
  5 = Perfect response
*/

export function generateQuestionFingerprint(question: { pertanyaan: string }): string {
  const normalized = question.pertanyaan
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  let hash = 5381;
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) + hash + normalized.charCodeAt(i)) & 0xFFFFFFFF;
  }
  return hash.toString(36);
}

export function calculateSM2(
  card: SRSCard,
  quality: QualityRating
): Omit<SRSCard, 'id' | 'user_id' | 'question_ref' | 'question_bank_name' | 'question_json' | 'created_at'> {
  let { ease_factor, interval_days, repetitions, total_reviews, correct_reviews } = card;
  const now = new Date();
  const isCorrect = quality >= 3;
  total_reviews += 1;
  if (isCorrect) correct_reviews += 1;

  if (quality < 3) {
    repetitions = 0;
    interval_days = 1;
  } else {
    if (repetitions === 0) interval_days = 1;
    else if (repetitions === 1) interval_days = 6;
    else interval_days = Math.round(interval_days * ease_factor);
    repetitions += 1;
  }

  let newEF = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  newEF = Math.max(1.3, Math.round(newEF * 100) / 100);

  const nextReviewDate = new Date(now);
  nextReviewDate.setDate(nextReviewDate.getDate() + interval_days);

  return {
    ease_factor: newEF,
    interval_days,
    repetitions,
    next_review_date: nextReviewDate.toISOString(),
    last_review_date: now.toISOString(),
    last_quality: quality,
    total_reviews,
    correct_reviews,
    updated_at: now.toISOString(),
  };
}

export function getIntervalLabel(intervalDays: number): string {
  if (intervalDays <= 0) return 'Sekarang';
  if (intervalDays === 1) return 'Besok';
  if (intervalDays < 7) return `${intervalDays} hari lagi`;
  if (intervalDays < 30) return `${Math.round(intervalDays / 7)} minggu lagi`;
  if (intervalDays < 365) return `${Math.round(intervalDays / 30)} bulan lagi`;
  return `${Math.round(intervalDays / 365)} tahun lagi`;
}

export function categorizeCards(cards: SRSCard[]) {
  const now = new Date();
  const due = cards.filter(c => new Date(c.next_review_date) <= now);
  const learning = cards.filter(c => c.repetitions < 2 && new Date(c.next_review_date) > now);
  const mature = cards.filter(c => c.repetitions >= 2);
  return {
    due, learning, mature,
    total: cards.length,
    dueCount: due.length,
    retentionRate: cards.length > 0
      ? Math.round((cards.reduce((a, c) => a + c.correct_reviews, 0) / Math.max(1, cards.reduce((a, c) => a + c.total_reviews, 0))) * 100)
      : 0
  };
}
