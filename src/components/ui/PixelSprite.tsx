import { chromaKeyCanvas } from "@/lib/imageUtils";
import { useEffect, useRef } from "react";

type PixelSpriteProps = {
  src: string;
  className?: string;
  tolerance?: number;
  feather?: number;
};

export function PixelSprite({ src, className, tolerance = 104, feather = 72 }: PixelSpriteProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (cancelled) return;
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      if (!w || !h) return;

      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0);
      chromaKeyCanvas(ctx, w, h, { tolerance, feather, sampleCorners: true });
    };
    img.src = src;

    return () => {
      cancelled = true;
    };
  }, [src, tolerance, feather]);

  return <canvas ref={canvasRef} className={className} />;
}
