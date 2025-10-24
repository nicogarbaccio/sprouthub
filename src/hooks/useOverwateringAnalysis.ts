import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { hookLogger, trackOperation } from '@/utils/hookLogging';
import { computeOverwateringRisk, OverwateringRisk } from '@/utils/overwatering';

/**
 * Type definition for plant with watering schedule
 */
export interface PlantWithSchedule {
  id: string;
  suggested_watering_days?: number;
}

/**
 * Type definition for watering record
 */
interface WateringRecord {
  plant_id: string;
  watered_at: string;
  notes?: string | null;
}

/**
 * Custom hook for computing overwatering risk analysis
 *
 * This hook abstracts the common pattern of computing overwatering risk
 * used across multiple hooks (useHouseholdPlants, useUserPlants).
 *
 * It fetches recent watering records and computes risk levels for each plant.
 *
 * @returns Object with overwatering data and compute function
 *
 * @example
 * const { overwateringByPlantId, computeRisks, isComputing } = useOverwateringAnalysis();
 * await computeRisks(plants);
 * const risk = overwateringByPlantId['plant-123'];
 */
export const useOverwateringAnalysis = () => {
  const [overwateringByPlantId, setOverwateringByPlantId] = useState<
    Record<string, OverwateringRisk>
  >({});
  const [isComputing, setIsComputing] = useState(false);

  /**
   * Computes overwatering risks for the given plants
   *
   * Fetches watering records within the appropriate time window and
   * calculates risk levels based on watering frequency vs. suggested schedule.
   *
   * @param plants - Array of plants with watering schedules
   */
  const computeRisks = useCallback(async (plants: PlantWithSchedule[]): Promise<void> => {
    if (plants.length === 0) {
      hookLogger.debug('useOverwateringAnalysis', 'No plants provided, clearing risks');
      setOverwateringByPlantId({});
      return;
    }

    setIsComputing(true);
    const tracker = trackOperation('useOverwateringAnalysis', 'computeRisks');

    try {
      hookLogger.debug('useOverwateringAnalysis', 'Computing overwatering risks', {
        plantCount: plants.length,
      });

      // Determine the maximum window we need to look back
      const suggestedDaysList = plants.map(p => p.suggested_watering_days ?? 7);
      const maxWindowDays = Math.min(30, Math.max(...suggestedDaysList, 7));

      // Calculate date range for query
      const now = new Date();
      const startDate = new Date(now.getTime() - maxWindowDays * 24 * 60 * 60 * 1000);

      hookLogger.debug('useOverwateringAnalysis', 'Fetching watering records', {
        maxWindowDays,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
      });

      // Fetch all watering records within the window
      const { data: records, error } = await supabase
        .from('watering_records')
        .select('plant_id, watered_at, notes')
        .in('plant_id', plants.map(p => p.id))
        .gte('watered_at', startDate.toISOString())
        .lte('watered_at', now.toISOString())
        .order('watered_at', { ascending: false });

      if (error) {
        tracker.fail(error);
        throw error;
      }

      const wateringRecords = (records || []) as WateringRecord[];

      hookLogger.debug('useOverwateringAnalysis', 'Processing watering records', {
        recordCount: wateringRecords.length,
      });

      // Compute risk for each plant
      const riskMap: Record<string, OverwateringRisk> = {};

      plants.forEach(plant => {
        const plantRecords = wateringRecords.filter(r => r.plant_id === plant.id);
        const suggestedDays = plant.suggested_watering_days ?? 7;

        riskMap[plant.id] = computeOverwateringRisk({
          records: plantRecords.map(r => ({
            watered_at: r.watered_at,
            notes: r.notes || '',
          })),
          suggestedDays,
        });
      });

      setOverwateringByPlantId(riskMap);

      const risksFound = Object.values(riskMap).filter(
        r => r.level !== 'none'
      ).length;

      tracker.complete({
        plantCount: plants.length,
        recordCount: wateringRecords.length,
        risksFound,
      });
    } catch (error) {
      hookLogger.error('useOverwateringAnalysis', 'Failed to compute risks', error);

      // Set empty risk map on error to prevent stale data
      setOverwateringByPlantId({});

      // Don't throw - allow caller to continue with empty risk data
      hookLogger.warn(
        'useOverwateringAnalysis',
        'Continuing with empty risk data after error',
        { error }
      );
    } finally {
      setIsComputing(false);
    }
  }, []);

  /**
   * Gets the overwatering risk for a specific plant
   *
   * @param plantId - Plant ID to get risk for
   * @returns Overwatering risk or null if not computed
   */
  const getRiskForPlant = useCallback(
    (plantId: string): OverwateringRisk | null => {
      return overwateringByPlantId[plantId] || null;
    },
    [overwateringByPlantId]
  );

  /**
   * Filters plants by risk level
   *
   * @param plants - Array of plants to filter
   * @param riskLevel - Risk level to filter by
   * @returns Filtered array of plant IDs
   */
  const filterPlantsByRiskLevel = useCallback(
    (
      plants: PlantWithSchedule[],
      riskLevel: 'none' | 'low' | 'high'
    ): string[] => {
      return plants
        .filter(plant => {
          const risk = overwateringByPlantId[plant.id];
          return risk && risk.level === riskLevel;
        })
        .map(plant => plant.id);
    },
    [overwateringByPlantId]
  );

  /**
   * Gets count of plants at each risk level
   *
   * @returns Object with counts per risk level
   */
  const getRiskLevelCounts = useCallback((): Record<string, number> => {
    const counts = {
      none: 0,
      low: 0,
      high: 0,
    };

    Object.values(overwateringByPlantId).forEach(risk => {
      counts[risk.level]++;
    });

    return counts;
  }, [overwateringByPlantId]);

  /**
   * Clears all computed risk data
   */
  const clearRisks = useCallback(() => {
    hookLogger.debug('useOverwateringAnalysis', 'Clearing all risk data');
    setOverwateringByPlantId({});
  }, []);

  return {
    overwateringByPlantId,
    isComputing,
    computeRisks,
    getRiskForPlant,
    filterPlantsByRiskLevel,
    getRiskLevelCounts,
    clearRisks,
  };
};
