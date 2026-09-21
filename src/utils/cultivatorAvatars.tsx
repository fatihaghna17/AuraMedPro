import React from 'react';

export type CultivatorGender = 'pria' | 'wanita';

export interface CultivatorTierInfo {
  tier: number;
  name: string;
  realm: string;
  minLevel: number;
  description: string;
  color: string;
  badge: string;
}

export const CULTIVATOR_TIERS: CultivatorTierInfo[] = [
  {
    tier: 1,
    name: 'Kultivator Fana (Mortal)',
    realm: 'Alam Fana (Mortal Realm)',
    minLevel: 1,
    description: 'Awal perjalanan kultivasi medis. Jubah bumi bersahaja dan tusuk konde kayu.',
    color: '#8d6e63',
    badge: '🌱'
  },
  {
    tier: 2,
    name: 'Kultivator Bumi (Earth Scholar)',
    realm: 'Alam Fana Menengah',
    minLevel: 6,
    description: 'Mulai memahami meridian dasar dan racikan herbal tingkat bumi.',
    color: '#78909c',
    badge: '🍃'
  },
  {
    tier: 3,
    name: 'Kultivator Roh Bawah (Underworld Student)',
    realm: 'Alam Fana Puncak',
    minLevel: 11,
    description: 'Pondasi fisik kokoh, siap melangkah menembus batas manusia fana.',
    color: '#7e57c2',
    badge: '🌿'
  },
  {
    tier: 4,
    name: 'Inti Roh Awal (Spirit Core)',
    realm: 'Alam Dunia Tengah',
    minLevel: 16,
    description: 'Pancaran qi spiritual mulai membias biru cerah dengan tusuk giok.',
    color: '#3b82f6',
    badge: '💧'
  },
  {
    tier: 5,
    name: 'Inti Emas Medika (Golden Core)',
    realm: 'Alam Dunia Atas',
    minLevel: 21,
    description: 'Inti emas terbentuk sempurna, memancarkan aura amber suci dan ornamen perak.',
    color: '#f59e0b',
    badge: '✨'
  },
  {
    tier: 6,
    name: 'Jiwa Murni (Pure Soul Sage)',
    realm: 'Alam Kuasi-Surgawi',
    minLevel: 31,
    description: 'Mampu menyembuhkan seribu penyakit dengan keagungan aura magenta-violet.',
    color: '#a855f7',
    badge: '🔮'
  },
  {
    tier: 7,
    name: 'Penghuni Surga Awal (Early Celestial)',
    realm: 'Alam Surgawi Awal',
    minLevel: 41,
    description: 'Jubah perak/putih berkilau, lingkaran cahaya (halo) suci tipis menaungi kepala.',
    color: '#06b6d4',
    badge: '🌟'
  },
  {
    tier: 8,
    name: 'Luhur Surgawi (Heavenly Venerable)',
    realm: 'Alam Surgawi Menengah',
    minLevel: 51,
    description: 'Aura surgawi menyala benderang, mahkota berhias batu permata dan halo emas.',
    color: '#eab308',
    badge: '💫'
  },
  {
    tier: 9,
    name: 'Raja / Ratu Surgawi (Celestial Monarch)',
    realm: 'Alam Surgawi Akhir',
    minLevel: 71,
    description: 'Penguasa langit kedokteran dengan mahkota kaisar agung dan lingkaran halo ganda.',
    color: '#ec4899',
    badge: '⚡'
  },
  {
    tier: 10,
    name: 'Kaisar / Dewi Surgawi (Supreme Celestial)',
    realm: 'Alam Mahadewa Nirwana',
    minLevel: 91,
    description: 'Puncak tertinggi kultivasi medika abadi. Aura surgawi mutlak dan mahkota nirwana sejati.',
    color: '#f43f5e',
    badge: '👑'
  }
];

export function getCultivatorTier(level: number): number {
  if (level >= 91) return 10;
  if (level >= 71) return 9;
  if (level >= 51) return 8;
  if (level >= 41) return 7;
  if (level >= 31) return 6;
  if (level >= 21) return 5;
  if (level >= 16) return 4;
  if (level >= 11) return 3;
  if (level >= 6) return 2;
  return 1;
}

const GENDER_KEY = 'auramedpro_avatar_gender';
const TIER_KEY = 'auramedpro_avatar_selected_tier';

export function getSavedCultivatorGender(): CultivatorGender {
  try {
    const saved = localStorage.getItem(GENDER_KEY);
    if (saved === 'wanita' || saved === 'pria') return saved;
  } catch (e) {
    // Ignore
  }
  return 'pria';
}

export function setSavedCultivatorGender(gender: CultivatorGender): void {
  try {
    localStorage.setItem(GENDER_KEY, gender);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auramedpro_avatar_gender_changed', { detail: gender }));
    }
  } catch (e) {
    // Ignore
  }
}

export function getSavedCultivatorTier(): number | 'auto' {
  try {
    const saved = localStorage.getItem(TIER_KEY);
    if (saved === 'auto' || !saved) return 'auto';
    const num = parseInt(saved, 10);
    if (num >= 1 && num <= 10) return num;
  } catch (e) {
    // Ignore
  }
  return 'auto';
}

export function setSavedCultivatorTier(tier: number | 'auto'): void {
  try {
    localStorage.setItem(TIER_KEY, tier.toString());
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auramedpro_avatar_tier_changed', { detail: tier }));
    }
  } catch (e) {
    // Ignore
  }
}

export function getEffectiveCultivatorTier(userLevel: number): number {
  const saved = getSavedCultivatorTier();
  const maxUnlocked = getCultivatorTier(userLevel);
  if (saved === 'auto') return maxUnlocked;
  return Math.min(saved, maxUnlocked) || 1;
}

// ============================================================
// SVG Generator for Male Avatars (Pria 1 - 10)
// ============================================================
export function renderMaleCultivatorSvg(tier: number, uid: string = 'm') {
  switch (tier) {
    case 1:
      return (
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <linearGradient id={`bg1m_${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d7ccc8" />
              <stop offset="100%" stopColor="#a1887f" />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r="100" fill={`url(#bg1m_${uid})`} />
          <path d="M40 200 C40 140, 160 140, 160 200 Z" fill="#5d4037" />
          <path d="M80 150 L100 170 L120 150" fill="#8d6e63" stroke="#3e2723" strokeWidth="2" />
          <rect x="90" y="110" width="20" height="20" fill="#ffccbc" />
          <circle cx="100" cy="90" r="30" fill="#ffccbc" />
          <path d="M70 90 C70 50, 130 50, 130 90 C120 70, 80 70, 70 90 Z" fill="#212121" />
          <circle cx="100" cy="45" r="12" fill="#212121" />
          <line x1="85" y1="45" x2="115" y2="45" stroke="#795548" strokeWidth="3" />
        </svg>
      );
    case 2:
      return (
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <linearGradient id={`bg2m_${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#cfd8dc" />
              <stop offset="100%" stopColor="#90a4ae" />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r="100" fill={`url(#bg2m_${uid})`} />
          <path d="M40 200 C40 140, 160 140, 160 200 Z" fill="#455a64" />
          <path d="M80 150 L100 170 L120 150" fill="#78909c" stroke="#263238" strokeWidth="2" />
          <rect x="90" y="110" width="20" height="20" fill="#ffccbc" />
          <circle cx="100" cy="90" r="30" fill="#ffccbc" />
          <path d="M70 90 C70 50, 130 50, 130 90 C120 70, 80 70, 70 90 Z" fill="#212121" />
          <circle cx="100" cy="45" r="12" fill="#212121" />
          <line x1="83" y1="45" x2="117" y2="45" stroke="#5d4037" strokeWidth="3.5" />
        </svg>
      );
    case 3:
      return (
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <linearGradient id={`bg3m_${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d1c4e9" />
              <stop offset="100%" stopColor="#9575cd" />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r="100" fill={`url(#bg3m_${uid})`} />
          <path d="M40 200 C40 140, 160 140, 160 200 Z" fill="#311b92" />
          <path d="M80 150 L100 170 L120 150" fill="#673ab7" stroke="#4527a0" strokeWidth="2" />
          <rect x="90" y="110" width="20" height="20" fill="#ffccbc" />
          <circle cx="100" cy="90" r="30" fill="#ffccbc" />
          <path d="M70 90 C70 50, 130 50, 130 90 C120 70, 80 70, 70 90 Z" fill="#1a1a1a" />
          <circle cx="100" cy="45" r="12" fill="#1a1a1a" />
          <line x1="80" y1="45" x2="120" y2="45" stroke="#a1887f" strokeWidth="3.5" />
          <circle cx="100" cy="45" r="3" fill="#bcaaa4" />
        </svg>
      );
    case 4:
      return (
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <radialGradient id={`aura4m_${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.35" />
              <stop offset="80%" stopColor="#3b82f6" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#1e40af" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={`bg4m_${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e3a8a" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r="100" fill={`url(#bg4m_${uid})`} />
          <circle cx="100" cy="100" r="90" fill={`url(#aura4m_${uid})`} />
          <path d="M40 200 C40 135, 160 135, 160 200 Z" fill="#1d4ed8" />
          <path d="M80 148 L100 172 L120 148" fill="#60a5fa" stroke="#1e40af" strokeWidth="2" />
          <rect x="90" y="110" width="20" height="20" fill="#fed7aa" />
          <circle cx="100" cy="90" r="30" fill="#fed7aa" />
          <path d="M70 90 C70 48, 130 48, 130 90 C120 68, 80 68, 70 90 Z" fill="#0f172a" />
          <circle cx="100" cy="45" r="12" fill="#0f172a" />
          <line x1="80" y1="45" x2="120" y2="45" stroke="#2dd4bf" strokeWidth="3.5" />
          <circle cx="100" cy="45" r="3.5" fill="#14b8a6" />
        </svg>
      );
    case 5:
      return (
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <radialGradient id={`aura5m_${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.45" />
              <stop offset="70%" stopColor="#d97706" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#b45309" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={`bg5m_${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#312e81" />
              <stop offset="100%" stopColor="#1e1b4b" />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r="100" fill={`url(#bg5m_${uid})`} />
          <circle cx="100" cy="100" r="90" fill={`url(#aura5m_${uid})`} />
          <path d="M38 200 C38 135, 162 135, 162 200 Z" fill="#4338ca" />
          <path d="M78 145 L100 175 L122 145" fill="#a5b4fc" stroke="#6366f1" strokeWidth="2" />
          <rect x="90" y="110" width="20" height="20" fill="#fed7aa" />
          <circle cx="100" cy="90" r="30" fill="#fed7aa" />
          <path d="M70 90 C70 46, 130 46, 130 90 C120 66, 80 66, 70 90 Z" fill="#111827" />
          <circle cx="100" cy="45" r="12" fill="#111827" />
          <line x1="78" y1="45" x2="122" y2="45" stroke="#e2e8f0" strokeWidth="3.5" />
          <circle cx="100" cy="45" r="4" fill="#06b6d4" />
        </svg>
      );
    case 6:
      return (
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <radialGradient id={`aura6m_${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f472b6" stopOpacity="0.55" />
              <stop offset="60%" stopColor="#a855f7" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#581c87" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={`bg6m_${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#581c87" />
              <stop offset="100%" stopColor="#2e1065" />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r="100" fill={`url(#bg6m_${uid})`} />
          <circle cx="100" cy="100" r="90" fill={`url(#aura6m_${uid})`} />
          <path d="M36 200 C36 132, 164 132, 164 200 Z" fill="#7e22ce" />
          <path d="M76 142 L100 176 L124 142" fill="#e9d5ff" stroke="#a855f7" strokeWidth="2" />
          <rect x="90" y="110" width="20" height="20" fill="#ffedd5" />
          <circle cx="100" cy="90" r="30" fill="#ffedd5" />
          <path d="M70 90 C70 44, 130 44, 130 90 C120 64, 80 64, 70 90 Z" fill="#0f172a" />
          <path d="M88 48 L100 34 L112 48 Z" fill="#cbd5e1" />
          <circle cx="100" cy="42" r="3.5" fill="#9333ea" />
        </svg>
      );
    case 7:
      return (
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <radialGradient id={`aura7m_${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.65" />
              <stop offset="50%" stopColor="#67e8f9" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#0891b2" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={`robe7m_${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>
            <linearGradient id={`bg7m_${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r="100" fill={`url(#bg7m_${uid})`} />
          <circle cx="100" cy="100" r="90" fill={`url(#aura7m_${uid})`} />
          <circle cx="100" cy="70" r="45" fill="none" stroke="#fde047" strokeWidth="2.5" opacity="0.5" />
          <path d="M34 200 C34 130, 166 130, 166 200 Z" fill={`url(#robe7m_${uid})`} />
          <path d="M74 140 L100 178 L126 140" fill="#fef08a" stroke="#eab308" strokeWidth="2" />
          <rect x="90" y="110" width="20" height="20" fill="#ffe0b2" />
          <circle cx="100" cy="90" r="30" fill="#ffe0b2" />
          <path d="M70 90 C70 42, 130 42, 130 90 C120 62, 80 62, 70 90 Z" fill="#334155" />
          <path d="M86 46 L100 26 L114 46 Z" fill="#facc15" />
          <circle cx="100" cy="38" r="4" fill="#38bdf8" />
        </svg>
      );
    case 8:
      return (
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <radialGradient id={`aura8m_${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
              <stop offset="50%" stopColor="#fde047" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={`robe8m_${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#f1f5f9" />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r="100" fill="#1e1b4b" />
          <circle cx="100" cy="100" r="90" fill={`url(#aura8m_${uid})`} />
          <circle cx="100" cy="70" r="45" fill="none" stroke="#facc15" strokeWidth="2.5" opacity="0.65" />
          <path d="M32 200 C32 130, 168 130, 168 200 Z" fill={`url(#robe8m_${uid})`} />
          <path d="M72 140 L100 180 L128 140" fill="#fef08a" stroke="#ca8a04" strokeWidth="2" />
          <rect x="90" y="110" width="20" height="20" fill="#ffe0b2" />
          <circle cx="100" cy="90" r="30" fill="#ffe0b2" />
          <path d="M70 90 C70 40, 130 40, 130 90 C120 60, 80 60, 70 90 Z" fill="#e2e8f0" />
          <path d="M85 45 L100 22 L115 45 Z" fill="#fbbf24" />
          <circle cx="100" cy="35" r="4.5" fill="#ef4444" />
        </svg>
      );
    case 9:
      return (
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <radialGradient id={`aura9m_${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="45%" stopColor="#fef08a" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={`robe9m_${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r="100" fill="#0f172a" />
          <circle cx="100" cy="100" r="90" fill={`url(#aura9m_${uid})`} />
          <circle cx="100" cy="70" r="47" fill="none" stroke="#fde047" strokeWidth="2" opacity="0.75" />
          <circle cx="100" cy="70" r="42" fill="none" stroke="#fbbf24" strokeWidth="1.5" opacity="0.5" />
          <path d="M30 200 C30 130, 170 130, 170 200 Z" fill={`url(#robe9m_${uid})`} />
          <path d="M70 140 L100 180 L130 140" fill="#fff9c4" stroke="#f59e0b" strokeWidth="2.5" />
          <rect x="90" y="110" width="20" height="20" fill="#ffe0b2" />
          <circle cx="100" cy="90" r="30" fill="#ffe0b2" />
          <path d="M70 90 C70 38, 130 38, 130 90 C120 58, 80 58, 70 90 Z" fill="#f8fafc" />
          <path d="M84 45 L100 16 L116 45 Z" fill="#ffd54f" />
          <circle cx="100" cy="32" r="5" fill="#dc2626" />
        </svg>
      );
    case 10:
    default:
      return (
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <radialGradient id={`aura10m_${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#fff59d" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#fbc02d" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={`robe10m_${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#e0e0e0" />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r="100" fill="#1a237e" />
          <circle cx="100" cy="100" r="90" fill={`url(#aura10m_${uid})`} />
          <circle cx="100" cy="70" r="45" fill="none" stroke="#ffd54f" strokeWidth="3" opacity="0.8" />
          <path d="M30 200 C30 130, 170 130, 170 200 Z" fill={`url(#robe10m_${uid})`} />
          <path d="M70 140 L100 180 L130 140" fill="#fff9c4" stroke="#fbc02d" strokeWidth="2" />
          <rect x="90" y="110" width="20" height="20" fill="#ffe0b2" />
          <circle cx="100" cy="90" r="30" fill="#ffe0b2" />
          <path d="M70 90 C70 40, 130 40, 130 90 C120 60, 80 60, 70 90 Z" fill="#ffffff" />
          <path d="M85 45 L100 20 L115 45 Z" fill="#ffd54f" />
          <circle cx="100" cy="35" r="5" fill="#e53935" />
        </svg>
      );
  }
}

// ============================================================
// SVG Generator for Female Avatars (Wanita 1 - 10)
// ============================================================
export function renderFemaleCultivatorSvg(tier: number, uid: string = 'f') {
  switch (tier) {
    case 1:
      return (
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <linearGradient id={`bg1f_${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c8e6c9" />
              <stop offset="100%" stopColor="#81c784" />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r="100" fill={`url(#bg1f_${uid})`} />
          <path d="M45 200 C45 140, 155 140, 155 200 Z" fill="#388e3c" />
          <path d="M85 150 L100 165 L115 150" fill="#a5d6a7" stroke="#1b5e20" strokeWidth="2" />
          <rect x="92" y="110" width="16" height="20" fill="#ffccbc" />
          <circle cx="100" cy="90" r="28" fill="#ffccbc" />
          <path d="M72 95 C72 50, 128 50, 128 95 C128 120, 115 130, 100 130 C85 130, 72 120, 72 95 Z" fill="#3e2723" />
          <circle cx="100" cy="90" r="28" fill="#ffccbc" />
          <path d="M72 90 C72 50, 128 50, 128 90 C115 70, 85 70, 72 90 Z" fill="#3e2723" />
          <circle cx="100" cy="50" r="14" fill="#3e2723" />
          <line x1="85" y1="50" x2="115" y2="50" stroke="#8d6e63" strokeWidth="2" />
        </svg>
      );
    case 2:
      return (
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <linearGradient id={`bg2f_${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#b2dfdb" />
              <stop offset="100%" stopColor="#4db6ac" />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r="100" fill={`url(#bg2f_${uid})`} />
          <path d="M45 200 C45 140, 155 140, 155 200 Z" fill="#00796b" />
          <path d="M85 150 L100 165 L115 150" fill="#80cbc4" stroke="#004d40" strokeWidth="2" />
          <rect x="92" y="110" width="16" height="20" fill="#ffccbc" />
          <circle cx="100" cy="90" r="28" fill="#ffccbc" />
          <path d="M72 95 C72 50, 128 50, 128 95 C128 120, 115 130, 100 130 C85 130, 72 120, 72 95 Z" fill="#2d1d18" />
          <circle cx="100" cy="90" r="28" fill="#ffccbc" />
          <path d="M72 90 C72 50, 128 50, 128 90 C115 70, 85 70, 72 90 Z" fill="#2d1d18" />
          <circle cx="100" cy="50" r="14" fill="#2d1d18" />
          <line x1="83" y1="50" x2="117" y2="50" stroke="#5d4037" strokeWidth="2.5" />
        </svg>
      );
    case 3:
      return (
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <linearGradient id={`bg3f_${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e1bee7" />
              <stop offset="100%" stopColor="#ba68c8" />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r="100" fill={`url(#bg3f_${uid})`} />
          <path d="M45 200 C45 140, 155 140, 155 200 Z" fill="#6a1b9a" />
          <path d="M85 150 L100 165 L115 150" fill="#ce93d8" stroke="#4a148c" strokeWidth="2" />
          <rect x="92" y="110" width="16" height="20" fill="#ffccbc" />
          <circle cx="100" cy="90" r="28" fill="#ffccbc" />
          <path d="M72 95 C72 50, 128 50, 128 95 C128 120, 115 130, 100 130 C85 130, 72 120, 72 95 Z" fill="#212121" />
          <circle cx="100" cy="90" r="28" fill="#ffccbc" />
          <path d="M72 90 C72 50, 128 50, 128 90 C115 70, 85 70, 72 90 Z" fill="#212121" />
          <circle cx="100" cy="50" r="14" fill="#212121" />
          <line x1="82" y1="50" x2="118" y2="50" stroke="#a1887f" strokeWidth="2.5" />
          <circle cx="118" cy="50" r="2.5" fill="#d7ccc8" />
        </svg>
      );
    case 4:
      return (
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <radialGradient id={`aura4f_${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#a5f3fc" stopOpacity="0.4" />
              <stop offset="70%" stopColor="#0891b2" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#164e63" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={`bg4f_${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0e7490" />
              <stop offset="100%" stopColor="#155e75" />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r="100" fill={`url(#bg4f_${uid})`} />
          <circle cx="100" cy="100" r="90" fill={`url(#aura4f_${uid})`} />
          <path d="M42 200 C42 136, 158 136, 158 200 Z" fill="#0891b2" />
          <path d="M82 146 L100 168 L118 146" fill="#a5f3fc" stroke="#0e7490" strokeWidth="2" />
          <rect x="92" y="110" width="16" height="20" fill="#fed7aa" />
          <circle cx="100" cy="90" r="28" fill="#fed7aa" />
          <path d="M72 95 C72 48, 128 48, 128 95 C128 122, 115 132, 100 132 C85 132, 72 122, 72 95 Z" fill="#1e293b" />
          <circle cx="100" cy="90" r="28" fill="#fed7aa" />
          <path d="M72 88 C72 48, 128 48, 128 88 C115 68, 85 68, 72 88 Z" fill="#1e293b" />
          <circle cx="100" cy="50" r="14" fill="#1e293b" />
          <line x1="80" y1="50" x2="120" y2="50" stroke="#2dd4bf" strokeWidth="2.5" />
          <circle cx="120" cy="50" r="3" fill="#14b8a6" />
        </svg>
      );
    case 5:
      return (
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <radialGradient id={`aura5f_${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fde047" stopOpacity="0.45" />
              <stop offset="65%" stopColor="#a855f7" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#581c87" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={`bg5f_${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4a148c" />
              <stop offset="100%" stopColor="#311b92" />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r="100" fill={`url(#bg5f_${uid})`} />
          <circle cx="100" cy="100" r="90" fill={`url(#aura5f_${uid})`} />
          <path d="M40 200 C40 134, 160 134, 160 200 Z" fill="#6a1b9a" />
          <path d="M80 144 L100 170 L120 144" fill="#f3e8ff" stroke="#a855f7" strokeWidth="2" />
          <rect x="92" y="110" width="16" height="20" fill="#ffedd5" />
          <circle cx="100" cy="90" r="28" fill="#ffedd5" />
          <path d="M72 95 C72 46, 128 46, 128 95 C128 124, 115 134, 100 134 C85 134, 72 124, 72 95 Z" fill="#111827" />
          <circle cx="100" cy="90" r="28" fill="#ffedd5" />
          <path d="M72 86 C72 46, 128 46, 128 86 C115 66, 85 66, 72 86 Z" fill="#111827" />
          <circle cx="100" cy="50" r="14" fill="#111827" />
          <line x1="78" y1="50" x2="122" y2="50" stroke="#e2e8f0" strokeWidth="2.5" />
          <circle cx="122" cy="50" r="3.5" fill="#38bdf8" />
          <line x1="122" y1="53" x2="122" y2="60" stroke="#38bdf8" strokeWidth="1.5" />
        </svg>
      );
    case 6:
      return (
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <radialGradient id={`aura6f_${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f472b6" stopOpacity="0.55" />
              <stop offset="60%" stopColor="#be185d" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#831843" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={`bg6f_${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#880e4f" />
              <stop offset="100%" stopColor="#4a148c" />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r="100" fill={`url(#bg6f_${uid})`} />
          <circle cx="100" cy="100" r="90" fill={`url(#aura6f_${uid})`} />
          <path d="M38 200 C38 132, 162 132, 162 200 Z" fill="#ad1457" />
          <path d="M78 142 L100 172 L122 142" fill="#fce7f3" stroke="#ec4899" strokeWidth="2" />
          <rect x="92" y="110" width="16" height="20" fill="#fff1f2" />
          <circle cx="100" cy="90" r="28" fill="#fff1f2" />
          <path d="M72 95 C72 44, 128 44, 128 95 C128 126, 112 136, 100 136 C88 136, 72 126, 72 95 Z" fill="#0f172a" />
          <circle cx="100" cy="90" r="28" fill="#fff1f2" />
          <path d="M72 85 C72 44, 128 44, 128 85 C115 65, 85 65, 72 85 Z" fill="#0f172a" />
          <path d="M82 46 L100 26 L118 46" fill="none" stroke="#e2e8f0" strokeWidth="2.5" />
          <circle cx="100" cy="35" r="3.5" fill="#f43f5e" />
        </svg>
      );
    case 7:
      return (
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <radialGradient id={`aura7f_${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
              <stop offset="50%" stopColor="#f472b6" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#9d174d" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={`robe7f_${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#fce7f3" />
            </linearGradient>
            <linearGradient id={`bg7f_${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#311b92" />
              <stop offset="100%" stopColor="#1a237e" />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r="100" fill={`url(#bg7f_${uid})`} />
          <circle cx="100" cy="100" r="90" fill={`url(#aura7f_${uid})`} />
          <circle cx="100" cy="75" r="45" fill="none" stroke="#f472b6" strokeWidth="2.5" opacity="0.5" />
          <path d="M36 200 C36 130, 164 130, 164 200 Z" fill={`url(#robe7f_${uid})`} />
          <path d="M76 140 L100 174 L124 140" fill="#fdf2f8" stroke="#f472b6" strokeWidth="2" />
          <rect x="92" y="110" width="16" height="20" fill="#fff7ed" />
          <circle cx="100" cy="90" r="28" fill="#fff7ed" />
          <path d="M72 95 C72 42, 128 42, 128 95 C128 128, 110 138, 100 138 C90 138, 72 128, 72 95 Z" fill="#1e1b4b" />
          <circle cx="100" cy="90" r="28" fill="#fff7ed" />
          <path d="M72 85 C72 42, 128 42, 128 85 C115 65, 85 65, 72 85 Z" fill="#1e1b4b" />
          <path d="M80 46 L100 24 L120 46" fill="none" stroke="#facc15" strokeWidth="2.5" />
          <circle cx="100" cy="32" r="4" fill="#ec4899" />
        </svg>
      );
    case 8:
      return (
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <radialGradient id={`aura8f_${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#f472b6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#be185d" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={`robe8f_${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#fed7aa" />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r="100" fill="#4a148c" />
          <circle cx="100" cy="100" r="90" fill={`url(#aura8f_${uid})`} />
          <circle cx="100" cy="75" r="45" fill="none" stroke="#f472b6" strokeWidth="2.5" opacity="0.65" />
          <path d="M35 200 C35 130, 165 130, 165 200 Z" fill={`url(#robe8f_${uid})`} />
          <path d="M75 140 L100 175 L125 140" fill="#fff1f2" stroke="#fb7185" strokeWidth="2" />
          <rect x="92" y="110" width="16" height="20" fill="#fff7ed" />
          <circle cx="100" cy="90" r="28" fill="#fff7ed" />
          <path d="M72 95 C72 40, 128 40, 128 95 C128 130, 110 140, 100 140 C90 140, 72 130, 72 95 Z" fill="#18181b" />
          <circle cx="100" cy="90" r="28" fill="#fff7ed" />
          <path d="M72 85 C72 40, 128 40, 128 85 C115 65, 85 65, 72 85 Z" fill="#18181b" />
          <path d="M80 45 L100 18 L120 45 Z" fill="#fbbf24" />
          <circle cx="100" cy="32" r="5" fill="#e11d48" />
        </svg>
      );
    case 9:
      return (
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <radialGradient id={`aura9f_${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
              <stop offset="45%" stopColor="#fbcfe8" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#db2777" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={`robe9f_${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#fce7f3" />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r="100" fill="#3b0764" />
          <circle cx="100" cy="100" r="90" fill={`url(#aura9f_${uid})`} />
          <circle cx="100" cy="75" r="47" fill="none" stroke="#f472b6" strokeWidth="2" opacity="0.75" />
          <circle cx="100" cy="75" r="42" fill="none" stroke="#fbbf24" strokeWidth="1.5" opacity="0.6" />
          <path d="M35 200 C35 130, 165 130, 165 200 Z" fill={`url(#robe9f_${uid})`} />
          <path d="M75 140 L100 175 L125 140" fill="#fdf2f8" stroke="#ec4899" strokeWidth="2.5" />
          <rect x="92" y="110" width="16" height="20" fill="#fff7ed" />
          <circle cx="100" cy="90" r="28" fill="#fff7ed" />
          <path d="M72 95 C72 38, 128 38, 128 95 C128 130, 110 140, 100 140 C90 140, 72 130, 72 95 Z" fill="#09090b" />
          <circle cx="100" cy="90" r="28" fill="#fff7ed" />
          <path d="M72 85 C72 38, 128 38, 128 85 C115 65, 85 65, 72 85 Z" fill="#09090b" />
          <path d="M78 45 L100 15 L122 45 Z" fill="#ffd54f" />
          <circle cx="100" cy="30" r="5.5" fill="#e11d48" />
          <path d="M68 55 Q100 28 132 55" fill="none" stroke="#ffd54f" strokeWidth="2" />
        </svg>
      );
    case 10:
    default:
      return (
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <radialGradient id={`aura10f_${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#f8bbd0" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#ad1457" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={`robe10f_${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#f8bbd0" />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r="100" fill="#4a148c" />
          <circle cx="100" cy="100" r="90" fill={`url(#aura10f_${uid})`} />
          <circle cx="100" cy="75" r="45" fill="none" stroke="#f48fb1" strokeWidth="3" opacity="0.8" />
          <path d="M35 200 C35 130, 165 130, 165 200 Z" fill={`url(#robe10f_${uid})`} />
          <path d="M75 140 L100 175 L125 140" fill="#fce4ec" stroke="#f06292" strokeWidth="2" />
          <rect x="92" y="110" width="16" height="20" fill="#fff3e0" />
          <circle cx="100" cy="90" r="28" fill="#fff3e0" />
          <path d="M72 95 C72 40, 128 40, 128 95 C128 130, 110 140, 100 140 C90 140, 72 130, 72 95 Z" fill="#212121" />
          <circle cx="100" cy="90" r="28" fill="#fff3e0" />
          <path d="M72 85 C72 40, 128 40, 128 85 C115 65, 85 65, 72 85 Z" fill="#212121" />
          <path d="M80 45 L100 15 L120 45 Z" fill="#ffd54f" />
          <circle cx="100" cy="30" r="6" fill="#e53935" />
          <path d="M70 55 Q100 30 130 55" fill="none" stroke="#ffd54f" strokeWidth="2" />
        </svg>
      );
  }
}

// ============================================================
// React Component: CultivatorAvatar
// ============================================================
export interface CultivatorAvatarProps {
  tier?: number;
  gender?: CultivatorGender;
  userLevel?: number;
  className?: string;
  size?: number | string;
  uid?: string;
}

export const CultivatorAvatar: React.FC<CultivatorAvatarProps> = ({
  tier,
  gender,
  userLevel,
  className = '',
  size,
  uid
}) => {
  const effectiveGender = gender || getSavedCultivatorGender();
  const effectiveTier = tier !== undefined 
    ? tier 
    : userLevel !== undefined 
    ? getEffectiveCultivatorTier(userLevel) 
    : 1;

  const style = size ? { width: size, height: size } : undefined;
  const uniqueId = uid || `${effectiveGender}_${effectiveTier}_${Math.random().toString(36).substring(2, 7)}`;

  return (
    <div 
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden select-none ${className}`}
      style={style}
    >
      {effectiveGender === 'wanita'
        ? renderFemaleCultivatorSvg(effectiveTier, uniqueId)
        : renderMaleCultivatorSvg(effectiveTier, uniqueId)}
    </div>
  );
};
