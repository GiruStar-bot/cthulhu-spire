import { Vitals } from "@/components/game/Hud";
import { useGame } from "@/game/store";
import { asset } from "@/lib/asset";

export function EventView() {
  const event = useGame((s) => s.event);
  const resolve = useGame((s) => s.resolveEvent);
  const toast = useGame((s) => s.toast);
  const dismiss = useGame((s) => s.dismissToast);
  if (!event) return null;

  return (
    <section className="relative min-h-dvh overflow-hidden bg-ink">
      <img
        src={asset("art/corridor.jpg")}
        alt=""
        className="absolute inset-0 size-full object-cover opacity-25"
        crossOrigin="anonymous"
      />
      <div className="relative z-10 mx-auto flex min-h-dvh max-w-xl flex-col justify-end gap-5 px-6 py-12">
        <Vitals />
        {toast ? (
          <button
            type="button"
            onClick={dismiss}
            className="rounded-[var(--radius-md)] border border-accent/40 bg-surface px-4 py-3 text-left text-sm text-parchment"
          >
            {toast}
          </button>
        ) : null}
        <p className="font-mono text-[11px] tracking-widest text-accent">予兆</p>
        <h2 className="font-display text-3xl text-parchment sm:text-4xl">{event.title}</h2>
        <p className="text-sm leading-relaxed text-muted sm:text-base">{event.body}</p>
        <div className="flex flex-col gap-3">
          {event.choices.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => resolve(c.id)}
              className="rot-paper min-h-12 px-4 py-3 text-left font-display text-parchment hover:brightness-110"
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
