import { useMemo } from "react";
import { DEMO_MAX_FLOOR, layerLabel, tallyFloors } from "@/game/floors";
import {
  MAX_LOADOUT,
  STAT_MIN,
  statBase,
  statFinal,
  statSum,
  totalPoints,
  unlockedFeatures,
} from "@/game/profile";
import { RELICS, relicLabel } from "@/game/relics";
import { useGame } from "@/game/store";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelWindow } from "@/components/ui/PixelWindow";
import { asset } from "@/lib/asset";
import type { StatKey } from "@/game/types";

const STAT_UI: { key: StatKey; name: string; tag: string }[] = [
  { key: "hp", name: "体力", tag: "HP" },
  { key: "san", name: "正気", tag: "SAN" },
  { key: "intelligent", name: "知力", tag: "INT" },
  { key: "strength", name: "筋力", tag: "STR" },
  { key: "energy", name: "気力", tag: "NRG" },
];

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

  const spent = statSum(profile.stats);
  const budget = totalPoints(profile);
  const remain = Math.max(0, budget - spent);
  const features = useMemo(() => unlockedFeatures(profile.stats), [profile.stats]);
  const tally = useMemo(() => tallyFloors(runFloors), [runFloors]);
  const canStart = playerName.trim().length > 0;

  return (
    <section className="relative flex h-dvh flex-col overflow-hidden bg-ink">
      <img
        src={asset("art/pixel/bg/loadout.jpg")}
        alt=""
        className="absolute inset-0 size-full object-cover"
        crossOrigin="anonymous"
      />
      <div className="absolute inset-0 bg-ink/55" />

      <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col items-center justify-center px-3 py-4">
        <PixelWindow className="flex max-h-full min-h-0 w-full flex-col overflow-hidden p-4 sm:p-5">
          <div className="flex shrink-0 items-baseline justify-between gap-3">
            <h2 className="text-xl text-white sm:text-2xl">探索準備</h2>
            <p className="text-sm tabular-nums text-white">
              使用可能ポイント: <span className={remain > 0 ? "text-accent" : "text-white"}>{remain}</span>
              <span className="text-muted"> / 総ポイント: {budget}</span>
            </p>
          </div>
          <p className="mt-1 shrink-0 text-xs text-muted">
            最深 {profile.bestFloor ? layerLabel(profile.bestFloor) : "未潜航"} · 10層ごとに1ポイント
          </p>

          <label className="mt-4 block shrink-0">
            <span className="text-xs tracking-wider text-muted">調査員名</span>
            <input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={16}
              placeholder="名を記す"
              className="mt-1 w-full border-0 border-b-2 border-gray-200 bg-transparent px-0 py-2 font-pixel text-lg text-white outline-none"
            />
          </label>

          <ul className="mt-4 min-h-0 flex-1 space-y-1 overflow-y-auto">
            {STAT_UI.map((row) => (
              <StatRow
                key={row.key}
                name={row.name}
                tag={row.tag}
                sp={profile.stats[row.key]}
                base={statBase(row.key, profile.madness)}
                final={statFinal(row.key, profile.stats[row.key], profile.madness)}
                onMinus={() => setStat(row.key, profile.stats[row.key] - 1)}
                onPlus={() => setStat(row.key, profile.stats[row.key] + 1)}
                canMinus={profile.stats[row.key] > STAT_MIN}
                canPlus={remain > 0}
              />
            ))}
          </ul>

          {features.length > 0 ? (
            <p className="mt-2 shrink-0 truncate text-xs text-accent">解禁: {features.join(" · ")}</p>
          ) : (
            <p className="mt-2 shrink-0 text-xs text-muted">ポイントは最深到達で増える。余らせて潜航してもよい。</p>
          )}

          <div className="mt-4 flex min-h-0 shrink-0 flex-col">
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm text-white">遺物の持込</h3>
              <span className="text-xs tabular-nums text-muted">
                {profile.loadoutIds.length}/{MAX_LOADOUT}
              </span>
            </div>
            {profile.collection.length === 0 ? (
              <p className="mt-2 text-xs text-muted">まだ遺物を持っていない。</p>
            ) : (
              <ul className="mt-1 max-h-28 overflow-y-auto">
                {profile.collection.map((inst) => {
                  const on = profile.loadoutIds.includes(inst.uid);
                  const def = RELICS[inst.defId];
                  return (
                    <li key={inst.uid} className="border-b border-gray-200/30">
                      <button
                        type="button"
                        onClick={() => toggleLoadout(inst.uid)}
                        className="flex min-h-11 w-full items-center justify-between gap-3 py-1.5 text-left"
                      >
                        <span className="min-w-0 truncate text-sm text-white">{relicLabel(inst)}</span>
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
          </div>

          {runFloors.length > 0 ? (
            <p className="mt-2 shrink-0 text-xs text-muted">
              第1–{DEMO_MAX_FLOOR}層 · 守護 {tally.combat + tally.elite} · 休息 {tally.rest} · 中ボス {tally.mid}
              <span className="ml-2 tabular-nums">#{seed.toString(16)}</span>
            </p>
          ) : null}
        </PixelWindow>
      </div>

      <div className="absolute right-4 bottom-4 z-10 flex flex-col items-end gap-2">
        {toast ? <p className="text-sm text-blood">{toast}</p> : null}
        {!canStart ? <p className="text-xs text-muted">名前を入れてください。</p> : null}
        <PixelButton disabled={!canStart} onClick={startRun} className="min-h-12 px-8">
          潜航開始
        </PixelButton>
      </div>
    </section>
  );
}

function StatRow({
  name,
  tag,
  sp,
  base,
  final,
  onMinus,
  onPlus,
  canMinus,
  canPlus,
}: {
  name: string;
  tag: string;
  sp: number;
  base: number;
  final: number;
  onMinus: () => void;
  onPlus: () => void;
  canMinus: boolean;
  canPlus: boolean;
}) {
  return (
    <li className="flex items-center gap-2 border-b border-gray-200/30 py-1.5">
      <div className="min-w-0 flex-1">
        <p className="text-white">
          {name} <span className="text-xs text-muted">{tag}</span>
        </p>
        <p className="text-xs tabular-nums text-muted">
          {base} ➔ <span className="text-white">{final}</span>
        </p>
      </div>
      <span className="w-10 text-center text-sm tabular-nums text-muted">SP {sp}</span>
      <PixelButton className="size-11 min-h-11 px-0" onClick={onMinus} disabled={!canMinus}>
        −
      </PixelButton>
      <PixelButton className="size-11 min-h-11 px-0" onClick={onPlus} disabled={!canPlus}>
        ＋
      </PixelButton>
    </li>
  );
}
