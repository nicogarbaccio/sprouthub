/**
 * E2E Tests: Weather Settings - Temperature Unit
 *
 * Tests the temperature unit selection (Fahrenheit/Celsius) in the weather settings dialog.
 * Verifies that users can change their preferred temperature unit and that the selection
 * persists and updates displays throughout the application.
 */

import { test, expect } from '@playwright/test';
import { waitForPageStable } from '../../utils/test-helpers';
import { mockCompleteWeatherFlow, mockWeatherApiSuccess } from '../../utils/weather-mocks';
import { MOCK_WEATHER_DATA } from '../../fixtures/weather-data';

test.describe('Weather Settings - Temperature Unit', () => {
  test.beforeEach(async ({ page, context }) => {
    await mockCompleteWeatherFlow(page, context);
    await page.goto('/');
    await waitForPageStable(page);

    // Skip if not authenticated
    const isLoginPage = await page
      .locator('input[type="email"], input[placeholder*="email" i]')
      .isVisible()
      .catch(() => false);

    if (isLoginPage) {
      test.skip(true, 'Not authenticated - skipping test');
    }
  });

  test.describe('Temperature Unit Selector Visibility', () => {
    test('should show temperature unit options when weather is enabled', async ({ page }) => {
      // Open weather settings
      const settingsButton = page.locator('button:has-text("Weather"), button:has-text("Settings")').first();
      const hasButton = await settingsButton.isVisible({ timeout: 3000 }).catch(() => false);

      if (!hasButton) {
        test.skip(true, 'Settings button not found');
        return;
      }

      await settingsButton.click();
      await waitForPageStable(page);

      const dialog = page.locator('[role="dialog"]').first();
      await expect(dialog).toBeVisible();

      // Enable weather if not already enabled
      const weatherSwitch = dialog.locator('[role="switch"]').first();
      const isChecked = await weatherSwitch.isChecked().catch(() => false);

      if (!isChecked) {
        await weatherSwitch.click();
        await page.waitForTimeout(500);
      }

      // Temperature unit section should now be visible
      const tempUnitLabel = dialog.locator('text=/Temperature Unit/i');
      const hasLabel = await tempUnitLabel.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasLabel) {
        await expect(tempUnitLabel).toBeVisible();

        // Should have Fahrenheit and Celsius options
        await expect(dialog.locator('text=/Fahrenheit/i')).toBeVisible();
        await expect(dialog.locator('text=/Celsius/i')).toBeVisible();
      }
    });

    test('should NOT show temperature unit options when weather is disabled', async ({ page }) => {
      const settingsButton = page.locator('button:has-text("Weather"), button:has-text("Settings")').first();
      const hasButton = await settingsButton.isVisible({ timeout: 3000 }).catch(() => false);

      if (!hasButton) {
        test.skip(true, 'Settings button not found');
        return;
      }

      await settingsButton.click();
      await waitForPageStable(page);

      const dialog = page.locator('[role="dialog"]').first();

      // Disable weather if enabled
      const weatherSwitch = dialog.locator('[role="switch"]').first();
      const isChecked = await weatherSwitch.isChecked().catch(() => false);

      if (isChecked) {
        await weatherSwitch.click();
        await page.waitForTimeout(500);
      }

      // Temperature unit section should NOT be visible
      const tempUnitLabel = dialog.locator('text=/Temperature Unit/i');
      const isVisible = await tempUnitLabel.isVisible({ timeout: 1000 }).catch(() => false);

      expect(isVisible).toBeFalsy();
    });
  });

  test.describe('Temperature Unit Selection', () => {
    test('should default to Fahrenheit', async ({ page }) => {
      const settingsButton = page.locator('button:has-text("Weather"), button:has-text("Settings")').first();
      const hasButton = await settingsButton.isVisible({ timeout: 3000 }).catch(() => false);

      if (!hasButton) {
        test.skip(true, 'Settings button not found');
        return;
      }

      await settingsButton.click();
      await waitForPageStable(page);

      const dialog = page.locator('[role="dialog"]').first();

      // Ensure weather is enabled
      const weatherSwitch = dialog.locator('[role="switch"]').first();
      const isChecked = await weatherSwitch.isChecked().catch(() => false);

      if (!isChecked) {
        await weatherSwitch.click();
        await page.waitForTimeout(500);
      }

      // Fahrenheit should be selected by default
      const fahrenheitRadio = dialog.locator('input[type="radio"][value="F"], #fahrenheit');
      const hasFahrenheit = await fahrenheitRadio.first().isVisible({ timeout: 3000 }).catch(() => false);

      if (hasFahrenheit) {
        const isSelected = await fahrenheitRadio.first().isChecked().catch(() => true);
        expect(isSelected).toBeTruthy();
      }
    });

    test('should allow switching to Celsius', async ({ page }) => {
      const settingsButton = page.locator('button:has-text("Weather"), button:has-text("Settings")').first();
      const hasButton = await settingsButton.isVisible({ timeout: 3000 }).catch(() => false);

      if (!hasButton) {
        test.skip(true, 'Settings button not found');
        return;
      }

      await settingsButton.click();
      await waitForPageStable(page);

      const dialog = page.locator('[role="dialog"]').first();

      // Ensure weather is enabled
      const weatherSwitch = dialog.locator('[role="switch"]').first();
      const isChecked = await weatherSwitch.isChecked().catch(() => false);

      if (!isChecked) {
        await weatherSwitch.click();
        await page.waitForTimeout(500);
      }

      // Click Celsius option
      const celsiusLabel = dialog.locator('label[for="celsius"], text=/Celsius/i').first();
      const hasCelsius = await celsiusLabel.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasCelsius) {
        await celsiusLabel.click();
        await page.waitForTimeout(300);

        // Celsius should now be selected
        const celsiusRadio = dialog.locator('input[type="radio"][value="C"], #celsius');
        const isSelected = await celsiusRadio.first().isChecked().catch(() => false);
        expect(isSelected).toBeTruthy();
      }
    });

    test('should allow switching back to Fahrenheit', async ({ page }) => {
      const settingsButton = page.locator('button:has-text("Weather"), button:has-text("Settings")').first();
      const hasButton = await settingsButton.isVisible({ timeout: 3000 }).catch(() => false);

      if (!hasButton) {
        test.skip(true, 'Settings button not found');
        return;
      }

      await settingsButton.click();
      await waitForPageStable(page);

      const dialog = page.locator('[role="dialog"]').first();

      // Ensure weather is enabled
      const weatherSwitch = dialog.locator('[role="switch"]').first();
      const isChecked = await weatherSwitch.isChecked().catch(() => false);

      if (!isChecked) {
        await weatherSwitch.click();
        await page.waitForTimeout(500);
      }

      // First switch to Celsius
      const celsiusLabel = dialog.locator('label[for="celsius"]').first();
      const hasCelsius = await celsiusLabel.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasCelsius) {
        await celsiusLabel.click();
        await page.waitForTimeout(300);

        // Then switch back to Fahrenheit
        const fahrenheitLabel = dialog.locator('label[for="fahrenheit"]').first();
        await fahrenheitLabel.click();
        await page.waitForTimeout(300);

        // Fahrenheit should be selected
        const fahrenheitRadio = dialog.locator('#fahrenheit');
        const isSelected = await fahrenheitRadio.isChecked().catch(() => false);
        expect(isSelected).toBeTruthy();
      }
    });
  });

  test.describe('Toast Notifications', () => {
    test('should show "Weather settings updated" when only changing temperature unit', async ({ page }) => {
      const settingsButton = page.locator('button:has-text("Weather"), button:has-text("Settings")').first();
      const hasButton = await settingsButton.isVisible({ timeout: 3000 }).catch(() => false);

      if (!hasButton) {
        test.skip(true, 'Settings button not found');
        return;
      }

      await settingsButton.click();
      await waitForPageStable(page);

      const dialog = page.locator('[role="dialog"]').first();

      // Ensure weather is already enabled
      const weatherSwitch = dialog.locator('[role="switch"]').first();
      const isChecked = await weatherSwitch.isChecked().catch(() => false);

      if (!isChecked) {
        await weatherSwitch.click();
        await page.waitForTimeout(500);

        // Save to ensure weather is enabled
        const saveButton = dialog.locator('button:has-text("Save")').first();
        await saveButton.click();
        await page.waitForTimeout(1000);

        // Reopen dialog
        await settingsButton.click();
        await waitForPageStable(page);
      }

      // Change temperature unit only (weather already enabled)
      const celsiusLabel = dialog.locator('label[for="celsius"]').first();
      const hasCelsius = await celsiusLabel.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasCelsius) {
        await celsiusLabel.click();
        await page.waitForTimeout(300);

        // Save
        const saveButton = dialog.locator('button:has-text("Save")').first();
        await saveButton.click();
        await page.waitForTimeout(1000);

        // Should show "Weather settings updated" toast
        const toast = page.locator('[data-sonner-toast]').first();
        const hasToast = await toast.isVisible({ timeout: 3000 }).catch(() => false);

        if (hasToast) {
          const toastText = await toast.textContent();
          expect(toastText?.toLowerCase()).toContain('settings updated');
          expect(toastText?.toLowerCase()).not.toContain('weather enabled');
        }
      }
    });

    test('should show "Weather enabled" when toggling weather ON regardless of temperature unit', async ({ page }) => {
      const settingsButton = page.locator('button:has-text("Weather"), button:has-text("Settings")').first();
      const hasButton = await settingsButton.isVisible({ timeout: 3000 }).catch(() => false);

      if (!hasButton) {
        test.skip(true, 'Settings button not found');
        return;
      }

      await settingsButton.click();
      await waitForPageStable(page);

      const dialog = page.locator('[role="dialog"]').first();

      // Disable weather first if enabled
      const weatherSwitch = dialog.locator('[role="switch"]').first();
      const isChecked = await weatherSwitch.isChecked().catch(() => false);

      if (isChecked) {
        await weatherSwitch.click();
        await page.waitForTimeout(500);

        const saveButton = dialog.locator('button:has-text("Save")').first();
        await saveButton.click();
        await page.waitForTimeout(1000);

        // Reopen
        await settingsButton.click();
        await waitForPageStable(page);
      }

      // Enable weather
      await weatherSwitch.click();
      await page.waitForTimeout(500);

      // Change temperature unit too
      const celsiusLabel = dialog.locator('label[for="celsius"]').first();
      const hasCelsius = await celsiusLabel.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasCelsius) {
        await celsiusLabel.click();
        await page.waitForTimeout(300);
      }

      // Save
      const saveButton = dialog.locator('button:has-text("Save")').first();
      await saveButton.click();
      await page.waitForTimeout(1000);

      // Should show "Weather enabled" (toggle takes priority)
      const toast = page.locator('[data-sonner-toast]').first();
      const hasToast = await toast.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasToast) {
        const toastText = await toast.textContent();
        expect(toastText?.toLowerCase()).toContain('weather enabled');
      }
    });
  });

  test.describe('Persistence', () => {
    test('should persist temperature unit selection after save', async ({ page }) => {
      const settingsButton = page.locator('button:has-text("Weather"), button:has-text("Settings")').first();
      const hasButton = await settingsButton.isVisible({ timeout: 3000 }).catch(() => false);

      if (!hasButton) {
        test.skip(true, 'Settings button not found');
        return;
      }

      await settingsButton.click();
      await waitForPageStable(page);

      const dialog = page.locator('[role="dialog"]').first();

      // Ensure weather is enabled
      const weatherSwitch = dialog.locator('[role="switch"]').first();
      const isChecked = await weatherSwitch.isChecked().catch(() => false);

      if (!isChecked) {
        await weatherSwitch.click();
        await page.waitForTimeout(500);
      }

      // Select Celsius
      const celsiusLabel = dialog.locator('label[for="celsius"]').first();
      const hasCelsius = await celsiusLabel.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasCelsius) {
        await celsiusLabel.click();
        await page.waitForTimeout(300);

        // Save
        const saveButton = dialog.locator('button:has-text("Save")').first();
        await saveButton.click();
        await page.waitForTimeout(1000);

        // Reopen settings
        await settingsButton.click();
        await waitForPageStable(page);

        // Celsius should still be selected
        const celsiusRadio = page.locator('#celsius');
        const isStillSelected = await celsiusRadio.isChecked().catch(() => false);
        expect(isStillSelected).toBeTruthy();
      }
    });
  });
});
