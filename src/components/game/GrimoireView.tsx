import { useGame } from "@/game/store";
import { GRIMOIRE, nextUnread } from "@/game/grimoire";
import { MADNESS_STEP, SANITY_PENALTY_PER_TIER, derivedVitals } from "@/game/profile";
import { getCard } from "@/game/cards";
import { asset } from "@/lib/asset";
import { useState } from "react";

export function GrimoireView() {
  const profile = useGame((s) => s.profile);
  const close = useGame((s) => s.closeGrimoire);
  const turn = useGame((s) => s.turnGrimoirePage);
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState<0 | 1>(0);
  const unread = nextUnread(profile.grimoireRead);
  const nextMax = derivedVitals(profile.stats, (profile.madness | 0) + MADNESS_STEP).maxSanity;

  return (
    <section className="relative flex h-dvh flex-col overflow-hidden bg-ink">
      <img
        src={asset("art/cabin.jpg")}
        alt=""
        className="absolute inset-0 size-full object-cover"
        crossOrigin="anonymous"
      />
      <div className="absolute inset-0 bg-ink/55" />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-8">
        {!open ? (
          <button type="button" className="book-closed" onClick={() => setOpen(true)} aria-label="本を開く">
            <img src={asset("art/grimoire.jpg")} alt="" className="size-full object-cover" crossOrigin="anonymous" />
          </button>
        ) : (
          <div className="book-open rot-paper flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden px-5 py-5 sm:px-8">
            {page === 0 ? (
              <>
                <p className="font-mono text-[11px] tracking-widest text-accent">The All · 全</p>
                <h2 className="font-display mt-1 text-2xl text-parchment">目次：知識級数の深淵</h2>
                <ol className="mt-4 min-h-0 flex-1 space-y-1 overflow-y-auto font-mono text-xs text-muted">
                  {GRIMOIRE.map((ch) => {
                    const got = ch.cardId && profile.grimoireRead.includes(ch.cardId);
                    const locked = !ch.cardId;
                    return (
                      <li key={ch.index} className={got ? "text-parchment" : locked ? "opacity-40" : ""}>
                        第{ch.index}篇 {locked ? "■■■" : ch.title}
                        {got ? " · 記した" : ""}
                      </li>
                    );
                  })}
                </ol>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="min-h-11 rounded-[var(--radius-md)] bg-parchment px-5 py-2 font-display text-ink"
                    onClick={() => setPage(1)}
                    disabled={!unread}
                  >
                    次の頁へ
                  </button>
                  <button type="button" className="min-h-11 px-4 font-mono text-sm text-muted" onClick={close}>
                    閉じる
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="font-mono text-[11px] tracking-widest text-accent">第{unread?.index ?? "—"}篇</p>
                <h2 className="font-display mt-1 text-2xl text-parchment">{unread?.title ?? "白紙"}</h2>
                <p className="mt-3 text-sm leading-relaxed text-pretty text-muted">{unread?.body}</p>
                {unread?.cardId ? (
                  <p className="mt-4 font-display text-parchment">{getCard(unread.cardId).name}</p>
                ) : null}
                <p className="mt-4 font-mono text-xs text-blood">
                  頁を記す。狂気 +{MADNESS_STEP}。最大正気 {SANITY_PENALTY_PER_TIER} 減（予測 {nextMax}）。
                  正気0で記録は消える。
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="min-h-11 rounded-[var(--radius-md)] bg-blood px-5 py-2 font-display text-parchment"
                    onClick={() => {
                      turn();
                      setPage(0);
                    }}
                    disabled={!unread}
                  >
                    記す
                  </button>
                  <button type="button" className="min-h-11 px-4 font-mono text-sm text-muted" onClick={() => setPage(0)}>
                    目次へ
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
