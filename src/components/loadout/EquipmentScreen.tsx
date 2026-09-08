import { useMemo, useState } from "react";
import { PixelRelic } from "@/components/loadout/PixelRelic";
import { PixelRune } from "@/components/loadout/PixelRune";
import { ARCHETYPE_LABELS } from "@/game/cards";
import { EQUIPMENT, EQUIPMENT_SLOTS, hasFullSet } from "@/game/equipment";
import { syncEquippedFromInventory, useGame } from "@/game/store";
import type { Archetype, EquipmentInstance, EquipmentSlot } from "@/game/types";
import { peekRune, useCollectionStore } from "@/store/useCollectionStore";
import { cn } from "@/lib/utils";

const USABLE_RUNE_EFFECTS = new Set(["BLK+", "DRAW", "SAN+", "STR+", "POISON", "HEAL", "VULN+", "ENERGY+", "THORN"]);

const EQUIPMENT_ARCHETYPE_LABELS: Partial<Record<Archetype, string>> = {
  ...ARCHETYPE_LABELS,
  generic: "汎用",
};

const FILTERABLE_ARCHETYPES = Array.from(
  new Set(Object.values(EQUIPMENT).map((d) => d.archetype)),
) as Archetype[];

const SLOT_LABEL: Record<EquipmentSlot, string> = {
  head: "頭",
  chest: "胸",
  arms: "腕",
  legs: "脚",
  feet: "足",
};

const RUNE_DOT_COLOR: Record<string, string> = {
  "HEAL": "#b4544a",
  "STR+": "#c07a2a",
  "THORN": "#8a2a2a",
  "DRAW": "#6a4ab7",
  "SAN+": "#2a9a8a",
  "POISON": "#4a8a4a",
  "ENERGY+": "#c0a02a",
  "VULN+": "#7a3f9a",
  "BLK+": "#3f6a9a",
};

type RuneCategory = "attack" | "defense" | "heal" | "special";
const RUNE_CATEGORY: Record<string, RuneCategory> = {
  "STR+": "attack",
  "VULN+": "attack",
  "THORN": "attack",
  "BLK+": "defense",
  "POISON": "defense",
  "HEAL": "heal",
  "SAN+": "heal",
  "DRAW": "special",
  "ENERGY+": "special",
};
const RUNE_CATEGORIES: RuneCategory[] = ["attack", "defense", "heal", "special"];
const RUNE_CATEGORY_LABELS: Record<RuneCategory, string> = {
  attack: "攻",
  defense: "防",
  heal: "回復",
  special: "特殊",
};

const FULLSET_DESCRIPTIONS: Partial<Record<Archetype, string>> = {
  poison: "毒に完全耐性を得る。回復効果+50%。",
  knight: "ブロックを次のターンへ持ち越す。",
  outer: "戦闘開始時、正気を全回復する。",
  elder: "手札上限が12枚に拡張される。",
  deep: "戦闘開始時、最大体力の10%を回復する。",
  offering: "戦闘開始時、体力を代償にエネルギーを1得る。",
  shadow: "被弾時、1ターンだけ透明化状態を得る（1戦闘に1回）。",
  fanatic: "正気が尽きても、一度だけ力尽きずに耐える。",
};

const ARCHETYPE_GLOW_COLOR: Partial<Record<Archetype, string>> = {
  fanatic: "#ff6b5c",
  knight: "#8fd6ff",
  poison: "#7dd957",
  outer: "#b06bff",
  elder: "#e8c34a",
  deep: "#5eead4",
  offering: "#ff6ea8",
  shadow: "#9b8cff",
};

function toggleInSet<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

function runeEffectsOf(inst: EquipmentInstance): string[] {
  return inst.socketedRunes
    .map((id) => (id ? peekRune(id)?.effect : undefined))
    .filter((e): e is string => !!e);
}

function RuneDot({ effect, size = "sm" }: { effect: string; size?: "sm" | "md" }) {
  return (
    <span
      title={effect}
      className={cn("block shrink-0 rounded-full border border-ink", size === "sm" ? "size-1.5" : "size-2.5")}
      style={{ background: RUNE_DOT_COLOR[effect] ?? "#6b7280" }}
    />
  );
}

function FullSetDots({
  archetype,
  equipped,
  size = "sm",
}: {
  archetype: Archetype;
  equipped: Partial<Record<EquipmentSlot, EquipmentInstance>>;
  size?: "sm" | "md";
}) {
  const color = ARCHETYPE_GLOW_COLOR[archetype] ?? "#5eead4";
  return (
    <div className="flex gap-1.5">
      {EQUIPMENT_SLOTS.map((slot) => {
        const inst = equipped[slot];
        const filled = !!inst && EQUIPMENT[inst.defId]?.archetype === archetype;
        return (
          <span
            key={slot}
            className={cn(
              "block rounded-full border",
              size === "sm" ? "size-2" : "size-2.5",
              filled ? "border-transparent" : "border-muted/50 bg-transparent",
            )}
            style={filled ? { background: color, boxShadow: `0 0 5px 1px ${color}` } : undefined}
          />
        );
      })}
    </div>
  );
}

function HeroSlot({
  slot,
  inst,
  selected,
  glowColor,
  onClick,
}: {
  slot: EquipmentSlot;
  inst: EquipmentInstance | undefined;
  selected: boolean;
  glowColor?: string;
  onClick: () => void;
}) {
  const def = inst ? EQUIPMENT[inst.defId] : null;
  const effects = inst ? runeEffectsOf(inst) : [];
  return (
    <button
      type="button"
      disabled={!inst}
      onClick={onClick}
      title={def?.name}
      style={glowColor ? { boxShadow: `0 0 0 2px ${glowColor}, 0 0 10px 2px ${glowColor}` } : undefined}
      className={cn(
        "relative flex size-16 shrink-0 flex-col justify-end overflow-hidden border-2 bg-ink-2 sm:size-[5.5rem]",
        inst ? "border-accent" : "border-border opacity-50",
        selected ? "outline-2 outline-offset-1 outline-white" : "",
      )}
    >
      <span className="absolute top-1 left-1 z-10 text-[9px] text-muted">{SLOT_LABEL[slot]}</span>
      {effects.length > 0 ? (
        <span className="absolute top-1 right-1 z-10 flex gap-0.5">
          {effects.map((e, i) => (
            <RuneDot key={i} effect={e} />
          ))}
        </span>
      ) : null}
      {def ? <PixelRelic defId={def.id} className="absolute inset-0 size-full object-cover" /> : null}
      <span className="relative z-10 truncate bg-black/70 px-1 py-0.5 text-[9px] text-white">
        {inst && def ? `${def.name} T${inst.tier}` : "空き"}
      </span>
    </button>
  );
}

function InventoryTile({
  inst,
  selected,
  isEquipped,
  onClick,
}: {
  inst: EquipmentInstance;
  selected: boolean;
  isEquipped: boolean;
  onClick: () => void;
}) {
  const def = EQUIPMENT[inst.defId];
  if (!def) return null;
  const effects = runeEffectsOf(inst);
  return (
    <button
      type="button"
      onClick={onClick}
      title={def.name}
      className={cn(
        "relative aspect-square overflow-hidden border-2 bg-ink-2 transition-transform duration-(--motion-fast) ease-(--ease-smooth-out)",
        selected ? "-translate-y-1 border-accent" : "border-border hover:-translate-y-0.5 hover:border-accent",
      )}
    >
      <PixelRelic defId={def.id} className="absolute inset-0 size-full object-cover" />
      {isEquipped ? (
        <span className="panel absolute top-0.5 left-0.5 z-10 px-1 text-[8px] text-accent">装着中</span>
      ) : null}
      {effects.length > 0 ? (
        <span className="absolute top-0.5 right-0.5 z-10 flex gap-0.5">
          {effects.map((e, i) => (
            <RuneDot key={i} effect={e} />
          ))}
        </span>
      ) : null}
      <span className="absolute bottom-0.5 left-0.5 z-10 border border-border bg-ink/90 px-1 text-[8px] text-muted">
        T{inst.tier}
      </span>
    </button>
  );
}

export function EquipmentScreen() {
  const inventory = useCollectionStore((s) => s.inventory);
  const equipped = useGame((s) => s.profile.equipped);
  const equipItem = useGame((s) => s.equipItem);
  const unequipSlot = useGame((s) => s.unequipSlot);
  const socketRuneToEquipment = useCollectionStore((s) => s.socketRuneToEquipment);
  const unsocketRuneFromEquipment = useCollectionStore((s) => s.unsocketRuneFromEquipment);
  const [activeUid, setActiveUid] = useState<string | null>(null);
  const [filterArchetypes, setFilterArchetypes] = useState<Set<Archetype>>(new Set());
  const [filterSlots, setFilterSlots] = useState<Set<EquipmentSlot>>(new Set());
  const [sortAsc, setSortAsc] = useState(false);
  const [runeQuery, setRuneQuery] = useState("");
  const [runeCategory, setRuneCategory] = useState<RuneCategory | null>(null);

  const equippedUids = new Set(
    EQUIPMENT_SLOTS.map((slot) => equipped[slot]?.uid).filter((id): id is string => !!id),
  );
  const active = inventory.equipment.find((e) => e.uid === activeUid) ?? null;
  const activeDef = active ? EQUIPMENT[active.defId] : null;
  const usableRunes = inventory.runes.filter((rune) => USABLE_RUNE_EFFECTS.has(rune.effect));

  const filteredEquipment = inventory.equipment.filter((inst) => {
    const def = EQUIPMENT[inst.defId];
    if (!def) return false;
    if (filterArchetypes.size > 0 && !filterArchetypes.has(def.archetype)) return false;
    if (filterSlots.size > 0 && !filterSlots.has(def.slot)) return false;
    return true;
  });
  const sortedEquipment = [...filteredEquipment].sort((a, b) =>
    sortAsc ? a.tier - b.tier : b.tier - a.tier,
  );

  const runeQueryTrim = runeQuery.trim().toLowerCase();
  const filteredRunes = usableRunes.filter((rune) => {
    if (runeCategory && RUNE_CATEGORY[rune.effect] !== runeCategory) return false;
    if (runeQueryTrim && !rune.effect.toLowerCase().includes(runeQueryTrim)) return false;
    return true;
  });

  const topArchetype = useMemo(() => {
    const tally = new Map<Archetype, number>();
    for (const slot of EQUIPMENT_SLOTS) {
      const inst = equipped[slot];
      const def = inst ? EQUIPMENT[inst.defId] : null;
      if (!def) continue;
      tally.set(def.archetype, (tally.get(def.archetype) ?? 0) + 1);
    }
    let best: { archetype: Archetype; count: number } | null = null;
    for (const [archetype, count] of tally) {
      if (!best || count > best.count) best = { archetype, count };
    }
    return best;
  }, [equipped]);
  const topArchetypeFull = topArchetype ? hasFullSet(equipped, topArchetype.archetype) : false;

  const activeArchetypeFull = activeDef ? hasFullSet(equipped, activeDef.archetype) : false;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b-2 border-accent bg-ink-2 p-3">
        <p className="mb-2 text-xs tracking-widest text-muted">装着中</p>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-2">
            {EQUIPMENT_SLOTS.map((slot) => {
              const inst = equipped[slot];
              const glow =
                topArchetypeFull && topArchetype && inst && EQUIPMENT[inst.defId]?.archetype === topArchetype.archetype
                  ? (ARCHETYPE_GLOW_COLOR[topArchetype.archetype] ?? "#5eead4")
                  : undefined;
              return (
                <HeroSlot
                  key={slot}
                  slot={slot}
                  inst={inst}
                  selected={inst?.uid === activeUid}
                  glowColor={glow}
                  onClick={() => inst && setActiveUid(inst.uid)}
                />
              );
            })}
          </div>
          <div className="min-w-52 flex-1">
            {topArchetype && topArchetype.archetype !== "generic" ? (
              <>
                <p className="text-[11px] text-white">
                  <span className="text-accent">{EQUIPMENT_ARCHETYPE_LABELS[topArchetype.archetype] ?? topArchetype.archetype}</span>{" "}
                  全身セット
                </p>
                <div className="mt-1.5">
                  <FullSetDots archetype={topArchetype.archetype} equipped={equipped} />
                </div>
                {topArchetypeFull ? (
                  <p className="mt-1.5 text-[11px] text-accent">
                    全身加護「{FULLSET_DESCRIPTIONS[topArchetype.archetype] ?? "効果なし"}」発動中
                  </p>
                ) : null}
              </>
            ) : (
              <p className="text-[11px] text-muted">
                {topArchetype
                  ? "装備の系統をそろえると全身加護が発動する。"
                  : "装備を身につけると、ここに系統ボーナスが表示されます。"}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[1fr_420px_16rem]">
        <aside className="flex min-h-0 flex-col overflow-hidden border-b-2 border-border lg:border-r-2 lg:border-b-0">
          <div className="panel m-2 space-y-2 border-accent p-2">
            <div className="flex flex-wrap items-center gap-1">
              <span className="mr-1 text-[10px] text-white">ジャンル</span>
              {FILTERABLE_ARCHETYPES.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setFilterArchetypes((s) => toggleInSet(s, a))}
                  className={cn(
                    "border-2 px-1.5 py-0.5 text-[10px]",
                    filterArchetypes.has(a) ? "border-white bg-white text-ink" : "border-accent text-white",
                  )}
                >
                  {EQUIPMENT_ARCHETYPE_LABELS[a] ?? a}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-1">
              <span className="mr-1 text-[10px] text-white">部位</span>
              {EQUIPMENT_SLOTS.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setFilterSlots((s) => toggleInSet(s, slot))}
                  className={cn(
                    "border-2 px-1.5 py-0.5 text-[10px]",
                    filterSlots.has(slot) ? "border-white bg-white text-ink" : "border-accent text-white",
                  )}
                >
                  {slot}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-1">
              <span className="mr-1 text-[10px] text-white">並び替え</span>
              <button
                type="button"
                onClick={() => setSortAsc((v) => !v)}
                className="panel px-1.5 py-0.5 text-[10px] text-white"
              >
                tier{sortAsc ? "低い順" : "高い順"}
              </button>
            </div>
            {filterArchetypes.size + filterSlots.size > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setFilterArchetypes(new Set());
                  setFilterSlots(new Set());
                }}
                className="border-2 border-accent px-1.5 py-0.5 text-[10px] text-white"
              >
                フィルターをリセット
              </button>
            ) : null}
          </div>

          <p className="mx-2 mb-2 text-xs tracking-widest text-muted">
            所持装備 {sortedEquipment.length}/{inventory.equipment.length}
          </p>
          <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
            {inventory.equipment.length === 0 ? (
              <p className="text-xs text-muted">まだ装備を持っていない。</p>
            ) : sortedEquipment.length === 0 ? (
              <p className="text-xs text-muted">条件に合う装備がない。</p>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(4.75rem,1fr))] gap-2">
                {sortedEquipment.map((inst) => (
                  <InventoryTile
                    key={inst.uid}
                    inst={inst}
                    selected={inst.uid === activeUid}
                    isEquipped={equippedUids.has(inst.uid)}
                    onClick={() => setActiveUid(inst.uid)}
                  />
                ))}
              </div>
            )}
          </div>
        </aside>

        <section className="min-h-0 overflow-y-auto border-b-2 border-border p-2.5 lg:border-r-2 lg:border-b-0">
          {active && activeDef ? (
            <>
              <div className="flex items-start gap-2.5">
                <div className="relative size-16 shrink-0 overflow-hidden border-2 border-parchment bg-ink-2 sm:size-20">
                  <PixelRelic defId={activeDef.id} className="absolute inset-0 size-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] tracking-widest text-accent">
                    {EQUIPMENT_ARCHETYPE_LABELS[activeDef.archetype] ?? activeDef.archetype} · {activeDef.slot}
                  </p>
                  <h2 className="truncate text-lg text-white">
                    {activeDef.name} T{active.tier}
                  </h2>
                  {(() => {
                    const p = active.power || 1;
                    const baseRows: { label: string; value: number }[] = [
                      { label: "防御", value: Math.round((activeDef.baseDefense ?? 0) * p) },
                      { label: "毒耐性", value: Math.round((activeDef.basePoisonResist ?? 0) * p) },
                      { label: "狂気耐性", value: Math.round((activeDef.baseSanResist ?? 0) * p) },
                      { label: "筋力", value: Math.round((activeDef.baseStrength ?? 0) * p) },
                      { label: "ドロー", value: Math.round((activeDef.baseDraw ?? 0) * p) },
                      { label: "回復", value: Math.round((activeDef.baseHeal ?? 0) * p) },
                    ].filter((r) => r.value > 0);
                    const bonus = active.bonusStats ?? {};
                    const bonusRows: { label: string; value: number }[] = [
                      { label: "筋力", value: bonus.strength ?? 0 },
                      { label: "防御", value: bonus.defense ?? 0 },
                      { label: "毒耐性", value: bonus.poisonResist ?? 0 },
                      { label: "狂気耐性", value: bonus.sanResist ?? 0 },
                    ].filter((r) => r.value > 0);
                    if (baseRows.length === 0 && bonusRows.length === 0) return null;
                    return (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {baseRows.map((r) => (
                          <span key={`base-${r.label}`} className="panel px-1.5 py-0.5 text-[10px] text-white">
                            {r.label}
                            {r.value}
                          </span>
                        ))}
                        {bonusRows.map((r) => (
                          <span
                            key={`bonus-${r.label}`}
                            className="panel border-accent px-1.5 py-0.5 text-[10px] text-accent"
                          >
                            {r.label}+{r.value}
                          </span>
                        ))}
                      </div>
                    );
                  })()}
                  <div className="mt-1.5">
                    {equippedUids.has(active.uid) ? (
                      <button
                        type="button"
                        onClick={() => unequipSlot(activeDef.slot)}
                        className="panel px-2 py-1 text-xs text-white"
                      >
                        外す
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => equipItem(active.uid)}
                        className="panel px-2 py-1 text-xs text-white"
                      >
                        装着する
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <p className="mt-3 mb-1.5 text-[10px] tracking-widest text-muted">
                ソケット（{active.socketedRunes.filter((r) => r).length}/{active.socketedRunes.length}）
              </p>
              <div className="flex flex-wrap gap-2">
                {active.socketedRunes.map((runeId, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      if (!runeId) return;
                      unsocketRuneFromEquipment(active.uid, i);
                      syncEquippedFromInventory(active.uid);
                    }}
                    className={cn(
                      "panel grid size-12 place-items-center",
                      !runeId && "border-dashed",
                    )}
                    title={runeId ? "クリックで外す" : "空きソケット"}
                  >
                    {runeId ? (
                      <PixelRune effect={peekRune(runeId)?.effect ?? "ATK+"} className="size-7" />
                    ) : (
                      <span className="text-xs text-muted">空</span>
                    )}
                  </button>
                ))}
              </div>

              <div className="panel mt-3 p-2">
                <div className="flex items-center justify-between gap-2">
                  <p className={cn("text-[11px]", activeArchetypeFull ? "text-accent" : "text-muted")}>
                    {EQUIPMENT_ARCHETYPE_LABELS[activeDef.archetype] ?? activeDef.archetype} 全身セット
                  </p>
                  <FullSetDots archetype={activeDef.archetype} equipped={equipped} />
                </div>
                <p className="mt-1 text-[11px] text-white/80">
                  {FULLSET_DESCRIPTIONS[activeDef.archetype] ?? "このジャンルに全身セット効果はない。"}
                </p>
              </div>
            </>
          ) : (
            <p className="py-10 text-center text-xs text-muted">左の装備を選択してください</p>
          )}
        </section>

        <aside className="flex min-h-0 flex-col overflow-hidden">
          <input
            value={runeQuery}
            onChange={(e) => setRuneQuery(e.target.value)}
            placeholder="ルーン効果で検索..."
            className="panel m-2 px-2 py-1.5 font-pixel text-xs text-white outline-none placeholder:text-muted"
          />
          <div className="flex flex-wrap items-center gap-1 px-2 pb-2">
            <button
              type="button"
              onClick={() => setRuneCategory(null)}
              className={cn(
                "border-2 px-1.5 py-0.5 text-[10px]",
                runeCategory === null ? "border-white bg-white text-ink" : "border-accent text-white",
              )}
            >
              全て
            </button>
            {RUNE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setRuneCategory((c) => (c === cat ? null : cat))}
                className={cn(
                  "border-2 px-1.5 py-0.5 text-[10px]",
                  runeCategory === cat ? "border-white bg-white text-ink" : "border-accent text-white",
                )}
              >
                {RUNE_CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
          <p className="mx-2 mb-2 text-xs tracking-widest text-muted">
            ルーン {filteredRunes.length}/{usableRunes.length}
          </p>
          <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
            {usableRunes.length === 0 ? (
              <p className="text-xs text-muted">所持ルーンがない。</p>
            ) : filteredRunes.length === 0 ? (
              <p className="text-xs text-muted">条件に合うルーンがない。</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {filteredRunes.map((rune) => {
                  const full = !active || active.socketedRunes.every((r) => r !== null);
                  return (
                    <button
                      key={rune.id}
                      type="button"
                      disabled={full}
                      onClick={() => {
                        if (!active) return;
                        const emptyIdx = active.socketedRunes.findIndex((r) => !r);
                        if (emptyIdx === -1) return;
                        socketRuneToEquipment(active.uid, rune.id, emptyIdx);
                        syncEquippedFromInventory(active.uid);
                      }}
                      className="panel flex flex-col items-center gap-1 p-2 text-center disabled:opacity-40"
                    >
                      <PixelRune effect={rune.effect} className="size-8" />
                      <span className="text-[10px] text-white">{rune.effect}</span>
                      <span className="text-[10px] text-accent">{rune.value}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
