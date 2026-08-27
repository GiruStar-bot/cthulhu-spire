import { CardView } from "@/components/game/CardView";
import { useGame } from "@/game/store";

export function DeckInspect() {
  const open = useGame((s) => s.inspectDeck);
  const set = useGame((s) => s.setInspectDeck);
  const deck = useGame((s) => s.deck);
  const scene = useGame((s) => s.scene);
  if (scene === "title" || scene === "prepare" || scene === "prologue") return null;

  return (
    <>
      <button
        type="button"
        className="deck-fab"
        onClick={() => set(true)}
        aria-label="デッキを見る"
      >
        デッキ
      </button>
      {open ? (
        <div className="absolute inset-0 z-40 flex flex-col bg-ink/85 px-4 py-8">
          <p className="font-mono text-xs tracking-widest text-accent">デッキ {deck.length}枚</p>
          <div className="mt-4 flex min-h-0 flex-1 flex-wrap content-start gap-2 overflow-y-auto">
            {deck.map((c) => (
              <CardView key={c.uid} card={c} compact />
            ))}
          </div>
          <button
            type="button"
            className="mt-4 min-h-11 self-start rounded-[var(--radius-md)] bg-parchment px-5 py-2 font-display text-ink"
            onClick={() => set(false)}
          >
            閉じる
          </button>
        </div>
      ) : null}
    </>
  );
}
