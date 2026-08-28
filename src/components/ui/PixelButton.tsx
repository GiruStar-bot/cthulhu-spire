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
        "min-h-11 border-2 border-white bg-black px-4 py-2 font-pixel text-white",
        "hover:bg-white hover:text-black",
        "active:bg-white active:text-black",
        "disabled:pointer-events-none disabled:opacity-40",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
