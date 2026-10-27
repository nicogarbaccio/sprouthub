import { describe, it, expect } from 'vitest';
import { WateringPatternAnalyzer } from '../watering/patternAnalyzer';
import { LATE_STRESSED_PREFIX } from '../watering/notesPrefixes';
import type { WateringRecordForAnalysis } from '@/types/wateringPatternTypes';

const analyzer = new WateringPatternAnalyzer();
const analysisDate = new Date('2026-10-20T12:00:00Z');

const watering = (id: string, at: string, notes?: string): WateringRecordForAnalysis => ({
  id,
  watered_at: at,
  notes: notes ?? null,
  record_type: 'watering',
});
const postponement = (id: string, at: string): WateringRecordForAnalysis => ({
  id,
  watered_at: at,
  notes: "POSTPONEMENT: Watering postponed - plant didn't need water yet",
  record_type: 'postponement',
});

function postponementInsight(records: WateringRecordForAnalysis[]) {
  const analysis = analyzer.analyzePattern({ plantId: 'p1', records, suggestedDays: 7, analysisDate });
  return analyzer.generateInsights(analysis).find((i) => i.type === 'postponement_pattern');
}

/** Suggested schedules across every insight, i.e. what the user could apply */
function changesOffered(records: WateringRecordForAnalysis[]) {
  const analysis = analyzer.analyzePattern({ plantId: 'p1', records, suggestedDays: 7, analysisDate });
  return analyzer
    .generateInsights(analysis)
    .flatMap((i) => (i.suggestion ? [i.suggestion.suggestedSchedule] : []));
}

describe('frequent postponements suggestion', () => {
  it('offers the schedule plus the average delay when postponements are significant', () => {
    // 7-day plant, held off three times about 2-3 days past due each time
    const insight = postponementInsight([
      watering('w1', '2026-09-01T12:00:00Z'),
      postponement('p1', '2026-09-10T13:00:00Z'),
      postponement('p2', '2026-09-11T13:00:00Z'),
      watering('w2', '2026-09-20T12:00:00Z'),
      postponement('p3', '2026-09-29T13:00:00Z'),
    ]);

    expect(insight?.actionable).toBe(true);
    expect(insight?.suggestion).toMatchObject({
      currentSchedule: 7,
      suggestedSchedule: 9,
      adjustmentType: 'increase',
    });
  });

  it('stays advice-only below the significance bar', () => {
    const insight = postponementInsight([
      watering('w1', '2026-09-01T12:00:00Z'),
      postponement('p1', '2026-09-10T13:00:00Z'),
      watering('w2', '2026-09-20T12:00:00Z'),
      postponement('p2', '2026-09-29T13:00:00Z'),
    ]);

    expect(insight).toBeDefined();
    expect(insight?.actionable).toBe(false);
    expect(insight?.suggestion).toBeUndefined();
  });

  it('withholds the longer schedule if the plant was ever logged as stressed', () => {
    // Three postponements, each 2+ days past the 7-day due date
    const history = (lastNote?: string) => [
      watering('w1', '2026-08-31T12:00:00Z'),
      postponement('p1', '2026-09-10T09:00:00Z'),
      watering('w2', '2026-09-10T12:00:00Z'),
      postponement('p2', '2026-09-19T13:00:00Z'),
      watering('w3', '2026-09-20T12:00:00Z', lastNote),
      postponement('p3', '2026-09-29T13:00:00Z'),
    ];

    // Control: without the stressed note, a longer schedule is offered (here by the regular
    // schedule tip, which takes precedence over the postponement one)
    expect(changesOffered(history())).toEqual([9]);

    // With it, neither tip offers one; the postponement tip remains as advice
    expect(changesOffered(history(`${LATE_STRESSED_PREFIX} drooping`))).toEqual([]);
    expect(postponementInsight(history(`${LATE_STRESSED_PREFIX} drooping`))).toBeDefined();
  });
});
