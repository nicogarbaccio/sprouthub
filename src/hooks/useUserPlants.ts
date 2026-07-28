
import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { utilityToast } from '@/utils/notifications/toast';
import { usePostponementData } from '@/hooks/usePostponementData';
import { selectActivePostponement } from '@/utils/watering/postponement';
import { useOverwateringAnalysis } from '@/hooks/useOverwateringAnalysis';
import { hookLogger, trackOperation } from '@/utils/hookLogging';
import { getUniqueValues } from '@/utils/arrayUtils';
import { usePlantActions } from '@/hooks/usePlantActions';

/**
 * Household information
 */
interface HouseholdInfo {
  id: string;
  name: string;
}

/**
 * User plant with all household and watering information
 */
export interface UserPlant {
  id: string;
  nickname: string;
  plant_type: string;
  image?: string;
  image_source?: string;
  room?: string;
  suggested_watering_days?: number;
  latest_watering?: string;
  /**
   * @deprecated Computed by the database as `now()::date - watered_at::date`, i.e. on a
   * UTC calendar day, so it drifts by a day from what the user sees. Use
   * `getDaysSince(plant.latest_watering)` from `@/utils/watering/schedule` instead.
   */
  days_since_watering?: number;
  is_outdoor_plant?: boolean;
  household_id?: string;
  alternative_names?: string[];
  created_at: string;
  updated_at: string;
  // Postponement fields
  postponement_date?: string;
  postponement_notes?: string;
  last_postponement_date?: string;
  postponement_count?: number;
  // Fertilization tracking — derived from the newest fertilization_records row.
  last_fertilized_at?: string | null;
  last_fertilization_notes?: string | null;
  /**
   * @deprecated Superseded by `fertilization_records` and the `last_fertilized_at` view
   * column. Retained only until the old column is dropped; nothing should read it.
   */
  last_fertilized_date?: string | null;
  // Household info (populated via join)
  household?: {
    name: string;
  };
}

const HOOK_NAME = 'useUserPlants';
export const USER_PLANTS_QUERY_KEY = 'user-plants';

export const useUserPlants = () => {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  // Use custom hooks
  const { fetchPostponementsGrouped } = usePostponementData();
  const {
    overwateringByPlantId,
    computeRisks,
  } = useOverwateringAnalysis();

  /**
   * Fetches user's personal plants from database
   */
  const fetchUserPlants = useCallback(async (): Promise<Database['public']['Views']['plants_with_watering_info']['Row'][]> => {
    if (!user) {
      hookLogger.debug(HOOK_NAME, 'No user, returning empty plants');
      return [];
    }

    const tracker = trackOperation(HOOK_NAME, 'fetchUserPlants');

    try {
      hookLogger.debug(HOOK_NAME, 'Fetching user plants', { userId: user.id });

      const { data: plantsData, error: plantsError } = await supabase
        .from('plants_with_watering_info')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (plantsError) throw plantsError;

      tracker.complete({ count: (plantsData || []).length });

      return plantsData || [];
    } catch (error) {
      tracker.fail(error);
      throw error;
    }
  }, [user]);

  /**
   * Enriches plants with household and postponement data
   */
  const enrichPlantsWithData = useCallback(
    async (plantsData: Database['public']['Views']['plants_with_watering_info']['Row'][]): Promise<UserPlant[]> => {
      const tracker = trackOperation(HOOK_NAME, 'enrichPlantsWithData');

      try {
        // Fetch household data
        const plantsWithHouseholds = plantsData.filter(p => p.household_id);
        let householdData: HouseholdInfo[] = [];

        if (plantsWithHouseholds.length > 0) {
          const uniqueHouseholdIds = getUniqueValues(
            plantsWithHouseholds,
            p => p.household_id
          );

          const { data: households, error: householdError } = await supabase
            .from('households')
            .select('id, name')
            .in('id', uniqueHouseholdIds);

          if (householdError) {
            hookLogger.warn(HOOK_NAME, 'Could not load household data', {
              error: householdError,
            });
          } else {
            householdData = (households || []) as HouseholdInfo[];
          }
        }

        // Fetch postponement data
        const plantIds = plantsData.map(p => p.id);
        const postponementsGrouped = await fetchPostponementsGrouped(plantIds);

        // Combine all data
        const enrichedPlants: UserPlant[] = plantsData.map(plant => {
          const postponements = postponementsGrouped.get(plant.id) || [];

          // Only postponements made after the last real watering still apply.
          const relevantPostponement = selectActivePostponement(
            postponements,
            plant.last_watered_at
          );

          const household = plant.household_id
            ? householdData.find(h => h.id === plant.household_id)
            : null;

          return {
            ...plant,
            latest_watering: plant.last_watered_at,
            postponement_date: relevantPostponement?.watered_at,
            postponement_notes: relevantPostponement?.notes,
            household: household ? { name: household.name } : undefined,
          };
        });

        tracker.complete({ count: enrichedPlants.length });

        return enrichedPlants;
      } catch (error) {
        tracker.fail(error);
        throw error;
      }
    },
    [fetchPostponementsGrouped]
  );

  // React Query for plant data — cached across navigations
  const {
    data: plants = [],
    isLoading: queryLoading,
    refetch,
  } = useQuery({
    queryKey: [USER_PLANTS_QUERY_KEY, user?.id],
    queryFn: async () => {
      if (!user) return [];

      const mainTracker = trackOperation(HOOK_NAME, 'fetchPlants');

      try {
        const plantsData = await fetchUserPlants();
        const enrichedPlants = await enrichPlantsWithData(plantsData);
        await computeRisks(enrichedPlants);
        mainTracker.complete({ plantCount: enrichedPlants.length });
        return enrichedPlants;
      } catch (error) {
        mainTracker.fail(error);
        hookLogger.error(HOOK_NAME, 'Failed to fetch plants', error);
        utilityToast.error('Loading Failed', 'Failed to load your plants. Please try again.');
        return [];
      }
    },
    enabled: !!user,
  });

  // Only use queryLoading (no cached data yet) for the main loading flag.
  // Risk computation happens after plants are already visible, so it
  // shouldn't keep the skeleton up.
  const loading = authLoading || queryLoading;

  // Wrapper to match the old fetchPlants() interface used by usePlantActions
  const fetchPlants = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // setPlants replacement: optimistically update the React Query cache
  const setPlants = useCallback(
    (updater: React.SetStateAction<UserPlant[]>) => {
      queryClient.setQueryData<UserPlant[]>(
        [USER_PLANTS_QUERY_KEY, user?.id],
        (old) => {
          const prev = old ?? [];
          return typeof updater === 'function' ? updater(prev) : updater;
        }
      );
    },
    [queryClient, user?.id]
  );

  // Extract action functions into a separate hook
  const {
    addPlant,
    waterPlant,
    postponeWatering,
    updatePlantSchedule,
    deletePlant,
    checkOverwatering,
    logFertilization,
  } = usePlantActions({ plants, setPlants, fetchPlants, user });

  return {
    plants,
    loading,
    overwateringByPlantId,
    fetchPlants,
    addPlant,
    waterPlant,
    postponeWatering,
    updatePlantSchedule,
    deletePlant,
    checkOverwatering,
    logFertilization,
  };
};
