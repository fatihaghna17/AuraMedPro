import React, { useState } from 'react';
import { Zap, Download, Copy, Check, FileText, Sparkles, HelpCircle, Code2, BookOpen } from 'lucide-react';

interface FormatGuideProps {
  theme: string;
}

export default function FormatGuide({ theme }: FormatGuideProps) {
  const [activeTab, setActiveTab] = useState<'skill' | 'prompt' | 'format'>('skill');
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopySkill = async () => {
    try {
      const res = await fetch('/speedrun_ub_skill.md');
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopied('skill');
      setTimeout(() => setCopied(null), 2000);
    } catch (e) {
      console.error('Failed to copy skill:', e);
    }
  };

  const handleCopyPrompt = async () => {
    try {
      const res = await fetch('/panduan_prompt_ai.txt');
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopied('prompt');
      setTimeout(() => setCopied(null), 2000);
    } catch (e) {
      console.error('Failed to copy prompt:', e);
    }
  };

  return (
    <div
      className={`p-6 sm:p-7 rounded-3xl border transition-all duration-300 flex flex-col justify-between ${
        theme === 'dark'
          ? 'bg-slate-900/50 border-white/[0.08] shadow-2xl backdrop-blur-xl'
          : 'bg-white/85 border-slate-200/80 shadow-md backdrop-blur-xl'
      }`}
    >
      {/* Header Bar */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
              <Sparkles className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-slate-100">
                  Pusat Prompt AI & Format Soal
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                  AI Ready
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Salin prompt atau unduh file konfigurasi untuk membuat kuis otomatis dengan AI (ChatGPT / Claude / Gemini).
              </p>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 self-start sm:self-center">
            <button
              type="button"
              onClick={() => setActiveTab('skill')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'skill'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Speedrun UB (SKILL.md)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('prompt')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'prompt'
                  ? 'bg-indigo-600 text-white font-black shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Prompt AI (.txt)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('format')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'format'
                  ? 'bg-teal-600 text-white font-black shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Format CBT</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Speedrun UB Tutor (SKILL.md) */}
        {activeTab === 'skill' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className={`p-4 rounded-2xl border transition-all ${
              theme === 'dark'
                ? 'bg-gradient-to-br from-amber-500/10 via-purple-500/10 to-indigo-500/10 border-amber-500/25'
                : 'bg-gradient-to-br from-amber-50/90 via-indigo-50/60 to-purple-50/90 border-amber-200'
            }`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 fill-amber-500 text-amber-500" />
                    Speedrun UB Tutor — Master PPT & Slide Synthesizer
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium leading-relaxed">
                    Mau belajar materi kuliah dari slide PPT hanya dalam 15 menit tanpa melewatkan detail klinis?
                    Unduh file ini atau salin teksnya, lalu kirimkan ke AI yang kalian gunakan.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href="/speedrun_ub_skill.md"
                    download="SKILL.md"
                    className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-md bg-amber-500 hover:bg-amber-400 text-slate-950 active:scale-95"
                    title="Download SKILL.md untuk Speedrun PPT"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh SKILL.md</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleCopySkill}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-2 cursor-pointer border active:scale-95 ${
                      copied === 'skill'
                        ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/40'
                        : theme === 'dark'
                        ? 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {copied === 'skill' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-500">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Prompt</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Code Preview Box */}
              <div className="relative rounded-xl overflow-hidden border border-slate-200/50 dark:border-slate-800/80 bg-slate-950/80 text-slate-300 text-[11px] font-mono p-4 max-h-[160px] overflow-y-auto">
                <p className="text-amber-400 font-bold mb-1"># Instruksi Utama Skill:</p>
                <p className="leading-relaxed opacity-90">
                  Kamu adalah Master Tutor & Knowledge Synthesizer yang ahli mengekstrak, merangkum, dan mengajarkan materi dari file PowerPoint (PPT) akademik maupun profesional. Tugasmu adalah mengubah slide yang padat menjadi pemahaman mendalam, catatan Obsidian terstruktur, dan sesi tanya-jawab interaktif yang perlahan dan teliti tanpa melupakan detail kecil yang ada di materi...
                </p>
                <p className="mt-2 text-indigo-400 font-bold"># Fitur & Output:</p>
                <p className="leading-relaxed opacity-90">
                  1. Mengajar berbasis slide &bull; 2. Mode speedrun teliti &bull; 3. Deteksi miskonsepsi &bull; 4. Cheat sheet &bull; 5. Quiz studi kasus &bull; 6. Format Obsidian Markdown (Callout, Mermaid).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Panduan Memori AI (.txt) */}
        {activeTab === 'prompt' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className={`p-4 rounded-2xl border transition-all ${
              theme === 'dark'
                ? 'bg-gradient-to-br from-indigo-500/10 via-teal-500/10 to-slate-900/50 border-indigo-500/25'
                : 'bg-gradient-to-br from-indigo-50/90 via-teal-50/60 to-slate-50 border-indigo-200'
            }`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-500" />
                    Panduan Memori Prompt AI — Pembuat Kuis AuraMed Pro
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium leading-relaxed">
                    Salin teks memori ini di awal percakapan dengan AI (ChatGPT / Claude / Gemini) agar AI otomatis menghasilkan format JSON/YAML valid yang langsung siap diimpor ke AuraMed Pro.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href="/panduan_prompt_ai.txt"
                    download="panduan_prompt_ai.txt"
                    className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-md bg-indigo-600 hover:bg-indigo-500 text-white active:scale-95"
                    title="Unduh file panduan_prompt_ai.txt"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh .txt</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-2 cursor-pointer border active:scale-95 ${
                      copied === 'prompt'
                        ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/40'
                        : theme === 'dark'
                        ? 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {copied === 'prompt' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-500">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Teks</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Code Preview Box */}
              <div className="relative rounded-xl overflow-hidden border border-slate-200/50 dark:border-slate-800/80 bg-slate-950/80 text-slate-300 text-[11px] font-mono p-4 max-h-[160px] overflow-y-auto">
                <p className="text-indigo-400 font-bold mb-1">// Aturan Memori Terstruktur:</p>
                <p className="leading-relaxed opacity-90">
                  MEMORI #1 (Instruksi Utama): Saat user bilang "buat kuis", tentukan format: PG, Flashcard, atau Campuran. Wajib kode JSON valid tanpa teks pembuka/penutup.<br />
                  MEMORI #3 (Metadata PG): &#123;"blok": "...", "sub_kompetensi_klinis": "Penegakan Diagnosis", "tingkat_kesulitan": "Sulit", "xp": 30&#125;<br />
                  MEMORI #4 (Soal & Opsi): &#123;"nomor": 1, "pertanyaan": "Vignet klinis...", "pilihan": [...], "jawaban_benar": "...", "pembahasan": "..."&#125;<br />
                  MEMORI #5 (Eliminasi Opsi): &#123;"A": "Salah. ...", "B": "Benar. ..."&#125;
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Format Soal CBT */}
        {activeTab === 'format' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className={`p-4 rounded-2xl border transition-all ${
              theme === 'dark'
                ? 'bg-gradient-to-br from-teal-500/10 via-indigo-500/10 to-slate-900/50 border-teal-500/25'
                : 'bg-gradient-to-br from-teal-50/90 via-indigo-50/60 to-slate-50 border-teal-200'
            }`}>
              <h4 className="text-xs font-black uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-1.5 mb-2">
                <Code2 className="w-4 h-4 text-teal-500" />
                Format Data Soal JSON & YAML
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed mb-3">
                Platform CBT AuraMed mendukung tipe soal Pilihan Ganda (MCQ) & Isian Singkat (Flashcard) dalam format tunggal maupun berkas gabungan (Campuran).
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className={`p-3 rounded-xl border ${
                  theme === 'dark' ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                }`}>
                  <div className="flex items-center gap-2 font-black text-indigo-500 mb-1">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    Pilihan Ganda (MCQ)
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Kunci array <code className="text-indigo-400 font-mono">mcq_questions</code> atau <code className="text-indigo-400 font-mono">questions</code>. Wajib ada 5 opsi jawaban & pembahasan klinis.
                  </p>
                </div>

                <div className={`p-3 rounded-xl border ${
                  theme === 'dark' ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                }`}>
                  <div className="flex items-center gap-2 font-black text-teal-500 mb-1">
                    <span className="w-2 h-2 rounded-full bg-teal-500" />
                    Isian Singkat (Flashcard)
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Kunci array <code className="text-teal-400 font-mono">flashcard_questions</code> atau <code className="text-teal-400 font-mono">cards</code> dengan petunjuk bertingkat (3 hints).
                  </p>
                </div>

                <div className={`p-3 rounded-xl border ${
                  theme === 'dark' ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                }`}>
                  <div className="flex items-center gap-2 font-black text-amber-500 mb-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Folder Direktori
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Mendukung upload folder langsung untuk mengimpor puluhan bank soal terstruktur sekaligus.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}