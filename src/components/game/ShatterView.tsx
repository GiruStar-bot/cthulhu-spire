import { useGame } from "@/game/store";

export function ShatterView() {
  const accept = useGame((s) => s.acceptShatter);
  return (
    <section className="flex h-dvh flex-col justify-end bg-ink px-8 pb-16 sm:px-16">
      <p className="font-mono text-[11px] tracking-widest text-blood">器が砕ける</p>
      <h2 className="font-display mt-3 text-4xl text-parchment sm:text-6xl">記録は、無い。</h2>
      <p className="mt-4 max-w-md text-sm text-muted">
        正気が0になった。名も遺物も灯火も、狂気の理解も、すべて沈んだ。次の器は、白紙から始める。
      </p>
      <button
        type="button"
        onClick={accept}
        className="mt-8 w-fit min-h-11 rounded-[var(--radius-md)] bg-parchment px-6 py-3 font-display text-ink"
      >
        無へ戻る
      </button>
    </section>
  );
}
