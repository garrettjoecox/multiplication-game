import { peekData } from "./store";

/**
 * Sound effects are synthesised with the Web Audio API, so there are no audio
 * files to download and the app stays small and works offline.
 */

interface Note {
  freq: number;
  /** Seconds after the sound starts. */
  at?: number;
  dur?: number;
  type?: OscillatorType;
  gain?: number;
  /** Glide to this frequency over the note. */
  slideTo?: number;
}

let context: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined" || !peekData().sound) return null;
  try {
    if (!context) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return null;
      context = new Ctor();
    }
    // Browsers keep audio paused until the first tap, and after backgrounding.
    if (context.state !== "running") void context.resume();
    return context;
  } catch {
    return null;
  }
}

function play(notes: Note[]): void {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + 0.01;
  for (const note of notes) {
    const start = t0 + (note.at ?? 0);
    const dur = note.dur ?? 0.15;
    const osc = ac.createOscillator();
    const amp = ac.createGain();
    osc.type = note.type ?? "sine";
    osc.frequency.setValueAtTime(note.freq, start);
    if (note.slideTo) {
      osc.frequency.exponentialRampToValueAtTime(note.slideTo, start + dur);
    }
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(note.gain ?? 0.16, start + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(amp).connect(ac.destination);
    osc.start(start);
    osc.stop(start + dur + 0.03);
  }
}

// C major pentatonic: every step up sounds happy, never out of tune.
const SCALE = [
  523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51, 1567.98,
  1760.0, 2093.0, 2349.32,
];

export const sfx = {
  tap() {
    play([{ freq: 660, dur: 0.05, type: "triangle", gain: 0.07 }]);
  },

  go() {
    play([
      { freq: 523.25, dur: 0.1, type: "triangle" },
      { freq: 783.99, at: 0.09, dur: 0.18, type: "triangle" },
    ]);
  },

  /** The chime climbs a note for every answer in a row. */
  correct(streak: number) {
    const freq = SCALE[Math.min(Math.max(streak, 1), SCALE.length) - 1];
    play([
      { freq, dur: 0.12, type: "triangle" },
      { freq: freq * 1.5, at: 0.07, dur: 0.22, type: "triangle", gain: 0.12 },
    ]);
  },

  wrong() {
    play([{ freq: 220, slideTo: 140, dur: 0.3, gain: 0.2 }]);
    if (typeof navigator !== "undefined") navigator.vibrate?.(60);
  },

  tick() {
    play([{ freq: 990, dur: 0.04, type: "square", gain: 0.03 }]);
  },

  win() {
    play([
      { freq: 523.25, dur: 0.14, type: "triangle" },
      { freq: 659.25, at: 0.12, dur: 0.14, type: "triangle" },
      { freq: 783.99, at: 0.24, dur: 0.14, type: "triangle" },
      { freq: 1046.5, at: 0.36, dur: 0.5, type: "triangle", gain: 0.2 },
      // Sparkle on top as the star lands.
      { freq: 1567.98, at: 0.62, dur: 0.2, gain: 0.08 },
      { freq: 2093.0, at: 0.7, dur: 0.2, gain: 0.08 },
      { freq: 2637.02, at: 0.78, dur: 0.35, gain: 0.08 },
    ]);
  },

  lose() {
    play([
      { freq: 392.0, dur: 0.18 },
      { freq: 329.63, at: 0.16, dur: 0.18 },
      { freq: 261.63, at: 0.32, dur: 0.4 },
    ]);
  },

  /** The big one, for the 36th star. */
  master() {
    const tune = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.51];
    play([
      ...tune.map((freq, i) => ({
        freq,
        at: i * 0.13,
        dur: i === tune.length - 1 ? 0.9 : 0.16,
        type: "triangle" as const,
        gain: 0.2,
      })),
      { freq: 261.63, at: 0.78, dur: 0.9, gain: 0.14 },
      { freq: 2093.0, at: 1.0, dur: 0.3, gain: 0.07 },
      { freq: 2637.02, at: 1.12, dur: 0.3, gain: 0.07 },
      { freq: 3135.96, at: 1.24, dur: 0.5, gain: 0.07 },
    ]);
  },
};
