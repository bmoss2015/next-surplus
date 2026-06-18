import sharp from "sharp";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const SVG_PATH = "H:/My Drive/Business Ventures/Next Surplus - Web App/Logo & Favicon/03-lockup-horizontal-light.svg";
const PNG_FALLBACK = "H:/My Drive/Business Ventures/Next Surplus - Web App/Logo & Favicon/04-lockup-horizontal-light-stripe-512x128.png";
const OUTPUT = path.resolve("public/images/email-logo.png");

async function tryFromSvg() {
  const svg = readFileSync(SVG_PATH);
  const buf = await sharp(svg, { density: 900 })
    .resize({ width: 960 })
    .png()
    .toBuffer();
  return buf;
}

async function fromPngFallback() {
  return await sharp(PNG_FALLBACK).resize({ width: 640 }).png().toBuffer();
}

let buf;
try {
  buf = await tryFromSvg();
  console.log("Rendered from SVG");
} catch (e) {
  console.warn("SVG render failed, falling back to PNG:", e.message);
  if (!existsSync(PNG_FALLBACK)) {
    throw new Error("Fallback PNG missing: " + PNG_FALLBACK);
  }
  buf = await fromPngFallback();
  console.log("Rendered from PNG fallback");
}

await sharp(buf).toFile(OUTPUT);
console.log("Wrote", OUTPUT);
