import { useMemo } from "react";
import { DEMO_MAX_FLOOR, layerLabel, tallyFloors } from "@/game/floors";
import { STAT_MIN, derivedVitals, statBase, statFinal, statSum, totalPoints, unlockedFeatures } from "@/game/profile";
import { useGame } from "@/game/store";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelWindow } from "@/components/ui/PixelWindow";
import { asset } from "@/lib/asset";
import { cn } from "@/lib/utils";
import { MIN_RUN_DECK, loadoutError } from "@/game/cardEvaluator";
import { peekRune, useCollectionStore } from "@/store/useCollectionStore";
import { computeEquipmentStats } from "@/game/equipment";
import type { StatKey } from "@/game/types";

const STAT_UI: { key: StatKey; name: string; tag: string }[] = [
  { key: "hp", name: "体力", tag: "HP" },
  { key: "san", name: "正気", tag: "SAN" },
  { key: "intelligent", name: "知力", tag: "INT" },
  { key: "strength", name: "筋力", tag: "STR" },
  { key: "energy", name: "気力", tag: "NRG" },
];

export function PrepareView({ embedded = false }: { embedded?: boolean }) {
  const profile = useGame((s) => s.profile);
  const playerName = useGame((s) => s.playerName);
  const setPlayerName = useGame((s) => s.setPlayerName);
  const setStat = useGame((s) => s.setStat);
  const startRun = useGame((s) => s.startRun);
  const toast = useGame((s) => s.toast);
  const runFloors = useGame((s) => s.runFloors);
  const seed = useGame((s) => s.seed);

  const spent = statSum(profile.stats);
  const budget = totalPoints(profile);
  const remain = Math.max(0, budget - spent);
  const features = useMemo(() => unlockedFeatures(profile.stats), [profile.stats]);
  const tally = useMemo(() => tallyFloors(runFloors), [runFloors]);
  const deckErr = loadoutError();
  const canStart = playerName.trim().length > 0 && !deckErr;

  return (
    <section className={cn("relative flex h-full flex-col overflow-hidden", embedded ? "bg-transparent" : "h-dvh bg-ink")}>
      {embedded ? null : (
        <>
          <img
            src={asset("art/pixel/bg/loadout.jpg")}
            alt=""
            className="absolute inset-0 size-full object-cover"
            crossOrigin="anonymous"
          />
          <div className="absolute inset-0 bg-ink/55" />
        </>
      )}

      <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col items-center justify-center gap-3 px-3 py-4 lg:flex-row lg:items-stretch">
        <PixelWindow className="flex max-h-full min-h-0 w-full flex-1 flex-col overflow-hidden p-4 sm:p-5">
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

          {runFloors.length > 0 ? (
            <p className="mt-2 shrink-0 text-xs text-muted">
              第1–{DEMO_MAX_FLOOR}層 · 守護 {tally.combat + tally.elite} · 休息 {tally.rest} · 中ボス {tally.mid}
              <span className="ml-2 tabular-nums">#{seed.toString(16)}</span>
            </p>
          ) : null}
        </PixelWindow>
        <EquipmentSummaryPanel />
        <DeckSelectPanel />
      </div>

      <div className="absolute right-4 bottom-4 z-10 flex flex-col items-end gap-2">
        {toast ? <p className="text-sm text-blood">{toast}</p> : null}
        {!playerName.trim() ? <p className="text-xs text-muted">名前を入れてください。</p> : null}
        {deckErr ? <p className="text-xs text-blood">{deckErr}</p> : null}
        <PixelButton disabled={!canStart} onClick={startRun} className="min-h-12 px-8">
          潜航開始
        </PixelButton>
      </div>
    </section>
  );
}

function DeckSelectPanel() {
  const decks = useCollectionStore((s) => s.decks);
  const activeDeck = useCollectionStore((s) => s.activeDeck);
  const setActiveDeck = useCollectionStore((s) => s.setActiveDeck);
  const activeCount = Object.values(decks[activeDeck] ?? {}).reduce((a, b) => a + b, 0);

  return (
    <PixelWindow className="w-full max-w-xs shrink-0">
      <p className="mb-2 text-[11px] tracking-widest text-accent">使用デッキ</p>
      <div className="flex flex-col gap-2">
        {Object.keys(decks).map((name) => {
          const count = Object.values(decks[name] ?? {}).reduce((a, b) => a + b, 0);
          return (
            <button
              key={name}
              type="button"
              onClick={() => setActiveDeck(name)}
              className={cn(
                "flex items-center justify-between border-2 px-3 py-2 text-left font-pixel text-xs",
                name === activeDeck ? "border-white bg-white text-ink" : "border-gray-200/40 text-muted",
              )}
            >
              <span>{name}</span>
              <span className="tabular-nums">{count}/20</span>
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-xs tabular-nums text-muted">
        選択中: {activeDeck}（{activeCount}/{MIN_RUN_DECK}〜20）
      </p>
    </PixelWindow>
  );
}

function EquipmentSummaryPanel() {
  const profile = useGame((s) => s.profile);
  const eq = computeEquipmentStats(profile.equipped ?? {}, peekRune);
  const vitals = derivedVitals(profile.stats, profile.madness ?? 0);

  return (
    <PixelWindow className="w-full max-w-xs shrink-0">
      <p className="mb-2 text-[11px] tracking-widest text-accent">装備込みステータス</p>
      <ul className="space-y-1 text-sm text-white">
        <li>体力 {vitals.maxHp}</li>
        <li>筋力 {eq.strength}</li>
        <li>防御 {Math.round(eq.defensePct)}%</li>
        <li>毒耐性 {Math.round(eq.poisonResistPct)}%</li>
        <li>狂気耐性 {Math.round(eq.sanResistPct)}%</li>
      </ul>
    </PixelWindow>
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
