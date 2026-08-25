import { useGame } from "@/game/store";

export function EventView() {
  const event = useGame((s) => s.event);
  const resolve = useGame((s) => s.resolveEvent);
  if (!event) return null;

  return (
    <section className="relative min-h-dvh overflow-hidden bg-ink">
      <img
        src="/art/corridor.jpg"
        alt=""
        className="absolute inset-0 size-full object-cover opacity-25"
        crossOrigin="anonymous"
      />
      <div className="relative z-10 mx-auto flex min-h-dvh max-w-xl flex-col justify-end gap-5 px-6 py-12">
        <p className="font-mono text-[11px] tracking-widest text-accent">予兆</p>
        <h2 className="font-display text-3xl text-parchment sm:text-4xl">{event.title}</h2>
        <p className="text-sm leading-relaxed text-muted sm:text-base">{event.body}</p>
        <div className="flex flex-col gap-3">
          {event.choices.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => resolve(c.id)}
              className="min-h-12 rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3 text-left font-display text-parchment hover:border-accent"
            >
              {c.label}
              <span className="mt-1 block font-sans text-xs font-normal text-muted">{c.result}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
