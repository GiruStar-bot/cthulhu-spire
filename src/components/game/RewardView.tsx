import { CardView } from "@/components/game/CardView";
import { DEMO_MAX_FLOOR, floorKindLabel } from "@/game/floors";
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
    <section className="min-h-dvh bg-ink px-4 py-10 sm:px-10">
      <p className="font-mono text-[11px] tracking-widest text-accent">
        {floor}階 · {spec ? floorKindLabel(spec.type, floor) : "戦利"}
      </p>
      <h2 className="font-display mt-2 text-3xl text-parchment">カードを1枚取る</h2>
      <p className="mt-2 max-w-lg text-sm text-muted">
        {bossGate && floor >= DEMO_MAX_FLOOR
          ? "頂の戦利。取ったあと、この登攀は終わる。"
          : bossGate && floor === 50
            ? "大ボスを踏破した。取ったあと、塔はさらに続く。"
            : "取った瞬間、次の階へ落ちる。"}
      </p>
      {reward.relic ? (
        <p className="mt-3 max-w-lg text-sm text-muted">
          遺物を記録する：
          <span className="text-parchment"> {relicLabel(reward.relic)}</span> — {relicDesc(reward.relic)}
          <span className="mt-1 block font-mono text-[10px] text-accent">永久コレクションに追加。持込は最大6。</span>
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
        スキップして次の階へ
      </button>
    </section>
  );
}
