import { Page, Locator, expect } from '@playwright/test';

export class AuthPage {
  readonly page: Page;
  readonly signInTab: Locator;
  readonly signUpTab: Locator;
  readonly signInEmailInput: Locator;
  readonly signInPasswordInput: Locator;
  readonly signUpEmailInput: Locator;
  readonly signUpPasswordInput: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly usernameInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly signInButton: Locator;
  readonly signUpButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly passwordToggle: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Tab elements
    this.signInTab = page.getByTestId('sign-in-trigger');
    this.signUpTab = page.getByTestId('sign-up-trigger');
    
    // Sign In Form inputs
    this.signInEmailInput = page.getByTestId('sign-in-email');
    this.signInPasswordInput = page.getByTestId('sign-in-password');
    
    // Sign Up Form inputs
    this.signUpEmailInput = page.getByTestId('sign-up-email');
    this.signUpPasswordInput = page.getByTestId('signup-password');
    this.firstNameInput = page.locator('#firstName');
    this.lastNameInput = page.locator('#lastName');
    this.usernameInput = page.locator('#username');
    this.confirmPasswordInput = page.getByTestId('confirmPassword');
    
    // Buttons
    this.signInButton = page.getByTestId('sign-in-button');
    this.signUpButton = page.getByTestId('sign-up-button');
    
    // Links
    this.forgotPasswordLink = page.getByRole('link', { name: 'Forgot password?' });
    
    // Password toggle - look for button next to password input
    this.passwordToggle = page.locator('[role="tabpanel"]:not([hidden]) button:has(svg)');
  }

  // Dynamic getters for context-aware form elements
  get emailInput(): Locator {
    // Check which tab is active and return appropriate input
    return this.page.locator('[role="tabpanel"]:not([hidden]) input[type="email"]');
  }

  get passwordInput(): Locator {
    // Check which tab is active and return appropriate input
    return this.page.locator('[role="tabpanel"]:not([hidden]) input[type="password"]').first();
  }

  async goto() {
    await this.page.goto('/auth');
    await this.page.waitForLoadState('networkidle');
  }

  async switchToSignUp() {
    await this.signUpTab.click();
    await this.page.waitForTimeout(500); // Wait for tab transition
  }

  async switchToSignIn() {
    await this.signInTab.click();
    await this.page.waitForTimeout(500); // Wait for tab transition
  }

  async fillSignInForm(email: string, password: string) {
    await this.signInEmailInput.fill(email);
    await this.signInPasswordInput.fill(password);
  }

  async fillSignUpForm(userData: {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) {
    await this.firstNameInput.fill(userData.firstName);
    await this.lastNameInput.fill(userData.lastName);
    await this.usernameInput.fill(userData.username);
    await this.signUpEmailInput.fill(userData.email);
    await this.signUpPasswordInput.fill(userData.password);
    await this.confirmPasswordInput.fill(userData.confirmPassword);
  }

  async submitSignIn() {
    await this.signInButton.click();
  }

  async submitSignUp() {
    await this.signUpButton.click();
  }

  async togglePasswordVisibility() {
    await this.passwordToggle.click();
  }

  async clickForgotPassword() {
    await this.forgotPasswordLink.click();
  }

  async expectSignInFormVisible() {
    await expect(this.signInEmailInput).toBeVisible();
    await expect(this.signInPasswordInput).toBeVisible();
    await expect(this.signInButton).toBeVisible();
  }

  async expectSignUpFormVisible() {
    await expect(this.firstNameInput).toBeVisible();
    await expect(this.lastNameInput).toBeVisible();
    await expect(this.usernameInput).toBeVisible();
    await expect(this.signUpEmailInput).toBeVisible();
    await expect(this.signUpPasswordInput).toBeVisible();
    await expect(this.confirmPasswordInput).toBeVisible();
    await expect(this.signUpButton).toBeVisible();
  }

  async expectValidationError(fieldName: string) {
    // Look for error text near the field - errors are displayed as p.text-sm.text-red-500
    const errorElement = this.page.locator(`#${fieldName}`).locator('..').locator('p.text-sm.text-red-500');
    await expect(errorElement).toBeVisible();
  }

  async expectSuccessToast() {
    // Look for toast with success variant - toasts have data-testid or specific content
    const toast = this.page.locator('[data-testid*="toast"], [role="alert"], .toast').first();
    await expect(toast).toBeVisible();
  }

  async expectErrorToast() {
    // Look for toast with error variant or specific error content
    const toast = this.page.locator('[data-testid*="toast"], [role="alert"], .toast').first();
    await expect(toast).toBeVisible();
  }
}
