
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { OverwateringRisk, computeOverwateringRisk } from '@/utils/overwatering';
import { utilityToast, wateringToast, plantToast } from '@/utils/toast-helpers';
import { usePostponementData } from '@/hooks/usePostponementData';
import { useOverwateringAnalysis } from '@/hooks/useOverwateringAnalysis';
import { hookLogger, trackOperation } from '@/utils/hookLogging';
import { handleApiError, getErrorMessage } from '@/utils/errorHandling';
import { getUniqueValues } from '@/utils/arrayUtils';

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
const { toast } = useToast();
const [plants, setPlants] = useState<UserPlant[]>([]);
const [loading, setLoading] = useState(true);
const [isInitialLoad, setIsInitialLoad] = useState(true);

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

  const mainTracker = trackOperation(HOOK_NAME, 'fetchPlants');

  try {
   // Step 1: Fetch user plants
   const plantsData = await fetchUserPlants();

   // Step 2: Enrich with additional data
   const enrichedPlants = await enrichPlantsWithData(plantsData);

   // Step 3: Compute overwatering risks
   await computeRisks(enrichedPlants);

   setPlants(enrichedPlants);
   mainTracker.complete({ plantCount: enrichedPlants.length });
  } catch (error) {
   mainTracker.fail(error);
   hookLogger.error(HOOK_NAME, 'Failed to fetch plants', error);

   const errorMsg = getErrorMessage(
    error,
    'Failed to load your plants. Please try again.'
   );
   utilityToast.error('Loading Failed', errorMsg);
   setPlants([]);
  } finally {
   setLoading(false);
   setIsInitialLoad(false);
  }
 }, [user, fetchUserPlants, enrichPlantsWithData, computeRisks]);

 const addPlant = async (plantData: {
  nickname: string;
  plant_type: string;
  image?: string;
  image_source?: string;
  room?: string;
  suggested_watering_days?: number;
  last_watered_date?: string;
  is_outdoor_plant?: boolean;
  household_id?: string;
  alternative_names?: string[];
 }) => {
 if (!user) return false;

 const tracker = trackOperation(HOOK_NAME, 'addPlant');

 try {
  // First, insert the plant
  const { data: plantResult, error: plantError } = await supabase
  .from('user_plants')
  .insert({
   nickname: plantData.nickname,
   plant_type: plantData.plant_type,
   image: plantData.image,
   image_source: plantData.image_source,
   room: plantData.room,
   suggested_watering_days: plantData.suggested_watering_days,
   is_outdoor_plant: plantData.is_outdoor_plant || false,
   household_id: plantData.household_id || null,
   alternative_names: plantData.alternative_names || [],
   user_id: user.id,
  })
  .select()
  .single();

  if (plantError) throw plantError;

  // If a last watered date was provided, create a watering record
  if (plantData.last_watered_date && plantResult) {
  const { error: wateringError } = await supabase
   .from('watering_records')
   .insert({
   plant_id: plantResult.id,
   watered_at: plantData.last_watered_date,
   notes: 'Initial watering record from plant creation',
   performed_by: user.id,
   });

  if (wateringError) {
   hookLogger.warn(HOOK_NAME, 'Error creating initial watering record', {
    error: wateringError,
   });
   // Don't fail the plant creation if watering record fails
  }
  }

  // Get the plant data we just created to show the name in toast
  const addedPlant = plantResult;
  plantToast.added(plantData.nickname);

  await fetchPlants();
  tracker.complete({ plantId: plantResult.id });
  return true;
 } catch (error) {
  tracker.fail(error);
  handleApiError(error, 'Failed to add plant', toast);
  return false;
 }
 };

const waterPlant = async (plantId: string, notes?: string) => {
if (!user) return false;

const tracker = trackOperation(HOOK_NAME, 'waterPlant');

try {
 // Get plant name for toast notification before updating
 const plant = plants.find(p => p.id === plantId);
 const plantName = plant?.nickname || 'Plant';

 // Optimistically update the UI
 const wateringDate = new Date().toISOString();
 setPlants(prevPlants => 
  prevPlants.map(p => 
   p.id === plantId 
    ? { 
       ...p, 
       latest_watering: wateringDate,
       days_since_watering: 0,
       // Clear postponement since we're watering
       postponement_date: undefined,
       postponement_notes: undefined
      }
    : p
  )
 );

 // First, delete any existing postponement records for this plant
 const { error: deleteError } = await supabase
 .from('watering_records')
 .delete()
 .eq('plant_id', plantId)
 .like('notes', '%POSTPONEMENT:%');

 if (deleteError) {
 hookLogger.warn(HOOK_NAME, 'Could not delete postponement records', {
  error: deleteError,
 });
 // Don't fail the watering if postponement cleanup fails
 }

 // Create the actual watering record
 const { error } = await supabase
 .from('watering_records')
 .insert({
  plant_id: plantId,
  watered_at: wateringDate,
  notes: notes || null,
  performed_by: user.id,
 });

 if (error) throw error;

 wateringToast.recorded(plantName);

 // Check overwatering risk for this plant and notify if needed
 await checkOverwatering(plantId);

 // Fetch fresh data in the background to ensure accuracy
 await fetchPlants();
 tracker.complete({ plantId });
 return true;
} catch (error) {
 tracker.fail(error);
 handleApiError(error, 'Failed to record watering', toast);
 // Revert optimistic update on error
 await fetchPlants();
 return false;
}
};

const postponeWatering = async (plantId: string) => {
if (!user) return false;

const tracker = trackOperation(HOOK_NAME, 'postponeWatering');

try {
 // Get plant name for toast
 const plant = plants.find(p => p.id === plantId);
 const plantName = plant?.nickname || 'Plant';

 // First, check if there's already a postponement record for this plant
 const { data: existingPostponements, error: fetchError } = await supabase
 .from('watering_records')
 .select('*')
 .eq('plant_id', plantId)
 .like('notes', '%POSTPONEMENT:%')
 .gt('watered_at', new Date().toISOString());

 if (fetchError) throw fetchError;

 // If there's already a future postponement, don't create another one
 if (existingPostponements && existingPostponements.length > 0) {
 utilityToast.info('Already Postponed', 'This plant\'s watering is already postponed');
 tracker.complete({ plantId, alreadyPostponed: true });
 return true;
 }

 const tomorrow = new Date();
 tomorrow.setDate(tomorrow.getDate() + 1);
 tomorrow.setHours(9, 0, 0, 0); // Set to 9 AM tomorrow for consistency

 // Optimistically update the UI
 const postponementDate = tomorrow.toISOString();
 setPlants(prevPlants => 
  prevPlants.map(p => 
   p.id === plantId 
    ? { 
       ...p, 
       postponement_date: postponementDate,
       postponement_notes: 'POSTPONEMENT: Watering postponed - plant didn\'t need water yet'
      }
    : p
  )
 );

 const { error } = await supabase
 .from('watering_records')
 .insert({
  plant_id: plantId,
  watered_at: postponementDate,
  notes: 'POSTPONEMENT: Watering postponed - plant didn\'t need water yet',
  performed_by: user.id,
 });

 if (error) throw error;

 utilityToast.info('Watering Postponed', `${plantName} watering pushed to tomorrow`);

 // Fetch fresh data in the background to ensure accuracy
 await fetchPlants();
 tracker.complete({ plantId });
 return true;
} catch (error) {
 tracker.fail(error);
 handleApiError(error, 'Failed to postpone watering', toast);
 // Revert optimistic update on error
 await fetchPlants();
 return false;
}
};

 const checkOverwatering = async (plantId: string) => {
  // Overwatering check disabled
  return;
 };

 const updatePlantSchedule = async (plantId: string, newSchedule: number) => {
  const tracker = trackOperation(HOOK_NAME, 'updatePlantSchedule');

  try {
   hookLogger.debug(HOOK_NAME, 'Updating plant watering schedule', {
     plantId,
     newSchedule
   });

   const { error } = await supabase
    .from('user_plants')
    .update({ suggested_watering_days: newSchedule })
    .eq('id', plantId);

   if (error) throw error;

   utilityToast.info(
     'Schedule Updated',
     `Watering schedule changed to every ${newSchedule} day${newSchedule === 1 ? '' : 's'}`
   );

   await fetchPlants();
   tracker.complete({ plantId, newSchedule });
   return true;
  } catch (error) {
   tracker.fail(error);
   handleApiError(error, 'Failed to update watering schedule', toast);
   return false;
  }
 };

 const deletePlant = async (plantId: string) => {
  const tracker = trackOperation(HOOK_NAME, 'deletePlant');

  try {
   const { error } = await supabase
    .from('user_plants')
    .delete()
    .eq('id', plantId);

   if (error) throw error;

   // Get plant name before it's deleted
   const plant = plants.find(p => p.id === plantId);
   const plantName = plant?.nickname || 'Plant';

   plantToast.deleted(plantName);

   await fetchPlants();
   tracker.complete({ plantId });
   return true;
  } catch (error) {
   tracker.fail(error);
   handleApiError(error, 'Failed to delete plant', toast);
   return false;
  }
 };

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
