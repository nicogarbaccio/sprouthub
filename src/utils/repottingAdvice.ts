import type { CatalogPlant } from '@/data/types';

export type PlantSize = 'small' | 'medium' | 'large';

export interface RepottingAdvice {
  /** Plant-specific tip extracted from catalog careInstructions, if available */
  catalogTip: string | null;
  /** Tailored tips based on plant info and size */
  tips: string[];
  /** Light requirement from catalog, for display context */
  lightRequirement: string | null;
}

/**
 * Extract a repotting-related line from catalog careInstructions.
 * Matches any line containing "repot" (case-insensitive).
 */
function extractCatalogRepottingTip(
  careInstructions?: string[]
): string | null {
  if (!careInstructions) return null;
  const match = careInstructions.find((line) => /repot/i.test(line));
  return match ?? null;
}

/**
 * Return pot size upgrade recommendation based on current plant size.
 */
function getPotSizeAdvice(size: PlantSize): string {
  switch (size) {
    case 'small':
      return 'Choose a new pot 1–2 inches (2–5 cm) wider than the current one. A pot that\'s too large holds excess moisture and can cause root rot.';
    case 'medium':
      return 'Choose a new pot 2 inches (5 cm) wider than the current one. This gives the roots room to grow without sitting in too much wet soil.';
    case 'large':
      return 'Choose a new pot 2–4 inches (5–10 cm) wider. For very large plants, you can also top-dress (replace the top few inches of soil) instead of fully repotting.';
  }
}

/**
 * Return handling advice based on plant size.
 */
function getHandlingAdvice(size: PlantSize): string {
  switch (size) {
    case 'small':
      return 'Gently squeeze the sides of the pot and turn it upside down, supporting the plant with your hand, to slide it out.';
    case 'medium':
      return 'Tip the pot on its side and gently pull the plant out while supporting the base of the stem. Loosen any circling roots with your fingers.';
    case 'large':
      return 'Lay the pot on its side and slide the plant out — you may need a helper. Use a clean knife to score the root ball if roots are tightly matted.';
  }
}

/**
 * Generate repotting advice for a plant.
 *
 * Pure function — no side effects, safe to unit-test.
 *
 * @param plantName   Display name (nickname or catalog name)
 * @param catalogPlant  Catalog data, if the plant matches a known species
 * @param size  Current plant size (defaults to 'medium' for generic advice)
 */
export function getRepottingAdvice(
  plantName: string,
  catalogPlant: CatalogPlant | undefined,
  size: PlantSize = 'medium'
): RepottingAdvice {
  const catalogTip = extractCatalogRepottingTip(
    catalogPlant?.careInstructions
  );

  const tips: string[] = [];

  // 1. Pot size upgrade
  tips.push(getPotSizeAdvice(size));

  // 2. Drainage
  tips.push(
    'Make sure the new pot has drainage holes. Add a thin layer of perlite or gravel at the bottom for extra drainage.'
  );

  // 3. Soil — tailor to light preference as a rough proxy for soil needs
  const light = catalogPlant?.lightRequirement?.toLowerCase() ?? '';
  if (light.includes('low') || light.includes('indirect')) {
    tips.push(
      'Use a well-draining indoor potting mix. Mixing in perlite or orchid bark improves aeration for plants that prefer indirect light.'
    );
  } else if (light.includes('direct') || light.includes('full sun')) {
    tips.push(
      'Use a well-draining potting mix — adding extra perlite or sand helps sun-loving plants that dry out faster between waterings.'
    );
  } else {
    tips.push(
      'Use fresh, well-draining potting mix. Adding perlite (about 20%) improves drainage and root health.'
    );
  }

  // 4. Handling
  tips.push(getHandlingAdvice(size));

  // 5. Post-repot care
  tips.push(
    'Water thoroughly after repotting and let it drain. Avoid fertilizing for 2–4 weeks — fresh soil has enough nutrients, and roots need time to recover.'
  );

  return {
    catalogTip,
    tips,
    lightRequirement: catalogPlant?.lightRequirement ?? null,
  };
}
