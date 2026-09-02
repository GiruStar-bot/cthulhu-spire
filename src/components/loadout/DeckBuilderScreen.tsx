import { CollectionCard } from "@/components/loadout/CollectionCard";
import { DECK_LIMIT } from "@/game/cards";
import { RELICS } from "@/game/relics";
import { cn } from "@/lib/utils";
import {
  COPY_LIMIT,
  RELIC_SLOTS,
  copiesOfBase,
  useCollectionStore,
} from "@/store/useCollectionStore";
import { useEffect, useState } from "react";

export function DeckBuilderScreen({ onClose }: { onClose?: () => void }) {
  const inventory = useCollectionStore((s) => s.inventory);
  const deck = useCollectionStore((s) => s.deck);
  const equippedRelics = useCollectionStore((s) => s.equippedRelics);
  const addToDeck = useCollectionStore((s) => s.addToDeck);
  const removeFromDeck = useCollectionStore((s) => s.removeFromDeck);
  const equipRelic = useCollectionStore((s) => s.equipRelic);
  const unequipRelic = useCollectionStore((s) => s.unequipRelic);

  const [heldRelic, setHeldRelic] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const deckCards = deck
    .map((id) => inventory.cards.find((c) => c.instanceId === id))
    .filter((c): c is NonNullable<typeof c> => !!c);

  return (
    <section className="flex h-dvh w-full flex-col bg-gray-950 font-pixel text-gray-200">
      <header className="flex h-10 shrink-0 items-center justify-between border-b-2 border-white/20 bg-black px-3 text-xs tracking-widest">
        <span className="text-white">DECK BUILDER</span>
        <span className={cn("tabular-nums", deck.length >= DECK_LIMIT ? "text-amber-300" : "text-emerald-300")}>
          {deck.length}/{DECK_LIMIT}
        </span>
        {onClose ? (
          <button type="button" onClick={onClose} className="border-2 border-white px-2 py-0.5 hover:bg-white hover:text-black">
            ESC
          </button>
        ) : (
          <span />
        )}
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-5">
        <aside className="min-h-0 overflow-y-auto border-b-2 border-white/15 p-3 lg:col-span-3 lg:border-r-2 lg:border-b-0">
          <p className="mb-2 text-[10px] tracking-[0.25em] text-gray-500">CARD POOL</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {inventory.cards.map((card) => {
              const copies = copiesOfBase(deck, inventory.cards, card.baseCardId);
              const inDeck = deck.includes(card.instanceId);
              const blocked = !inDeck && (deck.length >= DECK_LIMIT || copies >= COPY_LIMIT);
              return (
                <CollectionCard
                  key={card.instanceId}
                  instance={card}
                  copies={copies}
                  inDeck={inDeck}
                  dim={blocked}
                  onClick={() => {
                    if (inDeck) {
                      removeFromDeck(card.instanceId);
                      return;
                    }
                    addToDeck(card.instanceId);
                  }}
                />
              );
            })}
          </div>
        </aside>

        <div className="flex min-h-0 flex-col lg:col-span-2">
          <section className="shrink-0 border-b-2 border-white/15 p-3">
            <p className="mb-2 text-[10px] tracking-[0.25em] text-gray-500">RELICS {equippedRelics.filter(Boolean).length}/{RELIC_SLOTS}</p>
            <div className="grid grid-cols-6 gap-1.5">
              {equippedRelics.map((id, i) => {
                const relic = id ? inventory.relics.find((r) => r.id === id) : null;
                return (
                  <button
                    key={i}
                    type="button"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const dropped = e.dataTransfer.getData("text/relic") || heldRelic;
                      if (dropped) equipRelic(dropped, i);
                      setHeldRelic(null);
                    }}
                    onClick={() => {
                      if (heldRelic) {
                        equipRelic(heldRelic, i);
                        setHeldRelic(null);
                        return;
                      }
                      if (id) unequipRelic(i);
                    }}
                    className={cn(
                      "flex aspect-square flex-col items-center justify-center border-2 bg-black p-1 text-[8px] leading-tight",
                      relic ? "border-emerald-400 text-white" : "border-dashed border-gray-600 text-gray-600",
                    )}
                  >
                    <span className="text-gray-500">{i + 1}</span>
                    <span className="mt-0.5 line-clamp-2 text-center">{relic?.name ?? "—"}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {inventory.relics.map((relic) => {
                const on = equippedRelics.includes(relic.id);
                return (
                  <button
                    key={relic.id}
                    type="button"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/relic", relic.id);
                      setHeldRelic(relic.id);
                    }}
                    onClick={() => setHeldRelic(relic.id === heldRelic ? null : relic.id)}
                    title={RELICS[relic.id]?.text}
                    className={cn(
                      "border px-1.5 py-1 text-[9px]",
                      heldRelic === relic.id ? "border-white bg-white text-black" : "border-gray-600 bg-black",
                      on && "opacity-40",
                    )}
                  >
                    {relic.name}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="flex min-h-0 flex-1 flex-col p-3">
            <p className="mb-2 text-[10px] tracking-[0.25em] text-gray-500">CURRENT DECK</p>
            <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto">
              {deckCards.map((card) => {
                const copies = copiesOfBase(deck, inventory.cards, card.baseCardId);
                return (
                  <li key={card.instanceId} className="flex items-center gap-2 border-2 border-white/20 bg-black">
                    <CollectionCard
                      instance={card}
                      size="sm"
                      copies={copies}
                      onClick={() => removeFromDeck(card.instanceId)}
                    />
                    <span className="flex-1 pr-3 text-xs text-gray-400">クリックで除外</span>
                  </li>
                );
              })}
              {deckCards.length === 0 ? (
                <li className="py-10 text-center text-xs text-gray-600">左のカードをクリックして編成</li>
              ) : null}
            </ul>
          </section>
        </div>
      </div>
    </section>
  );
}
