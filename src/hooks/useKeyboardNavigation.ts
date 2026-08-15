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
  closeModals,
  toggleImageZoom
}: KeyboardNavigationOptions) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  useEffect(() => {
    if (!isActive || screen !== 'quiz' || currentQuiz.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in text inputs
      const activeEl = document.activeElement;
      const isInput = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA';
      setIsInputFocused(isInput);
      
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

      // Enter: Next / Confirm
      if (e.key === 'Enter' && handleNext) {
        handleNext();
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
      
      // 1-5 keys for MCQ answers selection
      const numbers = ['1', '2', '3', '4', '5'];
      if (numbers.includes(e.key)) {
        const q = currentQuiz[currentIndex];
        if (q?.pilihan && q.pilihan.length > 0) {
          const idx = numbers.indexOf(e.key);
          if (idx < q.pilihan.length) {
            selectAnswer(q.pilihan[idx]);
            // Auto-next delay requested by user: 300ms
            if (handleNext && currentIndex < currentQuiz.length - 1) {
              setTimeout(() => {
                handleNext();
              }, 300);
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, screen, currentQuiz, currentIndex, selectAnswer, toggleDoubt, setIsQuestionMapOpen, handleNext, closeModals, toggleImageZoom, isModalOpen]);

  return { isModalOpen, setIsModalOpen, isInputFocused };
}
