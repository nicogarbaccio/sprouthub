import { Page, Route } from '@playwright/test';

/**
 * Mock seasonal transition API
 * Use this to test seasonal review features without real API calls
 * 
 * @example
 * await mockSeasonalTransition(page, {
 *   from_season: 'summer',
 *   to_season: 'fall',
 *   confidence: 0.85,
 *   trigger_factors: ['daylight_reduction', 'temperature_drop']
 * });
 */
export async function mockSeasonalTransition(page: Page, transition: any) {
  await page.route('**/api/seasonal/detect-transition', route => {
    route.fulfill({ 
      status: 200,
      contentType: 'application/json',
      json: transition 
    });
  });
}

/**
 * Mock weather data API
 * Use this to test weather-based features with predictable data
 * 
 * @example
 * await mockWeatherData(page, {
 *   temperature: 72,
 *   humidity: 65,
 *   conditions: 'sunny'
 * });
 */
export async function mockWeatherData(page: Page, weather: any) {
  await page.route('**/api/weather/**', route => {
    route.fulfill({ 
      status: 200,
      contentType: 'application/json',
      json: weather 
    });
  });
}

/**
 * Mock plant data API
 * Use this to test with specific plant configurations
 * 
 * @example
 * await mockPlantData(page, [
 *   { id: '1', name: 'Monstera', watering_schedule_days: 7 },
 *   { id: '2', name: 'Snake Plant', watering_schedule_days: 14 }
 * ]);
 */
export async function mockPlantData(page: Page, plants: any[]) {
  await page.route('**/api/plants', route => {
    route.fulfill({ 
      status: 200,
      contentType: 'application/json',
      json: plants 
    });
  });
  
  // Also mock individual plant endpoints
  plants.forEach(plant => {
    page.route(`**/api/plants/${plant.id}`, route => {
      route.fulfill({ 
        status: 200,
        contentType: 'application/json',
        json: plant 
      });
    });
  });
}

/**
 * Mock watering history API
 * Use this to test pattern detection and history features
 * 
 * @example
 * await mockWateringHistory(page, 'plant-123', {
 *   records: [
 *     { date: '2025-09-08', days_since_previous: 5 },
 *     { date: '2025-09-01', days_since_previous: 6 }
 *   ],
 *   pattern: { type: 'early', confidence: 0.85 }
 * });
 */
export async function mockWateringHistory(page: Page, plantId: string, history: any) {
  await page.route(`**/api/watering-history/${plantId}`, route => {
    route.fulfill({ 
      status: 200,
      contentType: 'application/json',
      json: history 
    });
  });
}

/**
 * Mock watering records API
 * Use this to test watering record management
 * 
 * @example
 * await mockWateringRecords(page, [
 *   { id: '1', plant_id: '123', watered_at: '2025-09-08T10:00:00Z' }
 * ]);
 */
export async function mockWateringRecords(page: Page, records: any[]) {
  await page.route('**/api/watering-records', route => {
    if (route.request().method() === 'GET') {
      route.fulfill({ 
        status: 200,
        contentType: 'application/json',
        json: records 
      });
    } else {
      route.continue();
    }
  });
}

/**
 * Mock slow API response (for testing loading states)
 * Use this to test loading spinners, skeleton states, etc.
 * 
 * @example
 * await mockSlowRoute(page, '**/api/plants', 2000, { json: plants });
 */
export async function mockSlowRoute(
  page: Page, 
  pattern: string, 
  delayMs: number, 
  response: any
) {
  await page.route(pattern, async route => {
    await new Promise(resolve => setTimeout(resolve, delayMs));
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      ...response
    });
  });
}

/**
 * Mock API error response
 * Use this to test error handling and recovery
 * 
 * @example
 * // Test 500 error
 * await mockErrorRoute(page, '**/api/plants', 500, 'Database connection failed');
 * 
 * // Test 404 error
 * await mockErrorRoute(page, '**/api/plants/123', 404, 'Plant not found');
 */
export async function mockErrorRoute(
  page: Page,
  pattern: string,
  statusCode: number = 500,
  message: string = 'Internal Server Error'
) {
  await page.route(pattern, route => {
    route.fulfill({
      status: statusCode,
      contentType: 'application/json',
      json: { error: message }
    });
  });
}

/**
 * Mock network failure
 * Use this to test offline scenarios or network errors
 * 
 * @example
 * await mockNetworkFailure(page, '**/api/plants');
 */
export async function mockNetworkFailure(page: Page, pattern: string) {
  await page.route(pattern, route => {
    route.abort('failed');
  });
}

/**
 * Mock successful DELETE operation
 * Use this to test deletion with simulated delay
 * 
 * @example
 * await mockDeleteSuccess(page, '**/api/watering-records/*', 500);
 */
export async function mockDeleteSuccess(page: Page, pattern: string, delayMs: number = 0) {
  await page.route(pattern, async route => {
    if (route.request().method() === 'DELETE') {
      if (delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
      route.fulfill({ 
        status: 200,
        contentType: 'application/json',
        json: { success: true }
      });
    } else {
      route.continue();
    }
  });
}

/**
 * Clear all route mocks
 * Use this in afterEach to clean up mocks between tests
 * 
 * @example
 * test.afterEach(async ({ page }) => {
 *   await clearRouteMocks(page);
 * });
 */
export async function clearRouteMocks(page: Page) {
  await page.unrouteAll({ behavior: 'ignoreErrors' });
}

/**
 * Mock multiple routes at once
 * Use this for complex test scenarios
 * 
 * @example
 * await mockRoutes(page, {
 *   '**/api/plants': { json: mockPlants },
 *   '**/api/weather/**': { json: mockWeather },
 *   '**/api/seasonal/**': { status: 500 }
 * });
 */
export async function mockRoutes(page: Page, routes: Record<string, any>) {
  for (const [pattern, response] of Object.entries(routes)) {
    await page.route(pattern, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        ...response
      });
    });
  }
}

