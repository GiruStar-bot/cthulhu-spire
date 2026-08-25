let ctx: AudioContext | null = null;
let bgmNodes: { stop: () => void } | null = null;
let currentBgm: BgmId | null = null;

export type BgmId = "title" | "map" | "combat" | "none";

function ac() {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
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

function stopBgmInternal() {
  if (bgmNodes) {
    bgmNodes.stop();
    bgmNodes = null;
  }
  currentBgm = null;
}

export function stopBgm() {
  stopBgmInternal();
}

export function playBgm(id: BgmId) {
  if (id === "none") {
    stopBgmInternal();
    return;
  }
  if (currentBgm === id && bgmNodes) return;
  stopBgmInternal();
  try {
    const c = ac();
    const master = c.createGain();
    master.gain.value = id === "combat" ? 0.035 : 0.028;
    master.connect(c.destination);

    const mk = (freq: number, type: OscillatorType, detune = 0) => {
      const o = c.createOscillator();
      o.type = type;
      o.frequency.value = freq;
      o.detune.value = detune;
      const g = c.createGain();
      g.gain.value = 0.5;
      o.connect(g);
      g.connect(master);
      o.start();
      return o;
    };

    const oscs: OscillatorNode[] = [];
    if (id === "title") {
      oscs.push(mk(55, "sine"), mk(82.5, "sine", 8), mk(110, "triangle", -6));
    } else if (id === "map") {
      oscs.push(mk(49, "sine"), mk(73.5, "triangle", 4), mk(98, "sine", -10));
    } else {
      oscs.push(mk(41, "sawtooth"), mk(61.5, "sine", 12), mk(82, "triangle", -8));
    }

    const lfo = c.createOscillator();
    const lfoG = c.createGain();
    lfo.frequency.value = id === "combat" ? 0.15 : 0.08;
    lfoG.gain.value = 0.012;
    lfo.connect(lfoG);
    lfoG.connect(master.gain);
    lfo.start();

    bgmNodes = {
      stop: () => {
        try {
          lfo.stop();
          oscs.forEach((o) => o.stop());
          master.disconnect();
        } catch {
          /* ignore */
        }
      },
    };
    currentBgm = id;
  } catch {
    /* ignore */
  }
}
