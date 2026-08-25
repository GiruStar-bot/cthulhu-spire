import { BetweenView } from "@/components/game/BetweenView";
import { CombatView } from "@/components/game/CombatView";
import { EndView } from "@/components/game/EndView";
import { EventView } from "@/components/game/EventView";
import { MapView } from "@/components/game/MapView";
import { PrepareView } from "@/components/game/PrepareView";
import { RestView } from "@/components/game/RestView";
import { RewardView } from "@/components/game/RewardView";
import { TitleScreen } from "@/components/game/TitleScreen";
import { useGame } from "@/game/store";

export function GameApp() {
  const scene = useGame((s) => s.scene);
  switch (scene) {
    case "title":
      return <TitleScreen />;
    case "prepare":
      return <PrepareView />;
    case "map":
      return <MapView />;
    case "combat":
      return <CombatView />;
    case "reward":
      return <RewardView />;
    case "rest":
      return <RestView />;
    case "event":
      return <EventView />;
    case "between":
      return <BetweenView />;
    case "victory":
      return <EndView kind="victory" />;
    case "defeat":
      return <EndView kind="defeat" />;
  }
}
