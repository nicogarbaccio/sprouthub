import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

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

export const useHouseholds = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [households, setHouseholds] = useState<HouseholdWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [invitations, setInvitations] = useState<HouseholdInvitation[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchHouseholds = async () => {
    if (!user) {
      setHouseholds([]);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setError(null);
      console.log('useHouseholds: Fetching household memberships for user:', user.id);

      // Use RPC function to get user's household memberships (bypasses RLS recursion)
      const { data: membershipData, error: membershipError } = await supabase
        .rpc('get_user_household_memberships', { target_user_id: user.id }) as {
          data: Array<{ household_id: string; role: string }> | null;
          error: any;
        };

      console.log('useHouseholds: Membership query result:', { membershipData, membershipError });

      if (membershipError) {
        const errorMsg = 'Could not load household memberships';
        console.warn(errorMsg, membershipError);
        setError(errorMsg);
        toast({
          title: 'Error',
          description: errorMsg,
          variant: 'destructive',
        });
        setHouseholds([]);
        setLoading(false);
        return;
      }

      if (!membershipData || !Array.isArray(membershipData) || membershipData.length === 0) {
        console.log('useHouseholds: No household memberships found');
        setHouseholds([]);
        setLoading(false);
        return;
      }

      // Get household IDs
      const householdIds = membershipData.map(m => m.household_id);
      console.log('useHouseholds: Found household IDs:', householdIds);

      // Then get household details
      const { data: householdData, error: householdError } = await supabase
        .from('households')
        .select('*')
        .in('id', householdIds);

      console.log('useHouseholds: Household details query result:', { householdData, householdError });

      if (householdError) {
        const errorMsg = 'Could not load household details';
        console.warn(errorMsg, householdError);
        setError(errorMsg);
        toast({
          title: 'Error',
          description: errorMsg,
          variant: 'destructive',
        });
        setHouseholds([]);
        setLoading(false);
        return;
      }

      // Get all household members for these households
      const { data: allMembersData, error: membersError } = await supabase
        .from('household_members')
        .select('*')
        .in('household_id', householdIds);

      console.log('useHouseholds: All members query result:', { allMembersData, membersError });

      if (membersError) {
        const errorMsg = 'Could not load household members';
        console.warn(errorMsg, membersError);
        setError(errorMsg);
        toast({
          title: 'Warning',
          description: errorMsg,
          variant: 'destructive',
        });
        // Continue without member details
      }

      // Combine household data with member information
      const householdsWithMembers = (householdData || []).map(household => {
        const userMembership = Array.isArray(membershipData) ? membershipData.find(m => m.household_id === household.id) : null;
        const householdMembers = (allMembersData || []).filter(m => m.household_id === household.id);
        
        return {
          ...household,
          household_members: householdMembers,
          member_count: householdMembers.length,
          user_role: userMembership?.role || 'member',
        };
      });

      console.log('useHouseholds: Final households with members:', householdsWithMembers);
      setHouseholds(householdsWithMembers);
    } catch (error) {
      console.error('Error fetching households:', error);
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMsg);
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async () => {
    if (!user) {
      setInvitations([]);
      return;
    }

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
        console.warn('Could not load invitations:', error);
        setInvitations([]);
        return;
      }
      setInvitations(data || []);
    } catch (error) {
      console.warn('Error fetching invitations:', error instanceof Error ? error.message : error);
      setInvitations([]);
    }
  };

  const createHousehold = async (name: string, description?: string) => {
    if (!user) return false;

    try {
      console.log('useHouseholds: Creating household with name:', name, 'description:', description);
      
      const { error } = await supabase.rpc('create_household', {
        household_name: name,
        household_description: description,
      });

      console.log('useHouseholds: Create household result:', { error });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Household created successfully',
      });

      console.log('useHouseholds: Refreshing households after creation');
      await fetchHouseholds();
      return true;
    } catch (error) {
      console.error('Error creating household:', error instanceof Error ? error.message : error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create household',
        variant: 'destructive',
      });
      return false;
    }
  };

  const inviteToHousehold = async (
    householdId: string,
    email: string,
    role: 'member' | 'admin' = 'member'
  ) => {
    try {
      // Trim and lowercase the email
      const normalizedEmail = email.trim().toLowerCase();

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail)) {
        toast({
          title: 'Error',
          description: 'Please enter a valid email address',
          variant: 'destructive',
        });
        return false;
      }

      // Prevent self-invitation
      if (user && normalizedEmail === user.email?.toLowerCase()) {
        toast({
          title: 'Error',
          description: 'You cannot invite yourself to a household',
          variant: 'destructive',
        });
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

      return true;
    } catch (error) {
      console.error('Error inviting to household:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send invitation',
        variant: 'destructive',
      });
      return false;
    }
  };

  const acceptInvitation = async (invitationId: string) => {
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
      return true;
    } catch (error) {
      console.error('Error accepting invitation:', error instanceof Error ? error.message : error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to accept invitation',
        variant: 'destructive',
      });
      return false;
    }
  };

  const declineInvitation = async (invitationId: string) => {
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
      return true;
    } catch (error) {
      console.error('Error declining invitation:', error instanceof Error ? error.message : error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to decline invitation',
        variant: 'destructive',
      });
      return false;
    }
  };

  const leaveHousehold = async (householdId: string) => {
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
      return true;
    } catch (error) {
      console.error('Error leaving household:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to leave household',
        variant: 'destructive',
      });
      return false;
    }
  };

  const removeMember = async (householdId: string, memberId: string) => {
    try {
      // Client-side permission validation
      if (!user) {
        toast({
          title: 'Error',
          description: 'You must be logged in to remove members',
          variant: 'destructive',
        });
        return false;
      }

      // Verify the household exists in local state
      const household = households.find(h => h.id === householdId);
      if (!household) {
        toast({
          title: 'Error',
          description: 'Household not found',
          variant: 'destructive',
        });
        return false;
      }

      // Confirm current user has 'owner' or 'admin' role
      if (household.user_role !== 'owner' && household.user_role !== 'admin') {
        toast({
          title: 'Error',
          description: 'You do not have permission to remove members. Only household owners and admins can remove members.',
          variant: 'destructive',
        });
        return false;
      }

      // Find the member being removed
      const memberToRemove = household.household_members.find(m => m.id === memberId);
      if (!memberToRemove) {
        toast({
          title: 'Error',
          description: 'Member not found in this household',
          variant: 'destructive',
        });
        return false;
      }

      // Prevent removing a member with 'owner' role
      if (memberToRemove.role === 'owner') {
        toast({
          title: 'Error',
          description: 'Cannot remove the household owner. Transfer ownership first.',
          variant: 'destructive',
        });
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

      fetchHouseholds();
      return true;
    } catch (error) {
      console.error('Error removing member:', error instanceof Error ? error.message : error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove member',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteHousehold = async (householdId: string) => {
    try {
      // Client-side permission validation
      if (!user) {
        toast({
          title: 'Error',
          description: 'You must be logged in to delete households',
          variant: 'destructive',
        });
        return false;
      }

      // Verify the household exists in local state
      const household = households.find(h => h.id === householdId);
      if (!household) {
        toast({
          title: 'Error',
          description: 'Household not found',
          variant: 'destructive',
        });
        return false;
      }

      // Confirm current user has 'owner' role
      if (household.user_role !== 'owner') {
        toast({
          title: 'Error',
          description: 'You do not have permission to delete this household. Only the household owner can delete it.',
          variant: 'destructive',
        });
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

      fetchHouseholds();
      return true;
    } catch (error) {
      console.error('Error deleting household:', error instanceof Error ? error.message : error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete household',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchHouseholds();
    fetchInvitations();
  }, [user]);

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