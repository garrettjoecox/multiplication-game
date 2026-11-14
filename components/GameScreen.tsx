"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { celebrate, fireworks, sparkle } from "@/lib/confetti";
import {
  FACTS,
  LEVELS,
  STARS_PER_TABLE,
  type Level,
  type LevelId,
  type Question,
} from "@/lib/game";
import {
  newRound,
  outcomeOf,
  reduceRound,
  type Outcome,
  type RoundAction,
  type RoundState,
} from "@/lib/round";
import { sfx } from "@/lib/sound";
import {
  activeProfile,
  recordRound,
  starsFor,
  useAppData,
  type RoundReward,
} from "@/lib/store";
import { Screen, Splash, Star, hue } from "./ui";

/** How long the answer stays on screen before the next question. */
const RIGHT_MS = 650;
const WRONG_MS = 2600;

const PRAISE = ["Yes!", "Nice!", "Awesome!", "Great!", "Super!", "Boom!", "Wow!"];
const CHOICE_HUES = [230, 335, 85, 165];

export function GameScreen({
  table,
  levelId,
}: {
  table: number;
  levelId: LevelId;
}) {
  const data = useAppData();
  const router = useRouter();
  const profile = data ? activeProfile(data) : null;
  const level = LEVELS[levelId - 1];
  // A level opens once the star before it has been earned.
  const allowed = profile !== null && starsFor(profile, table) >= levelId - 1;
  const sendTo =
    data === null || allowed ? null : profile ? `/table/${table}/` : "/";

  useEffect(() => {
    if (sendTo) router.replace(sendTo);
  }, [sendTo, router]);

  if (!profile || !allowed) return <Splash />;

  // Keyed so that moving straight from one level to the next starts fresh.
  return (
    <Game
      key={`${table}:${level.id}`}
      profileId={profile.id}
      table={table}
      level={level}
    />
  );
}

interface GameProps {
  profileId: string;
  table: number;
  level: Level;
}

function Game(props: GameProps) {
  const [attempt, setAttempt] = useState(0);
  return (
    <Round key={attempt} {...props} onReplay={() => setAttempt(attempt + 1)} />
  );
}

interface Finished {
  outcome: Outcome;
  reward: RoundReward;
}

function Round({
  profileId,
  table,
  level,
  onReplay,
}: GameProps & { onReplay: () => void }) {
  const [state, setState] = useState(() => newRound(table, level));
  const [finished, setFinished] = useState<Finished | null>(null);
  // Always the newest state, so two quick key presses can't act on a stale one.
  const latest = useRef(state);

  function dispatch(action: RoundAction) {
    const prev = latest.current;
    const next = reduceRound(prev, action);
    if (next === prev) return;
    latest.current = next;
    setState(next);

    if (action.type === "digit" || action.type === "backspace") sfx.tap();
    if (action.type === "start") sfx.go();

    if (prev.phase === "answering" && next.phase === "right") {
      sfx.correct(next.streak);
      if (next.streak % 5 === 0) sparkle();
    }
    if (prev.phase === "answering" && next.phase === "wrong") sfx.wrong();

    if (
      action.type === "tick" &&
      next.phase === "answering" &&
      next.timeLeftMs <= 5000 &&
      Math.ceil(next.timeLeftMs / 1000) !== Math.ceil(prev.timeLeftMs / 1000)
    ) {
      sfx.tick();
    }

    if (next.phase === "done") {
      const outcome = outcomeOf(next);
      const reward = recordRound(profileId, table, level.id, outcome);
      setFinished({ outcome, reward });
      if (reward.allMastered) {
        sfx.master();
        fireworks(5000);
      } else if (outcome.passed) {
        sfx.win();
        celebrate();
      } else {
        sfx.lose();
      }
    }
  }

  // The clock only runs while a question is waiting for an answer.
  const ticking = level.timeLimitMs !== undefined && state.phase === "answering";
  const onTick = useEffectEvent((ms: number) => dispatch({ type: "tick", ms }));
  useEffect(() => {
    if (!ticking) return;
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      // Capped, so a stretch in a background tab doesn't drain the clock.
      onTick(Math.min(now - last, 250));
      last = now;
    }, 100);
    return () => window.clearInterval(id);
  }, [ticking]);

  // Show the result of each answer for a moment, then move on.
  const feedback =
    state.phase === "right" || state.phase === "wrong" ? state.phase : null;
  const onNext = useEffectEvent(() => dispatch({ type: "next" }));
  useEffect(() => {
    if (!feedback) return;
    const id = window.setTimeout(
      () => onNext(),
      feedback === "right" ? RIGHT_MS : WRONG_MS,
    );
    return () => window.clearTimeout(id);
  }, [feedback]);

  // A real keyboard works too: digits, Backspace, and Enter.
  const onKey = useEffectEvent((event: KeyboardEvent) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (/^[0-9]$/.test(event.key)) {
      dispatch({ type: "digit", digit: event.key });
    } else if (event.key === "Backspace") {
      dispatch({ type: "backspace" });
    } else if (event.key === "Enter") {
      // Leave Enter alone on links so they can still be followed.
      if (event.target instanceof Element && event.target.closest("a")) return;
      dispatch({ type: latest.current.phase === "ready" ? "start" : "submit" });
    } else {
      return;
    }
    event.preventDefault();
  });
  const playing = finished === null;
  useEffect(() => {
    if (!playing) return;
    const listener = (event: KeyboardEvent) => onKey(event);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [playing]);

  if (finished) {
    return (
      <Results
        table={table}
        level={level}
        finished={finished}
        onReplay={onReplay}
      />
    );
  }

  const question = state.queue[0];
  const marks = state.order.map((b) => state.marks[b - 1]);
  const answering = state.phase === "answering";

  return (
    <Screen className="h-dvh max-w-xl gap-3 short:max-w-4xl short:gap-2">
      <header className="flex items-center gap-3">
        <Link
          href={`/table/${table}/`}
          className="btn btn-ghost btn-icon"
          aria-label="Stop playing"
        >
          <span aria-hidden="true">✕</span>
        </Link>
        <ol
          className="flex min-w-0 flex-1 items-center justify-center gap-1"
          aria-label={`${state.solved} of ${FACTS} answered`}
        >
          {Array.from({ length: FACTS }, (_, i) => (
            <li key={i} className={`dot dot-${marks[i] ?? "todo"}`} />
          ))}
        </ol>
        <span className="w-14 text-right text-lg font-bold tabular-nums">
          {state.streak >= 2 && (
            <span key={state.streak} className="inline-block animate-pop">
              🔥{state.streak}
            </span>
          )}
        </span>
      </header>

      {level.timeLimitMs !== undefined && (
        <TimerBar msLeft={state.timeLeftMs} totalMs={level.timeLimitMs} />
      )}

      {state.phase === "ready" ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center short:gap-3">
          <p className="animate-bob text-7xl leading-none short:text-5xl" aria-hidden="true">
            {level.emoji}
          </p>
          <h1 className="text-4xl font-bold">Ready?</h1>
          <p className="max-w-xs text-xl text-white/85">
            Answer all {FACTS} before the clock runs out. You’ve got{" "}
            {Math.round((level.timeLimitMs ?? 0) / 1000)} seconds!
          </p>
          <button
            type="button"
            className="btn btn-gold btn-lg animate-glow px-14"
            onClick={() => dispatch({ type: "start" })}
          >
            Go!
          </button>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col justify-center gap-4 sm:gap-6 short:flex-row short:items-center">
          <div className="grid flex-1 place-items-center roomy:flex-none">
            <QuestionCard key={state.turn} state={state} question={question} />
          </div>
          <div className="short:flex-1">
            {level.mode === "choice" ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {question.choices.map((value, i) => {
                  let look = "";
                  if (!answering) {
                    if (value === question.answer) look = "is-answer";
                    else if (value === state.picked) look = "is-wrong animate-shake";
                    else look = "is-dim";
                  }
                  return (
                    <button
                      key={`${state.turn}:${value}`}
                      type="button"
                      className={`btn btn-hue choice ${look}`}
                      style={hue(CHOICE_HUES[i])}
                      onClick={() => dispatch({ type: "pick", value })}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div
                className={`mx-auto grid max-w-sm grid-cols-3 gap-2.5 transition-opacity sm:max-w-md sm:gap-3 ${answering ? "" : "opacity-50"}`}
              >
                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    className="btn key"
                    onClick={() => dispatch({ type: "digit", digit })}
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  className="btn btn-ghost key"
                  aria-label="Delete"
                  onClick={() => dispatch({ type: "backspace" })}
                >
                  <span aria-hidden="true">⌫</span>
                </button>
                <button
                  type="button"
                  className="btn key"
                  onClick={() => dispatch({ type: "digit", digit: "0" })}
                >
                  0
                </button>
                <button
                  type="button"
                  className="btn btn-green key"
                  aria-label="Check my answer"
                  disabled={answering && state.input === ""}
                  onClick={() => dispatch({ type: "submit" })}
                >
                  <span aria-hidden="true">✓</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </Screen>
  );
}

function TimerBar({ msLeft, totalMs }: { msLeft: number; totalMs: number }) {
  const seconds = Math.ceil(msLeft / 1000);
  const low = msLeft <= 10_000;
  return (
    <div
      className="flex items-center gap-2"
      role="timer"
      aria-label={`${seconds} seconds left`}
    >
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/15">
        <div
          className={`h-full origin-left rounded-full transition-transform duration-100 ease-linear ${low ? "bg-rose-400" : "bg-gold"}`}
          style={{ transform: `scaleX(${msLeft / totalMs})` }}
        />
      </div>
      <span
        className={`w-9 text-right text-lg font-bold tabular-nums ${low ? "text-rose-300" : ""}`}
        aria-hidden="true"
      >
        {seconds}
      </span>
    </div>
  );
}

function QuestionCard({
  state,
  question,
}: {
  state: RoundState;
  question: Question;
}) {
  const { phase } = state;
  const typed = state.level.mode === "type";
  const [left, right] = question.flipped
    ? [question.b, state.table]
    : [state.table, question.b];

  let slot: ReactNode;
  if (phase === "right" || phase === "wrong") {
    slot = (
      <span className="inline-block animate-pop text-emerald-500">
        {question.answer}
      </span>
    );
  } else if (typed) {
    slot = (
      <>
        {state.input}
        <span
          className="ml-[0.04em] inline-block h-[0.85em] w-[0.07em] translate-y-[0.08em] animate-blink rounded-full bg-indigo-400"
          aria-hidden="true"
        />
      </>
    );
  } else {
    slot = <span className="text-indigo-300">?</span>;
  }

  let note: ReactNode = null;
  if (phase === "right") {
    note =
      state.streak >= 3
        ? `${state.streak} in a row! 🔥`
        : PRAISE[state.solved % PRAISE.length];
  } else if (phase === "wrong") {
    note = (
      <>
        Not {state.picked}. It’s <strong>{question.answer}</strong>
      </>
    );
  }

  return (
    <div
      className={`@container w-full rounded-3xl bg-white px-4 py-6 text-center text-ink shadow-[0_6px_0_#c7d2fe] short:py-4 ${phase === "wrong" ? "animate-shake" : "animate-rise"}`}
    >
      <p
        className="whitespace-nowrap text-[clamp(2.25rem,12cqw,4.5rem)] font-bold leading-none tabular-nums"
        aria-live="polite"
        aria-atomic="true"
      >
        {left} <span className="text-indigo-300">×</span> {right}{" "}
        <span className="text-indigo-300">=</span>{" "}
        {/* Fixed width, so the sum doesn't slide about as digits are typed. */}
        <span
          className={`inline-block ${typed ? "min-w-[1.85em] text-left" : "text-center"}`}
          style={
            typed
              ? undefined
              : { minWidth: `${String(question.answer).length * 0.62}em` }
          }
        >
          {slot}
        </span>
      </p>
      <p
        className={`mt-3 h-7 text-xl font-semibold ${phase === "wrong" ? "text-rose-600" : "text-emerald-600"}`}
      >
        {note}
      </p>
    </div>
  );
}

function Results({
  table,
  level,
  finished,
  onReplay,
}: {
  table: number;
  level: Level;
  finished: Finished;
  onReplay: () => void;
}) {
  const { outcome, reward } = finished;
  const nextLevel = LEVELS.find((l) => l.id === level.id + 1);
  const seconds =
    outcome.timeMs === null
      ? null
      : Math.max(1, Math.round(outcome.timeMs / 1000));

  let emoji: string;
  let title: string;
  let detail: string;
  if (reward.allMastered) {
    emoji = "🏆";
    title = "You did it!";
    detail = "That was the very last star. You are a Multiplication Master!";
  } else if (outcome.passed) {
    emoji = "🎉";
    title = !reward.newStar
      ? "Great job!"
      : reward.stars === STARS_PER_TABLE
        ? `×${table} mastered!`
        : "New star!";
    detail =
      seconds === null
        ? `You got ${outcome.firstTry} out of ${FACTS} right!`
        : `All ${FACTS} right in ${seconds} seconds!`;
  } else if (outcome.timedOut) {
    emoji = "⏰";
    title = "Time’s up!";
    detail = `You got ${outcome.solved} of ${FACTS} before the clock ran out. Have another go!`;
  } else {
    emoji = "💪";
    title = outcome.firstTry >= level.goal - 2 ? "So close!" : "Good try!";
    detail = `You got ${outcome.firstTry} out of ${FACTS} right. Get ${level.goal} to earn the star!`;
  }

  return (
    <Screen className="items-center justify-center gap-5 text-center">
      <p className="animate-pop text-6xl leading-none" aria-hidden="true">
        {emoji}
      </p>

      <div
        className="flex items-end justify-center gap-2"
        role="img"
        aria-label={`${reward.stars} of ${STARS_PER_TABLE} stars on the ${table} times table`}
      >
        {Array.from({ length: STARS_PER_TABLE }, (_, i) => (
          <Star
            key={i}
            filled={i < reward.stars}
            className={`${i === 1 ? "mb-4 size-24" : "size-20"} ${
              reward.newStar && i === level.id - 1 ? "animate-star-in" : ""
            }`}
          />
        ))}
      </div>

      <div>
        <h1 className="text-4xl font-bold sm:text-5xl">{title}</h1>
        <p className="mx-auto mt-2 max-w-sm text-xl text-white/85">{detail}</p>
      </div>

      {outcome.missed.length > 0 && (
        <section className="card w-full max-w-md p-4">
          <h2 className="text-lg font-semibold">
            {outcome.missed.length === 1 ? "Remember this one" : "Remember these"}
          </h2>
          <ul className="mt-2 flex flex-wrap justify-center gap-2">
            {outcome.missed.map((b) => (
              <li
                key={b}
                className="rounded-xl bg-white px-3 py-1.5 text-lg font-semibold tabular-nums text-ink"
              >
                {table} × {b} ={" "}
                <span className="text-emerald-600">{table * b}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex w-full max-w-sm flex-col gap-3">
        {reward.allMastered ? (
          <Link href="/" className="btn btn-gold btn-lg animate-glow">
            See your trophy 🏆
          </Link>
        ) : !outcome.passed ? (
          <button
            type="button"
            className="btn btn-gold btn-lg animate-glow"
            onClick={onReplay}
          >
            Try again
          </button>
        ) : nextLevel ? (
          <Link
            href={`/table/${table}/${nextLevel.id}/`}
            className="btn btn-gold btn-lg animate-glow"
            onClick={() => sfx.tap()}
          >
            Next: {nextLevel.name} {nextLevel.emoji}
          </Link>
        ) : (
          <Link
            href="/"
            className="btn btn-gold btn-lg animate-glow"
            onClick={() => sfx.tap()}
          >
            Pick another table
          </Link>
        )}

        {outcome.passed ? (
          <button type="button" className="btn btn-ghost" onClick={onReplay}>
            Play again
          </button>
        ) : (
          <Link href={`/table/${table}/`} className="btn btn-ghost">
            Peek at the {table} times table 👀
          </Link>
        )}

        {(!outcome.passed || nextLevel) && !reward.allMastered && (
          <Link href="/" className="btn btn-ghost">
            All tables
          </Link>
        )}
      </div>
    </Screen>
  );
}
