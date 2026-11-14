"use client";

import { useState } from "react";
import { TOTAL_STARS } from "@/lib/game";
import { sfx } from "@/lib/sound";
import {
  addProfile,
  deleteProfile,
  selectProfile,
  totalStars,
  type Profile,
} from "@/lib/store";
import { Screen, SoundToggle, Star } from "./ui";

const AVATARS = [
  { emoji: "🦊", label: "Fox" },
  { emoji: "🐼", label: "Panda" },
  { emoji: "🦁", label: "Lion" },
  { emoji: "🐸", label: "Frog" },
  { emoji: "🦄", label: "Unicorn" },
  { emoji: "🐙", label: "Octopus" },
  { emoji: "🐯", label: "Tiger" },
  { emoji: "🐨", label: "Koala" },
  { emoji: "🐵", label: "Monkey" },
  { emoji: "🐧", label: "Penguin" },
  { emoji: "🦖", label: "Dinosaur" },
  { emoji: "🚀", label: "Rocket" },
];

export function ProfilePicker({ profiles }: { profiles: Profile[] }) {
  const [creating, setCreating] = useState(false);
  const [managing, setManaging] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const showForm = creating || profiles.length === 0;

  return (
    <Screen>
      <header className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-2xl font-bold">
          <Star filled className="size-7" />
          Star Tables
        </p>
        <SoundToggle />
      </header>

      {showForm ? (
        <NewProfileForm
          profiles={profiles}
          onCancel={profiles.length > 0 ? () => setCreating(false) : undefined}
        />
      ) : (
        <section className="flex flex-1 flex-col items-center justify-center gap-8 py-8">
          <h1 className="text-center text-4xl font-bold sm:text-5xl">
            Who’s playing?
          </h1>

          <ul className="grid w-full max-w-2xl grid-cols-2 gap-4 sm:grid-cols-3">
            {profiles.map((profile) => (
              <li key={profile.id} className="relative">
                {confirmId === profile.id ? (
                  <div className="card flex h-full flex-col items-center justify-center gap-2 p-3 text-center">
                    <p className="text-lg font-semibold">
                      Delete {profile.name}?
                    </p>
                    <p className="text-sm text-white/70">
                      Their stars will be gone for good.
                    </p>
                    <div className="mt-1 flex flex-wrap justify-center gap-2">
                      <button
                        type="button"
                        className="btn btn-red btn-sm"
                        onClick={() => {
                          deleteProfile(profile.id);
                          setConfirmId(null);
                        }}
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => setConfirmId(null)}
                      >
                        Keep
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      className="card flex w-full flex-col items-center gap-2 px-3 py-5 transition hover:bg-white/20 active:scale-95"
                      onClick={() => {
                        sfx.go();
                        selectProfile(profile.id);
                      }}
                    >
                      <span className="text-6xl leading-none" aria-hidden="true">
                        {profile.avatar}
                      </span>
                      <span className="max-w-full truncate text-xl font-semibold">
                        {profile.name}
                      </span>
                      <span className="pill text-sm">
                        <Star filled className="size-4" />
                        {totalStars(profile)}/{TOTAL_STARS}
                      </span>
                    </button>
                    {managing && (
                      <button
                        type="button"
                        className="absolute -right-2 -top-2 grid size-9 place-items-center rounded-full bg-rose-500 text-lg font-bold text-white shadow-lg"
                        aria-label={`Delete ${profile.name}`}
                        onClick={() => setConfirmId(profile.id)}
                      >
                        ✕
                      </button>
                    )}
                  </>
                )}
              </li>
            ))}
            <li>
              <button
                type="button"
                className="flex h-full min-h-40 w-full flex-col items-center justify-center gap-1 rounded-3xl border-2 border-dashed border-white/40 px-3 py-5 text-white/85 transition hover:bg-white/10 active:scale-95"
                onClick={() => {
                  sfx.tap();
                  setManaging(false);
                  setConfirmId(null);
                  setCreating(true);
                }}
              >
                <span className="text-5xl leading-none" aria-hidden="true">
                  ＋
                </span>
                <span className="text-xl font-semibold">New player</span>
              </button>
            </li>
          </ul>

          <button
            type="button"
            className="rounded-lg px-3 py-2 text-white/70 underline underline-offset-4"
            onClick={() => {
              setManaging(!managing);
              setConfirmId(null);
            }}
          >
            {managing ? "Done" : "Remove a player"}
          </button>
        </section>
      )}
    </Screen>
  );
}

function NewProfileForm({
  profiles,
  onCancel,
}: {
  profiles: Profile[];
  onCancel?: () => void;
}) {
  const [name, setName] = useState("");
  // Start on a buddy nobody else has picked yet.
  const [avatar, setAvatar] = useState(
    () =>
      AVATARS.find((a) => !profiles.some((p) => p.avatar === a.emoji))?.emoji ??
      AVATARS[0].emoji,
  );
  const trimmed = name.trim();

  return (
    <form
      className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-5 py-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (!trimmed) return;
        sfx.go();
        addProfile(trimmed, avatar);
      }}
    >
      <h1 className="text-center text-3xl font-bold sm:text-4xl">
        {profiles.length === 0 ? "Hi! What’s your name?" : "New player"}
      </h1>

      <span key={avatar} className="animate-pop text-8xl leading-none" aria-hidden="true">
        {avatar}
      </span>

      <label htmlFor="player-name" className="sr-only">
        Your name
      </label>
      <input
        id="player-name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        maxLength={14}
        placeholder="Type your name"
        autoComplete="off"
        autoCapitalize="words"
        enterKeyHint="done"
        className="w-full rounded-2xl border-4 border-indigo-200 bg-white px-4 py-3 text-center text-2xl font-semibold text-ink placeholder:font-medium placeholder:text-indigo-300 focus:border-gold focus:outline-none"
      />

      <fieldset className="w-full">
        <legend className="mb-2 w-full text-center text-lg font-medium text-white/85">
          Pick your buddy
        </legend>
        <div className="grid grid-cols-6 gap-2">
          {AVATARS.map((option) => (
            <button
              key={option.emoji}
              type="button"
              aria-label={option.label}
              aria-pressed={option.emoji === avatar}
              className={`grid aspect-square place-items-center rounded-2xl text-3xl transition active:scale-90 ${
                option.emoji === avatar
                  ? "bg-gold ring-4 ring-amber-200"
                  : "bg-white/12 hover:bg-white/25"
              }`}
              onClick={() => {
                sfx.tap();
                setAvatar(option.emoji);
              }}
            >
              <span aria-hidden="true">{option.emoji}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <button
        type="submit"
        className="btn btn-gold btn-lg mt-2 w-full"
        disabled={!trimmed}
      >
        Let’s go! 🚀
      </button>
      {onCancel && (
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>
          Back
        </button>
      )}
    </form>
  );
}
