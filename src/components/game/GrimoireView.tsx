import { useGame } from "@/game/store";
import { GRIMOIRE, nextUnread } from "@/game/grimoire";
import { grimoireOpen, MADNESS_STEP, SANITY_PENALTY_PER_TIER, derivedVitals } from "@/game/profile";
import { getCard } from "@/game/cards";
import { useState } from "react";

export function GrimoirePanel({ onClose }: { onClose: () => void }) {
  const profile = useGame((s) => s.profile);
  const turn = useGame((s) => s.turnGrimoirePage);
  const [page, setPage] = useState<0 | 1>(0);
  const allowed = grimoireOpen(profile);
  const unread = allowed ? nextUnread(profile.grimoireRead) : null;
  const nextMax = derivedVitals(profile.stats, (profile.madness | 0) + MADNESS_STEP).maxSanity;

  if (!allowed) {
    return (
      <div className="absolute inset-0 z-20 flex items-end justify-center bg-ink/70 px-4 py-10 sm:items-center">
        <button type="button" className="absolute inset-0" aria-label="閉じる" onClick={onClose} />
        <div className="relative w-full max-w-md px-2">
          <p className="prologue-line text-2xl sm:text-3xl">文字が、降りてこない。</p>
          <button type="button" className="mt-8 font-mono text-sm text-muted" onClick={onClose}>
            閉じる
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-20 flex items-end justify-center bg-ink/75 px-4 py-8 sm:items-center">
      <button type="button" className="absolute inset-0" aria-label="閉じる" onClick={onClose} />
      <div className="book-open rot-paper relative flex max-h-[88dvh] w-full max-w-2xl flex-col overflow-hidden px-5 py-5 sm:px-8">
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
                className="min-h-11 rounded-[var(--radius-md)] bg-parchment px-5 py-2 font-display text-ink disabled:opacity-40"
                onClick={() => setPage(1)}
                disabled={!unread}
              >
                次の頁へ
              </button>
              <button type="button" className="min-h-11 px-4 font-mono text-sm text-muted" onClick={onClose}>
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
                className="min-h-11 rounded-[var(--radius-md)] bg-blood px-5 py-2 font-display text-parchment disabled:opacity-40"
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
    </div>
  );
}
