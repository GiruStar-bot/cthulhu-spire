const VIDEO_EXT = /\.(mp4|webm|ogv)(\?|#|$)/i;

export function isVideoSrc(src: string): boolean {
  return VIDEO_EXT.test(src);
}

export function videoStem(src: string): string {
  return src.replace(/\.(mp4|webm|ogv)(\?.*)?$/i, "");
}
