// Curated set of popular plants to feature on the homepage, in display order. Only the names
// live here — the plant records come from whichever catalog the caller already has (the full
// one on the Plant Catalog page, the slim summaries on the landing page), so there is a single
// source of truth and homepage cards always match the Plant Catalog.
const HOMEPAGE_PLANT_NAMES = [
 'Snake Plant',
 'Pothos',
 'Peace Lily',
 'Rubber Plant',
 'Spider Plant',
 'ZZ Plant',
 'Monstera Deliciosa',
 'Fiddle Leaf Fig',
 'Aloe Vera',
 'Jade Plant',
 'Boston Fern',
 'Heartleaf Philodendron',
 'English Ivy',
 'Parlor Palm',
 'Dracaena',
 'Kentia Palm',
] as const;

/** The homepage plants, in display order, picked from `catalog` */
export function pickHomepagePlants<T extends { name: string }>(catalog: T[]): T[] {
 const byName = new Map(catalog.map((plant) => [plant.name, plant]));
 return HOMEPAGE_PLANT_NAMES.map((name) => byName.get(name)).filter((plant): plant is T => Boolean(plant));
}
