import { Page, BrowserContext } from '@playwright/test';

/**
 * Weather API mock utilities for Playwright tests
 *
 * These utilities help test weather features without calling real APIs,
 * avoiding rate limits and ensuring predictable test behavior.
 */

export interface MockWeatherResponse {
  main: {
    temp: number;
    humidity: number;
  };
  sys: {
    sunrise: number;
    sunset: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
  }>;
}

export interface MockForecastResponse {
  list: Array<{
    pop: number; // Probability of precipitation (0-1)
    main: {
      temp: number;
    };
  }>;
}

export interface MockGeocodingResponse {
  lat: number;
  lon: number;
  name: string;
  country: string;
}

/**
 * Mock successful weather API response
 *
 * @example
 * await mockWeatherApiSuccess(page, { temp: 25, humidity: 60, rainProbability: 30 });
 */
export async function mockWeatherApiSuccess(
  page: Page,
  options: {
    temp?: number;
    humidity?: number;
    rainProbability?: number;
    sunrise?: number;
    sunset?: number;
  } = {}
) {
  const {
    temp = 22,
    humidity = 55,
    rainProbability = 0,
    sunrise = Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
    sunset = Math.floor(Date.now() / 1000) + 36000, // 10 hours from now
  } = options;

  // Mock current weather endpoint
  await page.route('**/api.openweathermap.org/data/2.5/weather*', async (route) => {
    const response: MockWeatherResponse = {
      main: {
        temp,
        humidity,
      },
      sys: {
        sunrise,
        sunset,
      },
      weather: [
        {
          id: 800,
          main: 'Clear',
          description: 'clear sky',
        },
      ],
    };

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });

  // Mock forecast endpoint
  await page.route('**/api.openweathermap.org/data/2.5/forecast*', async (route) => {
    const forecastResponse: MockForecastResponse = {
      list: Array(8).fill(null).map(() => ({
        pop: rainProbability / 100,
        main: { temp },
      })),
    };

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(forecastResponse),
    });
  });
}

/**
 * Mock weather API failure
 *
 * @example
 * await mockWeatherApiFailure(page);
 */
export async function mockWeatherApiFailure(page: Page) {
  await page.route('**/api.openweathermap.org/**', (route) => {
    route.abort('failed');
  });
}

/**
 * Mock weather API with network error
 */
export async function mockWeatherApiNetworkError(page: Page) {
  await page.route('**/api.openweathermap.org/**', (route) => {
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Internal server error' }),
    });
  });
}

/**
 * Mock weather API with rate limit error
 */
export async function mockWeatherApiRateLimit(page: Page) {
  await page.route('**/api.openweathermap.org/**', (route) => {
    route.fulfill({
      status: 429,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'API rate limit exceeded' }),
    });
  });
}

/**
 * Mock geocoding API success (for city/ZIP lookup)
 *
 * @example
 * await mockGeocodingSuccess(page, { city: 'New York', lat: 40.7128, lon: -74.0060 });
 */
export async function mockGeocodingSuccess(
  page: Page,
  options: {
    city?: string;
    country?: string;
    lat?: number;
    lon?: number;
  } = {}
) {
  const {
    city = 'New York',
    country = 'US',
    lat = 40.7128,
    lon = -74.0060,
  } = options;

  // Mock direct geocoding (city name)
  await page.route('**/api.openweathermap.org/geo/1.0/direct*', async (route) => {
    const response: MockGeocodingResponse[] = [
      {
        name: city,
        country,
        lat,
        lon,
      },
    ];

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });

  // Mock ZIP code geocoding
  await page.route('**/api.openweathermap.org/geo/1.0/zip*', async (route) => {
    const response = {
      name: city,
      country,
      lat,
      lon,
    };

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

/**
 * Mock geocoding API failure (location not found)
 */
export async function mockGeocodingFailure(page: Page) {
  await page.route('**/api.openweathermap.org/geo/**', (route) => {
    route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify([]), // Empty array = not found
    });
  });
}

/**
 * Alias for mockGeocodingFailure for consistency with naming conventions
 */
export async function mockGeocodingApiFailure(page: Page) {
  return mockGeocodingFailure(page);
}

/**
 * Alias for mockGeocodingSuccess for consistency with naming conventions
 */
export async function mockGeocodingApiSuccess(
  page: Page,
  options: {
    city?: string;
    country?: string;
    lat?: number;
    lon?: number;
    latitude?: number;
    longitude?: number;
  } = {}
) {
  // Support both lat/lon and latitude/longitude naming
  const normalizedOptions = {
    city: options.city,
    country: options.country,
    lat: options.lat ?? options.latitude,
    lon: options.lon ?? options.longitude,
  };
  return mockGeocodingSuccess(page, normalizedOptions);
}

/**
 * Mock geolocation timeout error
 */
export async function mockGeolocationTimeout(context: BrowserContext) {
  // Clear permissions to simulate timeout/error
  await context.clearPermissions();
  // Note: Playwright doesn't have a direct way to simulate timeout,
  // so we use permission denial as a proxy
}

/**
 * Grant geolocation permission for browser location tests
 *
 * @example
 * await mockGeolocationSuccess(context, { latitude: 40.7128, longitude: -74.0060 });
 */
export async function mockGeolocationSuccess(
  context: BrowserContext,
  options: {
    latitude?: number;
    longitude?: number;
  } = {}
) {
  const { latitude = 40.7128, longitude = -74.0060 } = options;

  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude, longitude });
}

/**
 * Deny geolocation permission
 *
 * @example
 * await mockGeolocationDenied(context);
 */
export async function mockGeolocationDenied(context: BrowserContext) {
  await context.clearPermissions();
}

/**
 * Mock all weather APIs for a complete flow
 *
 * @example
 * await mockCompleteWeatherFlow(page, context);
 */
export async function mockCompleteWeatherFlow(
  page: Page,
  context: BrowserContext,
  options: {
    temp?: number;
    humidity?: number;
    rainProbability?: number;
    allowGeolocation?: boolean;
  } = {}
) {
  const { allowGeolocation = true, ...weatherOptions } = options;

  // Mock weather API
  await mockWeatherApiSuccess(page, weatherOptions);

  // Mock geocoding
  await mockGeocodingSuccess(page);

  // Mock geolocation
  if (allowGeolocation) {
    await mockGeolocationSuccess(context);
  } else {
    await mockGeolocationDenied(context);
  }
}
