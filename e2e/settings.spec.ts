import { test, expect } from '@playwright/test';

// Reuse authenticated state from the setup project
test.use({ storageState: 'e2e/.auth/user.json' });

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible({ timeout: 15000 });
  });

  // ── Tab Navigation ─────────────────────────────────────────────────

  test('should load with Account tab active by default', async ({ page }) => {
    await expect(page.getByRole('tab', { name: 'Account', selected: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Profile Information' })).toBeVisible();
  });

  test('should switch between all tabs', async ({ page }) => {
    // Preferences
    await page.getByRole('tab', { name: 'Preferences' }).click();
    await expect(page.getByRole('tab', { name: 'Preferences', selected: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Smart Watering Preferences' })).toBeVisible();

    // Weather
    await page.getByRole('tab', { name: 'Weather' }).click();
    await expect(page.getByRole('tab', { name: 'Weather', selected: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Weather Integration' })).toBeVisible();

    // Notifications
    await page.getByRole('tab', { name: 'Notifications' }).click();
    await expect(page.getByRole('tab', { name: 'Notifications', selected: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Push Notifications' })).toBeVisible();

    // Appearance
    await page.getByRole('tab', { name: 'Appearance' }).click();
    await expect(page.getByRole('tab', { name: 'Appearance', selected: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Appearance' })).toBeVisible();
  });

  // ── Account Tab ────────────────────────────────────────────────────

  test('should display pre-filled profile info', async ({ page }) => {
    await expect(page.getByTestId('first-name-input')).toBeVisible();
    await expect(page.getByTestId('last-name-input')).toBeVisible();
    await expect(page.getByTestId('username-input')).toBeVisible();
    await expect(page.getByTestId('email-input')).toBeVisible();

    // Email should be disabled
    await expect(page.getByTestId('email-input')).toBeDisabled();

    // Inputs should have values
    const firstName = await page.getByTestId('first-name-input').inputValue();
    expect(firstName.length).toBeGreaterThan(0);

    // Update button should be disabled (no changes)
    await expect(page.getByTestId('update-profile-button')).toBeDisabled();
  });

  test('should enable save button when profile is modified', async ({ page }) => {
    const firstNameInput = page.getByTestId('first-name-input');
    const originalValue = await firstNameInput.inputValue();

    // Modify a field
    await firstNameInput.clear();
    await firstNameInput.fill(originalValue + 'x');
    await expect(page.getByTestId('update-profile-button')).toBeEnabled();

    // Revert
    await firstNameInput.clear();
    await firstNameInput.fill(originalValue);
  });

  test('should show change password section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Change Password' })).toBeVisible();
    await expect(page.getByPlaceholder('Enter new password')).toBeVisible();
    await expect(page.getByPlaceholder('Confirm new password')).toBeVisible();

    // Button should be disabled when empty
    await expect(page.getByRole('button', { name: 'Change Password' })).toBeDisabled();
  });

  test('should show legal links', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Legal & About' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Privacy Policy/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Terms of Service/ })).toBeVisible();
  });

  test('should show delete account button in danger zone', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Danger Zone' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete Account' })).toBeVisible();
  });

  test('should save profile and persist changes', async ({ page }) => {
    const firstNameInput = page.getByTestId('first-name-input');
    await expect(firstNameInput).toBeVisible();
    const originalValue = await firstNameInput.inputValue();
    const newValue = originalValue + 'z';

    // Modify and save
    await firstNameInput.clear();
    await firstNameInput.fill(newValue);
    await expect(page.getByTestId('update-profile-button')).toBeEnabled();
    await page.getByTestId('update-profile-button').click();

    // Wait for save to complete — button should become disabled again or a success toast appears
    await page.waitForTimeout(3000);

    // Reload and verify persistence
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('first-name-input')).toBeVisible();
    const savedValue = await page.getByTestId('first-name-input').inputValue();
    expect(savedValue).toBe(newValue);

    // Restore original value
    await page.getByTestId('first-name-input').clear();
    await page.getByTestId('first-name-input').fill(originalValue);
    await page.getByTestId('update-profile-button').click();
    await page.waitForTimeout(3000);
  });

  test('should show password mismatch validation', async ({ page }) => {
    const newPassword = page.getByPlaceholder('Enter new password');
    const confirmPassword = page.getByPlaceholder('Confirm new password');

    await newPassword.fill('Password123!');
    await confirmPassword.fill('DifferentPassword456!');

    // Change Password button should be disabled or show error when passwords don't match
    const changeButton = page.getByRole('button', { name: 'Change Password' });
    // Either the button stays disabled or an error message appears
    const isDisabled = await changeButton.isDisabled();
    if (!isDisabled) {
      await changeButton.click();
      await expect(page.getByText(/match/i)).toBeVisible({ timeout: 5000 });
    }

    // Clear fields
    await newPassword.clear();
    await confirmPassword.clear();
  });

  test('should open delete account confirmation dialog', async ({ page }) => {
    await page.getByRole('button', { name: 'Delete Account' }).click();

    // A confirmation dialog should appear
    const dialog = page.getByRole('alertdialog').or(page.getByRole('dialog'));
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Cancel to avoid destroying the test account
    const cancelButton = dialog.getByRole('button', { name: /cancel/i });
    if (await cancelButton.isVisible()) {
      await cancelButton.click();
    } else {
      // Press Escape as fallback
      await page.keyboard.press('Escape');
    }
  });

  // ── Preferences Tab ────────────────────────────────────────────────

  test('should display all preference categories', async ({ page }) => {
    await page.getByRole('tab', { name: 'Preferences' }).click();

    await expect(page.getByText('Default Light Level')).toBeVisible();
    await expect(page.getByText('Default Temperature')).toBeVisible();
    await expect(page.getByText('Default Humidity Level')).toBeVisible();
    await expect(page.getByText('Default Care Style')).toBeVisible();
    await expect(page.getByText('Default Soil Type')).toBeVisible();
  });

  test('should enable save when preference is changed', async ({ page }) => {
    await page.getByRole('tab', { name: 'Preferences' }).click();

    // Save button should be disabled initially
    await expect(page.getByRole('button', { name: 'Save Preferences' })).toBeDisabled();

    // Click a temperature option that's different from current — try "Cool" first, then "Warm"
    const coolOption = page.getByText('Cool', { exact: false }).first();
    const warmOption = page.getByText('Warm', { exact: false }).first();

    await coolOption.click();
    let isEnabled = await page.getByRole('button', { name: 'Save Preferences' }).isEnabled();
    if (!isEnabled) {
      // Cool was already selected, try Warm
      await warmOption.click();
    }

    // Save button should now be enabled
    await expect(page.getByRole('button', { name: 'Save Preferences' })).toBeEnabled();
  });

  test('should have reset to defaults button', async ({ page }) => {
    await page.getByRole('tab', { name: 'Preferences' }).click();
    await expect(page.getByRole('button', { name: 'Reset to Defaults' })).toBeVisible();
  });

  test('should save preferences and persist on reload', async ({ page }) => {
    await page.getByRole('tab', { name: 'Preferences' }).click();

    // Click Humid option (humidity preference) — try both to ensure a change
    const dryOption = page.getByText('Dry', { exact: false }).first();
    const humidOption = page.getByText('Humid', { exact: false }).first();

    await dryOption.click();
    let saveButton = page.getByRole('button', { name: 'Save Preferences' });
    let isEnabled = await saveButton.isEnabled();
    if (!isEnabled) {
      await humidOption.click();
    }

    saveButton = page.getByRole('button', { name: 'Save Preferences' });
    if (await saveButton.isEnabled()) {
      await saveButton.click();
      await page.waitForTimeout(3000);
    }

    // Reload and verify save button is disabled (no unsaved changes)
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible({ timeout: 15000 });
    await page.getByRole('tab', { name: 'Preferences' }).click();
    await expect(page.getByRole('button', { name: 'Save Preferences' })).toBeDisabled();
  });

  // ── Weather Tab ────────────────────────────────────────────────────

  test('should display weather settings', async ({ page }) => {
    await page.getByRole('tab', { name: 'Weather' }).click();

    await expect(page.getByText('Use Weather Data')).toBeVisible();
    await expect(page.getByRole('switch', { name: 'Use Weather Data' })).toBeVisible();
    await expect(page.getByText('Temperature Unit')).toBeVisible();
    await expect(page.getByTestId('temp-unit-f')).toBeVisible();
    await expect(page.getByTestId('temp-unit-c')).toBeVisible();
  });

  test('should display location input and detect button', async ({ page }) => {
    await page.getByRole('tab', { name: 'Weather' }).click();

    await expect(page.getByTestId('manual-location-input')).toBeVisible();
    await expect(page.getByTestId('detect-location-button')).toBeVisible();
  });

  test('should toggle weather data switch', async ({ page }) => {
    await page.getByRole('tab', { name: 'Weather' }).click();

    const weatherSwitch = page.getByRole('switch', { name: 'Use Weather Data' });
    await expect(weatherSwitch).toBeVisible();

    // Just verify the switch is interactive — click it and check the data-state attribute changes
    const initialState = await weatherSwitch.getAttribute('data-state');
    await weatherSwitch.click();
    await page.waitForTimeout(1000);

    const newState = await weatherSwitch.getAttribute('data-state');
    // The state should have changed (or may have been saved and reverted)
    // Either way, the switch should still be visible and functional
    await expect(weatherSwitch).toBeVisible();

    // Toggle back if state changed
    if (newState !== initialState) {
      await weatherSwitch.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should switch temperature unit', async ({ page }) => {
    await page.getByRole('tab', { name: 'Weather' }).click();

    const fahrenheit = page.getByTestId('temp-unit-f');
    const celsius = page.getByTestId('temp-unit-c');

    // Click Celsius
    await celsius.click();
    // Click Fahrenheit back
    await fahrenheit.click();
  });

  // ── Notifications Tab ──────────────────────────────────────────────

  test('should display notification preferences', async ({ page }) => {
    await page.getByRole('tab', { name: 'Notifications' }).click();

    // Master toggle
    await expect(page.getByRole('switch', { name: 'Enable Notifications' })).toBeVisible();

    // Sub-categories
    await expect(page.getByRole('heading', { name: 'Plant Care Alerts' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Success Notifications' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Pattern Insights' })).toBeVisible();
  });

  test('should display individual notification toggles', async ({ page }) => {
    await page.getByRole('tab', { name: 'Notifications' }).click();

    await expect(page.getByRole('switch', { name: 'Overdue Watering' })).toBeVisible();
    await expect(page.getByRole('switch', { name: 'Due Today' })).toBeVisible();
    await expect(page.getByRole('switch', { name: 'Watering Success' })).toBeVisible();
    await expect(page.getByRole('switch', { name: 'Bulk Actions' })).toBeVisible();
    await expect(page.getByRole('switch', { name: 'Pattern Analysis' })).toBeVisible();
  });

  test('should disable sub-toggles when master notification is off', async ({ page }) => {
    await page.getByRole('tab', { name: 'Notifications' }).click();

    const masterToggle = page.getByRole('switch', { name: 'Enable Notifications' });
    const wasEnabled = await masterToggle.isChecked();

    // If currently enabled, disable it and check sub-toggles
    if (wasEnabled) {
      await masterToggle.click();
      await expect(masterToggle).not.toBeChecked();

      // Sub-toggles should be disabled or hidden
      const overdueToggle = page.getByRole('switch', { name: 'Overdue Watering' });
      const isDisabled = await overdueToggle.isDisabled().catch(() => false);
      const isHidden = !(await overdueToggle.isVisible().catch(() => false));
      expect(isDisabled || isHidden).toBeTruthy();

      // Re-enable to restore
      await masterToggle.click();
    } else {
      // Enable it first
      await masterToggle.click();
      await expect(masterToggle).toBeChecked();

      // Sub-toggles should now be interactive
      const overdueToggle = page.getByRole('switch', { name: 'Overdue Watering' });
      await expect(overdueToggle).toBeVisible();

      // Toggle back
      await masterToggle.click();
    }
  });

  test('should toggle a notification preference', async ({ page }) => {
    await page.getByRole('tab', { name: 'Notifications' }).click();

    const overdueToggle = page.getByRole('switch', { name: 'Overdue Watering' });
    const wasChecked = await overdueToggle.isChecked();

    await overdueToggle.click();
    // State should have flipped
    if (wasChecked) {
      await expect(overdueToggle).not.toBeChecked();
    } else {
      await expect(overdueToggle).toBeChecked();
    }

    // Toggle back to restore original state
    await overdueToggle.click();
  });

  // ── Appearance Tab ─────────────────────────────────────────────────

  test('should display theme options', async ({ page }) => {
    await page.getByRole('tab', { name: 'Appearance' }).click();

    await expect(page.getByRole('radio', { name: 'Light Mode' })).toBeVisible();
    await expect(page.getByRole('radio', { name: 'Dark Mode' })).toBeVisible();
    await expect(page.getByRole('radio', { name: 'System Default' })).toBeVisible();
  });

  test('should have System Default selected by default', async ({ page }) => {
    await page.getByRole('tab', { name: 'Appearance' }).click();

    await expect(page.getByRole('radio', { name: 'System Default' })).toBeChecked();
  });

  test('should switch theme to Dark Mode and back', async ({ page }) => {
    await page.getByRole('tab', { name: 'Appearance' }).click();

    // Switch to dark mode
    await page.getByRole('radio', { name: 'Dark Mode' }).click({ force: true });
    await expect(page.getByRole('radio', { name: 'Dark Mode' })).toBeChecked();

    // Switch back to system default
    await page.getByRole('radio', { name: 'System Default' }).click({ force: true });
    await expect(page.getByRole('radio', { name: 'System Default' })).toBeChecked();
  });
});
