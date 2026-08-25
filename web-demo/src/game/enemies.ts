import type { EnemyDef } from "./types";

export const ENEMIES: Record<string, EnemyDef> = {
  acolyte: {
    id: "acolyte",
    name: "侍祭",
    art: "/art/acolyte.jpg",
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
    art: "/art/deepone.jpg",
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
    art: "/art/byakhee.jpg",
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
    art: "/art/deepone.jpg",
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
    art: "/art/boss.jpg",
    maxHp: 168,
    pattern: [
      { kind: "debuff", dread: 1 },
      { kind: "attack", damage: 18 },
      { kind: "attack", damage: 9, hits: 2 },
      { kind: "buff", strength: 3 },
      { kind: "attack", damage: 22 },
    ],
  },
};

export function getEnemy(id: string): EnemyDef {
  const e = ENEMIES[id];
  if (!e) throw new Error(`Unknown enemy ${id}`);
  return e;
}
