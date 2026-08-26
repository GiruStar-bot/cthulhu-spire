import { asset } from "@/lib/asset";
import { getEnemy } from "./enemies";

export type BiomeId = "reef" | "street" | "mu" | "fold" | "throne";

export interface BiomeDef {
  id: BiomeId;
  name: string;
  art: string;
}

export const BIOMES: Record<BiomeId, BiomeDef> = {
  reef: { id: "reef", name: "礁の層", art: asset("art/stage-reef.jpg") },
  street: { id: "street", name: "沈んだ街", art: asset("art/stage-street.jpg") },
  mu: { id: "mu", name: "ムーの残骸", art: asset("art/stage-mu.jpg") },
  fold: { id: "fold", name: "曲がる石", art: asset("art/stage-fold.jpg") },
  throne: { id: "throne", name: "緑の広間", art: asset("art/stage-throne.jpg") },
};

const DEPTH: BiomeId[] = ["reef", "street", "mu", "fold", "throne"];

export function biomeForFloor(floor: number): BiomeId {
  if (floor >= 80) return "throne";
  if (floor >= 60) return "fold";
  if (floor >= 40) return "mu";
  if (floor >= 20) return "street";
  return "reef";
}

export function biomeForEncounter(enemyIds: string[], floor: number): BiomeId {
  let best: BiomeId | null = null;
  let bestD = -1;
  for (const id of enemyIds) {
    try {
      const b = getEnemy(id).biome;
      const d = DEPTH.indexOf(b);
      if (d > bestD) {
        best = b;
        bestD = d;
      }
    } catch {
      /* unknown id */
    }
  }
  return best ?? biomeForFloor(floor);
}

export function biomeArt(id: BiomeId) {
  return BIOMES[id].art;
}

export function biomeName(id: BiomeId) {
  return BIOMES[id].name;
}
