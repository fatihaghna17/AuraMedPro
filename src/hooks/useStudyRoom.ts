// src/hooks/useStudyRoom.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
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
      const [notesRes, bookmarksRes] = await Promise.all([
        supabase.from('study_notes').select('*').eq('user_id', userId)
          .order('is_pinned', { ascending: false }).order('updated_at', { ascending: false }),
        supabase.from('bookmarks').select('*').eq('user_id', userId)
          .order('created_at', { ascending: false }),
      ]);
      if (notesRes.error) throw notesRes.error;
      if (bookmarksRes.error) throw bookmarksRes.error;
      setNotes(notesRes.data || []);
      setBookmarks(bookmarksRes.data || []);
    } catch (err) {
      console.error('Error fetching study room data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const createNote = async (note: Omit<StudyNote, 'id' | 'created_at' | 'updated_at'>) => {
    if (!userId) return;
    const { error } = await supabase.from('study_notes').insert({ ...note, user_id: userId });
    if (error) throw error;
    await fetchData();
  };

  const updateNote = async (id: string, updates: Partial<StudyNote>) => {
    const { error } = await supabase.from('study_notes')
      .update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
    await fetchData();
  };

  const deleteNote = async (id: string) => {
    const { error } = await supabase.from('study_notes').delete().eq('id', id);
    if (error) throw error;
    await fetchData();
  };

  const addBookmark = async (question: Question, bankName: string, note?: string) => {
    if (!userId) return;
    const { error } = await supabase.from('bookmarks').upsert({
      user_id: userId,
      question_ref: generateQuestionFingerprint(question),
      question_bank_name: bankName,
      question_json: question,
      note: note || '',
    }, { onConflict: 'user_id,question_ref' });
    if (error) throw error;
    await fetchData();
  };

  const removeBookmark = async (questionRef: string) => {
    if (!userId) return;
    const { error } = await supabase.from('bookmarks')
      .delete().eq('user_id', userId).eq('question_ref', questionRef);
    if (error) throw error;
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
