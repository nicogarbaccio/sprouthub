import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';
import { useUserHouseholdMemberships } from '@/hooks/useUserHouseholdMemberships';
import { hookLogger, trackOperation } from '@/utils/hookLogging';
import { handleApiError, getErrorMessage, validateEmail } from '@/utils/errorHandling';

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

  const createHousehold = async (name: string, description?: string) => {
    if (!user) return false;

    const tracker = trackOperation(HOOK_NAME, 'createHousehold');

    try {
      hookLogger.debug(HOOK_NAME, 'Creating household', { name, description });

      const { error } = await supabase.rpc('create_household', {
        household_name: name,
        household_description: description,
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Household created successfully',
      });

      await fetchHouseholds();
      tracker.complete({ name });
      return true;
    } catch (error) {
      tracker.fail(error);
      handleApiError(error, 'Failed to create household', toast);
      return false;
    }
  };

  const inviteToHousehold = async (
    householdId: string,
    email: string,
    role: 'member' | 'admin' = 'member'
  ) => {
    const tracker = trackOperation(HOOK_NAME, 'inviteToHousehold');

    try {
      // Validate and normalize email
      const normalizedEmail = validateEmail(email);
      if (!normalizedEmail) {
        toast({
          title: 'Error',
          description: 'Please enter a valid email address',
          variant: 'destructive',
        });
        tracker.fail(new Error('Invalid email address'));
        return false;
      }

      // Prevent self-invitation
      if (user && normalizedEmail === user.email?.toLowerCase()) {
        toast({
          title: 'Error',
          description: 'You cannot invite yourself to a household',
          variant: 'destructive',
        });
        tracker.fail(new Error('Self-invitation attempted'));
        return false;
      }

      const { error } = await supabase.rpc('invite_to_household', {
        household_id: householdId,
        invited_email: normalizedEmail,
        invitation_role: role,
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Invitation sent successfully',
      });

      tracker.complete({ householdId, email: normalizedEmail, role });
      return true;
    } catch (error) {
      tracker.fail(error);
      handleApiError(error, 'Failed to send invitation', toast);
      return false;
    }
  };

  const acceptInvitation = async (invitationId: string) => {
    const tracker = trackOperation(HOOK_NAME, 'acceptInvitation');

    try {
      const { error } = await supabase.rpc('accept_household_invitation', {
        invitation_id: invitationId,
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Invitation accepted successfully',
      });

      // Use Promise.all to prevent race conditions
      await Promise.all([fetchHouseholds(), fetchInvitations()]);
      tracker.complete({ invitationId });
      return true;
    } catch (error) {
      tracker.fail(error);
      handleApiError(error, 'Failed to accept invitation', toast);
      return false;
    }
  };

  const declineInvitation = async (invitationId: string) => {
    const tracker = trackOperation(HOOK_NAME, 'declineInvitation');

    try {
      const { error } = await supabase.rpc('decline_household_invitation', {
        invitation_id: invitationId,
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Invitation declined',
      });

      // Use Promise.all to prevent race conditions
      await Promise.all([fetchHouseholds(), fetchInvitations()]);
      tracker.complete({ invitationId });
      return true;
    } catch (error) {
      tracker.fail(error);
      handleApiError(error, 'Failed to decline invitation', toast);
      return false;
    }
  };

  const leaveHousehold = async (householdId: string) => {
    const tracker = trackOperation(HOOK_NAME, 'leaveHousehold');

    try {
      const { error } = await supabase.rpc('leave_household', {
        household_id: householdId,
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Left household successfully',
      });

      // Use Promise.all to prevent race conditions
      await Promise.all([fetchHouseholds(), fetchInvitations()]);
      tracker.complete({ householdId });
      return true;
    } catch (error) {
      tracker.fail(error);
      handleApiError(error, 'Failed to leave household', toast);
      return false;
    }
  };

  const removeMember = async (householdId: string, memberId: string) => {
    const tracker = trackOperation(HOOK_NAME, 'removeMember');

    try {
      // Client-side permission validation
      if (!user) {
        const error = new Error('You must be logged in to remove members');
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
        tracker.fail(error);
        return false;
      }

      // Verify the household exists in local state
      const household = households.find(h => h.id === householdId);
      if (!household) {
        const error = new Error('Household not found');
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
        tracker.fail(error);
        return false;
      }

      // Confirm current user has 'owner' or 'admin' role
      if (household.user_role !== 'owner' && household.user_role !== 'admin') {
        const error = new Error('You do not have permission to remove members. Only household owners and admins can remove members.');
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
        tracker.fail(error);
        return false;
      }

      // Find the member being removed
      const memberToRemove = household.household_members.find(m => m.id === memberId);
      if (!memberToRemove) {
        const error = new Error('Member not found in this household');
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
        tracker.fail(error);
        return false;
      }

      // Prevent removing a member with 'owner' role
      if (memberToRemove.role === 'owner') {
        const error = new Error('Cannot remove the household owner. Transfer ownership first.');
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
        tracker.fail(error);
        return false;
      }

      // All validations passed, proceed with database call
      const { error } = await supabase
        .from('household_members')
        .delete()
        .eq('household_id', householdId)
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Member removed successfully',
      });

      await fetchHouseholds();
      tracker.complete({ householdId, memberId });
      return true;
    } catch (error) {
      tracker.fail(error);
      handleApiError(error, 'Failed to remove member', toast);
      return false;
    }
  };

  const deleteHousehold = async (householdId: string) => {
    const tracker = trackOperation(HOOK_NAME, 'deleteHousehold');

    try {
      // Client-side permission validation
      if (!user) {
        const error = new Error('You must be logged in to delete households');
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
        tracker.fail(error);
        return false;
      }

      // Verify the household exists in local state
      const household = households.find(h => h.id === householdId);
      if (!household) {
        const error = new Error('Household not found');
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
        tracker.fail(error);
        return false;
      }

      // Confirm current user has 'owner' role
      if (household.user_role !== 'owner') {
        const error = new Error('You do not have permission to delete this household. Only the household owner can delete it.');
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
        tracker.fail(error);
        return false;
      }

      // All validations passed, proceed with database call
      const { error } = await supabase
        .from('households')
        .delete()
        .eq('id', householdId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Household deleted successfully',
      });

      await fetchHouseholds();
      tracker.complete({ householdId });
      return true;
    } catch (error) {
      tracker.fail(error);
      handleApiError(error, 'Failed to delete household', toast);
      return false;
    }
  };

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
    createHousehold,
    inviteToHousehold,
    acceptInvitation,
    declineInvitation,
    leaveHousehold,
    removeMember,
    deleteHousehold,
  };
};