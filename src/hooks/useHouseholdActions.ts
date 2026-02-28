import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { hookLogger, trackOperation } from '@/utils/hookLogging';
import { handleApiError, validateEmail } from '@/utils/errorHandling';
import type { HouseholdWithMembers } from '@/hooks/useHouseholds';
import type { User } from '@supabase/supabase-js';

const HOOK_NAME = 'useHouseholdActions';

interface UseHouseholdActionsDeps {
  user: User | null;
  toast: (props: { title: string; description: string; variant?: 'destructive' | 'default' }) => void;
  households: HouseholdWithMembers[];
  fetchHouseholds: () => Promise<void>;
  fetchInvitations: () => Promise<void>;
}

export const useHouseholdActions = ({
  user,
  toast,
  households,
  fetchHouseholds,
  fetchInvitations,
}: UseHouseholdActionsDeps) => {
  const createHousehold = useCallback(async (name: string, description?: string) => {
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
  }, [user, toast, fetchHouseholds]);

  const inviteToHousehold = useCallback(async (
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
  }, [user, toast]);

  const acceptInvitation = useCallback(async (invitationId: string) => {
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
  }, [toast, fetchHouseholds, fetchInvitations]);

  const declineInvitation = useCallback(async (invitationId: string) => {
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
  }, [toast, fetchHouseholds, fetchInvitations]);

  const leaveHousehold = useCallback(async (householdId: string) => {
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
  }, [toast, fetchHouseholds, fetchInvitations]);

  const removeMember = useCallback(async (householdId: string, memberId: string) => {
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
  }, [user, toast, households, fetchHouseholds]);

  const deleteHousehold = useCallback(async (householdId: string) => {
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
  }, [user, toast, households, fetchHouseholds]);

  return {
    createHousehold,
    inviteToHousehold,
    acceptInvitation,
    declineInvitation,
    leaveHousehold,
    removeMember,
    deleteHousehold,
  };
};
