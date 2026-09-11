import { DeckBuilderScreen } from "@/components/loadout/DeckBuilderScreen";
import { DeckListScreen } from "@/components/loadout/DeckListScreen";
import { useCollectionStore } from "@/store/useCollectionStore";
import { useState } from "react";

export function DeckHubScreen({ onBack }: { onBack: () => void }) {
  const [mode, setMode] = useState<"list" | "edit">("list");
  const setActiveDeck = useCollectionStore((s) => s.setActiveDeck);

  const openDeck = (name: string) => {
    setActiveDeck(name);
    setMode("edit");
  };

  if (mode === "edit") {
    return <DeckBuilderScreen embedded onBack={() => setMode("list")} />;
  }
  return <DeckListScreen onBack={onBack} onEditDeck={openDeck} />;
}
