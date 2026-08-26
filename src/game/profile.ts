import type { PlayerProfile, PlayerStats, RelicInstance } from "./types";

export const STAT_BUDGET = 12;
export const STAT_MIN = 1;
export const MAX_LOADOUT = 6;
const KEY = "cthulhu-spire-profile-v1";

export function emptyProfile(): PlayerProfile {
  return {
    playerName: "",
    stats: { body: 4, mind: 4, will: 4 },
    collection: [],
    loadoutIds: [],
    bestFloor: 0,
    wins: 0,
    runs: 0,
    earnedPoints: 0,
    unspentPoints: 0,
  };
}

export function statSum(stats: PlayerStats) {
  return stats.body + stats.mind + stats.will;
}

export function statBudget(profile: PlayerProfile) {
  return STAT_BUDGET + Math.max(0, profile.earnedPoints | 0);
}

export function riteGain(floor: number) {
  return Math.max(0, Math.floor(floor / 10));
}

export function clampStats(stats: PlayerStats): PlayerStats {
  return {
    body: Math.max(STAT_MIN, stats.body | 0),
    mind: Math.max(STAT_MIN, stats.mind | 0),
    will: Math.max(STAT_MIN, stats.will | 0),
  };
}

export function derivedVitals(stats: PlayerStats) {
  return {
    maxHp: 50 + stats.body * 2,
    maxSanity: 40 + stats.mind * 2,
  };
}

export function unlockedFeatures(stats: PlayerStats): string[] {
  const out: string[] = [];
  if (stats.body >= 6) out.push("重鎧の適性");
  if (stats.mind >= 6) out.push("禁断の術の萌芽");
  if (stats.will >= 6) out.push("儀式の耐性");
  if (stats.body >= 8) out.push("筋肉による解決");
  if (stats.mind >= 8) out.push("理解による代償の制御");
  return out;
}

export function loadProfile(): PlayerProfile {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyProfile();
    const p = JSON.parse(raw) as PlayerProfile;
    return {
      ...emptyProfile(),
      ...p,
      stats: clampStats(p.stats ?? emptyProfile().stats),
      collection: Array.isArray(p.collection) ? p.collection : [],
      loadoutIds: Array.isArray(p.loadoutIds) ? p.loadoutIds.slice(0, MAX_LOADOUT) : [],
      earnedPoints: Math.max(0, p.earnedPoints | 0),
      unspentPoints: Math.max(0, p.unspentPoints | 0),
    };
  } catch {
    return emptyProfile();
  }
}

export function saveProfile(p: PlayerProfile) {
  localStorage.setItem(KEY, JSON.stringify(p));
}

export function equippedRelics(profile: PlayerProfile): RelicInstance[] {
  const map = new Map(profile.collection.map((r) => [r.uid, r]));
  return profile.loadoutIds
    .map((id) => map.get(id))
    .filter((r): r is RelicInstance => !!r)
    .slice(0, MAX_LOADOUT);
}
