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

// Import all plant arrays directly (same as plantData.ts)
import { floweringPlants } from '../src/data/plants/flowering-plants';
import { tropicalPlants } from '../src/data/plants/tropical-plants';
import { succulents } from '../src/data/plants/succulents';
import { hangingTrailingPlants } from '../src/data/plants/hanging-trailing';
import { treesLargePlants } from '../src/data/plants/trees-large';
import { otherPlants } from '../src/data/plants/other-categories';
import { airPlants } from '../src/data/plants/air-plants';

const allPlants = [
  ...floweringPlants,
  ...tropicalPlants,
  ...succulents,
  ...hangingTrailingPlants,
  ...treesLargePlants,
  ...otherPlants,
  ...airPlants,
];

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
