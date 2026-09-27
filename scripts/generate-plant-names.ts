/**
 * Generates a compact JSON list of plant names for the fetch-blog-posts Edge Function.
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

const plantNames: PlantNameEntry[] = allPlants.map((p) => ({
  name: p.name,
  botanicalName: p.botanicalName,
  category: p.category,
  ...(p.otherNames?.length ? { otherNames: p.otherNames } : {}),
}));

const outPath = path.resolve(__dirname, '../supabase/functions/fetch-blog-posts/plant-names.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(plantNames, null, 2));

console.log(`Wrote ${plantNames.length} plant names to ${outPath}`);
