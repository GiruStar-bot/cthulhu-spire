import { asset } from "@/lib/asset";
import { tierFromFloor } from "./equipment";
import { uid } from "./rng";
import type { Rune } from "./types";

const FILES: Record<string, string> = {
  "BLK+": "blk.png",
  DRAW: "draw.png",
  "SAN+": "san.png",
  "STR+": "str.png",
  POISON: "poison.png",
  HEAL: "heal.png",
};

export const RUNE_CATALOG: Omit<Rune, "id">[] = [
  { effect: "BLK+", value: 2 },
  { effect: "DRAW", value: 1 },
  { effect: "SAN+", value: 3 },
  { effect: "STR+", value: 1 },
  { effect: "POISON", value: 2 },
  { effect: "HEAL", value: 4 },
];

export function runeArt(effect: string): string | null {
  const file = FILES[effect];
  return file ? asset(`art/pixel/runes/${file}`) : null;
}

export function rollRune(effect: string, floor: number, rand: () => number): Rune {
  const base = RUNE_CATALOG.find((r) => r.effect === effect)?.value ?? 1;
  const tier = tierFromFloor(floor);
  const scaled = base + Math.floor(tier / 2);
  const roll = 1 + (rand() * 2 - 1) * 0.25;
  return { id: uid("rn"), effect, value: Math.max(1, Math.round(scaled * roll)) };
}
