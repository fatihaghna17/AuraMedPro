import React from 'react';
import { motion } from 'motion/react';

interface MabarQuestionCardProps {
  question: any;
  onAnswer: (answer: string) => void;
  isAnswered: boolean;
  isSubmitting: boolean;
  selectedAnswer?: string;
  correctAnswer?: string | null;
}

export default function MabarQuestionCard({
  question,
  onAnswer,
  isAnswered,
  isSubmitting,
  selectedAnswer,
  correctAnswer
}: MabarQuestionCardProps) {
  const options = question?.options || [];
  const letters = ['A', 'B', 'C', 'D', 'E'];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full max-w-3xl mx-auto flex flex-col gap-6"
    >
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
        <h3 className="text-xl md:text-2xl font-black text-gray-800 leading-snug">
          {question?.text || question?.pertanyaan || 'Pertanyaan'}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {options.map((opt: any, idx: number) => {
          const optText = typeof opt === 'string' ? opt : (opt?.text || opt?.label || String(opt || ''));
          let btnClass = "bg-white text-gray-700 hover:bg-slate-50 border-2 border-gray-200 shadow-sm";
          
          if (isAnswered) {
            if (correctAnswer === optText || correctAnswer === letters[idx]) {
              btnClass = "bg-emerald-500 text-white border-emerald-600 shadow-md";
            } else if (selectedAnswer === optText || selectedAnswer === letters[idx]) {
              btnClass = "bg-rose-500 text-white border-rose-600 shadow-md";
            } else {
              btnClass = "bg-gray-100 text-gray-400 border-gray-200 opacity-50";
            }
          } else if (selectedAnswer === optText) {
            btnClass = "bg-indigo-500 text-white border-indigo-600 shadow-md";
          }

          return (
            <motion.button
              key={idx}
              whileTap={!isAnswered && !isSubmitting ? { scale: 0.98 } : {}}
              onClick={() => onAnswer(optText)}
              disabled={isAnswered || isSubmitting}
              className={`p-4 rounded-2xl text-base md:text-lg font-bold transition-all min-h-[72px] flex items-center gap-3 text-left cursor-pointer ${btnClass}`}
            >
              <div className="w-8 h-8 rounded-full bg-slate-900/10 flex items-center justify-center font-black text-sm flex-shrink-0">
                {letters[idx] || (idx + 1)}
              </div>
              <span className="flex-1 font-semibold">{optText}</span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
