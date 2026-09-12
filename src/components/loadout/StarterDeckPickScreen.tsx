import { PixelButton } from "@/components/ui/PixelButton";
import { PixelWindow } from "@/components/ui/PixelWindow";
import { ARCHETYPE_LABELS, getCard } from "@/game/cards";
import { useGame } from "@/game/store";
import { asset } from "@/lib/asset";
import { STARTER_DECKS, useCollectionStore, type StarterArchetype } from "@/store/useCollectionStore";

const STARTER_ARCHETYPES: StarterArchetype[] = ["fanatic", "knight", "poison", "deep"];

export function StarterDeckPickScreen() {
  const chooseStarterDeck = useCollectionStore((s) => s.chooseStarterDeck);
  const markStarterChosen = useGame((s) => s.markStarterChosen);

  const pick = (archetype: StarterArchetype) => {
    chooseStarterDeck(archetype);
    markStarterChosen();
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto p-4">
      <PixelWindow className="mx-auto mb-4 w-full max-w-2xl shrink-0 text-center">
        <p className="text-xs tracking-widest text-muted">FIRST DESCENT</p>
        <h1 className="mt-1 text-xl text-white">最初のデッキを選べ</h1>
        <p className="mt-2 text-xs leading-relaxed text-muted">
          4つの流派から1つを選ぶと、その色に組まれたデッキで探索を始められる。この選択は最初の一度きり。
        </p>
      </PixelWindow>

      <div className="mx-auto grid w-full max-w-3xl grid-cols-[repeat(auto-fill,minmax(13rem,1fr))] gap-3">
        {STARTER_ARCHETYPES.map((archetype) => {
          const label = ARCHETYPE_LABELS[archetype] ?? archetype;
          const preview = STARTER_DECKS[archetype].slice(0, 3);
          return (
            <div
              key={archetype}
              className="pack-tome flex flex-col items-center gap-2 p-3 text-center transition-transform duration-(--motion-fast) ease-(--ease-smooth-out) hover:-translate-y-0.5"
            >
              <img
                src={asset(`art/pixel/packs/pack_${archetype}.png`)}
                alt=""
                className="w-full object-contain"
              />
              <p className="text-sm text-white">{label}</p>
              <ul className="w-full text-left text-[10px] text-muted">
                {preview.map((c) => (
                  <li key={c.id} className="truncate">
                    ・{getCard(c.id).name}
                  </li>
                ))}
              </ul>
              <PixelButton onClick={() => pick(archetype)} className="mt-1 min-h-9 w-full px-2 py-1 text-xs">
                このデッキで始める
              </PixelButton>
            </div>
          );
        })}
      </div>
    </div>
  );
}
