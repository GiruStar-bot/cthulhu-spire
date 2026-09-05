import { ARCHETYPE_LABELS, cardCost, cardText, getCard } from "@/game/cards";
import { PixelSprite } from "@/components/ui/PixelSprite";
import type { CardInst } from "@/game/types";
import { cn } from "@/lib/utils";

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
      <div className="flex shrink-0 items-center justify-between gap-1 border-b-2 border-white bg-black px-1 py-0.5">
        <p className={cn("min-w-0 truncate text-white", compact ? "text-xs" : "text-sm")}>
          {d.name}
          {card.upgraded ? "+" : ""}
        </p>
        {d.archetype && ARCHETYPE_LABELS[d.archetype] ? (
          <span className="shrink-0 border border-white/60 px-1 text-[8px] leading-tight text-white">
            {ARCHETYPE_LABELS[d.archetype]}
          </span>
        ) : null}
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
        <p className={cn("text-left text-white/80", compact ? "text-[9px] leading-snug" : "text-[10px] leading-snug")}>
          {cardText(card)}
        </p>
      </div>
    </Tag>
  );
}
