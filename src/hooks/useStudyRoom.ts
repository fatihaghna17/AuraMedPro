// src/hooks/useStudyRoom.ts
import { useState, useEffect, useCallback } from 'react';
import { cloudflareApi } from '../services/cloudflareApi';
import { Question } from '../types';
import { generateQuestionFingerprint } from '../utils/srsAlgorithm';

export interface StudyNote {
  id?: string;
  title: string;
  content: string;
  question_ref?: string;
  question_bank_name?: string;
  tags: string[];
  color: 'indigo' | 'emerald' | 'amber' | 'rose' | 'purple';
  is_pinned: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Bookmark {
  id?: string;
  question_ref: string;
  question_bank_name: string;
  question_json: Question;
  note: string;
  created_at?: string;
}

export function useStudyRoom(userId: string | null) {
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const data = await cloudflareApi.getStudyData(userId);
      setNotes(data.notes || []);
      setBookmarks(data.bookmarks || []);
    } catch (err) {
      console.error('Error fetching study room data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const createNote = async (note: Omit<StudyNote, 'id' | 'created_at' | 'updated_at'>) => {
    if (!userId) return;
    await cloudflareApi.saveStudyNote({ ...note, user_id: userId });
    await fetchData();
  };

  const updateNote = async (id: string, updates: Partial<StudyNote>) => {
    if (!userId) return;
    await cloudflareApi.saveStudyNote({ id, ...updates, user_id: userId });
    await fetchData();
  };

  const deleteNote = async (id: string) => {
    if (!userId) return;
    await cloudflareApi.deleteStudyNote(id);
    await fetchData();
  };

  const addBookmark = async (question: Question, bankName: string, note?: string) => {
    if (!userId) return;
    await cloudflareApi.saveBookmark({
      user_id: userId,
      question_ref: generateQuestionFingerprint(question),
      question_bank_name: bankName,
      question_json: question,
      note: note || '',
    });
    await fetchData();
  };

  const removeBookmark = async (questionRef: string) => {
    if (!userId) return;
    await cloudflareApi.deleteBookmark(userId, questionRef);
    await fetchData();
  };

  const isBookmarked = (question: Question): boolean => {
    const fp = generateQuestionFingerprint(question);
    return bookmarks.some(b => b.question_ref === fp);
  };

  return {
    notes, bookmarks, isLoading, fetchData,
    createNote, updateNote, deleteNote,
    addBookmark, removeBookmark, isBookmarked
  };
}
