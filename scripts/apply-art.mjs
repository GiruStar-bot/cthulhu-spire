#!/usr/bin/env node
/**
 * Place generated art into public/ and rewrite matching `art:` paths.
 *
 *   node scripts/apply-art.mjs --kind cards
 *     incoming/cards/<id>.jpg|png  →  public/art/pixel/cards/<id>.<ext>
 *     rewrites src/game/cards.ts
 *
 *   node scripts/apply-art.mjs --kind enemies
 *     incoming/enemies/<id>.jpg|png  →  public/art/pixel/<id>.<ext>
 *     rewrites src/game/enemies.ts (or accepts still("id") copies)
 */
import { readdirSync, copyFileSync, mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { extname, join, basename } from "node:path";

const KIND_CONFIG = {
  cards: {
    incomingDir: "incoming/cards",
    outputDir: "public/art/pixel/cards",
    codeFile: "src/game/cards.ts",
    idExtractor: (fileNameNoExt) => fileNameNoExt,
  },
  enemies: {
    incomingDir: "incoming/enemies",
    outputDir: "public/art/pixel",
    codeFile: "src/game/enemies.ts",
    idExtractor: (fileNameNoExt) => fileNameNoExt,
  },
};

function parseArgs() {
  const args = process.argv.slice(2);
  const kindIndex = args.indexOf("--kind");
  const kind = kindIndex >= 0 ? args[kindIndex + 1] : null;
  if (!kind || !KIND_CONFIG[kind]) {
    console.error(`Usage: node scripts/apply-art.mjs --kind <${Object.keys(KIND_CONFIG).join("|")}>`);
    process.exit(1);
  }
  return { kind };
}

function main() {
  const { kind } = parseArgs();
  const cfg = KIND_CONFIG[kind];

  if (!existsSync(cfg.incomingDir)) {
    console.error(`Incoming folder not found: ${cfg.incomingDir}`);
    process.exit(1);
  }
  mkdirSync(cfg.outputDir, { recursive: true });

  const files = readdirSync(cfg.incomingDir).filter((f) =>
    [".jpg", ".jpeg", ".png"].includes(extname(f).toLowerCase()),
  );

  if (files.length === 0) {
    console.log(`No image files found in ${cfg.incomingDir}.`);
    return;
  }

  let code = readFileSync(cfg.codeFile, "utf8");
  const updated = [];
  const skipped = [];

  for (const file of files) {
    const ext = extname(file);
    const nameNoExt = basename(file, ext);
    const id = cfg.idExtractor(nameNoExt);

    const destExt = ext.toLowerCase() === ".png" ? ".png" : ".jpg";
    const destRelPath = `art/pixel/${kind === "cards" ? "cards/" : ""}${id}${destExt}`;
    const destAbsPath = join(cfg.outputDir, `${id}${destExt}`);

    copyFileSync(join(cfg.incomingDir, file), destAbsPath);

    const re = new RegExp(`(id:\\s*"${id}",[\\s\\S]{0,800}?art:\\s*asset\\()"[^"]*"(\\))`);
    if (re.test(code)) {
      code = code.replace(re, `$1"${destRelPath}"$2`);
      updated.push(id);
    } else if (new RegExp(`still\\("${id}"\\)`).test(code)) {
      updated.push(id);
    } else {
      skipped.push(id);
    }
  }

  writeFileSync(cfg.codeFile, code, "utf8");

  console.log(`\n[apply-art] kind=${kind}`);
  console.log(`  updated (${updated.length}): ${updated.join(", ") || "none"}`);
  if (skipped.length) {
    console.log(`  NOT MATCHED in ${cfg.codeFile} (${skipped.length}): ${skipped.join(", ")}`);
    console.log(`  → id名がコード側と一致しているか確認してください。`);
  }
}

main();
