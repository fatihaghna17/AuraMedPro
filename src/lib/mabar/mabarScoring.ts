export function calculateScore(
  responseTimeMs: number,
  timeLimitMs: number,
  currentStreak: number,
  isCorrect: boolean
): number {
  if (!isCorrect) return 0;

  const BASE_SCORE = 1000;
  const MAX_SPEED_BONUS = 500;

  // Speed bonus: makin cepat, makin tinggi bonus
  const speedRatio = Math.max(0, 1 - responseTimeMs / timeLimitMs);
  const speedBonus = Math.round(MAX_SPEED_BONUS * speedRatio);

  // Streak multiplier
  const newStreak = currentStreak + 1;
  let streakMultiplier = 1.0;
  if (newStreak >= 5) streakMultiplier = 2.0;
  else if (newStreak >= 3) streakMultiplier = 1.5;
  else if (newStreak >= 2) streakMultiplier = 1.2;

  return Math.round((BASE_SCORE + speedBonus) * streakMultiplier);
}
