import { nextDeckName } from "@/components/loadout/DeckBuilderScreen";
import { PixelButton } from "@/components/ui/PixelButton";
import { ARCHETYPE_LABELS, DECK_LIMIT, getCard } from "@/game/cards";
import type { Archetype } from "@/game/types";
import { cn } from "@/lib/utils";
import { deckSize, useCollectionStore, type DeckCounts } from "@/store/useCollectionStore";

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
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b-2 border-border bg-ink-2 px-3">
        <PixelButton onClick={onBack} className="min-h-9 shrink-0 px-3 py-1 text-xs">
          ← 戻る
        </PixelButton>
        <h1 className="text-sm tracking-widest text-white">デッキ編成</h1>
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

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {names.length === 0 ? (
          <p className="py-10 text-center text-xs text-muted">デッキがありません。</p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-3">
            {names.map((name) => {
              const counts = decks[name] ?? {};
              const total = deckSize(counts);
              const top = topArchetypeOfCounts(counts);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => onEditDeck(name)}
                  className="panel flex flex-col items-start gap-2 p-3 text-left transition-transform duration-(--motion-fast) ease-(--ease-smooth-out) hover:-translate-y-0.5"
                >
                  <p className="text-sm text-white">{name}</p>
                  <p className={cn("text-xs tabular-nums", total >= DECK_LIMIT ? "text-blood" : "text-accent")}>
                    {total}/{DECK_LIMIT}枚
                  </p>
                  <p className="text-[10px] text-muted">
                    {top ? `${ARCHETYPE_LABELS[top.archetype] ?? top.archetype} ${top.count}枚` : "ジャンルの偏りなし"}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
