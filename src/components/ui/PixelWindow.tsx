import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function PixelWindow({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("border-2 border-gray-200 bg-black/80 p-3 font-pixel text-white", className)}
      {...props}
    >
      {children}
    </div>
  );
}
