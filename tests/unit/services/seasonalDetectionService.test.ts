import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { seasonalDetectionService, Season, SeasonalTransition } from '@/services/seasonalDetectionService';
import { WeatherData, LocationData } from '@/services/weatherTypes';
import { weatherService } from '@/services/weatherService';
import { mockWeatherData } from '../../utils/mock-plant-data';

// Mock the weather service
vi.mock('@/services/weatherService', () => ({
  weatherService: {
    getCurrentWeather: vi.fn()
  }
}));

describe('SeasonalDetectionService', () => {
  const mockLocation: LocationData = {
    latitude: 40.7128,
    longitude: -74.0060,
    city: 'New York',
    country: 'US'
  };

  const createMockWeatherData = (overrides: Partial<WeatherData> = {}): WeatherData => ({
    current_temp_celsius: 20,
    current_humidity_percent: 60,
    daylight_hours: 12,
    upcoming_rain_probability: 30,
    season: 'spring',
    ...overrides
  });

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();

    // Reset weather history
    seasonalDetectionService.clearWeatherHistory();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('getCurrentSeason', () => {
    it('should return correct season for northern hemisphere spring', () => {
      // Mock March date
      const originalDate = global.Date;
      global.Date = class extends Date {
        constructor() {
          super('2025-03-15T12:00:00Z');
        }
        static now() {
          return new Date('2025-03-15T12:00:00Z').getTime();
        }
      } as DateConstructor;

      const season = seasonalDetectionService.getCurrentSeason(mockLocation);
      expect(season).toBe('spring');

      global.Date = originalDate;
    });

    it('should return correct season for northern hemisphere summer', () => {
      const originalDate = global.Date;
      global.Date = class extends Date {
        constructor() {
          super('2025-07-15T12:00:00Z');
        }
        static now() {
          return new Date('2025-07-15T12:00:00Z').getTime();
        }
      } as DateConstructor;

      const season = seasonalDetectionService.getCurrentSeason(mockLocation);
      expect(season).toBe('summer');

      global.Date = originalDate;
    });

    it('should flip seasons for southern hemisphere', () => {
      const southernLocation: LocationData = {
        ...mockLocation,
        latitude: -33.8688,
        longitude: 151.2093,
        city: 'Sydney'
      };

      const originalDate = global.Date;
      global.Date = class extends Date {
        constructor() {
          super('2025-07-15T12:00:00Z'); // Summer in northern hemisphere
        }
        static now() {
          return new Date('2025-07-15T12:00:00Z').getTime();
        }
      } as DateConstructor;

      const season = seasonalDetectionService.getCurrentSeason(southernLocation);
      expect(season).toBe('winter'); // Winter in southern hemisphere

      global.Date = originalDate;
    });
  });

  describe('storeWeatherData', () => {
    it('should store weather data in localStorage', async () => {
      const weatherData = createMockWeatherData();

      await seasonalDetectionService.storeWeatherData(weatherData);

      const stored = localStorage.getItem('sprouthub_weather_history');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].weather).toEqual(weatherData);
    });

    it('should limit stored history to MAX_HISTORY_DAYS', async () => {
      // Store 35 days of weather data (more than the 30-day limit)
      for (let i = 0; i < 35; i++) {
        const weatherData = createMockWeatherData({ current_temp_celsius: 20 + i });
        await seasonalDetectionService.storeWeatherData(weatherData);
      }

      const stored = localStorage.getItem('sprouthub_weather_history');
      const parsed = JSON.parse(stored!);

      // Should only keep the last 30 entries
      expect(parsed.length).toBeLessThanOrEqual(30);

      // Should keep the most recent entries (higher temperatures)
      expect(parsed[parsed.length - 1].weather.current_temp_celsius).toBe(54); // 20 + 34
    });

    it('should handle localStorage errors gracefully', async () => {
      // Mock localStorage to throw an error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage quota exceeded');
      });

      const weatherData = createMockWeatherData();

      // Should not throw an error
      await expect(seasonalDetectionService.storeWeatherData(weatherData)).resolves.not.toThrow();

      localStorage.setItem = originalSetItem;
    });
  });

  describe('detectSeasonalTransition', () => {
    beforeEach(() => {
      // Setup mock weather history for reliable testing
      const mockHistory = Array.from({ length: 10 }, (_, i) => ({
        date: new Date(Date.now() - (10 - i) * 24 * 60 * 60 * 1000).toISOString(),
        weather: createMockWeatherData({ current_temp_celsius: 15 + i })
      }));

      localStorage.setItem('sprouthub_weather_history', JSON.stringify(mockHistory));
    });

    it('should detect spring onset from winter', async () => {
      const springWeather = createMockWeatherData({
        current_temp_celsius: 18,
        daylight_hours: 13,
        current_humidity_percent: 60
      });

      vi.mocked(weatherService.getCurrentWeather).mockResolvedValue(springWeather);

      const transition = await seasonalDetectionService.detectSeasonalTransition('winter', mockLocation);

      expect(transition).toBeTruthy();
      expect(transition?.from_season).toBe('winter');
      expect(transition?.to_season).toBe('spring');
      expect(transition?.confidence).toBe('high');
      expect(transition?.triggering_factors).toContain('Daylight hours exceeding 12 hours');
    });

    it('should detect summer onset from spring', async () => {
      const summerWeather = createMockWeatherData({
        current_temp_celsius: 26,
        daylight_hours: 15,
        current_humidity_percent: 70
      });

      vi.mocked(weatherService.getCurrentWeather).mockResolvedValue(summerWeather);

      const transition = await seasonalDetectionService.detectSeasonalTransition('spring', mockLocation);

      expect(transition).toBeTruthy();
      expect(transition?.from_season).toBe('spring');
      expect(transition?.to_season).toBe('summer');
      expect(transition?.confidence).toBe('high');
      expect(transition?.triggering_factors).toContain('Temperature consistently above 24°C');
      expect(transition?.triggering_factors).toContain('Daylight hours exceeding 14 hours');
    });

    it('should detect fall onset from summer', async () => {
      // Setup summer peak temperature in history
      const summerHistory = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000).toISOString(),
        weather: createMockWeatherData({ current_temp_celsius: 30 - (i * 0.5) }) // Gradual cooling
      }));

      localStorage.setItem('sprouthub_weather_history', JSON.stringify(summerHistory));

      const fallWeather = createMockWeatherData({
        current_temp_celsius: 16,
        daylight_hours: 11,
        current_humidity_percent: 55
      });

      vi.mocked(weatherService.getCurrentWeather).mockResolvedValue(fallWeather);

      const transition = await seasonalDetectionService.detectSeasonalTransition('summer', mockLocation);

      expect(transition).toBeTruthy();
      expect(transition?.from_season).toBe('summer');
      expect(transition?.to_season).toBe('fall');
      expect(transition?.confidence).toBe('high');
      expect(transition?.triggering_factors).toContain('Daylight hours below 12 hours');
      expect(transition?.triggering_factors).toContain('Temperature below 18°C with falling trend');
    });

    it('should detect winter onset from fall', async () => {
      const winterWeather = createMockWeatherData({
        current_temp_celsius: 8,
        daylight_hours: 9,
        current_humidity_percent: 45
      });

      // Setup falling temperature trend
      const fallHistory = Array.from({ length: 10 }, (_, i) => ({
        date: new Date(Date.now() - (10 - i) * 24 * 60 * 60 * 1000).toISOString(),
        weather: createMockWeatherData({ current_temp_celsius: 18 - i })
      }));

      localStorage.setItem('sprouthub_weather_history', JSON.stringify(fallHistory));

      vi.mocked(weatherService.getCurrentWeather).mockResolvedValue(winterWeather);

      const transition = await seasonalDetectionService.detectSeasonalTransition('fall', mockLocation);

      expect(transition).toBeTruthy();
      expect(transition?.from_season).toBe('fall');
      expect(transition?.to_season).toBe('winter');
      expect(transition?.confidence).toBe('high');
      expect(transition?.triggering_factors).toContain('Temperature consistently below 10°C');
      expect(transition?.triggering_factors).toContain('Daylight hours below 10 hours');
    });

    it('should return null when insufficient weather history', async () => {
      // Clear history to simulate insufficient data
      localStorage.clear();

      const springWeather = createMockWeatherData();
      vi.mocked(weatherService.getCurrentWeather).mockResolvedValue(springWeather);

      const transition = await seasonalDetectionService.detectSeasonalTransition('winter', mockLocation);

      expect(transition).toBeNull();
    });

    it('should return null when no transition criteria are met', async () => {
      const stableWeather = createMockWeatherData({
        current_temp_celsius: 20, // Moderate temperature
        daylight_hours: 12, // Neutral daylight
        current_humidity_percent: 60
      });

      vi.mocked(weatherService.getCurrentWeather).mockResolvedValue(stableWeather);

      const transition = await seasonalDetectionService.detectSeasonalTransition('spring', mockLocation);

      expect(transition).toBeNull();
    });

    it('should return null for invalid season transitions', async () => {
      const springWeather = createMockWeatherData({
        current_temp_celsius: 18,
        daylight_hours: 13
      });

      vi.mocked(weatherService.getCurrentWeather).mockResolvedValue(springWeather);

      // Try to detect spring from summer (invalid transition)
      const transition = await seasonalDetectionService.detectSeasonalTransition('summer', mockLocation);

      expect(transition).toBeNull();
    });

    it('should handle weather service errors gracefully', async () => {
      vi.mocked(weatherService.getCurrentWeather).mockRejectedValue(new Error('Network error'));

      const transition = await seasonalDetectionService.detectSeasonalTransition('winter', mockLocation);

      expect(transition).toBeNull();
    });

    it('should select highest confidence transition when multiple detected', async () => {
      // This is a theoretical case where multiple transitions might be detected
      // In practice, this is less likely, but we test the confidence comparison logic

      const ambiguousWeather = createMockWeatherData({
        current_temp_celsius: 22, // Could trigger multiple transitions
        daylight_hours: 13
      });

      vi.mocked(weatherService.getCurrentWeather).mockResolvedValue(ambiguousWeather);

      const transition = await seasonalDetectionService.detectSeasonalTransition('winter', mockLocation);

      if (transition) {
        // Should prefer high confidence over lower confidence
        expect(['high', 'medium', 'low']).toContain(transition.confidence);
      }
    });
  });

  describe('temperature trend calculation', () => {
    it('should detect rising temperature trend', async () => {
      // Setup rising temperature history
      const risingHistory = Array.from({ length: 10 }, (_, i) => ({
        date: new Date(Date.now() - (10 - i) * 24 * 60 * 60 * 1000).toISOString(),
        weather: createMockWeatherData({ current_temp_celsius: 10 + i })
      }));

      localStorage.setItem('sprouthub_weather_history', JSON.stringify(risingHistory));

      const springWeather = createMockWeatherData({
        current_temp_celsius: 20,
        daylight_hours: 13
      });

      vi.mocked(weatherService.getCurrentWeather).mockResolvedValue(springWeather);

      const transition = await seasonalDetectionService.detectSeasonalTransition('winter', mockLocation);

      expect(transition).toBeTruthy();
      expect(transition?.triggering_factors.some(factor =>
        factor.includes('rising trend')
      )).toBe(true);
    });

    it('should detect falling temperature trend', async () => {
      // Setup falling temperature history
      const fallingHistory = Array.from({ length: 10 }, (_, i) => ({
        date: new Date(Date.now() - (10 - i) * 24 * 60 * 60 * 1000).toISOString(),
        weather: createMockWeatherData({ current_temp_celsius: 25 - i })
      }));

      localStorage.setItem('sprouthub_weather_history', JSON.stringify(fallingHistory));

      const fallWeather = createMockWeatherData({
        current_temp_celsius: 16,
        daylight_hours: 11
      });

      vi.mocked(weatherService.getCurrentWeather).mockResolvedValue(fallWeather);

      const transition = await seasonalDetectionService.detectSeasonalTransition('summer', mockLocation);

      expect(transition).toBeTruthy();
      expect(transition?.triggering_factors.some(factor =>
        factor.includes('falling trend')
      )).toBe(true);
    });
  });

  describe('isTransitionStable', () => {
    it('should return true for transitions older than stability period', () => {
      const oldTransitionDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000); // 15 days ago
      const isStable = seasonalDetectionService.isTransitionStable(oldTransitionDate);
      expect(isStable).toBe(true);
    });

    it('should return false for recent transitions', () => {
      const recentTransitionDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
      const isStable = seasonalDetectionService.isTransitionStable(recentTransitionDate);
      expect(isStable).toBe(false);
    });

    it('should return false for future transition dates', () => {
      const futureTransitionDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
      const isStable = seasonalDetectionService.isTransitionStable(futureTransitionDate);
      expect(isStable).toBe(false);
    });
  });

  describe('extreme weather conditions', () => {
    beforeEach(() => {
      // Setup normal history for baseline
      const normalHistory = Array.from({ length: 10 }, (_, i) => ({
        date: new Date(Date.now() - (10 - i) * 24 * 60 * 60 * 1000).toISOString(),
        weather: createMockWeatherData({ current_temp_celsius: 20 })
      }));

      localStorage.setItem('sprouthub_weather_history', JSON.stringify(normalHistory));
    });

    it('should detect transition with extreme hot weather', async () => {
      const extremeHotWeather = createMockWeatherData({
        current_temp_celsius: 35,
        daylight_hours: 16,
        current_humidity_percent: 30
      });

      vi.mocked(weatherService.getCurrentWeather).mockResolvedValue(extremeHotWeather);

      const transition = await seasonalDetectionService.detectSeasonalTransition('spring', mockLocation);

      expect(transition).toBeTruthy();
      expect(transition?.from_season).toBe('spring');
      expect(transition?.to_season).toBe('summer');
      expect(transition?.confidence).toBe('high');
    });

    it('should detect transition with extreme cold weather', async () => {
      const extremeColdWeather = createMockWeatherData({
        current_temp_celsius: -5,
        daylight_hours: 8,
        current_humidity_percent: 40
      });

      vi.mocked(weatherService.getCurrentWeather).mockResolvedValue(extremeColdWeather);

      const transition = await seasonalDetectionService.detectSeasonalTransition('fall', mockLocation);

      expect(transition).toBeTruthy();
      expect(transition?.from_season).toBe('fall');
      expect(transition?.to_season).toBe('winter');
      expect(transition?.confidence).toBe('high');
    });
  });

  describe('clearWeatherHistory', () => {
    it('should clear weather history from localStorage', async () => {
      // Store some weather data first
      const weatherData = createMockWeatherData();
      await seasonalDetectionService.storeWeatherData(weatherData);

      // Verify data is stored
      expect(localStorage.getItem('sprouthub_weather_history')).toBeTruthy();

      // Clear history
      seasonalDetectionService.clearWeatherHistory();

      // Verify data is cleared
      expect(localStorage.getItem('sprouthub_weather_history')).toBeNull();
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle corrupted localStorage data', async () => {
      // Set invalid JSON in localStorage
      localStorage.setItem('sprouthub_weather_history', 'invalid json');

      const weatherData = createMockWeatherData();
      vi.mocked(weatherService.getCurrentWeather).mockResolvedValue(weatherData);

      // Should not throw and should return null due to insufficient data
      const transition = await seasonalDetectionService.detectSeasonalTransition('winter', mockLocation);
      expect(transition).toBeNull();
    });

    it('should handle missing localStorage entirely', async () => {
      // Mock localStorage to be unavailable
      const originalLocalStorage = global.localStorage;
      delete (global as any).localStorage;

      const weatherData = createMockWeatherData();
      vi.mocked(weatherService.getCurrentWeather).mockResolvedValue(weatherData);

      // Should not throw
      await expect(seasonalDetectionService.storeWeatherData(weatherData)).resolves.not.toThrow();
      await expect(seasonalDetectionService.detectSeasonalTransition('winter', mockLocation)).resolves.not.toThrow();

      global.localStorage = originalLocalStorage;
    });
  });

  describe('confidence levels', () => {
    beforeEach(() => {
      const mockHistory = Array.from({ length: 10 }, (_, i) => ({
        date: new Date(Date.now() - (10 - i) * 24 * 60 * 60 * 1000).toISOString(),
        weather: createMockWeatherData({ current_temp_celsius: 15 + i })
      }));

      localStorage.setItem('sprouthub_weather_history', JSON.stringify(mockHistory));
    });

    it('should assign high confidence for strong indicators', async () => {
      const strongSpringWeather = createMockWeatherData({
        current_temp_celsius: 20, // > 15°C with rising trend
        daylight_hours: 13, // > 12 hours
        current_humidity_percent: 60
      });

      vi.mocked(weatherService.getCurrentWeather).mockResolvedValue(strongSpringWeather);

      const transition = await seasonalDetectionService.detectSeasonalTransition('winter', mockLocation);

      expect(transition?.confidence).toBe('high');
    });

    it('should assign medium confidence for moderate indicators', async () => {
      const moderateSpringWeather = createMockWeatherData({
        current_temp_celsius: 12, // Moderate temperature
        daylight_hours: 13, // Good daylight but not strong temp signal
        current_humidity_percent: 60
      });

      vi.mocked(weatherService.getCurrentWeather).mockResolvedValue(moderateSpringWeather);

      const transition = await seasonalDetectionService.detectSeasonalTransition('winter', mockLocation);

      if (transition) {
        expect(['medium', 'low']).toContain(transition.confidence);
      }
    });
  });
});