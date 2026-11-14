"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FACTS, LEVELS, STARS_PER_TABLE, tableHue, type Level } from "@/lib/game";
import { sfx } from "@/lib/sound";
import {
  activeProfile,
  starsFor,
  useAppData,
  type LevelBest,
} from "@/lib/store";
import { Screen, SoundToggle, Splash, Star, Stars, hue } from "./ui";

/** One times table: its three levels, and the table itself to study. */
export function TableScreen({ table }: { table: number }) {
  const data = useAppData();
  const router = useRouter();
  const profile = data ? activeProfile(data) : null;
  const nobodyPlaying = data !== null && profile === null;

  useEffect(() => {
    if (nobodyPlaying) router.replace("/");
  }, [nobodyPlaying, router]);

  if (!profile) return <Splash />;

  const stars = starsFor(profile, table);
  const best = profile.tables[table]?.best ?? {};

  return (
    <Screen>
      <header className="flex items-center justify-between gap-3">
        <Link href="/" className="btn btn-ghost btn-sm" onClick={() => sfx.tap()}>
          <span aria-hidden="true">←</span> All tables
        </Link>
        <SoundToggle />
      </header>

      <section className="mt-5 flex items-center gap-4">
        <div
          className="tile pointer-events-none w-24 shrink-0 sm:w-28"
          style={hue(tableHue(table))}
          aria-hidden="true"
        >
          <span className="text-5xl font-bold leading-none sm:text-6xl">
            <span className="text-[0.6em] opacity-60">×</span>
            {table}
          </span>
        </div>
        <div className="min-w-0">
          <h1 className="text-3xl font-bold sm:text-4xl">
            The {table} times table
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-lg text-white/85">
            <Stars count={stars} starClassName="size-8" />
            {stars === STARS_PER_TABLE
              ? "Mastered! 🎉"
              : stars === 0
                ? "Earn 3 stars to master it"
                : `${STARS_PER_TABLE - stars} to go`}
          </p>
        </div>
      </section>

      <ol className="mt-6 flex flex-col gap-3">
        {LEVELS.map((level) => (
          <li key={level.id}>
            <LevelCard
              table={table}
              level={level}
              stars={stars}
              best={best[level.id]}
            />
          </li>
        ))}
      </ol>

      {/* Open by default for a brand-new table, so there's something to learn from. */}
      <details className="card mt-6 p-4" open={stars === 0}>
        <summary className="cursor-pointer text-lg font-semibold">
          👀 Peek at the {table} times table
        </summary>
        <ul className="mt-3 grid grid-cols-2 gap-2 text-lg tabular-nums sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: FACTS }, (_, i) => i + 1).map((b) => (
            <li
              key={b}
              className="rounded-xl bg-white/10 px-3 py-2 text-center font-medium"
            >
              {table} × {b} ={" "}
              <strong className="text-amber-300">{table * b}</strong>
            </li>
          ))}
        </ul>
      </details>
    </Screen>
  );
}

function LevelCard({
  table,
  level,
  stars,
  best,
}: {
  table: number;
  level: Level;
  stars: number;
  best: LevelBest | undefined;
}) {
  const earned = stars >= level.id;
  const locked = stars < level.id - 1;
  const upNext = stars === level.id - 1;

  let bestText: string | null = null;
  if (earned && best?.timeMs != null) {
    bestText = `Best time: ${Math.max(1, Math.round(best.timeMs / 1000))} seconds`;
  } else if (best && level.timeLimitMs === undefined) {
    bestText = `Best so far: ${best.firstTry} out of ${FACTS}`;
  }

  const content = (
    <>
      <span
        className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/55 text-3xl"
        aria-hidden="true"
      >
        {locked ? "🔒" : level.emoji}
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-xl font-bold">{level.name}</span>
        <span className="block text-base font-medium opacity-80">
          {locked
            ? `Earn the ${LEVELS[level.id - 2].name} star first`
            : level.tagline}
        </span>
        {!locked && (
          <span className="mt-0.5 block text-sm font-medium opacity-75">
            🎯 {level.goalText}
            {bestText && ` · ${bestText}`}
          </span>
        )}
      </span>
      <Star filled={earned} className="size-10 shrink-0" />
      <span className="sr-only">{earned ? "Star earned" : "Star not earned yet"}</span>
    </>
  );

  if (locked) {
    return (
      <div className="btn btn-ghost pointer-events-none w-full gap-4 p-4 opacity-60">
        {content}
      </div>
    );
  }

  return (
    <Link
      href={`/table/${table}/${level.id}/`}
      className={`btn btn-hue w-full gap-4 p-4 ${upNext ? "animate-glow" : ""}`}
      style={hue(level.hue)}
      onClick={() => sfx.tap()}
    >
      {content}
    </Link>
  );
}
