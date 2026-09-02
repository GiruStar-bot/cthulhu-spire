import { asset } from "@/lib/asset";

const FILES: Record<string, string> = {
  "ATK+": "atk.png",
  "BLK+": "blk.png",
  DRAW: "draw.png",
  "COST-": "cost.png",
  "SAN+": "san.png",
  "STR+": "str.png",
  POISON: "poison.png",
  HEAL: "heal.png",
};

export function runeArt(effect: string): string | null {
  const file = FILES[effect];
  return file ? asset(`art/pixel/runes/${file}`) : null;
}
