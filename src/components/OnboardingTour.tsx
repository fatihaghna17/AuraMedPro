import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Check } from 'lucide-react';

interface OnboardingTourProps {
  onComplete: () => void;
  theme: 'light' | 'dark';
}

export function OnboardingTour({ onComplete, theme }: OnboardingTourProps) {
  const [step, setStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isDone = localStorage.getItem('cbt_onboarding_done');
    if (!isDone) {
      // Delay sedikit agar UI render dulu
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const completeTour = () => {
    localStorage.setItem('cbt_onboarding_done', 'true');
    setIsVisible(false);
    onComplete();
  };

  const steps = [
    {
      title: 'Selamat Datang! 👋',
      desc: 'AuraMedPro akan membantumu belajar dengan metode cerdas. Mari kita lihat fitur-fitur utamanya secara singkat.',
      position: 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
    },
    {
      title: 'Pilih Bank Soal',
      desc: 'Pilih modul atau folder UKMPPD yang ingin kamu kerjakan di area ini. Kamu bisa mencampur beberapa bank soal sekaligus.',
      position: 'absolute top-1/3 left-8 lg:left-72'
    },
    {
      title: 'Mulai Belajar & Kuis',
      desc: 'Klik tombol "Mulai Kuis" untuk memulai sesi tryout, atau gunakan "Flashcard Mode" untuk hapalan cepat.',
      position: 'absolute top-1/2 right-8 lg:right-1/4'
    },
    {
      title: 'Analisis & Progress',
      desc: 'Setelah kuis, cek tab Analisis untuk melihat kelemahanmu, atau gunakan SRS (Spaced Repetition) untuk me-review soal sulit.',
      position: 'absolute bottom-24 left-1/2 -translate-x-1/2'
    }
  ];

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] pointer-events-none">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-[2px] pointer-events-auto"
        />

        {/* Highlight/Tooltip Container */}
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`${steps[step].position} w-[90%] max-w-sm pointer-events-auto z-10`}
        >
          <div className={`p-6 rounded-3xl shadow-2xl border-2 ${
            theme === 'dark' 
              ? 'bg-slate-900 border-indigo-500/30 shadow-indigo-900/20 text-white' 
              : 'bg-white border-indigo-500/20 shadow-indigo-500/20 text-slate-800'
          }`}>
            
            <div className="flex justify-between items-start mb-4">
              <div className="flex gap-1">
                {steps.map((_, i) => (
                  <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === step 
                      ? 'w-6 bg-indigo-500' 
                      : i < step 
                        ? 'w-2 bg-indigo-300 dark:bg-indigo-800' 
                        : 'w-2 bg-slate-200 dark:bg-slate-800'
                  }`} />
                ))}
              </div>
              <button 
                onClick={completeTour}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h3 className="text-xl font-black tracking-tight mb-2">
              {steps[step].title}
            </h3>
            <p className={`text-sm font-medium leading-relaxed mb-8 ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
            }`}>
              {steps[step].desc}
            </p>

            <div className="flex justify-between items-center mt-6">
              <button
                onClick={completeTour}
                className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                Lewati Tour
              </button>
              
              <button
                onClick={() => {
                  if (step < steps.length - 1) setStep(step + 1);
                  else completeTour();
                }}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-xl transition-all active:scale-95 shadow-md shadow-indigo-500/20"
              >
                {step < steps.length - 1 ? (
                  <>Lanjut <ChevronRight className="w-4 h-4" /></>
                ) : (
                  <>Selesai <Check className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
