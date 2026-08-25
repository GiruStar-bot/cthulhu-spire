import type { RelicDef } from "./types";

export const RELICS: Record<string, RelicDef> = {
  lens: {
    id: "lens",
    name: "ひび割れたレンズ",
    text: "戦闘の最初のターン、追加で2枚引く。",
  },
  coral: {
    id: "coral",
    name: "乾いた珊瑚",
    text: "最大体力が8増える。",
  },
  idol: {
    id: "idol",
    name: "青白い偶像",
    text: "正気を失うたび、ブロック3を得る。",
  },
  candle: {
    id: "candle",
    name: "黒い蝋燭",
    text: "毎ターン開始時、エネルギーを1得る。",
  },
  coin: {
    id: "coin",
    name: "塩のコイン",
    text: "戦闘後、体力を6回復する。",
  },
  notebook: {
    id: "notebook",
    name: "野帳",
    text: "戦闘開始時、筋力を1得る。",
  },
};

export const RELIC_IDS = Object.keys(RELICS);
