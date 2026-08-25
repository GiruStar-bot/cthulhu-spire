import type { MapNode, NodeType } from "./types";
import { uid } from "./rng";

const ROWS = 9;

export function generateMap(rand: () => number): MapNode[] {
  const nodes: MapNode[] = [];
  const start: MapNode = { id: uid("n"), row: 0, col: 1, type: "start", next: [] };
  nodes.push(start);

  const rows: MapNode[][] = [[start]];

  for (let r = 1; r < ROWS; r++) {
    const typeFor = (c: number): NodeType => {
      if (r === ROWS - 1) return "boss";
      if (r === 4) return "elite";
      if (r === 3 || r === 7) return c === 1 ? "rest" : "event";
      if (r === 6) return rand() < 0.45 ? "event" : "combat";
      return rand() < 0.18 ? "event" : "combat";
    };

    const cols = r === ROWS - 1 ? [1] : r % 2 === 0 ? [0, 1, 2] : [0, 2];
    const row: MapNode[] = cols.map((col) => ({
      id: uid("n"),
      row: r,
      col,
      type: typeFor(col),
      next: [],
    }));
    rows.push(row);
    nodes.push(...row);
  }

  for (let r = 0; r < ROWS - 1; r++) {
    const cur = rows[r]!;
    const nxt = rows[r + 1]!;
    for (const n of cur) {
      const sorted = nxt.slice().sort((a, b) => Math.abs(a.col - n.col) - Math.abs(b.col - n.col));
      n.next.push(sorted[0]!.id);
      if (sorted[1] && rand() < 0.7) n.next.push(sorted[1].id);
    }
    // ensure every next node is reachable
    for (const m of nxt) {
      const hasIn = cur.some((n) => n.next.includes(m.id));
      if (!hasIn) cur[0]!.next.push(m.id);
    }
  }

  return nodes;
}

export function nodeById(nodes: MapNode[], id: string) {
  return nodes.find((n) => n.id === id);
}
