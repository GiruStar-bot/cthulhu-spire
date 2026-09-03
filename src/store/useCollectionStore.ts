import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { CARDS, DECK_LIMIT } from "@/game/cards";
import { RUNE_CATALOG } from "@/game/runes";
import { uid } from "@/game/rng";
import type { EquipmentInstance, Rune } from "@/game/types";

export type { Rune } from "@/game/types";

export type CardInstance = {
  instanceId: string;
  baseCardId: string;
  origin: "starter" | "loot";
};

export const COPY_LIMIT = 4;

type Inventory = {
  cards: CardInstance[];
  runes: Rune[];
  equipment: EquipmentInstance[];
};

type CollectionState = {
  inventory: Inventory;
  deck: string[];
  runeRegistry: Record<string, Rune>;
  addToDeck: (instanceId: string) => boolean;
  removeFromDeck: (instanceId: string) => void;
  addLootCard: (baseCardId: string) => void;
  addLootRune: (rune: Rune) => void;
  addLootEquipment: (equipment: EquipmentInstance) => void;
  socketRuneToEquipment: (equipmentUid: string, runeId: string, socketIndex: number) => boolean;
  unsocketRuneFromEquipment: (equipmentUid: string, socketIndex: number) => boolean;
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

function seedInventory(): { cards: CardInstance[]; runes: Rune[]; equipment: EquipmentInstance[]; runeRegistry: Record<string, Rune> } {
  const cards: CardInstance[] = [];
  for (const { id, count } of STARTER_CARDS) {
    if (!CARDS[id]) throw new Error(`unknown starter card: ${id}`);
    for (let n = 0; n < count; n++) {
      cards.push({
        instanceId: uid("ci"),
        baseCardId: id,
        origin: "starter",
      });
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
  return { cards, runes, equipment: [], runeRegistry };
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
      inventory: { cards: seeded.cards, runes: seeded.runes, equipment: seeded.equipment },
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
          const card: CardInstance = {
            instanceId: uid("ci"),
            baseCardId,
            origin: "loot",
          };
          return { inventory: { ...s.inventory, cards: [...s.inventory.cards, card] } };
        });
      },

      addLootRune: (rune) => {
        set((s) => ({
          inventory: { ...s.inventory, runes: [...s.inventory.runes, rune] },
          runeRegistry: { ...s.runeRegistry, [rune.id]: rune },
        }));
      },

      addLootEquipment: (equipment) => {
        set((s) => {
          if (s.inventory.equipment.some((e) => e.uid === equipment.uid)) return s;
          return { inventory: { ...s.inventory, equipment: [...s.inventory.equipment, equipment] } };
        });
      },

      socketRuneToEquipment: (equipmentUid, runeId, socketIndex) => {
        const s = get();
        const gear = s.inventory.equipment.find((e) => e.uid === equipmentUid);
        const rune = s.inventory.runes.find((r) => r.id === runeId);
        if (!gear || !rune) return false;
        if (socketIndex < 0 || socketIndex >= gear.socketedRunes.length) return false;
        const filled = gear.socketedRunes.slice();
        if (filled[socketIndex]) return false;
        filled[socketIndex] = runeId;
        set({
          inventory: {
            ...s.inventory,
            equipment: s.inventory.equipment.map((e) =>
              e.uid === equipmentUid ? { ...e, socketedRunes: filled } : e,
            ),
            runes: s.inventory.runes.filter((r) => r.id !== runeId),
          },
          runeRegistry: { ...s.runeRegistry, [rune.id]: rune },
        });
        return true;
      },

      unsocketRuneFromEquipment: (equipmentUid, socketIndex) => {
        const s = get();
        const gear = s.inventory.equipment.find((e) => e.uid === equipmentUid);
        if (!gear) return false;
        if (socketIndex < 0 || socketIndex >= gear.socketedRunes.length) return false;
        const filled = gear.socketedRunes.slice();
        const runeId = filled[socketIndex];
        if (!runeId) return false;
        filled[socketIndex] = null;
        const restored = s.runeRegistry[runeId] ?? { id: runeId, effect: "BLK+", value: 2 };
        set({
          inventory: {
            ...s.inventory,
            equipment: s.inventory.equipment.map((e) =>
              e.uid === equipmentUid ? { ...e, socketedRunes: filled } : e,
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
      version: 3,
      migrate: (persisted) => {
        const s = persisted as {
          inventory?: {
            cards?: Array<CardInstance & { origin?: CardInstance["origin"] }>;
            runes?: Rune[];
            equipment?: EquipmentInstance[];
          };
          deck?: string[];
          runeRegistry?: Record<string, Rune>;
        };
        const cards = (s.inventory?.cards ?? []).map((c) => ({
          instanceId: c.instanceId,
          baseCardId: c.baseCardId,
          origin: c.origin ?? "starter",
        }));
        return {
          ...s,
          inventory: {
            cards,
            runes: s.inventory?.runes ?? [],
            equipment: s.inventory?.equipment ?? [],
          },
        };
      },
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
