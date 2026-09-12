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
        "ritual-button min-h-11 px-4 py-2 font-pixel text-white",
        "active:translate-y-[2px] active:shadow-none active:brightness-90",
        "disabled:pointer-events-none disabled:opacity-40",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
