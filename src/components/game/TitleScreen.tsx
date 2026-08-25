import { playBgm, unlockAudio } from "@/game/audio";
import { useGame } from "@/game/store";
import { asset } from "@/lib/asset";
import { useEffect } from "react";

export function TitleScreen() {
  const begin = useGame((s) => s.begin);
  const profile = useGame((s) => s.profile);

  useEffect(() => {
    unlockAudio();
    playBgm("title");
  }, []);

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
        <p className="font-mono text-[11px] tracking-widest text-accent">無限の登攀</p>
        <h1 className="font-display max-w-xl text-5xl leading-[1.05] text-parchment sm:text-7xl">
          クトゥルスパイア
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-muted sm:text-base">
          名を刻み、肉体と知識と意志を振り、遺物を六つまで携えて塔へ入る。死ねばその人生は終わる。遺物と記録だけが、次の器に残る。
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={begin}
            className="min-h-11 rounded-[var(--radius-md)] bg-parchment px-6 py-3 font-display text-base text-ink transition-transform duration-(--motion-fast) hover:scale-[1.02] active:scale-[0.98]"
          >
            {profile.playerName ? `${profile.playerName}として調える` : "器を調える"}
          </button>
          <p className="font-mono text-[11px] tracking-wider text-muted">
            回数 {profile.runs} · 最高階 {profile.bestFloor} · 遺物 {profile.collection.length}
          </p>
        </div>
      </div>
    </section>
  );
}
