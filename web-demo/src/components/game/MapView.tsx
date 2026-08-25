import { Vitals } from "@/components/game/Hud";
import type { MapNode, NodeType } from "@/game/types";
import { useGame } from "@/game/store";
import { cn } from "@/lib/utils";

const LABEL: Record<NodeType, string> = {
  start: "閾",
  combat: "守護",
  elite: "精鋭",
  rest: "休息",
  event: "予兆",
  boss: "口",
};

export function MapView() {
  const map = useGame((s) => s.map);
  const currentId = useGame((s) => s.currentId);
  const visited = useGame((s) => s.visited);
  const pickNode = useGame((s) => s.pickNode);
  const giveUp = useGame((s) => s.giveUp);
  const toast = useGame((s) => s.toast);
  const dismiss = useGame((s) => s.dismissToast);
  const current = map.find((n) => n.id === currentId);
  const available = new Set(current?.next ?? []);

  const rows = 9;
  const grouped: MapNode[][] = Array.from({ length: rows }, (_, r) =>
    map.filter((n) => n.row === r),
  );

  return (
    <section className="relative min-h-dvh overflow-hidden bg-ink">
      <img
        src="/art/corridor.jpg"
        alt=""
        className="pointer-events-none absolute inset-0 size-full object-cover opacity-25"
        crossOrigin="anonymous"
      />
      <div className="relative z-10 flex min-h-dvh flex-col gap-4 px-4 py-5 sm:px-8">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] tracking-widest text-accent">尖塔</p>
            <h2 className="font-display text-2xl text-parchment">道を選ぶ</h2>
          </div>
          <button
            type="button"
            onClick={giveUp}
            className="min-h-11 rounded-[var(--radius-md)] border border-border px-4 text-sm text-muted"
          >
            放棄
          </button>
        </header>
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
        <div className="flex flex-1 flex-col-reverse justify-start gap-6 overflow-auto py-4">
          {grouped.map((row, r) => (
            <div key={r} className="grid grid-cols-3 justify-items-center gap-2">
              {[0, 1, 2].map((col) => {
                const n = row.find((x) => x.col === col);
                if (!n) return <div key={col} />;
                const isHere = n.id === currentId;
                const can = available.has(n.id);
                const seen = visited.includes(n.id);
                return (
                  <button
                    key={n.id}
                    type="button"
                    disabled={!can}
                    onClick={() => pickNode(n.id)}
                    className={cn(
                      "min-h-14 w-full max-w-36 rounded-[var(--radius-md)] border px-2 py-3 font-display text-sm transition-colors duration-(--motion-fast)",
                      isHere && "border-accent bg-accent text-ink",
                      can && !isHere && "border-parchment/40 bg-surface text-parchment",
                      !can && seen && "border-border bg-ink-2 text-muted",
                      !can && !seen && "border-border/50 text-muted/50",
                    )}
                  >
                    {LABEL[n.type]}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <p className="font-mono text-[10px] tracking-wider text-muted">
          いまいる地点からのみ、次の道が開く。目指すは「口」。
        </p>
      </div>
    </section>
  );
}
