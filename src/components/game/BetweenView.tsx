import { Vitals } from "@/components/game/Hud";
import { asset } from "@/lib/asset";
import { DEMO_MAX_FLOOR, layerLabel } from "@/game/floors";
import { getCard } from "@/game/cards";
import { useGame } from "@/game/store";

export function BetweenView() {
  const floor = useGame((s) => s.floor);
  const deck = useGame((s) => s.deck);
  const relics = useGame((s) => s.relics);
  const advance = useGame((s) => s.continueClimb);

  return (
    <section className="relative flex min-h-dvh flex-col overflow-hidden bg-ink">
      <img
        src={asset("art/corridor.jpg")}
        alt=""
        className="absolute inset-0 size-full object-cover opacity-30"
        crossOrigin="anonymous"
      />
      <div className="absolute inset-0 bg-linear-to-t from-ink via-ink/75 to-ink/40" />
      <div className="relative z-10 mt-auto flex flex-col gap-5 px-6 pb-16 sm:px-12">
        <p className="font-mono text-[11px] tracking-widest text-accent">{layerLabel(floor)}まで沈んだ</p>
        <h2 className="font-display text-4xl text-parchment sm:text-5xl">都市は、まだ沈む</h2>
        <p className="max-w-md text-sm leading-relaxed text-muted">
          大ボスは倒した。肉体もデッキも遺物も、削れたまま連れていく。デモは第{DEMO_MAX_FLOOR}
          層まで。次の一歩で、ただちに次の層へ沈む。
        </p>
        <Vitals />
        <p className="font-mono text-[11px] text-muted">
          デッキ {deck.length}枚
          {relics.length ? ` · 遺物 ${relics.length}` : ""} · 強化 {deck.filter((c) => c.upgraded).length}
        </p>
        <ul className="max-w-md text-xs leading-relaxed text-muted">
          {deck.slice(0, 12).map((c) => (
            <li key={c.uid} className="inline">
              {getCard(c.defId).name}
              {c.upgraded ? "+" : ""}
              {"  "}
            </li>
          ))}
          {deck.length > 12 ? <li className="inline">…</li> : null}
        </ul>
        <button
          type="button"
          onClick={advance}
          className="w-fit min-h-11 rounded-[var(--radius-md)] bg-parchment px-6 py-3 font-display text-ink"
        >
          {layerLabel(floor + 1)}へ沈む
        </button>
      </div>
    </section>
  );
}
