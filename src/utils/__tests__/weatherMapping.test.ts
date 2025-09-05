import { describe, it, expect } from 'vitest';
import {
  mapWeatherToFactors,
  getWeatherSummary,
  shouldDelayWateringForRain,
  getExtremeWeatherAdjustment,
  getDaylightAdjustment,
  createFallbackWeatherData,
} from '../weatherMapping';
import { WeatherData } from '@/services/weatherTypes';

describe('Weather Mapping Utilities', () => {
  const mockWeatherData: WeatherData = {
    current_temp_celsius: 22,
    current_humidity_percent: 50,
    season: 'spring',
    daylight_hours: 12,
    upcoming_rain_probability: 30,
  };

  describe('mapWeatherToFactors', () => {
    it('should map normal weather conditions correctly', () => {
      const result = mapWeatherToFactors(mockWeatherData);
      
      expect(result.factors.temperature).toBe('normal');
      expect(result.factors.humidity).toBe('normal');
      expect(result.factors.season).toBe('spring');
      expect(result.mappingReasons).toHaveLength(3);
    });

    it('should map cool temperature correctly', () => {
      const coldWeather: WeatherData = {
        ...mockWeatherData,
        current_temp_celsius: 15,
      };
      
      const result = mapWeatherToFactors(coldWeather);
      expect(result.factors.temperature).toBe('cool');
      expect(result.mappingReasons[0]).toContain('Cool temperature (59°F)');
    });

    it('should map warm temperature correctly', () => {
      const warmWeather: WeatherData = {
        ...mockWeatherData,
        current_temp_celsius: 28,
      };
      
      const result = mapWeatherToFactors(warmWeather);
      expect(result.factors.temperature).toBe('warm');
      expect(result.mappingReasons[0]).toContain('Warm temperature (82°F)');
    });

    it('should map dry humidity correctly', () => {
      const dryWeather: WeatherData = {
        ...mockWeatherData,
        current_humidity_percent: 30,
      };
      
      const result = mapWeatherToFactors(dryWeather);
      expect(result.factors.humidity).toBe('dry');
      expect(result.mappingReasons[1]).toContain('Low humidity (30%)');
    });

    it('should map humid conditions correctly', () => {
      const humidWeather: WeatherData = {
        ...mockWeatherData,
        current_humidity_percent: 75,
      };
      
      const result = mapWeatherToFactors(humidWeather);
      expect(result.factors.humidity).toBe('humid');
      expect(result.mappingReasons[1]).toContain('High humidity (75%)');
    });

    it('should use custom thresholds when provided', () => {
      const customOptions = {
        temperatureThresholds: { cool: 20, warm: 26 },
        humidityThresholds: { dry: 45, humid: 70 },
      };
      
      const result = mapWeatherToFactors(mockWeatherData, customOptions);
      expect(result.factors.temperature).toBe('normal'); // 22°C is between 20°C and 26°C, so normal
      expect(result.factors.humidity).toBe('normal'); // 50% is between 45% and 70%, so normal
    });
  });

  describe('getWeatherSummary', () => {
    it('should create basic weather summary', () => {
      const summary = getWeatherSummary(mockWeatherData);
      expect(summary).toBe('72°F, 50% humidity');
    });

    it('should include high rain probability', () => {
      const rainyWeather: WeatherData = {
        ...mockWeatherData,
        upcoming_rain_probability: 80,
      };
      
      const summary = getWeatherSummary(rainyWeather);
      expect(summary).toContain('high chance of rain (80%)');
    });

    it('should include possible rain probability', () => {
      const possibleRainWeather: WeatherData = {
        ...mockWeatherData,
        upcoming_rain_probability: 45,
      };
      
      const summary = getWeatherSummary(possibleRainWeather);
      expect(summary).toContain('possible rain (45%)');
    });
  });

  describe('shouldDelayWateringForRain', () => {
    it('should not delay for indoor plants', () => {
      const result = shouldDelayWateringForRain(mockWeatherData, false);
      expect(result.shouldDelay).toBe(false);
    });

    it('should not delay when rain probability is low', () => {
      const lowRainWeather: WeatherData = {
        ...mockWeatherData,
        upcoming_rain_probability: 20,
      };
      
      const result = shouldDelayWateringForRain(lowRainWeather, true);
      expect(result.shouldDelay).toBe(false);
    });

    it('should delay when rain probability is high for outdoor plants', () => {
      const highRainWeather: WeatherData = {
        ...mockWeatherData,
        upcoming_rain_probability: 70,
      };
      
      const result = shouldDelayWateringForRain(highRainWeather, true);
      expect(result.shouldDelay).toBe(true);
      expect(result.reason).toContain('Rain expected (70% chance)');
    });

    it('should use custom rain threshold', () => {
      const result = shouldDelayWateringForRain(mockWeatherData, true, 25);
      expect(result.shouldDelay).toBe(true); // 30% > 25%
    });
  });

  describe('getExtremeWeatherAdjustment', () => {
    it('should adjust for heat wave conditions', () => {
      const heatWaveWeather: WeatherData = {
        ...mockWeatherData,
        current_temp_celsius: 35,
      };
      
      const result = getExtremeWeatherAdjustment(heatWaveWeather);
      expect(result.adjustment).toBe(-1);
      expect(result.reason).toContain('Heat wave conditions (95°F)');
    });

    it('should adjust for cold conditions', () => {
      const coldWeather: WeatherData = {
        ...mockWeatherData,
        current_temp_celsius: 3,
      };
      
      const result = getExtremeWeatherAdjustment(coldWeather);
      expect(result.adjustment).toBe(2);
      expect(result.reason).toContain('Cold conditions (37°F)');
    });

    it('should adjust for extremely dry air', () => {
      const dryWeather: WeatherData = {
        ...mockWeatherData,
        current_humidity_percent: 15,
      };
      
      const result = getExtremeWeatherAdjustment(dryWeather);
      expect(result.adjustment).toBe(-1);
      expect(result.reason).toContain('Extremely dry air (15%)');
    });

    it('should adjust for extremely humid air', () => {
      const humidWeather: WeatherData = {
        ...mockWeatherData,
        current_humidity_percent: 95,
      };
      
      const result = getExtremeWeatherAdjustment(humidWeather);
      expect(result.adjustment).toBe(1);
      expect(result.reason).toContain('Very high humidity (95%)');
    });

    it('should return no adjustment for normal conditions', () => {
      const result = getExtremeWeatherAdjustment(mockWeatherData);
      expect(result.adjustment).toBe(0);
    });
  });

  describe('getDaylightAdjustment', () => {
    it('should adjust for short daylight hours', () => {
      const shortDayWeather: WeatherData = {
        ...mockWeatherData,
        daylight_hours: 8,
      };
      
      const result = getDaylightAdjustment(shortDayWeather);
      expect(result.adjustment).toBe(1);
      expect(result.reason).toContain('Short daylight hours (8h)');
    });

    it('should adjust for long daylight hours', () => {
      const longDayWeather: WeatherData = {
        ...mockWeatherData,
        daylight_hours: 16,
      };
      
      const result = getDaylightAdjustment(longDayWeather);
      expect(result.adjustment).toBe(-1);
      expect(result.reason).toContain('Long daylight hours (16h)');
    });

    it('should return no adjustment for normal daylight hours', () => {
      const result = getDaylightAdjustment(mockWeatherData);
      expect(result.adjustment).toBe(0);
    });
  });

  describe('createFallbackWeatherData', () => {
    it('should create fallback data for spring', () => {
      const fallback = createFallbackWeatherData('spring');
      
      expect(fallback.season).toBe('spring');
      expect(fallback.current_temp_celsius).toBe(20);
      expect(fallback.current_humidity_percent).toBe(50);
      expect(fallback.daylight_hours).toBe(12);
      expect(fallback.upcoming_rain_probability).toBe(20);
    });

    it('should create fallback data for winter', () => {
      const fallback = createFallbackWeatherData('winter');
      
      expect(fallback.season).toBe('winter');
      expect(fallback.current_temp_celsius).toBe(15);
      expect(fallback.current_humidity_percent).toBe(45);
      expect(fallback.daylight_hours).toBe(9);
    });

    it('should auto-detect season when not provided', () => {
      const fallback = createFallbackWeatherData();
      expect(['winter', 'spring', 'summer', 'fall']).toContain(fallback.season);
    });
  });
});
