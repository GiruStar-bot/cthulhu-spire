import { CardView } from "@/components/game/CardView";
import { Bar, Vitals } from "@/components/game/Hud";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelWindow } from "@/components/ui/PixelWindow";
import { DeckBuilderScreen } from "@/components/loadout/DeckBuilderScreen";
import { getCard, makeCard } from "@/game/cards";
import { EQUIPMENT } from "@/game/equipment";
import { rankLabel } from "@/game/smith";
import { useGame } from "@/game/store";
import { asset } from "@/lib/asset";
import { cn } from "@/lib/utils";

export function RestView() {
  const room = useGame((s) => s.restMode);
  if (room === "inn") return <InnRoom />;
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
        className="group absolute bottom-[26%] left-[4%] z-10 w-[52vw] max-w-[34rem] min-w-48 transition-transform hover:-translate-y-1"
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
        className="group absolute bottom-[28%] right-[4%] z-[9] w-[44vw] max-w-[28rem] min-w-40 transition-transform hover:-translate-y-1"
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

function VillageStatus() {
  const hp = useGame((s) => s.hp);
  const maxHp = useGame((s) => s.maxHp);
  const sanity = useGame((s) => s.sanity);
  const maxSanity = useGame((s) => s.maxSanity);
  return (
    <div className="w-48 border-2 border-white bg-black/85 px-3 py-2 font-pixel">
      <Bar label="肉体" value={hp} max={maxHp} tone="hp" />
      <Bar label="正気" value={sanity} max={maxSanity} tone="sanity" />
    </div>
  );
}

function InnRoom() {
  const stay = useGame((s) => s.innStay);
  const visit = useGame((s) => s.visitVillage);
  const buyBeer = useGame((s) => s.buyBeer);
  const village = useGame((s) => s.village);
  const shells = useGame((s) => s.shells);
  const beerSold = !!village?.beerSold;
  return (
    <section className="relative h-dvh overflow-hidden bg-ink font-pixel">
      <img
        src={asset("art/pixel/village/tavern-interior.jpg")}
        alt=""
        className="absolute inset-0 size-full object-cover"
      />
      <div className="absolute inset-0 bg-black/55" />

      <div className="absolute top-3 left-3 z-20 flex flex-col gap-2 sm:top-5 sm:left-5">
        <VillageStatus />
        <Shells />
        <PixelWindow className="w-48">
          <h2 className="text-2xl text-white">酒場</h2>
          <p className="mt-1 text-xs text-muted">貝殻で部屋を取る。高いほど、傷が閉じる。</p>
        </PixelWindow>
      </div>

      <img
        src={asset("art/pixel/village/landlady.png")}
        alt=""
        className="pointer-events-none absolute bottom-0 left-[8%] z-10 h-[55dvh] max-h-96 select-none object-contain object-bottom drop-shadow-[4px_4px_0_rgba(0,0,0,0.6)]"
      />
      <div className="absolute bottom-[54dvh] left-[8%] z-10 border-2 border-white bg-black px-3 py-1.5 font-pixel text-sm text-white">
        いらっしゃい
      </div>

      <div className="relative z-10 flex h-dvh flex-col items-center justify-center gap-4 px-5 text-center">
        {([10, 20, 30] as const).map((n) => (
          <button
            key={n}
            type="button"
            disabled={shells < n}
            onClick={() => stay(n)}
            className="flex w-fit items-center gap-4 border-2 border-white bg-black/85 p-3 font-pixel text-left text-white disabled:opacity-40"
          >
            <img
              src={asset(`art/pixel/village/room-${n}.jpg`)}
              alt=""
              className="h-32 w-48 border-2 border-white object-cover"
            />
            <span className="text-lg">
              {n}枚 · {n === 10 ? "体力2割 正気+10" : n === 20 ? "体力5割 正気+20" : "体力全快 正気+30"}
            </span>
          </button>
        ))}
      </div>

      <div className="absolute top-1/2 right-[5%] z-10 flex w-56 -translate-y-1/2 flex-col items-center gap-2 border-2 border-white bg-black/85 p-4 text-center">
        <p className="text-[11px] tracking-widest text-accent">パブ</p>
        <p className="text-sm text-white">冷えた瓶。気力が戻る。二度飲めば空だ。</p>
        <PixelButton disabled={beerSold || shells < 5} onClick={buyBeer} className="w-fit">
          {beerSold ? "売り切れ" : "ビール瓶 · 貝殻5"}
        </PixelButton>
      </div>

      <PixelButton onClick={() => visit("hub")} className="fixed right-5 bottom-5 z-20">
        戻る
      </PixelButton>
    </section>
  );
}

function SmithRoom() {
  const village = useGame((s) => s.village);
  const buy = useGame((s) => s.buyGood);
  const buyEquipmentGood = useGame((s) => s.buyEquipmentGood);
  const visit = useGame((s) => s.visitVillage);
  const shells = useGame((s) => s.shells);
  const shop = village?.smith;
  if (!shop) return null;
  return (
    <section className={cn("relative min-h-dvh overflow-hidden bg-ink font-pixel", shop.taboo && "smith-taboo")}>
      <img
        src={asset("art/pixel/village/smith-interior.jpg")}
        alt=""
        className="absolute inset-0 size-full object-cover"
      />
      <div className="absolute inset-0 bg-black/70" />
      <img
        src={asset("art/pixel/village/smith-npc.png")}
        alt=""
        className="pointer-events-none absolute bottom-0 left-[4%] z-[5] h-[50dvh] max-h-80 select-none object-contain object-bottom object-left opacity-90"
      />
      <div className="absolute bottom-[48dvh] left-[4%] z-10 border-2 border-white bg-black px-3 py-1.5 font-pixel text-sm text-white">
        ……
      </div>
      <div className="relative z-10 flex min-h-dvh flex-col gap-4 px-5 py-6 sm:px-12">
        <div className="flex flex-wrap items-center gap-3">
          <Vitals />
          <Shells />
        </div>
        <div className="flex flex-wrap items-start gap-4">
          <PixelWindow className="shrink-0">
            <p className="text-[11px] tracking-widest text-accent">鍛冶屋</p>
            <h2 className="text-3xl text-white">鍛冶屋</h2>
            <p className="text-xs text-muted">{shop.taboo ? "受け取れ" : rankLabel(shop.rank)}</p>
          </PixelWindow>
          <div className="grid min-w-0 flex-1 grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] justify-items-center gap-3">
            {shop.goods.map((g) => {
              const disabled = g.sold || shells < g.price;
              return (
                <button
                  key={g.uid}
                  type="button"
                  disabled={disabled}
                  onClick={() => buy(g.uid)}
                  className={cn("flex flex-col items-center gap-1", disabled && "opacity-40")}
                >
                  <CardView card={makeCard(g.defId)} compact />
                  <span className="border-2 border-white bg-black px-2 py-0.5 font-pixel text-xs text-accent">
                    {g.sold ? "売約" : shop.taboo ? "0" : `${g.price}枚`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        {shop.equipmentGoods.length > 0 ? (
          <div className="mt-4">
            <p className="mb-2 text-xs tracking-widest text-muted">装備</p>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] justify-items-center gap-3">
              {shop.equipmentGoods.map((g) => {
                const def = EQUIPMENT[g.defId];
                const disabled = g.sold || shells < g.price;
                return (
                  <button
                    key={g.uid}
                    type="button"
                    disabled={disabled}
                    onClick={() => buyEquipmentGood(g.uid)}
                    className={cn(
                      "flex w-32 flex-col items-center gap-1 border-2 border-white bg-black/85 p-2 text-center",
                      disabled && "opacity-40",
                    )}
                  >
                    <img src={def.art} alt="" className="h-20 w-20 border-2 border-white object-cover" />
                    <span className="text-xs text-white">
                      {def.name}
                    </span>
                    <span className="border-2 border-white bg-black px-2 py-0.5 text-xs text-accent">
                      {g.sold ? "売約" : `${g.price}枚`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
        <div className="mt-auto flex flex-wrap gap-3 pb-4">
          <PixelButton onClick={() => visit("deck")}>デッキ編成</PixelButton>
          <PixelButton onClick={() => visit("upgrade")}>焼く（強化）</PixelButton>
        </div>
      </div>
      <PixelButton onClick={() => visit("hub")} className="fixed right-5 bottom-5 z-20">
        戻る
      </PixelButton>
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
      <img src={asset("art/pixel/village/smith-interior.jpg")} alt="" className="absolute inset-0 size-full object-cover opacity-40" />
      <div className="relative z-10">
        <PixelWindow className="max-w-md">
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
        <PixelButton className="fixed right-5 bottom-5 z-20" onClick={() => visit("smith")}>
          戻る
        </PixelButton>
      </div>
    </section>
  );
}
