import type { EnemyDef } from "./types";
import { asset } from "@/lib/asset";

function clip(dir: string): Pick<EnemyDef, "art" | "poster"> {
  return {
    art: asset(`art/${dir}/idle.mp4`),
    poster: asset(`art/${dir}/poster.jpg`),
  };
}

export const ENEMIES: Record<string, EnemyDef> = {
  acolyte: {
    id: "acolyte",
    name: "侍祭",
    ...clip("acolyte"),
    maxHp: 32,
    pattern: [
      { kind: "attack", damage: 7 },
      { kind: "attack", damage: 11 },
      { kind: "defend", block: 8 },
    ],
  },
  drowned: {
    id: "drowned",
    name: "溺れた眷属",
    ...clip("deepone"),
    maxHp: 44,
    pattern: [
      { kind: "attack", damage: 9 },
      { kind: "defend", block: 10 },
      { kind: "attack", damage: 6, hits: 2 },
    ],
  },
  byakhee: {
    id: "byakhee",
    name: "翼ある飢え",
    ...clip("byakhee"),
    maxHp: 38,
    pattern: [
      { kind: "debuff", weak: 2 },
      { kind: "attack", damage: 13 },
      { kind: "attack", damage: 8 },
    ],
  },
  starveling: {
    id: "starveling",
    name: "飢えし仔",
    ...clip("deepone"),
    maxHp: 86,
    pattern: [
      { kind: "buff", strength: 2 },
      { kind: "attack", damage: 16 },
      { kind: "attack", damage: 8, hits: 2 },
      { kind: "defend", block: 14 },
    ],
  },
  priest: {
    id: "priest",
    name: "尖塔の大司祭",
    art: asset("art/priest/idle.mp4"),
    poster: asset("art/priest/sprite_01.png"),
    maxHp: 168,
    pattern: [
      { kind: "debuff", dread: 1 },
      { kind: "attack", damage: 18 },
      { kind: "attack", damage: 9, hits: 2 },
      { kind: "buff", strength: 3 },
      { kind: "attack", damage: 22 },
    ],
  },
  choir: {
    id: "choir",
    name: "塩の唱者",
    ...clip("acolyte"),
    maxHp: 42,
    trait: "choir",
    pattern: [
      { kind: "attack", damage: 8 },
      { kind: "debuff", dread: 1 },
      { kind: "attack", damage: 6, hits: 2 },
      { kind: "defend", block: 8 },
    ],
  },
  nurse: {
    id: "nurse",
    name: "深きものの乳母",
    ...clip("nurse"),
    maxHp: 112,
    trait: "nurse",
    pattern: [
      { kind: "defend", block: 16 },
      { kind: "attack", damage: 12 },
      { kind: "defend", block: 20 },
      { kind: "attack", damage: 9, hits: 2 },
      { kind: "buff", strength: 2 },
    ],
  },
  flock: {
    id: "flock",
    name: "飢えた翼",
    ...clip("byakhee"),
    maxHp: 52,
    pattern: [
      { kind: "attack", damage: 5, hits: 3 },
      { kind: "debuff", weak: 2 },
      { kind: "attack", damage: 11 },
      { kind: "attack", damage: 4, hits: 3 },
    ],
  },
  warden: {
    id: "warden",
    name: "曲がる幾何の番",
    ...clip("warden"),
    maxHp: 108,
    trait: "liar",
    pattern: [
      { kind: "attack", damage: 16 },
      { kind: "defend", block: 14 },
      { kind: "debuff", weak: 2 },
      { kind: "attack", damage: 8, hits: 2 },
      { kind: "buff", strength: 2 },
    ],
  },
  bell: {
    id: "bell",
    name: "溺れた街の鐘",
    ...clip("bell"),
    maxHp: 118,
    trait: "bell",
    pattern: [
      { kind: "attack", damage: 15 },
      { kind: "debuff", dread: 1 },
      { kind: "attack", damage: 7, hits: 2 },
      { kind: "buff", strength: 2 },
      { kind: "attack", damage: 20 },
    ],
  },
  nyar: {
    id: "nyar",
    name: "門番ナイアルラト",
    ...clip("nyar"),
    maxHp: 124,
    trait: "seal",
    pattern: [
      { kind: "debuff", seal: "attack", weak: 1 },
      { kind: "attack", damage: 16 },
      { kind: "debuff", seal: "skill" },
      { kind: "attack", damage: 9, hits: 2 },
      { kind: "buff", strength: 3 },
    ],
  },
  iha: {
    id: "iha",
    name: "緑の腐肉、イハ",
    ...clip("iha"),
    maxHp: 96,
    trait: "split",
    pattern: [
      { kind: "attack", damage: 14 },
      { kind: "defend", block: 10 },
      { kind: "attack", damage: 8, hits: 2 },
      { kind: "debuff", dread: 1 },
      { kind: "buff", strength: 2 },
    ],
  },
  herald: {
    id: "herald",
    name: "呼び声の使徒",
    ...clip("herald"),
    maxHp: 214,
    pattern: [
      { kind: "debuff", dread: 1, weak: 2 },
      { kind: "attack", damage: 16, hits: 2 },
      { kind: "buff", strength: 3 },
      { kind: "attack", damage: 24 },
      { kind: "defend", block: 18 },
    ],
  },
  mouth: {
    id: "mouth",
    name: "口そのもの",
    ...clip("mouth"),
    maxHp: 268,
    pattern: [
      { kind: "debuff", dread: 2 },
      { kind: "attack", damage: 12, hits: 3 },
      { kind: "buff", strength: 4 },
      { kind: "attack", damage: 28 },
      { kind: "attack", damage: 18, hits: 2 },
    ],
  },
};

export function getEnemy(id: string): EnemyDef {
  const e = ENEMIES[id];
  if (!e) throw new Error(`Unknown enemy ${id}`);
  return e;
}