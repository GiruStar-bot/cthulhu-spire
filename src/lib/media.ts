const VIDEO_EXT = /\.(mp4|webm|ogv)(\?|#|$)/i;

export function isVideoSrc(src: string): boolean {
  return VIDEO_EXT.test(src);
}

export function videoStem(src: string): string {
  return src.replace(/\.(mp4|webm|ogv)(\?.*)?$/i, "");
}

export function videoUrl(src: string, ext: "mp4" | "webm"): string {
  const cut = src.search(/[?#]/);
  const path = cut < 0 ? src : src.slice(0, cut);
  const suffix = cut < 0 ? "" : src.slice(cut);
  const stem = path.replace(/\.(mp4|webm|ogv)$/i, "");
  return `${stem}.${ext}${suffix}`;
}
