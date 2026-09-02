import { BetweenView } from "@/components/game/BetweenView";
import { CombatView } from "@/components/game/CombatView";
import { CullView } from "@/components/game/CullView";
import { EndView } from "@/components/game/EndView";
import { EventView } from "@/components/game/EventView";
import { HubScreen } from "@/components/game/HubScreen";
import { PrologueView } from "@/components/game/PrologueView";
import { RestView } from "@/components/game/RestView";
import { RewardView } from "@/components/game/RewardView";
import { ShatterView } from "@/components/game/ShatterView";
import { TitleScreen } from "@/components/game/TitleScreen";
import { useGame } from "@/game/store";

export function GameApp() {
  const scene = useGame((s) => s.scene);
  switch (scene) {
    case "title":
      return <TitleScreen />;
    case "hub":
    case "prepare":
      return <HubScreen />;
    case "prologue":
      return <PrologueView />;
    case "shatter":
      return <ShatterView />;
    case "map":
    case "combat":
      return <CombatView />;
    case "reward":
      return <RewardView />;
    case "cull":
      return <CullView />;
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