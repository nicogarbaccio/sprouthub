/**
 * Build-time enrichment script for plant data.
 *
 * Enriches the catalog with pet toxicity data from Plant Smart API
 * (https://plantsm.art/api/) — no API key required.
 *
 * Usage:
 *   npx tsx scripts/enrich-plant-data.ts
 *   # or via npm script:
 *   npm run enrich-plants
 */

import * as fs from 'fs';
import * as path from 'path';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CatalogPlant {
  name: string;
  botanicalName: string;
  image: string;
  wateringFrequency: string;
  suggestedWateringDays: number;
  lightRequirement: string;
  careLevel: 'Easy' | 'Medium' | 'Hard';
  category: string;
  description?: string;
  toxicity?: string;
  temperature?: string;
  humidity?: string;
  careInstructions?: string[];
  commonProblems?: string[];
  isOutdoorPlant?: boolean;
  otherNames?: string[];
}

interface PlantSmartEntry {
  name: string;
  common?: { name: string; slug: string }[];
  animals?: string[];
  symptoms?: { name: string; slug: string }[];
  family?: string;
}

// ─── Config ──────────────────────────────────────────────────────────────────

const PLANT_SMART_URL = 'https://plantsm.art/api/plants.json';

const OUTPUT_PATH = path.resolve(
  import.meta.dirname,
  '../public/enriched-plants.json',
);

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
  plant: CatalogPlant,
  plantSmartData: PlantSmartEntry[],
): PlantSmartEntry | undefined {
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
  if (exact) return exact;

  // Pass 2: Botanical genus match (e.g. "Monstera" matches "Monstera spp.")
  // Only match when the Plant Smart entry's scientific name starts with our genus
  if (botanicalGenus.length >= 4) {
    const genusMatch = plantSmartData.find((ps) => {
      const psGenus = ps.name.toLowerCase().split(' ')[0];
      return psGenus === botanicalGenus;
    });
    if (genusMatch) return genusMatch;
  }

  return undefined;
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

async function loadCatalog(): Promise<CatalogPlant[]> {
  const { plants } = await import('../src/data/plantData.js');
  return plants as CatalogPlant[];
}

// ─── Main enrichment ────────────────────────────────────────────────────────

async function main() {
  console.log('=== Plant Data Enrichment (Plant Smart) ===\n');

  // Load catalog
  console.log('Loading plant catalog...');
  const catalog = await loadCatalog();
  console.log(`Loaded ${catalog.length} plants from catalog.\n`);

  // Load Plant Smart data
  console.log('Fetching Plant Smart data...');
  const plantSmartData = await fetchJson<PlantSmartEntry[]>(PLANT_SMART_URL);
  if (!plantSmartData) {
    console.error('Could not load Plant Smart data. Aborting.');
    process.exit(1);
  }
  console.log(`Loaded ${plantSmartData.length} entries from Plant Smart.\n`);

  const enriched: CatalogPlant[] = [];
  const validationIssues: string[] = [];
  let enrichedCount = 0;

  for (let i = 0; i < catalog.length; i++) {
    const plant = { ...catalog[i] };
    const label = `[${i + 1}/${catalog.length}] ${plant.name}`;

    const psMatch = matchPlantSmart(plant, plantSmartData);
    if (psMatch) {
      const psToxicity = buildPlantSmartToxicity(psMatch);
      plant.toxicity = psToxicity;
      console.log(`${label} -> ${psToxicity}`);
      enrichedCount++;
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

    enriched.push(plant);
  }

  // Write output
  console.log(`\nWriting enriched data to ${OUTPUT_PATH}...`);
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(enriched, null, 2), 'utf-8');
  console.log(`Done. ${enriched.length} plants written (${enrichedCount} enriched).\n`);

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
