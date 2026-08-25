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
    <section className="relative flex min-h-dvh flex-col overflow-hidden bg-ink">
      <img
        src={asset("art/corridor.jpg")}
        alt=""
        className="absolute inset-0 size-full object-cover opacity-25"
        crossOrigin="anonymous"
      />
      <div className="absolute inset-0 bg-linear-to-b from-ink/60 via-ink/35 to-ink/80" />

      <div className="relative z-10 shrink-0 px-6 pt-6 sm:px-10">
        <Vitals />
      </div>

      <div className="relative z-10 flex flex-1 flex-col overflow-y-auto px-6 py-8 sm:px-10">
        <div className="mx-auto my-auto flex w-full max-w-xl flex-col gap-5">
          {toast ? (
            <button
              type="button"
              onClick={dismiss}
              className="rounded-[var(--radius-md)] bg-surface px-4 py-3 text-left text-sm text-parchment shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-accent)_40%,transparent)]"
            >
              {toast}
            </button>
          ) : null}
          <p className="font-mono text-xs tracking-widest text-accent">予兆</p>
          <h2 className="font-display text-3xl text-balance text-parchment sm:text-4xl">{event.title}</h2>
          <p className="text-sm leading-relaxed text-pretty text-muted sm:text-base">{event.body}</p>
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
      </div>
    </section>
  );
}
