import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { PixelPanel } from "@/components/ui/PixelPanel";

export function PixelWindow({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <PixelPanel className={cn("frame-panel p-3", className)} {...props}>
      {children}
    </PixelPanel>
  );
}
