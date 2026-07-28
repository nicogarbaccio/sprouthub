import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { hookLogger, trackOperation } from '@/utils/hookLogging';
import { POSTPONEMENT_LIKE_PATTERN } from '@/utils/watering/notesPrefixes';

/**
 * Type definition for postponement record
 */
export interface PostponementRecord {
  plant_id: string;
  watered_at: string;
  notes: string;
}

/**
 * Custom hook to fetch postponement data for plants
 *
 * This hook abstracts the common pattern of fetching postponement records
 * used across multiple hooks (useHouseholdPlants, useUserPlants).
 *
 * Postponement records are watering records with notes containing "POSTPONEMENT:"
 * and are used to track when waterings were intentionally delayed.
 *
 * @returns Object with fetchPostponements function
 *
 * @example
 * const { fetchPostponements } = usePostponementData();
 * const postponements = await fetchPostponements(['plant-1', 'plant-2']);
 */
export const usePostponementData = () => {
  /**
   * Fetches postponement records for the given plant IDs
   *
   * @param plantIds - Array of plant IDs to fetch postponements for
   * @returns Array of postponement records, grouped by plant
   * @throws Error if the database query fails
   */
  const fetchPostponements = useCallback(
    async (plantIds: string[]): Promise<PostponementRecord[]> => {
      if (plantIds.length === 0) {
        hookLogger.debug('usePostponementData', 'No plant IDs provided, returning empty array');
        return [];
      }

      const tracker = trackOperation('usePostponementData', 'fetchPostponements');

      try {
        hookLogger.debug('usePostponementData', 'Fetching postponements', {
          plantCount: plantIds.length,
          plantIds: plantIds.slice(0, 5), // Log first 5 for debugging
        });

        const { data, error } = await supabase
          .from('watering_records')
          .select('plant_id, watered_at, notes')
          .in('plant_id', plantIds)
          .like('notes', POSTPONEMENT_LIKE_PATTERN)
          .order('watered_at', { ascending: false });

        if (error) {
          tracker.fail(error);
          throw error;
        }

        const postponements = (data || []) as PostponementRecord[];

        tracker.complete({ count: postponements.length });

        return postponements;
      } catch (error) {
        hookLogger.error('usePostponementData', 'Failed to fetch postponements', error);
        throw error;
      }
    },
    []
  );

  /**
   * Gets the most recent postponement for a specific plant
   *
   * @param plantId - Plant ID to get postponement for
   * @returns Most recent postponement record or null
   */
  const getLatestPostponement = useCallback(
    async (plantId: string): Promise<PostponementRecord | null> => {
      const postponements = await fetchPostponements([plantId]);
      return postponements.length > 0 ? postponements[0] : null;
    },
    [fetchPostponements]
  );

  /**
   * Groups postponements by plant ID for easy lookup
   *
   * @param plantIds - Array of plant IDs
   * @returns Map of plant ID to postponement records
   */
  const fetchPostponementsGrouped = useCallback(
    async (plantIds: string[]): Promise<Map<string, PostponementRecord[]>> => {
      const postponements = await fetchPostponements(plantIds);
      const grouped = new Map<string, PostponementRecord[]>();

      postponements.forEach(record => {
        const existing = grouped.get(record.plant_id) || [];
        existing.push(record);
        grouped.set(record.plant_id, existing);
      });

      return grouped;
    },
    [fetchPostponements]
  );

  /**
   * Extracts the postponement reason from the notes field
   *
   * @param notes - Notes field from postponement record
   * @returns Extracted reason or full notes if format doesn't match
   *
   * @example
   * extractPostponementReason('POSTPONEMENT: Rain expected') // Returns: 'Rain expected'
   */
  const extractPostponementReason = useCallback((notes: string): string => {
    const prefix = 'POSTPONEMENT:';
    if (notes.includes(prefix)) {
      return notes.substring(notes.indexOf(prefix) + prefix.length).trim();
    }
    return notes;
  }, []);

  return {
    fetchPostponements,
    getLatestPostponement,
    fetchPostponementsGrouped,
    extractPostponementReason,
  };
};
