import { useState, type ReactNode } from "react";
import { CardView } from "@/components/game/CardView";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelRelic } from "@/components/loadout/PixelRelic";
import { PixelRune } from "@/components/loadout/PixelRune";
import { PixelSprite } from "@/components/ui/PixelSprite";
import { getCard } from "@/game/cards";
import { equipmentLabel } from "@/game/equipment";
import { cardSellPrice, equipmentSellPrice, runeSellPrice } from "@/game/smith";
import { useGame } from "@/game/store";
import type { EquipmentInstance, Rune } from "@/game/types";
import { COPY_LIMIT, useCollectionStore, type CardInstance, type DeckCounts } from "@/store/useCollectionStore";
import { cn } from "@/lib/utils";

type Tab = "card" | "equipment" | "rune";

const TAB_LABELS: Record<Tab, string> = {
  card: "カード",
  equipment: "装備",
  rune: "ルーン",
};

type CardGroup = {
  key: string;
  baseCardId: string;
};

function toggleInSet<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

function groupInventory(cards: CardInstance[]): CardGroup[] {
  const groups = new Map<string, CardGroup>();
  for (const card of cards) {
    if (groups.has(card.baseCardId)) continue;
    groups.set(card.baseCardId, { key: card.baseCardId, baseCardId: card.baseCardId });
  }
  return [...groups.values()];
}

function ownedCountOf(cards: CardInstance[], baseCardId: string): number {
  return cards.filter((c) => c.baseCardId === baseCardId).length;
}

function usedAcrossDecks(decks: Record<string, DeckCounts>): Map<string, number> {
  const used = new Map<string, number>();
  for (const counts of Object.values(decks)) {
    for (const [cardId, count] of Object.entries(counts)) {
      used.set(cardId, (used.get(cardId) ?? 0) + count);
    }
  }
  return used;
}

function SelectionRow({
  thumb,
  label,
  qty,
  subtotal,
  onClear,
}: {
  thumb: ReactNode;
  label: string;
  qty: number;
  subtotal: number;
  onClear: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClear}
      title="クリックで選択解除"
      className="flex w-full items-center gap-2 border-b border-border/60 px-2 py-1.5 text-left hover:bg-white/5"
    >
      <span className="relative size-9 shrink-0 overflow-hidden border border-border bg-ink-2">{thumb}</span>
      <span className="min-w-0 flex-1">
        <p className="truncate text-xs text-white">{label}</p>
      </span>
      {qty > 1 ? <span className="shrink-0 text-xs tabular-nums text-muted">×{qty}</span> : null}
      <span className="shrink-0 text-xs tabular-nums text-accent">貝殻{subtotal}</span>
    </button>
  );
}

export function SellScreen({ onClose }: { onClose: () => void }) {
  const inventory = useCollectionStore((s) => s.inventory);
  const decks = useCollectionStore((s) => s.decks);
  const equipped = useGame((s) => s.profile.equipped);
  const sellItems = useGame((s) => s.sellItems);
  const [tab, setTab] = useState<Tab>("card");
  const [cardSelections, setCardSelections] = useState<Record<string, number>>({});
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

  const usedByCardId = usedAcrossDecks(decks);
  const cardRows = groupInventory(inventory.cards)
    .map((group) => {
      const owned = ownedCountOf(inventory.cards, group.baseCardId);
      const used = usedByCardId.get(group.baseCardId) ?? 0;
      const sellable = Math.max(0, owned - used);
      return { group, owned, sellable };
    })
    .filter((r) => r.sellable > 0);

  const sellableEquipment: EquipmentInstance[] = inventory.equipment.filter(
    (e) => !equippedUids.has(e.uid),
  );
  const sellableRunes: Rune[] = inventory.runes.filter((r) => !socketedRuneIds.has(r.id));

  const qtyFor = (baseCardId: string, sellable: number) => Math.min(cardSelections[baseCardId] ?? 0, sellable);

  const cardTotalCount = cardRows.reduce((sum, r) => sum + qtyFor(r.group.baseCardId, r.sellable), 0);
  const cardTotalValue = cardRows.reduce((sum, r) => {
    const qty = qtyFor(r.group.baseCardId, r.sellable);
    return qty > 0 ? sum + qty * cardSellPrice(getCard(r.group.baseCardId)) : sum;
  }, 0);
  const equipmentTotalValue = [...selectedEquipmentUids].reduce((sum, uid) => {
    const inst = sellableEquipment.find((e) => e.uid === uid);
    return inst ? sum + equipmentSellPrice(inst) : sum;
  }, 0);
  const runeTotalValue = [...selectedRuneIds].reduce((sum, id) => {
    const rune = sellableRunes.find((r) => r.id === id);
    return rune ? sum + runeSellPrice(rune) : sum;
  }, 0);

  const totalValue = cardTotalValue + equipmentTotalValue + runeTotalValue;
  const totalSelected = cardTotalCount + selectedEquipmentUids.size + selectedRuneIds.size;

  const setCardQty = (baseCardId: string, qty: number, max: number) => {
    const clamped = Math.max(0, Math.min(max, qty));
    setCardSelections((s) => {
      const next = { ...s };
      if (clamped <= 0) delete next[baseCardId];
      else next[baseCardId] = clamped;
      return next;
    });
  };

  const selectAll = () => {
    if (tab === "card") {
      const next: Record<string, number> = {};
      for (const r of cardRows) next[r.group.baseCardId] = r.sellable;
      setCardSelections(next);
    } else if (tab === "equipment") setSelectedEquipmentUids(new Set(sellableEquipment.map((e) => e.uid)));
    else setSelectedRuneIds(new Set(sellableRunes.map((r) => r.id)));
  };
  const clearAll = () => {
    if (tab === "card") setCardSelections({});
    else if (tab === "equipment") setSelectedEquipmentUids(new Set());
    else setSelectedRuneIds(new Set());
  };
  const selectSurplus = () => {
    const next: Record<string, number> = {};
    for (const r of cardRows) {
      if (r.sellable > COPY_LIMIT) next[r.group.baseCardId] = r.sellable - COPY_LIMIT;
    }
    setCardSelections(next);
  };

  const handleSell = () => {
    if (totalSelected === 0) return;
    const cardIds: string[] = [];
    for (const r of cardRows) {
      const qty = qtyFor(r.group.baseCardId, r.sellable);
      if (qty <= 0) continue;
      const ids = inventory.cards
        .filter((c) => c.baseCardId === r.group.baseCardId)
        .slice(0, qty)
        .map((c) => c.instanceId);
      cardIds.push(...ids);
    }
    sellItems({
      cardIds,
      equipmentUids: [...selectedEquipmentUids],
      runeIds: [...selectedRuneIds],
    });
    setCardSelections({});
    setSelectedEquipmentUids(new Set());
    setSelectedRuneIds(new Set());
  };

  const selectionRows: { key: string; thumb: ReactNode; label: string; qty: number; subtotal: number; onClear: () => void }[] = [
    ...cardRows
      .filter((r) => qtyFor(r.group.baseCardId, r.sellable) > 0)
      .map((r) => {
        const def = getCard(r.group.baseCardId);
        const qty = qtyFor(r.group.baseCardId, r.sellable);
        return {
          key: `card-${r.group.baseCardId}`,
          thumb: <PixelSprite src={def.art} className="absolute inset-0 size-full object-cover" />,
          label: def.name,
          qty,
          subtotal: qty * cardSellPrice(def),
          onClear: () => setCardQty(r.group.baseCardId, 0, r.sellable),
        };
      }),
    ...[...selectedEquipmentUids].flatMap((uid) => {
      const inst = sellableEquipment.find((e) => e.uid === uid);
      if (!inst) return [];
      return [
        {
          key: `equipment-${uid}`,
          thumb: <PixelRelic defId={inst.defId} className="absolute inset-0 size-full object-cover" />,
          label: equipmentLabel(inst),
          qty: 1,
          subtotal: equipmentSellPrice(inst),
          onClear: () => setSelectedEquipmentUids((s) => toggleInSet(s, uid)),
        },
      ];
    }),
    ...[...selectedRuneIds].flatMap((id) => {
      const rune = sellableRunes.find((r) => r.id === id);
      if (!rune) return [];
      return [
        {
          key: `rune-${id}`,
          thumb: <PixelRune effect={rune.effect} className="absolute inset-0 size-full" />,
          label: rune.effect,
          qty: 1,
          subtotal: runeSellPrice(rune),
          onClear: () => setSelectedRuneIds((s) => toggleInSet(s, id)),
        },
      ];
    }),
  ];

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden bg-ink font-pixel text-parchment">
      <header className="flex h-12 shrink-0 items-center justify-between border-b-2 border-border bg-ink-2 px-3">
        <h1 className="text-sm tracking-widest text-white">売却</h1>
        <PixelButton onClick={onClose} className="min-h-9 px-3 py-1 text-xs">
          戻る
        </PixelButton>
      </header>

      <div className="flex shrink-0 flex-wrap items-center gap-1 border-b-2 border-border bg-ink-2 px-3 py-2">
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
        {tab === "card" ? (
          <button
            type="button"
            onClick={selectSurplus}
            className="ml-auto border-2 border-accent px-1.5 py-0.5 text-[10px] text-white"
          >
            余剰を一括選択
          </button>
        ) : null}
        <button
          type="button"
          onClick={selectAll}
          className={cn("border-2 border-accent px-1.5 py-0.5 text-[10px] text-white", tab !== "card" && "ml-auto")}
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

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[1fr_20rem]">
        <div className="min-h-0 overflow-y-auto border-b-2 border-border p-3 lg:border-r-2 lg:border-b-0">
          {tab === "card" ? (
            cardRows.length === 0 ? (
              <p className="text-xs text-muted">売れるカードがない。</p>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] justify-items-center gap-2">
                {cardRows.map(({ group, owned, sellable }) => {
                  const def = getCard(group.baseCardId);
                  const qty = qtyFor(group.baseCardId, sellable);
                  return (
                    <div key={group.key} className="flex flex-col items-center gap-1">
                      <div className="relative">
                        <CardView
                          card={{ uid: group.key, defId: group.baseCardId, upgraded: false }}
                          compact
                          selected={qty > 0}
                          onClick={() => setCardQty(group.baseCardId, qty > 0 ? 0 : sellable, sellable)}
                        />
                        <span className="panel absolute right-0 bottom-0 z-10 px-1 text-[10px] text-white">
                          x{owned}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={qty <= 0}
                          onClick={() => setCardQty(group.baseCardId, qty - 1, sellable)}
                          className="panel px-1.5 py-0.5 text-xs text-white disabled:opacity-30"
                        >
                          −
                        </button>
                        <span className="w-10 text-center text-[11px] tabular-nums text-accent">
                          {qty}/{sellable}
                        </span>
                        <button
                          type="button"
                          disabled={qty >= sellable}
                          onClick={() => setCardQty(group.baseCardId, qty + 1, sellable)}
                          className="panel px-1.5 py-0.5 text-xs text-white disabled:opacity-30"
                        >
                          ＋
                        </button>
                      </div>
                      <span className="panel px-1.5 py-0.5 text-[10px] text-accent">
                        貝殻{cardSellPrice(def)}/枚
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
                        "panel flex w-24 flex-col items-center gap-1 p-2 text-center",
                        selected ? "border-accent" : "",
                      )}
                    >
                      <PixelRelic defId={inst.defId} className="h-12 w-full" />
                      <span className="text-[9px] text-white">{equipmentLabel(inst)}</span>
                      <span className="panel px-1 text-[9px] text-accent">
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
                        "panel flex w-24 flex-col items-center gap-1 p-2 text-center",
                        selected ? "border-accent" : "",
                      )}
                    >
                      <PixelRune effect={rune.effect} className="size-8" />
                      <span className="text-[10px] text-white">{rune.effect}</span>
                      <span className="panel px-1 text-[9px] text-accent">
                        貝殻{runeSellPrice(rune)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )
          ) : null}
        </div>

        <aside className="flex min-h-0 flex-col overflow-hidden">
          <p className="mx-2 mt-2 mb-1 text-xs tracking-widest text-muted">選択中 {totalSelected}点</p>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {selectionRows.length === 0 ? (
              <p className="p-3 text-xs text-muted">まだ何も選択されていない。</p>
            ) : (
              selectionRows.map((row) => (
                <SelectionRow
                  key={row.key}
                  thumb={row.thumb}
                  label={row.label}
                  qty={row.qty}
                  subtotal={row.subtotal}
                  onClear={row.onClear}
                />
              ))
            )}
          </div>
        </aside>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t-2 border-border bg-ink-2 px-3 py-3">
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
