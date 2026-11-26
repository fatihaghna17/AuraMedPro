// src/components/flashcard3d/FlipCard.tsx
// Kartu 3D: tilt mengikuti pointer, flip rotateY dengan kilau, swipe kanan = Hafal, kiri = Belum hafal.
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from 'motion/react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { Check, Maximize2, RotateCcw, X } from 'lucide-react';
import type { Flashcard3DCard, Flashcard3DFace } from '../../types/flashcard3d';

export interface FlipCardHandle {
  /** Lempar kartu ke kanan (Hafal) atau kiri (Belum hafal), lalu panggil onRate. */
  throwCard: (known: boolean) => void;
}

interface FlipCardProps {
  card: Flashcard3DCard;
  number: number;
  flipped: boolean;
  status?: boolean; // progres tersimpan: true Hafal, false Belum, undefined belum dinilai
  dragProgress?: MotionValue<number>;
  onFlip: () => void;
  onRate: (known: boolean) => void;
  onZoom: (src: string) => void;
}

const SWIPE_DISTANCE = 108;
const SWIPE_VELOCITY = 620;
const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

function renderRich(text: string): string {
  if (!text) return '';
  const html = marked.parse(text, { async: false, breaks: true }) as string;
  return DOMPurify.sanitize(html);
}

function sizeClass(face: Flashcard3DFace, isFront: boolean): string {
  const len = face.text.length;
  if (face.image) return len > 140 ? 'text-sm sm:text-base' : 'text-base sm:text-lg';
  if (!isFront) return len > 420 ? 'text-sm sm:text-[15px]' : len > 160 ? 'text-base sm:text-lg' : 'text-lg sm:text-xl';
  if (len <= 75) return 'text-xl sm:text-[1.65rem] leading-snug';
  if (len <= 170) return 'text-lg sm:text-2xl leading-snug';
  if (len <= 320) return 'text-base sm:text-xl leading-relaxed';
  return 'text-sm sm:text-lg leading-relaxed';
}

export const FlipCard = forwardRef<FlipCardHandle, FlipCardProps>(function FlipCard(
  { card, number, flipped, status, dragProgress, onFlip, onRate, onZoom },
  ref
) {
  const reduce = useReducedMotion();
  const didDrag = useRef(false);
  const throwing = useRef(false);

  // Drag (sumbu x) -> rotasi, tint, dan sinyal naik untuk kartu stack di belakang
  const x = useMotionValue(0);
  const rotateZ = useTransform(x, [-260, 0, 260], [-8.5, 0, 8.5]);
  const knownOpacity = useTransform(x, [18, SWIPE_DISTANCE], [0, 1]);
  const unknownOpacity = useTransform(x, [-SWIPE_DISTANCE, -18], [1, 0]);

  useEffect(() => {
    if (!dragProgress) return;
    dragProgress.set(0);
    const unsub = x.on('change', (latest) => {
      dragProgress.set(Math.min(1, Math.abs(latest) / (SWIPE_DISTANCE * 1.45)));
    });
    return () => {
      unsub();
      dragProgress.set(0);
    };
  }, [x, dragProgress]);

  // Tilt mengikuti pointer (desktop) + saat drag
  const tiltX = useSpring(0, { stiffness: 190, damping: 20 });
  const tiltY = useSpring(0, { stiffness: 190, damping: 20 });
  const dragTiltY = useTransform(x, [-260, 260], [-12, 12]);
  const rotateY = useTransform(() => (reduce ? 0 : tiltY.get() + dragTiltY.get()));

  // Specular glare mengikuti sudut miring
  const glareX = useTransform(tiltY, [-8, 8], [18, 82]);
  const glareY = useTransform(tiltX, [-8, 8], [82, 18]);
  const glare = useMotionTemplate`radial-gradient(115% 85% at ${glareX}% ${glareY}%, rgba(255,255,255,0.28), rgba(255,255,255,0) 56%)`;

  // Flip 3D (atau crossfade halus jika prefers-reduced-motion aktif)
  const flipDeg = useMotionValue(flipped ? 180 : 0);
  const sheenX = useTransform(flipDeg, [0, 180], ['-135%', '135%']);
  const sheenOpacity = useTransform(flipDeg, [0, 42, 90, 138, 180], [0, 0.5, 0.85, 0.5, 0]);

  useEffect(() => {
    const target = flipped ? 180 : 0;
    if (reduce) {
      flipDeg.set(target);
      return;
    }
    const controls = animate(flipDeg, target, { type: 'spring', stiffness: 225, damping: 23, mass: 0.92 });
    return () => controls.stop();
  }, [flipped, reduce, flipDeg]);

  const finishThrow = (known: boolean) => {
    if (throwing.current) return;
    throwing.current = true;
    if (reduce) {
      onRate(known);
      return;
    }
    const distance = (typeof window !== 'undefined' ? window.innerWidth : 800) * 0.72 + 240;
    animate(x, known ? distance : -distance, { duration: 0.34, ease: EASE_OUT }).then(() => onRate(known));
  };

  useImperativeHandle(ref, () => ({ throwCard: finishThrow }));

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || reduce || throwing.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    tiltX.set(-py * 9);
    tiltY.set(px * 11);
  };
  const resetTilt = () => {
    tiltX.set(0);
    tiltY.set(0);
  };

  const frontHtml = useMemo(() => renderRich(card.front.text), [card.front.text]);
  const backHtml = useMemo(() => renderRich(card.back.text), [card.back.text]);

  const swipeOverlays = (
    <>
      <motion.div
        aria-hidden="true"
        style={{ opacity: knownOpacity }}
        className="pointer-events-none absolute inset-0 rounded-[inherit] fc3d-tint-known"
      >
        <span className="absolute top-11 sm:top-5 left-4 sm:left-5 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold tracking-tight fc3d-stamp-known">
          <Check className="w-3.5 h-3.5" strokeWidth={3} /> Hafal
        </span>
      </motion.div>
      <motion.div
        aria-hidden="true"
        style={{ opacity: unknownOpacity }}
        className="pointer-events-none absolute inset-0 rounded-[inherit] fc3d-tint-unknown"
      >
        <span className="absolute top-11 sm:top-5 right-4 sm:right-5 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold tracking-tight fc3d-stamp-unknown">
          <X className="w-3.5 h-3.5" strokeWidth={3} /> Belum hafal
        </span>
      </motion.div>
    </>
  );

  const surfaceFx = reduce ? null : (
    <>
      <motion.div
        aria-hidden="true"
        style={{ background: glare }}
        className="pointer-events-none absolute inset-0 rounded-[inherit] mix-blend-soft-light"
      />
      <motion.div
        aria-hidden="true"
        style={{ x: sheenX, opacity: sheenOpacity }}
        className="pointer-events-none absolute inset-y-0 -inset-x-1/2 fc3d-sheen"
      />
    </>
  );

  const statusDot =
    status === undefined ? null : (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold fc3d-chip ${
          status ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${status ? 'bg-emerald-500' : 'bg-rose-500'}`} />
        {status ? 'Hafal' : 'Belum hafal'}
      </span>
    );

  const renderImage = (src: string, alt: string, compact: boolean) => (
    <div className={`relative w-full flex items-center justify-center ${compact ? 'max-h-[44%] min-h-[110px]' : 'flex-1 min-h-0'}`}>
      <img
        src={src}
        alt={alt}
        draggable={false}
        referrerPolicy="no-referrer"
        decoding="async"
        className="max-w-full max-h-full object-contain rounded-2xl select-none shadow-sm"
        onError={(e) => {
          const el = e.currentTarget;
          el.style.display = 'none';
          el.nextElementSibling?.classList.remove('hidden');
        }}
      />
      <div className="hidden flex-col items-center justify-center gap-1 rounded-2xl fc3d-chip px-5 py-6 text-xs text-slate-600 dark:text-slate-300">
        <span>Gambar gagal dimuat</span>
        <span className="text-[11px] opacity-75">{alt}</span>
      </div>
      <button
        type="button"
        aria-label="Perbesar gambar"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onZoom(src);
        }}
        className="absolute bottom-2 right-2 p-2 rounded-full fc3d-chip text-slate-700 dark:text-slate-200 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
      >
        <Maximize2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  const handleCardTap = () => {
    if (didDrag.current || throwing.current) return;
    if (typeof window !== 'undefined' && window.getSelection()?.toString()) return;
    onFlip();
  };

  return (
    <motion.div
      className="absolute inset-0 touch-pan-y select-none"
      style={{ x, rotate: reduce ? 0 : rotateZ, transformStyle: 'preserve-3d' }}
      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.945, y: 14 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: reduce ? 0.18 : 0.38, ease: EASE_OUT }}
      drag={reduce ? false : 'x'}
      dragDirectionLock
      dragElastic={0.85}
      dragMomentum={false}
      onPointerDown={() => {
        didDrag.current = false;
      }}
      onDragStart={() => {
        didDrag.current = true;
        resetTilt();
      }}
      onDragEnd={(_, info) => {
        const dx = info.offset.x;
        const vx = info.velocity.x;
        if (dx > SWIPE_DISTANCE || vx > SWIPE_VELOCITY) finishThrow(true);
        else if (dx < -SWIPE_DISTANCE || vx < -SWIPE_VELOCITY) finishThrow(false);
        else animate(x, 0, { type: 'spring', stiffness: 420, damping: 32 });
      }}
      onTap={handleCardTap}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTilt}
      role="button"
      tabIndex={0}
      aria-pressed={flipped}
      aria-label={flipped ? `Sisi jawaban kartu nomor ${number}. Tekan Spasi untuk kembali ke pertanyaan.` : `Kartu nomor ${number}. Tekan Spasi atau ketuk untuk melihat jawaban.`}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onFlip();
        }
      }}
    >
      <motion.div
        className="absolute inset-0 rounded-[28px]"
        style={{ rotateX: reduce ? 0 : tiltX, rotateY, transformStyle: 'preserve-3d' }}
      >
        <motion.div
          className="absolute inset-0 cursor-pointer rounded-[28px]"
          style={{ rotateY: reduce ? 0 : flipDeg, transformStyle: 'preserve-3d' }}
        >
          {/* FRONT FACE */}
          <div
            className={`fc3d-face absolute inset-0 rounded-[28px] overflow-hidden flex flex-col transition-opacity duration-200 ${
              flipped ? 'pointer-events-none' : ''
            } ${reduce ? (flipped ? 'opacity-0' : 'opacity-100') : ''}`}
            style={reduce ? undefined : { transform: 'rotateY(0deg)' }}
            aria-hidden={flipped}
          >
            {surfaceFx}
            <div className="relative z-10 flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-5 pb-1">
              <span className="text-xs font-semibold tabular-nums text-slate-500 dark:text-slate-400">
                No. {number}
              </span>
              {statusDot}
            </div>
            <div className="relative z-10 flex-1 min-h-0 flex flex-col items-center justify-center gap-4 px-4 sm:px-9 py-4 text-center overflow-y-auto overscroll-contain fc3d-scroll">
              {card.front.image && renderImage(card.front.image, 'Gambar pertanyaan', !!card.front.text)}
              {card.front.text && (
                <div
                  className={`fc3d-prose fc3d-prose-front w-full font-semibold text-slate-900 dark:text-slate-50 text-balance ${sizeClass(card.front, true)}`}
                  dangerouslySetInnerHTML={{ __html: frontHtml }}
                />
              )}
            </div>
            <div className="relative z-10 pb-4 sm:pb-5 pt-1 flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <RotateCcw className="w-3 h-3 opacity-80" />
              <span>Ketuk kartu untuk melihat jawaban</span>
            </div>
            {swipeOverlays}
          </div>

          {/* BACK FACE */}
          <div
            className={`fc3d-face fc3d-face-back absolute inset-0 rounded-[28px] overflow-hidden flex flex-col transition-opacity duration-200 ${
              !flipped ? 'pointer-events-none' : ''
            } ${reduce ? (flipped ? 'opacity-100' : 'opacity-0') : ''}`}
            style={reduce ? undefined : { transform: 'rotateY(180deg)' }}
            aria-hidden={!flipped}
          >
            {surfaceFx}
            <div className="relative z-10 flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-5 pb-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                Jawaban
              </span>
              <span className="text-xs font-semibold tabular-nums text-slate-500 dark:text-slate-400">
                No. {number}
              </span>
            </div>
            <div className="relative z-10 flex-1 min-h-0 overflow-y-auto overscroll-contain fc3d-scroll fc3d-scroll-mask px-4 sm:px-9 py-4 flex flex-col gap-4 select-text">
              <div className="my-auto flex flex-col gap-4">
                {card.back.image && renderImage(card.back.image, 'Gambar keterangan', !!card.back.text)}
                {card.back.text && (
                  <div
                    className={`fc3d-prose text-slate-800 dark:text-slate-100 ${sizeClass(card.back, false)}`}
                    dangerouslySetInnerHTML={{ __html: backHtml }}
                  />
                )}
              </div>
            </div>
            <div className="relative z-10 pb-5 pt-1 flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <RotateCcw className="w-3 h-3 opacity-80" />
              <span>Ketuk untuk kembali ke depan</span>
            </div>
            {swipeOverlays}
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
});
