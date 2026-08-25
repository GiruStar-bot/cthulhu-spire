export type Scene =
  | "title"
  | "prepare"
  | "map"
  | "combat"
  | "reward"
  | "rest"
  | "event"
  | "between"
  | "victory"
  | "defeat";

/** 旧デモ互換。ステ振り後も初期デッキの偏りに使う。 */
export type CharacterId = "investigator" | "cultist";

export interface PlayerStats {
  body: number;
  mind: number;
  will: number;
}

export type RelicTier = 1 | 2 | 3 | 4;

export type RelicKind =
  | "draw"
  | "maxHp"
  | "sanityBlock"
  | "energy"
  | "postHeal"
  | "strength"
  | "damage"
  | "maxSanity";

/** コレクションに積まれる個体（ロール済み） */
export interface RelicInstance {
  uid: string;
  defId: string;
  tier: RelicTier;
  /** ハクスラで振られた効力 */
  power: number;
  source: "drop" | "event" | "starter";
  obtainedFloor: number;
}

export interface PlayerProfile {
  playerName: string;
  stats: PlayerStats;
  collection: RelicInstance[];
  loadoutIds: string[];
  bestFloor: number;
  runs: number;
  wins: number;
}
export type CardType = "attack" | "skill" | "power" | "status";
export type Rarity = "starter" | "common" | "uncommon" | "rare" | "status";
export type CardTarget = "none" | "enemy" | "all";
export type NodeType = "start" | "combat" | "elite" | "rest" | "event" | "boss";
export type IntentKind = "attack" | "defend" | "buff" | "debuff" | "unknown";

export type Effect =
  | { t: "damage"; n: number }
  | { t: "damageAll"; n: number }
  | { t: "block"; n: number }
  | { t: "draw"; n: number }
  | { t: "energy"; n: number }
  | { t: "strength"; n: number }
  | { t: "dexterity"; n: number }
  | { t: "heal"; n: number }
  | { t: "sanity"; n: number }
  | { t: "hpCost"; n: number }
  | { t: "weak"; n: number }
  | { t: "vulnerable"; n: number }
  | { t: "gainPower"; id: PowerId }
  | { t: "addDread"; n: number }
  | { t: "ifIntentAttack"; then: Effect[] }
  | { t: "ifSanityBelow"; threshold: number; then: Effect[] };

export type PowerId = "resolve" | "echo" | "bloodOath";

export interface CardDef {
  id: string;
  name: string;
  type: CardType;
  cost: number;
  upgradedCost?: number;
  rarity: Rarity;
  owner: "shared" | CharacterId | "status";
  text: string;
  upgradedText: string;
  flavor: string;
  art: string;
  target: CardTarget;
  exhaust?: boolean;
  unplayable?: boolean;
  ethereal?: boolean;
  effects: Effect[];
  upgradedEffects: Effect[];
}

export interface CardInst {
  uid: string;
  defId: string;
  upgraded: boolean;
}

export interface EnemyDef {
  id: string;
  name: string;
  art: string;
  maxHp: number;
  pattern: Intent[];
}

export interface Intent {
  kind: IntentKind;
  damage?: number;
  hits?: number;
  block?: number;
  strength?: number;
  weak?: number;
  dread?: number;
}

export interface CombatEnemy {
  uid: string;
  defId: string;
  hp: number;
  maxHp: number;
  block: number;
  strength: number;
  weak: number;
  vulnerable: number;
  patternIndex: number;
  intent: Intent;
}

export interface CharacterDef {
  id: CharacterId;
  name: string;
  title: string;
  blurb: string;
  art: string;
  maxHp: number;
  maxSanity: number;
  starter: string[];
}

export interface RelicDef {
  id: string;
  name: string;
  text: string;
  kind: RelicKind;
  /** 階層1帯での基準値。ロールとティアで変動 */
  basePower: number;
}

export interface MapNode {
  id: string;
  row: number;
  col: number;
  type: NodeType;
  next: string[];
}

export interface CombatState {
  enemies: CombatEnemy[];
  draw: CardInst[];
  discard: CardInst[];
  exhaust: CardInst[];
  hand: CardInst[];
  energy: number;
  maxEnergy: number;
  block: number;
  strength: number;
  dexterity: number;
  weak: number;
  vulnerable: number;
  powers: PowerId[];
  cardsPlayed: number;
  phase: "player" | "enemy" | "over";
  result: "ongoing" | "win" | "lose";
  log: string[];
  floaters: Floater[];
}

export interface Floater {
  id: string;
  text: string;
  kind: "dmg" | "block" | "heal" | "sanity" | "info";
  who: "player" | string;
}

export interface RewardOffer {
  cards: CardInst[];
  /** ドロップした個体。受け取るとコレクション＆今ラン装備候補へ */
  relic?: RelicInstance;
}

export interface GameEvent {
  id: string;
  title: string;
  body: string;
  choices: EventChoice[];
}

export interface EventChoice {
  id: string;
  label: string;
  result: string;
}
