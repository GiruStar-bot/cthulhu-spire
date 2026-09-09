import { PixelWindow } from "@/components/ui/PixelWindow";

export function ShopPanel() {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto p-3">
      <PixelWindow className="mb-3">
        <p className="text-xs tracking-widest text-muted">SHOP</p>
        <h2 className="mt-1 text-xl text-white">ショップ</h2>
        <p className="mt-1 text-xs text-muted">近日公開。デッキやカードパックの購入を予定している。</p>
      </PixelWindow>
    </div>
  );
}
