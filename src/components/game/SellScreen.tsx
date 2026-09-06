import { useState } from "react";
import { CardView } from "@/components/game/CardView";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelRelic } from "@/components/loadout/PixelRelic";
import { PixelRune } from "@/components/loadout/PixelRune";
import { getCard } from "@/game/cards";
import { equipmentLabel } from "@/game/equipment";
import { cardSellPrice, equipmentSellPrice, runeSellPrice } from "@/game/smith";
import { useGame } from "@/game/store";
import type { EquipmentInstance, Rune } from "@/game/types";
import { useCollectionStore, type CardInstance } from "@/store/useCollectionStore";
import { cn } from "@/lib/utils";

type Tab = "card" | "equipment" | "rune";

const TAB_LABELS: Record<Tab, string> = {
  card: "カード",
  equipment: "装備",
  rune: "ルーン",
};

function toggleInSet<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

export function SellScreen({ onClose }: { onClose: () => void }) {
  const inventory = useCollectionStore((s) => s.inventory);
  const equipped = useGame((s) => s.profile.equipped);
  const sellItems = useGame((s) => s.sellItems);
  const [tab, setTab] = useState<Tab>("card");
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());
  const [selectedEquipmentUids, setSelectedEquipmentUids] = useState<Set<string>>(new Set());
  const [selectedRuneIds, setSelectedRuneIds] = useState<Set<string>>(new Set());

  const equippedUids = new Set(
    Object.values(equipped ?? {})
      .map((e) => e?.uid)
      .filter((id): id is string => !!id),
  );
  const socketedRuneIds = new Set(
    inventory.equipment.flatMap((e) => e.socketedRunes.filter((r): r is string => !!r)),
  );

  const sellableCards: CardInstance[] = inventory.cards;
  const sellableEquipment: EquipmentInstance[] = inventory.equipment.filter(
    (e) => !equippedUids.has(e.uid),
  );
  const sellableRunes: Rune[] = inventory.runes.filter((r) => !socketedRuneIds.has(r.id));

  const totalValue =
    [...selectedCardIds].reduce((sum, id) => {
      const inst = sellableCards.find((c) => c.instanceId === id);
      return inst ? sum + cardSellPrice(getCard(inst.baseCardId)) : sum;
    }, 0) +
    [...selectedEquipmentUids].reduce((sum, uid) => {
      const inst = sellableEquipment.find((e) => e.uid === uid);
      return inst ? sum + equipmentSellPrice(inst) : sum;
    }, 0) +
    [...selectedRuneIds].reduce((sum, id) => {
      const rune = sellableRunes.find((r) => r.id === id);
      return rune ? sum + runeSellPrice(rune) : sum;
    }, 0);

  const totalSelected = selectedCardIds.size + selectedEquipmentUids.size + selectedRuneIds.size;

  const selectAll = () => {
    if (tab === "card") setSelectedCardIds(new Set(sellableCards.map((c) => c.instanceId)));
    else if (tab === "equipment") setSelectedEquipmentUids(new Set(sellableEquipment.map((e) => e.uid)));
    else setSelectedRuneIds(new Set(sellableRunes.map((r) => r.id)));
  };
  const clearAll = () => {
    if (tab === "card") setSelectedCardIds(new Set());
    else if (tab === "equipment") setSelectedEquipmentUids(new Set());
    else setSelectedRuneIds(new Set());
  };

  const handleSell = () => {
    if (totalSelected === 0) return;
    sellItems({
      cardIds: [...selectedCardIds],
      equipmentUids: [...selectedEquipmentUids],
      runeIds: [...selectedRuneIds],
    });
    setSelectedCardIds(new Set());
    setSelectedEquipmentUids(new Set());
    setSelectedRuneIds(new Set());
  };

  return (
    <section className="flex h-dvh flex-col overflow-hidden bg-ink font-pixel text-parchment">
      <header className="flex h-12 shrink-0 items-center justify-between border-b-2 border-gray-200 bg-black px-3">
        <h1 className="text-sm tracking-widest text-white">売却</h1>
        <PixelButton onClick={onClose} className="min-h-9 px-3 py-1 text-xs">
          戻る
        </PixelButton>
      </header>

      <div className="flex shrink-0 flex-wrap items-center gap-1 border-b-2 border-gray-200 bg-black px-3 py-2">
        {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "border-2 px-2 py-1 text-xs",
              t === tab ? "border-white bg-white text-ink" : "border-accent text-white",
            )}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
        <button
          type="button"
          onClick={selectAll}
          className="ml-auto border-2 border-accent px-1.5 py-0.5 text-[10px] text-white"
        >
          全選択
        </button>
        <button
          type="button"
          onClick={clearAll}
          className="border-2 border-accent px-1.5 py-0.5 text-[10px] text-white"
        >
          全解除
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {tab === "card" ? (
          sellableCards.length === 0 ? (
            <p className="text-xs text-muted">売れるカードがない。</p>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] justify-items-center gap-2">
              {sellableCards.map((inst) => {
                const def = getCard(inst.baseCardId);
                const selected = selectedCardIds.has(inst.instanceId);
                return (
                  <div key={inst.instanceId} className="flex flex-col items-center gap-1">
                    <CardView
                      card={{ uid: inst.instanceId, defId: inst.baseCardId, upgraded: false }}
                      compact
                      selected={selected}
                      onClick={() => setSelectedCardIds((s) => toggleInSet(s, inst.instanceId))}
                    />
                    <span className="border-2 border-white bg-black px-1.5 py-0.5 text-[10px] text-accent">
                      貝殻{cardSellPrice(def)}
                    </span>
                  </div>
                );
              })}
            </div>
          )
        ) : null}

        {tab === "equipment" ? (
          sellableEquipment.length === 0 ? (
            <p className="text-xs text-muted">売れる装備がない。</p>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(6rem,1fr))] justify-items-center gap-2">
              {sellableEquipment.map((inst) => {
                const selected = selectedEquipmentUids.has(inst.uid);
                return (
                  <button
                    key={inst.uid}
                    type="button"
                    onClick={() => setSelectedEquipmentUids((s) => toggleInSet(s, inst.uid))}
                    className={cn(
                      "flex w-24 flex-col items-center gap-1 border-2 bg-black p-2 text-center",
                      selected ? "border-accent" : "border-white",
                    )}
                  >
                    <PixelRelic defId={inst.defId} className="h-12 w-full" />
                    <span className="text-[9px] text-white">{equipmentLabel(inst)}</span>
                    <span className="border-2 border-white bg-black px-1 text-[9px] text-accent">
                      貝殻{equipmentSellPrice(inst)}
                    </span>
                  </button>
                );
              })}
            </div>
          )
        ) : null}

        {tab === "rune" ? (
          sellableRunes.length === 0 ? (
            <p className="text-xs text-muted">売れるルーンがない。</p>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(6rem,1fr))] justify-items-center gap-2">
              {sellableRunes.map((rune) => {
                const selected = selectedRuneIds.has(rune.id);
                return (
                  <button
                    key={rune.id}
                    type="button"
                    onClick={() => setSelectedRuneIds((s) => toggleInSet(s, rune.id))}
                    className={cn(
                      "flex w-24 flex-col items-center gap-1 border-2 bg-black p-2 text-center",
                      selected ? "border-accent" : "border-white",
                    )}
                  >
                    <PixelRune effect={rune.effect} className="size-8" />
                    <span className="text-[10px] text-white">{rune.effect}</span>
                    <span className="border-2 border-white bg-black px-1 text-[9px] text-accent">
                      貝殻{runeSellPrice(rune)}
                    </span>
                  </button>
                );
              })}
            </div>
          )
        ) : null}
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t-2 border-gray-200 bg-black px-3 py-3">
        <span className="text-xs tabular-nums text-white">
          選択中 {totalSelected}点 · 獲得予定 貝殻{totalValue}
        </span>
        <PixelButton onClick={handleSell} disabled={totalSelected === 0}>
          選択したものを売却
        </PixelButton>
      </div>
    </section>
  );
}
