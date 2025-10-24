import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { hookLogger, trackOperation } from '@/utils/hookLogging';

/**
 * Type definition for household membership data
 */
export interface HouseholdMembership {
  household_id: string;
  role: string;
}

/**
 * Custom hook to fetch user's household memberships
 *
 * This hook abstracts the common pattern of fetching household memberships
 * used across multiple hooks (useHouseholds, useHouseholdPlants).
 *
 * @returns Object with fetchMemberships function
 *
 * @example
 * const { fetchMemberships } = useUserHouseholdMemberships();
 * const memberships = await fetchMemberships();
 */
export const useUserHouseholdMemberships = () => {
  const { user } = useAuth();

  /**
   * Fetches household memberships for the current user
   *
   * @returns Array of household memberships or empty array if none found
   * @throws Error if the RPC call fails
   */
  const fetchMemberships = useCallback(async (): Promise<HouseholdMembership[]> => {
    if (!user) {
      hookLogger.debug('useUserHouseholdMemberships', 'No user, returning empty memberships');
      return [];
    }

    const tracker = trackOperation(
      'useUserHouseholdMemberships',
      'fetchMemberships'
    );

    try {
      hookLogger.debug('useUserHouseholdMemberships', 'Fetching memberships', {
        userId: user.id,
      });

      const { data, error } = await supabase.rpc('get_user_household_memberships', {
        target_user_id: user.id,
      });

      if (error) {
        tracker.fail(error);
        throw error;
      }

      // Type assertion with validation
      const memberships = (data as HouseholdMembership[] | null) || [];

      tracker.complete({ count: memberships.length });

      return memberships;
    } catch (error) {
      hookLogger.error(
        'useUserHouseholdMemberships',
        'Failed to fetch memberships',
        error
      );
      throw error;
    }
  }, [user]);

  return { fetchMemberships };
};
