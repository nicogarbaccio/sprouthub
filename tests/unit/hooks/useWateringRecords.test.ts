import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { supabase } from '@/integrations/supabase/client';
import { wateringToast, utilityToast } from '@/utils/toast-helpers';
import { createTableMock, createControllablePromise, createTableRouter } from '../../utils/supabase-mocks';

// Import the actual hook - DO NOT MOCK IT
// We want to test the real implementation
import { useWateringRecords } from '@/hooks/useWateringRecords';

// Mock dependencies only
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
  },
  utilityToast: {
    info: vi.fn(),
    deleted: vi.fn()
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
    },
    {
      id: 'record-3',
      watered_at: '2025-01-03T10:00:00Z',
      notes: 'POSTPONEMENT: Rain expected',
      plant_id: mockPlantId
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementation - successful load using utility
    vi.mocked(supabase.from).mockReturnValue(
      createTableMock({
        select: { data: mockWateringRecords },
        delete: { error: null },
        insert: { error: null }
      }) as any
    );
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('initialization', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useWateringRecords());

      expect(result.current.records).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.deleteLoadingRecords.size).toBe(0);
    });
  });

  describe('loadWateringRecords', () => {
    it('should load watering records for a plant', async () => {
      const { result } = renderHook(() => useWateringRecords());

      expect(result.current.records).toEqual([]);

      await act(async () => {
        await result.current.loadWateringRecords(mockPlantId);
      });

      expect(supabase.from).toHaveBeenCalledWith('watering_records');
      expect(result.current.records).toHaveLength(3);
      expect(result.current.records[0].id).toBe('record-1');
      expect(result.current.isLoading).toBe(false);
    });

    it('should identify postponement records', async () => {
      const { result } = renderHook(() => useWateringRecords());

      await act(async () => {
        await result.current.loadWateringRecords(mockPlantId);
      });

      // Regular record should not be marked as postponement
      expect(result.current.records[0].is_postponement).toBe(false);
      expect(result.current.records[1].is_postponement).toBe(false);

      // Record with POSTPONEMENT: in notes should be marked
      expect(result.current.records[2].is_postponement).toBe(true);
    });

    it('should handle loading errors gracefully', async () => {
      // Use utility to create error mock
      vi.mocked(supabase.from).mockReturnValue(
        createTableMock({
          select: { data: null, error: new Error('Database error') }
        }) as any
      );

      const { result } = renderHook(() => useWateringRecords());

      await act(async () => {
        await result.current.loadWateringRecords(mockPlantId);
      });

      expect(result.current.records).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(wateringToast.error).toHaveBeenCalledWith('load');
    });

    it('should prevent concurrent loads', async () => {
      // Use utility to create controllable promise
      const { promise, resolve: resolveFirstLoad } = createControllablePromise();

      vi.mocked(supabase.from).mockReturnValue(
        createTableMock({
          select: { data: mockWateringRecords }
        }) as any
      );

      // Override select to use controllable promise
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => promise)
          }))
        })),
        delete: vi.fn(),
        insert: vi.fn()
      } as any);

      const { result } = renderHook(() => useWateringRecords());

      // Start first load
      const firstLoad = act(async () => {
        await result.current.loadWateringRecords(mockPlantId);
      });

      // Try to start second load while first is in progress
      await act(async () => {
        await result.current.loadWateringRecords(mockPlantId);
      });

      // Should only call Supabase once (second call was prevented)
      expect(supabase.from).toHaveBeenCalledTimes(1);

      // Resolve the first load
      act(() => {
        resolveFirstLoad!({ data: mockWateringRecords, error: null });
      });

      await firstLoad;
    });
  });

  describe('addWateringRecord', () => {
    it('should add a new watering record', async () => {
      const { result } = renderHook(() => useWateringRecords());
      const testDate = new Date('2025-01-15T10:00:00Z');
      const testNotes = 'Test watering';

      const success = await act(async () => {
        return await result.current.addWateringRecord(mockPlantId, testDate, testNotes);
      });

      expect(success).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('watering_records');
      expect(wateringToast.recorded).toHaveBeenCalledWith('Plant');
    });

    it('should refresh records after adding', async () => {
      const { result } = renderHook(() => useWateringRecords());
      const testDate = new Date('2025-01-15T10:00:00Z');

      await act(async () => {
        await result.current.addWateringRecord(mockPlantId, testDate);
      });

      // Should call from twice: once for insert, once for load
      expect(supabase.from).toHaveBeenCalledWith('watering_records');
      expect(result.current.records).toHaveLength(3);
    });

    it('should handle add errors gracefully', async () => {
      // Use utility for error mock
      vi.mocked(supabase.from).mockReturnValue(
        createTableMock({
          select: { data: [] },
          insert: { error: new Error('Insert failed') }
        }) as any
      );

      const { result } = renderHook(() => useWateringRecords());
      const testDate = new Date('2025-01-15T10:00:00Z');

      const success = await act(async () => {
        return await result.current.addWateringRecord(mockPlantId, testDate);
      });

      expect(success).toBe(false);
      expect(wateringToast.error).toHaveBeenCalledWith('add');
    });
  });

  describe('deleteWateringRecord', () => {
    it('should delete a watering record', async () => {
      const { result } = renderHook(() => useWateringRecords());

      // Load records first
      await act(async () => {
        await result.current.loadWateringRecords(mockPlantId);
      });

      expect(result.current.records).toHaveLength(3);

      // Delete a record
      const success = await act(async () => {
        return await result.current.deleteWateringRecord('record-1');
      });

      expect(success).toBe(true);
      expect(wateringToast.deleted).toHaveBeenCalled();

      // Optimistic update should remove the record
      expect(result.current.records).toHaveLength(2);
      expect(result.current.records.find(r => r.id === 'record-1')).toBeUndefined();
    });

    it('should prevent multiple simultaneous deletions of the same record', async () => {
      // Use utility for controllable promise
      const { promise: deletionPromise, resolve: resolveDeletion } = createControllablePromise();

      // Use table router to handle different tables
      vi.mocked(supabase.from).mockImplementation(
        createTableRouter({
          'watering_records': {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve({
                  data: mockWateringRecords,
                  error: null
                }))
              }))
            })),
            delete: vi.fn(() => ({
              eq: vi.fn(async () => {
                await deletionPromise;
                return Promise.resolve({ data: null, error: null });
              })
            })),
            insert: vi.fn()
          }
        }) as any
      );

      const { result } = renderHook(() => useWateringRecords());

      // Load records first
      await act(async () => {
        await result.current.loadWateringRecords(mockPlantId);
      });

      // Start first deletion (doesn't await)
      const firstDeletion = act(async () => {
        return await result.current.deleteWateringRecord('record-1');
      });

      // Try second deletion of same record (should be prevented)
      const secondDeletion = await act(async () => {
        return await result.current.deleteWateringRecord('record-1');
      });

      // Second deletion should return false (was prevented)
      expect(secondDeletion).toBe(false);

      // Resolve the first deletion
      act(() => {
        resolveDeletion!({ data: null, error: null });
      });

      await firstDeletion;
    });

    it('should handle deletion errors and restore records', async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({
                data: mockWateringRecords,
                error: null
              }))
            }))
          })),
          delete: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({
              data: null,
              error: new Error('Delete failed')
            }))
          })),
          insert: vi.fn()
        } as any;
      });

      const { result } = renderHook(() => useWateringRecords());

      // Load records first
      await act(async () => {
        await result.current.loadWateringRecords(mockPlantId);
      });

      const initialRecordCount = result.current.records.length;

      // Try to delete (will fail)
      const success = await act(async () => {
        return await result.current.deleteWateringRecord('record-1');
      });

      expect(success).toBe(false);
      expect(wateringToast.error).toHaveBeenCalledWith('delete');

      // Records should be restored from server
      await waitFor(() => {
        expect(result.current.records).toHaveLength(initialRecordCount);
      });
    });

    it('should use different toast for postponement deletions', async () => {
      const mockOnPlantDataChange = vi.fn();
      const { result } = renderHook(() => useWateringRecords(mockOnPlantDataChange));

      // Load records first
      await act(async () => {
        await result.current.loadWateringRecords(mockPlantId);
      });

      // Delete a postponement record
      await act(async () => {
        await result.current.deleteWateringRecord('record-3');
      });

      expect(utilityToast.deleted).toHaveBeenCalledWith('Postponement');
      expect(mockOnPlantDataChange).toHaveBeenCalled();
    });

    it('should call onPlantDataChange for regular watering deletions', async () => {
      const mockOnPlantDataChange = vi.fn();
      const { result } = renderHook(() => useWateringRecords(mockOnPlantDataChange));

      // Load records first
      await act(async () => {
        await result.current.loadWateringRecords(mockPlantId);
      });

      // Delete a regular watering record (not a postponement)
      await act(async () => {
        await result.current.deleteWateringRecord('record-1');
      });

      expect(wateringToast.deleted).toHaveBeenCalled();
      expect(mockOnPlantDataChange).toHaveBeenCalled();
    });

    it('should call onPlantDataChange for postponement deletions', async () => {
      const mockOnPlantDataChange = vi.fn();
      const { result } = renderHook(() => useWateringRecords(mockOnPlantDataChange));

      // Load records first
      await act(async () => {
        await result.current.loadWateringRecords(mockPlantId);
      });

      // Delete a postponement record
      await act(async () => {
        await result.current.deleteWateringRecord('record-3');
      });

      expect(utilityToast.deleted).toHaveBeenCalledWith('Postponement');
      expect(mockOnPlantDataChange).toHaveBeenCalled();
    });
  });

  describe('addPostponement', () => {
    it('should add a postponement record', async () => {
      const { result } = renderHook(() => useWateringRecords());
      const testDate = new Date('2025-01-15T10:00:00Z');
      const testNotes = 'Rain expected';

      const success = await act(async () => {
        return await result.current.addPostponement(mockPlantId, testDate, testNotes);
      });

      expect(success).toBe(true);
      expect(utilityToast.info).toHaveBeenCalledWith('Watering postponed', 'Watering postponed successfully');
    });

    it('should add POSTPONEMENT prefix to notes', async () => {
      const insertMock = vi.fn(() => Promise.resolve({ data: null, error: null }));

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        })),
        insert: insertMock,
        delete: vi.fn()
      } as any);

      const { result } = renderHook(() => useWateringRecords());
      const testDate = new Date('2025-01-15T10:00:00Z');
      const testNotes = 'Rain expected';

      await act(async () => {
        await result.current.addPostponement(mockPlantId, testDate, testNotes);
      });

      expect(insertMock).toHaveBeenCalledWith({
        plant_id: mockPlantId,
        watered_at: testDate.toISOString(),
        notes: 'POSTPONEMENT: Rain expected',
        performed_by: 'test-user-123'
      });
    });

    it('should handle postponement errors gracefully', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        })),
        insert: vi.fn(() => Promise.resolve({
          data: null,
          error: new Error('Insert failed')
        })),
        delete: vi.fn()
      } as any);

      const { result } = renderHook(() => useWateringRecords());
      const testDate = new Date('2025-01-15T10:00:00Z');

      const success = await act(async () => {
        return await result.current.addPostponement(mockPlantId, testDate);
      });

      expect(success).toBe(false);
      expect(wateringToast.error).toHaveBeenCalledWith('add postponement');
    });
  });

  describe('loading states', () => {
    it('should track delete loading state per record', async () => {
      let resolveDeletion: () => void;
      const deletionPromise = new Promise<void>(resolve => {
        resolveDeletion = resolve;
      });

      vi.mocked(supabase.from).mockImplementation(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({
              data: mockWateringRecords,
              error: null
            }))
          }))
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(async () => {
            await deletionPromise;
            return { data: null, error: null };
          })
        })),
        insert: vi.fn()
      } as any));

      const { result } = renderHook(() => useWateringRecords());

      // Load records first
      await act(async () => {
        await result.current.loadWateringRecords(mockPlantId);
      });

      // Start deletion (doesn't complete)
      act(() => {
        result.current.deleteWateringRecord('record-1');
      });

      // Should show as loading
      await waitFor(() => {
        expect(result.current.deleteLoadingRecords.has('record-1')).toBe(true);
      });

      // Complete deletion
      await act(async () => {
        resolveDeletion!();
        await deletionPromise;
      });

      // Should no longer be loading
      await waitFor(() => {
        expect(result.current.deleteLoadingRecords.has('record-1')).toBe(false);
      });
    });
  });
});
