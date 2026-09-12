import { PackOpenSequence } from "@/components/game/PackOpenSequence";
import { PixelWindow } from "@/components/ui/PixelWindow";
import { ARCHETYPE_LABELS } from "@/game/cards";
import { PACK_TICKET_ARCHETYPES, packTicketArt } from "@/game/packTickets";
import { useGame } from "@/game/store";
import type { PackTicketArchetype } from "@/game/types";
import { asset } from "@/lib/asset";
import { PixelButton } from "@/components/ui/PixelButton";
import { useCollectionStore } from "@/store/useCollectionStore";
import { useState } from "react";

export function PackShopScreen({ onBack }: { onBack: () => void }) {
  const packTickets = useCollectionStore((s) => s.packTickets ?? {});
  const lastPackResult = useGame((s) => s.lastPackResult);
  const openArchetypePack = useGame((s) => s.openArchetypePack);
  const clearPackResult = useGame((s) => s.clearPackResult);
  const [purchasedArchetype, setPurchasedArchetype] = useState<PackTicketArchetype | null>(null);

  const backButton = (
    <PixelButton onClick={onBack} className="fixed top-3 left-3 z-30 min-h-9 px-3 py-1 text-xs">
      ← 戻る
    </PixelButton>
  );

  if (lastPackResult) {
    return (
      <div className="relative flex h-full min-h-0 flex-col overflow-y-auto p-3">
        {backButton}
        <div className="min-h-0 flex-1">
          <PackOpenSequence
            cardIds={lastPackResult}
            packArt={purchasedArchetype ? asset(`art/pixel/packs/pack_${purchasedArchetype}.png`) : undefined}
            onClose={() => {
              clearPackResult();
              setPurchasedArchetype(null);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-y-auto p-3">
      {backButton}
      <PixelWindow className="mt-10 mb-3">
        <p className="text-xs tracking-widest text-muted">CARD PACKS</p>
        <h2 className="mt-1 text-xl text-white">カードパック</h2>
        <p className="mt-1 text-xs text-muted">探索で持ち帰った属性チケットを消費して開封する。</p>
      </PixelWindow>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-3">
        {PACK_TICKET_ARCHETYPES.map((archetype) => {
          const label = ARCHETYPE_LABELS[archetype] ?? archetype;
          const ticketCount = packTickets[archetype] ?? 0;
          return (
            <div key={archetype} className="pack-tome flex flex-col items-center gap-2 p-2 text-center">
              <img
                src={asset(`art/pixel/packs/pack_${archetype}.png`)}
                alt=""
                className="w-full object-contain"
              />
              <p className="text-sm text-white">{label}パック</p>
              <p className="text-[10px] text-muted">4枚中2枚が{label}確定</p>
              <div className="panel-iron flex w-full items-center justify-center gap-2 px-2 py-1">
                <img src={asset(packTicketArt(archetype))} alt="" className="size-8 object-contain" />
                <span className="text-xs tabular-nums text-white">所持 {ticketCount}</span>
              </div>
              <PixelButton
                disabled={ticketCount < 1}
                onClick={() => {
                  setPurchasedArchetype(archetype);
                  openArchetypePack(archetype);
                }}
                className="mt-1 min-h-9 w-full px-2 py-1 text-xs"
              >
                開封 · チケット1枚
              </PixelButton>
            </div>
          );
        })}
      </div>
    </div>
  );
}
