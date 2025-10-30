/**
 * Test fixtures for weather feature testing
 *
 * Provides consistent test data for weather conditions, locations, and scenarios
 */

import { WeatherData } from '../../src/services/weatherTypes';

/**
 * Mock weather data for different conditions
 */
export const MOCK_WEATHER_DATA = {
  /**
   * Perfect conditions - excellent mood
   * Temp: 22°C, Humidity: 50%, No rain
   */
  excellent: {
    temp: 22,
    humidity: 50,
    rainProbability: 10,
  },

  /**
   * Pleasant conditions - great mood
   * Temp: 24°C, Humidity: 55%, Low rain chance
   */
  great: {
    temp: 24,
    humidity: 55,
    rainProbability: 15,
  },

  /**
   * Good conditions - good mood
   * Temp: 20°C, Humidity: 60%, Some rain possible
   */
  good: {
    temp: 20,
    humidity: 60,
    rainProbability: 25,
  },

  /**
   * Moderate conditions - fair mood
   * Temp: 16°C, Humidity: 65%, Rain likely
   */
  fair: {
    temp: 16,
    humidity: 65,
    rainProbability: 45,
  },

  /**
   * Challenging conditions - hot and dry
   * Temp: 38°C, Humidity: 20%, No rain
   */
  challenging: {
    temp: 38,
    humidity: 20,
    rainProbability: 0,
  },

  /**
   * Cold conditions - challenging mood
   * Temp: 2°C, Humidity: 70%, Some rain
   */
  cold: {
    temp: 2,
    humidity: 70,
    rainProbability: 20,
  },

  /**
   * Rainy conditions - good mood (rain is good for plants!)
   * Temp: 18°C, Humidity: 75%, High rain chance
   */
  rainy: {
    temp: 18,
    humidity: 75,
    rainProbability: 85,
  },

  /**
   * Rain delay conditions - triggers outdoor plant delay
   * Temp: 20°C, Humidity: 80%, Rain threshold exceeded
   */
  rainDelay: {
    temp: 20,
    humidity: 80,
    rainProbability: 65, // > 30% triggers delay
  },
};

/**
 * Mock location data for testing
 */
export const MOCK_LOCATIONS = {
  newYork: {
    latitude: 40.7128,
    longitude: -74.0060,
    city: 'New York',
    country: 'US',
    zipCode: '10001',
  },

  sanFrancisco: {
    latitude: 37.7749,
    longitude: -122.4194,
    city: 'San Francisco',
    country: 'US',
    zipCode: '94102',
  },

  london: {
    latitude: 51.5074,
    longitude: -0.1278,
    city: 'London',
    country: 'GB',
    zipCode: 'SW1A 1AA',
  },

  tokyo: {
    latitude: 35.6762,
    longitude: 139.6503,
    city: 'Tokyo',
    country: 'JP',
    zipCode: '100-0001',
  },

  sydney: {
    latitude: -33.8688,
    longitude: 151.2093,
    city: 'Sydney',
    country: 'AU',
    zipCode: '2000',
  },
};

/**
 * Mock ZIP codes for testing
 */
export const MOCK_ZIP_CODES = {
  valid: {
    standard: '10001', // New York
    zipPlus4: '10001-1234',
    california: '94102', // San Francisco
  },
  invalid: {
    tooShort: '1234',
    tooLong: '123456',
    letters: 'ABCDE',
    mixed: 'ABC12',
    empty: '',
  },
};

/**
 * Mock city names for testing
 */
export const MOCK_CITY_NAMES = {
  valid: {
    simple: 'New York',
    withState: 'New York, NY',
    international: 'London, UK',
    complex: 'San Francisco, California',
  },
  invalid: {
    gibberish: 'asdfghjkl',
    numbers: '12345',
    empty: '',
    specialChars: '@#$%^&*',
  },
};

/**
 * Expected weather display values for testing
 */
export const EXPECTED_WEATHER_DISPLAY = {
  excellent: {
    temperature: '22°C',
    humidity: '50%',
    moodLabel: 'excellent conditions',
    moodBars: 5,
  },
  challenging: {
    temperature: '38°C',
    humidity: '20%',
    moodLabel: 'challenging conditions',
    moodBars: 1,
  },
  rainy: {
    temperature: '18°C',
    humidity: '75%',
    rainProbability: '85%',
    moodLabel: 'good conditions',
  },
};

/**
 * Error messages to test
 */
export const ERROR_MESSAGES = {
  locationNotFound: 'Failed to find location',
  permissionDenied: 'Location access denied by user',
  networkError: 'Network connection failed',
  apiError: 'Failed to fetch weather',
  invalidLocation: 'City not found',
  geocodingFailed: 'Failed to find location. Please try a different search.',
};

/**
 * Test scenarios combining weather + location
 */
export const TEST_SCENARIOS = {
  perfectDay: {
    weather: MOCK_WEATHER_DATA.excellent,
    location: MOCK_LOCATIONS.sanFrancisco,
    description: 'Perfect weather in San Francisco',
  },
  heatWave: {
    weather: MOCK_WEATHER_DATA.challenging,
    location: MOCK_LOCATIONS.sydney,
    description: 'Heat wave in Sydney',
  },
  rainyDay: {
    weather: MOCK_WEATHER_DATA.rainy,
    location: MOCK_LOCATIONS.london,
    description: 'Rainy day in London',
  },
  coldSnap: {
    weather: MOCK_WEATHER_DATA.cold,
    location: MOCK_LOCATIONS.newYork,
    description: 'Cold snap in New York',
  },
};

/**
 * Create full WeatherData object for unit tests
 */
export function createMockWeatherData(
  overrides: Partial<WeatherData> = {}
): WeatherData {
  return {
    current_temp_celsius: 22,
    current_humidity_percent: 55,
    season: 'spring',
    daylight_hours: 12,
    upcoming_rain_probability: 0,
    ...overrides,
  };
}
