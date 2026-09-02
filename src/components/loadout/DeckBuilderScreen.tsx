import { CollectionCard } from "@/components/loadout/CollectionCard";
import { PixelRelic } from "@/components/loadout/PixelRelic";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelWindow } from "@/components/ui/PixelWindow";
import { DECK_LIMIT } from "@/game/cards";
import { MAX_LOADOUT } from "@/game/profile";
import { relicDesc, relicLabel } from "@/game/relics";
import { useGame } from "@/game/store";
import { cn } from "@/lib/utils";
import { COPY_LIMIT, copiesOfBase, useCollectionStore } from "@/store/useCollectionStore";
import { useEffect } from "react";

export function DeckBuilderScreen({ onClose, embedded = false }: { onClose?: () => void; embedded?: boolean }) {
  const inventory = useCollectionStore((s) => s.inventory);
  const deck = useCollectionStore((s) => s.deck);
  const addToDeck = useCollectionStore((s) => s.addToDeck);
  const removeFromDeck = useCollectionStore((s) => s.removeFromDeck);
  const profile = useGame((s) => s.profile);
  const toggleLoadout = useGame((s) => s.toggleLoadout);

  useEffect(() => {
    if (embedded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, embedded]);

  const deckCards = deck
    .map((id) => inventory.cards.find((c) => c.instanceId === id))
    .filter((c): c is NonNullable<typeof c> => !!c);

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
          <PixelWindow className="shrink-0 rounded-none border-0 border-b-2 border-gray-200">
            <p className="mb-2 text-xs tracking-widest text-muted">
              持込遺物 {profile.loadoutIds.length}/{MAX_LOADOUT}
            </p>
            <div className="grid grid-cols-6 gap-1">
              {Array.from({ length: MAX_LOADOUT }, (_, i) => {
                const uid = profile.loadoutIds[i];
                const relic = uid ? profile.collection.find((r) => r.uid === uid) : null;
                return (
                  <button
                    key={uid ?? `empty-${i}`}
                    type="button"
                    onClick={() => {
                      if (relic) toggleLoadout(relic.uid);
                    }}
                    title={relic ? relicDesc(relic) : "空"}
                    className={cn(
                      "flex aspect-square flex-col items-center justify-center rounded-none border-2 bg-black p-1 text-[8px] leading-tight shadow-[2px_2px_0_0_#000]",
                      relic ? "border-white text-white" : "border-gray-200/40 text-muted",
                    )}
                  >
                    {relic ? <PixelRelic defId={relic.defId} className="size-8" /> : <span>{i + 1}</span>}
                    <span className="mt-0.5 line-clamp-2 text-center">{relic ? relicLabel(relic) : "空"}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {profile.collection.length === 0 ? (
                <p className="text-[9px] text-muted">魂に刻んだ遺物はまだない。潜航前点検でも選べる。</p>
              ) : (
                profile.collection.map((relic) => {
                  const on = profile.loadoutIds.includes(relic.uid);
                  return (
                    <PixelButton
                      key={relic.uid}
                      onClick={() => toggleLoadout(relic.uid)}
                      title={relicDesc(relic)}
                      className={cn(
                        "flex min-h-8 items-center gap-1 px-2 py-1 text-[9px]",
                        on && "bg-white text-black",
                      )}
                    >
                      <PixelRelic defId={relic.defId} className="size-5" />
                      {relicLabel(relic)}
                    </PixelButton>
                  );
                })
              )}
            </div>
          </PixelWindow>

          <section className="flex min-h-0 flex-1 flex-col p-3">
            <p className="mb-2 text-xs tracking-widest text-muted">編成中</p>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {deckCards.length === 0 ? (
                <p className="py-10 text-center text-xs text-muted">左のカードをクリックして編成</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-3">
                  {deckCards.map((card) => (
                    <CollectionCard
                      key={card.instanceId}
                      instance={card}
                      copies={copiesOfBase(deck, inventory.cards, card.baseCardId)}
                      onClick={() => removeFromDeck(card.instanceId)}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
