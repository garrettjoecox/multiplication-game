import { useEffect, useSyncExternalStore } from "react";
import {
  ALL_STARS,
  STARS_PER_TABLE,
  SUBJECTS,
  isOp,
  starsIn,
  subject,
  type LevelId,
  type Op,
} from "./game";

/**
 * Everything the app remembers lives in one localStorage entry on this device.
 * Nothing is sent anywhere.
 *
 * The key has stayed the same since the first version so that progress saved
 * before addition and subtraction existed is picked up, not orphaned.
 */
const STORAGE_KEY = "star-tables:v1";

/**
 * Saved stars are kept for every table number up to this, whatever a subject
 * currently goes up to. Shortening a subject then hides its extra tables
 * without throwing away what was earned on them.
 */
const HIGHEST_TABLE_EVER = 12;

export interface LevelBest {
  /** Most right-first-try answers in one round. */
  firstTry: number;
  /** Fastest winning time, for timed levels. */
  timeMs: number | null;
}

export interface TableProgress {
  /** 0–3. Equal to the highest level passed. */
  stars: number;
  best: Partial<Record<LevelId, LevelBest>>;
}

/** Progress on the tables of one subject, by table number. */
export type Tables = Record<number, TableProgress>;

export interface Profile {
  id: string;
  name: string;
  avatar: string;
  createdAt: number;
  /** The subject showing on this player's home screen. */
  subject: Op;
  progress: Record<Op, Tables>;
}

export interface AppData {
  version: 2;
  profiles: Profile[];
  activeId: string | null;
  sound: boolean;
}

export interface RoundReward {
  /** This round earned a star the player didn't have before. */
  newStar: boolean;
  /** Stars on this table after the round. */
  stars: number;
  /** This round earned the last star of its subject. */
  subjectMastered: boolean;
  /** This round earned the last star of the last subject. */
  allMastered: boolean;
}

const EMPTY: AppData = { version: 2, profiles: [], activeId: null, sound: true };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function sanitizeTables(raw: unknown): Tables {
  const tables: Tables = {};
  if (!isRecord(raw)) return tables;
  for (let table = 1; table <= HIGHEST_TABLE_EVER; table++) {
    const t = raw[table];
    if (!isRecord(t)) continue;
    const stars = Math.round(Number(t.stars));
    tables[table] = {
      stars: Math.min(STARS_PER_TABLE, Math.max(0, stars || 0)),
      best: isRecord(t.best) ? (t.best as TableProgress["best"]) : {},
    };
  }
  return tables;
}

/** Never trust what comes out of storage: keep what's valid, drop the rest. */
function sanitize(raw: unknown): AppData {
  if (!isRecord(raw) || !Array.isArray(raw.profiles)) return EMPTY;

  const profiles: Profile[] = [];
  for (const p of raw.profiles as unknown[]) {
    if (!isRecord(p) || typeof p.id !== "string" || typeof p.name !== "string") {
      continue;
    }
    // Version 1 only had multiplication, saved as `tables`. Carry it over,
    // and keep those players on the subject they were already working on.
    const fromV1 = !isRecord(p.progress);
    const saved = isRecord(p.progress) ? p.progress : { multiply: p.tables };
    profiles.push({
      id: p.id,
      name: p.name,
      avatar: typeof p.avatar === "string" ? p.avatar : "⭐",
      createdAt: typeof p.createdAt === "number" ? p.createdAt : 0,
      subject: isOp(p.subject) ? p.subject : fromV1 ? "multiply" : "add",
      progress: {
        add: sanitizeTables(saved.add),
        subtract: sanitizeTables(saved.subtract),
        multiply: sanitizeTables(saved.multiply),
      },
    });
  }

  const activeId = profiles.some((p) => p.id === raw.activeId)
    ? (raw.activeId as string)
    : null;
  return { version: 2, profiles, activeId, sound: raw.sound !== false };
}

function load(): AppData {
  try {
    const text = window.localStorage.getItem(STORAGE_KEY);
    return text ? sanitize(JSON.parse(text)) : EMPTY;
  } catch {
    return EMPTY;
  }
}

let cache: AppData | null = null;
const listeners = new Set<() => void>();

/** Current data. Browser only. */
export function peekData(): AppData {
  return (cache ??= load());
}

function update(change: (data: AppData) => AppData): void {
  const next = change(peekData());
  if (next === cache) return;
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage is full or blocked (private browsing): keep playing from memory.
  }
  listeners.forEach((listener) => listener());
}

function updateProfile(id: string, change: (profile: Profile) => Profile): void {
  update((data) => {
    const profile = data.profiles.find((p) => p.id === id);
    if (!profile) return data;
    const changed = change(profile);
    if (changed === profile) return data;
    return {
      ...data,
      profiles: data.profiles.map((p) => (p.id === id ? changed : p)),
    };
  });
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  // Pick up changes made in another tab.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== STORAGE_KEY) return;
    cache = null;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

const getServerSnapshot = () => null;

/** `null` until the page has loaded in the browser, then the saved data. */
export function useAppData(): AppData | null {
  return useSyncExternalStore<AppData | null>(
    subscribe,
    peekData,
    getServerSnapshot,
  );
}

/**
 * Keeps the home screen on the subject being played, however the page was
 * reached, so that "All tables" always leads back to the right grid.
 */
export function useSubjectSync(profile: Profile | null, op: Op): void {
  const id = profile?.id;
  const current = profile?.subject;
  useEffect(() => {
    if (id && current !== op) setSubject(id, op);
  }, [id, current, op]);
}

// ── Reading ────────────────────────────────────────────────────────────────

export function activeProfile(data: AppData): Profile | null {
  return data.profiles.find((p) => p.id === data.activeId) ?? null;
}

export function starsFor(profile: Profile, op: Op, table: number): number {
  return profile.progress[op][table]?.stars ?? 0;
}

/** Stars earned on the tables one subject has now. */
export function subjectStars(profile: Profile, op: Op): number {
  return subject(op).tables.reduce(
    (sum, table) => sum + starsFor(profile, op, table),
    0,
  );
}

/** Stars earned across every subject. */
export function allStars(profile: Profile): number {
  return SUBJECTS.reduce((sum, s) => sum + subjectStars(profile, s.id), 0);
}

/** The next star to go for: the first unfinished table, at its next level. */
export function nextGoal(
  profile: Profile,
  op: Op,
): { table: number; levelId: LevelId } | null {
  for (const table of subject(op).tables) {
    const stars = starsFor(profile, op, table);
    if (stars < STARS_PER_TABLE) return { table, levelId: (stars + 1) as LevelId };
  }
  return null;
}

// ── Writing ────────────────────────────────────────────────────────────────

export function addProfile(name: string, avatar: string): void {
  // Not crypto.randomUUID(): that's missing on plain-http LAN addresses.
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const profile: Profile = {
    id,
    name,
    avatar,
    createdAt: Date.now(),
    subject: "add",
    progress: { add: {}, subtract: {}, multiply: {} },
  };
  update((data) => ({
    ...data,
    profiles: [...data.profiles, profile],
    activeId: id,
  }));
}

export function selectProfile(id: string | null): void {
  update((data) => (data.activeId === id ? data : { ...data, activeId: id }));
}

export function deleteProfile(id: string): void {
  update((data) => ({
    ...data,
    profiles: data.profiles.filter((p) => p.id !== id),
    activeId: data.activeId === id ? null : data.activeId,
  }));
}

export function setSound(sound: boolean): void {
  update((data) => ({ ...data, sound }));
}

/** Remembers which subject this player's home screen should open on. */
export function setSubject(profileId: string, op: Op): void {
  updateProfile(profileId, (profile) =>
    profile.subject === op ? profile : { ...profile, subject: op },
  );
}

export function recordRound(
  profileId: string,
  op: Op,
  table: number,
  levelId: LevelId,
  result: { passed: boolean; firstTry: number; timeMs: number | null },
): RoundReward {
  const reward: RoundReward = {
    newStar: false,
    stars: 0,
    subjectMastered: false,
    allMastered: false,
  };

  updateProfile(profileId, (profile) => {
    const before = profile.progress[op][table] ?? { stars: 0, best: {} };
    const stars = result.passed ? Math.max(before.stars, levelId) : before.stars;
    const oldBest = before.best[levelId];
    const best: LevelBest = {
      firstTry: Math.max(oldBest?.firstTry ?? 0, result.firstTry),
      timeMs:
        result.passed && result.timeMs !== null
          ? Math.min(oldBest?.timeMs ?? Infinity, result.timeMs)
          : (oldBest?.timeMs ?? null),
    };

    const updated: Profile = {
      ...profile,
      progress: {
        ...profile.progress,
        [op]: {
          ...profile.progress[op],
          [table]: { stars, best: { ...before.best, [levelId]: best } },
        },
      },
    };

    reward.stars = stars;
    reward.newStar = stars > before.stars;
    reward.subjectMastered =
      reward.newStar && subjectStars(updated, op) === starsIn(op);
    reward.allMastered = reward.newStar && allStars(updated) === ALL_STARS;
    return updated;
  });

  return reward;
}
