import { CardView } from "@/components/game/CardView";
import { asset } from "@/lib/asset";
import { Vitals } from "@/components/game/Hud";
import { POWER_TEXT, canPlay } from "@/game/combat";
import { getEnemy } from "@/game/enemies";
import { cardCost, getCard } from "@/game/cards";
import { useGame } from "@/game/store";
import { cn } from "@/lib/utils";
import type { CombatEnemy, Floater } from "@/game/types";

export function CombatView() {
  const combat = useGame((s) => s.combat);
  const targeting = useGame((s) => s.targeting);
  const play = useGame((s) => s.play);
  const endTurn = useGame((s) => s.endPlayerTurn);
  const setTargeting = useGame((s) => s.setTargeting);
  const hp = useGame((s) => s.hp);
  const maxHp = useGame((s) => s.maxHp);

  if (!combat) return null;

  return (
    <section className="relative flex min-h-dvh flex-col overflow-hidden bg-ink">
      <img
        src={asset("art/corridor.jpg")}
        alt=""
        className="pointer-events-none absolute inset-0 size-full object-cover opacity-35"
        crossOrigin="anonymous"
      />
      <div className="absolute inset-0 bg-linear-to-b from-ink/40 via-transparent to-ink" />

      <div className="relative z-10 flex min-h-dvh flex-col gap-3 px-3 py-3 sm:px-6">
        <div className="flex flex-col gap-2">
          <Vitals />
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-[var(--radius-sm)] border border-border bg-surface px-2 py-1 font-mono text-[11px] text-parchment tabular-nums">
              エネルギー {combat.energy}/{combat.maxEnergy}
            </span>
            <Energy n={combat.energy} max={combat.maxEnergy} />
            <span className="rounded-[var(--radius-sm)] border border-border bg-surface px-2 py-1 font-mono text-[11px] text-parchment tabular-nums">
              ブロック {combat.block}
            </span>
            {combat.strength ? (
              <span className="font-mono text-[11px] text-accent">筋力 {combat.strength}</span>
            ) : null}
            {combat.weak ? (
              <span className="font-mono text-[11px] text-blood">弱体 {combat.weak}</span>
            ) : null}
          </div>
        </div>

        <div className="flex min-h-40 flex-1 items-end justify-center gap-4 pt-2 sm:items-center">
          {combat.enemies.map((e) => (
            <EnemyCard
              key={e.uid}
              enemy={e}
              floaters={combat.floaters.filter((f) => f.who === e.uid)}
              targeting={!!targeting}
              onTarget={() => {
                if (targeting) play(targeting, e.uid);
              }}
            />
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {combat.powers.map((p) => (
            <span
              key={p}
              className="rounded-full border border-border bg-surface px-2 py-1 font-mono text-[10px] text-muted"
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

        <div className="flex items-end gap-2">
          <div className="flex min-h-48 flex-1 gap-2 overflow-x-auto pb-2 pt-4">
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
            className="mb-4 min-h-14 shrink-0 rounded-[var(--radius-md)] bg-parchment px-4 py-3 font-display text-ink disabled:opacity-40"
          >
            終了
            <span className="block font-mono text-[10px] tracking-wider opacity-70">
              ターン
            </span>
          </button>
        </div>

        {targeting ? (
          <p className="text-center font-mono text-[11px] tracking-wider text-accent">
            敵を選択
          </p>
        ) : null}

        <PlayerFloaters floaters={combat.floaters.filter((f) => f.who === "player")} hp={hp} max={maxHp} />
      </div>
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
            "size-3 rounded-full border",
            i < n ? "border-accent bg-accent" : "border-border bg-transparent",
          )}
        />
      ))}
    </div>
  );
}

function EnemyCard({
  enemy,
  floaters,
  targeting,
  onTarget,
}: {
  enemy: CombatEnemy;
  floaters: Floater[];
  targeting: boolean;
  onTarget: () => void;
}) {
  const dead = enemy.hp <= 0;
  const def = getEnemy(enemy.defId);
  const intent = intentLabel(enemy);
  return (
    <button
      type="button"
      disabled={dead}
      onClick={onTarget}
      className={cn(
        "relative w-32 sm:w-40 text-left",
        targeting && !dead ? "ring-1 ring-accent rounded-[var(--radius-lg)]" : "",
        dead ? "opacity-30" : "",
      )}
    >
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
        <img src={def.art} alt="" className="h-36 w-full object-cover sm:h-44" crossOrigin="anonymous" />
        <div className="space-y-1 p-2">
          <p className="font-display text-sm text-parchment">{def.name}</p>
          <p className="font-mono text-[10px] text-accent">{intent}</p>
          <div className="h-1.5 overflow-hidden rounded-full bg-ink-2">
            <div
              className="h-full bg-blood"
              style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
            />
          </div>
          <p className="font-mono text-[10px] text-muted tabular-nums">
            {enemy.hp}/{enemy.maxHp}
            {enemy.block ? ` · 防 ${enemy.block}` : ""}
            {enemy.strength ? ` · 筋 ${enemy.strength}` : ""}
          </p>
        </div>
      </div>
      <div className="pointer-events-none absolute top-6 left-1/2 -translate-x-1/2">
        {floaters.map((f) => (
          <span
            key={f.id}
            className={cn(
              "block animate-floater font-display text-xl",
              f.kind === "dmg" ? "text-blood" : "text-accent",
            )}
          >
            {f.text}
          </span>
        ))}
      </div>
    </button>
  );
}

function PlayerFloaters({
  floaters,
}: {
  floaters: Floater[];
  hp: number;
  max: number;
}) {
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
