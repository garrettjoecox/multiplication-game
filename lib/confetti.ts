import confetti from "canvas-confetti";

const COLORS = ["#fbbf24", "#f472b6", "#60a5fa", "#34d399", "#a78bfa", "#fb923c"];
const GOLD = ["#fbbf24", "#fde68a", "#f59e0b"];

// Players who ask their device for less motion get none of this.
const base = { disableForReducedMotion: true, zIndex: 100 };

/** A small pop, for answer streaks. */
export function sparkle(): void {
  void confetti({
    ...base,
    colors: COLORS,
    particleCount: 28,
    spread: 75,
    startVelocity: 26,
    scalar: 0.8,
    ticks: 90,
    origin: { x: 0.5, y: 0.4 },
  });
}

/** Cannons from both sides plus a burst of stars, for winning a round. */
export function celebrate(): void {
  void confetti({
    ...base,
    colors: COLORS,
    particleCount: 80,
    angle: 60,
    spread: 65,
    origin: { x: 0, y: 0.75 },
  });
  void confetti({
    ...base,
    colors: COLORS,
    particleCount: 80,
    angle: 120,
    spread: 65,
    origin: { x: 1, y: 0.75 },
  });
  void confetti({
    ...base,
    colors: GOLD,
    shapes: ["star"],
    particleCount: 30,
    spread: 360,
    startVelocity: 24,
    scalar: 1.5,
    origin: { x: 0.5, y: 0.35 },
  });
}

/** Bursts all over the sky for a few seconds. Returns a function that stops it. */
export function fireworks(durationMs = 4000): () => void {
  const burst = () => {
    void confetti({
      ...base,
      colors: Math.random() < 0.4 ? GOLD : COLORS,
      shapes: Math.random() < 0.4 ? ["star"] : ["circle", "square"],
      particleCount: 45,
      spread: 360,
      startVelocity: 28,
      ticks: 110,
      scalar: 1.1,
      origin: { x: 0.15 + Math.random() * 0.7, y: 0.15 + Math.random() * 0.4 },
    });
  };
  burst();
  const interval = window.setInterval(burst, 320);
  const timeout = window.setTimeout(() => window.clearInterval(interval), durationMs);
  return () => {
    window.clearInterval(interval);
    window.clearTimeout(timeout);
  };
}
