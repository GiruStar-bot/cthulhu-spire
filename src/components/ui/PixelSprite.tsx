import { useEffect, useRef } from "react";

type PixelSpriteProps = {
  src: string;
  className?: string;
  tolerance?: number;
};

export function PixelSprite({ src, className, tolerance = 80 }: PixelSpriteProps) {
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
      const frame = ctx.getImageData(0, 0, w, h);
      const px = frame.data;
      const lo = tolerance;
      const hi = 255 - tolerance;
      for (let i = 0; i < px.length; i += 4) {
        if (px[i] > hi && px[i + 1] < lo && px[i + 2] > hi) {
          px[i + 3] = 0;
        }
      }
      ctx.putImageData(frame, 0, 0);
    };
    img.src = src;

    return () => {
      cancelled = true;
    };
  }, [src, tolerance]);

  return <canvas ref={canvasRef} className={className} />;
}
