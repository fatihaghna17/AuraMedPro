import React, { useState } from 'react';
import { Zap, Download, Copy, Check, FileText, Sparkles, Code2, BookOpen, Flame, ClipboardCheck } from 'lucide-react';

interface FormatGuideProps {
  theme: string;
}

type GuideTab = 'skill' | 'prompt' | 'mudah' | 'sulit' | 'kating' | 'format';

export default function FormatGuide({ theme }: FormatGuideProps) {
  const [activeTab, setActiveTab] = useState<GuideTab>('skill');
  const [copied, setCopied] = useState<string | null>(null);

  const copyFromPublicFile = async (filePath: string, key: string) => {
    try {
      const res = await fetch(filePath);
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch (e) {
      console.error(`Failed to copy ${key}:`, e);
    }
  };

  const handleCopySkill = () => copyFromPublicFile('/speedrun_ub_skill.md', 'skill');
  const handleCopyPrompt = () => copyFromPublicFile('/panduan_prompt_ai.txt', 'prompt');
  const handleCopyMudah = () => copyFromPublicFile('/prompt_mudah_review_ppt.txt', 'mudah');
  const handleCopySulit = () => copyFromPublicFile('/prompt_sulit_hots.txt', 'sulit');
  const handleCopyKating = () => copyFromPublicFile('/prompt_kating_sama_persis.txt', 'kating');

  return (
    <div className="p-4 sm:p-6 rounded-2xl liquid-glass-card flex flex-col justify-between min-w-0">
      {/* Header Bar */}
      <div className="min-w-0">
        <div className="flex items-start sm:items-center gap-3 min-w-0 mb-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center flex-wrap gap-2">
              <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Pusat Prompt AI & Format Soal
              </h3>
              <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 shrink-0">
                AI Ready
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Salin prompt atau unduh file konfigurasi untuk membuat kuis otomatis dengan AI (ChatGPT / Claude / Gemini).
            </p>
          </div>
        </div>

        {/* Full-Width Tab Switcher */}
        <div className="flex items-center gap-1 p-1 rounded-xl liquid-glass-subtle w-full max-w-full overflow-x-auto scrollbar-none mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('skill')}
            className={`shrink-0 whitespace-nowrap flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'skill'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5 shrink-0" />
            <span>Speedrun UB (SKILL.md)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('prompt')}
            className={`shrink-0 whitespace-nowrap flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'prompt'
                ? 'bg-indigo-600 text-white font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span>Prompt AI (.txt)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mudah')}
            className={`shrink-0 whitespace-nowrap flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'mudah'
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            <span>Mudah (1 PPT)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sulit')}
            className={`shrink-0 whitespace-nowrap flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'sulit'
                ? 'bg-rose-600 text-white font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5 shrink-0" />
            <span>Sulit (HOTS)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('kating')}
            className={`shrink-0 whitespace-nowrap flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'kating'
                ? 'bg-violet-600 text-white font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5 shrink-0" />
            <span>Soal Kating (Persis)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('format')}
            className={`shrink-0 whitespace-nowrap flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'format'
                ? 'bg-teal-600 text-white font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 shrink-0" />
            <span>Format CBT</span>
          </button>
        </div>

        {/* Tab 1: Speedrun UB Tutor (SKILL.md) */}
        {activeTab === 'skill' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className={`p-3.5 sm:p-4 rounded-2xl border transition-all max-lg-liquid-subtle ${
              theme === 'dark'
                ? 'bg-gradient-to-br from-amber-500/10 via-purple-500/10 to-indigo-500/10 border-amber-500/25'
                : 'bg-gradient-to-br from-amber-50/90 via-indigo-50/60 to-purple-50/90 border-amber-200'
            }`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 fill-amber-500 text-amber-500 shrink-0" />
                    <span>Speedrun UB Tutor — Master PPT & Slide Synthesizer</span>
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium leading-relaxed">
                    Mau belajar materi kuliah dari slide PPT hanya dalam 15 menit tanpa melewatkan detail klinis?
                    Unduh file ini atau salin teksnya, lalu kirimkan ke AI yang kalian gunakan.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full md:w-auto shrink-0">
                  <a
                    href="/speedrun_ub_skill.md"
                    download="SKILL.md"
                    className="justify-center px-3 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 sm:gap-2 cursor-pointer shadow-md bg-amber-500 hover:bg-amber-400 text-slate-950 active:scale-95"
                    title="Download SKILL.md untuk Speedrun PPT"
                  >
                    <Download className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Unduh SKILL.md</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleCopySkill}
                    className={`justify-center px-3 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 sm:gap-2 cursor-pointer border active:scale-95 ${
                      copied === 'skill'
                        ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/40'
                        : (theme === 'dark'
                          ? 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200') + ' max-lg-liquid-interactive'
                    }`}
                  >
                    {copied === 'skill' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="text-emerald-500 truncate">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Salin Prompt</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Code Preview Box */}
              <div className="relative rounded-xl overflow-hidden border border-slate-200/50 dark:border-slate-800/80 bg-slate-950/80 text-slate-300 text-[11px] font-mono p-3.5 sm:p-4 max-h-[160px] overflow-y-auto">
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

        {/* Tab 2: Panduan Memori AI (.txt) — EXISTING UNCHANGED */}
        {activeTab === 'prompt' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className={`p-3.5 sm:p-4 rounded-2xl border transition-all max-lg-liquid-subtle ${
              theme === 'dark'
                ? 'bg-gradient-to-br from-indigo-500/10 via-teal-500/10 to-slate-900/50 border-indigo-500/25'
                : 'bg-gradient-to-br from-indigo-50/90 via-teal-50/60 to-slate-50 border-indigo-200'
            }`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span>Panduan Memori Prompt AI — Pembuat Kuis AuraMed Pro</span>
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium leading-relaxed">
                    Salin teks memori ini di awal percakapan dengan AI (ChatGPT / Claude / Gemini) agar AI otomatis menghasilkan format JSON/YAML valid yang langsung siap diimpor ke AuraMed Pro.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full md:w-auto shrink-0">
                  <a
                    href="/panduan_prompt_ai.txt"
                    download="panduan_prompt_ai.txt"
                    className="justify-center px-3 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 sm:gap-2 cursor-pointer shadow-md bg-indigo-600 hover:bg-indigo-500 text-white active:scale-95"
                    title="Unduh file panduan_prompt_ai.txt"
                  >
                    <Download className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Unduh .txt</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    className={`justify-center px-3 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 sm:gap-2 cursor-pointer border active:scale-95 ${
                      copied === 'prompt'
                        ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/40'
                        : (theme === 'dark'
                          ? 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200') + ' max-lg-liquid-interactive'
                    }`}
                  >
                    {copied === 'prompt' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="text-emerald-500 truncate">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Salin Teks</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Code Preview Box */}
              <div className="relative rounded-xl overflow-hidden border border-slate-200/50 dark:border-slate-800/80 bg-slate-950/80 text-slate-300 text-[11px] font-mono p-3.5 sm:p-4 max-h-[160px] overflow-y-auto">
                <p className="text-indigo-400 font-bold mb-1">// Aturan Memori Terstruktur:</p>
                <p className="leading-relaxed opacity-90 break-words">
                  MEMORI #1 (Instruksi Utama): Saat user bilang "buat kuis", tentukan format: PG, Flashcard, atau Campuran. Wajib kode JSON valid tanpa teks pembuka/penutup.<br />
                  MEMORI #3 (Metadata PG): &#123;"blok": "...", "sub_kompetensi_klinis": "Penegakan Diagnosis", "tingkat_kesulitan": "Sulit", "xp": 30&#125;<br />
                  MEMORI #4 (Soal & Opsi): &#123;"nomor": 1, "pertanyaan": "Vignet klinis...", "pilihan": [...], "jawaban_benar": "...", "pembahasan": "..."&#125;<br />
                  MEMORI #5 (Eliminasi Opsi): &#123;"A": "Salah. ...", "B": "Benar. ..."&#125;
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Prompt Mode MUDAH (Review 1 PPT) */}
        {activeTab === 'mudah' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className={`p-3.5 sm:p-4 rounded-2xl border transition-all max-lg-liquid-subtle ${
              theme === 'dark'
                ? 'bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-slate-900/50 border-emerald-500/25'
                : 'bg-gradient-to-br from-emerald-50/90 via-teal-50/60 to-slate-50 border-emerald-200'
            }`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Prompt Mode Mudah — Khusus Review 1 PPT (Anti Kewalahan)</span>
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium leading-relaxed">
                    Cocok dipakai langsung setelah selesai baca 1 PPT dosen. Soal 100% hanya dari isi slide (dilarang keluar PPT), ringkas (1–3 kalimat), 1 langkah berpikir, dan dilengkapi nomor slide di pembahasan.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full md:w-auto shrink-0">
                  <a
                    href="/prompt_mudah_review_ppt.txt"
                    download="prompt_mudah_review_ppt.txt"
                    className="justify-center px-3 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 sm:gap-2 cursor-pointer shadow-md bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95"
                    title="Unduh file prompt_mudah_review_ppt.txt"
                  >
                    <Download className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Unduh .txt</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleCopyMudah}
                    className={`justify-center px-3 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 sm:gap-2 cursor-pointer border active:scale-95 ${
                      copied === 'mudah'
                        ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/40'
                        : (theme === 'dark'
                          ? 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200') + ' max-lg-liquid-interactive'
                    }`}
                  >
                    {copied === 'mudah' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="text-emerald-500 truncate">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Salin Prompt</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="relative rounded-xl overflow-hidden border border-slate-200/50 dark:border-slate-800/80 bg-slate-950/80 text-slate-300 text-[11px] font-mono p-3.5 sm:p-4 max-h-[160px] overflow-y-auto">
                <p className="text-emerald-400 font-bold mb-1">// Karakteristik Mode Mudah (Review 1 PPT):</p>
                <p className="leading-relaxed opacity-90 break-words">
                  1. 100% STRICT DARI ISI PPT: Dilarang menanyakan detail atau guideline luar yang tidak ada di slide.<br />
                  2. SINGLE-STEP &amp; SINGKAT: Maksimal 1–3 kalimat, boleh menampilkan kata kunci / &quot;poin merah&quot; slide.<br />
                  3. OPSI SEDERHANA: 1 konsep pendek per opsi, jelas bedanya jika sudah membaca PPT (C1–C2, XP: 10).<br />
                  4. PEMBAHASAN TERARAH: Ringkas, mudah dicerna, lengkap dengan sitasi nomor slide.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Prompt Mode SULIT (HOTS / UKMPPD) */}
        {activeTab === 'sulit' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className={`p-3.5 sm:p-4 rounded-2xl border transition-all max-lg-liquid-subtle ${
              theme === 'dark'
                ? 'bg-gradient-to-br from-rose-500/10 via-amber-500/10 to-slate-900/50 border-rose-500/25'
                : 'bg-gradient-to-br from-rose-50/90 via-amber-50/60 to-slate-50 border-rose-200'
            }`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>Prompt Mode Sulit — Vignet Klinis HOTS (Ujian Blok &amp; UKMPPD)</span>
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium leading-relaxed">
                    Untuk pemantapan akhir &amp; simulasi ujian sulit. Menguji penalaran klinis bertingkat (2–3 langkah berpikir), penyamaran buzzword, pengecoh dekat, dan panjang kata antar opsi seragam.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full md:w-auto shrink-0">
                  <a
                    href="/prompt_sulit_hots.txt"
                    download="prompt_sulit_hots.txt"
                    className="justify-center px-3 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 sm:gap-2 cursor-pointer shadow-md bg-rose-600 hover:bg-rose-500 text-white active:scale-95"
                    title="Unduh file prompt_sulit_hots.txt"
                  >
                    <Download className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Unduh .txt</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleCopySulit}
                    className={`justify-center px-3 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 sm:gap-2 cursor-pointer border active:scale-95 ${
                      copied === 'sulit'
                        ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/40'
                        : (theme === 'dark'
                          ? 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200') + ' max-lg-liquid-interactive'
                    }`}
                  >
                    {copied === 'sulit' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="text-emerald-500 truncate">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Salin Prompt</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="relative rounded-xl overflow-hidden border border-slate-200/50 dark:border-slate-800/80 bg-slate-950/80 text-slate-300 text-[11px] font-mono p-3.5 sm:p-4 max-h-[160px] overflow-y-auto">
                <p className="text-rose-400 font-bold mb-1">// Karakteristik Mode Sulit (HOTS Clinical Reasoning):</p>
                <p className="leading-relaxed opacity-90 break-words">
                  1. VIGNET KLINIS UTUH: Anamnesis + Tanda Vital &amp; PF + Penunjang + Komorbid/Penyulit.<br />
                  2. MULTI-STEP THINKING: Analisis C4–C5 (diagnosis tersirat &rarr; tatalaksana/mekanisme/kontraindikasi).<br />
                  3. OPSI ANTI-TEBAK: Selisih panjang kata 0–1 kata antar opsi, pengecoh diagnosis banding dekat.<br />
                  4. PEMBAHASAN MENDALAM: 4 tingkat patofisiologi, algoritma dosis konsensus, &amp; eliminasi A–E tajam.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Prompt Mode SOAL KATING (Sama Persis) */}
        {activeTab === 'kating' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className={`p-3.5 sm:p-4 rounded-2xl border transition-all max-lg-liquid-subtle ${
              theme === 'dark'
                ? 'bg-gradient-to-br from-violet-500/10 via-indigo-500/10 to-slate-900/50 border-violet-500/25'
                : 'bg-gradient-to-br from-violet-50/90 via-indigo-50/60 to-slate-50 border-violet-200'
            }`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-violet-600 dark:text-violet-400 flex items-center gap-1.5">
                    <ClipboardCheck className="w-4 h-4 text-violet-500 shrink-0" />
                    <span>Prompt Soal Kating — 100% Sama Persis (Tanpa Improvisasi)</span>
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium leading-relaxed">
                    Mengubah naskah soal tahun lalu / kating ke JSON AuraMed Pro dengan menjaga teks soal &amp; pilihan A–E 100% sama persis tanpa dikarang ulang, lengkap dengan verifikasi kunci &amp; pembahasan dosen.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full md:w-auto shrink-0">
                  <a
                    href="/prompt_kating_sama_persis.txt"
                    download="prompt_kating_sama_persis.txt"
                    className="justify-center px-3 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 sm:gap-2 cursor-pointer shadow-md bg-violet-600 hover:bg-violet-500 text-white active:scale-95"
                    title="Unduh file prompt_kating_sama_persis.txt"
                  >
                    <Download className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Unduh .txt</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleCopyKating}
                    className={`justify-center px-3 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 sm:gap-2 cursor-pointer border active:scale-95 ${
                      copied === 'kating'
                        ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/40'
                        : (theme === 'dark'
                          ? 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200') + ' max-lg-liquid-interactive'
                    }`}
                  >
                    {copied === 'kating' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="text-emerald-500 truncate">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Salin Prompt</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="relative rounded-xl overflow-hidden border border-slate-200/50 dark:border-slate-800/80 bg-slate-950/80 text-slate-300 text-[11px] font-mono p-3.5 sm:p-4 max-h-[160px] overflow-y-auto">
                <p className="text-violet-400 font-bold mb-1">// Aturan Mutlak Soal Kating Sama Persis:</p>
                <p className="leading-relaxed opacity-90 break-words">
                  1. ZERO-IMPROVISATION: Teks soal &amp; urutan opsi A–E disalin 100% kata demi kata sesuai naskah kating.<br />
                  2. TANPA ROMBAK VIGNET: Jika soal asli 1 kalimat singkat, tetap dipertahankan 1 kalimat singkat.<br />
                  3. VERIFIKASI KUNCI OTOMATIS: Bila kunci kating keliru, diberi peringatan Koreksi Kunci di pembahasan.<br />
                  4. PEMBAHASAN LENGKAP: Tetap disertai pembahasan terstruktur 4 sub-heading &amp; eliminasi opsi A–E.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Format Soal CBT */}
        {activeTab === 'format' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className={`p-3.5 sm:p-4 rounded-2xl border transition-all max-lg-liquid-subtle ${
              theme === 'dark'
                ? 'bg-gradient-to-br from-teal-500/10 via-indigo-500/10 to-slate-900/50 border-teal-500/25'
                : 'bg-gradient-to-br from-teal-50/90 via-indigo-50/60 to-slate-50 border-teal-200'
            }`}>
              <h4 className="text-xs font-black uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-1.5 mb-2">
                <Code2 className="w-4 h-4 text-teal-500 shrink-0" />
                <span>Format Data Soal JSON & YAML</span>
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed mb-3">
                Platform CBT AuraMed mendukung tipe soal Pilihan Ganda (MCQ) & Isian Singkat (Flashcard) dalam format tunggal maupun berkas gabungan (Campuran).
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className={`p-3 rounded-xl border max-lg-liquid-subtle ${
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

                <div className={`p-3 rounded-xl border max-lg-liquid-subtle ${
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

                <div className={`p-3 rounded-xl border max-lg-liquid-subtle ${
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