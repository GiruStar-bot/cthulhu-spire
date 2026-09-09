import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function PixelWindow({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("panel frame-panel p-3 font-pixel text-white", className)}
      {...props}
    >
      {children}
    </div>
  );
}