import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { utilityToast, wateringToast } from '@/utils/toast-helpers';
import { hookLogger } from '@/utils/hookLogging';

const HOOK_NAME = 'useWateringRecords';

export interface WateringRecord {
  id: string;
  watered_at: string;
  notes?: string | null;
  plant_id: string;
  performed_by?: string;
  is_postponement?: boolean; // Helper flag to identify postponements
}

export function useWateringRecords(onPlantDataChange?: () => void) {
  const { user } = useAuth();
  const [records, setRecords] = useState<WateringRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteLoadingRecords, setDeleteLoadingRecords] = useState<Set<string>>(new Set());

  /**
   * Loads watering records for a specific plant
   */
  const loadWateringRecords = useCallback(
    async (plantId: string) => {
      // Prevent concurrent loads for the same plant
      if (isLoading) return;

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('watering_records')
          .select('*')
          .eq('plant_id', plantId)
          .order('watered_at', { ascending: false });

        if (error) throw error;

        // Add is_postponement flag to records for UI differentiation
        const processedRecords = (data || []).map(record => ({
          ...record,
          is_postponement: record.notes?.includes('POSTPONEMENT:') || false
        }));
        
        setRecords(processedRecords);
      } catch (error) {
        hookLogger.error(HOOK_NAME, 'Error loading watering records:', error);
        wateringToast.error('load');
      } finally {
        setIsLoading(false);
      }
    },
    [] // Remove isLoading dependency to prevent infinite loops
  );

  /**
   * Adds a new watering record
   */
  const addWateringRecord = useCallback(
    async (plantId: string, date: Date, notes?: string) => {
      if (!user) return false;

      try {
        const { error } = await supabase
          .from('watering_records')
          .insert({
            plant_id: plantId,
            watered_at: date.toISOString(),
            notes: notes || null,
            performed_by: user.id,
          });

        if (error) throw error;

        // Refresh records to show the new one
        await loadWateringRecords(plantId);
        
        // Only show success toast after UI has been updated
        wateringToast.recorded('Plant');
        return true;
      } catch (error) {
        hookLogger.error(HOOK_NAME, 'Error adding watering record:', error);
        wateringToast.error('add');
        return false;
      }
    },
    [user, loadWateringRecords]
  );

  /**
   * Deletes a watering record (works for both regular waterings and postponements)
   */
  const deleteWateringRecord = useCallback(
    async (recordId: string) => {
      // Prevent multiple simultaneous deletions of the same record
      if (deleteLoadingRecords.has(recordId)) return false;

      // Add to loading set
      setDeleteLoadingRecords(prev => new Set(prev).add(recordId));

      try {
        // Get record before deletion for refresh and to check if it's a postponement
        const recordToDelete = records.find(r => r.id === recordId);
        if (!recordToDelete) throw new Error('Record not found');
        
        const plantId = recordToDelete.plant_id;
        const isPostponement = recordToDelete.notes?.includes('POSTPONEMENT:') || recordToDelete.is_postponement || false;
        
        
        // Optimistic UI update - remove the record from the local state immediately
        setRecords(currentRecords => 
          currentRecords.filter(record => record.id !== recordId)
        );
        
        // Delete the specific record from database
        const { error } = await supabase
          .from('watering_records')
          .delete()
          .eq('id', recordId);

        if (error) throw error;

        // Show success toast after database operation is successful
        if (isPostponement) {
          // For postponements, we need to use a generic toast message since the wateringToast utility
          // doesn't have a specific success method
          utilityToast.deleted('Postponement');
        } else {
          wateringToast.deleted();
        }
        
        // Trigger plant data refresh callback if provided
        // This is important for both regular waterings and postponements to ensure
        // the parent component's plant data is updated (e.g., updating the pill status on plant cards)
        if (onPlantDataChange) {
          onPlantDataChange();
        }
        
        // Don't refresh from server for regular records - trust our optimistic update
        // This avoids race conditions where the server response hasn't fully processed the deletion yet
        return true;
      } catch (error) {
        hookLogger.error(HOOK_NAME, 'Error deleting watering record:', error);
        wateringToast.error('delete');

        // On error, restore data from server to ensure consistency
        try {
          const recordToDelete = records.find(r => r.id === recordId);
          if (recordToDelete) {
            await loadWateringRecords(recordToDelete.plant_id);
          }
        } catch (refreshError) {
          hookLogger.error(HOOK_NAME, 'Error refreshing after failed deletion:', refreshError);
        }
        
        return false;
      } finally {
        // Remove from loading set
        setDeleteLoadingRecords(prev => {
          const newSet = new Set(prev);
          newSet.delete(recordId);
          return newSet;
        });
      }
    },
    [deleteLoadingRecords, records, loadWateringRecords]
  );

  /**
   * Updates an existing watering record
   */
  const updateWateringRecord = useCallback(
    async (recordId: string, date: Date, notes?: string) => {
      if (!user) return false;

      try {
        // Find the record to get its plant_id for refresh
        const recordToUpdate = records.find(r => r.id === recordId);
        if (!recordToUpdate) throw new Error('Record not found');

        const { error } = await supabase
          .from('watering_records')
          .update({
            watered_at: date.toISOString(),
            notes: notes || null,
          })
          .eq('id', recordId);

        if (error) throw error;

        // Refresh records to show the updated one
        await loadWateringRecords(recordToUpdate.plant_id);
        
        // Trigger plant data refresh callback if provided
        if (onPlantDataChange) {
          onPlantDataChange();
        }

        // Show success toast
        wateringToast.updated();
        return true;
      } catch (error) {
        hookLogger.error(HOOK_NAME, 'Error updating watering record:', error);
        wateringToast.error('update');
        return false;
      }
    },
    [user, records, loadWateringRecords, onPlantDataChange]
  );

  /**
   * Adds a postponement record
   */
  const addPostponement = useCallback(
    async (plantId: string, date: Date, notes?: string) => {
      if (!user) return false;

      try {
        const { error } = await supabase
          .from('watering_records')
          .insert({
            plant_id: plantId,
            watered_at: date.toISOString(),
            notes: `POSTPONEMENT: ${notes || 'Watering postponed'}`,
            performed_by: user.id,
          });

        if (error) throw error;

        // Refresh records to show the new one
        await loadWateringRecords(plantId);
        
        // Only show success toast after UI has been updated
        utilityToast.info('Watering postponed', 'Watering postponed successfully');
        return true;
      } catch (error) {
        hookLogger.error(HOOK_NAME, 'Error adding postponement:', error);
        wateringToast.error('add postponement');
        return false;
      }
    },
    [user, loadWateringRecords]
  );

  return {
    records,
    isLoading,
    deleteLoadingRecords,
    loadWateringRecords,
    addWateringRecord,
    updateWateringRecord,
    deleteWateringRecord,
    addPostponement
  };
}
