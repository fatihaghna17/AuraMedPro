import React, { useEffect, useRef, useState } from 'react';

/**
 * StableImage — iOS WebKit anti-flicker image.
 *
 * MASALAH: Di iOS (semua browser memakai WebKit), <img> tanpa dimensi eksplisit
 * dapat COLLAPSE ke tinggi 0 saat WebKit sementara menganggap elemen "not relevant"
 * (momentum scroll, rubber-band, re-layout tiap detik oleh timer kuis), lalu
 * mengembang lagi saat relevan — menghasilkan kedipan: pilihan jawaban melompat
 * naik menggantikan gambar, lalu gambar muncul kembali.
 *
 * SOLUSI:
 * 1. Selalu render box dengan `aspect-ratio` eksplisit (CSS murni) → tinggi box
 *    tidak pernah bergantung pada status load/decode gambar → layout tidak pernah collapse.
 * 2. Dimensi natural gambar di-cache per-URL (module-level Map) → setelah pertama
 *    kali dimuat, semua render berikutnya (tick timer, revis soal, ganti maju/mundur)
 *    langsung memakai rasio asli → zero layout shift.
 * 3. `decoding="async"` agar decode tidak memblok main thread WebKit.
 * 4. Saat `src` berubah (ganti soal), rasio di-reset dari cache — pola resmi React
 *    "adjusting state when props change" (setState during render).
 */

// Cache dimensi natural per URL — bertahan lintas mount/re-render
const dimensionCache = new Map<string, { w: number; h: number }>();

interface StableImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent<HTMLImageElement>) => void;
  referrerPolicy?: React.HTMLAttributeReferrerPolicy;
  /** Rasio cadangan sebelum dimensi asli diketahui (default 4:3) */
  fallbackRatio?: number;
}

export default function StableImage({
  src,
  alt,
  className = '',
  style,
  onClick,
  referrerPolicy,
  fallbackRatio = 4 / 3,
}: StableImageProps) {
  const getCachedRatio = (url: string): number => {
    const c = dimensionCache.get(url);
    return c ? c.w / c.h : fallbackRatio;
  };

  const [ratio, setRatio] = useState<number>(() => getCachedRatio(src));
  const [prevSrc, setPrevSrc] = useState(src);
  const imgRef = useRef<HTMLImageElement>(null);

  // Reset rasio saat src berubah (navigasi soal) — langsung dari cache bila tersedia
  if (prevSrc !== src) {
    setPrevSrc(src);
    setRatio(getCachedRatio(src));
  }

  // Race-safety: gambar yang di-cache HTTP bisa sudah "complete" sebelum event
  // onLoad sempat dipasang — sinkronkan dimensi dari ref begitu commit selesai.
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
      const dim = { w: img.naturalWidth, h: img.naturalHeight };
      dimensionCache.set(src, dim);
      const r = dim.w / dim.h;
      setRatio((prev) => (Math.abs(prev - r) > 0.001 ? r : prev));
    }
  }, [src]);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      dimensionCache.set(src, { w: img.naturalWidth, h: img.naturalHeight });
      setRatio(img.naturalWidth / img.naturalHeight);
    }
  };

  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      referrerPolicy={referrerPolicy}
      decoding="async"
      draggable={false}
      className={className}
      style={{ aspectRatio: String(ratio), ...style }}
      onLoad={handleLoad}
      onClick={onClick}
    />
  );
}
