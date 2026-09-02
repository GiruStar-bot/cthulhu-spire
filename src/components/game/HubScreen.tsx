import { PrepareView } from "@/components/game/PrepareView";
import { CardForgeScreen } from "@/components/loadout/CardForgeScreen";
import { CollectionCard } from "@/components/loadout/CollectionCard";
import { PixelRelic } from "@/components/loadout/PixelRelic";
import { DeckBuilderScreen } from "@/components/loadout/DeckBuilderScreen";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelWindow } from "@/components/ui/PixelWindow";
import { layerLabel } from "@/game/floors";
import { derivedVitals } from "@/game/profile";
import { relicLabel } from "@/game/relics";
import { useGame } from "@/game/store";
import { asset } from "@/lib/asset";
import { cn } from "@/lib/utils";
import { useCollectionStore, type CardInstance } from "@/store/useCollectionStore";
import { useState } from "react";

type HubTab = "descend" | "deck" | "forge" | "stash";

const NAV: { id: HubTab; label: string }[] = [
  { id: "descend", label: "探索開始" },
  { id: "deck", label: "デッキ編成" },
  { id: "forge", label: "魔改造" },
  { id: "stash", label: "戦利品" },
];

export function HubScreen() {
  const profile = useGame((s) => s.profile);
  const playerName = useGame((s) => s.playerName);
  const shells = useGame((s) => s.shells);
  const toTitle = useGame((s) => s.toTitle);
  const deckCount = useCollectionStore((s) => s.deck.length);
  const [tab, setTab] = useState<HubTab>("descend");
  const vitals = derivedVitals(profile.stats, profile.madness);

  return (
    <section className="relative flex h-dvh w-full flex-col overflow-hidden bg-ink font-pixel text-parchment">
      <img
        src={asset("art/pixel/bg/loadout.jpg")}
        alt=""
        className="absolute inset-0 size-full object-cover"
        crossOrigin="anonymous"
      />
      <div className="absolute inset-0 bg-ink/60" />

      <header className="relative z-10 flex h-12 shrink-0 items-center gap-3 border-b-2 border-gray-200 bg-black px-3">
        <span className="truncate text-sm tracking-widest">{playerName.trim() || profile.playerName || "無名"}</span>
        <span className="hidden text-xs tabular-nums text-muted sm:inline">
          HP {vitals.maxHp} · SAN {vitals.maxSanity} · 貝殻 {shells}
        </span>
        <span className="ml-auto text-xs tabular-nums text-muted">
          最深 {profile.bestFloor ? layerLabel(profile.bestFloor) : "—"} · デッキ {deckCount}/20
        </span>
        <PixelButton onClick={toTitle} className="min-h-9 px-3 py-1 text-xs">
          タイトル
        </PixelButton>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1">
        <nav className="flex w-36 shrink-0 flex-col gap-1 border-r-2 border-gray-200 bg-black p-2 sm:w-44">
          {NAV.map((item) => (
            <PixelButton
              key={item.id}
              onClick={() => setTab(item.id)}
              className={cn(
                "w-full px-2 py-2 text-left text-xs",
                tab === item.id && "bg-white text-black",
              )}
            >
              {item.label}
            </PixelButton>
          ))}
        </nav>

        <div className="min-h-0 min-w-0 flex-1">
          {tab === "descend" ? <PrepareView embedded /> : null}
          {tab === "deck" ? <DeckBuilderScreen embedded /> : null}
          {tab === "forge" ? <CardForgeScreen embedded /> : null}
          {tab === "stash" ? <StashPanel /> : null}
        </div>
      </div>
    </section>
  );
}

function groupLoot(cards: CardInstance[]): { baseCardId: string; representative: CardInstance; count: number }[] {
  const map = new Map<string, { baseCardId: string; representative: CardInstance; count: number }>();
  for (const card of cards) {
    if ((card.origin ?? "starter") !== "loot") continue;
    const existing = map.get(card.baseCardId);
    if (existing) existing.count += 1;
    else map.set(card.baseCardId, { baseCardId: card.baseCardId, representative: card, count: 1 });
  }
  return [...map.values()];
}

function StashPanel() {
  const profile = useGame((s) => s.profile);
  const inventory = useCollectionStore((s) => s.inventory);
  const lootGroups = groupLoot(inventory.cards);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto p-3">
      <PixelWindow className="mb-3 rounded-none">
        <p className="text-xs tracking-widest text-muted">STASH</p>
        <h2 className="mt-1 text-xl text-white">戦利品</h2>
        <p className="mt-1 text-xs text-muted">魂に刻んだ遺物と、これまでの潜航で得たカード。</p>
      </PixelWindow>

      <p className="mb-2 text-xs tracking-widest text-muted">遺物 {profile.collection.length}</p>
      {profile.collection.length === 0 ? (
        <p className="mb-4 text-xs text-muted">まだ魂に刻んだ遺物はない。</p>
      ) : (
        <ul className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {profile.collection.map((inst) => (
            <li key={inst.uid}>
              <PixelWindow className="rounded-none p-2">
                <PixelRelic defId={inst.defId} className="mx-auto h-12 w-full" />
                <p className="mt-1 text-sm text-white">{relicLabel(inst)}</p>
                <p className="mt-1 text-[10px] text-muted">{layerLabel(inst.obtainedFloor)}</p>
              </PixelWindow>
            </li>
          ))}
        </ul>
      )}

      <p className="mb-2 text-xs tracking-widest text-muted">カード {lootGroups.length}</p>
      {lootGroups.length === 0 ? (
        <p className="mb-4 text-xs text-muted">まだ戦利品として手に入れたカードはない。</p>
      ) : (
        <div className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {lootGroups.map((g) => (
            <CollectionCard
              key={g.baseCardId}
              instance={{ ...g.representative, sockets: 0, socketedRunes: [] }}
              stackCount={g.count > 1 ? g.count : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
