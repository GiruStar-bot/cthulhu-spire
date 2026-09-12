import { DeckBuilderScreen } from "@/components/loadout/DeckBuilderScreen";
import { DeckListScreen } from "@/components/loadout/DeckListScreen";
import { StarterDeckPickScreen } from "@/components/loadout/StarterDeckPickScreen";
import { useGame } from "@/game/store";
import { useCollectionStore } from "@/store/useCollectionStore";
import { useState } from "react";

export function DeckHubScreen({ onBack }: { onBack: () => void }) {
  const [mode, setMode] = useState<"list" | "edit">("list");
  const setActiveDeck = useCollectionStore((s) => s.setActiveDeck);
  const starterChosen = useGame((s) => s.profile.starterChosen);

  const openDeck = (name: string) => {
    setActiveDeck(name);
    setMode("edit");
  };

  if (!starterChosen) {
    return <StarterDeckPickScreen />;
  }

  if (mode === "edit") {
    return <DeckBuilderScreen embedded onBack={() => setMode("list")} />;
  }
  return <DeckListScreen onBack={onBack} onEditDeck={openDeck} />;
}
