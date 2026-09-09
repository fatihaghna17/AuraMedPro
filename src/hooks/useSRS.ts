// src/hooks/useSRS.ts
import { useState, useEffect, useCallback } from 'react';
import { cloudflareApi } from '../services/cloudflareApi';
import { SRSCard, QualityRating, calculateSM2, generateQuestionFingerprint, categorizeCards } from '../utils/srsAlgorithm';
import { Question } from '../types';
import { isUserAnswerCorrect } from '../utils/quizUtils';

export function useSRS(userId: string | null) {
  const [cards, setCards] = useState<SRSCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dueCards, setDueCards] = useState<SRSCard[]>([]);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [isReviewing, setIsReviewing] = useState(false);

  const fetchCards = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const data = await cloudflareApi.getSRSCards(userId);
      setCards(data || []);
    } catch (err) {
      console.error('Error fetching SRS cards:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchCards(); }, [fetchCards]);

  useEffect(() => {
    const now = new Date();
    setDueCards(cards.filter(c => new Date(c.next_review_date) <= now));
  }, [cards]);

  const addWrongAnswers = useCallback(async (
    questions: Question[],
    userAnswers: (string | null)[],
    bankName: string
  ) => {
    if (!userId) return;
    const wrongQuestions = questions.filter((q, i) => {
      const ans = userAnswers[i];
      if (ans === null) return false;
      return !isUserAnswerCorrect(ans, q);
    });
    if (wrongQuestions.length === 0) return;

    const inserts = wrongQuestions.map(q => ({
      user_id: userId,
      question_ref: generateQuestionFingerprint(q),
      question_bank_name: bankName,
      question_json: q,
      ease_factor: 2.5,
      interval_days: 1,
      repetitions: 0,
      next_review_date: new Date().toISOString(),
      total_reviews: 0,
      correct_reviews: 0,
    }));

    try {
      await cloudflareApi.saveSRSCards(inserts);
      await fetchCards();
    } catch (err) {
      console.error('Error adding wrong answers to SRS:', err);
    }
  }, [userId, fetchCards]);

  const submitRating = useCallback(async (quality: QualityRating) => {
    const card = dueCards[currentReviewIndex];
    if (!card || !userId) return;
    const updated = calculateSM2(card, quality);

    try {
      await cloudflareApi.updateSRSCard({ id: card.id, ...updated });

      if (currentReviewIndex < dueCards.length - 1) {
        setCurrentReviewIndex(prev => prev + 1);
      } else {
        setIsReviewing(false);
        setCurrentReviewIndex(0);
      }
      await fetchCards();
    } catch (err) {
      console.error('Error submitting SRS rating:', err);
    }
  }, [userId, dueCards, currentReviewIndex, fetchCards]);

  const removeCard = useCallback(async (cardId: string) => {
    if (!userId) return;
    try {
      await cloudflareApi.deleteSRSCard(cardId);
      await fetchCards();
    } catch (err) {
      console.error('Error removing SRS card:', err);
    }
  }, [userId, fetchCards]);

  const stats = categorizeCards(cards);

  return {
    cards, dueCards, isLoading,
    currentReviewIndex, isReviewing, stats,
    fetchCards, addWrongAnswers, submitRating, removeCard,
    startReview: () => { setCurrentReviewIndex(0); setIsReviewing(true); },
    stopReview: () => { setIsReviewing(false); setCurrentReviewIndex(0); },
  };
}
