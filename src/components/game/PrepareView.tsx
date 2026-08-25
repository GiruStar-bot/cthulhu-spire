import { useMemo } from "react";
import { MAX_LOADOUT, STAT_BUDGET, STAT_MIN, unlockedFeatures } from "@/game/profile";
import { RELICS, relicDesc, relicLabel } from "@/game/relics";
import { useGame } from "@/game/store";
import { cn } from "@/lib/utils";

export function PrepareView() {
  const profile = useGame((s) => s.profile);
  const playerName = useGame((s) => s.playerName);
  const setPlayerName = useGame((s) => s.setPlayerName);
  const setStat = useGame((s) => s.setStat);
  const toggleLoadout = useGame((s) => s.toggleLoadout);
  const startRun = useGame((s) => s.startRun);
  const toast = useGame((s) => s.toast);

  const sum = profile.stats.body + profile.stats.mind + profile.stats.will;
  const remain = STAT_BUDGET - sum;
  const features = useMemo(() => unlockedFeatures(profile.stats), [profile.stats]);
  const canStart = playerName.trim().length > 0 && sum === STAT_BUDGET;

  return (
    <section className="min-h-dvh bg-ink px-4 py-8 sm:px-10">
      <p className="font-mono text-[11px] tracking-widest text-accent">器を調える</p>
      <h2 className="font-display mt-2 text-3xl text-parchment sm:text-4xl">登攀の準備</h2>
      <p className="mt-2 max-w-xl text-sm text-muted">
        名を刻み、肉体・知識・意志を振り、遺物を最大{MAX_LOADOUT}つまで持ち込む。遺物は一度得れば永久に残る。
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <label className="block">
            <span className="font-mono text-[11px] tracking-wider text-muted">プレイヤー名</span>
            <input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={16}
              placeholder="名を入力"
              className="mt-2 w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 py-3 font-display text-lg text-parchment outline-none focus:border-accent"
            />
          </label>

          <div>
            <div className="flex items-baseline justify-between">
              <h3 className="font-display text-xl text-parchment">思想の配分</h3>
              <span className={cn("font-mono text-[11px]", remain === 0 ? "text-accent" : "text-blood")}>
                残り {remain} / 合計 {STAT_BUDGET}
              </span>
            </div>
            <div className="mt-4 space-y-4">
              <StatRow
                label="肉体"
                hint="筋肉と生存。最大体力+2/点"
                value={profile.stats.body}
                onChange={(v) => setStat("body", v)}
                remain={remain}
              />
              <StatRow
                label="知識"
                hint="理解と代償。最大正気+2/点"
                value={profile.stats.mind}
                onChange={(v) => setStat("mind", v)}
                remain={remain}
              />
              <StatRow
                label="意志"
                hint="儀式と耐性。開始筋力の芽"
                value={profile.stats.will}
                onChange={(v) => setStat("will", v)}
                remain={remain}
              />
            </div>
            {features.length > 0 ? (
              <ul className="mt-4 space-y-1">
                {features.map((f) => (
                  <li key={f} className="font-mono text-[11px] text-accent">
                    解禁: {f}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 font-mono text-[11px] text-muted">ステータスを伸ばすと、術や選択肢が開く。</p>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <h3 className="font-display text-xl text-parchment">遺物の持込</h3>
            <span className="font-mono text-[11px] text-muted">
              {profile.loadoutIds.length}/{MAX_LOADOUT}
            </span>
          </div>
          {profile.collection.length === 0 ? (
            <p className="mt-4 text-sm text-muted">まだ遺物を持っていない。塔の奥で拾い、次回から持ち込める。</p>
          ) : (
            <ul className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">
              {profile.collection.map((inst) => {
                const on = profile.loadoutIds.includes(inst.uid);
                const def = RELICS[inst.defId];
                return (
                  <li key={inst.uid}>
                    <button
                      type="button"
                      onClick={() => toggleLoadout(inst.uid)}
                      className={cn(
                        "w-full rounded-[var(--radius-md)] border px-3 py-3 text-left transition-colors",
                        on ? "border-accent bg-surface" : "border-border bg-ink-2 hover:border-muted",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display text-sm text-parchment">{relicLabel(inst)}</span>
                        <span className="font-mono text-[10px] text-muted">{on ? "持込中" : "保管"}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted">{relicDesc(inst)}</p>
                      <p className="mt-1 font-mono text-[10px] text-muted">
                        {def?.name} · 入手階 {inst.obtainedFloor}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-3 font-mono text-[10px] text-muted">
            記録: 登攀 {profile.runs} · 最高階 {profile.bestFloor} · 所持遺物 {profile.collection.length}
          </p>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-4">
        <button
          type="button"
          disabled={!canStart}
          onClick={startRun}
          className={cn(
            "min-h-11 rounded-[var(--radius-md)] px-6 py-3 font-display text-base transition-transform",
            canStart
              ? "bg-parchment text-ink hover:scale-[1.02] active:scale-[0.98]"
              : "cursor-not-allowed bg-surface text-muted",
          )}
        >
          登攀を始める
        </button>
        {toast ? <p className="text-sm text-blood">{toast}</p> : null}
        {!canStart ? (
          <p className="text-sm text-muted">名前を入れ、ステータスをちょうど{STAT_BUDGET}に振り切ってください。</p>
        ) : null}
      </div>
    </section>
  );
}

function StatRow({
  label,
  hint,
  value,
  onChange,
  remain,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (v: number) => void;
  remain: number;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-parchment">{label}</p>
          <p className="font-mono text-[10px] text-muted">{hint}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="size-9 rounded border border-border text-parchment hover:border-accent"
            onClick={() => onChange(value - 1)}
            disabled={value <= STAT_MIN}
          >
            −
          </button>
          <span className="w-8 text-center font-mono text-lg tabular-nums text-accent">{value}</span>
          <button
            type="button"
            className="size-9 rounded border border-border text-parchment hover:border-accent"
            onClick={() => onChange(value + 1)}
            disabled={remain <= 0}
          >
            ＋
          </button>
        </div>
      </div>
    </div>
  );
}
