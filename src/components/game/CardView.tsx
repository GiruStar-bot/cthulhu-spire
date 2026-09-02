import { cardCost, cardEffects, getCard, scaleN } from "@/game/cards";
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
  const value = cornerValue(card);
  const runes = socketedRunes(card);
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "relative shrink-0 overflow-hidden border-2 border-white bg-black text-left font-pixel",
        "transition-transform duration-(--motion-fast) ease-(--ease-smooth-out)",
        compact ? "h-40 w-28" : "h-56 w-36 sm:h-64 sm:w-40",
        selected ? "-translate-y-2" : "",
        playable && onClick ? "hover:-translate-y-1.5" : "",
        !playable && onClick ? "opacity-55" : "",
        d.type === "status" ? "grayscale" : "",
      )}
    >
      <div className="absolute inset-0">
        <PixelSprite src={d.art} className="size-full object-cover" />
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/20 to-transparent" />
      </div>

      <p
        className={cn(
          "absolute right-8 left-8 truncate text-center text-white",
          compact
            ? runes.length
              ? "bottom-14 text-xs"
              : "bottom-9 text-xs"
            : runes.length
              ? "bottom-16 text-sm"
              : "bottom-11 text-sm",
        )}
      >
        {d.name}
        {card.upgraded ? "+" : ""}
      </p>

      {runes.length ? (
        <div className={cn("absolute right-9 left-9 flex flex-wrap justify-center gap-0.5", compact ? "bottom-9" : "bottom-11")}>
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

      <span className="absolute bottom-1 left-1 grid size-8 place-items-center border-2 border-white bg-black text-sm text-white">
        {costLabel}
      </span>

      {value ? (
        <span
          className={cn(
            "absolute right-1 bottom-1 grid size-8 place-items-center border-2 border-white text-sm text-white",
            value.kind === "dmg" ? "bg-red-700" : "bg-blue-700",
          )}
        >
          {value.n}
        </span>
      ) : null}
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

function cornerValue(card: CardInst): { kind: "dmg" | "block"; n: number | string } | null {
  const d = getCard(card.defId);
  const effects = cardEffects(card);
  let dmg: number | string | null = null;
  let blk: number | null = null;
  walk(effects, (e) => {
    if (e.t === "damage" || e.t === "damageAll") dmg = scaleN(e.n, card);
    if (e.t === "damageX") dmg = "X";
    if (e.t === "block" || e.t === "blockPerEnemy") blk = scaleN(e.n, card);
  });
  if (d.type === "attack" && dmg != null) return { kind: "dmg", n: dmg };
  if (blk != null) return { kind: "block", n: blk };
  if (dmg != null) return { kind: "dmg", n: dmg };
  return null;
}

function walk(effects: Effect[], visit: (e: Effect) => void) {
  for (const e of effects) {
    visit(e);
    if (e.t === "ifIntentAttack" || e.t === "ifSanityBelow") walk(e.then, visit);
  }
}
