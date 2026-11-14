"use client";

import Link from "next/link";
import { useEffect } from "react";
import { fireworks } from "@/lib/confetti";
import {
  ALL_STARS,
  LEVELS,
  STARS_PER_TABLE,
  SUBJECTS,
  starsIn,
  subject,
  tableHue,
  tableName,
} from "@/lib/game";
import { sfx } from "@/lib/sound";
import {
  allStars,
  nextGoal,
  selectProfile,
  setSubject,
  starsFor,
  subjectStars,
  type Profile,
} from "@/lib/store";
import { Screen, SoundToggle, Star, Stars, hue } from "./ui";

/**
 * Home for one player: a tab per subject, and for the chosen subject their
 * stars, what to do next, and all twelve tables.
 */
export function TableMap({ profile }: { profile: Profile }) {
  const op = profile.subject;
  const info = subject(op);
  const total = subjectStars(profile, op);
  const goal = nextGoal(profile, op);
  const mastered = goal === null;
  const toCollect = starsIn(op);
  const left = toCollect - total;
  // Ten tables sit best in rows of five; twelve in rows of four or six.
  const columns =
    info.tables.length === 10
      ? "sm:grid-cols-5"
      : "sm:grid-cols-4 lg:grid-cols-6";
  const masteredEverything = allStars(profile) === ALL_STARS;

  // A master gets fireworks every time they come back to a finished subject.
  useEffect(() => {
    if (mastered) return fireworks(3500);
  }, [mastered, op]);

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

      <nav className="mt-4 grid grid-cols-3 gap-2 sm:gap-3" aria-label="Subjects">
        {SUBJECTS.map((s) => {
          const stars = subjectStars(profile, s.id);
          const selected = s.id === op;
          return (
            <button
              key={s.id}
              type="button"
              aria-pressed={selected}
              className={`btn flex-col gap-0.5 px-1 py-2 sm:flex-row sm:gap-2.5 sm:py-3 ${selected ? "" : "btn-ghost"}`}
              onClick={() => {
                sfx.tap();
                setSubject(profile.id, s.id);
              }}
            >
              <span className="text-3xl font-bold leading-none" aria-hidden="true">
                {s.symbol}
              </span>
              <span className="text-base sm:text-lg">{s.label}</span>
              <span className="flex items-center gap-1 text-sm font-medium tabular-nums opacity-80">
                {stars === starsIn(s.id) ? (
                  <>
                    <span aria-hidden="true">🏆</span>
                    <span className="sr-only">mastered</span>
                  </>
                ) : (
                  <>
                    <Star filled className="size-3.5" />
                    {stars}/{starsIn(s.id)}
                    <span className="sr-only"> stars</span>
                  </>
                )}
              </span>
            </button>
          );
        })}
      </nav>

      <section className="card mt-4 p-4 sm:p-5" aria-label="Your stars">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-4xl font-bold tabular-nums sm:text-5xl">
            <Star filled className="size-9 sm:size-11" />
            {total}
            <span className="text-xl font-semibold text-white/60 sm:text-2xl">
              / {toCollect}
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
          aria-valuemax={toCollect}
          aria-valuenow={total}
        >
          <div
            className="h-full rounded-full bg-linear-to-r from-amber-300 to-amber-500 transition-[width] duration-700"
            style={{ width: `${(total / toCollect) * 100}%` }}
          />
        </div>
        {!mastered && (
          <p className="mt-3 text-base text-white/85 sm:text-lg">
            {total === 0
              ? `Collect all ${toCollect} stars to become ${info.aMaster}!`
              : `${left} more ${left === 1 ? "star" : "stars"} to become ${info.aMaster}!`}
          </p>
        )}
      </section>

      {goal ? (
        <Link
          href={`/play/${op}/${goal.table}/${goal.levelId}/`}
          className="btn btn-gold btn-lg mt-4 animate-glow px-3 text-[clamp(1.05rem,5.2vw,1.375rem)]"
          onClick={() => sfx.tap()}
        >
          <span aria-hidden="true">▶</span>
          <span>
            {total === 0 ? "Start" : "Next star"}: {info.symbol}
            {goal.table} {LEVELS[goal.levelId - 1].name}{" "}
            {LEVELS[goal.levelId - 1].emoji}
          </span>
        </Link>
      ) : (
        // Keyed so the banner pops again when switching between finished subjects.
        <section
          key={op}
          className="mt-4 animate-pop rounded-3xl bg-linear-to-br from-amber-200 to-amber-500 p-5 text-center text-ink sm:p-6"
        >
          <h1 className="text-3xl font-bold sm:text-4xl">{info.master}!</h1>
          <p className="mx-auto mt-2 max-w-xl text-lg font-medium sm:text-xl">
            {masteredEverything
              ? `${profile.name}, you earned all ${ALL_STARS} stars. You’ve mastered adding, subtracting and multiplying, so you don’t need this app any more! 🎓`
              : `${profile.name}, you earned all ${toCollect} stars. You know every ${info.tableKind} up to ${info.tables.length}, so you don’t need this app for ${info.doing} any more! 🎓`}
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
        {mastered ? "Play any table for fun" : "Or pick a table"}
      </h2>
      <ul className={`grid grid-cols-3 gap-3 sm:gap-4 ${columns}`}>
        {info.tables.map((table) => {
          const stars = starsFor(profile, op, table);
          return (
            <li key={table}>
              <Link
                href={`/play/${op}/${table}/`}
                className="tile"
                style={hue(tableHue(table))}
                aria-label={`${tableName(op, table)}, ${stars} of ${STARS_PER_TABLE} stars`}
                onClick={() => sfx.tap()}
              >
                <span className="text-4xl font-bold leading-none sm:text-5xl">
                  <span className="text-[0.6em] opacity-60">{info.symbol}</span>
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
