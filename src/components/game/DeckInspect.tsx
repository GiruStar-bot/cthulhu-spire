import { CardView } from "@/components/game/CardView";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelWindow } from "@/components/ui/PixelWindow";
import { useGame } from "@/game/store";

export function DeckInspect() {
  const open = useGame((s) => s.inspectDeck);
  const set = useGame((s) => s.setInspectDeck);
  const deck = useGame((s) => s.deck);
  const scene = useGame((s) => s.scene);
  if (scene === "title" || scene === "prepare" || scene === "prologue") return null;

  return (
    <>
      <PixelButton
        className="fixed bottom-4 left-4 z-30 min-h-11 px-3 py-2 text-sm"
        onClick={() => set(true)}
        aria-label="デッキを見る"
      >
        デッキ
      </PixelButton>
      {open ? (
        <div className="absolute inset-0 z-40 flex flex-col bg-black/90 px-4 py-8">
          <PixelWindow className="flex min-h-0 flex-1 flex-col">
            <p className="text-xs tracking-widest text-accent">デッキ {deck.length}枚</p>
            <div className="mt-4 flex min-h-0 flex-1 flex-wrap content-start gap-2 overflow-y-auto">
              {deck.map((c) => (
                <CardView key={c.uid} card={c} compact />
              ))}
            </div>
            <PixelButton className="mt-4 w-fit" onClick={() => set(false)}>
              閉じる
            </PixelButton>
          </PixelWindow>
        </div>
      ) : null}
    </>
  );
}
