import { biomeArt, biomeForEncounter, biomeForFloor } from "@/game/biomes";
import { useGame } from "@/game/store";

export function StageBack({ opacity = 1 }: { opacity?: number }) {
  const floor = useGame((s) => s.floor);
  const combat = useGame((s) => s.combat);
  const biome = combat
    ? biomeForEncounter(combat.enemies.map((e) => e.defId), floor)
    : biomeForFloor(Math.max(1, floor));
  return (
    <>
      <img
        src={biomeArt(biome)}
        alt=""
        className="pointer-events-none absolute inset-0 z-0 size-full object-cover"
        style={{ opacity }}
        crossOrigin="anonymous"
      />
      <div className="pointer-events-none absolute inset-0 z-0 bg-ink/25" />
    </>
  );
}