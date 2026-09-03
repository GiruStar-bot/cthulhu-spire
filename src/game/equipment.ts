import { asset } from "@/lib/asset";
import { uid } from "./rng";
import type {
  Archetype,
  EquipmentDef,
  EquipmentInstance,
  EquipmentSlot,
  EquipmentStats,
  Rune,
} from "./types";

export function tierFromFloor(floor: number): number {
  return Math.max(1, Math.floor(floor / 10) + 1);
}

export const EQUIPMENT: Record<string, EquipmentDef> = {
  ragged_hood: {
    id: "ragged_hood",
    name: "襤褸の頭巾",
    slot: "head",
    archetype: "generic",
    art: asset("art/pixel/cards/ward.jpg"),
    sockets: 1,
    baseDefensePct: 3,
  },
  worn_coat: {
    id: "worn_coat",
    name: "着古した外套",
    slot: "chest",
    archetype: "generic",
    art: asset("art/pixel/cards/ward.jpg"),
    sockets: 2,
    baseDefensePct: 5,
  },
  bandaged_arms: {
    id: "bandaged_arms",
    name: "包帯の腕",
    slot: "arms",
    archetype: "generic",
    art: asset("art/pixel/cards/ward.jpg"),
    sockets: 1,
    baseStrength: 1,
  },
  patched_legs: {
    id: "patched_legs",
    name: "継ぎ接ぎの脚衣",
    slot: "legs",
    archetype: "generic",
    art: asset("art/pixel/cards/ward.jpg"),
    sockets: 1,
    baseSanResistPct: 3,
  },
  worn_boots: {
    id: "worn_boots",
    name: "履き古した靴",
    slot: "feet",
    archetype: "generic",
    art: asset("art/pixel/cards/ward.jpg"),
    sockets: 1,
    basePoisonResistPct: 3,
  },
  blood_veil: {
    id: "blood_veil",
    name: "血に濡れた眼帯",
    slot: "head",
    archetype: "fanatic",
    art: asset("art/pixel/cards/ward.jpg"),
    sockets: 1,
    baseStrength: 2,
  },
  sacrifice_plate: {
    id: "sacrifice_plate",
    name: "生贄の胸当て",
    slot: "chest",
    archetype: "fanatic",
    art: asset("art/pixel/cards/ward.jpg"),
    sockets: 2,
    baseStrength: 2,
  },
  fanatic_bangle: {
    id: "fanatic_bangle",
    name: "狂信の腕輪",
    slot: "arms",
    archetype: "fanatic",
    art: asset("art/pixel/cards/ward.jpg"),
    sockets: 1,
    baseStrength: 2,
  },
  cursed_greaves: {
    id: "cursed_greaves",
    name: "呪われた脚甲",
    slot: "legs",
    archetype: "fanatic",
    art: asset("art/pixel/cards/ward.jpg"),
    sockets: 1,
    baseStrength: 1,
  },
  bloodstained_boots: {
    id: "bloodstained_boots",
    name: "血染めの靴",
    slot: "feet",
    archetype: "fanatic",
    art: asset("art/pixel/cards/ward.jpg"),
    sockets: 1,
    baseStrength: 1,
  },
  pilgrim_helm: {
    id: "pilgrim_helm",
    name: "巡礼の兜",
    slot: "head",
    archetype: "knight",
    art: asset("art/pixel/cards/ward.jpg"),
    sockets: 1,
    baseDefensePct: 3,
  },
  pilgrim_mail: {
    id: "pilgrim_mail",
    name: "巡礼の鎧",
    slot: "chest",
    archetype: "knight",
    art: asset("art/pixel/cards/ward.jpg"),
    sockets: 2,
    baseDefensePct: 5,
  },
  pilgrim_gauntlets: {
    id: "pilgrim_gauntlets",
    name: "巡礼の篭手",
    slot: "arms",
    archetype: "knight",
    art: asset("art/pixel/cards/ward.jpg"),
    sockets: 1,
    baseDefensePct: 3,
  },
  pilgrim_greaves: {
    id: "pilgrim_greaves",
    name: "巡礼の脚甲",
    slot: "legs",
    archetype: "knight",
    art: asset("art/pixel/cards/ward.jpg"),
    sockets: 1,
    baseDefensePct: 3,
  },
  pilgrim_boots: {
    id: "pilgrim_boots",
    name: "巡礼の靴",
    slot: "feet",
    archetype: "knight",
    art: asset("art/pixel/cards/ward.jpg"),
    sockets: 1,
    baseDefensePct: 2,
  },
  venom_hood: {
    id: "venom_hood",
    name: "猛毒の頭巾",
    slot: "head",
    archetype: "poison",
    art: asset("art/pixel/cards/ward.jpg"),
    sockets: 1,
    basePoisonResistPct: 3,
  },
  venom_coat: {
    id: "venom_coat",
    name: "猛毒の外套",
    slot: "chest",
    archetype: "poison",
    art: asset("art/pixel/cards/ward.jpg"),
    sockets: 2,
    basePoisonResistPct: 4,
  },
  venom_bangle: {
    id: "venom_bangle",
    name: "猛毒の腕輪",
    slot: "arms",
    archetype: "poison",
    art: asset("art/pixel/cards/ward.jpg"),
    sockets: 1,
    basePoisonResistPct: 3,
  },
  venom_leggings: {
    id: "venom_leggings",
    name: "猛毒の脚衣",
    slot: "legs",
    archetype: "poison",
    art: asset("art/pixel/cards/ward.jpg"),
    sockets: 1,
    basePoisonResistPct: 3,
  },
  venom_boots: {
    id: "venom_boots",
    name: "猛毒の靴",
    slot: "feet",
    archetype: "poison",
    art: asset("art/pixel/cards/ward.jpg"),
    sockets: 1,
    basePoisonResistPct: 2,
  },
};

export const EQUIPMENT_SLOTS: EquipmentSlot[] = ["head", "chest", "arms", "legs", "feet"];

export function getEquipment(id: string): EquipmentDef {
  const d = EQUIPMENT[id];
  if (!d) throw new Error(`unknown equipment: ${id}`);
  return d;
}

function round(n: number): number {
  return Math.round(n);
}

export function rollEquipmentPower(tier: number, rand: () => number): number {
  const base = 1 + tier * 0.15;
  const roll = 1 + (rand() * 2 - 1) * 0.25;
  return Math.max(0.5, base * roll);
}

export function rollEquipmentAtTier(
  defId: string,
  tier: number,
  rand: () => number,
  source: EquipmentInstance["source"],
): EquipmentInstance {
  const def = getEquipment(defId);
  return {
    uid: uid("eq"),
    defId,
    tier,
    power: rollEquipmentPower(tier, rand),
    socketedRunes: Array.from({ length: def.sockets }, () => null),
    obtainedFloor: 0,
    source,
  };
}

export function rollEquipment(
  defId: string,
  floor: number,
  rand: () => number,
  source: EquipmentInstance["source"],
): EquipmentInstance {
  const inst = rollEquipmentAtTier(defId, tierFromFloor(floor), rand, source);
  return { ...inst, obtainedFloor: floor };
}

export function pickEquipmentTemplate(rand: () => number): string {
  const ids = Object.keys(EQUIPMENT);
  return ids[Math.floor(rand() * ids.length)] ?? "ragged_hood";
}

export function equipmentLabel(inst: EquipmentInstance): string {
  const def = EQUIPMENT[inst.defId];
  return `${def?.name ?? inst.defId} T${inst.tier}`;
}

export function hasFullSet(
  equipped: Partial<Record<EquipmentSlot, EquipmentInstance>>,
  archetype: Archetype,
): boolean {
  return EQUIPMENT_SLOTS.every((slot) => {
    const inst = equipped[slot];
    return !!inst && EQUIPMENT[inst.defId]?.archetype === archetype;
  });
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
    healBonusPct: 0,
  };

  for (const inst of Object.values(equipped)) {
    if (!inst) continue;
    const def = EQUIPMENT[inst.defId];
    if (!def) continue;
    const power = inst.power || 1;

    stats.defensePct += (def.baseDefensePct ?? 0) * power;
    stats.sanResistPct += (def.baseSanResistPct ?? 0) * power;
    stats.poisonResistPct += (def.basePoisonResistPct ?? 0) * power;
    stats.strength += (def.baseStrength ?? 0) * power;
    stats.drawBonus += (def.baseDraw ?? 0) * power;
    stats.healPerTurn += (def.baseHeal ?? 0) * power;

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

  stats.defensePct = round(stats.defensePct);
  stats.sanResistPct = round(stats.sanResistPct);
  stats.poisonResistPct = round(stats.poisonResistPct);
  stats.strength = round(stats.strength);
  stats.drawBonus = round(stats.drawBonus);
  stats.healPerTurn = round(stats.healPerTurn);

  if (hasFullSet(equipped, "poison")) {
    stats.poisonResistPct = 100;
    stats.healBonusPct = 50;
  }

  return stats;
}

export function applyDefensePct(damage: number, defensePct: number): number {
  if (damage <= 0) return damage;
  const reduced = damage * (1 - Math.min(defensePct, 100) / 100);
  return Math.max(0, round(reduced));
}
