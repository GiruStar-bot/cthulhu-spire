import { CardView } from "@/components/game/CardView";
import { PixelButton } from "@/components/ui/PixelButton";
import { CARD_FRAME_CLASSES, frameClassForCard, getCard, makeCard } from "@/game/cards";
import { asset } from "@/lib/asset";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

type Phase = "idle" | "shaking" | "bursting" | "revealing" | "done";

const MYTHOS_ARCHETYPES = new Set(["greatold", "elder", "outer"]);

function isSpecialReveal(baseCardId: string): boolean {
  const d = getCard(baseCardId);
  return d.rarity === "rare" || (!!d.archetype && MYTHOS_ARCHETYPES.has(d.archetype));
}

const SPIN_STAGGER_MS = 150;
const SPIN_SETTLE_MS = 260;

function spinIntervals(totalDuration = 1400): number[] {
  const intervals: number[] = [];
  let t = 0;
  let step = 80; // 開始間隔(ms)
  while (t < totalDuration) {
    intervals.push(step);
    t += step;
    step *= 1.18; // 徐々に間隔を伸ばして減速させる
  }
  return intervals;
}

function randomFrameClass(): string {
  return CARD_FRAME_CLASSES[Math.floor(Math.random() * CARD_FRAME_CLASSES.length)]!;
}

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
  const [revealed, setRevealed] = useState<boolean[]>(() => cardIds.map(() => false));
  const [spinFrame, setSpinFrame] = useState<(string | null)[]>(() => cardIds.map(() => null));
  const [rarePop, setRarePop] = useState<number | null>(null);

  useEffect(() => {
    if (phase === "shaking") {
      const t = window.setTimeout(() => setPhase("bursting"), 450);
      return () => window.clearTimeout(t);
    }
    if (phase === "bursting") {
      const t = window.setTimeout(() => setPhase("revealing"), 450);
      return () => window.clearTimeout(t);
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== "revealing") return;
    let cancelled = false;
    const timeouts: number[] = [];

    function runSpin(i: number) {
      const intervals = spinIntervals();
      let idx = 0;
      const tick = () => {
        if (cancelled) return;
        if (idx >= intervals.length) {
          // 減速しきったら、実際に排出されたカードのレア度フレームで停止させる。
          setSpinFrame((s) => {
            const next = s.slice();
            next[i] = frameClassForCard(getCard(cardIds[i]!));
            return next;
          });
          const settleTimeout = window.setTimeout(() => {
            if (cancelled) return;
            setRevealed((r) => {
              const next = r.slice();
              next[i] = true;
              return next;
            });
            if (isSpecialReveal(cardIds[i]!)) {
              setRarePop(i);
              const popTimeout = window.setTimeout(() => setRarePop((p) => (p === i ? null : p)), 500);
              timeouts.push(popTimeout);
            }
          }, SPIN_SETTLE_MS);
          timeouts.push(settleTimeout);
          return;
        }
        setSpinFrame((s) => {
          const next = s.slice();
          next[i] = randomFrameClass();
          return next;
        });
        const t = window.setTimeout(() => {
          idx += 1;
          tick();
        }, intervals[idx]);
        timeouts.push(t);
      };
      tick();
    }

    cardIds.forEach((_, i) => {
      const t = window.setTimeout(() => runSpin(i), i * SPIN_STAGGER_MS);
      timeouts.push(t);
    });

    return () => {
      cancelled = true;
      timeouts.forEach((t) => window.clearTimeout(t));
    };
  }, [phase, cardIds]);

  useEffect(() => {
    if (phase !== "revealing") return;
    if (revealed.length > 0 && revealed.every(Boolean)) setPhase("done");
  }, [phase, revealed]);

  const skip = () => {
    setSpinFrame(cardIds.map(() => null));
    setRevealed(cardIds.map(() => true));
    setRarePop(null);
    setPhase("done");
  };

  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center gap-4 p-3">
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
              const flipped = revealed[i];
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
                      <div
                        className={cn(
                          "flex size-full items-center justify-center overflow-hidden bg-ink-2",
                          spinFrame[i],
                        )}
                      >
                        <img
                          src={asset("art/pixel/ui/card_back.png")}
                          alt=""
                          className="size-full object-contain"
                        />
                      </div>
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
