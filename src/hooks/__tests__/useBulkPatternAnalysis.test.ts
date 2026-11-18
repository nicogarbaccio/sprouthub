import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { supabase } from '@/integrations/supabase/client';
import { wateringPatternAnalyzer } from '@/utils/watering/patternAnalyzer';
import { useBulkPatternAnalysis } from '../useWateringPatternAnalysis';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn(), rpc: vi.fn() },
}));

vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

/** A query chain that resolves to `result` however many filters are applied */
function chain(result: { data: unknown; error: unknown }) {
  const c: Record<string, unknown> = {};
  for (const method of ['select', 'in', 'not', 'order']) c[method] = vi.fn(() => c);
  c.then = (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve);
  return c;
}

describe('useBulkPatternAnalysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads every plant with three requests and analyzes each plant with its own data', async () => {
    const latestTransition = daysAgo(20);
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: [
        { plant_id: 'a', id: 'r1', watered_at: daysAgo(1), notes: null, record_type: 'watering' },
        { plant_id: 'a', id: 'r2', watered_at: daysAgo(8), notes: null, record_type: 'watering' },
        { plant_id: 'b', id: 'r3', watered_at: daysAgo(3), notes: null, record_type: 'watering' },
      ],
      error: null,
    } as never);
    vi.mocked(supabase.from).mockImplementation(((table: string) =>
      table === 'user_plants'
        ? chain({
            data: [
              { id: 'a', suggested_watering_days: 7, last_schedule_review: null },
              { id: 'b', suggested_watering_days: 10, last_schedule_review: null },
              // Reviewed recently, so it's skipped
              { id: 'c', suggested_watering_days: 5, last_schedule_review: daysAgo(2) },
            ],
            error: null,
          })
        : chain({
            data: [
              { plant_id: 'b', applied_at: latestTransition },
              { plant_id: 'b', applied_at: daysAgo(200) },
            ],
            error: null,
          })) as never);
    const analyze = vi.spyOn(wateringPatternAnalyzer, 'analyzePattern');

    const { result } = renderHook(() => useBulkPatternAnalysis(['a', 'b', 'c']));
    await waitFor(() => expect(analyze).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(supabase.rpc).toHaveBeenCalledTimes(1);
    expect(supabase.rpc).toHaveBeenCalledWith('recent_watering_records', { p_plant_ids: ['a', 'b', 'c'], p_per_plant: 15 });
    expect(supabase.from).toHaveBeenCalledTimes(2);

    const byPlant = Object.fromEntries(analyze.mock.calls.map(([data]) => [data.plantId, data]));
    expect(byPlant.a.records.map((r) => r.id)).toEqual(['r1', 'r2']);
    expect(byPlant.a.suggestedDays).toBe(7);
    expect(byPlant.a.lastSeasonalTransitionDate).toBeUndefined();
    expect(byPlant.b.records.map((r) => r.id)).toEqual(['r3']);
    expect(byPlant.b.suggestedDays).toBe(10);
    // The newest transition wins
    expect(byPlant.b.lastSeasonalTransitionDate?.toISOString()).toBe(latestTransition);
    expect(byPlant.c).toBeUndefined();
  });
});
