import { PrepareView } from "@/components/game/PrepareView";
import { CollectionCard } from "@/components/loadout/CollectionCard";
import { DeckBuilderScreen } from "@/components/loadout/DeckBuilderScreen";
import { EquipmentScreen } from "@/components/loadout/EquipmentScreen";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelWindow } from "@/components/ui/PixelWindow";
import { layerLabel } from "@/game/floors";
import { derivedVitals } from "@/game/profile";
import { useGame } from "@/game/store";
import { asset } from "@/lib/asset";
import { cn } from "@/lib/utils";
import { loadoutError } from "@/game/cardEvaluator";
import { useCollectionStore, type CardInstance } from "@/store/useCollectionStore";
import { useState } from "react";

type HubTab = "descend" | "deck" | "equipment" | "stash";

const NAV: { id: HubTab; label: string }[] = [
  { id: "descend", label: "探索開始" },
  { id: "deck", label: "デッキ編成" },
  { id: "equipment", label: "装備" },
  { id: "stash", label: "戦利品" },
];

export function HubScreen() {
  const profile = useGame((s) => s.profile);
  const playerName = useGame((s) => s.playerName);
  const shells = useGame((s) => s.shells);
  const toTitle = useGame((s) => s.toTitle);
  const extractToHub = useGame((s) => s.extractToHub);
  const floor = useGame((s) => s.floor);
  const deckCount = useCollectionStore((s) => {
    const counts = s.decks[s.activeDeck] ?? {};
    return Object.values(counts).reduce((a, b) => a + b, 0);
  });
  const [tab, setTab] = useState<HubTab>("descend");
  const vitals = derivedVitals(profile.stats, profile.madness);
  const checkpoint = floor > 0;

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
          {checkpoint ? layerLabel(floor) : `最深 ${profile.bestFloor ? layerLabel(profile.bestFloor) : "—"}`} · デッキ {deckCount}/20
        </span>
        {checkpoint ? (
          <PixelButton onClick={extractToHub} className="min-h-9 px-3 py-1 text-xs">
            帰還
          </PixelButton>
        ) : (
          <PixelButton onClick={toTitle} className="min-h-9 px-3 py-1 text-xs">
            タイトル
          </PixelButton>
        )}
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
              {item.id === "descend" && checkpoint ? "中継" : item.label}
            </PixelButton>
          ))}
        </nav>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {tab === "descend" ? checkpoint ? <CheckpointPanel /> : <PrepareView embedded /> : null}
          {tab === "deck" ? <DeckBuilderScreen embedded /> : null}
          {tab === "equipment" ? <EquipmentScreen /> : null}
          {tab === "stash" ? <StashPanel /> : null}
        </div>
      </div>
    </section>
  );
}

function CheckpointPanel() {
  const floor = useGame((s) => s.floor);
  const hp = useGame((s) => s.hp);
  const maxHp = useGame((s) => s.maxHp);
  const sanity = useGame((s) => s.sanity);
  const maxSanity = useGame((s) => s.maxSanity);
  const shells = useGame((s) => s.shells);
  const toast = useGame((s) => s.toast);
  const resume = useGame((s) => s.resumeDescent);
  const extract = useGame((s) => s.extractToHub);
  const deckErr = loadoutError();

  return (
    <div className="flex h-full items-center justify-center p-4">
      <PixelWindow className="w-full max-w-lg p-5">
        <p className="text-[11px] tracking-widest text-accent">中継点</p>
        <h2 className="mt-1 text-3xl text-white">{layerLabel(floor)}を越えた</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          デッキ編成ができる。先へ沈むか、拠点へ戻るか。拾った装備はすでに残っている。
        </p>
        <p className="mt-3 text-xs tabular-nums text-white">
          HP {hp}/{maxHp} · SAN {sanity}/{maxSanity} · 貝殻 {shells}
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <PixelButton disabled={!!deckErr} onClick={resume}>
            次の層へ沈む
          </PixelButton>
          <PixelButton onClick={extract}>拠点へ帰還</PixelButton>
        </div>
        {deckErr ? <p className="mt-3 text-xs text-blood">{deckErr}</p> : null}
        {toast ? <p className="mt-3 text-xs text-muted">{toast}</p> : null}
      </PixelWindow>
    </div>
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
  const inventory = useCollectionStore((s) => s.inventory);
  const lootGroups = groupLoot(inventory.cards);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto p-3">
      <PixelWindow className="mb-3 rounded-none">
        <p className="text-xs tracking-widest text-muted">STASH</p>
        <h2 className="mt-1 text-xl text-white">戦利品</h2>
        <p className="mt-1 text-xs text-muted">これまでの潜航で得たカード。</p>
      </PixelWindow>

      <p className="mb-2 text-xs tracking-widest text-muted">カード {lootGroups.length}</p>
      {lootGroups.length === 0 ? (
        <p className="mb-4 text-xs text-muted">まだ戦利品として手に入れたカードはない。</p>
      ) : (
        <div className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {lootGroups.map((g) => (
            <CollectionCard
              key={g.baseCardId}
              instance={g.representative}
              stackCount={g.count > 1 ? g.count : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
