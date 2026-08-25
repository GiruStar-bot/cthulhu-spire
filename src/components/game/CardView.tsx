import type { CSSProperties } from "react";
import { cardCost, cardText, getCard } from "@/game/cards";
import type { CardInst } from "@/game/types";
import { cn } from "@/lib/utils";

const TYPE_LABEL = {
  attack: "攻撃",
  skill: "技能",
  power: "能力",
  status: "状態",
} as const;

function tiltOf(id: string) {
  let n = 0;
  for (let i = 0; i < id.length; i++) n = (n + id.charCodeAt(i) * (i + 1)) % 11;
  return ((n % 7) - 3) * 0.35;
}

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
      style={{ "--tilt": `${tiltOf(card.uid)}deg` } as CSSProperties}
      className={cn(
        "card-rot relative flex shrink-0 flex-col overflow-hidden text-left transition-transform duration-(--motion-fast) ease-(--ease-smooth-out)",
        compact ? "h-48 w-28" : "h-60 w-36 sm:h-72 sm:w-40",
        "bg-surface",
        selected ? "is-lift" : "",
        playable && onClick ? "is-playable" : "",
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
        <span className="card-live absolute top-1.5 left-1.5 grid size-8 place-items-center rounded-full bg-ink font-display text-sm text-parchment shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-parchment)_40%,transparent)]">
          {d.unplayable ? "—" : cost}
        </span>
        {card.upgraded ? (
          <span className="card-live absolute top-1.5 right-1.5 rounded-full bg-accent px-1.5 py-0.5 font-mono text-xs tracking-wider text-ink uppercase">
            +
          </span>
        ) : null}
      </div>
      <div className="relative z-10 flex flex-1 flex-col gap-1 px-2.5 pt-1 pb-2">
        <p className="font-display text-sm leading-tight text-parchment">{d.name}</p>
        <p className="font-mono text-xs tracking-wider text-muted">{TYPE_LABEL[d.type]}</p>
        <p className="text-xs leading-snug text-muted">{cardText(card)}</p>
      </div>
    </Tag>
  );
}
