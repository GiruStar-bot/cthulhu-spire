import { cardCost, cardText, getCard } from "@/game/cards";
import type { CardInst } from "@/game/types";
import { cn } from "@/lib/utils";

const TYPE_LABEL = {
  attack: "攻撃",
  skill: "技能",
  power: "能力",
  status: "状態",
} as const;

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
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "relative flex shrink-0 flex-col overflow-hidden border text-left transition-[transform,box-shadow,border-color] duration-(--motion-fast) ease-(--ease-smooth-out)",
        compact ? "h-48 w-28" : "h-60 w-36 sm:h-72 sm:w-40",
        "rounded-[var(--radius-lg)] bg-surface",
        selected ? "border-accent -translate-y-2 shadow-[0_12px_32px_rgba(0,0,0,0.45)]" : "border-border",
        playable && onClick ? "hover:-translate-y-1.5" : "",
        !playable && onClick ? "opacity-55" : "",
        d.type === "status" ? "grayscale" : "",
      )}
    >
      <div className="relative h-[46%] overflow-hidden">
        <img
          src={d.art}
          alt=""
          className="size-full object-cover"
          crossOrigin="anonymous"
        />
        <div className="absolute inset-0 bg-linear-to-b from-transparent to-surface" />
        <span className="absolute top-1.5 left-1.5 grid size-7 place-items-center rounded-full bg-ink font-display text-sm text-parchment tabular-nums">
          {d.unplayable ? "—" : cost}
        </span>
        {card.upgraded ? (
          <span className="absolute top-1.5 right-1.5 rounded-full bg-accent px-1.5 py-0.5 font-mono text-[9px] tracking-wider text-ink uppercase">
            +
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1 px-2.5 pt-1 pb-2">
        <p className="font-display text-[13px] leading-tight text-parchment sm:text-sm">{d.name}</p>
        <p className="font-mono text-[9px] tracking-wider text-muted">
          {TYPE_LABEL[d.type]}
        </p>
        <p className="text-[10px] leading-snug text-muted sm:text-[11px]">{cardText(card)}</p>
      </div>
    </Tag>
  );
}
