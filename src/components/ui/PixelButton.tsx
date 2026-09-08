import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function PixelButton({
  className,
  children,
  disabled,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        "panel min-h-11 px-4 py-2 font-pixel text-white",
        "hover:border-white/60",
        "disabled:pointer-events-none disabled:opacity-40",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
