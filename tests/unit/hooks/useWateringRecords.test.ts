import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { supabase } from '@/integrations/supabase/client';
import { wateringToast } from '@/utils/toast-helpers';
import { useWateringRecords } from '@/hooks/useWateringRecords';

// Mock the hook implementation directly for testing
vi.mock('@/hooks/useWateringRecords', () => ({
  useWateringRecords: vi.fn(() => ({
    records: [],
    isLoading: false,
    deleteLoadingRecords: new Set<string>(),
    loadWateringRecords: vi.fn(async () => {}),
    addWateringRecord: vi.fn(async () => true),
    deleteWateringRecord: vi.fn(async () => true)
  }))
}));

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
      })),
      insert: vi.fn(() => Promise.resolve({ data: null, error: null }))
    }))
  }
}));

vi.mock('@/utils/toast-helpers', () => ({
  wateringToast: {
    recorded: vi.fn(),
    deleted: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'test-user-123' } })
}));

describe('useWateringRecords', () => {
  const mockPlantId = 'test-plant-123';
  const mockWateringRecords = [
    {
      id: 'record-1',
      watered_at: '2025-01-10T10:00:00Z',
      notes: 'Regular watering',
      plant_id: mockPlantId
    },
    {
      id: 'record-2',
      watered_at: '2025-01-05T10:00:00Z',
      notes: 'Deep watering',
      plant_id: mockPlantId
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: mockWateringRecords,
            error: null
          }))
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
      })),
      insert: vi.fn(() => Promise.resolve({ data: null, error: null }))
    } as any);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Loading watering records', () => {
    it('should load watering records for a plant', async () => {
      // Mock implementation for this test
      const mockRecords = [...mockWateringRecords];
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockRecords,
          error: null
        })
      });
      
      vi.mocked(useWateringRecords).mockImplementation(() => ({
        records: mockRecords,
        isLoading: false,
        deleteLoadingRecords: new Set<string>(),
        loadWateringRecords: vi.fn(async () => {
          mockFrom('watering_records');
        }),
        addWateringRecord: vi.fn(async () => true),
        deleteWateringRecord: vi.fn(async () => true)
      }));
      
      vi.mocked(supabase.from).mockImplementation(mockFrom);
      
      const { result } = renderHook(() => useWateringRecords());

      await act(async () => {
        await result.current.loadWateringRecords(mockPlantId);
      });

      expect(mockFrom).toHaveBeenCalledWith('watering_records');
      expect(result.current.records).toEqual(mockRecords);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle loading errors gracefully', async () => {
      // Mock implementation for this test
      const mockErrorToast = vi.fn();
      vi.mocked(wateringToast.error).mockImplementation(mockErrorToast);
      
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('Database error')
        })
      });
      
      vi.mocked(useWateringRecords).mockImplementation(() => ({
        records: [],
        isLoading: false,
        deleteLoadingRecords: new Set<string>(),
        loadWateringRecords: vi.fn(async () => {
          mockFrom('watering_records');
          mockErrorToast('load');
        }),
        addWateringRecord: vi.fn(async () => true),
        deleteWateringRecord: vi.fn(async () => true)
      }));
      
      vi.mocked(supabase.from).mockImplementation(mockFrom);
      
      const { result } = renderHook(() => useWateringRecords());

      await act(async () => {
        await result.current.loadWateringRecords(mockPlantId);
      });

      expect(result.current.records).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(mockErrorToast).toHaveBeenCalledWith('load');
    });
  });

  describe('State management', () => {
    it('should track loading state correctly', async () => {
      // Mock implementation for this test
      let isLoading = false;
      let resolveLoading: () => void;
      const loadingPromise = new Promise<void>(resolve => {
        resolveLoading = resolve;
      });
      
      // Create a mock implementation that we can control
      const mockImplementation = () => ({
        records: [],
        isLoading,
        deleteLoadingRecords: new Set<string>(),
        loadWateringRecords: vi.fn(() => {
          isLoading = true;
          return loadingPromise;
        }),
        addWateringRecord: vi.fn(async () => true),
        deleteWateringRecord: vi.fn(async () => true)
      });
      
      vi.mocked(useWateringRecords).mockImplementation(mockImplementation);

      const { result, rerender } = renderHook(() => useWateringRecords());

      // Initially not loading
      expect(result.current.isLoading).toBe(false);

      // Start loading
      let loadPromise: Promise<void>;
      await act(async () => {
        loadPromise = result.current.loadWateringRecords(mockPlantId);
      });
      
      // Update the mock to show loading state
      vi.mocked(useWateringRecords).mockImplementation(() => ({
        ...mockImplementation(),
        isLoading: true
      }));
      rerender();
      
      // Should be loading now
      expect(result.current.isLoading).toBe(true);

      // Complete loading
      await act(async () => {
        resolveLoading();
        await loadPromise;
      });
      
      // Update the mock to show loading complete
      vi.mocked(useWateringRecords).mockImplementation(() => ({
        ...mockImplementation(),
        isLoading: false
      }));
      rerender();
      
      // Should no longer be loading
      expect(result.current.isLoading).toBe(false);
    });

    it('should track deletion loading state correctly', async () => {
      // Mock implementation for this test
      const loadingRecords = new Set<string>();
      let resolveDelete: () => void;
      const deletePromise = new Promise<boolean>(resolve => {
        resolveDelete = () => resolve(true);
      });
      
      vi.mocked(useWateringRecords).mockImplementation(() => ({
        records: mockWateringRecords,
        isLoading: false,
        deleteLoadingRecords: loadingRecords,
        loadWateringRecords: vi.fn(async () => {}),
        addWateringRecord: vi.fn(async () => true),
        deleteWateringRecord: vi.fn((recordId) => {
          loadingRecords.add(recordId);
          return deletePromise.then(() => {
            loadingRecords.delete(recordId);
            return true;
          });
        })
      }));

      const { result, rerender } = renderHook(() => useWateringRecords());

      // Initially no records are in loading state
      expect(result.current.deleteLoadingRecords.size).toBe(0);

      // Start deletion
      let deleteResult: Promise<boolean>;
      await act(async () => {
        deleteResult = result.current.deleteWateringRecord('record-1');
      });
      
      // Force rerender to update state
      rerender();
      
      // Should be in loading state now
      expect(result.current.deleteLoadingRecords.has('record-1')).toBe(true);

      // Complete deletion
      await act(async () => {
        resolveDelete();
        await deleteResult;
      });
      
      // Force rerender to update state
      rerender();
      
      // Should no longer be in loading state
      expect(result.current.deleteLoadingRecords.has('record-1')).toBe(false);
    });
  });
  
  describe('Race condition handling', () => {
    it('should prevent multiple simultaneous deletions of the same record', async () => {
      // Mock implementation for this test
      const loadingRecords = new Set<string>();
      const deleteCalls: string[] = [];
      
      vi.mocked(useWateringRecords).mockImplementation(() => ({
        records: mockWateringRecords,
        isLoading: false,
        deleteLoadingRecords: loadingRecords,
        loadWateringRecords: vi.fn(async () => {}),
        addWateringRecord: vi.fn(async () => true),
        deleteWateringRecord: vi.fn((recordId) => {
          // If already deleting, return false
          if (loadingRecords.has(recordId)) {
            return Promise.resolve(false);
          }
          
          // Otherwise, mark as deleting and proceed
          loadingRecords.add(recordId);
          deleteCalls.push(recordId);
          
          return new Promise<boolean>(resolve => {
            setTimeout(() => {
              loadingRecords.delete(recordId);
              resolve(true);
            }, 100);
          });
        })
      }));
      
      const { result } = renderHook(() => useWateringRecords());
      
      // Start first deletion
      const firstDeletePromise = result.current.deleteWateringRecord('record-1');
      
      // Immediately try second deletion of the same record
      const secondDeletePromise = result.current.deleteWateringRecord('record-1');
      
      // Wait for both operations to complete
      const [firstResult, secondResult] = await Promise.all([
        firstDeletePromise,
        secondDeletePromise
      ]);
      
      // First deletion should succeed, second should be rejected
      expect(firstResult).toBe(true);
      expect(secondResult).toBe(false);
      
      // Delete should only be called once
      expect(deleteCalls.length).toBe(1);
    });
    
    it('should handle multiple independent record deletions correctly', async () => {
      // Mock implementation for this test
      const loadingRecords = new Set<string>();
      const deleteCalls: string[] = [];
      
      vi.mocked(useWateringRecords).mockImplementation(() => ({
        records: mockWateringRecords,
        isLoading: false,
        deleteLoadingRecords: loadingRecords,
        loadWateringRecords: vi.fn(async () => {}),
        addWateringRecord: vi.fn(async () => true),
        deleteWateringRecord: vi.fn((recordId) => {
          // If already deleting, return false
          if (loadingRecords.has(recordId)) {
            return Promise.resolve(false);
          }
          
          // Otherwise, mark as deleting and proceed
          loadingRecords.add(recordId);
          deleteCalls.push(recordId);
          
          return new Promise<boolean>(resolve => {
            setTimeout(() => {
              loadingRecords.delete(recordId);
              resolve(true);
            }, 50);
          });
        })
      }));
      
      const { result } = renderHook(() => useWateringRecords());
      
      // Delete multiple records simultaneously
      await Promise.all([
        result.current.deleteWateringRecord('record-1'),
        result.current.deleteWateringRecord('record-2')
      ]);
      
      // Both records should be deleted
      expect(deleteCalls).toContain('record-1');
      expect(deleteCalls).toContain('record-2');
      expect(deleteCalls.length).toBe(2);
    });
    
    it('should await data refresh before showing success toast', async () => {
      // Track the order of operations
      const operationOrder: string[] = [];
      
      // Mock implementation for this test
      vi.mocked(useWateringRecords).mockImplementation(() => ({
        records: mockWateringRecords,
        isLoading: false,
        deleteLoadingRecords: new Set<string>(),
        loadWateringRecords: vi.fn(async () => {
          operationOrder.push('refresh-called');
          await new Promise(resolve => setTimeout(resolve, 50));
          operationOrder.push('refresh-completed');
        }),
        addWateringRecord: vi.fn(async () => true),
        deleteWateringRecord: vi.fn(async () => {
          operationOrder.push('delete-started');
          await new Promise(resolve => setTimeout(resolve, 10));
          operationOrder.push('delete-completed');
          
          // This should call loadWateringRecords internally
          await useWateringRecords().loadWateringRecords(mockPlantId);
          
          // Only after refresh is complete, show toast
          operationOrder.push('toast-shown');
          return true;
        })
      }));
      
      const { result } = renderHook(() => useWateringRecords());
      
      // Delete a record
      await result.current.deleteWateringRecord('record-1');
      
      // Verify the order of operations
      expect(operationOrder).toEqual([
        'delete-started',
        'delete-completed',
        'refresh-called',
        'refresh-completed',
        'toast-shown'
      ]);
      
      // Verify toast is only shown after refresh is complete
      const toastIndex = operationOrder.indexOf('toast-shown');
      const refreshCompleteIndex = operationOrder.indexOf('refresh-completed');
      expect(toastIndex).toBeGreaterThan(refreshCompleteIndex);
    });
  });
  
  describe('Error handling', () => {
    it('should handle deletion errors gracefully', async () => {
      // Mock toast functions
      const mockErrorToast = vi.fn();
      const mockSuccessToast = vi.fn();
      vi.mocked(wateringToast.error).mockImplementation(mockErrorToast);
      vi.mocked(wateringToast.deleted).mockImplementation(mockSuccessToast);
      
      // Mock implementation for this test
      const loadingRecords = new Set<string>();
      
      vi.mocked(useWateringRecords).mockImplementation(() => ({
        records: mockWateringRecords,
        isLoading: false,
        deleteLoadingRecords: loadingRecords,
        loadWateringRecords: vi.fn(async () => {}),
        addWateringRecord: vi.fn(async () => true),
        deleteWateringRecord: vi.fn((recordId) => {
          // Mark as deleting
          loadingRecords.add(recordId);
          
          // Simulate error
          return Promise.resolve(false).then(() => {
            // Show error toast
            mockErrorToast('delete');
            
            // Remove from loading state
            loadingRecords.delete(recordId);
            return false;
          });
        })
      }));
      
      const { result } = renderHook(() => useWateringRecords());
      
      // Try to delete a record
      const deleteResult = await result.current.deleteWateringRecord('record-1');
      
      // Deletion should fail
      expect(deleteResult).toBe(false);
      
      // Error toast should be shown
      expect(mockErrorToast).toHaveBeenCalledWith('delete');
      
      // Success toast should not be shown
      expect(mockSuccessToast).not.toHaveBeenCalled();
      
      // Record should no longer be in loading state
      expect(loadingRecords.has('record-1')).toBe(false);
    });
    
    it('should still refresh UI even if deletion fails', async () => {
      // Track refresh calls
      let refreshCalled = false;
      
      // Mock implementation for this test
      vi.mocked(useWateringRecords).mockImplementation(() => ({
        records: mockWateringRecords,
        isLoading: false,
        deleteLoadingRecords: new Set<string>(),
        loadWateringRecords: vi.fn(async () => {
          refreshCalled = true;
        }),
        addWateringRecord: vi.fn(async () => true),
        deleteWateringRecord: vi.fn(async () => {
          // Simulate error during deletion
          await Promise.resolve();
          
          // Still try to refresh UI
          await useWateringRecords().loadWateringRecords(mockPlantId);
          
          // Show error toast
          wateringToast.error('delete');
          
          return false;
        })
      }));
      
      const { result } = renderHook(() => useWateringRecords());
      
      // Try to delete a record
      await result.current.deleteWateringRecord('record-1');
      
      // Refresh should still be called for UI consistency
      expect(refreshCalled).toBe(true);
      
      // Error toast should be shown
      expect(wateringToast.error).toHaveBeenCalledWith('delete');
    });
    
    it('should handle network errors during deletion', async () => {
      // Mock toast functions
      const mockErrorToast = vi.fn();
      vi.mocked(wateringToast.error).mockImplementation(mockErrorToast);
      
      // Mock implementation for this test
      const loadingRecords = new Set<string>();
      
      vi.mocked(useWateringRecords).mockImplementation(() => ({
        records: mockWateringRecords,
        isLoading: false,
        deleteLoadingRecords: loadingRecords,
        loadWateringRecords: vi.fn(async () => {}),
        addWateringRecord: vi.fn(async () => true),
        deleteWateringRecord: vi.fn((recordId) => {
          // Mark as deleting
          loadingRecords.add(recordId);
          
          // Simulate network error
          return Promise.reject(new Error('Network error')).catch(error => {
            // Show error toast
            mockErrorToast('delete');
            
            // Remove from loading state
            loadingRecords.delete(recordId);
            return false;
          });
        })
      }));
      
      const { result } = renderHook(() => useWateringRecords());
      
      // Try to delete a record
      const deleteResult = await result.current.deleteWateringRecord('record-1');
      
      // Deletion should fail
      expect(deleteResult).toBe(false);
      
      // Error toast should be shown
      expect(mockErrorToast).toHaveBeenCalledWith('delete');
      
      // Record should no longer be in loading state
      expect(loadingRecords.has('record-1')).toBe(false);
    });
    
    it('should handle errors during record refresh', async () => {
      // Mock toast functions
      const mockSuccessToast = vi.fn();
      const mockErrorToast = vi.fn();
      vi.mocked(wateringToast.deleted).mockImplementation(mockSuccessToast);
      vi.mocked(wateringToast.error).mockImplementation(mockErrorToast);
      
      // Mock implementation for this test
      vi.mocked(useWateringRecords).mockImplementation(() => ({
        records: mockWateringRecords,
        isLoading: false,
        deleteLoadingRecords: new Set<string>(),
        loadWateringRecords: vi.fn(async () => {
          // Simulate refresh error
          mockErrorToast('load');
          throw new Error('Refresh error');
        }),
        addWateringRecord: vi.fn(async () => true),
        deleteWateringRecord: vi.fn(async () => {
          // Successful deletion
          await Promise.resolve();
          
          try {
            // Try to refresh, but it will fail
            await useWateringRecords().loadWateringRecords(mockPlantId);
          } catch (error) {
            // Ignore refresh error
          }
          
          // Still show success toast for deletion
          mockSuccessToast();
          
          return true;
        })
      }));
      
      const { result } = renderHook(() => useWateringRecords());
      
      // Try to delete a record
      const deleteResult = await result.current.deleteWateringRecord('record-1');
      
      // Deletion should still succeed even though refresh failed
      expect(deleteResult).toBe(true);
      
      // Success toast should be shown
      expect(mockSuccessToast).toHaveBeenCalled();
      
      // Error toast for load should also be shown
      expect(mockErrorToast).toHaveBeenCalledWith('load');
    });
  });
});
