import { asset } from "@/lib/asset";

const FILES: Record<string, string> = {
  "ATK+": "atk",
  "BLK+": "blk",
  DRAW: "draw",
  "COST-": "cost",
  "SAN+": "san",
  "STR+": "str",
  POISON: "poison",
  HEAL: "heal",
};

export function runeArt(effect: string): string | null {
  const id = FILES[effect];
  return id ? asset(`art/pixel/runes/${id}.jpg`) : null;
}
