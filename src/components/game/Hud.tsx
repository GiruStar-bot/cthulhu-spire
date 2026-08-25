import { CHARACTERS } from "@/game/characters";
import { ACT_SHORT } from "@/game/acts";
import { RELICS } from "@/game/relics";
import { useGame } from "@/game/store";
import { cn } from "@/lib/utils";

export function Vitals() {
  const hp = useGame((s) => s.hp);
  const maxHp = useGame((s) => s.maxHp);
  const sanity = useGame((s) => s.sanity);
  const maxSanity = useGame((s) => s.maxSanity);
  const character = useGame((s) => s.character);
  const relics = useGame((s) => s.relics);
  const floor = useGame((s) => s.floor);
  const act = useGame((s) => s.act);
  const ch = character ? CHARACTERS[character] : null;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {ch ? (
        <img
          src={ch.art}
          alt=""
          className="size-11 rounded-[var(--radius-sm)] object-cover border border-border"
          crossOrigin="anonymous"
        />
      ) : null}
      <Bar label="肉体" value={hp} max={maxHp} tone="hp" />
      <Bar label="正気" value={sanity} max={maxSanity} tone="sanity" />
      <span className="font-mono text-[10px] tracking-wider text-muted">
        {ACT_SHORT[act]} 階 {floor}
      </span>
      <div className="flex flex-wrap gap-1">
        {relics.map((id) => (
          <span
            key={id}
            title={RELICS[id]?.text}
            className="rounded-full border border-border bg-surface px-2 py-1 font-mono text-[10px] text-parchment"
          >
            {RELICS[id]?.name}
          </span>
        ))}
      </div>
    </div>
  );
}

function Bar({
  label,
  value,
  max,
  tone,
}: {
  label: string;
  value: number;
  max: number;
  tone: "hp" | "sanity";
}) {
  const pct = max <= 0 ? 0 : Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="min-w-28 flex-1">
      <div className="mb-0.5 flex justify-between font-mono text-[10px] tracking-wider text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-parchment">
          {value}/{max}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-ink-2">
        <div
          className={cn("h-full rounded-full", tone === "hp" ? "bg-blood" : "bg-accent")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
