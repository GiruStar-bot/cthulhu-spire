export type Scene =
  | "title"
  | "prepare"
  | "map"
  | "combat"
  | "reward"
  | "cull"
  | "rest"
  | "event"
  | "between"
  | "victory"
  | "defeat"
  | "prologue"
  | "shatter";

export type CharacterId = "investigator" | "cultist";
export type CardType = "attack" | "skill" | "power" | "status";
export type Rarity = "starter" | "common" | "uncommon" | "rare" | "status";
export type CardTarget = "none" | "enemy" | "all";
export type FloorKind = "combat" | "elite" | "rest" | "event" | "boss";
export type NodeType = "start" | FloorKind;

export interface FloorSpec {
  floor: number;
  type: FloorKind;
  eventId?: string;
  enemyIds?: string[];
}
export type IntentKind = "attack" | "defend" | "buff" | "debuff" | "unknown";
export type RelicKind =
  | "draw"
  | "maxHp"
  | "sanityBlock"
  | "energy"
  | "postHeal"
  | "strength"
  | "maxSanity";

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
  | { t: "ifSanityBelow"; threshold: number; then: Effect[] }
  | { t: "poison"; n: number }
  | { t: "intangible"; n: number }
  | { t: "loseMaxHp"; n: number }
  | { t: "addCurse"; id: string }
  | { t: "nextAttackMul"; n: number }
  | { t: "phaseDelay" }
  | { t: "attackSelfHurt"; n: number }
  | { t: "blockPerEnemy"; n: number }
  | { t: "damageX"; n: number }
  | { t: "exhaustHand" }
  | { t: "banish"; n: number }
  | { t: "healOnKill"; n: number }
  | { t: "retainBlock" }
  | { t: "discardRandom"; n: number }
  | { t: "skipDraw"; n: number }
  | { t: "energyNext"; n: number }
  | { t: "cancelIntent" }
  | { t: "endTurnMaybe"; p: number }
  | { t: "cold"; n: number }
  | { t: "bind" }
  | { t: "selfVulnerable"; n: number }
  | { t: "retainCards"; n: number }
  | { t: "thornsVulnerable"; n: number }
  | { t: "loseMaxHpHalf" };

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
  grimoire?: boolean;
  shop?: boolean;
  xCost?: boolean;
  charges?: number;
  onDraw?: Effect[];
  effects: Effect[];
  upgradedEffects: Effect[];
}

export interface CardInst {
  uid: string;
  defId: string;
  upgraded: boolean;
  charges?: number;
  forge?: number;
}

export type BiomeId = "reef" | "street" | "mu" | "fold" | "throne" | "void" | "colour";

export interface EnemyDef {
  id: string;
  name: string;
  art: string;
  poster?: string;
  idleFrames?: string[];
  idleFps?: number;
  maxHp: number;
  pattern: Intent[];
  trait?: EnemyTrait;
  biome: BiomeId;
}

export type EnemyTrait = "choir" | "nurse" | "liar" | "bell" | "seal" | "split";

export interface Intent {
  kind: IntentKind;
  damage?: number;
  hits?: number;
  block?: number;
  strength?: number;
  weak?: number;
  dread?: number;
  seal?: "attack" | "skill";
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
  poison: number;
  patternIndex: number;
  intent: Intent;
  shownIntent?: Intent;
  splitDone?: boolean;
  bound?: number;
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
}

export interface RelicInstance {
  uid: string;
  defId: string;
  tier: number;
  power: number;
  obtainedFloor: number;
  source: "drop" | "event" | "gift";
}

export interface PlayerStats {
  body: number;
  mind: number;
  will: number;
}

export interface PlayerProfile {
  playerName: string;
  stats: PlayerStats;
  collection: RelicInstance[];
  loadoutIds: string[];
  bestFloor: number;
  wins: number;
  runs: number;
  earnedPoints: number;
  unspentPoints: number;
  madness: number;
  sanity: number | null;
  seenRlyeh: boolean;
  grimoireRead: string[];
}

export interface MapNode {
  id: string;
  row: number;
  col: number;
  type: NodeType;
  next: string[];
}

export interface CombatState {
  floor: number;
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
  sealed: "attack" | "skill" | null;
  intangible: number;
  nextAttackMul: number;
  blockLost: number;
  pendingPhase: number;
  attackSelfHurt: number;
  keepBlock: number;
  skipDraw: number;
  energyNext: number;
  cold: number;
  retainHand: number;
  thornsVulnerable: number;
  xSpent: number;
  forceEnd: boolean;
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

export type ItemRank = "normal" | "mid" | "genius" | "god" | "taboo";
export type ShopSub = "sword" | "bow" | "heavy" | "light";

export interface ShopGood {
  uid: string;
  defId: string;
  price: number;
  sold: boolean;
}

export interface SmithShop {
  rank: ItemRank;
  kind: ShopSub;
  taboo: boolean;
  goods: ShopGood[];
}

export interface VillageState {
  smith: SmithShop;
  beerSold: boolean;
}
