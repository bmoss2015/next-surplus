import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(process.cwd());
const PUBLIC = path.join(ROOT, "public");
const SOURCE_ICON = path.join(PUBLIC, "brand", "13-icon-dark-transparent.svg");

const LOCKUP_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 80">
  <polygon points="40,26 54,40 40,54 26,40" fill="#04261c"/>
  <polygon points="40,26 54,40 40,40" fill="#4a9c75"/>
  <polygon points="40,40 54,40 40,54" fill="#13644e"/>
  <text x="90" y="56"
        font-family="Inter, 'Plus Jakarta Sans', system-ui, sans-serif"
        font-size="42" font-weight="500" fill="#04261c"
        letter-spacing="-0.5" word-spacing="6">Next Surplus</text>
</svg>`;

async function pngBuffer(svgInput, width, height) {
  return sharp(svgInput, { density: 384 })
    .resize(width, height, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

async function pngFromSvg(svgInput, width, height, outPath) {
  const buf = await pngBuffer(svgInput, width, height);
  await fs.writeFile(outPath, buf);
  console.log(`wrote ${path.relative(ROOT, outPath)} (${width}x${height})`);
}

function buildIco(pngs) {
  const count = pngs.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  const dirEntries = Buffer.alloc(16 * count);
  let offset = 6 + 16 * count;
  for (let i = 0; i < count; i++) {
    const { width, height, data } = pngs[i];
    const e = dirEntries.subarray(i * 16, (i + 1) * 16);
    e.writeUInt8(width >= 256 ? 0 : width, 0);
    e.writeUInt8(height >= 256 ? 0 : height, 1);
    e.writeUInt8(0, 2);
    e.writeUInt8(0, 3);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
  }
  return Buffer.concat([header, dirEntries, ...pngs.map((p) => p.data)]);
}

async function icoFromSvg(svgInput, sizes, outPath) {
  const pngs = await Promise.all(
    sizes.map(async (s) => ({ width: s, height: s, data: await pngBuffer(svgInput, s, s) }))
  );
  const ico = buildIco(pngs);
  await fs.writeFile(outPath, ico);
  console.log(`wrote ${path.relative(ROOT, outPath)} (sizes ${sizes.join(",")})`);
}

async function main() {
  const iconBuffer = await fs.readFile(SOURCE_ICON);

  await pngFromSvg(iconBuffer, 16, 16, path.join(PUBLIC, "favicon-16.png"));
  await pngFromSvg(iconBuffer, 32, 32, path.join(PUBLIC, "favicon-32.png"));
  await pngFromSvg(iconBuffer, 48, 48, path.join(PUBLIC, "favicon-48.png"));
  await pngFromSvg(iconBuffer, 180, 180, path.join(PUBLIC, "apple-touch-icon.png"));
  await pngFromSvg(iconBuffer, 192, 192, path.join(PUBLIC, "android-chrome-192x192.png"));
  await pngFromSvg(iconBuffer, 512, 512, path.join(PUBLIC, "android-chrome-512x512.png"));

  await icoFromSvg(iconBuffer, [16, 32, 48], path.join(PUBLIC, "favicon.ico"));

  await pngFromSvg(Buffer.from(LOCKUP_SVG), 400, 70, path.join(PUBLIC, "images", "email-logo.png"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
