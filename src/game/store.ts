import { create } from "zustand";
import type {
  CardInst,
  CharacterId,
  CombatState,
  GameEvent,
  MapNode,
  RewardOffer,
  Scene,
} from "./types";
import { CHARACTERS } from "./characters";
import { cardText, getCard, makeCard, rewardPool } from "./cards";
import { EVENTS } from "./events";
import { climbDepth, MAX_ACT } from "./acts";
import { generateMap, nodeById } from "./map";
import { RELIC_IDS, RELICS } from "./relics";
import {
  canPlay,
  clearFloaters,
  encounterIds,
  endTurn,
  playCard,
  startCombat,
  type PlayerHook,
} from "./combat";
import { mulberry32, pick, uid } from "./rng";
import { sfx, unlockAudio } from "./audio";

const SAVE_KEY = "cthulhu-spire-meta-v1";

interface Meta {
  bestFloor: number;
  wins: number;
  runs: number;
}

function loadMeta(): Meta {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) return JSON.parse(raw) as Meta;
  } catch {
    /* ignore */
  }
  return { bestFloor: 0, wins: 0, runs: 0 };
}

function saveMeta(m: Meta) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(m));
}

function hookFrom(s: GameStore): PlayerHook {
  return {
    hp: s.hp,
    maxHp: s.maxHp,
    sanity: s.sanity,
    maxSanity: s.maxSanity,
    relics: s.relics,
    extraStrength: s.runStrength,
    extraEnergyNext: s.extraEnergyNext,
  };
}

function applyHook(s: GameStore, h: PlayerHook) {
  s.hp = h.hp;
  s.sanity = h.sanity;
}

export interface GameStore {
  scene: Scene;
  meta: Meta;
  seed: number;
  rand: () => number;
  character: CharacterId | null;
  hp: number;
  maxHp: number;
  sanity: number;
  maxSanity: number;
  deck: CardInst[];
  relics: string[];
  runStrength: number;
  extraEnergyNext: number;
  act: number;
  map: MapNode[];
  currentId: string | null;
  visited: string[];
  floor: number;
  combat: CombatState | null;
  targeting: string | null;
  reward: RewardOffer | null;
  event: GameEvent | null;
  restMode: "choose" | "upgrade" | null;
  toast: string | null;
  begin: () => void;
  chooseClass: (id: CharacterId) => void;
  pickNode: (id: string) => void;
  play: (cardUid: string, targetId?: string | null) => void;
  setTargeting: (cardUid: string | null) => void;
  endPlayerTurn: () => void;
  pickReward: (card: CardInst | null) => void;
  skipReward: () => void;
  restHeal: () => void;
  restUpgrade: (uid: string) => void;
  resolveEvent: (choiceId: string) => void;
  dismissToast: () => void;
  toMap: () => void;
  advanceAct: () => void;
  giveUp: () => void;
}

function weightedCard(owner: CharacterId, rand: () => number): CardInst {
  const pool = rewardPool(owner);
  const roll = rand();
  const rarity = roll < 0.62 ? "common" : roll < 0.9 ? "uncommon" : "rare";
  const sliced = pool.filter((c) => c.rarity === rarity);
  const def = pick(sliced.length ? sliced : pool, rand);
  return makeCard(def.id, false);
}

export const useGame = create<GameStore>((set, get) => ({
  scene: "title",
  meta: loadMeta(),
  seed: 1,
  rand: () => Math.random(),
  character: null,
  hp: 0,
  maxHp: 0,
  sanity: 0,
  maxSanity: 0,
  deck: [],
  relics: [],
  runStrength: 0,
  extraEnergyNext: 0,
  act: 1,
  map: [],
  currentId: null,
  visited: [],
  floor: 0,
  combat: null,
  targeting: null,
  reward: null,
  event: null,
  restMode: null,
  toast: null,

  begin: () => {
    unlockAudio();
    set({ scene: "classSelect", toast: null });
  },

  chooseClass: (id) => {
    const ch = CHARACTERS[id]!;
    const seed = (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;
    const rand = mulberry32(seed);
    const map = generateMap(rand);
    const start = map.find((n) => n.type === "start")!;
    const meta = { ...get().meta, runs: get().meta.runs + 1 };
    saveMeta(meta);
    set({
      scene: "map",
      seed,
      rand,
      character: id,
      hp: ch.maxHp,
      maxHp: ch.maxHp,
      sanity: ch.maxSanity,
      maxSanity: ch.maxSanity,
      deck: ch.starter.map((cid) => makeCard(cid)),
      relics: [],
      runStrength: 0,
      extraEnergyNext: 0,
      act: 1,
      map,
      currentId: start.id,
      visited: [start.id],
      floor: 0,
      combat: null,
      reward: null,
      event: null,
      restMode: null,
      targeting: null,
      meta,
    });
  },

  pickNode: (id) => {
    const s = get();
    const node = nodeById(s.map, id);
    const cur = s.currentId ? nodeById(s.map, s.currentId) : null;
    if (!node || !cur) return;
    if (!cur.next.includes(id) && node.type !== "start") return;
    const floor = node.row;
    set({ currentId: id, visited: [...s.visited, id], floor, targeting: null });

    if (node.type === "combat" || node.type === "elite" || node.type === "boss") {
      const ids = encounterIds(node.type, floor, s.act, s.rand);
      const hook = hookFrom({ ...get(), extraEnergyNext: get().extraEnergyNext });
      const combat = startCombat(get().deck, ids, hook, climbDepth(s.act, floor), s.rand);
      applyHook(get() as GameStore, hook);
      set({
        scene: "combat",
        combat,
        extraEnergyNext: 0,
        hp: hook.hp,
        sanity: hook.sanity,
      });
      sfx.draw();
      return;
    }
    if (node.type === "rest") {
      set({ scene: "rest", restMode: "choose" });
      return;
    }
    if (node.type === "event") {
      set({ scene: "event", event: pick(EVENTS, s.rand) });
    }
  },

  setTargeting: (cardUid) => set({ targeting: cardUid }),

  play: (cardUid, targetId = null) => {
    const s = get();
    if (!s.combat) return;
    const card = s.combat.hand.find((c) => c.uid === cardUid);
    if (!card) return;
    const d = getCard(card.defId);
    if (d.target === "enemy" && s.combat.enemies.filter((e) => e.hp > 0).length > 1 && !targetId) {
      set({ targeting: cardUid });
      return;
    }
    const hook = hookFrom(s);
    const err = playCard(s.combat, hook, cardUid, targetId, s.rand);
    if (err) {
      set({ toast: err, targeting: null });
      return;
    }
    applyHook(s, hook);
    sfx.play();
    const combat = { ...s.combat, floaters: s.combat.floaters.slice() };
    const next: Partial<GameStore> = {
      combat,
      hp: hook.hp,
      sanity: hook.sanity,
      targeting: null,
    };
    if (combat.result === "win") {
      sfx.win();
      next.scene = "reward";
      next.reward = makeReward(s);
      if (s.relics.includes("coin")) {
        next.hp = Math.min(s.maxHp, hook.hp + 6);
      }
    } else if (combat.result === "lose") {
      sfx.lose();
      const meta = {
        ...s.meta,
        bestFloor: Math.max(s.meta.bestFloor, climbDepth(s.act, s.floor)),
      };
      saveMeta(meta);
      next.scene = "defeat";
      next.meta = meta;
    }
    set(next);
    setTimeout(() => {
      const c = get().combat;
      if (c) {
        clearFloaters(c);
        set({ combat: { ...c } });
      }
    }, 700);
  },

  endPlayerTurn: () => {
    const s = get();
    if (!s.combat) return;
    const hook = hookFrom(s);
    endTurn(s.combat, hook, s.rand);
    applyHook(s, hook);
    const combat = { ...s.combat };
    const next: Partial<GameStore> = { combat, hp: hook.hp, sanity: hook.sanity, targeting: null };
    if (combat.result === "win") {
      sfx.win();
      next.scene = "reward";
      next.reward = makeReward(s);
    } else if (combat.result === "lose") {
      sfx.lose();
      const meta = { ...s.meta, bestFloor: Math.max(s.meta.bestFloor, climbDepth(s.act, s.floor)) };
      saveMeta(meta);
      next.scene = "defeat";
      next.meta = meta;
    }
    set(next);
    setTimeout(() => {
      const c = get().combat;
      if (c) {
        clearFloaters(c);
        set({ combat: { ...c } });
      }
    }, 700);
  },

  pickReward: (card) => {
    const s = get();
    const deck = card ? [...s.deck, { ...card, uid: uid("c") }] : s.deck;
    let hp = s.hp;
    let maxHp = s.maxHp;
    const relics = s.relics.slice();
    if (s.reward?.relic && !relics.includes(s.reward.relic)) {
      relics.push(s.reward.relic);
      if (s.reward.relic === "coral") {
        maxHp += 8;
        hp += 8;
      }
    }
    const node = s.currentId ? nodeById(s.map, s.currentId) : null;
    if (node?.type === "boss") {
      const depth = climbDepth(s.act, s.floor);
      const meta = {
        ...s.meta,
        bestFloor: Math.max(s.meta.bestFloor, depth),
        wins: s.act >= MAX_ACT ? s.meta.wins + 1 : s.meta.wins,
      };
      saveMeta(meta);
      if (s.act >= MAX_ACT) {
        set({ scene: "victory", deck, relics, hp, maxHp, meta, reward: null, combat: null });
        return;
      }
      set({
        scene: "between",
        deck,
        relics,
        hp,
        maxHp,
        meta,
        reward: null,
        combat: null,
        toast: null,
      });
      return;
    }
    set({ scene: "map", deck, relics, hp, maxHp, reward: null, combat: null });
  },

  skipReward: () => get().pickReward(null),

  restHeal: () => {
    const s = get();
    const heal = Math.round(s.maxHp * 0.32);
    set({
      hp: Math.min(s.maxHp, s.hp + heal),
      sanity: Math.min(s.maxSanity, s.sanity + 6),
      scene: "map",
      restMode: null,
      toast: `${heal} 体力と正気6を回復した。`,
    });
  },

  restUpgrade: (cardUid) => {
    const s = get();
    const deck = s.deck.map((c) => (c.uid === cardUid ? { ...c, upgraded: true } : c));
    const card = deck.find((c) => c.uid === cardUid);
    set({
      deck,
      scene: "map",
      restMode: null,
      toast: card ? `${getCard(card.defId).name}を強化した。` : null,
    });
  },

  resolveEvent: (choiceId) => {
    const s = get();
    const ev = s.event;
    if (!ev) return;
    let hp = s.hp;
    let maxHp = s.maxHp;
    let sanity = s.sanity;
    let deck = s.deck.slice();
    let relics = s.relics.slice();
    let runStrength = s.runStrength;
    let extraEnergyNext = s.extraEnergyNext;
    let toast = "";

    if (ev.id === "tome") {
      if (choiceId === "read") {
        sanity = Math.max(0, sanity - 8);
        const up = deck.find((c) => !c.upgraded);
        if (up) up.upgraded = true;
        deck.push(makeCard("tome"));
        toast = "頁が、瞳の裏に残る。正気-8。禁断の書を得た。";
      } else toast = "本は、本の文法に任せる。";
    } else if (ev.id === "well") {
      if (choiceId === "drink") {
        hp = Math.min(maxHp, hp + 18);
        sanity = Math.max(0, sanity - 7);
        toast = "水ではなかった。体力+18、正気-7。";
      } else {
        hp = Math.min(maxHp, hp + 8);
        sanity = Math.min(s.maxSanity, sanity + 4);
        toast = "手が、きれいになる。体力+8、正気+4。";
      }
    } else if (ev.id === "cult") {
      if (choiceId === "kneel") {
        sanity = Math.max(0, sanity - 10);
        const avail = RELIC_IDS.filter((id) => !relics.includes(id));
        if (avail.length) {
          const r = pick(avail, s.rand);
          relics.push(r);
          if (r === "coral") {
            maxHp += 8;
            hp += 8;
          }
          toast = `${RELICS[r]!.name}を渡された。正気-10。`;
        } else toast = "もう、何もくれない。正気-10。";
      } else {
        hp = Math.max(1, hp - 8);
        sanity = Math.min(s.maxSanity, sanity + 6);
        toast = "名を口にしなかった。体力-8、正気+6。";
      }
    } else if (ev.id === "mirror") {
      if (choiceId === "follow") {
        extraEnergyNext = 2;
        toast = "もう一人の自分が、最初のターンを払う。";
      } else {
        hp = Math.max(1, hp - 10);
        runStrength += 2;
        toast = "肺にガラス。体力-10。登攀中、筋力+2。";
      }
    }

    set({
      hp,
      maxHp,
      sanity,
      deck,
      relics,
      runStrength,
      extraEnergyNext,
      event: null,
      scene: "map",
      toast,
    });
  },

  dismissToast: () => set({ toast: null }),
  toMap: () => set({ scene: "map", combat: null, reward: null, event: null, restMode: null }),
  advanceAct: () => {
    const s = get();
    if (s.act >= MAX_ACT) return;
    const map = generateMap(s.rand);
    const start = map.find((n) => n.type === "start");
    if (!start) return;
    const heal = Math.round(s.maxHp * 0.22);
    const hp = Math.min(s.maxHp, s.hp + heal);
    const sanity = Math.min(s.maxSanity, s.sanity + 8);
    const nextAct = s.act + 1;
    set({
      act: nextAct,
      map,
      currentId: start.id,
      visited: [start.id],
      floor: 0,
      hp,
      sanity,
      scene: "map",
      combat: null,
      reward: null,
      event: null,
      restMode: null,
      targeting: null,
      extraEnergyNext: 0,
      toast: `肉体・デッキ・遺物はそのまま。体力+${heal}、正気+8。`,
    });
  },
  giveUp: () => set({ scene: "title", combat: null }),
}));

function makeReward(s: GameStore): RewardOffer {
  const node = s.currentId ? nodeById(s.map, s.currentId) : null;
  const owner = s.character ?? "investigator";
  const cards = [weightedCard(owner, s.rand), weightedCard(owner, s.rand), weightedCard(owner, s.rand)];
  // unique-ish
  const seen = new Set<string>();
  const unique = cards.map((c) => {
    if (!seen.has(c.defId)) {
      seen.add(c.defId);
      return c;
    }
    const alt = pick(
      rewardPool(owner).filter((d) => !seen.has(d.id)),
      s.rand,
    );
    seen.add(alt.id);
    return makeCard(alt.id);
  });
  let relic: string | undefined;
  if (node?.type === "elite" || node?.type === "boss") {
    const avail = RELIC_IDS.filter((id) => !s.relics.includes(id));
    if (avail.length) relic = pick(avail, s.rand);
  }
  return { cards: unique, relic };
}

export { cardText, canPlay };
