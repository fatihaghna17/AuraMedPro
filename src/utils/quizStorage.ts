import { HistoryEntry } from '../types';

export const loadHistoryFromLocalStorage = (): HistoryEntry[] => {
  try {
    const saved = localStorage.getItem('cbtQuizHistory');
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn('Error loading history:', e);
  }
  return [];
};

export const saveHistoryToLocalStorage = (newHistory: HistoryEntry[], setQuizHistory: (h: HistoryEntry[]) => void) => {
  setQuizHistory(newHistory);
  try { 
    localStorage.setItem('cbtQuizHistory', JSON.stringify(newHistory)); 
  } catch(e) { 
    console.warn('localStorage full'); 
  }
};
