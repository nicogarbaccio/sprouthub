/**
 * Unit tests for useDismissedInsights hook
 * Tests the dismissed insights persistence and filtering logic
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDismissedInsights } from '../useDismissedInsights';
import { supabase } from '@/integrations/supabase/client';
import type { PatternInsight } from '@/types/wateringPatternTypes';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('useDismissedInsights', () => {
  const mockPlantId = 'plant-123';
  const mockInsights: PatternInsight[] = [
    {
      type: 'schedule_adjustment',
      title: 'Schedule Adjustment Suggested',
      description: 'Consider adjusting your watering schedule',
      severity: 'medium',
      actionable: true,
      suggestion: {
        currentSchedule: 7,
        suggestedSchedule: 9,
        adjustmentType: 'increase',
        confidence: 'high',
        reasoning: ['You tend to water 2 days late'],
        potentialBenefits: ['Better plant health']
      }
    },
    {
      type: 'overwatering_risk',
      title: 'Overwatering Risk',
      description: 'You may be watering too frequently',
      severity: 'high',
      actionable: true,
    },
    {
      type: 'consistency_improvement',
      title: 'Stay Consistent',
      description: 'Try to water on schedule',
      severity: 'low',
      actionable: false,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial load', () => {
    it('should load dismissed insights from database on mount', async () => {
      const mockData = [
        { insight_type: 'schedule_adjustment' },
        { insight_type: 'overwatering_risk' },
      ];

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ data: mockData, error: null });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      const { result } = renderHook(() => useDismissedInsights(mockPlantId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(supabase.from).toHaveBeenCalledWith('dismissed_pattern_insights');
      expect(mockSelect).toHaveBeenCalledWith('insight_type');
      expect(mockEq).toHaveBeenCalledWith('user_plant_id', mockPlantId);
      expect(result.current.dismissedTypes.size).toBe(2);
      expect(result.current.dismissedTypes.has('schedule_adjustment')).toBe(true);
      expect(result.current.dismissedTypes.has('overwatering_risk')).toBe(true);
    });

    it('should handle empty plant ID', async () => {
      const { result } = renderHook(() => useDismissedInsights(undefined));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.dismissedTypes.size).toBe(0);
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      const mockError = new Error('Database connection failed');
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ data: null, error: mockError });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      const { result } = renderHook(() => useDismissedInsights(mockPlantId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.dismissedTypes.size).toBe(0);
    });
  });

  describe('dismissInsight', () => {
    it('should dismiss an insight and update local state', async () => {
      // Setup initial load
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ data: [], error: null });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      const { result } = renderHook(() => useDismissedInsights(mockPlantId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Setup insert mock
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      // Dismiss an insight
      const success = await result.current.dismissInsight(mockInsights[0]);

      expect(success).toBe(true);
      expect(mockInsert).toHaveBeenCalledWith({
        user_plant_id: mockPlantId,
        insight_type: 'schedule_adjustment',
      });

      await waitFor(() => {
        expect(result.current.dismissedTypes.has('schedule_adjustment')).toBe(true);
      });
    });

    it('should handle duplicate dismissals gracefully', async () => {
      // Setup initial load
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ data: [], error: null });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      const { result } = renderHook(() => useDismissedInsights(mockPlantId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Setup insert mock with duplicate key error
      const duplicateError = { code: '23505', message: 'duplicate key' };
      const mockInsert = vi.fn().mockResolvedValue({ error: duplicateError });
      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      // Dismiss an insight that's already dismissed
      const success = await result.current.dismissInsight(mockInsights[0]);

      expect(success).toBe(true);
      await waitFor(() => {
        expect(result.current.dismissedTypes.has('schedule_adjustment')).toBe(true);
      });
    });

    it('should return false when plantId is undefined', async () => {
      const { result } = renderHook(() => useDismissedInsights(undefined));

      const success = await result.current.dismissInsight(mockInsights[0]);

      expect(success).toBe(false);
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });

  describe('filterDismissed', () => {
    it('should filter out dismissed insights', async () => {
      const mockData = [
        { insight_type: 'schedule_adjustment' },
        { insight_type: 'overwatering_risk' },
      ];

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ data: mockData, error: null });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      const { result } = renderHook(() => useDismissedInsights(mockPlantId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const filtered = result.current.filterDismissed(mockInsights);

      // Should only return the insight that's not dismissed
      expect(filtered).toHaveLength(1);
      expect(filtered[0].type).toBe('consistency_improvement');
    });

    it('should return all insights when none are dismissed', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ data: [], error: null });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      const { result } = renderHook(() => useDismissedInsights(mockPlantId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const filtered = result.current.filterDismissed(mockInsights);

      expect(filtered).toHaveLength(3);
      expect(filtered).toEqual(mockInsights);
    });

    it('should return empty array when all insights are dismissed', async () => {
      const mockData = mockInsights.map(insight => ({
        insight_type: insight.type,
      }));

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ data: mockData, error: null });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      const { result } = renderHook(() => useDismissedInsights(mockPlantId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const filtered = result.current.filterDismissed(mockInsights);

      expect(filtered).toHaveLength(0);
    });
  });

  describe('isDismissed', () => {
    it('should correctly identify dismissed insights', async () => {
      const mockData = [
        { insight_type: 'schedule_adjustment' },
      ];

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ data: mockData, error: null });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      const { result } = renderHook(() => useDismissedInsights(mockPlantId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isDismissed('schedule_adjustment')).toBe(true);
      expect(result.current.isDismissed('overwatering_risk')).toBe(false);
      expect(result.current.isDismissed('consistency_improvement')).toBe(false);
    });
  });

  describe('reload', () => {
    it('should reload dismissed insights from database', async () => {
      // Initial load with no dismissed insights
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn()
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({
          data: [{ insight_type: 'schedule_adjustment' }],
          error: null
        });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      const { result } = renderHook(() => useDismissedInsights(mockPlantId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.dismissedTypes.size).toBe(0);

      // Reload
      await result.current.reload();

      await waitFor(() => {
        expect(result.current.dismissedTypes.size).toBe(1);
        expect(result.current.dismissedTypes.has('schedule_adjustment')).toBe(true);
      });
    });
  });

  describe('clearAllDismissals', () => {
    it('should clear all dismissed insights for the plant', async () => {
      // Initial load with dismissed insights
      const mockData = [
        { insight_type: 'schedule_adjustment' },
        { insight_type: 'overwatering_risk' },
      ];

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ data: mockData, error: null });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      const { result } = renderHook(() => useDismissedInsights(mockPlantId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.dismissedTypes.size).toBe(2);

      // Setup delete mock
      const mockDelete = vi.fn().mockReturnThis();
      const mockDeleteEq = vi.fn().mockResolvedValue({ error: null });

      vi.mocked(supabase.from).mockReturnValue({
        delete: mockDelete,
      } as any);

      mockDelete.mockReturnValue({
        eq: mockDeleteEq,
      });

      // Clear all
      const success = await result.current.clearAllDismissals();

      expect(success).toBe(true);
      expect(mockDelete).toHaveBeenCalled();
      expect(mockDeleteEq).toHaveBeenCalledWith('user_plant_id', mockPlantId);

      await waitFor(() => {
        expect(result.current.dismissedTypes.size).toBe(0);
      });
    });
  });

  describe('dismissing multiple insights (Dismiss All)', () => {
    it('should dismiss all insights when called sequentially', async () => {
      // Setup initial load
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ data: [], error: null });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      const { result } = renderHook(() => useDismissedInsights(mockPlantId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Setup insert mock
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      // Dismiss all insights (simulating Dismiss All button)
      for (const insight of mockInsights) {
        await result.current.dismissInsight(insight);
      }

      // Verify each insight was dismissed
      expect(mockInsert).toHaveBeenCalledTimes(3);
      expect(mockInsert).toHaveBeenCalledWith({
        user_plant_id: mockPlantId,
        insight_type: 'schedule_adjustment',
      });
      expect(mockInsert).toHaveBeenCalledWith({
        user_plant_id: mockPlantId,
        insight_type: 'overwatering_risk',
      });
      expect(mockInsert).toHaveBeenCalledWith({
        user_plant_id: mockPlantId,
        insight_type: 'consistency_improvement',
      });

      await waitFor(() => {
        expect(result.current.dismissedTypes.size).toBe(3);
        expect(result.current.dismissedTypes.has('schedule_adjustment')).toBe(true);
        expect(result.current.dismissedTypes.has('overwatering_risk')).toBe(true);
        expect(result.current.dismissedTypes.has('consistency_improvement')).toBe(true);
      });
    });

    it('should filter all insights after dismissing all', async () => {
      // Setup initial load
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ data: [], error: null });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      const { result } = renderHook(() => useDismissedInsights(mockPlantId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Setup insert mock
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      // Dismiss all insights
      for (const insight of mockInsights) {
        await result.current.dismissInsight(insight);
      }

      await waitFor(() => {
        expect(result.current.dismissedTypes.size).toBe(3);
      });

      // Filter should return empty array
      const filtered = result.current.filterDismissed(mockInsights);
      expect(filtered).toHaveLength(0);
    });

    it('should reload and show no insights after dismiss all', async () => {
      // Initial load - no dismissed insights
      const mockSelect = vi.fn().mockReturnThis();
      let mockEq = vi.fn()
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({
          data: mockInsights.map(i => ({ insight_type: i.type })),
          error: null
        });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      const { result } = renderHook(() => useDismissedInsights(mockPlantId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.dismissedTypes.size).toBe(0);

      // Setup insert mock
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      // Dismiss all
      for (const insight of mockInsights) {
        await result.current.dismissInsight(insight);
      }

      // Reset mocks for reload
      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      // Reload to simulate what happens when modal closes and reopens
      await result.current.reload();

      await waitFor(() => {
        expect(result.current.dismissedTypes.size).toBe(3);
      });

      // Should filter out all insights
      const filtered = result.current.filterDismissed(mockInsights);
      expect(filtered).toHaveLength(0);
    });
  });
});
