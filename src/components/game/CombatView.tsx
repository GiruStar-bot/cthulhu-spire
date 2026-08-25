import { CardView } from "@/components/game/CardView";
import { CreatureMedia } from "@/components/game/CreatureMedia";
import { Vitals } from "@/components/game/Hud";
import { POWER_TEXT, canPlay } from "@/game/combat";
import { getEnemy } from "@/game/enemies";
import { cardCost, getCard } from "@/game/cards";
import { useGame } from "@/game/store";
import { asset } from "@/lib/asset";
import { isVideoSrc } from "@/lib/media";
import { cn } from "@/lib/utils";
import type { CombatEnemy, Floater } from "@/game/types";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";

export function CombatView() {
  const combat = useGame((s) => s.combat);
  const targeting = useGame((s) => s.targeting);
  const play = useGame((s) => s.play);
  const endTurn = useGame((s) => s.endPlayerTurn);
  const setTargeting = useGame((s) => s.setTargeting);
  const hp = useGame((s) => s.hp);
  const maxHp = useGame((s) => s.maxHp);
  const sanity = useGame((s) => s.sanity);
  const maxSanity = useGame((s) => s.maxSanity);
  const toast = useGame((s) => s.toast);
  const dismiss = useGame((s) => s.dismissToast);
  const fx = useCombatFx(hp, maxHp, sanity, maxSanity);

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
    <section className="relative h-dvh overflow-hidden bg-ink">
      <ShakeRoot tick={fx.tick} traumaRef={fx.traumaRef} className="relative h-dvh overflow-hidden">
        <img
          src={asset("art/corridor.jpg")}
          alt=""
          className="pointer-events-none absolute inset-0 z-0 size-full object-cover opacity-35"
          crossOrigin="anonymous"
        />
        <div className="absolute inset-0 z-0 bg-linear-to-b from-ink/40 via-transparent to-ink" />

        <div className="fx-blood" style={{ "--blood": blood } as CSSProperties} />
        <div className={cn("fx-vertigo", fx.vertigo ? "is-on" : "")} />

        <div
          className={cn("combat-foe", targeting ? "is-aiming" : "")}
          onClick={(e) => {
            if (!targeting) return;
            const stages = [...e.currentTarget.querySelectorAll<HTMLElement>(".enemy-stage")];
            for (const el of stages.reverse()) {
              if (el.dataset.dead === "1") continue;
              const canvas = el.querySelector("canvas");
              const img = el.querySelector("img");
              const hit = canvas
                ? opaqueAt(canvas, e.clientX, e.clientY)
                : img
                  ? boxAt(img, e.clientX, e.clientY)
                  : boxAt(el, e.clientX, e.clientY);
              if (!hit) continue;
              const uid = el.dataset.uid;
              if (uid) play(targeting, uid);
              return;
            }
          }}
        >
          {combat.enemies.map((e) => (
            <EnemyStage
              key={e.uid}
              enemy={e}
              floaters={combat.floaters.filter((f) => f.who === e.uid)}
              targeting={!!targeting}
              striking={fx.playerHit && e.hp > 0}
            />
          ))}
        </div>

        <div className="pointer-events-none relative z-10 flex h-dvh flex-col">
          <div className="pointer-events-auto shrink-0 px-3 pt-3 sm:px-6">
            <Vitals />
            {toast ? (
              <button
                type="button"
                onClick={dismiss}
                className="mt-2 rounded-[var(--radius-md)] bg-surface px-3 py-2 text-left text-sm text-parchment shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-accent)_40%,transparent)]"
              >
                {toast}
              </button>
            ) : null}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-[var(--radius-sm)] bg-surface px-2 py-1 font-mono text-xs text-parchment tabular-nums shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-parchment)_14%,transparent)]">
                エネルギー {combat.energy}/{combat.maxEnergy}
              </span>
              <Energy n={combat.energy} max={combat.maxEnergy} />
              <span className="rounded-[var(--radius-sm)] bg-surface px-2 py-1 font-mono text-xs text-parchment tabular-nums shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-parchment)_14%,transparent)]">
                ブロック {combat.block}
              </span>
              {combat.strength ? (
                <span className="font-mono text-xs text-accent">筋力 {combat.strength}</span>
              ) : null}
              {combat.weak ? (
                <span className="font-mono text-xs text-blood">弱体 {combat.weak}</span>
              ) : null}
            </div>
          </div>

          <div className="min-h-0 flex-1" />

          <div className="pointer-events-auto relative z-10 shrink-0 px-3 sm:px-6">
            <div className="mb-2 flex flex-wrap items-end justify-center gap-8">
              {combat.enemies.map((e) => (
                <EnemyPlate key={e.uid} enemy={e} targeting={!!targeting} onTarget={() => targeting && play(targeting, e.uid)} />
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {combat.powers.map((p) => (
                <span
                  key={p}
                  className="rounded-full bg-surface px-2 py-1 font-mono text-xs text-muted shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-parchment)_14%,transparent)]"
                >
                  {POWER_TEXT[p]}
                </span>
              ))}
              {combat.log.slice(-1).map((l) => (
                <span key={l} className="text-xs text-muted italic">
                  {l}
                </span>
              ))}
            </div>
          </div>

          <div className="combat-hand pointer-events-auto relative z-20 flex shrink-0 items-end gap-2 px-3 pb-2 sm:px-6">
            <div className="flex max-h-[26dvh] flex-1 gap-2 overflow-x-auto overflow-y-hidden pt-2">
              {combat.hand.map((card) => {
                const playable = canPlay(combat, card) && combat.phase === "player";
                return (
                  <CardView
                    key={card.uid}
                    card={card}
                    playable={playable}
                    selected={targeting === card.uid}
                    compact
                    onClick={() => {
                      if (!playable) {
                        const d = getCard(card.defId);
                        if (d.unplayable) return;
                        if (cardCost(card) > combat.energy) return;
                      }
                      if (targeting === card.uid) setTargeting(null);
                      else play(card.uid);
                    }}
                  />
                );
              })}
            </div>
            <button
              type="button"
              onClick={endTurn}
              disabled={combat.phase !== "player"}
              className="mb-2 min-h-14 shrink-0 rounded-[var(--radius-md)] bg-parchment px-4 py-3 font-display text-ink transition-transform duration-150 ease-out active:not-disabled:scale-[0.96] disabled:opacity-40"
            >
              終了
              <span className="block font-mono text-xs tracking-wider opacity-70">ターン</span>
            </button>
          </div>

          {targeting ? (
            <p className="pointer-events-none absolute bottom-[28dvh] left-0 right-0 z-20 text-center font-mono text-xs tracking-wider text-accent">
              敵を選択
            </p>
          ) : null}

          <PlayerFloaters floaters={combat.floaters.filter((f) => f.who === "player")} />
        </div>
      </ShakeRoot>
    </section>
  );
}

function Energy({ n, max }: { n: number; max: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`エネルギー ${n}`}>
      {Array.from({ length: Math.max(max, n) }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "size-3 rounded-full",
            i < n
              ? "bg-accent"
              : "shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-parchment)_14%,transparent)]",
          )}
        />
      ))}
    </div>
  );
}

function EnemyStage({
  enemy,
  floaters,
  targeting,
  striking,
}: {
  enemy: CombatEnemy;
  floaters: Floater[];
  targeting: boolean;
  striking: boolean;
}) {
  const dead = enemy.hp <= 0;
  const def = getEnemy(enemy.defId);
  const pose = useEnemyPose(enemy.hp, striking);
  const cutout = isVideoSrc(def.art) || Boolean(def.idleFrames?.length);
  const boss = enemy.maxHp >= 150;

  return (
    <div
      data-uid={enemy.uid}
      data-dead={dead ? "1" : "0"}
      className={cn(
        "enemy-stage relative text-left",
        boss ? "is-boss" : "",
        pose === "enter" && "enemy-enter",
        pose === "idle" && !cutout && "enemy-idle",
        pose === "hit" && "enemy-hit",
        pose === "strike" && "enemy-strike",
        pose === "die" && "enemy-die",
        targeting && !dead ? "is-aim" : "",
      )}
    >
      <div className={cn("enemy-figure", cutout && "is-cutout")}>
        <CreatureMedia src={def.art} poster={def.poster} />
        <div className="enemy-impact" />
      </div>
      <div className="enemy-shadow" />
      <div className="pointer-events-none absolute top-[18%] left-1/2 -translate-x-1/2">
        {floaters.map((f) => (
          <span
            key={f.id}
            className={cn(
              "block animate-floater font-display text-2xl",
              f.kind === "dmg" ? "text-blood" : "text-accent",
            )}
          >
            {f.text}
          </span>
        ))}
      </div>
    </div>
  );
}

function opaqueAt(canvas: HTMLCanvasElement, clientX: number, clientY: number): boolean {
  const r = canvas.getBoundingClientRect();
  const iw = canvas.width;
  const ih = canvas.height;
  if (!iw || !ih) return boxAt(canvas, clientX, clientY);
  const scale = Math.min(r.width / iw, r.height / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const left = r.left + (r.width - dw) / 2;
  const top = r.top + (r.height - dh);
  const x = (clientX - left) / scale;
  const y = (clientY - top) / scale;
  if (x < 0 || y < 0 || x >= iw || y >= ih) return false;
  try {
    const a = canvas.getContext("2d")?.getImageData(Math.floor(x), Math.floor(y), 1, 1).data[3] ?? 0;
    return a > 24;
  } catch {
    return boxAt(canvas, clientX, clientY);
  }
}

function boxAt(el: Element, clientX: number, clientY: number): boolean {
  const r = el.getBoundingClientRect();
  return clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom;
}

function EnemyPlate({
  enemy,
  targeting,
  onTarget,
}: {
  enemy: CombatEnemy;
  targeting: boolean;
  onTarget: () => void;
}) {
  const def = getEnemy(enemy.defId);
  const intent = intentLabel(enemy);
  const dead = enemy.hp <= 0;
  return (
    <button
      type="button"
      disabled={dead}
      onClick={onTarget}
      className={cn("min-w-40 text-left", targeting && !dead ? "ring-1 ring-accent rounded-[var(--radius-md)] px-2 py-1" : "")}
    >
      <p className="font-display text-sm text-parchment">{def.name}</p>
      <p className="font-mono text-xs text-accent">{intent}</p>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-2">
        <div className="h-full bg-blood" style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }} />
      </div>
      <p className="font-mono text-xs text-muted tabular-nums">
        {enemy.hp}/{enemy.maxHp}
        {enemy.block ? ` · 防 ${enemy.block}` : ""}
        {enemy.strength ? ` · 筋 ${enemy.strength}` : ""}
      </p>
    </button>
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
            "block animate-floater text-center font-display text-2xl",
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
  const i = e.intent;
  if (i.kind === "attack") {
    const hits = i.hits ?? 1;
    const d = (i.damage ?? 0) + e.strength;
    return hits > 1 ? `攻撃 ${d}×${hits}` : `攻撃 ${d}`;
  }
  if (i.kind === "defend") return `防御 ${i.block ?? 0}`;
  if (i.kind === "buff") return `強化 筋+${i.strength ?? 0}`;
  if (i.kind === "debuff") return i.dread ? "侵食" : "弱体化";
  return "不明";
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
