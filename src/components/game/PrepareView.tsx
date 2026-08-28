import { useMemo } from "react";
import { DEMO_MAX_FLOOR, layerLabel, tallyFloors } from "@/game/floors";
import { MAX_LOADOUT, STAT_MIN, statBudget, statSum, unlockedFeatures } from "@/game/profile";
import { RELICS, relicDesc, relicLabel } from "@/game/relics";
import { useGame } from "@/game/store";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelWindow } from "@/components/ui/PixelWindow";
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

  const sum = statSum(profile.stats);
  const budget = statBudget(profile);
  const remain = budget - sum;
  const features = useMemo(() => unlockedFeatures(profile.stats), [profile.stats]);
  const tally = useMemo(() => tallyFloors(runFloors), [runFloors]);
  const canStart = playerName.trim().length > 0 && sum === budget;

  return (
    <section className="relative flex h-dvh flex-col overflow-hidden bg-ink px-3 py-3 sm:px-6">
      <img
        src={asset("art/pixel/bg/loadout.jpg")}
        alt=""
        className="absolute inset-0 size-full object-cover"
        crossOrigin="anonymous"
      />
      <div className="absolute inset-0 bg-ink/50" />
      <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col">
        <header className="shrink-0 px-1 py-2">
          <p className="font-pixel text-xs tracking-widest text-muted">ルルイエ調査団 · 単独</p>
          <h2 className="font-pixel mt-1 text-2xl text-balance text-white sm:text-3xl">探索</h2>
          <p className="mt-1 max-w-xl text-sm text-pretty text-muted">
            名と配分を決め、遺物は{MAX_LOADOUT}つまで。始めればただちに{layerLabel(1)}へ沈む。
          </p>
          {runFloors.length > 0 ? (
            <p className="mt-2 font-pixel text-xs tracking-wider text-muted">
              第1–{DEMO_MAX_FLOOR}層 · 守護 {tally.combat + tally.elite} · 予兆 {tally.event} · 休息 {tally.rest} ·
              中ボス {tally.mid} · 大ボス {tally.boss}
              <span className="ml-2 tabular-nums">調査番号 {seed.toString(16)}</span>
            </p>
          ) : null}
        </header>

        <div className="mt-2 flex min-h-0 flex-1 flex-col gap-3 overflow-hidden lg:grid lg:grid-cols-2">
          <PixelWindow className="flex min-h-0 flex-col overflow-hidden p-4">
            <label className="block shrink-0">
              <span className="text-xs tracking-wider text-muted">調査員名</span>
              <input
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={16}
                placeholder="名を記す"
                className="mt-1 w-full border-0 border-b-2 border-gray-200 bg-transparent px-0 py-2 font-pixel text-lg text-white outline-none"
              />
            </label>

            <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
              <div className="flex items-baseline justify-between">
                <h3 className="text-lg text-white">器の配分</h3>
                <span className={cn("text-xs tabular-nums", remain === 0 ? "text-accent" : "text-blood")}>
                  残り {remain} / 合計 {budget}
                </span>
              </div>
              <div className="mt-1">
                <StatRow
                  label="肉体"
                  hint="最大体力+2/点"
                  value={profile.stats.body}
                  onChange={(v) => setStat("body", v)}
                  remain={remain}
                />
                <StatRow
                  label="知識"
                  hint="最大正気+2/点"
                  value={profile.stats.mind}
                  onChange={(v) => setStat("mind", v)}
                  remain={remain}
                />
                <StatRow
                  label="意志"
                  hint="開始筋力の芽"
                  value={profile.stats.will}
                  onChange={(v) => setStat("will", v)}
                  remain={remain}
                />
              </div>
              {features.length > 0 ? (
                <p className="mt-2 truncate text-xs text-accent">解禁: {features.join(" · ")}</p>
              ) : (
                <p className="mt-2 text-xs text-muted">配分を偏らせると、術や選択肢が開く。</p>
              )}
            </div>
          </PixelWindow>

          <PixelWindow className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
            <div className="flex shrink-0 items-baseline justify-between">
              <h3 className="text-lg text-white">遺物の持込</h3>
              <span className="text-xs tabular-nums text-muted">
                {profile.loadoutIds.length}/{MAX_LOADOUT}
              </span>
            </div>
            {profile.collection.length === 0 ? (
              <p className="mt-3 text-sm text-muted">まだ遺物を持っていない。層の奥で拾い、次回から持ち込める。</p>
            ) : (
              <ul className="mt-2 min-h-0 flex-1 overflow-y-auto">
                {profile.collection.map((inst) => {
                  const on = profile.loadoutIds.includes(inst.uid);
                  const def = RELICS[inst.defId];
                  return (
                    <li key={inst.uid} className="border-b border-gray-200/30">
                      <button
                        type="button"
                        onClick={() => toggleLoadout(inst.uid)}
                        className="flex min-h-11 w-full items-center justify-between gap-3 py-2 text-left"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm text-white">{relicLabel(inst)}</span>
                          <span className="mt-0.5 block truncate text-xs text-muted">{relicDesc(inst)}</span>
                        </span>
                        <span className="shrink-0 text-xs text-muted">
                          {on ? "持込中" : "保管"}
                          {def ? ` · ${layerLabel(inst.obtainedFloor)}` : ""}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="mt-2 shrink-0 text-xs tabular-nums text-muted">
              記録: 潜航 {profile.runs} · 最深 {profile.bestFloor ? layerLabel(profile.bestFloor) : "未潜航"} · 所持遺物{" "}
              {profile.collection.length}
            </p>
          </PixelWindow>
        </div>

        <div className="mt-3 flex shrink-0 flex-wrap items-center gap-3 pb-1">
          <PixelButton disabled={!canStart} onClick={startRun} className="min-h-12 px-8">
            潜航開始
          </PixelButton>
          {toast ? <p className="text-sm text-blood">{toast}</p> : null}
          {!canStart ? (
            <p className="text-sm text-muted">名前を入れ、配分をちょうど{budget}に振り切ってください。</p>
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
    <div className="flex items-center justify-between gap-3 border-b border-gray-200/30 py-2">
      <div className="min-w-0">
        <p className="text-white">{label}</p>
        <p className="text-xs text-muted">{hint}</p>
      </div>
      <div className="flex items-center gap-2">
        <PixelButton
          className="size-11 min-h-11 px-0"
          onClick={() => onChange(value - 1)}
          disabled={value <= STAT_MIN}
        >
          −
        </PixelButton>
        <span className="w-8 text-center text-lg tabular-nums text-white">{value}</span>
        <PixelButton className="size-11 min-h-11 px-0" onClick={() => onChange(value + 1)} disabled={remain <= 0}>
          ＋
        </PixelButton>
      </div>
    </div>
  );
}
