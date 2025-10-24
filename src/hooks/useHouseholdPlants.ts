import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { OverwateringRisk } from '@/utils/overwatering';
import { utilityToast } from '@/utils/toast-helpers';
import { useUserHouseholdMemberships } from '@/hooks/useUserHouseholdMemberships';
import { usePostponementData } from '@/hooks/usePostponementData';
import { useOverwateringAnalysis } from '@/hooks/useOverwateringAnalysis';
import { hookLogger, trackOperation } from '@/utils/hookLogging';
import { handleApiError, getErrorMessage } from '@/utils/errorHandling';
import { deduplicateByKey, getUniqueValues } from '@/utils/arrayUtils';

/**
 * Household information
 */
interface HouseholdInfo {
  id: string;
  name: string;
}

/**
 * Plant owner information
 */
interface PlantOwnerInfo {
  id: string;
  email: string;
}

/**
 * Plant with all household and watering information
 */
export interface HouseholdPlant {
  id: string;
  nickname: string;
  plant_type: string;
  image?: string;
  room?: string;
  suggested_watering_days?: number;
  latest_watering?: string;
  days_since_watering?: number;
  is_outdoor_plant?: boolean;
  household_id?: string;
  user_id: string; // Plant owner
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
  // Plant owner info
  plant_owner?: {
    email: string;
  };
  // Whether current user owns this plant
  is_owned_by_user: boolean;
}

const HOOK_NAME = 'useHouseholdPlants';

export const useHouseholdPlants = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [plants, setPlants] = useState<HouseholdPlant[]>([]);
  const [loading, setLoading] = useState(true);

  // Use custom hooks
  const { fetchMemberships } = useUserHouseholdMemberships();
  const { fetchPostponementsGrouped } = usePostponementData();
  const {
    overwateringByPlantId,
    computeRisks,
    isComputing: isComputingRisks,
  } = useOverwateringAnalysis();

  /**
   * Fetches all plants (personal + household)
   */
  const fetchAllPlants = useCallback(async (): Promise<any[]> => {
    if (!user) {
      hookLogger.debug(HOOK_NAME, 'No user, returning empty plants');
      return [];
    }

    const tracker = trackOperation(HOOK_NAME, 'fetchAllPlants');

    try {
      // Get household memberships
      const memberships = await fetchMemberships();
      const householdIds = memberships.map(m => m.household_id);

      hookLogger.debug(HOOK_NAME, 'Fetching plants', {
        userId: user.id,
        householdCount: householdIds.length,
      });

      // Build queries for personal and household plants
      const personalPlantsQuery = supabase
        .from('plants_with_watering_info')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const queries = [personalPlantsQuery];

      // Add household plants query if applicable
      if (householdIds.length > 0) {
        const householdPlantsQuery = supabase
          .from('plants_with_watering_info')
          .select('*')
          .in('household_id', householdIds)
          .order('created_at', { ascending: false });
        queries.push(householdPlantsQuery);
      }

      // Execute queries in parallel
      const results = await Promise.all(queries);

      // Check for errors
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        throw errors[0].error;
      }

      // Merge and deduplicate plants
      const allPlants = results.flatMap(r => r.data || []);
      const uniquePlants = deduplicateByKey(allPlants, p => p.id);

      tracker.complete({ count: uniquePlants.length });

      return uniquePlants;
    } catch (error) {
      tracker.fail(error);
      throw error;
    }
  }, [user, fetchMemberships]);

  /**
   * Enriches plants with household, owner, and postponement data
   */
  const enrichPlantsWithData = useCallback(
    async (plantsData: any[]): Promise<HouseholdPlant[]> => {
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

        // Fetch plant owner information
        const plantOwnerIds = getUniqueValues(plantsData, p => p.user_id);
        let plantOwnerData: PlantOwnerInfo[] = [];

        if (plantOwnerIds.length > 0) {
          try {
            const { data: ownerEmails, error: ownerError } = await supabase.rpc(
              'get_user_emails',
              { user_ids: plantOwnerIds }
            );

            if (ownerError) {
              hookLogger.warn(HOOK_NAME, 'Could not load plant owner emails', {
                error: ownerError,
              });
            } else {
              plantOwnerData = (ownerEmails || []) as PlantOwnerInfo[];
            }
          } catch (error) {
            hookLogger.warn(HOOK_NAME, 'Error fetching plant owner emails', {
              error,
            });
          }
        }

        // Fetch postponement data
        const plantIds = plantsData.map(p => p.id);
        const postponementsGrouped = await fetchPostponementsGrouped(plantIds);

        // Combine all data
        const enrichedPlants: HouseholdPlant[] = plantsData.map(plant => {
          const postponements = postponementsGrouped.get(plant.id) || [];
          const latestPostponement = postponements.length > 0 ? postponements[0] : null;
          const household = plant.household_id
            ? householdData.find(h => h.id === plant.household_id)
            : null;
          const plantOwner = plantOwnerData.find(o => o.id === plant.user_id);

          return {
            ...plant,
            latest_watering: plant.last_watered_at,
            postponement_date: latestPostponement?.watered_at,
            postponement_notes: latestPostponement?.notes,
            household: household ? { name: household.name } : undefined,
            plant_owner: plantOwner ? { email: plantOwner.email } : undefined,
            is_owned_by_user: plant.user_id === user?.id,
          };
        });

        tracker.complete({ count: enrichedPlants.length });

        return enrichedPlants;
      } catch (error) {
        tracker.fail(error);
        throw error;
      }
    },
    [user, fetchPostponementsGrouped]
  );

  /**
   * Main function to fetch all plant data
   */
  const fetchPlants = useCallback(async () => {
    if (!user) {
      setPlants([]);
      setLoading(false);
      return;
    }

    const mainTracker = trackOperation(HOOK_NAME, 'fetchPlants');

    try {
      // Step 1: Fetch all plants
      const plantsData = await fetchAllPlants();

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
        'Failed to load plants. Please try again.'
      );
      utilityToast.error('Loading Failed', errorMsg);
      setPlants([]);
    } finally {
      setLoading(false);
    }
  }, [user, fetchAllPlants, enrichPlantsWithData, computeRisks]);

  /**
   * Validates plant ownership before mutation
   */
  const validateOwnership = useCallback(
    (plantId: string): void => {
      const plant = plants.find(p => p.id === plantId);
      if (!plant) {
        throw new Error('Plant not found');
      }

      if (!plant.is_owned_by_user) {
        throw new Error(
          'You do not have permission to modify this plant. Only the plant owner can modify it.'
        );
      }
    },
    [plants]
  );

  const addPlant = async (plantData: {
    nickname: string;
    plant_type: string;
    image?: string;
    room?: string;
    suggested_watering_days: number;
    is_outdoor_plant?: boolean;
    household_id?: string;
  }) => {
    if (!user) return;

    const tracker = trackOperation(HOOK_NAME, 'addPlant');

    try {
      const { data, error } = await supabase
        .from('user_plants')
        .insert({
          ...plantData,
          user_id: user.id,
          room: plantData.room || null,
          image: plantData.image || null,
          household_id: plantData.household_id || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Add initial watering record
      await supabase.from('watering_records').insert({
        plant_id: data.id,
        watered_at: new Date().toISOString(),
        notes: 'Initial watering record from plant creation',
        performed_by: user.id,
      });

      await fetchPlants();
      tracker.complete({ plantId: data.id });
      return data;
    } catch (error) {
      tracker.fail(error);
      handleApiError(error, 'Failed to add plant', toast);
      throw error;
    }
  };

  const updatePlant = async (
    plantId: string,
    updates: Partial<{
      nickname: string;
      plant_type: string;
      image?: string;
      room?: string;
      suggested_watering_days: number;
      is_outdoor_plant?: boolean;
      household_id?: string;
    }>
  ) => {
    const tracker = trackOperation(HOOK_NAME, 'updatePlant');

    try {
      validateOwnership(plantId);

      const { error } = await supabase
        .from('user_plants')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', plantId);

      if (error) throw error;

      await fetchPlants();
      tracker.complete({ plantId });
    } catch (error) {
      tracker.fail(error);
      handleApiError(error, 'Failed to update plant', toast);
      throw error;
    }
  };

  const deletePlant = async (plantId: string) => {
    const tracker = trackOperation(HOOK_NAME, 'deletePlant');

    try {
      validateOwnership(plantId);

      const { error } = await supabase
        .from('user_plants')
        .delete()
        .eq('id', plantId);

      if (error) throw error;

      await fetchPlants();
      tracker.complete({ plantId });
    } catch (error) {
      tracker.fail(error);
      handleApiError(error, 'Failed to delete plant', toast);
      throw error;
    }
  };

  const addWateringRecord = async (plantId: string, notes?: string) => {
    if (!user) return;

    const tracker = trackOperation(HOOK_NAME, 'addWateringRecord');

    try {
      const { error } = await supabase.from('watering_records').insert({
        plant_id: plantId,
        watered_at: new Date().toISOString(),
        notes: notes || null,
        performed_by: user.id,
      });

      if (error) throw error;

      await fetchPlants();
      tracker.complete({ plantId });
    } catch (error) {
      tracker.fail(error);
      handleApiError(error, 'Failed to add watering record', toast);
      throw error;
    }
  };

  const postponeWatering = async (
    plantId: string,
    postponeTo: Date,
    notes?: string
  ) => {
    if (!user) return;

    const tracker = trackOperation(HOOK_NAME, 'postponeWatering');

    try {
      const { error } = await supabase.from('watering_records').insert({
        plant_id: plantId,
        watered_at: postponeTo.toISOString(),
        notes: `POSTPONEMENT: ${notes || 'Watering postponed'}`,
        performed_by: user.id,
      });

      if (error) throw error;

      await fetchPlants();
      tracker.complete({ plantId });
    } catch (error) {
      tracker.fail(error);
      handleApiError(error, 'Failed to postpone watering', toast);
      throw error;
    }
  };

  useEffect(() => {
    fetchPlants();
  }, [fetchPlants]);

  return {
    plants,
    loading: loading || isComputingRisks,
    overwateringByPlantId,
    addPlant,
    updatePlant,
    deletePlant,
    addWateringRecord,
    postponeWatering,
    refetch: fetchPlants,
  };
};
