import { X } from 'lucide-react';

interface LightboxModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

export default function LightboxModal({ imageUrl, onClose }: LightboxModalProps) {
  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md transition-opacity duration-300"
      onClick={onClose}
    >
      {/* Close button top-right */}
      <button
        className="absolute top-4 right-4 p-3 rounded-full bg-slate-900/80 text-white hover:bg-slate-800 transition-colors cursor-pointer"
        onClick={onClose}
      >
        <X className="w-6 h-6" />
      </button>

      {/* Image container */}
      <div
        className="relative max-w-4xl max-h-[85vh] flex flex-col justify-center items-center bg-transparent"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt="Detail Gambar"
          referrerPolicy="no-referrer"
          decoding="async"
          className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl border border-slate-800/80 bg-slate-900/40 p-2"
        />
        <p className="mt-4 text-xs font-semibold text-slate-400 bg-slate-900/60 px-3 py-1.5 rounded-full backdrop-blur-sm">
          Klik di luar gambar atau tombol close untuk kembali
        </p>
      </div>
    </div>
  );
}
