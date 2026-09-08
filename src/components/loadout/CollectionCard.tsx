import { CardView } from "@/components/game/CardView";
import { instFromLoadout } from "@/game/cardEvaluator";
import { cn } from "@/lib/utils";
import { COPY_LIMIT, type CardInstance } from "@/store/useCollectionStore";

export function CollectionCard({
  instance,
  copies,
  selected,
  inDeck,
  size = "sm",
  dim,
  stackCount,
  copiesMax,
  onClick,
}: {
  instance: CardInstance;
  copies?: number;
  selected?: boolean;
  inDeck?: boolean;
  size?: "sm" | "md" | "lg";
  dim?: boolean;
  stackCount?: number;
  copiesMax?: number;
  onClick?: () => void;
}) {
  const card = instFromLoadout(instance);
  return (
    <div
      className={cn(
        "relative rounded-none",
        size === "sm" && "w-32",
        size === "md" && "w-36",
        size === "lg" && "w-44 sm:w-48",
        dim && "opacity-40",
        selected && "outline-2 outline-offset-2 outline-white",
      )}
    >
      <div
        className={cn(
          size === "sm" && "[&>*]:!h-48 [&>*]:!w-32",
          size === "md" && "[&>*]:!h-48 [&>*]:!w-36",
          size === "lg" && "[&>*]:!h-64 [&>*]:!w-44 sm:[&>*]:!h-72 sm:[&>*]:!w-48",
        )}
      >
        <CardView card={card} compact={size !== "lg"} selected={selected} playable={!dim} onClick={onClick} />
      </div>
      {typeof copies === "number" ? (
        <span
          className={cn(
            "pointer-events-none absolute bottom-0 right-0 z-10 px-1 font-pixel text-[10px]",
            copies >= (copiesMax ?? COPY_LIMIT)
              ? "border-2 border-white bg-white text-black shadow-[2px_2px_0_0_#000]"
              : "border-2 border-parchment/70 bg-ink text-white shadow-[2px_2px_0_0_#000]",
          )}
        >
          {copies}/{copiesMax ?? COPY_LIMIT}
        </span>
      ) : null}
      {inDeck ? (
        <span className="pointer-events-none absolute top-0 left-0 z-10 border-2 border-white bg-black px-1 font-pixel text-[9px] text-accent shadow-[2px_2px_0_0_#000]">
          IN
        </span>
      ) : null}
      {typeof stackCount === "number" && stackCount > 1 ? (
        <span className="panel pointer-events-none absolute bottom-0 left-0 z-10 px-1 font-pixel text-[10px] text-white">
          ×{stackCount}
        </span>
      ) : null}
    </div>
  );
}
