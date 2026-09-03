import type {
  EquipmentDef,
  EquipmentInstance,
  EquipmentSlot,
  EquipmentStats,
  Rune,
} from "./types";

export const EQUIPMENT: Record<string, EquipmentDef> = {
  // Step 1: empty catalog. Real items land in the next equipment pass.
};

export function getEquipment(id: string): EquipmentDef {
  const d = EQUIPMENT[id];
  if (!d) throw new Error(`unknown equipment: ${id}`);
  return d;
}

function round(n: number): number {
  return Math.round(n);
}

export function computeEquipmentStats(
  equipped: Partial<Record<EquipmentSlot, EquipmentInstance>>,
  peekRune: (id: string) => Rune | undefined,
): EquipmentStats {
  const stats: EquipmentStats = {
    defensePct: 0,
    sanResistPct: 0,
    poisonResistPct: 0,
    strength: 0,
    drawBonus: 0,
    healPerTurn: 0,
  };

  for (const inst of Object.values(equipped)) {
    if (!inst) continue;
    const def = EQUIPMENT[inst.defId];
    if (!def) continue;

    stats.defensePct += def.baseDefensePct ?? 0;
    stats.sanResistPct += def.baseSanResistPct ?? 0;
    stats.poisonResistPct += def.basePoisonResistPct ?? 0;
    stats.strength += def.baseStrength ?? 0;
    stats.drawBonus += def.baseDraw ?? 0;
    stats.healPerTurn += def.baseHeal ?? 0;

    for (const runeId of inst.socketedRunes) {
      if (!runeId) continue;
      const rune = peekRune(runeId);
      if (!rune) continue;
      switch (rune.effect) {
        case "BLK+":
          stats.defensePct += rune.value;
          break;
        case "SAN+":
          stats.sanResistPct += rune.value;
          break;
        case "POISON":
          stats.poisonResistPct += rune.value;
          break;
        case "STR+":
          stats.strength += rune.value;
          break;
        case "DRAW":
          stats.drawBonus += rune.value;
          break;
        case "HEAL":
          stats.healPerTurn += rune.value;
          break;
        default:
          break;
      }
    }
  }

  return stats;
}

export function applyDefensePct(damage: number, defensePct: number): number {
  if (damage <= 0) return damage;
  const reduced = damage * (1 - Math.min(defensePct, 100) / 100);
  return Math.max(0, round(reduced));
}
