import { DeckInspect } from "@/components/game/DeckInspect";
import { Vitals } from "@/components/game/Hud";
import { StageBack } from "@/components/game/StageBack";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelWindow } from "@/components/ui/PixelWindow";
import { useGame } from "@/game/store";

export function EventView() {
  const event = useGame((s) => s.event);
  const resolve = useGame((s) => s.resolveEvent);
  const toast = useGame((s) => s.toast);
  const dismiss = useGame((s) => s.dismissToast);
  if (!event) return null;

  return (
    <section className="relative flex min-h-dvh flex-col overflow-hidden bg-ink font-pixel">
      <StageBack opacity={0.28} />

      <div className="relative z-10 shrink-0 px-6 pt-6 sm:px-10">
        <Vitals />
      </div>

      <div className="relative z-10 flex flex-1 flex-col overflow-y-auto px-6 py-8 sm:px-10">
        <div className="mx-auto my-auto flex w-full max-w-xl flex-col gap-5">
          {toast ? (
            <button
              type="button"
              onClick={dismiss}
              className="border-2 border-white bg-black px-4 py-3 text-left text-sm text-white shadow-[3px_3px_0_0_#000]"
            >
              {toast}
            </button>
          ) : null}
          <PixelWindow>
            <p className="text-xs tracking-widest text-accent">予兆</p>
            <h2 className="mt-1 text-3xl text-balance text-white sm:text-4xl">{event.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-pretty text-muted sm:text-base">{event.body}</p>
          </PixelWindow>
          <div className="flex flex-col gap-3">
            {event.choices.map((c) => (
              <PixelButton
                key={c.id}
                onClick={() => resolve(c.id)}
                className="min-h-12 w-full px-4 py-3 text-left"
              >
                <span className="block">{c.label}</span>
                <span className="mt-1 block text-xs opacity-70">{c.result}</span>
              </PixelButton>
            ))}
          </div>
        </div>
      </div>
      <DeckInspect />
    </section>
  );
}
