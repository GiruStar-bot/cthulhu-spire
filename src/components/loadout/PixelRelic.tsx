import { PixelSprite } from "@/components/ui/PixelSprite";
import { relicArt } from "@/game/relics";
import { cn } from "@/lib/utils";

export function PixelRelic({
  defId,
  className,
}: {
  defId: string;
  className?: string;
}) {
  const src = relicArt(defId);
  if (!src) {
    return <span className={cn("block size-8 bg-ink-2", className)} />;
  }
  return <PixelSprite src={src} tolerance={40} feather={24} className={cn("block object-contain", className)} />;
}
