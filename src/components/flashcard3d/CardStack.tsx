// src/components/flashcard3d/CardStack.tsx
// Panggung 3D dengan tumpukan 2 lapisan kaca yang menyembul di bawah kartu aktif.
// Saat kartu teratas digeser, lapisan di belakangnya ikut terangkat halus.
import React, { forwardRef } from 'react';
import { motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import type { Flashcard3DCard } from '../../types/flashcard3d';
import { FlipCard, type FlipCardHandle } from './FlipCard';

interface CardStackProps {
  card: Flashcard3DCard;
  cardKey: string;
  number: number;
  remainingAfter: number;
  flipped: boolean;
  status?: boolean;
  onFlip: () => void;
  onRate: (known: boolean) => void;
  onZoom: (src: string) => void;
}

export const CardStack = forwardRef<FlipCardHandle, CardStackProps>(function CardStack(
  { card, cardKey, number, remainingAfter, flipped, status, onFlip, onRate, onZoom },
  ref
) {
  const reduce = useReducedMotion();
  const dragProgress = useMotionValue(0);

  // Lapisan kaca bawah ikut naik perlahan saat kartu aktif digeser
  const back1Y = useTransform(dragProgress, [0, 1], [10, 2]);
  const back1ScaleX = useTransform(dragProgress, [0, 1], [0.94, 0.99]);
  const back1Opacity = useTransform(dragProgress, [0, 1], [0.78, 0.96]);

  const back2Y = useTransform(dragProgress, [0, 1], [19, 10]);
  const back2ScaleX = useTransform(dragProgress, [0, 1], [0.87, 0.935]);
  const back2Opacity = useTransform(dragProgress, [0, 1], [0.48, 0.74]);

  return (
    <div className="fc3d-stage relative w-full max-w-[560px] mx-auto h-[clamp(270px,43dvh,430px)] mb-6">
      {/* Lapisan ke-2 (menyembul lembut di bawah tepi bawah kartu, tidak memotong isi kaca depan) */}
      {remainingAfter >= 2 && (
        <motion.div
          aria-hidden="true"
          className="fc3d-stack-lip pointer-events-none absolute inset-x-0 bottom-0 h-10 rounded-b-[28px]"
          style={
            reduce
              ? { transform: 'translateY(18px) scaleX(0.87)', opacity: 0.45 }
              : { y: back2Y, scaleX: back2ScaleX, opacity: back2Opacity }
          }
        />
      )}

      {/* Lapisan ke-1 (kartu berikutnya) */}
      {remainingAfter >= 1 && (
        <motion.div
          aria-hidden="true"
          className="fc3d-stack-lip fc3d-stack-lip-near pointer-events-none absolute inset-x-0 bottom-0 h-11 rounded-b-[28px]"
          style={
            reduce
              ? { transform: 'translateY(9px) scaleX(0.94)', opacity: 0.74 }
              : { y: back1Y, scaleX: back1ScaleX, opacity: back1Opacity }
          }
        />
      )}

      {/* Kartu aktif */}
      <FlipCard
        key={cardKey}
        ref={ref}
        card={card}
        number={number}
        flipped={flipped}
        status={status}
        dragProgress={dragProgress}
        onFlip={onFlip}
        onRate={onRate}
        onZoom={onZoom}
      />
    </div>
  );
});
