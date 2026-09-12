import { ARCHETYPE_LABELS, cardCost, cardText, frameClassForCard, getCard } from "@/game/cards";
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
  const frameClass = frameClassForCard(d);
  const headerTone =
    d.aiTag === "attack"
      ? "border-red-600 bg-red-950/85"
      : d.aiTag === "defense"
        ? "border-blue-500 bg-blue-950/85"
        : d.aiTag === "effect"
          ? "border-purple-500 bg-purple-950/85"
          : "border-border bg-ink-2";
  const outlineColor =
    frameClass
      ? ""
      : d.aiTag === "attack"
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
        frameClass,
        "relative flex shrink-0 flex-col bg-ink-2 text-left font-pixel",
        "transition-[transform,box-shadow,filter] duration-100",
        compact ? "h-48 w-32" : "h-64 w-40 sm:h-72 sm:w-48",
        frameClass ? (compact ? "border-[8px]" : "") : "border-2",
        outlineColor,
        selected ? "-translate-y-2" : "",
        playable && onClick ? "hover:-translate-y-1.5" : "",
        onClick ? "active:translate-y-[1px] active:brightness-90" : "",
        !playable && onClick ? "opacity-55" : "",
        d.type === "status" ? "grayscale" : "",
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center justify-between gap-1 border-b-2",
          headerTone,
          compact ? "px-1 py-0.5" : "px-1.5 py-1",
        )}
      >
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

      <div
        className={cn(
          "relative min-h-0 flex-1 overflow-hidden border border-black/70 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]",
          compact ? "mx-0.5 mt-0.5" : "mx-1 mt-1",
        )}
      >
        <PixelSprite src={d.art} className="size-full object-cover" />
        <span className="panel absolute top-1 left-1 z-10 grid size-7 place-items-center text-xs text-white sm:size-8 sm:text-sm">
          {costLabel}
        </span>
      </div>

      <div className={cn("shrink-0 bg-ink-2 text-left", compact ? "px-1 py-0.5" : "px-1.5 py-1")}>
        <p className={cn("text-left text-white/80", compact ? "text-[9px] leading-snug" : "text-[10px] leading-snug")}>
          {cardText(card)}
        </p>
      </div>
    </Tag>
  );
}