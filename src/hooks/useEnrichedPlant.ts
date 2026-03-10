import { useState, useEffect } from 'react';
import { CatalogPlant } from '@/data/types';
import { getEnrichedPlant } from '@/data/enrichedPlants';

/**
 * Hook that returns enriched plant data for a given name/botanical name.
 * Falls back to static catalog data if enriched data is unavailable.
 */
export function useEnrichedPlant(
  nameOrBotanical: string | undefined,
): CatalogPlant | undefined {
  const [plant, setPlant] = useState<CatalogPlant | undefined>(undefined);

  useEffect(() => {
    if (!nameOrBotanical) {
      setPlant(undefined);
      return;
    }

    let cancelled = false;
    getEnrichedPlant(nameOrBotanical).then((result) => {
      if (!cancelled) setPlant(result);
    });

    return () => {
      cancelled = true;
    };
  }, [nameOrBotanical]);

  return plant;
}
