import { useGame } from "@/game/store";
import { layerLabel } from "@/game/floors";
import { asset } from "@/lib/asset";

export function EndView({ kind }: { kind: "victory" | "defeat" }) {
  const giveUp = useGame((s) => s.giveUp);
  const floor = useGame((s) => s.floor);
  const profile = useGame((s) => s.profile);
  const playerName = useGame((s) => s.playerName);
  const win = kind === "victory";

  return (
    <section className="relative flex min-h-dvh flex-col overflow-hidden bg-ink">
      <img
        src={asset(win ? "art/title.jpg" : "art/boss.jpg")}
        alt=""
        className="absolute inset-0 size-full object-cover opacity-40"
        crossOrigin="anonymous"
      />
      <div className="absolute inset-0 bg-linear-to-t from-ink via-ink/80 to-ink/40" />
      <div className="relative z-10 mt-auto flex flex-col gap-4 px-6 pb-16 sm:px-12">
        <p className="font-mono text-[11px] tracking-widest text-accent">{win ? "最深" : "肉体が折れた"}</p>
        <h2 className="font-display text-4xl text-parchment sm:text-6xl">
          {win ? "見てしまった。" : "見終えられなかった。"}
        </h2>
        <p className="max-w-md text-sm text-muted">
          {win
            ? `${playerName || "潜航者"}の記録は残る。遺物は次の人生へ。`
            : `${playerName || "潜航者"}は ${layerLabel(floor)}で止まった。名と遺物だけが都市の外に残る。`}
        </p>
        <p className="font-mono text-[11px] tabular-nums text-muted">
          最深 {profile.bestFloor ? layerLabel(profile.bestFloor) : "未潜航"} · 所持遺物 {profile.collection.length}
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
