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
    art: asset("art/pixel/equipment/ragged_hood.jpg"),
    sockets: 1,
    baseDefense: 3,
  },
  worn_coat: {
    id: "worn_coat",
    name: "着古した外套",
    slot: "chest",
    archetype: "generic",
    art: asset("art/pixel/equipment/worn_coat.jpg"),
    sockets: 2,
    baseDefense: 5,
  },
  bandaged_arms: {
    id: "bandaged_arms",
    name: "包帯の腕",
    slot: "arms",
    archetype: "generic",
    art: asset("art/pixel/equipment/bandaged_arms.jpg"),
    sockets: 1,
    baseStrength: 1,
  },
  patched_legs: {
    id: "patched_legs",
    name: "継ぎ接ぎの脚衣",
    slot: "legs",
    archetype: "generic",
    art: asset("art/pixel/equipment/patched_legs.jpg"),
    sockets: 1,
    baseSanResist: 3,
  },
  worn_boots: {
    id: "worn_boots",
    name: "履き古した靴",
    slot: "feet",
    archetype: "generic",
    art: asset("art/pixel/equipment/worn_boots.jpg"),
    sockets: 1,
    basePoisonResist: 3,
  },
  blood_veil: {
    id: "blood_veil",
    name: "血に濡れた眼帯",
    slot: "head",
    archetype: "fanatic",
    art: asset("art/pixel/equipment/blood_veil.jpg"),
    sockets: 1,
    baseStrength: 2,
  },
  sacrifice_plate: {
    id: "sacrifice_plate",
    name: "生贄の胸当て",
    slot: "chest",
    archetype: "fanatic",
    art: asset("art/pixel/equipment/sacrifice_plate.jpg"),
    sockets: 2,
    baseStrength: 2,
  },
  fanatic_bangle: {
    id: "fanatic_bangle",
    name: "狂信の腕輪",
    slot: "arms",
    archetype: "fanatic",
    art: asset("art/pixel/equipment/fanatic_bangle.jpg"),
    sockets: 1,
    baseStrength: 2,
  },
  cursed_greaves: {
    id: "cursed_greaves",
    name: "呪われた脚甲",
    slot: "legs",
    archetype: "fanatic",
    art: asset("art/pixel/equipment/cursed_greaves.jpg"),
    sockets: 1,
    baseStrength: 1,
  },
  bloodstained_boots: {
    id: "bloodstained_boots",
    name: "血染めの靴",
    slot: "feet",
    archetype: "fanatic",
    art: asset("art/pixel/equipment/bloodstained_boots.jpg"),
    sockets: 1,
    baseStrength: 1,
  },
  pilgrim_helm: {
    id: "pilgrim_helm",
    name: "巡礼の兜",
    slot: "head",
    archetype: "knight",
    art: asset("art/pixel/equipment/pilgrim_helm.jpg"),
    sockets: 1,
    baseDefense: 3,
  },
  pilgrim_mail: {
    id: "pilgrim_mail",
    name: "巡礼の鎧",
    slot: "chest",
    archetype: "knight",
    art: asset("art/pixel/equipment/pilgrim_mail.jpg"),
    sockets: 2,
    baseDefense: 5,
  },
  pilgrim_gauntlets: {
    id: "pilgrim_gauntlets",
    name: "巡礼の篭手",
    slot: "arms",
    archetype: "knight",
    art: asset("art/pixel/equipment/pilgrim_gauntlets.jpg"),
    sockets: 1,
    baseDefense: 3,
  },
  pilgrim_greaves: {
    id: "pilgrim_greaves",
    name: "巡礼の脚甲",
    slot: "legs",
    archetype: "knight",
    art: asset("art/pixel/equipment/pilgrim_greaves.jpg"),
    sockets: 1,
    baseDefense: 3,
  },
  pilgrim_boots: {
    id: "pilgrim_boots",
    name: "巡礼の靴",
    slot: "feet",
    archetype: "knight",
    art: asset("art/pixel/equipment/pilgrim_boots.jpg"),
    sockets: 1,
    baseDefense: 2,
  },
  venom_hood: {
    id: "venom_hood",
    name: "猛毒の頭巾",
    slot: "head",
    archetype: "poison",
    art: asset("art/pixel/equipment/venom_hood.jpg"),
    sockets: 1,
    basePoisonResist: 3,
  },
  venom_coat: {
    id: "venom_coat",
    name: "猛毒の外套",
    slot: "chest",
    archetype: "poison",
    art: asset("art/pixel/equipment/venom_coat.jpg"),
    sockets: 2,
    basePoisonResist: 4,
  },
  venom_bangle: {
    id: "venom_bangle",
    name: "猛毒の腕輪",
    slot: "arms",
    archetype: "poison",
    art: asset("art/pixel/equipment/venom_bangle.jpg"),
    sockets: 1,
    basePoisonResist: 3,
  },
  venom_leggings: {
    id: "venom_leggings",
    name: "猛毒の脚衣",
    slot: "legs",
    archetype: "poison",
    art: asset("art/pixel/equipment/venom_leggings.jpg"),
    sockets: 1,
    basePoisonResist: 3,
  },
  venom_boots: {
    id: "venom_boots",
    name: "猛毒の靴",
    slot: "feet",
    archetype: "poison",
    art: asset("art/pixel/equipment/venom_boots.jpg"),
    sockets: 1,
    basePoisonResist: 2,
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

type BonusStatKey = "strength" | "defense" | "poisonResist" | "sanResist";

const TIER_BONUS_CONFIG: Record<
  number,
  { rangePct: number; bonusChance: number; secondBonusChance: number }
> = {
  1: { rangePct: 0.15, bonusChance: 0, secondBonusChance: 0 },
  2: { rangePct: 0.2, bonusChance: 0.25, secondBonusChance: 0 },
  3: { rangePct: 0.25, bonusChance: 0.5, secondBonusChance: 0 },
  4: { rangePct: 0.3, bonusChance: 0.75, secondBonusChance: 0.25 },
  5: { rangePct: 0.35, bonusChance: 1, secondBonusChance: 0.5 },
};

const BONUS_STAT_BASE: Record<BonusStatKey, number> = {
  strength: 1,
  defense: 2,
  poisonResist: 2,
  sanResist: 2,
};

const ALL_BONUS_KEYS: BonusStatKey[] = ["strength", "defense", "poisonResist", "sanResist"];

function statKeysOf(def: EquipmentDef): BonusStatKey[] {
  const keys: BonusStatKey[] = [];
  if (def.baseStrength) keys.push("strength");
  if (def.baseDefense) keys.push("defense");
  if (def.basePoisonResist) keys.push("poisonResist");
  if (def.baseSanResist) keys.push("sanResist");
  return keys;
}

function rollBonusStats(
  def: EquipmentDef,
  tier: number,
  power: number,
  rand: () => number,
): Partial<Record<BonusStatKey, number>> {
  const cfg = TIER_BONUS_CONFIG[Math.min(5, Math.max(1, tier))] ?? TIER_BONUS_CONFIG[1];
  const ownKeys = new Set(statKeysOf(def));
  const pool = ALL_BONUS_KEYS.filter((k) => !ownKeys.has(k));
  const bonus: Partial<Record<BonusStatKey, number>> = {};
  if (pool.length === 0) return bonus;

  if (rand() < cfg.bonusChance) {
    const idx = Math.floor(rand() * pool.length);
    const key = pool[idx];
    bonus[key] = Math.max(1, Math.round(BONUS_STAT_BASE[key] * power));

    const remaining = pool.filter((k) => k !== key);
    if (remaining.length > 0 && rand() < cfg.secondBonusChance) {
      const key2 = remaining[Math.floor(rand() * remaining.length)];
      bonus[key2] = Math.max(1, Math.round(BONUS_STAT_BASE[key2] * power));
    }
  }
  return bonus;
}

export function rollEquipmentPower(tier: number, rand: () => number): number {
  const cfg = TIER_BONUS_CONFIG[Math.min(5, Math.max(1, tier))] ?? TIER_BONUS_CONFIG[1];
  const base = 1 + tier * 0.15;
  const roll = 1 + (rand() * 2 - 1) * cfg.rangePct;
  return Math.max(0.5, base * roll);
}

export function rollEquipmentAtTier(
  defId: string,
  tier: number,
  rand: () => number,
  source: EquipmentInstance["source"],
): EquipmentInstance {
  const def = getEquipment(defId);
  const power = rollEquipmentPower(tier, rand);
  return {
    uid: uid("eq"),
    defId,
    tier,
    power,
    socketedRunes: Array.from({ length: def.sockets }, () => null),
    bonusStats: rollBonusStats(def, tier, power, rand),
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
  const bonusCount = Object.keys(inst.bonusStats ?? {}).length;
  return `${def?.name ?? inst.defId}${bonusCount > 0 ? ` +${bonusCount}` : ""}`;
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
    defense: 0,
    sanResist: 0,
    poisonResist: 0,
    poisonImmune: false,
    blockRetain: false,
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

    stats.defense += (def.baseDefense ?? 0) * power;
    stats.sanResist += (def.baseSanResist ?? 0) * power;
    stats.poisonResist += (def.basePoisonResist ?? 0) * power;
    stats.strength += (def.baseStrength ?? 0) * power;
    stats.drawBonus += (def.baseDraw ?? 0) * power;
    stats.healPerTurn += (def.baseHeal ?? 0) * power;

    const bonus = inst.bonusStats ?? {};
    if (bonus.strength) stats.strength += bonus.strength;
    if (bonus.defense) stats.defense += bonus.defense;
    if (bonus.poisonResist) stats.poisonResist += bonus.poisonResist;
    if (bonus.sanResist) stats.sanResist += bonus.sanResist;

    for (const runeId of inst.socketedRunes) {
      if (!runeId) continue;
      const rune = peekRune(runeId);
      if (!rune) continue;
      switch (rune.effect) {
        case "BLK+":
          stats.defense += rune.value;
          break;
        case "SAN+":
          stats.sanResist += rune.value;
          break;
        case "POISON":
          stats.poisonResist += rune.value;
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

  stats.defense = round(stats.defense);
  stats.sanResist = round(stats.sanResist);
  stats.poisonResist = round(stats.poisonResist);
  stats.strength = round(stats.strength);
  stats.drawBonus = round(stats.drawBonus);
  stats.healPerTurn = round(stats.healPerTurn);

  if (hasFullSet(equipped, "poison")) {
    stats.poisonImmune = true;
    stats.healBonusPct = 50;
  }
  if (hasFullSet(equipped, "knight")) {
    stats.blockRetain = true;
  }

  return stats;
}

export const MIN_CHIP_DAMAGE = 1;

export function applyPctReduction(damage: number, defensePct: number): number {
  if (damage <= 0) return damage;
  const reduced = damage * (1 - Math.min(defensePct, 100) / 100);
  return Math.max(0, round(reduced));
}

export function applyFlatDefense(damage: number, defense: number): number {
  if (damage <= 0) return damage;
  const reduced = damage - defense;
  return Math.max(MIN_CHIP_DAMAGE, round(reduced));
}

export function applyFlatResist(amount: number, resist: number): number {
  if (amount <= 0) return amount;
  return Math.max(0, round(amount - resist));
}
