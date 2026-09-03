import { Vitals } from "@/components/game/Hud";
import { StageBack } from "@/components/game/StageBack";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelWindow } from "@/components/ui/PixelWindow";
import { getCard } from "@/game/cards";
import { DEMO_MAX_FLOOR, layerLabel } from "@/game/floors";
import { useGame } from "@/game/store";

export function BetweenView() {
  const floor = useGame((s) => s.floor);
  const deck = useGame((s) => s.deck);
  const relics = useGame((s) => s.relics);
  const advance = useGame((s) => s.continueClimb);

  return (
    <section className="relative flex min-h-dvh flex-col overflow-hidden bg-ink font-pixel">
      <StageBack opacity={0.32} />
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative z-10 mt-auto flex flex-col gap-5 px-6 pb-16 sm:px-12">
        <PixelWindow className="max-w-lg">
          <p className="text-[11px] tracking-widest text-accent">{layerLabel(floor)}まで沈んだ</p>
          <h2 className="mt-1 text-4xl text-white sm:text-5xl">都市は、まだ沈む</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            大ボスは倒した。肉体もデッキも遺物も、削れたまま連れていく。デモは第{DEMO_MAX_FLOOR}
            層まで。次の一歩で、ただちに次の層へ沈む。
          </p>
        </PixelWindow>
        <Vitals />
        <p className="text-[11px] text-muted">
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
        <PixelButton onClick={advance} className="w-fit px-6">
          {layerLabel(floor + 1)}へ沈む
        </PixelButton>
      </div>
    </section>
  );
}
