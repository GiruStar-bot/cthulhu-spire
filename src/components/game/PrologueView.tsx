import { useGame } from "@/game/store";
import { asset } from "@/lib/asset";
import { useState } from "react";

const BEATS = [
  'ここは<ruby>どこだ<rt>ルルイエ</rt></ruby>？',
  "善き力か悪しき力、もしくは……",
  "仇……",
] as const;

export function PrologueView() {
  const finish = useGame((s) => s.finishPrologue);
  const [i, setI] = useState(0);

  return (
    <section
      className="relative flex h-dvh cursor-pointer flex-col justify-end overflow-hidden bg-ink"
      onClick={() => {
        if (i >= BEATS.length - 1) finish();
        else setI((n) => n + 1);
      }}
    >
      <img
        src={asset("art/rlyeh-overlook.jpg")}
        alt=""
        className="absolute inset-0 size-full object-cover"
        crossOrigin="anonymous"
      />
      <div className="absolute inset-0 bg-linear-to-t from-ink via-ink/45 to-ink/20" />
      <p
        key={i}
        className="prologue-line relative z-10 px-8 pb-24 text-3xl sm:px-16 sm:text-5xl"
        dangerouslySetInnerHTML={{ __html: BEATS[i] }}
      />
    </section>
  );
}
