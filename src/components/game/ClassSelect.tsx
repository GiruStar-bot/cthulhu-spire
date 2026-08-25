import { CHARACTERS } from "@/game/characters";
import { useGame } from "@/game/store";

export function ClassSelect() {
  const choose = useGame((s) => s.chooseClass);

  return (
    <section className="min-h-dvh bg-ink px-4 py-10 sm:px-10">
      <p className="font-mono text-[11px] tracking-widest text-accent">器を選ぶ</p>
      <h2 className="font-display mt-2 text-3xl text-parchment sm:text-4xl">最初に歩く者</h2>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {Object.values(CHARACTERS).map((ch) => (
          <button
            key={ch.id}
            type="button"
            onClick={() => choose(ch.id)}
            className="group overflow-hidden rounded-[var(--radius-xl)] border border-border bg-surface text-left transition-[border-color,transform] duration-(--motion-fast) hover:border-accent"
          >
            <div className="grid sm:grid-cols-[180px_1fr]">
              <img
                src={ch.art}
                alt=""
                className="h-56 w-full object-cover sm:h-full"
                crossOrigin="anonymous"
              />
              <div className="flex flex-col gap-3 p-5">
                <p className="font-mono text-[10px] tracking-wider text-accent">{ch.title}</p>
                <h3 className="font-display text-2xl text-parchment">{ch.name}</h3>
                <p className="text-sm leading-relaxed text-muted">{ch.blurb}</p>
                <p className="mt-auto font-mono text-[11px] text-muted">
                  肉体 {ch.maxHp} · 正気 {ch.maxSanity}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
