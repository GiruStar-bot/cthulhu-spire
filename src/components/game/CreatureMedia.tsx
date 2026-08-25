import { isVideoSrc, videoStem } from "@/lib/media";
import { useEffect, useRef } from "react";

export function CreatureMedia({
  src,
  poster,
}: {
  src: string;
  poster?: string;
}) {
  if (!isVideoSrc(src)) {
    return <img src={src} alt="" crossOrigin="anonymous" />;
  }
  return <CreatureVideo src={src} poster={poster} />;
}

function CreatureVideo({ src, poster }: { src: string; poster?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stem = videoStem(src);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    video.muted = true;
    if (reduce) video.pause();
    else void video.play().catch(() => {});

    let raf = 0;
    const tick = () => {
      if (video.readyState >= 2 && video.videoWidth) {
        const w = video.videoWidth;
        const h = video.videoHeight;
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }
        ctx.drawImage(video, 0, 0, w, h);
        keyMagenta(ctx, w, h);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [src]);

  return (
    <>
      <video
        ref={videoRef}
        className="creature-video-src"
        muted
        loop
        playsInline
        autoPlay
        preload="auto"
        poster={poster}
        crossOrigin="anonymous"
      >
        <source src={`${stem}.mp4`} type="video/mp4" />
        <source src={`${stem}.webm`} type="video/webm" />
      </video>
      <canvas ref={canvasRef} className="creature-video-canvas" aria-hidden />
    </>
  );
}

function keyMagenta(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const n = w * h;
  const corners = [0, (w - 1) * 4, (h - 1) * w * 4, ((h - 1) * w + w - 1) * 4];
  let kr = 0;
  let kg = 0;
  let kb = 0;
  for (const p of corners) {
    kr += d[p];
    kg += d[p + 1];
    kb += d[p + 2];
  }
  kr /= 4;
  kg /= 4;
  kb /= 4;
  const dist2 = 96 * 96;

  for (let p = 0; p < d.length; p += 4) {
    const dr = d[p] - kr;
    const dg = d[p + 1] - kg;
    const db = d[p + 2] - kb;
    if (dr * dr + dg * dg + db * db <= dist2) {
      d[p] = 0;
      d[p + 1] = 0;
      d[p + 2] = 0;
      d[p + 3] = 0;
    }
  }
  ctx.putImageData(img, 0, 0);
}
