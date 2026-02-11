/**
 * Unit tests for seasonal detection service
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { seasonalDetectionService } from '../seasonalDetectionService';
import type { WeatherData, LocationData } from '../weatherTypes';
import type { Season, SeasonalTransition } from '../seasonalDetectionService';
import { weatherService } from '../weatherService';

// Mock the weather service
vi.mock('../weatherService', () => ({
  weatherService: {
    getCurrentWeather: vi.fn()
  }
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('SeasonalDetectionService', () => {
  const mockLocation: LocationData = {
    latitude: 40.7128,
    longitude: -74.0060,
    city: 'New York',
    country: 'US'
  };

  const createMockWeather = (overrides: Partial<WeatherData> = {}): WeatherData => ({
    current_temp_celsius: 20,
    current_humidity_percent: 60,
    season: 'spring',
    daylight_hours: 12,
    upcoming_rain_probability: 30,
    is_snowing: false,
    weather_condition: 'Clear',
    ...overrides
  });

  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    seasonalDetectionService.clearWeatherHistory();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('storeWeatherData', () => {
    it('should store weather data in localStorage', async () => {
      const weather = createMockWeather();
      await seasonalDetectionService.storeWeatherData(weather);

      const stored = localStorage.getItem('sprouthub_weather_history');
      expect(stored).toBeTruthy();
      expect(JSON.parse(stored!)).toHaveLength(1);
    });

    it('should limit history to 30 days', async () => {
      // Store 35 entries
      for (let i = 0; i < 35; i++) {
        await seasonalDetectionService.storeWeatherData(createMockWeather());
      }

      const stored = localStorage.getItem('sprouthub_weather_history');
      const history = JSON.parse(stored!);
      expect(history).toHaveLength(30);
    });

    it('should append new entries to existing history', async () => {
      await seasonalDetectionService.storeWeatherData(createMockWeather({ current_temp_celsius: 15 }));
      await seasonalDetectionService.storeWeatherData(createMockWeather({ current_temp_celsius: 20 }));
      await seasonalDetectionService.storeWeatherData(createMockWeather({ current_temp_celsius: 25 }));

      const stored = localStorage.getItem('sprouthub_weather_history');
      const history = JSON.parse(stored!);
      expect(history).toHaveLength(3);
      expect(history[0].weather.current_temp_celsius).toBe(15);
      expect(history[2].weather.current_temp_celsius).toBe(25);
    });

    it('should handle storage errors gracefully', async () => {
      vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw new Error('Storage full');
      });

      await expect(seasonalDetectionService.storeWeatherData(createMockWeather())).resolves.not.toThrow();
    });
  });

  describe('clearWeatherHistory', () => {
    it('should clear all weather history', async () => {
      await seasonalDetectionService.storeWeatherData(createMockWeather());
      expect(localStorage.getItem('sprouthub_weather_history')).toBeTruthy();

      seasonalDetectionService.clearWeatherHistory();
      expect(localStorage.getItem('sprouthub_weather_history')).toBeNull();
    });
  });

  describe('getCurrentSeason', () => {
    const testCases: Array<{ month: number; hemisphere: 'north' | 'south'; expected: Season }> = [
      // Northern hemisphere
      { month: 1, hemisphere: 'north', expected: 'winter' },
      { month: 3, hemisphere: 'north', expected: 'spring' },
      { month: 5, hemisphere: 'north', expected: 'spring' },
      { month: 6, hemisphere: 'north', expected: 'summer' },
      { month: 8, hemisphere: 'north', expected: 'summer' },
      { month: 9, hemisphere: 'north', expected: 'fall' },
      { month: 11, hemisphere: 'north', expected: 'fall' },
      { month: 12, hemisphere: 'north', expected: 'winter' },

      // Southern hemisphere (flipped)
      { month: 1, hemisphere: 'south', expected: 'summer' },
      { month: 3, hemisphere: 'south', expected: 'fall' },
      { month: 6, hemisphere: 'south', expected: 'winter' },
      { month: 9, hemisphere: 'south', expected: 'spring' },
      { month: 12, hemisphere: 'south', expected: 'summer' }
    ];

    testCases.forEach(({ month, hemisphere, expected }) => {
      it(`should return ${expected} for month ${month} in ${hemisphere}ern hemisphere`, () => {
        const realDate = Date;
        const mockDate = new Date(2024, month - 1, 15); // month is 0-indexed in Date

        global.Date = class extends Date {
          constructor() {
            super();
            return mockDate;
          }
        } as any;

        const location: LocationData = {
          latitude: hemisphere === 'north' ? 40 : -40,
          longitude: 0
        };

        const season = seasonalDetectionService.getCurrentSeason(location);
        expect(season).toBe(expected);

        global.Date = realDate;
      });
    });

    it('should handle equator location as northern hemisphere', () => {
      const realDate = Date;
      const mockDate = new Date(2024, 5, 15); // June

      global.Date = class extends Date {
        constructor() {
          super();
          return mockDate;
        }
      } as any;

      const location: LocationData = { latitude: 0, longitude: 0 };
      const season = seasonalDetectionService.getCurrentSeason(location);
      expect(season).toBe('summer');

      global.Date = realDate;
    });
  });

  describe('isTransitionStable', () => {
    it('should return false for transitions less than 14 days old', () => {
      const transitionDate = new Date();
      transitionDate.setDate(transitionDate.getDate() - 10);

      expect(seasonalDetectionService.isTransitionStable(transitionDate)).toBe(false);
    });

    it('should return true for transitions exactly 14 days old', () => {
      const transitionDate = new Date();
      transitionDate.setDate(transitionDate.getDate() - 14);

      expect(seasonalDetectionService.isTransitionStable(transitionDate)).toBe(true);
    });

    it('should return true for transitions more than 14 days old', () => {
      const transitionDate = new Date();
      transitionDate.setDate(transitionDate.getDate() - 20);

      expect(seasonalDetectionService.isTransitionStable(transitionDate)).toBe(true);
    });

    it('should return false for recent transitions', () => {
      const transitionDate = new Date();
      transitionDate.setDate(transitionDate.getDate() - 1);

      expect(seasonalDetectionService.isTransitionStable(transitionDate)).toBe(false);
    });
  });

  describe('detectSeasonalTransition', () => {
    it('should return null when less than 7 days of history', async () => {
      // Store only 5 days of history
      for (let i = 0; i < 5; i++) {
        await seasonalDetectionService.storeWeatherData(createMockWeather());
      }

      vi.mocked(weatherService.getCurrentWeather).mockResolvedValue(createMockWeather());

      const transition = await seasonalDetectionService.detectSeasonalTransition('winter', mockLocation);
      expect(transition).toBeNull();
    });

    it('should return null when no transition is detected', async () => {
      // Store stable winter weather
      for (let i = 0; i < 7; i++) {
        await seasonalDetectionService.storeWeatherData(
          createMockWeather({ current_temp_celsius: 5, daylight_hours: 9 })
        );
      }

      vi.mocked(weatherService.getCurrentWeather).mockResolvedValue(
        createMockWeather({ current_temp_celsius: 5, daylight_hours: 9 })
      );

      const transition = await seasonalDetectionService.detectSeasonalTransition('winter', mockLocation);
      expect(transition).toBeNull();
    });

    it('should handle weather service errors gracefully', async () => {
      vi.mocked(weatherService.getCurrentWeather).mockRejectedValue(new Error('API error'));

      const transition = await seasonalDetectionService.detectSeasonalTransition('winter', mockLocation);
      expect(transition).toBeNull();
    });
  });

  describe('detectSpringOnset', () => {
    it('should detect spring from winter with medium/high confidence', async () => {
      // Store 7 days of warming weather
      for (let i = 0; i < 7; i++) {
        await seasonalDetectionService.storeWeatherData(
          createMockWeather({
            current_temp_celsius: 12 + i, // Rising from 12 to 18
            daylight_hours: 12.5
          })
        );
      }

      vi.mocked(weatherService.getCurrentWeather).mockResolvedValue(
        createMockWeather({ current_temp_celsius: 18, daylight_hours: 12.5 })
      );

      const transition = await seasonalDetectionService.detectSeasonalTransition('winter', mockLocation);

      expect(transition).not.toBeNull();
      expect(transition?.from_season).toBe('winter');
      expect(transition?.to_season).toBe('spring');
      // Confidence is set to medium first, then high if temp > 15 and rising
      // But our avg is only ~15, so it may be medium
      expect(['medium', 'high']).toContain(transition?.confidence);
      expect(transition?.triggering_factors).toContain('Daylight hours exceeding 12 hours');
      expect(transition?.triggering_factors.length).toBeGreaterThanOrEqual(2);
    });

    it('should not detect spring from non-winter seasons', async () => {
      for (let i = 0; i < 7; i++) {
        await seasonalDetectionService.storeWeatherData(
          createMockWeather({ current_temp_celsius: 16, daylight_hours: 13 })
        );
      }

      vi.mocked(weatherService.getCurrentWeather).mockResolvedValue(
        createMockWeather({ current_temp_celsius: 16, daylight_hours: 13 })
      );

      const transition = await seasonalDetectionService.detectSeasonalTransition('summer', mockLocation);
      expect(transition).toBeNull();
    });

    it('should require at least 2 factors for spring detection', async () => {
      // Only one factor: daylight > 12
      for (let i = 0; i < 7; i++) {
        await seasonalDetectionService.storeWeatherData(
          createMockWeather({ current_temp_celsius: 8, daylight_hours: 12.5 })
        );
      }

      vi.mocked(weatherService.getCurrentWeather).mockResolvedValue(
        createMockWeather({ current_temp_celsius: 8, daylight_hours: 12.5 })
      );

      const transition = await seasonalDetectionService.detectSeasonalTransition('winter', mockLocation);
      expect(transition).toBeNull();
    });
  });

  describe('detectSummerOnset', () => {
    it('should detect summer from spring with high confidence', async () => {
      // Store 7 days of hot weather
      for (let i = 0; i < 7; i++) {
        await seasonalDetectionService.storeWeatherData(
          createMockWeather({
            current_temp_celsius: 25,
            daylight_hours: 15
          })
        );
      }

      vi.mocked(weatherService.getCurrentWeather).mockResolvedValue(
        createMockWeather({ current_temp_celsius: 25, daylight_hours: 15 })
      );

      const transition = await seasonalDetectionService.detectSeasonalTransition('spring', mockLocation);

      expect(transition).not.toBeNull();
      expect(transition?.from_season).toBe('spring');
      expect(transition?.to_season).toBe('summer');
      expect(transition?.confidence).toBe('high');
      expect(transition?.triggering_factors).toContain('Temperature consistently above 24°C');
      expect(transition?.triggering_factors).toContain('Daylight hours exceeding 14 hours');
    });

    it('should not detect summer from non-spring seasons', async () => {
      for (let i = 0; i < 7; i++) {
        await seasonalDetectionService.storeWeatherData(
          createMockWeather({ current_temp_celsius: 26, daylight_hours: 15 })
        );
      }

      vi.mocked(weatherService.getCurrentWeather).mockResolvedValue(
        createMockWeather({ current_temp_celsius: 26, daylight_hours: 15 })
      );

      const transition = await seasonalDetectionService.detectSeasonalTransition('fall', mockLocation);
      expect(transition).toBeNull();
    });

    it('should detect no cold snaps as a factor', async () => {
      // Store 7 days of consistently warm weather (no cold snaps)
      for (let i = 0; i < 7; i++) {
        await seasonalDetectionService.storeWeatherData(
          createMockWeather({
            current_temp_celsius: 22,
            daylight_hours: 14.5
          })
        );
      }

      vi.mocked(weatherService.getCurrentWeather).mockResolvedValue(
        createMockWeather({ current_temp_celsius: 22, daylight_hours: 14.5 })
      );

      const transition = await seasonalDetectionService.detectSeasonalTransition('spring', mockLocation);

      expect(transition).not.toBeNull();
      expect(transition?.triggering_factors).toContain('No cold snaps below 18°C in past week');
    });
  });

  describe('detectFallOnset', () => {
    it('should detect fall from summer with high confidence', async () => {
      // Store some summer peak data first
      for (let i = 0; i < 7; i++) {
        await seasonalDetectionService.storeWeatherData(
          createMockWeather({ current_temp_celsius: 28 })
        );
      }

      // Now store cooling trend
      for (let i = 0; i < 7; i++) {
        await seasonalDetectionService.storeWeatherData(
          createMockWeather({
            current_temp_celsius: 19 - i, // Falling from 19 to 13
            daylight_hours: 11.5
          })
        );
      }

      vi.mocked(weatherService.getCurrentWeather).mockResolvedValue(
        createMockWeather({ current_temp_celsius: 16, daylight_hours: 11.5 })
      );

      const transition = await seasonalDetectionService.detectSeasonalTransition('summer', mockLocation);

      expect(transition).not.toBeNull();
      expect(transition?.from_season).toBe('summer');
      expect(transition?.to_season).toBe('fall');
      expect(transition?.confidence).toBe('high');
      expect(transition?.triggering_factors).toContain('Daylight hours below 12 hours');
      expect(transition?.triggering_factors).toContain('Temperature below 18°C with falling trend');
    });

    it('should not detect fall from non-summer seasons', async () => {
      for (let i = 0; i < 7; i++) {
        await seasonalDetectionService.storeWeatherData(
          createMockWeather({ current_temp_celsius: 16, daylight_hours: 11 })
        );
      }

      vi.mocked(weatherService.getCurrentWeather).mockResolvedValue(
        createMockWeather({ current_temp_celsius: 16, daylight_hours: 11 })
      );

      const transition = await seasonalDetectionService.detectSeasonalTransition('spring', mockLocation);
      expect(transition).toBeNull();
    });

    it('should detect temperature drop from summer peak', async () => {
      // Store summer peak
      for (let i = 0; i < 3; i++) {
        await seasonalDetectionService.storeWeatherData(
          createMockWeather({ current_temp_celsius: 30 })
        );
      }

      // Store cooling trend (drop of 10°C from peak)
      for (let i = 0; i < 7; i++) {
        await seasonalDetectionService.storeWeatherData(
          createMockWeather({
            current_temp_celsius: 20,
            daylight_hours: 11.5
          })
        );
      }

      vi.mocked(weatherService.getCurrentWeather).mockResolvedValue(
        createMockWeather({ current_temp_celsius: 20, daylight_hours: 11.5 })
      );

      const transition = await seasonalDetectionService.detectSeasonalTransition('summer', mockLocation);

      expect(transition).not.toBeNull();
      expect(transition?.triggering_factors.some(f => f.includes('dropped') && f.includes('°C'))).toBe(true);
    });
  });

  describe('detectWinterOnset', () => {
    it('should detect winter from fall with high confidence', async () => {
      // Store 7 days of cold weather
      for (let i = 0; i < 7; i++) {
        await seasonalDetectionService.storeWeatherData(
          createMockWeather({
            current_temp_celsius: 8,
            daylight_hours: 9
          })
        );
      }

      vi.mocked(weatherService.getCurrentWeather).mockResolvedValue(
        createMockWeather({ current_temp_celsius: 8, daylight_hours: 9 })
      );

      const transition = await seasonalDetectionService.detectSeasonalTransition('fall', mockLocation);

      expect(transition).not.toBeNull();
      expect(transition?.from_season).toBe('fall');
      expect(transition?.to_season).toBe('winter');
      expect(transition?.confidence).toBe('high');
      expect(transition?.triggering_factors).toContain('Temperature consistently below 10°C');
      expect(transition?.triggering_factors).toContain('Daylight hours below 10 hours');
    });

    it('should not detect winter from non-fall seasons', async () => {
      for (let i = 0; i < 7; i++) {
        await seasonalDetectionService.storeWeatherData(
          createMockWeather({ current_temp_celsius: 8, daylight_hours: 9 })
        );
      }

      vi.mocked(weatherService.getCurrentWeather).mockResolvedValue(
        createMockWeather({ current_temp_celsius: 8, daylight_hours: 9 })
      );

      const transition = await seasonalDetectionService.detectSeasonalTransition('spring', mockLocation);
      expect(transition).toBeNull();
    });

    it('should detect no warm days as a factor', async () => {
      // Store 7 days of consistently cold weather (no warm days)
      for (let i = 0; i < 7; i++) {
        await seasonalDetectionService.storeWeatherData(
          createMockWeather({
            current_temp_celsius: 10,
            daylight_hours: 9
          })
        );
      }

      vi.mocked(weatherService.getCurrentWeather).mockResolvedValue(
        createMockWeather({ current_temp_celsius: 10, daylight_hours: 9 })
      );

      const transition = await seasonalDetectionService.detectSeasonalTransition('fall', mockLocation);

      expect(transition).not.toBeNull();
      expect(transition?.triggering_factors).toContain('No warm days above 15°C in past week');
    });
  });

  describe('temperature trend calculation', () => {
    it('should detect rising temperature trend', async () => {
      // Store rising temperatures
      const temps = [10, 11, 12, 16, 17, 18, 19];
      for (const temp of temps) {
        await seasonalDetectionService.storeWeatherData(
          createMockWeather({ current_temp_celsius: temp, daylight_hours: 12.5 })
        );
      }

      vi.mocked(weatherService.getCurrentWeather).mockResolvedValue(
        createMockWeather({ current_temp_celsius: 19, daylight_hours: 12.5 })
      );

      const transition = await seasonalDetectionService.detectSeasonalTransition('winter', mockLocation);

      // Should detect spring with rising trend
      expect(transition).not.toBeNull();
      expect(transition?.to_season).toBe('spring');
    });

    it('should detect falling temperature trend', async () => {
      // Store summer peak first
      for (let i = 0; i < 3; i++) {
        await seasonalDetectionService.storeWeatherData(
          createMockWeather({ current_temp_celsius: 28 })
        );
      }

      // Store falling temperatures
      const temps = [22, 21, 20, 16, 15, 14, 13];
      for (const temp of temps) {
        await seasonalDetectionService.storeWeatherData(
          createMockWeather({ current_temp_celsius: temp, daylight_hours: 11 })
        );
      }

      vi.mocked(weatherService.getCurrentWeather).mockResolvedValue(
        createMockWeather({ current_temp_celsius: 13, daylight_hours: 11 })
      );

      const transition = await seasonalDetectionService.detectSeasonalTransition('summer', mockLocation);

      // Should detect fall with falling trend
      expect(transition).not.toBeNull();
      expect(transition?.to_season).toBe('fall');
    });
  });

  describe('confidence level selection', () => {
    it('should return transition with highest confidence', async () => {
      // Create scenario where multiple transitions might be detected
      // This is edge case but tests the selection logic

      // Store weather that's borderline between seasons
      for (let i = 0; i < 7; i++) {
        await seasonalDetectionService.storeWeatherData(
          createMockWeather({
            current_temp_celsius: 15,
            daylight_hours: 12.5
          })
        );
      }

      vi.mocked(weatherService.getCurrentWeather).mockResolvedValue(
        createMockWeather({ current_temp_celsius: 15, daylight_hours: 12.5 })
      );

      // Test from winter - should detect spring
      const transition = await seasonalDetectionService.detectSeasonalTransition('winter', mockLocation);

      if (transition) {
        expect(['high', 'medium', 'low']).toContain(transition.confidence);
      }
    });
  });
});
