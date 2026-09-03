import { aiCardPool, aiCardPoolFrom } from "./cards";
import { getEnemy } from "./enemies";
import { pick, weightedPick } from "./rng";
import type { CardDef, Effect, Intent } from "./types";

export const AI_CATEGORY_WEIGHTS: Record<"attack" | "defense" | "effect", number> = {
  attack: 0.45,
  defense: 0.35,
  effect: 0.2,
};

export function rollEnemyCard(defId: string, rand: () => number): CardDef {
  const def = getEnemy(defId);
  const pools: Record<"attack" | "defense" | "effect", CardDef[]> = def.deck
    ? {
        attack: aiCardPoolFrom(def.deck, "attack"),
        defense: aiCardPoolFrom(def.deck, "defense"),
        effect: aiCardPoolFrom(def.deck, "effect"),
      }
    : {
        attack: aiCardPool("attack"),
        defense: aiCardPool("defense"),
        effect: aiCardPool("effect"),
      };

  const activeWeights = Object.fromEntries(
    (Object.entries(AI_CATEGORY_WEIGHTS) as ["attack" | "defense" | "effect", number][]).filter(
      ([tag]) => pools[tag].length > 0,
    ),
  ) as Record<"attack" | "defense" | "effect", number>;

  if (!Object.keys(activeWeights).length) return pick(aiCardPool("attack"), rand);
  const category = weightedPick(activeWeights, rand);
  return pick(pools[category], rand);
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
      if (eff.t === "vulnerable") {
        intent.vulnerable = (intent.vulnerable ?? 0) + eff.n;
        if (intent.kind === "unknown") intent.kind = "debuff";
      }
      if (eff.t === "poison") {
        intent.poison = (intent.poison ?? 0) + eff.n;
        if (intent.kind === "unknown") intent.kind = "debuff";
      }
      if (eff.t === "addDread") {
        intent.dread = (intent.dread ?? 0) + eff.n;
        if (intent.kind === "unknown") intent.kind = "debuff";
      }
      if (eff.t === "sanity" && eff.n < 0) {
        intent.sanityDrain = (intent.sanityDrain ?? 0) + Math.abs(eff.n);
        if (intent.kind === "unknown") intent.kind = "debuff";
      }
    }
  };
  scan(card.effects);
  if (intent.kind === "unknown") intent.kind = "buff";
  return intent;
}
