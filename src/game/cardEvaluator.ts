import { CARDS, cardCost, cardEffects, makeCard } from "./cards";
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
  const deck = col.decks[col.activeDeck] ?? {};
  const result: CardInst[] = [];
  for (const [cardId, count] of Object.entries(deck)) {
    if (!CARDS[cardId]) continue;
    for (let i = 0; i < count; i++) result.push(makeCard(cardId));
  }
  return result;
}

export function loadoutError(): string | null {
  const col = useCollectionStore.getState();
  const deck = col.decks[col.activeDeck] ?? {};
  const n = Object.values(deck).reduce((a, b) => a + b, 0);
  if (n <= 0) return "デッキが空です。デッキ編成でカードを組んでください。";
  if (n < MIN_RUN_DECK) return `デッキが${MIN_RUN_DECK}枚未満です（現在 ${n}）。`;
  return null;
}
