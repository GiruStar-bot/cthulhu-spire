import type { CardDef, CardInst, ItemRank, ShopGood, SmithShop, ShopSub } from "./types";
import { asset } from "@/lib/asset";
import { EQUIPMENT, rollEquipmentAtTier } from "./equipment";
import { pick, uid } from "./rng";

const blade = asset("art/card-blade.jpg");
const bow = asset("art/card-bow.jpg");
const mail = asset("art/card-mail.jpg");
const cloak = asset("art/card-cloak.jpg");
const beerArt = asset("art/card-beer.jpg");
const study = asset("art/card-study.jpg");
const ward = asset("art/card-ward.jpg");

function shopArt(id: string) {
  return asset(`art/pixel/cards/${id}.jpg`);
}

function atk(
  id: string,
  name: string,
  cost: number,
  text: string,
  art: string,
  effects: CardDef["effects"],
  extra: Partial<CardDef> = {},
): CardDef {
  return {
    id,
    name,
    type: extra.type ?? "attack",
    cost,
    rarity: "rare",
    owner: "shared",
    text,
    upgradedText: text,
    flavor: "",
    art,
    target: extra.target ?? "enemy",
    shop: true,
    effects,
    upgradedEffects: effects,
    ...extra,
  };
}

function skl(
  id: string,
  name: string,
  cost: number,
  text: string,
  art: string,
  effects: CardDef["effects"],
  extra: Partial<CardDef> = {},
): CardDef {
  return atk(id, name, cost, text, art, effects, { ...extra, type: "skill", target: extra.target ?? "none" });
}

export const SHOP_CARDS: Record<string, CardDef> = {
  iron_sword: atk("iron_sword", "鉄剣", 1, "8ダメージ。", shopArt("iron_sword"), [{ t: "damage", n: 8 }]),
  iron_axe: atk("iron_axe", "鉄斧", 2, "12ダメージ。", shopArt("iron_axe"), [{ t: "damage", n: 12 }]),
  knife: atk("knife", "ナイフ", 0, "4ダメージ。", shopArt("knife"), [{ t: "damage", n: 4 }]),
  ritual_dagger: atk("ritual_dagger", "祭祀の短剣", 1, "10ダメージ。このカードで倒すと2回復。", shopArt("ritual_dagger"), [
    { t: "damage", n: 10 },
    { t: "healOnKill", n: 2 },
  ], { archetype: "fanatic" }),
  ghoul_claw: atk("ghoul_claw", "グールの爪剣", 0, "5ダメージ。毒2。", shopArt("ghoul_claw"), [
    { t: "damage", n: 5 },
    { t: "poison", n: 2 },
  ]),
  deep_spear: atk("deep_spear", "深きものの鉾", 1, "9ダメージ。脆弱1。", shopArt("deep_spear"), [
    { t: "damage", n: 9 },
    { t: "vulnerable", n: 1 },
  ], { archetype: "deep" }),
  star_sword: atk("star_sword", "忌まわしき星の剣", 2, "16ダメージ。デッキに負傷を加える。", shopArt("star_sword"), [
    { t: "damage", n: 16 },
    { t: "addCurse", id: "wound" },
  ], { archetype: "elder" }),
  spawn_blade: atk("spawn_blade", "星の落とし子の触手刃", 3, "24ダメージ。拘束。幻覚が混入する。", shopArt("spawn_blade"), [
    { t: "damage", n: 24 },
    { t: "bind" },
    { t: "addCurse", id: "hallucination" },
  ], { archetype: "elder" }),
  cthugha_blade: atk("cthugha_blade", "クトゥグアの炎剣", 2, "20ダメージ。手札をすべて廃棄。", shopArt("cthugha_blade"), [
    { t: "damage", n: 20 },
    { t: "exhaustHand" },
  ], { archetype: "outer" }),
  nyar_fake: atk("nyar_fake", "ニャルラトホテプの偽剣", 1, "30ダメージ。手札2枚を戦闘終了まで消す。", shopArt("nyar_fake"), [
    { t: "damage", n: 30 },
    { t: "banish", n: 2 },
  ], { archetype: "outer" }),
  azathoth_end: atk("azathoth_end", "アザトースの断末魔", 0, "X×15ダメージ。全エネルギー消費。最大体力が半分になる。", shopArt("azathoth_end"), [
    { t: "damageX", n: 15 },
    { t: "loseMaxHpHalf" },
  ], { xCost: true, archetype: "outer" }),

  short_bow: atk("short_bow", "ショートボウ", 0, "3ダメージ。", shopArt("short_bow"), [{ t: "damage", n: 3 }]),
  hunter_bow: atk("hunter_bow", "狩人の弓", 1, "7ダメージ。", shopArt("hunter_bow"), [{ t: "damage", n: 7 }]),
  crossbow: atk("crossbow", "クロスボウ", 2, "11ダメージ。", shopArt("crossbow"), [{ t: "damage", n: 11 }]),
  bone_bow: atk("bone_bow", "骨削りの弓", 1, "5ダメージを2回。", shopArt("bone_bow"), [
    { t: "damage", n: 5 },
    { t: "damage", n: 5 },
  ]),
  fanatic_dart: atk("fanatic_dart", "狂信者の吹き矢", 0, "4ダメージ。手札を1枚捨て、毒3。", shopArt("fanatic_dart"), [
    { t: "damage", n: 4 },
    { t: "discardRandom", n: 1 },
    { t: "poison", n: 3 },
  ], { archetype: "fanatic" }),
  migo_gun: atk("migo_gun", "ミ＝ゴの電撃銃", 2, "敵全体に12ダメージ。", shopArt("migo_gun"), [{ t: "damageAll", n: 12 }], { target: "all", archetype: "outer" }),
  elder_staff: atk("elder_staff", "古きものの水晶杖", 1, "8ダメージ。1枚引く。", shopArt("elder_staff"), [
    { t: "damage", n: 8 },
    { t: "draw", n: 1 },
  ], { archetype: "outer" }),
  hastur_bow: atk("hastur_bow", "ハスターの風弓", 2, "敵全体に18ダメージ。弱体1。", shopArt("hastur_bow"), [
    { t: "damageAll", n: 18 },
    { t: "weak", n: 1 },
  ], { target: "all", archetype: "elder" }),
  blackwood_bow: atk("blackwood_bow", "黒き森の弓", 1, "6ダメージを3回。狂気を加える。", bow, [
    { t: "damage", n: 6 },
    { t: "damage", n: 6 },
    { t: "damage", n: 6 },
    { t: "addCurse", id: "dread" },
  ]),
  hunter_shot: atk("hunter_shot", "忌まわしき狩人の魔弾", 3, "40ダメージ。意図を消す。次ターンエネルギー-1。", shopArt("hunter_shot"), [
    { t: "damage", n: 40 },
    { t: "cancelIntent" },
    { t: "energyNext", n: -1 },
  ]),
  yog_gun: atk("yog_gun", "ヨグ＝ソトースの次元銃", 3, "敵全体に35。次のドローを飛ばす。", shopArt("yog_gun"), [
    { t: "damageAll", n: 35 },
    { t: "skipDraw", n: 1 },
  ], { target: "all", archetype: "outer" }),

  iron_shield: skl("iron_shield", "鉄の盾", 1, "ブロック8。", mail, [{ t: "block", n: 8 }]),
  tower_shield: skl("tower_shield", "タワーシールド", 2, "ブロック13。", mail, [{ t: "block", n: 13 }]),
  chain_mail: skl("chain_mail", "鎖帷子", 1, "ブロック5。このターン、ブロックが残る。", mail, [
    { t: "block", n: 5 },
    { t: "retainBlock" },
  ]),
  deep_scale: skl("deep_scale", "深きものの鱗鎧", 2, "ブロック16。脆弱1を自分に。", shopArt("deep_scale"), [
    { t: "block", n: 16 },
    { t: "selfVulnerable", n: 1 },
  ], { archetype: "deep" }),
  shoggoth_plate: skl("shoggoth_plate", "ショゴスの粘液装甲", 1, "ブロック10。粘液が混入する。", shopArt("shoggoth_plate"), [
    { t: "block", n: 10 },
    { t: "addCurse", id: "slime" },
  ], { archetype: "outer" }),
  yith_shell: skl("yith_shell", "イスの金属殻", 2, "ブロック18。手札1枚を残す。", shopArt("yith_shell"), [
    { t: "block", n: 18 },
    { t: "retainCards", n: 1 },
  ], { archetype: "outer" }),
  dagon_shield: skl("dagon_shield", "ダゴンの儀式盾", 3, "ブロック22。3回復。", shopArt("dagon_shield"), [
    { t: "block", n: 22 },
    { t: "heal", n: 3 },
  ], { archetype: "deep" }),
  cthulhu_mail: skl("cthulhu_mail", "クトゥルフの夢装甲", 3, "ブロック30。睡眠が混入する。", shopArt("cthulhu_mail"), [
    { t: "block", n: 30 },
    { t: "addCurse", id: "sleep" },
  ], { archetype: "elder" }),
  tsathoggua_shield: skl("tsathoggua_shield", "ツァトゥグァの怠惰盾", 2, "ブロック22。次のドロー-1。", shopArt("tsathoggua_shield"), [
    { t: "block", n: 22 },
    { t: "skipDraw", n: 1 },
  ], { archetype: "elder" }),
  yog_gate: skl("yog_gate", "ヨグ＝ソトースの門", 3, "ブロック45。廃棄。次ターンエネルギー-2。", shopArt("yog_gate"), [
    { t: "block", n: 45 },
    { t: "energyNext", n: -2 },
  ], { exhaust: true, archetype: "outer" }),
  plateau_mail: skl("plateau_mail", "狂気山脈の凍てつく鎧", 2, "ブロック35。毎ターン開始時1ダメージ。", shopArt("plateau_mail"), [
    { t: "block", n: 35 },
    { t: "cold", n: 1 },
  ], { archetype: "outer" }),

  buckler: skl("buckler", "バックラー", 0, "ブロック4。", cloak, [{ t: "block", n: 4 }]),
  leather: skl("leather", "革の鎧", 1, "ブロック6。1枚引く。", cloak, [{ t: "block", n: 6 }, { t: "draw", n: 1 }]),
  thief_cloak: skl("thief_cloak", "盗賊のマント", 2, "ブロック10。無形1。", shopArt("thief_cloak"), [
    { t: "block", n: 10 },
    { t: "intangible", n: 1 },
  ], { archetype: "shadow" }),
  ghoul_rags: skl("ghoul_rags", "食尸鬼のボロ布", 0, "ブロック6。体力1失う。", cloak, [
    { t: "block", n: 6 },
    { t: "hpCost", n: 1 },
  ]),
  gaki_hide: skl("gaki_hide", "妖鬼の皮鎧", 1, "ブロック9。手札を1枚捨てる。", cloak, [
    { t: "block", n: 9 },
    { t: "discardRandom", n: 1 },
  ]),
  yith_coat: skl("yith_coat", "偉大なる種族の外套", 1, "ブロック10。手札を2枚まで残す。", shopArt("yith_coat"), [
    { t: "block", n: 10 },
    { t: "retainCards", n: 2 },
  ], { archetype: "outer" }),
  penguin_fur: skl("penguin_fur", "盲目のペンギンの毛皮", 0, "ブロック6。敵を拘束する。", cloak, [
    { t: "block", n: 6 },
    { t: "bind" },
  ], { target: "enemy" }),
  yellow_rags: skl("yellow_rags", "黄衣の王の襤褸", 2, "ブロック20。攻撃してきた敵に脆弱。", shopArt("yellow_rags"), [
    { t: "block", n: 20 },
    { t: "thornsVulnerable", n: 1 },
  ], { archetype: "shadow" }),
  nameless_veil: skl("nameless_veil", "無貌の影衣", 1, "ブロック12。次ターン無形。呪いが混入。", shopArt("nameless_veil"), [
    { t: "block", n: 12 },
    { t: "intangible", n: 1 },
    { t: "addCurse", id: "dread" },
  ], { archetype: "shadow" }),
  azathoth_nap: skl("azathoth_nap", "アザトースの微睡み", 0, "ブロック15。50%でターン終了。", cloak, [
    { t: "block", n: 15 },
    { t: "endTurnMaybe", p: 0.5 },
  ], { archetype: "outer" }),
  colour_robe: skl("colour_robe", "宇宙の色彩の衣", 2, "ブロック25。5回復。最大体力-1。", shopArt("colour_robe"), [
    { t: "block", n: 25 },
    { t: "heal", n: 5 },
    { t: "loseMaxHp", n: 1 },
  ], { archetype: "outer" }),

  beer: skl("beer", "ビール瓶", 0, "エネルギー2。2回使うと消える。", beerArt, [{ t: "energy", n: 2 }], {
    shop: true,
    charges: 2,
  }),
  wound: {
    id: "wound",
    name: "負傷",
    type: "status",
    cost: 0,
    rarity: "status",
    owner: "status",
    text: "プレイ不可。",
    upgradedText: "プレイ不可。",
    flavor: "",
    art: study,
    target: "none",
    unplayable: true,
    ethereal: true,
    effects: [],
    upgradedEffects: [],
  },
  hallucination: {
    id: "hallucination",
    name: "おぞましい幻覚",
    type: "status",
    cost: 0,
    rarity: "status",
    owner: "status",
    text: "プレイ不可。",
    upgradedText: "プレイ不可。",
    flavor: "",
    art: study,
    target: "none",
    unplayable: true,
    ethereal: true,
    effects: [],
    upgradedEffects: [],
  },
  slime: {
    id: "slime",
    name: "粘液",
    type: "status",
    cost: 1,
    rarity: "status",
    owner: "status",
    text: "廃棄される。",
    upgradedText: "廃棄される。",
    flavor: "",
    art: ward,
    target: "none",
    exhaust: true,
    ethereal: true,
    effects: [],
    upgradedEffects: [],
  },
  sleep: {
    id: "sleep",
    name: "睡眠",
    type: "status",
    cost: 0,
    rarity: "status",
    owner: "status",
    text: "プレイ不可。",
    upgradedText: "プレイ不可。",
    flavor: "",
    art: study,
    target: "none",
    unplayable: true,
    ethereal: true,
    effects: [],
    upgradedEffects: [],
  },
};

export const SHOP_POOL: Record<ShopSub, Record<ItemRank, string[]>> = {
  sword: {
    normal: ["iron_sword", "iron_axe", "knife"],
    mid: ["ritual_dagger", "ghoul_claw"],
    genius: ["deep_spear", "star_sword"],
    god: ["spawn_blade", "cthugha_blade"],
    taboo: ["nyar_fake", "azathoth_end"],
  },
  bow: {
    normal: ["short_bow", "hunter_bow", "crossbow"],
    mid: ["bone_bow", "fanatic_dart"],
    genius: ["migo_gun", "elder_staff"],
    god: ["hastur_bow", "blackwood_bow"],
    taboo: ["hunter_shot", "yog_gun"],
  },
  heavy: {
    normal: ["iron_shield", "tower_shield", "chain_mail"],
    mid: ["deep_scale", "shoggoth_plate"],
    genius: ["yith_shell", "dagon_shield"],
    god: ["cthulhu_mail", "tsathoggua_shield"],
    taboo: ["yog_gate", "plateau_mail"],
  },
  light: {
    normal: ["buckler", "leather", "thief_cloak"],
    mid: ["ghoul_rags", "gaki_hide"],
    genius: ["yith_coat", "penguin_fur"],
    god: ["yellow_rags", "nameless_veil"],
    taboo: ["azathoth_nap", "colour_robe"],
  },
};

export const SHOP_PRICE: Record<string, number> = {
  iron_sword: 8,
  iron_axe: 10,
  knife: 3,
  ritual_dagger: 15,
  ghoul_claw: 12,
  deep_spear: 25,
  star_sword: 32,
  spawn_blade: 80,
  cthugha_blade: 75,
  nyar_fake: 130,
  azathoth_end: 999,
  short_bow: 3,
  hunter_bow: 8,
  crossbow: 11,
  bone_bow: 16,
  fanatic_dart: 14,
  migo_gun: 35,
  elder_staff: 28,
  hastur_bow: 75,
  blackwood_bow: 65,
  hunter_shot: 150,
  yog_gun: 140,
  iron_shield: 8,
  tower_shield: 12,
  chain_mail: 7,
  deep_scale: 18,
  shoggoth_plate: 15,
  yith_shell: 35,
  dagon_shield: 40,
  cthulhu_mail: 80,
  tsathoggua_shield: 70,
  yog_gate: 150,
  plateau_mail: 145,
  buckler: 4,
  leather: 7,
  thief_cloak: 10,
  ghoul_rags: 12,
  gaki_hide: 14,
  yith_coat: 30,
  penguin_fur: 28,
  yellow_rags: 75,
  nameless_veil: 80,
  azathoth_nap: 120,
  colour_robe: 140,
  beer: 5,
};

const SLOTS: Record<ItemRank, ItemRank[][]> = {
  normal: [
    ["normal"],
    ["normal"],
    ["normal"],
    ["normal"],
    ["normal"],
    ["normal", "normal", "normal", "normal", "mid"],
  ],
  mid: [["normal"], ["normal"], ["mid"], ["mid"], ["mid"], ["mid", "mid", "mid", "mid", "genius"]],
  genius: [
    ["normal", "mid"],
    ["normal", "mid"],
    ["genius"],
    ["genius"],
    ["genius"],
    ["genius", "genius", "genius", "genius", "god"],
  ],
  god: [["mid"], ["mid"], ["genius"], ["genius"], ["god"], ["god", "god", "god", "god", "taboo"]],
  taboo: [["genius"], ["genius"], ["god"], ["god"], ["taboo"], ["taboo"]],
};

export function rollShopRank(rand: () => number): ItemRank {
  const r = rand();
  if (r < 0.002) return "taboo";
  if (r < 0.032) return "god";
  if (r < 0.182) return "genius";
  if (r < 0.382) return "mid";
  return "normal";
}

const EQUIPMENT_TIER_BY_RANK: Record<ItemRank, number> = {
  normal: 1,
  mid: 2,
  genius: 3,
  god: 4,
  taboo: 5,
};

function makeEquipmentGoods(rank: ItemRank, rand: () => number) {
  const tier = EQUIPMENT_TIER_BY_RANK[rank];
  const ids = Object.keys(EQUIPMENT);
  const count = 2;
  return Array.from({ length: count }, () => {
    const defId = pick(ids, rand);
    const inst = rollEquipmentAtTier(defId, tier, rand, "smith");
    return {
      uid: inst.uid,
      defId,
      tier,
      price: rank === "taboo" ? 0 : tier * 15,
      sold: false,
    };
  });
}

export function makeSmith(rand: () => number): SmithShop {
  const weapon = rand() < 0.5;
  const kind: ShopSub = weapon ? (rand() < 0.5 ? "sword" : "bow") : rand() < 0.5 ? "heavy" : "light";
  const rank = rollShopRank(rand);
  const taboo = rank === "taboo";
  const goods: ShopGood[] = SLOTS[rank].map((opts) => {
    const slotRank = pick(opts, rand);
    const pool = SHOP_POOL[kind][slotRank];
    const defId = pick(pool, rand);
    return {
      uid: uid("g"),
      defId,
      price: taboo ? 0 : SHOP_PRICE[defId] ?? 8,
      sold: false,
    };
  });
  return { rank, kind, taboo, goods, equipmentGoods: makeEquipmentGoods(rank, rand) };
}

export function shopLabel(_shop: SmithShop) {
  return "鍛冶屋";
}

export function rankLabel(rank: ItemRank) {
  return { normal: "普通", mid: "中級", genius: "天才", god: "神", taboo: "禁忌" }[rank];
}

export function forgeCard(card: CardInst, taboo: boolean): CardInst {
  const mul = taboo ? 2 : 1.5;
  return { ...card, forge: (card.forge ?? 1) * mul, upgraded: true };
}
