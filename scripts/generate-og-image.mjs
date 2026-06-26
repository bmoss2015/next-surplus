import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const W = 1200;
const H = 630;

const iconSize = 140;
const wordmarkFontSize = 104;
const wordmark = 'Next Surplus';
const subtitle = 'Surplus Funds Recovery Platform';
const subtitleFontSize = 36;

const approxWordmarkWidth = wordmark.length * wordmarkFontSize * 0.52;
const gap = 36;
const groupWidth = iconSize + gap + approxWordmarkWidth;
const groupX = (W - groupWidth) / 2;
const groupY = H / 2 - 60;

const iconX = groupX;
const iconY = groupY - iconSize / 2;
const cx = iconX + iconSize / 2;
const cy = iconY + iconSize / 2;
const half = iconSize / 2 - 22;

const textX = iconX + iconSize + gap;
const textY = groupY + wordmarkFontSize * 0.35;

const subtitleY = groupY + iconSize / 2 + 64;

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="'Plus Jakarta Sans', 'Inter', system-ui, sans-serif">
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  <rect x="${iconX}" y="${iconY}" width="${iconSize}" height="${iconSize}" fill="#04261c"/>
  <polygon points="${cx},${cy - half} ${cx + half},${cy} ${cx},${cy + half} ${cx - half},${cy}" fill="#ffffff"/>
  <polygon points="${cx},${cy - half} ${cx + half},${cy} ${cx},${cy}" fill="#13644e"/>
  <polygon points="${cx},${cy} ${cx + half},${cy} ${cx},${cy + half}" fill="#4a9c75"/>
  <text x="${textX}" y="${textY}" font-size="${wordmarkFontSize}" font-weight="500" fill="#04261c" letter-spacing="-2" dominant-baseline="middle">${wordmark}</text>
  <text x="${W / 2}" y="${subtitleY}" font-size="${subtitleFontSize}" font-weight="400" fill="#13644e" text-anchor="middle" letter-spacing="0.5">${subtitle}</text>
</svg>`;

const outPath = resolve('public/og-image.png');
await sharp(Buffer.from(svg))
  .png({ compressionLevel: 9 })
  .toFile(outPath);

console.log(`Wrote ${outPath}`);
