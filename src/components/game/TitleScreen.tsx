import { CardForgeScreen } from "@/components/loadout/CardForgeScreen";
import { DeckBuilderScreen } from "@/components/loadout/DeckBuilderScreen";
import { getMusicVolume, getSfxVolume, playBgm, setMusicVolume, setSfxVolume, sfx, unlockAudio } from "@/game/audio";
import { GrimoirePanel } from "@/components/game/GrimoireView";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelWindow } from "@/components/ui/PixelWindow";
import { grimoireOpen } from "@/game/profile";
import { useGame } from "@/game/store";
import { asset } from "@/lib/asset";
import { useEffect, useState } from "react";

export function TitleScreen() {
  const begin = useGame((s) => s.begin);
  const profile = useGame((s) => s.profile);
  const [sheet, setSheet] = useState<"settings" | "credits" | "tome" | "deck" | "forge" | null>(null);
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
    <section className="relative flex h-dvh w-full items-center justify-center overflow-hidden">
      <img
        src={asset("art/pixel/bg/title.jpg")}
        alt=""
        className="absolute inset-0 size-full object-cover"
        crossOrigin="anonymous"
      />
      <div className="absolute inset-0 bg-ink/45" />
      <div className="relative z-10 flex max-w-xl flex-col items-center gap-8 px-6 text-center">
        <h1 className="title-float font-pixel text-parchment">
          <span className="block text-sm tracking-[0.4em] text-muted uppercase">Abyss of</span>
          <span className="mt-2 block text-5xl tracking-widest uppercase sm:text-7xl">R'lyeh</span>
        </h1>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <PixelButton onClick={begin} className="min-w-28 px-6">
            探索
          </PixelButton>
          <PixelButton
            onClick={() => {
              unlockAudio();
              setSheet("deck");
            }}
            className="min-w-28 px-6"
          >
            デッキ編成
          </PixelButton>
          <PixelButton
            onClick={() => {
              unlockAudio();
              setSheet("forge");
            }}
            className="min-w-28 px-6"
          >
            魔改造
          </PixelButton>
          <PixelButton
            onClick={() => {
              unlockAudio();
              setSheet("settings");
            }}
            className="min-w-28 px-6"
          >
            設定
          </PixelButton>
          <PixelButton onClick={() => setSheet("credits")} className="min-w-28 px-6">
            クレジット
          </PixelButton>
          {showBook ? (
            <PixelButton onClick={() => setSheet("tome")} className="min-w-28 px-6">
              全
            </PixelButton>
          ) : null}
        </div>
        <p className="font-pixel text-xs tracking-wider text-muted">
          回数 {profile.runs} · 最深 {profile.bestFloor ? `第${profile.bestFloor}層` : "未潜航"} · 遺物{" "}
          {profile.collection.length}
        </p>
      </div>
      {sheet === "deck" ? (
        <div className="fixed inset-0 z-50">
          <DeckBuilderScreen onClose={() => setSheet(null)} />
        </div>
      ) : null}
      {sheet === "forge" ? (
        <div className="fixed inset-0 z-50">
          <CardForgeScreen onClose={() => setSheet(null)} />
        </div>
      ) : null}
      {sheet === "settings" ? <SettingsPanel onClose={() => setSheet(null)} /> : null}
      {sheet === "credits" ? <CreditsPanel onClose={() => setSheet(null)} /> : null}
      {sheet === "tome" ? <GrimoirePanel onClose={() => setSheet(null)} /> : null}
    </section>
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
      <PixelWindow
        role="dialog"
        aria-labelledby="settings-title"
        className="settings-sheet relative z-10 w-full max-w-md px-5 py-6"
      >
        <p className="text-xs tracking-widest text-muted">設定</p>
        <h2 id="settings-title" className="mt-1 text-2xl text-white">
          音と画面
        </h2>

        <p className="mt-6 text-xs tracking-widest text-muted">音量</p>
        <label className="mt-3 block">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-white">効果音</span>
            <span className="text-xs tabular-nums text-muted">{Math.round(vol * 100)}</span>
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
            <span className="text-white">BGM</span>
            <span className="text-xs tabular-nums text-muted">{Math.round(bgm * 100)}</span>
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

        <p className="mt-8 text-xs tracking-widest text-muted">グラフィック</p>
        <label className="mt-3 flex min-h-11 cursor-pointer items-center justify-between gap-4">
          <span className="text-white">フルスクリーンを許可</span>
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

        <PixelButton onClick={onClose} className="mt-8 w-full">
          閉じる
        </PixelButton>
      </PixelWindow>
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
      <PixelWindow
        role="dialog"
        aria-labelledby="credits-title"
        className="settings-sheet relative z-10 w-full max-w-md px-5 py-6"
      >
        <p className="text-xs tracking-widest text-muted">表記</p>
        <h2 id="credits-title" className="mt-1 text-2xl text-white">
          クレジット
        </h2>
        <p className="mt-6 text-xl text-white">魔王魂</p>
        <PixelButton onClick={onClose} className="mt-8 w-full">
          閉じる
        </PixelButton>
      </PixelWindow>
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
