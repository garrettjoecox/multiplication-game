import { FACTS, makeQuestion, makeQuestions, type Level, type Question } from "./game";

export type Phase = "ready" | "answering" | "right" | "wrong" | "done";

/**
 * How one fact went this round:
 * right = correct first try, missed = got it wrong and still owes a retry,
 * fixed = got it wrong, then got it right.
 */
export type Mark = "todo" | "right" | "missed" | "fixed";

export interface RoundState {
  table: number;
  level: Level;
  phase: Phase;
  /** Questions still to answer. The first one is on screen. */
  queue: Question[];
  /** Result per fact, indexed by (other factor − 1). */
  marks: Mark[];
  /** Other factors in the order they were first attempted. */
  order: number[];
  /** Goes up with every new question; used to restart animations. */
  turn: number;
  solved: number;
  streak: number;
  bestStreak: number;
  input: string;
  picked: number | null;
  timeLeftMs: number;
  timedOut: boolean;
}

export type RoundAction =
  | { type: "start" }
  | { type: "digit"; digit: string }
  | { type: "backspace" }
  | { type: "submit" }
  | { type: "pick"; value: number }
  | { type: "next" }
  | { type: "tick"; ms: number };

export interface Outcome {
  passed: boolean;
  /** Facts answered correctly on the first try. */
  firstTry: number;
  /** Facts answered correctly at all. */
  solved: number;
  timedOut: boolean;
  /** Thinking time used, for timed levels. */
  timeMs: number | null;
  /** Other factors that were answered wrong at least once. */
  missed: number[];
  bestStreak: number;
}

export function newRound(table: number, level: Level): RoundState {
  return {
    table,
    level,
    // Timed rounds wait for "Go!" so the clock never starts by surprise.
    phase: level.timeLimitMs === undefined ? "answering" : "ready",
    queue: makeQuestions(table, level),
    marks: Array<Mark>(FACTS).fill("todo"),
    order: [],
    turn: 0,
    solved: 0,
    streak: 0,
    bestStreak: 0,
    input: "",
    picked: null,
    timeLeftMs: level.timeLimitMs ?? 0,
    timedOut: false,
  };
}

function answer(s: RoundState, value: number): RoundState {
  const q = s.queue[0];
  const i = q.b - 1;
  const correct = value === q.answer;
  const marks = s.marks.slice();
  if (correct) marks[i] = marks[i] === "todo" ? "right" : "fixed";
  else marks[i] = "missed";
  const streak = correct ? s.streak + 1 : 0;
  return {
    ...s,
    phase: correct ? "right" : "wrong",
    picked: value,
    marks,
    order: s.order.includes(q.b) ? s.order : [...s.order, q.b],
    solved: s.solved + (correct ? 1 : 0),
    streak,
    bestStreak: Math.max(s.bestStreak, streak),
  };
}

/** Returns the same object when the action doesn't apply right now. */
export function reduceRound(s: RoundState, a: RoundAction): RoundState {
  switch (a.type) {
    case "start":
      return s.phase === "ready" ? { ...s, phase: "answering" } : s;

    case "digit":
      if (s.phase !== "answering" || s.level.mode !== "type") return s;
      if (s.input.length >= 3) return s;
      return { ...s, input: s.input === "0" ? a.digit : s.input + a.digit };

    case "backspace":
      if (s.phase !== "answering" || s.input === "") return s;
      return { ...s, input: s.input.slice(0, -1) };

    case "submit":
      if (s.phase !== "answering" || s.level.mode !== "type") return s;
      return s.input === "" ? s : answer(s, Number(s.input));

    case "pick":
      if (s.phase !== "answering" || s.level.mode !== "choice") return s;
      return answer(s, a.value);

    case "next": {
      if (s.phase !== "right" && s.phase !== "wrong") return s;
      const [current, ...rest] = s.queue;
      // A missed fact goes to the back of the line for another try.
      const queue =
        s.phase === "wrong"
          ? [...rest, makeQuestion(s.table, current.b, s.level)]
          : rest;
      if (queue.length === 0) return { ...s, queue, phase: "done" };
      return {
        ...s,
        queue,
        phase: "answering",
        turn: s.turn + 1,
        input: "",
        picked: null,
      };
    }

    case "tick": {
      if (s.phase !== "answering" || s.level.timeLimitMs === undefined) return s;
      const timeLeftMs = Math.max(0, s.timeLeftMs - a.ms);
      return timeLeftMs > 0
        ? { ...s, timeLeftMs }
        : { ...s, timeLeftMs, timedOut: true, phase: "done" };
    }
  }
}

export function outcomeOf(s: RoundState): Outcome {
  const firstTry = s.marks.filter((m) => m === "right").length;
  const limit = s.level.timeLimitMs;
  return {
    // Timed rounds only end early when every fact has been answered correctly.
    passed: limit === undefined ? firstTry >= s.level.goal : !s.timedOut,
    firstTry,
    solved: s.solved,
    timedOut: s.timedOut,
    timeMs: limit === undefined ? null : limit - s.timeLeftMs,
    missed: s.marks.flatMap((m, i) =>
      m === "missed" || m === "fixed" ? [i + 1] : [],
    ),
    bestStreak: s.bestStreak,
  };
}
