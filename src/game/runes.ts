import { asset } from "@/lib/asset";

const FILES: Record<string, string> = {
  "ATK+": "atk.jpg",
  "BLK+": "blk.png",
  DRAW: "draw.jpg",
  "COST-": "cost.jpg",
  "SAN+": "san.jpg",
  "STR+": "str.jpg",
  POISON: "poison.jpg",
  HEAL: "heal.jpg",
};

export function runeArt(effect: string): string | null {
  const file = FILES[effect];
  return file ? asset(`art/pixel/runes/${file}`) : null;
}
