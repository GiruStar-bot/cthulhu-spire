import { CollectionCard } from "@/components/loadout/CollectionCard";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelSprite } from "@/components/ui/PixelSprite";
import { computeDeckSynergy } from "@/game/combat";
import { ARCHETYPE_LABELS, DECK_LIMIT, getCard, makeCard } from "@/game/cards";
import type { Archetype, CardInst, Rarity } from "@/game/types";
import { cn } from "@/lib/utils";
import {
  COPY_LIMIT,
  copiesOfBase,
  deckSize,
  useCollectionStore,
  type CardInstance,
} from "@/store/useCollectionStore";
import { useEffect, useMemo, useRef, useState } from "react";

type CardGroup = {
  key: string;
  baseCardId: string;
  representative: CardInstance;
};

type Flight = {
  x: number;
  y: number;
  tx: number;
  ty: number;
  armed: boolean;
  cardId: string;
};

type AiTag = "attack" | "defense" | "effect";
type SortMode = "cost" | "rarity" | "owned" | "archetype";

function ownedCountOf(cards: CardInstance[], baseCardId: string): number {
  return cards.filter((c) => c.baseCardId === baseCardId).length;
}

function groupInventory(cards: CardInstance[]): CardGroup[] {
  const groups = new Map<string, CardGroup>();
  for (const card of cards) {
    if (groups.has(card.baseCardId)) continue;
    groups.set(card.baseCardId, {
      key: card.baseCardId,
      baseCardId: card.baseCardId,
      representative: card,
    });
  }
  return [...groups.values()];
}

export function nextDeckName(decks: Record<string, unknown>): string {
  let n = Object.keys(decks).length + 1;
  while (decks[`デッキ${n}`]) n += 1;
  return `デッキ${n}`;
}

const RARITY_LABELS: Record<Rarity, string> = {
  starter: "スターター",
  common: "コモン",
  uncommon: "アンコモン",
  rare: "レア",
  status: "状態",
};
const AI_TAG_LABELS: Record<AiTag, string> = {
  attack: "攻撃",
  defense: "防御",
  effect: "効果",
};
const FILTERABLE_ARCHETYPES = Object.keys(ARCHETYPE_LABELS) as Archetype[];
const FILTERABLE_RARITIES: Rarity[] = ["starter", "common", "uncommon", "rare"];
const FILTERABLE_AI_TAGS: AiTag[] = ["attack", "defense", "effect"];
const RARITY_ORDER: Rarity[] = ["starter", "common", "uncommon", "rare", "status"];
const SORT_LABELS: Record<SortMode, string> = {
  cost: "コスト順",
  rarity: "レア度順",
  owned: "所持数順",
  archetype: "ジャンル順",
};
const TIER_LABELS: Record<1 | 2 | 3, string> = {
  1: "小バフ",
  2: "中バフ",
  3: "大バフ",
};
const SYNERGY_THRESHOLDS = [8, 12, 16] as const;

function toggleInSet<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

function sortGroups(groups: CardGroup[], mode: SortMode, ownedOf: (baseCardId: string) => number): CardGroup[] {
  const withDef = groups.map((g) => ({ g, def: getCard(g.baseCardId) }));
  withDef.sort((a, b) => {
    switch (mode) {
      case "cost":
        return a.def.cost - b.def.cost || a.def.name.localeCompare(b.def.name, "ja");
      case "rarity":
        return (
          RARITY_ORDER.indexOf(a.def.rarity) - RARITY_ORDER.indexOf(b.def.rarity) || a.def.cost - b.def.cost
        );
      case "owned":
        return ownedOf(b.g.baseCardId) - ownedOf(a.g.baseCardId) || a.def.cost - b.def.cost;
      case "archetype": {
        const ai = FILTERABLE_ARCHETYPES.indexOf(a.def.archetype ?? "generic");
        const bi = FILTERABLE_ARCHETYPES.indexOf(b.def.archetype ?? "generic");
        return ai - bi || a.def.cost - b.def.cost;
      }
      default:
        return 0;
    }
  });
  return withDef.map((w) => w.g);
}

function FilterPopover<T extends string>({
  label,
  options,
  optionLabel,
  selected,
  onToggle,
  onReset,
}: {
  label: string;
  options: readonly T[];
  optionLabel: (value: T) => string;
  selected: Set<T>;
  onToggle: (value: T) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDocPointerDown);
    return () => document.removeEventListener("pointerdown", onDocPointerDown);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "panel flex items-center gap-1.5 px-2 py-1.5 text-[11px] text-muted",
          selected.size > 0 && "border-accent text-accent",
        )}
      >
        {label}
        {selected.size > 0 ? (
          <span className="grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[9px] font-bold text-ink">
            {selected.size}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="panel absolute left-0 top-[calc(100%+4px)] z-20 flex w-72 max-w-[80vw] flex-col gap-2 p-2">
          <div className="flex flex-wrap gap-1">
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => onToggle(opt)}
                className={cn(
                  "border-2 px-1.5 py-0.5 text-[10px]",
                  selected.has(opt) ? "border-white bg-white text-ink" : "border-accent text-white",
                )}
              >
                {optionLabel(opt)}
              </button>
            ))}
          </div>
          {selected.size > 0 ? (
            <button
              type="button"
              onClick={onReset}
              className="self-start border-2 border-accent px-1.5 py-0.5 text-[10px] text-white"
            >
              リセット
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function PoolThumb({
  group,
  copies,
  owned,
  blocked,
  selected,
  onClick,
}: {
  group: CardGroup;
  copies: number;
  owned: number;
  blocked: boolean;
  selected: boolean;
  onClick: () => void;
}) {
  const def = getCard(group.baseCardId);
  const costLabel = def.xCost ? "X" : def.unplayable ? "—" : String(def.cost);
  const borderColor =
    def.aiTag === "attack"
      ? "border-red-600"
      : def.aiTag === "defense"
        ? "border-blue-500"
        : def.aiTag === "effect"
          ? "border-purple-500"
          : "border-white/40";

  return (
    <button
      type="button"
      onClick={onClick}
      title={def.name}
      className={cn(
        "relative box-border aspect-[5/7] overflow-hidden border-2 bg-ink-2 transition-transform duration-(--motion-fast) ease-(--ease-smooth-out)",
        borderColor,
        selected ? "-translate-y-1 border-accent" : "hover:-translate-y-0.5",
        blocked ? "opacity-45" : "",
      )}
    >
      <PixelSprite src={def.art} className="absolute inset-0 size-full object-cover" />
      <span className="panel absolute top-0.5 left-0.5 z-10 grid size-4 place-items-center text-[8px] text-white">
        {costLabel}
      </span>
      <span className="absolute right-0.5 bottom-0.5 z-10 border border-border bg-ink/90 px-1 text-[8px] text-muted">
        {copies}/{owned}
      </span>
      <span className="absolute inset-x-0 bottom-0 z-10 truncate bg-black/70 px-1 py-0.5 text-left text-[9px] text-white">
        {def.name}
      </span>
    </button>
  );
}

function DeckGauge({ total, limit }: { total: number; limit: number }) {
  const pct = Math.min(100, Math.round((total / Math.max(1, limit)) * 100));
  return (
    <div
      className="grid size-12 shrink-0 place-items-center rounded-full"
      style={{ background: `conic-gradient(var(--color-accent) ${pct}%, var(--color-surface) 0)` }}
    >
      <div className="grid size-9 place-items-center rounded-full bg-ink text-[10px] font-bold tabular-nums text-white">
        {total}/{limit}
      </div>
    </div>
  );
}

function DeckRow({
  cardId,
  count,
  onSelect,
  onRemove,
}: {
  cardId: string;
  count: number;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const def = getCard(cardId);
  const archetypeLabel = def.archetype ? ARCHETYPE_LABELS[def.archetype] : undefined;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter") onSelect();
      }}
      className="flex items-center gap-2 border-b border-border/60 px-3 py-1.5 hover:bg-white/5"
    >
      <span className="relative h-10 w-7 shrink-0 overflow-hidden border border-border">
        <PixelSprite src={def.art} className="absolute inset-0 size-full object-cover" />
      </span>
      <span className="min-w-0 flex-1">
        <p className="truncate text-xs text-white">{def.name}</p>
        {archetypeLabel ? <p className="text-[9px] text-accent">{archetypeLabel}</p> : null}
      </span>
      <span className="shrink-0 text-xs tabular-nums text-muted">×{count}</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="shrink-0 px-1.5 text-sm text-blood"
        title="1枚減らす"
      >
        −
      </button>
    </div>
  );
}

export function DeckBuilderScreen({
  onClose,
  embedded = false,
  onBack,
}: {
  onClose?: () => void;
  embedded?: boolean;
  onBack?: () => void;
}) {
  const hubMode = !!onBack;
  const inventory = useCollectionStore((s) => s.inventory);
  const decks = useCollectionStore((s) => s.decks);
  const activeDeck = useCollectionStore((s) => s.activeDeck);
  const addToDeck = useCollectionStore((s) => s.addToDeck);
  const removeFromDeck = useCollectionStore((s) => s.removeFromDeck);
  const createDeck = useCollectionStore((s) => s.createDeck);
  const deleteDeck = useCollectionStore((s) => s.deleteDeck);
  const renameDeck = useCollectionStore((s) => s.renameDeck);
  const setActiveDeck = useCollectionStore((s) => s.setActiveDeck);
  const [flight, setFlight] = useState<Flight | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [filterArchetypes, setFilterArchetypes] = useState<Set<Archetype>>(new Set());
  const [filterRarities, setFilterRarities] = useState<Set<Rarity>>(new Set());
  const [filterAiTags, setFilterAiTags] = useState<Set<AiTag>>(new Set());
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("cost");
  const [previewCardId, setPreviewCardId] = useState<string | null>(null);
  const previewCardRef = useRef<HTMLDivElement>(null);
  const deckPanelRef = useRef<HTMLDivElement>(null);

  const counts = decks[activeDeck] ?? {};
  const total = deckSize(counts);
  const names = Object.keys(decks);
  const activeFilterCount = filterArchetypes.size + filterRarities.size + filterAiTags.size;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (previewCardId !== null) {
        setPreviewCardId(null);
        return;
      }
      if (!embedded) onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, embedded, previewCardId]);

  useEffect(() => {
    if (!flight || flight.armed) return;
    const id = requestAnimationFrame(() =>
      setFlight((f) => (f ? { ...f, armed: true, x: f.tx, y: f.ty } : f)),
    );
    return () => cancelAnimationFrame(id);
  }, [flight]);

  const handleAdd = (baseCardId: string) => {
    if (flight) return;
    const copies = copiesOfBase(counts, baseCardId);
    const owned = ownedCountOf(inventory.cards, baseCardId);
    if (total >= DECK_LIMIT || copies >= COPY_LIMIT || copies >= owned) return;
    const origin = previewCardRef.current?.getBoundingClientRect();
    const dest = deckPanelRef.current?.getBoundingClientRect();
    if (!origin || !dest) {
      addToDeck(baseCardId);
      return;
    }
    setFlight({
      cardId: baseCardId,
      x: origin.left + origin.width / 2,
      y: origin.top + origin.height / 2,
      tx: dest.left + dest.width / 2,
      ty: dest.top + 40,
      armed: false,
    });
    window.setTimeout(() => {
      addToDeck(baseCardId);
      setFlight(null);
    }, 220);
  };

  const groups = groupInventory(inventory.cards);
  const query = search.trim().toLowerCase();
  const searchedGroups = query
    ? groups.filter((g) => getCard(g.baseCardId).name.toLowerCase().includes(query))
    : groups;
  const filteredGroups = searchedGroups.filter((group) => {
    const def = getCard(group.baseCardId);
    if (filterArchetypes.size > 0 && !filterArchetypes.has(def.archetype ?? "generic")) return false;
    if (filterRarities.size > 0 && !filterRarities.has(def.rarity)) return false;
    if (filterAiTags.size > 0 && (!def.aiTag || !filterAiTags.has(def.aiTag))) return false;
    return true;
  });
  const sortedGroups = sortGroups(filteredGroups, sortMode, (id) => ownedCountOf(inventory.cards, id));
  const flying = flight ? inventory.cards.find((c) => c.baseCardId === flight.cardId) : null;
  const deckEntries = Object.entries(counts);

  const commitRename = () => {
    const ok = renameDeck(activeDeck, draftName);
    if (ok) setRenaming(false);
  };

  const deckCardInsts = useMemo<CardInst[]>(() => {
    const result: CardInst[] = [];
    for (const [cardId, count] of Object.entries(counts)) {
      for (let i = 0; i < count; i++) result.push(makeCard(cardId));
    }
    return result;
  }, [counts]);
  const synergy = computeDeckSynergy(deckCardInsts);
  const topArchetype = useMemo(() => {
    const tally = new Map<Archetype, number>();
    for (const c of deckCardInsts) {
      const def = getCard(c.defId);
      if (!def.archetype || def.archetype === "generic") continue;
      tally.set(def.archetype, (tally.get(def.archetype) ?? 0) + 1);
    }
    let best: { archetype: Archetype; count: number } | null = null;
    for (const [archetype, count] of tally) {
      if (!best || count > best.count) best = { archetype, count };
    }
    return best;
  }, [deckCardInsts]);

  let synergyHint: string | null = null;
  if (topArchetype && topArchetype.count > 0) {
    const label = ARCHETYPE_LABELS[topArchetype.archetype] ?? topArchetype.archetype;
    const tier = synergy?.archetype === topArchetype.archetype ? synergy.tier : 0;
    if (tier === 3) {
      synergyHint = `${label} ${topArchetype.count}枚 → ${TIER_LABELS[3]}中（最大）`;
    } else {
      const nextThreshold = SYNERGY_THRESHOLDS[tier];
      const remaining = Math.max(0, nextThreshold - topArchetype.count);
      const nextLabel = TIER_LABELS[(tier + 1) as 1 | 2 | 3];
      synergyHint =
        tier === 0
          ? `${label} ${topArchetype.count}枚 → あと${remaining}枚で${nextLabel}`
          : `${label} ${topArchetype.count}枚 → ${TIER_LABELS[tier as 1 | 2]}中（あと${remaining}枚で${nextLabel}）`;
    }
  }

  const previewDef = previewCardId ? getCard(previewCardId) : null;
  const previewInstance = previewCardId
    ? (inventory.cards.find((c) => c.baseCardId === previewCardId) ?? {
        instanceId: previewCardId,
        baseCardId: previewCardId,
        origin: "starter" as const,
      })
    : null;
  const previewCopies = previewCardId ? copiesOfBase(counts, previewCardId) : 0;
  const previewOwned = previewCardId ? ownedCountOf(inventory.cards, previewCardId) : 0;
  const previewBlocked =
    !previewCardId || total >= DECK_LIMIT || previewCopies >= COPY_LIMIT || previewCopies >= previewOwned;

  return (
    <section className={cn("flex w-full flex-col font-pixel text-parchment", embedded ? "h-full bg-transparent" : "h-dvh bg-ink")}>
      {hubMode ? (
        <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b-2 border-border bg-ink-2 px-3">
          <PixelButton onClick={onBack} className="min-h-9 shrink-0 px-3 py-1 text-xs">
            ← 戻る
          </PixelButton>
          <h1 className="min-w-0 flex-1 truncate text-center text-sm tracking-widest">{activeDeck}</h1>
          <span className={cn("shrink-0 text-sm tabular-nums", total >= DECK_LIMIT ? "text-blood" : "text-accent")}>
            {total}/{DECK_LIMIT}
          </span>
          <PixelButton onClick={onBack} className="min-h-9 shrink-0 px-3 py-1 text-xs">
            デッキ保存
          </PixelButton>
        </header>
      ) : embedded ? null : (
        <header className="flex h-12 shrink-0 items-center justify-between border-b-2 border-border bg-ink-2 px-3">
          <h1 className="text-sm tracking-widest">デッキ編成</h1>
          <span className={cn("text-sm tabular-nums", total >= DECK_LIMIT ? "text-blood" : "text-accent")}>
            {total}/{DECK_LIMIT}
          </span>
          {onClose ? (
            <PixelButton onClick={onClose} className="min-h-9 px-3 py-1 text-xs">
              戻る
            </PixelButton>
          ) : (
            <span />
          )}
        </header>
      )}

      {hubMode ? null : (
        <div className="flex shrink-0 flex-wrap items-center gap-1 border-b-2 border-border bg-ink-2 px-3 py-2">
          {names.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => {
                setRenaming(false);
                setActiveDeck(name);
              }}
              className={cn(
                "border-2 px-2 py-1 text-xs",
                name === activeDeck ? "border-white bg-white text-ink" : "border-border text-muted",
              )}
            >
              {name}
            </button>
          ))}
          <PixelButton
            className="min-h-8 px-2 py-1 text-[10px]"
            onClick={() => {
              setRenaming(false);
              createDeck(nextDeckName(decks));
            }}
          >
            ＋新規デッキ
          </PixelButton>
          {embedded ? (
            <span className={cn("ml-auto text-xs tabular-nums", total >= DECK_LIMIT ? "text-blood" : "text-accent")}>
              {total}/{DECK_LIMIT}
            </span>
          ) : null}
        </div>
      )}

      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b-2 border-border px-3 py-2">
        {renaming ? (
          <>
            <input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              maxLength={12}
              className="panel px-2 py-1 font-pixel text-xs text-white outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") setRenaming(false);
              }}
            />
            <PixelButton className="min-h-8 px-2 py-1 text-[10px]" onClick={commitRename}>
              決定
            </PixelButton>
            <PixelButton className="min-h-8 px-2 py-1 text-[10px]" onClick={() => setRenaming(false)}>
              取消
            </PixelButton>
          </>
        ) : (
          <>
            <PixelButton
              className="min-h-8 px-2 py-1 text-[10px]"
              onClick={() => {
                setDraftName(activeDeck);
                setRenaming(true);
              }}
            >
              名前変更
            </PixelButton>
            <PixelButton
              className="min-h-8 px-2 py-1 text-[10px]"
              disabled={names.length <= 1}
              onClick={() => deleteDeck(activeDeck)}
            >
              削除
            </PixelButton>
          </>
        )}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b-2 border-border px-3 py-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="カード名で検索..."
          className="panel min-w-0 max-w-56 flex-1 px-2 py-1.5 font-pixel text-xs text-white outline-none placeholder:text-muted"
        />
        <FilterPopover
          label="ジャンル"
          options={FILTERABLE_ARCHETYPES}
          optionLabel={(a) => ARCHETYPE_LABELS[a] ?? a}
          selected={filterArchetypes}
          onToggle={(a) => setFilterArchetypes((s) => toggleInSet(s, a))}
          onReset={() => setFilterArchetypes(new Set())}
        />
        <FilterPopover
          label="レア度"
          options={FILTERABLE_RARITIES}
          optionLabel={(r) => RARITY_LABELS[r]}
          selected={filterRarities}
          onToggle={(r) => setFilterRarities((s) => toggleInSet(s, r))}
          onReset={() => setFilterRarities(new Set())}
        />
        <FilterPopover
          label="種別"
          options={FILTERABLE_AI_TAGS}
          optionLabel={(t) => AI_TAG_LABELS[t]}
          selected={filterAiTags}
          onToggle={(t) => setFilterAiTags((s) => toggleInSet(s, t))}
          onReset={() => setFilterAiTags(new Set())}
        />
        <select
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value as SortMode)}
          className="panel ml-auto px-2 py-1.5 font-pixel text-[11px] text-white outline-none"
        >
          {(Object.keys(SORT_LABELS) as SortMode[]).map((mode) => (
            <option key={mode} value={mode}>
              {SORT_LABELS[mode]}
            </option>
          ))}
        </select>
        {activeFilterCount > 0 || query ? (
          <button
            type="button"
            onClick={() => {
              setFilterArchetypes(new Set());
              setFilterRarities(new Set());
              setFilterAiTags(new Set());
              setSearch("");
            }}
            className="border-2 border-accent px-1.5 py-0.5 text-[10px] text-white"
          >
            条件をリセット
          </button>
        ) : null}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[1fr_20rem_20rem]">
        <div className="grid min-h-0 grid-cols-[repeat(auto-fill,minmax(5rem,1fr))] content-start gap-2 overflow-y-auto p-3">
          {sortedGroups.length === 0 ? (
            <p className="col-span-full py-10 text-center text-xs text-muted">条件に合うカードがない。</p>
          ) : (
            sortedGroups.map((group) => {
              const copies = copiesOfBase(counts, group.baseCardId);
              const owned = ownedCountOf(inventory.cards, group.baseCardId);
              const remaining = Math.min(COPY_LIMIT, owned) - copies;
              const blocked = remaining <= 0 || total >= DECK_LIMIT;
              return (
                <PoolThumb
                  key={group.key}
                  group={group}
                  copies={copies}
                  owned={owned}
                  blocked={blocked}
                  selected={previewCardId === group.baseCardId}
                  onClick={() => setPreviewCardId(group.baseCardId)}
                />
              );
            })
          )}
        </div>

        <div
          className={cn(
            "flex-col items-center overflow-y-auto p-4",
            previewCardId ? "fixed inset-0 z-40 flex bg-ink" : "hidden",
            "lg:static lg:z-auto lg:flex lg:border-x-2 lg:border-border lg:bg-transparent",
          )}
        >
          <button
            type="button"
            onClick={() => setPreviewCardId(null)}
            className="panel mb-2 self-end px-2 py-1 text-[10px] text-white lg:hidden"
          >
            閉じる ×
          </button>
          {previewDef && previewInstance ? (
            <>
              <p className="text-[11px] tracking-widest text-accent">
                {previewDef.archetype ? (ARCHETYPE_LABELS[previewDef.archetype] ?? "無属性") : "無属性"}
              </p>
              <div ref={previewCardRef} className="mt-2 w-44 sm:w-48">
                <CollectionCard instance={previewInstance} size="lg" copies={previewCopies} copiesMax={previewOwned} />
              </div>
              <h2 className="mt-3 text-lg text-white">{previewDef.name}</h2>
              <p className="mb-2 text-[11px] text-muted">
                {RARITY_LABELS[previewDef.rarity]} · コスト{previewDef.xCost ? "X" : previewDef.cost} · 所持
                {previewOwned}枚
              </p>
              {previewDef.flavor ? (
                <p className="mt-1 max-w-64 text-center text-[11px] italic text-muted">{previewDef.flavor}</p>
              ) : null}
              <PixelButton
                disabled={previewBlocked}
                onClick={() => previewCardId && handleAdd(previewCardId)}
                className="mt-4 px-6 py-2 text-xs"
              >
                デッキに追加 +
              </PixelButton>
              {previewBlocked ? (
                <p className="mt-1 text-[10px] text-blood">
                  {total >= DECK_LIMIT
                    ? "デッキが上限です"
                    : previewCopies >= previewOwned
                      ? "所持数の上限です"
                      : "編成上限（4枚）です"}
                </p>
              ) : null}
            </>
          ) : (
            <p className="mt-16 text-center text-xs text-muted">
              カードを選ぶと
              <br />
              ここに詳細が表示されます
            </p>
          )}
        </div>

        <div ref={deckPanelRef} className="flex min-h-0 flex-col border-t-2 border-border lg:border-t-0">
          <div className="shrink-0 border-b-2 border-border p-3">
            <p className="mb-2 text-xs tracking-widest text-muted">編成中 · {activeDeck}</p>
            <div className="flex items-center gap-3">
              <DeckGauge total={total} limit={DECK_LIMIT} />
              <div className="min-w-0">
                <p className="text-[11px] text-muted">デッキ枚数</p>
                <p className={cn("text-[10px]", synergyHint ? "text-accent" : "text-muted")}>
                  {synergyHint ?? "ジャンルの偏りなし"}
                </p>
              </div>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {deckEntries.length === 0 ? (
              <p className="py-10 text-center text-xs text-muted">カードをクリックして編成</p>
            ) : (
              deckEntries.map(([cardId, count]) => (
                <DeckRow
                  key={cardId}
                  cardId={cardId}
                  count={count}
                  onSelect={() => setPreviewCardId(cardId)}
                  onRemove={() => removeFromDeck(cardId)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {flight && flying ? (
        <div
          className="pointer-events-none fixed z-50 w-32 transition-[left,top] duration-200 ease-linear"
          style={{ left: flight.x, top: flight.y, transform: "translate(-50%, -50%)" }}
        >
          <CollectionCard instance={flying} size="sm" />
        </div>
      ) : null}
    </section>
  );
}
