import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { wateringToast } from '@/utils/toast-helpers';

export interface WateringRecord {
  id: string;
  watered_at: string;
  notes?: string | null;
  plant_id: string;
  performed_by?: string;
}

export function useWateringRecords() {
  const { user } = useAuth();
  const [records, setRecords] = useState<WateringRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteLoadingRecords, setDeleteLoadingRecords] = useState<Set<string>>(new Set());

  /**
   * Loads watering records for a specific plant
   */
  const loadWateringRecords = async (plantId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('watering_records')
        .select('*')
        .eq('plant_id', plantId)
        .order('watered_at', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Error loading watering records:', error);
      wateringToast.error('load');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Adds a new watering record
   */
  const addWateringRecord = async (plantId: string, date: Date, notes?: string) => {
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
      console.error('Error adding watering record:', error);
      wateringToast.error('add');
      return false;
    }
  };

  /**
   * Deletes a watering record
   */
  const deleteWateringRecord = async (recordId: string) => {
    // Prevent multiple simultaneous deletions of the same record
    if (deleteLoadingRecords.has(recordId)) return false;

    // Add to loading set
    setDeleteLoadingRecords(prev => new Set(prev).add(recordId));

    try {
      // Get plant ID before deletion for refresh
      const recordToDelete = records.find(r => r.id === recordId);
      if (!recordToDelete) throw new Error('Record not found');
      
      const plantId = recordToDelete.plant_id;
      
      // Delete from database
      const { error } = await supabase
        .from('watering_records')
        .delete()
        .eq('id', recordId);

      if (error) throw error;

      // Await the data refresh before showing success
      await loadWateringRecords(plantId);

      // Only show success toast after UI has been updated
      wateringToast.deleted();
      return true;
    } catch (error) {
      console.error('Error deleting watering record:', error);
      wateringToast.error('delete');

      // If deletion failed, still try to refresh to ensure UI consistency
      try {
        const recordToDelete = records.find(r => r.id === recordId);
        if (recordToDelete) {
          await loadWateringRecords(recordToDelete.plant_id);
        }
      } catch (refreshError) {
        console.error('Error refreshing after failed deletion:', refreshError);
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
  };

  return {
    records,
    isLoading,
    deleteLoadingRecords,
    loadWateringRecords,
    addWateringRecord,
    deleteWateringRecord
  };
}
