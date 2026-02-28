import { useState, useEffect, useCallback } from 'react';
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

export const useHouseholds = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [households, setHouseholds] = useState<HouseholdWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [invitations, setInvitations] = useState<HouseholdInvitation[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Use custom hooks
  const { fetchMemberships } = useUserHouseholdMemberships();

  const fetchHouseholds = useCallback(async () => {
    if (!user) {
      setHouseholds([]);
      setLoading(false);
      setError(null);
      return;
    }

    const tracker = trackOperation(HOOK_NAME, 'fetchHouseholds');
    setError(null);

    try {
      hookLogger.debug(HOOK_NAME, 'Fetching household memberships', { userId: user.id });

      // Get user's household memberships
      const membershipData = await fetchMemberships();

      if (!membershipData || membershipData.length === 0) {
        hookLogger.debug(HOOK_NAME, 'No household memberships found');
        setHouseholds([]);
        setLoading(false);
        tracker.complete({ count: 0 });
        return;
      }

      // Get household IDs
      const householdIds = membershipData.map(m => m.household_id);
      hookLogger.debug(HOOK_NAME, 'Found household IDs', { count: householdIds.length });

      // Get household details
      const { data: householdData, error: householdError } = await supabase
        .from('households')
        .select('*')
        .in('id', householdIds);

      if (householdError) {
        const errorMsg = 'Could not load household details';
        hookLogger.warn(HOOK_NAME, errorMsg, { error: householdError });
        setError(errorMsg);
        handleApiError(householdError, errorMsg, toast);
        setHouseholds([]);
        setLoading(false);
        tracker.fail(householdError);
        return;
      }

      // Get all household members for these households
      const { data: allMembersData, error: membersError } = await supabase
        .from('household_members')
        .select('*')
        .in('household_id', householdIds);

      if (membersError) {
        hookLogger.warn(HOOK_NAME, 'Could not load household members', { error: membersError });
        setError('Could not load household members');
        // Continue without member details - don't throw
      }

      // Combine household data with member information
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

      setHouseholds(householdsWithMembers);
      tracker.complete({ count: householdsWithMembers.length });
    } catch (error) {
      tracker.fail(error);
      hookLogger.error(HOOK_NAME, 'Failed to fetch households', error);

      const errorMsg = getErrorMessage(error, 'An unexpected error occurred');
      setError(errorMsg);
      handleApiError(error, 'Failed to load households', toast);
    } finally {
      setLoading(false);
    }
  }, [user, fetchMemberships, toast]);

  const fetchInvitations = useCallback(async () => {
    if (!user) {
      setInvitations([]);
      return;
    }

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
        setInvitations([]);
        tracker.fail(error);
        return;
      }

      setInvitations(data || []);
      tracker.complete({ count: (data || []).length });
    } catch (error) {
      hookLogger.warn(HOOK_NAME, 'Error fetching invitations', { error });
      setInvitations([]);
      tracker.fail(error);
    }
  }, [user]);

  // Compose with actions hook
  const actions = useHouseholdActions({
    user,
    toast,
    households,
    fetchHouseholds,
    fetchInvitations,
  });

  useEffect(() => {
    fetchHouseholds();
    fetchInvitations();
  }, [fetchHouseholds, fetchInvitations]);

  return {
    households,
    invitations,
    loading,
    error,
    fetchHouseholds,
    fetchInvitations,
    ...actions,
  };
};
