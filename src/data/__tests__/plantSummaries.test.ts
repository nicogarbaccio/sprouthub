import { describe, it, expect } from 'vitest';
import { plants } from '../plantData';
import { plantSummaries, getPlantSummary } from '../plantSummaries';
import { HEAVY_CATALOG_FIELDS } from '../../../vite/catalogSummaryPlugin';
import { getFertilizationAdvice } from '@/utils/plants/fertilizationAdvice';

describe('plantSummaries', () => {
  it('has every catalog plant, in catalog order (partial-name lookups take the first match)', () => {
    expect(plantSummaries.map((p) => p.name)).toEqual(plants.map((p) => p.name));
  });

  it('is the full catalog minus exactly the long-form fields', () => {
    plants.forEach((full, i) => {
      const expected: Record<string, unknown> = { ...full };
      for (const field of HEAVY_CATALOG_FIELDS) delete expected[field];
      expect(plantSummaries[i]).toEqual(expected);
    });
  });

  it('gives the same fertilizing advice as the full catalog for every plant', () => {
    // The advice falls back to parsing careInstructions when a plant has no structured
    // care.fertilizing; summaries leave careInstructions out, so that fallback must not matter
    for (const full of plants) {
      expect(getFertilizationAdvice(getPlantSummary(full.name)), full.name).toEqual(getFertilizationAdvice(full));
    }
  });
});
