import { useEffect, useState } from 'react';

interface KeyboardNavigationOptions {
  isActive: boolean;
  screen: string;
  currentQuiz: any[];
  currentIndex: number;
  setCurrentIndex: (updater: (prev: number) => number | number) => void;
  selectAnswer: (ans: string) => void;
  toggleDoubt?: () => void;
  setIsQuestionMapOpen?: (updater: (prev: boolean) => boolean) => void;
  handleNext?: () => void;
  checkAnswer?: () => void;
  isRevealed?: Record<number, boolean> | boolean[];
  closeModals?: () => void;
  toggleImageZoom?: () => void;
}

export function useKeyboardNavigation({
  isActive,
  screen,
  currentQuiz,
  currentIndex,
  setCurrentIndex,
  selectAnswer,
  toggleDoubt,
  setIsQuestionMapOpen,
  handleNext,
  checkAnswer,
  isRevealed,
  closeModals,
  toggleImageZoom
}: KeyboardNavigationOptions) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  useEffect(() => {
    if (!isActive || screen !== 'quiz' || currentQuiz.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in text inputs, EXCEPT if Enter is pressed (to check answer)
      const activeEl = document.activeElement;
      const isInput = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA';
      setIsInputFocused(isInput);

      // Enter: Cek Jawaban jika belum terbuka pembahasannya, atau Selanjutnya jika sudah
      if (e.key === 'Enter') {
        const revealed = isRevealed ? Boolean((isRevealed as any)[currentIndex]) : false;
        if (!revealed && checkAnswer) {
          e.preventDefault();
          checkAnswer();
          return;
        }
        if (revealed && handleNext) {
          e.preventDefault();
          handleNext();
          return;
        }
      }

      if (isInput) return;
      if (isModalOpen && e.key !== 'Escape') return; // Only allow Escape when modal is open

      const key = e.key.toUpperCase();
      
      // Escape: Close modals
      if (e.key === 'Escape') {
        if (closeModals) closeModals();
        setIsModalOpen(false);
        return;
      }

      // M: Question Map
      if (key === 'M' && setIsQuestionMapOpen) {
        setIsQuestionMapOpen(prev => {
          setIsModalOpen(!prev);
          return !prev;
        });
        return;
      }
      
      // Z: Zoom Image
      if (key === 'Z' && toggleImageZoom) {
        toggleImageZoom();
        return;
      }

      // R: Ragu-ragu
      if (key === 'R' && toggleDoubt) {
        toggleDoubt();
        return;
      }

      // Arrow Left / P: Previous
      if (e.key === 'ArrowLeft' || key === 'P') {
        if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
        return;
      } 
      
      // Arrow Right / N: Next
      if (e.key === 'ArrowRight' || key === 'N') {
        if (currentIndex < currentQuiz.length - 1) setCurrentIndex((prev) => prev + 1);
        return;
      }
      
      // 1-5 or A-E keys for MCQ answers selection
      const letters = ['A', 'B', 'C', 'D', 'E'];
      const numbers = ['1', '2', '3', '4', '5'];
      let selectedIdx = -1;

      if (numbers.includes(e.key)) {
        selectedIdx = numbers.indexOf(e.key);
      } else if (letters.includes(key)) {
        selectedIdx = letters.indexOf(key);
      }

      if (selectedIdx !== -1) {
        const q = currentQuiz[currentIndex];
        if (q?.pilihan && q.pilihan.length > selectedIdx) {
          selectAnswer(q.pilihan[selectedIdx]);
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, screen, currentQuiz, currentIndex, selectAnswer, toggleDoubt, setIsQuestionMapOpen, handleNext, checkAnswer, isRevealed, closeModals, toggleImageZoom, isModalOpen]);

  return { isModalOpen, setIsModalOpen, isInputFocused };
}
