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
  let ca = 0;
  for (const p of corners) {
    kr += d[p];
    kg += d[p + 1];
    kb += d[p + 2];
    ca += d[p + 3];
  }
  kr /= 4;
  kg /= 4;
  kb /= 4;
  ca /= 4;
  if (ca < 40) {
    despill(d);
    ctx.putImageData(img, 0, 0);
    return;
  }

  const field2 = 62 * 62;
  const fringe2 = 118 * 118;
  const key = new Uint8Array(n);
  for (let i = 0, p = 0; i < n; i++, p += 4) {
    const dr = d[p] - kr;
    const dg = d[p + 1] - kg;
    const db = d[p + 2] - kb;
    if (dr * dr + dg * dg + db * db <= field2) key[i] = 1;
  }

  const vis = new Uint8Array(n);
  const qx = new Int32Array(n);
  const qy = new Int32Array(n);
  let qs = 0;
  let qe = 0;
  const seed = (x: number, y: number) => {
    const i = y * w + x;
    if (!key[i] || vis[i]) return;
    vis[i] = 1;
    qx[qe] = x;
    qy[qe] = y;
    qe++;
  };
  for (let x = 0; x < w; x++) {
    seed(x, 0);
    seed(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    seed(0, y);
    seed(w - 1, y);
  }
  while (qs < qe) {
    const x = qx[qs];
    const y = qy[qs];
    qs++;
    if (x > 0) seed(x - 1, y);
    if (x + 1 < w) seed(x + 1, y);
    if (y > 0) seed(x, y - 1);
    if (y + 1 < h) seed(x, y + 1);
  }

  const kill = new Uint8Array(n);
  kill.set(vis);
  const nearBg = (p: number) => {
    const dr = d[p] - kr;
    const dg = d[p + 1] - kg;
    const db = d[p + 2] - kb;
    const dist = dr * dr + dg * dg + db * db;
    if (dist <= fringe2) return true;
    const spill = (d[p] + d[p + 2]) / 2 - d[p + 1];
    return spill > 28 && d[p + 1] < 70;
  };
  for (let pass = 0; pass < 2; pass++) {
    const next = new Uint8Array(kill);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (kill[i]) continue;
        const edge =
          (x > 0 && kill[i - 1]) ||
          (x + 1 < w && kill[i + 1]) ||
          (y > 0 && kill[i - w]) ||
          (y + 1 < h && kill[i + w]);
        if (edge && nearBg(i * 4)) next[i] = 1;
      }
    }
    kill.set(next);
  }

  for (let i = 0, p = 0; i < n; i++, p += 4) {
    if (kill[i]) {
      d[p] = 0;
      d[p + 1] = 0;
      d[p + 2] = 0;
      d[p + 3] = 0;
    }
  }
  despill(d);
  rim(d, w, h);
  ctx.putImageData(img, 0, 0);
}

function despill(d: Uint8ClampedArray) {
  for (let p = 0; p < d.length; p += 4) {
    if (d[p + 3] === 0) continue;
    const r = d[p];
    const g = d[p + 1];
    const b = d[p + 2];
    const spill = Math.max(0, (r + b) * 0.5 - g);
    if (spill < 10) continue;
    const t = Math.min(1, spill / 70);
    d[p] = Math.max(0, r - spill * 0.85);
    d[p + 2] = Math.max(0, b - spill * 0.85);
    d[p + 1] = Math.min(255, g + spill * 0.12);
    d[p + 3] = Math.max(0, d[p + 3] * (1 - t * 0.72));
    if (d[p + 3] < 28) {
      d[p] = 0;
      d[p + 1] = 0;
      d[p + 2] = 0;
      d[p + 3] = 0;
    }
  }
}

function rim(d: Uint8ClampedArray, w: number, h: number) {
  const n = w * h;
  const edge = new Uint8Array(n);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (d[i * 4 + 3] === 0) continue;
      const hollow =
        (x > 0 && d[(i - 1) * 4 + 3] === 0) ||
        (x + 1 < w && d[(i + 1) * 4 + 3] === 0) ||
        (y > 0 && d[(i - w) * 4 + 3] === 0) ||
        (y + 1 < h && d[(i + w) * 4 + 3] === 0);
      if (hollow) edge[i] = 1;
    }
  }
  for (let i = 0; i < n; i++) {
    if (!edge[i]) continue;
    const p = i * 4;
    d[p] = (d[p] * 0.38) | 0;
    d[p + 1] = (d[p + 1] * 0.38) | 0;
    d[p + 2] = (d[p + 2] * 0.38) | 0;
    d[p + 3] = (d[p + 3] * 0.5) | 0;
    if (d[p + 3] < 22) {
      d[p] = 0;
      d[p + 1] = 0;
      d[p + 2] = 0;
      d[p + 3] = 0;
    }
  }
}
