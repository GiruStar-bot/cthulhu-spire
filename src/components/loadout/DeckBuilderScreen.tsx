import { CollectionCard } from "@/components/loadout/CollectionCard";
import { PixelButton } from "@/components/ui/PixelButton";
import { DECK_LIMIT } from "@/game/cards";
import { cn } from "@/lib/utils";
import { COPY_LIMIT, copiesOfBase, useCollectionStore, type CardInstance } from "@/store/useCollectionStore";
import { useEffect, useRef, useState } from "react";

type CardGroup = {
  key: string;
  baseCardId: string;
  representative: CardInstance;
  instanceIds: string[];
};

type Flight = {
  x: number;
  y: number;
  tx: number;
  ty: number;
  armed: boolean;
  instanceId: string;
};

function ownedCountOf(cards: CardInstance[], baseCardId: string): number {
  return cards.filter((c) => c.baseCardId === baseCardId).length;
}

function groupInventory(cards: CardInstance[]): CardGroup[] {
  const groups = new Map<string, CardGroup>();
  for (const card of cards) {
    const key = card.baseCardId;
    const existing = groups.get(key);
    if (existing) {
      existing.instanceIds.push(card.instanceId);
    } else {
      groups.set(key, {
        key,
        baseCardId: card.baseCardId,
        representative: card,
        instanceIds: [card.instanceId],
      });
    }
  }
  return [...groups.values()];
}

export function DeckBuilderScreen({ onClose, embedded = false }: { onClose?: () => void; embedded?: boolean }) {
  const inventory = useCollectionStore((s) => s.inventory);
  const deck = useCollectionStore((s) => s.deck);
  const addToDeck = useCollectionStore((s) => s.addToDeck);
  const removeFromDeck = useCollectionStore((s) => s.removeFromDeck);
  const [flight, setFlight] = useState<Flight | null>(null);
  const cardRefs = useRef<Record<string, HTMLElement | null>>({});
  const deckPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (embedded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, embedded]);

  useEffect(() => {
    if (!flight || flight.armed) return;
    const id = requestAnimationFrame(() =>
      setFlight((f) => (f ? { ...f, armed: true, x: f.tx, y: f.ty } : f)),
    );
    return () => cancelAnimationFrame(id);
  }, [flight]);

  const handleGroupClick = (group: CardGroup) => {
    if (flight) return;
    const availableId = group.instanceIds.find((id) => !deck.includes(id));
    if (!availableId) return;
    const copies = copiesOfBase(deck, inventory.cards, group.baseCardId);
    if (deck.length >= DECK_LIMIT || copies >= COPY_LIMIT) return;
    const origin = cardRefs.current[group.key]?.getBoundingClientRect();
    const dest = deckPanelRef.current?.getBoundingClientRect();
    if (!origin || !dest) {
      addToDeck(availableId);
      return;
    }
    setFlight({
      instanceId: availableId,
      x: origin.left + origin.width / 2,
      y: origin.top + origin.height / 2,
      tx: dest.left + dest.width / 2,
      ty: dest.top + 40,
      armed: false,
    });
    window.setTimeout(() => {
      addToDeck(availableId);
      setFlight(null);
    }, 220);
  };

  const deckCards = deck
    .map((id) => inventory.cards.find((c) => c.instanceId === id))
    .filter((c): c is NonNullable<typeof c> => !!c);
  const groups = groupInventory(inventory.cards);
  const flying = flight ? inventory.cards.find((c) => c.instanceId === flight.instanceId) : null;

  return (
    <section className={cn("flex w-full flex-col font-pixel text-parchment", embedded ? "h-full bg-transparent" : "h-dvh bg-ink")}>
      {embedded ? null : (
      <header className="flex h-12 shrink-0 items-center justify-between border-b-2 border-gray-200 bg-black px-3">
        <h1 className="text-sm tracking-widest">デッキ編成</h1>
        <span className={cn("text-sm tabular-nums", deck.length >= DECK_LIMIT ? "text-blood" : "text-accent")}>
          {deck.length}/{DECK_LIMIT}
        </span>
        {onClose ? (
          <PixelButton onClick={onClose} className="min-h-9 px-3 py-1 text-xs">
            戻る
          </PixelButton>
        ) : (
          <span />
        )}
      </header>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-5">
        <aside className="min-h-0 overflow-y-auto border-b-2 border-gray-200 p-3 lg:col-span-3 lg:border-r-2 lg:border-b-0">
          <p className="mb-2 text-xs tracking-widest text-muted">所持カード</p>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] justify-items-center gap-2">
            {groups.map((group) => {
              const copies = copiesOfBase(deck, inventory.cards, group.baseCardId);
              const inDeckCount = group.instanceIds.filter((id) => deck.includes(id)).length;
              const stackCount = group.instanceIds.length;
              const remaining = stackCount - inDeckCount;
              const blocked = remaining <= 0 || deck.length >= DECK_LIMIT || copies >= COPY_LIMIT;
              return (
                <div
                  key={group.key}
                  ref={(el) => {
                    cardRefs.current[group.key] = el;
                  }}
                >
                  <CollectionCard
                    instance={group.representative}
                    copies={copies}
                    copiesMax={ownedCountOf(inventory.cards, group.baseCardId)}
                    stackCount={remaining > 1 ? remaining : undefined}
                    dim={blocked}
                    onClick={blocked ? undefined : () => handleGroupClick(group)}
                  />
                </div>
              );
            })}
          </div>
        </aside>

        <div className="flex min-h-0 flex-col lg:col-span-2">
          <section ref={deckPanelRef} className="flex min-h-0 flex-1 flex-col p-3">
            <p className="mb-2 text-xs tracking-widest text-muted">編成中</p>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {deckCards.length === 0 ? (
                <p className="py-10 text-center text-xs text-muted">左のカードをクリックして編成</p>
              ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] justify-items-center gap-2">
                  {deckCards.map((card) => (
                    <CollectionCard
                      key={card.instanceId}
                      instance={card}
                      copies={copiesOfBase(deck, inventory.cards, card.baseCardId)}
                      copiesMax={ownedCountOf(inventory.cards, card.baseCardId)}
                      onClick={() => removeFromDeck(card.instanceId)}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {flight && flying ? (
        <div
          className="pointer-events-none fixed z-50 transition-[left,top] duration-200 ease-linear"
          style={{ left: flight.x, top: flight.y, transform: "translate(-50%, -50%)" }}
        >
          <CollectionCard instance={flying} size="sm" />
        </div>
      ) : null}
    </section>
  );
}
