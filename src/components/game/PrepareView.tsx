import { useEffect, useMemo } from "react";
import { DEMO_MAX_FLOOR, layerLabel, tallyFloors } from "@/game/floors";
import { playBgm, unlockAudio } from "@/game/audio";
import { MAX_LOADOUT, STAT_BUDGET, STAT_MIN, unlockedFeatures } from "@/game/profile";
import { RELICS, relicDesc, relicLabel } from "@/game/relics";
import { useGame } from "@/game/store";
import { asset } from "@/lib/asset";
import { cn } from "@/lib/utils";

export function PrepareView() {
  const profile = useGame((s) => s.profile);
  const playerName = useGame((s) => s.playerName);
  const setPlayerName = useGame((s) => s.setPlayerName);
  const setStat = useGame((s) => s.setStat);
  const toggleLoadout = useGame((s) => s.toggleLoadout);
  const startRun = useGame((s) => s.startRun);
  const toast = useGame((s) => s.toast);
  const runFloors = useGame((s) => s.runFloors);
  const seed = useGame((s) => s.seed);

  const sum = profile.stats.body + profile.stats.mind + profile.stats.will;
  const remain = STAT_BUDGET - sum;
  const features = useMemo(() => unlockedFeatures(profile.stats), [profile.stats]);
  const tally = useMemo(() => tallyFloors(runFloors), [runFloors]);
  const canStart = playerName.trim().length > 0 && sum === STAT_BUDGET;

  useEffect(() => {
    unlockAudio();
    playBgm("prepare");
  }, []);

  return (
    <section className="relative min-h-dvh overflow-hidden bg-ink px-4 py-8 sm:px-10">
      <img
        src={asset("art/corridor.jpg")}
        alt=""
        className="pointer-events-none absolute inset-0 size-full object-cover opacity-30"
        crossOrigin="anonymous"
      />
      <div className="absolute inset-0 bg-ink/70" />
      <div className="rot-paper relative z-10 mx-auto max-w-5xl px-5 py-8 sm:px-10 sm:py-10">
        <header className="journal-head">
          <p className="font-mono text-xs tracking-widest text-accent">ルルイエ調査団 · 単独</p>
          <h2 className="font-display mt-2 text-3xl text-balance text-parchment sm:text-4xl">潜航前点検</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-pretty text-muted">
            下へ沈むほど層は増える。名を刻み、兵の肉体・学者の知識・科学者の意志を振り、遺物を最大
            {MAX_LOADOUT}つまで持ち込む。沈降を始めれば、ただちに{layerLabel(1)}へ沈む。
          </p>
          {runFloors.length > 0 ? (
            <p className="mt-3 font-mono text-xs tracking-wider text-accent">
              第1–{DEMO_MAX_FLOOR}層 · 守護 {tally.combat + tally.elite} · 予兆 {tally.event} · 休息 {tally.rest} ·
              中ボス {tally.mid} · 大ボス {tally.boss}
              <span className="ml-2 tabular-nums text-muted">調査番号 {seed.toString(16)}</span>
            </p>
          ) : null}
        </header>

        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          <div className="space-y-6">
            <label className="block">
              <span className="font-mono text-xs tracking-wider text-muted">調査員名</span>
              <input
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={16}
                placeholder="名を記す"
                className="journal-rule mt-2 w-full border-0 bg-transparent px-0 py-3 font-display text-lg text-parchment outline-none focus:border-accent"
              />
            </label>

            <div>
              <div className="flex items-baseline justify-between">
                <h3 className="font-display text-xl text-parchment">器の配分</h3>
                <span className={cn("font-mono text-xs tabular-nums", remain === 0 ? "text-accent" : "text-blood")}>
                  残り {remain} / 合計 {STAT_BUDGET}
                </span>
              </div>
              <div className="mt-2">
                <StatRow
                  label="肉体"
                  hint="兵の肉体。最大体力+2/点"
                  value={profile.stats.body}
                  onChange={(v) => setStat("body", v)}
                  remain={remain}
                />
                <StatRow
                  label="知識"
                  hint="学者の知識。最大正気+2/点"
                  value={profile.stats.mind}
                  onChange={(v) => setStat("mind", v)}
                  remain={remain}
                />
                <StatRow
                  label="意志"
                  hint="科学者の意志。開始筋力の芽"
                  value={profile.stats.will}
                  onChange={(v) => setStat("will", v)}
                  remain={remain}
                />
              </div>
              {features.length > 0 ? (
                <ul className="mt-4 space-y-1">
                  {features.map((f) => (
                    <li key={f} className="font-mono text-xs text-accent">
                      解禁: {f}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 font-mono text-xs text-muted">配分を偏らせると、術や選択肢が開く。</p>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <h3 className="font-display text-xl text-parchment">遺物の持込</h3>
              <span className="font-mono text-xs tabular-nums text-muted">
                {profile.loadoutIds.length}/{MAX_LOADOUT}
              </span>
            </div>
            {profile.collection.length === 0 ? (
              <p className="journal-rule mt-4 pb-4 text-sm text-muted">
                まだ遺物を持っていない。層の奥で拾い、次回から持ち込める。
              </p>
            ) : (
              <ul className="mt-2">
                {profile.collection.map((inst) => {
                  const on = profile.loadoutIds.includes(inst.uid);
                  const def = RELICS[inst.defId];
                  return (
                    <li key={inst.uid} className="journal-rule">
                      <button
                        type="button"
                        onClick={() => toggleLoadout(inst.uid)}
                        className="w-full py-3 text-left"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-display text-sm text-parchment">{relicLabel(inst)}</span>
                          <span className="font-mono text-xs text-muted">{on ? "持込中" : "保管"}</span>
                        </div>
                        <p className="mt-1 text-xs text-muted">{relicDesc(inst)}</p>
                        <p className="mt-1 font-mono text-xs tabular-nums text-muted">
                          {def?.name} · 入手 {layerLabel(inst.obtainedFloor)}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="mt-3 font-mono text-xs tabular-nums text-muted">
              記録: 潜航 {profile.runs} · 最深{" "}
              {profile.bestFloor ? layerLabel(profile.bestFloor) : "未潜航"} · 所持遺物 {profile.collection.length}
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <button
            type="button"
            disabled={!canStart}
            onClick={startRun}
            className={cn(
              "ink-stamp min-h-12 px-8 py-3 font-display text-base transition-transform duration-(--motion-fast)",
              canStart ? "hover:scale-[1.02] active:scale-[0.98]" : "cursor-not-allowed",
            )}
          >
            沈降を始める
          </button>
          {toast ? <p className="text-sm text-blood">{toast}</p> : null}
          {!canStart ? (
            <p className="text-sm text-muted">名前を入れ、配分をちょうど{STAT_BUDGET}に振り切ってください。</p>
          ) : null}
        </div>
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
    <div className="journal-rule flex items-center justify-between gap-3 py-3">
      <div>
        <p className="font-display text-parchment">{label}</p>
        <p className="font-mono text-xs text-muted">{hint}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="size-11 text-parchment hover:text-accent"
          onClick={() => onChange(value - 1)}
          disabled={value <= STAT_MIN}
        >
          −
        </button>
        <span className="w-8 text-center font-mono text-lg tabular-nums text-parchment">{value}</span>
        <button
          type="button"
          className="size-11 text-parchment hover:text-accent"
          onClick={() => onChange(value + 1)}
          disabled={remain <= 0}
        >
          ＋
        </button>
      </div>
    </div>
  );
}
