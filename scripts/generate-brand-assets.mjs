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

async function pngFromSvg(svgInput, width, height, outPath) {
  const buf = await sharp(svgInput, { density: 384 })
    .resize(width, height, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  await fs.writeFile(outPath, buf);
  console.log(`wrote ${path.relative(ROOT, outPath)} (${width}x${height})`);
}

async function main() {
  const iconBuffer = await fs.readFile(SOURCE_ICON);

  await pngFromSvg(iconBuffer, 16, 16, path.join(PUBLIC, "favicon-16.png"));
  await pngFromSvg(iconBuffer, 32, 32, path.join(PUBLIC, "favicon-32.png"));
  await pngFromSvg(iconBuffer, 48, 48, path.join(PUBLIC, "favicon-48.png"));
  await pngFromSvg(iconBuffer, 180, 180, path.join(PUBLIC, "apple-touch-icon.png"));
  await pngFromSvg(iconBuffer, 192, 192, path.join(PUBLIC, "android-chrome-192x192.png"));
  await pngFromSvg(iconBuffer, 512, 512, path.join(PUBLIC, "android-chrome-512x512.png"));

  await pngFromSvg(Buffer.from(LOCKUP_SVG), 400, 70, path.join(PUBLIC, "images", "email-logo.png"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
