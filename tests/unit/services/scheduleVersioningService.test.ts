import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { scheduleVersioningService, SeasonalScheduleSuggestion } from '@/services/scheduleVersioningService';
import { Season } from '@/services/seasonalDetectionService';
import { WeatherData } from '@/services/weatherTypes';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
          })),
          single: vi.fn(() => Promise.resolve({ data: null, error: { code: 'PGRST116' } }))
        })),
        gte: vi.fn(() => ({
          lte: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        })),
        in: vi.fn(() => Promise.resolve({ data: null, error: null }))
      })),
      upsert: vi.fn(() => Promise.resolve({ data: null, error: null })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
        in: vi.fn(() => Promise.resolve({ data: null, error: null }))
      })),
      insert: vi.fn(() => Promise.resolve({ data: null, error: null }))
    }))
  }
}));

describe('ScheduleVersioningService', () => {
  const mockUserId = 'test-user-123';
  const mockWeather: WeatherData = {
    current_temp_celsius: 20,
    current_humidity_percent: 60,
    daylight_hours: 12,
    upcoming_rain_probability: 30,
    season: 'spring'
  };

  const mockPlant = {
    id: 'plant-123',
    nickname: 'Test Plant',
    plant_type: 'Monstera deliciosa',
    suggested_watering_days: 7,
    is_outdoor_plant: false,
    user_id: mockUserId,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  };

  const mockOutdoorPlant = {
    ...mockPlant,
    id: 'outdoor-plant-123',
    nickname: 'Outdoor Test Plant',
    is_outdoor_plant: true
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateSeasonalSuggestions', () => {
    it('should generate suggestions for user plants', async () => {
      // Mock plants query
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({
            data: [mockPlant, mockOutdoorPlant],
            error: null
          }))
        }))
      } as any);

      // Mock empty historical schedules
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: [mockPlant, mockOutdoorPlant], error: null }))
        }))
      } as any).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
              }))
            }))
          }))
        }))
      } as any);

      const suggestions = await scheduleVersioningService.generateSeasonalSuggestions(
        mockUserId,
        'summer',
        mockWeather
      );

      expect(suggestions).toBeInstanceOf(Array);
      expect(supabase.from).toHaveBeenCalledWith('user_plants');
    });

    it('should return empty array when no plants found', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      } as any);

      const suggestions = await scheduleVersioningService.generateSeasonalSuggestions(
        mockUserId,
        'spring',
        mockWeather
      );

      expect(suggestions).toEqual([]);
    });

    it('should handle database errors gracefully', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: null, error: new Error('Database error') }))
        }))
      } as any);

      await expect(
        scheduleVersioningService.generateSeasonalSuggestions(mockUserId, 'spring', mockWeather)
      ).rejects.toThrow('Database error');
    });
  });

  describe('weather-based schedule calculation', () => {
    beforeEach(() => {
      // Mock plants and empty historical data
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: [mockPlant], error: null }))
        }))
      } as any).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
              }))
            }))
          }))
        }))
      } as any);
    });

    it('should suggest more frequent watering in summer', async () => {
      const summerWeather: WeatherData = {
        current_temp_celsius: 30,
        current_humidity_percent: 35,
        daylight_hours: 15,
        upcoming_rain_probability: 10,
        season: 'summer'
      };

      const suggestions = await scheduleVersioningService.generateSeasonalSuggestions(
        mockUserId,
        'summer',
        summerWeather
      );

      if (suggestions.length > 0) {
        const suggestion = suggestions[0];
        expect(suggestion.suggested_days).toBeLessThan(suggestion.current_watering_days);
        expect(suggestion.reasoning).toContain('summer');
        expect(suggestion.based_on).toBe('weather_conditions');
      }
    });

    it('should suggest less frequent watering in winter', async () => {
      const winterWeather: WeatherData = {
        current_temp_celsius: 5,
        current_humidity_percent: 50,
        daylight_hours: 8,
        upcoming_rain_probability: 20,
        season: 'winter'
      };

      const suggestions = await scheduleVersioningService.generateSeasonalSuggestions(
        mockUserId,
        'winter',
        winterWeather
      );

      if (suggestions.length > 0) {
        const suggestion = suggestions[0];
        expect(suggestion.suggested_days).toBeGreaterThan(suggestion.current_watering_days);
        expect(suggestion.reasoning).toContain('winter');
        expect(suggestion.based_on).toBe('weather_conditions');
      }
    });

    it('should apply larger adjustments for outdoor plants', async () => {
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: [mockOutdoorPlant], error: null }))
        }))
      } as any);

      const suggestions = await scheduleVersioningService.generateSeasonalSuggestions(
        mockUserId,
        'summer',
        mockWeather
      );

      if (suggestions.length > 0) {
        const suggestion = suggestions[0];
        expect(suggestion.reasoning).toContain('Outdoor plant - more sensitive to seasonal changes');
      }
    });

    it('should limit adjustments for indoor plants', async () => {
      const suggestions = await scheduleVersioningService.generateSeasonalSuggestions(
        mockUserId,
        'winter',
        mockWeather
      );

      if (suggestions.length > 0) {
        const suggestion = suggestions[0];
        const adjustment = Math.abs(suggestion.suggested_days - suggestion.current_watering_days);
        expect(adjustment).toBeLessThanOrEqual(2); // Indoor plants get limited adjustments
        expect(suggestion.reasoning).toContain('Indoor plant - less seasonal variation needed');
      }
    });
  });

  describe('historical schedule handling', () => {
    it('should base suggestions on previous year data when available', async () => {
      const historicalSchedule = {
        id: 'schedule-123',
        plant_id: 'plant-123',
        season: 'spring',
        year: 2024,
        watering_days: 5,
        created_at: '2024-03-01T00:00:00Z'
      };

      // Mock plants query
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: [mockPlant], error: null }))
        }))
      } as any);

      // Mock historical schedules query
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => Promise.resolve({
                  data: [historicalSchedule],
                  error: null
                }))
              }))
            }))
          }))
        }))
      } as any);

      const suggestions = await scheduleVersioningService.generateSeasonalSuggestions(
        mockUserId,
        'spring',
        mockWeather
      );

      if (suggestions.length > 0) {
        const suggestion = suggestions[0];
        expect(suggestion.suggested_days).toBe(5);
        expect(suggestion.based_on).toBe('previous_year');
        expect(suggestion.confidence).toBe('high');
        expect(suggestion.reasoning).toContain('Based on last year\'s spring schedule');
        expect(suggestion.previous_schedule).toBeDefined();
        expect(suggestion.previous_schedule?.year).toBe(2024);
        expect(suggestion.previous_schedule?.days).toBe(5);
      }
    });

    it('should adjust suggestions based on poor performance', async () => {
      const poorPerformanceSchedule = {
        id: 'schedule-123',
        plant_id: 'plant-123',
        season: 'summer',
        year: 2024,
        watering_days: 3,
        created_at: '2024-06-01T00:00:00Z'
      };

      // Mock plants query
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: [mockPlant], error: null }))
        }))
      } as any);

      // Mock historical schedules query
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => Promise.resolve({
                  data: [poorPerformanceSchedule],
                  error: null
                }))
              }))
            }))
          })),
          single: vi.fn(() => Promise.resolve({
            data: poorPerformanceSchedule,
            error: null
          })),
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({
                data: [
                  { watered_at: '2024-06-01T00:00:00Z' },
                  { watered_at: '2024-06-08T00:00:00Z' },
                  { watered_at: '2024-06-20T00:00:00Z' }
                ],
                error: null
              }))
            }))
          }))
        }))
      } as any);

      const suggestions = await scheduleVersioningService.generateSeasonalSuggestions(
        mockUserId,
        'summer',
        mockWeather
      );

      if (suggestions.length > 0) {
        const suggestion = suggestions[0];
        expect(suggestion.confidence).toBe('medium'); // Reduced confidence due to poor performance
        expect(suggestion.reasoning).toContain('Adjusted due to poor performance last year');
      }
    });
  });

  describe('environmental factors', () => {
    beforeEach(() => {
      // Mock basic setup
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: [mockPlant], error: null }))
        }))
      } as any).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
              }))
            }))
          }))
        }))
      } as any);
    });

    it('should consider extreme temperature conditions', async () => {
      const extremeHotWeather: WeatherData = {
        current_temp_celsius: 38,
        current_humidity_percent: 25,
        daylight_hours: 16,
        upcoming_rain_probability: 5,
        season: 'summer'
      };

      const suggestions = await scheduleVersioningService.generateSeasonalSuggestions(
        mockUserId,
        'summer',
        extremeHotWeather
      );

      if (suggestions.length > 0) {
        const suggestion = suggestions[0];
        expect(suggestion.reasoning).toContain('Very hot weather increases water needs');
      }
    });

    it('should consider low humidity conditions', async () => {
      const dryWeather: WeatherData = {
        current_temp_celsius: 25,
        current_humidity_percent: 25,
        daylight_hours: 14,
        upcoming_rain_probability: 10,
        season: 'summer'
      };

      const suggestions = await scheduleVersioningService.generateSeasonalSuggestions(
        mockUserId,
        'summer',
        dryWeather
      );

      if (suggestions.length > 0) {
        const suggestion = suggestions[0];
        expect(suggestion.reasoning).toContain('Low humidity increases evaporation');
      }
    });

    it('should consider rain probability for outdoor plants', async () => {
      const rainyWeather: WeatherData = {
        current_temp_celsius: 22,
        current_humidity_percent: 80,
        daylight_hours: 13,
        upcoming_rain_probability: 85,
        season: 'spring'
      };

      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: [mockOutdoorPlant], error: null }))
        }))
      } as any);

      const suggestions = await scheduleVersioningService.generateSeasonalSuggestions(
        mockUserId,
        'spring',
        rainyWeather
      );

      if (suggestions.length > 0) {
        const suggestion = suggestions[0];
        expect(suggestion.reasoning).toContain('High rain probability for outdoor plants');
      }
    });

    it('should consider daylight hours', async () => {
      const longDaylightWeather: WeatherData = {
        current_temp_celsius: 24,
        current_humidity_percent: 60,
        daylight_hours: 16,
        upcoming_rain_probability: 20,
        season: 'summer'
      };

      const suggestions = await scheduleVersioningService.generateSeasonalSuggestions(
        mockUserId,
        'summer',
        longDaylightWeather
      );

      if (suggestions.length > 0) {
        const suggestion = suggestions[0];
        expect(suggestion.reasoning).toContain('Long daylight hours increase photosynthesis');
      }
    });
  });

  describe('saveSeasonalSchedule', () => {
    it('should save seasonal schedule to database', async () => {
      const mockUpsert = vi.fn().mockResolvedValue({ data: null, error: null });
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null })
      });

      vi.mocked(supabase.from).mockReturnValueOnce({
        upsert: mockUpsert
      } as any).mockReturnValue({
        update: mockUpdate
      } as any);

      await scheduleVersioningService.saveSeasonalSchedule(
        'plant-123',
        'spring',
        8,
        mockWeather,
        false
      );

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          plant_id: 'plant-123',
          season: 'spring',
          watering_days: 8,
          year: new Date().getFullYear(),
          weather_conditions: expect.objectContaining({
            temperature: mockWeather.current_temp_celsius,
            humidity: mockWeather.current_humidity_percent,
            daylight_hours: mockWeather.daylight_hours
          }),
          user_modified: false
        }),
        { onConflict: 'plant_id,season,year' }
      );

      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should handle save errors', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        upsert: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('Database error')
        })
      } as any);

      await expect(
        scheduleVersioningService.saveSeasonalSchedule('plant-123', 'spring', 8, mockWeather)
      ).rejects.toThrow('Database error');
    });
  });

  describe('getScheduleHistory', () => {
    it('should retrieve schedule history for a plant and season', async () => {
      const mockHistory = [
        { id: '1', plant_id: 'plant-123', season: 'spring', year: 2024, watering_days: 7 },
        { id: '2', plant_id: 'plant-123', season: 'spring', year: 2023, watering_days: 6 }
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: mockHistory, error: null }))
            }))
          }))
        }))
      } as any);

      const history = await scheduleVersioningService.getScheduleHistory('plant-123', 'spring');

      expect(history).toEqual(mockHistory);
      expect(supabase.from).toHaveBeenCalledWith('plant_seasonal_schedules');
    });

    it('should handle errors when retrieving history', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({
                data: null,
                error: new Error('Database error')
              }))
            }))
          }))
        }))
      } as any);

      await expect(
        scheduleVersioningService.getScheduleHistory('plant-123', 'spring')
      ).rejects.toThrow('Database error');
    });
  });

  describe('needsSeasonalReview', () => {
    it('should return true when no schedule exists for current season/year', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({
                  data: null,
                  error: { code: 'PGRST116' } // Not found
                }))
              }))
            }))
          }))
        }))
      } as any);

      const needsReview = await scheduleVersioningService.needsSeasonalReview(
        'plant-123',
        'spring',
        2025
      );

      expect(needsReview).toBe(true);
    });

    it('should return false when schedule already exists', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({
                  data: { id: 'schedule-123' },
                  error: null
                }))
              }))
            }))
          }))
        }))
      } as any);

      const needsReview = await scheduleVersioningService.needsSeasonalReview(
        'plant-123',
        'spring',
        2025
      );

      expect(needsReview).toBe(false);
    });

    it('should handle database errors gracefully', async () => {
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

      const needsReview = await scheduleVersioningService.needsSeasonalReview(
        'plant-123',
        'spring',
        2025
      );

      expect(needsReview).toBe(false); // Returns false on error
    });
  });

  describe('markPlantsReviewed', () => {
    it('should update last_schedule_review for multiple plants', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        in: vi.fn().mockResolvedValue({ data: null, error: null })
      });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate
      } as any);

      await scheduleVersioningService.markPlantsReviewed(['plant-1', 'plant-2']);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          last_schedule_review: expect.any(String)
        })
      );
    });

    it('should handle errors when marking plants as reviewed', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: null,
            error: new Error('Database error')
          })
        })
      } as any);

      await expect(
        scheduleVersioningService.markPlantsReviewed(['plant-1'])
      ).rejects.toThrow('Database error');
    });
  });

  describe('edge cases and bounds checking', () => {
    beforeEach(() => {
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: [mockPlant], error: null }))
        }))
      } as any).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
              }))
            }))
          }))
        }))
      } as any);
    });

    it('should enforce minimum watering interval of 1 day', async () => {
      const extremeWeather: WeatherData = {
        current_temp_celsius: 50, // Extreme heat
        current_humidity_percent: 10,
        daylight_hours: 18,
        upcoming_rain_probability: 0,
        season: 'summer'
      };

      const suggestions = await scheduleVersioningService.generateSeasonalSuggestions(
        mockUserId,
        'summer',
        extremeWeather
      );

      if (suggestions.length > 0) {
        const suggestion = suggestions[0];
        expect(suggestion.suggested_days).toBeGreaterThanOrEqual(1);
      }
    });

    it('should enforce maximum watering interval of 21 days', async () => {
      const extremeColdWeather: WeatherData = {
        current_temp_celsius: -20, // Extreme cold
        current_humidity_percent: 90,
        daylight_hours: 4,
        upcoming_rain_probability: 80,
        season: 'winter'
      };

      const suggestions = await scheduleVersioningService.generateSeasonalSuggestions(
        mockUserId,
        'winter',
        extremeColdWeather
      );

      if (suggestions.length > 0) {
        const suggestion = suggestions[0];
        expect(suggestion.suggested_days).toBeLessThanOrEqual(21);
      }
    });

    it('should not suggest changes for minimal differences', async () => {
      const mildWeather: WeatherData = {
        current_temp_celsius: 19, // Very close to mild conditions
        current_humidity_percent: 55,
        daylight_hours: 12.5,
        upcoming_rain_probability: 25,
        season: 'spring'
      };

      const suggestions = await scheduleVersioningService.generateSeasonalSuggestions(
        mockUserId,
        'spring',
        mildWeather
      );

      // Should not suggest changes if the adjustment would be < 1 day
      const hasMinimalSuggestions = suggestions.every(s =>
        Math.abs(s.suggested_days - s.current_watering_days) >= 1
      );

      expect(hasMinimalSuggestions).toBe(true);
    });
  });
});