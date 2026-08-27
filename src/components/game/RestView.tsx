import { CardView } from "@/components/game/CardView";
import { DeckInspect } from "@/components/game/DeckInspect";
import { Vitals } from "@/components/game/Hud";
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
  return <VillageHub />;
}

function Shells() {
  const n = useGame((s) => s.shells);
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-xs tabular-nums text-parchment">
      <img src={asset("art/shell.jpg")} alt="" className="size-5 rounded-full object-cover" />
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
    <section className="relative h-dvh overflow-hidden bg-ink">
      <img src={asset("art/village.jpg")} alt="" className="absolute inset-0 size-full object-cover" />
      <div className="absolute inset-0 bg-linear-to-t from-ink via-ink/50 to-ink/20" />
      <div className="relative z-10 flex h-dvh flex-col justify-end gap-3 px-5 pb-10 sm:px-12">
        <Vitals />
        <Shells />
        {toast ? (
          <button type="button" onClick={dismiss} className="w-fit text-left text-sm text-parchment">
            {toast}
          </button>
        ) : null}
        <p className="font-mono text-[11px] tracking-widest text-accent">村落</p>
        <h2 className="font-display text-4xl text-parchment">灯の見える岸</h2>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button type="button" className="village-btn" onClick={() => visit("inn")}>
            酒場
          </button>
          <button type="button" className="village-btn" onClick={() => visit("pub")}>
            パブ
          </button>
          <button type="button" className="village-btn" onClick={() => visit("smith")}>
            鍛冶屋
          </button>
          <button type="button" className="village-btn is-leave" onClick={leave}>
            次の層へ
          </button>
        </div>
      </div>
      <DeckInspect />
    </section>
  );
}

function InnRoom() {
  const stay = useGame((s) => s.innStay);
  const visit = useGame((s) => s.visitVillage);
  const shells = useGame((s) => s.shells);
  return (
    <section className="relative h-dvh overflow-hidden bg-ink">
      <img src={asset("art/inn.jpg")} alt="" className="absolute inset-0 size-full object-cover" />
      <div className="absolute inset-0 bg-ink/55" />
      <div className="relative z-10 flex h-dvh flex-col justify-end gap-3 px-5 pb-10 sm:px-12">
        <Vitals />
        <Shells />
        <h2 className="font-display text-3xl text-parchment">酒場</h2>
        <p className="max-w-md text-sm text-muted">貝殻で部屋を取る。高いほど、傷が閉じる。</p>
        {([10, 20, 30] as const).map((n) => (
          <button
            key={n}
            type="button"
            disabled={shells < n}
            onClick={() => stay(n)}
            className="village-btn disabled:opacity-40"
          >
            {n}枚 · {n === 10 ? "体力2割 正気+10" : n === 20 ? "体力5割 正気+20" : "体力全快 正気+30"}
          </button>
        ))}
        <button type="button" className="text-sm text-muted" onClick={() => visit("hub")}>
          戻る
        </button>
      </div>
      <DeckInspect />
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
    <section className="relative h-dvh overflow-hidden bg-ink">
      <img src={asset("art/inn.jpg")} alt="" className="absolute inset-0 size-full object-cover" />
      <div className="absolute inset-0 bg-ink/60" />
      <div className="relative z-10 flex h-dvh flex-col justify-end gap-4 px-5 pb-10 sm:px-12">
        <Vitals />
        <Shells />
        <div className="flex items-end gap-4">
          <img
            src={asset("art/landlady.jpg")}
            alt=""
            className="h-40 w-28 rounded-[var(--radius-md)] object-cover object-top"
          />
          <div>
            <p className="font-mono text-[11px] tracking-widest text-accent">パブ</p>
            <h2 className="font-display text-3xl text-parchment">女将</h2>
            <p className="mt-1 max-w-sm text-sm text-muted">冷えた瓶。気力が戻る。二度飲めば空だ。</p>
          </div>
        </div>
        <button
          type="button"
          disabled={sold || shells < 5}
          onClick={buy}
          className="village-btn disabled:opacity-40"
        >
          {sold ? "売り切れ" : "ビール瓶 · 貝殻5"}
        </button>
        <button type="button" className="text-sm text-muted" onClick={() => visit("hub")}>
          戻る
        </button>
      </div>
      <DeckInspect />
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
    <section className={cn("relative min-h-dvh overflow-hidden bg-ink", shop.taboo && "smith-taboo")}>
      <img src={asset("art/smith.jpg")} alt="" className="absolute inset-0 size-full object-cover" />
      <div className="absolute inset-0 bg-ink/70" />
      <div className="relative z-10 flex min-h-dvh flex-col gap-4 px-5 py-6 sm:px-12">
        <Vitals />
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] tracking-widest text-accent">鍛冶屋</p>
            <h2 className="font-display text-3xl text-parchment">鍛冶屋</h2>
            <p className="font-mono text-xs text-muted">{shop.taboo ? "受け取れ" : rankLabel(shop.rank)}</p>
          </div>
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
                className="rounded-[var(--radius-md)] bg-surface/90 px-3 py-3 text-left disabled:opacity-40"
              >
                <p className="font-display text-parchment">{d.name}</p>
                <p className="mt-1 text-xs text-muted">{d.text}</p>
                <p className="mt-2 font-mono text-xs text-accent">
                  {g.sold ? "売約" : shop.taboo ? "0" : `${g.price}枚`}
                </p>
              </button>
            );
          })}
        </div>
        <div className="mt-auto flex flex-wrap gap-3 pb-4">
          <button type="button" className="village-btn" onClick={() => visit("upgrade")}>
            焼く（強化）
          </button>
          <button type="button" className="text-sm text-muted" onClick={() => visit("hub")}>
            戻る
          </button>
        </div>
      </div>
      <DeckInspect />
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
    <section className="relative min-h-dvh overflow-hidden bg-ink px-4 py-8">
      <img src={asset("art/smith.jpg")} alt="" className="absolute inset-0 size-full object-cover opacity-40" />
      <div className="relative z-10">
        <Vitals />
        <h2 className="font-display mt-6 text-3xl text-parchment">焼く</h2>
        <p className="mt-2 text-sm text-muted">{taboo ? "代償つきで、何度でも。" : "貝殻5。一度だけ、値が太る。"}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          {upgradable.map((c) => (
            <button key={c.uid} type="button" onClick={() => forge(c.uid)}>
              <CardView card={c} compact playable />
            </button>
          ))}
        </div>
        <button type="button" className="mt-8 text-sm text-muted" onClick={() => visit("smith")}>
          戻る
        </button>
      </div>
      <DeckInspect />
    </section>
  );
}
