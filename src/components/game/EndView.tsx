import { useGame } from "@/game/store";
import { layerLabel } from "@/game/floors";
import { riteGain } from "@/game/profile";
import { asset } from "@/lib/asset";
import { cn } from "@/lib/utils";
import type { PlayerStats } from "@/game/types";

export function EndView({ kind }: { kind: "victory" | "defeat" }) {
  const giveUp = useGame((s) => s.giveUp);
  const spendRite = useGame((s) => s.spendRite);
  const floor = useGame((s) => s.floor);
  const profile = useGame((s) => s.profile);
  const playerName = useGame((s) => s.playerName);
  const win = kind === "victory";

  if (!win) {
    const gain = riteGain(floor);
    const unspent = profile.unspentPoints | 0;
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
            {playerName || "潜航者"}は{layerLabel(floor)}で止まった。アヌビスは片手の灯を掲げる。十層ごとに灯火が一つ、次の器へ移る。
          </p>
          <p className="font-mono text-[11px] tabular-nums text-accent">
            今回の灯火 +{gain}
            {unspent !== gain ? ` · 所持 ${unspent}` : ""}
          </p>
          <div className="rot-paper max-w-md px-4 py-3">
            <p className="font-mono text-[11px] tracking-wider text-muted">灯火を器へ</p>
            <RiteRow label="肉体" hint="最大体力" statKey="body" value={profile.stats.body} unspent={unspent} onSpend={spendRite} />
            <RiteRow label="知識" hint="最大正気" statKey="mind" value={profile.stats.mind} unspent={unspent} onSpend={spendRite} />
            <RiteRow label="意志" hint="遺物適性" statKey="will" value={profile.stats.will} unspent={unspent} onSpend={spendRite} />
            <p className="mt-2 font-mono text-xs tabular-nums text-accent">残り {unspent}</p>
          </div>
          <button
            type="button"
            onClick={giveUp}
            className="w-fit min-h-11 rounded-[var(--radius-md)] bg-parchment px-6 py-3 font-display text-ink"
          >
            次の器へ
          </button>
        </div>
      </section>
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

function RiteRow({
  label,
  hint,
  statKey,
  value,
  unspent,
  onSpend,
}: {
  label: string;
  hint: string;
  statKey: keyof PlayerStats;
  value: number;
  unspent: number;
  onSpend: (key: keyof PlayerStats) => void;
}) {
  return (
    <div className="journal-rule flex items-center justify-between gap-3 py-1.5">
      <div className="min-w-0">
        <p className="font-display text-parchment">{label}</p>
        <p className="font-mono text-[10px] text-muted">{hint}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-8 text-center font-mono text-lg tabular-nums text-parchment">{value}</span>
        <button
          type="button"
          className={cn("size-11 text-parchment hover:text-accent", unspent <= 0 && "opacity-30")}
          onClick={() => onSpend(statKey)}
          disabled={unspent <= 0 || value >= 99}
          aria-label={`${label}に灯火`}
        >
          ＋
        </button>
      </div>
    </div>
  );
}
