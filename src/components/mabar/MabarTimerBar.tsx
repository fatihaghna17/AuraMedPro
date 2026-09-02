import React from 'react';
import { motion } from 'motion/react';

interface MabarTimerBarProps {
  timeRemaining: number;
  totalTime: number;
  isActive: boolean;
}

export default function MabarTimerBar({ timeRemaining, totalTime, isActive }: MabarTimerBarProps) {
  const percentage = Math.max(0, (timeRemaining / totalTime) * 100);
  
  let color = 'bg-green-500';
  if (percentage < 30) color = 'bg-red-500';
  else if (percentage < 60) color = 'bg-yellow-500';

  return (
    <div className="w-full bg-gray-200 h-3 overflow-hidden rounded-full">
      <motion.div
        className={`h-full ${color}`}
        initial={{ width: '100%' }}
        animate={{ width: `${percentage}%` }}
        transition={{ ease: "linear", duration: 1 }}
      />
    </div>
  );
}
