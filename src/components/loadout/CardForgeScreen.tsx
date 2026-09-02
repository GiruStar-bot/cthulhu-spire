import { CollectionCard } from "@/components/loadout/CollectionCard";
import { PixelRune } from "@/components/loadout/PixelRune";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelWindow } from "@/components/ui/PixelWindow";
import { getCard } from "@/game/cards";
import { runeArt } from "@/game/runes";
import { cn } from "@/lib/utils";
import { peekRune, useCollectionStore, type Rune } from "@/store/useCollectionStore";
import { useEffect, useRef, useState, type DragEvent } from "react";

type Flight = {
  rune: Rune;
  x: number;
  y: number;
  tx: number;
  ty: number;
  armed: boolean;
};

const GHOST = 96;

export function CardForgeScreen({ onClose, embedded = false }: { onClose?: () => void; embedded?: boolean }) {
  const inventory = useCollectionStore((s) => s.inventory);
  const socketRune = useCollectionStore((s) => s.socketRune);
  const unsocketRune = useCollectionStore((s) => s.unsocketRune);
  const [activeId, setActiveId] = useState(inventory.cards[0]?.instanceId ?? null);
  const [heldRune, setHeldRune] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [flight, setFlight] = useState<Flight | null>(null);
  const [snap, setSnap] = useState<number | null>(null);
  const socketRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const runeRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const ghostRef = useRef<HTMLImageElement>(null);
  const card = inventory.cards.find((c) => c.instanceId === activeId) ?? null;

  useEffect(() => {
    if (embedded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, embedded]);

  useEffect(() => {
    const seen = new Set<string>();
    for (const rune of inventory.runes) {
      const src = runeArt(rune.effect);
      if (!src || seen.has(src)) continue;
      seen.add(src);
      const img = new Image();
      img.src = src;
    }
  }, [inventory.runes]);

  useEffect(() => {
    if (!flight || flight.armed) return;
    const id = requestAnimationFrame(() => {
      setFlight((f) => (f ? { ...f, armed: true, x: f.tx, y: f.ty } : f));
    });
    return () => cancelAnimationFrame(id);
  }, [flight]);

  const seatRune = (runeId: string, socketIndex: number) => {
    if (!card) return;
    const dest = socketRefs.current[socketIndex];
    const origin = runeRefs.current[runeId];
    const rune = inventory.runes.find((r) => r.id === runeId);
    if (!rune || !dest) {
      socketRune(card.instanceId, runeId, socketIndex);
      setHeldRune(null);
      setDraggingId(null);
      return;
    }
    const a = origin?.getBoundingClientRect() ?? dest.getBoundingClientRect();
    const b = dest.getBoundingClientRect();
    setFlight({
      rune,
      x: a.left + a.width / 2,
      y: a.top + a.height / 2,
      tx: b.left + b.width / 2,
      ty: b.top + b.height / 2,
      armed: false,
    });
    window.setTimeout(() => {
      socketRune(card.instanceId, runeId, socketIndex);
      setHeldRune(null);
      setDraggingId(null);
      setFlight(null);
      setSnap(socketIndex);
      window.setTimeout(() => setSnap(null), 280);
    }, 220);
  };

  const beginDrag = (e: DragEvent<HTMLButtonElement>, rune: Rune) => {
    e.dataTransfer.setData("text/rune", rune.id);
    e.dataTransfer.effectAllowed = "move";
    const src = runeArt(rune.effect);
    const ghost = ghostRef.current;
    if (src && ghost) {
      ghost.src = src;
      e.dataTransfer.setDragImage(ghost, GHOST / 2, GHOST / 2);
    }
    setHeldRune(rune.id);
    setDraggingId(rune.id);
  };

  return (
    <section className={cn("relative flex w-full flex-col overflow-hidden font-pixel text-parchment", embedded ? "h-full bg-transparent" : "h-dvh bg-ink")}>
      <img
        ref={ghostRef}
        alt=""
        width={GHOST}
        height={GHOST}
        draggable={false}
        className="pointer-events-none fixed top-0 -left-[240px] size-24 bg-transparent object-contain"
      />
      {embedded ? null : (
      <header className="flex h-12 shrink-0 items-center justify-between border-b-2 border-gray-200 bg-black px-3">
        <h1 className="text-sm tracking-widest">魔改造</h1>
        <span className="truncate px-3 text-xs text-muted">{card ? getCard(card.baseCardId).name : "—"}</span>
        {onClose ? (
          <PixelButton onClick={onClose} className="min-h-9 px-3 py-1 text-xs">
            戻る
          </PixelButton>
        ) : (
          <span />
        )}
      </header>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-6">
        <aside className="min-h-0 overflow-y-auto border-b-2 border-gray-200 p-3 md:col-span-2 md:border-r-2 md:border-b-0">
          <p className="mb-2 text-xs tracking-widest text-muted">カード</p>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] justify-items-center gap-2">
            {inventory.cards.map((c) => (
              <CollectionCard
                key={c.instanceId}
                instance={c}
                selected={c.instanceId === activeId}
                onClick={() => setActiveId(c.instanceId)}
              />
            ))}
          </div>
        </aside>

        <div className="flex min-h-0 flex-col items-center justify-center gap-4 p-4 md:col-span-2">
          {card ? (
            <>
              <CollectionCard instance={card} size="lg" />
              <div className="flex items-end gap-2">
                {Array.from({ length: card.sockets }, (_, i) => {
                  const runeId = card.socketedRunes[i];
                  const rune = runeId ? peekRune(runeId) : undefined;
                  const empty = !runeId;
                  return (
                    <button
                      key={i}
                      type="button"
                      ref={(el) => {
                        socketRefs.current[i] = el;
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const id = e.dataTransfer.getData("text/rune") || heldRune;
                        if (id && empty) seatRune(id, i);
                      }}
                      onClick={() => {
                        if (runeId) {
                          unsocketRune(card.instanceId, i);
                          return;
                        }
                        if (heldRune) seatRune(heldRune, i);
                      }}
                      className={cn(
                        "relative grid size-12 place-items-center rounded-none border-2 bg-black shadow-[3px_3px_0_0_#000] transition-transform duration-150",
                        empty ? "border-gray-200/50" : "border-white",
                        empty && heldRune && "border-white",
                        snap === i && "translate-y-0.5",
                      )}
                    >
                      <span className="absolute -top-5 text-[9px] text-muted">{i + 1}</span>
                      {empty ? (
                        <span className="size-6 border-2 border-ink-2 bg-ink" />
                      ) : (
                        <PixelRune
                          effect={(rune ?? { effect: "ATK+" }).effect}
                          className="size-10"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-muted">宝石をクリックしてソケットへ / 嵌めた宝石で外す</p>
            </>
          ) : (
            <p className="text-xs text-muted">カードを選ぶ</p>
          )}
        </div>

        <aside className="min-h-0 overflow-y-auto border-t-2 border-gray-200 p-3 md:col-span-2 md:border-t-0 md:border-l-2">
          <p className="mb-2 text-xs tracking-widest text-muted">ルーン</p>
          <div className="grid grid-cols-3 gap-2">
            {inventory.runes.map((rune) => (
              <PixelWindow
                key={rune.id}
                className={cn(
                  "rounded-none bg-transparent p-0",
                  heldRune === rune.id && draggingId !== rune.id && "border-white",
                  draggingId === rune.id && "opacity-30",
                )}
              >
                <button
                  type="button"
                  ref={(el) => {
                    runeRefs.current[rune.id] = el;
                  }}
                  draggable
                  onDragStart={(e) => beginDrag(e, rune)}
                  onDragEnd={() => setDraggingId(null)}
                  onClick={() => setHeldRune(rune.id === heldRune ? null : rune.id)}
                  className={cn(
                    "flex w-full flex-col items-center gap-1 bg-transparent p-2 text-white",
                    draggingId === rune.id && "grayscale",
                  )}
                >
                  <PixelRune effect={rune.effect} className="h-14 w-full bg-transparent" />
                  <span className="text-[9px]">{rune.effect}</span>
                  <span className="text-[9px] text-muted">{rune.value}</span>
                </button>
              </PixelWindow>
            ))}
            {inventory.runes.length === 0 ? (
              <p className="col-span-3 py-8 text-center text-[10px] text-muted">所持ルーンなし</p>
            ) : null}
          </div>
        </aside>
      </div>

      {flight ? (
        <div
          className="pointer-events-none fixed z-50 bg-transparent transition-[left,top] duration-200 ease-linear"
          style={{ left: flight.x, top: flight.y, transform: "translate(-50%, -50%)" }}
        >
          <PixelRune effect={flight.rune.effect} className="size-12 bg-transparent" />
        </div>
      ) : null}
    </section>
  );
}
