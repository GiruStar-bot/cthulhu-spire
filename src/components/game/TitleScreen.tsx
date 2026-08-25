import { useGame } from "@/game/store";
import { asset } from "@/lib/asset";

export function TitleScreen() {
  const begin = useGame((s) => s.begin);
  const profile = useGame((s) => s.profile);

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
          <p className="font-mono text-xs tracking-wider text-muted">
            回数 {profile.runs} · 最深 {profile.bestFloor ? `第${profile.bestFloor}層` : "未潜航"} · 遺物{" "}
            {profile.collection.length}
          </p>
        </div>
      </div>
    </section>
  );
}
