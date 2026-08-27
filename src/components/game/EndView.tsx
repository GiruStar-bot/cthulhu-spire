import { useGame } from "@/game/store";
import { layerLabel } from "@/game/floors";
import { relicDesc, relicLabel } from "@/game/relics";
import { asset } from "@/lib/asset";
import { cn } from "@/lib/utils";
import type { RelicInstance } from "@/game/types";
import { useMemo, useState } from "react";

export function EndView({ kind }: { kind: "victory" | "defeat" }) {
  const giveUp = useGame((s) => s.giveUp);
  const engrave = useGame((s) => s.engraveRelic);
  const floor = useGame((s) => s.floor);
  const profile = useGame((s) => s.profile);
  const relics = useGame((s) => s.relics);
  const playerName = useGame((s) => s.playerName);
  const win = kind === "victory";
  const gained = useMemo(() => {
    const have = new Set(profile.collection.map((r) => r.uid));
    return relics.filter((r) => !have.has(r.uid));
  }, [profile.collection, relics]);

  if (!win) {
    return (
      <DefeatRelics
        name={playerName || "潜航者"}
        floor={floor}
        gained={gained}
        onEngrave={engrave}
        onSkip={giveUp}
      />
    );
  }

  return (
    <section className="relative flex min-h-dvh flex-col overflow-hidden bg-ink">
      <img
        src={asset("art/title.jpg")}
        alt=""
        className="absolute inset-0 size-full object-cover opacity-40"
        crossOrigin="anonymous"
      />
      <div className="absolute inset-0 bg-linear-to-t from-ink via-ink/80 to-ink/40" />
      <div className="relative z-10 mt-auto flex flex-col gap-4 px-6 pb-16 sm:px-12">
        <p className="font-mono text-[11px] tracking-widest text-accent">最深</p>
        <h2 className="font-display text-4xl text-parchment sm:text-6xl">見てしまった。</h2>
        <p className="max-w-md text-sm text-muted">
          {playerName || "潜航者"}の記録は残る。遺物は次の人生へ。
        </p>
        <p className="font-mono text-[11px] tabular-nums text-muted">
          最深 {profile.bestFloor ? layerLabel(profile.bestFloor) : "未潜航"} · 所持遺物 {profile.collection.length}
        </p>
        <button
          type="button"
          onClick={giveUp}
          className="w-fit min-h-11 rounded-[var(--radius-md)] bg-parchment px-6 py-3 font-display text-ink"
        >
          戻る
        </button>
      </div>
    </section>
  );
}

function DefeatRelics({
  name,
  floor,
  gained,
  onEngrave,
  onSkip,
}: {
  name: string;
  floor: number;
  gained: RelicInstance[];
  onEngrave: (uid: string) => void;
  onSkip: () => void;
}) {
  const [picked, setPicked] = useState<string | null>(gained[0]?.uid ?? null);

  return (
    <section className="relative flex h-dvh flex-col overflow-hidden bg-ink">
      <img
        src={asset("art/anubis.jpg")}
        alt=""
        className="absolute inset-0 size-full object-cover object-[center_20%]"
        crossOrigin="anonymous"
      />
      <div className="absolute inset-0 bg-linear-to-t from-ink via-ink/70 to-ink/25" />
      <div className="relative z-10 mt-auto flex flex-col gap-3 px-5 pb-8 sm:px-12 sm:pb-12">
        <p className="font-mono text-[11px] tracking-widest text-accent">旧神の灯篭</p>
        <h2 className="font-display text-4xl text-parchment sm:text-5xl">見終えられなかった。</h2>
        <p className="max-w-lg text-sm text-pretty text-muted">
          {name}は{layerLabel(floor)}で止まった。この沈降で得た遺物のうち、一つだけ魂に刻める。
        </p>
        {gained.length ? (
          <>
            <ul className="max-h-[36dvh] space-y-2 overflow-y-auto">
              {gained.map((r) => (
                <li key={r.uid}>
                  <button
                    type="button"
                    onClick={() => setPicked(r.uid)}
                    className={cn(
                      "w-full rounded-[var(--radius-md)] px-3 py-3 text-left",
                      picked === r.uid
                        ? "bg-parchment text-ink"
                        : "bg-surface text-parchment shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-parchment)_14%,transparent)]",
                    )}
                  >
                    <span className="font-display">{relicLabel(r)}</span>
                    <span className={cn("mt-1 block text-sm", picked === r.uid ? "text-ink/70" : "text-muted")}>
                      {relicDesc(r)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              disabled={!picked}
              onClick={() => picked && onEngrave(picked)}
              className="w-fit min-h-11 rounded-[var(--radius-md)] bg-parchment px-6 py-3 font-display text-ink disabled:opacity-40"
            >
              魂に刻む
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted">この沈降では、刻む遺物がなかった。</p>
            <button
              type="button"
              onClick={onSkip}
              className="w-fit min-h-11 rounded-[var(--radius-md)] bg-parchment px-6 py-3 font-display text-ink"
            >
              次の器へ
            </button>
          </>
        )}
      </div>
    </section>
  );
}
