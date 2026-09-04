import { useState } from "react";
import { PixelWindow } from "@/components/ui/PixelWindow";
import { PixelRelic } from "@/components/loadout/PixelRelic";
import { PixelRune } from "@/components/loadout/PixelRune";
import { EQUIPMENT, EQUIPMENT_SLOTS, equipmentLabel } from "@/game/equipment";
import { useGame } from "@/game/store";
import { peekRune, useCollectionStore } from "@/store/useCollectionStore";
import { cn } from "@/lib/utils";

const USABLE_RUNE_EFFECTS = new Set(["BLK+", "DRAW", "SAN+", "STR+", "POISON", "HEAL"]);

export function EquipmentScreen() {
  const inventory = useCollectionStore((s) => s.inventory);
  const equipped = useGame((s) => s.profile.equipped);
  const equipItem = useGame((s) => s.equipItem);
  const unequipSlot = useGame((s) => s.unequipSlot);
  const socketRuneToEquipment = useCollectionStore((s) => s.socketRuneToEquipment);
  const unsocketRuneFromEquipment = useCollectionStore((s) => s.unsocketRuneFromEquipment);
  const [activeUid, setActiveUid] = useState<string | null>(null);

  const equippedUids = new Set(
    EQUIPMENT_SLOTS.map((slot) => equipped[slot]?.uid).filter((id): id is string => !!id),
  );
  const active = inventory.equipment.find((e) => e.uid === activeUid) ?? null;
  const activeDef = active ? EQUIPMENT[active.defId] : null;
  const usableRunes = inventory.runes.filter((rune) => USABLE_RUNE_EFFECTS.has(rune.effect));

  return (
    <div className="grid h-full min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden lg:grid-cols-6">
      <aside className="min-h-0 overflow-y-auto border-b-2 border-gray-200 p-3 lg:col-span-2 lg:border-r-2 lg:border-b-0">
        <p className="mb-2 text-xs tracking-widest text-muted">装着中</p>
        <ul className="mb-4 grid grid-cols-5 gap-1">
          {EQUIPMENT_SLOTS.map((slot) => {
            const inst = equipped[slot];
            return (
              <li key={slot}>
                <button
                  type="button"
                  onClick={() => inst && setActiveUid(inst.uid)}
                  className={cn(
                    "flex w-full flex-col items-center border-2 bg-black p-1",
                    inst?.uid === activeUid ? "border-accent" : "border-white",
                  )}
                >
                  {inst ? (
                    <>
                      <PixelRelic defId={inst.defId} className="h-10 w-full" />
                      <span className="mt-1 text-[9px] text-white">{equipmentLabel(inst)}</span>
                    </>
                  ) : (
                    <span className="py-4 text-[9px] text-muted">{slot}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        <p className="mb-2 text-xs tracking-widest text-muted">所持装備 {inventory.equipment.length}</p>
        {inventory.equipment.length === 0 ? (
          <p className="text-xs text-muted">まだ装備を持っていない。</p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(6rem,1fr))] justify-items-center gap-2">
            {inventory.equipment.map((inst) => {
              const isEquipped = equippedUids.has(inst.uid);
              return (
                <button
                  key={inst.uid}
                  type="button"
                  onClick={() => setActiveUid(inst.uid)}
                  className={cn(
                    "flex w-24 flex-col items-center gap-1 border-2 bg-black p-2 text-center",
                    inst.uid === activeUid ? "border-accent" : "border-white",
                  )}
                >
                  <PixelRelic defId={inst.defId} className="h-12 w-full" />
                  <span className="text-[9px] text-white">{equipmentLabel(inst)}</span>
                  {isEquipped ? (
                    <span className="text-[9px] text-accent">装着中</span>
                  ) : (
                    <span
                      role="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        equipItem(inst.uid);
                      }}
                      className="border-2 border-white bg-black px-1 text-[9px] text-white"
                    >
                      装着
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </aside>

      <section className="min-h-0 overflow-y-auto border-b-2 border-gray-200 p-3 lg:col-span-2 lg:border-r-2 lg:border-b-0">
        {active && activeDef ? (
          <>
            <PixelWindow className="mb-3">
              <p className="text-[11px] tracking-widest text-accent">{activeDef.slot}</p>
              <h2 className="text-2xl text-white">{equipmentLabel(active)}</h2>
              {equippedUids.has(active.uid) ? (
                <button
                  type="button"
                  onClick={() => unequipSlot(activeDef.slot)}
                  className="mt-2 border-2 border-white bg-black px-2 py-1 text-xs text-white"
                >
                  外す
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => equipItem(active.uid)}
                  className="mt-2 border-2 border-white bg-black px-2 py-1 text-xs text-white"
                >
                  装着する
                </button>
              )}
              {Object.keys(active.bonusStats ?? {}).length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {active.bonusStats?.strength ? (
                    <span className="border-2 border-white bg-black px-1.5 py-0.5 text-[10px] text-accent">
                      筋力+{active.bonusStats.strength}
                    </span>
                  ) : null}
                  {active.bonusStats?.defense ? (
                    <span className="border-2 border-white bg-black px-1.5 py-0.5 text-[10px] text-accent">
                      防御+{active.bonusStats.defense}
                    </span>
                  ) : null}
                  {active.bonusStats?.poisonResistPct ? (
                    <span className="border-2 border-white bg-black px-1.5 py-0.5 text-[10px] text-accent">
                      毒耐性+{active.bonusStats.poisonResistPct}%
                    </span>
                  ) : null}
                  {active.bonusStats?.sanResistPct ? (
                    <span className="border-2 border-white bg-black px-1.5 py-0.5 text-[10px] text-accent">
                      狂気耐性+{active.bonusStats.sanResistPct}%
                    </span>
                  ) : null}
                </div>
              ) : null}
            </PixelWindow>
            <p className="mb-2 text-xs tracking-widest text-muted">ソケット</p>
            <div className="flex flex-wrap gap-2">
              {active.socketedRunes.map((runeId, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => runeId && unsocketRuneFromEquipment(active.uid, i)}
                  className="grid size-14 place-items-center border-2 border-white bg-black"
                  title={runeId ? "クリックで外す" : "空きソケット"}
                >
                  {runeId ? (
                    <PixelRune effect={peekRune(runeId)?.effect ?? "ATK+"} className="size-8" />
                  ) : (
                    <span className="text-xs text-muted">空</span>
                  )}
                </button>
              ))}
            </div>
          </>
        ) : (
          <p className="py-10 text-center text-xs text-muted">左の装備を選択してください</p>
        )}
      </section>

      <aside className="min-h-0 overflow-y-auto p-3 lg:col-span-2">
        <p className="mb-2 text-xs tracking-widest text-muted">ルーン {usableRunes.length}</p>
        <div className="grid grid-cols-3 gap-2">
          {usableRunes.map((rune) => (
            <button
              key={rune.id}
              type="button"
              disabled={!active}
              onClick={() => {
                if (!active) return;
                const emptyIdx = active.socketedRunes.findIndex((r) => !r);
                if (emptyIdx === -1) return;
                socketRuneToEquipment(active.uid, rune.id, emptyIdx);
              }}
              className="flex flex-col items-center gap-1 border-2 border-white bg-black p-2 text-center disabled:opacity-40"
            >
              <PixelRune effect={rune.effect} className="size-8" />
              <span className="text-[10px] text-white">{rune.effect}</span>
              <span className="text-[10px] text-accent">{rune.value}</span>
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}
