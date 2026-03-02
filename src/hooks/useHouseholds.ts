import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';
import { useUserHouseholdMemberships } from '@/hooks/useUserHouseholdMemberships';
import { hookLogger, trackOperation } from '@/utils/hookLogging';
import { handleApiError, getErrorMessage } from '@/utils/errorHandling';
import { useHouseholdActions } from '@/hooks/useHouseholdActions';

export type Household = Tables<'households'>;
export type HouseholdMember = Tables<'household_members'>;
export type HouseholdInvitation = Tables<'household_invitations'> & {
  households?: {
    name: string;
    description: string | null;
  };
};

export interface HouseholdWithMembers extends Household {
  household_members: HouseholdMember[];
  member_count: number;
  user_role: string;
}

const HOOK_NAME = 'useHouseholds';
const HOUSEHOLDS_QUERY_KEY = 'households';
const INVITATIONS_QUERY_KEY = 'household-invitations';

export const useHouseholds = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Use custom hooks
  const { fetchMemberships } = useUserHouseholdMemberships();

  // React Query for households
  const {
    data: households = [],
    isLoading: householdsLoading,
    error: householdsError,
    refetch: refetchHouseholds,
  } = useQuery({
    queryKey: [HOUSEHOLDS_QUERY_KEY, user?.id],
    queryFn: async (): Promise<HouseholdWithMembers[]> => {
      if (!user) return [];

      const tracker = trackOperation(HOOK_NAME, 'fetchHouseholds');

      try {
        hookLogger.debug(HOOK_NAME, 'Fetching household memberships', { userId: user.id });

        const membershipData = await fetchMemberships();

        if (!membershipData || membershipData.length === 0) {
          hookLogger.debug(HOOK_NAME, 'No household memberships found');
          tracker.complete({ count: 0 });
          return [];
        }

        const householdIds = membershipData.map(m => m.household_id);
        hookLogger.debug(HOOK_NAME, 'Found household IDs', { count: householdIds.length });

        const { data: householdData, error: householdError } = await supabase
          .from('households')
          .select('*')
          .in('id', householdIds);

        if (householdError) {
          const errorMsg = 'Could not load household details';
          hookLogger.warn(HOOK_NAME, errorMsg, { error: householdError });
          handleApiError(householdError, errorMsg, toast);
          tracker.fail(householdError);
          return [];
        }

        const { data: allMembersData, error: membersError } = await supabase
          .from('household_members')
          .select('*')
          .in('household_id', householdIds);

        if (membersError) {
          hookLogger.warn(HOOK_NAME, 'Could not load household members', { error: membersError });
        }

        const householdsWithMembers = (householdData || []).map(household => {
          const userMembership = membershipData.find(m => m.household_id === household.id);
          const householdMembers = (allMembersData || []).filter(m => m.household_id === household.id);

          return {
            ...household,
            household_members: householdMembers,
            member_count: householdMembers.length,
            user_role: userMembership?.role || 'member',
          };
        });

        hookLogger.debug(HOOK_NAME, 'Fetched households with members', {
          count: householdsWithMembers.length,
        });

        tracker.complete({ count: householdsWithMembers.length });
        return householdsWithMembers;
      } catch (error) {
        tracker.fail(error);
        hookLogger.error(HOOK_NAME, 'Failed to fetch households', error);
        const errorMsg = getErrorMessage(error, 'An unexpected error occurred');
        handleApiError(error, 'Failed to load households', toast);
        throw new Error(errorMsg);
      }
    },
    enabled: !!user,
  });

  // React Query for invitations
  const {
    data: invitations = [],
    refetch: refetchInvitations,
  } = useQuery({
    queryKey: [INVITATIONS_QUERY_KEY, user?.id],
    queryFn: async (): Promise<HouseholdInvitation[]> => {
      if (!user) return [];

      const tracker = trackOperation(HOOK_NAME, 'fetchInvitations');

      try {
        const { data, error } = await supabase
          .from('household_invitations')
          .select(`
            *,
            households(name, description)
          `)
          .eq('invited_user_id', user.id)
          .eq('status', 'pending')
          .gt('expires_at', new Date().toISOString());

        if (error) {
          hookLogger.warn(HOOK_NAME, 'Could not load invitations', { error });
          tracker.fail(error);
          return [];
        }

        tracker.complete({ count: (data || []).length });
        return data || [];
      } catch (error) {
        hookLogger.warn(HOOK_NAME, 'Error fetching invitations', { error });
        tracker.fail(error);
        return [];
      }
    },
    enabled: !!user,
  });

  // Wrappers matching the old interface for useHouseholdActions
  const fetchHouseholds = useCallback(async () => {
    await refetchHouseholds();
  }, [refetchHouseholds]);

  const fetchInvitations = useCallback(async () => {
    await refetchInvitations();
  }, [refetchInvitations]);

  // Compose with actions hook
  const actions = useHouseholdActions({
    user,
    toast,
    households,
    fetchHouseholds,
    fetchInvitations,
  });

  return {
    households,
    invitations,
    loading: householdsLoading,
    error: householdsError ? String(householdsError) : null,
    fetchHouseholds,
    fetchInvitations,
    ...actions,
  };
};
