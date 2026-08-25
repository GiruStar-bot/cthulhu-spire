import { CardView } from "@/components/game/CardView";
import { RELICS } from "@/game/relics";
import { useGame } from "@/game/store";

export function RewardView() {
  const reward = useGame((s) => s.reward);
  const pick = useGame((s) => s.pickReward);
  const skip = useGame((s) => s.skipReward);
  if (!reward) return null;

  return (
    <section className="min-h-dvh bg-ink px-4 py-10 sm:px-10">
      <p className="font-mono text-[11px] tracking-widest text-accent">戦利</p>
      <h2 className="font-display mt-2 text-3xl text-parchment">カードを1枚取る</h2>
      {reward.relic ? (
        <p className="mt-3 max-w-lg text-sm text-muted">
          遺物を得た：<span className="text-parchment">{RELICS[reward.relic]?.name}</span> —{" "}
          {RELICS[reward.relic]?.text}
        </p>
      ) : null}
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        {reward.cards.map((c) => (
          <button key={c.uid} type="button" onClick={() => pick(c)} className="rounded-[var(--radius-lg)]">
            <CardView card={c} playable />
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={skip}
        className="mx-auto mt-8 block min-h-11 text-sm text-muted underline-offset-4 hover:text-parchment hover:underline"
      >
        スキップ
      </button>
    </section>
  );
}
