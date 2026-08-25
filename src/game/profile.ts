import type { PlayerProfile, PlayerStats, RelicInstance } from "./types";

export const PROFILE_KEY = "cthulhu-spire-profile-v2";
export const MAX_LOADOUT = 6;
export const STAT_BUDGET = 12;
export const STAT_MIN = 1;

export function defaultStats(): PlayerStats {
  return { body: 4, mind: 4, will: 4 };
}

export function emptyProfile(): PlayerProfile {
  return {
    playerName: "",
    stats: defaultStats(),
    collection: [],
    loadoutIds: [],
    bestFloor: 0,
    runs: 0,
    wins: 0,
  };
}

export function loadProfile(): PlayerProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return emptyProfile();
    const p = JSON.parse(raw) as PlayerProfile;
    if (!p.stats) p.stats = defaultStats();
    if (!Array.isArray(p.collection)) p.collection = [];
    if (!Array.isArray(p.loadoutIds)) p.loadoutIds = [];
    p.playerName = typeof p.playerName === "string" ? p.playerName : "";
    p.bestFloor = p.bestFloor ?? 0;
    p.runs = p.runs ?? 0;
    p.wins = p.wins ?? 0;
    return p;
  } catch {
    return emptyProfile();
  }
}

export function saveProfile(p: PlayerProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
}

export function statsSum(s: PlayerStats) {
  return s.body + s.mind + s.will;
}

export function clampStats(s: PlayerStats): PlayerStats {
  return {
    body: Math.max(STAT_MIN, s.body | 0),
    mind: Math.max(STAT_MIN, s.mind | 0),
    will: Math.max(STAT_MIN, s.will | 0),
  };
}

/** ステータスから登攀開始時の肉体・正気上限 */
export function derivedVitals(stats: PlayerStats) {
  const s = clampStats(stats);
  return {
    maxHp: 60 + s.body * 2,
    maxSanity: 36 + s.mind * 2,
  };
}

/** 条件解放の簡易リスト（UI表示用） */
export function unlockedFeatures(stats: PlayerStats): string[] {
  const s = clampStats(stats);
  const out: string[] = [];
  if (s.body >= 6) out.push("打撃の手応え（肉体系カードが厚くなる）");
  if (s.mind >= 6) out.push("禁書の理解（知識系カードが厚くなる）");
  if (s.will >= 6) out.push("儀式の姿勢（意志系の選択肢が開く）");
  if (s.body + s.mind + s.will >= 18) out.push("三つの影が重なる（複合解放の予兆）");
  return out;
}

export function collectionById(p: PlayerProfile, uid: string): RelicInstance | undefined {
  return p.collection.find((r) => r.uid === uid);
}

export function equippedRelics(p: PlayerProfile): RelicInstance[] {
  return p.loadoutIds
    .map((id) => collectionById(p, id))
    .filter((r): r is RelicInstance => !!r)
    .slice(0, MAX_LOADOUT);
}
