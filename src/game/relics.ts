import type { RelicDef, RelicInstance, RelicKind } from "./types";
import { uid } from "./rng";

export const RELICS: Record<string, RelicDef> = {
  lens: {
    id: "lens",
    name: "ひび割れたレンズ",
    text: "戦闘開始時、追加でカードを引く。",
    kind: "draw",
  },
  coral: {
    id: "coral",
    name: "乾いた珊瑚",
    text: "最大体力が増える。",
    kind: "maxHp",
  },
  idol: {
    id: "idol",
    name: "青白い偶像",
    text: "正気を失うたびブロックを得る。",
    kind: "sanityBlock",
  },
  candle: {
    id: "candle",
    name: "黒い蝋燭",
    text: "エネルギー上限が上がる。",
    kind: "energy",
  },
  coin: {
    id: "coin",
    name: "塩のコイン",
    text: "戦闘後、体力を回復する。",
    kind: "postHeal",
  },
  notebook: {
    id: "notebook",
    name: "野帳",
    text: "戦闘開始時、筋力を得る。",
    kind: "strength",
  },
  veil: {
    id: "veil",
    name: "薄いヴェール",
    text: "最大正気が増える。",
    kind: "maxSanity",
  },
};

export const RELIC_IDS = Object.keys(RELICS);

export function tierFromFloor(floor: number): number {
  return Math.max(1, Math.floor(floor / 10) + 1);
}

export function rollPower(kind: RelicKind, tier: number, rand: () => number): number {
  const base: Record<RelicKind, number> = {
    draw: 1 + Math.floor(tier / 2),
    maxHp: 4 + tier * 2,
    sanityBlock: 2 + tier,
    energy: 1,
    postHeal: 4 + tier * 2,
    strength: 1 + Math.floor(tier / 3),
    maxSanity: 4 + tier * 2,
  };
  const n = base[kind];
  const roll = 1 + (rand() * 2 - 1) * 0.25;
  return Math.max(1, Math.round(n * roll));
}

export function rollRelic(
  defId: string,
  floor: number,
  rand: () => number,
  source: RelicInstance["source"],
): RelicInstance {
  const def = RELICS[defId]!;
  const tier = tierFromFloor(floor);
  return {
    uid: uid("r"),
    defId,
    tier,
    power: rollPower(def.kind, tier, rand),
    obtainedFloor: floor,
    source,
  };
}

export function powerOf(relics: RelicInstance[], kind: RelicKind): number {
  return relics.reduce((sum, r) => {
    const def = RELICS[r.defId];
    return def?.kind === kind ? sum + r.power : sum;
  }, 0);
}

export function relicLabel(inst: RelicInstance): string {
  const def = RELICS[inst.defId];
  return `${def?.name ?? inst.defId} T${inst.tier}`;
}

export function relicDesc(inst: RelicInstance): string {
  const def = RELICS[inst.defId];
  if (!def) return "";
  switch (def.kind) {
    case "draw":
      return `戦闘開始時、追加で${inst.power}枚引く。`;
    case "maxHp":
      return `最大体力+${inst.power}。`;
    case "sanityBlock":
      return `正気を失うたびブロック+${inst.power}。`;
    case "energy":
      return `エネルギー上限+${inst.power}。`;
    case "postHeal":
      return `戦闘後、体力を${inst.power}回復。`;
    case "strength":
      return `戦闘開始時、筋力+${inst.power}。`;
    case "maxSanity":
      return `最大正気+${inst.power}。`;
  }
}

export function pickRelicTemplate(ownedDefs: string[], rand: () => number): string {
  const fresh = RELIC_IDS.filter((id) => !ownedDefs.includes(id));
  const use = fresh.length && rand() < 0.7 ? fresh : RELIC_IDS;
  return use[Math.floor(rand() * use.length)]!;
}
