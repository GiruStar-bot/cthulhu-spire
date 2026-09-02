import { CollectionCard } from "@/components/loadout/CollectionCard";
import { getCard } from "@/game/cards";
import { cn } from "@/lib/utils";
import { peekRune, useCollectionStore, type Rune } from "@/store/useCollectionStore";
import { useEffect, useRef, useState } from "react";

const GEM: Record<string, { shape: "round" | "diamond"; glow: string; fill: string }> = {
  "ATK+": { shape: "diamond", glow: "shadow-[0_0_18px_#f87171]", fill: "bg-linear-to-br from-red-300 via-red-600 to-red-950" },
  "BLK+": { shape: "round", glow: "shadow-[0_0_18px_#38bdf8]", fill: "bg-linear-to-br from-sky-200 via-blue-600 to-blue-950" },
  DRAW: { shape: "round", glow: "shadow-[0_0_18px_#4ade80]", fill: "bg-linear-to-br from-lime-200 via-emerald-500 to-emerald-950" },
  "COST-": { shape: "diamond", glow: "shadow-[0_0_18px_#fbbf24]", fill: "bg-linear-to-br from-amber-200 via-amber-500 to-yellow-900" },
  "SAN+": { shape: "round", glow: "shadow-[0_0_18px_#c084fc]", fill: "bg-linear-to-br from-fuchsia-200 via-purple-500 to-violet-950" },
  "STR+": { shape: "diamond", glow: "shadow-[0_0_18px_#fb923c]", fill: "bg-linear-to-br from-orange-200 via-orange-500 to-orange-950" },
  POISON: { shape: "round", glow: "shadow-[0_0_18px_#a3e635]", fill: "bg-linear-to-br from-lime-200 via-lime-600 to-green-950" },
  HEAL: { shape: "round", glow: "shadow-[0_0_18px_#f9a8d4]", fill: "bg-linear-to-br from-pink-200 via-rose-500 to-rose-950" },
};

type Flight = {
  rune: Rune;
  x: number;
  y: number;
  tx: number;
  ty: number;
  armed: boolean;
};

export function CardForgeScreen({ onClose }: { onClose?: () => void }) {
  const inventory = useCollectionStore((s) => s.inventory);
  const socketRune = useCollectionStore((s) => s.socketRune);
  const unsocketRune = useCollectionStore((s) => s.unsocketRune);

  const [activeId, setActiveId] = useState(inventory.cards[0]?.instanceId ?? null);
  const [heldRune, setHeldRune] = useState<string | null>(null);
  const [flight, setFlight] = useState<Flight | null>(null);
  const [snap, setSnap] = useState<number | null>(null);
  const socketRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const runeRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const card = inventory.cards.find((c) => c.instanceId === activeId) ?? null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (!flight || flight.armed) return;
    const id = requestAnimationFrame(() => {
      setFlight((f) => (f ? { ...f, armed: true, x: f.tx, y: f.ty } : f));
    });
    return () => cancelAnimationFrame(id);
  }, [flight]);

  const seatRune = (runeId: string, socketIndex: number, fromEl?: HTMLElement | null) => {
    if (!card) return;
    const dest = socketRefs.current[socketIndex];
    const origin = fromEl ?? runeRefs.current[runeId];
    const rune = inventory.runes.find((r) => r.id === runeId);
    if (!rune || !dest) {
      socketRune(card.instanceId, runeId, socketIndex);
      setHeldRune(null);
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
      setFlight(null);
      setSnap(socketIndex);
      window.setTimeout(() => setSnap(null), 420);
    }, 340);
  };

  return (
    <section className="relative flex h-dvh w-full flex-col overflow-hidden bg-gray-950 font-pixel text-gray-200">
      <header className="flex h-10 shrink-0 items-center justify-between border-b-2 border-white/20 bg-black px-3 text-xs tracking-widest">
        <span>CARD FORGE</span>
        <span className="text-gray-500">{card ? getCard(card.baseCardId).name : "—"}</span>
        {onClose ? (
          <button type="button" onClick={onClose} className="border-2 border-white px-2 py-0.5 hover:bg-white hover:text-black">
            ESC
          </button>
        ) : (
          <span />
        )}
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-6">
        <aside className="min-h-0 overflow-y-auto border-b-2 border-white/15 p-3 md:col-span-2 md:border-r-2 md:border-b-0">
          <p className="mb-2 text-[10px] tracking-[0.25em] text-gray-500">SELECT CARD</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-2">
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

        <div className="flex min-h-0 flex-col items-center justify-center gap-5 p-4 md:col-span-2">
          {card ? (
            <>
              <CollectionCard instance={card} size="lg" />
              <div className="flex items-end gap-3">
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
                        "relative grid size-14 place-items-center border-2 bg-black/70 transition-transform duration-200",
                        empty ? "border-dashed border-gray-600" : "border-white",
                        empty && heldRune && "animate-pulse border-amber-300",
                        snap === i && "scale-110",
                      )}
                    >
                      <span className="absolute -top-4 text-[9px] text-gray-500">S{i + 1}</span>
                      {empty ? (
                        <span className="size-8 rounded-full bg-black shadow-[inset_0_4px_8px_#000] ring-1 ring-white/10" />
                      ) : (
                        <Gem rune={rune ?? { id: runeId!, effect: "ATK+", value: 0 }} seated snap={snap === i} />
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-gray-500">宝石をクリックしてソケットへ · 嵌めた宝石をクリックで外す</p>
            </>
          ) : (
            <p className="text-xs text-gray-600">カードを選ぶ</p>
          )}
        </div>

        <aside className="min-h-0 overflow-y-auto border-t-2 border-white/15 p-3 md:col-span-2 md:border-t-0 md:border-l-2">
          <p className="mb-2 text-[10px] tracking-[0.25em] text-gray-500">RUNES</p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-3">
            {inventory.runes.map((rune) => (
              <button
                key={rune.id}
                type="button"
                ref={(el) => {
                  runeRefs.current[rune.id] = el;
                }}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/rune", rune.id);
                  setHeldRune(rune.id);
                }}
                onClick={() => setHeldRune(rune.id === heldRune ? null : rune.id)}
                className={cn(
                  "flex flex-col items-center gap-1 border-2 bg-black p-2 transition-transform hover:-translate-y-1",
                  heldRune === rune.id ? "border-white scale-105" : "border-white/20",
                )}
              >
                <Gem rune={rune} />
                <span className="text-[9px] text-white">{rune.effect}</span>
                <span className="text-[9px] text-gray-500">{rune.value}</span>
              </button>
            ))}
            {inventory.runes.length === 0 ? (
              <p className="col-span-3 py-8 text-center text-[10px] text-gray-600">所持ルーンなし</p>
            ) : null}
          </div>
        </aside>
      </div>

      {flight ? (
        <div
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-out"
          style={{ left: flight.x, top: flight.y, transform: flight.armed ? "translate(-50%,-50%) scale(0.85)" : "translate(-50%,-50%) scale(1.15)" }}
        >
          <Gem rune={flight.rune} flying />
        </div>
      ) : null}
    </section>
  );
}

function Gem({ rune, seated, flying, snap }: { rune: Rune; seated?: boolean; flying?: boolean; snap?: boolean }) {
  const tone = GEM[rune.effect] ?? GEM["ATK+"]!;
  return (
    <span
      className={cn(
        "grid size-8 place-items-center text-[8px] font-bold text-white",
        tone.fill,
        tone.glow,
        tone.shape === "diamond" ? "rotate-45" : "rounded-full",
        flying && "size-10",
        snap && "scale-125",
        seated && "animate-[pulse_1.8s_ease-in-out_infinite]",
      )}
    >
      <span className={cn(tone.shape === "diamond" && "-rotate-45")}>{rune.effect.replace("+", "").replace("-", "")[0]}</span>
    </span>
  );
}
