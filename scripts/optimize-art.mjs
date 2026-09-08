#!/usr/bin/env node
/**
 * Recompress JPEG art under public/art/pixel/.
 *
 *   node scripts/optimize-art.mjs
 *
 * Long edge > 1200px is scaled down (aspect preserved).
 * Files are overwritten in place as JPEG quality 82.
 */
import { existsSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { extname, join, relative } from "node:path";
import sharp from "sharp";

const TARGET_DIRS = [
  "public/art/pixel/cards",
  "public/art/pixel/equipment",
  "public/art/pixel/bg",
  "public/art/pixel/village",
  "public/art/pixel/coral",
  "public/art/pixel/priest",
];

const MAX_SIDE = 1200;
const QUALITY = 82;
const JPEG_EXT = new Set([".jpg", ".jpeg"]);

function collectJpeg(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name);
    const st = statSync(abs);
    if (st.isDirectory()) collectJpeg(abs, out);
    else if (JPEG_EXT.has(extname(name).toLowerCase())) out.push(abs);
  }
  return out;
}

function fmt(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function optimizeFile(absPath) {
  const before = statSync(absPath).size;
  const buf = await sharp(absPath)
    .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: QUALITY, mozjpeg: true })
    .toBuffer();
  if (buf.length >= before) {
    return { before, after: before, skipped: true };
  }
  writeFileSync(absPath, buf);
  return { before, after: buf.length, skipped: false };
}

async function main() {
  const files = TARGET_DIRS.flatMap((dir) => collectJpeg(dir));
  if (files.length === 0) {
    console.log("No JPEG files found in target directories.");
    return;
  }

  let beforeTotal = 0;
  let afterTotal = 0;
  let rewritten = 0;
  let skipped = 0;

  for (const abs of files) {
    const result = await optimizeFile(abs);
    beforeTotal += result.before;
    afterTotal += result.after;
    if (result.skipped) skipped += 1;
    else rewritten += 1;
    const rel = relative(process.cwd(), abs);
    const delta = result.after - result.before;
    const tag = result.skipped ? "keep" : "opt";
    console.log(
      `${tag.padEnd(4)} ${rel}  ${fmt(result.before)} → ${fmt(result.after)}  (${delta >= 0 ? "+" : ""}${fmt(delta)})`,
    );
  }

  const saved = beforeTotal - afterTotal;
  const pct = beforeTotal === 0 ? 0 : (saved / beforeTotal) * 100;
  console.log("");
  console.log(`files: ${files.length}  rewritten: ${rewritten}  kept: ${skipped}`);
  console.log(`before: ${fmt(beforeTotal)}`);
  console.log(`after:  ${fmt(afterTotal)}`);
  console.log(`saved:  ${fmt(saved)}  (${pct.toFixed(1)}%)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
