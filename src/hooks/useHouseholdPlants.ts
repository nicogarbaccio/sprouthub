import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { computeOverwateringRisk, OverwateringRisk } from '@/utils/overwatering';
import { utilityToast } from '@/utils/toast-helpers';

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

export const useHouseholdPlants = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [plants, setPlants] = useState<HouseholdPlant[]>([]);
  const [loading, setLoading] = useState(true);
  const [overwateringByPlantId, setOverwateringByPlantId] = useState<Record<string, OverwateringRisk>>({});

  const fetchPlants = async () => {
    if (!user) {
      setPlants([]);
      setLoading(false);
      return;
    }

    try {
      // First, get user's household memberships
      const { data: membershipData, error: membershipError } = await supabase
        .rpc('get_user_household_memberships', { target_user_id: user.id });

      if (membershipError) {
        console.warn('Could not load household memberships:', membershipError);
      }

      const householdIds = Array.isArray(membershipData) ? membershipData.map(m => m.household_id) : [];

      // Get all plants: user's personal plants + household plants
      // Use separate queries to avoid SQL injection risk from string interpolation
      const personalPlantsQuery = supabase
        .from('plants_with_watering_info')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      let queries = [personalPlantsQuery];

      // Add household plants query if user is member of any households
      if (householdIds.length > 0) {
        const householdPlantsQuery = supabase
          .from('plants_with_watering_info')
          .select('*')
          .in('household_id', householdIds)
          .order('created_at', { ascending: false });
        queries.push(householdPlantsQuery);
      }

      const results = await Promise.all(queries);

      // Check for errors
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        throw errors[0].error;
      }

      // Merge results and remove duplicates by plant ID
      const allPlants = results.flatMap(r => r.data || []);
      const uniquePlantsMap = new Map();
      allPlants.forEach(plant => {
        if (!uniquePlantsMap.has(plant.id)) {
          uniquePlantsMap.set(plant.id, plant);
        }
      });
      const plantsData = Array.from(uniquePlantsMap.values());

      // Get household data for plants that have household_id
      const plantsWithHouseholds = (plantsData || []).filter(p => p.household_id);
      let householdData: any[] = [];
      
      if (plantsWithHouseholds.length > 0) {
        const uniqueHouseholdIds = [...new Set(plantsWithHouseholds.map(p => p.household_id))];
        const { data: households, error: householdError } = await supabase
          .from('households')
          .select('id, name')
          .in('id', uniqueHouseholdIds);
        
        if (householdError) {
          console.warn('Could not load household data:', householdError);
        } else {
          householdData = households || [];
        }
      }

      // Get plant owner information for household plants
      const plantOwnerIds = [...new Set((plantsData || []).map(p => p.user_id))];
      let plantOwnerData: any[] = [];

      if (plantOwnerIds.length > 0) {
        try {
          const { data: ownerEmails, error: ownerError } = await supabase.rpc('get_user_emails', {
            user_ids: plantOwnerIds,
          });

          if (ownerError) {
            console.warn('Could not load plant owner emails:', ownerError);
            plantOwnerData = [];
          } else {
            plantOwnerData = ownerEmails || [];
          }
        } catch (error) {
          console.warn('Error fetching plant owner emails:', error instanceof Error ? error.message : error);
          plantOwnerData = [];
        }
      }
      
      // Then get postponement data for all plants
      const plantIds = (plantsData || []).map(p => p.id);
      let postponementData: any[] = [];
      
      // Get postponement data for all plants
      if (plantIds.length > 0) {
        try {
          const { data: postponements, error: postponementError } = await supabase
          .from('watering_records')
          .select('plant_id, watered_at, notes')
          .in('plant_id', plantIds)
          .like('notes', '%POSTPONEMENT:%')
          .gt('watered_at', new Date().toISOString())
          .order('watered_at', { ascending: false });

          if (postponementError) {
            console.warn('Could not load postponement data:', postponementError);
          } else {
            postponementData = postponements || [];
          }
        } catch (error) {
          console.warn('Error fetching postponement data:', error instanceof Error ? error.message : error);
        }
      }

      // Combine plants with their postponement, household, and owner data
      const result = (plantsData || []).map(plant => {
        const postponement = postponementData.find(p => p.plant_id === plant.id);
        const household = plant.household_id 
          ? householdData.find(h => h.id === plant.household_id)
          : null;
        const plantOwner = plantOwnerData.find(o => o.id === plant.user_id);
        
        return {
          ...plant,
          // Map the correct field name from the database view
          latest_watering: plant.last_watered_at,
          postponement_date: postponement?.watered_at,
          postponement_notes: postponement?.notes,
          household: household ? { name: household.name } : undefined,
          plant_owner: plantOwner ? { email: plantOwner.email } : undefined,
          is_owned_by_user: plant.user_id === user.id,
        };
      });
      
      setPlants(result);

      // After plants load, fetch recent watering records once and compute risk per plant
      try {
        const plantIds = result.map((p) => p.id);
        if (plantIds.length === 0) {
          setOverwateringByPlantId({});
        } else {
          const suggestedDaysList = result.map((p) => p.suggested_watering_days ?? 7);
          const maxWindowDays = Math.min(30, Math.max(...suggestedDaysList, 7));
          const now = new Date();
          const start = new Date(now.getTime() - maxWindowDays * 24 * 60 * 60 * 1000).toISOString();
          const end = now.toISOString();

          const { data: records, error: recordsError } = await supabase
            .from('watering_records')
            .select('plant_id, watered_at, notes')
            .in('plant_id', plantIds)
            .gte('watered_at', start)
            .lte('watered_at', end);

          if (recordsError) {
            console.warn('Could not load watering records for overwatering risk:', recordsError);
          } else {
            const recordsByPlantId = (records || []).reduce((acc, record) => {
              if (!acc[record.plant_id]) {
                acc[record.plant_id] = [];
              }
              acc[record.plant_id].push(record);
              return acc;
            }, {} as Record<string, any[]>);

            const riskByPlantId: Record<string, OverwateringRisk> = {};
            result.forEach((plant) => {
              const plantRecords = recordsByPlantId[plant.id] || [];
              riskByPlantId[plant.id] = computeOverwateringRisk({
                records: plantRecords,
                suggestedDays: plant.suggested_watering_days ?? 7,
              });
            });

            setOverwateringByPlantId(riskByPlantId);
          }
        }
      } catch (error) {
        console.warn('Error computing overwatering risk:', error instanceof Error ? error.message : error);
        setOverwateringByPlantId({});
      }

    } catch (error) {
      console.error('Error fetching plants:', error instanceof Error ? error.message : error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to load plants. Please try again.';
      utilityToast.error('Loading Failed', errorMsg);
      setPlants([]);
    } finally {
      setLoading(false);
    }
  };

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
      return data;
    } catch (error) {
      console.error('Error adding plant:', error instanceof Error ? error.message : error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to add plant';
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updatePlant = async (plantId: string, updates: Partial<{
    nickname: string;
    plant_type: string;
    image?: string;
    room?: string;
    suggested_watering_days: number;
    is_outdoor_plant?: boolean;
    household_id?: string;
  }>) => {
    try {
      // Ownership validation before database call
      const plant = plants.find(p => p.id === plantId);
      if (!plant) {
        throw new Error('Plant not found');
      }

      if (!plant.is_owned_by_user) {
        throw new Error('You do not have permission to update this plant. Only the plant owner can modify it.');
      }

      // All validations passed, proceed with database call
      const { error } = await supabase
        .from('user_plants')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', plantId);

      if (error) throw error;

      await fetchPlants();
    } catch (error) {
      console.error('Error updating plant:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update plant',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deletePlant = async (plantId: string) => {
    try {
      // Ownership validation before database call
      const plant = plants.find(p => p.id === plantId);
      if (!plant) {
        throw new Error('Plant not found');
      }

      if (!plant.is_owned_by_user) {
        throw new Error('You do not have permission to delete this plant. Only the plant owner can modify it.');
      }

      // All validations passed, proceed with database call
      const { error } = await supabase
        .from('user_plants')
        .delete()
        .eq('id', plantId);

      if (error) throw error;

      await fetchPlants();
    } catch (error) {
      console.error('Error deleting plant:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete plant',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const addWateringRecord = async (plantId: string, notes?: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('watering_records')
        .insert({
          plant_id: plantId,
          watered_at: new Date().toISOString(),
          notes: notes || null,
          performed_by: user.id, // Track who performed the watering
        });

      if (error) throw error;

      await fetchPlants();
    } catch (error) {
      console.error('Error adding watering record:', error instanceof Error ? error.message : error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to add watering record';
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const postponeWatering = async (plantId: string, postponeTo: Date, notes?: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('watering_records')
        .insert({
          plant_id: plantId,
          watered_at: postponeTo.toISOString(),
          notes: `POSTPONEMENT: ${notes || 'Watering postponed'}`,
          performed_by: user.id, // Track who postponed the watering
        });

      if (error) throw error;

      await fetchPlants();
    } catch (error) {
      console.error('Error postponing watering:', error instanceof Error ? error.message : error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to postpone watering';
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchPlants();
  }, [user]);

  return {
    plants,
    loading,
    overwateringByPlantId,
    addPlant,
    updatePlant,
    deletePlant,
    addWateringRecord,
    postponeWatering,
    refetch: fetchPlants,
  };
};
