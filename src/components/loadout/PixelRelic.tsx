import { EQUIPMENT } from "@/game/equipment";
import { cn } from "@/lib/utils";

export function PixelRelic({
  defId,
  className,
}: {
  defId: string;
  className?: string;
}) {
  const src = EQUIPMENT[defId]?.art;
  if (!src) return null;
  return <img src={src} alt="" className={cn("object-contain", className)} />;
}
