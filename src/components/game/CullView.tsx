import { CardView } from "@/components/game/CardView";
import { DECK_LIMIT } from "@/game/cards";
import { useGame } from "@/game/store";
import { useState } from "react";

export function CullView() {
  const deck = useGame((s) => s.deck);
  const discard = useGame((s) => s.discardFromDeck);
  const [picked, setPicked] = useState<string | null>(null);

  return (
    <section className="relative min-h-dvh overflow-hidden bg-ink px-4 py-8 sm:px-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-5">
        <p className="font-mono text-xs tracking-widest text-accent">所持 {deck.length} / {DECK_LIMIT}</p>
        <h2 className="font-display text-3xl text-balance text-parchment">カードを1枚放棄してください</h2>
        <p className="max-w-lg text-sm text-pretty text-muted">
          デッキは{DECK_LIMIT}枚まで。一覧から捨てるカードを選び、「捨てる」で次の層へ沈む。「戻る」で選びなおす。
        </p>
        <div className="flex flex-wrap gap-3">
          {deck.map((c) => (
            <CardView
              key={c.uid}
              card={c}
              compact
              playable
              selected={picked === c.uid}
              onClick={() => setPicked(c.uid)}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={!picked}
            onClick={() => picked && discard(picked)}
            className="min-h-11 rounded-[var(--radius-md)] bg-parchment px-6 py-3 font-display text-ink disabled:opacity-40"
          >
            捨てる
          </button>
          <button
            type="button"
            onClick={() => setPicked(null)}
            className="min-h-11 px-6 py-3 font-display text-muted"
          >
            戻る
          </button>
        </div>
      </div>
    </section>
  );
}
