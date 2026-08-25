import { ClassSelect } from "@/components/game/ClassSelect";
import { CombatView } from "@/components/game/CombatView";
import { EndView } from "@/components/game/EndView";
import { EventView } from "@/components/game/EventView";
import { MapView } from "@/components/game/MapView";
import { RestView } from "@/components/game/RestView";
import { RewardView } from "@/components/game/RewardView";
import { TitleScreen } from "@/components/game/TitleScreen";
import { useGame } from "@/game/store";

export function GameApp() {
  const scene = useGame((s) => s.scene);
  switch (scene) {
    case "title":
      return <TitleScreen />;
    case "classSelect":
      return <ClassSelect />;
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
    case "victory":
      return <EndView kind="victory" />;
    case "defeat":
      return <EndView kind="defeat" />;
  }
}
