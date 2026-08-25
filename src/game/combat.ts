import type {
  CardInst,
  CombatEnemy,
  CombatState,
  Effect,
  Floater,
  Intent,
  PowerId,
  RelicInstance,
} from "./types";
import { cardCost, cardEffects, getCard, makeCard } from "./cards";
import { getEnemy } from "./enemies";
import { powerOf } from "./relics";
import { pick, shuffle, uid } from "./rng";

export interface PlayerHook {
  hp: number;
  maxHp: number;
  sanity: number;
  maxSanity: number;
  relics: RelicInstance[];
  extraStrength: number;
  extraEnergyNext: number;
}

function floater(text: string, kind: Floater["kind"], who: Floater["who"]): Floater {
  return { id: uid("f"), text, kind, who };
}

function scaleHp(base: number, floor: number) {
  return Math.round(base * (1 + floor * 0.07));
}

export function makeEnemy(defId: string, floor: number, rand: () => number): CombatEnemy {
  const d = getEnemy(defId);
  const maxHp = scaleHp(d.maxHp, floor);
  const patternIndex = Math.floor(rand() * d.pattern.length);
  return {
    uid: uid("e"),
    defId,
    hp: maxHp,
    maxHp,
    block: 0,
    strength: 0,
    weak: 0,
    vulnerable: 0,
    patternIndex,
    intent: d.pattern[patternIndex]!,
  };
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

function applyToEnemy(e: CombatEnemy, raw: number, c: CombatState) {
  const n = dmgTaken(raw, e.vulnerable);
  const blocked = Math.min(e.block, n);
  e.block -= blocked;
  const hp = n - blocked;
  e.hp = Math.max(0, e.hp - hp);
  c.floaters.push(floater(`-${n}`, "dmg", e.uid));
}

export function drawCards(c: CombatState, n: number, rand: () => number) {
  for (let i = 0; i < n; i++) {
    if (c.hand.length >= 10) break;
    if (c.draw.length === 0) {
      if (c.discard.length === 0) break;
      c.draw = shuffle(c.discard, rand);
      c.discard = [];
    }
    const card = c.draw.pop();
    if (card) c.hand.push(card);
  }
}

function addToDiscard(c: CombatState, card: CardInst) {
  c.discard.push(card);
}

export function startCombat(
  deck: CardInst[],
  enemyIds: string[],
  player: PlayerHook,
  floor: number,
  rand: () => number,
): CombatState {
  const draw = shuffle(deck.map((c) => ({ ...c, uid: uid("c") })), rand);
  const enemies = enemyIds.map((id) => makeEnemy(id, floor, rand));
  const energyBonus = powerOf(player.relics, "energy") > 0 ? 1 : 0;
  const strBonus = powerOf(player.relics, "strength");
  const drawBonus = powerOf(player.relics, "draw");
  const c: CombatState = {
    enemies,
    draw,
    discard: [],
    exhaust: [],
    hand: [],
    energy: 3 + energyBonus + (player.extraEnergyNext || 0),
    maxEnergy: 3 + energyBonus,
    block: 0,
    strength: strBonus,
    dexterity: 0,
    weak: 0,
    vulnerable: 0,
    powers: [],
    cardsPlayed: 0,
    phase: "player",
    result: "ongoing",
    log: ["空気が、厚くなる。"],
    floaters: [],
  };
  c.strength += player.extraStrength;
  const firstDraw = 5 + drawBonus;
  drawCards(c, firstDraw, rand);
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
        let n = dmgDealt(e.n, c.strength, c.weak);
        if (card?.defId === "laststand" && player.hp <= player.maxHp * 0.5) n += card.upgraded ? 12 : 9;
        applyToEnemy(tgt, n, c);
        break;
      }
      case "damageAll": {
        const n = dmgDealt(e.n, c.strength, c.weak);
        for (const tgt of living(c)) applyToEnemy(tgt, n, c);
        break;
      }
      case "block": {
        const n = e.n + c.dexterity;
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
        const tgt = living(c).find((x) => x.uid === targetId) ?? living(c)[0];
        if (tgt) tgt.vulnerable += e.n;
        break;
      }
      case "gainPower":
        if (!c.powers.includes(e.id)) c.powers.push(e.id);
        break;
      case "addDread":
        for (let i = 0; i < e.n; i++) addToDiscard(c, makeCard("dread"));
        break;
      case "ifIntentAttack": {
        const tgt = living(c).find((x) => x.uid === targetId) ?? living(c)[0];
        if (tgt?.intent.kind === "attack") runEffects(e.then, c, player, targetId, rand, card);
        break;
      }
      case "ifSanityBelow":
        if (player.sanity < e.threshold) runEffects(e.then, c, player, targetId, rand, card);
        break;
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
      const amt = 2;
      c.strength += amt;
    }
    if (before > 0 && player.sanity === 0) {
      addToDiscard(c, makeCard("dread"));
      addToDiscard(c, makeCard("dread"));
      c.log.push("正気が砕ける。恐怖がデッキを満たす。");
    }
  }
}

function finishPlay(c: CombatState, card: CardInst, defExhaust: boolean) {
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
  return cardCost(card) <= c.energy;
}

export function playCard(
  c: CombatState,
  player: PlayerHook,
  cardUid: string,
  targetId: string | null,
  rand: () => number,
): string | null {
  if (c.phase !== "player" || c.result !== "ongoing") return "自分のターンではない。";
  const idx = c.hand.findIndex((x) => x.uid === cardUid);
  if (idx < 0) return "手札にない。";
  const card = c.hand[idx]!;
  const d = getCard(card.defId);
  if (d.unplayable) return "プレイできない。";
  const cost = cardCost(card);
  if (cost > c.energy) return "エネルギーが足りない。";
  if (d.target === "enemy" && living(c).length > 1 && !targetId) return "対象を選んでください。";

  c.hand.splice(idx, 1);
  c.energy -= cost;
  c.cardsPlayed += 1;
  runEffects(cardEffects(card), c, player, targetId, rand, card);
  if (d.type === "attack" && c.powers.includes("resolve")) {
    const n = card.upgraded && d.id === "resolve" ? 4 : 3;
    // Resolve power uses 3, upgraded resolve card is the power itself. Keep 3/4 based on whether upgraded resolve is in powers - we don't store upgraded powers. Use 3 always, 4 if echo... Keep 3.
    c.block += 3;
  }
  finishPlay(c, card, !!d.exhaust);
  checkOver(c, player);
  return null;
}

function checkOver(c: CombatState, player: PlayerHook) {
  if (player.hp <= 0) {
    c.result = "lose";
    c.phase = "over";
    c.log.push("肉体が、折れた。");
    return;
  }
  if (living(c).length === 0) {
    c.result = "win";
    c.phase = "over";
    c.log.push("回廊は、しばらく静かだ。");
  }
}

function advanceIntent(e: CombatEnemy) {
  const d = getEnemy(e.defId);
  e.patternIndex = (e.patternIndex + 1) % d.pattern.length;
  e.intent = d.pattern[e.patternIndex]!;
}

function enemyAct(e: CombatEnemy, c: CombatState, player: PlayerHook, rand: () => number) {
  if (e.hp <= 0) return;
  e.block = 0;
  const intent: Intent = e.intent;
  if (intent.kind === "attack") {
    const hits = intent.hits ?? 1;
    const base = intent.damage ?? 0;
    for (let i = 0; i < hits; i++) {
      let n = dmgDealt(base, e.strength, e.weak);
      n = dmgTaken(n, c.vulnerable);
      if (player.sanity <= 0) n += 2;
      const blocked = Math.min(c.block, n);
      c.block -= blocked;
      const hp = n - blocked;
      player.hp = Math.max(0, player.hp - hp);
      c.floaters.push(floater(`-${n}`, "dmg", "player"));
    }
  }
  if (intent.kind === "defend" || intent.block) {
    e.block += intent.block ?? 0;
  }
  if (intent.strength) e.strength += intent.strength;
  if (intent.weak) c.weak += intent.weak;
  if (intent.dread) {
    for (let i = 0; i < intent.dread; i++) addToDiscard(c, makeCard("dread"));
    c.log.push(`${getEnemy(e.defId).name}が恐怖を注ぎ込む。`);
  }
  void rand;
}

export function endTurn(c: CombatState, player: PlayerHook, rand: () => number) {
  if (c.phase !== "player" || c.result !== "ongoing") return;
  c.phase = "enemy";

  const kept: CardInst[] = [];
  for (const card of c.hand) {
    const d = getCard(card.defId);
    if (d.ethereal) c.exhaust.push(card);
    else addToDiscard(c, card);
  }
  c.hand = kept;

  if (c.weak > 0) c.weak -= 1;
  if (c.vulnerable > 0) c.vulnerable -= 1;

  for (const e of living(c)) {
    enemyAct(e, c, player, rand);
    if (e.weak > 0) e.weak -= 1;
    if (e.vulnerable > 0) e.vulnerable -= 1;
    advanceIntent(e);
  }
  checkOver(c, player);
  if (c.result !== "ongoing") return;

  // player turn start
  c.phase = "player";
  c.block = 0;
  c.energy = c.maxEnergy;
  if (c.powers.includes("echo")) {
    const tgt = pick(living(c), rand);
    if (tgt) {
      const n = dmgDealt(4, c.strength, c.weak);
      applyToEnemy(tgt, n, c);
    }
  }
  drawCards(c, 5, rand);
  checkOver(c, player);
}

export function clearFloaters(c: CombatState) {
  c.floaters = [];
}

export function encounterIds(
  kind: "combat" | "elite" | "boss",
  floor: number,
  act: number,
  rand: () => number,
): string[] {
  if (kind === "boss") {
    if (act >= 3) return ["mouth"];
    if (act === 2) return ["herald"];
    return ["priest"];
  }
  if (kind === "elite") {
    if (act >= 3) return ["starveling", "byakhee"];
    return ["starveling"];
  }
  const pool = ["acolyte", "drowned", "byakhee"] as const;
  const double = act >= 2 ? 0.55 : floor >= 5 ? 0.45 : 0.12;
  if (rand() < double) {
    return [pick(pool, rand), pick(["acolyte", "drowned"] as const, rand)];
  }
  return [pick(pool, rand)];
}

export const POWER_TEXT: Record<PowerId, string> = {
  resolve: "攻撃を出すとブロックを得る",
  echo: "ターン開始時、ランダムな敵にダメージ",
  bloodOath: "正気を失うと筋力を得る",
};
