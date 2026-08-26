import type { FloorKind, FloorSpec } from "./types";
import { encounterIds } from "./combat";
import { EVENTS } from "./events";
import { pick } from "./rng";

export const DEMO_MAX_FLOOR = 100;

export function floorBand(floor: number): string {
  if (floor >= 100) return "最深";
  if (floor >= 80) return "緑の広間";
  if (floor >= 60) return "曲がる石";
  if (floor >= 40) return "ムーの残骸";
  if (floor >= 20) return "沈んだ街";
  return "礁の層";
}

export function layerLabel(floor: number): string {
  return `第${floor}層`;
}

export function floorKindLabel(type: FloorKind, floor: number): string {
  if (type === "boss") {
    if (floor >= 100) return "口そのもの";
    if (floor % 50 === 0) return "大ボス";
    return "中ボス";
  }
  if (type === "elite") return "精鋭";
  if (type === "combat") return "守護";
  if (type === "rest") return "休息";
  return "予兆";
}

function typeFor(floor: number, rand: () => number): FloorKind {
  if (floor % 10 === 0) return "boss";
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
    if (f.type === "boss") {
      if (f.floor % 50 === 0) t.boss += 1;
      else t.mid += 1;
    }
    else if (f.type === "elite") t.elite += 1;
    else if (f.type === "rest") t.rest += 1;
    else if (f.type === "event") t.event += 1;
    else t.combat += 1;
  }
  return t;
}
