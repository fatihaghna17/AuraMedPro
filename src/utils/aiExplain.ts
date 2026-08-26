export type ExplainMode = 'explain' | 'clarify' | 'mnemonic' | 'compare';

export const EXPLAIN_MODES = [
  { mode: 'explain' as ExplainMode, label: 'Jelaskan', icon: '💡', description: 'Penjelasan mendalam tentang soal' },
  { mode: 'mnemonic' as ExplainMode, label: 'Mnemonic', icon: '🧠', description: 'Buat trik menghafal (jembatan keledai)' },
  { mode: 'compare' as ExplainMode, label: 'Bandingkan', icon: '⚖️', description: 'Bandingkan dengan jawabanmu' },
  { mode: 'clarify' as ExplainMode, label: 'Tanya Lanjut', icon: '❓', description: 'Tanyakan bagian yang belum dipahami' }
];

export interface AIExplanationParams {
  question: string;
  correctAnswer: string;
  explanation?: string;
  userAnswer?: string;
  context?: string;
  mode: ExplainMode;
  followUp?: string;
}

export const requestAIExplanation = async (params: AIExplanationParams): Promise<string> => {
  try {
    const response = await fetch('/api/ai-explain', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Gagal terhubung ke AI Tutor');
    }

    return data.explanation;
  } catch (error: any) {
    console.error('requestAIExplanation error:', error);
    throw new Error(error.message || 'Terjadi kesalahan pada AI Tutor');
  }
};
