import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { utilityToast, wateringToast, plantToast, fertilizationToast } from '@/utils/notifications/toast';
import { hookLogger, trackOperation } from '@/utils/hookLogging';
import { handleApiError } from '@/utils/errorHandling';
import type { UserPlant } from '@/hooks/useUserPlants';

const HOOK_NAME = 'usePlantActions';

interface UsePlantActionsParams {
  plants: UserPlant[];
  setPlants: React.Dispatch<React.SetStateAction<UserPlant[]>>;
  fetchPlants: () => Promise<void>;
  user: { id: string } | null;
}

export const usePlantActions = ({
  plants,
  setPlants,
  fetchPlants,
  user,
}: UsePlantActionsParams) => {
  const { toast } = useToast();

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

  const checkOverwatering = async (_plantId: string) => {
    // Overwatering check disabled
    return;
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
              postponement_notes: undefined,
            }
            : p
        )
      );

      // Reset postponement_count — the user has now watered, so the streak of
      // "plant didn't need water" decisions is resolved.
      // Note: postponement watering_records are preserved for analytics history.
      const { error: resetCountError } = await supabase
        .from('user_plants')
        .update({ postponement_count: 0, last_postponement_date: null })
        .eq('id', plantId);

      if (resetCountError) {
        hookLogger.warn(HOOK_NAME, 'Could not reset postponement_count', {
          error: resetCountError,
        });
        // Non-fatal — watering_records is the source of truth for analysis
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

      // Create a journal entry so the watering appears in the plant journal
      await supabase
        .from('plant_journal_entries')
        .insert({
          plant_id: plantId,
          user_id: user.id,
          title: 'Watered',
          content: notes ? `Watered ${plantName}. Notes: ${notes}` : `Watered ${plantName}.`,
          mood: null,
          entry_date: wateringDate,
        });

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
        utilityToast.info(
          'Already Postponed',
          "This plant's watering is already postponed"
        );
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
              postponement_notes:
                "POSTPONEMENT: Watering postponed - plant didn't need water yet",
            }
            : p
        )
      );

      const { error } = await supabase
        .from('watering_records')
        .insert({
          plant_id: plantId,
          watered_at: postponementDate,
          notes: "POSTPONEMENT: Watering postponed - plant didn't need water yet",
          performed_by: user.id,
        });

      if (error) throw error;

      // Increment postponement_count — each postponement is a "soil was still moist"
      // signal used by pattern analysis to detect over-scheduled plants.
      const currentCount = plant?.postponement_count ?? 0;
      const { error: countError } = await supabase
        .from('user_plants')
        .update({
          postponement_count: currentCount + 1,
          last_postponement_date: postponementDate,
        })
        .eq('id', plantId);

      if (countError) {
        hookLogger.warn(HOOK_NAME, 'Could not increment postponement_count', {
          error: countError,
        });
        // Non-fatal — watering_records is the source of truth for analysis
      }

      utilityToast.info(
        'Watering Postponed',
        `${plantName} watering pushed to tomorrow`
      );

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

  const updatePlantSchedule = async (plantId: string, newSchedule: number) => {
    const tracker = trackOperation(HOOK_NAME, 'updatePlantSchedule');

    try {
      hookLogger.debug(HOOK_NAME, 'Updating plant watering schedule', {
        plantId,
        newSchedule,
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

  const logFertilization = async (plantId: string, date?: Date): Promise<boolean> => {
    if (!user) return false;

    const tracker = trackOperation(HOOK_NAME, 'logFertilization');

    try {
      const plant = plants.find(p => p.id === plantId);
      const plantName = plant?.nickname || 'Plant';
      const fertilizedDate = (date ?? new Date()).toISOString();

      // Optimistic update
      setPlants(prev =>
        prev.map(p =>
          p.id === plantId ? { ...p, last_fertilized_date: fertilizedDate } : p
        )
      );

      const { error } = await supabase
        .from('user_plants')
        .update({ last_fertilized_date: fertilizedDate })
        .eq('id', plantId);

      if (error) throw error;

      // Create a journal entry so the fertilization appears in the plant journal
      await supabase
        .from('plant_journal_entries')
        .insert({
          plant_id: plantId,
          user_id: user.id,
          title: 'Fertilized',
          content: `Fertilization logged for ${plantName}.`,
          mood: null,
          entry_date: fertilizedDate,
        });

      fertilizationToast.recorded(plantName);
      await fetchPlants();
      tracker.complete({ plantId });
      return true;
    } catch (error) {
      tracker.fail(error);
      handleApiError(error, 'Failed to log fertilization', toast);
      await fetchPlants();
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

  return {
    addPlant,
    waterPlant,
    postponeWatering,
    updatePlantSchedule,
    deletePlant,
    checkOverwatering,
    logFertilization,
  };
};
