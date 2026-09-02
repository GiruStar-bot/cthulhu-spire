import { PixelSprite } from "@/components/ui/PixelSprite";
import { runeArt } from "@/game/runes";
import { cn } from "@/lib/utils";

export function PixelRune({
  effect,
  className,
}: {
  effect: string;
  className?: string;
}) {
  const src = runeArt(effect);
  if (!src) {
    return <span className={cn("block size-8 bg-blood", className)} />;
  }
  return <PixelSprite src={src} tolerance={110} className={cn("block object-contain", className)} />;
}
