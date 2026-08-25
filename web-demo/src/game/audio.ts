let ctx: AudioContext | null = null;

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

function tone(freq: number, dur: number, type: OscillatorType, gain = 0.04) {
  try {
    const c = ac();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = gain;
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start();
    o.stop(c.currentTime + dur);
  } catch {
    /* ignore */
  }
}

export const sfx = {
  play: () => tone(220, 0.09, "triangle", 0.03),
  hit: () => tone(90, 0.14, "sawtooth", 0.05),
  block: () => tone(310, 0.1, "square", 0.025),
  draw: () => tone(480, 0.06, "sine", 0.02),
  hurt: () => tone(70, 0.22, "sawtooth", 0.06),
  win: () => {
    tone(330, 0.15, "triangle", 0.04);
    setTimeout(() => tone(440, 0.2, "triangle", 0.04), 120);
  },
  lose: () => tone(55, 0.4, "sine", 0.06),
  hover: () => tone(640, 0.04, "sine", 0.012),
};
