import { chromaKeyCanvas } from "@/lib/imageUtils";
import { useEffect, useRef } from "react";

type PixelFramesProps = {
  srcs: string[];
  className?: string;
  ms?: number;
  tolerance?: number;
  feather?: number;
};

export function PixelFrames({ srcs, className, ms = 240, tolerance = 104, feather = 72 }: PixelFramesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<ImageData[]>([]);
  const idxRef = useRef(0);
  const key = srcs.join("|");

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas || srcs.length === 0) return;

    const load = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(src));
        img.src = src;
      });

    void Promise.all(srcs.map(load)).then((images) => {
      if (cancelled || !images[0]) return;
      const w = images[0].naturalWidth;
      const h = images[0].naturalHeight;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      const keyed: ImageData[] = [];
      for (const img of images) {
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        chromaKeyCanvas(ctx, w, h, { tolerance, feather, sampleCorners: true });
        keyed.push(ctx.getImageData(0, 0, w, h));
      }
      framesRef.current = keyed;
      idxRef.current = 0;
      ctx.putImageData(keyed[0]!, 0, 0);
    });

    return () => {
      cancelled = true;
    };
  }, [key, tolerance, feather, srcs]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const id = window.setInterval(() => {
      const frames = framesRef.current;
      const canvas = canvasRef.current;
      if (frames.length < 2 || !canvas) return;
      idxRef.current = (idxRef.current + 1) % frames.length;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.putImageData(frames[idxRef.current]!, 0, 0);
    }, ms);
    return () => window.clearInterval(id);
  }, [ms, key]);

  return <canvas ref={canvasRef} className={className} />;
}
