import { CardView } from "@/components/game/CardView";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelWindow } from "@/components/ui/PixelWindow";
import { makeCard } from "@/game/cards";
import { CARD_PACK_PRICE, useGame } from "@/game/store";

export function ShopPanel() {
  const shells = useGame((s) => s.profile.shells);
  const lastPackResult = useGame((s) => s.lastPackResult);
  const buyCardPack = useGame((s) => s.buyCardPack);
  const clearPackResult = useGame((s) => s.clearPackResult);

  if (lastPackResult) {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-y-auto p-3">
        <PixelWindow className="mb-3">
          <p className="text-xs tracking-widest text-muted">SHOP</p>
          <h2 className="mt-1 text-xl text-white">通常パックを開封した</h2>
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
        <p className="text-xs tracking-widest text-muted">SHOP</p>
        <h2 className="mt-1 text-xl text-white">ショップ</h2>
        <p className="mt-1 text-xs text-muted">貝殻 {shells}</p>
      </PixelWindow>

      <div className="panel flex flex-wrap items-center gap-3 p-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-white">通常パック</p>
          <p className="mt-1 text-xs text-muted">カードを4枚引く。所持数が少ないカードほど出やすい。</p>
        </div>
        <PixelButton
          disabled={shells < CARD_PACK_PRICE}
          onClick={buyCardPack}
          className="min-h-9 shrink-0 px-3 py-1 text-xs"
        >
          購入 · 貝殻{CARD_PACK_PRICE}
        </PixelButton>
      </div>
    </div>
  );
}
