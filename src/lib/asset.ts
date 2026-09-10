export function asset(path: string): string {
  const base = import.meta.env.BASE_URL ?? "/";
  const cleanPath = path.replace(/^\/+/, "");
  const version = import.meta.env.VITE_COMMIT_SHA ?? "dev";
  const separator = cleanPath.includes("?") ? "&" : "?";
  return `${base}${cleanPath}${separator}v=${version}`;
}
