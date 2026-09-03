import { useGame } from "@/game/store";
import { PixelButton } from "@/components/ui/PixelButton";

export function ShatterView() {
  const accept = useGame((s) => s.acceptShatter);
  return (
    <section className="flex h-dvh flex-col items-center justify-center bg-ink px-8 text-center font-pixel">
      <p className="text-xs tracking-widest text-blood">器が砕ける</p>
      <h2 className="mt-3 text-5xl text-white sm:text-7xl">LOST THE ALL</h2>
      <PixelButton onClick={accept} className="mt-8">
        タイトル
      </PixelButton>
    </section>
  );
}
