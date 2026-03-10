import { CatalogPlant } from './types';
import { plants as staticPlants } from './plantData';

let enrichedPlants: CatalogPlant[] | null = null;
let loadAttempted = false;

async function loadEnrichedData(): Promise<CatalogPlant[] | null> {
  if (loadAttempted) return enrichedPlants;
  loadAttempted = true;

  try {
    const res = await fetch('/enriched-plants.json');
    if (!res.ok) return null;
    enrichedPlants = (await res.json()) as CatalogPlant[];
    return enrichedPlants;
  } catch {
    return null;
  }
}

// Eagerly start loading on import
const loadPromise = loadEnrichedData();

/**
 * Get enriched plant data for a single plant by name/botanical name.
 * Returns the enriched record if available, otherwise the static catalog record.
 */
export async function getEnrichedPlant(
  nameOrBotanical: string,
): Promise<CatalogPlant | undefined> {
  const enriched = await loadPromise;
  const search = nameOrBotanical.toLowerCase();

  if (enriched) {
    const match = enriched.find(
      (p) =>
        p.name.toLowerCase() === search ||
        p.botanicalName.toLowerCase() === search,
    );
    if (match) return match;
  }

  return staticPlants.find(
    (p) =>
      p.name.toLowerCase() === search ||
      p.botanicalName.toLowerCase() === search,
  );
}

/**
 * Get an enriched plant synchronously from the cache.
 * Returns undefined if enriched data hasn't loaded yet or no match found.
 * Falls back to static catalog data.
 */
export function getEnrichedPlantSync(
  nameOrBotanical: string,
): CatalogPlant | undefined {
  const search = nameOrBotanical.toLowerCase();

  if (enrichedPlants) {
    const match = enrichedPlants.find(
      (p) =>
        p.name.toLowerCase() === search ||
        p.botanicalName.toLowerCase() === search,
    );
    if (match) return match;
  }

  return staticPlants.find(
    (p) =>
      p.name.toLowerCase() === search ||
      p.botanicalName.toLowerCase() === search,
  );
}

/**
 * Get the full enriched catalog (or static catalog as fallback).
 */
export async function getEnrichedCatalog(): Promise<CatalogPlant[]> {
  const enriched = await loadPromise;
  return enriched ?? staticPlants;
}

/**
 * Get the full enriched catalog synchronously (uses cache, falls back to static).
 */
export function getEnrichedCatalogSync(): CatalogPlant[] {
  return enrichedPlants ?? staticPlants;
}
