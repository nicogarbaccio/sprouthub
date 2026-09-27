/**
 * Cross-checks the catalog's pet toxicity against Plant Smart (https://plantsm.art/api/).
 *
 * Report-only: it never edits the catalog. Toxicity in src/data/catalog/plants/*.json is
 * researched against ASPCA and NC State Extension, and Plant Smart was the source of several
 * wrong entries — its common names are shared across unrelated plants (e.g. "Chinese Hibiscus"
 * appears on its Tulipa entry). Plant Smart entries are therefore matched by scientific name
 * only, and disagreements are listed for a person to look into.
 *
 * Usage:
 *   npm run check-toxicity
 */

import * as fs from 'fs';
import * as path from 'path';
import { catalogEntrySchema, type CatalogEntry } from '../src/data/catalog/schema';

interface PlantSmartEntry {
  name: string;
  animals?: string[];
}

const PLANT_SMART_URL = 'https://plantsm.art/api/plants.json';
const CATALOG_DIR = path.resolve(import.meta.dirname, '../src/data/catalog/plants');
const ANIMALS = ['cats', 'dogs', 'horses'] as const;

/** "Epipremnum aureum 'Marble Queen'" → "epipremnum aureum" */
function species(name: string): string {
  return name
    .replace(/'[^']*'/g, '')
    .replace(/[×x]\s/g, '')
    .toLowerCase()
    .split(/\s+/)
    .slice(0, 2)
    .join(' ');
}

function loadCatalog(): CatalogEntry[] {
  return fs
    .readdirSync(CATALOG_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => catalogEntrySchema.parse(JSON.parse(fs.readFileSync(path.join(CATALOG_DIR, f), 'utf-8'))));
}

async function main() {
  const catalog = loadCatalog();
  const res = await fetch(PLANT_SMART_URL);
  if (!res.ok) {
    console.error(`Could not load Plant Smart data (HTTP ${res.status}).`);
    process.exit(1);
  }
  const bySpecies = new Map(((await res.json()) as PlantSmartEntry[]).map((e) => [species(e.name), e]));

  const disagreements: string[] = [];
  let compared = 0;

  for (const plant of catalog) {
    const detail = plant.toxicityDetail;
    const names = [plant.botanicalName, plant.taxonomy?.acceptedName].filter(Boolean) as string[];
    const match = names.map((n) => bySpecies.get(species(n))).find(Boolean);
    if (!detail || !match) continue;
    compared++;

    for (const animal of ANIMALS) {
      const ours = detail[animal];
      if (ours === 'unknown') continue;
      const theirs = match.animals?.includes(animal) ? 'toxic' : 'non_toxic';
      if (ours !== theirs) {
        disagreements.push(`${plant.name} (${match.name}): ${animal} — catalog ${ours}, Plant Smart ${theirs}`);
      }
    }
  }

  console.log(`Compared ${compared} of ${catalog.length} plants with a Plant Smart species entry.`);
  if (disagreements.length) {
    console.warn(`\n=== Disagreements to review (${disagreements.length}) ===`);
    disagreements.forEach((d) => console.warn(`  - ${d}`));
  } else {
    console.log('No disagreements.');
  }
}

main().catch((err) => {
  console.error('Toxicity check failed:', err);
  process.exit(1);
});
