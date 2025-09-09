import { Page, expect } from '@playwright/test';

export class TestUtils {
  constructor(private page: Page) {}

  /**
   * Wait for the app to be fully loaded
   */
  async waitForAppLoad() {
    await this.page.waitForLoadState('networkidle');
    // Wait for the main app content to be visible
    try {
      await this.page.waitForSelector('body', { timeout: 5000 });
    } catch (error) {
      console.warn('App load timeout, continuing...');
    }
  }

  /**
   * Clear all browser storage
   */
  async clearStorage() {
    try {
      await this.page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
    } catch (error) {
      // If localStorage is not accessible (e.g., on about:blank), ignore the error
      console.warn('Could not clear storage:', error);
    }
  }

  /**
   * Mock geolocation API for testing
   */
  async mockGeolocation(latitude: number = 40.7128, longitude: number = -74.0060) {
    await this.page.addInitScript((lat, lon) => {
      navigator.geolocation = {
        getCurrentPosition: (success) => {
          success({
            coords: {
              latitude: lat,
              longitude: lon,
              accuracy: 20,
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null
            },
            timestamp: Date.now()
          });
        },
        watchPosition: () => 1,
        clearWatch: () => {},
        permission: 'granted'
      } as any;
    }, latitude, longitude);
  }

  /**
   * Mock weather API responses
   */
  async mockWeatherAPI(response: any) {
    await this.page.route('**/api.openweathermap.org/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response)
      });
    });
  }

  /**
   * Mock successful weather response
   */
  async mockSuccessfulWeatherResponse() {
    const mockWeatherData = {
      main: {
        temp: 22,
        humidity: 65
      },
      sys: {
        sunrise: 1640995200,
        sunset: 1641038400
      },
      weather: [{
        main: 'Clear',
        description: 'clear sky'
      }]
    };

    const mockForecastData = {
      list: [
        { pop: 0.1 },
        { pop: 0.2 },
        { pop: 0.05 },
        { pop: 0.0 },
        { pop: 0.3 },
        { pop: 0.1 },
        { pop: 0.0 },
        { pop: 0.15 }
      ]
    };

    await this.page.route('**/weather?**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockWeatherData)
      });
    });

    await this.page.route('**/forecast?**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockForecastData)
      });
    });
  }

  /**
   * Mock failed weather API response
   */
  async mockFailedWeatherResponse() {
    await this.page.route('**/api.openweathermap.org/**', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Service unavailable' })
      });
    });
  }

  /**
   * Take a screenshot with timestamp
   */
  async takeScreenshot(name: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await this.page.screenshot({ 
      path: `test-results/screenshots/${name}-${timestamp}.png`,
      fullPage: true 
    });
  }

  /**
   * Wait for toast notification to appear
   */
  async waitForToast(type: 'success' | 'error' | 'info' = 'success') {
    const toast = this.page.locator(`[data-testid="toast-${type}"]`);
    await expect(toast).toBeVisible({ timeout: 5000 });
    return toast;
  }

  /**
   * Wait for toast notification to disappear
   */
  async waitForToastToDisappear(type: 'success' | 'error' | 'info' = 'success') {
    const toast = this.page.locator(`[data-testid="toast-${type}"]`);
    await expect(toast).toBeHidden({ timeout: 10000 });
  }

  /**
   * Check if element is visible and enabled
   */
  async isElementReady(selector: string) {
    const element = this.page.locator(selector);
    await expect(element).toBeVisible();
    await expect(element).toBeEnabled();
    return element;
  }

  /**
   * Fill form field with validation
   */
  async fillFormField(selector: string, value: string) {
    const field = this.page.locator(selector);
    await field.clear();
    await field.fill(value);
    await field.blur(); // Trigger validation
  }

  /**
   * Wait for network requests to complete
   */
  async waitForNetworkIdle() {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Simulate user typing with realistic delays
   */
  async typeRealistic(selector: string, text: string, delay: number = 100) {
    const field = this.page.locator(selector);
    await field.click();
    
    for (const char of text) {
      await field.type(char);
      await this.page.waitForTimeout(delay);
    }
  }

  /**
   * Check for console errors
   */
  async checkForConsoleErrors() {
    const errors: string[] = [];
    
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    return errors;
  }

  /**
   * Wait for specific text to appear on page
   */
  async waitForText(text: string, timeout: number = 5000) {
    await expect(this.page.locator(`text=${text}`)).toBeVisible({ timeout });
  }

  /**
   * Wait for specific text to disappear from page
   */
  async waitForTextToDisappear(text: string, timeout: number = 5000) {
    await expect(this.page.locator(`text=${text}`)).toBeHidden({ timeout });
  }
}
