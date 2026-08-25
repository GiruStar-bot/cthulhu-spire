import type { RelicDef, RelicInstance, RelicTier } from "./types";
import { uid } from "./rng";

/** テンプレート定義。実際の所持品は RelicInstance（ロール済み）。 */
export const RELICS: Record<string, RelicDef> = {
  lens: {
    id: "lens",
    name: "ひび割れたレンズ",
    text: "戦闘開始時、追加でカードを引く。",
    kind: "draw",
    basePower: 2,
  },
  coral: {
    id: "coral",
    name: "乾いた珊瑚",
    text: "最大体力が増える。",
    kind: "maxHp",
    basePower: 8,
  },
  idol: {
    id: "idol",
    name: "青白い偶像",
    text: "正気を失うたび、ブロックを得る。",
    kind: "sanityBlock",
    basePower: 3,
  },
  candle: {
    id: "candle",
    name: "黒い蝋燭",
    text: "毎ターン開始時、エネルギーを得る（高いロールで+1が安定）。",
    kind: "energy",
    basePower: 1,
  },
  coin: {
    id: "coin",
    name: "塩のコイン",
    text: "戦闘後、体力を回復する。",
    kind: "postHeal",
    basePower: 6,
  },
  notebook: {
    id: "notebook",
    name: "野帳",
    text: "戦闘開始時、筋力を得る。",
    kind: "strength",
    basePower: 1,
  },
  saltbrand: {
    id: "saltbrand",
    name: "塩の焼印",
    text: "与ダメージがわずかに増える。",
    kind: "damage",
    basePower: 1,
  },
  veil: {
    id: "veil",
    name: "薄布のヴェール",
    text: "最大正気が上がる。",
    kind: "maxSanity",
    basePower: 6,
  },
};

export const RELIC_IDS = Object.keys(RELICS);

const TIER_MULT: Record<RelicTier, number> = {
  1: 1,
  2: 1.25,
  3: 1.55,
  4: 1.9,
};

/** 階層からドロップ帯を決める */
export function tierFromFloor(floor: number): RelicTier {
  if (floor >= 100) return 4;
  if (floor >= 50) return 3;
  if (floor >= 20) return 2;
  return 1;
}

/**
 * ハクスラロール:
 * base × tier × (0.85〜1.15) を整数化。
 * 高層ボスほど基準が大きく、個体差で「当たり」が生まれる。
 */
export function rollRelic(
  defId: string,
  floor: number,
  rand: () => number,
  source: RelicInstance["source"] = "drop",
): RelicInstance {
  const def = RELICS[defId] ?? RELICS.lens!;
  const tier = tierFromFloor(floor);
  const mult = TIER_MULT[tier];
  const variance = 0.85 + rand() * 0.3;
  const power = Math.max(1, Math.round(def.basePower * mult * variance));
  return {
    uid: uid("rel"),
    defId: def.id,
    tier,
    power,
    source,
    obtainedFloor: floor,
  };
}

export function relicLabel(inst: RelicInstance): string {
  const def = RELICS[inst.defId];
  const name = def?.name ?? inst.defId;
  return `${name} T${inst.tier}(+${inst.power})`;
}

export function relicDesc(inst: RelicInstance): string {
  const def = RELICS[inst.defId];
  if (!def) return "";
  return `${def.text}（効力 ${inst.power}）`;
}

/** 効果解決用: kind ごとの数値をインスタンスから取る */
export function powerOf(insts: RelicInstance[], kind: RelicDef["kind"]): number {
  return insts
    .filter((i) => RELICS[i.defId]?.kind === kind)
    .reduce((a, i) => a + i.power, 0);
}

export function hasKind(insts: RelicInstance[], kind: RelicDef["kind"]): boolean {
  return insts.some((i) => RELICS[i.defId]?.kind === kind);
}

export function pickRelicTemplate(ownedDefIds: string[], rand: () => number): string {
  const pool = RELIC_IDS.filter((id) => !ownedDefIds.includes(id));
  const use = pool.length ? pool : RELIC_IDS;
  return use[Math.floor(rand() * use.length)]!;
}
