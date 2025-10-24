import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { createTableMock } from '../../utils/supabase-mocks';

// Mock dependencies
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn()
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'test-user-123', email: 'test@example.com' },
    loading: false,
    signOut: vi.fn()
  }))
}));

vi.mock('@/contexts/ProfileDataContext', () => ({
  useProfileData: () => ({
    updateProfileData: vi.fn()
  })
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() })
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      updateUser: vi.fn()
    }
  }
}));

// Mock window.confirm
global.window.confirm = vi.fn(() => true);

// Import mocked modules
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

describe('useProfile', () => {
  const mockUser = { id: 'test-user-123', email: 'test@example.com' };
  const mockProfileData = {
    id: 'test-user-123',
    first_name: 'John',
    last_name: 'Doe',
    username: 'johndoe',
    email: 'test@example.com',
    avatar_url: 'https://example.com/avatar.jpg',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default: User is authenticated and not loading
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      loading: false,
      signOut: vi.fn()
    } as any);

    // Default: Profile fetch succeeds
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: mockProfileData,
                error: null
              })),
              neq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({
                  data: null,
                  error: { code: 'PGRST116' }
                }))
              }))
            })),
            neq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: null,
                error: { code: 'PGRST116' }
              }))
            }))
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
          })),
          delete: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
          }))
        } as any;
      }
      if (table === 'user_plants') {
        return createTableMock({
          delete: { error: null }
        }) as any;
      }
      return createTableMock() as any;
    });

    // Default: Password update succeeds
    vi.mocked(supabase.auth.updateUser).mockResolvedValue({
      data: { user: null },
      error: null
    } as any);
  });

  describe('initialization', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useProfile());

      expect(result.current.isLoadingProfile).toBe(true);
      expect(result.current.profileData).toEqual({
        first_name: '',
        last_name: '',
        username: '',
        email: '',
        avatar_url: ''
      });
    });

    it('should fetch profile data on mount', async () => {
      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.isLoadingProfile).toBe(false);
      });

      expect(result.current.profileData).toEqual({
        first_name: 'John',
        last_name: 'Doe',
        username: 'johndoe',
        email: 'test@example.com',
        avatar_url: 'https://example.com/avatar.jpg'
      });
    });

    it('should redirect when user is not authenticated', () => {
      const mockNavigate = vi.fn();
      vi.mocked(useNavigate).mockReturnValue(mockNavigate);
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        loading: false,
        signOut: vi.fn()
      } as any);

      renderHook(() => useProfile());

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('should wait for auth to finish loading before redirecting', () => {
      const mockNavigate = vi.fn();
      vi.mocked(useNavigate).mockReturnValue(mockNavigate);
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        loading: true,
        signOut: vi.fn()
      } as any);

      renderHook(() => useProfile());

      // Should not navigate while auth is loading
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should handle profile fetch errors', async () => {
      vi.mocked(supabase.from).mockImplementation(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: new Error('Fetch failed')
            }))
          }))
        }))
      } as any));

      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.isLoadingProfile).toBe(false);
      });

      // Profile data should remain at default values
      expect(result.current.profileData.username).toBe('');
    });
  });

  describe('handleUpdateProfile', () => {
    it('should update profile successfully', async () => {
      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.isLoadingProfile).toBe(false);
      });

      // Update profile data
      act(() => {
        result.current.setProfileData({
          ...result.current.profileData,
          first_name: 'Jane',
          last_name: 'Smith'
        });
      });

      // Submit update
      await act(async () => {
        await result.current.handleUpdateProfile();
      });

      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(result.current.isLoading).toBe(false);
    });

    it('should check for username uniqueness', async () => {
      // Mock existing username
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn((cols: string) => {
              if (cols === '*') {
                return {
                  eq: vi.fn(() => ({
                    single: vi.fn(() => Promise.resolve({
                      data: mockProfileData,
                      error: null
                    }))
                  }))
                };
              }
              // Username check query
              return {
                eq: vi.fn(() => ({
                  neq: vi.fn(() => ({
                    single: vi.fn(() => Promise.resolve({
                      data: { username: 'existinguser' },
                      error: null
                    }))
                  }))
                }))
              };
            }),
            update: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
            }))
          } as any;
        }
        return createTableMock() as any;
      });

      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.isLoadingProfile).toBe(false);
      });

      // Try to update with existing username
      act(() => {
        result.current.setProfileData({
          ...result.current.profileData,
          username: 'existinguser'
        });
      });

      await act(async () => {
        await result.current.handleUpdateProfile();
      });

      // Update should be blocked
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle update errors', async () => {
      vi.mocked(supabase.from).mockImplementation(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: mockProfileData,
              error: null
            })),
            neq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: null,
                error: { code: 'PGRST116' }
              }))
            }))
          }))
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({
            data: null,
            error: new Error('Update failed')
          }))
        }))
      } as any));

      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.isLoadingProfile).toBe(false);
      });

      await act(async () => {
        await result.current.handleUpdateProfile();
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('handleChangePassword', () => {
    it('should change password successfully', async () => {
      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.isLoadingProfile).toBe(false);
      });

      // Set valid password data
      act(() => {
        result.current.setPasswordData({
          currentPassword: 'oldpass123',
          newPassword: 'newpass123',
          confirmPassword: 'newpass123'
        });
      });

      await act(async () => {
        await result.current.handleChangePassword();
      });

      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'newpass123'
      });

      // Password fields should be cleared
      expect(result.current.passwordData).toEqual({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    });

    it('should reject mismatched passwords', async () => {
      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.isLoadingProfile).toBe(false);
      });

      act(() => {
        result.current.setPasswordData({
          currentPassword: 'oldpass123',
          newPassword: 'newpass123',
          confirmPassword: 'differentpass'
        });
      });

      await act(async () => {
        await result.current.handleChangePassword();
      });

      // Should not call update
      expect(supabase.auth.updateUser).not.toHaveBeenCalled();
    });

    it('should reject short passwords', async () => {
      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.isLoadingProfile).toBe(false);
      });

      act(() => {
        result.current.setPasswordData({
          currentPassword: 'old',
          newPassword: 'short',
          confirmPassword: 'short'
        });
      });

      await act(async () => {
        await result.current.handleChangePassword();
      });

      expect(supabase.auth.updateUser).not.toHaveBeenCalled();
    });

    it('should handle password update errors', async () => {
      vi.mocked(supabase.auth.updateUser).mockResolvedValue({
        data: { user: null },
        error: new Error('Update failed')
      } as any);

      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.isLoadingProfile).toBe(false);
      });

      act(() => {
        result.current.setPasswordData({
          currentPassword: 'oldpass123',
          newPassword: 'newpass123',
          confirmPassword: 'newpass123'
        });
      });

      await act(async () => {
        await result.current.handleChangePassword();
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('handleDeleteAccount', () => {
    it('should delete account successfully', async () => {
      const mockSignOut = vi.fn();
      const mockNavigate = vi.fn();

      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
        loading: false,
        signOut: mockSignOut
      } as any);

      vi.mocked(useNavigate).mockReturnValue(mockNavigate);

      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.isLoadingProfile).toBe(false);
      });

      await act(async () => {
        await result.current.handleDeleteAccount();
      });

      expect(supabase.from).toHaveBeenCalledWith('user_plants');
      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(mockSignOut).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('should not delete if user cancels confirmation', async () => {
      vi.mocked(global.window.confirm).mockReturnValue(false);

      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.isLoadingProfile).toBe(false);
      });

      await act(async () => {
        await result.current.handleDeleteAccount();
      });

      // Should not call delete
      expect(supabase.from).not.toHaveBeenCalledWith('user_plants');
    });
  });

  describe('helper functions', () => {
    it('hasProfileChanges should detect changes', async () => {
      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.isLoadingProfile).toBe(false);
      });

      // No changes initially
      expect(result.current.hasProfileChanges()).toBe(false);

      // Make a change
      act(() => {
        result.current.setProfileData({
          ...result.current.profileData,
          first_name: 'Changed'
        });
      });

      expect(result.current.hasProfileChanges()).toBe(true);
    });

    it('hasValidPasswordChanges should validate password data', async () => {
      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.isLoadingProfile).toBe(false);
      });

      // Invalid initially
      expect(result.current.hasValidPasswordChanges()).toBe(false);

      // Set valid password
      act(() => {
        result.current.setPasswordData({
          currentPassword: 'old123',
          newPassword: 'newpass123',
          confirmPassword: 'newpass123'
        });
      });

      expect(result.current.hasValidPasswordChanges()).toBe(true);

      // Set mismatched passwords
      act(() => {
        result.current.setPasswordData({
          currentPassword: 'old123',
          newPassword: 'newpass123',
          confirmPassword: 'different123'
        });
      });

      expect(result.current.hasValidPasswordChanges()).toBe(false);

      // Set too short password
      act(() => {
        result.current.setPasswordData({
          currentPassword: 'old',
          newPassword: 'short',
          confirmPassword: 'short'
        });
      });

      expect(result.current.hasValidPasswordChanges()).toBe(false);
    });
  });
});
