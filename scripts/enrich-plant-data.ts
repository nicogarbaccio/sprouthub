/**
 * Build-time enrichment script for plant data.
 *
 * Enriches the catalog JSON files (src/data/catalog/plants/*.json) in place with pet toxicity
 * data from Plant Smart API (https://plantsm.art/api/) — no API key required.
 *
 * Only exact name matches are applied. Genus-only matches are reported for manual review:
 * toxicity varies within a genus, so a genus match can attach another species' data.
 *
 * Usage:
 *   npx tsx scripts/enrich-plant-data.ts
 *   # or via npm script:
 *   npm run enrich-plants
 */

import * as fs from 'fs';
import * as path from 'path';
import { catalogEntrySchema, type CatalogEntry } from '../src/data/catalog/schema';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PlantSmartEntry {
  name: string;
  common?: { name: string; slug: string }[];
  animals?: string[];
  symptoms?: { name: string; slug: string }[];
  family?: string;
}

// ─── Config ──────────────────────────────────────────────────────────────────

const PLANT_SMART_URL = 'https://plantsm.art/api/plants.json';

const CATALOG_DIR = path.resolve(import.meta.dirname, '../src/data/catalog/plants');

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`  [WARN] HTTP ${res.status} for ${url}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.warn(`  [WARN] Fetch error for ${url}:`, (err as Error).message);
    return null;
  }
}

// ─── Plant Smart matching ────────────────────────────────────────────────────

function matchPlantSmart(
  plant: CatalogEntry,
  plantSmartData: PlantSmartEntry[],
): { entry: PlantSmartEntry; kind: 'exact' | 'genus' } | undefined {
  const ourNames = [
    plant.name.toLowerCase(),
    plant.botanicalName.toLowerCase(),
    ...(plant.otherNames?.map((n) => n.toLowerCase()) ?? []),
  ];

  const botanicalGenus = plant.botanicalName.toLowerCase().split(' ')[0];

  // Pass 1: Exact match on any name
  const exact = plantSmartData.find((ps) => {
    const psNames = [
      ps.name.toLowerCase(),
      ...(ps.common?.map((c) => c.name.toLowerCase()) ?? []),
    ];
    return ourNames.some((n) => psNames.some((psn) => psn === n));
  });
  if (exact) return { entry: exact, kind: 'exact' };

  // Pass 2: Botanical genus match (e.g. "Monstera" matches "Monstera spp.")
  // Only match when the Plant Smart entry's scientific name starts with our genus
  if (botanicalGenus.length >= 4) {
    const genusMatch = plantSmartData.find((ps) => {
      const psGenus = ps.name.toLowerCase().split(' ')[0];
      return psGenus === botanicalGenus;
    });
    if (genusMatch) return { entry: genusMatch, kind: 'genus' };
  }

  return undefined;
}

function buildToxicityDetail(entry: PlantSmartEntry): CatalogEntry['toxicityDetail'] {
  return {
    animals: entry.animals ?? [],
    symptoms: (entry.symptoms ?? []).map((s) => s.name).slice(0, 5),
    source: 'plantsm.art',
  };
}

function buildPlantSmartToxicity(entry: PlantSmartEntry): string {
  const animals = entry.animals ?? [];
  const symptoms = entry.symptoms ?? [];

  if (animals.length === 0) {
    return 'Non-toxic to pets';
  }

  const animalList = animals.join(', ');
  let result = `Toxic to ${animalList}`;
  if (symptoms.length > 0) {
    const symptomNames = symptoms.map((s) => s.name).slice(0, 5).join(', ');
    result += `. Symptoms: ${symptomNames}`;
  }
  return result;
}

// ─── Load catalog ────────────────────────────────────────────────────────────

function loadCatalog(): { file: string; plant: CatalogEntry }[] {
  return fs
    .readdirSync(CATALOG_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      const file = path.join(CATALOG_DIR, f);
      return { file, plant: catalogEntrySchema.parse(JSON.parse(fs.readFileSync(file, 'utf-8'))) };
    });
}

// ─── Main enrichment ────────────────────────────────────────────────────────

async function main() {
  console.log('=== Plant Data Enrichment (Plant Smart) ===\n');

  // Load catalog
  console.log('Loading plant catalog...');
  const catalog = loadCatalog();
  console.log(`Loaded ${catalog.length} plants from catalog.\n`);

  // Load Plant Smart data
  console.log('Fetching Plant Smart data...');
  const plantSmartData = await fetchJson<PlantSmartEntry[]>(PLANT_SMART_URL);
  if (!plantSmartData) {
    console.error('Could not load Plant Smart data. Aborting.');
    process.exit(1);
  }
  console.log(`Loaded ${plantSmartData.length} entries from Plant Smart.\n`);

  const validationIssues: string[] = [];
  const genusOnly: string[] = [];
  let updatedCount = 0;

  for (let i = 0; i < catalog.length; i++) {
    const { file, plant } = catalog[i];
    const label = `[${i + 1}/${catalog.length}] ${plant.name}`;

    const psMatch = matchPlantSmart(plant, plantSmartData);
    if (psMatch?.kind === 'exact') {
      const toxicity = buildPlantSmartToxicity(psMatch.entry);
      const toxicityDetail = buildToxicityDetail(psMatch.entry);
      const changed =
        plant.toxicity !== toxicity ||
        JSON.stringify(plant.toxicityDetail) !== JSON.stringify(toxicityDetail);
      if (changed) {
        const updated = catalogEntrySchema.parse({ ...plant, toxicity, toxicityDetail });
        fs.writeFileSync(file, JSON.stringify(updated, null, 2) + '\n', 'utf-8');
        updatedCount++;
      }
      console.log(`${label} -> ${toxicity}${changed ? ' (updated)' : ''}`);
    } else if (psMatch?.kind === 'genus') {
      genusOnly.push(`${plant.name} (${plant.botanicalName}) ~ ${psMatch.entry.name}`);
      console.log(`${label} - genus-only match (${psMatch.entry.name}), not applied`);
    } else {
      console.log(`${label} - no Plant Smart match (keeping catalog value)`);
    }

    // Validation
    if (!plant.toxicity) {
      validationIssues.push(`${plant.name}: missing toxicity`);
    }
    if (plant.commonProblems) {
      plant.commonProblems.forEach((p, idx) => {
        if (!p.includes(':')) {
          validationIssues.push(
            `${plant.name}: commonProblems[${idx}] missing colon separator: "${p}"`,
          );
        }
      });
    }
  }

  console.log(`\nDone. ${updatedCount} of ${catalog.length} plants updated.\n`);

  if (genusOnly.length) {
    console.warn(`=== Genus-only matches — review toxicity by hand (${genusOnly.length}) ===`);
    genusOnly.forEach((m) => console.warn(`  - ${m}`));
    console.warn('');
  }

  // Report validation issues
  if (validationIssues.length) {
    console.warn(`=== Validation Issues (${validationIssues.length}) ===`);
    validationIssues.forEach((issue) => console.warn(`  - ${issue}`));
    console.warn('');
  }

  console.log('Enrichment complete.');
}

main().catch((err) => {
  console.error('Enrichment failed:', err);
  process.exit(1);
});
