import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { utilityToast, wateringToast, plantToast, fertilizationToast } from '@/utils/notifications/toast';
import { hookLogger, trackOperation } from '@/utils/hookLogging';
import { handleApiError } from '@/utils/errorHandling';
import { WATERING_RECORD_TYPE } from '@/utils/watering/notesPrefixes';
import { postponePlantWatering } from '@/utils/watering/postponeWatering';
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
            record_type: WATERING_RECORD_TYPE.watering,
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

  /**
   * Records a watering for a plant.
   *
   * @param plantId - plant to water
   * @param notes - optional notes, which may carry a health-observation prefix
   * @param wateredAt - when the watering actually happened. Defaults to now. Pass this
   *   when the user is backdating via "I already watered this" so the recorded interval
   *   reflects reality — pattern analysis and analytics derive schedules from these
   *   timestamps, so silently substituting "now" corrupts the plant's history.
   */
  const waterPlant = async (plantId: string, notes?: string, wateredAt?: Date) => {
    if (!user) return false;

    const tracker = trackOperation(HOOK_NAME, 'waterPlant');

    try {
      // Get plant name for toast notification before updating
      const plant = plants.find(p => p.id === plantId);
      const plantName = plant?.nickname || 'Plant';

      // Optimistically update the UI
      const wateringDate = (wateredAt ?? new Date()).toISOString();
      setPlants(prevPlants =>
        prevPlants.map(p =>
          p.id === plantId
            ? {
              ...p,
              latest_watering: wateringDate,
              // Clear postponement since we're watering
              postponement_date: undefined,
              postponement_notes: undefined,
            }
            : p
        )
      );

      // Reset postponement_count — the user has now watered, so the streak of
      // "plant didn't need water" decisions is resolved.
      // Note: past postponement watering_records are preserved for analytics history.
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

      // Delete any *pending* (future-dated) postponement. Without this the plant reads
      // back as postponed immediately after being watered: postponements are selected by
      // "watered_at newer than the last watering", and a postponement dated tomorrow is
      // always newer than a watering recorded now.
      // Past postponements are intentionally left alone — they are real evidence that the
      // user checked the soil and found it moist, which pattern analysis relies on.
      const { error: clearPostponementError } = await supabase
        .from('watering_records')
        .delete()
        .eq('plant_id', plantId)
        .eq('record_type', WATERING_RECORD_TYPE.postponement)
        .gt('watered_at', wateringDate);

      if (clearPostponementError) {
        hookLogger.warn(HOOK_NAME, 'Could not clear pending postponement', {
          error: clearPostponementError,
        });
        // Non-fatal — the watering itself succeeded
      }

      // Create the actual watering record
      const { error } = await supabase
        .from('watering_records')
        .insert({
          plant_id: plantId,
          watered_at: wateringDate,
          notes: notes || null,
          record_type: WATERING_RECORD_TYPE.watering,
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

  /**
   * Defers a plant's watering.
   *
   * @param plantId - plant to postpone
   * @param days - how many days to defer, defaulting to 1. Rain delay suggests 1–3 days
   *   depending on forecast probability, and postponement is the only mechanism that moves a
   *   due date, so it has to be able to express more than "tomorrow".
   * @param reason - optional human-readable cause, recorded in the postponement notes
   */
  const postponeWatering = async (
    plantId: string,
    days: number = 1,
    reason?: string
  ) => {
    if (!user) return false;

    const tracker = trackOperation(HOOK_NAME, 'postponeWatering');

    try {
      // Get plant name for toast
      const plant = plants.find(p => p.id === plantId);
      const plantName = plant?.nickname || 'Plant';

      const outcome = await postponePlantWatering({
        plantId,
        userId: user.id,
        days,
        reason,
        currentPostponementCount: plant?.postponement_count,
      });

      if (outcome.status === 'already_postponed') {
        utilityToast.info(
          'Already Postponed',
          "This plant's watering is already postponed"
        );
        tracker.complete({ plantId, alreadyPostponed: true });
        return true;
      }

      // Optimistically update the UI
      setPlants(prevPlants =>
        prevPlants.map(p =>
          p.id === plantId
            ? {
              ...p,
              postponement_date: outcome.postponementDate,
              postponement_notes: outcome.notes,
            }
            : p
        )
      );

      utilityToast.info(
        'Watering Postponed',
        outcome.days === 1
          ? `${plantName} watering pushed to tomorrow`
          : `${plantName} watering pushed out ${outcome.days} days`
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

  /**
   * Records a fertilization for a plant.
   *
   * Writes an append-only row to `fertilization_records` rather than overwriting a single
   * timestamp on `user_plants`, so intervals can be derived, history is auditable, and
   * household members don't clobber each other.
   *
   * @param date - when the fertilization happened. Defaults to now.
   * @param fertilizerType - optionally what was applied
   */
  const logFertilization = async (
    plantId: string,
    date?: Date,
    fertilizerType?: string
  ): Promise<boolean> => {
    if (!user) return false;

    const tracker = trackOperation(HOOK_NAME, 'logFertilization');

    try {
      const plant = plants.find(p => p.id === plantId);
      const plantName = plant?.nickname || 'Plant';
      const fertilizedDate = (date ?? new Date()).toISOString();

      // Optimistic update
      setPlants(prev =>
        prev.map(p =>
          p.id === plantId ? { ...p, last_fertilized_at: fertilizedDate } : p
        )
      );

      const { error } = await supabase
        .from('fertilization_records')
        .insert({
          plant_id: plantId,
          fertilized_at: fertilizedDate,
          fertilizer_type: fertilizerType ?? null,
          performed_by: user.id,
        });

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
