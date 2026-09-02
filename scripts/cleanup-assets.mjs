#!/usr/bin/env node
/**
 * Scan src + index.html for asset references, then isolate unused files
 * from public/ and src/assets/ into unused_assets/.
 *
 *   node scripts/cleanup-assets.mjs              # dry-run (default)
 *   node scripts/cleanup-assets.mjs --verbose    # also list files kept
 *   node scripts/cleanup-assets.mjs --apply      # move after confirm
 *   node scripts/cleanup-assets.mjs --apply --yes
 */
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { copyFileSync, mkdirSync, readdirSync, renameSync, rmSync } from "node:fs";
import { dirname, extname, join, relative, sep } from "node:path";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL("..", import.meta.url)));
const SRC = join(ROOT, "src");
const PUBLIC = join(ROOT, "public");
const SRC_ASSETS = join(ROOT, "src/assets");
const QUARANTINE = join(ROOT, "unused_assets");
const INDEX_HTML = join(ROOT, "index.html");

const CODE_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".css", ".html", ".json", ".mjs", ".cjs"]);
const ASSET_EXT = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".webp",
  ".avif",
  ".bmp",
  ".ico",
  ".mp3",
  ".wav",
  ".ogg",
  ".m4a",
  ".flac",
  ".mp4",
  ".webm",
  ".mov",
  ".woff",
  ".woff2",
  ".ttf",
  ".otf",
]);
const KEEP_ALWAYS = new Set([
  "favicon.ico",
  "favicon.svg",
  "favicon.png",
  "apple-touch-icon.png",
  "og.jpg",
  "og.png",
  "og-x.jpg",
  "x-banner.jpg",
  "robots.txt",
  "manifest.webmanifest",
  "manifest.json",
]);

const APPLY = process.argv.includes("--apply");
const YES = process.argv.includes("--yes");
const VERBOSE = process.argv.includes("--verbose");

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const ent of entries) {
    if (ent.name.startsWith(".")) continue;
    const full = join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "node_modules" || ent.name === "unused_assets" || ent.name === "__grok") continue;
      walk(full, out);
    } else {
      out.push(full);
    }
  }
  return out;
}

function posix(p) {
  return p.split(sep).join("/");
}

function collectCode() {
  const files = walk(SRC).filter((f) => CODE_EXT.has(extname(f).toLowerCase()));
  files.push(INDEX_HTML);
  return files;
}

function collectAssets() {
  return [...walk(PUBLIC), ...walk(SRC_ASSETS)].filter((f) => ASSET_EXT.has(extname(f).toLowerCase()));
}

function looksLikePath(s) {
  if (s.length < 5) return false;
  if (s.includes("://")) return false;
  return ASSET_EXT.has(extname(s).toLowerCase()) || s.includes("/");
}

function extractFrom(text, literals, patterns) {
  const quote = /["']([^"'\n]{3,})["']/g;
  let m;
  while ((m = quote.exec(text))) {
    if (looksLikePath(m[1])) literals.add(m[1].replace(/^\/+/, ""));
  }
  const tick = /`([^`]+)`/g;
  while ((m = tick.exec(text))) {
    const raw = m[1];
    if (!raw.includes("${")) {
      if (looksLikePath(raw)) literals.add(raw.replace(/^\/+/, ""));
      continue;
    }
    const parts = raw.split(/\$\{[^}]+\}/);
    const prefix = (parts[0] ?? "").replace(/^\/+/, "");
    const suffix = parts.at(-1) ?? "";
    if (prefix.length >= 4 || suffix.length >= 4) patterns.push({ prefix, suffix });
  }
}

async function loadRefs(codeFiles) {
  const literals = new Set();
  const patterns = [];
  for (const file of codeFiles) {
    try {
      extractFrom(await readFile(file, "utf8"), literals, patterns);
    } catch {
      /* skip */
    }
  }
  return { literals, patterns };
}

function publicRel(abs) {
  if (abs.startsWith(PUBLIC + sep) || abs.startsWith(PUBLIC + "/")) {
    return posix(relative(PUBLIC, abs));
  }
  if (abs.includes(`${sep}src${sep}assets${sep}`) || abs.includes("/src/assets/")) {
    return posix(relative(SRC_ASSETS, abs));
  }
  return posix(relative(ROOT, abs));
}

function isUsed(abs, literals, patterns) {
  const name = abs.split(sep).at(-1);
  if (KEEP_ALWAYS.has(name)) return true;
  const rel = publicRel(abs);
  const candidates = new Set([rel, name]);
  const parts = rel.split("/");
  if (parts.length >= 2) candidates.add(parts.slice(-2).join("/"));

  for (const lit of literals) {
    if (candidates.has(lit)) return true;
    if (rel === lit || rel.endsWith(`/${lit}`)) return true;
  }
  for (const { prefix, suffix } of patterns) {
    const preOk = !prefix || rel.startsWith(prefix) || name.startsWith(prefix);
    const sufOk = !suffix || rel.endsWith(suffix) || name.endsWith(suffix);
    if (preOk && sufOk && (prefix || suffix)) return true;
  }
  return false;
}

function printList(title, rows) {
  console.log(`\n${title} (${rows.length})`);
  if (!rows.length) {
    console.log("  (なし)");
    return;
  }
  for (const row of rows) console.log(`  ${row}`);
}

async function confirm(q) {
  if (YES) return true;
  const rl = createInterface({ input, output });
  try {
    const a = (await rl.question(q)).trim().toLowerCase();
    return a === "y" || a === "yes";
  } finally {
    rl.close();
  }
}

function moveFile(abs) {
  const rel = posix(relative(ROOT, abs));
  const dest = join(QUARANTINE, rel);
  mkdirSync(dirname(dest), { recursive: true });
  try {
    renameSync(abs, dest);
  } catch {
    copyFileSync(abs, dest);
    rmSync(abs);
  }
  return posix(relative(ROOT, dest));
}

async function main() {
  const codeFiles = collectCode();
  const assets = collectAssets();
  const { literals, patterns } = await loadRefs(codeFiles);

  const keep = [];
  const unused = [];
  for (const abs of assets) {
    if (isUsed(abs, literals, patterns)) keep.push(abs);
    else unused.push(abs);
  }

  const keepRel = keep.map((f) => posix(relative(ROOT, f))).sort();
  const unusedRel = unused.map((f) => posix(relative(ROOT, f))).sort();

  console.log("アセット整理");
  console.log(`  コードファイル: ${codeFiles.length}`);
  console.log(`  素材ファイル:   ${assets.length}`);
  console.log(`  使用中:         ${keep.length}`);
  console.log(`  不使用:         ${unused.length}`);
  console.log(`  モード:         ${APPLY ? "移動" : "dry-run（移動しない）"}`);
  if (VERBOSE) printList("使用中で残す", keepRel);
  printList("不使用（隔離対象）", unusedRel);

  if (!unused.length) {
    console.log("\n隔離するものはありません。");
    return;
  }
  if (!APPLY) {
    console.log("\n移動するには:  node scripts/cleanup-assets.mjs --apply");
    return;
  }

  const ok = await confirm(`\n${unused.length} 件を unused_assets/ へ移動しますか？ [y/N] `);
  if (!ok) {
    console.log("中止しました。");
    return;
  }

  mkdirSync(QUARANTINE, { recursive: true });
  const moved = [];
  for (const abs of unused) moved.push(moveFile(abs));
  console.log(`\n使用中で残した: ${keep.length}`);
  console.log(`不使用で移動した: ${moved.length}`);
  printList("移動したファイル", moved);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
