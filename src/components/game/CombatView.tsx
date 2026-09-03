import { CardView } from "@/components/game/CardView";
import { EnemyView } from "@/components/combat/EnemyView";
import { StageBack } from "@/components/game/StageBack";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelWindow } from "@/components/ui/PixelWindow";
import { POWER_TEXT, canPlay } from "@/game/combat";
import { getEnemy } from "@/game/enemies";
import { getCard, makeCard } from "@/game/cards";
import { floorBand, layerLabel } from "@/game/floors";
import { useGame } from "@/game/store";
import { IDLE_FRAMES } from "@/game/idleFrames";
import { asset } from "@/lib/asset";
import { cn } from "@/lib/utils";
import type { CardInst, CombatEnemy, CombatState, Floater } from "@/game/types";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";

export function CombatView() {
  const combat = useGame((s) => s.combat);
  const play = useGame((s) => s.play);
  const endTurn = useGame((s) => s.endPlayerTurn);
  const hp = useGame((s) => s.hp);
  const maxHp = useGame((s) => s.maxHp);
  const sanity = useGame((s) => s.sanity);
  const maxSanity = useGame((s) => s.maxSanity);
  const fx = useCombatFx(hp, maxHp, sanity, maxSanity);
  const [pile, setPile] = useState<"draw" | "discard" | null>(null);
  const [drag, setDrag] = useState<{ uid: string; x: number; y: number } | null>(null);
  const [dragValid, setDragValid] = useState(false);
  const combatRef = useRef(combat);
  const playRef = useRef(play);
  combatRef.current = combat;
  playRef.current = play;

  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => {
      const cur = combatRef.current;
      if (!cur) return;
      setDrag((d) => (d ? { ...d, x: e.clientX, y: e.clientY } : d));
      setDragValid(resolveDrop(drag.uid, e.clientX, e.clientY, cur).ok);
    };
    const up = (e: PointerEvent) => {
      const cur = combatRef.current;
      if (cur) {
        const result = resolveDrop(drag.uid, e.clientX, e.clientY, cur);
        if (result.ok) playRef.current(drag.uid, result.targetId ?? null);
      }
      setDrag(null);
      setDragValid(false);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [drag?.uid]);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, []);

  if (!combat) return null;

  const ratio = hp / Math.max(1, maxHp);
  const blood = ratio > 0.45 ? 0 : ratio > 0.22 ? 0.42 : 0.78;

  return (
    <section className="relative h-dvh w-full overflow-hidden bg-ink">
      <ShakeRoot tick={fx.tick} traumaRef={fx.traumaRef} className="relative h-dvh w-full overflow-hidden">
        <StageBack />

        <div className="fx-blood" style={{ "--blood": blood } as CSSProperties} />
        <div className={cn("fx-vertigo", fx.vertigo ? "is-on" : "")} />

        <div className="combat-foe">
          {combat.enemies.map((e) => (
            <EnemyStage
              key={e.uid}
              enemy={e}
              floaters={combat.floaters.filter((f) => f.who === e.uid)}
              striking={fx.playerHit && e.hp > 0}
            />
          ))}
        </div>

        <div className="pointer-events-none relative z-20 flex h-dvh flex-col">
          <div className="pointer-events-auto flex shrink-0 items-start justify-between gap-3 px-3 pt-3 sm:px-5">
            <div className="flex flex-col">
              <CombatHud
                hp={hp}
                maxHp={maxHp}
                sanity={sanity}
                maxSanity={maxSanity}
                energy={combat.energy}
                maxEnergy={combat.maxEnergy}
                block={combat.block}
                strength={combat.strength}
                weak={combat.weak}
                poison={combat.poison}
                sealed={combat.sealed}
              />
              <div className="mt-2 flex flex-row gap-2">
                <PixelButton onClick={() => setPile("draw")} className="font-pixel">
                  山札: {combat.draw.length}
                </PixelButton>
                <PixelButton onClick={() => setPile("discard")} className="font-pixel">
                  捨て札: {combat.discard.length}
                </PixelButton>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1" />

          <div className="relative z-10 shrink-0 px-3 sm:px-5">
            <div className="flex flex-wrap gap-2">
              {combat.powers.map((p) => (
                <span key={p} className="border-2 border-gray-200 bg-black/80 px-2 py-1 font-pixel text-xs text-muted">
                  {POWER_TEXT[p]}
                </span>
              ))}
              {combat.log.slice(-1).map((l) => (
                <span key={l} className="font-pixel text-xs text-muted italic">
                  {l}
                </span>
              ))}
            </div>
          </div>

          <div className="combat-hand pointer-events-auto relative z-20 flex shrink-0 items-end gap-2 px-3 pb-3 sm:px-5">
            <div className="flex max-h-[26dvh] flex-1 gap-2 overflow-x-auto overflow-y-hidden pt-2">
              {combat.hand.map((card) => {
                const playable = canPlay(combat, card) && combat.phase === "player";
                return (
                  <div
                    key={card.uid}
                    onPointerDown={(e) => {
                      if (!playable) return;
                      e.preventDefault();
                      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
                      setDrag({ uid: card.uid, x: e.clientX, y: e.clientY });
                      setDragValid(false);
                    }}
                    className={cn(
                      "touch-none select-none",
                      playable ? "cursor-grab" : "opacity-55",
                      drag?.uid === card.uid && "opacity-0",
                    )}
                  >
                    <CardView card={card} playable={playable} compact />
                  </div>
                );
              })}
            </div>
            <div className="mb-1 flex shrink-0 flex-col items-end gap-2">
              <PixelButton onClick={endTurn} disabled={combat.phase !== "player"} className="min-h-14 px-4">
                ターン終了
              </PixelButton>
            </div>
          </div>

          {drag ? (
            <div
              className="pointer-events-none fixed z-50"
              style={{ left: drag.x, top: drag.y, transform: "translate(-50%, -50%)" }}
            >
              {(() => {
                const held = combat.hand.find((c) => c.uid === drag.uid);
                if (!held) return null;
                return (
                  <div
                    className={cn(
                      dragValid &&
                        "outline-2 outline-accent drop-shadow-[0_0_10px_var(--color-accent)] outline",
                    )}
                  >
                    <CardView card={held} compact />
                  </div>
                );
              })()}
            </div>
          ) : null}

          <PlayerFloaters floaters={combat.floaters.filter((f) => f.who === "player")} />
        </div>
        {pile ? (
          <PileInspect
            title={pile === "draw" ? `山札 ${combat.draw.length}枚` : `捨て札 ${combat.discard.length}枚`}
            cards={pile === "draw" ? combat.draw : combat.discard}
            onClose={() => setPile(null)}
          />
        ) : null}
      </ShakeRoot>
    </section>
  );
}

function PileInspect({
  title,
  cards,
  onClose,
}: {
  title: string;
  cards: CardInst[];
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-ink/85 px-4 py-8">
      <p className="font-pixel text-sm tracking-widest text-white">{title}</p>
      {cards.length === 0 ? (
        <p className="mt-4 font-pixel text-sm text-muted">カードはない。</p>
      ) : (
        <div className="mt-4 flex min-h-0 flex-1 flex-wrap content-start gap-2 overflow-y-auto">
          {cards.map((c) => (
            <CardView key={c.uid} card={c} compact />
          ))}
        </div>
      )}
      <PixelButton onClick={onClose} className="mt-4 self-start">
        閉じる
      </PixelButton>
    </div>
  );
}

function CombatHud({
  hp,
  maxHp,
  sanity,
  maxSanity,
  energy,
  maxEnergy,
  block,
  strength,
  weak,
  poison,
  sealed,
}: {
  hp: number;
  maxHp: number;
  sanity: number;
  maxSanity: number;
  energy: number;
  maxEnergy: number;
  block: number;
  strength: number;
  weak: number;
  poison: number;
  sealed: "attack" | "skill" | null;
}) {
  const playerName = useGame((s) => s.playerName);
  const floor = useGame((s) => s.floor);
  const shells = useGame((s) => s.shells);

  return (
    <PixelWindow className="min-w-56 px-3 py-2">
      <div className="flex items-baseline justify-between gap-4">
        <p className="truncate text-sm text-white">{playerName || "無名"}</p>
        <p className="shrink-0 text-xs tabular-nums text-muted">
          {floorBand(floor)} · {layerLabel(floor)}
        </p>
      </div>
      <HudBar label="HP" value={hp} max={maxHp} tone="hp" />
      <HudBar label="SAN" value={sanity} max={maxSanity} tone="sanity" />
      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white">
        <span className="tabular-nums">
          NRG {energy}/{maxEnergy}
        </span>
        <Energy n={energy} max={maxEnergy} />
        <span className="tabular-nums">防 {block}</span>
        <span className="inline-flex items-center gap-1 tabular-nums">
          <img src={asset("art/shell.jpg")} alt="" className="size-3 object-cover" />
          {shells}
        </span>
        {strength ? <span className="text-accent">筋 {strength}</span> : null}
        {weak ? <span className="text-blood">弱 {weak}</span> : null}
        {poison ? <span className="text-accent">毒 {poison}</span> : null}
        {sealed ? <span className="text-blood">{sealed === "attack" ? "攻撃封印" : "技能封印"}</span> : null}
      </div>
    </PixelWindow>
  );
}

function HudBar({
  label,
  value,
  max,
  tone,
}: {
  label: string;
  value: number;
  max: number;
  tone: "hp" | "sanity";
}) {
  const pct = max <= 0 ? 0 : Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="mt-1">
      <div className="mb-0.5 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-white">
          {value}/{max}
        </span>
      </div>
      <div className="h-2 w-40 max-w-full bg-black">
        <div className={cn("h-full", tone === "hp" ? "bg-blood" : "bg-accent")} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Energy({ n, max }: { n: number; max: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`エネルギー ${n}`}>
      {Array.from({ length: Math.max(max, n) }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "size-3",
            i < n ? "bg-accent" : "border border-gray-200",
          )}
        />
      ))}
    </div>
  );
}

function EnemyStage({
  enemy,
  floaters,
  striking,
}: {
  enemy: CombatEnemy;
  floaters: Floater[];
  striking: boolean;
}) {
  const dead = enemy.hp <= 0;
  const gone = useCorpseGone(dead);
  const pose = useEnemyPose(enemy.hp, striking);
  const boss = enemy.maxHp >= 150;

  if (gone) return null;

  return (
    <div
      data-uid={enemy.uid}
      data-dead={dead ? "1" : "0"}
      className={cn(
        "enemy-stage relative text-left",
        boss ? "is-boss" : "",
        pose === "enter" && "enemy-enter",
        pose === "hit" && "enemy-hit",
        pose === "strike" && "enemy-strike",
      )}
    >
      <div className="enemy-figure is-cutout">
        <div
          data-hit-zone=""
          className={cn(
            "pointer-events-none absolute",
            boss ? "inset-x-[8%] top-[4%] bottom-[3%]" : "inset-x-[8%] top-[8%] bottom-[4%]",
          )}
        />
        <EnemyView
          imageUrl={getEnemy(enemy.defId).art}
          frames={IDLE_FRAMES[enemy.defId]}
          hp={enemy.hp}
          maxHp={enemy.maxHp}
          isDead={dead}
          showHpBar={false}
        />
        <div className="enemy-impact" />
      </div>
      <div className="pointer-events-none absolute top-[12%] left-1/2 z-10 -translate-x-1/2">
        {floaters.map((f) => (
          <span
            key={f.id}
            className={cn(
              "block animate-floater font-pixel tabular-nums leading-none",
              f.kind === "dmg" ? "text-[2.75rem] font-semibold text-blood sm:text-6xl" : "text-2xl text-accent",
            )}
          >
            {f.text}
          </span>
        ))}
      </div>
      <div className="enemy-vitals">
        <EnemyPlate enemy={enemy} />
      </div>
    </div>
  );
}

function useCorpseGone(dead: boolean) {
  const [gone, setGone] = useState(false);
  useEffect(() => {
    if (!dead) {
      setGone(false);
      return;
    }
    const t = window.setTimeout(() => setGone(true), 1000);
    return () => window.clearTimeout(t);
  }, [dead]);
  return gone;
}

function isAboveHand(clientY: number): boolean {
  const hand = document.querySelector(".combat-hand");
  const top = hand?.getBoundingClientRect().top ?? Infinity;
  return clientY < top - 20;
}

function resolveDrop(
  cardUid: string,
  clientX: number,
  clientY: number,
  combat: CombatState,
): { ok: boolean; targetId?: string } {
  const card = combat.hand.find((c) => c.uid === cardUid);
  if (!card) return { ok: false };
  const d = getCard(card.defId);
  if (!isAboveHand(clientY)) return { ok: false };
  if (d.target !== "enemy") return { ok: true };
  const living = combat.enemies.filter((e) => e.hp > 0);
  const foe = pickFoe(clientX, clientY);
  if (foe?.dataset.uid) return { ok: true, targetId: foe.dataset.uid };
  if (living.length === 1) return { ok: true, targetId: living[0].uid };
  return { ok: false };
}

function pickFoe(clientX: number, clientY: number): HTMLElement | null {
  const stages = [...document.querySelectorAll<HTMLElement>(".enemy-stage")];
  for (const el of stages) {
    if (el.dataset.dead === "1") continue;
    const zone = el.querySelector<HTMLElement>("[data-hit-zone]");
    if (!zone) continue;
    const r = zone.getBoundingClientRect();
    if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) {
      return el;
    }
  }
  return null;
}

function EnemyPlate({ enemy }: { enemy: CombatEnemy }) {
  const def = getEnemy(enemy.defId);
  const intent = intentLabel(enemy);
  const cardIds = enemy.shownCardIds ?? enemy.actionCardIds;
  const i = enemy.shownIntent ?? enemy.intent;

  return (
    <div data-enemy-plate="" className="w-full text-left">
      {cardIds.length > 0 ? (
        <div className="mb-1.5 flex justify-center gap-1">
          {cardIds.map((id, idx) => (
            <div key={idx} className="[&>*]:!h-40 [&>*]:!w-28">
              <CardView card={makeCard(id)} compact />
            </div>
          ))}
        </div>
      ) : i.seal ? (
        <div className="mb-1.5 border-2 border-white bg-black px-2 py-1 text-center font-pixel text-[10px] text-blood">
          {i.seal === "attack" ? "攻撃封印" : "技能封印"}
        </div>
      ) : null}
      <p className="font-pixel text-sm text-white">{def.name}</p>
      <p className="font-pixel text-xs text-accent">{intent}</p>
      <div className="mt-1 h-1.5 overflow-hidden bg-black">
        <div className="h-full bg-blood" style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }} />
      </div>
      <p className="font-pixel text-xs text-muted tabular-nums">
        {enemy.hp}/{enemy.maxHp}
        {enemy.block ? ` · 防 ${enemy.block}` : ""}
        {enemy.strength ? ` · 筋 ${enemy.strength}` : ""}
        {enemy.poison ? ` · 毒 ${enemy.poison}` : ""}
      </p>
    </div>
  );
}

function useEnemyPose(hp: number, striking: boolean) {
  const [pose, setPose] = useState<"enter" | "idle" | "hit" | "strike" | "die">(hp <= 0 ? "die" : "enter");
  const hpRef = useRef(hp);

  useEffect(() => {
    if (pose !== "enter") return;
    const t = window.setTimeout(() => setPose("idle"), 720);
    return () => window.clearTimeout(t);
  }, [pose]);

  useEffect(() => {
    if (hp <= 0) {
      setPose("die");
      hpRef.current = hp;
      return;
    }
    if (hp < hpRef.current) {
      setPose("hit");
      hpRef.current = hp;
      const t = window.setTimeout(() => setPose("idle"), 300);
      return () => window.clearTimeout(t);
    }
    hpRef.current = hp;
  }, [hp]);

  useEffect(() => {
    if (!striking || hp <= 0) return;
    setPose("strike");
    const t = window.setTimeout(() => setPose("idle"), 430);
    return () => window.clearTimeout(t);
  }, [striking, hp]);

  return pose;
}

function PlayerFloaters({ floaters }: { floaters: Floater[] }) {
  if (!floaters.length) return null;
  return (
    <div className="pointer-events-none absolute bottom-56 left-1/2 -translate-x-1/2">
      {floaters.map((f) => (
        <span
          key={f.id}
          className={cn(
            "block animate-floater text-center font-pixel text-2xl",
            f.kind === "dmg" ? "text-blood" : f.kind === "block" ? "text-parchment" : "text-accent",
          )}
        >
          {f.text}
        </span>
      ))}
    </div>
  );
}

function intentLabel(e: CombatEnemy) {
  const ids = e.shownCardIds ?? e.actionCardIds;
  if (ids.length > 0) return `${ids.map((id) => getCard(id).name).join("・")}を使用`;
  const i = e.shownIntent ?? e.intent;
  if (i.seal) return i.seal === "attack" ? "攻撃封印" : "技能封印";
  return "行動準備";
}

function reducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function useCombatFx(hp: number, maxHp: number, sanity: number, maxSanity: number) {
  const traumaRef = useRef(0);
  const hpRef = useRef(hp);
  const sanRef = useRef(sanity);
  const [tick, setTick] = useState(0);
  const [vertigo, setVertigo] = useState(false);
  const [playerHit, setPlayerHit] = useState(false);

  const pulseVertigo = () => {
    if (reducedMotion()) return;
    setVertigo(true);
    window.setTimeout(() => setVertigo(false), 500);
  };

  const addTrauma = (n: number) => {
    if (reducedMotion()) return;
    traumaRef.current = Math.min(1, traumaRef.current + n);
    setTick((x) => x + 1);
  };

  useEffect(() => {
    if (hp < hpRef.current) {
      addTrauma(0.55 + Math.min(0.35, (hpRef.current - hp) / Math.max(1, maxHp)));
      setPlayerHit(true);
      window.setTimeout(() => setPlayerHit(false), 450);
    }
    hpRef.current = hp;
  }, [hp, maxHp]);

  useEffect(() => {
    if (sanity < sanRef.current) pulseVertigo();
    sanRef.current = sanity;
  }, [sanity]);

  useEffect(() => {
    if (sanity / Math.max(1, maxSanity) >= 0.45) return;
    const id = window.setInterval(pulseVertigo, 9000);
    return () => window.clearInterval(id);
  }, [sanity, maxSanity]);

  return { traumaRef, tick, vertigo, playerHit };
}

function ShakeRoot({
  tick,
  traumaRef,
  className,
  children,
}: {
  tick: number;
  traumaRef: RefObject<number>;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reducedMotion()) return;
    let last = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      traumaRef.current = Math.max(0, traumaRef.current - 3.2 * dt);
      const mag = traumaRef.current * traumaRef.current;
      const el = ref.current;
      if (el) {
        if (mag < 0.002) el.style.transform = "";
        else {
          const x = mag * 8 * Math.sin(now * 0.061);
          const y = mag * 6 * Math.sin(now * 0.083);
          const r = mag * 0.9 * Math.sin(now * 0.047);
          el.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) rotate(${r.toFixed(3)}deg)`;
        }
      }
      if (traumaRef.current > 0.01) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tick, traumaRef]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
