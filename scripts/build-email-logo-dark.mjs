import sharp from "sharp";
import { readFileSync } from "node:fs";
import path from "node:path";

const SVG_PATH = "H:/My Drive/Business Ventures/Next Surplus - Web App/Logo & Favicon/04-lockup-horizontal-dark.svg";
const OUTPUT = path.resolve("public/images/email-logo-dark.png");

const svg = readFileSync(SVG_PATH);
const buf = await sharp(svg, { density: 600 })
  .resize({ width: 640 })
  .png()
  .toBuffer();
await sharp(buf).toFile(OUTPUT);

const meta = await sharp(OUTPUT).metadata();
console.log(`Wrote ${OUTPUT} at ${meta.width}x${meta.height}`);
