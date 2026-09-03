import { create } from "zustand";
import type {
  CardInst,
  CharacterId,
  CombatState,
  FloorSpec,
  GameEvent,
  PlayerProfile,
  PlayerStats,
  RelicInstance,
  RewardOffer,
  Scene,
  VillageState,
} from "./types";
import { cardText, getCard, makeCard, rewardPool } from "./cards";
import { EVENTS } from "./events";
import { getEnemy } from "./enemies";
import { DEMO_MAX_FLOOR, generateRunTable, layerLabel } from "./floors";
import { pickRelicTemplate, powerOf, relicLabel, rollRelic } from "./relics";
import { RUNE_CATALOG, rollRune } from "./runes";
import {
  canPlay,
  clearFloaters,
  encounterIds,
  endTurn,
  playCard,
  startCombat,
  type PlayerHook,
} from "./combat";
import { mulberry32, pick, uid, weightedPick } from "./rng";
import { playBgm, playCues, sfx, stopBgm, unlockAudio } from "./audio";
import {
  clampStats,
  derivedVitals,
  homeScene,
  loadProfile,
  MADNESS_STEP,
  MAX_LOADOUT,
  saveProfile,
  STAT_MIN,
  statSum,
  totalPoints,
  wipeProfile,
} from "./profile";
import { equippedRelics, loadoutDeck, loadoutError } from "./cardEvaluator";
import { useCollectionStore } from "@/store/useCollectionStore";
import { nextUnread } from "./grimoire";
import { forgeCard, makeSmith, SHOP_PRICE } from "./smith";

function hookFrom(s: GameStore): PlayerHook {
  const vitals = derivedVitals(s.profile.stats, s.profile.madness);
  return {
    hp: s.hp,
    maxHp: s.maxHp,
    sanity: s.sanity,
    maxSanity: s.maxSanity,
    relics: s.relics,
    extraStrength: s.runStrength,
    extraEnergyNext: s.extraEnergyNext,
    baseEnergy: vitals.energy,
  };
}

function applyHook(s: GameStore, h: PlayerHook) {
  s.hp = h.hp;
  s.maxHp = h.maxHp;
  s.sanity = h.sanity;
}

function persist(profile: PlayerProfile) {
  saveProfile(profile);
}

function specAt(s: { runFloors: FloorSpec[]; floor: number }): FloorSpec | undefined {
  return s.runFloors[s.floor - 1];
}

export interface GameStore {
  scene: Scene;
  profile: PlayerProfile;
  seed: number;
  rand: () => number;
  character: CharacterId | null;
  playerName: string;
  hp: number;
  maxHp: number;
  sanity: number;
  maxSanity: number;
  deck: CardInst[];
  relics: RelicInstance[];
  runStrength: number;
  extraEnergyNext: number;
  act: number;
  runFloors: FloorSpec[];
  floor: number;
  combat: CombatState | null;
  targeting: string | null;
  reward: RewardOffer | null;
  event: GameEvent | null;
  restMode: "hub" | "inn" | "pub" | "smith" | "upgrade" | "choose" | "deck" | null;
  toast: string | null;
  shells: number;
  village: VillageState | null;
  inspectDeck: boolean;

  begin: () => void;
  toTitle: () => void;
  setPlayerName: (name: string) => void;
  setStat: (key: keyof PlayerStats, value: number) => void;
  toggleLoadout: (uid: string) => void;
  startRun: () => void;
  play: (cardUid: string, targetId?: string | null) => void;
  setTargeting: (cardUid: string | null) => void;
  endPlayerTurn: () => void;
  claimReward: () => void;
  restHeal: () => void;
  restUpgrade: (uid: string) => void;
  visitVillage: (room: GameStore["restMode"]) => void;
  innStay: (tier: 10 | 20 | 30) => void;
  buyBeer: () => void;
  buyGood: (uid: string) => void;
  forgeAtSmith: (uid: string) => void;
  leaveVillage: () => void;
  setInspectDeck: (on: boolean) => void;
  applyLoadoutToRun: () => boolean;
  resumeDescent: () => void;
  extractToHub: () => void;
  resolveEvent: (choiceId: string) => void;
  dismissToast: () => void;
  continueClimb: () => void;
  giveUp: () => void;
  spendRite: (key: keyof PlayerStats) => void;
  finishPrologue: () => void;
  turnGrimoirePage: () => void;
  acceptShatter: () => void;
  engraveRelic: (uid: string) => void;
}

function weightedCard(owner: CharacterId, rand: () => number): CardInst {
  const pool = rewardPool(owner);
  const roll = rand();
  const rarity = roll < 0.62 ? "common" : roll < 0.9 ? "uncommon" : "rare";
  const sliced = pool.filter((c) => c.rarity === rarity);
  const def = pick(sliced.length ? sliced : pool, rand);
  return makeCard(def.id, false);
}

function starterPath(stats: PlayerStats): CharacterId {
  return stats.hp >= stats.san ? "investigator" : "cultist";
}

function keepRunRelics(profile: PlayerProfile, relics: RelicInstance[]): PlayerProfile {
  const have = new Set(profile.collection.map((r) => r.uid));
  const extra = relics.filter((r) => !have.has(r.uid));
  if (!extra.length) return profile;
  const loadoutIds = profile.loadoutIds.slice();
  for (const r of extra) {
    if (loadoutIds.length < MAX_LOADOUT && !loadoutIds.includes(r.uid)) loadoutIds.push(r.uid);
  }
  return { ...profile, collection: [...profile.collection, ...extra], loadoutIds };
}

function acquireRelic(
  profile: PlayerProfile,
  relics: RelicInstance[],
  inst: RelicInstance,
): { profile: PlayerProfile; relics: RelicInstance[] } {
  const nextRelics = relics.some((r) => r.uid === inst.uid) ? relics : [...relics, inst];
  return { profile: keepRunRelics(profile, nextRelics), relics: nextRelics };
}

function isStatusCard(card: CardInst): boolean {
  const d = getCard(card.defId);
  return d.type === "status" || d.rarity === "status";
}

function mergeLoadoutDeck(current: CardInst[]): CardInst[] {
  return [...loadoutDeck(), ...current.filter(isStatusCard)];
}

function markDefeat(s: GameStore): PlayerProfile {
  const bestFloor = Math.max(s.profile.bestFloor, s.floor);
  const budget = totalPoints({ bestFloor });
  const profile = keepRunRelics(
    {
      ...s.profile,
      bestFloor,
      earnedPoints: budget,
      unspentPoints: Math.max(0, budget - statSum(s.profile.stats)),
      sanity: s.sanity,
    },
    s.relics,
  );
  persist(profile);
  return profile;
}

function rollShells(s: GameStore): number {
  const spec = specAt(s);
  if (spec?.type === "boss") {
    if (s.floor % 50 === 0) return 40 + Math.floor(s.rand() * 21);
    return 9 + Math.floor(s.rand() * 7);
  }
  const n = s.combat?.enemies.length ?? 1;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += Math.floor(s.rand() * 3);
  return sum;
}

function presentCombat(
  get: () => GameStore,
  set: (p: Partial<GameStore>) => void,
  combat: CombatState,
  hook: PlayerHook,
) {
  set({
    combat,
    hp: hook.hp,
    maxHp: hook.maxHp,
    sanity: hook.sanity,
    targeting: null,
    deck: [...combat.hand, ...combat.draw, ...combat.discard, ...combat.exhaust],
  });
  if (combat.result === "win") {
    sfx.win();
    window.setTimeout(() => {
      const cur = get();
      if (cur.combat?.result !== "win") return;
      playBgm("reward");
      const heal = powerOf(cur.relics, "postHeal");
      const gained = rollShells(cur);
      set({
        scene: "reward",
        reward: makeReward(cur),
        hp: heal > 0 ? Math.min(cur.maxHp, cur.hp + heal) : cur.hp,
        shells: cur.shells + gained,
        toast: gained ? `きれいな貝殻 +${gained}` : cur.toast,
      });
    }, 920);
  } else if (combat.result === "lose") {
    sfx.lose();
    window.setTimeout(() => {
      const cur = get();
      if (cur.combat?.result !== "lose") return;
      stopBgm();
      const profile = markDefeat(cur);
      if (cur.sanity <= 0 || cur.maxSanity <= 0) {
        set({
          scene: "shatter",
          profile: wipeProfile(),
          combat: null,
          runFloors: [],
          floor: 0,
          deck: [],
          relics: [],
        });
        return;
      }
      set({ scene: "defeat", profile });
    }, 560);
  }
  window.setTimeout(() => {
    const c = get().combat;
    if (c) {
      clearFloaters(c);
      set({ combat: { ...c } });
    }
  }, 700);
}

export const useGame = create<GameStore>((set, get) => {
  function enterFloor(floor: number, carry?: Partial<GameStore>) {
    const s = { ...get(), ...carry };
    if (floor > (s.runFloors.length || DEMO_MAX_FLOOR)) {
      const bestFloor = Math.max(s.profile.bestFloor, s.floor);
      const budget = totalPoints({ bestFloor });
      const profile = keepRunRelics(
        {
          ...s.profile,
          bestFloor,
          earnedPoints: budget,
          unspentPoints: Math.max(0, budget - statSum(s.profile.stats)),
          wins: s.profile.wins + 1,
          sanity: s.sanity,
        },
        s.relics,
      );
      persist(profile);
      stopBgm();
      set({
        ...carry,
        scene: "victory",
        profile,
        combat: null,
        reward: null,
        event: null,
        restMode: null,
      });
      return;
    }
    const spec = s.runFloors[floor - 1];
    if (!spec) return;
    sfx.step();

    const base = {
      ...carry,
      floor,
      targeting: null as string | null,
      combat: null as CombatState | null,
      reward: null as RewardOffer | null,
      event: null as GameEvent | null,
      restMode: null as GameStore["restMode"],
    };

    if (spec.type === "combat" || spec.type === "elite" || spec.type === "boss") {
      playBgm(spec.type === "boss" ? "boss" : "combat");
      const ids = spec.enemyIds?.length ? spec.enemyIds : encounterIds(spec.type, floor, s.rand);
      const hook = hookFrom(s as GameStore);
      const combat = startCombat(s.deck, ids, hook, floor, s.rand);
      set({
        ...base,
        scene: "combat",
        combat,
        extraEnergyNext: 0,
        hp: hook.hp,
        sanity: hook.sanity,
      });
      return;
    }
    if (spec.type === "rest") {
      playBgm("rest");
      set({ ...base, scene: "rest", restMode: "hub", village: { smith: makeSmith(s.rand), beerSold: false } });
      return;
    }
    playBgm("event");
    const ev = EVENTS.find((e) => e.id === spec.eventId) ?? pick(EVENTS, s.rand);
    set({ ...base, scene: "event", event: ev });
  }

  function finishAdvance(carry: Partial<GameStore>) {
    const s = { ...get(), ...carry };
    const spec = specAt(s);
    if (spec?.type === "boss" && s.floor % 10 === 0 && s.floor < DEMO_MAX_FLOOR) {
      const bestFloor = Math.max(s.profile.bestFloor, s.floor);
      const budget = totalPoints({ bestFloor });
      const profile = keepRunRelics(
        {
          ...s.profile,
          bestFloor,
          earnedPoints: budget,
          unspentPoints: Math.max(0, budget - statSum(s.profile.stats)),
          sanity: s.sanity,
        },
        s.relics,
      );
      persist(profile);
      playBgm("rest");
      set({
        ...carry,
        scene: "hub",
        profile,
        reward: null,
        combat: null,
        event: null,
        restMode: null,
        inspectDeck: false,
        toast: `${layerLabel(s.floor)}を越えた。デッキを組み、先へ沈むか拠点へ戻れる。`,
      });
      return;
    }
    if (s.floor >= DEMO_MAX_FLOOR) {
      const profile = keepRunRelics(
        {
          ...s.profile,
          bestFloor: Math.max(s.profile.bestFloor, s.floor),
          wins: s.profile.wins + 1,
          sanity: s.sanity,
        },
        s.relics,
      );
      persist(profile);
      stopBgm();
      set({
        ...carry,
        scene: "victory",
        profile,
        reward: null,
        combat: null,
        event: null,
      });
      return;
    }
    enterFloor(s.floor + 1, { ...carry, reward: null, event: null, combat: null });
  }

  function afterGain(carry: Partial<GameStore>) {
    finishAdvance(carry);
  }

  return {
    scene: homeScene(loadProfile()),
    profile: loadProfile(),
    seed: 1,
    rand: () => Math.random(),
    character: null,
    playerName: loadProfile().playerName || "",
    hp: 0,
    maxHp: 0,
    sanity: 0,
    maxSanity: 0,
    deck: [],
    relics: [],
    runStrength: 0,
    extraEnergyNext: 0,
    act: 1,
    runFloors: [],
    floor: 0,
    combat: null,
    targeting: null,
    reward: null,
    event: null,
    restMode: null,
    toast: null,
    shells: 0,
    village: null,
    inspectDeck: false,

    begin: () => {
      unlockAudio();
      stopBgm();
      const profile = loadProfile();
      const seed = (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;
      const rand = mulberry32(seed);
      const runFloors = generateRunTable(rand);
      set({
        scene: "hub",
        profile,
        playerName: profile.playerName,
        seed,
        rand,
        runFloors,
        floor: 0,
        toast: null,
      });
      sfx.ui();
    },

    toTitle: () => {
      stopBgm();
      playBgm("title");
      set({ scene: "title", combat: null, floor: 0, toast: null });
      sfx.ui();
    },

    setPlayerName: (name) => {
      const profile = { ...get().profile, playerName: name.slice(0, 16) };
      persist(profile);
      set({ playerName: profile.playerName, profile });
    },

    setStat: (key, value) => {
      const profile = { ...get().profile, stats: { ...get().profile.stats } };
      const next = Math.max(STAT_MIN, value | 0);
      const others = statSum(profile.stats) - profile.stats[key];
      const budget = totalPoints(profile);
      if (others + next > budget) return;
      profile.stats[key] = next;
      profile.stats = clampStats(profile.stats);
      profile.earnedPoints = budget;
      profile.unspentPoints = Math.max(0, budget - statSum(profile.stats));
      persist(profile);
      set({ profile });
      sfx.select();
    },

    toggleLoadout: (uid) => {
      const profile = { ...get().profile };
      const ids = profile.loadoutIds.slice();
      const i = ids.indexOf(uid);
      if (i >= 0) ids.splice(i, 1);
      else {
        if (ids.length >= MAX_LOADOUT) {
          set({ toast: `持込は${MAX_LOADOUT}つまで。` });
          sfx.hurt();
          return;
        }
        if (!profile.collection.some((r) => r.uid === uid)) return;
        ids.push(uid);
      }
      profile.loadoutIds = ids;
      persist(profile);
      set({ profile, toast: null });
      sfx.select();
    },

    startRun: () => {
      const s = get();
      const profile = { ...s.profile };
      const name = (s.playerName || profile.playerName || "").trim().slice(0, 16);
      profile.playerName = name;
      profile.stats = clampStats(profile.stats);
      const budget = totalPoints(profile);
      if (statSum(profile.stats) > budget) {
        set({ toast: "割り振りが所持ポイントを超えています。" });
        return;
      }
      if (!name) {
        set({ toast: "名前を入れてください。" });
        return;
      }
      const deckErr = loadoutError();
      if (deckErr) {
        set({ toast: deckErr });
        sfx.hurt();
        return;
      }

      profile.runs += 1;
      persist(profile);

      const path = starterPath(profile.stats);
      const vitals = derivedVitals(profile.stats, profile.madness);

      let seed = s.seed;
      let rand = s.rand;
      let runFloors = s.runFloors;
      if (!runFloors.length) {
        seed = (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;
        rand = mulberry32(seed);
        runFloors = generateRunTable(rand);
      }

      const deck = loadoutDeck();
      const loadout = equippedRelics(profile);
      const maxHp = vitals.maxHp + powerOf(loadout, "maxHp");
      const maxSanity = vitals.maxSanity + powerOf(loadout, "maxSanity");
      if (maxSanity <= 0) {
        set({ scene: "shatter", profile: wipeProfile(), combat: null, runFloors: [], floor: 0 });
        return;
      }
      const sanity = profile.sanity == null ? maxSanity : Math.min(profile.sanity, maxSanity);
      if (sanity <= 0) {
        set({ scene: "shatter", profile: wipeProfile(), combat: null, runFloors: [], floor: 0 });
        return;
      }

      unlockAudio();
      sfx.reward();

      set({
        profile,
        playerName: name,
        seed,
        rand,
        runFloors,
        character: path,
        hp: maxHp,
        maxHp,
        sanity,
        maxSanity,
        deck,
        relics: loadout,
        runStrength: vitals.strength + powerOf(loadout, "strength"),
        extraEnergyNext: 0,
        act: 1,
        combat: null,
        reward: null,
        event: null,
        restMode: null,
        targeting: null,
        toast: null,
        shells: 0,
        village: null,
        inspectDeck: false,
      });
      if (!profile.seenRlyeh) {
        set({ scene: "prologue", floor: 0 });
        return;
      }
      enterFloor(1);
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
        sfx.select();
        return;
      }
      const hook = hookFrom(s);
      const played = playCard(s.combat, hook, cardUid, targetId, s.rand);
      if (played.error) {
        set({ toast: played.error, targeting: null });
        return;
      }
      applyHook(s, hook);
      playCues(played.sfx);
      const combat = { ...s.combat, floaters: s.combat.floaters.slice() };
      presentCombat(get, set, combat, hook);
      const after = get().combat;
      if (after?.forceEnd && after.result === "ongoing") {
        get().endPlayerTurn();
      }
    },

    endPlayerTurn: () => {
      const s = get();
      if (!s.combat) return;
      const hook = hookFrom(s);
      const cues = endTurn(s.combat, hook, s.rand);
      applyHook(s, hook);
      playCues(cues);
      presentCombat(get, set, { ...s.combat }, hook);
    },

    claimReward: () => {
      const s = get();
      const reward = s.reward;
      let hp = s.hp;
      let maxHp = s.maxHp;
      let maxSanity = s.maxSanity;
      let sanity = s.sanity;
      let relics = s.relics.slice();
      let profile = { ...s.profile, collection: s.profile.collection.slice() };
      let toast: string | null = null;

      if (reward?.kind === "card") {
        useCollectionStore.getState().addLootCard(reward.card.defId);
        toast = `${getCard(reward.card.defId).name}を戦利品として持ち帰った。`;
      } else if (reward?.kind === "relic") {
        const got = acquireRelic(profile, relics, reward.relic);
        profile = got.profile;
        relics = got.relics;
        const inst = reward.relic;
        const hpGain = powerOf([inst], "maxHp");
        if (hpGain) {
          maxHp += hpGain;
          hp += hpGain;
        }
        const sanGain = powerOf([inst], "maxSanity");
        if (sanGain) {
          maxSanity += sanGain;
          sanity = Math.min(maxSanity, sanity + sanGain);
        }
        sfx.reward();
        toast = `${relicLabel(inst)} を得た。魂に残った。`;
      } else if (reward?.kind === "rune") {
        useCollectionStore.getState().addLootRune(reward.rune);
        toast = `${reward.rune.effect}のルーンを見つけた。`;
      } else {
        toast = "何も見つからなかった。";
      }

      persist(profile);
      afterGain({ relics, hp, maxHp, maxSanity, sanity, profile, toast });
    },

    restHeal: () => get().innStay(10),
    restUpgrade: (cardUid) => get().forgeAtSmith(cardUid),

    visitVillage: (room) => set({ restMode: room, toast: null }),

    innStay: (tier) => {
      const s = get();
      if (s.shells < tier) {
        set({ toast: "貝殻が足りない。" });
        return;
      }
      const pct = tier === 10 ? 0.2 : tier === 20 ? 0.5 : 1;
      const san = tier === 10 ? 10 : tier === 20 ? 20 : 30;
      const heal = Math.round(s.maxHp * pct);
      sfx.ui();
      set({
        shells: s.shells - tier,
        hp: Math.min(s.maxHp, s.hp + heal),
        sanity: Math.min(s.maxSanity, s.sanity + san),
        restMode: "hub",
        toast: `体力+${heal}、正気+${san}。貝殻-${tier}。`,
      });
    },

    buyBeer: () => {
      const s = get();
      const price = SHOP_PRICE.beer ?? 5;
      if (!s.village || s.village.beerSold) return;
      if (s.shells < price) {
        set({ toast: "貝殻が足りない。" });
        return;
      }
      useCollectionStore.getState().addLootCard("beer");
      sfx.reward();
      set({
        shells: s.shells - price,
        village: { ...s.village, beerSold: true },
        toast: "ビール瓶を戦利品として持ち帰った。",
      });
    },

    buyGood: (uid) => {
      const s = get();
      const shop = s.village?.smith;
      const good = shop?.goods.find((g) => g.uid === uid);
      if (!s.village || !shop || !good || good.sold) return;
      if (s.shells < good.price) {
        set({ toast: "貝殻が足りない。" });
        return;
      }
      const goods = shop.goods.map((g) => (g.uid === uid ? { ...g, sold: true } : g));
      useCollectionStore.getState().addLootCard(good.defId);
      sfx.reward();
      set({
        shells: s.shells - good.price,
        village: { ...s.village, smith: { ...shop, goods } },
        toast: `${getCard(good.defId).name}を戦利品として持ち帰った。`,
      });
    },

    forgeAtSmith: (cardUid) => {
      const s = get();
      const taboo = !!s.village?.smith.taboo;
      const cost = taboo ? 0 : 5;
      if (s.shells < cost) {
        set({ toast: "貝殻が足りない。" });
        return;
      }
      const card = s.deck.find((c) => c.uid === cardUid);
      if (!card || card.forge) {
        set({ toast: "それ以上は焼けない。" });
        return;
      }
      const deck = s.deck.map((c) => (c.uid === cardUid ? forgeCard(c, taboo) : c));
      sfx.select();
      set({
        deck,
        shells: s.shells - cost,
        restMode: "smith",
        toast: `${getCard(card.defId).name}を焼いた。`,
      });
    },

    leaveVillage: () => {
      const s = get();
      sfx.step();
      enterFloor(s.floor + 1, { restMode: null, village: null, toast: null });
    },

    setInspectDeck: (on) => set({ inspectDeck: on }),

    applyLoadoutToRun: () => {
      const err = loadoutError();
      if (err) {
        set({ toast: err });
        sfx.hurt();
        return false;
      }
      const s = get();
      set({
        deck: mergeLoadoutDeck(s.deck),
        toast: "デッキを潜航に反映した。",
      });
      sfx.select();
      return true;
    },

    resumeDescent: () => {
      const s = get();
      if (s.floor <= 0) return;
      const err = loadoutError();
      if (err) {
        set({ toast: err });
        sfx.hurt();
        return;
      }
      set({ deck: mergeLoadoutDeck(s.deck), toast: null, restMode: null, inspectDeck: false });
      sfx.step();
      enterFloor(get().floor + 1);
    },

    extractToHub: () => {
      stopBgm();
      const s = get();
      const bestFloor = Math.max(s.profile.bestFloor, s.floor);
      const budget = totalPoints({ bestFloor });
      const profile = keepRunRelics(
        {
          ...s.profile,
          bestFloor,
          earnedPoints: budget,
          unspentPoints: Math.max(0, budget - statSum(s.profile.stats)),
          sanity: s.sanity,
        },
        s.relics,
      );
      persist(profile);
      sfx.ui();
      set({
        scene: "hub",
        profile,
        combat: null,
        runFloors: [],
        floor: 0,
        deck: [],
        relics: [],
        reward: null,
        event: null,
        restMode: null,
        inspectDeck: false,
        toast: `${layerLabel(s.floor)}から帰還した。戦利は残っている。`,
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
      let profile = { ...s.profile, collection: s.profile.collection.slice() };

      if (ev.id === "tome") {
        if (choiceId === "read") {
          sanity = Math.max(0, sanity - 8);
          const up = deck.find((c) => !c.upgraded);
          if (up) up.upgraded = true;
          useCollectionStore.getState().addLootCard("tome");
          toast = "頁が、瞳の裏に残る。正気-8。禁断の書を戦利品として持ち帰った。";
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
          const ownedDefs = profile.collection.map((r) => r.defId);
          const defId = pickRelicTemplate(ownedDefs, s.rand);
          const inst = rollRelic(defId, s.floor, s.rand, "event");
          const got = acquireRelic(profile, relics, inst);
          profile = got.profile;
          relics = got.relics;
          const hpGain = powerOf([inst], "maxHp");
          if (hpGain) {
            maxHp += hpGain;
            hp += hpGain;
          }
          toast = `${relicLabel(inst)}を渡された。正気-10。魂に残った。`;
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
          toast = "肺にガラス。体力-10。沈降中、筋力+2。";
        }
      }

      persist(profile);
      sfx.ui();
      afterGain({
        hp,
        maxHp,
        sanity,
        deck,
        relics,
        runStrength,
        extraEnergyNext,
        profile,
        event: null,
        toast,
      });
    },

    dismissToast: () => set({ toast: null }),
    continueClimb: () => enterFloor(get().floor + 1),
    spendRite: (key) => {
      const s = get();
      const budget = totalPoints(s.profile);
      if (statSum(s.profile.stats) >= budget) return;
      const profile = {
        ...s.profile,
        stats: { ...s.profile.stats, [key]: s.profile.stats[key] + 1 },
        earnedPoints: budget,
        unspentPoints: Math.max(0, budget - statSum(s.profile.stats) - 1),
      };
      persist(profile);
      set({ profile });
      sfx.select();
    },
    giveUp: () => {
      stopBgm();
      const s = get();
      const profile = { ...s.profile, sanity: s.sanity };
      persist(profile);
      set({ scene: "hub", combat: null, runFloors: [], profile, floor: 0 });
    },
    finishPrologue: () => {
      const s = get();
      const profile = { ...s.profile, seenRlyeh: true };
      persist(profile);
      const runFloors = s.runFloors.slice();
      if (runFloors[0]) runFloors[0] = { floor: 1, type: "combat", enemyIds: ["drowned"] };
      set({ profile, runFloors });
      enterFloor(1, { profile, runFloors });
    },
    turnGrimoirePage: () => {
      const s = get();
      const next = nextUnread(s.profile.grimoireRead);
      if (!next?.cardId) return;
      const madness = (s.profile.madness | 0) + MADNESS_STEP;
      const grimoireRead = [...s.profile.grimoireRead, next.cardId];
      const vitals = derivedVitals(s.profile.stats, madness);
      const maxSanity = vitals.maxSanity;
      const prevMax = derivedVitals(s.profile.stats, madness - MADNESS_STEP).maxSanity;
      const cur = s.profile.sanity == null ? prevMax : s.profile.sanity;
      const sanity = Math.max(0, Math.min(cur, maxSanity));
      if (maxSanity <= 0 || sanity <= 0) {
        set({ scene: "shatter", profile: wipeProfile(), combat: null, runFloors: [] });
        sfx.lose();
        return;
      }
      const profile = { ...s.profile, madness, grimoireRead, sanity };
      persist(profile);
      set({ profile });
      sfx.reward();
    },
    acceptShatter: () => {
      stopBgm();
      playBgm("title");
      set({
        scene: "title",
        profile: loadProfile(),
        combat: null,
        runFloors: [],
        floor: 0,
        deck: [],
        relics: [],
        playerName: "",
      });
    },
    engraveRelic: (uid) => {
      const s = get();
      const inst = s.relics.find((r) => r.uid === uid);
      if (!inst) return;
      if (s.profile.collection.some((r) => r.uid === uid)) {
        get().giveUp();
        return;
      }
      const loadoutIds = s.profile.loadoutIds.slice();
      if (loadoutIds.length < MAX_LOADOUT && !loadoutIds.includes(inst.uid)) loadoutIds.push(inst.uid);
      const profile = {
        ...s.profile,
        collection: [...s.profile.collection, inst],
        loadoutIds,
        sanity: s.sanity,
      };
      persist(profile);
      set({ profile });
      sfx.reward();
      get().giveUp();
    },
  };
});

const DROP_RATES = {
  combat: { chance: 0.5, weights: { card: 0.6, rune: 0.3, relic: 0.1 } },
  elite: { chance: 0.9, weights: { card: 0.4, rune: 0.35, relic: 0.25 } },
  boss: { chance: 1.0, weights: { card: 0.2, rune: 0.3, relic: 0.5 } },
} as const;

function makeReward(s: GameStore): RewardOffer {
  const spec = specAt(s);
  const kind = spec?.type === "boss" ? "boss" : spec?.type === "elite" ? "elite" : "combat";
  const table = DROP_RATES[kind];
  if (s.rand() >= table.chance) return { kind: "none" };

  const category = weightedPick(table.weights, s.rand);
  const floorForRoll = kind === "boss" ? s.floor + 5 : s.floor;

  if (category === "card") {
    const owner = s.character ?? "investigator";
    const bossDef = s.combat?.enemies
      .map((e) => getEnemy(e.defId))
      .find((d) => d.signatureCardId);
    if (bossDef?.signatureCardId && s.rand() < 0.2) {
      return { kind: "card", card: makeCard(bossDef.signatureCardId) };
    }
    return { kind: "card", card: weightedCard(owner, s.rand) };
  }
  if (category === "rune") {
    const effect = pick(RUNE_CATALOG, s.rand).effect;
    return { kind: "rune", rune: rollRune(effect, floorForRoll, s.rand) };
  }
  const ownedDefs = s.profile.collection.map((r) => r.defId);
  const defId = pickRelicTemplate(ownedDefs, s.rand);
  return { kind: "relic", relic: rollRelic(defId, floorForRoll, s.rand, "drop") };
}

export { cardText, canPlay };
