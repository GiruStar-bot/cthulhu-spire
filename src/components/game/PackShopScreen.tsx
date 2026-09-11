import { CardView } from "@/components/game/CardView";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelWindow } from "@/components/ui/PixelWindow";
import { ARCHETYPE_LABELS, makeCard } from "@/game/cards";
import { ARCHETYPE_PACK_PRICE, useGame } from "@/game/store";
import type { Archetype } from "@/game/types";

const PACK_ARCHETYPES: Archetype[] = [
  "fanatic",
  "knight",
  "poison",
  "outer",
  "elder",
  "deep",
  "offering",
  "shadow",
  "greatold",
];

export function PackShopScreen() {
  const shells = useGame((s) => s.profile.shells);
  const lastPackResult = useGame((s) => s.lastPackResult);
  const buyArchetypePack = useGame((s) => s.buyArchetypePack);
  const clearPackResult = useGame((s) => s.clearPackResult);

  if (lastPackResult) {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-y-auto p-3">
        <PixelWindow className="mb-3">
          <p className="text-xs tracking-widest text-muted">CARD PACKS</p>
          <h2 className="mt-1 text-xl text-white">パックを開封した</h2>
        </PixelWindow>
        <div className="flex flex-wrap justify-center gap-3 p-2">
          {lastPackResult.map((baseCardId, i) => (
            <div key={i} className="[&>*]:!h-64 [&>*]:!w-44 sm:[&>*]:!h-72 sm:[&>*]:!w-48">
              <CardView card={makeCard(baseCardId)} />
            </div>
          ))}
        </div>
        <PixelButton onClick={clearPackResult} className="mx-auto mt-3 min-h-9 px-4 py-1 text-xs">
          閉じる
        </PixelButton>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto p-3">
      <PixelWindow className="mb-3">
        <p className="text-xs tracking-widest text-muted">CARD PACKS</p>
        <h2 className="mt-1 text-xl text-white">カードパック</h2>
        <p className="mt-1 text-xs text-muted">貝殻 {shells}</p>
      </PixelWindow>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-3">
        {PACK_ARCHETYPES.map((archetype) => {
          const label = ARCHETYPE_LABELS[archetype] ?? archetype;
          return (
            <div key={archetype} className="panel flex flex-col items-center gap-2 p-3 text-center">
              <div className="flex size-16 items-center justify-center border-2 border-border bg-ink-2 text-2xl text-muted">
                ?
              </div>
              <p className="text-sm text-white">{label}パック</p>
              <p className="text-[10px] text-muted">4枚中2枚が{label}確定</p>
              <PixelButton
                disabled={shells < ARCHETYPE_PACK_PRICE}
                onClick={() => buyArchetypePack(archetype)}
                className="mt-1 min-h-9 w-full px-2 py-1 text-xs"
              >
                購入 · 貝殻{ARCHETYPE_PACK_PRICE}
              </PixelButton>
            </div>
          );
        })}
      </div>
    </div>
  );
}
