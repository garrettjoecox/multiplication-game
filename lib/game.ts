export const STARS_PER_TABLE = 3;

const upTo = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

// ── Subjects ───────────────────────────────────────────────────────────────

export type Op = "add" | "subtract" | "multiply";

export interface Subject {
  /** Also the URL segment: /play/add/7/ */
  id: Op;
  symbol: string;
  /** Label on the home screen tabs. */
  label: string;
  /** "Addition Master", for headings. */
  master: string;
  /** "an Addition Master", for use inside a sentence. */
  aMaster: string;
  /** "adding", as in "you don't need this app for adding any more". */
  doing: string;
  /** "addition table", as in "every addition table up to 10". */
  tableKind: string;
  /** The tables to master, starting from 1. */
  tables: number[];
  /** Facts in each table: 7 + 1 … 7 + 10, or 7 × 1 … 7 × 12. */
  facts: number;
}

/**
 * In the order children usually learn them.
 *
 * Adding and subtracting stop at the 10s (10 + 10 is the hardest sum), which
 * is where schools usually stop. Times tables go on to 12 × 12.
 */
export const SUBJECTS: Subject[] = [
  {
    id: "add",
    symbol: "+",
    label: "Add",
    master: "Addition Master",
    aMaster: "an Addition Master",
    doing: "adding",
    tableKind: "addition table",
    tables: upTo(10),
    facts: 10,
  },
  {
    id: "subtract",
    symbol: "−",
    label: "Subtract",
    master: "Subtraction Master",
    aMaster: "a Subtraction Master",
    doing: "subtracting",
    tableKind: "subtraction table",
    tables: upTo(10),
    facts: 10,
  },
  {
    id: "multiply",
    symbol: "×",
    label: "Multiply",
    master: "Multiplication Master",
    aMaster: "a Multiplication Master",
    doing: "multiplying",
    tableKind: "times table",
    tables: upTo(12),
    facts: 12,
  },
];

/** Stars to collect in one subject: three for each of its tables. */
export function starsIn(op: Op): number {
  return subject(op).tables.length * STARS_PER_TABLE;
}

export const ALL_STARS = SUBJECTS.reduce(
  (sum, s) => sum + s.tables.length * STARS_PER_TABLE,
  0,
);

export function isOp(value: unknown): value is Op {
  return SUBJECTS.some((s) => s.id === value);
}

export function subject(op: Op): Subject {
  return SUBJECTS.find((s) => s.id === op) ?? SUBJECTS[0];
}

/** "+7 table", "−7 table", "7 times table". */
export function tableName(op: Op, table: number): string {
  return op === "multiply"
    ? `${table} times table`
    : `${subject(op).symbol}${table} table`;
}

// ── Facts ──────────────────────────────────────────────────────────────────

export interface Fact {
  left: number;
  right: number;
  answer: number;
}

/**
 * Fact number `b` of a table, counting from 1:
 *
 *   add 7       7 + b          7 + 1 = 8   …  7 + 10 = 17
 *   subtract 7  (7 + b) − 7    8 − 7 = 1   …  17 − 7 = 10
 *   multiply 7  7 × b          7 × 1 = 7   …  7 × 12 = 84
 *
 * Subtraction is addition run backwards, so answers are never negative.
 */
export function fact(op: Op, table: number, b: number): Fact {
  switch (op) {
    case "add":
      return { left: table, right: b, answer: table + b };
    case "subtract":
      return { left: table + b, right: table, answer: b };
    case "multiply":
      return { left: table, right: b, answer: table * b };
  }
}

// ── Levels ─────────────────────────────────────────────────────────────────

export type LevelId = 1 | 2 | 3;

export interface Level {
  id: LevelId;
  name: string;
  emoji: string;
  /** "choice" = tap one of four answers, "type" = enter it on the number pad. */
  mode: "choice" | "type";
  /** Wrong first tries allowed while still earning the star. */
  misses: number;
  /** Timed levels allow SECONDS_PER_FACT of thinking time for each fact. */
  timed: boolean;
  tagline: string;
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
    misses: 2,
    timed: false,
    tagline: "Tap the right answer",
    hue: 150,
  },
  {
    id: 2,
    name: "Practice",
    emoji: "💪",
    mode: "type",
    misses: 1,
    timed: false,
    tagline: "Type the answer",
    hue: 230,
  },
  {
    id: 3,
    name: "Master",
    emoji: "⚡",
    mode: "type",
    misses: 0,
    timed: true,
    tagline: "Beat the clock",
    hue: 320,
  },
];

export const SECONDS_PER_FACT = 5;

export interface Rules {
  /** Facts in the round. */
  facts: number;
  /** Right-first-try answers needed to earn the star. */
  goal: number;
  /** Thinking time allowed for the whole round. Untimed when missing. */
  timeLimitMs?: number;
  goalText: string;
}

/**
 * What it takes to earn a level's star in a subject. The same level is the
 * same challenge everywhere: with 10 facts instead of 12, the pass mark and
 * the clock shrink to match.
 */
export function rulesFor(op: Op, level: Level): Rules {
  const { facts } = subject(op);
  const goal = facts - level.misses;
  if (!level.timed) {
    return { facts, goal, goalText: `Get ${goal} out of ${facts} right` };
  }
  const seconds = facts * SECONDS_PER_FACT;
  return {
    facts,
    goal,
    timeLimitMs: seconds * 1000,
    goalText: `Get all ${facts} right in ${seconds} seconds`,
  };
}

// ── Questions ──────────────────────────────────────────────────────────────

export interface Question extends Fact {
  /** Which fact of the table this is, counting from 1. */
  b: number;
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
export function makeChoices(op: Op, table: number, b: number): number[] {
  const { answer } = fact(op, table, b);
  // Slips children really make: one or two out, ten out, the next fact along.
  const near = [answer - 1, answer + 1, answer - 2, answer + 2, answer - 10, answer + 10];
  const pool = new Set(
    op === "multiply"
      ? [...near, table * (b - 1), table * (b + 1), (table + 1) * b, (table - 1) * b]
      : op === "subtract"
        ? [...near, answer + 3, table] // "8 − 7 = 7": answering with a number from the sum
        : [...near, answer + 3],
  );
  pool.delete(answer);
  // 0 is a fair wrong answer when taking away, and a giveaway otherwise.
  const lowest = op === "subtract" ? 0 : 1;
  const wrong = shuffle([...pool].filter((v) => v >= lowest)).slice(0, 3);
  return shuffle([answer, ...wrong]);
}

export function makeQuestion(
  op: Op,
  table: number,
  b: number,
  level: Level,
): Question {
  const { left, right, answer } = fact(op, table, b);
  // Later levels mix the order so 7 × 4 and 4 × 7 both become familiar.
  // Never for subtraction: 7 − 19 is a different sum.
  const flip = op !== "subtract" && level.id > 1 && Math.random() < 0.5;
  return {
    b,
    left: flip ? right : left,
    right: flip ? left : right,
    answer,
    choices: level.mode === "choice" ? makeChoices(op, table, b) : [],
  };
}

export function makeQuestions(op: Op, table: number, level: Level): Question[] {
  return shuffle(upTo(subject(op).facts)).map((b) =>
    makeQuestion(op, table, b, level),
  );
}

/** Colour hue for a table's tile, spread evenly around the colour wheel. */
export function tableHue(table: number): number {
  return (15 + (table - 1) * 30) % 360;
}
