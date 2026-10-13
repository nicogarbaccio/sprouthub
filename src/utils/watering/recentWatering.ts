/**
 * Guards against logging the same watering twice.
 *
 * A second tap on "water" moments after the first (or an "already watered" on top of a real
 * watering) used to insert a second record. Two waterings seconds apart give a ~0-day interval,
 * which overwatering detection and pattern analysis read as a plant watered far too often.
 */

import { supabase } from '@/integrations/supabase/client';
import { hookLogger } from '@/utils/hookLogging';
import { DUPLICATE_WATERING_WINDOW_MS } from '@/utils/plants/overwatering';
import { WATERING_RECORD_TYPE } from './notesPrefixes';

/**
 * Whether the plant already has a watering record within the duplicate window of `wateredAt`.
 * Throws on database failure so callers can decide whether to proceed.
 */
export async function hasWateringNear(plantId: string, wateredAt: Date): Promise<boolean> {
  const from = new Date(wateredAt.getTime() - DUPLICATE_WATERING_WINDOW_MS);
  const to = new Date(wateredAt.getTime() + DUPLICATE_WATERING_WINDOW_MS);

  const { data, error } = await supabase
    .from('watering_records')
    .select('id')
    .eq('plant_id', plantId)
    .eq('record_type', WATERING_RECORD_TYPE.watering)
    .gt('watered_at', from.toISOString())
    .lt('watered_at', to.toISOString())
    .limit(1);

  if (error) throw error;
  return Boolean(data && data.length > 0);
}

/**
 * `hasWateringNear` for the save paths. A failed lookup is logged and treated as "not a
 * duplicate": losing a real watering is worse than occasionally recording one twice.
 */
export async function isDuplicateWatering(plantId: string, wateredAt: Date): Promise<boolean> {
  try {
    return await hasWateringNear(plantId, wateredAt);
  } catch (error) {
    hookLogger.warn('recentWatering', 'Could not check for a duplicate watering', { error });
    return false;
  }
}
