/**
 * Unit tests for rain delay logic
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  calculateRainDelay,
  getRainDelayMessage,
  shouldShowRainDelayNotification,
  getBulkRainDelayStatus,
  getAdjustedWateringSchedule,
  type RainDelayResult,
  type RainDelayOptions
} from '../rainDelayLogic';
import type { WeatherData } from '@/services/weatherTypes';

// Mock the weatherMapping module
vi.mock('../weatherMapping', () => ({
  shouldDelayWateringForRain: vi.fn((weatherData, isOutdoorPlant, rainThreshold) => {
    if (!isOutdoorPlant) {
      return { shouldDelay: false };
    }
    if (weatherData.upcoming_rain_probability >= rainThreshold) {
      const precipType = weatherData.is_snowing ? 'Snow' : 'Rain';
      return {
        shouldDelay: true,
        reason: `${precipType} expected (${weatherData.upcoming_rain_probability}% chance) - outdoor watering can be delayed`,
      };
    }
    return { shouldDelay: false };
  })
}));

describe('rainDelayLogic', () => {
  const createMockWeather = (overrides: Partial<WeatherData> = {}): WeatherData => ({
    current_temp_celsius: 20,
    current_humidity_percent: 60,
    season: 'spring',
    daylight_hours: 12,
    upcoming_rain_probability: 70,
    is_snowing: false,
    weather_condition: 'Cloudy',
    ...overrides
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateRainDelay', () => {
    it('should return no delay when weather data is null', () => {
      const result = calculateRainDelay(null, { isOutdoorPlant: true });
      expect(result.shouldDelay).toBe(false);
    });

    it('should return no delay for indoor plants', () => {
      const weather = createMockWeather({ upcoming_rain_probability: 80 });
      const result = calculateRainDelay(weather, { isOutdoorPlant: false });
      expect(result.shouldDelay).toBe(false);
    });

    it('should return no delay when rain probability is below threshold', () => {
      const weather = createMockWeather({ upcoming_rain_probability: 50 });
      const result = calculateRainDelay(weather, { isOutdoorPlant: true, rainThreshold: 60 });
      expect(result.shouldDelay).toBe(false);
    });

    it('should delay for outdoor plants with high rain probability', () => {
      const weather = createMockWeather({ upcoming_rain_probability: 70 });
      const result = calculateRainDelay(weather, { isOutdoorPlant: true });

      expect(result.shouldDelay).toBe(true);
      expect(result.delayReason).toContain('Rain expected');
      expect(result.recommendedDelayDays).toBeDefined();
    });

    it('should recommend 1 day delay for 60-69% rain probability', () => {
      const weather = createMockWeather({ upcoming_rain_probability: 65 });
      const result = calculateRainDelay(weather, { isOutdoorPlant: true });

      expect(result.shouldDelay).toBe(true);
      expect(result.recommendedDelayDays).toBe(1);
    });

    it('should recommend 2 day delay for 70-79% rain probability', () => {
      const weather = createMockWeather({ upcoming_rain_probability: 75 });
      const result = calculateRainDelay(weather, { isOutdoorPlant: true });

      expect(result.shouldDelay).toBe(true);
      expect(result.recommendedDelayDays).toBe(2);
    });

    it('should recommend 3 day delay for 80%+ rain probability', () => {
      const weather = createMockWeather({ upcoming_rain_probability: 85 });
      const result = calculateRainDelay(weather, { isOutdoorPlant: true });

      expect(result.shouldDelay).toBe(true);
      expect(result.recommendedDelayDays).toBe(3);
    });

    it('should respect maxDelayDays option', () => {
      const weather = createMockWeather({ upcoming_rain_probability: 85 });
      const result = calculateRainDelay(weather, {
        isOutdoorPlant: true,
        maxDelayDays: 2
      });

      expect(result.shouldDelay).toBe(true);
      expect(result.recommendedDelayDays).toBe(2);
    });

    it('should use custom rain threshold', () => {
      const weather = createMockWeather({ upcoming_rain_probability: 50 });
      const result = calculateRainDelay(weather, {
        isOutdoorPlant: true,
        rainThreshold: 50
      });

      expect(result.shouldDelay).toBe(true);
    });

    it('should include nextCheckDate in result', () => {
      const weather = createMockWeather({ upcoming_rain_probability: 70 });
      const result = calculateRainDelay(weather, { isOutdoorPlant: true });

      expect(result.nextCheckDate).toBeInstanceOf(Date);
      expect(result.nextCheckDate!.getTime()).toBeGreaterThan(Date.now());
    });

    it('should calculate nextCheckDate based on delay days', () => {
      const weather = createMockWeather({ upcoming_rain_probability: 85 });
      const result = calculateRainDelay(weather, { isOutdoorPlant: true });

      const now = new Date();
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + 3);

      expect(result.nextCheckDate!.getDate()).toBe(expectedDate.getDate());
    });

    it('should handle snow delay reason', () => {
      const weather = createMockWeather({
        upcoming_rain_probability: 70,
        is_snowing: true
      });
      const result = calculateRainDelay(weather, { isOutdoorPlant: true });

      expect(result.shouldDelay).toBe(true);
      expect(result.delayReason).toContain('Snow expected');
    });

    it('should use default options when none provided', () => {
      const weather = createMockWeather({ upcoming_rain_probability: 70 });
      const result = calculateRainDelay(weather);

      // Default isOutdoorPlant is false, so no delay
      expect(result.shouldDelay).toBe(false);
    });
  });

  describe('getRainDelayMessage', () => {
    it('should return empty string when no delay', () => {
      const delayResult: RainDelayResult = { shouldDelay: false };
      const message = getRainDelayMessage(delayResult);

      expect(message).toBe('');
    });

    it('should return message with plant name', () => {
      const delayResult: RainDelayResult = {
        shouldDelay: true,
        recommendedDelayDays: 2,
        nextCheckDate: new Date('2024-06-15')
      };
      const message = getRainDelayMessage(delayResult, 'Monstera');

      expect(message).toContain('Monstera');
      expect(message).toContain('2 days');
      // Date formatting can vary by locale, just check it has a date
      expect(message).toMatch(/\d+\/\d+\/\d+/);
    });

    it('should use generic plant reference when no name provided', () => {
      const delayResult: RainDelayResult = {
        shouldDelay: true,
        recommendedDelayDays: 1,
        nextCheckDate: new Date('2024-06-15')
      };
      const message = getRainDelayMessage(delayResult);

      expect(message).toContain('your outdoor plant');
    });

    it('should use singular "day" for 1 day delay', () => {
      const delayResult: RainDelayResult = {
        shouldDelay: true,
        recommendedDelayDays: 1,
        nextCheckDate: new Date('2024-06-15')
      };
      const message = getRainDelayMessage(delayResult, 'Basil');

      expect(message).toContain('1 day');
      expect(message).not.toContain('1 days');
    });

    it('should use plural "days" for multiple days delay', () => {
      const delayResult: RainDelayResult = {
        shouldDelay: true,
        recommendedDelayDays: 3,
        nextCheckDate: new Date('2024-06-15')
      };
      const message = getRainDelayMessage(delayResult, 'Tomato');

      expect(message).toContain('3 days');
    });

    it('should include water drop emoji', () => {
      const delayResult: RainDelayResult = {
        shouldDelay: true,
        recommendedDelayDays: 2,
        nextCheckDate: new Date('2024-06-15')
      };
      const message = getRainDelayMessage(delayResult);

      expect(message).toContain('💧');
    });

    it('should handle missing nextCheckDate gracefully', () => {
      const delayResult: RainDelayResult = {
        shouldDelay: true,
        recommendedDelayDays: 2
      };
      const message = getRainDelayMessage(delayResult);

      expect(message).toContain('soon');
    });

    it('should default to 1 day when recommendedDelayDays is undefined', () => {
      const delayResult: RainDelayResult = {
        shouldDelay: true,
        nextCheckDate: new Date('2024-06-15')
      };
      const message = getRainDelayMessage(delayResult);

      expect(message).toContain('1 day');
    });
  });

  describe('shouldShowRainDelayNotification', () => {
    it('should return false for indoor plants', () => {
      const weather = createMockWeather({ upcoming_rain_probability: 80 });
      const show = shouldShowRainDelayNotification(weather, false, 7, 7);

      expect(show).toBe(false);
    });

    it('should return false when no weather data', () => {
      const show = shouldShowRainDelayNotification(null, true, 7, 7);

      expect(show).toBe(false);
    });

    it('should return false when plant is not due for watering', () => {
      const weather = createMockWeather({ upcoming_rain_probability: 80 });
      const show = shouldShowRainDelayNotification(weather, true, 3, 7);

      expect(show).toBe(false);
    });

    it('should return true when outdoor plant is due and rain expected', () => {
      const weather = createMockWeather({ upcoming_rain_probability: 70 });
      const show = shouldShowRainDelayNotification(weather, true, 7, 7);

      expect(show).toBe(true);
    });

    it('should show notification when plant is within 1 day of due', () => {
      const weather = createMockWeather({ upcoming_rain_probability: 70 });
      const show = shouldShowRainDelayNotification(weather, true, 6, 7);

      expect(show).toBe(true);
    });

    it('should not show notification when plant is 2+ days before due', () => {
      const weather = createMockWeather({ upcoming_rain_probability: 70 });
      const show = shouldShowRainDelayNotification(weather, true, 5, 7);

      expect(show).toBe(false);
    });

    it('should handle overdue plants', () => {
      const weather = createMockWeather({ upcoming_rain_probability: 70 });
      const show = shouldShowRainDelayNotification(weather, true, 10, 7);

      expect(show).toBe(true);
    });

    it('should return false when rain probability is low', () => {
      const weather = createMockWeather({ upcoming_rain_probability: 30 });
      const show = shouldShowRainDelayNotification(weather, true, 7, 7);

      expect(show).toBe(false);
    });
  });

  describe('getBulkRainDelayStatus', () => {
    const mockPlants = [
      {
        id: '1',
        nickname: 'Outdoor Rose',
        is_outdoor_plant: true,
        days_since_watering: 5,
        suggested_watering_days: 7
      },
      {
        id: '2',
        nickname: 'Indoor Fern',
        is_outdoor_plant: false,
        days_since_watering: 3,
        suggested_watering_days: 5
      },
      {
        id: '3',
        nickname: 'Outdoor Tomato',
        is_outdoor_plant: true,
        days_since_watering: 2,
        suggested_watering_days: 3
      }
    ];

    it('should return status for all plants', () => {
      const weather = createMockWeather({ upcoming_rain_probability: 70 });
      const statuses = getBulkRainDelayStatus(mockPlants, weather);

      expect(statuses).toHaveLength(3);
      expect(statuses[0].plantId).toBe('1');
      expect(statuses[1].plantId).toBe('2');
      expect(statuses[2].plantId).toBe('3');
    });

    it('should delay outdoor plants with rain expected', () => {
      const weather = createMockWeather({ upcoming_rain_probability: 75 });
      const statuses = getBulkRainDelayStatus(mockPlants, weather);

      expect(statuses[0].shouldDelay).toBe(true); // Outdoor Rose
      expect(statuses[1].shouldDelay).toBe(false); // Indoor Fern
      expect(statuses[2].shouldDelay).toBe(true); // Outdoor Tomato
    });

    it('should include delay messages for delayed plants', () => {
      const weather = createMockWeather({ upcoming_rain_probability: 70 });
      const statuses = getBulkRainDelayStatus(mockPlants, weather);

      const outdoorStatus = statuses.find(s => s.plantId === '1');
      expect(outdoorStatus?.message).toBeDefined();
      expect(outdoorStatus?.message).toContain('Outdoor Rose');
    });

    it('should not include messages for non-delayed plants', () => {
      const weather = createMockWeather({ upcoming_rain_probability: 70 });
      const statuses = getBulkRainDelayStatus(mockPlants, weather);

      const indoorStatus = statuses.find(s => s.plantId === '2');
      expect(indoorStatus?.message).toBeUndefined();
    });

    it('should handle plants without is_outdoor_plant field', () => {
      const plantsWithoutOutdoor = [
        { id: '1', nickname: 'Unknown Plant' }
      ];

      const weather = createMockWeather({ upcoming_rain_probability: 80 });
      const statuses = getBulkRainDelayStatus(plantsWithoutOutdoor, weather);

      expect(statuses[0].shouldDelay).toBe(false);
    });

    it('should handle null weather data', () => {
      const statuses = getBulkRainDelayStatus(mockPlants, null);

      expect(statuses.every(s => !s.shouldDelay)).toBe(true);
    });

    it('should return empty array for empty plant list', () => {
      const weather = createMockWeather();
      const statuses = getBulkRainDelayStatus([], weather);

      expect(statuses).toHaveLength(0);
    });
  });

  describe('getAdjustedWateringSchedule', () => {
    it('should not adjust schedule for indoor plants', () => {
      const weather = createMockWeather({ upcoming_rain_probability: 80 });
      const adjusted = getAdjustedWateringSchedule(7, weather, false);

      expect(adjusted.adjustedDays).toBe(7);
      expect(adjusted.hasRainAdjustment).toBe(false);
    });

    it('should not adjust when no weather data', () => {
      const adjusted = getAdjustedWateringSchedule(7, null, true);

      expect(adjusted.adjustedDays).toBe(7);
      expect(adjusted.hasRainAdjustment).toBe(false);
    });

    it('should add delay days to base schedule for outdoor plants', () => {
      const weather = createMockWeather({ upcoming_rain_probability: 75 });
      const adjusted = getAdjustedWateringSchedule(7, weather, true);

      expect(adjusted.adjustedDays).toBe(9); // 7 + 2 days delay
      expect(adjusted.hasRainAdjustment).toBe(true);
      expect(adjusted.rainAdjustmentReason).toBeDefined();
    });

    it('should not adjust when rain probability is low', () => {
      const weather = createMockWeather({ upcoming_rain_probability: 30 });
      const adjusted = getAdjustedWateringSchedule(7, weather, true);

      expect(adjusted.adjustedDays).toBe(7);
      expect(adjusted.hasRainAdjustment).toBe(false);
    });

    it('should include adjustment reason when delaying', () => {
      const weather = createMockWeather({ upcoming_rain_probability: 80 });
      const adjusted = getAdjustedWateringSchedule(5, weather, true);

      expect(adjusted.hasRainAdjustment).toBe(true);
      expect(adjusted.rainAdjustmentReason).toContain('Rain expected');
    });

    it('should add correct delay days based on rain probability', () => {
      const weather85 = createMockWeather({ upcoming_rain_probability: 85 });
      const adjusted85 = getAdjustedWateringSchedule(5, weather85, true);
      expect(adjusted85.adjustedDays).toBe(8); // 5 + 3 days

      const weather75 = createMockWeather({ upcoming_rain_probability: 75 });
      const adjusted75 = getAdjustedWateringSchedule(5, weather75, true);
      expect(adjusted75.adjustedDays).toBe(7); // 5 + 2 days

      const weather65 = createMockWeather({ upcoming_rain_probability: 65 });
      const adjusted65 = getAdjustedWateringSchedule(5, weather65, true);
      expect(adjusted65.adjustedDays).toBe(6); // 5 + 1 day
    });

    it('should default to indoor when isOutdoorPlant not specified', () => {
      const weather = createMockWeather({ upcoming_rain_probability: 80 });
      const adjusted = getAdjustedWateringSchedule(7, weather);

      expect(adjusted.adjustedDays).toBe(7);
      expect(adjusted.hasRainAdjustment).toBe(false);
    });
  });
});
