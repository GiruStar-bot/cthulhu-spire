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
        "relative rounded-none",
        size === "sm" && "w-[6.5rem]",
        size === "md" && "w-28",
        size === "lg" && "w-52 sm:w-64",
        dim && "opacity-40",
        selected && "outline-2 outline-offset-2 outline-white",
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
            "pointer-events-none absolute top-0 right-0 z-10 border-2 border-white bg-black px-1 font-pixel text-[10px] text-white shadow-[2px_2px_0_0_#000]",
            copies >= COPY_LIMIT && "bg-white text-black",
          )}
        >
          {copies}/{COPY_LIMIT}
        </span>
      ) : null}
      {inDeck ? (
        <span className="pointer-events-none absolute top-0 left-0 z-10 border-2 border-white bg-black px-1 font-pixel text-[9px] text-accent shadow-[2px_2px_0_0_#000]">
          IN
        </span>
      ) : null}
      {instance.sockets > 0 ? (
        <span className="pointer-events-none absolute right-1 bottom-10 z-10 flex gap-px">
          {Array.from({ length: instance.sockets }, (_, i) => (
            <span
              key={i}
              className={cn("size-2 border border-black", instance.socketedRunes[i] ? "bg-accent" : "bg-ink-2")}
            />
          ))}
        </span>
      ) : null}
    </div>
  );
}
