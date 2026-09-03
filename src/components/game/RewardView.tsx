import { CardView } from "@/components/game/CardView";
import { PixelRelic } from "@/components/loadout/PixelRelic";
import { PixelRune } from "@/components/loadout/PixelRune";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelWindow } from "@/components/ui/PixelWindow";
import { DEMO_MAX_FLOOR, floorKindLabel, layerLabel } from "@/game/floors";
import { relicDesc, relicLabel } from "@/game/relics";
import { useGame } from "@/game/store";

export function RewardView() {
  const reward = useGame((s) => s.reward);
  const claim = useGame((s) => s.claimReward);
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
        <h2 className="mt-2 text-3xl text-balance text-white">
          {reward.kind === "none" ? "何も見つからなかった" : "戦利品を発見"}
        </h2>
        <p className="mt-2 max-w-lg text-sm text-pretty text-muted">
          {bossGate && floor >= DEMO_MAX_FLOOR
            ? "最深の戦利。次に進むと、この沈降は終わる。"
            : bossGate && floor % 10 === 0
              ? "中ボスを越えた。次に進むと中継点で編成できる。"
              : "次の層へ沈む。"}
        </p>

        {reward.kind === "card" ? (
          <div className="mt-8 flex justify-center">
            <CardView card={reward.card} playable={false} />
          </div>
        ) : null}

        {reward.kind === "relic" ? (
          <div className="mt-5 flex items-center gap-3 border-2 border-white bg-black px-4 py-3">
            <PixelRelic defId={reward.relic.defId} className="size-12 shrink-0" />
            <div>
              <p className="text-[11px] tracking-widest text-accent">遺物</p>
              <p className="mt-1 text-xl text-white">{relicLabel(reward.relic)}</p>
              <p className="mt-1 text-sm text-muted">{relicDesc(reward.relic)}</p>
              <p className="mt-2 text-xs text-muted">得た瞬間から魂に残る。死んでも失わない。</p>
            </div>
          </div>
        ) : null}

        {reward.kind === "rune" ? (
          <div className="mt-5 flex items-center gap-3 border-2 border-white bg-black px-4 py-3">
            <PixelRune effect={reward.rune.effect} className="size-12 shrink-0" />
            <div>
              <p className="text-[11px] tracking-widest text-accent">ルーン</p>
              <p className="mt-1 text-xl text-white">
                {reward.rune.effect} {reward.rune.value}
              </p>
              <p className="mt-2 text-xs text-muted">魔改造でカードにソケットできる。</p>
            </div>
          </div>
        ) : null}

        {reward.kind === "none" ? (
          <p className="mt-8 text-center text-sm text-muted">今回は何も落ちていなかった。</p>
        ) : null}

        <PixelButton onClick={claim} className="mx-auto mt-8 block">
          次へ進む
        </PixelButton>
      </PixelWindow>
    </section>
  );
}
