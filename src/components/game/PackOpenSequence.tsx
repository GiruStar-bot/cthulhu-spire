import { CardView } from "@/components/game/CardView";
import { PixelButton } from "@/components/ui/PixelButton";
import { getCard, makeCard } from "@/game/cards";
import { asset } from "@/lib/asset";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

type Phase = "idle" | "shaking" | "bursting" | "revealing" | "done";

const MYTHOS_ARCHETYPES = new Set(["greatold", "elder", "outer"]);

function isSpecialReveal(baseCardId: string): boolean {
  const d = getCard(baseCardId);
  return d.rarity === "rare" || (!!d.archetype && MYTHOS_ARCHETYPES.has(d.archetype));
}

const REVEAL_INTERVAL_MS = 400;

export function PackOpenSequence({
  cardIds,
  packArt,
  onClose,
}: {
  cardIds: string[];
  packArt?: string;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [revealCount, setRevealCount] = useState(0);
  const [flash, setFlash] = useState(false);
  const [rarePop, setRarePop] = useState<number | null>(null);

  useEffect(() => {
    if (phase === "shaking") {
      const t = window.setTimeout(() => setPhase("bursting"), 450);
      return () => window.clearTimeout(t);
    }
    if (phase === "bursting") {
      setFlash(true);
      const flashOff = window.setTimeout(() => setFlash(false), 400);
      const t = window.setTimeout(() => setPhase("revealing"), 450);
      return () => {
        window.clearTimeout(t);
        window.clearTimeout(flashOff);
      };
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== "revealing") return;
    if (revealCount >= cardIds.length) {
      setPhase("done");
      return;
    }
    const t = window.setTimeout(() => {
      const nextIndex = revealCount;
      setRevealCount((c) => c + 1);
      if (isSpecialReveal(cardIds[nextIndex]!)) {
        setRarePop(nextIndex);
        setFlash(true);
        window.setTimeout(() => setFlash(false), 350);
        window.setTimeout(() => setRarePop((p) => (p === nextIndex ? null : p)), 500);
      }
    }, REVEAL_INTERVAL_MS);
    return () => window.clearTimeout(t);
  }, [phase, revealCount, cardIds]);

  const skip = () => {
    setPhase("done");
    setRevealCount(cardIds.length);
    setFlash(false);
    setRarePop(null);
  };

  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center gap-4 p-3">
      {flash ? <div className="pack-flash-overlay" /> : null}

      {phase === "idle" || phase === "shaking" || phase === "bursting" ? (
        <button
          type="button"
          onClick={phase === "idle" ? () => setPhase("shaking") : skip}
          className="flex flex-col items-center gap-3"
        >
          <div
            className={cn(
              "flex h-64 w-44 items-center justify-center sm:h-72 sm:w-48",
              phase === "idle" && "pack-art-idle",
              phase === "shaking" && "pack-art-shaking",
              phase === "bursting" && "pack-art-bursting",
            )}
          >
            {packArt ? (
              <img src={packArt} alt="" className="size-full object-contain" />
            ) : (
              <div className="panel flex size-full items-center justify-center text-3xl text-muted">?</div>
            )}
          </div>
          {phase === "idle" ? <p className="animate-pulse text-xs text-muted">タップして開封</p> : null}
        </button>
      ) : (
        <>
          <div className="flex flex-wrap justify-center gap-3" onClick={phase === "revealing" ? skip : undefined}>
            {cardIds.map((baseCardId, i) => {
              const flipped = i < revealCount;
              return (
                <div
                  key={i}
                  className={cn(
                    "card-flip-container h-64 w-44 sm:h-72 sm:w-48",
                    rarePop === i && "card-rare-pop",
                  )}
                >
                  <div className={cn("card-flip-inner", flipped && "is-flipped")}>
                    <div className="card-flip-face card-flip-front">
                      <img
                        src={asset("art/pixel/ui/card_back.png")}
                        alt=""
                        className="size-full object-contain"
                      />
                    </div>
                    <div className="card-flip-face card-flip-back">
                      <CardView card={makeCard(baseCardId)} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {phase === "done" ? (
            <PixelButton onClick={onClose} className="min-h-9 px-4 py-1 text-xs">
              閉じる
            </PixelButton>
          ) : (
            <p className="text-[10px] text-muted">タップで演出をスキップ</p>
          )}
        </>
      )}
    </div>
  );
}
