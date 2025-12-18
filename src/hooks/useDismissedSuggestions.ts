/**
 * Hook for managing dismissed schedule suggestions with database persistence
 * Syncs dismissals across devices instead of storing only in localStorage
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  loadDismissedSuggestions as loadLocalDismissals,
  saveDismissedSuggestions as saveLocalDismissals,
  DismissedSuggestion,
} from '@/utils/suggestionPersistence';

const EXPIRY_DAYS = 30; // Suggestions dismissal expires after 30 days

interface DatabaseDismissedSuggestion {
  id: string;
  user_id: string;
  plant_id: string;
  dismissed_at: string;
  reason: 'user_dismissed' | 'applied' | 'auto_expired';
  expires_at: string;
}

export const useDismissedSuggestions = () => {
  const [dismissedPlantIds, setDismissedPlantIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Get current user ID
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  // Load dismissed suggestions from database and sync with localStorage
  const loadDismissedSuggestions = useCallback(async () => {
    if (!userId) {
      // If no user, load from localStorage only
      const localDismissals = loadLocalDismissals();
      setDismissedPlantIds(localDismissals);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Load from database
      const { data, error: fetchError } = await supabase
        .from('dismissed_suggestions')
        .select('*')
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString()); // Only get non-expired

      if (fetchError) throw fetchError;

      const plantIds = new Set(data?.map((d) => d.plant_id) || []);
      setDismissedPlantIds(plantIds);

      // Sync to localStorage for offline access
      saveLocalDismissals(plantIds, 'user_dismissed');
    } catch (err) {
      console.error('Error loading dismissed suggestions:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));

      // Fallback to localStorage on error
      const localDismissals = loadLocalDismissals();
      setDismissedPlantIds(localDismissals);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Load on mount and when userId changes
  useEffect(() => {
    loadDismissedSuggestions();
  }, [loadDismissedSuggestions]);

  // Dismiss a suggestion and save to database
  const dismissSuggestion = useCallback(
    async (plantId: string, reason: DismissedSuggestion['reason'] = 'user_dismissed') => {
      const newDismissedSet = new Set([...dismissedPlantIds, plantId]);
      setDismissedPlantIds(newDismissedSet);

      // Save to localStorage immediately for responsiveness
      saveLocalDismissals(newDismissedSet, reason);

      if (!userId) return;

      try {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + EXPIRY_DAYS * 24 * 60 * 60 * 1000);

        const { error: upsertError } = await supabase
          .from('dismissed_suggestions')
          .upsert(
            {
              user_id: userId,
              plant_id: plantId,
              dismissed_at: now.toISOString(),
              reason,
              expires_at: expiresAt.toISOString(),
            },
            {
              onConflict: 'user_id,plant_id',
            }
          );

        if (upsertError) throw upsertError;
      } catch (err) {
        console.error('Error dismissing suggestion in database:', err);
        setError(err instanceof Error ? err : new Error('Failed to sync dismissal'));
      }
    },
    [dismissedPlantIds, userId]
  );

  // Dismiss multiple suggestions
  const dismissSuggestions = useCallback(
    async (plantIds: string[], reason: DismissedSuggestion['reason'] = 'user_dismissed') => {
      const newDismissedSet = new Set([...dismissedPlantIds, ...plantIds]);
      setDismissedPlantIds(newDismissedSet);

      // Save to localStorage immediately for responsiveness
      saveLocalDismissals(newDismissedSet, reason);

      if (!userId) return;

      try {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + EXPIRY_DAYS * 24 * 60 * 60 * 1000);

        const dismissals = plantIds.map((plantId) => ({
          user_id: userId,
          plant_id: plantId,
          dismissed_at: now.toISOString(),
          reason,
          expires_at: expiresAt.toISOString(),
        }));

        const { error: upsertError } = await supabase
          .from('dismissed_suggestions')
          .upsert(dismissals, {
            onConflict: 'user_id,plant_id',
          });

        if (upsertError) throw upsertError;
      } catch (err) {
        console.error('Error dismissing suggestions in database:', err);
        setError(err instanceof Error ? err : new Error('Failed to sync dismissals'));
      }
    },
    [dismissedPlantIds, userId]
  );

  // Remove a dismissal
  const undismissSuggestion = useCallback(
    async (plantId: string) => {
      const newDismissedSet = new Set(dismissedPlantIds);
      newDismissedSet.delete(plantId);
      setDismissedPlantIds(newDismissedSet);

      // Save to localStorage immediately
      saveLocalDismissals(newDismissedSet);

      if (!userId) return;

      try {
        const { error: deleteError } = await supabase
          .from('dismissed_suggestions')
          .delete()
          .eq('user_id', userId)
          .eq('plant_id', plantId);

        if (deleteError) throw deleteError;
      } catch (err) {
        console.error('Error removing dismissal from database:', err);
        setError(err instanceof Error ? err : new Error('Failed to sync undismissal'));
      }
    },
    [dismissedPlantIds, userId]
  );

  // Check if a suggestion is dismissed
  const isDismissed = useCallback(
    (plantId: string): boolean => {
      return dismissedPlantIds.has(plantId);
    },
    [dismissedPlantIds]
  );

  // Migrate localStorage data to database (run once on first load)
  const migrateLocalToDatabase = useCallback(async () => {
    if (!userId) return;

    const localDismissals = loadLocalDismissals();
    if (localDismissals.size === 0) return;

    console.log(`Migrating ${localDismissals.size} dismissals from localStorage to database...`);

    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + EXPIRY_DAYS * 24 * 60 * 60 * 1000);

      const dismissals = Array.from(localDismissals).map((plantId) => ({
        user_id: userId,
        plant_id: plantId,
        dismissed_at: now.toISOString(),
        reason: 'user_dismissed' as const,
        expires_at: expiresAt.toISOString(),
      }));

      const { error: upsertError } = await supabase
        .from('dismissed_suggestions')
        .upsert(dismissals, {
          onConflict: 'user_id,plant_id',
          ignoreDuplicates: true, // Don't overwrite existing DB entries
        });

      if (upsertError) throw upsertError;

      console.log('Successfully migrated localStorage dismissals to database');
    } catch (err) {
      console.error('Error migrating localStorage to database:', err);
    }
  }, [userId]);

  return {
    dismissedPlantIds,
    loading,
    error,
    dismissSuggestion,
    dismissSuggestions,
    undismissSuggestion,
    isDismissed,
    loadDismissedSuggestions,
    migrateLocalToDatabase,
  };
};
