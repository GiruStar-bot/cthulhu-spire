import { CreatureMedia } from "@/components/game/CreatureMedia";
import { PixelFrames } from "@/components/ui/PixelFrames";
import { PixelSprite } from "@/components/ui/PixelSprite";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState, type CSSProperties } from "react";

type DustParticle = {
  id: number;
  left: number;
  top: number;
  size: number;
  angle: number;
  distance: number;
  delay: number;
};

function makeDustParticles(): DustParticle[] {
  const count = 23 + Math.floor(Math.random() * 16);
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: 40 + Math.random() * 20,
    top: 50 + Math.random() * 30,
    size: 3 + Math.random() * 4,
    angle: (Math.random() - 0.5) * 140,
    distance: 40 + Math.random() * 60,
    delay: Math.random() * 0.3,
  }));
}

type EnemyViewProps = {
  imageUrl: string;
  videoUrl?: string;
  frames?: string[];
  hp: number;
  maxHp: number;
  isDead: boolean;
  onClick?: () => void;
  className?: string;
  showHpBar?: boolean;
};

export function EnemyView({
  imageUrl,
  videoUrl,
  frames,
  hp,
  maxHp,
  isDead,
  onClick,
  className,
  showHpBar = true,
}: EnemyViewProps) {
  const [gone, setGone] = useState(false);
  const dustParticles = useMemo(() => (isDead ? makeDustParticles() : []), [isDead]);

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
  const spriteClass = "pointer-events-none h-full w-full select-none object-contain object-bottom";

  return (
    <div
      className={cn("relative flex h-full w-full flex-col items-center", className)}
      onClick={isDead ? undefined : onClick}
    >
      <div
        className={cn(
          "flex min-h-0 w-full flex-1 items-end justify-center",
          isDead && "enemy-dissolve",
        )}
      >
        {videoUrl && !isDead ? (
          <CreatureMedia src={videoUrl} poster={imageUrl} className={spriteClass} />
        ) : frames && frames.length > 1 && !isDead ? (
          <PixelFrames srcs={frames} className={spriteClass} />
        ) : (
          <PixelSprite src={imageUrl} className={spriteClass} />
        )}
      </div>
      {isDead
        ? dustParticles.map((p) => (
            <span
              key={p.id}
              className="dust-particle"
              style={
                {
                  left: `${p.left}%`,
                  top: `${p.top}%`,
                  width: p.size,
                  height: p.size,
                  "--angle": `${p.angle}deg`,
                  "--distance": `${p.distance}px`,
                  "--delay": `${p.delay}s`,
                } as CSSProperties
              }
            />
          ))
        : null}
      {showHpBar ? (
        <div className="relative mt-1 h-2 w-4/5 min-w-16 bg-black/80">
          <div className="h-full bg-red-700" style={{ width: `${ratio * 100}%` }} />
        </div>
      ) : null}
    </div>
  );
}
