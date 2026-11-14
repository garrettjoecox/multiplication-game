"use client";

import Link from "next/link";
import { useEffect } from "react";
import { fireworks } from "@/lib/confetti";
import { LEVELS, STARS_PER_TABLE, TABLES, TOTAL_STARS, tableHue } from "@/lib/game";
import { sfx } from "@/lib/sound";
import {
  nextGoal,
  selectProfile,
  starsFor,
  totalStars,
  type Profile,
} from "@/lib/store";
import { Screen, SoundToggle, Star, Stars, hue } from "./ui";

/** Home for one player: their stars, what to do next, and all twelve tables. */
export function TableMap({ profile }: { profile: Profile }) {
  const total = totalStars(profile);
  const goal = nextGoal(profile);
  const mastered = goal === null;
  const left = TOTAL_STARS - total;

  // A Multiplication Master gets fireworks every time they come home.
  useEffect(() => {
    if (mastered) return fireworks(3500);
  }, [mastered]);

  return (
    <Screen className="lg:max-w-5xl">
      <header className="flex items-center justify-between gap-3">
        <button
          type="button"
          className="btn btn-ghost btn-sm min-w-0"
          aria-label={`Playing as ${profile.name}. Switch player`}
          onClick={() => {
            sfx.tap();
            selectProfile(null);
          }}
        >
          <span className="text-2xl leading-none" aria-hidden="true">
            {profile.avatar}
          </span>
          <span className="truncate">{profile.name}</span>
          <span className="text-white/60" aria-hidden="true">
            ⇄
          </span>
        </button>
        <SoundToggle />
      </header>

      <section className="card mt-4 p-4 sm:p-5" aria-label="Your stars">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-4xl font-bold tabular-nums sm:text-5xl">
            <Star filled className="size-9 sm:size-11" />
            {total}
            <span className="text-xl font-semibold text-white/60 sm:text-2xl">
              / {TOTAL_STARS}
            </span>
          </p>
          <span
            className={`text-4xl sm:text-5xl ${mastered ? "animate-bob" : "opacity-40 grayscale"}`}
            aria-hidden="true"
          >
            🏆
          </span>
        </div>
        <div
          className="mt-3 h-4 overflow-hidden rounded-full bg-white/15"
          role="progressbar"
          aria-label="Stars collected"
          aria-valuemin={0}
          aria-valuemax={TOTAL_STARS}
          aria-valuenow={total}
        >
          <div
            className="h-full rounded-full bg-linear-to-r from-amber-300 to-amber-500 transition-[width] duration-700"
            style={{ width: `${(total / TOTAL_STARS) * 100}%` }}
          />
        </div>
        {!mastered && (
          <p className="mt-3 text-base text-white/85 sm:text-lg">
            {total === 0
              ? `Collect all ${TOTAL_STARS} stars to become a Multiplication Master!`
              : `${left} more ${left === 1 ? "star" : "stars"} to become a Multiplication Master!`}
          </p>
        )}
      </section>

      {goal ? (
        <Link
          href={`/table/${goal.table}/${goal.levelId}/`}
          className="btn btn-gold btn-lg mt-4 animate-glow"
          onClick={() => sfx.tap()}
        >
          <span aria-hidden="true">▶</span>
          <span>
            {total === 0 ? "Start" : "Next star"}: ×{goal.table}{" "}
            {LEVELS[goal.levelId - 1].name} {LEVELS[goal.levelId - 1].emoji}
          </span>
        </Link>
      ) : (
        <section className="mt-4 animate-pop rounded-3xl bg-linear-to-br from-amber-200 to-amber-500 p-5 text-center text-ink sm:p-6">
          <h1 className="text-3xl font-bold sm:text-4xl">
            Multiplication Master!
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-lg font-medium sm:text-xl">
            {profile.name}, you earned all {TOTAL_STARS} stars. You know every
            times table up to 12, so you don’t need this app any more! 🎓
          </p>
          <button
            type="button"
            className="btn mt-4"
            onClick={() => {
              sfx.master();
              fireworks(3500);
            }}
          >
            Celebrate again 🎉
          </button>
        </section>
      )}

      <h2 className="mb-3 mt-6 text-xl font-semibold sm:text-2xl">
        {mastered ? "Play any table for fun" : "Or pick a times table"}
      </h2>
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-6">
        {TABLES.map((table) => {
          const stars = starsFor(profile, table);
          return (
            <li key={table}>
              <Link
                href={`/table/${table}/`}
                className="tile"
                style={hue(tableHue(table))}
                aria-label={`${table} times table, ${stars} of ${STARS_PER_TABLE} stars`}
                onClick={() => sfx.tap()}
              >
                <span className="text-4xl font-bold leading-none sm:text-5xl">
                  <span className="text-[0.6em] opacity-60">×</span>
                  {table}
                </span>
                <span className="pill px-2 py-1">
                  <Stars count={stars} starClassName="size-4 sm:size-5" />
                </span>
                {stars === STARS_PER_TABLE && (
                  <span
                    className="absolute -right-1.5 -top-1.5 grid size-7 place-items-center rounded-full bg-emerald-400 text-sm font-bold text-ink shadow-md"
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </Screen>
  );
}
