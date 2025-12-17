import { plants as allPlants } from "@/data/plantData";

/**
 * Find a plant in the catalog by name (case-insensitive, fuzzy match)
 * @param plantType - The plant type name to search for
 * @returns The plant data if found, otherwise null
 */
export function findPlantInCatalog(plantType: string) {
  if (!plantType) return null;

  const searchTerm = plantType.toLowerCase().trim();

  // First try exact match on name or botanical name
  let plant = allPlants.find(
    (p) =>
      p.name.toLowerCase() === searchTerm ||
      p.botanicalName.toLowerCase() === searchTerm
  );

  if (plant) return plant;

  // Try partial match on name
  plant = allPlants.find((p) => p.name.toLowerCase().includes(searchTerm));
  if (plant) return plant;

  // Try partial match on botanical name
  plant = allPlants.find((p) =>
    p.botanicalName.toLowerCase().includes(searchTerm)
  );
  if (plant) return plant;

  // Try matching against other names
  plant = allPlants.find((p) =>
    p.otherNames?.some((name) => name.toLowerCase().includes(searchTerm))
  );

  return plant || null;
}

/**
 * Get the appropriate image URL for a plant
 * Priority: custom user image > default catalog image > fallback
 * @param customImage - The user's custom image URL (if any)
 * @param plantType - The plant type name
 * @param fallback - Fallback image URL
 * @returns The image URL to use
 */
export function getPlantImageUrl(
  customImage: string | null | undefined,
  plantType: string,
  fallback: string = "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=200&h=200&fit=crop"
): string {
  // If user has a custom image (not a generic stock photo), use it
  if (customImage && !isGenericStockImage(customImage)) {
    return customImage;
  }

  // Otherwise, try to find the plant in catalog and use its default image
  const catalogPlant = findPlantInCatalog(plantType);
  if (catalogPlant?.image) {
    return catalogPlant.image;
  }

  // Fall back to the generic image
  return fallback;
}

/**
 * Check if an image URL is a generic stock image (not a plant-specific image)
 * @param imageUrl - The image URL to check
 * @returns true if it's a generic stock image
 */
function isGenericStockImage(imageUrl: string): boolean {
  // List of generic/stock image patterns
  const genericPatterns = [
    "unsplash.com/photo-1509316975850", // Generic plant stock photo
    "images.unsplash.com/photo-1509316975850",
  ];

  return genericPatterns.some((pattern) => imageUrl.includes(pattern));
}
