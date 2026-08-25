export const MAX_ACT = 3;

export const ACT_SHORT = ["", "一面", "二面", "三面"] as const;
export const ACT_TITLE = ["", "一面 — 塩の回廊", "二面 — 曲がる階", "三面 — 口へ"] as const;
export const BOSS_LABEL = ["", "大司祭", "使徒", "口"] as const;

export function climbDepth(_act: number, floor: number) {
  return floor;
}