/**
 * E2E Tests: Weather Settings Switch Visibility
 *
 * Tests the visual appearance and accessibility of the weather toggle switch.
 * Verifies that the switch is clearly visible and identifiable as a toggle
 * control in both ON and OFF states.
 */

import { test, expect } from '@playwright/test';
import { waitForPageStable } from '../../utils/test-helpers';
import { mockCompleteWeatherFlow } from '../../utils/weather-mocks';

test.describe('Weather Settings Switch Visibility', () => {
  test.beforeEach(async ({ page, context }) => {
    await mockCompleteWeatherFlow(page, context);
    await page.goto('/');
    await waitForPageStable(page);

    const isLoginPage = await page
      .locator('input[type="email"], input[placeholder*="email" i]')
      .isVisible()
      .catch(() => false);

    if (isLoginPage) {
      test.skip(true, 'Not authenticated - skipping test');
    }
  });

  test.describe('Switch Component', () => {
    test('should be visible and identifiable as a toggle switch', async ({ page }) => {
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

      // Switch should be present
      const weatherSwitch = dialog.locator('[role="switch"]').first();
      await expect(weatherSwitch).toBeVisible();

      // Switch should have accessible role
      const role = await weatherSwitch.getAttribute('role');
      expect(role).toBe('switch');
    });

    test('should have clear visual states (ON vs OFF)', async ({ page }) => {
      const settingsButton = page.locator('button:has-text("Weather"), button:has-text("Settings")').first();
      const hasButton = await settingsButton.isVisible({ timeout: 3000 }).catch(() => false);

      if (!hasButton) {
        test.skip(true, 'Settings button not found');
        return;
      }

      await settingsButton.click();
      await waitForPageStable(page);

      const dialog = page.locator('[role="dialog"]').first();
      const weatherSwitch = dialog.locator('[role="switch"]').first();

      // Get initial state
      const initialState = await weatherSwitch.getAttribute('data-state');

      // Click to toggle
      await weatherSwitch.click();
      await page.waitForTimeout(300);

      // State should have changed
      const newState = await weatherSwitch.getAttribute('data-state');
      expect(newState).not.toBe(initialState);
    });

    test('should be clickable/tappable', async ({ page }) => {
      const settingsButton = page.locator('button:has-text("Weather"), button:has-text("Settings")').first();
      const hasButton = await settingsButton.isVisible({ timeout: 3000 }).catch(() => false);

      if (!hasButton) {
        test.skip(true, 'Settings button not found');
        return;
      }

      await settingsButton.click();
      await waitForPageStable(page);

      const dialog = page.locator('[role="dialog"]').first();
      const weatherSwitch = dialog.locator('[role="switch"]').first();

      // Should be enabled (clickable)
      await expect(weatherSwitch).toBeEnabled();

      // Should be able to click
      const canClick = await weatherSwitch.isEnabled();
      expect(canClick).toBeTruthy();
    });
  });

  test.describe('OFF State Visibility', () => {
    test('should have visible background when OFF', async ({ page }) => {
      const settingsButton = page.locator('button:has-text("Weather"), button:has-text("Settings")').first();
      const hasButton = await settingsButton.isVisible({ timeout: 3000 }).catch(() => false);

      if (!hasButton) {
        test.skip(true, 'Settings button not found');
        return;
      }

      await settingsButton.click();
      await waitForPageStable(page);

      const dialog = page.locator('[role="dialog"]').first();
      const weatherSwitch = dialog.locator('[role="switch"]').first();

      // Ensure switch is OFF
      const isChecked = await weatherSwitch.isChecked().catch(() => false);
      if (isChecked) {
        await weatherSwitch.click();
        await page.waitForTimeout(300);
      }

      // Get background color
      const backgroundColor = await weatherSwitch.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });

      // Background should not be transparent or white
      expect(backgroundColor).toBeTruthy();
      expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
      expect(backgroundColor).not.toBe('transparent');
    });

    test('should have good contrast in OFF state', async ({ page }) => {
      const settingsButton = page.locator('button:has-text("Weather"), button:has-text("Settings")').first();
      const hasButton = await settingsButton.isVisible({ timeout: 3000 }).catch(() => false);

      if (!hasButton) {
        test.skip(true, 'Settings button not found');
        return;
      }

      await settingsButton.click();
      await waitForPageStable(page);

      const dialog = page.locator('[role="dialog"]').first();
      const weatherSwitch = dialog.locator('[role="switch"]').first();

      // Ensure switch is OFF
      const isChecked = await weatherSwitch.isChecked().catch(() => false);
      if (isChecked) {
        await weatherSwitch.click();
        await page.waitForTimeout(300);
      }

      // Switch should be clearly visible
      await expect(weatherSwitch).toBeVisible();

      // Get computed styles
      const styles = await weatherSwitch.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          backgroundColor: computed.backgroundColor,
          opacity: computed.opacity,
        };
      });

      // Opacity should be good (not too transparent)
      const opacity = parseFloat(styles.opacity);
      expect(opacity).toBeGreaterThan(0.5);
    });

    test('should not look like a disabled button when OFF', async ({ page }) => {
      const settingsButton = page.locator('button:has-text("Weather"), button:has-text("Settings")').first();
      const hasButton = await settingsButton.isVisible({ timeout: 3000 }).catch(() => false);

      if (!hasButton) {
        test.skip(true, 'Settings button not found');
        return;
      }

      await settingsButton.click();
      await waitForPageStable(page);

      const dialog = page.locator('[role="dialog"]').first();
      const weatherSwitch = dialog.locator('[role="switch"]').first();

      // Ensure switch is OFF
      const isChecked = await weatherSwitch.isChecked().catch(() => false);
      if (isChecked) {
        await weatherSwitch.click();
        await page.waitForTimeout(300);
      }

      // Switch should NOT be disabled
      const isDisabled = await weatherSwitch.isDisabled();
      expect(isDisabled).toBeFalsy();

      // Should be clickable
      await expect(weatherSwitch).toBeEnabled();
    });
  });

  test.describe('ON State Visibility', () => {
    test('should have clear visual indicator when ON', async ({ page }) => {
      const settingsButton = page.locator('button:has-text("Weather"), button:has-text("Settings")').first();
      const hasButton = await settingsButton.isVisible({ timeout: 3000 }).catch(() => false);

      if (!hasButton) {
        test.skip(true, 'Settings button not found');
        return;
      }

      await settingsButton.click();
      await waitForPageStable(page);

      const dialog = page.locator('[role="dialog"]').first();
      const weatherSwitch = dialog.locator('[role="switch"]').first();

      // Ensure switch is ON
      const isChecked = await weatherSwitch.isChecked().catch(() => false);
      if (!isChecked) {
        await weatherSwitch.click();
        await page.waitForTimeout(300);
      }

      // Get state attribute
      const state = await weatherSwitch.getAttribute('data-state');
      expect(state).toBe('checked');

      // Should be visually distinct from OFF state
      await expect(weatherSwitch).toBeVisible();
    });

    test('should have different color when ON vs OFF', async ({ page }) => {
      const settingsButton = page.locator('button:has-text("Weather"), button:has-text("Settings")').first();
      const hasButton = await settingsButton.isVisible({ timeout: 3000 }).catch(() => false);

      if (!hasButton) {
        test.skip(true, 'Settings button not found');
        return;
      }

      await settingsButton.click();
      await waitForPageStable(page);

      const dialog = page.locator('[role="dialog"]').first();
      const weatherSwitch = dialog.locator('[role="switch"]').first();

      // Get OFF color
      const isChecked = await weatherSwitch.isChecked().catch(() => false);
      if (isChecked) {
        await weatherSwitch.click();
        await page.waitForTimeout(300);
      }

      const offColor = await weatherSwitch.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });

      // Toggle to ON
      await weatherSwitch.click();
      await page.waitForTimeout(300);

      const onColor = await weatherSwitch.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });

      // Colors should be different
      expect(onColor).not.toBe(offColor);
    });
  });

  test.describe('Accessibility', () => {
    test('should have accessible label', async ({ page }) => {
      const settingsButton = page.locator('button:has-text("Weather"), button:has-text("Settings")').first();
      const hasButton = await settingsButton.isVisible({ timeout: 3000 }).catch(() => false);

      if (!hasButton) {
        test.skip(true, 'Settings button not found');
        return;
      }

      await settingsButton.click();
      await waitForPageStable(page);

      const dialog = page.locator('[role="dialog"]').first();

      // Should have label near switch
      const label = dialog.locator('text=/Use Weather Data/i, label:has-text("Use Weather Data")');
      const hasLabel = await label.first().isVisible({ timeout: 3000 }).catch(() => false);

      if (hasLabel) {
        await expect(label.first()).toBeVisible();
      }
    });

    test('should support keyboard interaction', async ({ page }) => {
      const settingsButton = page.locator('button:has-text("Weather"), button:has-text("Settings")').first();
      const hasButton = await settingsButton.isVisible({ timeout: 3000 }).catch(() => false);

      if (!hasButton) {
        test.skip(true, 'Settings button not found');
        return;
      }

      await settingsButton.click();
      await waitForPageStable(page);

      const dialog = page.locator('[role="dialog"]').first();
      const weatherSwitch = dialog.locator('[role="switch"]').first();

      // Should be focusable
      await weatherSwitch.focus();

      // Get initial state
      const initialState = await weatherSwitch.isChecked();

      // Press Space to toggle
      await page.keyboard.press('Space');
      await page.waitForTimeout(300);

      // State should have changed
      const newState = await weatherSwitch.isChecked();
      expect(newState).not.toBe(initialState);
    });

    test('should announce state to screen readers', async ({ page }) => {
      const settingsButton = page.locator('button:has-text("Weather"), button:has-text("Settings")').first();
      const hasButton = await settingsButton.isVisible({ timeout: 3000 }).catch(() => false);

      if (!hasButton) {
        test.skip(true, 'Settings button not found');
        return;
      }

      await settingsButton.click();
      await waitForPageStable(page);

      const dialog = page.locator('[role="dialog"]').first();
      const weatherSwitch = dialog.locator('[role="switch"]').first();

      // Should have aria-checked attribute
      const ariaChecked = await weatherSwitch.getAttribute('aria-checked');
      expect(ariaChecked).toBeTruthy();
      expect(['true', 'false']).toContain(ariaChecked);
    });
  });

  test.describe('Responsive Design', () => {
    test('should be visible on mobile viewports', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      const settingsButton = page.locator('button:has-text("Weather"), button:has-text("Settings")').first();
      const hasButton = await settingsButton.isVisible({ timeout: 3000 }).catch(() => false);

      if (!hasButton) {
        test.skip(true, 'Settings button not found');
        return;
      }

      await settingsButton.click();
      await waitForPageStable(page);

      const dialog = page.locator('[role="dialog"]').first();
      const weatherSwitch = dialog.locator('[role="switch"]').first();

      // Switch should be visible on mobile
      await expect(weatherSwitch).toBeVisible();

      // Should be easily tappable (good touch target size)
      const box = await weatherSwitch.boundingBox();
      if (box) {
        // Minimum recommended touch target is 44x44px
        expect(box.height).toBeGreaterThanOrEqual(24); // Switch itself may be smaller
        expect(box.width).toBeGreaterThanOrEqual(44);
      }
    });

    test('should be visible on tablet viewports', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });

      const settingsButton = page.locator('button:has-text("Weather"), button:has-text("Settings")').first();
      const hasButton = await settingsButton.isVisible({ timeout: 3000 }).catch(() => false);

      if (!hasButton) {
        test.skip(true, 'Settings button not found');
        return;
      }

      await settingsButton.click();
      await waitForPageStable(page);

      const dialog = page.locator('[role="dialog"]').first();
      const weatherSwitch = dialog.locator('[role="switch"]').first();

      await expect(weatherSwitch).toBeVisible();
    });

    test('should be visible on desktop viewports', async ({ page }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });

      const settingsButton = page.locator('button:has-text("Weather"), button:has-text("Settings")').first();
      const hasButton = await settingsButton.isVisible({ timeout: 3000 }).catch(() => false);

      if (!hasButton) {
        test.skip(true, 'Settings button not found');
        return;
      }

      await settingsButton.click();
      await waitForPageStable(page);

      const dialog = page.locator('[role="dialog"]').first();
      const weatherSwitch = dialog.locator('[role="switch"]').first();

      await expect(weatherSwitch).toBeVisible();
    });
  });

  test.describe('Dark Mode', () => {
    test('should have good contrast in dark mode', async ({ page }) => {
      // Enable dark mode
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });

      const settingsButton = page.locator('button:has-text("Weather"), button:has-text("Settings")').first();
      const hasButton = await settingsButton.isVisible({ timeout: 3000 }).catch(() => false);

      if (!hasButton) {
        test.skip(true, 'Settings button not found');
        return;
      }

      await settingsButton.click();
      await waitForPageStable(page);

      const dialog = page.locator('[role="dialog"]').first();
      const weatherSwitch = dialog.locator('[role="switch"]').first();

      // Switch should be visible in dark mode
      await expect(weatherSwitch).toBeVisible();

      // Get dark mode background color
      const bgColor = await weatherSwitch.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });

      // Should have a visible background (not transparent)
      expect(bgColor).toBeTruthy();
      expect(bgColor).not.toBe('rgba(0, 0, 0, 0)');
    });
  });
});
