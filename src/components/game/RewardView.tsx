import { CardView } from "@/components/game/CardView";
import { MAX_ACT } from "@/game/acts";
import { nodeById } from "@/game/map";
import { RELICS } from "@/game/relics";
import { useGame } from "@/game/store";

export function RewardView() {
  const reward = useGame((s) => s.reward);
  const pick = useGame((s) => s.pickReward);
  const skip = useGame((s) => s.skipReward);
  const act = useGame((s) => s.act);
  const map = useGame((s) => s.map);
  const currentId = useGame((s) => s.currentId);
  if (!reward) return null;
  const node = currentId ? nodeById(map, currentId) : null;
  const bossGate = node?.type === "boss";

  return (
    <section className="min-h-dvh bg-ink px-4 py-10 sm:px-10">
      <p className="font-mono text-[11px] tracking-widest text-accent">
        {bossGate ? (act >= MAX_ACT ? "頂の戦利" : "面の戦利") : "戦利"}
      </p>
      <h2 className="font-display mt-2 text-3xl text-parchment">カードを1枚取る</h2>
      {bossGate && act < MAX_ACT ? (
        <p className="mt-2 max-w-lg text-sm text-muted">
          取ったあとも、肉体とデッキはそのまま次の面へ続く。
        </p>
      ) : null}
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
