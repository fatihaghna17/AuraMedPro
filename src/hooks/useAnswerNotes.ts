import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { generateQuestionFingerprint } from '../utils/srsAlgorithm';
import { isUserAnswerCorrect, getCorrectLetterForQuestion } from '../utils/quizUtils';
import { Question } from '../types';
import { cloudflareApi } from '../services/cloudflareApi';

export function useAnswerNotes(
  currentUser: any,
  triggerToast: (msg: string, icon?: string) => void,
  screen: string,
  currentQuiz: Question[],
  userAnswers: any[]
) {
  const [answerNotes, setAnswerNotes] = useState<Record<string, string>>({});
  const [notePopupOpen, setNotePopupOpen] = useState<{ isOpen: boolean; questionText: string; userAnswer: string; correctAnswer: string; isCorrect: boolean } | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const autoNoteTriggeredRef = useRef(false);

  const fetchAnswerNotes = useCallback(async () => {
    if (!currentUser) return;
    try {
      // 1. Coba ambil dari Cloudflare D1
      const cfNotes = await cloudflareApi.getAnswerNotes(currentUser.id);
      if (cfNotes && cfNotes.length > 0) {
        const notesMap: Record<string, string> = {};
        cfNotes.forEach(d => {
          const key = generateQuestionFingerprint({ pertanyaan: d.question_text });
          notesMap[key] = d.note_content;
        });
        setAnswerNotes(notesMap);
        return;
      }

      // 2. Fallback ke Supabase
      const { data, error } = await supabase
        .from('answer_notes')
        .select('question_text, note_content')
        .eq('user_id', currentUser.id);
      if (!error && data) {
        const notesMap: Record<string, string> = {};
        data.forEach((d: { question_text: string; note_content: string }) => {
          // Always compute fingerprint so both old (raw HTML) and new (hash) rows work
          const key = generateQuestionFingerprint({ pertanyaan: d.question_text });
          notesMap[key] = d.note_content;
        });
        setAnswerNotes(notesMap);
      }
    } catch (e) {
      console.error('Failed to fetch answer notes:', e);
    }
  }, [currentUser]);

  const saveAnswerNote = useCallback(async (questionText: string, content: string) => {
    if (!currentUser || !content.trim()) return;
    setNoteSaving(true);
    try {
      const fp = generateQuestionFingerprint({ pertanyaan: questionText });
      
      // Simpan ke Cloudflare D1 (0 Egress)
      cloudflareApi.saveAnswerNote(currentUser.id, fp, content.trim()).catch(() => {});

      const { error } = await supabase
        .from('answer_notes')
        .upsert({
          user_id: currentUser.id,
          question_text: fp,
          note_content: content.trim(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,question_text' });
      if (!error) {
        setAnswerNotes(prev => ({ ...prev, [fp]: content.trim() }));
        setNotePopupOpen(null);
        triggerToast('Catatan berhasil disimpan!', '📝');
      } else {
        console.error('Save note error:', error);
        triggerToast('Gagal menyimpan catatan', '❌');
      }
    } catch (e) {
      console.error('Failed to save note:', e);
      triggerToast('Gagal menyimpan catatan', '❌');
    }
    setNoteSaving(false);
  }, [currentUser]);

  const deleteAnswerNote = useCallback(async (questionText: string) => {
    if (!currentUser) return;
    setNoteSaving(true);
    try {
      const fp = generateQuestionFingerprint({ pertanyaan: questionText });
      const { error } = await supabase
        .from('answer_notes')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('question_text', fp);
      if (!error) {
        setAnswerNotes(prev => {
          const next = { ...prev };
          delete next[fp];
          return next;
        });
        setNotePopupOpen(null);
        triggerToast('Catatan berhasil dihapus', '🗑️');
      } else {
        triggerToast('Gagal menghapus catatan', '❌');
      }
    } catch (e) {
      console.error('Failed to delete note:', e);
      triggerToast('Gagal menghapus catatan', '❌');
    }
    setNoteSaving(false);
  }, [currentUser]);

  const openNotePopup = (questionText: string, userAnswer: string, correctAnswer: string, isCorrect: boolean) => {
    const key = generateQuestionFingerprint({ pertanyaan: questionText });
    setNoteInput(answerNotes[key] || '');
    setNotePopupOpen({ isOpen: true, questionText, userAnswer, correctAnswer, isCorrect });
  };

  useEffect(() => {
    if (screen !== 'result' || currentQuiz.length === 0) {
      autoNoteTriggeredRef.current = false;
      return;
    }

    if (autoNoteTriggeredRef.current) return;

    // Temukan jawaban salah pertama yang belum punya catatan
    const wrongIdx = currentQuiz.findIndex((q, i) => {
      const isWrong = userAnswers[i] === null || !isUserAnswerCorrect(userAnswers[i], q);
      return isWrong && !answerNotes[generateQuestionFingerprint(q)];
    });

    if (wrongIdx !== -1 && !notePopupOpen?.isOpen) {
      autoNoteTriggeredRef.current = true;
      const wrongQ = currentQuiz[wrongIdx];
      const userAns = userAnswers[wrongIdx] !== null ? `${userAnswers[wrongIdx]}` : '(Tidak Dijawab)';
      const correctLetter = getCorrectLetterForQuestion(wrongQ);
      const correctOptionText = wrongQ.pilihan ? (wrongQ.pilihan[['A', 'B', 'C', 'D', 'E'].indexOf(correctLetter)] || wrongQ.jawaban_benar) : wrongQ.jawaban_benar;
      const correctAns = `${correctLetter}. ${correctOptionText}`;

      const timer = setTimeout(() => {
        openNotePopup(wrongQ.pertanyaan, userAns, correctAns, false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [screen, currentQuiz, userAnswers, answerNotes, notePopupOpen?.isOpen]);

  return {
    answerNotes, notePopupOpen, noteInput, noteSaving, autoNoteTriggeredRef,
    setAnswerNotes, setNotePopupOpen, setNoteInput, setNoteSaving,
    fetchAnswerNotes, saveAnswerNote, deleteAnswerNote, openNotePopup
  };
}
