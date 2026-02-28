import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { utilityToast } from '@/utils/toast-helpers';
import { hookLogger } from '@/utils/hookLogging';
import { isValidUUID, isAllowedImageType, getSafeFileExtension } from '@/utils/safeJsonParse';
import {
  JournalEntry,
  JournalEntryInsert,
  JournalEntryUpdate,
  JournalFilterOptions,
  JournalStats,
  PlantMood,
  JOURNAL_IMAGE_CONSTANTS,
} from '@/types/journalTypes';

const HOOK_NAME = 'useJournalEntries';

export function useJournalEntries(onEntryDataChange?: () => void) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteLoadingEntries, setDeleteLoadingEntries] = useState<Set<string>>(new Set());
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  /**
   * Loads journal entries for a specific plant with optional filters
   */
  const loadJournalEntries = useCallback(
    async (plantId: string, filters?: JournalFilterOptions) => {
      if (isLoading) return;

      setIsLoading(true);
      try {
        let query = supabase
          .from('plant_journal_entries')
          .select('*')
          .eq('plant_id', plantId)
          .order('entry_date', { ascending: false });

        // Apply filters
        if (filters?.startDate) {
          query = query.gte('entry_date', filters.startDate.toISOString());
        }
        if (filters?.endDate) {
          query = query.lte('entry_date', filters.endDate.toISOString());
        }
        if (filters?.mood) {
          query = query.eq('mood', filters.mood);
        }
        if (filters?.searchQuery) {
          query = query.or(
            `title.ilike.%${filters.searchQuery}%,content.ilike.%${filters.searchQuery}%`
          );
        }

        const { data, error } = await query;

        if (error) throw error;

        setEntries(data || []);
      } catch (error) {
        hookLogger.error(HOOK_NAME, 'Error loading journal entries:', error);
        utilityToast.error('Failed to load journal entries', 'Please try again');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Uploads multiple images to Supabase storage
   */
  const uploadImages = useCallback(
    async (plantId: string, images: File[]): Promise<string[]> => {
      if (!user) throw new Error('User not authenticated');

      // Validate IDs before constructing storage paths
      if (!isValidUUID(user.id)) throw new Error('Invalid user ID');
      if (!isValidUUID(plantId)) throw new Error('Invalid plant ID');

      const uploadedUrls: string[] = [];

      for (let i = 0; i < images.length; i++) {
        const file = images[i];

        // Validate MIME type and derive extension from it (not from filename)
        if (!isAllowedImageType(file)) {
          throw new Error(`Invalid image type: ${file.type}`);
        }
        const fileExt = getSafeFileExtension(file) ?? 'jpg';
        const fileName = `${user.id}/${plantId}/journal_${Date.now()}_${i}.${fileExt}`;

        try {
          // Update progress
          setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

          const { data, error } = await supabase.storage
            .from(JOURNAL_IMAGE_CONSTANTS.STORAGE_BUCKET)
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false,
            });

          if (error) throw error;

          // Get public URL
          const {
            data: { publicUrl },
          } = supabase.storage
            .from(JOURNAL_IMAGE_CONSTANTS.STORAGE_BUCKET)
            .getPublicUrl(data.path);

          uploadedUrls.push(publicUrl);

          // Update progress to 100%
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
        } catch (error) {
          hookLogger.error(HOOK_NAME, `Error uploading image ${file.name}:`, error);
          throw new Error(`Failed to upload image: ${file.name}`);
        }
      }

      // Clear progress after successful upload
      setUploadProgress({});
      return uploadedUrls;
    },
    [user]
  );

  /**
   * Adds a new journal entry with optional images
   */
  const addJournalEntry = useCallback(
    async (
      plantId: string,
      title: string,
      content: string,
      mood: PlantMood | null,
      images: File[] = [],
      entryDate?: Date,
      relatedWateringRecordId?: string
    ) => {
      if (!user) return false;

      try {
        // Validate image count
        if (images.length > JOURNAL_IMAGE_CONSTANTS.MAX_IMAGES_PER_ENTRY) {
          utilityToast.error(
            'Too many images',
            `Maximum ${JOURNAL_IMAGE_CONSTANTS.MAX_IMAGES_PER_ENTRY} images allowed`
          );
          return false;
        }

        // Validate file sizes
        for (const image of images) {
          if (image.size > JOURNAL_IMAGE_CONSTANTS.MAX_FILE_SIZE_BYTES) {
            utilityToast.error(
              'File too large',
              `${image.name} exceeds ${JOURNAL_IMAGE_CONSTANTS.MAX_FILE_SIZE_MB}MB limit`
            );
            return false;
          }
        }

        // Upload images first if any
        let imageUrls: string[] = [];
        if (images.length > 0) {
          imageUrls = await uploadImages(plantId, images);
        }

        // Create journal entry
        const entryData: JournalEntryInsert = {
          plant_id: plantId,
          user_id: user.id,
          title: title || null,
          content: content || null,
          mood: mood || null,
          images: imageUrls.length > 0 ? imageUrls : null,
          entry_date: entryDate ? entryDate.toISOString() : new Date().toISOString(),
          related_watering_record_id: relatedWateringRecordId || null,
        };

        const { error } = await supabase.from('plant_journal_entries').insert(entryData);

        if (error) throw error;

        // Refresh entries
        await loadJournalEntries(plantId);

        // Trigger callback if provided
        if (onEntryDataChange) {
          onEntryDataChange();
        }

        utilityToast.saved('Journal entry');
        return true;
      } catch (error) {
        hookLogger.error(HOOK_NAME, 'Error adding journal entry:', error);
        utilityToast.error('Failed to add entry', 'Please try again');
        return false;
      }
    },
    [user, uploadImages, loadJournalEntries, onEntryDataChange]
  );

  /**
   * Updates an existing journal entry
   */
  const updateJournalEntry = useCallback(
    async (
      entryId: string,
      title: string,
      content: string,
      mood: PlantMood | null,
      newImages: File[] = [],
      existingImageUrls: string[] = [],
      entryDate?: Date
    ) => {
      if (!user) return false;

      try {
        // Find the entry to get its plant_id
        const entryToUpdate = entries.find(e => e.id === entryId);
        if (!entryToUpdate) throw new Error('Entry not found');

        // Upload new images if any
        let uploadedUrls: string[] = [];
        if (newImages.length > 0) {
          uploadedUrls = await uploadImages(entryToUpdate.plant_id, newImages);
        }

        // Combine existing and new image URLs
        const allImageUrls = [...existingImageUrls, ...uploadedUrls];

        // Validate total image count
        if (allImageUrls.length > JOURNAL_IMAGE_CONSTANTS.MAX_IMAGES_PER_ENTRY) {
          utilityToast.error(
            'Too many images',
            `Maximum ${JOURNAL_IMAGE_CONSTANTS.MAX_IMAGES_PER_ENTRY} images allowed`
          );
          return false;
        }

        const updateData: JournalEntryUpdate = {
          title: title || null,
          content: content || null,
          mood: mood || null,
          images: allImageUrls.length > 0 ? allImageUrls : null,
          entry_date: entryDate ? entryDate.toISOString() : undefined,
        };

        const { error } = await supabase
          .from('plant_journal_entries')
          .update(updateData)
          .eq('id', entryId);

        if (error) throw error;

        // Refresh entries
        await loadJournalEntries(entryToUpdate.plant_id);

        // Trigger callback if provided
        if (onEntryDataChange) {
          onEntryDataChange();
        }

        utilityToast.saved('Journal entry');
        return true;
      } catch (error) {
        hookLogger.error(HOOK_NAME, 'Error updating journal entry:', error);
        utilityToast.error('Failed to update entry', 'Please try again');
        return false;
      }
    },
    [user, entries, uploadImages, loadJournalEntries, onEntryDataChange]
  );

  /**
   * Deletes a journal entry and its associated images
   */
  const deleteJournalEntry = useCallback(
    async (entryId: string) => {
      if (deleteLoadingEntries.has(entryId)) return false;

      setDeleteLoadingEntries(prev => new Set(prev).add(entryId));

      try {
        const entryToDelete = entries.find(e => e.id === entryId);
        if (!entryToDelete) throw new Error('Entry not found');

        // Optimistic UI update
        setEntries(currentEntries => currentEntries.filter(entry => entry.id !== entryId));

        // Delete images from storage if any
        if (entryToDelete.images && entryToDelete.images.length > 0) {
          for (const imageUrl of entryToDelete.images) {
            try {
              // Extract file path from URL
              const urlParts = imageUrl.split('/');
              const bucketIndex = urlParts.findIndex(
                part => part === JOURNAL_IMAGE_CONSTANTS.STORAGE_BUCKET
              );
              if (bucketIndex !== -1) {
                const filePath = urlParts.slice(bucketIndex + 1).join('/');
                await supabase.storage
                  .from(JOURNAL_IMAGE_CONSTANTS.STORAGE_BUCKET)
                  .remove([filePath]);
              }
            } catch (imageError) {
              hookLogger.error(HOOK_NAME, 'Error deleting image:', imageError);
              // Continue with entry deletion even if image deletion fails
            }
          }
        }

        // Delete the entry from database
        const { error } = await supabase
          .from('plant_journal_entries')
          .delete()
          .eq('id', entryId);

        if (error) throw error;

        // Trigger callback if provided
        if (onEntryDataChange) {
          onEntryDataChange();
        }

        utilityToast.deleted('Journal entry');
        return true;
      } catch (error) {
        hookLogger.error(HOOK_NAME, 'Error deleting journal entry:', error);
        utilityToast.error('Failed to delete entry', 'Please try again');

        // Restore data on error
        try {
          const entryToDelete = entries.find(e => e.id === entryId);
          if (entryToDelete) {
            await loadJournalEntries(entryToDelete.plant_id);
          }
        } catch (refreshError) {
          hookLogger.error(HOOK_NAME, 'Error refreshing after failed deletion:', refreshError);
        }

        return false;
      } finally {
        setDeleteLoadingEntries(prev => {
          const newSet = new Set(prev);
          newSet.delete(entryId);
          return newSet;
        });
      }
    },
    [deleteLoadingEntries, entries, loadJournalEntries, onEntryDataChange]
  );

  /**
   * Gets statistics about journal entries for a plant
   */
  const getJournalStats = useCallback(
    (plantId: string): JournalStats => {
      const plantEntries = entries.filter(e => e.plant_id === plantId);
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const entriesThisMonth = plantEntries.filter(
        e => e.entry_date && new Date(e.entry_date) >= thisMonthStart
      ).length;

      // Calculate most common mood
      const moodCounts: Record<string, number> = {};
      plantEntries.forEach(entry => {
        if (entry.mood) {
          moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
        }
      });

      let mostCommonMood: PlantMood | null = null;
      let maxCount = 0;
      Object.entries(moodCounts).forEach(([mood, count]) => {
        if (count > maxCount) {
          maxCount = count;
          mostCommonMood = mood as PlantMood;
        }
      });

      // Count unique days with entries
      const uniqueDays = new Set(
        plantEntries
          .filter(e => e.entry_date)
          .map(e => new Date(e.entry_date!).toDateString())
      );

      return {
        totalEntries: plantEntries.length,
        entriesThisMonth,
        mostCommonMood,
        daysWithEntries: uniqueDays.size,
      };
    },
    [entries]
  );

  return {
    entries,
    isLoading,
    deleteLoadingEntries,
    uploadProgress,
    loadJournalEntries,
    addJournalEntry,
    updateJournalEntry,
    deleteJournalEntry,
    getJournalStats,
  };
}
