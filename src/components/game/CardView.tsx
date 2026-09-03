import { cardCost, cardText, getCard } from "@/game/cards";
import { PixelRune } from "@/components/loadout/PixelRune";
import { PixelSprite } from "@/components/ui/PixelSprite";
import type { CardInst, Effect } from "@/game/types";
import { cn } from "@/lib/utils";
import { peekRune } from "@/store/useCollectionStore";

export function CardView({
  card,
  playable,
  selected,
  compact,
  onClick,
}: {
  card: CardInst;
  playable?: boolean;
  selected?: boolean;
  compact?: boolean;
  onClick?: () => void;
}) {
  const d = getCard(card.defId);
  const cost = cardCost(card);
  const costLabel = d.xCost ? "X" : d.unplayable ? "—" : String(cost);
  const runes = socketedRunes(card);
  const Tag = onClick ? "button" : "div";
  const borderColor =
    d.aiTag === "attack"
      ? "border-red-600"
      : d.aiTag === "defense"
        ? "border-blue-500"
        : d.aiTag === "effect"
          ? "border-purple-500"
          : "border-white";

  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "relative flex shrink-0 flex-col overflow-hidden border-2 bg-black text-left font-pixel",
        borderColor,
        "transition-transform duration-(--motion-fast) ease-(--ease-smooth-out)",
        compact ? "h-48 w-32" : "h-64 w-40 sm:h-72 sm:w-48",
        selected ? "-translate-y-2" : "",
        playable && onClick ? "hover:-translate-y-1.5" : "",
        !playable && onClick ? "opacity-55" : "",
        d.type === "status" ? "grayscale" : "",
      )}
    >
      <div className="shrink-0 border-b-2 border-white bg-black px-1 py-0.5">
        <p className={cn("truncate text-white", compact ? "text-xs" : "text-sm")}>
          {d.name}
          {card.upgraded ? "+" : ""}
        </p>
      </div>

      <div className="relative min-h-16 flex-1 overflow-hidden">
        <PixelSprite src={d.art} className="size-full object-cover" />
        <span className="absolute top-1 left-1 z-10 grid size-8 place-items-center border-2 border-white bg-black text-sm text-white">
          {costLabel}
        </span>
      </div>

      <div className="relative h-1 shrink-0 bg-black">
        <div className="absolute inset-x-0 top-0 h-px bg-white" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-white" />
      </div>

      <div className="shrink-0 bg-black px-1 py-1 text-left">
        {runes.length ? (
          <div className="mb-0.5 flex flex-wrap gap-0.5">
            {runes.map((rune) => (
              <span
                key={rune.id}
                title={rune.label}
                className="inline-flex items-center gap-0.5 border-2 border-white bg-black px-0.5 py-px text-[8px] leading-none text-white"
              >
                <PixelRune effect={rune.effect} className="h-4 w-4" />
                <span className="max-w-10 truncate">{rune.label}</span>
              </span>
            ))}
          </div>
        ) : null}
        <p className={cn("text-left text-white/80", compact ? "text-[9px] leading-snug" : "text-[10px] leading-snug")}>
          {cardText(card)}
        </p>
      </div>
    </Tag>
  );
}

function socketedRunes(card: CardInst): { id: string; effect: string; label: string }[] {
  const ids = card.socketedRunes?.filter(Boolean) ?? [];
  const fromPeek = ids
    .map((id) => {
      const rune = peekRune(id);
      if (!rune) return null;
      return { id: rune.id, effect: rune.effect, label: runeLabel(rune.effect, rune.value) };
    })
    .filter((r): r is { id: string; effect: string; label: string } => !!r);
  if (fromPeek.length) return fromPeek;
  const mods = card.runeMods;
  if (!mods) return [];
  const parts: { id: string; effect: string; label: string }[] = [];
  if (mods.damage) parts.push({ id: "atk", effect: "ATK+", label: `ATK+${mods.damage}` });
  if (mods.block) parts.push({ id: "blk", effect: "BLK+", label: `BLK+${mods.block}` });
  if (mods.costDelta) parts.push({ id: "cost", effect: "COST-", label: `COST-${mods.costDelta}` });
  mods.extra.forEach((e, i) => {
    parts.push({ id: `extra-${i}`, effect: extraEffect(e.t), label: extraLabel(e) });
  });
  return parts;
}

function runeLabel(effect: string, value: number): string {
  if (effect.endsWith("+") || effect.endsWith("-")) return `${effect}${value}`;
  return `${effect}+${value}`;
}

function extraEffect(t: string): string {
  if (t === "draw") return "DRAW";
  if (t === "sanity") return "SAN+";
  if (t === "strength") return "STR+";
  if (t === "poison") return "POISON";
  if (t === "heal") return "HEAL";
  return "ATK+";
}

function extraLabel(e: Effect): string {
  if ("n" in e && typeof e.n === "number") return runeLabel(extraEffect(e.t), e.n);
  return e.t;
}
