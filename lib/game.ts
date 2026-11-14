/** The times tables in the app, and how many facts each one has (×1 … ×12). */
export const TABLES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
export const FACTS = 12;
export const STARS_PER_TABLE = 3;
export const TOTAL_STARS = TABLES.length * STARS_PER_TABLE;

export type LevelId = 1 | 2 | 3;

export interface Level {
  id: LevelId;
  name: string;
  emoji: string;
  /** "choice" = tap one of four answers, "type" = enter it on the number pad. */
  mode: "choice" | "type";
  /** Right-first-try answers needed to earn the star. */
  goal: number;
  /** Thinking time allowed for the whole round. Untimed when missing. */
  timeLimitMs?: number;
  tagline: string;
  goalText: string;
  /** Colour hue used for this level's buttons. */
  hue: number;
}

/**
 * Each table has three levels, and passing a level earns one star.
 * Three stars means every fact was recalled correctly, from memory, at speed.
 */
export const LEVELS: Level[] = [
  {
    id: 1,
    name: "Learn",
    emoji: "🌱",
    mode: "choice",
    goal: 10,
    tagline: "Tap the right answer",
    goalText: "Get 10 out of 12 right",
    hue: 150,
  },
  {
    id: 2,
    name: "Practice",
    emoji: "💪",
    mode: "type",
    goal: 11,
    tagline: "Type the answer",
    goalText: "Get 11 out of 12 right",
    hue: 230,
  },
  {
    id: 3,
    name: "Master",
    emoji: "⚡",
    mode: "type",
    goal: 12,
    timeLimitMs: 60_000,
    tagline: "Beat the clock",
    goalText: "Get all 12 right in 60 seconds",
    hue: 320,
  },
];

export interface Question {
  /** The other factor, 1–12. */
  b: number;
  /** Show as "b × table" instead of "table × b". */
  flipped: boolean;
  answer: number;
  /** Four options for "choice" levels, empty otherwise. */
  choices: number[];
}

export function shuffle<T>(items: readonly T[]): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** The right answer plus three believable wrong ones, in random order. */
export function makeChoices(table: number, b: number): number[] {
  const answer = table * b;
  const pool = new Set([
    table * (b - 1),
    table * (b + 1),
    table * (b + 2),
    (table + 1) * b,
    (table - 1) * b,
    answer - 1,
    answer + 1,
    answer + 2,
    answer - 10,
    answer + 10,
  ]);
  pool.delete(answer);
  const wrong = shuffle([...pool].filter((v) => v > 0)).slice(0, 3);
  return shuffle([answer, ...wrong]);
}

export function makeQuestion(table: number, b: number, level: Level): Question {
  return {
    b,
    // Later levels mix the order so 7 × 4 and 4 × 7 both become familiar.
    flipped: level.id > 1 && Math.random() < 0.5,
    answer: table * b,
    choices: level.mode === "choice" ? makeChoices(table, b) : [],
  };
}

export function makeQuestions(table: number, level: Level): Question[] {
  const factors = Array.from({ length: FACTS }, (_, i) => i + 1);
  return shuffle(factors).map((b) => makeQuestion(table, b, level));
}

/** Colour hue for a table's tile, spread evenly around the colour wheel. */
export function tableHue(table: number): number {
  return (15 + (table - 1) * 30) % 360;
}
