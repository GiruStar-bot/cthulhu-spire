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
} from "./types";
import { CHARACTERS } from "./characters";
import { cardText, getCard, makeCard, rewardPool } from "./cards";
import { EVENTS } from "./events";
import { DEMO_MAX_FLOOR, generateRunTable } from "./floors";
import { pickRelicTemplate, powerOf, relicLabel, rollRelic } from "./relics";
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
import { playBgm, playCues, sfx, stopBgm, unlockAudio } from "./audio";
import {
  clampStats,
  derivedVitals,
  equippedRelics,
  grimoireOpen,
  loadProfile,
  MADNESS_STEP,
  MAX_LOADOUT,
  riteGain,
  saveProfile,
  STAT_MIN,
  statBudget,
  statSum,
  wipeProfile,
} from "./profile";
import { nextUnread } from "./grimoire";

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
  restMode: "choose" | "upgrade" | null;
  toast: string | null;

  begin: () => void;
  setPlayerName: (name: string) => void;
  setStat: (key: keyof PlayerStats, value: number) => void;
  toggleLoadout: (uid: string) => void;
  startRun: () => void;
  play: (cardUid: string, targetId?: string | null) => void;
  setTargeting: (cardUid: string | null) => void;
  endPlayerTurn: () => void;
  pickReward: (card: CardInst | null) => void;
  skipReward: () => void;
  restHeal: () => void;
  restUpgrade: (uid: string) => void;
  resolveEvent: (choiceId: string) => void;
  dismissToast: () => void;
  continueClimb: () => void;
  giveUp: () => void;
  spendRite: (key: keyof PlayerStats) => void;
  finishPrologue: () => void;
  openGrimoire: () => void;
  closeGrimoire: () => void;
  turnGrimoirePage: () => void;
  acceptShatter: () => void;
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
  return stats.body >= stats.mind ? "investigator" : "cultist";
}

function markDefeat(s: GameStore): PlayerProfile {
  const gain = riteGain(s.floor);
  const profile = {
    ...s.profile,
    bestFloor: Math.max(s.profile.bestFloor, s.floor),
    earnedPoints: Math.max(0, (s.profile.earnedPoints | 0) + gain),
    unspentPoints: Math.max(0, (s.profile.unspentPoints | 0) + gain),
    sanity: s.sanity,
  };
  persist(profile);
  return profile;
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
  });
  if (combat.result === "win") {
    sfx.win();
    window.setTimeout(() => {
      const cur = get();
      if (cur.combat?.result !== "win") return;
      playBgm("reward");
      const heal = powerOf(cur.relics, "postHeal");
      set({
        scene: "reward",
        reward: makeReward(cur),
        hp: heal > 0 ? Math.min(cur.maxHp, cur.hp + heal) : cur.hp,
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
      const profile = { ...s.profile, bestFloor: Math.max(s.profile.bestFloor, s.floor), wins: s.profile.wins + 1, sanity: s.sanity };
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
      restMode: null as "choose" | "upgrade" | null,
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
      set({ ...base, scene: "rest", restMode: "choose" });
      return;
    }
    playBgm("event");
    const ev = EVENTS.find((e) => e.id === spec.eventId) ?? pick(EVENTS, s.rand);
    set({ ...base, scene: "event", event: ev });
  }

  return {
    scene: "title",
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

    begin: () => {
      unlockAudio();
      stopBgm();
      const profile = loadProfile();
      const seed = (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;
      const rand = mulberry32(seed);
      const runFloors = generateRunTable(rand);
      set({
        scene: "prepare",
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

    setPlayerName: (name) => {
      const profile = { ...get().profile, playerName: name.slice(0, 16) };
      persist(profile);
      set({ playerName: profile.playerName, profile });
    },

    setStat: (key, value) => {
      const profile = { ...get().profile, stats: { ...get().profile.stats } };
      const next = Math.max(STAT_MIN, value | 0);
      const others = statSum(profile.stats) - profile.stats[key];
      if (others + next > statBudget(profile)) return;
      profile.stats[key] = next;
      profile.stats = clampStats(profile.stats);
      profile.unspentPoints = Math.max(0, statBudget(profile) - statSum(profile.stats));
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
      const name = (s.playerName || profile.playerName || "無名の潜航者").trim().slice(0, 16);
      profile.playerName = name;
      profile.stats = clampStats(profile.stats);
      const sum = statSum(profile.stats);
      if (sum !== statBudget(profile)) {
        set({ toast: `ステータス合計を${statBudget(profile)}にしてください。` });
        return;
      }
      profile.runs += 1;
      persist(profile);

      const path = starterPath(profile.stats);
      const ch = CHARACTERS[path]!;
      const vitals = derivedVitals(profile.stats, profile.madness);
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

      let seed = s.seed;
      let rand = s.rand;
      let runFloors = s.runFloors;
      if (!runFloors.length) {
        seed = (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;
        rand = mulberry32(seed);
        runFloors = generateRunTable(rand);
      }

      unlockAudio();
      sfx.reward();

      const tome = (profile.grimoireRead ?? []).map((id) => makeCard(id));

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
        deck: [...ch.starter.map((cid) => makeCard(cid)), ...tome],
        relics: loadout.map((r) => ({ ...r })),
        runStrength: Math.floor(profile.stats.will / 4),
        extraEnergyNext: 0,
        act: 1,
        combat: null,
        reward: null,
        event: null,
        restMode: null,
        targeting: null,
        toast: null,
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

    pickReward: (card) => {
      const s = get();
      const deck = card ? [...s.deck, { ...card, uid: uid("c") }] : s.deck;
      let hp = s.hp;
      let maxHp = s.maxHp;
      let maxSanity = s.maxSanity;
      let sanity = s.sanity;
      const relics = s.relics.slice();
      let profile = { ...s.profile, collection: s.profile.collection.slice() };

      if (s.reward?.relic) {
        const inst = s.reward.relic;
        if (!profile.collection.some((r) => r.uid === inst.uid)) {
          profile.collection.push(inst);
        }
        if (relics.length < MAX_LOADOUT && !relics.some((r) => r.uid === inst.uid)) {
          relics.push(inst);
          if (profile.loadoutIds.length < MAX_LOADOUT && !profile.loadoutIds.includes(inst.uid)) {
            profile.loadoutIds = [...profile.loadoutIds, inst.uid];
          }
        }
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
      }

      persist(profile);
      const spec = specAt(s);
      const relicToast = s.reward?.relic ? `${relicLabel(s.reward.relic)} を記録した。` : null;

      if (spec?.type === "boss" && s.floor === 50) {
        profile = { ...profile, bestFloor: Math.max(profile.bestFloor, s.floor) };
        persist(profile);
        playBgm("rest");
        set({
          scene: "between",
          deck,
          relics,
          hp,
          maxHp,
          maxSanity,
          sanity,
          profile,
          reward: null,
          combat: null,
          toast: relicToast,
        });
        return;
      }

      if (s.floor >= DEMO_MAX_FLOOR) {
        profile = {
          ...profile,
          bestFloor: Math.max(profile.bestFloor, s.floor),
          wins: profile.wins + 1,
        };
        persist(profile);
        stopBgm();
        set({
          scene: "victory",
          deck,
          relics,
          hp,
          maxHp,
          maxSanity,
          sanity,
          profile,
          reward: null,
          combat: null,
        });
        return;
      }

      enterFloor(s.floor + 1, {
        deck,
        relics,
        hp,
        maxHp,
        maxSanity,
        sanity,
        profile,
        toast: relicToast,
      });
    },

    skipReward: () => get().pickReward(null),

    restHeal: () => {
      const s = get();
      const heal = Math.round(s.maxHp * 0.32);
      sfx.ui();
      enterFloor(s.floor + 1, {
        hp: Math.min(s.maxHp, s.hp + heal),
        sanity: Math.min(s.maxSanity, s.sanity + 6),
        restMode: null,
        toast: `${heal} 体力と正気6を回復した。`,
      });
    },

    restUpgrade: (cardUid) => {
      const s = get();
      const deck = s.deck.map((c) => (c.uid === cardUid ? { ...c, upgraded: true } : c));
      const card = deck.find((c) => c.uid === cardUid);
      sfx.select();
      enterFloor(s.floor + 1, {
        deck,
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
      let profile = { ...s.profile, collection: s.profile.collection.slice() };

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
          const ownedDefs = profile.collection.map((r) => r.defId);
          const defId = pickRelicTemplate(ownedDefs, s.rand);
          const inst = rollRelic(defId, s.floor, s.rand, "event");
          profile.collection.push(inst);
          if (relics.length < MAX_LOADOUT) {
            relics.push(inst);
            const hpGain = powerOf([inst], "maxHp");
            if (hpGain) {
              maxHp += hpGain;
              hp += hpGain;
            }
          }
          toast = `${relicLabel(inst)}を渡された。正気-10。`;
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
      enterFloor(s.floor + 1, {
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
      if ((s.profile.unspentPoints | 0) <= 0) return;
      const profile = {
        ...s.profile,
        stats: { ...s.profile.stats, [key]: s.profile.stats[key] + 1 },
        unspentPoints: s.profile.unspentPoints - 1,
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
      set({ scene: "title", combat: null, runFloors: [], profile, floor: 0 });
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
    openGrimoire: () => {
      if (!grimoireOpen(get().profile)) return;
      stopBgm();
      set({ scene: "grimoire" });
      sfx.ui();
    },
    closeGrimoire: () => {
      playBgm("title");
      set({ scene: "title" });
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
  };
});

function makeReward(s: GameStore): RewardOffer {
  const spec = specAt(s);
  const owner = s.character ?? "investigator";
  const cards = [weightedCard(owner, s.rand), weightedCard(owner, s.rand), weightedCard(owner, s.rand)];
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
  let relic: RelicInstance | undefined;
  if (spec?.type === "elite" || spec?.type === "boss") {
    const ownedDefs = s.profile.collection.map((r) => r.defId);
    const defId = pickRelicTemplate(ownedDefs, s.rand);
    relic = rollRelic(defId, spec.type === "boss" ? s.floor + 5 : s.floor, s.rand, "drop");
  }
  return { cards: unique, relic };
}

export { cardText, canPlay };
