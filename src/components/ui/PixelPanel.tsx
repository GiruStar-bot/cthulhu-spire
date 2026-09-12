import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type PanelElement = "aside" | "div" | "footer" | "header" | "nav" | "section";

type PixelPanelProps = HTMLAttributes<HTMLElement> & {
  as?: PanelElement;
};

/** Shared structural surface for HUD bars, side rails, panes, and windows. */
export function PixelPanel({ as: Component = "div", className, ...props }: PixelPanelProps) {
  return <Component className={cn("stone-panel font-pixel text-white", className)} {...props} />;
}
