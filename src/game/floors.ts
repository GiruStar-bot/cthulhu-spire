import type { FloorKind, FloorSpec } from "./types";
import { encounterIds } from "./combat";
import { EVENTS } from "./events";
import { pick } from "./rng";

export const DEMO_MAX_FLOOR = 100;

export function floorBand(floor: number): string {
  if (floor >= 100) return "頂";
  if (floor >= 67) return "口へ";
  if (floor >= 34) return "曲がる階";
  return "塩の回廊";
}

export function floorKindLabel(type: FloorKind, floor: number): string {
  if (type === "boss") return floor >= 100 ? "口そのもの" : "大ボス";
  if (type === "elite" && floor % 10 === 0) return "中ボス";
  if (type === "elite") return "精鋭";
  if (type === "combat") return "守護";
  if (type === "rest") return "休息";
  return "予兆";
}

function typeFor(floor: number, rand: () => number): FloorKind {
  if (floor === 50 || floor === 100) return "boss";
  if (floor % 10 === 0) return "elite";
  if (floor % 10 === 5) return "rest";
  if (floor === 1) return rand() < 0.82 ? "combat" : "event";
  const r = rand();
  if (r < 0.2) return "event";
  if (r < 0.26) return "elite";
  return "combat";
}

export function generateRunTable(rand: () => number, max = DEMO_MAX_FLOOR): FloorSpec[] {
  const out: FloorSpec[] = [];
  for (let floor = 1; floor <= max; floor++) {
    const type = typeFor(floor, rand);
    const spec: FloorSpec = { floor, type };
    if (type === "event") spec.eventId = pick(EVENTS, rand).id;
    else if (type !== "rest") spec.enemyIds = encounterIds(type, floor, rand);
    out.push(spec);
  }
  return out;
}

export function tallyFloors(floors: FloorSpec[]) {
  const t = { combat: 0, event: 0, rest: 0, elite: 0, mid: 0, boss: 0 };
  for (const f of floors) {
    if (f.type === "boss") t.boss += 1;
    else if (f.type === "elite" && f.floor % 10 === 0) t.mid += 1;
    else if (f.type === "elite") t.elite += 1;
    else if (f.type === "rest") t.rest += 1;
    else if (f.type === "event") t.event += 1;
    else t.combat += 1;
  }
  return t;
}
