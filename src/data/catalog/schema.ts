import { z } from 'zod';

/**
 * Schema for one plant catalog entry, stored as `src/data/catalog/plants/<slug>.json`.
 *
 * The prose fields (description, careInstructions, commonProblems, temperature, humidity) are
 * what the UI shows. The `care` block holds the same knowledge as structured values so app
 * logic (fertilization status, repotting advice, weather alerts) can use it without parsing
 * prose. Structured fields are optional while the catalog is being enriched — consumers must
 * fall back when one is missing.
 *
 * Researched entries list their references once in `sources`; each structured section cites
 * them by id in `sourceIds`.
 */

const fahrenheit = z.number().int().min(-40).max(130);
const percent = z.number().int().min(0).max(100);
const sourceIds = z.array(z.string().min(1)).min(1).optional();
const range = (min: number, max: number) =>
  z
    .tuple([z.number().int().min(min).max(max), z.number().int().min(min).max(max)])
    .refine(([lo, hi]) => lo <= hi, 'range must be [min, max]');

export const sourceSchema = z.object({
  /** Short id cited by sections' sourceIds, e.g. "mobot" */
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  url: z.url(),
});

export const lightLevelSchema = z.enum(['low', 'medium', 'bright_indirect', 'direct']);

export const wateringCareSchema = z.object({
  /** Days between waterings in fall/winter. The growing-season interval is suggestedWateringDays. */
  dormantSeasonDays: z.number().int().positive(),
  /** How much of the pot's soil should dry out before watering */
  dryness: z.enum(['keep_moist', 'top_quarter', 'top_half', 'fully_dry']),
  /** How quickly too much water causes rot */
  overwaterSensitivity: z.enum(['low', 'medium', 'high']),
  sourceIds,
});

export const lightCareSchema = z
  .object({
    ideal: lightLevelSchema,
    /** Every level the plant copes with, including ideal */
    tolerates: z.array(lightLevelSchema).min(1),
    directSun: z.enum(['avoid', 'morning', 'full']),
    sourceIds,
  })
  .refine((l) => l.tolerates.includes(l.ideal), 'tolerates must include ideal');

export const temperatureCareSchema = z
  .object({
    idealMinF: fahrenheit,
    idealMaxF: fahrenheit,
    /** Below this the plant takes cold damage — the threshold for weather alerts */
    coldDamageBelowF: fahrenheit.optional(),
    sourceIds,
  })
  .refine((t) => t.idealMinF < t.idealMaxF, 'idealMinF must be below idealMaxF')
  .refine(
    (t) => t.coldDamageBelowF === undefined || t.coldDamageBelowF <= t.idealMinF,
    'coldDamageBelowF must not be above idealMinF'
  );

export const humidityCareSchema = z
  .object({
    minPct: percent,
    maxPct: percent,
    sourceIds,
  })
  .refine((h) => h.minPct < h.maxPct, 'minPct must be below maxPct');

export const fertilizingCareSchema = z.object({
  /** [min, max] weeks between feedings during the growing season. null = cadence unknown. */
  weeks: z
    .tuple([z.number().int().positive(), z.number().int().positive()])
    .refine(([min, max]) => min <= max, 'weeks must be [min, max]')
    .nullable(),
  /** Product and strength, e.g. "Diluted balanced fertilizer". null = unspecified. */
  fertilizerType: z.string().min(3).nullable(),
  /** The care line this was written from, shown verbatim in the UI */
  tip: z.string().min(1),
  sourceIds,
});

export const repottingCareSchema = z.object({
  /** Species-specific repotting guidance shown in the repotting dialog */
  tip: z.string().min(1),
  /** [min, max] years between repottings */
  everyYears: range(1, 10).optional(),
  /** Potting mix recipe, e.g. "Chunky aroid mix: potting soil, orchid bark and perlite" */
  soil: z.string().min(1).optional(),
  sourceIds,
});

export const propagationSchema = z.object({
  methods: z
    .array(
      z.enum(['stem_cutting', 'leaf_cutting', 'division', 'offsets', 'air_layering', 'seed'])
    )
    .min(1),
  tip: z.string().min(1),
  sourceIds,
});

export const careSchema = z.object({
  watering: wateringCareSchema.optional(),
  light: lightCareSchema.optional(),
  temperature: temperatureCareSchema.optional(),
  humidity: humidityCareSchema.optional(),
  fertilizing: fertilizingCareSchema.optional(),
  repotting: repottingCareSchema.optional(),
  growthRate: z.enum(['slow', 'moderate', 'fast']).optional(),
});

const petRating = z.enum(['toxic', 'non_toxic', 'unknown']);

export const toxicityDetailSchema = z.object({
  /** 'unknown' means no source rates it for that animal — not that it is safe */
  cats: petRating,
  dogs: petRating,
  horses: petRating,
  /** Signs after eating or touching it; empty when non-toxic or unstated */
  symptoms: z.array(z.string().min(1)),
  severity: z.enum(['mild', 'moderate', 'severe']).optional(),
  /**
   * What the rating rests on:
   * species          — a source that covers this species
   * genus            — a source's genus-wide entry (e.g. "Alocasia spp.")
   * related_species  — a source's entry for a different species in the same genus
   * none             — no source found
   */
  basis: z.enum(['species', 'genus', 'related_species', 'none']),
  sourceIds,
});

export const taxonomySchema = z.object({
  /** Accepted scientific name per GBIF, without author */
  acceptedName: z.string().min(1),
  family: z.string().min(1),
  gbifKey: z.number().int().positive(),
});

export const reviewFlagSchema = z.object({
  /**
   * disagreement — sources conflict; the note says how it was resolved
   * estimate     — a value we derived because sources are vague
   * source_gap   — thin coverage: one source, genus-level, or values still from the original catalog
   * changed      — a value that differs from what the app showed before research
   * toxicity     — how the pet-safety rating was reached
   * app_gap      — care sprouthub can't represent yet (e.g. "no water this season")
   * note         — anything else worth a reviewer's attention
   */
  type: z.enum(['disagreement', 'estimate', 'source_gap', 'changed', 'toxicity', 'app_gap', 'note']),
  note: z.string().min(1),
});

export const reviewSchema = z.object({
  /**
   * legacy   — hand-written before sourcing was tracked
   * draft    — generated by the enrichment pipeline, awaiting review
   * reviewed — checked by a person against its sources
   */
  status: z.enum(['legacy', 'draft', 'reviewed']),
  /** Date the entry was last researched against its sources (YYYY-MM-DD) */
  researchedAt: z.iso.date().optional(),
  /** Notes for the reviewer. `npm run catalog-flags` lists them across the catalog. */
  flags: z.array(reviewFlagSchema).optional(),
});

export const catalogEntrySchema = z
  .object({
    name: z.string().min(1),
    botanicalName: z.string().min(1),
    otherNames: z.array(z.string().min(1)).optional(),
    /** Path inside the plant-images bucket, URL-encoded, e.g. "Monstera%20Deliciosa.png" */
    imagePath: z.string().min(1),
    wateringFrequency: z.string().min(1),
    suggestedWateringDays: z.number().int().positive(),
    lightRequirement: z.string().min(1),
    careLevel: z.enum(['Easy', 'Medium', 'Hard']),
    category: z.string().min(1),
    isOutdoorPlant: z.boolean().optional(),
    description: z.string().optional(),
    toxicity: z.string().optional(),
    toxicityDetail: toxicityDetailSchema.optional(),
    temperature: z.string().optional(),
    humidity: z.string().optional(),
    careInstructions: z.array(z.string().min(1)).optional(),
    commonProblems: z.array(z.string().min(1)).optional(),
    care: careSchema.optional(),
    /** Things that look like problems but are normal for this plant */
    whatsNormal: z.array(z.string().min(1)).optional(),
    propagation: propagationSchema.optional(),
    taxonomy: taxonomySchema.optional(),
    sources: z.array(sourceSchema).optional(),
    review: reviewSchema,
  })
  .strict()
  .superRefine((entry, ctx) => {
    const known = new Set(entry.sources?.map((s) => s.id));
    if (known.size !== (entry.sources?.length ?? 0)) {
      ctx.addIssue({ code: 'custom', message: 'duplicate source id', path: ['sources'] });
    }
    // Every cited id must be listed in sources
    const visit = (value: unknown, path: (string | number)[]) => {
      if (!value || typeof value !== 'object') return;
      for (const [key, child] of Object.entries(value)) {
        if (key === 'sourceIds' && Array.isArray(child)) {
          child
            .filter((id) => !known.has(id))
            .forEach((id) =>
              ctx.addIssue({ code: 'custom', message: `unknown source id "${id}"`, path: [...path, key] })
            );
        } else {
          visit(child, [...path, key]);
        }
      }
    };
    visit(entry, []);
  });

// With `strict: false`, zod infers tuple elements as optional; restate `weeks` as a pair.
export type FertilizingCare = Omit<z.infer<typeof fertilizingCareSchema>, 'weeks'> & {
  weeks: [number, number] | null;
};
export type RepottingCare = Omit<z.infer<typeof repottingCareSchema>, 'everyYears'> & {
  everyYears?: [number, number];
};
export type PlantCare = Omit<z.infer<typeof careSchema>, 'fertilizing' | 'repotting'> & {
  fertilizing?: FertilizingCare;
  repotting?: RepottingCare;
};
export type CatalogEntry = Omit<z.infer<typeof catalogEntrySchema>, 'care'> & {
  care?: PlantCare;
};
export type ToxicityDetail = z.infer<typeof toxicityDetailSchema>;
export type PetRating = z.infer<typeof petRating>;
export type LightLevel = z.infer<typeof lightLevelSchema>;
export type CatalogSource = z.infer<typeof sourceSchema>;
export type ReviewFlag = z.infer<typeof reviewFlagSchema>;
