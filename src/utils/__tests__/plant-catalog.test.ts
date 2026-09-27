/**
 * Tests for the plant catalog data (src/data/catalog) and the advice that reads its
 * structured care fields.
 */

import { describe, it, expect } from 'vitest';
import { catalogEntrySchema } from '@/data/catalog/schema';
import { catalogJson } from '@/data/catalog';
import { plants, getCatalogPlant } from '@/data/plantData';
import { getFertilizationAdvice } from '../plants/fertilizationAdvice';
import { getRepottingAdvice } from '../plants/repottingAdvice';
import { findPlantInCatalog } from '../plants/images';

const plantFiles = import.meta.glob('../../data/catalog/plants/*.json', {
    eager: true,
    import: 'default',
});

describe('catalog data', () => {
    it.each(Object.entries(plantFiles))('%s matches the schema', (_file, json) => {
        const result = catalogEntrySchema.safeParse(json);
        expect(result.success ? [] : result.error.issues).toEqual([]);
    });

    it('lists every plant file in the index exactly once', () => {
        const indexed = new Set(catalogJson);
        expect(indexed.size).toBe(catalogJson.length);
        expect(Object.values(plantFiles).every((json) => indexed.has(json))).toBe(true);
        expect(catalogJson.length).toBe(Object.keys(plantFiles).length);
    });

    it('has unique plant names', () => {
        const names = plants.map((p) => p.name.toLowerCase());
        expect(new Set(names).size).toBe(names.length);
    });

    it.each(plants.map((p) => [p.name, p] as const))(
        '%s shows pet safety that matches its per-animal ratings',
        (_name, plant) => {
            const detail = plant.toxicityDetail!;
            const ratings = [detail.cats, detail.dogs, detail.horses];
            if (ratings.includes('toxic')) expect(plant.toxicity).toMatch(/^Toxic to /);
            else if (ratings.includes('non_toxic')) expect(plant.toxicity).toMatch(/^Non-toxic to /);
            else expect(plant.toxicity).toMatch(/^Pet safety unknown/);
            if (detail.basis !== 'none') expect(detail.sourceIds?.length).toBeGreaterThan(0);
        }
    );

    it('resolves image paths to full URLs', () => {
        expect(getCatalogPlant('Monstera Deliciosa')?.image).toMatch(
            /^https:\/\/.+\/plant-images\/Monstera%20Deliciosa\.png$/
        );
    });

    it('keeps catalog order for partial-name lookups', () => {
        expect(findPlantInCatalog('monstera')?.name).toBe('Monstera Deliciosa');
    });
});

describe('getFertilizationAdvice', () => {
    it('uses structured care over parsing the care instructions', () => {
        const advice = getFertilizationAdvice(getCatalogPlant('Hibiscus'));
        expect(advice).toMatchObject({
            source: 'catalog',
            frequencyWeeks: [2, 2],
            frequencyLabel: 'every 2 weeks',
            // The parser reads this line's product as "Gh-potassium fertilizer"
            fertilizerType: 'High-potassium fertilizer',
        });
    });

    it('keeps a structured entry with no known cadence as unknown', () => {
        const advice = getFertilizationAdvice({
            category: 'Tropical Plants',
            care: { fertilizing: { weeks: null, fertilizerType: null, tip: 'Feed lightly' } },
        });
        expect(advice).toMatchObject({
            source: 'catalog',
            frequencyWeeks: null,
            frequencyLabel: 'during the growing season',
            rawTip: 'Feed lightly',
        });
    });

    it('falls back to the care instructions, then the category', () => {
        expect(
            getFertilizationAdvice({ careInstructions: ['Fertilize monthly in spring'] })
        ).toMatchObject({ source: 'parsed', frequencyWeeks: [4, 4] });
        expect(getFertilizationAdvice(getCatalogPlant('Echeveria'))).toMatchObject({
            source: 'category_fallback',
            frequencyWeeks: [6, 8],
        });
    });
});

describe('getRepottingAdvice', () => {
    it('uses the structured repotting tip', () => {
        expect(getRepottingAdvice('Zed', getCatalogPlant('ZZ Plant')).catalogTip).toBe(
            'Repot only when severely root-bound (every 2-3 years)'
        );
    });

    it('has no tip for plants without one', () => {
        expect(getRepottingAdvice('Potty', getCatalogPlant('Pothos')).catalogTip).toBeNull();
    });
});
