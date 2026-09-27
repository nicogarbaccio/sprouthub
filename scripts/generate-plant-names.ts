/**
 * Generates a compact JSON list of plant names for the fetch-blog-posts Edge Function.
 *
 * Catalog plants are refreshed from the catalog. Names already in the file that aren't in the
 * catalog (extra genera and varieties added to widen blog matching) are kept, not dropped.
 *
 * Usage:
 *   npx tsx scripts/generate-plant-names.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import { plants as allPlants } from '../src/data/plantData';

interface PlantNameEntry {
  name: string;
  botanicalName: string;
  category: string;
  otherNames?: string[];
}

const outPath = path.resolve(__dirname, '../supabase/functions/fetch-blog-posts/plant-names.json');

const catalogNames: PlantNameEntry[] = allPlants.map((p) => ({
  name: p.name,
  botanicalName: p.botanicalName,
  category: p.category,
  ...(p.otherNames?.length ? { otherNames: p.otherNames } : {}),
}));

const existing: PlantNameEntry[] = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, 'utf8')) : [];
const inCatalog = new Set(catalogNames.map((p) => p.name));
const extras = existing.filter((p) => !inCatalog.has(p.name));

const plantNames = [...catalogNames, ...extras];
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(plantNames, null, 2));

console.log(`Wrote ${plantNames.length} plant names (${catalogNames.length} catalog, ${extras.length} extra) to ${outPath}`);
