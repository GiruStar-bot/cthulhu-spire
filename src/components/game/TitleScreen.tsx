import { getSfxVolume, setSfxVolume, sfx, unlockAudio } from "@/game/audio";
import { useGame } from "@/game/store";
import { asset } from "@/lib/asset";
import { useEffect, useState } from "react";

export function TitleScreen() {
  const begin = useGame((s) => s.begin);
  const profile = useGame((s) => s.profile);
  const [settings, setSettings] = useState(false);

  return (
    <section className="relative flex min-h-dvh flex-col overflow-hidden">
      <img
        src={asset("art/title.jpg")}
        alt=""
        className="absolute inset-0 size-full object-cover"
        crossOrigin="anonymous"
      />
      <div className="absolute inset-0 bg-linear-to-t from-ink via-ink/70 to-ink/30" />
      <div className="relative z-10 mt-auto flex flex-col gap-6 px-6 pb-16 sm:px-12">
        <p className="font-mono text-xs tracking-widest text-accent">無限の沈降 · 単独調査</p>
        <h1 className="font-display max-w-xl text-5xl leading-[1.05] text-balance text-parchment sm:text-7xl">
          クトゥルスパイア
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-pretty text-muted sm:text-base">
          近代は行き詰まった。科学者は海底都市ルルイエへ目を向けた。あなたは単独で潜る。日誌を開き、配分を振る。潜航前点検の瞬間、第100層までの層は抽選される。沈降を始めれば、ただちに第1層へ沈む。下へ行くほど層は増える。死ねばその人生は終わる。遺物と記録だけが、次の器に残る。
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={begin}
            className="min-h-11 rounded-[var(--radius-md)] bg-parchment px-6 py-3 font-display text-base text-ink transition-transform duration-(--motion-fast) hover:scale-[1.02] active:scale-[0.98]"
          >
            {profile.playerName ? `${profile.playerName}の日誌` : "潜航前点検"}
          </button>
          <button
            type="button"
            onClick={() => {
              unlockAudio();
              setSettings(true);
            }}
            className="min-h-11 rounded-[var(--radius-md)] px-6 py-3 font-display text-base text-parchment shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-parchment)_28%,transparent)]"
          >
            設定
          </button>
          <p className="font-mono text-xs tracking-wider text-muted">
            回数 {profile.runs} · 最深 {profile.bestFloor ? `第${profile.bestFloor}層` : "未潜航"} · 遺物{" "}
            {profile.collection.length}
          </p>
        </div>
      </div>
      {settings ? <SettingsPanel onClose={() => setSettings(false)} /> : null}
    </section>
  );
}

function SettingsPanel({ onClose }: { onClose: () => void }) {
  const [vol, setVol] = useState(() => getSfxVolume());

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
        aria-labelledby="settings-title"
        className="relative w-full max-w-md rounded-[var(--radius-xl)] bg-surface px-5 py-6 shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-parchment)_14%,transparent)] sm:px-6"
      >
        <p className="font-mono text-xs tracking-widest text-accent">設定</p>
        <h2 id="settings-title" className="font-display mt-1 text-2xl text-parchment">
          音量
        </h2>
        <label className="mt-6 block">
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
