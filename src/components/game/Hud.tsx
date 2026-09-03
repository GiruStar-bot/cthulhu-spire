import { floorBand, layerLabel } from "@/game/floors";
import { GRIMOIRE_ENABLED } from "@/game/profile";
import { PixelRelic } from "@/components/loadout/PixelRelic";
import { equipmentLabel } from "@/game/equipment";
import { useGame } from "@/game/store";
import { asset } from "@/lib/asset";
import { cn } from "@/lib/utils";

export function Vitals() {
  const hp = useGame((s) => s.hp);
  const maxHp = useGame((s) => s.maxHp);
  const sanity = useGame((s) => s.sanity);
  const maxSanity = useGame((s) => s.maxSanity);
  const equipped = useGame((s) => s.profile.equipped);
  const floor = useGame((s) => s.floor);
  const madness = useGame((s) => s.profile.madness);
  const playerName = useGame((s) => s.playerName);
  const shells = useGame((s) => s.shells);
  const worn = Object.values(equipped).filter(Boolean);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="min-w-0">
        <p className="truncate font-display text-sm text-parchment">{playerName || "無名"}</p>
        <Bar label="肉体" value={hp} max={maxHp} tone="hp" />
        <Bar label="正気" value={sanity} max={maxSanity} tone="sanity" />
      </div>
      <span className="font-mono text-[10px] tracking-wider text-muted">
        {floorBand(floor)} · <span className="tabular-nums text-parchment">{layerLabel(floor)}</span>
        {GRIMOIRE_ENABLED && madness ? (
          <span className="text-blood"> · 狂気 {madness}</span>
        ) : null}
        <span className="ml-2 inline-flex items-center gap-1 text-parchment">
          <img src={asset("art/shell.jpg")} alt="" className="size-3.5 object-cover" />
          {shells}
        </span>
      </span>
      <div className="flex flex-wrap gap-1">
        {worn.map((r) =>
          r ? (
            <span
              key={r.uid}
              title={equipmentLabel(r)}
              className="inline-flex items-center gap-1 border-2 border-gray-200 bg-black px-1 py-0.5 font-pixel text-[10px] text-parchment"
            >
              <PixelRelic defId={r.defId} className="size-4" />
              {equipmentLabel(r)}
            </span>
          ) : null,
        )}
      </div>
    </div>
  );
}

export function Bar({
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
    <div className="min-w-40 flex-1">
      <div className="mb-0.5 flex justify-between font-mono text-xs tracking-wider text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-parchment">
          {value}/{max}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden border-2 border-white bg-ink-2">
        <div
          className={cn("h-full", tone === "hp" ? "bg-blood" : "bg-accent")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
