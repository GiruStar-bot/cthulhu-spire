let ctx: AudioContext | null = null;
let bgmHandle: BgmHandle | null = null;
let currentBgm: BgmId | null = null;
let visHooked = false;

export type BgmId = "combat" | "rest" | "event" | "boss" | "reward" | "none";

type BgmHandle = {
  id: BgmId;
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

function tone(
  c: AudioContext,
  dest: AudioNode,
  live: OscillatorNode[],
  freq: number,
  when: number,
  dur: number,
  peak: number,
  type: OscillatorType,
) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, when);
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(peak, when + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  o.connect(g);
  g.connect(dest);
  o.start(when);
  o.stop(when + dur + 0.03);
  live.push(o);
  o.onended = () => {
    try {
      o.disconnect();
      g.disconnect();
    } catch {
      /* ignore */
    }
  };
}

function phrase(c: AudioContext, dest: AudioNode, live: OscillatorNode[], id: Exclude<BgmId, "none">, step: number, t: number) {
  if (id === "combat" || id === "boss") {
    const i = step % 8;
    const k = id === "boss" ? 1.12 : 1;
    if (i === 0) {
      tone(c, dest, live, 36.71, t, 0.7, 0.02 * k, "triangle");
      if (id === "boss") tone(c, dest, live, 55, t, 0.45, 0.01, "sine");
    } else if (i === 2) {
      tone(c, dest, live, 55, t, 0.42, 0.014 * k, "triangle");
    } else if (i === 4) {
      tone(c, dest, live, 36.71, t, 0.58, 0.017 * k, "triangle");
    } else if (i === 6) {
      tone(c, dest, live, 46.25, t, 0.5, 0.013 * k, "sine");
    }
    return;
  }
  if (id === "rest") {
    tone(c, dest, live, 130.81, t, 1.85, 0.013, "sine");
    tone(c, dest, live, 155.56, t + 1.7, 1.9, 0.011, "sine");
    tone(c, dest, live, 196, t + 3.5, 2.4, 0.01, "sine");
    return;
  }
  if (id === "event") {
    tone(c, dest, live, 164.81, t, 1.2, 0.012, "sine");
    tone(c, dest, live, 174.61, t, 1.2, 0.01, "sine");
    tone(c, dest, live, 110, t + 1.45, 1.6, 0.01, "triangle");
    return;
  }
  tone(c, dest, live, 98, t, 2.4, 0.011, "sine");
  tone(c, dest, live, 147, t + 0.12, 2.3, 0.009, "sine");
}

function stepLen(id: Exclude<BgmId, "none">) {
  if (id === "combat") return 0.9;
  if (id === "boss") return 0.72;
  if (id === "rest") return 8.6;
  if (id === "event") return 7;
  return 6.2;
}

function startTheme(id: Exclude<BgmId, "none">): BgmHandle {
  const c = ac();
  let stopped = false;
  const live: OscillatorNode[] = [];
  const master = c.createGain();
  master.gain.value = 1;
  master.connect(c.destination);

  let step = 0;
  let next = c.currentTime + 0.05;
  let timer = 0;
  const dt = stepLen(id);

  const loop = () => {
    if (stopped) return;
    const horizon = c.currentTime + 0.75;
    while (next < horizon) {
      phrase(c, master, live, id, step, next);
      step += 1;
      next += dt;
    }
    timer = window.setTimeout(loop, 160);
  };
  loop();

  return {
    id,
    stop: () => {
      stopped = true;
      window.clearTimeout(timer);
      for (const o of live) {
        try {
          o.stop();
          o.disconnect();
        } catch {
          /* ignore */
        }
      }
      live.length = 0;
      try {
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

export function playBgm(id: BgmId) {
  if (id === "none") {
    stopBgmInternal();
    return;
  }
  if (currentBgm === id && bgmHandle) return;
  stopBgmInternal();
  try {
    bgmHandle = startTheme(id);
    currentBgm = id;
  } catch {
    bgmHandle = null;
    currentBgm = null;
  }
}
