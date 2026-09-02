import { create } from "zustand";
import { CARDS, DECK_LIMIT } from "@/game/cards";
import { RELICS } from "@/game/relics";
import { uid } from "@/game/rng";

export type CardInstance = {
  instanceId: string;
  baseCardId: string;
  sockets: number;
  socketedRunes: string[];
};

export type Rune = {
  id: string;
  effect: string;
  value: number;
};

export type Relic = {
  id: string;
  name: string;
};

export const COPY_LIMIT = 4;
export const RELIC_SLOTS = 6;

export const RUNE_CATALOG: Omit<Rune, "id">[] = [
  { effect: "ATK+", value: 2 },
  { effect: "BLK+", value: 2 },
  { effect: "DRAW", value: 1 },
  { effect: "COST-", value: 1 },
  { effect: "SAN+", value: 3 },
  { effect: "STR+", value: 1 },
  { effect: "POISON", value: 2 },
  { effect: "HEAL", value: 4 },
];

type Inventory = {
  cards: CardInstance[];
  runes: Rune[];
  relics: Relic[];
};

type CollectionState = {
  inventory: Inventory;
  deck: string[];
  equippedRelics: (string | null)[];
  addToDeck: (instanceId: string) => boolean;
  removeFromDeck: (instanceId: string) => void;
  equipRelic: (relicId: string, slotIndex: number) => boolean;
  unequipRelic: (slotIndex: number) => void;
  socketRune: (cardInstanceId: string, runeId: string, socketIndex: number) => boolean;
  unsocketRune: (cardInstanceId: string, socketIndex: number) => boolean;
};

const runeVault = new Map<string, Rune>();

function seedInventory(): Inventory {
  const cardIds = Object.keys(CARDS).filter((id) => CARDS[id]?.rarity !== "status");
  const cards: CardInstance[] = cardIds.map((baseCardId, i) => {
    const sockets = 1 + (i % 3);
    return {
      instanceId: uid("ci"),
      baseCardId,
      sockets,
      socketedRunes: Array.from({ length: sockets }, () => ""),
    };
  });
  const runes: Rune[] = RUNE_CATALOG.flatMap((spec) =>
    [0, 1].map(() => {
      const rune: Rune = { id: uid("rn"), effect: spec.effect, value: spec.value };
      runeVault.set(rune.id, rune);
      return rune;
    }),
  );
  const relics: Relic[] = Object.values(RELICS).map((r) => ({ id: r.id, name: r.name }));
  return { cards, runes, relics };
}

function emptySlots(): (string | null)[] {
  return Array.from({ length: RELIC_SLOTS }, () => null);
}

function cardById(cards: CardInstance[], instanceId: string) {
  return cards.find((c) => c.instanceId === instanceId);
}

function copiesInDeck(state: Pick<CollectionState, "inventory" | "deck">, baseCardId: string) {
  return state.deck.reduce((n, id) => {
    const card = cardById(state.inventory.cards, id);
    return card?.baseCardId === baseCardId ? n + 1 : n;
  }, 0);
}

export function peekRune(id: string): Rune | undefined {
  return runeVault.get(id);
}

export function copiesOfBase(deck: string[], cards: CardInstance[], baseCardId: string) {
  return deck.reduce((n, id) => {
    const card = cards.find((c) => c.instanceId === id);
    return card?.baseCardId === baseCardId ? n + 1 : n;
  }, 0);
}

export const useCollectionStore = create<CollectionState>((set, get) => ({
  inventory: seedInventory(),
  deck: [],
  equippedRelics: emptySlots(),

  addToDeck: (instanceId) => {
    const s = get();
    const card = cardById(s.inventory.cards, instanceId);
    if (!card) return false;
    if (s.deck.includes(instanceId)) return false;
    if (s.deck.length >= DECK_LIMIT) return false;
    if (copiesInDeck(s, card.baseCardId) >= COPY_LIMIT) return false;
    set({ deck: [...s.deck, instanceId] });
    return true;
  },

  removeFromDeck: (instanceId) => {
    set((s) => ({ deck: s.deck.filter((id) => id !== instanceId) }));
  },

  equipRelic: (relicId, slotIndex) => {
    const s = get();
    if (slotIndex < 0 || slotIndex >= RELIC_SLOTS) return false;
    if (!s.inventory.relics.some((r) => r.id === relicId)) return false;
    if (s.equippedRelics.includes(relicId) && s.equippedRelics[slotIndex] !== relicId) return false;
    const next = [...s.equippedRelics];
    next[slotIndex] = relicId;
    set({ equippedRelics: next });
    return true;
  },

  unequipRelic: (slotIndex) => {
    if (slotIndex < 0 || slotIndex >= RELIC_SLOTS) return;
    set((s) => {
      const next = [...s.equippedRelics];
      next[slotIndex] = null;
      return { equippedRelics: next };
    });
  },

  socketRune: (cardInstanceId, runeId, socketIndex) => {
    const s = get();
    const card = cardById(s.inventory.cards, cardInstanceId);
    const rune = s.inventory.runes.find((r) => r.id === runeId);
    if (!card || !rune) return false;
    if (socketIndex < 0 || socketIndex >= card.sockets) return false;
    const filled = card.socketedRunes.slice();
    while (filled.length < card.sockets) filled.push("");
    if (filled[socketIndex]) return false;
    filled[socketIndex] = runeId;
    runeVault.set(rune.id, rune);
    set({
      inventory: {
        ...s.inventory,
        cards: s.inventory.cards.map((c) =>
          c.instanceId === cardInstanceId ? { ...c, socketedRunes: filled } : c,
        ),
        runes: s.inventory.runes.filter((r) => r.id !== runeId),
      },
    });
    return true;
  },

  unsocketRune: (cardInstanceId, socketIndex) => {
    const s = get();
    const card = cardById(s.inventory.cards, cardInstanceId);
    if (!card) return false;
    if (socketIndex < 0 || socketIndex >= card.sockets) return false;
    const filled = card.socketedRunes.slice();
    const runeId = filled[socketIndex];
    if (!runeId) return false;
    filled[socketIndex] = "";
    const restored = runeVault.get(runeId) ?? { id: runeId, effect: "ATK+", value: 2 };
    set({
      inventory: {
        ...s.inventory,
        cards: s.inventory.cards.map((c) =>
          c.instanceId === cardInstanceId ? { ...c, socketedRunes: filled } : c,
        ),
        runes: [...s.inventory.runes, restored],
      },
    });
    return true;
  },
}));
