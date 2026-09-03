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

export type DeckCounts = Record<string, number>;

export const COPY_LIMIT = 4;
const DEFAULT_DECK = "デッキ1";

type Inventory = {
  cards: CardInstance[];
  runes: Rune[];
  equipment: EquipmentInstance[];
};

type CollectionState = {
  inventory: Inventory;
  decks: Record<string, DeckCounts>;
  activeDeck: string;
  runeRegistry: Record<string, Rune>;
  createDeck: (name: string) => boolean;
  deleteDeck: (name: string) => void;
  renameDeck: (oldName: string, newName: string) => boolean;
  setActiveDeck: (name: string) => void;
  addToDeck: (cardId: string) => boolean;
  removeFromDeck: (cardId: string) => void;
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

function seedInventory(): {
  cards: CardInstance[];
  runes: Rune[];
  equipment: EquipmentInstance[];
  runeRegistry: Record<string, Rune>;
} {
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

export function peekRune(id: string): Rune | undefined {
  return useCollectionStore.getState().runeRegistry[id];
}

export function copiesOfBase(deck: DeckCounts, baseCardId: string): number {
  return deck[baseCardId] ?? 0;
}

export function deckSize(deck: DeckCounts): number {
  return Object.values(deck).reduce((a, b) => a + b, 0);
}

function countsFromLegacyDeck(
  deck: string[] | undefined,
  cards: CardInstance[],
): DeckCounts {
  if (!Array.isArray(deck) || !deck.length) return {};
  const byId = new Map(cards.map((c) => [c.instanceId, c.baseCardId]));
  const counts: DeckCounts = {};
  for (const id of deck) {
    const base = byId.get(id);
    if (!base) continue;
    counts[base] = (counts[base] ?? 0) + 1;
  }
  return counts;
}

const seeded = seedInventory();

export const useCollectionStore = create<CollectionState>()(
  persist(
    (set, get) => ({
      inventory: { cards: seeded.cards, runes: seeded.runes, equipment: seeded.equipment },
      decks: { [DEFAULT_DECK]: {} },
      activeDeck: DEFAULT_DECK,
      runeRegistry: seeded.runeRegistry,

      createDeck: (name) => {
        const s = get();
        const trimmed = name.trim();
        if (!trimmed || s.decks[trimmed]) return false;
        set({ decks: { ...s.decks, [trimmed]: {} }, activeDeck: trimmed });
        return true;
      },

      deleteDeck: (name) => {
        const s = get();
        const names = Object.keys(s.decks);
        if (names.length <= 1) return;
        if (!s.decks[name]) return;
        const next = { ...s.decks };
        delete next[name];
        const nextActive = s.activeDeck === name ? Object.keys(next)[0]! : s.activeDeck;
        set({ decks: next, activeDeck: nextActive });
      },

      renameDeck: (oldName, newName) => {
        const s = get();
        const trimmed = newName.trim();
        if (!trimmed || s.decks[trimmed] || !s.decks[oldName]) return false;
        const next = { ...s.decks };
        next[trimmed] = next[oldName]!;
        delete next[oldName];
        set({ decks: next, activeDeck: s.activeDeck === oldName ? trimmed : s.activeDeck });
        return true;
      },

      setActiveDeck: (name) => {
        if (get().decks[name]) set({ activeDeck: name });
      },

      addToDeck: (cardId) => {
        const s = get();
        const deck = s.decks[s.activeDeck] ?? {};
        const total = deckSize(deck);
        const current = deck[cardId] ?? 0;
        const owned = s.inventory.cards.filter((c) => c.baseCardId === cardId).length;
        if (total >= DECK_LIMIT || current >= COPY_LIMIT || current >= owned) return false;
        set({ decks: { ...s.decks, [s.activeDeck]: { ...deck, [cardId]: current + 1 } } });
        return true;
      },

      removeFromDeck: (cardId) => {
        const s = get();
        const deck = s.decks[s.activeDeck] ?? {};
        const current = deck[cardId] ?? 0;
        if (current <= 0) return;
        const next = { ...deck };
        if (current - 1 <= 0) delete next[cardId];
        else next[cardId] = current - 1;
        set({ decks: { ...s.decks, [s.activeDeck]: next } });
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
      version: 4,
      migrate: (persisted) => {
        const s = persisted as {
          inventory?: {
            cards?: Array<CardInstance & { origin?: CardInstance["origin"] }>;
            runes?: Rune[];
            equipment?: EquipmentInstance[];
          };
          deck?: string[];
          decks?: Record<string, DeckCounts>;
          activeDeck?: string;
          runeRegistry?: Record<string, Rune>;
        };
        const cards = (s.inventory?.cards ?? []).map((c) => ({
          instanceId: c.instanceId,
          baseCardId: c.baseCardId,
          origin: c.origin ?? "starter",
        }));
        const hasNamed =
          s.decks && typeof s.decks === "object" && Object.keys(s.decks).length > 0;
        const decks = hasNamed ? s.decks! : { [DEFAULT_DECK]: countsFromLegacyDeck(s.deck, cards) };
        const activeDeck = s.activeDeck && decks[s.activeDeck] ? s.activeDeck : Object.keys(decks)[0] ?? DEFAULT_DECK;
        return {
          ...s,
          inventory: {
            cards,
            runes: s.inventory?.runes ?? [],
            equipment: s.inventory?.equipment ?? [],
          },
          decks,
          activeDeck,
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
        decks: s.decks,
        activeDeck: s.activeDeck,
        runeRegistry: s.runeRegistry,
      }),
    },
  ),
);
