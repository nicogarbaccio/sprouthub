/**
 * Renders the PWA / home screen icons from the app icon SVG.
 *
 * Usage: npm run generate:icons [-- path/to/source.svg]
 *
 * Uses Playwright's Chromium (already a dev dependency) so no image tooling needs installing.
 * The source is a full-bleed square with the mark well inside the maskable safe zone, so the
 * same PNGs serve both "any" and "maskable" purposes.
 */
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PUBLIC_DIR = resolve(import.meta.dirname, '../public');
const SOURCE = resolve(process.argv[2] ?? `${PUBLIC_DIR}/sprouthub-appicon.svg`);

// Sizes referenced by the web manifest in vite.config.ts, plus the iOS home screen icon
const OUTPUTS = [
  ...[72, 96, 128, 144, 152, 192, 384, 512].map((size) => ({ size, file: `icon-${size}.png` })),
  { size: 180, file: 'apple-touch-icon.png' },
];

const svg = readFileSync(SOURCE).toString('base64');
const browser = await chromium.launch();

try {
  for (const { size, file } of OUTPUTS) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(
      `<body style="margin:0"><img src="data:image/svg+xml;base64,${svg}" width="${size}" height="${size}" style="display:block"></body>`
    );
    await page.locator('img').evaluate((img) => img.decode());
    await page.screenshot({ path: `${PUBLIC_DIR}/${file}`, omitBackground: true });
    await page.close();
    console.log(`public/${file} (${size}×${size})`);
  }
} finally {
  await browser.close();
}
