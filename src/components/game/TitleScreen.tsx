import { useGame } from "@/game/store";
import { asset } from "@/lib/asset";

export function TitleScreen() {
  const begin = useGame((s) => s.begin);
  const meta = useGame((s) => s.meta);

  return (
    <section className="relative flex min-h-dvh flex-col overflow-hidden">
      <img
        src={asset("art/title.jpg")}
        alt=""
        className="absolute inset-0 size-full object-cover"
        crossOrigin="anonymous"
      />
      <div className="absolute inset-0 bg-linear-to-t from-ink via-ink/70 to-ink/30" />
      <div className="relative z-10 mt-auto flex flex-col gap-6 px-6 pb-16 sm:px-12">
        <p className="font-mono text-[11px] tracking-widest text-accent">デモ登攀</p>
        <h1 className="font-display max-w-xl text-5xl leading-[1.05] text-parchment sm:text-7xl">
          クトゥルスパイア
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-muted sm:text-base">
          在ってはならない塔へ、儀式のデッキを携えて登る。一面を越えても肉体もカードも引き継がれる。エネルギーを使い、ブロックを積み、正気を貨幣にする。頂は、優しくない。
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={begin}
            className="min-h-11 rounded-[var(--radius-md)] bg-parchment px-6 py-3 font-display text-base text-ink transition-transform duration-(--motion-fast) hover:scale-[1.02] active:scale-[0.98]"
          >
            登攀を始める
          </button>
          <p className="font-mono text-[11px] tracking-wider text-muted">
            回数 {meta.runs} · 勝利 {meta.wins} · 最高階 {meta.bestFloor}
          </p>
        </div>
      </div>
    </section>
  );
}
