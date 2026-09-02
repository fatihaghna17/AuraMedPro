import fs from 'fs';
const lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

const getEnd = (start) => {
  let openBraces = 0;
  let started = false;
  for (let i = start; i < lines.length; i++) {
    const line = lines[i];
    openBraces += (line.match(/\{/g) || []).length;
    openBraces -= (line.match(/\}/g) || []).length;
    if (line.includes('{')) started = true;
    if (started && openBraces === 0) return i;
  }
  return -1;
};

let code = `import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { generateQuestionFingerprint } from '../utils/srsAlgorithm';
import { isUserAnswerCorrect, getCorrectLetterForQuestion } from '../utils/quizUtils';
import { Question } from '../types';

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

`;

const extractFunc = (search) => {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(search)) {
      const end = getEnd(i);
      code += lines.slice(i, end + 1).join('\n') + '\n\n';
      return { start: i, end };
    }
  }
  return null;
};

const fetchAnswerNotes = extractFunc('const fetchAnswerNotes = useCallback(async () => {');
const saveAnswerNote = extractFunc('const saveAnswerNote = useCallback(async (questionText: string, content: string) => {');
const deleteAnswerNote = extractFunc('const deleteAnswerNote = useCallback(async (questionText: string) => {');
const openNotePopup = extractFunc('const openNotePopup = (questionText: string, userAnswer: string, correctAnswer: string, isCorrect: boolean) => {');

// Find auto note useEffect
let autoNoteStart = -1;
let autoNoteEnd = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('autoNoteTriggeredRef.current = true;')) {
    // find useEffect
    for (let j = i; j >= 0; j--) {
      if (lines[j].includes('useEffect(() => {')) {
        autoNoteStart = j;
        autoNoteEnd = getEnd(j);
        code += lines.slice(autoNoteStart, autoNoteEnd + 1).join('\n') + '\n\n';
        break;
      }
    }
    break;
  }
}

code += `  return {
    answerNotes, notePopupOpen, noteInput, noteSaving, autoNoteTriggeredRef,
    setAnswerNotes, setNotePopupOpen, setNoteInput, setNoteSaving,
    fetchAnswerNotes, saveAnswerNote, deleteAnswerNote, openNotePopup
  };
}
`;

fs.writeFileSync('src/hooks/useAnswerNotes.ts', code);

// safely blank out the extracted lines
const toRemove = [fetchAnswerNotes, saveAnswerNote, deleteAnswerNote, openNotePopup, {start: autoNoteStart, end: autoNoteEnd}];
toRemove.forEach(r => {
  if (r && r.start !== -1) {
    for (let i = r.start; i <= r.end; i++) {
      lines[i] = '// extracted to useAnswerNotes';
    }
  }
});

// safely remove states
const removeLine = (search) => {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(search)) {
      lines[i] = '// extracted answerNotes state';
      return i;
    }
  }
  return -1;
};

removeLine('const [notePopupOpen, setNotePopupOpen]');
removeLine('const [noteInput, setNoteInput]');
removeLine('const [noteSaving, setNoteSaving]');
removeLine('const autoNoteTriggeredRef = useRef(false);');

const insertLine = removeLine('const [answerNotes, setAnswerNotes]');
if (insertLine !== -1) {
  lines[insertLine] += `\n  const {
    answerNotes, notePopupOpen, noteInput, noteSaving,
    setNotePopupOpen, setNoteInput, setNoteSaving,
    fetchAnswerNotes, saveAnswerNote, deleteAnswerNote, openNotePopup
  } = useAnswerNotes(currentUser, triggerToast, screen, currentQuiz, userAnswers);`;
}

// insert import
const importIdx = lines.findIndex(l => l.includes("import { useLeaderboard }"));
lines.splice(importIdx + 1, 0, "import { useAnswerNotes } from './hooks/useAnswerNotes';");

fs.writeFileSync('src/App.tsx', lines.join('\n'));
console.log('Done A5');
