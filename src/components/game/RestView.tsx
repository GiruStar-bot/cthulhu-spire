import { CardView } from "@/components/game/CardView";
import { DeckInspect } from "@/components/game/DeckInspect";
import { Vitals } from "@/components/game/Hud";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelWindow } from "@/components/ui/PixelWindow";
import { DeckBuilderScreen } from "@/components/loadout/DeckBuilderScreen";
import { getCard } from "@/game/cards";
import { rankLabel } from "@/game/smith";
import { useGame } from "@/game/store";
import { asset } from "@/lib/asset";
import { cn } from "@/lib/utils";

export function RestView() {
  const room = useGame((s) => s.restMode);
  if (room === "inn") return <InnRoom />;
  if (room === "pub") return <PubRoom />;
  if (room === "smith") return <SmithRoom />;
  if (room === "upgrade") return <ForgeRoom />;
  if (room === "deck") return <DeckEditRoom />;
  return <VillageHub />;
}

function Shells() {
  const n = useGame((s) => s.shells);
  return (
    <span className="inline-flex items-center gap-1.5 font-pixel text-xs tabular-nums text-white">
      <img src={asset("art/shell.jpg")} alt="" className="size-5 rounded-none border-2 border-white object-cover" />
      {n}
    </span>
  );
}

function VillageHub() {
  const visit = useGame((s) => s.visitVillage);
  const leave = useGame((s) => s.leaveVillage);
  const toast = useGame((s) => s.toast);
  const dismiss = useGame((s) => s.dismissToast);
  return (
    <section className="relative h-dvh overflow-hidden bg-ink font-pixel">
      <img src={asset("art/pixel/village/bg.jpg")} alt="" className="absolute inset-0 size-full object-cover" />
      <div className="absolute inset-0 bg-black/25" />

      <div className="absolute top-3 left-3 z-20 flex flex-col gap-2 sm:top-5 sm:left-5">
        <Vitals />
        <Shells />
      </div>

      {toast ? (
        <button
          type="button"
          onClick={dismiss}
          className="absolute top-3 right-3 z-20 max-w-xs border-2 border-white bg-black px-3 py-2 text-left text-sm text-white sm:top-5 sm:right-5"
        >
          {toast}
        </button>
      ) : null}

      {/* 酒場 */}
      <button
        type="button"
        onClick={() => visit("inn")}
        className="group absolute bottom-[30%] left-[6%] z-10 w-[40vw] max-w-80 min-w-36 transition-transform hover:-translate-y-1"
      >
        <img
          src={asset("art/pixel/village/tavern.png")}
          alt="酒場"
          className="w-full select-none drop-shadow-[4px_4px_0_rgba(0,0,0,0.6)]"
        />
        <span className="absolute inset-x-6 -bottom-1 border-2 border-white bg-black px-2 py-1 text-center text-xs text-white">
          酒場
        </span>
      </button>

      {/* 鍛冶屋 */}
      <button
        type="button"
        onClick={() => visit("smith")}
        className="group absolute bottom-[32%] right-[8%] z-[9] w-[30vw] max-w-64 min-w-28 transition-transform hover:-translate-y-1"
      >
        <img
          src={asset("art/pixel/village/smith.png")}
          alt="鍛冶屋"
          className="w-full select-none drop-shadow-[3px_3px_0_rgba(0,0,0,0.6)]"
        />
        <span className="absolute inset-x-0 -bottom-6 border-2 border-white bg-black px-1.5 py-0.5 text-center text-[10px] text-white">
          鍛冶屋
        </span>
      </button>

      <PixelButton onClick={leave} className="absolute right-5 bottom-5 z-20">
        次の層へ
      </PixelButton>
    </section>
  );
}

function DeckEditRoom() {
  const visit = useGame((s) => s.visitVillage);
  const apply = useGame((s) => s.applyLoadoutToRun);
  return (
    <section className="h-dvh overflow-hidden bg-ink font-pixel">
      <DeckBuilderScreen
        onClose={() => {
          if (apply()) visit("smith");
        }}
      />
    </section>
  );
}

function InnRoom() {
  const stay = useGame((s) => s.innStay);
  const visit = useGame((s) => s.visitVillage);
  const shells = useGame((s) => s.shells);
  return (
    <section className="relative h-dvh overflow-hidden bg-ink font-pixel">
      <img src={asset("art/inn.jpg")} alt="" className="absolute inset-0 size-full object-cover" />
      <div className="absolute inset-0 bg-black/55" />
      <div className="relative z-10 flex h-dvh flex-col justify-end gap-3 px-5 pb-10 sm:px-12">
        <Vitals />
        <Shells />
        <PixelWindow className="max-w-md">
          <h2 className="text-3xl text-white">酒場</h2>
          <p className="mt-1 text-sm text-muted">貝殻で部屋を取る。高いほど、傷が閉じる。</p>
        </PixelWindow>
        {([10, 20, 30] as const).map((n) => (
          <PixelButton key={n} disabled={shells < n} onClick={() => stay(n)} className="w-fit">
            {n}枚 · {n === 10 ? "体力2割 正気+10" : n === 20 ? "体力5割 正気+20" : "体力全快 正気+30"}
          </PixelButton>
        ))}
        <PixelButton onClick={() => visit("pub")} className="w-fit">
          パブへ
        </PixelButton>
        <PixelButton onClick={() => visit("hub")} className="w-fit">
          戻る
        </PixelButton>
      </div>
    </section>
  );
}

function PubRoom() {
  const buy = useGame((s) => s.buyBeer);
  const visit = useGame((s) => s.visitVillage);
  const village = useGame((s) => s.village);
  const shells = useGame((s) => s.shells);
  const sold = !!village?.beerSold;
  return (
    <section className="relative h-dvh overflow-hidden bg-ink font-pixel">
      <img src={asset("art/inn.jpg")} alt="" className="absolute inset-0 size-full object-cover" />
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative z-10 flex h-dvh flex-col justify-end gap-4 px-5 pb-10 sm:px-12">
        <Vitals />
        <Shells />
        <div className="flex items-end gap-4">
          <img
            src={asset("art/landlady.jpg")}
            alt=""
            className="h-40 w-28 rounded-none border-2 border-white object-cover object-top"
          />
          <PixelWindow className="max-w-sm">
            <p className="text-[11px] tracking-widest text-accent">パブ</p>
            <h2 className="text-3xl text-white">女将</h2>
            <p className="mt-1 text-sm text-muted">冷えた瓶。気力が戻る。二度飲めば空だ。</p>
          </PixelWindow>
        </div>
        <PixelButton disabled={sold || shells < 5} onClick={buy} className="w-fit">
          {sold ? "売り切れ" : "ビール瓶 · 貝殻5"}
        </PixelButton>
        <PixelButton onClick={() => visit("hub")} className="w-fit">
          戻る
        </PixelButton>
      </div>
    </section>
  );
}

function SmithRoom() {
  const village = useGame((s) => s.village);
  const buy = useGame((s) => s.buyGood);
  const visit = useGame((s) => s.visitVillage);
  const shells = useGame((s) => s.shells);
  const shop = village?.smith;
  if (!shop) return null;
  return (
    <section className={cn("relative min-h-dvh overflow-hidden bg-ink font-pixel", shop.taboo && "smith-taboo")}>
      <img src={asset("art/smith.jpg")} alt="" className="absolute inset-0 size-full object-cover" />
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative z-10 flex min-h-dvh flex-col gap-4 px-5 py-6 sm:px-12">
        <Vitals />
        <div className="flex items-center justify-between gap-3">
          <PixelWindow>
            <p className="text-[11px] tracking-widest text-accent">鍛冶屋</p>
            <h2 className="text-3xl text-white">鍛冶屋</h2>
            <p className="text-xs text-muted">{shop.taboo ? "受け取れ" : rankLabel(shop.rank)}</p>
          </PixelWindow>
          <Shells />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {shop.goods.map((g) => {
            const d = getCard(g.defId);
            return (
              <button
                key={g.uid}
                type="button"
                disabled={g.sold || shells < g.price}
                onClick={() => buy(g.uid)}
                className="border-2 border-white bg-black px-3 py-3 text-left font-pixel disabled:opacity-40"
              >
                <p className="text-white">{d.name}</p>
                <p className="mt-1 text-xs text-muted">{d.text}</p>
                <p className="mt-2 text-xs text-accent">
                  {g.sold ? "売約" : shop.taboo ? "0" : `${g.price}枚`}
                </p>
              </button>
            );
          })}
        </div>
        <div className="mt-auto flex flex-wrap gap-3 pb-4">
          <PixelButton onClick={() => visit("deck")}>デッキ編成</PixelButton>
          <PixelButton onClick={() => visit("upgrade")}>焼く（強化）</PixelButton>
          <PixelButton onClick={() => visit("hub")}>戻る</PixelButton>
        </div>
      </div>
    </section>
  );
}

function ForgeRoom() {
  const deck = useGame((s) => s.deck);
  const forge = useGame((s) => s.forgeAtSmith);
  const visit = useGame((s) => s.visitVillage);
  const taboo = useGame((s) => s.village?.smith.taboo);
  const upgradable = deck.filter((c) => getCard(c.defId).type !== "status" && !c.forge);
  return (
    <section className="relative min-h-dvh overflow-hidden bg-ink px-4 py-8 font-pixel">
      <img src={asset("art/smith.jpg")} alt="" className="absolute inset-0 size-full object-cover opacity-40" />
      <div className="relative z-10">
        <Vitals />
        <PixelWindow className="mt-6 max-w-md">
          <h2 className="text-3xl text-white">焼く</h2>
          <p className="mt-2 text-sm text-muted">{taboo ? "代償つきで、何度でも。" : "貝殻5。一度だけ、値が太る。"}</p>
        </PixelWindow>
        <div className="mt-6 flex flex-wrap gap-3">
          {upgradable.map((c) => (
            <button key={c.uid} type="button" onClick={() => forge(c.uid)}>
              <CardView card={c} compact playable />
            </button>
          ))}
        </div>
        <PixelButton className="mt-8 w-fit" onClick={() => visit("smith")}>
          戻る
        </PixelButton>
      </div>
      <DeckInspect />
    </section>
  );
}
