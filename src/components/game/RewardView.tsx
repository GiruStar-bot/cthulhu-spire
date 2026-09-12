import { CardView } from "@/components/game/CardView";
import { PixelRelic } from "@/components/loadout/PixelRelic";
import { PixelRune } from "@/components/loadout/PixelRune";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelWindow } from "@/components/ui/PixelWindow";
import { DEMO_MAX_FLOOR, floorKindLabel, layerLabel } from "@/game/floors";
import { equipmentLabel } from "@/game/equipment";
import { PACK_TICKET_LABELS, packTicketArt } from "@/game/packTickets";
import type { RewardOffer } from "@/game/types";
import { useGame } from "@/game/store";
import { asset } from "@/lib/asset";

export function RewardView() {
  const reward = useGame((s) => s.reward);
  const rewardShells = useGame((s) => s.rewardShells);
  const claim = useGame((s) => s.claimReward);
  const floor = useGame((s) => s.floor);
  const runFloors = useGame((s) => s.runFloors);
  if (!reward) return null;
  const spec = runFloors[floor - 1];
  const bossGate = spec?.type === "boss";
  const items = reward.filter((offer) => offer.kind !== "none");

  return (
    <section className="relative min-h-dvh overflow-hidden bg-ink px-4 py-10 font-pixel sm:px-10">
      <PixelWindow className="mx-auto max-w-3xl px-5 py-8 sm:px-10">
        <p className="text-xs tracking-widest text-accent">
          {layerLabel(floor)} · {spec ? floorKindLabel(spec.type, floor) : "戦利"}
        </p>
        <h2 className="mt-2 text-3xl text-balance text-white">
          {items.length === 0 ? "何も見つからなかった" : "戦利品を発見"}
        </h2>
        <p className="mt-2 max-w-lg text-sm text-pretty text-muted">
          {bossGate && floor >= DEMO_MAX_FLOOR
            ? "最深の戦利。次に進むと、この沈降は終わる。"
            : bossGate && floor % 10 === 0
              ? "中ボスを越えた。次に進むと中継点で編成できる。"
              : "次の層へ沈む。"}
        </p>

        {rewardShells > 0 ? (
          <p className="panel mt-3 inline-flex items-center gap-1.5 px-2 py-1 text-xs tabular-nums text-white">
            <img src={asset("art/shell.jpg")} alt="" className="size-4 border-2 border-border object-cover" />
            貝がら +{rewardShells}
          </p>
        ) : null}

        {items.length > 0 ? (
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            {items.map((offer, i) => (
              <RewardItem key={i} offer={offer} />
            ))}
          </div>
        ) : (
          <p className="mt-8 text-center text-sm text-muted">今回は何も落ちていなかった。</p>
        )}

        <PixelButton onClick={claim} className="mx-auto mt-8 block">
          次へ進む
        </PixelButton>
      </PixelWindow>
    </section>
  );
}

function RewardItem({ offer }: { offer: RewardOffer }) {
  if (offer.kind === "card") {
    return <CardView card={offer.card} playable={false} />;
  }

  if (offer.kind === "ticket") {
    return (
      <div className="panel flex w-64 items-center gap-3 px-4 py-3">
        <img
          src={asset(packTicketArt(offer.ticket))}
          alt=""
          className="size-14 shrink-0 object-contain [image-rendering:pixelated]"
        />
        <div>
          <p className="text-[11px] tracking-widest text-accent">パックチケット</p>
          <p className="mt-1 text-xl text-white">{PACK_TICKET_LABELS[offer.ticket]}</p>
          <p className="mt-1 text-[10px] text-muted">帰還後も保管される</p>
        </div>
      </div>
    );
  }

  if (offer.kind === "equipment") {
    return (
      <div className="panel flex w-64 items-center gap-3 px-4 py-3">
        <PixelRelic defId={offer.equipment.defId} className="size-12 shrink-0" />
        <div>
          <p className="text-[11px] tracking-widest text-accent">装備</p>
          <p className="mt-1 text-xl text-white">{equipmentLabel(offer.equipment)}</p>
        </div>
      </div>
    );
  }

  if (offer.kind === "rune") {
    return (
      <div className="panel flex w-64 items-center gap-3 px-4 py-3">
        <PixelRune effect={offer.rune.effect} className="size-12 shrink-0" />
        <div>
          <p className="text-[11px] tracking-widest text-accent">ルーン</p>
          <p className="mt-1 text-xl text-white">
            {offer.rune.effect} {offer.rune.value}
          </p>
        </div>
      </div>
    );
  }

  return null;
}
