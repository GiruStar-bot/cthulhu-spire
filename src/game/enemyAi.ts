import { aiCardPool } from "./cards";
import { pick, weightedPick } from "./rng";
import type { CardDef, Effect, Intent } from "./types";

export const AI_CATEGORY_WEIGHTS: Record<"attack" | "defense" | "effect", number> = {
  attack: 0.45,
  defense: 0.35,
  effect: 0.2,
};

export function rollEnemyCard(rand: () => number): CardDef {
  const category = weightedPick(AI_CATEGORY_WEIGHTS, rand);
  const pool = aiCardPool(category);
  if (pool.length) return pick(pool, rand);
  const fallback = aiCardPool("attack");
  return pick(fallback, rand);
}

export function cardToIntent(card: CardDef): Intent {
  const intent: Intent = { kind: "unknown" };
  const scan = (effects: Effect[]) => {
    for (const eff of effects) {
      if (eff.t === "damage" || eff.t === "damageAll" || eff.t === "damageX") {
        intent.kind = "attack";
        intent.damage = (intent.damage ?? 0) + eff.n;
      }
      if (eff.t === "block" || eff.t === "blockPerEnemy") {
        if (intent.kind !== "attack") intent.kind = "defend";
        intent.block = (intent.block ?? 0) + eff.n;
      }
      if (eff.t === "strength") {
        intent.strength = (intent.strength ?? 0) + eff.n;
        if (intent.kind === "unknown") intent.kind = "buff";
      }
      if (eff.t === "weak") {
        intent.weak = (intent.weak ?? 0) + eff.n;
        if (intent.kind === "unknown") intent.kind = "debuff";
      }
      if (eff.t === "addDread") {
        intent.dread = (intent.dread ?? 0) + eff.n;
        if (intent.kind === "unknown") intent.kind = "debuff";
      }
    }
  };
  scan(card.effects);
  if (intent.kind === "unknown") intent.kind = "buff";
  return intent;
}
