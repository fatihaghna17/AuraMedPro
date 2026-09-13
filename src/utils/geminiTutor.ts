import { getCorrectLetterForQuestion } from './quizUtils';

let geminiWindowRef: Window | null = null;

/**
 * Format pertanyaan CBT menjadi prompt medis komprehensif untuk Gemini AI
 */
export const formatQuestionForGemini = (
  question: any,
  index: number,
  userAnswer?: string | null,
  isRevealed?: boolean
): string => {
  if (!question) return '';

  const cleanText = (str?: string) =>
    (str || '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .trim();

  const cleanQuestion = cleanText(question.pertanyaan);
  const letters = ['A', 'B', 'C', 'D', 'E'];

  let optionsText = '';
  if (question.pilihan && question.pilihan.length > 0) {
    optionsText = question.pilihan
      .map((opt: string, i: number) => {
        return `${letters[i]}. ${cleanText(opt)}`;
      })
      .join('\n');
  }

  const correctLetter = getCorrectLetterForQuestion(question);
  const correctOptionText = question.pilihan
    ? (question.pilihan[letters.indexOf(correctLetter)] || question.jawaban_benar)
    : question.jawaban_benar;
  const cleanCorrect = cleanText(correctOptionText);

  let statusSection = '';
  if (isRevealed) {
    statusSection = `\n[KUNCI JAWABAN & STATUS]\n- Kunci Jawaban: ${correctLetter}. ${cleanCorrect}`;
    if (userAnswer !== undefined && userAnswer !== null && userAnswer !== '') {
      statusSection += `\n- Jawaban Saya: ${cleanText(String(userAnswer))}`;
    }
  }

  let explanationSection = '';
  if (question.pembahasan) {
    explanationSection = `\n[PEMBAHASAN RESMI]\n${cleanText(question.pembahasan)}`;
  }

  let eliminationSection = '';
  if (question.eliminasi_opsi && Object.keys(question.eliminasi_opsi).length > 0) {
    eliminationSection = `\n[ANALISIS OPSI / ELIMINASI]\n` +
      Object.entries(question.eliminasi_opsi)
        .map(([k, v]) => `- Opsi ${k}: ${cleanText(String(v))}`)
        .join('\n');
  }

  let metadataSection = '';
  if (question.metadata?.sub_kompetensi_klinis || question.metadata?.tingkat_kesulitan) {
    metadataSection = `\n[METADATA]\n- Topik: ${question.metadata?.sub_kompetensi_klinis || 'Kedokteran Umum'}\n- Tingkat Kesulitan: ${question.metadata?.tingkat_kesulitan || 'Sedang'}`;
  }

  return `Halo Gemini, saya sedang belajar soal CBT Kedokteran di AuraMedPro. Tolong bantu saya membedah dan memahami soal ini secara klinis dan mendalam:

[SOAL #${index + 1}]
${cleanQuestion}

[PILIHAN JAWABAN]
${optionsText || '(Soal Isian Singkat)'}
${statusSection}
${explanationSection}
${eliminationSection}
${metadataSection}

Tolong bantu berikan:
1. 🩺 Ringkasan Klinis: Kata kunci diagnosis, gejala kardinal, dan patofisiologi utama dari kasus ini.
2. ✅ Alasan Jawaban Benar: Mengapa pilihan kunci jawaban tersebut adalah terapi/diagnosis/tindakan yang paling tepat.
3. ❌ Pembahasan Eliminasi: Mengapa pilihan jawaban lainnya salah atau kurang tepat (jika ada pilihan ganda).
4. 💡 Clinical Pearl & Jembatan Keledai (Mnemonic): Trik cepat atau tips praktis agar saya selalu ingat konsep ini saat ujian CBT / UKMPPD.`;
};

/**
 * Salin prompt soal ke clipboard dan buka tab / window Gemini AI
 */
export const openGeminiTutor = async (
  promptText: string,
  triggerToast?: (msg: string, icon?: string) => void
): Promise<void> => {
  // 1. Salin ke clipboard
  let copySuccess = false;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(promptText);
      copySuccess = true;
    }
  } catch (err) {
    console.warn('Clipboard writeText failed, using fallback:', err);
  }

  if (!copySuccess) {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = promptText;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      copySuccess = true;
    } catch (fallbackErr) {
      console.error('Fallback copy failed:', fallbackErr);
    }
  }

  if (copySuccess) {
    triggerToast?.('Soal & pembahasan tersalin! Tinggal tempel (Paste) di Gemini 🚀', '✨');
  } else {
    triggerToast?.('Membuka Gemini... Silakan salin soal manual bila diperlukan.', '🤖');
  }

  // 2. Buka atau beralih ke tab / window Gemini
  const targetName = 'AuraMedGeminiTutor';
  const geminiUrl = 'https://gemini.google.com/app';
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;

  try {
    if (geminiWindowRef && !geminiWindowRef.closed) {
      geminiWindowRef.focus();
    } else {
      if (isDesktop) {
        // Pada desktop: Buka side-by-side companion window (Split Screen) di sisi kanan layar
        const width = 580;
        const height = window.screen.availHeight || 860;
        const left = Math.max(0, (window.screen.availWidth || 1440) - width);
        geminiWindowRef = window.open(
          geminiUrl,
          targetName,
          `width=${width},height=${height},left=${left},top=0,resizable=yes,scrollbars=yes`
        );
      } else {
        // Pada mobile: Buka tab dengan nama target yang sama agar tidak menumpuk tab baru terus-menerus
        geminiWindowRef = window.open(geminiUrl, targetName);
      }
    }
  } catch (e) {
    // Fallback normal window.open jika diblokir popup blocker
    geminiWindowRef = window.open(geminiUrl, targetName);
  }

  if (geminiWindowRef) {
    try {
      geminiWindowRef.focus();
    } catch (_) {}
  }
};
