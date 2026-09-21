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
    description: 'Beep monitor ritme sinus normal & nada alert klinis',
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

export function getAudioContext(): AudioContext | null {
  try {
    if (typeof window === 'undefined') return null;

    if (!audioCtx || audioCtx.state === 'closed') {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    return audioCtx;
  } catch (e) {
    console.warn('[AudioEngine] Could not create AudioContext:', e);
    return null;
  }
}

// Auto-unlock AudioContext on first user interaction anywhere on the page
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    try {
      const ctx = getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
    } catch (e) {}
  };

  window.addEventListener('pointerdown', unlockAudio, { passive: true });
  window.addEventListener('keydown', unlockAudio, { passive: true });
  window.addEventListener('touchstart', unlockAudio, { passive: true });
}

/**
 * Executes a sound generator function safely.
 * If the AudioContext is currently suspended, it awaits ctx.resume()
 * BEFORE calculating ctx.currentTime and scheduling oscillators.
 * This completely eliminates the zero-timestamp clipping bug in modern browsers.
 */
function runWithAudioContext(
  packOverride: SoundPackId | undefined,
  playFn: (ctx: AudioContext, pack: SoundPackId) => void
): void {
  const pack = packOverride || getSavedSoundPack();
  if (pack === 'mute') return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const execute = () => {
    try {
      playFn(ctx, pack);
    } catch (e) {
      console.warn('[AudioEngine] Playback error:', e);
    }
  };

  if (ctx.state === 'suspended') {
    ctx.resume().then(() => {
      execute();
    }).catch((err) => {
      console.warn('[AudioEngine] Resume failed:', err);
    });
  } else if (ctx.state === 'running') {
    execute();
  } else {
    // Recreate if closed or in an invalid state
    audioCtx = null;
    const newCtx = getAudioContext();
    if (newCtx) {
      if (newCtx.state === 'suspended') {
        newCtx.resume().then(() => {
          try {
            playFn(newCtx, pack);
          } catch (e) {}
        }).catch(() => {});
      } else {
        try {
          playFn(newCtx, pack);
        } catch (e) {}
      }
    }
  }
}

/**
 * Memutar efek suara ketika jawaban benar
 */
export function playCorrectSound(packOverride?: SoundPackId): void {
  runWithAudioContext(packOverride, (ctx, pack) => {
    const now = ctx.currentTime;

    if (pack === 'medical') {
      // EKG Monitor Heartbeat Double Beep (crisp sinus rhythm pulse)
      // Pulse 1: 880 Hz (A5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.09);

      // Pulse 2: 1320 Hz (E6)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1320, now + 0.1);
      gain2.gain.setValueAtTime(0.38, now + 0.1);
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
        gain.gain.setValueAtTime(0.22, startTime);
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
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.6);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1056, now);
      gain2.gain.setValueAtTime(0.18, now);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now);
      osc2.stop(now + 0.45);
    }
  });
}

/**
 * Memutar efek suara ketika jawaban salah
 */
export function playWrongSound(packOverride?: SoundPackId): void {
  runWithAudioContext(packOverride, (ctx, pack) => {
    const now = ctx.currentTime;

    if (pack === 'medical') {
      // Clinical alert buzzer (two quick distinct pulses, audible on laptop & mobile)
      // Pulse 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(280, now);
      osc1.frequency.exponentialRampToValueAtTime(180, now + 0.12);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.12);

      // Pulse 2
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(240, now + 0.14);
      osc2.frequency.exponentialRampToValueAtTime(150, now + 0.3);
      gain2.gain.setValueAtTime(0.3, now + 0.14);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.14);
      osc2.stop(now + 0.3);
    } else if (pack === 'arcade') {
      // Retro downward error buzz
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.linearRampToValueAtTime(150, now + 0.24);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.24);
    } else if (pack === 'zen') {
      // Gentle wooden temple block tap
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(330, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.2);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  });
}

/**
 * Efek suara dramatis saat Game Over (terutama di Sudden Death)
 */
export function playGameOverSound(packOverride?: SoundPackId): void {
  runWithAudioContext(packOverride, (ctx, pack) => {
    const now = ctx.currentTime;

    if (pack === 'medical') {
      // Dramatic Flatline tone
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.setValueAtTime(0.3, now + 0.7);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.2);
    } else if (pack === 'arcade') {
      // Descending game over melody
      const tones = [440, 392, 349.23, 293.66];
      tones.forEach((freq, idx) => {
        const startTime = now + idx * 0.14;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.22, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.13);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.13);
      });
    } else {
      // Low gong with overtone
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(146.83, now);
      gain1.gain.setValueAtTime(0.35, now);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 1.2);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(293.66, now);
      gain2.gain.setValueAtTime(0.18, now);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now);
      osc2.stop(now + 0.9);
    }
  });
}
