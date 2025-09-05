import { describe, it, expect } from 'vitest';
import { 
  celsiusToFahrenheit, 
  fahrenheitToCelsius, 
  formatTemperature, 
  getTemperatureIconThresholds 
} from '../temperature';

describe('temperature conversion utilities', () => {
  describe('celsiusToFahrenheit', () => {
    it('should convert freezing point correctly', () => {
      expect(celsiusToFahrenheit(0)).toBe(32);
    });

    it('should convert boiling point correctly', () => {
      expect(celsiusToFahrenheit(100)).toBe(212);
    });

    it('should convert room temperature correctly', () => {
      expect(celsiusToFahrenheit(20)).toBe(68);
      expect(celsiusToFahrenheit(25)).toBe(77);
    });

    it('should convert negative temperatures correctly', () => {
      expect(celsiusToFahrenheit(-10)).toBe(14);
    });

    it('should round to nearest integer', () => {
      expect(celsiusToFahrenheit(22.7)).toBe(73); // 72.86 rounded
    });
  });

  describe('fahrenheitToCelsius', () => {
    it('should convert freezing point correctly', () => {
      expect(fahrenheitToCelsius(32)).toBe(0);
    });

    it('should convert boiling point correctly', () => {
      expect(fahrenheitToCelsius(212)).toBe(100);
    });

    it('should convert room temperature correctly', () => {
      expect(fahrenheitToCelsius(68)).toBe(20);
      expect(fahrenheitToCelsius(77)).toBe(25);
    });

    it('should be inverse of celsiusToFahrenheit', () => {
      const celsius = 22;
      const fahrenheit = celsiusToFahrenheit(celsius);
      expect(fahrenheitToCelsius(fahrenheit)).toBe(celsius);
    });
  });

  describe('formatTemperature', () => {
    it('should format Fahrenheit by default', () => {
      expect(formatTemperature(20)).toBe('68°F');
      expect(formatTemperature(25)).toBe('77°F');
    });

    it('should format Celsius when specified', () => {
      expect(formatTemperature(20, 'C')).toBe('20°C');
      expect(formatTemperature(25, 'C')).toBe('25°C');
    });

    it('should handle negative temperatures', () => {
      expect(formatTemperature(-5)).toBe('23°F');
      expect(formatTemperature(-5, 'C')).toBe('-5°C');
    });
  });

  describe('getTemperatureIconThresholds', () => {
    it('should return Fahrenheit thresholds', () => {
      const thresholds = getTemperatureIconThresholds();
      expect(thresholds.cold).toBe(59); // 15°C
      expect(thresholds.hot).toBe(77);  // 25°C
    });
  });
});
