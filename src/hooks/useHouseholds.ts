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

  const fetchHouseholds = async () => {
    if (!user) {
      setHouseholds([]);
      setLoading(false);
      return;
    }

    try {
      console.log('useHouseholds: Fetching household memberships for user:', user.id);
      
      // Use RPC function to get user's household memberships (bypasses RLS recursion)
      const { data: membershipData, error: membershipError } = await supabase
        .rpc('get_user_household_memberships', { target_user_id: user.id });

      console.log('useHouseholds: Membership query result:', { membershipData, membershipError });

      if (membershipError) {
        console.warn('Could not load household memberships:', membershipError);
        // Don't show error toast for this - just log it
        setHouseholds([]);
        setLoading(false);
        return;
      }

      if (!membershipData || membershipData.length === 0) {
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
        console.warn('Could not load household details:', householdError);
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
        console.warn('Could not load household members:', membersError);
        // Continue without member details
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

      console.log('useHouseholds: Final households with members:', householdsWithMembers);
      setHouseholds(householdsWithMembers);
    } catch (error) {
      console.error('Error fetching households:', error);
      // Don't show toast for household loading errors - just log them
      // This prevents user-facing errors during development
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
      console.warn('Error fetching invitations:', error);
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
      console.error('Error creating household:', error);
      toast({
        title: 'Error',
        description: 'Failed to create household',
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
      const { error } = await supabase.rpc('invite_to_household', {
        household_id: householdId,
        invited_email: email,
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
        description: error.message || 'Failed to send invitation',
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

      fetchHouseholds();
      fetchInvitations();
      return true;
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept invitation',
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

      fetchInvitations();
      return true;
    } catch (error) {
      console.error('Error declining invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to decline invitation',
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

      fetchHouseholds();
      return true;
    } catch (error) {
      console.error('Error leaving household:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to leave household',
        variant: 'destructive',
      });
      return false;
    }
  };

  const removeMember = async (householdId: string, memberId: string) => {
    try {
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
      console.error('Error removing member:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove member',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteHousehold = async (householdId: string) => {
    try {
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
      console.error('Error deleting household:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete household',
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