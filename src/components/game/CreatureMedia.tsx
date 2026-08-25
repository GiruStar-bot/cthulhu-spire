import { isVideoSrc, videoStem } from "@/lib/media";
import { useEffect, useRef, useState } from "react";

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
  const [useCanvas, setUseCanvas] = useState(false);
  const reduce =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = true;
    if (reduce) {
      el.pause();
      return;
    }
    void el.play().catch(() => {});
  }, [src, reduce]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onMeta = () => {
      const current = video.currentSrc || "";
      setUseCanvas(/\.mp4(\?|#|$)/i.test(current));
    };
    video.addEventListener("loadedmetadata", onMeta);
    return () => video.removeEventListener("loadedmetadata", onMeta);
  }, [src]);

  useEffect(() => {
    if (!useCanvas || reduce) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
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
        const img = ctx.getImageData(0, 0, w, h);
        const d = img.data;
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i];
          const g = d[i + 1];
          const b = d[i + 2];
          const mag = Math.min(r, b) - g;
          if (r > 90 && b > 90 && mag > 28) {
            const t = Math.min(255, mag * 2.4);
            d[i + 3] = Math.max(0, 255 - t);
            d[i] = Math.min(r, g + 24);
            d[i + 2] = Math.min(b, g + 24);
          }
        }
        ctx.putImageData(img, 0, 0);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [useCanvas, reduce]);

  const stem = videoStem(src);

  return (
    <>
      <video
        ref={videoRef}
        className={useCanvas ? "creature-video-src" : undefined}
        muted
        loop
        playsInline
        autoPlay={!reduce}
        preload="auto"
        poster={poster}
        onLoadedMetadata={(e) => {
          const current = e.currentTarget.currentSrc || "";
          setUseCanvas(/\.mp4(\?|#|$)/i.test(current));
        }}
      >
        <source src={`${stem}.webm`} type="video/webm" />
        <source src={`${stem}.mp4`} type="video/mp4" />
      </video>
      {useCanvas ? <canvas ref={canvasRef} className="creature-video-canvas" /> : null}
    </>
  );
}
