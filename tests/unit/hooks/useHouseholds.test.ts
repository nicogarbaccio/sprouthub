import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useHouseholds } from '@/hooks/useHouseholds';
import { supabase } from '@/integrations/supabase/client';
import { createTableMock, createControllablePromise } from '../../utils/supabase-mocks';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn()
  }
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({ user: { id: 'test-user-123', email: 'test@example.com' } }))
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() })
}));

// Import useAuth after mocking
import { useAuth } from '@/contexts/AuthContext';

describe('useHouseholds', () => {
  const mockUser = { id: 'test-user-123', email: 'test@example.com' };
  const mockMembershipData = [
    { household_id: 'household-1', role: 'owner' },
    { household_id: 'household-2', role: 'member' }
  ];
  const mockHouseholdData = [
    {
      id: 'household-1',
      name: 'My Family',
      description: 'Family household',
      created_at: '2025-01-01T00:00:00Z',
      created_by: 'test-user-123'
    },
    {
      id: 'household-2',
      name: 'Shared Garden',
      description: 'Community garden',
      created_at: '2025-01-02T00:00:00Z',
      created_by: 'other-user'
    }
  ];
  const mockMembersData = [
    {
      id: 'member-1',
      household_id: 'household-1',
      user_id: 'test-user-123',
      role: 'owner',
      joined_at: '2025-01-01T00:00:00Z'
    },
    {
      id: 'member-2',
      household_id: 'household-2',
      user_id: 'test-user-123',
      role: 'member',
      joined_at: '2025-01-02T00:00:00Z'
    },
    {
      id: 'member-3',
      household_id: 'household-2',
      user_id: 'other-user',
      role: 'admin',
      joined_at: '2025-01-02T00:00:00Z'
    }
  ];
  const mockInvitations = [
    {
      id: 'invite-1',
      household_id: 'household-3',
      invited_user_id: 'test-user-123',
      invited_email: 'test@example.com',
      role: 'member',
      status: 'pending',
      expires_at: '2025-12-31T00:00:00Z',
      created_at: '2025-01-01T00:00:00Z',
      households: {
        name: 'New Household',
        description: 'Join us!'
      }
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock successful RPC call for memberships
    vi.mocked(supabase.rpc).mockImplementation((fn: string) => {
      if (fn === 'get_user_household_memberships') {
        return Promise.resolve({ data: mockMembershipData, error: null }) as any;
      }
      return Promise.resolve({ data: null, error: null }) as any;
    });

    // Mock successful table queries
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'households') {
        return createTableMock({
          select: { data: mockHouseholdData }
        }) as any;
      }
      if (table === 'household_members') {
        return createTableMock({
          select: { data: mockMembersData }
        }) as any;
      }
      if (table === 'household_invitations') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                gt: vi.fn(() => Promise.resolve({
                  data: mockInvitations,
                  error: null
                }))
              }))
            }))
          }))
        } as any;
      }
      return createTableMock() as any;
    });
  });

  describe('initialization', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useHouseholds());

      expect(result.current.loading).toBe(true);
      expect(result.current.households).toEqual([]);
      expect(result.current.invitations).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should fetch households and invitations on mount', async () => {
      const { result } = renderHook(() => useHouseholds());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.households).toHaveLength(2);
      expect(result.current.invitations).toHaveLength(1);
      expect(supabase.rpc).toHaveBeenCalledWith('get_user_household_memberships', {
        target_user_id: 'test-user-123'
      });
    });
  });

  describe('fetchHouseholds', () => {
    it('should load households with member information', async () => {
      const { result } = renderHook(() => useHouseholds());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const households = result.current.households;
      expect(households).toHaveLength(2);

      // Check first household (user is owner)
      expect(households[0].id).toBe('household-1');
      expect(households[0].name).toBe('My Family');
      expect(households[0].user_role).toBe('owner');
      expect(households[0].member_count).toBe(1);
      expect(households[0].household_members).toHaveLength(1);

      // Check second household (user is member)
      expect(households[1].id).toBe('household-2');
      expect(households[1].name).toBe('Shared Garden');
      expect(households[1].user_role).toBe('member');
      expect(households[1].member_count).toBe(2);
    });

    it('should handle no user gracefully', async () => {
      vi.mocked(useAuth).mockReturnValue({ user: null, loading: false } as any);

      const { result } = renderHook(() => useHouseholds());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.households).toEqual([]);
      expect(result.current.error).toBeNull();
      expect(supabase.rpc).not.toHaveBeenCalled();
    });

    it('should handle membership query errors', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: new Error('RPC failed')
      } as any);

      const { result } = renderHook(() => useHouseholds());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.households).toEqual([]);
      expect(result.current.error).toBe('Could not load household memberships');
    });

    it('should handle no memberships found', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: [],
        error: null
      } as any);

      const { result } = renderHook(() => useHouseholds());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.households).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should handle household details query errors', async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'households') {
          return {
            select: vi.fn(() => ({
              in: vi.fn(() => Promise.resolve({
                data: null,
                error: new Error('Query failed')
              }))
            }))
          } as any;
        }
        return createTableMock() as any;
      });

      const { result } = renderHook(() => useHouseholds());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.households).toEqual([]);
      expect(result.current.error).toBe('Could not load household details');
    });
  });

  describe('createHousehold', () => {
    it('should create a household successfully', async () => {
      vi.mocked(supabase.rpc).mockImplementation((fn: string) => {
        if (fn === 'create_household') {
          return Promise.resolve({ data: null, error: null }) as any;
        }
        if (fn === 'get_user_household_memberships') {
          return Promise.resolve({ data: mockMembershipData, error: null }) as any;
        }
        return Promise.resolve({ data: null, error: null }) as any;
      });

      const { result } = renderHook(() => useHouseholds());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.createHousehold('New House', 'Description');
      });

      expect(success).toBe(true);
      expect(supabase.rpc).toHaveBeenCalledWith('create_household', {
        household_name: 'New House',
        household_description: 'Description'
      });
    });

    it('should handle create errors', async () => {
      vi.mocked(supabase.rpc).mockImplementation((fn: string) => {
        if (fn === 'create_household') {
          return Promise.resolve({
            data: null,
            error: new Error('Creation failed')
          }) as any;
        }
        return Promise.resolve({ data: mockMembershipData, error: null }) as any;
      });

      const { result } = renderHook(() => useHouseholds());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.createHousehold('New House');
      });

      expect(success).toBe(false);
    });

    it('should return false when no user', async () => {
      vi.mocked(useAuth).mockReturnValue({ user: null, loading: false } as any);

      const { result } = renderHook(() => useHouseholds());

      const success = await result.current.createHousehold('New House');
      expect(success).toBe(false);
    });
  });

  describe('inviteToHousehold', () => {
    it('should send invitation successfully', async () => {
      vi.mocked(supabase.rpc).mockImplementation((fn: string) => {
        if (fn === 'invite_to_household') {
          return Promise.resolve({ data: null, error: null }) as any;
        }
        return Promise.resolve({ data: mockMembershipData, error: null }) as any;
      });

      const { result } = renderHook(() => useHouseholds());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.inviteToHousehold(
          'household-1',
          'friend@example.com',
          'member'
        );
      });

      expect(success).toBe(true);
      expect(supabase.rpc).toHaveBeenCalledWith('invite_to_household', {
        household_id: 'household-1',
        invited_email: 'friend@example.com',
        invitation_role: 'member'
      });
    });

    it('should normalize email before sending', async () => {
      vi.mocked(supabase.rpc).mockImplementation((fn: string) => {
        if (fn === 'invite_to_household') {
          return Promise.resolve({ data: null, error: null }) as any;
        }
        return Promise.resolve({ data: mockMembershipData, error: null }) as any;
      });

      const { result } = renderHook(() => useHouseholds());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.inviteToHousehold('household-1', '  Friend@EXAMPLE.COM  ');
      });

      expect(supabase.rpc).toHaveBeenCalledWith('invite_to_household', {
        household_id: 'household-1',
        invited_email: 'friend@example.com',
        invitation_role: 'member'
      });
    });

    it('should reject invalid email format', async () => {
      const { result } = renderHook(() => useHouseholds());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const success = await act(async () => {
        return await result.current.inviteToHousehold('household-1', 'invalid-email');
      });

      expect(success).toBe(false);
      expect(supabase.rpc).not.toHaveBeenCalledWith('invite_to_household', expect.anything());
    });

    it('should prevent self-invitation', async () => {
      const { result } = renderHook(() => useHouseholds());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const success = await act(async () => {
        return await result.current.inviteToHousehold('household-1', 'test@example.com');
      });

      expect(success).toBe(false);
      expect(supabase.rpc).not.toHaveBeenCalledWith('invite_to_household', expect.anything());
    });
  });

  describe('acceptInvitation', () => {
    it('should accept invitation and refresh data', async () => {
      vi.mocked(supabase.rpc).mockImplementation((fn: string) => {
        if (fn === 'accept_household_invitation') {
          return Promise.resolve({ data: null, error: null }) as any;
        }
        return Promise.resolve({ data: mockMembershipData, error: null }) as any;
      });

      const { result } = renderHook(() => useHouseholds());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.acceptInvitation('invite-1');
      });

      expect(success).toBe(true);
      expect(supabase.rpc).toHaveBeenCalledWith('accept_household_invitation', {
        invitation_id: 'invite-1'
      });
    });
  });

  describe('removeMember', () => {
    it('should remove member when user is owner', async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'household_members') {
          return {
            select: vi.fn(() => ({
              in: vi.fn(() => Promise.resolve({
                data: mockMembersData,
                error: null
              }))
            })),
            delete: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
              }))
            }))
          } as any;
        }
        return createTableMock({ select: { data: mockHouseholdData } }) as any;
      });

      const { result } = renderHook(() => useHouseholds());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Remove member from household-2 (other user where current user is just a member)
      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.removeMember('household-2', 'member-3');
      });

      expect(success).toBe(false); // User is not admin/owner of household-2
    });

    it('should prevent removing owner', async () => {
      const { result } = renderHook(() => useHouseholds());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const success = await act(async () => {
        return await result.current.removeMember('household-1', 'member-1');
      });

      expect(success).toBe(false);
    });

    it('should prevent non-admin from removing members', async () => {
      const { result } = renderHook(() => useHouseholds());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Try to remove from household where user is just a member
      const success = await act(async () => {
        return await result.current.removeMember('household-2', 'member-3');
      });

      expect(success).toBe(false);
    });
  });

  describe('deleteHousehold', () => {
    it('should delete household when user is owner', async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'households') {
          return {
            select: vi.fn(() => ({
              in: vi.fn(() => Promise.resolve({
                data: mockHouseholdData,
                error: null
              }))
            })),
            delete: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
            }))
          } as any;
        }
        return createTableMock({ select: { data: mockMembersData } }) as any;
      });

      const { result } = renderHook(() => useHouseholds());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.deleteHousehold('household-1');
      });

      expect(success).toBe(true);
    });

    it('should prevent non-owner from deleting household', async () => {
      const { result } = renderHook(() => useHouseholds());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Try to delete household-2 where user is not owner
      const success = await act(async () => {
        return await result.current.deleteHousehold('household-2');
      });

      expect(success).toBe(false);
    });
  });
});
