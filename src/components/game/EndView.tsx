import { useGame } from "@/game/store";
import { layerLabel } from "@/game/floors";
import { PixelRelic } from "@/components/loadout/PixelRelic";
import { relicDesc, relicLabel } from "@/game/relics";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelWindow } from "@/components/ui/PixelWindow";
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
      <DeathScreen
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
        src={asset("art/pixel/bg/title.jpg")}
        alt=""
        className="absolute inset-0 size-full object-cover"
        crossOrigin="anonymous"
      />
      <div className="absolute inset-0 bg-ink/55" />
      <div className="relative z-10 mt-auto flex flex-col items-start gap-4 px-6 pb-16 sm:px-12">
        <p className="font-pixel text-xs tracking-widest text-muted">最深</p>
        <h2 className="font-pixel text-4xl text-white sm:text-6xl">見てしまった。</h2>
        <p className="max-w-md text-sm text-muted">{playerName || "潜航者"}の記録は残る。遺物は次の人生へ。</p>
        <p className="font-pixel text-xs tabular-nums text-muted">
          最深 {profile.bestFloor ? layerLabel(profile.bestFloor) : "未潜航"} · 所持遺物 {profile.collection.length}
        </p>
        <PixelButton onClick={giveUp} className="px-6">
          タイトルへ戻る
        </PixelButton>
      </div>
    </section>
  );
}

function DeathScreen({
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
        src={asset("art/pixel/bg/death.jpg")}
        alt=""
        className="absolute inset-0 size-full object-cover"
        crossOrigin="anonymous"
      />
      <div className="absolute inset-0 bg-ink/45" />
      <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col items-center justify-center gap-5 px-4 py-6 text-center">
        <div>
          <p className="font-pixel text-xs tracking-widest text-blood">器が砕ける</p>
          <h2 className="font-pixel mt-2 text-5xl tracking-widest text-white sm:text-6xl">死亡</h2>
          <p className="mt-3 max-w-md text-sm text-pretty text-muted">
            {name}は{layerLabel(floor)}で止まった。この沈降で得た遺物のうち、一つだけ魂に刻める。
          </p>
        </div>

        <PixelWindow className="flex max-h-[42dvh] w-full flex-col overflow-hidden p-4 text-left">
          <p className="shrink-0 text-xs tracking-widest text-muted">今世の遺物</p>
          {gained.length ? (
            <>
              <ul className="mt-2 min-h-0 flex-1 space-y-2 overflow-y-auto">
                {gained.map((r) => (
                  <li key={r.uid}>
                    <button
                      type="button"
                      onClick={() => setPicked(r.uid)}
                      className={cn(
                        "min-h-11 w-full border-2 px-3 py-3 text-left font-pixel",
                        picked === r.uid
                          ? "border-white bg-white text-black"
                          : "border-gray-200 bg-transparent text-white",
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <PixelRelic defId={r.defId} className="size-8 shrink-0" />
                        <span className="block">{relicLabel(r)}</span>
                      </span>
                      <span className={cn("mt-1 block text-sm", picked === r.uid ? "text-black/70" : "text-muted")}>
                        {relicDesc(r)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <PixelButton
                disabled={!picked}
                onClick={() => picked && onEngrave(picked)}
                className="mt-3 w-full"
              >
                魂に刻む
              </PixelButton>
            </>
          ) : (
            <p className="mt-3 text-sm text-muted">この沈降では、刻む遺物がなかった。</p>
          )}
        </PixelWindow>

        <PixelButton onClick={onSkip} className="px-8">
          タイトルへ戻る
        </PixelButton>
      </div>
    </section>
  );
}
