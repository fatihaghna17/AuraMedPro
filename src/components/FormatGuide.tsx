interface FormatGuideProps {
  theme: 'light' | 'dark';
}

export default function FormatGuide({ theme }: FormatGuideProps) {
  return (
    <div className={`p-6 rounded-3xl border transition-all duration-350 flex flex-col justify-between ${
      theme === 'dark'
        ? 'bg-slate-900/40 border-white/[0.08] shadow-xl'
        : 'bg-white border-slate-200 shadow-sm'
    }`}>
      <div>
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Petunjuk Format</h3>
        <p className="text-[11px] text-slate-450 mt-1">Platform CBT mendukung tipe soal Pilihan Ganda (MCQ) & Isian Singkat (Flashcard) dalam format penyatuan JSON/YAML.</p>
        
        <div className="space-y-2 mt-4">
          <div className="flex items-start gap-2 text-[10px] font-semibold text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5" />
            <span>Kunci soal MCQ menggunakan array `mcq_questions` atau `questions`.</span>
          </div>
          <div className="flex items-start gap-2 text-[10px] font-semibold text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5" />
            <span>Kunci flashcard/isian menggunakan `flashcard_questions` atau `cards`.</span>
          </div>
          <div className="flex items-start gap-2 text-[10px] font-semibold text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5" />
            <span>Mendukung upload massal folder soal terkompresi.</span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-800/50 space-y-3">
        <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Unduh Template & Panduan
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <a 
            href="/template_mcq.json" 
            download="template_mcq.json"
            className={`py-2 px-2.5 border rounded-xl text-[9px] font-black uppercase tracking-wider transition-colors text-center block cursor-pointer ${
              theme === 'dark' ? 'border-slate-800 hover:bg-slate-800 text-indigo-400' : 'border-slate-200 hover:bg-slate-50 text-indigo-600'
            }`}
          >
            📦 Template MCQ (.json)
          </a>
          <a 
            href="/template_flashcard.json" 
            download="template_flashcard.json"
            className={`py-2 px-2.5 border rounded-xl text-[9px] font-black uppercase tracking-wider transition-colors text-center block cursor-pointer ${
              theme === 'dark' ? 'border-slate-800 hover:bg-slate-800 text-purple-400' : 'border-slate-200 hover:bg-slate-50 text-purple-600'
            }`}
          >
            📦 Template Flashcard (.json)
          </a>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <a 
            href="/panduan_pembuatan_soal.txt" 
            download="panduan_pembuatan_soal.txt"
            className={`py-2 px-1 border rounded-xl text-[8px] font-bold uppercase tracking-wider transition-colors text-center block cursor-pointer ${
              theme === 'dark' ? 'border-slate-800 hover:bg-slate-800 text-slate-350' : 'border-slate-200 hover:bg-slate-50 text-slate-600'
            }`}
            title="Panduan Pembuatan Soal MCQ"
          >
            📄 Panduan MCQ
          </a>
          <a 
            href="/panduan_flashcard.md" 
            download="panduan_flashcard.md"
            className={`py-2 px-1 border rounded-xl text-[8px] font-bold uppercase tracking-wider transition-colors text-center block cursor-pointer ${
              theme === 'dark' ? 'border-slate-800 hover:bg-slate-800 text-slate-355' : 'border-slate-200 hover:bg-slate-50 text-slate-600'
            }`}
            title="Panduan Pembuatan Flashcard"
          >
            📄 Flashcard
          </a>
          <a 
            href="/aturan_konten.txt" 
            download="aturan_konten.txt"
            className={`py-2 px-1 border rounded-xl text-[8px] font-bold uppercase tracking-wider transition-colors text-center block cursor-pointer ${
              theme === 'dark' ? 'border-slate-800 hover:bg-slate-800 text-slate-355' : 'border-slate-200 hover:bg-slate-50 text-slate-600'
            }`}
            title="Aturan Konten / Konversi Soal"
          >
            📄 Aturan Konten
          </a>
        </div>

        <a 
          href="/panduan_prompt_ai.txt" 
          download="panduan_prompt_ai.txt"
          className={`w-full py-2.5 border rounded-xl text-[9px] font-black uppercase tracking-wider transition-colors text-center block cursor-pointer bg-gradient-to-r from-teal-500/10 to-indigo-500/10 hover:from-teal-500/15 hover:to-indigo-500/15 ${
            theme === 'dark' ? 'border-slate-800 text-teal-400' : 'border-slate-200 text-indigo-700'
          }`}
          title="Panduan Memori Prompt AI untuk Pembuatan Soal"
        >
          🤖 Panduan Memori Prompt AI (.txt)
        </a>
      </div>
    </div>
  );
}