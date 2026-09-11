import { PackOpenSequence } from "@/components/game/PackOpenSequence";
import { PixelWindow } from "@/components/ui/PixelWindow";
import { ARCHETYPE_LABELS } from "@/game/cards";
import { ARCHETYPE_PACK_PRICE, useGame } from "@/game/store";
import type { Archetype } from "@/game/types";
import { asset } from "@/lib/asset";
import { PixelButton } from "@/components/ui/PixelButton";
import { useState } from "react";

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
  const [purchasedArchetype, setPurchasedArchetype] = useState<Archetype | null>(null);

  if (lastPackResult) {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-y-auto p-3">
        <PixelWindow className="mb-3 shrink-0">
          <p className="text-xs tracking-widest text-muted">CARD PACKS</p>
          <h2 className="mt-1 text-xl text-white">
            {purchasedArchetype ? `${ARCHETYPE_LABELS[purchasedArchetype] ?? purchasedArchetype}パック` : "パック"}
          </h2>
        </PixelWindow>
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
            <div key={archetype} className="panel flex flex-col items-center gap-2 p-2 text-center">
              <img
                src={asset(`art/pixel/packs/pack_${archetype}.png`)}
                alt=""
                className="w-full object-contain"
              />
              <p className="text-sm text-white">{label}パック</p>
              <p className="text-[10px] text-muted">4枚中2枚が{label}確定</p>
              <PixelButton
                disabled={shells < ARCHETYPE_PACK_PRICE}
                onClick={() => {
                  setPurchasedArchetype(archetype);
                  buyArchetypePack(archetype);
                }}
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
