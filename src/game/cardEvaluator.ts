import { cardCost, cardEffects, makeCard } from "./cards";
import { useCollectionStore, type CardInstance } from "@/store/useCollectionStore";
import type { CardInst, CombatState } from "./types";

export const MIN_RUN_DECK = 10;

export type EvaluatedCard = {
  cost: number;
  effects: ReturnType<typeof cardEffects>;
};

export function instFromLoadout(ci: CardInstance): CardInst {
  return makeCard(ci.baseCardId);
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

export function loadoutError(): string | null {
  const n = useCollectionStore.getState().deck.length;
  if (n <= 0) return "デッキが空です。装備でカードを組んでください。";
  if (n < MIN_RUN_DECK) return `デッキが${MIN_RUN_DECK}枚未満です（現在 ${n}）。`;
  return null;
}
