import React from 'react';
import { Eye } from 'lucide-react';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import * as jsYaml from 'js-yaml';
import { Question } from '../types';

// Configure marked for safe rendering
marked.setOptions({
  breaks: true,
  gfm: true,
});

export const SCORE_FEEDBACKS: Record<number, string> = {
  0: "Skor 0? Kamu ngerjainnya merem, atau emang niat nyumbang kuota doang ke server? Astaga naga...",
  10: "Skor 10! Selamat, insting kamu lebih rendah dari tebakan acak seekor kucing rumahan. Yuk belajar lagi!",
  20: "Skor 20. Ini transkrip nilai CBT apa sisa baterai HP kamu yang minta dicharge? Mengenaskan sekali.",
  30: "Skor 30. Nilai segini kalo dijadiin suhu ruangan udah bikin hipotermia. Otak kamu ikutan beku ya pas ngerjain?",
  40: "Skor 40. Gak usah sedih, seenggaknya kamu konsisten... konsisten di bawah KKM. Pura-pura amnesia aja kalau ditanya temen.",
  50: "Skor 50! Pas banget setengah. Setengah pinter, setengahnya lagi ga tertolong oleh sistem.",
  60: "Skor 60! Dikit lagi lulus, tapi kenyataannya tetep gagal. Sakitnya tuh nembus ke tulang rusuk belakang.",
  70: "Skor 70! Lulus pas-pasan! Napas kamu lega dikit, mirip pasien asma abis disemprot inhaler. Selamat bertahan!",
  80: "Skor 80! Keren, sinaps otak kamu bekerja dengan efisiensi tinggi. Pantes jadi kandidat asisten laboratorium nih!",
  90: "Skor 90! Edan! Nilai A mutlak sudah digenggam. Orang tuamu akhirnya bisa bangga pamer di grup WhatsApp keluarga!",
  100: "Skor 100! Sempurna Tanpa Cela! Kamu ini manusia, dewa ujian, atau emang kunci jawabannya udah kamu hafalkan? Sungkem sepuh!"
};

export const getFeedbackForScore = (score: number): string => {
  const scoreKeys = Object.keys(SCORE_FEEDBACKS).map(Number).sort((a, b) => b - a);
  for (const key of scoreKeys) {
    if (score >= key) {
      return SCORE_FEEDBACKS[key];
    }
  }
  return "Nilai di luar nalar manusia.";
};

export const formatTimer = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const getCorrectLetterForQuestion = (q: Question): string => {
  if (!q) return 'A';

  const letters = ['A', 'B', 'C', 'D', 'E'];

  if (q.eliminasi_opsi) {
    const foundEntry = Object.entries(q.eliminasi_opsi).find(([key, desc]) => {
      const cleanDesc = (desc as string).trim().toLowerCase();
      return cleanDesc.startsWith('benar') || cleanDesc.startsWith('betul');
    });
    if (foundEntry) {
      return foundEntry[0].toUpperCase();
    }
  }

  if (q.pilihan && q.pilihan.length > 0) {
    const idx = q.pilihan.findIndex(opt => {
      const cleanOpt = opt.trim().toLowerCase();
      return cleanOpt.startsWith('benar') || cleanOpt.startsWith('betul');
    });
    if (idx !== -1 && idx < letters.length) {
      return letters[idx];
    }
  }

  if (q.jawaban_benar) {
    const jb = q.jawaban_benar.trim();
    const jbLower = jb.toLowerCase();

    const exactIdx = q.pilihan.findIndex(opt => opt.trim().toLowerCase() === jbLower);
    if (exactIdx !== -1 && exactIdx < letters.length) {
      return letters[exactIdx];
    }

    if (/^[A-E]$/i.test(jb)) {
      return jb.toUpperCase();
    }

    if (/^[A-E][\s.)]/i.test(jb)) {
      return jb[0].toUpperCase();
    }

    const partialIdx = q.pilihan.findIndex(opt => 
      opt.toLowerCase().includes(jbLower) || jbLower.includes(opt.toLowerCase())
    );
    if (partialIdx !== -1 && partialIdx < letters.length) {
      return letters[partialIdx];
    }
  }

  if (q.jawaban_benar) {
    const firstChar = q.jawaban_benar.trim()[0]?.toUpperCase();
    if (letters.includes(firstChar)) {
      return firstChar;
    }
  }

  return 'A';
};

export const isUserAnswerCorrect = (userAns: string | null, q: Question): boolean => {
  if (userAns === null) return false;
  
  if (!q.pilihan || q.pilihan.length === 0) {
    const flags = q.featureFlags || {};
    const caseSensitive = flags.caseSensitive === true;
    const acceptPartialMatch = flags.acceptPartialMatch !== false;
    
    let userVal = userAns.trim();
    let correctVal = q.jawaban_benar.trim();
    
    if (!caseSensitive) {
      userVal = userVal.toLowerCase();
      correctVal = correctVal.toLowerCase();
    }
    
    if (userVal === correctVal) {
      return true;
    }
    
    const getSimilarity = (s1: string, s2: string): number => {
      let longer = s1.toLowerCase();
      let shorter = s2.toLowerCase();
      if (s1.length < s2.length) {
        longer = s2.toLowerCase();
        shorter = s1.toLowerCase();
      }
      const longerLength = longer.length;
      if (longerLength === 0) return 1.0;
      
      const costs = [];
      for (let i = 0; i <= longer.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= shorter.length; j++) {
          if (i === 0) {
            costs[j] = j;
          } else {
            if (j > 0) {
              let newValue = costs[j - 1];
              if (longer.charAt(i - 1) !== shorter.charAt(j - 1)) {
                newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
              }
              costs[j - 1] = lastValue;
              lastValue = newValue;
            }
          }
        }
        if (i > 0) {
          costs[shorter.length] = lastValue;
        }
      }
      return (longerLength - costs[shorter.length]) / longerLength;
    };

    if (getSimilarity(userVal, correctVal) >= 0.80) {
      return true;
    }
    
    if (acceptPartialMatch) {
      if (userVal.includes(correctVal) || correctVal.includes(userVal)) {
        if (userVal.length >= 3 && correctVal.length >= 3) {
          return true;
        }
      }
    }
    return false;
  }
  
  const correctLetter = getCorrectLetterForQuestion(q);
  const correctIndex = ['A', 'B', 'C', 'D', 'E'].indexOf(correctLetter);
  
  if (correctIndex !== -1 && correctIndex < q.pilihan.length) {
    const correctOptionText = q.pilihan[correctIndex];
    if (userAns === correctOptionText) {
      return true;
    }
  }

  if (userAns === q.jawaban_benar) {
    return true;
  }

  if (userAns.trim().toUpperCase() === correctLetter) {
    return true;
  }

  return false;
};

export const renderMarkdown = (text: string): React.ReactElement | null => {
  if (!text || typeof text !== 'string') return null;
  // Convert markdown to HTML first, then sanitize
  const rawHtml = marked.parse(text) as string;
  const clean = DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 's', 'sub', 'sup', 'br', 'p', 'span', 'div', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'a', 'img', 'blockquote', 'code', 'pre', 'hr'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'style', 'target', 'colspan', 'rowspan'],
    ALLOW_DATA_ATTR: false
  });
  return <span dangerouslySetInnerHTML={{ __html: clean }} />;
};

export const renderHtmlText = (text: any) => {
  if (!text || typeof text !== 'string') return text || null;
  const clean = DOMPurify.sanitize(text, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 's', 'sub', 'sup', 'br', 'p', 'span', 'div', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'a', 'img'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'style', 'target', 'colspan', 'rowspan'],
    ALLOW_DATA_ATTR: false
  });
  return <span dangerouslySetInnerHTML={{ __html: clean }} />;
};

export const getQuestionImage = (q: Question): string | null => {
  if (q.gambar && typeof q.gambar === 'string') return q.gambar;
  if (q.gambar_url && typeof q.gambar_url === 'string') return q.gambar_url;
  if (q.image && typeof q.image === 'string') return q.image;
  if (q.image_url && typeof q.image_url === 'string') return q.image_url;
  if (q.imageUrl && typeof q.imageUrl === 'string') return q.imageUrl;
  return null;
};

export const renderQuestionImage = (q: Question, setLightbox: (url: string | null) => void, theme: 'light' | 'dark') => {
  const imageUrl = getQuestionImage(q);
  if (!imageUrl) return null;

  return (
    <div className="my-4 relative group max-w-xl mx-auto">
      <div className={`overflow-hidden rounded-xl border shadow-sm flex justify-center items-center relative ${
        theme === 'dark' ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-100'
      }`}>
        <img 
          src={imageUrl} 
          alt="Soal Visual" 
          referrerPolicy="no-referrer"
          className="max-h-[320px] object-contain transition-transform duration-300 group-hover:scale-[1.01] cursor-zoom-in p-2"
          onClick={() => setLightbox(imageUrl)}
        />
        <div 
          className="absolute bottom-2 right-2 bg-slate-900/80 hover:bg-slate-900 text-white rounded-lg px-2.5 py-1 text-[10px] font-bold flex items-center gap-1 cursor-pointer backdrop-blur-sm transition-all"
          onClick={() => setLightbox(imageUrl)}
        >
          <Eye className="w-3.5 h-3.5" />
          Perbesar Gambar
        </div>
      </div>
    </div>
  );
};

export const mapUnifiedQuestion = (item: any, rootFeatureFlags: any = {}): Question => {
  const pilihan = item.pilihan || item.answers || [];
  
  let jawaban_benar = "";
  if (item.jawaban_benar !== undefined && item.jawaban_benar !== null) {
    jawaban_benar = String(item.jawaban_benar);
  } else if (item.answer !== undefined && item.answer !== null) {
    jawaban_benar = String(item.answer);
  } else if (item.correct_answer !== undefined && item.correct_answer !== null) {
    if (typeof item.correct_answer === 'number' && pilihan.length > 0) {
      jawaban_benar = pilihan[item.correct_answer - 1] || "";
    } else {
      jawaban_benar = String(item.correct_answer);
    }
  }

  const isIsian = pilihan.length === 0;

  const defaultMetadata = isIsian
    ? {
        sub_kompetensi_klinis: "Isian Singkat",
        tingkat_kognitif: "C1",
        tingkat_kesulitan: "Sedang",
        xp: 150
      }
    : {
        sub_kompetensi_klinis: "Klinis Umum",
        tingkat_kognitif: "C3",
        tingkat_kesulitan: "Sedang",
        xp: 100
      };

  return {
    pertanyaan: (() => {
      const p = item.pertanyaan || item.clue || item.question;
      if (typeof p === 'object' && p !== null) return p.text || "Tanpa pertanyaan";
      return typeof p === 'string' ? p : "Tanpa pertanyaan";
    })(),
    pilihan,
    jawaban_benar,
    pembahasan: item.pembahasan || item.explanation || "",
    eliminasi_opsi: item.eliminasi_opsi || {},
    metadata: {
      ...defaultMetadata,
      ...(item.metadata || {})
    },
    hints: item.hints || [],
    featureFlags: item.featureFlags || rootFeatureFlags || {},
    image: item.image,
    image_url: item.image_url,
    imageUrl: item.imageUrl,
    gambar: item.gambar,
    gambar_url: item.gambar_url
  };
};

export const parseRawFileToQuestions = (raw: string, ext: string): Question[] | null => {
  let finalQuestions: Question[] = [];
  try {
    let parsed: any = null;
    if (ext === 'yaml' || ext === 'yml') {
      parsed = jsYaml.load(raw);
    } else if (ext === 'json') {
      parsed = JSON.parse(raw);
    }

    if (!parsed) return null;

    const rootFlags = parsed.featureFlags || {};

    if (Array.isArray(parsed)) {
      finalQuestions = parsed.map(item => mapUnifiedQuestion(item, {}));
    } else if (typeof parsed === 'object') {
      let itemsList: any[] = [];
      Object.keys(parsed).forEach(key => {
        if (key !== 'featureFlags' && Array.isArray(parsed[key])) {
          itemsList = itemsList.concat(parsed[key]);
        }
      });

      if (itemsList.length > 0) {
        finalQuestions = itemsList.map(item => mapUnifiedQuestion(item, rootFlags));
      }
    }
  } catch (err) {
    console.error('Error parsing file content:', err);
    return null;
  }
  return finalQuestions.length > 0 ? finalQuestions : null;
};
