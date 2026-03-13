import { useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { hookLogger, trackOperation } from '@/utils/hookLogging';
import { handleApiError, validateEmail } from '@/utils/errorHandling';
import type { HouseholdWithMembers } from '@/hooks/useHouseholds';
import type { User } from '@supabase/supabase-js';

const HOOK_NAME = 'useHouseholdActions';

interface UseHouseholdActionsDeps {
  user: User | null;
  households: HouseholdWithMembers[];
  fetchHouseholds: () => Promise<void>;
  fetchInvitations: () => Promise<void>;
}

export const useHouseholdActions = ({
  user,
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

      toast.success('Household created successfully');

      await fetchHouseholds();
      tracker.complete({ name });
      return true;
    } catch (error) {
      tracker.fail(error);
      handleApiError(error, 'Failed to create household');
      return false;
    }
  }, [user, fetchHouseholds]);

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
        toast.error('Please enter a valid email address');
        tracker.fail(new Error('Invalid email address'));
        return false;
      }

      // Prevent self-invitation
      if (user && normalizedEmail === user.email?.toLowerCase()) {
        toast.error('You cannot invite yourself to a household');
        tracker.fail(new Error('Self-invitation attempted'));
        return false;
      }

      const { error } = await supabase.rpc('invite_to_household', {
        household_id: householdId,
        invited_email: normalizedEmail,
        invitation_role: role,
      });

      if (error) throw error;

      // Send invitation email (non-blocking — don't fail the invite if email fails)
      supabase.functions.invoke('send-invitation-email', {
        body: {
          invitedEmail: normalizedEmail,
          householdId,
          role,
        },
      }).then(({ error: emailError }) => {
        if (emailError) {
          console.warn('Failed to send invitation email:', emailError);
        }
      });

      toast.success('Invitation sent successfully');

      tracker.complete({ householdId, email: normalizedEmail, role });
      return true;
    } catch (error) {
      tracker.fail(error);
      handleApiError(error, 'Failed to send invitation');
      return false;
    }
  }, [user]);

  const acceptInvitation = useCallback(async (invitationId: string) => {
    const tracker = trackOperation(HOOK_NAME, 'acceptInvitation');

    try {
      const { error } = await supabase.rpc('accept_household_invitation', {
        invitation_id: invitationId,
      });

      if (error) throw error;

      toast.success('Invitation accepted successfully');

      // Use Promise.all to prevent race conditions
      await Promise.all([fetchHouseholds(), fetchInvitations()]);
      tracker.complete({ invitationId });
      return true;
    } catch (error) {
      tracker.fail(error);
      handleApiError(error, 'Failed to accept invitation');
      return false;
    }
  }, [fetchHouseholds, fetchInvitations]);

  const declineInvitation = useCallback(async (invitationId: string) => {
    const tracker = trackOperation(HOOK_NAME, 'declineInvitation');

    try {
      const { error } = await supabase.rpc('decline_household_invitation', {
        invitation_id: invitationId,
      });

      if (error) throw error;

      toast.success('Invitation declined');

      // Use Promise.all to prevent race conditions
      await Promise.all([fetchHouseholds(), fetchInvitations()]);
      tracker.complete({ invitationId });
      return true;
    } catch (error) {
      tracker.fail(error);
      handleApiError(error, 'Failed to decline invitation');
      return false;
    }
  }, [fetchHouseholds, fetchInvitations]);

  const leaveHousehold = useCallback(async (householdId: string) => {
    const tracker = trackOperation(HOOK_NAME, 'leaveHousehold');

    try {
      const { error } = await supabase.rpc('leave_household', {
        household_id: householdId,
      });

      if (error) throw error;

      toast.success('Left household successfully');

      // Use Promise.all to prevent race conditions
      await Promise.all([fetchHouseholds(), fetchInvitations()]);
      tracker.complete({ householdId });
      return true;
    } catch (error) {
      tracker.fail(error);
      handleApiError(error, 'Failed to leave household');
      return false;
    }
  }, [fetchHouseholds, fetchInvitations]);

  const removeMember = useCallback(async (householdId: string, memberId: string) => {
    const tracker = trackOperation(HOOK_NAME, 'removeMember');

    try {
      // Client-side permission validation
      if (!user) {
        const error = new Error('You must be logged in to remove members');
        toast.error(error.message);
        tracker.fail(error);
        return false;
      }

      // Verify the household exists in local state
      const household = households.find(h => h.id === householdId);
      if (!household) {
        const error = new Error('Household not found');
        toast.error(error.message);
        tracker.fail(error);
        return false;
      }

      // Confirm current user has 'owner' or 'admin' role
      if (household.user_role !== 'owner' && household.user_role !== 'admin') {
        const error = new Error('You do not have permission to remove members. Only household owners and admins can remove members.');
        toast.error(error.message);
        tracker.fail(error);
        return false;
      }

      // Find the member being removed
      const memberToRemove = household.household_members.find(m => m.id === memberId);
      if (!memberToRemove) {
        const error = new Error('Member not found in this household');
        toast.error(error.message);
        tracker.fail(error);
        return false;
      }

      // Prevent removing a member with 'owner' role
      if (memberToRemove.role === 'owner') {
        const error = new Error('Cannot remove the household owner. Transfer ownership first.');
        toast.error(error.message);
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

      toast.success('Member removed successfully');

      await fetchHouseholds();
      tracker.complete({ householdId, memberId });
      return true;
    } catch (error) {
      tracker.fail(error);
      handleApiError(error, 'Failed to remove member');
      return false;
    }
  }, [user, households, fetchHouseholds]);

  const deleteHousehold = useCallback(async (householdId: string) => {
    const tracker = trackOperation(HOOK_NAME, 'deleteHousehold');

    try {
      // Client-side permission validation
      if (!user) {
        const error = new Error('You must be logged in to delete households');
        toast.error(error.message);
        tracker.fail(error);
        return false;
      }

      // Verify the household exists in local state
      const household = households.find(h => h.id === householdId);
      if (!household) {
        const error = new Error('Household not found');
        toast.error(error.message);
        tracker.fail(error);
        return false;
      }

      // Confirm current user has 'owner' role
      if (household.user_role !== 'owner') {
        const error = new Error('You do not have permission to delete this household. Only the household owner can delete it.');
        toast.error(error.message);
        tracker.fail(error);
        return false;
      }

      // All validations passed, proceed with database call
      const { error } = await supabase
        .from('households')
        .delete()
        .eq('id', householdId);

      if (error) throw error;

      toast.success('Household deleted successfully');

      await fetchHouseholds();
      tracker.complete({ householdId });
      return true;
    } catch (error) {
      tracker.fail(error);
      handleApiError(error, 'Failed to delete household');
      return false;
    }
  }, [user, households, fetchHouseholds]);

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
