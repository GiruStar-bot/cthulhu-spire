import { asset } from "@/lib/asset";

const AUDIO_KEY = "cthulhu-spire-audio-v1";
const SFX_CEILING = 0.8;

let ctx: AudioContext | null = null;
let bgmHandle: BgmHandle | null = null;
let currentBgm: BgmId | null = null;
let visHooked = false;
let master: GainNode | null = null;
let sfxBus: GainNode | null = null;
let musicBus: GainNode | null = null;
let preloadStarted = false;
let sfxVolume = 1;
let musicVolume = 0.9;

export type BgmId = "title" | "combat" | "rest" | "event" | "boss" | "reward" | "none";
export type SfxCue = "attack" | "skill" | "block" | "hurt" | "step";

type SampleId = "attack" | "block" | "hurt" | "step" | "lose";

type BgmHandle = {
  id: BgmId;
  stop: () => void;
};

const SAMPLE: Record<SampleId, string> = {
  attack: "sfx/attack.wav",
  block: "sfx/block.wav",
  hurt: "sfx/hurt.wav",
  step: "sfx/step.mp3",
  lose: "sfx/lose.mp3",
};

const buffers = new Map<SampleId, AudioBuffer>();
const loopBuffers = new Map<string, AudioBuffer>();
const LOOP_SRC: Partial<Record<BgmId, string>> = {
  title: "music/dunkle-herrlichkeit.mp3",
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

function buses() {
  const c = ac();
  if (!master) {
    master = c.createGain();
    master.gain.value = 1;
    master.connect(c.destination);
    sfxBus = c.createGain();
    sfxBus.connect(master);
    musicBus = c.createGain();
    musicBus.gain.value = musicVolume;
    musicBus.connect(master);
    applySfxGain();
    applyMusicGain();
  }
  return { c, sfx: sfxBus!, music: musicBus! };
}

function applySfxGain() {
  if (!sfxBus || !ctx) return;
  const g = sfxVolume * sfxVolume * SFX_CEILING;
  sfxBus.gain.setTargetAtTime(g, ctx.currentTime, 0.02);
}

function applyMusicGain() {
  if (!musicBus || !ctx) return;
  musicBus.gain.setTargetAtTime(musicVolume, ctx.currentTime, 0.04);
}

function loadAudioSettings() {
  if (typeof localStorage === "undefined") return;
  try {
    const raw = localStorage.getItem(AUDIO_KEY);
    if (!raw) return;
    const d = JSON.parse(raw) as { sfx?: number; music?: number };
    if (typeof d.sfx === "number" && Number.isFinite(d.sfx)) {
      sfxVolume = Math.max(0, Math.min(1, d.sfx));
    }
    if (typeof d.music === "number" && Number.isFinite(d.music)) {
      musicVolume = Math.max(0, Math.min(1, d.music));
    }
  } catch {
    /* ignore */
  }
}

function persistAudio() {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(AUDIO_KEY, JSON.stringify({ sfx: sfxVolume, music: musicVolume }));
  } catch {
    /* ignore */
  }
}

loadAudioSettings();

export function getSfxVolume() {
  return sfxVolume;
}

export function setSfxVolume(value: number) {
  sfxVolume = Math.max(0, Math.min(1, value));
  persistAudio();
  try {
    buses();
    applySfxGain();
  } catch {
    /* ignore */
  }
}

export function getMusicVolume() {
  return musicVolume;
}

export function setMusicVolume(value: number) {
  musicVolume = Math.max(0, Math.min(1, value));
  persistAudio();
  try {
    buses();
    applyMusicGain();
  } catch {
    /* ignore */
  }
}

export function unlockAudio() {
  try {
    buses();
    preloadSfx();
  } catch {
    /* ignore */
  }
}

export function preloadSfx() {
  if (preloadStarted) return;
  preloadStarted = true;
  try {
    const c = ac();
    for (const id of Object.keys(SAMPLE) as SampleId[]) {
      void fetch(asset(SAMPLE[id]))
        .then((r) => {
          if (!r.ok) throw new Error(String(r.status));
          return r.arrayBuffer();
        })
        .then((ab) => c.decodeAudioData(ab.slice(0)))
        .then((buf) => {
          buffers.set(id, buf);
        })
        .catch(() => {
          /* synth fallback */
        });
    }
    for (const [id, path] of Object.entries(LOOP_SRC)) {
      void fetch(asset(path))
        .then((r) => {
          if (!r.ok) throw new Error(String(r.status));
          return r.arrayBuffer();
        })
        .then((ab) => c.decodeAudioData(ab.slice(0)))
        .then((buf) => {
          loopBuffers.set(id, buf);
        })
        .catch(() => {
          /* ignore */
        });
    }
  } catch {
    preloadStarted = false;
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
    const { c, sfx } = buses();
    const o = c.createOscillator();
    const g = envGain(c, gain, dur);
    o.type = type;
    o.frequency.setValueAtTime(freq, c.currentTime);
    if (slide) {
      o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), c.currentTime + dur);
    }
    o.connect(g);
    g.connect(sfx);
    o.start();
    o.stop(c.currentTime + dur + 0.02);
  } catch {
    /* ignore */
  }
}

function noiseBurst(dur: number, gain = 0.03) {
  try {
    const { c, sfx } = buses();
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
    g.connect(sfx);
    src.start();
  } catch {
    /* ignore */
  }
}

const synth: Record<SampleId, () => void> = {
  attack: () => {
    blip(110, 0.12, "sawtooth", 0.05, 0.5);
    noiseBurst(0.08, 0.04);
  },
  block: () => blip(300, 0.1, "square", 0.028),
  hurt: () => {
    blip(70, 0.2, "sawtooth", 0.055, 0.4);
    noiseBurst(0.12, 0.035);
  },
  step: () => blip(180, 0.08, "triangle", 0.025, 0.7),
  lose: () => blip(48, 0.45, "sine", 0.06, 0.6),
};

function playSample(id: SampleId, gain = 0.7, vary = true) {
  const buf = buffers.get(id);
  if (!buf) {
    synth[id]();
    return;
  }
  try {
    const { c, sfx } = buses();
    const src = c.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = vary ? 0.94 + Math.random() * 0.12 : 1;
    const g = c.createGain();
    g.gain.value = gain;
    src.connect(g);
    g.connect(sfx);
    src.start();
  } catch {
    synth[id]();
  }
}

export const sfx = {
  attack: () => playSample("attack", 0.78),
  block: () => playSample("block", 0.72),
  hurt: () => playSample("hurt", 0.82),
  step: () => playSample("step", 0.9, true),
  select: () => blip(520, 0.06, "sine", 0.03),
  play: () => {
    blip(240, 0.08, "triangle", 0.035);
    blip(360, 0.06, "sine", 0.02);
  },
  hit: () => playSample("attack", 0.78),
  draw: () => blip(480, 0.05, "sine", 0.018),
  win: () => {
    blip(330, 0.12, "triangle", 0.04);
    setTimeout(() => blip(440, 0.16, "triangle", 0.04), 100);
    setTimeout(() => blip(554, 0.2, "triangle", 0.035), 200);
  },
  lose: () => playSample("lose", 0.88, false),
  hover: () => blip(640, 0.03, "sine", 0.01),
  reward: () => {
    blip(392, 0.1, "triangle", 0.03);
    setTimeout(() => blip(523, 0.12, "triangle", 0.03), 90);
  },
  ui: () => blip(420, 0.05, "sine", 0.02),
};

export function playCues(cues: SfxCue[]) {
  const seen = new Set<SfxCue>();
  for (const cue of cues) {
    if (seen.has(cue)) continue;
    seen.add(cue);
    if (cue === "skill") sfx.play();
    else sfx[cue]();
  }
}

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
  const { c, music } = buses();
  let stopped = false;
  const live: OscillatorNode[] = [];
  const local = c.createGain();
  local.gain.value = 1;
  local.connect(music);

  let step = 0;
  let next = c.currentTime + 0.05;
  let timer = 0;
  const dt = stepLen(id);

  const loop = () => {
    if (stopped) return;
    const horizon = c.currentTime + 0.75;
    while (next < horizon) {
      phrase(c, local, live, id, step, next);
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
        local.disconnect();
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

function startLoop(id: BgmId, path: string): BgmHandle {
  const { c, music } = buses();
  let stopped = false;
  const local = c.createGain();
  local.gain.value = 0;
  local.connect(music);
  let src: AudioBufferSourceNode | null = null;

  const startBuf = (buf: AudioBuffer) => {
    if (stopped) return;
    src = c.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    src.connect(local);
    const t = c.currentTime;
    local.gain.setValueAtTime(0, t);
    local.gain.linearRampToValueAtTime(0.55, t + 1.2);
    src.start();
  };

  const cached = loopBuffers.get(id);
  if (cached) startBuf(cached);
  else {
    void fetch(asset(path))
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.arrayBuffer();
      })
      .then((ab) => c.decodeAudioData(ab.slice(0)))
      .then((buf) => {
        loopBuffers.set(id, buf);
        startBuf(buf);
      })
      .catch(() => {});
  }

  return {
    id,
    stop: () => {
      stopped = true;
      try {
        const t = c.currentTime;
        local.gain.cancelScheduledValues(t);
        local.gain.setValueAtTime(local.gain.value, t);
        local.gain.linearRampToValueAtTime(0, t + 0.35);
      } catch {
        /* ignore */
      }
      window.setTimeout(() => {
        try {
          src?.stop();
          src?.disconnect();
        } catch {
          /* ignore */
        }
        try {
          local.disconnect();
        } catch {
          /* ignore */
        }
      }, 400);
    },
  };
}

export function playBgm(id: BgmId) {
  if (id === "none") {
    stopBgmInternal();
    return;
  }
  if (currentBgm === id && bgmHandle) return;
  stopBgmInternal();
  try {
    const loop = LOOP_SRC[id];
    bgmHandle = loop ? startLoop(id, loop) : startTheme(id);
    currentBgm = id;
  } catch {
    bgmHandle = null;
    currentBgm = null;
  }
}
