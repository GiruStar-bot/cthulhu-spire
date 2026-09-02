import type { PlayerProfile, PlayerStats, StatKey } from "./types";

export const STAT_MIN = 0;
export const MAX_LOADOUT = 6;
export const STAT_KEYS: StatKey[] = ["hp", "san", "intelligent", "strength", "energy"];
const KEY = "cthulhu-spire-profile-v1";

export function emptyStats(): PlayerStats {
  return { hp: 0, san: 0, intelligent: 0, strength: 0, energy: 0 };
}

export function emptyProfile(): PlayerProfile {
  return {
    playerName: "",
    stats: emptyStats(),
    collection: [],
    loadoutIds: [],
    bestFloor: 0,
    wins: 0,
    runs: 0,
    earnedPoints: 0,
    unspentPoints: 0,
    madness: 0,
    sanity: null,
    seenRlyeh: false,
    grimoireRead: [],
  };
}

export function statSum(stats: PlayerStats) {
  return STAT_KEYS.reduce((n, k) => n + Math.max(0, stats[k] | 0), 0);
}

export function totalPoints(profile: Pick<PlayerProfile, "bestFloor">) {
  return Math.max(0, Math.floor((profile.bestFloor | 0) / 10));
}

export function statBudget(profile: PlayerProfile) {
  return totalPoints(profile);
}

export function riteGain(floor: number) {
  return Math.max(0, Math.floor(floor / 10));
}

export function clampStats(stats: Partial<PlayerStats> | PlayerStats): PlayerStats {
  const s = stats as Partial<PlayerStats> & { body?: number };
  if (typeof s.hp === "number" || typeof s.san === "number" || typeof s.strength === "number") {
    return {
      hp: Math.max(STAT_MIN, (s.hp ?? 0) | 0),
      san: Math.max(STAT_MIN, (s.san ?? 0) | 0),
      intelligent: Math.max(STAT_MIN, (s.intelligent ?? 0) | 0),
      strength: Math.max(STAT_MIN, (s.strength ?? 0) | 0),
      energy: Math.max(STAT_MIN, (s.energy ?? 0) | 0),
    };
  }
  return emptyStats();
}

export const MADNESS_STEP = 30;
export const SANITY_PENALTY_PER_TIER = 40;
export const GRIMOIRE_MIND = 11;

export function madnessTiers(madness: number) {
  return Math.floor(Math.max(0, madness | 0) / MADNESS_STEP);
}

export function madnessPenalty(madness: number) {
  return madnessTiers(madness) * SANITY_PENALTY_PER_TIER;
}

export function derivedVitals(stats: PlayerStats, madness = 0) {
  return {
    maxHp: 50 + stats.hp * 2,
    maxSanity: Math.max(0, 50 + stats.san * 2 - madnessPenalty(madness)),
    intelligent: Math.floor(stats.intelligent / 5),
    strength: Math.floor(stats.strength / 5),
    energy: 3 + Math.floor(stats.energy / 10),
  };
}

export function statFinal(key: StatKey, sp: number, madness = 0) {
  if (key === "hp") return 50 + sp * 2;
  if (key === "san") return Math.max(0, 50 + sp * 2 - madnessPenalty(madness));
  if (key === "energy") return 3 + Math.floor(sp / 10);
  return Math.floor(sp / 5);
}

export function statBase(key: StatKey, madness = 0) {
  return statFinal(key, 0, madness);
}

export const GRIMOIRE_ENABLED = false;

export function grimoireOpen(profile: PlayerProfile) {
  return GRIMOIRE_ENABLED && profile.stats.san >= GRIMOIRE_MIND;
}

export function wipeProfile() {
  if (typeof localStorage !== "undefined") localStorage.removeItem(KEY);
  return emptyProfile();
}

export function unlockedFeatures(stats: PlayerStats): string[] {
  const out: string[] = [];
  if (stats.hp >= 6) out.push("重鎧の適性");
  if (stats.san >= 6) out.push("禁断の術の萌芽");
  if (stats.strength >= 6) out.push("儀式の耐性");
  if (stats.hp >= 8) out.push("筋肉による解決");
  if (stats.intelligent >= 8) out.push("理解による代償の制御");
  return out;
}

export function loadProfile(): PlayerProfile {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyProfile();
    const p = JSON.parse(raw) as PlayerProfile;
    const stats = clampStats(p.stats ?? emptyStats());
    const bestFloor = Math.max(0, p.bestFloor | 0);
    const budget = totalPoints({ bestFloor });
    const fitted = statSum(stats) > budget ? emptyStats() : stats;
    return {
      ...emptyProfile(),
      ...p,
      stats: fitted,
      collection: Array.isArray(p.collection) ? p.collection : [],
      loadoutIds: Array.isArray(p.loadoutIds) ? p.loadoutIds.slice(0, MAX_LOADOUT) : [],
      bestFloor,
      earnedPoints: budget,
      unspentPoints: Math.max(0, budget - statSum(fitted)),
      madness: Math.max(0, p.madness | 0),
      sanity: typeof p.sanity === "number" ? Math.max(0, p.sanity) : null,
      seenRlyeh: !!p.seenRlyeh,
      grimoireRead: Array.isArray(p.grimoireRead) ? p.grimoireRead.filter((id) => typeof id === "string") : [],
    };
  } catch {
    return emptyProfile();
  }
}

export function saveProfile(p: PlayerProfile) {
  localStorage.setItem(KEY, JSON.stringify(p));
}

export function homeScene(_profile?: PlayerProfile): "title" {
  return "title";
}
