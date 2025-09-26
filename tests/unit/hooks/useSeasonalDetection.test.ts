import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSeasonalDetection } from '@/hooks/useSeasonalDetection';
import { seasonalDetectionService } from '@/services/seasonalDetectionService';
import { useAuth } from '@/contexts/AuthContext';
import { useWeatherData } from '@/hooks/useWeatherData';
import { useLocation } from '@/hooks/useLocation';
import { supabase } from '@/integrations/supabase/client';
import { mockSeasonalTransitions } from '../../utils/mock-plant-data';

// Mock all dependencies
vi.mock('@/contexts/AuthContext');
vi.mock('@/hooks/useWeatherData');
vi.mock('@/hooks/useLocation');
vi.mock('@/services/seasonalDetectionService');
vi.mock('@/integrations/supabase/client');

describe('useSeasonalDetection', () => {
  const mockUser = { id: 'test-user-123', email: 'test@example.com' };
  const mockLocation = {
    latitude: 40.7128,
    longitude: -74.0060,
    city: 'New York',
    country: 'US',
    timezone: 'America/New_York'
  };
  const mockWeatherData = {
    current_temp_celsius: 20,
    current_humidity_percent: 60,
    daylight_hours: 12,
    upcoming_rain_probability: 30,
    season: 'spring'
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      loading: false
    } as any);

    vi.mocked(useWeatherData).mockReturnValue({
      weatherData: mockWeatherData,
      isLoading: false,
      error: null
    } as any);

    vi.mocked(useLocation).mockReturnValue({
      location: mockLocation,
      isLoading: false,
      error: null
    } as any);

    vi.mocked(seasonalDetectionService.getCurrentSeason).mockReturnValue('spring');
    vi.mocked(seasonalDetectionService.detectSeasonalTransition).mockResolvedValue(null);
    vi.mocked(seasonalDetectionService.isTransitionStable).mockReturnValue(true);
    vi.mocked(seasonalDetectionService.storeWeatherData).mockResolvedValue(undefined);

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: null,
                error: { code: 'PGRST116' }
              }))
            }))
          }))
        }))
      })),
      upsert: vi.fn(() => Promise.resolve({ data: null, error: null }))
    } as any);

    // Mock Date.now for consistent testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-09-10T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useSeasonalDetection());

      expect(result.current.currentSeason).toBeNull();
      expect(result.current.pendingTransition).toBeNull();
      expect(result.current.shouldShowReview).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should set current season when location is available', () => {
      const { result } = renderHook(() => useSeasonalDetection());

      expect(result.current.currentSeason).toBe('spring');
      expect(seasonalDetectionService.getCurrentSeason).toHaveBeenCalledWith(mockLocation);
    });

    it('should store weather data when available', () => {
      renderHook(() => useSeasonalDetection());

      expect(seasonalDetectionService.storeWeatherData).toHaveBeenCalledWith(mockWeatherData);
    });
  });

  describe('seasonal transition detection', () => {
    it('should detect seasonal transition when conditions are met', async () => {
      const mockTransition = mockSeasonalTransitions.summerToFall;

      vi.mocked(seasonalDetectionService.detectSeasonalTransition).mockResolvedValue(mockTransition);
      vi.mocked(seasonalDetectionService.isTransitionStable).mockReturnValue(true);

      const { result } = renderHook(() => useSeasonalDetection());

      await act(async () => {
        await result.current.checkForTransition();
      });

      await waitFor(() => {
        expect(result.current.pendingTransition).toEqual(mockTransition);
        expect(result.current.shouldShowReview).toBe(true);
      });
    });

    it('should not show review for unstable transitions', async () => {
      const mockTransition = mockSeasonalTransitions.summerToFall;

      vi.mocked(seasonalDetectionService.detectSeasonalTransition).mockResolvedValue(mockTransition);
      vi.mocked(seasonalDetectionService.isTransitionStable).mockReturnValue(false);

      const { result } = renderHook(() => useSeasonalDetection());

      await act(async () => {
        await result.current.checkForTransition();
      });

      await waitFor(() => {
        expect(result.current.pendingTransition).toEqual(mockTransition);
        expect(result.current.shouldShowReview).toBe(false);
      });
    });

    it('should not check for transitions when required data is missing', async () => {
      vi.mocked(useLocation).mockReturnValue({
        location: null,
        isLoading: false,
        error: null
      } as any);

      const { result } = renderHook(() => useSeasonalDetection());

      await act(async () => {
        await result.current.checkForTransition();
      });

      expect(seasonalDetectionService.detectSeasonalTransition).not.toHaveBeenCalled();
    });

    it('should not check multiple times per day', async () => {
      const { result } = renderHook(() => useSeasonalDetection());

      // First check
      await act(async () => {
        await result.current.checkForTransition();
      });

      // Second check on same day
      await act(async () => {
        await result.current.checkForTransition();
      });

      expect(seasonalDetectionService.detectSeasonalTransition).toHaveBeenCalledTimes(1);
    });

    it('should check again on a new day', async () => {
      const { result } = renderHook(() => useSeasonalDetection());

      // First check
      await act(async () => {
        await result.current.checkForTransition();
      });

      // Advance time to next day
      vi.setSystemTime(new Date('2025-09-11T12:00:00Z'));

      // Second check on new day
      await act(async () => {
        await result.current.checkForTransition();
      });

      expect(seasonalDetectionService.detectSeasonalTransition).toHaveBeenCalledTimes(2);
    });

    it('should handle detection errors gracefully', async () => {
      vi.mocked(seasonalDetectionService.detectSeasonalTransition).mockRejectedValue(
        new Error('Weather service unavailable')
      );

      const { result } = renderHook(() => useSeasonalDetection());

      await act(async () => {
        await result.current.checkForTransition();
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Weather service unavailable');
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('notification history management', () => {
    it('should not show review if user was already notified', async () => {
      const mockTransition = mockSeasonalTransitions.summerToFall;

      vi.mocked(seasonalDetectionService.detectSeasonalTransition).mockResolvedValue(mockTransition);
      vi.mocked(seasonalDetectionService.isTransitionStable).mockReturnValue(true);

      // Mock notification history exists
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({
                  data: { id: 'notification-123' },
                  error: null
                }))
              }))
            }))
          }))
        }))
      } as any);

      const { result } = renderHook(() => useSeasonalDetection());

      await act(async () => {
        await result.current.checkForTransition();
      });

      await waitFor(() => {
        expect(result.current.pendingTransition).toEqual(mockTransition);
        expect(result.current.shouldShowReview).toBe(false);
      });
    });

    it('should handle notification history check errors', async () => {
      const mockTransition = mockSeasonalTransitions.summerToFall;

      vi.mocked(seasonalDetectionService.detectSeasonalTransition).mockResolvedValue(mockTransition);
      vi.mocked(seasonalDetectionService.isTransitionStable).mockReturnValue(true);

      // Mock database error
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({
                  data: null,
                  error: new Error('Database error')
                }))
              }))
            }))
          }))
        }))
      } as any);

      const { result } = renderHook(() => useSeasonalDetection());

      await act(async () => {
        await result.current.checkForTransition();
      });

      // Should default to not showing review on error
      await waitFor(() => {
        expect(result.current.shouldShowReview).toBe(false);
      });
    });
  });

  describe('user actions', () => {
    it('should trigger review manually', async () => {
      const { result } = renderHook(() => useSeasonalDetection());

      act(() => {
        result.current.triggerReview();
      });

      expect(result.current.shouldShowReview).toBe(true);
    });

    it('should dismiss review and record notification', async () => {
      const mockTransition = mockSeasonalTransitions.summerToFall;
      vi.mocked(seasonalDetectionService.detectSeasonalTransition).mockResolvedValue(mockTransition);

      const { result } = renderHook(() => useSeasonalDetection());

      // Set up a pending transition first
      await act(async () => {
        await result.current.checkForTransition();
      });

      await waitFor(() => {
        expect(result.current.shouldShowReview).toBe(true);
      });

      // Dismiss the review
      await act(async () => {
        await result.current.dismissReview();
      });

      expect(result.current.shouldShowReview).toBe(false);
      expect(supabase.from).toHaveBeenCalledWith('seasonal_review_notifications');
    });

    it('should snooze review and record notification', async () => {
      const mockTransition = mockSeasonalTransitions.summerToFall;
      vi.mocked(seasonalDetectionService.detectSeasonalTransition).mockResolvedValue(mockTransition);

      const { result } = renderHook(() => useSeasonalDetection());

      // Set up a pending transition first
      await act(async () => {
        await result.current.checkForTransition();
      });

      await waitFor(() => {
        expect(result.current.shouldShowReview).toBe(true);
      });

      // Snooze the review
      await act(async () => {
        await result.current.snoozeReview(2); // 2 weeks
      });

      expect(result.current.shouldShowReview).toBe(false);
      expect(supabase.from).toHaveBeenCalledWith('seasonal_review_notifications');
    });

    it('should handle notification recording errors', async () => {
      const mockTransition = mockSeasonalTransitions.summerToFall;
      vi.mocked(seasonalDetectionService.detectSeasonalTransition).mockResolvedValue(mockTransition);

      // Mock upsert error
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({
                  data: null,
                  error: { code: 'PGRST116' }
                }))
              }))
            }))
          }))
        })),
        upsert: vi.fn(() => Promise.resolve({
          data: null,
          error: new Error('Database error')
        }))
      } as any);

      const { result } = renderHook(() => useSeasonalDetection());

      // Set up a pending transition first
      await act(async () => {
        await result.current.checkForTransition();
      });

      // Dismiss should still work even if recording fails
      await act(async () => {
        await result.current.dismissReview();
      });

      expect(result.current.shouldShowReview).toBe(false);
    });
  });

  describe('loading states', () => {
    it('should not check transitions while weather is loading', async () => {
      vi.mocked(useWeatherData).mockReturnValue({
        weatherData: mockWeatherData,
        isLoading: true,
        error: null
      } as any);

      const { result } = renderHook(() => useSeasonalDetection());

      await act(async () => {
        await result.current.checkForTransition();
      });

      expect(seasonalDetectionService.detectSeasonalTransition).not.toHaveBeenCalled();
    });

    it('should show loading state during transition detection', async () => {
      let resolveDetection: (value: any) => void;
      const detectionPromise = new Promise(resolve => {
        resolveDetection = resolve;
      });

      vi.mocked(seasonalDetectionService.detectSeasonalTransition).mockReturnValue(detectionPromise);

      const { result } = renderHook(() => useSeasonalDetection());

      act(() => {
        result.current.checkForTransition();
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveDetection!(null);
        await detectionPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('automatic daily checks', () => {
    it('should set up automatic daily checks', async () => {
      vi.spyOn(global, 'setInterval');

      renderHook(() => useSeasonalDetection());

      expect(setInterval).toHaveBeenCalledWith(
        expect.any(Function),
        24 * 60 * 60 * 1000 // 24 hours in milliseconds
      );
    });

    it('should clear interval on unmount', () => {
      vi.spyOn(global, 'clearInterval');
      const mockIntervalId = 123;
      vi.spyOn(global, 'setInterval').mockReturnValue(mockIntervalId as any);

      const { unmount } = renderHook(() => useSeasonalDetection());

      unmount();

      expect(clearInterval).toHaveBeenCalledWith(mockIntervalId);
    });

    it('should check immediately when conditions are first met', async () => {
      const { rerender } = renderHook(() => useSeasonalDetection());

      // Initially no user
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        loading: false
      } as any);

      rerender();

      expect(seasonalDetectionService.detectSeasonalTransition).not.toHaveBeenCalled();

      // User becomes available
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
        loading: false
      } as any);

      rerender();

      // Should check immediately
      await waitFor(() => {
        expect(seasonalDetectionService.detectSeasonalTransition).toHaveBeenCalled();
      });
    });
  });

  describe('edge cases', () => {
    it('should handle missing user gracefully', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        loading: false
      } as any);

      const { result } = renderHook(() => useSeasonalDetection());

      await act(async () => {
        await result.current.checkForTransition();
      });

      expect(seasonalDetectionService.detectSeasonalTransition).not.toHaveBeenCalled();
    });

    it('should handle missing location gracefully', async () => {
      vi.mocked(useLocation).mockReturnValue({
        location: null,
        isLoading: false,
        error: null
      } as any);

      const { result } = renderHook(() => useSeasonalDetection());

      expect(result.current.currentSeason).toBeNull();

      await act(async () => {
        await result.current.checkForTransition();
      });

      expect(seasonalDetectionService.detectSeasonalTransition).not.toHaveBeenCalled();
    });

    it('should handle missing weather data gracefully', async () => {
      vi.mocked(useWeatherData).mockReturnValue({
        weatherData: null,
        isLoading: false,
        error: null
      } as any);

      const { result } = renderHook(() => useSeasonalDetection());

      expect(seasonalDetectionService.storeWeatherData).not.toHaveBeenCalled();
    });

    it('should handle actions without pending transition', async () => {
      const { result } = renderHook(() => useSeasonalDetection());

      // Should not throw when dismissing without transition
      await act(async () => {
        await result.current.dismissReview();
      });

      await act(async () => {
        await result.current.snoozeReview(1);
      });

      // No notification should be recorded
      expect(supabase.from).not.toHaveBeenCalledWith('seasonal_review_notifications');
    });
  });

  describe('state management', () => {
    it('should clear error when new check succeeds', async () => {
      vi.mocked(seasonalDetectionService.detectSeasonalTransition)
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce(null);

      const { result } = renderHook(() => useSeasonalDetection());

      // First check fails
      await act(async () => {
        await result.current.checkForTransition();
      });

      expect(result.current.error).toBe('First error');

      // Second check succeeds
      await act(async () => {
        await result.current.checkForTransition();
      });

      expect(result.current.error).toBeNull();
    });

    it('should maintain consistent state across re-renders', () => {
      const { result, rerender } = renderHook(() => useSeasonalDetection());

      const initialSeason = result.current.currentSeason;

      rerender();

      expect(result.current.currentSeason).toBe(initialSeason);
    });
  });
});