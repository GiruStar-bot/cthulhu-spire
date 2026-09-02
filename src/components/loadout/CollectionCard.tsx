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
  onClick,
}: {
  instance: CardInstance;
  copies?: number;
  selected?: boolean;
  inDeck?: boolean;
  size?: "sm" | "md" | "lg";
  dim?: boolean;
  onClick?: () => void;
}) {
  const card = instFromLoadout(instance);
  return (
    <div
      className={cn(
        "relative",
        size === "sm" && "w-[6.5rem]",
        size === "md" && "w-28",
        size === "lg" && "w-52 sm:w-64",
        dim && "opacity-45",
      )}
    >
      <div
        className={cn(
          size === "sm" && "[&>*]:!h-36 [&>*]:!w-[6.5rem]",
          size === "md" && "[&>*]:!h-40 [&>*]:!w-28",
          size === "lg" && "[&>*]:!h-[22rem] [&>*]:!w-52 sm:[&>*]:!h-[26rem] sm:[&>*]:!w-64",
        )}
      >
        <CardView card={card} compact={size !== "lg"} selected={selected} playable={!dim} onClick={onClick} />
      </div>
      {typeof copies === "number" ? (
        <span
          className={cn(
            "pointer-events-none absolute top-1 right-1 z-10 border-2 border-white bg-black px-1 font-pixel text-[10px] text-white",
            copies >= COPY_LIMIT && "border-amber-400 text-amber-300",
          )}
        >
          {copies}/{COPY_LIMIT}
        </span>
      ) : null}
      {inDeck ? (
        <span className="pointer-events-none absolute top-1 left-1 z-10 border border-emerald-400 bg-black/80 px-1 font-pixel text-[9px] text-emerald-300">
          IN
        </span>
      ) : null}
      {instance.sockets > 0 ? (
        <span className="pointer-events-none absolute right-1 bottom-10 z-10 flex gap-0.5">
          {Array.from({ length: instance.sockets }, (_, i) => (
            <span
              key={i}
              className={cn(
                "size-1.5 rounded-full ring-1 ring-black",
                instance.socketedRunes[i] ? "bg-emerald-400 shadow-[0_0_6px_#34d399]" : "bg-gray-700",
              )}
            />
          ))}
        </span>
      ) : null}
    </div>
  );
}
