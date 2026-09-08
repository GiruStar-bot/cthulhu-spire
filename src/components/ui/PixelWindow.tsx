import type { HTMLAttributes } from "react";
import { PanelCorners } from "@/components/ui/PanelCorners";
import { cn } from "@/lib/utils";

export function PixelWindow({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("panel panel-corners p-3 font-pixel text-white", className)}
      {...props}
    >
      <PanelCorners className="size-6" />
      {children}
    </div>
  );
}