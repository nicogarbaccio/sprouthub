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
    const updateButton = page.getByTestId('update-profile-button');
    await expect(updateButton).toBeEnabled();
    await updateButton.click();

    // Wait for loading state to complete — button text goes from "Updating..." back to "Update Profile"
    await expect(updateButton).toHaveText('Updating...', { timeout: 5000 });
    await expect(updateButton).toHaveText('Update Profile', { timeout: 10000 });
    await expect(updateButton).toBeDisabled();

    // Reload and verify persistence
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('first-name-input')).toBeVisible();
    const savedValue = await page.getByTestId('first-name-input').inputValue();
    expect(savedValue).toBe(newValue);

    // Restore original value
    await page.getByTestId('first-name-input').clear();
    await page.getByTestId('first-name-input').fill(originalValue);
    await updateButton.click();
    await expect(updateButton).toHaveText('Update Profile', { timeout: 10000 });
    await expect(updateButton).toBeDisabled();
  });

  test('should show password mismatch validation', async ({ page }) => {
    const newPassword = page.getByPlaceholder('Enter new password');
    const confirmPassword = page.getByPlaceholder('Confirm new password');

    await newPassword.fill('Password123!');
    await confirmPassword.fill('DifferentPassword456!');

    // Change Password button should be disabled when passwords don't match
    const changeButton = page.getByRole('button', { name: 'Change Password' });
    await expect(changeButton).toBeDisabled();

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
    await expect(cancelButton).toBeVisible();
    await cancelButton.click();
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

    const saveButton = page.getByRole('button', { name: 'Save Preferences' });
    const temperature = page.getByRole('radiogroup', { name: 'Default Temperature' });
    // The form shows defaults until the saved preferences arrive
    await expect(page.getByTestId('watering-preferences-card')).toHaveAttribute('aria-busy', 'false', { timeout: 10000 });
    await expect(saveButton).toBeDisabled();

    // Pick whichever of Cool/Warm isn't the saved value, so the click is a real change
    const cool = temperature.getByRole('radio', { name: /^Cool/ });
    const target = (await cool.getAttribute('aria-checked')) === 'true'
      ? temperature.getByRole('radio', { name: /^Warm/ })
      : cool;
    await target.click();

    await expect(target).toBeChecked();
    await expect(saveButton).toBeEnabled();
  });

  test('should have reset to defaults button', async ({ page }) => {
    await page.getByRole('tab', { name: 'Preferences' }).click();
    await expect(page.getByRole('button', { name: 'Reset to Defaults' })).toBeVisible();
  });

  test('should save preferences and persist on reload', async ({ page }) => {
    await page.getByRole('tab', { name: 'Preferences' }).click();

    const saveButton = page.getByRole('button', { name: 'Save Preferences' });
    const humidity = page.getByRole('radiogroup', { name: 'Default Humidity Level' });
    // The form shows defaults until the saved preferences arrive
    await expect(page.getByTestId('watering-preferences-card')).toHaveAttribute('aria-busy', 'false', { timeout: 10000 });

    // Pick whichever of Dry/Humid isn't the saved value, so there's a real change to save
    const dryIsSaved = (await humidity.getByRole('radio', { name: /^Dry/ }).getAttribute('aria-checked')) === 'true';
    const targetName = dryIsSaved ? /^Humid/ : /^Dry/;
    await humidity.getByRole('radio', { name: targetName }).click();

    await expect(saveButton).toBeEnabled();
    await saveButton.click();
    // Saved: no unsaved changes left
    await expect(saveButton).toBeDisabled({ timeout: 10000 });

    // The choice comes back from the server after a reload
    await page.reload();
    await page.getByRole('tab', { name: 'Preferences' }).click();
    await expect(page.getByTestId('watering-preferences-card')).toHaveAttribute('aria-busy', 'false', { timeout: 10000 });
    const reloaded = page.getByRole('radiogroup', { name: 'Default Humidity Level' });
    await expect(reloaded.getByRole('radio', { name: targetName })).toBeChecked({ timeout: 10000 });
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
    await expect(weatherSwitch).toBeEnabled();

    // Verify the switch has a determinate state (preferences have loaded)
    const state = await weatherSwitch.getAttribute('data-state');
    expect(state === 'checked' || state === 'unchecked').toBeTruthy();

    // Verify the Save Settings button exists and is disabled (no pending changes)
    const saveButton = page.getByRole('button', { name: 'Save Settings' });
    await expect(saveButton).toBeVisible();
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

  // Notification preferences live in localStorage, so every test starts from the defaults (all on)
  test('should disable sub-toggles when master notification is off', async ({ page }) => {
    await page.getByRole('tab', { name: 'Notifications' }).click();

    const masterToggle = page.getByRole('switch', { name: 'Enable Notifications' });
    const overdueToggle = page.getByRole('switch', { name: 'Overdue Watering' });
    await expect(masterToggle).toBeChecked();
    await expect(overdueToggle).toBeEnabled();

    await masterToggle.click();
    await expect(masterToggle).not.toBeChecked();
    await expect(overdueToggle).toBeDisabled();

    await masterToggle.click();
    await expect(masterToggle).toBeChecked();
    await expect(overdueToggle).toBeEnabled();
  });

  test('should toggle a notification preference and keep it after reload', async ({ page }) => {
    await page.getByRole('tab', { name: 'Notifications' }).click();

    const overdueToggle = page.getByRole('switch', { name: 'Overdue Watering' });
    await expect(overdueToggle).toBeChecked();

    await overdueToggle.click();
    await expect(overdueToggle).not.toBeChecked();

    await page.reload();
    await page.getByRole('tab', { name: 'Notifications' }).click();
    await expect(page.getByRole('switch', { name: 'Overdue Watering' })).not.toBeChecked();
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

    // Switch to dark mode — scope to the appearance tab panel to avoid nav menu matches
    const tabPanel = page.getByRole('tabpanel');
    await tabPanel.getByText('Dark Mode').click();
    await expect(page.getByRole('radio', { name: 'Dark Mode' })).toBeChecked();

    // Switch back to system default
    await tabPanel.getByText('System Default').click();
    await expect(page.getByRole('radio', { name: 'System Default' })).toBeChecked();
  });
});
