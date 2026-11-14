import { useSyncExternalStore } from "react";
import { STARS_PER_TABLE, TABLES, TOTAL_STARS, type LevelId } from "./game";

/**
 * Everything the app remembers lives in one localStorage entry on this device.
 * Nothing is sent anywhere.
 */
const STORAGE_KEY = "star-tables:v1";

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

export interface Profile {
  id: string;
  name: string;
  avatar: string;
  createdAt: number;
  tables: Record<number, TableProgress>;
}

export interface AppData {
  version: 1;
  profiles: Profile[];
  activeId: string | null;
  sound: boolean;
}

export interface RoundReward {
  /** This round earned a star the player didn't have before. */
  newStar: boolean;
  /** Stars on this table after the round. */
  stars: number;
  /** This round earned the very last star. */
  allMastered: boolean;
}

const EMPTY: AppData = { version: 1, profiles: [], activeId: null, sound: true };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Never trust what comes out of storage: keep what's valid, drop the rest. */
function sanitize(raw: unknown): AppData {
  if (!isRecord(raw) || !Array.isArray(raw.profiles)) return EMPTY;

  const profiles: Profile[] = [];
  for (const p of raw.profiles as unknown[]) {
    if (!isRecord(p) || typeof p.id !== "string" || typeof p.name !== "string") {
      continue;
    }
    const tables: Record<number, TableProgress> = {};
    if (isRecord(p.tables)) {
      for (const table of TABLES) {
        const t = p.tables[table];
        if (!isRecord(t)) continue;
        const stars = Math.round(Number(t.stars));
        tables[table] = {
          stars: Math.min(STARS_PER_TABLE, Math.max(0, stars || 0)),
          best: isRecord(t.best) ? (t.best as TableProgress["best"]) : {},
        };
      }
    }
    profiles.push({
      id: p.id,
      name: p.name,
      avatar: typeof p.avatar === "string" ? p.avatar : "⭐",
      createdAt: typeof p.createdAt === "number" ? p.createdAt : 0,
      tables,
    });
  }

  const activeId = profiles.some((p) => p.id === raw.activeId)
    ? (raw.activeId as string)
    : null;
  return { version: 1, profiles, activeId, sound: raw.sound !== false };
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

// ── Reading ────────────────────────────────────────────────────────────────

export function activeProfile(data: AppData): Profile | null {
  return data.profiles.find((p) => p.id === data.activeId) ?? null;
}

export function starsFor(profile: Profile, table: number): number {
  return profile.tables[table]?.stars ?? 0;
}

export function totalStars(profile: Profile): number {
  return TABLES.reduce((sum, table) => sum + starsFor(profile, table), 0);
}

/** The next star to go for: the first unfinished table, at its next level. */
export function nextGoal(
  profile: Profile,
): { table: number; levelId: LevelId } | null {
  for (const table of TABLES) {
    const stars = starsFor(profile, table);
    if (stars < STARS_PER_TABLE) return { table, levelId: (stars + 1) as LevelId };
  }
  return null;
}

// ── Writing ────────────────────────────────────────────────────────────────

export function addProfile(name: string, avatar: string): void {
  // Not crypto.randomUUID(): that's missing on plain-http LAN addresses.
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const profile: Profile = { id, name, avatar, createdAt: Date.now(), tables: {} };
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

export function recordRound(
  profileId: string,
  table: number,
  levelId: LevelId,
  result: { passed: boolean; firstTry: number; timeMs: number | null },
): RoundReward {
  const reward: RoundReward = { newStar: false, stars: 0, allMastered: false };

  update((data) => {
    const profile = data.profiles.find((p) => p.id === profileId);
    if (!profile) return data;

    const before = profile.tables[table] ?? { stars: 0, best: {} };
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
      tables: {
        ...profile.tables,
        [table]: { stars, best: { ...before.best, [levelId]: best } },
      },
    };

    reward.stars = stars;
    reward.newStar = stars > before.stars;
    reward.allMastered =
      reward.newStar && totalStars(updated) === TOTAL_STARS;

    return {
      ...data,
      profiles: data.profiles.map((p) => (p.id === profileId ? updated : p)),
    };
  });

  return reward;
}
