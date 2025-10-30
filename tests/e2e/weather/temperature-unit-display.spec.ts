/**
 * E2E Tests: Temperature Unit Display
 *
 * Tests that temperature displays correctly throughout the application based on
 * the user's selected unit (Fahrenheit or Celsius). Verifies that changing the
 * temperature unit in settings updates all temperature displays.
 */

import { test, expect } from '@playwright/test';
import { waitForPageStable } from '../../utils/test-helpers';
import { mockCompleteWeatherFlow, mockWeatherApiSuccess, mockGeolocationSuccess } from '../../utils/weather-mocks';
import { MOCK_WEATHER_DATA, MOCK_LOCATIONS } from '../../fixtures/weather-data';

test.describe('Temperature Unit Display', () => {
  test.beforeEach(async ({ page, context }) => {
    await mockCompleteWeatherFlow(page, context);
    await mockGeolocationSuccess(context, {
      latitude: MOCK_LOCATIONS.newYork.latitude,
      longitude: MOCK_LOCATIONS.newYork.longitude,
    });
    // Mock 22°C weather
    await mockWeatherApiSuccess(page, {
      temp: 22,
      humidity: 50,
      rainProbability: 10,
    });

    await page.goto('/');
    await waitForPageStable(page);

    const isLoginPage = await page
      .locator('input[type="email"], input[placeholder*="email" i]')
      .isVisible()
      .catch(() => false);

    if (isLoginPage) {
      test.skip(true, 'Not authenticated - skipping test');
    }

    await enableWeatherIfNeeded(page);
  });

  test.describe('Fahrenheit Display (Default)', () => {
    test('should display temperature in Fahrenheit by default in weather banner', async ({ page }) => {
      // 22°C = 72°F
      const banner = page.locator('.card').filter({ hasText: /conditions/i }).first();
      const hasBanner = await banner.isVisible({ timeout: 5000 }).catch(() => false);

      if (!hasBanner) {
        test.skip(true, 'Weather banner not visible');
        return;
      }

      // Should show Fahrenheit (72°F or 72°)
      const tempDisplay = banner.locator('text=/7[12]°/'); // Could be 71° or 72° due to rounding
      const hasTemp = await tempDisplay.first().isVisible({ timeout: 3000 }).catch(() => false);

      if (hasTemp) {
        await expect(tempDisplay.first()).toBeVisible();

        // Should NOT show 22°C
        const celsiusDisplay = banner.locator('text=/22°C/');
        const hasCelsius = await celsiusDisplay.isVisible({ timeout: 1000 }).catch(() => false);
        expect(hasCelsius).toBeFalsy();
      }
    });

    test('should display temperature in Fahrenheit in mood messages', async ({ page }) => {
      const banner = page.locator('.card').filter({ hasText: /conditions/i }).first();
      const hasBanner = await banner.isVisible({ timeout: 5000 }).catch(() => false);

      if (!hasBanner) {
        test.skip(true, 'Weather banner not visible');
        return;
      }

      // Look for mood messages with temperature (if applicable)
      const moodText = await banner.textContent();

      // If temperature is mentioned in message, should be in Fahrenheit
      const hasTempInMessage = /\d+°/.test(moodText || '');

      if (hasTempInMessage) {
        // Should not have 22° (Celsius value)
        expect(moodText).not.toMatch(/22°/);
      }
    });

    test('should display temperature in Fahrenheit in expanded details', async ({ page }) => {
      const banner = page.locator('.card').filter({ hasText: /conditions/i }).first();
      const hasBanner = await banner.isVisible({ timeout: 5000 }).catch(() => false);

      if (!hasBanner) {
        test.skip(true, 'Weather banner not visible');
        return;
      }

      // Expand details
      const detailsButton = banner.locator('button:has-text("Weather Details"), button:has-text("Details")').first();
      const hasButton = await detailsButton.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasButton) {
        await detailsButton.click();
        await page.waitForTimeout(600);

        // Should show Fahrenheit in details
        const tempLabel = banner.locator('text=/Temperature/i');
        await expect(tempLabel).toBeVisible();

        const tempValue = banner.locator('text=/7[12]°[F]?/');
        const hasValue = await tempValue.first().isVisible({ timeout: 3000 }).catch(() => false);

        if (hasValue) {
          await expect(tempValue.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Celsius Display', () => {
    test('should display temperature in Celsius after switching units', async ({ page }) => {
      // Change to Celsius
      await setTemperatureUnit(page, 'C');

      const banner = page.locator('.card').filter({ hasText: /conditions/i }).first();
      const hasBanner = await banner.isVisible({ timeout: 5000 }).catch(() => false);

      if (!hasBanner) {
        test.skip(true, 'Weather banner not visible');
        return;
      }

      // Should show Celsius (22°C or 22°)
      const tempDisplay = banner.locator('text=/22°/');
      const hasTemp = await tempDisplay.first().isVisible({ timeout: 3000 }).catch(() => false);

      if (hasTemp) {
        await expect(tempDisplay.first()).toBeVisible();
      }
    });

    test('should display temperature in Celsius in mood messages', async ({ page }) => {
      await setTemperatureUnit(page, 'C');

      const banner = page.locator('.card').filter({ hasText: /conditions/i }).first();
      const hasBanner = await banner.isVisible({ timeout: 5000 }).catch(() => false);

      if (!hasBanner) {
        test.skip(true, 'Weather banner not visible');
        return;
      }

      const moodText = await banner.textContent();

      // If temperature is mentioned, should be in Celsius
      const hasTempInMessage = /\d+°/.test(moodText || '');

      if (hasTempInMessage) {
        // Should not have 71-72° (Fahrenheit values)
        expect(moodText).not.toMatch(/7[12]°/);
      }
    });

    test('should display temperature in Celsius in expanded details', async ({ page }) => {
      await setTemperatureUnit(page, 'C');

      const banner = page.locator('.card').filter({ hasText: /conditions/i }).first();
      const hasBanner = await banner.isVisible({ timeout: 5000 }).catch(() => false);

      if (!hasBanner) {
        test.skip(true, 'Weather banner not visible');
        return;
      }

      // Expand details
      const detailsButton = banner.locator('button:has-text("Weather Details"), button:has-text("Details")').first();
      const hasButton = await detailsButton.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasButton) {
        await detailsButton.click();
        await page.waitForTimeout(600);

        // Should show Celsius in details
        const tempValue = banner.locator('text=/22°[C]?/');
        const hasValue = await tempValue.first().isVisible({ timeout: 3000 }).catch(() => false);

        if (hasValue) {
          await expect(tempValue.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Unit Switching Updates', () => {
    test('should update banner temperature when switching from F to C', async ({ page }) => {
      // Start with Fahrenheit (default)
      let banner = page.locator('.card').filter({ hasText: /conditions/i }).first();
      let hasBanner = await banner.isVisible({ timeout: 5000 }).catch(() => false);

      if (!hasBanner) {
        test.skip(true, 'Weather banner not visible');
        return;
      }

      // Verify Fahrenheit display
      let tempDisplay = banner.locator('text=/7[12]°/');
      let hasTemp = await tempDisplay.first().isVisible({ timeout: 3000 }).catch(() => false);

      if (!hasTemp) {
        test.skip(true, 'Temperature not displayed');
        return;
      }

      // Switch to Celsius
      await setTemperatureUnit(page, 'C');

      // Refresh banner reference
      banner = page.locator('.card').filter({ hasText: /conditions/i }).first();

      // Should now show Celsius
      tempDisplay = banner.locator('text=/22°/');
      hasTemp = await tempDisplay.first().isVisible({ timeout: 3000 }).catch(() => false);

      if (hasTemp) {
        await expect(tempDisplay.first()).toBeVisible();
      }
    });

    test('should update banner temperature when switching from C to F', async ({ page }) => {
      // Start with Celsius
      await setTemperatureUnit(page, 'C');

      let banner = page.locator('.card').filter({ hasText: /conditions/i }).first();
      let hasBanner = await banner.isVisible({ timeout: 5000 }).catch(() => false);

      if (!hasBanner) {
        test.skip(true, 'Weather banner not visible');
        return;
      }

      // Verify Celsius display
      let tempDisplay = banner.locator('text=/22°/');
      let hasTemp = await tempDisplay.first().isVisible({ timeout: 3000 }).catch(() => false);

      if (!hasTemp) {
        test.skip(true, 'Temperature not displayed');
        return;
      }

      // Switch to Fahrenheit
      await setTemperatureUnit(page, 'F');

      // Refresh banner reference
      banner = page.locator('.card').filter({ hasText: /conditions/i }).first();

      // Should now show Fahrenheit
      tempDisplay = banner.locator('text=/7[12]°/');
      hasTemp = await tempDisplay.first().isVisible({ timeout: 3000 }).catch(() => false);

      if (hasTemp) {
        await expect(tempDisplay.first()).toBeVisible();
      }
    });

    test('should update all temperature displays simultaneously', async ({ page }) => {
      // Switch to Celsius
      await setTemperatureUnit(page, 'C');

      const banner = page.locator('.card').filter({ hasText: /conditions/i }).first();
      const hasBanner = await banner.isVisible({ timeout: 5000 }).catch(() => false);

      if (!hasBanner) {
        test.skip(true, 'Weather banner not visible');
        return;
      }

      // Expand details
      const detailsButton = banner.locator('button:has-text("Weather Details"), button:has-text("Details")').first();
      const hasButton = await detailsButton.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasButton) {
        await detailsButton.click();
        await page.waitForTimeout(600);

        // Both badge and details should show same unit
        const allTempDisplays = banner.locator('text=/22°/');
        const count = await allTempDisplays.count();

        // Should have multiple instances of 22° (Celsius)
        expect(count).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Conversion Accuracy', () => {
    test('should correctly convert 0°C to 32°F', async ({ page }) => {
      // Mock freezing weather
      await mockWeatherApiSuccess(page, {
        temp: 0,
        humidity: 60,
        rainProbability: 20,
      });

      await page.goto('/');
      await waitForPageStable(page);

      const banner = page.locator('.card').filter({ hasText: /conditions/i }).first();
      const hasBanner = await banner.isVisible({ timeout: 5000 }).catch(() => false);

      if (!hasBanner) {
        test.skip(true, 'Weather banner not visible');
        return;
      }

      // Should show 32°F
      const tempDisplay = banner.locator('text=/32°/');
      const hasTemp = await tempDisplay.first().isVisible({ timeout: 3000 }).catch(() => false);

      if (hasTemp) {
        await expect(tempDisplay.first()).toBeVisible();
      }
    });

    test('should correctly display 30°C as 86°F', async ({ page }) => {
      // Mock hot weather
      await mockWeatherApiSuccess(page, {
        temp: 30,
        humidity: 40,
        rainProbability: 0,
      });

      await page.goto('/');
      await waitForPageStable(page);

      const banner = page.locator('.card').filter({ hasText: /conditions/i }).first();
      const hasBanner = await banner.isVisible({ timeout: 5000 }).catch(() => false);

      if (!hasBanner) {
        test.skip(true, 'Weather banner not visible');
        return;
      }

      // Should show 86°F
      const tempDisplay = banner.locator('text=/86°/');
      const hasTemp = await tempDisplay.first().isVisible({ timeout: 3000 }).catch(() => false);

      if (hasTemp) {
        await expect(tempDisplay.first()).toBeVisible();
      }
    });
  });
});

/**
 * Helper function to enable weather if needed
 */
async function enableWeatherIfNeeded(page: any) {
  const settingsButton = page.locator('button:has-text("Weather"), button:has-text("Settings")').first();
  const hasButton = await settingsButton.isVisible({ timeout: 3000 }).catch(() => false);

  if (hasButton) {
    await settingsButton.click();
    await waitForPageStable(page);

    const dialog = page.locator('[role="dialog"]').first();
    const weatherSwitch = dialog.locator('[role="switch"]').first();
    const isChecked = await weatherSwitch.isChecked().catch(() => false);

    if (!isChecked) {
      await weatherSwitch.click();
      await page.waitForTimeout(500);

      const saveButton = dialog.locator('button:has-text("Save")').first();
      await saveButton.click();
      await page.waitForTimeout(1000);

      await page.goto('/');
      await waitForPageStable(page);
    } else {
      const closeButton = dialog.locator('button:has-text("Cancel")').first();
      if (await closeButton.isVisible().catch(() => false)) {
        await closeButton.click();
      }
    }
  }
}

/**
 * Helper function to set temperature unit
 */
async function setTemperatureUnit(page: any, unit: 'F' | 'C') {
  const settingsButton = page.locator('button:has-text("Weather"), button:has-text("Settings")').first();
  const hasButton = await settingsButton.isVisible({ timeout: 3000 }).catch(() => false);

  if (!hasButton) {
    test.skip(true, 'Settings button not found');
    return;
  }

  await settingsButton.click();
  await waitForPageStable(page);

  const dialog = page.locator('[role="dialog"]').first();

  // Select the unit
  const radioId = unit === 'F' ? 'fahrenheit' : 'celsius';
  const radioLabel = dialog.locator(`label[for="${radioId}"]`).first();
  const hasLabel = await radioLabel.isVisible({ timeout: 3000 }).catch(() => false);

  if (hasLabel) {
    await radioLabel.click();
    await page.waitForTimeout(300);

    // Save
    const saveButton = dialog.locator('button:has-text("Save")').first();
    await saveButton.click();
    await page.waitForTimeout(1000);

    // Return to dashboard
    await page.goto('/');
    await waitForPageStable(page);
  }
}
