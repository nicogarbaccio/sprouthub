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
        .rpc('get_user_household_memberships', { target_user_id: user.id }) as {
          data: Array<{ household_id: string; role: string }> | null;
          error: any;
        };

      if (membershipError) {
        console.warn('Could not load household memberships:', membershipError);
      }

      const householdIds = Array.isArray(membershipData) ? membershipData.map(m => m.household_id) : [];

      // Get all plants: user's personal plants + household plants
      let plantsQuery = supabase
        .from('plants_with_watering_info')
        .select('*')
        .or(`user_id.eq.${user.id}${householdIds.length > 0 ? `,household_id.in.(${householdIds.join(',')})` : ''}`)
        .order('created_at', { ascending: false });

      const { data: plantsData, error: plantsError } = await plantsQuery;

      if (plantsError) throw plantsError;

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
        // Use RPC function to get user emails instead of direct auth.users access
        const { data: owners, error: ownerError } = await supabase
          .rpc('get_user_emails', { user_ids: plantOwnerIds });
        
        if (ownerError) {
          console.warn('Could not load plant owner data:', ownerError);
        } else {
          plantOwnerData = owners || [];
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
          console.warn('Error fetching postponement data:', error);
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
              riskByPlantId[plant.id] = computeOverwateringRisk(
                plantRecords,
                plant.suggested_watering_days ?? 7
              );
            });

            setOverwateringByPlantId(riskByPlantId);
          }
        }
      } catch (error) {
        console.warn('Error computing overwatering risk:', error);
        setOverwateringByPlantId({});
      }

    } catch (error) {
      console.error('Error fetching plants:', error);
      utilityToast.error('loading plants');
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
      console.error('Error adding plant:', error);
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
      throw error;
    }
  };

  const deletePlant = async (plantId: string) => {
    try {
      const { error } = await supabase
        .from('user_plants')
        .delete()
        .eq('id', plantId);

      if (error) throw error;

      await fetchPlants();
    } catch (error) {
      console.error('Error deleting plant:', error);
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
      console.error('Error adding watering record:', error);
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
      console.error('Error postponing watering:', error);
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
