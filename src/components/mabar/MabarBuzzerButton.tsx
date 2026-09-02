import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface MabarBuzzerButtonProps {
  onBuzz: () => void;
  isActive: boolean;
  isDisabled: boolean;
  buzzWinnerId?: string | null;
  currentUserId: string;
}

export default function MabarBuzzerButton({
  onBuzz,
  isActive,
  isDisabled,
  buzzWinnerId,
  currentUserId
}: MabarBuzzerButtonProps) {
  
  const handleBuzz = () => {
    if (isActive && !isDisabled && !buzzWinnerId) {
      if ('vibrate' in navigator) {
        try { navigator.vibrate(50); } catch (e) {}
      }
      onBuzz();
    }
  };

  const isMyBuzz = buzzWinnerId === currentUserId;
  const isSomeoneElseBuzz = buzzWinnerId && buzzWinnerId !== currentUserId;

  let btnColor = "from-red-500 to-rose-600 shadow-red-500/50";
  let pulseAnim = { scale: [1, 1.05, 1] };
  
  if (isDisabled || !isActive || isSomeoneElseBuzz) {
    btnColor = "from-gray-400 to-gray-500 shadow-gray-400/50";
    pulseAnim = { scale: [1, 1, 1] };
  } else if (isMyBuzz) {
    btnColor = "from-green-500 to-emerald-600 shadow-green-500/50";
  }

  return (
    <div className="flex flex-col items-center justify-center h-full w-full">
      <motion.button
        whileTap={(!isDisabled && isActive && !buzzWinnerId) ? { scale: 0.9 } : {}}
        animate={isActive && !isDisabled && !buzzWinnerId ? pulseAnim : { scale: 1 }}
        transition={{ repeat: Infinity, duration: 2 }}
        onClick={handleBuzz}
        disabled={isDisabled || !isActive || !!buzzWinnerId}
        className={`relative w-64 h-64 md:w-80 md:h-80 rounded-full bg-gradient-to-br ${btnColor} shadow-2xl flex items-center justify-center border-8 border-white/20`}
      >
        <span className="text-white font-black text-4xl md:text-5xl uppercase tracking-widest drop-shadow-md">
          {isMyBuzz ? 'CEPAT!' : isSomeoneElseBuzz ? 'TELAT' : 'BUZZ'}
        </span>
      </motion.button>

      <AnimatePresence>
        {isSomeoneElseBuzz && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0 }} 
            className="mt-8 text-center"
          >
            <p className="text-2xl font-bold text-red-500">Lawan Lebih Cepat!</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
