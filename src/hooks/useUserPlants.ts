
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { utilityToast } from '@/utils/notifications/toast';
import { usePostponementData } from '@/hooks/usePostponementData';
import { useOverwateringAnalysis } from '@/hooks/useOverwateringAnalysis';
import { hookLogger, trackOperation } from '@/utils/hookLogging';
import { getErrorMessage } from '@/utils/errorHandling';
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
 // Household info (populated via join)
 household?: {
   name: string;
 };
}

const HOOK_NAME = 'useUserPlants';

export const useUserPlants = () => {
const { user } = useAuth();
const [plants, setPlants] = useState<UserPlant[]>([]);
const [loading, setLoading] = useState(true);
const [isInitialLoad, setIsInitialLoad] = useState(true);
const fetchIdRef = useRef(0);

// Use custom hooks
const { fetchPostponementsGrouped } = usePostponementData();
const {
  overwateringByPlantId,
  computeRisks,
  isComputing: isComputingRisks,
} = useOverwateringAnalysis();

 /**
  * Fetches user's personal plants from database
  */
 const fetchUserPlants = useCallback(async (): Promise<any[]> => {
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

     // Only consider postponements that are newer than the last watering date
     let relevantPostponement = null;
     if (postponements.length > 0 && plant.last_watered_at) {
      const lastWateringDate = new Date(plant.last_watered_at);
      relevantPostponement = postponements.find(p =>
       new Date(p.watered_at) > lastWateringDate
      );
     }

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

 /**
  * Main function to fetch all plant data
  */
 const fetchPlants = useCallback(async () => {
  if (!user) {
   setPlants([]);
   setLoading(false);
   setIsInitialLoad(false);
   return;
  }

  // Increment fetch ID to track stale requests
  const currentFetchId = ++fetchIdRef.current;

  const mainTracker = trackOperation(HOOK_NAME, 'fetchPlants');

  try {
   // Step 1: Fetch user plants
   const plantsData = await fetchUserPlants();

   // Bail out if a newer fetch has started
   if (currentFetchId !== fetchIdRef.current) {
    hookLogger.debug(HOOK_NAME, 'Discarding stale fetch result', { currentFetchId, latestFetchId: fetchIdRef.current });
    return;
   }

   // Step 2: Enrich with additional data
   const enrichedPlants = await enrichPlantsWithData(plantsData);

   // Bail out if a newer fetch has started
   if (currentFetchId !== fetchIdRef.current) {
    hookLogger.debug(HOOK_NAME, 'Discarding stale fetch result', { currentFetchId, latestFetchId: fetchIdRef.current });
    return;
   }

   // Step 3: Compute overwatering risks
   await computeRisks(enrichedPlants);

   // Final staleness check before setting state
   if (currentFetchId !== fetchIdRef.current) {
    hookLogger.debug(HOOK_NAME, 'Discarding stale fetch result', { currentFetchId, latestFetchId: fetchIdRef.current });
    return;
   }

   setPlants(enrichedPlants);
   mainTracker.complete({ plantCount: enrichedPlants.length });
  } catch (error) {
   // If a newer fetch has started, don't clobber state with error handling
   if (currentFetchId !== fetchIdRef.current) {
    hookLogger.debug(HOOK_NAME, 'Ignoring error from stale fetch', { currentFetchId, latestFetchId: fetchIdRef.current });
    return;
   }

   mainTracker.fail(error);
   hookLogger.error(HOOK_NAME, 'Failed to fetch plants', error);

   // Only clear plants on initial load failure; preserve existing data on background refresh errors
   if (isInitialLoad) {
    const errorMsg = getErrorMessage(
     error,
     'Failed to load your plants. Please try again.'
    );
    utilityToast.error('Loading Failed', errorMsg);
    setPlants([]);
   } else {
    hookLogger.warn(HOOK_NAME, 'Background refresh failed, keeping existing plant data');
   }
  } finally {
   if (currentFetchId === fetchIdRef.current) {
    setLoading(false);
    setIsInitialLoad(false);
   }
  }
 }, [user, fetchUserPlants, enrichPlantsWithData, computeRisks, isInitialLoad]);

 // Extract action functions into a separate hook
 const {
  addPlant,
  waterPlant,
  postponeWatering,
  updatePlantSchedule,
  deletePlant,
  checkOverwatering,
 } = usePlantActions({ plants, setPlants, fetchPlants, user });

useEffect(() => {
 fetchPlants();
}, [fetchPlants]);

return {
 plants,
 // Only include isComputingRisks in loading during initial load
 // This prevents the loading state from triggering on background updates
 loading: loading || (isInitialLoad && isComputingRisks),
 overwateringByPlantId,
 fetchPlants,
 addPlant,
 waterPlant,
 postponeWatering,
 updatePlantSchedule,
 deletePlant,
 checkOverwatering,
};
};
