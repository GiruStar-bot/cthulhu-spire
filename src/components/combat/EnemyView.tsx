import { PixelSprite } from "@/components/ui/PixelSprite";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

type EnemyViewProps = {
  imageUrl: string;
  hp: number;
  maxHp: number;
  isDead: boolean;
  onClick?: () => void;
  className?: string;
  showHpBar?: boolean;
};

export function EnemyView({
  imageUrl,
  hp,
  maxHp,
  isDead,
  onClick,
  className,
  showHpBar = true,
}: EnemyViewProps) {
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (!isDead) {
      setGone(false);
      return;
    }
    const t = window.setTimeout(() => setGone(true), 1000);
    return () => window.clearTimeout(t);
  }, [isDead]);

  if (gone) return null;

  const ratio = Math.max(0, Math.min(1, hp / Math.max(1, maxHp)));

  return (
    <div
      className={cn("relative flex h-full w-full flex-col items-center", className)}
      onClick={isDead ? undefined : onClick}
    >
      <div
        className={cn(
          "flex min-h-0 w-full flex-1 origin-bottom items-end justify-center transition-transform duration-500 ease-in",
          isDead && "scale-y-0",
        )}
      >
        <PixelSprite src={imageUrl} className="h-full w-full object-contain object-bottom" />
      </div>
      {showHpBar ? (
        <div className="relative mt-1 h-2 w-4/5 min-w-16 bg-black/80">
          <div className="h-full bg-red-700" style={{ width: `${ratio * 100}%` }} />
        </div>
      ) : null}
    </div>
  );
}
