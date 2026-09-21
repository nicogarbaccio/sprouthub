import { Plant } from './types';
import { plants } from './plantData';

// Curated set of popular plants to feature on the homepage, in display order. Only the names
// live here — the full plant records (images, alternative names, watering/light/care info) are
// sourced from the canonical catalog (src/data/plants/* via ./plantData), so there is a single
// source of truth and homepage cards always match the Plant Catalog. plantData is already bundled
// wherever this is used (PlantCatalog imports it directly), so there's no extra payload.
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

const plantsByName = new Map(plants.map((plant) => [plant.name, plant]));

export const homepagePlants: Plant[] = HOMEPAGE_PLANT_NAMES.map((name) =>
 plantsByName.get(name)
).filter((plant): plant is Plant => Boolean(plant));
