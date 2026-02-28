/**
 * Temperature conversion utilities
 */

/**
 * Convert Celsius to Fahrenheit
 * @param celsius Temperature in Celsius
 * @returns Temperature in Fahrenheit, rounded to nearest integer
 */
export function celsiusToFahrenheit(celsius: number): number {
  return Math.round((celsius * 9) / 5 + 32);
}

/**
 * Convert Fahrenheit to Celsius
 * @param fahrenheit Temperature in Fahrenheit
 * @returns Temperature in Celsius, rounded to nearest integer
 */
export function fahrenheitToCelsius(fahrenheit: number): number {
  return Math.round(((fahrenheit - 32) * 5) / 9);
}

/**
 * Format temperature for display with unit
 * @param celsius Temperature in Celsius
 * @param unit Unit to display ('F' for Fahrenheit, 'C' for Celsius)
 * @returns Formatted temperature string
 */
export function formatTemperature(celsius: number, unit: 'F' | 'C' = 'F'): string {
  if (unit === 'F') {
    return `${celsiusToFahrenheit(celsius)}°F`;
  }
  return `${celsius}°C`;
}

/**
 * Get temperature icon thresholds in Fahrenheit for consistency
 */
export function getTemperatureIconThresholds() {
  return {
    cold: 59,  // 15°C
    hot: 77,   // 25°C
  };
}
