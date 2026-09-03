import type {
  CardInst,
  CombatEnemy,
  CombatState,
  Effect,
  EquipmentInstance,
  EquipmentSlot,
  Floater,
  Intent,
  PowerId,
  RelicInstance,
} from "./types";
import { getCard, makeCard, scaleN } from "./cards";
import { evaluateCardEffect } from "./cardEvaluator";
import { applyDefensePct, computeEquipmentStats } from "./equipment";
import { getEnemy } from "./enemies";
import { cardToIntent, rollEnemyCard } from "./enemyAi";
import { powerOf } from "./relics";
import { pick, shuffle, uid } from "./rng";
import { peekRune } from "@/store/useCollectionStore";

export type CombatSfx = "attack" | "skill" | "block" | "hurt";

export interface PlayerHook {
  hp: number;
  maxHp: number;
  sanity: number;
  maxSanity: number;
  relics: RelicInstance[];
  extraStrength: number;
  extraEnergyNext: number;
  baseEnergy?: number;
  equipped?: Partial<Record<EquipmentSlot, EquipmentInstance>>;
}

function floater(text: string, kind: Floater["kind"], who: Floater["who"]): Floater {
  return { id: uid("f"), text, kind, who };
}

function scaleHp(base: number, floor: number) {
  return Math.round(base * (1 + Math.max(0, floor - 1) * 0.03));
}

export function makeEnemy(defId: string, floor: number, rand: () => number): CombatEnemy {
  const d = getEnemy(defId);
  const maxHp = scaleHp(d.maxHp, floor);
  const e: CombatEnemy = {
    uid: uid("e"),
    defId,
    hp: maxHp,
    maxHp,
    block: 0,
    strength: 0,
    weak: 0,
    vulnerable: 0,
    poison: 0,
    patternIndex: 0,
    intent: { kind: "unknown" },
    actionCardIds: [],
  };
  rollNextAction(e, rand);
  return e;
}

function rollNextAction(e: CombatEnemy, rand: () => number) {
  const d = getEnemy(e.defId);
  if (d.trait === "seal" && rand() < 0.35) {
    const sealType: "attack" | "skill" = rand() < 0.5 ? "attack" : "skill";
    e.actionCardIds = [];
    e.shownCardIds = undefined;
    e.shownIntent = undefined;
    e.intent = { kind: "debuff", seal: sealType };
    return;
  }

  const n = d.cardsPerTurn ?? 1;
  const cardIds: string[] = [];
  for (let i = 0; i < n; i++) cardIds.push(rollEnemyCard(e.defId, rand).id);
  e.actionCardIds = cardIds;
  e.intent = cardToIntent(getCard(cardIds[0]));

  if (d.trait === "liar") {
    const shown: string[] = [];
    for (let i = 0; i < n; i++) shown.push(rollEnemyCard(e.defId, rand).id);
    e.shownCardIds = shown;
    e.shownIntent = cardToIntent(getCard(shown[0]));
  } else {
    e.shownCardIds = undefined;
    e.shownIntent = undefined;
  }
}

export function living(c: CombatState) {
  return c.enemies.filter((e) => e.hp > 0);
}

function dmgDealt(base: number, strength: number, weak: number) {
  let n = base + strength;
  if (weak > 0) n = Math.floor(n * 0.75);
  return Math.max(0, n);
}

function dmgTaken(raw: number, vulnerable: number) {
  return vulnerable > 0 ? Math.floor(raw * 1.5) : raw;
}

function applyToEnemy(e: CombatEnemy, raw: number, c: CombatState, rand?: () => number) {
  let n = dmgTaken(raw, e.vulnerable);
  if (getEnemy(e.defId).trait === "nurse" && e.block > 0) n = Math.floor(n * 0.5);
  const blocked = Math.min(e.block, n);
  e.block -= blocked;
  const hp = n - blocked;
  e.hp = Math.max(0, e.hp - hp);
  c.floaters.push(floater(`-${n}`, "dmg", e.uid));
  maybeSplit(e, c, rand);
}

function maybeSplit(e: CombatEnemy, c: CombatState, rand?: () => number) {
  if (getEnemy(e.defId).trait !== "split") return;
  if (e.splitDone || e.hp <= 0 || e.hp > e.maxHp / 2) return;
  e.splitDone = true;
  const roll = rand ?? (() => 0.5);
  const clone = makeEnemy(e.defId, c.floor, roll);
  clone.hp = e.hp;
  clone.maxHp = e.maxHp;
  clone.splitDone = true;
  clone.strength = e.strength;
  c.enemies.push(clone);
  c.log.push(`${getEnemy(e.defId).name}が分かれた。`);
  c.floaters.push(floater("分裂", "info", e.uid));
}

function incoming(raw: number, c: CombatState) {
  return c.intangible > 0 ? Math.min(1, Math.max(0, raw)) : raw;
}

export function drawCards(c: CombatState, n: number, rand: () => number, player?: PlayerHook) {
  let drawn = 0;
  while (drawn < n) {
    if (c.hand.length >= 10) break;
    if (c.draw.length === 0) {
      if (c.discard.length === 0) break;
      c.draw = shuffle(c.discard, rand);
      c.discard = [];
    }
    const card = c.draw.pop();
    if (!card) break;
    const d = getCard(card.defId);
    if (d.onDraw && player) {
      runEffects(d.onDraw, c, player, null, rand, card);
      c.exhaust.push(card);
      c.floaters.push(floater(d.name, "info", "player"));
      continue;
    }
    c.hand.push(card);
    drawn++;
  }
}

function addToDiscard(c: CombatState, card: CardInst) {
  c.discard.push(card);
}

function insertIntoDraw(c: CombatState, card: CardInst, rand: () => number) {
  const idx = Math.floor(rand() * (c.draw.length + 1));
  c.draw.splice(idx, 0, card);
}

export function startCombat(
  deck: CardInst[],
  enemyIds: string[],
  player: PlayerHook,
  floor: number,
  rand: () => number,
): CombatState {
  const draw = shuffle(
    deck.map((c) => ({ ...c, uid: uid("c") })),
    rand,
  );
  const enemies = enemyIds.map((id) => makeEnemy(id, floor, rand));
  const energyBonus = powerOf(player.relics, "energy") > 0 ? 1 : 0;
  const strBonus = powerOf(player.relics, "strength");
  const drawBonus = powerOf(player.relics, "draw");
  const baseEnergy = player.baseEnergy ?? 3;
  const c: CombatState = {
    floor,
    enemies,
    draw,
    discard: [],
    exhaust: [],
    hand: [],
    energy: baseEnergy + energyBonus + (player.extraEnergyNext || 0),
    maxEnergy: baseEnergy + energyBonus,
    block: 0,
    strength: strBonus,
    dexterity: 0,
    weak: 0,
    vulnerable: 0,
    poison: 0,
    powers: [],
    cardsPlayed: 0,
    sealed: null,
    intangible: 0,
    nextAttackMul: 1,
    blockLost: 0,
    pendingPhase: 0,
    attackSelfHurt: 0,
    keepBlock: 0,
    skipDraw: 0,
    energyNext: 0,
    cold: 0,
    retainHand: 0,
    thornsVulnerable: 0,
    xSpent: 0,
    forceEnd: false,
    phase: "player",
    result: "ongoing",
    log: ["空気が、厚くなる。"],
    floaters: [],
    equipmentStats: computeEquipmentStats(player.equipped ?? {}, peekRune),
  };
  c.strength += player.extraStrength;
  drawCards(c, 5 + drawBonus, rand, player);
  if (player.sanity <= 0) {
    addToDiscard(c, makeCard("dread"));
    c.log.push("恐怖がデッキに沈む。");
  }
  return c;
}

function runEffects(
  effects: Effect[],
  c: CombatState,
  player: PlayerHook,
  targetId: string | null,
  rand: () => number,
  card?: CardInst,
) {
  for (const e of effects) {
    switch (e.t) {
      case "damage": {
        const tgt = living(c).find((x) => x.uid === targetId) ?? living(c)[0];
        if (!tgt) break;
        let n = dmgDealt(scaleN(e.n, card), c.strength, c.weak);
        if (card?.defId === "laststand" && player.hp <= player.maxHp * 0.5) n += card.upgraded ? 12 : 9;
        if (c.nextAttackMul !== 1) {
          n = Math.floor(n * c.nextAttackMul);
          c.nextAttackMul = 1;
        }
        applyToEnemy(tgt, n, c, rand);
        if (c.attackSelfHurt > 0) {
          player.hp = Math.max(1, player.hp - c.attackSelfHurt);
          c.floaters.push(floater(`-${c.attackSelfHurt}`, "dmg", "player"));
        }
        break;
      }
      case "damageAll": {
        let n = dmgDealt(scaleN(e.n, card), c.strength, c.weak);
        if (c.nextAttackMul !== 1) {
          n = Math.floor(n * c.nextAttackMul);
          c.nextAttackMul = 1;
        }
        for (const tgt of living(c)) applyToEnemy(tgt, n, c, rand);
        if (c.attackSelfHurt > 0) {
          player.hp = Math.max(1, player.hp - c.attackSelfHurt);
          c.floaters.push(floater(`-${c.attackSelfHurt}`, "dmg", "player"));
        }
        break;
      }
      case "block": {
        const n = scaleN(e.n, card) + c.dexterity;
        c.block += n;
        c.floaters.push(floater(`+${n}`, "block", "player"));
        break;
      }
      case "draw":
        drawCards(c, e.n, rand);
        break;
      case "energy":
        c.energy += e.n;
        break;
      case "strength":
        c.strength += e.n;
        break;
      case "dexterity":
        c.dexterity += e.n;
        break;
      case "heal":
        player.hp = Math.min(player.maxHp, player.hp + e.n);
        c.floaters.push(floater(`+${e.n}`, "heal", "player"));
        break;
      case "sanity":
        changeSanity(player, c, e.n);
        break;
      case "hpCost":
        player.hp = Math.max(1, player.hp - e.n);
        c.floaters.push(floater(`-${e.n}`, "dmg", "player"));
        break;
      case "weak": {
        const live = living(c);
        if (targetId) {
          const tgt = live.find((x) => x.uid === targetId);
          if (tgt) tgt.weak += e.n;
        } else {
          for (const tgt of live) tgt.weak += e.n;
        }
        break;
      }
      case "vulnerable": {
        const live = living(c);
        if (targetId) {
          const tgt = live.find((x) => x.uid === targetId);
          if (tgt) tgt.vulnerable += e.n;
        } else {
          for (const tgt of live) tgt.vulnerable += e.n;
        }
        break;
      }
      case "gainPower":
        if (!c.powers.includes(e.id)) c.powers.push(e.id);
        break;
      case "addDread":
        for (let i = 0; i < e.n; i++) insertIntoDraw(c, makeCard("dread"), rand);
        break;
      case "ifIntentAttack": {
        const tgt = living(c).find((x) => x.uid === targetId) ?? living(c)[0];
        if (tgt?.intent.kind === "attack") runEffects(e.then, c, player, targetId, rand, card);
        break;
      }
      case "ifSanityBelow":
        if (player.sanity < e.threshold) runEffects(e.then, c, player, targetId, rand, card);
        break;
      case "poison": {
        const live = living(c);
        if (targetId) {
          const tgt = live.find((x) => x.uid === targetId);
          if (tgt) tgt.poison += e.n;
        } else {
          for (const tgt of live) tgt.poison += e.n;
        }
        break;
      }
      case "intangible":
        c.intangible += e.n;
        c.floaters.push(floater("無形", "info", "player"));
        break;
      case "loseMaxHp":
        player.maxHp = Math.max(1, player.maxHp - e.n);
        player.hp = Math.min(player.hp, player.maxHp);
        c.floaters.push(floater(`最大-${e.n}`, "dmg", "player"));
        break;
      case "addCurse":
        addToDiscard(c, makeCard(e.id));
        break;
      case "nextAttackMul":
        c.nextAttackMul *= e.n;
        break;
      case "phaseDelay":
        c.pendingPhase = 1;
        break;
      case "attackSelfHurt":
        c.attackSelfHurt += e.n;
        break;
      case "blockPerEnemy": {
        const n = living(c).length * e.n;
        if (n > 0) {
          c.block += n;
          c.floaters.push(floater(`+${n}`, "block", "player"));
        }
        break;
      }
      case "damageX": {
        const tgt = living(c).find((x) => x.uid === targetId) ?? living(c)[0];
        if (tgt) applyToEnemy(tgt, dmgDealt(e.n * Math.max(0, c.xSpent), c.strength, c.weak), c, rand);
        break;
      }
      case "exhaustHand": {
        for (const h of c.hand) c.exhaust.push(h);
        c.hand = [];
        break;
      }
      case "banish": {
        for (let i = 0; i < e.n && c.hand.length; i++) {
          const j = Math.floor(rand() * c.hand.length);
          const gone = c.hand.splice(j, 1)[0];
          if (gone) c.exhaust.push(gone);
        }
        break;
      }
      case "healOnKill": {
        const tgt = living(c).find((x) => x.uid === targetId);
        if (!tgt) {
          player.hp = Math.min(player.maxHp, player.hp + e.n);
          c.floaters.push(floater(`+${e.n}`, "heal", "player"));
        }
        break;
      }
      case "retainBlock":
        c.keepBlock = 1;
        break;
      case "discardRandom": {
        for (let i = 0; i < e.n && c.hand.length; i++) {
          const j = Math.floor(rand() * c.hand.length);
          const gone = c.hand.splice(j, 1)[0];
          if (gone) addToDiscard(c, gone);
        }
        break;
      }
      case "skipDraw":
        c.skipDraw += e.n;
        break;
      case "energyNext":
        c.energyNext += e.n;
        break;
      case "cancelIntent": {
        const tgt = living(c).find((x) => x.uid === targetId) ?? living(c)[0];
        if (tgt) {
          tgt.intent = { kind: "defend", block: 0 };
          tgt.shownIntent = tgt.intent;
        }
        break;
      }
      case "endTurnMaybe":
        if (rand() < e.p) c.forceEnd = true;
        break;
      case "cold":
        c.cold += e.n;
        break;
      case "bind": {
        const tgt = living(c).find((x) => x.uid === targetId) ?? living(c)[0];
        if (tgt) tgt.bound = 1;
        break;
      }
      case "selfVulnerable":
        c.vulnerable += e.n;
        break;
      case "retainCards":
        c.retainHand = Math.max(c.retainHand, e.n);
        break;
      case "thornsVulnerable":
        c.thornsVulnerable += e.n;
        break;
      case "loseMaxHpHalf": {
        const lost = Math.floor(player.maxHp / 2);
        player.maxHp = Math.max(1, player.maxHp - lost);
        player.hp = Math.min(player.hp, player.maxHp);
        c.floaters.push(floater(`最大-${lost}`, "dmg", "player"));
        break;
      }
    }
  }
}

export function changeSanity(player: PlayerHook, c: CombatState, delta: number) {
  const before = player.sanity;
  player.sanity = Math.max(0, Math.min(player.maxSanity, player.sanity + delta));
  if (delta !== 0) {
    c.floaters.push(floater(`${delta > 0 ? "+" : ""}${delta}`, "sanity", "player"));
  }
  if (delta < 0) {
    const idolBlock = powerOf(player.relics, "sanityBlock");
    if (idolBlock > 0) {
      c.block += idolBlock;
      c.floaters.push(floater(`+${idolBlock}`, "block", "player"));
    }
    if (c.powers.includes("bloodOath")) {
      c.strength += 2;
    }
    if (before > 0 && player.sanity === 0) {
      addToDiscard(c, makeCard("dread"));
      addToDiscard(c, makeCard("dread"));
      c.log.push("正気が砕ける。恐怖がデッキを満たす。");
    }
  }
}

function finishPlay(c: CombatState, card: CardInst, defExhaust: boolean) {
  if (typeof card.charges === "number") {
    card.charges -= 1;
    if (card.charges > 0) {
      addToDiscard(c, card);
      return;
    }
    c.exhaust.push(card);
    return;
  }
  if (defExhaust || getCard(card.defId).type === "power") {
    c.exhaust.push(card);
  } else {
    addToDiscard(c, card);
  }
}

export function canPlay(c: CombatState, card: CardInst) {
  const d = getCard(card.defId);
  if (c.phase !== "player" || c.result !== "ongoing") return false;
  if (d.unplayable) return false;
  if (c.sealed && d.type === c.sealed) return false;
  if (d.xCost) return true;
  return evaluateCardEffect(card, c).cost <= c.energy;
}

export function playCard(
  c: CombatState,
  player: PlayerHook,
  cardUid: string,
  targetId: string | null,
  rand: () => number,
): { error: string | null; sfx: CombatSfx[] } {
  const empty: CombatSfx[] = [];
  if (c.phase !== "player" || c.result !== "ongoing") return { error: "自分のターンではない。", sfx: empty };
  const idx = c.hand.findIndex((x) => x.uid === cardUid);
  if (idx < 0) return { error: "手札にない。", sfx: empty };
  const card = c.hand[idx]!;
  const d = getCard(card.defId);
  if (d.unplayable) return { error: "プレイできない。", sfx: empty };
  if (c.sealed && d.type === c.sealed) return { error: `${c.sealed === "attack" ? "攻撃" : "技能"}は封じられている。`, sfx: empty };
  const evaled = evaluateCardEffect(card, c);
  const cost = d.xCost ? c.energy : evaled.cost;
  if (!d.xCost && cost > c.energy) return { error: "エネルギーが足りない。", sfx: empty };
  if (d.target === "enemy" && living(c).length > 1 && !targetId) return { error: "対象を選んでください。", sfx: empty };

  c.hand.splice(idx, 1);
  c.xSpent = d.xCost ? cost : 0;
  c.energy -= cost;
  c.cardsPlayed += 1;
  runEffects(evaled.effects, c, player, targetId, rand, card);
  if (d.type === "attack" && c.powers.includes("resolve")) {
    c.block += 3;
  }
  finishPlay(c, card, !!d.exhaust);
  checkOver(c, player);
  const sfx: CombatSfx[] = d.type === "attack" ? ["attack"] : ["skill"];
  return { error: null, sfx };
}

function checkOver(c: CombatState, player: PlayerHook) {
  if (player.hp <= 0) {
    c.result = "lose";
    c.phase = "over";
    c.log.push("肉体が、折れた。");
    return;
  }
  if (player.sanity <= 0) {
    c.result = "lose";
    c.phase = "over";
    c.log.push("正気が、0になった。器がひび割れる。");
    return;
  }
  if (living(c).length === 0) {
    c.result = "win";
    c.phase = "over";
    c.log.push("回廊は、しばらく静かだ。");
  }
}

function applyEnemyIntent(
  intent: Intent,
  e: CombatEnemy,
  c: CombatState,
  player: PlayerHook,
  rand: () => number,
  sfx: CombatSfx[],
) {
  if (intent.kind === "attack") {
    e.hadAttackThisTurn = true;
    const hits = intent.hits ?? 1;
    const base = intent.damage ?? 0;
    for (let i = 0; i < hits; i++) {
      let n = dmgDealt(base, e.strength, e.weak);
      n = dmgTaken(n, c.vulnerable);
      if (player.sanity <= 0) n += 2;
      n = incoming(n, c);
      const blocked = Math.min(c.block, n);
      c.block -= blocked;
      if (blocked > 0) c.blockLost += blocked;
      const hp = n - blocked;
      const reducedHp = applyDefensePct(hp, c.equipmentStats.defensePct);
      player.hp = Math.max(0, player.hp - reducedHp);
      c.floaters.push(floater(`-${n}`, "dmg", "player"));
      if (hp > 0) sfx.push("hurt");
      if (blocked > 0) sfx.push("block");
    }
  }
  if (intent.kind === "defend" || intent.block) {
    e.block += intent.block ?? 0;
  }
  if (intent.strength) e.strength += intent.strength;
  if (intent.weak) c.weak += intent.weak;
  if (intent.vulnerable) c.vulnerable += intent.vulnerable;
  if (intent.poison) c.poison += intent.poison;
  if (intent.sanityDrain) {
    const reduced = applyDefensePct(intent.sanityDrain, c.equipmentStats.sanResistPct);
    player.sanity = Math.max(0, player.sanity - reduced);
    c.floaters.push(floater(`-${reduced}`, "sanity", "player"));
  }
  if (intent.dread) {
    for (let i = 0; i < intent.dread; i++) insertIntoDraw(c, makeCard("dread"), rand);
    c.log.push(`${getEnemy(e.defId).name}が恐怖を注ぎ込む。`);
  }
  if (intent.seal) {
    c.sealed = intent.seal;
    c.log.push(`${getEnemy(e.defId).name}が${intent.seal === "attack" ? "攻撃" : "技能"}を封じた。`);
  }
}

function enemyAct(e: CombatEnemy, c: CombatState, player: PlayerHook, rand: () => number, sfx: CombatSfx[]) {
  if (e.hp <= 0) return;
  e.block = 0;
  e.hadAttackThisTurn = false;
  if (e.actionCardIds.length === 0) {
    applyEnemyIntent(e.intent, e, c, player, rand, sfx);
    return;
  }
  for (const id of e.actionCardIds) {
    applyEnemyIntent(cardToIntent(getCard(id)), e, c, player, rand, sfx);
  }
}

export function endTurn(c: CombatState, player: PlayerHook, rand: () => number): CombatSfx[] {
  const sfx: CombatSfx[] = [];
  if (c.phase !== "player" || c.result !== "ongoing") return sfx;
  c.phase = "enemy";

  const kept: CardInst[] = [];
  const hand = c.hand.slice();
  c.hand = [];
  if (c.retainHand > 0) {
    for (let i = 0; i < c.retainHand && hand.length; i++) {
      kept.push(hand.pop()!);
    }
    c.retainHand = 0;
  }
  for (const card of hand) {
    const d = getCard(card.defId);
    if (d.ethereal) c.exhaust.push(card);
    else addToDiscard(c, card);
  }
  c.hand = kept;

  if (c.weak > 0) c.weak -= 1;
  if (c.vulnerable > 0) c.vulnerable -= 1;
  c.sealed = null;

  if (living(c).some((e) => getEnemy(e.defId).trait === "bell") && c.block > 0) {
    c.log.push("鐘がブロックを砕いた。");
    c.floaters.push(floater("破", "info", "player"));
    c.block = 0;
  }

  if (c.cold > 0) {
    player.hp = Math.max(1, player.hp - c.cold);
    c.floaters.push(floater(`-${c.cold}`, "dmg", "player"));
  }

  if (c.poison > 0) {
    const reduced = applyDefensePct(c.poison, c.equipmentStats.poisonResistPct);
    player.hp = Math.max(1, player.hp - reduced);
    c.floaters.push(floater(`毒${reduced}`, "dmg", "player"));
  }

  for (const e of living(c)) {
    if (e.poison > 0) {
      e.hp = Math.max(0, e.hp - e.poison);
      c.floaters.push(floater(`毒${e.poison}`, "dmg", e.uid));
    }
    if (e.bound) {
      e.bound = 0;
      c.log.push(`${getEnemy(e.defId).name}は動けない。`);
    } else {
      enemyAct(e, c, player, rand, sfx);
      if (c.thornsVulnerable > 0 && e.hadAttackThisTurn) e.vulnerable += c.thornsVulnerable;
    }
    if (e.weak > 0) e.weak -= 1;
    if (e.vulnerable > 0) e.vulnerable -= 1;
    rollNextAction(e, rand);
  }
  maybeChoir(c, rand);
  checkOver(c, player);
  if (c.result !== "ongoing") return sfx;

  if (c.intangible > 0) c.intangible -= 1;
  const reflect = c.pendingPhase ? c.blockLost : 0;
  c.pendingPhase = 0;
  c.blockLost = 0;
  c.attackSelfHurt = 0;
  c.thornsVulnerable = 0;

  c.phase = "player";
  if (c.keepBlock > 0) c.keepBlock -= 1;
  else c.block = 0;
  c.energy = Math.max(0, c.maxEnergy + c.energyNext);
  c.energyNext = 0;
  const drawN = Math.max(0, 5 - c.skipDraw);
  c.skipDraw = 0;
  if (c.powers.includes("echo")) {
    const tgt = pick(living(c), rand);
    if (tgt) {
      const n = dmgDealt(4, c.strength, c.weak);
      applyToEnemy(tgt, n, c, rand);
    }
  }
  if (reflect > 0) {
    const tgt = pick(living(c), rand);
    if (tgt) {
      applyToEnemy(tgt, reflect, c, rand);
      c.log.push("遅延した力が還る。");
    }
  }
  drawCards(c, drawN, rand, player);
  checkOver(c, player);
  return sfx;
}

export function clearFloaters(c: CombatState) {
  c.floaters = [];
}

function maybeChoir(c: CombatState, rand: () => number) {
  const live = living(c).filter((e) => getEnemy(e.defId).trait === "choir");
  if (live.length !== 1) return;
  c.enemies.push(makeEnemy("choir", c.floor, rand));
  c.log.push("塩の唱者が応える。");
  c.floaters.push(floater("合唱", "info", "player"));
}

export function encounterIds(
  kind: "combat" | "elite" | "boss",
  floor: number,
  rand: () => number,
): string[] {
  if (kind === "boss") {
    if (floor >= 100) return ["mouth"];
    if (floor >= 90) return ["iha"];
    if (floor >= 80) return ["nyar"];
    if (floor >= 70) return ["bell"];
    if (floor >= 60) return ["warden"];
    if (floor >= 50) return ["herald"];
    if (floor >= 40) return ["flock", "flock"];
    if (floor >= 30) return ["nurse"];
    if (floor >= 20) return ["choir", "choir"];
    return ["priest"];
  }

  const VOID = ["migo", "shan", "starvamp", "colour"] as const;
  const voidChance = floor >= 50 ? 0.38 : floor >= 16 ? 0.28 : floor >= 8 ? 0.18 : 0;
  if (voidChance && rand() < voidChance) {
    if (kind === "elite") {
      return rand() < 0.5 ? ["starvamp"] : [pick(VOID, rand), pick(["migo", "shan"] as const, rand)];
    }
    if (rand() < (floor >= 40 ? 0.45 : 0.22)) {
      return [pick(VOID, rand), pick(VOID, rand)];
    }
    return [pick(VOID, rand)];
  }

  if (kind === "elite") {
    if (floor >= 70) return rand() < 0.5 ? ["spawn", "serpent"] : ["starveling", "byakhee"];
    if (floor >= 40) return rand() < 0.5 ? ["spawn"] : ["serpent"];
    if (floor >= 20) return ["starveling"];
    return [pick(["coral", "byakhee", "fanatic"] as const, rand)];
  }
  const pool =
    floor >= 80
      ? (["spawn", "serpent", "starveling"] as const)
      : floor >= 60
        ? (["spawn", "serpent", "byakhee"] as const)
        : floor >= 40
          ? (["serpent", "spawn", "coral"] as const)
          : floor >= 20
            ? (["acolyte", "drowned", "coral", "byakhee"] as const)
            : (["acolyte", "drowned", "coral"] as const);
  const double = floor >= 40 ? 0.5 : floor >= 12 ? 0.35 : 0.12;
  if (rand() < double) {
    return [pick(pool, rand), pick(pool, rand)];
  }
  return [pick(pool, rand)];
}

export const POWER_TEXT: Record<PowerId, string> = {
  resolve: "攻撃を出すとブロックを得る",
  echo: "ターン開始時、ランダムな敵にダメージ",
  bloodOath: "正気を失うと筋力を得る",
};
