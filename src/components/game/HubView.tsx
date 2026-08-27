import { CreditsPanel, SettingsPanel } from "@/components/game/TitleScreen";
import { GrimoirePanel } from "@/components/game/GrimoireView";
import { stopBgm, unlockAudio } from "@/game/audio";
import { useGame } from "@/game/store";
import { asset } from "@/lib/asset";
import { useEffect, useState } from "react";

export function HubView() {
  const seek = useGame((s) => s.seek);
  const profile = useGame((s) => s.profile);
  const [sheet, setSheet] = useState<"settings" | "credits" | "tome" | null>(null);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    const kick = () => {
      unlockAudio();
      stopBgm();
    };
    kick();
    window.addEventListener("pointerdown", kick, { once: true });
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
      window.removeEventListener("pointerdown", kick);
    };
  }, []);

  return (
    <section className="relative h-dvh w-full overflow-hidden bg-ink">
      <img
        src={asset("art/hub-camp.jpg")}
        alt=""
        className="absolute inset-0 size-full object-cover"
        crossOrigin="anonymous"
      />
      <div className="absolute inset-0 bg-ink/20" />

      <button
        type="button"
        className="hub-tome"
        aria-label="閉じた本"
        onClick={() => setSheet("tome")}
      >
        閉じた本
      </button>

      <div className="absolute inset-x-0 bottom-10 z-10 flex flex-col items-center gap-4 px-4">
        <button type="button" className="hub-seek" onClick={seek}>
          探求
        </button>
        <div className="flex flex-wrap justify-center gap-4">
          <button
            type="button"
            className="font-mono text-xs tracking-widest text-muted"
            onClick={() => {
              unlockAudio();
              setSheet("settings");
            }}
          >
            設定
          </button>
          <button
            type="button"
            className="font-mono text-xs tracking-widest text-muted"
            onClick={() => setSheet("credits")}
          >
            クレジット
          </button>
        </div>
        <p className="font-mono text-[11px] tracking-wider text-muted">
          {profile.playerName || "無名"} · 最深 {profile.bestFloor ? `第${profile.bestFloor}層` : "未潜航"}
        </p>
      </div>

      {sheet === "settings" ? <SettingsPanel onClose={() => setSheet(null)} /> : null}
      {sheet === "credits" ? <CreditsPanel onClose={() => setSheet(null)} /> : null}
      {sheet === "tome" ? <GrimoirePanel onClose={() => setSheet(null)} /> : null}
    </section>
  );
}
