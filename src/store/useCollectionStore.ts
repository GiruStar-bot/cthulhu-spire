import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { CARDS, DECK_LIMIT } from "@/game/cards";
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

export const COPY_LIMIT = 4;

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
};

type CollectionState = {
  inventory: Inventory;
  deck: string[];
  runeRegistry: Record<string, Rune>;
  addToDeck: (instanceId: string) => boolean;
  removeFromDeck: (instanceId: string) => void;
  addLootCard: (baseCardId: string) => void;
  socketRune: (cardInstanceId: string, runeId: string, socketIndex: number) => boolean;
  unsocketRune: (cardInstanceId: string, socketIndex: number) => boolean;
};

const STARTER_CARDS: { id: string; count: number }[] = [
  { id: "strike", count: 4 },
  { id: "ward", count: 4 },
  { id: "study", count: 2 },
  { id: "whisper", count: 2 },
  { id: "insight", count: 2 },
  { id: "lash", count: 2 },
  { id: "dressing", count: 2 },
  { id: "sweep", count: 2 },
];

function seedInventory(): { cards: CardInstance[]; runes: Rune[]; runeRegistry: Record<string, Rune> } {
  const cards: CardInstance[] = [];
  let i = 0;
  for (const { id, count } of STARTER_CARDS) {
    if (!CARDS[id]) throw new Error(`unknown starter card: ${id}`);
    for (let n = 0; n < count; n++) {
      const sockets = 1 + (i % 3);
      cards.push({
        instanceId: uid("ci"),
        baseCardId: id,
        sockets,
        socketedRunes: Array.from({ length: sockets }, () => ""),
      });
      i++;
    }
  }
  const runeRegistry: Record<string, Rune> = {};
  const runes: Rune[] = RUNE_CATALOG.flatMap((spec) =>
    [0, 1].map(() => {
      const rune: Rune = { id: uid("rn"), effect: spec.effect, value: spec.value };
      runeRegistry[rune.id] = rune;
      return rune;
    }),
  );
  return { cards, runes, runeRegistry };
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
  return useCollectionStore.getState().runeRegistry[id];
}

export function copiesOfBase(deck: string[], cards: CardInstance[], baseCardId: string) {
  return deck.reduce((n, id) => {
    const card = cards.find((c) => c.instanceId === id);
    return card?.baseCardId === baseCardId ? n + 1 : n;
  }, 0);
}

const seeded = seedInventory();

export const useCollectionStore = create<CollectionState>()(
  persist(
    (set, get) => ({
      inventory: { cards: seeded.cards, runes: seeded.runes },
      deck: [],
      runeRegistry: seeded.runeRegistry,

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

      addLootCard: (baseCardId) => {
        if (!CARDS[baseCardId]) return;
        set((s) => {
          const sockets = 1 + (s.inventory.cards.length % 3);
          const card: CardInstance = {
            instanceId: uid("ci"),
            baseCardId,
            sockets,
            socketedRunes: Array.from({ length: sockets }, () => ""),
          };
          return { inventory: { ...s.inventory, cards: [...s.inventory.cards, card] } };
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
        set({
          inventory: {
            ...s.inventory,
            cards: s.inventory.cards.map((c) =>
              c.instanceId === cardInstanceId ? { ...c, socketedRunes: filled } : c,
            ),
            runes: s.inventory.runes.filter((r) => r.id !== runeId),
          },
          runeRegistry: { ...s.runeRegistry, [rune.id]: rune },
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
        const restored = s.runeRegistry[runeId] ?? { id: runeId, effect: "ATK+", value: 2 };
        set({
          inventory: {
            ...s.inventory,
            cards: s.inventory.cards.map((c) =>
              c.instanceId === cardInstanceId ? { ...c, socketedRunes: filled } : c,
            ),
            runes: [...s.inventory.runes, restored],
          },
          runeRegistry: { ...s.runeRegistry, [restored.id]: restored },
        });
        return true;
      },
    }),
    {
      name: "cthulhu-spire-collection-v1",
      version: 1,
      storage: createJSONStorage(() =>
        typeof window === "undefined"
          ? {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            }
          : localStorage,
      ),
      partialize: (s) => ({
        inventory: s.inventory,
        deck: s.deck,
        runeRegistry: s.runeRegistry,
      }),
    },
  ),
);
