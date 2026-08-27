import { useGame } from "@/game/store";
import { useState } from "react";

const BEATS = [
  {
    kicker: "夢",
    html: 'ここは<ruby>どこだ<rt>ルルイエ</rt></ruby>？',
  },
  {
    kicker: "声",
    html: "善き力か悪しき力、もしくは……",
  },
  {
    kicker: "第一層",
    html: "仇……",
  },
] as const;

export function PrologueView() {
  const finish = useGame((s) => s.finishPrologue);
  const [i, setI] = useState(0);
  const beat = BEATS[i]!;

  return (
    <section
      className="flex h-dvh cursor-pointer flex-col justify-end bg-ink px-8 pb-16 sm:px-16"
      onClick={() => {
        if (i >= BEATS.length - 1) finish();
        else setI((n) => n + 1);
      }}
    >
      <p className="font-mono text-[11px] tracking-widest text-accent">{beat.kicker}</p>
      <p
        className="font-display mt-4 text-3xl text-parchment sm:text-5xl"
        dangerouslySetInnerHTML={{ __html: beat.html }}
      />
      <p className="mt-8 font-mono text-[11px] text-muted">触れて進む</p>
    </section>
  );
}
