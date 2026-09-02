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
  const options = question.options || [];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full max-w-3xl mx-auto flex flex-col gap-6"
    >
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
        <h3 className="text-xl md:text-2xl font-bold text-gray-800">{question.text}</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {options.map((opt: any, idx: number) => {
          let btnClass = "bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200";
          
          if (isAnswered) {
            if (correctAnswer === opt.text) {
              btnClass = "bg-green-500 text-white border-green-600";
            } else if (selectedAnswer === opt.text) {
              btnClass = "bg-red-500 text-white border-red-600";
            } else {
              btnClass = "bg-gray-100 text-gray-400 border-gray-200 opacity-50";
            }
          } else if (selectedAnswer === opt.text) {
            btnClass = "bg-yellow-400 text-yellow-900 border-yellow-500";
          }

          return (
            <motion.button
              key={idx}
              whileTap={!isAnswered && !isSubmitting ? { scale: 0.98 } : {}}
              onClick={() => onAnswer(opt.text)}
              disabled={isAnswered || isSubmitting}
              className={`p-4 rounded-xl text-lg font-bold transition-colors min-h-[80px] flex items-center justify-center ${btnClass}`}
            >
              {opt.text}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
