import type { EnemyDef } from "./types";
import { asset } from "@/lib/asset";

export const ENEMIES: Record<string, EnemyDef> = {
  acolyte: {
    id: "acolyte",
    name: "侍祭",
    art: asset("art/acolyte.jpg"),
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
    art: asset("art/deepone.jpg"),
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
    art: asset("art/byakhee.jpg"),
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
    art: asset("art/deepone.jpg"),
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
  herald: {
    id: "herald",
    name: "呼び声の使徒",
    art: asset("art/boss.jpg"),
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
    art: asset("art/title.jpg"),
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
