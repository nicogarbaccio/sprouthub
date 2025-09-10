import { Page, Locator, expect } from '@playwright/test';
import { TIMEOUTS } from '../config/timeouts';
import { FeatureErrorHandler, FeatureAvailability, TestBehavior } from '../utils/feature-errors';

/**
 * Base page object class providing common functionality for all page objects
 * Reduces code duplication and ensures consistent behavior across tests
 */
export abstract class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ============================================================================
  // NAVIGATION METHODS
  // ============================================================================

  /**
   * Navigate to a specific URL with optimized waiting
   */
  async goto(url: string, options?: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' }) {
    await this.page.goto(url, {
      waitUntil: options?.waitUntil || 'domcontentloaded',
      timeout: TIMEOUTS.NAVIGATION
    });
  }

  /**
   * Wait for the page to be ready with common elements visible
   */
  async waitForPageReady(additionalSelectors?: string[]) {
    await this.waitForBasicPageStructure();
    await this.waitForNavigationIfPresent();
    await this.waitForAdditionalSelectors(additionalSelectors);
    await this.finalizePageReadyCheck();
  }

  /**
   * Wait for essential page structure (body element)
   */
  private async waitForBasicPageStructure() {
    await this.page.waitForSelector('body', { timeout: TIMEOUTS.ELEMENT_WAIT });
  }

  /**
   * Wait for navigation bar if it exists
   */
  private async waitForNavigationIfPresent() {
    try {
      await this.page.waitForSelector('nav', { timeout: TIMEOUTS.ELEMENT_WAIT });
    } catch {
      // Navigation not present, continue
    }
  }

  /**
   * Wait for any additional selectors provided by the page
   */
  private async waitForAdditionalSelectors(additionalSelectors?: string[]) {
    if (!additionalSelectors) return;

    for (const selector of additionalSelectors) {
      await this.waitForOptionalSelector(selector);
    }
  }

  /**
   * Wait for an optional selector without throwing if not found
   */
  private async waitForOptionalSelector(selector: string) {
    try {
      await this.page.waitForSelector(selector, { timeout: TIMEOUTS.ELEMENT_WAIT });
    } catch {
      // Continue if optional selector not found
    }
  }

  /**
   * Final wait to ensure async operations complete
   */
  private async finalizePageReadyCheck() {
    await this.page.waitForTimeout(TIMEOUTS.SHORT_WAIT);
  }

  // ============================================================================
  // ELEMENT INTERACTION METHODS
  // ============================================================================

  /**
   * Click element with timeout and optional waiting
   */
  async clickElement(locator: Locator, options?: { timeout?: number; waitAfter?: boolean }) {
    await locator.click({ timeout: options?.timeout || TIMEOUTS.CLICK });
    if (options?.waitAfter) {
      await this.page.waitForTimeout(TIMEOUTS.SHORT_WAIT);
    }
  }

  /**
   * Fill form field with timeout and optional validation wait
   */
  async fillField(locator: Locator, value: string, options?: { timeout?: number; waitAfter?: boolean }) {
    await locator.fill(value, { timeout: options?.timeout || TIMEOUTS.FORM_FILL });
    if (options?.waitAfter) {
      await this.page.waitForTimeout(TIMEOUTS.SHORT_WAIT);
    }
  }

  /**
   * Select option from dropdown
   */
  async selectOption(locator: Locator, value: string, options?: { timeout?: number }) {
    await locator.selectOption(value, { timeout: options?.timeout || TIMEOUTS.FORM_FILL });
    await this.page.waitForTimeout(TIMEOUTS.SHORT_WAIT);
  }

  /**
   * Upload file to input
   */
  async uploadFile(locator: Locator, filePath: string, options?: { timeout?: number }) {
    await locator.setInputFiles(filePath, { timeout: options?.timeout || TIMEOUTS.FORM_FILL });
  }

  // ============================================================================
  // DIALOG AND MODAL METHODS
  // ============================================================================

  /**
   * Wait for dialog to open
   */
  async waitForDialogOpen(locator: Locator, timeout?: number) {
    await locator.waitFor({ 
      state: 'visible', 
      timeout: timeout || TIMEOUTS.DIALOG_OPEN 
    });
  }

  /**
   * Wait for dialog to close
   */
  async waitForDialogClose(locator: Locator, timeout?: number) {
    await locator.waitFor({ 
      state: 'hidden', 
      timeout: timeout || TIMEOUTS.DIALOG_CLOSE 
    });
  }

  /**
   * Close dialog by clicking close button or escape key
   */
  async closeDialog(dialogLocator: Locator, method: 'button' | 'escape' = 'button') {
    if (method === 'escape') {
      await this.page.keyboard.press('Escape');
    } else {
      const closeButton = dialogLocator.getByRole('button', { name: /close|cancel/i });
      await this.clickElement(closeButton);
    }
    await this.waitForDialogClose(dialogLocator);
  }

  // ============================================================================
  // TOAST NOTIFICATION METHODS
  // ============================================================================

  /**
   * Wait for toast notification to appear
   */
  async waitForToast(type: 'success' | 'error' | 'info' = 'success'): Promise<Locator> {
    const toast = this.page.locator(`[data-testid="toast-${type}"], [data-testid*="toast"], [role="alert"], .toast`).first();
    await expect(toast).toBeVisible({ timeout: TIMEOUTS.TOAST_APPEAR });
    return toast;
  }

  /**
   * Wait for toast notification to disappear
   */
  async waitForToastToDisappear(type: 'success' | 'error' | 'info' = 'success') {
    const toast = this.page.locator(`[data-testid="toast-${type}"], [data-testid*="toast"], [role="alert"], .toast`).first();
    await expect(toast).toBeHidden({ timeout: TIMEOUTS.TOAST_DISAPPEAR });
  }

  /**
   * Expect success toast to appear and optionally disappear
   */
  async expectSuccessToast(waitForDisappear: boolean = false) {
    const toast = await this.waitForToast('success');
    if (waitForDisappear) {
      await this.waitForToastToDisappear('success');
    }
    return toast;
  }

  /**
   * Expect error toast to appear
   */
  async expectErrorToast() {
    return await this.waitForToast('error');
  }

  // ============================================================================
  // FORM HANDLING METHODS
  // ============================================================================

  /**
   * Fill multiple form fields at once
   */
  async fillForm(fields: Array<{ locator: Locator; value: string }>) {
    for (const field of fields) {
      await this.fillField(field.locator, field.value, { waitAfter: true });
    }
  }

  /**
   * Submit form and wait for response
   */
  async submitForm(submitButton: Locator, waitForToast: boolean = true) {
    await this.clickElement(submitButton);
    if (waitForToast) {
      // Wait for either success or error toast
      try {
        return await this.waitForToast('success');
      } catch {
        return await this.waitForToast('error');
      }
    }
  }

  // ============================================================================
  // VALIDATION AND ASSERTION METHODS
  // ============================================================================

  /**
   * Expect validation error for a specific field
   */
  async expectValidationError(fieldName: string, errorMessage?: string) {
    const errorElement = this.page.getByTestId(`${fieldName}-error`);
    await expect(errorElement).toBeVisible();
    if (errorMessage) {
      await expect(errorElement).toContainText(errorMessage);
    }
  }

  /**
   * Expect element to be visible with custom timeout
   */
  async expectVisible(locator: Locator, timeout?: number) {
    await expect(locator).toBeVisible({ timeout: timeout || TIMEOUTS.DEFAULT_WAIT });
  }

  /**
   * Expect element to be hidden with custom timeout
   */
  async expectHidden(locator: Locator, timeout?: number) {
    await expect(locator).toBeHidden({ timeout: timeout || TIMEOUTS.DEFAULT_WAIT });
  }

  /**
   * Expect element to contain specific text
   */
  async expectText(locator: Locator, text: string, timeout?: number) {
    await expect(locator).toContainText(text, { timeout: timeout || TIMEOUTS.DEFAULT_WAIT });
  }

  /**
   * Expect element to have specific value
   */
  async expectValue(locator: Locator, value: string, timeout?: number) {
    await expect(locator).toHaveValue(value, { timeout: timeout || TIMEOUTS.DEFAULT_WAIT });
  }

  // ============================================================================
  // NAVIGATION ASSERTION METHODS
  // ============================================================================

  /**
   * Expect to be redirected to auth page
   */
  async expectRedirectToAuth() {
    await this.page.waitForURL('**/auth**');
    expect(this.page.url()).toContain('/auth');
  }

  /**
   * Expect redirect with return URL parameter
   */
  async expectRedirectWithReturnUrl() {
    await this.page.waitForURL('**/auth**');
    const url = new URL(this.page.url());
    expect(url.searchParams.get('redirect')).toBeTruthy();
  }

  /**
   * Expect to be on specific path
   */
  async expectPath(path: string) {
    await expect(this.page).toHaveURL(new RegExp(`.*${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*`));
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Wait for loading to complete (network idle or specific element)
   */
  async waitForLoadComplete(options?: { 
    networkIdle?: boolean; 
    element?: string; 
    timeout?: number 
  }) {
    if (options?.networkIdle) {
      await this.page.waitForLoadState('networkidle', { 
        timeout: options.timeout || TIMEOUTS.NETWORK_IDLE 
      });
    }
    if (options?.element) {
      await this.page.waitForSelector(options.element, { 
        timeout: options.timeout || TIMEOUTS.ELEMENT_WAIT 
      });
    }
  }

  /**
   * Take screenshot with timestamp for debugging
   */
  async takeScreenshot(name: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await this.page.screenshot({ 
      path: `test-results/screenshots/${name}-${timestamp}.png`,
      fullPage: true 
    });
  }

  /**
   * Get element count
   */
  async getElementCount(locator: Locator): Promise<number> {
    return await locator.count();
  }

  /**
   * Check if element exists (without waiting)
   */
  async elementExists(selector: string): Promise<boolean> {
    return (await this.page.locator(selector).count()) > 0;
  }

  /**
   * Hover over element
   */
  async hoverElement(locator: Locator, waitAfter: boolean = true) {
    await locator.hover();
    if (waitAfter) {
      await this.page.waitForTimeout(TIMEOUTS.HOVER);
    }
  }

  /**
   * Scroll element into view
   */
  async scrollIntoView(locator: Locator) {
    await locator.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(TIMEOUTS.SHORT_WAIT);
  }

  // ============================================================================
  // ABSTRACT METHODS (to be implemented by subclasses)
  // ============================================================================

  // ============================================================================
  // FEATURE AVAILABILITY METHODS
  // ============================================================================

  /**
   * Check if a feature is available by looking for its UI elements
   */
  async isFeatureAvailable(selector: string, featureName: string): Promise<boolean> {
    return await FeatureErrorHandler.checkElementAvailability(
      this.page,
      selector,
      featureName,
      TestBehavior.SKIP_SILENTLY
    );
  }

  /**
   * Try to use a feature, gracefully handle if not available
   */
  async tryFeature(
    featureAction: () => Promise<void>,
    featureName: string,
    behavior: TestBehavior = TestBehavior.SKIP_SILENTLY
  ): Promise<boolean> {
    try {
      await featureAction();
      return true;
    } catch (error) {
      await FeatureErrorHandler.handleMissingFeature({
        featureName,
        availability: FeatureAvailability.NOT_IMPLEMENTED,
        behavior,
        message: `${featureName} failed: ${error.message}`
      });
      return false;
    }
  }

  /**
   * Execute feature with fallback behavior
   */
  async executeFeatureWithFallback(
    featureAction: () => Promise<void>,
    fallbackAction: () => Promise<void>,
    featureName: string
  ): Promise<void> {
    const success = await this.tryFeature(featureAction, featureName, TestBehavior.SKIP_SILENTLY);
    if (!success) {
      console.warn(`⚠️ ${featureName} not available, using fallback`);
      await fallbackAction();
    }
  }

  /**
   * Conditionally execute feature if elements exist
   */
  async executeIfAvailable(
    selector: string,
    action: () => Promise<void>,
    featureName: string
  ): Promise<boolean> {
    if (await this.isFeatureAvailable(selector, featureName)) {
      await action();
      return true;
    }
    return false;
  }

  /**
   * Handle missing feature with custom configuration
   */
  async handleMissingFeature(
    featureName: string,
    availability: FeatureAvailability = FeatureAvailability.NOT_IMPLEMENTED,
    behavior: TestBehavior = TestBehavior.SKIP_SILENTLY,
    customMessage?: string
  ): Promise<void> {
    await FeatureErrorHandler.handleMissingFeature({
      featureName,
      availability,
      behavior,
      message: customMessage
    });
  }

}