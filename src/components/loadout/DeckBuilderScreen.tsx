import { CollectionCard } from "@/components/loadout/CollectionCard";
import { PixelButton } from "@/components/ui/PixelButton";
import { DECK_LIMIT } from "@/game/cards";
import { cn } from "@/lib/utils";
import {
  COPY_LIMIT,
  copiesOfBase,
  deckSize,
  useCollectionStore,
  type CardInstance,
} from "@/store/useCollectionStore";
import { useEffect, useRef, useState } from "react";

type CardGroup = {
  key: string;
  baseCardId: string;
  representative: CardInstance;
};

type Flight = {
  x: number;
  y: number;
  tx: number;
  ty: number;
  armed: boolean;
  cardId: string;
};

function ownedCountOf(cards: CardInstance[], baseCardId: string): number {
  return cards.filter((c) => c.baseCardId === baseCardId).length;
}

function groupInventory(cards: CardInstance[]): CardGroup[] {
  const groups = new Map<string, CardGroup>();
  for (const card of cards) {
    if (groups.has(card.baseCardId)) continue;
    groups.set(card.baseCardId, {
      key: card.baseCardId,
      baseCardId: card.baseCardId,
      representative: card,
    });
  }
  return [...groups.values()];
}

function nextDeckName(decks: Record<string, unknown>): string {
  let n = Object.keys(decks).length + 1;
  while (decks[`デッキ${n}`]) n += 1;
  return `デッキ${n}`;
}

export function DeckBuilderScreen({ onClose, embedded = false }: { onClose?: () => void; embedded?: boolean }) {
  const inventory = useCollectionStore((s) => s.inventory);
  const decks = useCollectionStore((s) => s.decks);
  const activeDeck = useCollectionStore((s) => s.activeDeck);
  const addToDeck = useCollectionStore((s) => s.addToDeck);
  const removeFromDeck = useCollectionStore((s) => s.removeFromDeck);
  const createDeck = useCollectionStore((s) => s.createDeck);
  const deleteDeck = useCollectionStore((s) => s.deleteDeck);
  const renameDeck = useCollectionStore((s) => s.renameDeck);
  const setActiveDeck = useCollectionStore((s) => s.setActiveDeck);
  const [flight, setFlight] = useState<Flight | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState("");
  const cardRefs = useRef<Record<string, HTMLElement | null>>({});
  const deckPanelRef = useRef<HTMLDivElement>(null);

  const counts = decks[activeDeck] ?? {};
  const total = deckSize(counts);
  const names = Object.keys(decks);

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

  const handleAdd = (baseCardId: string) => {
    if (flight) return;
    const copies = copiesOfBase(counts, baseCardId);
    const owned = ownedCountOf(inventory.cards, baseCardId);
    if (total >= DECK_LIMIT || copies >= COPY_LIMIT || copies >= owned) return;
    const origin = cardRefs.current[baseCardId]?.getBoundingClientRect();
    const dest = deckPanelRef.current?.getBoundingClientRect();
    if (!origin || !dest) {
      addToDeck(baseCardId);
      return;
    }
    setFlight({
      cardId: baseCardId,
      x: origin.left + origin.width / 2,
      y: origin.top + origin.height / 2,
      tx: dest.left + dest.width / 2,
      ty: dest.top + 40,
      armed: false,
    });
    window.setTimeout(() => {
      addToDeck(baseCardId);
      setFlight(null);
    }, 220);
  };

  const groups = groupInventory(inventory.cards);
  const flying = flight ? inventory.cards.find((c) => c.baseCardId === flight.cardId) : null;
  const deckEntries = Object.entries(counts);

  const commitRename = () => {
    const ok = renameDeck(activeDeck, draftName);
    if (ok) setRenaming(false);
  };

  return (
    <section className={cn("flex w-full flex-col font-pixel text-parchment", embedded ? "h-full bg-transparent" : "h-dvh bg-ink")}>
      {embedded ? null : (
        <header className="flex h-12 shrink-0 items-center justify-between border-b-2 border-gray-200 bg-black px-3">
          <h1 className="text-sm tracking-widest">デッキ編成</h1>
          <span className={cn("text-sm tabular-nums", total >= DECK_LIMIT ? "text-blood" : "text-accent")}>
            {total}/{DECK_LIMIT}
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

      <div className="flex shrink-0 flex-wrap items-center gap-1 border-b-2 border-gray-200 bg-black px-3 py-2">
        {names.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => {
              setRenaming(false);
              setActiveDeck(name);
            }}
            className={cn(
              "border-2 px-2 py-1 text-xs",
              name === activeDeck ? "border-white bg-white text-ink" : "border-gray-200/40 text-muted",
            )}
          >
            {name}
          </button>
        ))}
        <PixelButton
          className="min-h-8 px-2 py-1 text-[10px]"
          onClick={() => {
            setRenaming(false);
            createDeck(nextDeckName(decks));
          }}
        >
          ＋新規デッキ
        </PixelButton>
        {embedded ? (
          <span className={cn("ml-auto text-xs tabular-nums", total >= DECK_LIMIT ? "text-blood" : "text-accent")}>
            {total}/{DECK_LIMIT}
          </span>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b-2 border-gray-200 px-3 py-2">
        {renaming ? (
          <>
            <input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              maxLength={12}
              className="border-2 border-white bg-black px-2 py-1 font-pixel text-xs text-white outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") setRenaming(false);
              }}
            />
            <PixelButton className="min-h-8 px-2 py-1 text-[10px]" onClick={commitRename}>
              決定
            </PixelButton>
            <PixelButton className="min-h-8 px-2 py-1 text-[10px]" onClick={() => setRenaming(false)}>
              取消
            </PixelButton>
          </>
        ) : (
          <>
            <PixelButton
              className="min-h-8 px-2 py-1 text-[10px]"
              onClick={() => {
                setDraftName(activeDeck);
                setRenaming(true);
              }}
            >
              名前変更
            </PixelButton>
            <PixelButton
              className="min-h-8 px-2 py-1 text-[10px]"
              disabled={names.length <= 1}
              onClick={() => deleteDeck(activeDeck)}
            >
              削除
            </PixelButton>
          </>
        )}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-5">
        <aside className="min-h-0 overflow-y-auto border-b-2 border-gray-200 p-3 lg:col-span-3 lg:border-r-2 lg:border-b-0">
          <p className="mb-2 text-xs tracking-widest text-muted">所持カード</p>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] justify-items-center gap-2">
            {groups.map((group) => {
              const copies = copiesOfBase(counts, group.baseCardId);
              const owned = ownedCountOf(inventory.cards, group.baseCardId);
              const remaining = Math.min(COPY_LIMIT, owned) - copies;
              const blocked = remaining <= 0 || total >= DECK_LIMIT;
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
                    copiesMax={owned}
                    stackCount={owned > 1 ? owned : undefined}
                    dim={blocked}
                    onClick={blocked ? undefined : () => handleAdd(group.baseCardId)}
                  />
                </div>
              );
            })}
          </div>
        </aside>

        <div className="flex min-h-0 flex-col lg:col-span-2">
          <section ref={deckPanelRef} className="flex min-h-0 flex-1 flex-col p-3">
            <p className="mb-2 text-xs tracking-widest text-muted">編成中 · {activeDeck}</p>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {deckEntries.length === 0 ? (
                <p className="py-10 text-center text-xs text-muted">左のカードをクリックして編成</p>
              ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] justify-items-center gap-2">
                  {deckEntries.map(([cardId, count]) => {
                    const representative =
                      inventory.cards.find((c) => c.baseCardId === cardId) ?? {
                        instanceId: cardId,
                        baseCardId: cardId,
                        origin: "starter" as const,
                      };
                    return (
                      <CollectionCard
                        key={cardId}
                        instance={representative}
                        copies={count}
                        copiesMax={ownedCountOf(inventory.cards, cardId)}
                        stackCount={count > 1 ? count : undefined}
                        onClick={() => removeFromDeck(cardId)}
                      />
                    );
                  })}
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
