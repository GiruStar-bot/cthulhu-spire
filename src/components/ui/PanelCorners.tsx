import corner from "@/assets/ui/corner_ornament.png";
import { cn } from "@/lib/utils";

export function PanelCorners({ className }: { className?: string }) {
  const frame = cn("pointer-events-none absolute z-5 object-contain", className ?? "size-5");
  return (
    <>
      <img alt="" aria-hidden src={corner} className={cn(frame, "top-0 left-0")} />
      <img alt="" aria-hidden src={corner} className={cn(frame, "top-0 right-0 rotate-90")} />
      <img alt="" aria-hidden src={corner} className={cn(frame, "right-0 bottom-0 rotate-180")} />
      <img alt="" aria-hidden src={corner} className={cn(frame, "bottom-0 left-0 -rotate-90")} />
    </>
  );
}
