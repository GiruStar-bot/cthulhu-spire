import { asset } from "@/lib/asset";

export const IDLE_FRAMES: Record<string, string[]> = {
  priest: [1, 2, 3, 4, 5].map((n) => asset(`art/pixel/priest/idle-${n}.jpg`)),
};
