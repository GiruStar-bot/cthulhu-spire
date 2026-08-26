import { CardView } from "@/components/game/CardView";
import { Vitals } from "@/components/game/Hud";
import { StageBack } from "@/components/game/StageBack";
import { getCard } from "@/game/cards";
import { useGame } from "@/game/store";

export function RestView() {
  const restMode = useGame((s) => s.restMode);
  const deck = useGame((s) => s.deck);
  const restHeal = useGame((s) => s.restHeal);
  const restUpgrade = useGame((s) => s.restUpgrade);
  const toast = useGame((s) => s.toast);
  const dismiss = useGame((s) => s.dismissToast);
  const set = useGame.setState;
  const upgradable = deck.filter((c) => !c.upgraded && getCard(c.defId).type !== "status");

  if (restMode === "upgrade") {
    return (
      <section className="relative min-h-dvh overflow-hidden bg-ink px-4 py-10">
        <StageBack opacity={0.22} />
        <div className="relative z-10">
        <Vitals />
        <h2 className="font-display mt-6 text-3xl text-balance text-parchment">カードを刻む</h2>
        <p className="mt-2 text-sm text-pretty text-muted">デッキの1枚を強化する。終われば次の層へ沈む。</p>
        <div className="mt-6 flex flex-wrap gap-3">
          {upgradable.map((c) => (
            <button key={c.uid} type="button" onClick={() => restUpgrade(c.uid)}>
              <CardView card={c} compact playable />
            </button>
          ))}
        </div>
        {upgradable.length === 0 ? (
          <p className="mt-6 text-sm text-muted">刻むものは残っていない。休め。</p>
        ) : null}
        <button
          type="button"
          className="mt-8 min-h-11 text-sm text-muted"
          onClick={() => set({ restMode: "choose" })}
        >
          戻る
        </button>
        </div>
      </section>
    );
  }

  return (
    <section className="relative min-h-dvh overflow-hidden bg-ink">
      <StageBack opacity={0.3} />
      <div className="relative z-10 flex min-h-dvh flex-col justify-end gap-4 px-6 py-12">
        <Vitals />
        {toast ? (
          <button
            type="button"
            onClick={dismiss}
            className="rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3 text-left text-sm text-parchment"
          >
            {toast}
          </button>
        ) : null}
        <p className="font-mono text-xs tracking-widest text-accent">乾いた窪み</p>
        <h2 className="font-display text-4xl text-balance text-parchment">休息</h2>
        <p className="max-w-md text-sm text-pretty text-muted">
          火は小さく、色が少し違う。それでも火だ。傷を癒すか、カードが自分を思い出すまで刻むか。選んだあと、次の層へ沈む。
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={restHeal}
            className="min-h-12 rounded-[var(--radius-md)] bg-parchment px-5 py-3 font-display text-ink"
          >
            眠る（回復）
          </button>
          <button
            type="button"
            onClick={() => set({ restMode: "upgrade" })}
            className="min-h-12 rounded-[var(--radius-md)] border border-border px-5 py-3 font-display text-parchment"
          >
            刻む（強化）
          </button>
        </div>
      </div>
    </section>
  );
}
