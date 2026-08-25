let ctx: AudioContext | null = null;
let bgmHandle: BgmHandle | null = null;
let currentBgm: BgmId | null = null;
let visHooked = false;
let noiseBuf: AudioBuffer | null = null;

export type BgmId = "title" | "prepare" | "descent" | "combat" | "boss" | "none";

type BgmHandle = {
  id: BgmId;
  setFloor: (floor: number) => void;
  stop: () => void;
};

function ac() {
  if (!ctx) {
    ctx = new AudioContext();
    hookVisibility();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function hookVisibility() {
  if (visHooked || typeof document === "undefined") return;
  visHooked = true;
  const resume = () => {
    if (ctx?.state === "suspended") void ctx.resume();
  };
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") resume();
  });
  window.addEventListener("focus", resume);
}

export function unlockAudio() {
  try {
    ac();
  } catch {
    /* ignore */
  }
}

function envGain(c: AudioContext, peak: number, dur: number) {
  const g = c.createGain();
  const t = c.currentTime;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  return g;
}

function blip(freq: number, dur: number, type: OscillatorType, gain = 0.04, slide?: number) {
  try {
    const c = ac();
    const o = c.createOscillator();
    const g = envGain(c, gain, dur);
    o.type = type;
    o.frequency.setValueAtTime(freq, c.currentTime);
    if (slide) {
      o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), c.currentTime + dur);
    }
    o.connect(g);
    g.connect(c.destination);
    o.start();
    o.stop(c.currentTime + dur + 0.02);
  } catch {
    /* ignore */
  }
}

function noiseBurst(dur: number, gain = 0.03) {
  try {
    const c = ac();
    const n = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, n, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    const g = envGain(c, gain, dur);
    const f = c.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 800;
    src.connect(f);
    f.connect(g);
    g.connect(c.destination);
    src.start();
  } catch {
    /* ignore */
  }
}

export const sfx = {
  select: () => blip(520, 0.06, "sine", 0.03),
  play: () => {
    blip(240, 0.08, "triangle", 0.035);
    blip(360, 0.06, "sine", 0.02);
  },
  hit: () => {
    blip(110, 0.12, "sawtooth", 0.05, 0.5);
    noiseBurst(0.08, 0.04);
  },
  hurt: () => {
    blip(70, 0.2, "sawtooth", 0.055, 0.4);
    noiseBurst(0.12, 0.035);
  },
  block: () => blip(300, 0.1, "square", 0.028),
  draw: () => blip(480, 0.05, "sine", 0.018),
  win: () => {
    blip(330, 0.12, "triangle", 0.04);
    setTimeout(() => blip(440, 0.16, "triangle", 0.04), 100);
    setTimeout(() => blip(554, 0.2, "triangle", 0.035), 200);
  },
  lose: () => blip(48, 0.45, "sine", 0.06, 0.6),
  hover: () => blip(640, 0.03, "sine", 0.01),
  reward: () => {
    blip(392, 0.1, "triangle", 0.03);
    setTimeout(() => blip(523, 0.12, "triangle", 0.03), 90);
  },
  ui: () => blip(420, 0.05, "sine", 0.02),
};

function pressure(floor: number) {
  const t = Math.max(0, Math.min(1, (floor - 1) / 99));
  return t * t;
}

function brownLoop(c: AudioContext) {
  if (noiseBuf && noiseBuf.sampleRate === c.sampleRate) return noiseBuf;
  const n = Math.floor(c.sampleRate * 2.8);
  const buf = c.createBuffer(1, n, c.sampleRate);
  const data = buf.getChannelData(0);
  let last = 0;
  let peak = 0.0001;
  for (let i = 0; i < n; i++) {
    last = (last + (Math.random() * 2 - 1) * 0.02) / 1.02;
    data[i] = last;
    peak = Math.max(peak, Math.abs(last));
  }
  const inv = 1 / peak;
  for (let i = 0; i < n; i++) data[i] *= inv;
  noiseBuf = buf;
  return buf;
}

function fireCreak(c: AudioContext, dest: AudioNode, quiet: boolean, floor: number) {
  const dur = 0.7 + Math.random() * 0.45;
  const n = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, n, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 140 + Math.random() * 120;
  bp.Q.value = 7.5;
  const g = c.createGain();
  const t = c.currentTime;
  const peak = (quiet ? 0.01 : 0.018) + pressure(floor) * 0.008;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(bp);
  bp.connect(g);
  g.connect(dest);
  src.start();
  src.stop(t + dur + 0.05);
}

function fireWhale(c: AudioContext, dest: AudioNode, floor: number) {
  const o = c.createOscillator();
  o.type = "sine";
  const g = c.createGain();
  const t = c.currentTime;
  const startF = 86 - pressure(floor) * 20;
  o.frequency.setValueAtTime(startF, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(32, startF * 0.58), t + 2.5);
  const peak = 0.009 + pressure(floor) * 0.004;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.4);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 2.9);
  o.connect(g);
  g.connect(dest);
  o.start();
  o.stop(t + 3.2);
}

function startHydrophone(id: Exclude<BgmId, "none">, floor: number): BgmHandle {
  const c = ac();
  let stopped = false;
  let floorNow = floor;
  const fight = id === "combat" || id === "boss";
  const quiet = id === "prepare";
  const ambience = id === "title" || id === "prepare" || id === "descent";

  const master = c.createGain();
  master.connect(c.destination);

  const waterLp = c.createBiquadFilter();
  waterLp.type = "lowpass";
  const waterGain = c.createGain();
  const hullGain = c.createGain();
  const pulseLevel = c.createGain();
  pulseLevel.gain.value = 0.0001;

  const noise = c.createBufferSource();
  noise.buffer = brownLoop(c);
  noise.loop = true;
  noise.connect(waterLp);
  waterLp.connect(waterGain);
  waterGain.connect(master);

  const hull = c.createOscillator();
  hull.type = "sine";
  const hull2 = c.createOscillator();
  hull2.type = "sine";
  hull2.detune.value = 9;
  hull.connect(hullGain);
  hull2.connect(hullGain);
  hullGain.connect(master);

  const pulse = c.createOscillator();
  pulse.type = "sine";
  pulse.frequency.value = 32;
  const lfo = c.createOscillator();
  const lfoG = c.createGain();
  lfoG.gain.value = 0;
  pulse.connect(pulseLevel);
  pulseLevel.connect(master);
  lfo.connect(lfoG);
  lfoG.connect(pulseLevel.gain);

  const swell = c.createOscillator();
  swell.frequency.value = 0.06;
  const swellG = c.createGain();
  swellG.gain.value = 0.0035;
  swell.connect(swellG);
  swellG.connect(waterGain.gain);

  const applyFloor = (f: number) => {
    floorNow = f;
    const p = pressure(f);
    const t = c.currentTime;
    const base =
      id === "title" ? 0.04 : id === "prepare" ? 0.028 : id === "descent" ? 0.034 : id === "combat" ? 0.018 : 0.022;
    master.gain.setTargetAtTime(base + p * (fight ? 0.005 : 0.01), t, 0.45);

    const cutoff = fight ? 150 - p * 70 : id === "title" ? 360 - p * 60 : id === "prepare" ? 320 : 270 - p * 160;
    waterLp.frequency.setTargetAtTime(Math.max(72, cutoff), t, 0.55);
    waterLp.Q.setTargetAtTime(0.55 + p * 0.35, t, 0.55);
    waterGain.gain.setTargetAtTime(fight ? 0.2 + p * 0.1 : 0.36 + p * 0.2, t, 0.4);

    hull.frequency.setTargetAtTime(fight || id === "descent" ? 25 - p * 5 : 34, t, 0.5);
    hull2.frequency.setTargetAtTime(fight || id === "descent" ? 39 - p * 7 : 51, t, 0.5);
    hullGain.gain.setTargetAtTime(fight ? 0.16 + p * 0.07 : 0.26 + p * 0.14, t, 0.4);

    if (fight) {
      pulseLevel.gain.setTargetAtTime(0.01 + p * 0.005, t, 0.3);
      lfoG.gain.setTargetAtTime(0.007 + p * 0.003, t, 0.3);
      lfo.frequency.setTargetAtTime(id === "boss" ? 0.46 : 0.68, t, 0.3);
    } else {
      pulseLevel.gain.setTargetAtTime(0.0001, t, 0.2);
      lfoG.gain.setTargetAtTime(0, t, 0.2);
    }
  };

  applyFloor(floor);

  hull.start();
  hull2.start();
  pulse.start();
  lfo.start();
  swell.start();
  noise.start();

  let nextCreak = c.currentTime + (quiet ? 6 : 2.5) + Math.random() * 5;
  let nextWhale = c.currentTime + 5 + Math.random() * 7;
  let timer = 0;

  const tick = () => {
    if (stopped) return;
    const now = c.currentTime;
    if (ambience && now >= nextCreak) {
      fireCreak(c, master, quiet, floorNow);
      nextCreak = now + (quiet ? 9 + Math.random() * 10 : 6 + Math.random() * 9);
    }
    if (ambience && !quiet && now >= nextWhale) {
      fireWhale(c, master, floorNow);
      nextWhale = now + 16 + Math.random() * 20;
    }
    timer = window.setTimeout(tick, 350);
  };
  tick();

  return {
    id,
    setFloor: applyFloor,
    stop: () => {
      stopped = true;
      window.clearTimeout(timer);
      try {
        hull.stop();
        hull2.stop();
        pulse.stop();
        lfo.stop();
        swell.stop();
        noise.stop();
        master.disconnect();
      } catch {
        /* ignore */
      }
    },
  };
}

function stopBgmInternal() {
  if (bgmHandle) {
    bgmHandle.stop();
    bgmHandle = null;
  }
  currentBgm = null;
}

export function stopBgm() {
  stopBgmInternal();
}

export function playBgm(id: BgmId, floor = 1) {
  if (id === "none") {
    stopBgmInternal();
    return;
  }
  if (currentBgm === id && bgmHandle) {
    bgmHandle.setFloor(floor);
    return;
  }
  stopBgmInternal();
  try {
    bgmHandle = startHydrophone(id, floor);
    currentBgm = id;
  } catch {
    bgmHandle = null;
    currentBgm = null;
  }
}
