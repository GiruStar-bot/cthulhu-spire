import { getCard } from "@/game/cards";
import { DECK_LIMIT } from "@/game/cards";
import { RELICS } from "@/game/relics";
import { cn } from "@/lib/utils";
import {
  COPY_LIMIT,
  RELIC_SLOTS,
  copiesOfBase,
  peekRune,
  useCollectionStore,
  type CardInstance,
  type Relic,
  type Rune,
} from "@/store/useCollectionStore";
import { useEffect, useMemo, useState } from "react";

type Tab = "CARDS" | "RUNES" | "RELICS";

export function LoadoutScreen({ onClose }: { onClose?: () => void }) {
  const inventory = useCollectionStore((s) => s.inventory);
  const deck = useCollectionStore((s) => s.deck);
  const equippedRelics = useCollectionStore((s) => s.equippedRelics);
  const addToDeck = useCollectionStore((s) => s.addToDeck);
  const removeFromDeck = useCollectionStore((s) => s.removeFromDeck);
  const equipRelic = useCollectionStore((s) => s.equipRelic);
  const unequipRelic = useCollectionStore((s) => s.unequipRelic);
  const socketRune = useCollectionStore((s) => s.socketRune);
  const unsocketRune = useCollectionStore((s) => s.unsocketRune);

  const [tab, setTab] = useState<Tab>("CARDS");
  const [activeCardId, setActiveCardId] = useState<string | null>(deck[0] ?? inventory.cards[0]?.instanceId ?? null);
  const [activeRuneId, setActiveRuneId] = useState<string | null>(null);
  const [heldRelicId, setHeldRelicId] = useState<string | null>(null);

  const activeCard = inventory.cards.find((c) => c.instanceId === activeCardId) ?? null;
  const relicById = useMemo(() => {
    const m = new Map<string, Relic>();
    for (const r of inventory.relics) m.set(r.id, r);
    return m;
  }, [inventory.relics]);

  const runeLookup = (id: string): Rune | undefined =>
    inventory.runes.find((r) => r.id === id) ?? peekRune(id);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <section className="flex h-dvh w-full flex-col bg-gray-950 font-mono text-gray-300">
      <header className="flex h-9 shrink-0 items-center justify-between border-b border-gray-800 bg-gray-900 px-3 text-[11px] tracking-wider">
        <span className="text-emerald-400">LOADOUT // CARD FORGE</span>
        <span className="text-gray-500">
          DECK {deck.length}/{DECK_LIMIT} · RELICS {equippedRelics.filter(Boolean).length}/{RELIC_SLOTS}
        </span>
        {onClose ? (
          <button type="button" onClick={onClose} className="border border-gray-700 px-2 py-0.5 text-gray-400 hover:border-emerald-400 hover:text-emerald-300">
            ESC
          </button>
        ) : (
          <span />
        )}
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-3">
        <aside className="flex min-h-0 flex-col border-r border-gray-800 bg-gray-950">
          <nav className="flex shrink-0 border-b border-gray-800">
            {(["CARDS", "RUNES", "RELICS"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  "flex-1 px-2 py-2 text-[10px] tracking-[0.18em]",
                  tab === t ? "bg-gray-900 text-emerald-300" : "text-gray-500 hover:text-gray-300",
                )}
              >
                {t}
              </button>
            ))}
          </nav>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {tab === "CARDS" ? (
              <div className="grid grid-cols-2 gap-1.5">
                {inventory.cards.map((card) => {
                  const def = getCard(card.baseCardId);
                  const inDeck = deck.includes(card.instanceId);
                  const copies = copiesOfBase(deck, inventory.cards, card.baseCardId);
                  return (
                    <button
                      key={card.instanceId}
                      type="button"
                      onClick={() => setActiveCardId(card.instanceId)}
                      onDoubleClick={() => {
                        if (inDeck) removeFromDeck(card.instanceId);
                        else addToDeck(card.instanceId);
                      }}
                      className={cn(
                        "border bg-black/40 p-1.5 text-left",
                        activeCardId === card.instanceId ? "border-emerald-400" : "border-gray-800 hover:border-gray-600",
                      )}
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="truncate text-gray-200">{def.name}</span>
                        <span className={copies >= COPY_LIMIT ? "text-amber-400" : "text-gray-500"}>
                          {copies}/{COPY_LIMIT}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[9px] text-gray-500">
                        <span>{def.type.toUpperCase()} · {def.cost}</span>
                        {inDeck ? <span className="text-emerald-400">IN DECK</span> : <span>IDLE</span>}
                      </div>
                      <SocketDots card={card} />
                    </button>
                  );
                })}
              </div>
            ) : null}

            {tab === "RUNES" ? (
              <div className="grid grid-cols-2 gap-1.5">
                {inventory.runes.map((rune) => (
                  <button
                    key={rune.id}
                    type="button"
                    onClick={() => setActiveRuneId(rune.id === activeRuneId ? null : rune.id)}
                    className={cn(
                      "border px-2 py-2 text-left text-[10px]",
                      activeRuneId === rune.id ? "border-emerald-400 bg-emerald-950/40" : "border-gray-800 hover:border-gray-600",
                    )}
                  >
                    <div className="text-emerald-300">{rune.effect}</div>
                    <div className="text-gray-500">VAL {rune.value}</div>
                  </button>
                ))}
                {inventory.runes.length === 0 ? (
                  <p className="col-span-2 px-1 py-6 text-center text-[10px] text-gray-600">NO LOOSE RUNES</p>
                ) : null}
              </div>
            ) : null}

            {tab === "RELICS" ? (
              <div className="grid grid-cols-1 gap-1.5">
                {inventory.relics.map((relic) => {
                  const equipped = equippedRelics.includes(relic.id);
                  const def = RELICS[relic.id];
                  return (
                    <button
                      key={relic.id}
                      type="button"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/relic", relic.id);
                        setHeldRelicId(relic.id);
                      }}
                      onClick={() => setHeldRelicId(relic.id === heldRelicId ? null : relic.id)}
                      className={cn(
                        "border px-2 py-2 text-left text-[10px]",
                        heldRelicId === relic.id ? "border-emerald-400" : "border-gray-800 hover:border-gray-600",
                        equipped && "opacity-50",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-gray-200">{relic.name}</span>
                        {equipped ? <span className="text-amber-400">EQ</span> : null}
                      </div>
                      <div className="mt-0.5 text-gray-500">{def?.text ?? relic.id}</div>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
          <p className="shrink-0 border-t border-gray-800 px-2 py-1 text-[9px] text-gray-600">
            DBL-CLICK card → deck · CLICK rune then socket · DRAG relic to slot
          </p>
        </aside>

        <div className="col-span-2 flex min-h-0 flex-col">
          <section className="shrink-0 border-b border-gray-800 px-3 py-2">
            <div className="mb-1 text-[10px] tracking-[0.2em] text-gray-500">ACTIVE RELICS</div>
            <div className="grid grid-cols-6 gap-2">
              {equippedRelics.map((id, i) => {
                const relic = id ? relicById.get(id) : null;
                return (
                  <button
                    key={i}
                    type="button"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const dropped = e.dataTransfer.getData("text/relic") || heldRelicId;
                      if (dropped) equipRelic(dropped, i);
                      setHeldRelicId(null);
                    }}
                    onClick={() => {
                      if (heldRelicId) {
                        equipRelic(heldRelicId, i);
                        setHeldRelicId(null);
                        return;
                      }
                      if (id) unequipRelic(i);
                    }}
                    className={cn(
                      "flex h-16 flex-col items-center justify-center border border-dashed text-[9px]",
                      relic ? "border-emerald-700 bg-gray-900 text-gray-200" : "border-gray-800 text-gray-600",
                    )}
                  >
                    <span className="text-gray-600">[{i + 1}]</span>
                    <span className="mt-1 px-1 text-center leading-tight">{relic?.name ?? "EMPTY"}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <div className="grid min-h-0 flex-1 grid-cols-2">
            <section className="flex min-h-0 flex-col border-r border-gray-800">
              <div className="flex shrink-0 items-center justify-between border-b border-gray-800 px-3 py-1.5 text-[10px] tracking-[0.2em] text-gray-500">
                <span>CURRENT DECK</span>
                <span className={deck.length >= DECK_LIMIT ? "text-amber-400" : "text-emerald-400"}>
                  {deck.length}/{DECK_LIMIT}
                </span>
              </div>
              <ul className="min-h-0 flex-1 overflow-y-auto">
                {deck.map((id, i) => {
                  const card = inventory.cards.find((c) => c.instanceId === id);
                  if (!card) return null;
                  const def = getCard(card.baseCardId);
                  const copies = copiesOfBase(deck, inventory.cards, card.baseCardId);
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => setActiveCardId(id)}
                        onDoubleClick={() => removeFromDeck(id)}
                        className={cn(
                          "flex w-full items-center gap-2 border-b border-gray-900 px-3 py-1.5 text-left text-[11px]",
                          activeCardId === id ? "bg-gray-900 text-emerald-300" : "hover:bg-gray-900/60",
                        )}
                      >
                        <span className="w-6 text-gray-600">{String(i + 1).padStart(2, "0")}</span>
                        <span className="flex-1 truncate">{def.name}</span>
                        <SocketDots card={card} />
                        <span className={cn("w-8 text-right", copies >= COPY_LIMIT ? "text-amber-400" : "text-gray-500")}>
                          {copies}/{COPY_LIMIT}
                        </span>
                      </button>
                    </li>
                  );
                })}
                {deck.length === 0 ? (
                  <li className="px-3 py-8 text-center text-[10px] text-gray-600">DOUBLE-CLICK A CARD TO ADD</li>
                ) : null}
              </ul>
            </section>

            <section className="flex min-h-0 flex-col bg-black/30">
              <div className="shrink-0 border-b border-gray-800 px-3 py-1.5 text-[10px] tracking-[0.2em] text-gray-500">
                MODDING WORKBENCH
              </div>
              {activeCard ? (
                <Workbench
                  card={activeCard}
                  activeRuneId={activeRuneId}
                  runeOf={(id) => runeLookup(id)}
                  onSocket={(idx) => {
                    if (!activeRuneId) return;
                    if (socketRune(activeCard.instanceId, activeRuneId, idx)) setActiveRuneId(null);
                  }}
                  onUnsocket={(idx) => unsocketRune(activeCard.instanceId, idx)}
                  inDeck={deck.includes(activeCard.instanceId)}
                  copies={copiesOfBase(deck, inventory.cards, activeCard.baseCardId)}
                  onToggleDeck={() => {
                    if (deck.includes(activeCard.instanceId)) removeFromDeck(activeCard.instanceId);
                    else addToDeck(activeCard.instanceId);
                  }}
                />
              ) : (
                <p className="px-3 py-10 text-center text-[10px] text-gray-600">SELECT A CARD</p>
              )}
            </section>
          </div>
        </div>
      </div>
    </section>
  );
}

function SocketDots({ card }: { card: CardInstance }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: card.sockets }, (_, i) => (
        <span
          key={i}
          className={cn(
            "inline-block size-1.5 rounded-full",
            card.socketedRunes[i] ? "bg-emerald-400" : "bg-gray-700",
          )}
        />
      ))}
    </span>
  );
}

function Workbench({
  card,
  activeRuneId,
  runeOf,
  onSocket,
  onUnsocket,
  inDeck,
  copies,
  onToggleDeck,
}: {
  card: CardInstance;
  activeRuneId: string | null;
  runeOf: (id: string) => Rune | undefined;
  onSocket: (index: number) => void;
  onUnsocket: (index: number) => void;
  inDeck: boolean;
  copies: number;
  onToggleDeck: () => void;
}) {
  const def = getCard(card.baseCardId);
  return (
    <div className="flex min-h-0 flex-1 flex-col p-3">
      <div className="relative min-h-0 flex-1 border border-gray-800 bg-gray-900">
        <img src={def.art} alt="" className="absolute inset-0 size-full object-cover opacity-40" crossOrigin="anonymous" />
        <div className="relative z-10 flex h-full flex-col justify-between p-3">
          <div>
            <div className="text-[10px] tracking-[0.2em] text-gray-500">{def.type.toUpperCase()} · COST {def.cost}</div>
            <h2 className="mt-1 text-lg text-gray-100">{def.name}</h2>
            <p className="mt-2 text-xs leading-relaxed text-gray-400">{def.text}</p>
          </div>
          <p className="text-[10px] text-gray-600">{def.flavor}</p>
        </div>
      </div>
      <div className="mt-3">
        <div className="mb-1 text-[10px] tracking-[0.2em] text-gray-500">SOCKETS</div>
        <div className="flex gap-2">
          {Array.from({ length: card.sockets }, (_, i) => {
            const filled = card.socketedRunes[i];
            const rune = filled ? runeOf(filled) : undefined;
            return (
              <button
                key={i}
                type="button"
                onClick={() => (filled ? onUnsocket(i) : onSocket(i))}
                className={cn(
                  "flex h-14 flex-1 flex-col items-center justify-center border text-[9px]",
                  filled ? "border-emerald-500 bg-emerald-950/50 text-emerald-300" : "border-dashed border-gray-700 text-gray-600",
                  !filled && activeRuneId && "border-emerald-400 text-emerald-400",
                )}
              >
                <span>S{i + 1}</span>
                <span className="mt-1">{filled ? `${rune?.effect ?? "RUNE"} ${rune?.value ?? ""}` : activeRuneId ? "CLICK TO SET" : "EMPTY"}</span>
              </button>
            );
          })}
        </div>
      </div>
      <button
        type="button"
        onClick={onToggleDeck}
        disabled={!inDeck && copies >= COPY_LIMIT}
        className="mt-3 border border-gray-700 py-2 text-[10px] tracking-[0.2em] text-gray-300 hover:border-emerald-400 hover:text-emerald-300 disabled:opacity-40"
      >
        {inDeck ? "REMOVE FROM DECK" : `ADD TO DECK  ${copies}/${COPY_LIMIT}`}
      </button>
    </div>
  );
}
