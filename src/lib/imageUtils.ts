export type ChromaKeyOpts = {
  /** RGB key. Defaults to magenta. */
  key?: [number, number, number];
  /**
   * Euclidean distance (0–441) at which a pixel is fully transparent.
   * Higher = more of the pink field is eaten. Default 96.
   */
  tolerance?: number;
  /** Extra distance past tolerance where alpha is feathered. Default 64. */
  feather?: number;
  /** If true, sample the four corners and average them as the key color. */
  sampleCorners?: boolean;
};

const MAGENTA: [number, number, number] = [255, 0, 255];

export function chromaKeyImageData(image: ImageData, opts: ChromaKeyOpts = {}): ImageData {
  const px = image.data;
  const [kr, kg, kb] = opts.sampleCorners ? sampleCorners(image) ?? (opts.key ?? MAGENTA) : (opts.key ?? MAGENTA);
  const inner = Math.max(8, opts.tolerance ?? 96);
  const outer = inner + Math.max(8, opts.feather ?? 64);
  const inner2 = inner * inner;
  const outer2 = outer * outer;
  const span = Math.max(1, outer2 - inner2);

  for (let i = 0; i < px.length; i += 4) {
    const r = px[i];
    const g = px[i + 1];
    const b = px[i + 2];
    const a = px[i + 3];
    if (a === 0) continue;

    const dr = r - kr;
    const dg = g - kg;
    const db = b - kb;
    let d2 = dr * dr + dg * dg + db * db;

    const spill = (r + b) * 0.5 - g;
    if (spill > 36 && g < 110 && r > 140 && b > 140) {
      const extra = (spill - 36) * 4;
      d2 = Math.min(d2, extra * extra);
    }

    if (d2 <= inner2) {
      px[i + 3] = 0;
      continue;
    }
    if (d2 >= outer2) continue;

    const t = (d2 - inner2) / span;
    px[i + 3] = Math.round(a * t);
    const mix = 1 - t;
    const mag = Math.min(r, b);
    px[i] = clamp(r - mag * mix * 0.55);
    px[i + 2] = clamp(b - mag * mix * 0.55);
    px[i + 1] = clamp(g + mag * mix * 0.18);
  }
  return image;
}

export function chromaKeyCanvas(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  opts?: ChromaKeyOpts,
) {
  const frame = ctx.getImageData(0, 0, w, h);
  chromaKeyImageData(frame, opts);
  ctx.putImageData(frame, 0, 0);
}

function sampleCorners(image: ImageData): [number, number, number] | null {
  const { data: d, width: w, height: h } = image;
  if (w < 2 || h < 2) return null;
  const pts = [0, (w - 1) * 4, (h - 1) * w * 4, ((h - 1) * w + (w - 1)) * 4];
  let r = 0;
  let g = 0;
  let b = 0;
  let a = 0;
  for (const p of pts) {
    r += d[p];
    g += d[p + 1];
    b += d[p + 2];
    a += d[p + 3];
  }
  r /= 4;
  g /= 4;
  b /= 4;
  a /= 4;
  if (a < 40) return null;
  const magentaLike = r > 140 && b > 140 && g < 130;
  return magentaLike ? [r, g, b] : null;
}

function clamp(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)));
}
