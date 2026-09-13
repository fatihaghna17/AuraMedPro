// ============================================================
// AuraMedPro Procedural Sound Engine (Web Audio API)
// 100% Lightweight, 0 Network Latency, Offline Ready
// ============================================================

export type SoundPackId = 'medical' | 'arcade' | 'zen' | 'mute';

export interface SoundPackInfo {
  id: SoundPackId;
  name: string;
  description: string;
  icon: string;
}

export const SOUND_PACKS: SoundPackInfo[] = [
  {
    id: 'medical',
    name: 'Klinik Medis (EKG Monitor)',
    description: 'Beep monitor ritme sinus normal & nada flatline klinis',
    icon: '🩺'
  },
  {
    id: 'arcade',
    name: 'Arcade 8-Bit Retro',
    description: 'Melodi koin arcade ceria & suara retro klasik',
    icon: '👾'
  },
  {
    id: 'zen',
    name: 'Zen Crystal Chime',
    description: 'Denting lonceng kristal yang menenangkan & fokus',
    icon: '🔔'
  },
  {
    id: 'mute',
    name: 'Hening (Mute)',
    description: 'Tanpa suara untuk belajar di rumah sakit / ruang visite',
    icon: '🔇'
  }
];

const STORAGE_KEY = 'auramedpro_soundpack';

export function getSavedSoundPack(): SoundPackId {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && ['medical', 'arcade', 'zen', 'mute'].includes(saved)) {
      return saved as SoundPackId;
    }
  } catch (e) {
    // Ignore storage errors
  }
  return 'medical';
}

export function setSavedSoundPack(pack: SoundPackId): void {
  try {
    localStorage.setItem(STORAGE_KEY, pack);
  } catch (e) {
    // Ignore storage errors
  }
}

// Global shared AudioContext singleton
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch (e) {
    return null;
  }
}

/**
 * Memutar efek suara ketika jawaban benar
 */
export function playCorrectSound(packOverride?: SoundPackId): void {
  const pack = packOverride || getSavedSoundPack();
  if (pack === 'mute') return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  if (pack === 'medical') {
    // EKG Monitor Heartbeat Double Beep (crisp sinus rhythm pulse)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.09);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1320, now + 0.1);
    gain2.gain.setValueAtTime(0.28, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.28);
  } else if (pack === 'arcade') {
    // 8-bit Coin Arpeggio (C5 -> E5 -> G5 -> C6)
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const startTime = now + idx * 0.06;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.12, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.08);
    });
  } else if (pack === 'zen') {
    // Zen crystal chime (528 Hz Solfeggio frequency + overtone)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(528, now);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.6);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1056, now);
    gain2.gain.setValueAtTime(0.12, now);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.45);
  }
}

/**
 * Memutar efek suara ketika jawaban salah
 */
export function playWrongSound(packOverride?: SoundPackId): void {
  const pack = packOverride || getSavedSoundPack();
  if (pack === 'mute') return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  if (pack === 'medical') {
    // Low clinical buzzer
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.25);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  } else if (pack === 'arcade') {
    // Retro downward error buzz
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.linearRampToValueAtTime(140, now + 0.22);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  } else if (pack === 'zen') {
    // Gentle muted wooden tap
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }
}

/**
 * Efek suara dramatis saat Game Over (terutama di Sudden Death)
 */
export function playGameOverSound(packOverride?: SoundPackId): void {
  const pack = packOverride || getSavedSoundPack();
  if (pack === 'mute') return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  if (pack === 'medical') {
    // Dramatic Flatline tone
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.setValueAtTime(0.25, now + 0.6);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 1.1);
  } else if (pack === 'arcade') {
    // Descending game over melody
    const tones = [440, 392, 349.23, 293.66];
    tones.forEach((freq, idx) => {
      const startTime = now + idx * 0.14;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.14, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.13);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.13);
    });
  } else {
    // Low gong
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(146.83, now);
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.0);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 1.0);
  }
}
