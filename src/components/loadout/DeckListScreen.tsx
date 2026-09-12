import { nextDeckName } from "@/components/loadout/DeckBuilderScreen";
import { PixelButton } from "@/components/ui/PixelButton";
import { ARCHETYPE_LABELS, DECK_LIMIT, getCard } from "@/game/cards";
import type { Archetype } from "@/game/types";
import { cn } from "@/lib/utils";
import { deckSize, useCollectionStore, type DeckCounts } from "@/store/useCollectionStore";
import type { CSSProperties } from "react";

const ARCHETYPE_SEAL: Partial<Record<Archetype, string>> = {
  fanatic: "#b4544a",
  knight: "#7694a8",
  poison: "#66834f",
  outer: "#76558f",
  elder: "#ad9140",
  deep: "#4f8c88",
  offering: "#9b526b",
  shadow: "#655a8e",
};

function DeckMarks({ total }: { total: number }) {
  return (
    <span className="deck-marks" aria-label={`${total}/${DECK_LIMIT}枚`}>
      {Array.from({ length: DECK_LIMIT }, (_, index) => (
        <span key={index} className={cn("deck-mark", index < total && "is-filled")} />
      ))}
    </span>
  );
}

function topArchetypeOfCounts(counts: DeckCounts): { archetype: Archetype; count: number } | null {
  const tally = new Map<Archetype, number>();
  for (const [cardId, count] of Object.entries(counts)) {
    const def = getCard(cardId);
    if (!def.archetype || def.archetype === "generic") continue;
    tally.set(def.archetype, (tally.get(def.archetype) ?? 0) + count);
  }
  let best: { archetype: Archetype; count: number } | null = null;
  for (const [archetype, count] of tally) {
    if (!best || count > best.count) best = { archetype, count };
  }
  return best;
}

export function DeckListScreen({
  onBack,
  onEditDeck,
}: {
  onBack: () => void;
  onEditDeck: (name: string) => void;
}) {
  const decks = useCollectionStore((s) => s.decks);
  const createDeck = useCollectionStore((s) => s.createDeck);
  const names = Object.keys(decks);

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
      <header className="ritual-bar flex h-12 shrink-0 items-center justify-between gap-3 px-3">
        <span className="w-28" aria-hidden="true" />
        <h1 className="text-sm tracking-widest text-white">禁書目録</h1>
        <PixelButton
          onClick={() => {
            const name = nextDeckName(decks);
            createDeck(name);
            onEditDeck(name);
          }}
          className="min-h-9 shrink-0 px-3 py-1 text-xs"
        >
          ＋新規デッキ
        </PixelButton>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-20 md:p-6 md:pb-20">
        {names.length === 0 ? (
          <p className="py-10 text-center text-xs text-muted">デッキがありません。</p>
        ) : (
          <div className="mx-auto grid max-w-5xl grid-cols-[repeat(auto-fill,minmax(17rem,1fr))] gap-4">
            {names.map((name, index) => {
              const counts = decks[name] ?? {};
              const total = deckSize(counts);
              const top = topArchetypeOfCounts(counts);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => onEditDeck(name)}
                  className="tome-tile group min-h-32 text-left"
                  style={{ "--deck-seal": ARCHETYPE_SEAL[top?.archetype ?? "generic"] ?? "#8d8067" } as CSSProperties}
                >
                  <span className="tome-spine" aria-hidden="true" />
                  <span className="tome-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  <span className="block pl-7">
                    <span className="block text-[9px] tracking-[0.28em] text-muted">禁書記録</span>
                    <span className="mt-1 block text-base tracking-wider text-white">{name}</span>
                    <span className="mt-3 flex items-end justify-between gap-3">
                      <DeckMarks total={total} />
                      <span className={cn("shrink-0 text-xs tabular-nums", total >= DECK_LIMIT ? "text-blood" : "text-parchment")}>
                        {total}/{DECK_LIMIT}
                      </span>
                    </span>
                    <span className="mt-2 block border-t border-parchment/15 pt-1.5 text-[10px] text-muted">
                      {top ? `${ARCHETYPE_LABELS[top.archetype] ?? top.archetype}の印 · ${top.count}枚` : "印はまだ定まらない"}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <PixelButton onClick={onBack} className="absolute right-4 bottom-4 z-30 min-h-9 shrink-0 px-4 py-1 text-xs">
        戻る
      </PixelButton>
    </div>
  );
}
