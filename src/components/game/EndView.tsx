import { useGame } from "@/game/store";

export function EndView({ kind }: { kind: "victory" | "defeat" }) {
  const giveUp = useGame((s) => s.giveUp);
  const floor = useGame((s) => s.floor);
  const act = useGame((s) => s.act);
  const meta = useGame((s) => s.meta);
  const win = kind === "victory";

  return (
    <section className="relative flex min-h-dvh flex-col overflow-hidden bg-ink">
      <img
        src={win ? "/art/title.jpg" : "/art/boss.jpg"}
        alt=""
        className="absolute inset-0 size-full object-cover opacity-40"
        crossOrigin="anonymous"
      />
      <div className="absolute inset-0 bg-linear-to-t from-ink via-ink/80 to-ink/40" />
      <div className="relative z-10 mt-auto flex flex-col gap-4 px-6 pb-16 sm:px-12">
        <p className="font-mono text-[11px] tracking-widest text-accent">
          {win ? "頂" : "肉体が折れた"}
        </p>
        <h2 className="font-display text-4xl text-parchment sm:text-6xl">
          {win ? "見てしまった。" : "見終えられなかった。"}
        </h2>
        <p className="max-w-md text-sm text-muted">
          {win
            ? "口は静かだ。知識は残る。もう一度登っても、かつての自分には戻れない。"
            : `尖塔が、記録を保管する。到達したのは ${act}面 ${floor}階。`}
        </p>
        <p className="font-mono text-[11px] text-muted">
          勝利 {meta.wins} · 最高階 {meta.bestFloor}
        </p>
        <button
          type="button"
          onClick={giveUp}
          className="w-fit min-h-11 rounded-[var(--radius-md)] bg-parchment px-6 py-3 font-display text-ink"
        >
          戻る
        </button>
      </div>
    </section>
  );
}
