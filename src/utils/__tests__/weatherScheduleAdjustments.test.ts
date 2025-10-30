import { describe, it, expect } from 'vitest';
import {
  calculateWeatherScheduleAdjustments,
  applyWeatherAdjustments,
  getWeatherAdjustmentSummary,
} from '../weatherScheduleAdjustments';
import { WeatherData } from '@/services/weatherTypes';

describe('weatherScheduleAdjustments', () => {
  const createWeatherData = (overrides: Partial<WeatherData> = {}): WeatherData => ({
    current_temp_celsius: 20,
    current_humidity_percent: 50,
    season: 'spring',
    daylight_hours: 12,
    upcoming_rain_probability: 20,
    ...overrides,
  });

  describe('calculateWeatherScheduleAdjustments', () => {
    it('should return no adjustment for normal weather conditions', () => {
      const weather = createWeatherData();
      const result = calculateWeatherScheduleAdjustments(weather, 7);

      expect(result.adjustmentDays).toBe(0);
      expect(result.reasons).toHaveLength(0);
      expect(result.hasExtremeConditions).toBe(false);
    });

    it('should return null when weather data is not available', () => {
      const result = calculateWeatherScheduleAdjustments(null, 7);

      expect(result.adjustmentDays).toBe(0);
      expect(result.reasons).toHaveLength(0);
      expect(result.hasExtremeConditions).toBe(false);
    });

    it('should detect heat wave conditions (>30°C)', () => {
      const weather = createWeatherData({ current_temp_celsius: 32 });
      const result = calculateWeatherScheduleAdjustments(weather, 7);

      expect(result.adjustmentDays).toBe(-1);
      expect(result.hasExtremeConditions).toBe(true);
      expect(result.reasons.some(r => r.toLowerCase().includes('heat'))).toBe(true);
    });

    it('should detect cold snap conditions (<5°C)', () => {
      const weather = createWeatherData({ current_temp_celsius: 3 });
      const result = calculateWeatherScheduleAdjustments(weather, 7);

      expect(result.adjustmentDays).toBe(2);
      expect(result.hasExtremeConditions).toBe(true);
      expect(result.reasons.some(r => r.toLowerCase().includes('cold'))).toBe(true);
    });

    it('should detect extremely dry air (<20% humidity)', () => {
      const weather = createWeatherData({ current_humidity_percent: 15 });
      const result = calculateWeatherScheduleAdjustments(weather, 7);

      expect(result.adjustmentDays).toBe(-1);
      expect(result.hasExtremeConditions).toBe(true);
      expect(result.reasons.some(r => r.toLowerCase().includes('dry'))).toBe(true);
    });

    it('should detect extremely humid air (>90% humidity)', () => {
      const weather = createWeatherData({ current_humidity_percent: 95 });
      const result = calculateWeatherScheduleAdjustments(weather, 7);

      expect(result.adjustmentDays).toBe(1);
      expect(result.hasExtremeConditions).toBe(true);
      expect(result.reasons.some(r => r.toLowerCase().includes('humid'))).toBe(true);
    });

    it('should detect short daylight hours (<9h)', () => {
      const weather = createWeatherData({ daylight_hours: 8 });
      const result = calculateWeatherScheduleAdjustments(weather, 7);

      expect(result.adjustmentDays).toBe(1);
      expect(result.reasons.some(r => r.toLowerCase().includes('daylight'))).toBe(true);
    });

    it('should detect long daylight hours (>15h)', () => {
      const weather = createWeatherData({ daylight_hours: 16 });
      const result = calculateWeatherScheduleAdjustments(weather, 7);

      expect(result.adjustmentDays).toBe(-1);
      expect(result.reasons.some(r => r.toLowerCase().includes('daylight'))).toBe(true);
    });

    it('should combine multiple weather factors', () => {
      // Heat wave + long daylight hours
      const weather = createWeatherData({
        current_temp_celsius: 35,
        daylight_hours: 16,
      });
      const result = calculateWeatherScheduleAdjustments(weather, 7);

      // -1 for heat + -1 for long daylight = -2
      expect(result.adjustmentDays).toBe(-2);
      expect(result.reasons).toHaveLength(2);
      expect(result.hasExtremeConditions).toBe(true);
    });

    it('should handle offsetting weather factors', () => {
      // Cold snap + short daylight (both increase schedule)
      const weather = createWeatherData({
        current_temp_celsius: 2,
        daylight_hours: 7,
      });
      const result = calculateWeatherScheduleAdjustments(weather, 7);

      // +2 for cold + +1 for short daylight = +3
      expect(result.adjustmentDays).toBe(3);
      expect(result.reasons).toHaveLength(2);
    });
  });

  describe('applyWeatherAdjustments', () => {
    it('should apply adjustments to base schedule', () => {
      const weather = createWeatherData({ current_temp_celsius: 32 });
      const adjusted = applyWeatherAdjustments(7, weather);

      // Heat wave: -1 day
      expect(adjusted).toBe(6);
    });

    it('should respect minimum bounds', () => {
      const weather = createWeatherData({
        current_temp_celsius: 35, // -1
        current_humidity_percent: 15, // -1
        daylight_hours: 16, // -1
      });
      const adjusted = applyWeatherAdjustments(3, weather, 2, 45);

      // 3 - 3 = 0, but minimum is 2
      expect(adjusted).toBe(2);
    });

    it('should respect maximum bounds', () => {
      const weather = createWeatherData({
        current_temp_celsius: 2, // +2
        current_humidity_percent: 95, // +1
        daylight_hours: 7, // +1
      });
      const adjusted = applyWeatherAdjustments(42, weather, 2, 45);

      // 42 + 4 = 46, but maximum is 45
      expect(adjusted).toBe(45);
    });

    it('should handle null weather data gracefully', () => {
      const adjusted = applyWeatherAdjustments(7, null);

      expect(adjusted).toBe(7); // No change
    });

    it('should use custom min/max bounds', () => {
      const weather = createWeatherData({ current_temp_celsius: 35 });
      const adjusted = applyWeatherAdjustments(5, weather, 1, 10);

      // 5 - 1 = 4, within custom bounds
      expect(adjusted).toBe(4);
    });
  });

  describe('getWeatherAdjustmentSummary', () => {
    it('should return empty string when schedules are the same', () => {
      const weather = createWeatherData();
      const summary = getWeatherAdjustmentSummary(weather, 7, 7);

      expect(summary).toBe('');
    });

    it('should return empty string when weather data is null', () => {
      const summary = getWeatherAdjustmentSummary(null, 7, 5);

      expect(summary).toBe('');
    });

    it('should describe schedule extension (singular)', () => {
      const weather = createWeatherData({ current_temp_celsius: 2 });
      const summary = getWeatherAdjustmentSummary(weather, 7, 8);

      expect(summary).toContain('extended by 1 day');
      expect(summary).not.toContain('days');
    });

    it('should describe schedule extension (plural)', () => {
      const weather = createWeatherData({
        current_temp_celsius: 2,
        daylight_hours: 7,
      });
      const summary = getWeatherAdjustmentSummary(weather, 7, 10);

      expect(summary).toContain('extended by 3 days');
    });

    it('should describe schedule shortening (singular)', () => {
      const weather = createWeatherData({ current_temp_celsius: 32 });
      const summary = getWeatherAdjustmentSummary(weather, 7, 6);

      expect(summary).toContain('shortened by 1 day');
      expect(summary).not.toContain('days');
    });

    it('should describe schedule shortening (plural)', () => {
      const weather = createWeatherData({
        current_temp_celsius: 35,
        daylight_hours: 16,
      });
      const summary = getWeatherAdjustmentSummary(weather, 7, 5);

      expect(summary).toContain('shortened by 2 days');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle typical summer conditions', () => {
      const summerWeather = createWeatherData({
        current_temp_celsius: 28,
        current_humidity_percent: 45,
        season: 'summer',
        daylight_hours: 15.5,
      });

      const result = calculateWeatherScheduleAdjustments(summerWeather, 7);
      // Normal temp, normal humidity, but long daylight = -1
      expect(result.adjustmentDays).toBe(-1);
    });

    it('should handle typical winter conditions', () => {
      const winterWeather = createWeatherData({
        current_temp_celsius: 10,
        current_humidity_percent: 60,
        season: 'winter',
        daylight_hours: 8.5,
      });

      const result = calculateWeatherScheduleAdjustments(winterWeather, 7);
      // Normal temp, normal humidity, short daylight = +1
      expect(result.adjustmentDays).toBe(1);
    });

    it('should handle extreme desert conditions', () => {
      const desertWeather = createWeatherData({
        current_temp_celsius: 38,
        current_humidity_percent: 12,
        daylight_hours: 14,
      });

      const result = calculateWeatherScheduleAdjustments(desertWeather, 7);
      // Heat wave gets priority, returns -1 (getExtremeWeatherAdjustment returns early)
      expect(result.adjustmentDays).toBe(-1);
      expect(result.hasExtremeConditions).toBe(true);
    });

    it('should handle extreme cold and humid conditions', () => {
      const coldHumidWeather = createWeatherData({
        current_temp_celsius: 1,
        current_humidity_percent: 92,
        daylight_hours: 7,
      });

      const result = calculateWeatherScheduleAdjustments(coldHumidWeather, 7);
      // Cold snap gets priority (+2), then short daylight (+1) = +3
      // (getExtremeWeatherAdjustment returns early, so humid is not counted)
      expect(result.adjustmentDays).toBe(3);
      expect(result.hasExtremeConditions).toBe(true);
    });
  });
});
