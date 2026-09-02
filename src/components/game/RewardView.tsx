import { CardView } from "@/components/game/CardView";
import { DeckInspect } from "@/components/game/DeckInspect";
import { PixelRelic } from "@/components/loadout/PixelRelic";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelWindow } from "@/components/ui/PixelWindow";
import { DEMO_MAX_FLOOR, floorKindLabel, layerLabel } from "@/game/floors";
import { relicDesc, relicLabel } from "@/game/relics";
import { useGame } from "@/game/store";

export function RewardView() {
  const reward = useGame((s) => s.reward);
  const pick = useGame((s) => s.pickReward);
  const skip = useGame((s) => s.skipReward);
  const floor = useGame((s) => s.floor);
  const runFloors = useGame((s) => s.runFloors);
  if (!reward) return null;
  const spec = runFloors[floor - 1];
  const bossGate = spec?.type === "boss";

  return (
    <section className="relative min-h-dvh overflow-hidden bg-ink px-4 py-10 font-pixel sm:px-10">
      <PixelWindow className="mx-auto max-w-3xl px-5 py-8 sm:px-10">
        <p className="text-xs tracking-widest text-accent">
          {layerLabel(floor)} · {spec ? floorKindLabel(spec.type, floor) : "戦利"}
        </p>
        <h2 className="mt-2 text-3xl text-balance text-white">カードを1枚取る</h2>
        <p className="mt-2 max-w-lg text-sm text-pretty text-muted">
          {bossGate && floor >= DEMO_MAX_FLOOR
            ? "最深の戦利。取ったあと、この沈降は終わる。"
            : bossGate && floor === 50
              ? "大ボスを沈めた。取ったあと、都市はさらに沈む。"
              : "取ったカードは戦利品になる。次の層へ沈む。"}
        </p>
        {reward.relic ? (
          <div className="mt-5 flex items-center gap-3 border-2 border-white bg-black px-4 py-3">
            <PixelRelic defId={reward.relic.defId} className="size-12 shrink-0" />
            <div>
              <p className="text-[11px] tracking-widest text-accent">遺物</p>
              <p className="mt-1 text-xl text-white">{relicLabel(reward.relic)}</p>
              <p className="mt-1 text-sm text-muted">{relicDesc(reward.relic)}</p>
              <p className="mt-2 text-xs text-muted">この沈降のあいだ持つ。死んだとき、一つだけ魂に刻める。</p>
            </div>
          </div>
        ) : null}
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          {reward.cards.map((c) => (
            <button key={c.uid} type="button" onClick={() => pick(c)} className="bg-transparent">
              <CardView card={c} playable />
            </button>
          ))}
        </div>
        <PixelButton onClick={skip} className="mx-auto mt-8 block">
          スキップして次の層へ
        </PixelButton>
      </PixelWindow>
      <DeckInspect />
    </section>
  );
}
