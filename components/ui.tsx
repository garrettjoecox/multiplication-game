"use client";

import type { CSSProperties, ReactNode } from "react";
import { STARS_PER_TABLE } from "@/lib/game";
import { sfx } from "@/lib/sound";
import { setSound, useAppData } from "@/lib/store";

/** Sets the colour of a `.tile` or `.btn-hue` element. */
export function hue(h: number): CSSProperties {
  return { "--h": h } as CSSProperties;
}

export function Star({
  filled,
  className = "",
}: {
  filled: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`${filled ? "star-on" : "star-off"} ${className}`}
    >
      <path
        d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5-4.8-4.6 6.6-.9z"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** A row of three stars, `count` of them gold. */
export function Stars({
  count,
  className = "",
  starClassName = "size-5",
}: {
  count: number;
  className?: string;
  starClassName?: string;
}) {
  return (
    <span
      role="img"
      aria-label={`${count} of ${STARS_PER_TABLE} stars`}
      className={`inline-flex items-center gap-0.5 ${className}`}
    >
      {Array.from({ length: STARS_PER_TABLE }, (_, i) => (
        <Star key={i} filled={i < count} className={starClassName} />
      ))}
    </span>
  );
}

export function Screen({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <main className={`screen ${className}`}>{children}</main>;
}

/** Shown for the instant before saved progress has been read. */
export function Splash() {
  return (
    <main className="grid min-h-dvh place-items-center" aria-busy="true">
      <Star filled className="size-16 animate-bob" />
      <span className="sr-only">Loading…</span>
    </main>
  );
}

export function SoundToggle() {
  const on = useAppData()?.sound ?? true;
  return (
    <button
      type="button"
      className="btn btn-ghost btn-icon"
      aria-label="Sound"
      aria-pressed={on}
      onClick={() => {
        setSound(!on);
        sfx.tap(); // Only heard when the sound was just switched on.
      }}
    >
      <span aria-hidden="true">{on ? "🔊" : "🔇"}</span>
    </button>
  );
}
