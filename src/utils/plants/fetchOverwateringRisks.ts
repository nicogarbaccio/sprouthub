/**
 * Fetches recent watering records and computes overwatering risk for a set of plants.
 *
 * Called from inside the plant list query functions so the risks are cached with the plants
 * themselves. It used to live in a hook with its own `useState`, which meant every component
 * calling `useUserPlants` held a separate copy, and only the component whose `refetch` ran the
 * query ever received the results. The My Plants page usually wasn't that component, so its
 * warnings only appeared after one of its own actions (water, postpone) refetched.
 */

import { supabase } from '@/integrations/supabase/client';
import { hookLogger, trackOperation } from '@/utils/hookLogging';
import { computeOverwateringRisk, OverwateringRisk } from '@/utils/plants/overwatering';

export interface PlantWithSchedule {
  id: string;
  suggested_watering_days?: number;
}

const LOG_SCOPE = 'fetchOverwateringRisks';

/**
 * Returns risk keyed by plant id. Never throws: on failure it logs and returns an empty map, so
 * a risk lookup problem can't stop the plant list from loading.
 */
export async function fetchOverwateringRisks(
  plants: PlantWithSchedule[]
): Promise<Record<string, OverwateringRisk>> {
  if (plants.length === 0) return {};

  const tracker = trackOperation(LOG_SCOPE, 'fetchOverwateringRisks');

  try {
    // The widest window any plant needs; computeOverwateringRisk narrows it per plant.
    const suggestedDaysList = plants.map(p => p.suggested_watering_days ?? 7);
    const maxWindowDays = Math.min(30, Math.max(...suggestedDaysList, 7));

    const now = new Date();
    const startDate = new Date(now.getTime() - maxWindowDays * 24 * 60 * 60 * 1000);

    const { data: records, error } = await supabase
      .from('watering_records')
      .select('plant_id, watered_at, notes, record_type')
      .in('plant_id', plants.map(p => p.id))
      .gte('watered_at', startDate.toISOString())
      .lte('watered_at', now.toISOString())
      .order('watered_at', { ascending: false });

    if (error) throw error;

    const riskMap: Record<string, OverwateringRisk> = {};

    plants.forEach(plant => {
      riskMap[plant.id] = computeOverwateringRisk({
        records: (records || []).filter(r => r.plant_id === plant.id),
        suggestedDays: plant.suggested_watering_days ?? 7,
        now,
      });
    });

    tracker.complete({
      plantCount: plants.length,
      recordCount: (records || []).length,
      risksFound: Object.values(riskMap).filter(r => r.level !== 'none').length,
    });

    return riskMap;
  } catch (error) {
    tracker.fail(error);
    hookLogger.warn(LOG_SCOPE, 'Continuing with empty risk data after error', { error });
    return {};
  }
}

/** Rebuilds the plant-id lookup from plants that carry their risk from the list query. */
export function indexOverwateringRisks(
  plants: Array<{ id: string; overwatering_risk?: OverwateringRisk }>
): Record<string, OverwateringRisk> {
  const byId: Record<string, OverwateringRisk> = {};
  plants.forEach(plant => {
    if (plant.overwatering_risk) byId[plant.id] = plant.overwatering_risk;
  });
  return byId;
}
