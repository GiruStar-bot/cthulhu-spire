import { getMusicVolume, getSfxVolume, playBgm, setMusicVolume, setSfxVolume, sfx, unlockAudio } from "@/game/audio";
import { GrimoirePanel } from "@/components/game/GrimoireView";
import { grimoireOpen } from "@/game/profile";
import { useGame } from "@/game/store";
import { asset } from "@/lib/asset";
import { useEffect, useRef, useState, type CSSProperties } from "react";

const TITLE_CLIPS = ["art/title-city.mp4", "art/title-palace.mp4"] as const;

const ART_FILL: CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

export function TitleScreen() {
  const begin = useGame((s) => s.begin);
  const profile = useGame((s) => s.profile);
  const [sheet, setSheet] = useState<"settings" | "credits" | "tome" | null>(null);
  const showBook = grimoireOpen(profile);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    const kick = () => {
      unlockAudio();
      playBgm("title");
    };
    kick();
    window.addEventListener("pointerdown", kick, { once: true });
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
      window.removeEventListener("pointerdown", kick);
    };
  }, []);

  return (
    <section
      className="title-stage"
      style={{
        position: "relative",
        display: "flex",
        height: "100dvh",
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <TitleReel />
      <div className="title-veil" />
      <div className="title-stage-ui">
        <h1 className="title-mark title-float">
          <span className="title-mark-of">Abyss of</span>
          <span className="title-mark-name">R'lyeh</span>
        </h1>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <span className="title-float-a">
            <button
              type="button"
              onClick={begin}
              className="min-h-11 rounded-[var(--radius-md)] bg-parchment px-6 py-3 font-display text-base text-ink transition-transform duration-150 ease-out hover:scale-[1.02] active:scale-[0.96]"
            >
              探索
            </button>
          </span>
          <span className="title-float-b">
            <button
              type="button"
              onClick={() => {
                unlockAudio();
                setSheet("settings");
              }}
              className="min-h-11 rounded-[var(--radius-md)] px-6 py-3 font-display text-base text-parchment shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-parchment)_28%,transparent)] transition-transform duration-150 ease-out hover:scale-[1.02] active:scale-[0.96]"
            >
              設定
            </button>
          </span>
          <span className="title-float-c">
            <button
              type="button"
              onClick={() => setSheet("credits")}
              className="min-h-11 rounded-[var(--radius-md)] px-6 py-3 font-display text-base text-parchment shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-parchment)_28%,transparent)] transition-transform duration-150 ease-out hover:scale-[1.02] active:scale-[0.96]"
            >
              クレジット
            </button>
          </span>
          {showBook ? (
            <span className="title-float-a">
              <button
                type="button"
                onClick={() => setSheet("tome")}
                className="min-h-11 rounded-[var(--radius-md)] px-6 py-3 font-display text-base text-parchment shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-parchment)_28%,transparent)] transition-transform duration-150 ease-out hover:scale-[1.02] active:scale-[0.96]"
              >
                全
              </button>
            </span>
          ) : null}
        </div>
        <p className="font-mono text-xs tracking-wider text-muted">
          回数 {profile.runs} · 最深 {profile.bestFloor ? `第${profile.bestFloor}層` : "未潜航"} · 遺物{" "}
          {profile.collection.length}
        </p>
      </div>
      {sheet === "settings" ? <SettingsPanel onClose={() => setSheet(null)} /> : null}
      {sheet === "credits" ? <CreditsPanel onClose={() => setSheet(null)} /> : null}
      {sheet === "tome" ? <GrimoirePanel onClose={() => setSheet(null)} /> : null}
    </section>
  );
}

function TitleReel() {
  const clipsRef = useRef(TITLE_CLIPS.map((p) => asset(p)));
  const aRef = useRef<HTMLVideoElement>(null);
  const bRef = useRef<HTMLVideoElement>(null);
  const idxRef = useRef(0);
  const frontRef = useRef(0);
  const [front, setFront] = useState(0);

  useEffect(() => {
    const clips = clipsRef.current;
    clips.forEach((src) => {
      const el = document.createElement("video");
      el.muted = true;
      el.preload = "auto";
      el.src = src;
    });
    const first = aRef.current;
    if (!first) return;
    first.src = clips[0];
    void first.play().catch(() => {});
  }, []);

  const advance = () => {
    const clips = clipsRef.current;
    const next = (idxRef.current + 1) % clips.length;
    const nextFront = 1 - frontRef.current;
    const idle = nextFront === 0 ? aRef.current : bRef.current;
    if (idle) {
      idle.src = clips[next];
      idle.currentTime = 0;
      void idle.play().catch(() => {});
    }
    idxRef.current = next;
    frontRef.current = nextFront;
    setFront(nextFront);
  };

  return (
    <div
      className="title-stage-art"
      style={{ position: "absolute", inset: 0, overflow: "hidden" }}
      aria-hidden
    >
      <img src={asset("art/title-city.jpg")} alt="" className="title-stage-art" style={ART_FILL} />
      <video
        ref={aRef}
        className={front === 0 ? "title-stage-art title-bg-video is-on" : "title-stage-art title-bg-video"}
        style={ART_FILL}
        muted
        playsInline
        preload="auto"
        poster={asset("art/title-city.jpg")}
        onEnded={() => {
          if (frontRef.current === 0) advance();
        }}
      />
      <video
        ref={bRef}
        className={front === 1 ? "title-stage-art title-bg-video is-on" : "title-stage-art title-bg-video"}
        style={ART_FILL}
        muted
        playsInline
        preload="auto"
        onEnded={() => {
          if (frontRef.current === 1) advance();
        }}
      />
    </div>
  );
}

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const [vol, setVol] = useState(() => getSfxVolume());
  const [bgm, setBgm] = useState(() => getMusicVolume());
  const [full, setFull] = useState(() => isFullscreen());
  const canFull = fullscreenAvailable();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (isFullscreen()) {
        void setFullscreen(false);
        return;
      }
      onClose();
    };
    const sync = () => setFull(isFullscreen());
    window.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  }, [onClose]);

  return (
    <div className="absolute inset-0 z-20 flex items-end justify-center bg-ink/70 px-4 py-8 sm:items-center">
      <button type="button" className="absolute inset-0" aria-label="閉じる" onClick={onClose} />
      <div
        role="dialog"
        aria-labelledby="settings-title"
        className="settings-sheet relative w-full max-w-md rounded-[var(--radius-xl)] bg-surface px-5 py-6 shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-parchment)_14%,transparent)] sm:px-6"
      >
        <p className="font-mono text-xs tracking-widest text-accent">設定</p>
        <h2 id="settings-title" className="font-display mt-1 text-2xl text-parchment">
          音と画面
        </h2>

        <p className="mt-6 font-mono text-xs tracking-widest text-muted">音量</p>
        <label className="mt-3 block">
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-display text-parchment">効果音</span>
            <span className="font-mono text-xs tabular-nums text-muted">{Math.round(vol * 100)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={Math.round(vol * 100)}
            onChange={(e) => {
              const next = Number(e.target.value) / 100;
              setVol(next);
              setSfxVolume(next);
            }}
            onPointerUp={() => {
              unlockAudio();
              sfx.ui();
            }}
            className="mt-3 min-h-11"
          />
        </label>
        <label className="mt-5 block">
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-display text-parchment">BGM</span>
            <span className="font-mono text-xs tabular-nums text-muted">{Math.round(bgm * 100)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={Math.round(bgm * 100)}
            onChange={(e) => {
              const next = Number(e.target.value) / 100;
              setBgm(next);
              setMusicVolume(next);
            }}
            className="mt-3 min-h-11"
          />
        </label>

        <p className="mt-8 font-mono text-xs tracking-widest text-muted">グラフィック</p>
        <label className="mt-3 flex min-h-11 cursor-pointer items-center justify-between gap-4">
          <span className="font-display text-parchment">フルスクリーンを許可</span>
          <input
            type="checkbox"
            className="size-5 shrink-0"
            checked={full}
            disabled={!canFull}
            onChange={(e) => {
              const on = e.target.checked;
              setFull(on);
              void setFullscreen(on).then(() => setFull(isFullscreen()));
            }}
          />
        </label>
        {!canFull ? (
          <p className="mt-2 text-xs text-muted">この環境ではフルスクリーンにできない。</p>
        ) : (
          <p className="mt-2 text-xs text-muted">ESCで解除。</p>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-8 min-h-11 w-full rounded-[var(--radius-md)] bg-parchment px-5 py-3 font-display text-ink"
        >
          閉じる
        </button>
      </div>
    </div>
  );
}

export function CreditsPanel({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="absolute inset-0 z-20 flex items-end justify-center bg-ink/70 px-4 py-8 sm:items-center">
      <button type="button" className="absolute inset-0" aria-label="閉じる" onClick={onClose} />
      <div
        role="dialog"
        aria-labelledby="credits-title"
        className="settings-sheet relative w-full max-w-md rounded-[var(--radius-xl)] bg-surface px-5 py-6 shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-parchment)_14%,transparent)] sm:px-6"
      >
        <p className="font-mono text-xs tracking-widest text-accent">表記</p>
        <h2 id="credits-title" className="font-display mt-1 text-2xl text-parchment">
          クレジット
        </h2>
        <p className="mt-6 font-display text-xl text-parchment">魔王魂</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-8 min-h-11 w-full rounded-[var(--radius-md)] bg-parchment px-5 py-3 font-display text-ink"
        >
          閉じる
        </button>
      </div>
    </div>
  );
}

type FullDoc = Document & {
  webkitFullscreenElement?: Element | null;
  webkitFullscreenEnabled?: boolean;
  webkitExitFullscreen?: () => Promise<void> | void;
};

type FullEl = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

function isFullscreen() {
  if (typeof document === "undefined") return false;
  const doc = document as FullDoc;
  return !!(document.fullscreenElement || doc.webkitFullscreenElement);
}

function fullscreenAvailable() {
  if (typeof document === "undefined") return false;
  const doc = document as FullDoc;
  return !!(document.fullscreenEnabled || doc.webkitFullscreenEnabled);
}

async function setFullscreen(on: boolean) {
  const el = document.documentElement as FullEl;
  const doc = document as FullDoc;
  try {
    if (on) {
      if (isFullscreen()) return;
      if (el.requestFullscreen) await el.requestFullscreen();
      else await el.webkitRequestFullscreen?.();
    } else if (isFullscreen()) {
      if (document.exitFullscreen) await document.exitFullscreen();
      else await doc.webkitExitFullscreen?.();
    }
  } catch {
    /* denied by browser */
  }
}
