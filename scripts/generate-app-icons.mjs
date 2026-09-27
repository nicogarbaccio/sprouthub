/**
 * Renders the PWA / home screen icons and favicon.ico from the app icon SVG.
 *
 * Usage: npm run generate:icons [-- path/to/source.svg]
 *
 * The default source is the white logo on forest green. The PNGs need a solid background
 * (iOS fills transparent home screen icons with black), and the same icon keeps the white
 * logo visible as a favicon on light and dark tab bars alike. Browsers that support SVG
 * favicons use public/sprouthub-logo-white.svg instead (see index.html).
 *
 * Uses Playwright's Chromium (already a dev dependency) so no image tooling needs installing.
 * The source is a full-bleed square with the mark well inside the maskable safe zone, so the
 * same PNGs serve both "any" and "maskable" purposes.
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PUBLIC_DIR = resolve(import.meta.dirname, '../public');
const SOURCE = resolve(process.argv[2] ?? `${PUBLIC_DIR}/sprouthub-appicon-light.svg`);

// Sizes referenced by the web manifest in vite.config.ts, plus the iOS home screen icon
const OUTPUTS = [
  ...[72, 96, 128, 144, 152, 192, 384, 512].map((size) => ({ size, file: `icon-${size}.png` })),
  { size: 180, file: 'apple-touch-icon.png' },
];

// Sizes packed into favicon.ico, for browsers without SVG favicon support
const FAVICON_SIZES = [16, 32, 48];

/**
 * An .ico file holding PNG images: a 6-byte header, a 16-byte directory entry per image,
 * then the PNGs themselves. Every browser that reads .ico accepts PNG-encoded entries.
 */
function buildIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);

  let offset = 6 + 16 * images.length;
  const entries = images.map(({ size, png }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width (0 means 256)
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2); // no palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += png.length;
    return entry;
  });

  return Buffer.concat([header, ...entries, ...images.map(({ png }) => png)]);
}

const svg = readFileSync(SOURCE).toString('base64');
const browser = await chromium.launch();

async function render(size) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(
    `<body style="margin:0"><img src="data:image/svg+xml;base64,${svg}" width="${size}" height="${size}" style="display:block"></body>`
  );
  await page.locator('img').evaluate((img) => img.decode());
  const png = await page.screenshot({ omitBackground: true });
  await page.close();
  return png;
}

try {
  for (const { size, file } of OUTPUTS) {
    writeFileSync(`${PUBLIC_DIR}/${file}`, await render(size));
    console.log(`public/${file} (${size}×${size})`);
  }

  const favicons = [];
  for (const size of FAVICON_SIZES) favicons.push({ size, png: await render(size) });
  writeFileSync(`${PUBLIC_DIR}/favicon.ico`, buildIco(favicons));
  console.log(`public/favicon.ico (${FAVICON_SIZES.join(', ')})`);
} finally {
  await browser.close();
}
