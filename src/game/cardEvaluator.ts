import { cardCost, cardEffects, makeCard } from "./cards";
import { peekRune, useCollectionStore, type CardInstance } from "@/store/useCollectionStore";
import type { CardInst, CombatState, Effect, PlayerProfile, RelicInstance } from "./types";

export const MIN_RUN_DECK = 10;

export type EvaluatedCard = {
  cost: number;
  effects: Effect[];
};

export function snapshotRunes(ci: CardInstance): { socketedRunes: string[]; runeMods: CardInst["runeMods"] } {
  const socketedRunes = ci.socketedRunes.filter(Boolean);
  const runeMods = {
    costDelta: 0,
    damage: 0,
    block: 0,
    extra: [] as Effect[],
  };
  for (const id of socketedRunes) {
    const r = peekRune(id);
    if (!r) continue;
    switch (r.effect) {
      case "ATK+":
        runeMods.damage += r.value;
        break;
      case "BLK+":
        runeMods.block += r.value;
        break;
      case "COST-":
        runeMods.costDelta += r.value;
        break;
      case "DRAW":
        runeMods.extra.push({ t: "draw", n: r.value });
        break;
      case "SAN+":
        runeMods.extra.push({ t: "sanity", n: r.value });
        break;
      case "STR+":
        runeMods.extra.push({ t: "strength", n: r.value });
        break;
      case "POISON":
        runeMods.extra.push({ t: "poison", n: r.value });
        break;
      case "HEAL":
        runeMods.extra.push({ t: "heal", n: r.value });
        break;
      default:
        break;
    }
  }
  return { socketedRunes, runeMods };
}

export function instFromLoadout(ci: CardInstance): CardInst {
  const card = makeCard(ci.baseCardId);
  const snap = snapshotRunes(ci);
  card.socketedRunes = snap.socketedRunes;
  card.runeMods = snap.runeMods;
  return card;
}

export function applyRuneMods(card: CardInst, effects: Effect[]): Effect[] {
  const mods = card.runeMods;
  if (!mods) return effects;
  const bumped = effects.map((e) => {
    if ((e.t === "damage" || e.t === "damageAll") && mods.damage) return { ...e, n: e.n + mods.damage };
    if ((e.t === "block" || e.t === "blockPerEnemy") && mods.block) return { ...e, n: e.n + mods.block };
    return e;
  });
  if (!mods.damage && !mods.block && !mods.extra.length) return effects;
  const extra = [...mods.extra];
  if (mods.damage && !effects.some((e) => e.t === "damage" || e.t === "damageAll" || e.t === "damageX")) {
    extra.unshift({ t: "damage", n: mods.damage });
  }
  if (mods.block && !effects.some((e) => e.t === "block" || e.t === "blockPerEnemy")) {
    extra.unshift({ t: "block", n: mods.block });
  }
  return extra.length ? [...bumped, ...extra] : bumped;
}

export function evaluateCardEffect(card: CardInst, _combat: CombatState | null = null): EvaluatedCard {
  return { cost: cardCost(card), effects: cardEffects(card) };
}

export function loadoutDeck(): CardInst[] {
  const col = useCollectionStore.getState();
  return col.deck
    .map((id) => col.inventory.cards.find((c) => c.instanceId === id))
    .filter((c): c is CardInstance => !!c)
    .map(instFromLoadout);
}

export function equippedRelics(profile: PlayerProfile): RelicInstance[] {
  const byUid = new Map(profile.collection.map((r) => [r.uid, r]));
  return profile.loadoutIds
    .map((uid) => byUid.get(uid))
    .filter((r): r is RelicInstance => !!r);
}

export function loadoutError(): string | null {
  const n = useCollectionStore.getState().deck.length;
  if (n <= 0) return "デッキが空です。装備でカードを組んでください。";
  if (n < MIN_RUN_DECK) return `デッキが${MIN_RUN_DECK}枚未満です（現在 ${n}）。`;
  return null;
}
